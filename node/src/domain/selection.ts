import type { BannerCandidate } from './types.js';

export function isEligible(candidate: BannerCandidate, now: Date): boolean {
  if (!candidate.active || !candidate.campaign.active) {
    return false;
  }
  const { startDate, endDate } = candidate.campaign;
  if (startDate && now < startDate) {
    return false;
  }
  if (endDate && now > endDate) {
    return false;
  }
  return true;
}

export function effectiveWeight(candidate: BannerCandidate): number {
  const campaignWeight = Math.max(0, candidate.campaign.weight);
  const bannerWeight = Math.max(1, candidate.weight);
  return campaignWeight * bannerWeight;
}

export function selectBanner(
  candidates: BannerCandidate[],
  now: Date,
  random: () => number = Math.random,
): BannerCandidate | null {
  const eligible = candidates.filter((candidate) => isEligible(candidate, now));
  if (eligible.length === 0) {
    return null;
  }
  const weights = eligible.map(effectiveWeight);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) {
    return eligible[0] ?? null;
  }
  let roll = random() * total;
  for (let i = 0; i < eligible.length; i++) {
    const weight = weights[i] ?? 0;
    if (roll < weight) {
      return eligible[i] ?? null;
    }
    roll -= weight;
  }
  return eligible[eligible.length - 1] ?? null;
}
