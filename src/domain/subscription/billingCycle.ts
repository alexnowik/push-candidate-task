export const BILLING_CYCLES = ['monthly', 'annual'] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

const BILLING_CYCLE_LABELS: Readonly<Record<BillingCycle, string>> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

export function getBillingCycleLabel(cycle: BillingCycle): string {
  return BILLING_CYCLE_LABELS[cycle];
}
