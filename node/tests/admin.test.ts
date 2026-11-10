import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../src/server.js';
import { MemoryRepositories } from '../src/db/repositories.js';

let app: FastifyInstance;

beforeEach(async () => {
  app = await createApp(new MemoryRepositories());
});

afterEach(async () => {
  await app.close();
});

describe('admin API', () => {
  it('creates a zone, campaign and banner, links them, and delivers', async () => {
    const zoneRes = await app.inject({
      method: 'POST',
      url: '/admin/zones',
      payload: { name: 'Sidebar', width: 300, height: 250 },
    });
    expect(zoneRes.statusCode).toBe(201);
    const zone = zoneRes.json();

    const campaignRes = await app.inject({
      method: 'POST',
      url: '/admin/campaigns',
      payload: { advertiserId: 7, name: 'Spring', weight: 2 },
    });
    expect(campaignRes.statusCode).toBe(201);
    const campaign = campaignRes.json();
    expect(campaign.active).toBe(true);

    const bannerRes = await app.inject({
      method: 'POST',
      url: '/admin/banners',
      payload: {
        campaignId: campaign.id,
        name: 'Box',
        width: 300,
        height: 250,
        clickUrl: 'https://advertiser.example.com/',
      },
    });
    expect(bannerRes.statusCode).toBe(201);
    const banner = bannerRes.json();

    const linkRes = await app.inject({
      method: 'POST',
      url: `/admin/zones/${zone.id}/banners`,
      payload: { bannerId: banner.id },
    });
    expect(linkRes.statusCode).toBe(201);

    const delivery = await app.inject({ method: 'GET', url: `/delivery/zone/${zone.id}` });
    expect(delivery.statusCode).toBe(200);
    expect(delivery.json().banner.id).toBe(banner.id);
  });

  it('rejects invalid payloads with 400-level validation errors', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/zones',
      payload: { name: '', width: -5, height: 250 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation failed');
  });

  it('returns 404 when linking to an unknown zone', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/zones/42/banners',
      payload: { bannerId: 1 },
    });
    expect(res.statusCode).toBe(404);
  });

  it('lists created resources', async () => {
    await app.inject({
      method: 'POST',
      url: '/admin/zones',
      payload: { name: 'A', width: 100, height: 100 },
    });
    const zones = (await app.inject({ method: 'GET', url: '/admin/zones' })).json();
    expect(zones).toHaveLength(1);
    expect(zones[0].name).toBe('A');
  });

  it('exposes the entity state machine definition', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/meta/entity-states' });
    expect(res.statusCode).toBe(200);
    const def = res.json();
    expect(def.statuses).toEqual(['draft', 'active', 'paused', 'archived']);
    expect(def.transitions.active).toEqual(['paused', 'archived']);
  });

  it('campaign responses include status, effective state and allowed transitions', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/campaigns',
      payload: { advertiserId: 1, name: 'C' },
    });
    const campaign = res.json();
    expect(campaign.status).toBe('active');
    expect(campaign.active).toBe(true);
    expect(campaign.state).toBe('active');
    expect(campaign.allowedTransitions).toEqual(['paused', 'archived']);
  });

  it('applies a valid transition and mirrors the active flag', async () => {
    const created = (
      await app.inject({
        method: 'POST',
        url: '/admin/campaigns',
        payload: { advertiserId: 1, name: 'C' },
      })
    ).json();
    const res = await app.inject({
      method: 'POST',
      url: `/admin/campaigns/${created.id}/transition`,
      payload: { to: 'paused' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('paused');
    expect(body.active).toBe(false);
    expect(body.state).toBe('paused');
    expect(body.allowedTransitions).toEqual(['active', 'draft', 'archived']);
  });

  it('rejects an invalid transition with 409 and allowedTransitions', async () => {
    const created = (
      await app.inject({
        method: 'POST',
        url: '/admin/banners',
        payload: { campaignId: 1, name: 'B', width: 100, height: 100 },
      })
    ).json();
    await app.inject({
      method: 'POST',
      url: `/admin/banners/${created.id}/transition`,
      payload: { to: 'archived' },
    });
    const res = await app.inject({
      method: 'POST',
      url: `/admin/banners/${created.id}/transition`,
      payload: { to: 'active' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().allowedTransitions).toEqual(['draft']);
  });

  it('returns 404 when transitioning an unknown campaign', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/campaigns/999/transition',
      payload: { to: 'paused' },
    });
    expect(res.statusCode).toBe(404);
  });
});
