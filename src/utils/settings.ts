import { AppSettings, ThemePreset } from '../types';

const SETTINGS_KEY = 'midi_controller_settings';

// Define the default theme
export const defaultTheme: ThemePreset = {
  id: 'default',
  name: 'Default',
  dark: true,
  colors: {
    primary: '#1976d2',
    secondary: '#9c27b0',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    info: '#2196f3'
  }
};

export const defaultSettings: AppSettings = {
  resizeHandles: {
    minSize: 16,
    maxSize: 32,
    scalePercent: 20,
    color: '#2196f3',
    borderColor: '#ffffff',
    borderWidth: 1
  },
  fontSize: {
    controls: 14,
    labels: 12
  },
  theme: {
    selectedThemeId: 'default',
    customThemes: [] // No custom themes by default
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
