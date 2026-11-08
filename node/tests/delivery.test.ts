import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../src/server.js';
import { MemoryRepositories } from '../src/db/repositories.js';

let app: FastifyInstance;
let repos: MemoryRepositories;

beforeEach(async () => {
  repos = new MemoryRepositories();
  app = await createApp(repos);
});

afterEach(async () => {
  await app.close();
});

async function seed(): Promise<{ zoneId: number; bannerId: number }> {
  const zone = await repos.createZone({ name: 'Header', width: 728, height: 90 });
  const campaign = await repos.createCampaign({
    advertiserId: 1,
    name: 'Winter',
    active: true,
    startDate: null,
    endDate: null,
    weight: 1,
  });
  const banner = await repos.createBanner({
    campaignId: campaign.id,
    name: 'Leaderboard',
    active: true,
    weight: 1,
    width: 728,
    height: 90,
    imageUrl: 'https://example.com/ad.png',
    clickUrl: 'https://advertiser.example.com/landing',
    htmlBody: null,
  });
  await repos.linkBannerToZone(zone.id, banner.id);
  return { zoneId: zone.id, bannerId: banner.id };
}

describe('delivery engine', () => {
  it('serves the linked banner for a zone', async () => {
    const { zoneId, bannerId } = await seed();
    const res = await app.inject({ method: 'GET', url: `/delivery/zone/${zoneId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.zone.id).toBe(zoneId);
    expect(body.banner.id).toBe(bannerId);
    expect(body.banner.impressionUrl).toBe(`/delivery/impression/${bannerId}?zone=${zoneId}`);
    expect(body.banner.clickUrl).toBe('https://advertiser.example.com/landing');
  });

  it('returns banner null when the zone has no eligible banners', async () => {
    const zone = await repos.createZone({ name: 'Empty', width: 300, height: 250 });
    const res = await app.inject({ method: 'GET', url: `/delivery/zone/${zone.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().banner).toBeNull();
  });

  it('returns 404 for an unknown zone', async () => {
    const res = await app.inject({ method: 'GET', url: '/delivery/zone/999' });
    expect(res.statusCode).toBe(404);
  });

  it('records impressions and clicks in hourly stats', async () => {
    const { zoneId, bannerId } = await seed();
    const imp = await app.inject({
      method: 'GET',
      url: `/delivery/impression/${bannerId}?zone=${zoneId}`,
    });
    expect(imp.statusCode).toBe(204);
    const imp2 = await app.inject({
      method: 'GET',
      url: `/delivery/impression/${bannerId}?zone=${zoneId}`,
    });
    expect(imp2.statusCode).toBe(204);

    const res = await app.inject({
      method: 'GET',
      url: `/admin/banners/${bannerId}/stats`,
    });
    const stats = res.json();
    expect(stats).toHaveLength(1);
    expect(stats[0].impressions).toBe(2);
    expect(stats[0].clicks).toBe(0);
  });

  it('redirects clicks to the banner target and counts them', async () => {
    const { zoneId, bannerId } = await seed();
    const res = await app.inject({ method: 'GET', url: `/delivery/click/${bannerId}?zone=${zoneId}` });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('https://advertiser.example.com/landing');

    const stats = (await app.inject({ method: 'GET', url: `/admin/banners/${bannerId}/stats` })).json();
    expect(stats[0].clicks).toBe(1);
  });
});
