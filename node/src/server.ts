import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { registerDeliveryRoutes } from './routes/delivery.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerHealthRoute } from './routes/health.js';
import { MemoryRepositories, type Repositories } from './db/repositories.js';
import { createDatabase, migrate, PgRepositories } from './db/pg.js';

export async function createApp(repos: Repositories, storage: 'memory' | 'postgres' = 'memory'): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Validation failed', issues: error.issues });
    }
    app.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });
  await registerHealthRoute(app, repos, storage);
  await registerDeliveryRoutes(app, repos);
  await registerAdminRoutes(app, repos);
  return app;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  let repos: Repositories;
  let storage: 'memory' | 'postgres';
  if (databaseUrl) {
    const db = createDatabase(databaseUrl);
    await migrate(db);
    repos = new PgRepositories(db);
    storage = 'postgres';
  } else {
    repos = new MemoryRepositories();
    storage = 'memory';
  }
  const app = await createApp(repos, storage);
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '127.0.0.1';
  await app.listen({ port, host });
  app.log.info(`Modern AdServer listening on http://${host}:${port} (storage: ${storage})`);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
