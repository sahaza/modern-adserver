import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../src/server.js';
import { MemoryRepositories } from '../src/db/repositories.js';

let app: FastifyInstance;

beforeEach(async () => {
  app = await createApp(new MemoryRepositories(), 'memory');
});

afterEach(async () => {
  await app.close();
});

describe('health endpoint', () => {
  it('GET /health reports ok with memory storage', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.storage).toBe('memory');
    expect(body.dbOk).toBe(true);
  });
});
