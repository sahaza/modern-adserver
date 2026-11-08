# Modern AdServer
#### Open source ad serving system

[![CI](https://github.com/sahaza/revive-adserver/actions/workflows/node-ci.yml/badge.svg)](https://github.com/sahaza/revive-adserver/actions/workflows/node-ci.yml)

**Modern AdServer is an open source ad serving tool** that enables publishers to:

* Serve ads on their websites;

* Manage their campaigns from different advertisers and/or ad networks using a simple, easy-to-use interface;

* Track and report on campaign success, including click-through rates;

* Set rules to target the delivery of campaigns, or even ads, to specific users, to help maximise the effectiveness of campaigns.

The codebase is written in a modern stack: **Node.js 22+ / TypeScript** (see [`node/`](node/)).
Modern AdServer is a rewrite of Revive Adserver; the legacy PHP implementation is preserved on the [`archive/legacy-php`](https://github.com/sahaza/revive-adserver/tree/archive/legacy-php) branch.

# Requirements

* Node.js 22 or greater
* PostgreSQL (optional — without `DATABASE_URL` the server runs on in-memory storage for development)

# Quick start

```sh
cd node
npm ci
npm test          # vitest suite
npm run build     # tsc -> dist/
npm start         # serves on 127.0.0.1:3000 (PORT/HOST/DATABASE_URL env vars)
```

# API

Delivery engine:

* `GET /delivery/zone/:zoneId` — select and return a banner for the zone
* `GET /delivery/impression/:bannerId?zone=:zoneId` — record an impression
* `GET /delivery/click/:bannerId?zone=:zoneId` — record a click, 302 to the banner target

Admin API:

* `POST|GET /admin/zones`, `POST|GET /admin/campaigns`, `POST|GET /admin/banners`
* `POST /admin/zones/:zoneId/banners` — link a banner to a zone
* `GET /admin/banners/:bannerId/stats` — hourly impressions/clicks

See [`node/README.md`](node/README.md) for details.

# Development

TypeScript strict mode, Fastify 5, Kysely + pg, Zod validation, Vitest. CI (`.github/workflows/node-ci.yml`) runs typecheck, tests and build on Node 22 for every push and pull request touching `node/`.

Bug reports and feature requests: please use [GitHub issues](https://github.com/sahaza/revive-adserver/issues) and [discussions](https://github.com/sahaza/revive-adserver/discussions).

# Security

To report a vulnerability, use [private vulnerability reporting](https://github.com/sahaza/revive-adserver/security/advisories/new) — see [SECURITY.md](SECURITY.md). Do not open public issues for security concerns.

# License

Modern AdServer is released under the [MIT license](LICENSE.txt) — see `LICENSE.txt`.
Copyright and historical attribution: see [COPYRIGHT.txt](COPYRIGHT.txt).
