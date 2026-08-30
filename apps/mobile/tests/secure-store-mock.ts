/**
 * Mock implementation of expo-secure-store for Node testing environments.
 */
const mockStore = new Map<string, string>();

export const isAvailableAsync = async (): Promise<boolean> => true;

export const getItemAsync = async (key: string): Promise<string | null> => {
  return mockStore.get(key) ?? null;
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  mockStore.set(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  mockStore.delete(key);
};

export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = "WHEN_UNLOCKED_THIS_DEVICE_ONLY";
