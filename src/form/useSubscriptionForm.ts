import { useForm, type UseFormReturn } from 'react-hook-form';

import {
  subscriptionResolver,
  subscriptionValidationContext,
  type SubscriptionFormValues,
  type SubscriptionValidationContext,
} from '@/validation/subscriptionSchema';

import { DEFAULT_SUBSCRIPTION_VALUES } from './defaultValues';

// The form layer owns RHF configuration in one place so the UI does not have
// to know about resolver wiring, validation mode, or default values. Swapping
// validation libraries or changing the "when errors appear" policy happens
// here, not in the screen.
export function useSubscriptionForm(): UseFormReturn<
  SubscriptionFormValues,
  SubscriptionValidationContext
> {
  return useForm<SubscriptionFormValues, SubscriptionValidationContext>({
    resolver: subscriptionResolver,
    context: subscriptionValidationContext,
    defaultValues: DEFAULT_SUBSCRIPTION_VALUES,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });
}
