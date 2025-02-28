const STORAGE_PREFIX = 'midi_control_value_';

/**
 * Save a control value to localStorage
 * @param controlId The unique ID of the control
 * @param value The value to store
 */
export const saveControlValue = (controlId: string, value: number): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${controlId}`, value.toString());
  } catch (error) {
    console.error('Failed to save control value', error);
  }
};

/**
 * Load a control value from localStorage
 * @param controlId The unique ID of the control
 * @returns The stored value, or null if not found
 */
export const loadControlValue = (controlId: string): number | null => {
  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${controlId}`);
    return value ? parseFloat(value) : null;
  } catch (error) {
    console.error('Failed to load control value', error);
    return null;
  }
};

/**
 * Clear all stored control values
 */
export const clearAllControlValues = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear control values', error);
  }
};

/**
 * Clear stored value for a specific control
 * @param controlId The unique ID of the control
 */
export const clearControlValue = (controlId: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${controlId}`);
  } catch (error) {
    console.error('Failed to clear control value', error);
  }
};
