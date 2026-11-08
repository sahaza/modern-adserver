# Revive Adserver
#### The world's most popular free, open source ad serving system

[![Node CI](https://github.com/sahaza/revive-adserver/actions/workflows/node-ci.yml/badge.svg)](https://github.com/sahaza/revive-adserver/actions/workflows/node-ci.yml)

**Revive Adserver is an open source ad serving tool** that enables publishers to:

* Serve ads on their websites;

* Manage their campaigns from different advertisers and/or ad networks using the simple, easy-to-use interface;

* Track and report on campaign success, including click-through rates;

* Set rules to target the delivery of campaigns, or even ads, to specific users, to help maximise the effectiveness of campaigns.

The codebase has been rewritten in a modern stack: **Node.js 22+ / TypeScript**, with the application under [`node/`](node/). The previous PHP implementation is archived on the [`archive/legacy-php`](https://github.com/sahaza/revive-adserver/tree/archive/legacy-php) branch.

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

Bug reports and feature requests: please use [GitHub issues](https://github.com/sahaza/revive-adserver/issues) or the [community forums](https://forum.revive-adserver.com/).

# Security

To report a vulnerability, please use our responsible disclosure program at https://hackerone.com/revive_adserver — see [SECURITY.md](SECURITY.md). Do not open public issues for security concerns.

# License

Revive Adserver is copyrighted; please see the COPYRIGHT file.

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

------------------------------------------------------------------------

This product uses GeoLite2 data created by MaxMind, available from the
https://www.maxmind.com/ website.
