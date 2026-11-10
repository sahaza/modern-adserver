import type { FastifyInstance } from 'fastify';
import type { Repositories } from '../db/repositories.js';

export type ProcessPhase = 'starting' | 'running' | 'shutting_down';

export async function registerHealthRoute(
  app: FastifyInstance,
  repos: Repositories,
  storage: 'memory' | 'postgres',
  phase: () => ProcessPhase = () => 'running',
): Promise<void> {
  app.get('/health', async () => {
    const dbOk = await repos.healthCheck();
    return {
      status: dbOk ? 'ok' : 'degraded',
      phase: phase(),
      storage,
      dbOk,
      uptime: process.uptime(),
    };
  });
}
