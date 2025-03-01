import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, ThemeOptions } from '@mui/material/styles';
import { ThemePreset } from '../types';
import { defaultTheme } from '../utils/settings';

// Define available themes
export const builtInThemes: ThemePreset[] = [
  defaultTheme,
  // More themes can be added here later
];

interface ThemeContextType {
  currentTheme: ThemePreset;
  allThemes: ThemePreset[];
  setTheme: (themeId: string) => void;
  addCustomTheme: (theme: ThemePreset) => void;
  removeCustomTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: defaultTheme,
  allThemes: [defaultTheme],
  setTheme: () => {},
  addCustomTheme: () => {},
  removeCustomTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  initialThemeId?: string;
  customThemes?: ThemePreset[];
}

export const ThemeProvider = ({ 
  children, 
  initialThemeId = 'default', 
  customThemes = [] 
}: ThemeProviderProps) => {
  // Combine built-in and custom themes
  const [allThemes, setAllThemes] = useState<ThemePreset[]>([
    ...builtInThemes,
    ...customThemes
  ]);

  // Set initial theme
  const [currentThemeId, setCurrentThemeId] = useState<string>(initialThemeId);
  
  // Find the actual theme object
  const currentTheme = allThemes.find(theme => theme.id === currentThemeId) || defaultTheme;

  // Convert our theme format to MUI theme options
  const createMuiTheme = (theme: ThemePreset): ThemeOptions => {
    return {
      palette: {
        mode: theme.dark ? 'dark' : 'light',
        primary: {
          main: theme.colors.primary,
        },
        secondary: {
          main: theme.colors.secondary,
        },
        background: {
          default: theme.colors.background,
          paper: theme.colors.surface,
        },
        text: {
          primary: theme.colors.text,
        },
        error: {
          main: theme.colors.error,
        },
        warning: {
          main: theme.colors.warning,
        },
        success: {
          main: theme.colors.success,
        },
        info: {
          main: theme.colors.info,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
            },
          },
        },
      },
    };
  };

  // Create the actual MUI theme object
  const muiTheme = createTheme(createMuiTheme(currentTheme));

  // Set theme handler
  const setTheme = (themeId: string) => {
    if (allThemes.some(theme => theme.id === themeId)) {
      setCurrentThemeId(themeId);
      // Save to local storage or settings
      localStorage.setItem('selected_theme_id', themeId);
    }
  };

  // Add custom theme
  const addCustomTheme = (theme: ThemePreset) => {
    setAllThemes(prev => {
      // Check if theme with same ID already exists
      const existingIndex = prev.findIndex(t => t.id === theme.id);
      if (existingIndex >= 0) {
        // Replace existing theme
        const newThemes = [...prev];
        newThemes[existingIndex] = theme;
        return newThemes;
      }
      // Add new theme
      return [...prev, theme];
    });
    
    // Save updated custom themes list
    const customThemes = allThemes.filter(
      t => !builtInThemes.some(bt => bt.id === t.id)
    );
    localStorage.setItem('custom_themes', JSON.stringify(customThemes));
  };

  // Remove custom theme
  const removeCustomTheme = (themeId: string) => {
    // Don't allow removing built-in themes
    if (builtInThemes.some(t => t.id === themeId)) {
      return;
    }
    
    setAllThemes(prev => prev.filter(t => t.id !== themeId));
    
    // If current theme is being removed, switch to default
    if (currentThemeId === themeId) {
      setTheme('default');
    }
    
    // Save updated custom themes list
    const customThemes = allThemes.filter(
      t => !builtInThemes.some(bt => bt.id === t.id) && t.id !== themeId
    );
    localStorage.setItem('custom_themes', JSON.stringify(customThemes));
  };

  // Load themes from storage on init
  useEffect(() => {
    const storedThemeId = localStorage.getItem('selected_theme_id');
    if (storedThemeId) {
      setCurrentThemeId(storedThemeId);
    }

    try {
      const storedCustomThemes = localStorage.getItem('custom_themes');
      if (storedCustomThemes) {
        const parsedThemes = JSON.parse(storedCustomThemes) as ThemePreset[];
        setAllThemes([...builtInThemes, ...parsedThemes]);
      }
    } catch (error) {
      console.error('Failed to load custom themes', error);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        allThemes,
        setTheme,
        addCustomTheme,
        removeCustomTheme,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
