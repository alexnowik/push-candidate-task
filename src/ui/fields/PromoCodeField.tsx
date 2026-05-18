import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';

import { PROMO_SEAT_BONUS, isValidPromoCodeFormat } from '@/domain/subscription';
import { formatReconcileNotice, useReconcileDependents } from '@/form/useReconcileDependents';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

import { FieldRow } from '../shared/FieldRow';
import { InlineNotice } from '../shared/InlineNotice';
import { StatusBadge } from '../shared/StatusBadge';

// Subscribes only to: `promoCode` (own). The +PROMO_SEAT_BONUS effect on
// seatCount bounds is computed in SeatCountField, which subscribes to
// promoCode independently — see README.
export function PromoCodeField() {
  const { control } = useFormContext<SubscriptionFormValues>();
  const { field, fieldState } = useController({ control, name: 'promoCode' });
  const reconcile = useReconcileDependents();
  const [notice, setNotice] = useState<string | null>(null);

  // Normalize to upper-case eagerly so the format check matches what the user sees.
  // When the promo flips between applied/not-applied, the max seat bound shifts
  // by PROMO_SEAT_BONUS — reconcile so a previously inflated seatCount can't be
  // stranded above the new max (would otherwise raise a confusing error on a
  // field the user did not touch).
  const handleChangeText = useCallback(
    (text: string) => {
      const next = text.toUpperCase();
      const wasApplied = isValidPromoCodeFormat(field.value);
      const nowApplied = isValidPromoCodeFormat(next);
      field.onChange(next);
      if (wasApplied !== nowApplied) {
        setNotice(formatReconcileNotice(reconcile({ promoCode: next })));
      }
    },
    [field, reconcile],
  );

  const isApplied = useMemo(() => isValidPromoCodeFormat(field.value), [field.value]);

  return (
    <FieldRow
      label="Promo code"
      hint={`Optional. Format AB1234 grants +${PROMO_SEAT_BONUS} max seats.`}
      error={fieldState.error?.message}
    >
      <TextInput
        value={field.value}
        onChangeText={handleChangeText}
        onBlur={field.onBlur}
        autoCapitalize="characters"
        autoCorrect={false}
        // Promo format is fixed-length (AB1234), so the cap is the format itself.
        maxLength={6}
        style={styles.input}
        accessibilityLabel="Promo code"
        placeholder="AB1234"
      />
      {isApplied ? (
        <View style={styles.statusRow}>
          <StatusBadge tone="success" label={`✓ Promo applied — +${PROMO_SEAT_BONUS} max seats`} />
        </View>
      ) : null}
      {notice ? <InlineNotice message={notice} /> : null}
    </FieldRow>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#cfd4dc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
  },
  statusRow: { marginTop: 8 },
});
