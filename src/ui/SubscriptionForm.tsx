import { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormProvider } from 'react-hook-form';

import {
  PROMO_SEAT_BONUS,
  getAddOnLabel,
  getBillingCycleLabel,
  getTierLabel,
  isValidPromoCodeFormat,
} from '@/domain/subscription';
import { useSubscriptionForm } from '@/form/useSubscriptionForm';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

import { AddOnsField } from './fields/AddOnsField';
import { BillingCycleField } from './fields/BillingCycleField';
import { PromoCodeField } from './fields/PromoCodeField';
import { SeatCountField } from './fields/SeatCountField';
import { TierField } from './fields/TierField';
import { PrimaryButton } from './shared/PrimaryButton';

// The root holds RHF state once. It does NOT call `watch()` — every field
// subscribes for itself via useController/useWatch, so this component does
// not re-render on field changes.
export function SubscriptionForm() {
  const methods = useSubscriptionForm();

  const handleValid = useCallback((data: SubscriptionFormValues) => {
    Alert.alert('Subscription summary', formatSubscriptionSummary(data));
  }, []);

  const handleSubmit = methods.handleSubmit(handleValid);

  return (
    <FormProvider {...methods}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Configure your subscription</Text>
          <Text style={styles.subtitle}>Choose a tier, billing cycle, seats, and add-ons.</Text>
        </View>

        <TierField />
        <BillingCycleField />
        <SeatCountField />
        <AddOnsField />
        <PromoCodeField />

        <PrimaryButton label="Submit" onPress={handleSubmit} />
      </ScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 4 },
});

function formatSubscriptionSummary(data: SubscriptionFormValues): string {
  const addOns =
    data.addOnIds.length > 0
      ? data.addOnIds.map((id) => `• ${getAddOnLabel(id)}`).join('\n')
      : 'None';
  const promo = isValidPromoCodeFormat(data.promoCode)
    ? `${data.promoCode} (+${PROMO_SEAT_BONUS} max seats)`
    : 'None';

  return [
    `Tier: ${getTierLabel(data.tier)}`,
    `Billing: ${getBillingCycleLabel(data.billingCycle)}`,
    `Seats: ${data.seatCount}`,
    `Promo: ${promo}`,
    '',
    'Add-ons:',
    addOns,
  ].join('\n');
}
