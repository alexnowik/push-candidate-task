import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { reconcileDependents } from '@/domain/subscription';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

type ParentChange = Readonly<
  Partial<Pick<SubscriptionFormValues, 'tier' | 'billingCycle' | 'promoCode'>>
>;

export type ReconcileSummary = Readonly<{
  seatCountAdjusted: boolean;
  addOnsAdjusted: boolean;
  seatCount: number;
  removedAddOnCount: number;
}>;

// Called from a parent-field onChange handler with the value about to be
// committed. Clamps seatCount and prunes addOnIds so the form cannot enter
// an impossible state on a single user action. Touches RHF only when the
// reconciled value actually differs from the current one.
export function useReconcileDependents(): (change: ParentChange) => ReconcileSummary | null {
  const { getValues, setValue } = useFormContext<SubscriptionFormValues>();

  return useCallback(
    (change) => {
      const current = getValues();
      const next = { ...current, ...change };
      const reconciled = reconcileDependents(next);
      const seatCountAdjusted = reconciled.seatCount !== current.seatCount;
      const addOnsAdjusted = reconciled.addOnIds.length !== current.addOnIds.length;

      if (seatCountAdjusted) {
        setValue('seatCount', reconciled.seatCount, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      // reconcileDependents is monotonic — it only prunes (pool), dedupes,
      // and trims (cap). It preserves order of the original. So a length
      // match is sufficient to conclude nothing changed.
      if (addOnsAdjusted) {
        setValue('addOnIds', [...reconciled.addOnIds], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      if (!seatCountAdjusted && !addOnsAdjusted) return null;
      return {
        seatCountAdjusted,
        addOnsAdjusted,
        seatCount: reconciled.seatCount,
        removedAddOnCount: current.addOnIds.length - reconciled.addOnIds.length,
      };
    },
    [getValues, setValue],
  );
}

export function formatReconcileNotice(summary: ReconcileSummary | null): string | null {
  if (!summary) return null;
  const parts: string[] = [];
  if (summary.seatCountAdjusted) parts.push(`seats set to ${summary.seatCount}`);
  if (summary.addOnsAdjusted) {
    const suffix = summary.removedAddOnCount === 1 ? 'add-on removed' : 'add-ons removed';
    parts.push(`${summary.removedAddOnCount} ${suffix}`);
  }
  return `Configuration adjusted: ${parts.join(', ')}.`;
}
