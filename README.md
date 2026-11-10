# Modern AdServer
#### Open source ad serving system

[![CI](https://github.com/sahaza/modern-adserver/actions/workflows/node-ci.yml/badge.svg)](https://github.com/sahaza/modern-adserver/actions/workflows/node-ci.yml)

**Modern AdServer is an open source ad serving tool** that enables publishers to:

* Serve ads on their websites;

* Manage their campaigns from different advertisers and/or ad networks using a simple, easy-to-use interface;

* Track and report on campaign success, including click-through rates;

* Set rules to target the delivery of campaigns, or even ads, to specific users, to help maximise the effectiveness of campaigns.

The codebase is written in a modern stack: **Node.js 22+ / TypeScript** (see [`node/`](node/)).
Modern AdServer is a rewrite of Revive Adserver; the legacy PHP code was purged from the repository, including its git history.

# Installation

## Option A — Docker (fastest)

Requires Docker with the Compose plugin.

```sh
git clone https://github.com/sahaza/modern-adserver.git
cd modern-adserver
docker compose up -d        # builds the image, starts Modern AdServer + PostgreSQL
```

The server listens on **http://localhost:3000** (PostgreSQL runs in a second container; the schema is created automatically on first start). Check status:

```sh
curl http://localhost:3000/health
# {"status":"ok","storage":"postgres","dbOk":true,...}
```

Stop with `docker compose down` (add `-v` to also remove the database volume).

## Option B — from source

Requires **Node.js 22+** (and optionally PostgreSQL).

```sh
git clone https://github.com/sahaza/modern-adserver.git
cd modern-adserver/node
npm ci
npm run build
npm start                   # http://127.0.0.1:3000
```

Run the tests with `npm test`, typecheck with `npm run typecheck`.

## Configuration

Configuration is via environment variables (see [.env.example](.env.example)):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address — set `0.0.0.0` in containers / behind a reverse proxy |
| `DATABASE_URL` | _(unset)_ | PostgreSQL connection string. Unset = in-memory storage (dev only, data lost on restart). Schema auto-applied on startup |

# API

Health:

* `GET /health` — liveness/readiness (`{"status":"ok","storage":"postgres","dbOk":true}`)

Delivery engine:

* `GET /delivery/zone/:zoneId` — select and return a banner for the zone
* `GET /delivery/impression/:bannerId?zone=:zoneId` — record an impression
* `GET /delivery/click/:bannerId?zone=:zoneId` — record a click, 302 to the banner target

Admin API:

* `POST|GET /admin/zones`, `POST|GET /admin/campaigns`, `POST|GET /admin/banners`
* `POST /admin/zones/:zoneId/banners` — link a banner to a zone
* `GET /admin/banners/:bannerId/stats` — hourly impressions/clicks
* `POST /admin/campaigns/:id/transition`, `POST /admin/banners/:id/transition` — explicit lifecycle transition (`{"to": "paused"}`); invalid transitions return `409` with `allowedTransitions`
* `GET /admin/meta/entity-states` — machine-readable state machine definition (statuses, transitions, effective states)

Campaign and banner responses include `status` (explicit lifecycle state), `state` (effective state, see below), `allowedTransitions`, and the legacy `active` boolean (always mirrored from `status === 'active'`).

## Lifecycle state machine

Explicit statuses: `draft`, `active`, `paused`, `archived`. Allowed transitions:

| From | To |
|---|---|
| `draft` | `active`, `archived` |
| `active` | `paused`, `archived` |
| `paused` | `active`, `draft`, `archived` |
| `archived` | `draft` |

The **effective state** additionally derives from the campaign date window: an `active` campaign before its `startDate` is `scheduled`, after its `endDate` it is `expired`. Only effective state `active` is eligible for delivery.

See [`node/README.md`](node/README.md) for details.

# Development

TypeScript strict mode, Fastify 5, Kysely + pg, Zod validation, Vitest. CI (`.github/workflows/node-ci.yml`) runs typecheck, tests, build and a Docker image build on Node 22 / ubuntu for every push and pull request touching `node/`.

Bug reports and feature requests: please use [GitHub issues](https://github.com/sahaza/modern-adserver/issues) and [discussions](https://github.com/sahaza/modern-adserver/discussions).

# Security

To report a vulnerability, use [private vulnerability reporting](https://github.com/sahaza/modern-adserver/security/advisories/new) — see [SECURITY.md](SECURITY.md). Do not open public issues for security concerns.

# License

Modern AdServer is released under the [MIT license](LICENSE.txt) — see `LICENSE.txt`.
Copyright and historical attribution: see [COPYRIGHT.txt](COPYRIGHT.txt).
