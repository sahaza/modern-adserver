# Revive Adserver
#### The world's most popular free, open source ad serving system

[![CI](https://github.com/revive-adserver/revive-adserver/actions/workflows/ci.yml/badge.svg)](https://github.com/revive-adserver/revive-adserver/actions/workflows/ci.yml)
[![Tests](https://github.com/revive-adserver/revive-adserver/actions/workflows/test.yml/badge.svg)](https://github.com/revive-adserver/revive-adserver/actions/workflows/test.yml)

**Revive Adserver is an open source ad serving tool** that enables publishers to:

* Serve ads on their websites;

* Manage their campaigns from different advertisers and/or ad networks using the simple, easy-to-use interface;

* Track and report on campaign success, including click-through rates;

* Set rules to target the delivery of campaigns, or even ads, to specific users, to help maximise the effectiveness of campaigns.

# Requirements

* PHP 8.2.35 or greater, with the extensions listed in `composer.json` (including `intl`, `zip`, and a database driver: `mysqli` or `pgsql`)
* MySQL/MariaDB or PostgreSQL
* A web server (Apache or nginx) with PHP support

For the full, up-to-date list, see the [system requirements](https://www.revive-adserver.com/support/requirements/).

# Download

**DO NOT DOWNLOAD AS A ZIP FILE FROM GITHUB**

Download the latest version from: https://www.revive-adserver.com/download/

Revive Adserver as available from github as a zip file is not suitable for installation on a server. It contains a number of files that are for development only, and are removed during the release packaging process.

Please ONLY download Revive Adserver as a release package from the Revive Adserver website at https://www.revive-adserver.com/.

Installation and upgrade instructions are available at:

* https://www.revive-adserver.com/how-to/install/
* https://www.revive-adserver.com/how-to/update/

Full documentation: https://documentation.revive-adserver.com/



# Hosted edition

If you'd like to use the Revive Adserver software without having to download, install, configure, and maintain it yourself, there is also a Hosted edition.

You can find out more about the Hosted edition, and subscribe at https://www.revive-adserver.net/.

# Development

The codebase is PHP 8.2+ with dependencies managed by [Composer](https://getcomposer.org/) (installed into `lib/vendor`). After cloning:

```sh
composer install
```

Static analysis, code style and refactoring tooling are configured and run in CI:

* `lib/vendor/bin/phpstan` — static analysis
* `lib/vendor/bin/ecs` — coding standards
* `lib/vendor/bin/rector` — automated refactoring
* PHPUnit test suites under `tests/` — run in CI across PHP 8.2–8.4 against MySQL and PostgreSQL (see [.github/workflows](.github/workflows))

Bug reports and feature requests: please use [GitHub issues](https://github.com/revive-adserver/revive-adserver/issues) or the [community forums](https://forum.revive-adserver.com/).

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
https://www.maxmind.com/ website. See also:
https://www.revive-adserver.com/blog/new-geotargeting-plugin-in-revive-adserver-v5-an-overview/
