# Modern AdServer — TypeScript/Node.js core

This directory contains the Modern AdServer codebase: an open source ad server written in
TypeScript on Node.js 22+.

## Stack

- **Node.js 22+**, **TypeScript 5** (strict, `NodeNext` ESM)
- **Fastify 5** — HTTP layer (delivery engine + admin API)
- **Kysely** + **pg** — type-safe SQL against PostgreSQL (`db/schema.sql`)
- **Zod** — request validation
- **Vitest** — tests
- In-memory repositories for development/tests when `DATABASE_URL` is not set

## Commands

```sh
npm ci          # install dependencies
npm run typecheck
npm test        # vitest
npm run build   # tsc -> dist/
npm start       # node dist/server.js  (PORT, HOST, DATABASE_URL env vars)
npm run dev     # tsx watch
```

## Docker

From the repository root: `docker compose up -d` builds this directory (`Dockerfile`)
and starts Modern AdServer on port 3000 together with a PostgreSQL container.
The image is multi-stage (deps → build → runtime), runs as a non-root user,
and ships a `HEALTHCHECK` against `GET /health`. Configuration via environment
variables — see [.env.example](../.env.example).

## API

Health:

- `GET /health` — liveness/readiness probe

Delivery engine:

- `GET /delivery/zone/:zoneId` — select and return a banner for the zone (weighted random among eligible banners of active, in-date campaigns)
- `GET /delivery/impression/:bannerId?zone=:zoneId` — record an impression (hourly stats)
- `GET /delivery/click/:bannerId?zone=:zoneId` — record a click and 302 to the banner target

Admin API:

- `POST /admin/zones`, `GET /admin/zones`
- `POST /admin/campaigns`, `GET /admin/campaigns`
- `POST /admin/banners`, `GET /admin/banners`
- `POST /admin/zones/:zoneId/banners` — link a banner to a zone
- `GET /admin/banners/:bannerId/stats` — hourly impressions/clicks

## Layout

```
db/schema.sql          PostgreSQL schema
src/domain/            domain types + banner selection engine
src/db/                Kysely table types, repository interface, memory + Postgres implementations
src/routes/            delivery and admin HTTP routes
src/server.ts          application factory + entrypoint
tests/                 vitest suites
```

## License

MIT — see [LICENSE.txt](../LICENSE.txt).
