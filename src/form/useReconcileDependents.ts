import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { reconcileDependents } from '@/domain/subscription';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

type ParentChange = Readonly<
  Partial<Pick<SubscriptionFormValues, 'tier' | 'billingCycle' | 'promoCode'>>
>;

// Called from a parent-field onChange handler with the value about to be
// committed. Clamps seatCount and prunes addOnIds so the form cannot enter
// an impossible state on a single user action. Touches RHF only when the
// reconciled value actually differs from the current one.
export function useReconcileDependents(): (change: ParentChange) => void {
  const { getValues, setValue } = useFormContext<SubscriptionFormValues>();

  return useCallback(
    (change) => {
      const current = getValues();
      const next = { ...current, ...change };
      const reconciled = reconcileDependents(next);

      if (reconciled.seatCount !== current.seatCount) {
        setValue('seatCount', reconciled.seatCount, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      // reconcileDependents is monotonic — it only prunes (pool), dedupes,
      // and trims (cap). It preserves order of the original. So a length
      // match is sufficient to conclude nothing changed.
      if (reconciled.addOnIds.length !== current.addOnIds.length) {
        setValue('addOnIds', [...reconciled.addOnIds], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    },
    [getValues, setValue],
  );
}
