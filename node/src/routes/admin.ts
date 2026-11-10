import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Banner, Campaign } from '../domain/types.js';
import {
  ENTITY_STATUSES,
  TRANSITIONS,
  assertTransition,
  effectiveState,
  entityStateMachineDefinition,
  InvalidTransitionError,
  type EntityStatus,
} from '../domain/stateMachine.js';
import type { Repositories } from '../db/repositories.js';

const zoneInput = z.object({
  name: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const statusSchema = z.enum(ENTITY_STATUSES);

const campaignInput = z.object({
  advertiserId: z.number().int().positive(),
  name: z.string().min(1),
  active: z.boolean().default(true),
  status: statusSchema.optional(),
  startDate: z.coerce.date().nullable().default(null),
  endDate: z.coerce.date().nullable().default(null),
  weight: z.number().int().min(0).default(1),
});

const bannerInput = z.object({
  campaignId: z.number().int().positive(),
  name: z.string().min(1),
  active: z.boolean().default(true),
  status: statusSchema.optional(),
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

const transitionInput = z.object({
  to: statusSchema,
});

function campaignView(campaign: Campaign, now = new Date()) {
  return {
    ...campaign,
    state: effectiveState(campaign.status, campaign.startDate, campaign.endDate, now),
    allowedTransitions: TRANSITIONS[campaign.status],
  };
}

function bannerView(banner: Banner, now = new Date()) {
  return {
    ...banner,
    allowedTransitions: TRANSITIONS[banner.status],
  };
}

export async function registerAdminRoutes(
  app: FastifyInstance,
  repos: Repositories,
): Promise<void> {
  app.get('/admin/meta/entity-states', async () => entityStateMachineDefinition());

  app.post<{ Body: unknown }>('/admin/zones', async (request, reply) => {
    const input = zoneInput.parse(request.body);
    const zone = await repos.createZone(input);
    return reply.code(201).send(zone);
  });

  app.get('/admin/zones', async () => repos.listZones());

  app.post<{ Body: unknown }>('/admin/campaigns', async (request, reply) => {
    const input = campaignInput.parse(request.body);
    const status: EntityStatus = input.status ?? (input.active ? 'active' : 'paused');
    const campaign = await repos.createCampaign({ ...input, status });
    return reply.code(201).send(campaignView(campaign));
  });

  app.get('/admin/campaigns', async () => (await repos.listCampaigns()).map((c) => campaignView(c)));

  app.post<{ Params: { id: string }; Body: unknown }>(
    '/admin/campaigns/:id/transition',
    async (request, reply) => {
      const campaignId = Number(request.params.id);
      const { to } = transitionInput.parse(request.body);
      const campaign = await repos.getCampaign(campaignId);
      if (!campaign) {
        return reply.code(404).send({ error: `Campaign ${campaignId} not found` });
      }
      try {
        assertTransition(campaign.status, to);
      } catch (error) {
        if (error instanceof InvalidTransitionError) {
          return reply.code(409).send({
            error: error.message,
            from: error.from,
            to: error.to,
            allowedTransitions: error.allowed,
          });
        }
        throw error;
      }
      const updated = await repos.setCampaignStatus(campaignId, to);
      return reply.code(200).send(campaignView(updated));
    },
  );

  app.post<{ Body: unknown }>('/admin/banners', async (request, reply) => {
    const input = bannerInput.parse(request.body);
    const status: EntityStatus = input.status ?? (input.active ? 'active' : 'paused');
    const banner = await repos.createBanner({ ...input, status });
    return reply.code(201).send(bannerView(banner));
  });

  app.get('/admin/banners', async () => (await repos.listBanners()).map((b) => bannerView(b)));

  app.post<{ Params: { id: string }; Body: unknown }>(
    '/admin/banners/:id/transition',
    async (request, reply) => {
      const bannerId = Number(request.params.id);
      const { to } = transitionInput.parse(request.body);
      const banner = await repos.getBanner(bannerId);
      if (!banner) {
        return reply.code(404).send({ error: `Banner ${bannerId} not found` });
      }
      try {
        assertTransition(banner.status, to);
      } catch (error) {
        if (error instanceof InvalidTransitionError) {
          return reply.code(409).send({
            error: error.message,
            from: error.from,
            to: error.to,
            allowedTransitions: error.allowed,
          });
        }
        throw error;
      }
      const updated = await repos.setBannerStatus(bannerId, to);
      return reply.code(200).send(bannerView(updated));
    },
  );

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
