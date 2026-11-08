import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { registerDeliveryRoutes } from './routes/delivery.js';
import { registerAdminRoutes } from './routes/admin.js';
import { MemoryRepositories, type Repositories } from './db/repositories.js';
import { createDatabase, migrate, PgRepositories } from './db/pg.js';

export async function createApp(repos: Repositories): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Validation failed', issues: error.issues });
    }
    app.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });
  await registerDeliveryRoutes(app, repos);
  await registerAdminRoutes(app, repos);
  return app;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  let repos: Repositories;
  if (databaseUrl) {
    const db = createDatabase(databaseUrl);
    await migrate(db);
    repos = new PgRepositories(db);
  } else {
    repos = new MemoryRepositories();
  }
  const app = await createApp(repos);
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '127.0.0.1';
  await app.listen({ port, host });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
