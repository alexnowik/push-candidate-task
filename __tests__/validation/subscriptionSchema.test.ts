import { DEFAULT_SUBSCRIPTION_VALUES } from '@/form/defaultValues';
import {
  subscriptionResolver,
  subscriptionSchema,
  subscriptionValidationContext,
  type SubscriptionFormValues,
} from '@/validation/subscriptionSchema';

function build(overrides: Partial<SubscriptionFormValues>): SubscriptionFormValues {
  return { ...DEFAULT_SUBSCRIPTION_VALUES, ...overrides };
}

function errorPaths(result: ReturnType<typeof subscriptionSchema.safeParse>): ReadonlyArray<string> {
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join('.'));
}

function issueMessages(result: ReturnType<typeof subscriptionSchema.safeParse>): ReadonlyArray<string> {
  if (result.success) return [];
  return result.error.issues.map((i) => i.message);
}

describe('subscriptionSchema — defaults', () => {
  test('default form values are valid', () => {
    const result = subscriptionSchema.safeParse(DEFAULT_SUBSCRIPTION_VALUES);
    expect(result.success).toBe(true);
  });
});

describe('subscriptionSchema — add-on rules', () => {
  test('duplicate add-on ids are rejected', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'enterprise',
        billingCycle: 'annual',
        seatCount: 101,
        addOnIds: ['storage_100', 'storage_100'],
      }),
    );
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('addOnIds');
  });

  test('monthly basic: rejects more than 1 add-on', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'basic',
        billingCycle: 'monthly',
        seatCount: 5,
        addOnIds: ['storage_100', 'support_priority'],
      }),
    );
    expect(result.success).toBe(false);
  });

  test('monthly basic: rejects out-of-pool add-on', () => {
    const result = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 5, addOnIds: ['storage_500'] }),
    );
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('addOnIds');
  });

  test('monthly pro: accepts api_access', () => {
    const result = subscriptionSchema.safeParse(
      build({ tier: 'pro', billingCycle: 'monthly', seatCount: 10, addOnIds: ['api_access'] }),
    );
    expect(result.success).toBe(true);
  });

  test('add-on order does not affect validity', () => {
    const forward = subscriptionSchema.safeParse(
      build({
        tier: 'pro',
        billingCycle: 'monthly',
        seatCount: 10,
        addOnIds: ['storage_500', 'api_access'],
      }),
    );
    const reversed = subscriptionSchema.safeParse(
      build({
        tier: 'pro',
        billingCycle: 'monthly',
        seatCount: 10,
        addOnIds: ['api_access', 'storage_500'],
      }),
    );

    expect(forward.success).toBe(true);
    expect(reversed.success).toBe(true);
  });

  test('monthly pro: rejects more than 2 add-ons', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'pro',
        billingCycle: 'monthly',
        seatCount: 10,
        addOnIds: ['storage_100', 'storage_500', 'api_access'],
      }),
    );
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('addOnIds');
  });

  test('monthly pro: rejects support_dedicated', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'pro',
        billingCycle: 'monthly',
        seatCount: 10,
        addOnIds: ['support_dedicated'],
      }),
    );
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('addOnIds');
  });

  test('annual: accepts every catalog category when storage choice is exclusive', () => {
    const nonConflictingCatalogSelection = [
      'storage_500',
      'support_priority',
      'support_dedicated',
      'api_access',
    ] as const;
    const annualCases = [
      { tier: 'basic', seats: 10 },
      { tier: 'pro', seats: 30 },
      { tier: 'enterprise', seats: 101 },
    ] as const;
    for (const { tier, seats } of annualCases) {
      const result = subscriptionSchema.safeParse(
        build({
          tier,
          billingCycle: 'annual',
          seatCount: seats,
          addOnIds: [...nonConflictingCatalogSelection],
        }),
      );
      expect(result.success).toBe(true);
    }
  });

  test('storage add-ons are mutually exclusive', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'pro',
        billingCycle: 'monthly',
        seatCount: 10,
        addOnIds: ['storage_100', 'storage_500'],
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toMatch(/either 100 GB storage or 500 GB storage/);
  });
});

describe('subscriptionSchema — seat count boundaries', () => {
  test.each([
    { tier: 'basic', billingCycle: 'monthly', min: 1, max: 10 },
    { tier: 'pro', billingCycle: 'monthly', min: 5, max: 18 },
    { tier: 'enterprise', billingCycle: 'monthly', min: 10, max: 500 },
    { tier: 'basic', billingCycle: 'annual', min: 1, max: 20 },
    { tier: 'pro', billingCycle: 'annual', min: 21, max: 90 },
    { tier: 'enterprise', billingCycle: 'annual', min: 101, max: 1000 },
  ] as const)(
    '$tier $billingCycle accepts min/max and rejects outside bounds',
    ({ tier, billingCycle, min, max }) => {
      expect(subscriptionSchema.safeParse(build({ tier, billingCycle, seatCount: min })).success).toBe(
        true,
      );
      expect(subscriptionSchema.safeParse(build({ tier, billingCycle, seatCount: max })).success).toBe(
        true,
      );
      expect(
        subscriptionSchema.safeParse(build({ tier, billingCycle, seatCount: min - 1 })).success,
      ).toBe(false);
      expect(
        subscriptionSchema.safeParse(build({ tier, billingCycle, seatCount: max + 1 })).success,
      ).toBe(false);
      expect(
        subscriptionSchema.safeParse(
          build({ tier, billingCycle, seatCount: max + 10, promoCode: 'AB1234' }),
        ).success,
      ).toBe(true);
      expect(
        subscriptionSchema.safeParse(
          build({ tier, billingCycle, seatCount: max + 11, promoCode: 'AB1234' }),
        ).success,
      ).toBe(false);
    },
  );

  test('monthly basic max is 10 without promo, 20 with valid promo', () => {
    const without = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 11 }),
    );
    expect(without.success).toBe(false);

    const withPromo = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 20, promoCode: 'AB1234' }),
    );
    expect(withPromo.success).toBe(true);

    const justOver = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 21, promoCode: 'AB1234' }),
    );
    expect(justOver.success).toBe(false);
  });

  test('annual pro: rejects 20, accepts 21 (disjoint boundary with basic)', () => {
    const at20 = subscriptionSchema.safeParse(
      build({ tier: 'pro', billingCycle: 'annual', seatCount: 20 }),
    );
    expect(at20.success).toBe(false);

    const at21 = subscriptionSchema.safeParse(
      build({ tier: 'pro', billingCycle: 'annual', seatCount: 21 }),
    );
    expect(at21.success).toBe(true);
  });

  test('spec boundary checkpoints for pro and enterprise seat ranges', () => {
    expect(
      subscriptionSchema.safeParse(build({ tier: 'pro', billingCycle: 'monthly', seatCount: 18 }))
        .success,
    ).toBe(true);
    expect(
      subscriptionSchema.safeParse(build({ tier: 'pro', billingCycle: 'monthly', seatCount: 19 }))
        .success,
    ).toBe(false);
    expect(
      subscriptionSchema.safeParse(
        build({ tier: 'enterprise', billingCycle: 'monthly', seatCount: 500 }),
      ).success,
    ).toBe(true);
    expect(
      subscriptionSchema.safeParse(
        build({ tier: 'enterprise', billingCycle: 'annual', seatCount: 100 }),
      ).success,
    ).toBe(false);
    expect(
      subscriptionSchema.safeParse(
        build({ tier: 'enterprise', billingCycle: 'annual', seatCount: 1000 }),
      ).success,
    ).toBe(true);
  });

  test('annual pro max is 90 without promo and 100 with valid promo', () => {
    expect(
      subscriptionSchema.safeParse(build({ tier: 'pro', billingCycle: 'annual', seatCount: 91 }))
        .success,
    ).toBe(false);
    expect(
      subscriptionSchema.safeParse(
        build({ tier: 'pro', billingCycle: 'annual', seatCount: 100, promoCode: 'AB1234' }),
      ).success,
    ).toBe(true);
  });

  test('non-integer seat count rejected', () => {
    const result = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 5.5 }),
    );
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('seatCount');
  });
});

describe('subscriptionSchema — promo code', () => {
  test('empty promo is valid', () => {
    const result = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 5, promoCode: '' }),
    );
    expect(result.success).toBe(true);
  });

  test('missing promo defaults to empty input', () => {
    const withoutPromo: Partial<SubscriptionFormValues> = { ...DEFAULT_SUBSCRIPTION_VALUES };
    delete withoutPromo.promoCode;
    const result = subscriptionSchema.safeParse(withoutPromo);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.promoCode).toBe('');
  });

  test('malformed promo is rejected', () => {
    const result = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 5, promoCode: 'nope' }),
    );
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain('promoCode');
  });

  test('malformed promo does NOT extend seat cap', () => {
    // 15 is over the no-bonus monthly basic max (10); the seat error must fire
    // even though the user typed "something" in the promo field.
    const result = subscriptionSchema.safeParse(
      build({ tier: 'basic', billingCycle: 'monthly', seatCount: 15, promoCode: 'bad!' }),
    );
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toEqual(expect.arrayContaining(['promoCode', 'seatCount']));
  });
});

describe('subscriptionSchema — rule ordering', () => {
  test('duplicate error fires before pool, storage, or cap checks', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'basic',
        billingCycle: 'monthly',
        seatCount: 5,
        addOnIds: ['storage_500', 'storage_500', 'api_access'],
      }),
    );
    expect(result.success).toBe(false);
    expect(issueMessages(result)[0]).toMatch(/Duplicate add-ons/);
  });

  test('pool-membership error fires instead of count-cap error on the same input', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'basic',
        billingCycle: 'monthly',
        seatCount: 5,
        addOnIds: ['storage_500', 'support_dedicated'], // both out of pool, also over cap (1)
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    const addOnIssues = result.error.issues.filter((i) => i.path[0] === 'addOnIds');
    expect(addOnIssues).toHaveLength(1);
    expect(addOnIssues[0]?.message).toMatch(/Not available/);
  });

  test('storage-conflict error fires before count-cap error once ids are in-pool', () => {
    const result = subscriptionSchema.safeParse(
      build({
        tier: 'pro',
        billingCycle: 'monthly',
        seatCount: 10,
        addOnIds: ['storage_100', 'storage_500', 'api_access'],
      }),
    );
    expect(result.success).toBe(false);
    expect(issueMessages(result)[0]).toMatch(/either 100 GB storage or 500 GB storage/);
  });
});

describe('subscriptionSchema — malformed payloads', () => {
  test.each([
    [{ ...DEFAULT_SUBSCRIPTION_VALUES, tier: undefined }, 'tier'],
    [{ ...DEFAULT_SUBSCRIPTION_VALUES, billingCycle: 'weekly' }, 'billingCycle'],
    [{ ...DEFAULT_SUBSCRIPTION_VALUES, seatCount: Number.NaN }, 'seatCount'],
    [{ ...DEFAULT_SUBSCRIPTION_VALUES, seatCount: '10' }, 'seatCount'],
    [{ ...DEFAULT_SUBSCRIPTION_VALUES, addOnIds: undefined }, 'addOnIds'],
    [{ ...DEFAULT_SUBSCRIPTION_VALUES, addOnIds: ['storage_100', 'not_real'] }, 'addOnIds.1'],
  ])('rejects malformed payload %#', (payload, expectedPath) => {
    const result = subscriptionSchema.safeParse(payload);
    expect(result.success).toBe(false);
    expect(errorPaths(result)).toContain(expectedPath);
  });
});

describe('subscriptionResolver — dynamic context', () => {
  test('uses the resolver context supplied by React Hook Form', async () => {
    const context = {
      ...subscriptionValidationContext,
      getAddOnCountCap: () => 1,
    };
    const result = await subscriptionResolver(
      build({
        tier: 'pro',
        billingCycle: 'monthly',
        seatCount: 10,
        addOnIds: ['storage_100', 'api_access'],
      }),
      context,
      { fields: {}, shouldUseNativeValidation: false },
    );

    expect(result.errors.addOnIds?.message).toMatch(/Select at most 1 add-on/);
  });
});
