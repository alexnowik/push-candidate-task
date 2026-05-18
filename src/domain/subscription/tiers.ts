export const TIERS = ['basic', 'pro', 'enterprise'] as const;

export type Tier = (typeof TIERS)[number];

const TIER_LABELS: Readonly<Record<Tier, string>> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export function getTierLabel(tier: Tier): string {
  return TIER_LABELS[tier];
}
