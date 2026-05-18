import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useController, useFormContext, useWatch } from 'react-hook-form';

import {
  ADD_ON_IDS,
  SERVICE_ADD_ON_IDS,
  STORAGE_ADD_ON_IDS,
  getAddOnCountCap,
  getAddOnLabel,
  getAllowedAddOnIds,
  isStorageAddOnId,
  type AddOnId,
  type StorageAddOnId,
} from '@/domain/subscription';
import type { SubscriptionFormValues } from '@/validation/subscriptionSchema';

import { CheckboxRow } from '../shared/CheckboxRow';
import { FieldRow } from '../shared/FieldRow';
import { RadioRow } from '../shared/RadioRow';

// Subscribes to: `addOnIds` (own), `tier`, `billingCycle`.
// Does not subscribe to `seatCount` or `promoCode`.
export function AddOnsField() {
  const { control } = useFormContext<SubscriptionFormValues>();
  const { field, fieldState } = useController({ control, name: 'addOnIds' });

  const tier = useWatch({ control, name: 'tier' });
  const billingCycle = useWatch({ control, name: 'billingCycle' });

  const allowedSet = useMemo(
    () => new Set<AddOnId>(getAllowedAddOnIds({ tier, billingCycle })),
    [tier, billingCycle],
  );
  const cap = useMemo(() => getAddOnCountCap({ tier, billingCycle }), [tier, billingCycle]);

  const selected = field.value;
  const selectedSet = useMemo(() => new Set<AddOnId>(selected), [selected]);
  const hasReachedCap = selected.length >= cap;
  const selectedStorage = useMemo(
    () => STORAGE_ADD_ON_IDS.find((id) => selectedSet.has(id)) ?? null,
    [selectedSet],
  );

  const applySelection = useCallback(
    (next: ReadonlyArray<AddOnId>) => {
      field.onChange([...next]);
    },
    [field],
  );

  // Stable handler closed over `selected`; AddOnOption owns its own per-id binding.
  const handleToggle = useCallback(
    (id: AddOnId) => {
      const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      applySelection(next);
    },
    [applySelection, selected],
  );

  const handleStorageChange = useCallback(
    (id: StorageAddOnId | null) => {
      const withoutStorage = selected.filter((value) => !isStorageAddOnId(value));
      applySelection(id ? [...withoutStorage, id] : withoutStorage);
    },
    [applySelection, selected],
  );

  const hint = `Available: ${allowedSet.size} of ${ADD_ON_IDS.length}. Selected ${selected.length} of ${cap}.`;

  return (
    <FieldRow label="Options" hint={hint} error={fieldState.error?.message}>
      <View style={styles.panel}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Storage add-on">
            <StorageOption
              id={null}
              label="No extra storage"
              selected={selectedStorage === null}
              onSelect={handleStorageChange}
            />
            {STORAGE_ADD_ON_IDS.map((id) => {
              const checked = selectedStorage === id;
              const isAllowed = allowedSet.has(id);
              const replacingStorage = selectedStorage !== null;
              const helper = getUnavailableReason({
                checked,
                isAllowed,
                hasReachedCap: hasReachedCap && !replacingStorage,
              });
              return (
                <StorageOption
                  key={id}
                  id={id}
                  label={getAddOnLabel(id)}
                  helper={helper}
                  selected={checked}
                  disabled={helper !== undefined}
                  onSelect={handleStorageChange}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {SERVICE_ADD_ON_IDS.map((id) => {
            const checked = selectedSet.has(id);
            const isAllowed = allowedSet.has(id);
            const helper = getUnavailableReason({ checked, isAllowed, hasReachedCap });
            return (
              <AddOnOption
                key={id}
                id={id}
                helper={helper}
                checked={checked}
                disabled={helper !== undefined}
                onToggle={handleToggle}
              />
            );
          })}
        </View>
      </View>
    </FieldRow>
  );
}

type AddOnOptionProps = Readonly<{
  id: AddOnId;
  helper?: string | undefined;
  checked: boolean;
  disabled: boolean;
  onToggle: (id: AddOnId) => void;
}>;

type StorageOptionProps = Readonly<{
  id: StorageAddOnId | null;
  label: string;
  helper?: string | undefined;
  selected: boolean;
  disabled?: boolean | undefined;
  onSelect: (id: StorageAddOnId | null) => void;
}>;

function StorageOption({ id, label, helper, selected, disabled, onSelect }: StorageOptionProps) {
  const handle = useCallback(() => onSelect(id), [id, onSelect]);
  return (
    <RadioRow
      label={label}
      helper={helper}
      selected={selected}
      disabled={disabled}
      onSelect={handle}
    />
  );
}

function AddOnOption({ id, helper, checked, disabled, onToggle }: AddOnOptionProps) {
  const handle = useCallback(() => onToggle(id), [id, onToggle]);
  return (
    <CheckboxRow
      label={getAddOnLabel(id)}
      helper={helper}
      checked={checked}
      disabled={disabled}
      onToggle={handle}
    />
  );
}

type UnavailableReasonInput = Readonly<{
  checked: boolean;
  isAllowed: boolean;
  hasReachedCap: boolean;
}>;

function getUnavailableReason({
  checked,
  isAllowed,
  hasReachedCap,
}: UnavailableReasonInput): string | undefined {
  if (checked) return undefined;
  if (!isAllowed) return 'Unavailable for this plan';
  if (hasReachedCap) return 'Limit reached';
  return undefined;
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 6,
  },
  section: { paddingVertical: 4 },
  sectionTitle: {
    marginBottom: 2,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#57606a',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 6,
    backgroundColor: '#eaeef2',
  },
});
