import type { AdHourlyStat, Banner, BannerCandidate, Campaign, Zone } from '../domain/types.js';
import type { EntityStatus } from '../domain/stateMachine.js';

export type CampaignInput = Omit<Campaign, 'id' | 'status'> & { status?: EntityStatus };
export type BannerInput = Omit<Banner, 'id' | 'status'> & { status?: EntityStatus };

export interface Repositories {
  healthCheck(): Promise<boolean>;

  getZone(zoneId: number): Promise<Zone | null>;
  listZones(): Promise<Zone[]>;
  createZone(input: Omit<Zone, 'id'>): Promise<Zone>;

  listZoneBanners(zoneId: number): Promise<BannerCandidate[]>;
  linkBannerToZone(zoneId: number, bannerId: number): Promise<void>;

  createCampaign(input: CampaignInput): Promise<Campaign>;
  listCampaigns(): Promise<Campaign[]>;
  getCampaign(campaignId: number): Promise<Campaign | null>;
  setCampaignStatus(campaignId: number, status: EntityStatus): Promise<Campaign>;

  createBanner(input: BannerInput): Promise<Banner>;
  listBanners(): Promise<Banner[]>;
  getBanner(bannerId: number): Promise<Banner | null>;
  setBannerStatus(bannerId: number, status: EntityStatus): Promise<Banner>;

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

  async healthCheck(): Promise<boolean> {
    return true;
  }

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

  async createCampaign(input: CampaignInput): Promise<Campaign> {
    const status = input.status ?? (input.active ? 'active' : 'paused');
    const campaign: Campaign = { id: this.nextCampaignId++, ...input, status };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async listCampaigns(): Promise<Campaign[]> {
    return [...this.campaigns.values()];
  }

  async getCampaign(campaignId: number): Promise<Campaign | null> {
    return this.campaigns.get(campaignId) ?? null;
  }

  async setCampaignStatus(campaignId: number, status: EntityStatus): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    const updated: Campaign = { ...campaign, status, active: status === 'active' };
    this.campaigns.set(campaignId, updated);
    return updated;
  }

  async createBanner(input: BannerInput): Promise<Banner> {
    const status = input.status ?? (input.active ? 'active' : 'paused');
    const banner: Banner = { id: this.nextBannerId++, ...input, status };
    this.banners.set(banner.id, banner);
    return banner;
  }

  async listBanners(): Promise<Banner[]> {
    return [...this.banners.values()];
  }

  async getBanner(bannerId: number): Promise<Banner | null> {
    return this.banners.get(bannerId) ?? null;
  }

  async setBannerStatus(bannerId: number, status: EntityStatus): Promise<Banner> {
    const banner = this.banners.get(bannerId);
    if (!banner) {
      throw new Error(`Banner ${bannerId} not found`);
    }
    const updated: Banner = { ...banner, status, active: status === 'active' };
    this.banners.set(bannerId, updated);
    return updated;
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
