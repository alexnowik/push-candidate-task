import type { AddOnId } from './catalog';
import { isStorageAddOnId } from './catalog';
import type { BillingCycle } from './billingCycle';
import { getAddOnCountCap, getAllowedAddOnIds, getSeatBounds } from './rules';
import type { Tier } from './tiers';

export type SubscriptionState = Readonly<{
  tier: Tier;
  billingCycle: BillingCycle;
  seatCount: number;
  addOnIds: ReadonlyArray<AddOnId>;
  promoCode: string;
}>;

export type ReconciledDependents = Readonly<{
  seatCount: number;
  addOnIds: ReadonlyArray<AddOnId>;
}>;

// Returns the dependent fields (seatCount, addOnIds) coerced to be valid
// against (tier, billingCycle, promoCode). Pure; the caller decides whether
// to commit the result (e.g. via RHF setValue) by comparing with current.
//
// This exists so discrete plan changes can never produce an impossible form
// state — the best validation error is the one that never occurs.
export function reconcileDependents(state: SubscriptionState): ReconciledDependents {
  const bounds = getSeatBounds(state);
  const startSeatCount = Number.isFinite(state.seatCount) ? state.seatCount : bounds.min;
  const seatCount = clamp(startSeatCount, bounds.min, bounds.max);

  const pool = new Set(getAllowedAddOnIds(state));
  const cap = getAddOnCountCap(state);
  const addOnIds: AddOnId[] = [];
  let hasStorage = false;
  for (const id of state.addOnIds) {
    if (!pool.has(id) || addOnIds.includes(id) || addOnIds.length >= cap) {
      continue;
    }
    if (isStorageAddOnId(id)) {
      if (hasStorage) continue;
      hasStorage = true;
    }
    addOnIds.push(id);
  }

  return { seatCount, addOnIds };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
