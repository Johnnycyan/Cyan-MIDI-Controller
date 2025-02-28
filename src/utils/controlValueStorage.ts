const STORAGE_KEY = 'control_values';

interface StoredValues {
  [controlId: string]: number;
}

export const saveControlValue = (controlId: string, value: number): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const values: StoredValues = stored ? JSON.parse(stored) : {};
    values[controlId] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch (error) {
    console.error('Failed to save control value:', error);
  }
};

export const loadControlValue = (controlId: string): number | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const values: StoredValues = JSON.parse(stored);
    return values[controlId] ?? null;
  } catch (error) {
    console.error('Failed to load control value:', error);
    return null;
  }
};
