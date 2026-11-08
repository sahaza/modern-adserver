# Revive Adserver — Node.js/TypeScript core (next generation)

This directory contains the TypeScript/Node.js rewrite of the Revive Adserver codebase.
The legacy PHP application in the repository root remains the production system until this
implementation reaches feature parity; both are tracked side by side.

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

## API

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
