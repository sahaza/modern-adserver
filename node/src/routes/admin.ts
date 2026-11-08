import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Repositories } from '../db/repositories.js';

const zoneInput = z.object({
  name: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const campaignInput = z.object({
  advertiserId: z.number().int().positive(),
  name: z.string().min(1),
  active: z.boolean().default(true),
  startDate: z.coerce.date().nullable().default(null),
  endDate: z.coerce.date().nullable().default(null),
  weight: z.number().int().min(0).default(1),
});

const bannerInput = z.object({
  campaignId: z.number().int().positive(),
  name: z.string().min(1),
  active: z.boolean().default(true),
  weight: z.number().int().min(0).default(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  imageUrl: z.string().nullable().default(null),
  clickUrl: z.string().nullable().default(null),
  htmlBody: z.string().nullable().default(null),
});

const linkInput = z.object({
  bannerId: z.number().int().positive(),
});

export async function registerAdminRoutes(
  app: FastifyInstance,
  repos: Repositories,
): Promise<void> {
  app.post<{ Body: unknown }>('/admin/zones', async (request, reply) => {
    const input = zoneInput.parse(request.body);
    const zone = await repos.createZone(input);
    return reply.code(201).send(zone);
  });

  app.get('/admin/zones', async () => repos.listZones());

  app.post<{ Body: unknown }>('/admin/campaigns', async (request, reply) => {
    const input = campaignInput.parse(request.body);
    const campaign = await repos.createCampaign(input);
    return reply.code(201).send(campaign);
  });

  app.get('/admin/campaigns', async () => repos.listCampaigns());

  app.post<{ Body: unknown }>('/admin/banners', async (request, reply) => {
    const input = bannerInput.parse(request.body);
    const banner = await repos.createBanner(input);
    return reply.code(201).send(banner);
  });

  app.get('/admin/banners', async () => repos.listBanners());

  app.post<{ Params: { zoneId: string }; Body: unknown }>(
    '/admin/zones/:zoneId/banners',
    async (request, reply) => {
      const zoneId = Number(request.params.zoneId);
      const { bannerId } = linkInput.parse(request.body);
      try {
        await repos.linkBannerToZone(zoneId, bannerId);
      } catch (error) {
        return reply.code(404).send({ error: (error as Error).message });
      }
      return reply.code(201).send({ zoneId, bannerId });
    },
  );

  app.get<{ Params: { bannerId: string } }>('/admin/banners/:bannerId/stats', async (request) => {
    const bannerId = Number(request.params.bannerId);
    return repos.getStats(bannerId);
  });
}
