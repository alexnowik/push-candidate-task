import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

// Defaults are chosen so the form is valid on first paint: basic/monthly with
// the minimum seat count, no add-ons, no promo. The default-valid test in
// subscriptionSchema.test.ts pins this contract.
export const DEFAULT_SUBSCRIPTION_VALUES: SubscriptionFormValues = {
  tier: 'basic',
  billingCycle: 'monthly',
  seatCount: 1,
  addOnIds: [],
  promoCode: '',
};
