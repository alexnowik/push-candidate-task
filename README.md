# Subscription configuration form

A compact React Native / Expo subscription form built with React Hook Form and Zod. The implementation focuses on cross-field validation, typed business rules, scoped form subscriptions, and clear error states.

## Install and run

```bash
npm install
npm run ios       # iOS simulator via Expo
npm run android   # Android emulator via Expo
npm run web       # Browser
npm test          # Jest domain + schema tests
npm run typecheck # TypeScript strict mode
```

Built against Expo SDK 52 / React Native 0.76 / React 18.3. No native prebuild is required; `expo start` is enough.

## Project layout

```text
src/domain/subscription/     pure catalog, labels, rules, reconciliation
src/validation/              one Zod schema + RHF dynamic resolver context
src/form/                    RHF setup, defaults, dependent-field reconciliation
src/ui/                      screen, fields, shared controls
__tests__/                   focused domain, reconciliation, schema tests
```

## Design note

- Field dependency graph: `tier` and `billingCycle` feed both seat bounds and add-on pool/cap; `promoCode` feeds seat max only; `addOnIds` validates duplicate IDs, pool membership, storage exclusivity, and count cap.
- Seat validation always reads `tier + billingCycle + promoCode` together through `getSeatBounds`; bounds are never cached by billing cycle alone because monthly ranges intentionally overlap.
- A single coherent schema is built by `createSubscriptionSchema(context)` and used by `subscriptionResolver`; the RHF context injects the rule surface (`getSeatBounds`, pool/cap helpers, duplicate/conflict finders).
- `superRefine` ordering is intentional: promo format first, then add-on duplicates, pool membership, storage conflict, and cap. Each add-on stage returns after its first failure so the error stays specific.
- `tier` and `billingCycle` changes reconcile dependents immediately: seats are clamped, unavailable add-ons are pruned, and selections over the new cap are trimmed.
- The screen never calls root `watch()`. Each field owns its own `useController`, and only fields that need parent values use scoped `useWatch`.
- `SeatCountField` only watches `tier`, `billingCycle`, and `promoCode`; `AddOnsField` only watches `tier` and `billingCycle`; promo/add-on/seat changes do not fan out through the whole form.
- The UI is grouped by product intent: `Subscription` for tier/billing/seats/promo, and `Add-ons` split into exclusive storage choice plus independent service toggles.
- Add-on UX blocks preventable errors: disabled options reflect the current pool/cap, checked options remain removable, and storage can be swapped because it replaces one ID with another.

## Assumptions and trade-offs

- Promo code is format-only: any `AB1234`-shaped value grants +10 max seats. There is no promo registry or async validation.
- Storage note: `storage_100` and `storage_500` are kept as required catalog IDs, but interpreted as mutually exclusive storage capacity tiers, not stackable packages. This local extension is isolated in `findConflictingStorageAddOnIds`.
- Pricing is intentionally out of scope. The brief provides no price table, currency, discounts, proration, or add-on prices, so the UI does not invent an estimated total.
- Submission is local only. A valid submit renders an inline summary of the last valid configuration; there is no API call.
- The form is a single scrollable page. With more fields it would become a wizard, but the current surface area is small enough to keep together.
- Tests are focused on the validation contract and edge boundaries rather than component rendering.
