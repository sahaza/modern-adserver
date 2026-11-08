import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../db/repositories.js';

export async function registerHealthRoute(
  app: FastifyInstance,
  repos: Repositories,
  storage: 'memory' | 'postgres',
): Promise<void> {
  app.get('/health', async () => {
    const dbOk = await repos.healthCheck();
    return {
      status: dbOk ? 'ok' : 'degraded',
      storage,
      dbOk,
      uptime: process.uptime(),
    };
  });
}
