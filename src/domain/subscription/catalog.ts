export const ADD_ON_IDS = [
  'storage_100',
  'storage_500',
  'support_priority',
  'support_dedicated',
  'api_access',
] as const;

export type AddOnId = (typeof ADD_ON_IDS)[number];

export const STORAGE_ADD_ON_IDS = ['storage_100', 'storage_500'] as const satisfies ReadonlyArray<AddOnId>;
export type StorageAddOnId = (typeof STORAGE_ADD_ON_IDS)[number];

export const SERVICE_ADD_ON_IDS = [
  'support_priority',
  'support_dedicated',
  'api_access',
] as const satisfies ReadonlyArray<AddOnId>;

const ADD_ON_LABELS: Readonly<Record<AddOnId, string>> = {
  storage_100: '100 GB storage',
  storage_500: '500 GB storage',
  support_priority: 'Priority support',
  support_dedicated: 'Dedicated support engineer',
  api_access: 'API access',
};

export function getAddOnLabel(id: AddOnId): string {
  return ADD_ON_LABELS[id];
}

export function isAddOnId(value: string): value is AddOnId {
  return (ADD_ON_IDS as readonly string[]).includes(value);
}

export function isStorageAddOnId(id: AddOnId): id is StorageAddOnId {
  return (STORAGE_ADD_ON_IDS as readonly string[]).includes(id);
}
