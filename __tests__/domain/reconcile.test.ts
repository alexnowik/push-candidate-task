import { reconcileDependents, type SubscriptionState } from '@/domain/subscription';

function state(overrides: Partial<SubscriptionState>): SubscriptionState {
  return {
    tier: 'basic',
    billingCycle: 'monthly',
    seatCount: 1,
    addOnIds: [],
    promoCode: '',
    ...overrides,
  };
}

describe('reconcileDependents — seatCount clamping', () => {
  test('clamps up to new min when below bounds (e.g. basic→pro annual)', () => {
    // Pro annual is 21-90; carrying over a Basic-shaped seatCount of 10 must lift to 21.
    expect(reconcileDependents(state({ tier: 'pro', billingCycle: 'annual', seatCount: 10 }))
      .seatCount).toBe(21);
  });

  test('clamps down to new max when above bounds (e.g. enterprise→basic monthly)', () => {
    expect(reconcileDependents(state({ tier: 'basic', billingCycle: 'monthly', seatCount: 50 }))
      .seatCount).toBe(10);
  });

  test('leaves seatCount untouched when already in bounds', () => {
    expect(reconcileDependents(state({ tier: 'pro', billingCycle: 'monthly', seatCount: 12 }))
      .seatCount).toBe(12);
  });

  test('NaN seatCount becomes the new minimum (recovers from cleared input)', () => {
    expect(reconcileDependents(state({ seatCount: Number.NaN })).seatCount).toBe(1);
  });

  test('valid promo extends the clamp ceiling', () => {
    // Basic monthly base max=10, +10 promo → 20; seatCount=15 stays valid.
    expect(
      reconcileDependents(state({ tier: 'basic', billingCycle: 'monthly', seatCount: 15, promoCode: 'AB1234' }))
        .seatCount,
    ).toBe(15);
  });

  test('invalid promo does not extend the clamp ceiling', () => {
    expect(
      reconcileDependents(state({ tier: 'basic', billingCycle: 'monthly', seatCount: 15, promoCode: 'bad' }))
        .seatCount,
    ).toBe(10);
  });
});

describe('reconcileDependents — addOnIds pruning', () => {
  test('prunes ids not in the new monthly pool', () => {
    expect(
      reconcileDependents(
        state({
          tier: 'basic',
          billingCycle: 'monthly',
          addOnIds: ['storage_100', 'support_dedicated', 'api_access'],
        }),
      ).addOnIds,
    ).toEqual(['storage_100']);
  });

  test('annual cycle keeps a non-conflicting catalog selection unchanged', () => {
    const selected = ['storage_500', 'support_priority', 'support_dedicated', 'api_access'] as const;
    expect(
      reconcileDependents(
        state({ tier: 'basic', billingCycle: 'annual', seatCount: 5, addOnIds: [...selected] }),
      )
        .addOnIds,
    ).toEqual(selected);
  });

  test('switching monthly basic → monthly pro keeps pro-allowed items, drops the rest', () => {
    expect(
      reconcileDependents(
        state({
          tier: 'pro',
          billingCycle: 'monthly',
          seatCount: 10,
          addOnIds: ['storage_100', 'support_dedicated', 'api_access'],
        }),
      ).addOnIds,
    ).toEqual(['storage_100', 'api_access']);
  });

  test('trims in-pool add-ons to the new cap while preserving order', () => {
    expect(
      reconcileDependents(
        state({
          tier: 'pro',
          billingCycle: 'monthly',
          seatCount: 10,
          addOnIds: ['storage_100', 'support_priority', 'api_access'],
        }),
      ).addOnIds,
    ).toEqual(['storage_100', 'support_priority']);
  });

  test('keeps only one storage add-on when a stale state contains both', () => {
    expect(
      reconcileDependents(
        state({
          tier: 'enterprise',
          billingCycle: 'annual',
          seatCount: 101,
          addOnIds: ['storage_100', 'storage_500', 'api_access'],
        }),
      ).addOnIds,
    ).toEqual(['storage_100', 'api_access']);
  });
});
