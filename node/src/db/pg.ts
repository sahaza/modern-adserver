import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import type { AdHourlyStat, Banner, BannerCandidate, Campaign, Zone } from '../domain/types.js';
import type { Database } from './schema.js';
import type { Repositories } from './repositories.js';

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), '../../db/schema.sql');

export function createDatabase(connectionString: string): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString }),
    }),
  });
}

export async function migrate(db: Kysely<Database>): Promise<void> {
  await sql.raw(readFileSync(schemaPath, 'utf8')).execute(db);
}

export class PgRepositories implements Repositories {
  constructor(private readonly db: Kysely<Database>) {}

  async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1`.execute(this.db);
      return true;
    } catch {
      return false;
    }
  }

  async getZone(zoneId: number): Promise<Zone | null> {
    const row = await this.db
      .selectFrom('zones')
      .selectAll()
      .where('id', '=', zoneId)
      .executeTakeFirst();
    return row ? mapZone(row) : null;
  }

  async listZones(): Promise<Zone[]> {
    const rows = await this.db.selectFrom('zones').selectAll().execute();
    return rows.map(mapZone);
  }

  async createZone(input: Omit<Zone, 'id'>): Promise<Zone> {
    const row = await this.db
      .insertInto('zones')
      .values({ name: input.name, width: input.width, height: input.height })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapZone(row);
  }

  async listZoneBanners(zoneId: number): Promise<BannerCandidate[]> {
    const rows = await this.db
      .selectFrom('zone_banners')
      .innerJoin('banners', 'banners.id', 'zone_banners.banner_id')
      .innerJoin('campaigns', 'campaigns.id', 'banners.campaign_id')
      .selectAll('banners')
      .selectAll('campaigns')
      .where('zone_banners.zone_id', '=', zoneId)
      .execute();
    return rows.map((row) => ({
      ...mapBanner(row),
      campaign: mapCampaign(row),
    }));
  }

  async linkBannerToZone(zoneId: number, bannerId: number): Promise<void> {
    await this.db
      .insertInto('zone_banners')
      .values({ zone_id: zoneId, banner_id: bannerId })
      .onConflict((oc) => oc.columns(['zone_id', 'banner_id']).doNothing())
      .execute();
  }

  async createCampaign(input: Omit<Campaign, 'id'>): Promise<Campaign> {
    const row = await this.db
      .insertInto('campaigns')
      .values({
        advertiser_id: input.advertiserId,
        name: input.name,
        active: input.active,
        start_date: input.startDate,
        end_date: input.endDate,
        weight: input.weight,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapCampaign(row);
  }

  async listCampaigns(): Promise<Campaign[]> {
    const rows = await this.db.selectFrom('campaigns').selectAll().execute();
    return rows.map(mapCampaign);
  }

  async createBanner(input: Omit<Banner, 'id'>): Promise<Banner> {
    const row = await this.db
      .insertInto('banners')
      .values({
        campaign_id: input.campaignId,
        name: input.name,
        active: input.active,
        weight: input.weight,
        width: input.width,
        height: input.height,
        image_url: input.imageUrl,
        click_url: input.clickUrl,
        html_body: input.htmlBody,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return mapBanner(row);
  }

  async listBanners(): Promise<Banner[]> {
    const rows = await this.db.selectFrom('banners').selectAll().execute();
    return rows.map(mapBanner);
  }

  async getBanner(bannerId: number): Promise<Banner | null> {
    const row = await this.db
      .selectFrom('banners')
      .selectAll()
      .where('id', '=', bannerId)
      .executeTakeFirst();
    return row ? mapBanner(row) : null;
  }

  private async bump(bannerId: number, at: Date, field: 'impressions' | 'clicks'): Promise<void> {
    const day = at.toISOString().slice(0, 10);
    const hour = at.getUTCHours();
    await this.db
      .insertInto('stats_ad_hourly')
      .values({ banner_id: bannerId, day, hour, impressions: 0, clicks: 0, views: 0 })
      .onConflict((oc) =>
        oc.columns(['banner_id', 'day', 'hour']).doUpdateSet({
          [field]: sql`stats_ad_hourly.${sql.ref(field)} + 1`,
        }),
      )
      .execute();
  }

  async recordImpression(bannerId: number, _zoneId: number, at: Date): Promise<void> {
    await this.bump(bannerId, at, 'impressions');
  }

  async recordClick(bannerId: number, _zoneId: number, at: Date): Promise<void> {
    await this.bump(bannerId, at, 'clicks');
  }

  async getStats(bannerId: number): Promise<AdHourlyStat[]> {
    const rows = await this.db
      .selectFrom('stats_ad_hourly')
      .selectAll()
      .where('banner_id', '=', bannerId)
      .orderBy('day')
      .orderBy('hour')
      .execute();
    return rows.map((row) => ({
      bannerId: row.banner_id,
      day: String(row.day),
      hour: row.hour,
      impressions: row.impressions,
      clicks: row.clicks,
      views: row.views,
    }));
  }
}

function mapZone(row: { id: number; name: string; width: number; height: number }): Zone {
  return { id: row.id, name: row.name, width: row.width, height: row.height };
}

function mapCampaign(row: {
  id: number;
  advertiser_id: number;
  name: string;
  active: boolean;
  start_date: Date | null;
  end_date: Date | null;
  weight: number;
}): Campaign {
  return {
    id: row.id,
    advertiserId: row.advertiser_id,
    name: row.name,
    active: row.active,
    startDate: row.start_date,
    endDate: row.end_date,
    weight: row.weight,
  };
}

function mapBanner(row: {
  id: number;
  campaign_id: number;
  name: string;
  active: boolean;
  weight: number;
  width: number;
  height: number;
  image_url: string | null;
  click_url: string | null;
  html_body: string | null;
}): Banner {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    active: row.active,
    weight: row.weight,
    width: row.width,
    height: row.height,
    imageUrl: row.image_url,
    clickUrl: row.click_url,
    htmlBody: row.html_body,
  };
}
