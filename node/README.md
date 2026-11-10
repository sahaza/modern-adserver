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
src/domain/            domain types, state machine, banner selection engine
src/db/                Kysely table types, repository interface, memory + Postgres implementations
src/routes/            health, delivery and admin HTTP routes
src/server.ts          application factory + entrypoint
tests/                 vitest suites
```

## Domain state machine

All implicit state is centralized in `src/domain/stateMachine.ts` (single source of truth):

- **Entity status** (campaigns, banners): `draft → active ⇄ paused → archived`, `archived → draft`
- **Effective state**: `scheduled` / `active` / `expired` derived from status + campaign date window; only `active` is delivery-eligible
- **Process lifecycle**: `starting → running → shutting_down`, exposed as `phase` in `GET /health`
- The legacy `active` boolean is kept and always mirrors `status === 'active'`, so existing clients keep working
- Transitions are validated server-side (`POST /admin/{campaigns,banners}/:id/transition` → `409` + `allowedTransitions` on invalid); the machine definition is machine-readable at `GET /admin/meta/entity-states`

## License

MIT — see [LICENSE.txt](../LICENSE.txt).
