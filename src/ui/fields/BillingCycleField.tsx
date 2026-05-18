import { useCallback, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { BILLING_CYCLES, getBillingCycleLabel, type BillingCycle } from '@/domain/subscription';
import { useReconcileDependents } from '@/form/useReconcileDependents';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

import { FieldRow } from '../shared/FieldRow';
import { SegmentedControl, type SegmentedOption } from '../shared/SegmentedControl';

// Subscribes only to: `billingCycle` (own).
export function BillingCycleField() {
  const { control } = useFormContext<SubscriptionFormValues>();
  const { field, fieldState } = useController({ control, name: 'billingCycle' });
  const reconcile = useReconcileDependents();

  const options = useMemo<ReadonlyArray<SegmentedOption<BillingCycle>>>(
    () => BILLING_CYCLES.map((cycle) => ({ value: cycle, label: getBillingCycleLabel(cycle) })),
    [],
  );

  // On a discrete plan change, reconcile seatCount and addOnIds against the
  // new billing cycle so the form cannot enter an impossible state.
  const handleChange = useCallback(
    (next: BillingCycle) => {
      field.onChange(next);
      reconcile({ billingCycle: next });
    },
    [field, reconcile],
  );

  return (
    <FieldRow label="Billing cycle" error={fieldState.error?.message}>
      <SegmentedControl
        value={field.value}
        options={options}
        onChange={handleChange}
        accessibilityLabel="Billing cycle"
      />
    </FieldRow>
  );
}
