import type { FastifyInstance } from 'fastify';
import { selectBanner } from '../domain/selection.js';
import type { Repositories } from '../db/repositories.js';

export async function registerDeliveryRoutes(
  app: FastifyInstance,
  repos: Repositories,
): Promise<void> {
  app.get<{ Params: { zoneId: string } }>('/delivery/zone/:zoneId', async (request, reply) => {
    const zoneId = Number(request.params.zoneId);
    const zone = await repos.getZone(zoneId);
    if (!zone) {
      return reply.code(404).send({ error: `Zone ${zoneId} not found` });
    }
    const candidates = await repos.listZoneBanners(zoneId);
    const banner = selectBanner(candidates, new Date());
    if (!banner) {
      return { zone, banner: null };
    }
    return {
      zone,
      banner: {
        ...banner,
        impressionUrl: `/delivery/impression/${banner.id}?zone=${zoneId}`,
        clickUrl: banner.clickUrl ?? `/delivery/click/${banner.id}?zone=${zoneId}`,
      },
    };
  });

  app.get<{ Params: { bannerId: string }; Querystring: { zone?: string } }>(
    '/delivery/impression/:bannerId',
    async (request, reply) => {
      const bannerId = Number(request.params.bannerId);
      const zoneId = Number(request.query.zone ?? 0);
      await repos.recordImpression(bannerId, zoneId, new Date());
      return reply.code(204).send();
    },
  );

  app.get<{ Params: { bannerId: string }; Querystring: { zone?: string } }>(
    '/delivery/click/:bannerId',
    async (request, reply) => {
      const bannerId = Number(request.params.bannerId);
      const zoneId = Number(request.query.zone ?? 0);
      await repos.recordClick(bannerId, zoneId, new Date());
      const banner = await repos.getBanner(bannerId);
      const target = banner?.clickUrl;
      if (target) {
        return reply.code(302).header('location', target).send();
      }
      return reply.code(204).send();
    },
  );
}
