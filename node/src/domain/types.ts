import type { EntityStatus } from './stateMachine.js';

export interface Agency {
  id: number;
  name: string;
}

export interface Advertiser {
  id: number;
  agencyId: number;
  name: string;
}

export interface Campaign {
  id: number;
  advertiserId: number;
  name: string;
  /** Legacy mirror of status: true exactly when status === 'active'. Kept for backward compatibility. */
  active: boolean;
  /** Explicit lifecycle status — the single source of truth for transitions. */
  status: EntityStatus;
  startDate: Date | null;
  endDate: Date | null;
  weight: number;
}

export interface Banner {
  id: number;
  campaignId: number;
  name: string;
  /** Legacy mirror of status: true exactly when status === 'active'. Kept for backward compatibility. */
  active: boolean;
  /** Explicit lifecycle status — the single source of truth for transitions. */
  status: EntityStatus;
  weight: number;
  width: number;
  height: number;
  imageUrl: string | null;
  clickUrl: string | null;
  htmlBody: string | null;
}

export interface Zone {
  id: number;
  name: string;
  width: number;
  height: number;
}

export interface ZoneBanner {
  zoneId: number;
  bannerId: number;
}

export interface BannerCandidate extends Banner {
  campaign: Campaign;
}

export interface AdHourlyStat {
  bannerId: number;
  day: string;
  hour: number;
  impressions: number;
  clicks: number;
  views: number;
}
