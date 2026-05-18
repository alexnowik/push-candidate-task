import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormProvider } from 'react-hook-form';

import {
  PROMO_SEAT_BONUS,
  getAddOnLabel,
  getBillingCycleLabel,
  getTierLabel,
  isValidPromoCodeFormat,
} from '@/domain/subscription';
import { DEFAULT_SUBSCRIPTION_VALUES } from '@/form/defaultValues';
import { useSubscriptionForm } from '@/form/useSubscriptionForm';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

import { AddOnsField } from './fields/AddOnsField';
import { BillingCycleField } from './fields/BillingCycleField';
import { PromoCodeField } from './fields/PromoCodeField';
import { SeatCountField } from './fields/SeatCountField';
import { TierField } from './fields/TierField';
import { InlineNotice } from './shared/InlineNotice';
import { PrimaryButton } from './shared/PrimaryButton';

// The root holds RHF state once. It does NOT call `watch()` — every field
// subscribes for itself via useController/useWatch, so this component does
// not re-render on field changes.
export function SubscriptionForm() {
  const methods = useSubscriptionForm();
  const [submittedValues, setSubmittedValues] = useState<SubscriptionFormValues | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting = methods.formState.isSubmitting;

  const handleValid = useCallback(async (data: SubscriptionFormValues) => {
    setSubmittedValues(null);
    setSubmitError(null);
    await delay(700);
    setSubmittedValues(data);
  }, []);
  const handleInvalid = useCallback(() => {
    setSubmittedValues(null);
    setSubmitError('Please fix the highlighted fields before submitting.');
  }, []);
  const handleReset = useCallback(() => {
    methods.reset(DEFAULT_SUBSCRIPTION_VALUES);
    setSubmittedValues(null);
    setSubmitError(null);
  }, [methods]);

  const handleSubmit = methods.handleSubmit(handleValid, handleInvalid);

  return (
    <FormProvider {...methods}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Configure your subscription</Text>
          <Text style={styles.subtitle}>Choose a tier, billing cycle, seats, and add-ons.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <TierField />
          <BillingCycleField />
          <SeatCountField />
          <PromoCodeField />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add-ons</Text>
          <AddOnsField />
        </View>

        <View style={styles.actions}>
          <View style={styles.submitAction}>
            <PrimaryButton
              label={isSubmitting ? 'Saving...' : 'Submit'}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
          </View>
          <ResetButton onPress={handleReset} disabled={isSubmitting} />
        </View>
        {isSubmitting ? <ProgressNotice /> : null}
        {submitError ? <InlineNotice message={submitError} tone="error" /> : null}
        {submittedValues ? <SubmissionSummary values={submittedValues} /> : null}
      </ScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 4 },
  section: { marginBottom: 8 },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#57606a',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitAction: { flex: 1 },
  resetButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  resetButtonDisabled: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8fa',
    opacity: 0.6,
  },
  resetText: { color: '#1f2328', fontSize: 15, fontWeight: '600' },
  progress: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bf8700',
    borderRadius: 8,
    backgroundColor: '#fff8c5',
    padding: 12,
  },
  progressText: { color: '#5f4b00', fontSize: 14, fontWeight: '600' },
  summary: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1e8e3e',
    borderRadius: 8,
    backgroundColor: '#e6f4ea',
    padding: 14,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#1e4620', marginBottom: 8 },
  summaryLine: { fontSize: 14, color: '#1f2328', marginTop: 2 },
  summaryLabel: { fontWeight: '700' },
  summaryAddOns: { marginTop: 8 },
});

type ResetButtonProps = Readonly<{
  onPress: () => void;
  disabled: boolean;
}>;

function ResetButton({ onPress, disabled }: ResetButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={disabled ? styles.resetButtonDisabled : styles.resetButton}
      accessibilityRole="button"
    >
      <Text style={styles.resetText}>Reset</Text>
    </Pressable>
  );
}

function ProgressNotice() {
  return (
    <View style={styles.progress} accessibilityLiveRegion="polite">
      <Text style={styles.progressText}>Saving configuration...</Text>
    </View>
  );
}

type SubmissionSummaryProps = Readonly<{ values: SubscriptionFormValues }>;

function SubmissionSummary({ values }: SubmissionSummaryProps) {
  const addOns = formatAddOns(values);
  const promo = isValidPromoCodeFormat(values.promoCode)
    ? `${values.promoCode} (+${PROMO_SEAT_BONUS} max seats)`
    : 'None';

  return (
    <View style={styles.summary} accessibilityRole="summary">
      <Text style={styles.summaryTitle}>Last valid configuration</Text>
      <Text style={styles.summaryLine}>
        <Text style={styles.summaryLabel}>Tier: </Text>
        {getTierLabel(values.tier)}
      </Text>
      <Text style={styles.summaryLine}>
        <Text style={styles.summaryLabel}>Billing: </Text>
        {getBillingCycleLabel(values.billingCycle)}
      </Text>
      <Text style={styles.summaryLine}>
        <Text style={styles.summaryLabel}>Seats: </Text>
        {values.seatCount}
      </Text>
      <Text style={styles.summaryLine}>
        <Text style={styles.summaryLabel}>Promo: </Text>
        {promo}
      </Text>
      <View style={styles.summaryAddOns}>
        <Text style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Add-ons: </Text>
          {addOns}
        </Text>
      </View>
    </View>
  );
}

function formatAddOns(data: SubscriptionFormValues): string {
  const addOns =
    data.addOnIds.length > 0
      ? data.addOnIds.map((id) => getAddOnLabel(id)).join(', ')
      : 'None';
  return addOns;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
