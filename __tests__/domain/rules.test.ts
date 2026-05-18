import {
  ADD_ON_IDS,
  findAddOnsOutsidePool,
  findConflictingStorageAddOnIds,
  findDuplicateAddOnIds,
  getAddOnCountCap,
  getAllowedAddOnIds,
  getSeatBounds,
  isAcceptablePromoInput,
  isValidPromoCodeFormat,
  type AddOnId,
  type BillingCycle,
  type Tier,
} from '@/domain/subscription';

describe('getSeatBounds', () => {
  // Spec-defined values pinned as a table; bounds are NOT derived from this in
  // production code — see rules.ts for the canonical definitions.
  const noPromo = '';
  const cases: ReadonlyArray<{
    tier: Tier;
    cycle: BillingCycle;
    promo: string;
    expected: { min: number; max: number };
  }> = [
    { tier: 'basic', cycle: 'monthly', promo: noPromo, expected: { min: 1, max: 10 } },
    { tier: 'pro', cycle: 'monthly', promo: noPromo, expected: { min: 5, max: 18 } },
    { tier: 'enterprise', cycle: 'monthly', promo: noPromo, expected: { min: 10, max: 500 } },
    { tier: 'basic', cycle: 'annual', promo: noPromo, expected: { min: 1, max: 20 } },
    { tier: 'pro', cycle: 'annual', promo: noPromo, expected: { min: 21, max: 90 } },
    { tier: 'enterprise', cycle: 'annual', promo: noPromo, expected: { min: 101, max: 1000 } },
    // Promo bonus: +10 to the maximum only.
    { tier: 'basic', cycle: 'monthly', promo: 'AB1234', expected: { min: 1, max: 20 } },
    { tier: 'pro', cycle: 'annual', promo: 'ZZ9999', expected: { min: 21, max: 100 } },
    // Malformed promo grants no bonus.
    { tier: 'basic', cycle: 'monthly', promo: 'bad', expected: { min: 1, max: 10 } },
  ];

  test.each(cases)(
    'tier=$tier cycle=$cycle promo="$promo" → min=$expected.min max=$expected.max',
    ({ tier, cycle, promo, expected }) => {
      expect(getSeatBounds({ tier, billingCycle: cycle, promoCode: promo })).toEqual(expected);
    },
  );
});

describe('promo code format', () => {
  test.each([
    ['AB1234', true],
    ['ZZ0000', true],
    ['ab1234', false],
    ['A1B234', false],
    ['AB12345', false],
    ['AB123', false],
    ['', false],
  ])('isValidPromoCodeFormat(%p) === %p', (input, expected) => {
    expect(isValidPromoCodeFormat(input)).toBe(expected);
  });

  test('empty input is acceptable (promo is optional)', () => {
    expect(isAcceptablePromoInput('')).toBe(true);
    expect(isAcceptablePromoInput('AB1234')).toBe(true);
    expect(isAcceptablePromoInput('bad')).toBe(false);
  });
});

describe('add-on pool and cap', () => {
  test('annual cycle exposes the full catalog at the catalog-size cap for every tier', () => {
    for (const tier of ['basic', 'pro', 'enterprise'] as const) {
      expect(getAllowedAddOnIds({ tier, billingCycle: 'annual' })).toEqual(ADD_ON_IDS);
      expect(getAddOnCountCap({ tier, billingCycle: 'annual' })).toBe(ADD_ON_IDS.length);
    }
  });

  test('monthly basic exposes storage_100 and support_priority with cap 1', () => {
    expect(getAllowedAddOnIds({ tier: 'basic', billingCycle: 'monthly' })).toEqual([
      'storage_100',
      'support_priority',
    ]);
    expect(getAddOnCountCap({ tier: 'basic', billingCycle: 'monthly' })).toBe(1);
  });

  test('monthly pro pool excludes support_dedicated; cap is 2', () => {
    const pool = getAllowedAddOnIds({ tier: 'pro', billingCycle: 'monthly' });
    expect(pool).toContain('api_access');
    expect(pool).not.toContain('support_dedicated');
    expect(getAddOnCountCap({ tier: 'pro', billingCycle: 'monthly' })).toBe(2);
  });

  test('monthly enterprise covers the full catalog with cap 5', () => {
    expect(getAllowedAddOnIds({ tier: 'enterprise', billingCycle: 'monthly' })).toEqual(ADD_ON_IDS);
    expect(getAddOnCountCap({ tier: 'enterprise', billingCycle: 'monthly' })).toBe(5);
  });
});

describe('findDuplicateAddOnIds', () => {
  test('returns empty for unique selections', () => {
    expect(findDuplicateAddOnIds(['storage_100', 'api_access'])).toEqual([]);
  });

  test('returns each duplicated id once', () => {
    const ids: AddOnId[] = ['storage_100', 'storage_100', 'api_access', 'api_access', 'api_access'];
    expect([...findDuplicateAddOnIds(ids)].sort()).toEqual(['api_access', 'storage_100']);
  });
});

describe('findConflictingStorageAddOnIds', () => {
  test('flags mutually exclusive storage choices', () => {
    expect(findConflictingStorageAddOnIds(['storage_100', 'storage_500'])).toEqual([
      'storage_100',
      'storage_500',
    ]);
  });

  test('allows zero or one storage choice with service add-ons', () => {
    expect(findConflictingStorageAddOnIds(['storage_500', 'api_access'])).toEqual([]);
    expect(findConflictingStorageAddOnIds(['support_priority', 'api_access'])).toEqual([]);
  });
});

describe('findAddOnsOutsidePool', () => {
  test('flags monthly basic selection of support_dedicated', () => {
    const outside = findAddOnsOutsidePool(['support_dedicated'], {
      tier: 'basic',
      billingCycle: 'monthly',
    });
    expect(outside).toEqual(['support_dedicated']);
  });

  test('annual accepts everything for every tier', () => {
    for (const tier of ['basic', 'pro', 'enterprise'] as const) {
      expect(findAddOnsOutsidePool(ADD_ON_IDS, { tier, billingCycle: 'annual' })).toEqual([]);
    }
  });
});
