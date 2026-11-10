import type { Generated } from 'kysely';

export interface AgenciesTable {
  id: Generated<number>;
  name: string;
}

export interface AdvertisersTable {
  id: Generated<number>;
  agency_id: number;
  name: string;
}

export interface CampaignsTable {
  id: Generated<number>;
  advertiser_id: number;
  name: string;
  active: boolean;
  status: string;
  start_date: Date | null;
  end_date: Date | null;
  weight: number;
}

export interface BannersTable {
  id: Generated<number>;
  campaign_id: number;
  name: string;
  active: boolean;
  status: string;
  weight: number;
  width: number;
  height: number;
  image_url: string | null;
  click_url: string | null;
  html_body: string | null;
}

export interface ZonesTable {
  id: Generated<number>;
  name: string;
  width: number;
  height: number;
}

export interface ZoneBannersTable {
  zone_id: number;
  banner_id: number;
}

export interface StatsAdHourlyTable {
  banner_id: number;
  day: string;
  hour: number;
  impressions: number;
  clicks: number;
  views: number;
}

export interface Database {
  agencies: AgenciesTable;
  advertisers: AdvertisersTable;
  campaigns: CampaignsTable;
  banners: BannersTable;
  zones: ZonesTable;
  zone_banners: ZoneBannersTable;
  stats_ad_hourly: StatsAdHourlyTable;
}
