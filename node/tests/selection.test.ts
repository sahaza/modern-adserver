import { describe, expect, it } from 'vitest';
import { effectiveWeight, isEligible, selectBanner } from '../src/domain/selection.js';
import type { BannerCandidate } from '../src/domain/types.js';

function candidate(overrides: Partial<BannerCandidate> = {}): BannerCandidate {
  return {
    id: 1,
    campaignId: 1,
    name: 'Banner 1',
    active: true,
    status: 'active',
    weight: 1,
    width: 728,
    height: 90,
    imageUrl: 'https://example.com/b.png',
    clickUrl: 'https://example.com/',
    htmlBody: null,
    campaign: {
      id: 1,
      advertiserId: 1,
      name: 'Campaign 1',
      active: true,
      status: 'active',
      startDate: null,
      endDate: null,
      weight: 1,
    },
    ...overrides,
  };
}

const now = new Date('2026-01-15T12:00:00Z');

describe('isEligible', () => {
  it('accepts an active banner in an active campaign without dates', () => {
    expect(isEligible(candidate(), now)).toBe(true);
  });

  it('rejects an inactive banner', () => {
    expect(isEligible(candidate({ active: false }), now)).toBe(false);
  });

  it('rejects a banner in an inactive campaign', () => {
    const c = candidate();
    c.campaign.active = false;
    expect(isEligible(c, now)).toBe(false);
  });

  it('rejects before the campaign start date and after the end date', () => {
    const c = candidate();
    c.campaign.startDate = new Date('2026-02-01T00:00:00Z');
    expect(isEligible(c, now)).toBe(false);
    c.campaign.startDate = new Date('2026-01-01T00:00:00Z');
    c.campaign.endDate = new Date('2026-01-10T00:00:00Z');
    expect(isEligible(c, now)).toBe(false);
    c.campaign.endDate = new Date('2026-02-01T00:00:00Z');
    expect(isEligible(c, now)).toBe(true);
  });
});

describe('selectBanner', () => {
  it('returns null when no candidates are eligible', () => {
    expect(selectBanner([], now)).toBeNull();
    expect(selectBanner([candidate({ active: false })], now)).toBeNull();
  });

  it('returns the only eligible candidate', () => {
    const c = candidate();
    expect(selectBanner([c], now, () => 0.99)).toBe(c);
  });

  it('picks according to weights', () => {
    const heavy = candidate({ id: 2, name: 'heavy', weight: 100 });
    const light = candidate({ id: 1, name: 'light', weight: 1 });
    expect(selectBanner([heavy, light], now, () => 0.5)?.id).toBe(2);
    expect(selectBanner([heavy, light], now, () => 0.99)?.id).toBe(2);
    expect(selectBanner([heavy, light], now, () => 0.999)?.id).toBe(1);
    expect(selectBanner([light, heavy], now, () => 0.001)?.id).toBe(1);
  });

  it('treats a zero campaign weight as zero share', () => {
    const zero = candidate({ id: 3 });
    zero.campaign.weight = 0;
    const normal = candidate({ id: 4 });
    for (const roll of [0, 0.25, 0.5, 0.99]) {
      expect(selectBanner([zero, normal], now, () => roll)?.id).toBe(4);
    }
  });

  it('multiplies campaign and banner weights', () => {
    const c = candidate({ id: 5, weight: 10 });
    c.campaign.weight = 5;
    expect(effectiveWeight(c)).toBe(50);
  });
});
