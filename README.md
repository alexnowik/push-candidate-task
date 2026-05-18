# Subscription configuration form

A small React Native form that configures a product subscription under cross-field rules. Built with React Hook Form + Zod over a framework-agnostic domain layer.

The interesting part is not the form — it is the layering. Business rules live in pure functions in `src/domain/subscription`. The Zod schema in `src/validation` orchestrates those functions and never declares a rule of its own. UI components in `src/ui` render fields, scope their RHF subscriptions, and contain zero business logic. Swapping Zod for another validator, or React Native for plain React, would not touch the domain.

## Install and run

```bash
npm install
npm run ios       # iOS simulator via Expo
npm run android   # Android emulator via Expo
npm run web       # Browser
npm test          # Jest (domain + schema)
npm run typecheck # tsc --noEmit, strict
```

Built against Expo SDK 52 / React Native 0.76 / React 18.3. No native code beyond Expo's defaults — `npx expo run:ios`/`run:android` is not required; `expo start` is enough.

## Project layout

```
src/
  domain/subscription/     pure rules, typed catalog, no React/Zod imports
    catalog.ts             AddOnId union derived from a single readonly list
    tiers.ts               Tier union + display labels
    billingCycle.ts        BillingCycle union + display labels
    promoCode.ts           format predicate + +10 bonus rule
    rules.ts                   seat-bounds, allowed pool, count cap, duplicate/pool finders
    reconcile.ts               pure reducer: clamp seatCount + prune/trim addOnIds for a state
    index.ts                   public surface
  validation/
    subscriptionSchema.ts      Zod schema + RHF resolver context; calls into domain via superRefine
  form/
    defaultValues.ts           defaults pinned by a test as "valid on first paint"
    useSubscriptionForm.ts     thin hook that owns RHF wiring (resolver, mode, defaults)
    useReconcileDependents.ts  applies reconcile() to RHF on parent-field changes
  ui/
    SubscriptionForm.tsx       root: calls useSubscriptionForm() once, no watch()
    fields/                    one component per field, each owns its subscriptions
    shared/                    FieldRow, ErrorText, SegmentedControl, CheckboxRow, PrimaryButton, StatusBadge
__tests__/
  domain/rules.test.ts                   table-driven boundary tests
  domain/reconcile.test.ts               clamp + prune + cap-trim across plan transitions
  validation/subscriptionSchema.test.ts  default-valid + every cross-field path + dynamic-context smoke test
```

Why layered (not feature-folder): there is one feature. A `src/features/subscription/{domain,ui,...}` split would bury the layering, which is the architectural point the assignment is measuring.

## Modeling decisions

### Field dependency graph

```
tier ─────────────┐
                  ├─► seatCount.bounds   (via getSeatBounds)
                  ├─► addOnIds.pool      (only when billingCycle === 'monthly')
                  └─► addOnIds.countCap  (only when billingCycle === 'monthly')

billingCycle ─────┤
                  ├─► seatCount.bounds
                  ├─► addOnIds.pool      (annual = full catalog)
                  └─► addOnIds.countCap  (annual = catalog length)

promoCode ────────► seatCount.bounds    (valid format → max += 10)

addOnIds ─────────► storage exclusivity (storage_100 XOR storage_500)
```

`seatCount` and `addOnIds` are leaves. `promoCode` only feeds seat bounds. `seatCount` bounds depend on **all three** of `tier`, `billingCycle`, `promoCode`; the spec's monthly tables overlap by design, so any cache keyed only on `billingCycle` would silently corrupt validation. `getSeatBounds` takes the full input every call.

### Design choices (why, not what)

- **Discrete plan changes reconcile dependents; impossible states cannot exist.** When `tier` or `billingCycle` changes, `seatCount` is clamped to the new bounds and `addOnIds` are pruned to the new pool and trimmed to the new cap before validation runs. The best validation error is one the user can never trigger. A single tap on a plan switch is unambiguous user intent for the *plan*, not for the *seat count*, so reconciliation respects intent. Pure logic lives in `domain/reconcile.ts` (`reconcileDependents`); the RHF side-effect is the one-screen `useReconcileDependents` hook in `form/`, called from `TierField` and `BillingCycleField` after their own `onChange`. The hook only calls `setValue` when a dependent actually changed, so reconciliation is a no-op when there is nothing to reconcile.
- **`promoCode` is exempt from reconciliation — by design.** Typed input differs from a tap. Reconciling on every keystroke (e.g. backspacing one character of a valid promo and watching `seatCount` snap down) is more disruptive than the validation error itself. The promo path stays on the error rail; the user's confirmation that the bonus is applied is the `StatusBadge` in `PromoCodeField` and the live range hint in `SeatCountField`.
- **Input-level guardrails are scoped to the unambiguous.** Two are applied: `keyboardType="number-pad"` on `seatCount` (OS-level digit-only) and `maxLength` on both text inputs (4 for `seatCount`, 6 for `promoCode` — exactly its format length). What is NOT applied: live value-clamping while the user is mid-typing. The same logic as `promoCode` reconciliation: a number being typed passes through invalid intermediate states ("5" → "50" → "500"), and snapping the value on each keystroke makes editing impossible. `maxLength` caps junk without interrupting; the schema catches the rest on touch/submit.
- **Promo scope is format-only.** No registry of redeemable codes. The assignment defines a syntactic shape (`AB1234`) and a deterministic +10 effect; modeling redemption would require an injected port and async loading states for a sync form. The +10 bonus is gated on the same format predicate (`getPromoSeatBonus` → `isValidPromoCodeFormat`), so a malformed code cannot silently inflate the seat cap. Explicit Assumption — see below.
- **Storage is modeled as one choice, not two independent toggles.** The catalog keeps both required IDs (`storage_100`, `storage_500`), but the UI renders them as a radio-style storage group with "No extra storage" because selecting both 100 GB and 500 GB is not a coherent product configuration. The schema enforces the same rule, and reconciliation keeps only the first storage value if stale data ever contains both.
- **`mode: 'onTouched'`, `reValidateMode: 'onChange'`.** Pure `onChange` punishes the user mid-type on `seatCount`. Pure `onSubmit` hides cross-field issues until the final tap, which is hostile in a form where almost every field's validity depends on another. `onTouched` gives one calm pass per field, then becomes responsive once the user has engaged. Submit forces a full re-validation, so cross-field issues that emerge from a parent change cannot slip through.
- **Dynamic resolver context is explicit.** `useSubscriptionForm` passes `subscriptionValidationContext` into React Hook Form, and `subscriptionResolver` rebuilds the single Zod schema with that context on each resolver call. The context is a small rule-engine surface (`getSeatBounds`, `getAddOnCountCap`, duplicate/pool helpers), while `superRefine` still sees the parsed form object once and emits issues with explicit `path:` targets. This keeps the schema coherent without duplicating cross-field reads in per-field `.refine()` calls.
- **Rule order in `superRefine` is load-bearing and documented inline.** In `subscriptionSchema.ts`:
  1. `promoCode` format is checked first. The seat-bounds branch reads the bonus via the domain, which gates on the same predicate, so order is correctness, not just UX.
  2. `addOnIds` is checked in four stages — duplicates → pool membership → storage exclusivity → count cap — with `return` after the first failure of each so the user sees the **most specific** error. A user who selects two out-of-pool add-ons sees "not available for this tier" rather than "select at most 1," which is more actionable.
- **Typed unions are the single source of truth.** `Tier`, `BillingCycle`, `AddOnId` are each derived from a `const` array (`(typeof X)[number]`). A typo in a mock, a test, or a future field config fails to compile — there is no stringly-typed config object.
- **Module structure is layered, not feature-folder.** One feature, so a feature split would hide the layering. Domain → validation → form → UI is the dependency direction; no upward imports.
- **`form/` owns RHF configuration in one place.** `useSubscriptionForm` is a thin hook in the form layer that returns `UseFormReturn<SubscriptionFormValues>` with the resolver, validation mode, and defaults already wired. The screen calls it and forgets that RHF or Zod exist. Swapping validator, changing `mode`, or replacing defaults happens in the form layer, not in UI.
- **Promo confirmation is visible at two surfaces.** When the promo format becomes valid, `PromoCodeField` renders a `StatusBadge` ("✓ Promo applied — +10 max seats") and `SeatCountField`'s hint switches from "Allowed range: min–max" to "Allowed range: min–max (includes +10 from promo)" with the actual numbers for the current tier and billing cycle. Both surfaces gate on the same `isValidPromoCodeFormat` predicate from the domain — there is no second source of truth.

### Re-render contract (each claim checkable in code)

`SubscriptionForm` calls `useForm` once and **never calls `watch()`**. Each field component subscribes for itself:

| Component | Subscribes via | tier | billingCycle | promoCode | seatCount | addOnIds |
|---|---|---|---|---|---|---|
| `TierField` | `useController('tier')` | own | no | no | no | no |
| `BillingCycleField` | `useController('billingCycle')` | no | own | no | no | no |
| `SeatCountField` | `useController('seatCount')` + `useWatch` on `tier`, `billingCycle`, `promoCode` | yes (bounds) | yes (bounds) | yes (bounds) | own | no |
| `AddOnsField` | `useController('addOnIds')` + `useWatch` on `tier`, `billingCycle` | yes (pool/cap) | yes (pool/cap) | no | no | own |
| `PromoCodeField` | `useController('promoCode')` | no | no | own | no | no |

"own" means the component owns that field and re-renders when its own value or fieldState changes. "yes" means the component subscribes to that other field and re-renders when it changes. "no" is checkable by grepping `useWatch` / `useController` in the component.

Naive baseline that this avoids: `const v = methods.watch()` at the form root would re-render every field on every keystroke and every checkbox toggle.

Memoization is targeted, not sprinkled:
- `SeatCountField` memoizes the seat-bounds result on `[tier, billingCycle, promoCode]` and the promo-applied flag on `[promoCode]`.
- `AddOnsField` memoizes the allowed-pool `Set` and the cap on `[tier, billingCycle]`, and the selected-set/storage choice on its own `[selected]` value. Once the selected count reaches the cap, unchecked service options are disabled while checked options remain removable; storage can still be swapped because it replaces one ID with another.
- Per-row handlers in `AddOnsField` and `SegmentedControl` are extracted into child components (`StorageOption`, `AddOnOption`, `Segment`) so the handlers can close over their own `id`/`value` without inline arrows in the parent's JSX.

## Assumptions

- **Promo code is format-only.** No registry of "real" promo codes; any `AB1234`-shaped string is treated as valid and grants +10. See [Modeling decisions](#design-choices-why-not-what).
- **Tier × billing × promo seat tables and add-on pool/cap tables.** Values are copied directly from the assignment brief:
  - Monthly seat bounds: basic 1–10, pro 5–18, enterprise 10–500 *(intentionally overlap)*.
  - Annual seat bounds: basic 1–20, pro 21–90, enterprise 101–1000 *(disjoint)*.
  - Monthly add-on pool: basic `{storage_100, support_priority}`, pro `{storage_100, storage_500, support_priority, api_access}`, enterprise = full catalog.
  - Monthly add-on cap: basic 1, pro 2, enterprise 5.
  - Annual: every tier exposes every catalog ID with cap = catalog length; the local storage-exclusivity rule still allows at most one storage add-on at a time.
  These are pinned in `src/domain/subscription/rules.ts` and asserted in `__tests__/domain/rules.test.ts`. The tests in `__tests__/validation/subscriptionSchema.test.ts` cover boundary checkpoints such as monthly pro 18/19, annual pro 90/91, enterprise annual 100/101, monthly pro accepts `api_access`, monthly pro rejects `support_dedicated`, and storage rejects `storage_100 + storage_500`.
- **Storage exclusivity is a local product extension.** The assignment models add-ons as IDs and allows local extensions. I keep the required global catalog intact, but treat storage size as a single configurable dimension because choosing both storage sizes would be confusing in the UI and ambiguous in a real subscription payload.
- **Reconciliation on plan change is a UX commitment.** Switching tier or billing clamps `seatCount`, prunes unavailable `addOnIds`, and trims selected add-ons to the cap rather than surfacing a delayed error. Promo changes (typed input) keep the error path. See [Modeling decisions](#design-choices-why-not-what).
- **`mode: 'onTouched'`.** Errors appear after a field is blurred (or after the first submit attempt) and then live-update on every keystroke.
- **Submission is a stub** — `Alert.alert` with a formatted subscription summary. There is no API call to wire up.

## Trade-offs

- Form is rendered as one scrolling page. With more fields it would become a wizard; here, surface area is small enough that vertical layout is clearer than steps.
- Add-ons render as a small static storage radio group plus service checkboxes, not a `FlatList`. With 5 catalog IDs a virtualized list is overhead, not optimization.
- No animations / no design-system. Visual polish was explicitly out of scope per the brief; legibility and obvious errors were prioritized.
- No component tests. The behavior worth testing is the validation contract, which is fully covered headlessly without a renderer. The form layer's contribution (subscription scoping) is structural and read by inspecting the code, not by a render test.
- React Hook Form's `useController` is used for every field. The brief said "Controller only where genuinely needed"; with React Native, none of the controls are uncontrolled `<input>`s, so `useController` is required for every field.
