import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

import {
  ADD_ON_IDS,
  BILLING_CYCLES,
  TIERS,
  findAddOnsOutsidePool,
  findConflictingStorageAddOnIds,
  findDuplicateAddOnIds,
  getAddOnCountCap,
  getSeatBounds,
  isAcceptablePromoInput,
  isSeatCountInBounds,
} from '@/domain/subscription';

export type SubscriptionValidationContext = Readonly<{
  isAcceptablePromoInput: typeof isAcceptablePromoInput;
  getSeatBounds: typeof getSeatBounds;
  isSeatCountInBounds: typeof isSeatCountInBounds;
  findDuplicateAddOnIds: typeof findDuplicateAddOnIds;
  findAddOnsOutsidePool: typeof findAddOnsOutsidePool;
  findConflictingStorageAddOnIds: typeof findConflictingStorageAddOnIds;
  getAddOnCountCap: typeof getAddOnCountCap;
}>;

export const subscriptionValidationContext: SubscriptionValidationContext = {
  isAcceptablePromoInput,
  getSeatBounds,
  isSeatCountInBounds,
  findDuplicateAddOnIds,
  findAddOnsOutsidePool,
  findConflictingStorageAddOnIds,
  getAddOnCountCap,
};

// All business rules live in the domain layer; this schema only orchestrates
// them. The resolver builds the same schema with the current RHF context, so
// tests and UI validation exercise one coherent contract.
export function createSubscriptionSchema(context: SubscriptionValidationContext) {
  return z
    .object({
      tier: z.enum(TIERS),
      billingCycle: z.enum(BILLING_CYCLES),
      seatCount: z
        .number({ invalid_type_error: 'Seat count is required' })
        .int('Seat count must be a whole number')
        .positive('Seat count must be at least 1'),
      addOnIds: z.array(z.enum(ADD_ON_IDS)),
      promoCode: z.string(),
    })
    .superRefine((data, ctx) => {
      // ── promoCode ────────────────────────────────────────────────────────
      // Validate format first. The seat-bounds branch below reads the promo
      // bonus through the domain, which gates the bonus on the same predicate,
      // so a malformed code never silently inflates the seat cap.
      if (!context.isAcceptablePromoInput(data.promoCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['promoCode'],
          message: 'Promo code must look like AB1234 (two letters, four digits)',
        });
      }

      // ── seatCount ────────────────────────────────────────────────────────
      const bounds = context.getSeatBounds({
        tier: data.tier,
        billingCycle: data.billingCycle,
        promoCode: data.promoCode,
      });
      if (!context.isSeatCountInBounds(data.seatCount, bounds)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['seatCount'],
          message: `Seat count must be between ${bounds.min} and ${bounds.max} for this tier and billing cycle`,
        });
      }

      // ── addOnIds ─────────────────────────────────────────────────────────
      // Ordering matters and is deliberate:
      //   1. duplicates      → suppresses pool/cap checks (the input is malformed)
      //   2. pool membership → more specific than count, so the user sees it first
      //   3. storage choice  → storage_100 and storage_500 are alternatives
      //   4. count cap       → only meaningful once the selection is in-pool
      const duplicates = context.findDuplicateAddOnIds(data.addOnIds);
      if (duplicates.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addOnIds'],
          message: `Duplicate add-ons: ${duplicates.join(', ')}`,
        });
        return;
      }

      const addOnContext = { tier: data.tier, billingCycle: data.billingCycle };
      const outsidePool = context.findAddOnsOutsidePool(data.addOnIds, addOnContext);
      if (outsidePool.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addOnIds'],
          message: `Not available for this tier and billing cycle: ${outsidePool.join(', ')}`,
        });
        return;
      }

      const storageConflicts = context.findConflictingStorageAddOnIds(data.addOnIds);
      if (storageConflicts.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addOnIds'],
          message: 'Choose either 100 GB storage or 500 GB storage, not both',
        });
        return;
      }

      const cap = context.getAddOnCountCap(addOnContext);
      if (data.addOnIds.length > cap) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addOnIds'],
          message: `Select at most ${cap} add-on${cap === 1 ? '' : 's'} for this tier and billing cycle`,
        });
      }
    });
}

export const subscriptionSchema = createSubscriptionSchema(subscriptionValidationContext);

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

export const subscriptionResolver: Resolver<
  SubscriptionFormValues,
  SubscriptionValidationContext
> = (values, context, options) => {
  const schema = createSubscriptionSchema(context ?? subscriptionValidationContext);
  return zodResolver(schema, undefined, { mode: 'sync' })(values, context, options);
};
