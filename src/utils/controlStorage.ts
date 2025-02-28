interface StoredControlValues {
  [controlId: string]: number;
}

export const saveControlValue = (controlId: string, value: number) => {
  try {
    const storedValues = localStorage.getItem('control_values');
    const values: StoredControlValues = storedValues ? JSON.parse(storedValues) : {};
    values[controlId] = value;
    localStorage.setItem('control_values', JSON.stringify(values));
  } catch (error) {
    console.error('Failed to save control value:', error);
  }
};

export const loadControlValue = (controlId: string): number | null => {
  try {
    const storedValues = localStorage.getItem('control_values');
    if (!storedValues) return null;
    
    const values: StoredControlValues = JSON.parse(storedValues);
    return values[controlId] ?? null;
  } catch (error) {
    console.error('Failed to load control value:', error);
    return null;
  }
};
