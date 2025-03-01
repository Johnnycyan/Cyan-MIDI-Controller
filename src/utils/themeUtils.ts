import { v4 as uuidv4 } from 'uuid';
import { ThemePreset, ThemeColors } from '../types';

// Create a new theme with default or custom colors
export function createThemePreset(params: {
  name: string;
  dark?: boolean;
  colors?: Partial<ThemeColors>;
}): ThemePreset {
  // Default colors based on dark/light mode
  const baseColors: ThemeColors = params.dark === false 
    ? {
        primary: '#1976d2',
        secondary: '#9c27b0',
        background: '#f5f5f5',
        surface: '#ffffff',
        text: '#000000',
        error: '#d32f2f',
        warning: '#ed6c02',
        success: '#2e7d32',
        info: '#0288d1',
      } 
    : {
        primary: '#90caf9',
        secondary: '#ce93d8',
        background: '#121212',
        surface: '#1e1e1e',
        text: '#ffffff',
        error: '#f44336',
        warning: '#ff9800',
        success: '#4caf50',
        info: '#2196f3',
      };

  return {
    id: uuidv4(), // Generate a unique ID
    name: params.name || 'Custom Theme',
    dark: params.dark !== false, // Default to dark
    colors: {
      ...baseColors,
      ...params.colors || {}
    }
  };
}

// Export theme to JSON
export function exportThemeToJSON(theme: ThemePreset): string {
  return JSON.stringify(theme, null, 2);
}

// Parse theme from JSON
export function parseThemeFromJSON(json: string): ThemePreset | null {
  try {
    const parsed = JSON.parse(json);
    
    // Validate required properties
    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.dark !== 'boolean' ||
      typeof parsed.colors !== 'object'
    ) {
      return null;
    }
    
    // Validate color properties
    const requiredColorProps = ['primary', 'secondary', 'background', 'surface', 'text'];
    for (const prop of requiredColorProps) {
      if (typeof parsed.colors[prop] !== 'string') {
        return null;
      }
    }
    
    return parsed as ThemePreset;
  } catch (e) {
    console.error('Failed to parse theme JSON', e);
    return null;
  }
}
