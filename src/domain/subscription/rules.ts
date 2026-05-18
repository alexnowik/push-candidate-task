import { ADD_ON_IDS, isStorageAddOnId, type AddOnId } from './catalog';
import type { BillingCycle } from './billingCycle';
import { getPromoSeatBonus } from './promoCode';
import type { Tier } from './tiers';

export type SeatBounds = Readonly<{ min: number; max: number }>;

// Monthly bounds intentionally overlap across tiers.
const MONTHLY_SEAT_BOUNDS: Readonly<Record<Tier, SeatBounds>> = {
  basic: { min: 1, max: 10 },
  pro: { min: 5, max: 18 },
  enterprise: { min: 10, max: 500 },
};

// Annual bounds are intentionally disjoint.
const ANNUAL_SEAT_BOUNDS: Readonly<Record<Tier, SeatBounds>> = {
  basic: { min: 1, max: 20 },
  pro: { min: 21, max: 90 },
  enterprise: { min: 101, max: 1000 },
};

const MONTHLY_ADD_ON_POOL: Readonly<Record<Tier, ReadonlyArray<AddOnId>>> = {
  basic: ['storage_100', 'support_priority'],
  pro: ['storage_100', 'storage_500', 'support_priority', 'api_access'],
  enterprise: ['storage_100', 'storage_500', 'support_priority', 'support_dedicated', 'api_access'],
};

const MONTHLY_ADD_ON_CAP: Readonly<Record<Tier, number>> = {
  basic: 1,
  pro: 2,
  enterprise: 5,
};

export type SeatBoundsInput = Readonly<{
  tier: Tier;
  billingCycle: BillingCycle;
  promoCode: string;
}>;

// Always read tier together with billingCycle: per the spec, monthly ranges
// overlap across tiers, so any cache keyed only on billingCycle would be wrong.
export function getSeatBounds(input: SeatBoundsInput): SeatBounds {
  const base =
    input.billingCycle === 'monthly'
      ? MONTHLY_SEAT_BOUNDS[input.tier]
      : ANNUAL_SEAT_BOUNDS[input.tier];
  const bonus = getPromoSeatBonus(input.promoCode);
  return { min: base.min, max: base.max + bonus };
}

export type AddOnContext = Readonly<{
  tier: Tier;
  billingCycle: BillingCycle;
}>;

export function getAllowedAddOnIds(context: AddOnContext): ReadonlyArray<AddOnId> {
  if (context.billingCycle === 'annual') return ADD_ON_IDS;
  return MONTHLY_ADD_ON_POOL[context.tier];
}

export function getAddOnCountCap(context: AddOnContext): number {
  if (context.billingCycle === 'annual') return ADD_ON_IDS.length;
  return MONTHLY_ADD_ON_CAP[context.tier];
}

export function isSeatCountInBounds(seatCount: number, bounds: SeatBounds): boolean {
  return Number.isInteger(seatCount) && seatCount >= bounds.min && seatCount <= bounds.max;
}

export function findDuplicateAddOnIds(ids: ReadonlyArray<AddOnId>): ReadonlyArray<AddOnId> {
  const seen = new Set<AddOnId>();
  const duplicates = new Set<AddOnId>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  }
  return [...duplicates];
}

export function findConflictingStorageAddOnIds(
  ids: ReadonlyArray<AddOnId>,
): ReadonlyArray<AddOnId> {
  const selectedStorage = ids.filter(isStorageAddOnId);
  return selectedStorage.length > 1 ? selectedStorage : [];
}

export function findAddOnsOutsidePool(
  ids: ReadonlyArray<AddOnId>,
  context: AddOnContext,
): ReadonlyArray<AddOnId> {
  const pool = new Set(getAllowedAddOnIds(context));
  return ids.filter((id) => !pool.has(id));
}
