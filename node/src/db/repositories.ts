import type { AdHourlyStat, Banner, BannerCandidate, Campaign, Zone } from '../domain/types.js';

export interface Repositories {
  getZone(zoneId: number): Promise<Zone | null>;
  listZones(): Promise<Zone[]>;
  createZone(input: Omit<Zone, 'id'>): Promise<Zone>;

  listZoneBanners(zoneId: number): Promise<BannerCandidate[]>;
  linkBannerToZone(zoneId: number, bannerId: number): Promise<void>;

  createCampaign(input: Omit<Campaign, 'id'>): Promise<Campaign>;
  listCampaigns(): Promise<Campaign[]>;

  createBanner(input: Omit<Banner, 'id'>): Promise<Banner>;
  listBanners(): Promise<Banner[]>;
  getBanner(bannerId: number): Promise<Banner | null>;

  recordImpression(bannerId: number, zoneId: number, at: Date): Promise<void>;
  recordClick(bannerId: number, zoneId: number, at: Date): Promise<void>;
  getStats(bannerId: number): Promise<AdHourlyStat[]>;
}

function dayKey(at: Date): string {
  return at.toISOString().slice(0, 10);
}

export class MemoryRepositories implements Repositories {
  private zones = new Map<number, Zone>();
  private campaigns = new Map<number, Campaign>();
  private banners = new Map<number, Banner>();
  private zoneBanners: ZoneBannerLink[] = [];
  private stats = new Map<string, AdHourlyStat>();
  private nextZoneId = 1;
  private nextCampaignId = 1;
  private nextBannerId = 1;

  async getZone(zoneId: number): Promise<Zone | null> {
    return this.zones.get(zoneId) ?? null;
  }

  async listZones(): Promise<Zone[]> {
    return [...this.zones.values()];
  }

  async createZone(input: Omit<Zone, 'id'>): Promise<Zone> {
    const zone: Zone = { id: this.nextZoneId++, ...input };
    this.zones.set(zone.id, zone);
    return zone;
  }

  async listZoneBanners(zoneId: number): Promise<BannerCandidate[]> {
    const result: BannerCandidate[] = [];
    for (const link of this.zoneBanners) {
      if (link.zoneId !== zoneId) {
        continue;
      }
      const banner = this.banners.get(link.bannerId);
      const campaign = banner ? this.campaigns.get(banner.campaignId) : undefined;
      if (banner && campaign) {
        result.push({ ...banner, campaign });
      }
    }
    return result;
  }

  async linkBannerToZone(zoneId: number, bannerId: number): Promise<void> {
    if (!this.zones.has(zoneId)) {
      throw new Error(`Zone ${zoneId} not found`);
    }
    if (!this.banners.has(bannerId)) {
      throw new Error(`Banner ${bannerId} not found`);
    }
    if (!this.zoneBanners.some((l) => l.zoneId === zoneId && l.bannerId === bannerId)) {
      this.zoneBanners.push({ zoneId, bannerId });
    }
  }

  async createCampaign(input: Omit<Campaign, 'id'>): Promise<Campaign> {
    const campaign: Campaign = { id: this.nextCampaignId++, ...input };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async listCampaigns(): Promise<Campaign[]> {
    return [...this.campaigns.values()];
  }

  async createBanner(input: Omit<Banner, 'id'>): Promise<Banner> {
    const banner: Banner = { id: this.nextBannerId++, ...input };
    this.banners.set(banner.id, banner);
    return banner;
  }

  async listBanners(): Promise<Banner[]> {
    return [...this.banners.values()];
  }

  async getBanner(bannerId: number): Promise<Banner | null> {
    return this.banners.get(bannerId) ?? null;
  }

  private bump(bannerId: number, at: Date, field: 'impressions' | 'clicks'): void {
    const key = `${bannerId}|${dayKey(at)}|${at.getUTCHours()}`;
    const existing = this.stats.get(key) ?? {
      bannerId,
      day: dayKey(at),
      hour: at.getUTCHours(),
      impressions: 0,
      clicks: 0,
      views: 0,
    };
    existing[field] += 1;
    this.stats.set(key, existing);
  }

  async recordImpression(bannerId: number, _zoneId: number, at: Date): Promise<void> {
    this.bump(bannerId, at, 'impressions');
  }

  async recordClick(bannerId: number, _zoneId: number, at: Date): Promise<void> {
    this.bump(bannerId, at, 'clicks');
  }

  async getStats(bannerId: number): Promise<AdHourlyStat[]> {
    return [...this.stats.values()].filter((stat) => stat.bannerId === bannerId);
  }
}

interface ZoneBannerLink {
  zoneId: number;
  bannerId: number;
}
