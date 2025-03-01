import { AppSettings } from '../types';

const SETTINGS_KEY = 'midi_controller_settings';

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
