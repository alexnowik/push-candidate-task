import { useCallback, useMemo, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { TIERS, getTierLabel, type Tier } from '@/domain/subscription';
import { type ReconcileSummary, useReconcileDependents } from '@/form/useReconcileDependents';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

import { FieldRow } from '../shared/FieldRow';
import { InlineNotice } from '../shared/InlineNotice';
import { SegmentedControl, type SegmentedOption } from '../shared/SegmentedControl';

// Subscribes only to: `tier` (own). Does not re-render on changes to
// billingCycle, seatCount, addOnIds, or promoCode.
export function TierField() {
  const { control } = useFormContext<SubscriptionFormValues>();
  const { field, fieldState } = useController({ control, name: 'tier' });
  const reconcile = useReconcileDependents();
  const [notice, setNotice] = useState<string | null>(null);

  const options = useMemo<ReadonlyArray<SegmentedOption<Tier>>>(
    () => TIERS.map((tier) => ({ value: tier, label: getTierLabel(tier) })),
    [],
  );

  // On a discrete plan change, reconcile seatCount and addOnIds against the
  // new tier so the form cannot enter an impossible state. See README.
  const handleChange = useCallback(
    (next: Tier) => {
      field.onChange(next);
      setNotice(formatReconcileNotice(reconcile({ tier: next })));
    },
    [field, reconcile],
  );

  return (
    <FieldRow label="Tier" error={fieldState.error?.message}>
      <SegmentedControl
        value={field.value}
        options={options}
        onChange={handleChange}
        accessibilityLabel="Subscription tier"
      />
      {notice ? <InlineNotice message={notice} /> : null}
    </FieldRow>
  );
}

function formatReconcileNotice(summary: ReconcileSummary | null): string | null {
  if (!summary) return null;
  const parts: string[] = [];
  if (summary.seatCountAdjusted) parts.push(`seats set to ${summary.seatCount}`);
  if (summary.addOnsAdjusted) {
    const suffix = summary.removedAddOnCount === 1 ? 'add-on removed' : 'add-ons removed';
    parts.push(`${summary.removedAddOnCount} ${suffix}`);
  }
  return `Configuration adjusted: ${parts.join(', ')}.`;
}
