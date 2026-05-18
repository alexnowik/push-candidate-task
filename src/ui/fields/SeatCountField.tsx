import { useCallback, useMemo } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useController, useFormContext, useWatch } from 'react-hook-form';

import { PROMO_SEAT_BONUS, getSeatBounds, isValidPromoCodeFormat } from '@/domain/subscription';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

import { FieldRow } from '../shared/FieldRow';

// Subscribes to: `seatCount` (own), `tier`, `billingCycle`, `promoCode`.
// Does not subscribe to `addOnIds` — re-render isolation verified via
// useWatch's scoped `name` argument.
export function SeatCountField() {
  const { control } = useFormContext<SubscriptionFormValues>();
  const { field, fieldState } = useController({ control, name: 'seatCount' });

  const tier = useWatch({ control, name: 'tier' });
  const billingCycle = useWatch({ control, name: 'billingCycle' });
  const promoCode = useWatch({ control, name: 'promoCode' });

  const bounds = useMemo(
    () => getSeatBounds({ tier, billingCycle, promoCode }),
    [tier, billingCycle, promoCode],
  );
  const promoApplied = useMemo(() => isValidPromoCodeFormat(promoCode), [promoCode]);

  const hint = promoApplied
    ? `Allowed range: ${bounds.min}–${bounds.max} (includes +${PROMO_SEAT_BONUS} from promo)`
    : `Allowed range for this tier and billing cycle: ${bounds.min}–${bounds.max}`;

  const handleChangeText = useCallback(
    (text: string) => {
      // Empty input becomes NaN so the schema's int/positive checks fire,
      // rather than silently coercing to 0.
      const parsed = text === '' ? Number.NaN : Number(text);
      field.onChange(parsed);
    },
    [field],
  );

  return (
    <FieldRow label="Seats" hint={hint} error={fieldState.error?.message}>
      <TextInput
        value={Number.isFinite(field.value) ? String(field.value) : ''}
        onChangeText={handleChangeText}
        onBlur={field.onBlur}
        keyboardType="number-pad"
        // Hard length cap. We deliberately do NOT live-clamp by value during
        // typing — see README "Input-level guardrails".
        maxLength={4}
        style={styles.input}
        accessibilityLabel="Seat count"
      />
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
});
