import { useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import MidiController from './components/MidiController';
import NotificationSnackbar from './components/NotificationSnackbar';
import { loadSettings } from './utils/settings';

function App() {
  const settings = loadSettings();

  // Add cursor hiding functionality
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cursorVisible = true;

    // Create a style element to apply cursor: none globally
    const styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
    const styleSheet = styleElement.sheet as CSSStyleSheet;

    const hideCursor = () => {
      if (styleSheet) {
        // Remove any existing rules
        while (styleSheet.cssRules.length > 0) {
          styleSheet.deleteRule(0);
        }
        
        // Add a global rule to hide the cursor
        styleSheet.insertRule('* { cursor: none !important; }', 0);
        
        // Instead of disabling pointer events completely, which can break interactions,
        // we'll just add a transparent overlay to catch hover events
        styleSheet.insertRule('.cursor-hidden * { pointer-events: auto !important; }', 1);
        
        // Add a specific rule for hover states that preserves backgrounds
        // but disables transitions and other hover effects
        styleSheet.insertRule('* { transition: none !important; }', 2);
        
        // Disable common interactive effects without changing colors
        styleSheet.insertRule('button:hover, a:hover, [role="button"]:hover { transform: none !important; }', 3);
        
        // Add class to body for potential additional styling
        document.body.classList.add('cursor-hidden');
      }
      cursorVisible = false;
    };

    const showCursor = () => {
      if (styleSheet) {
        // Remove all the cursor and hover-related rules
        while (styleSheet.cssRules.length > 0) {
          styleSheet.deleteRule(0);
        }
        
        // Remove the class from body
        document.body.classList.remove('cursor-hidden');
      }
      cursorVisible = true;
      
      // Reset timer
      clearTimeout(timeoutId);
      timeoutId = setTimeout(hideCursor, 5000);
    };

    const handleMouseMove = () => {
      if (!cursorVisible) {
        showCursor();
      } else {
        // Just reset timer if cursor is already visible
        clearTimeout(timeoutId);
        timeoutId = setTimeout(hideCursor, 5000);
      }
    };

    // Initial timer
    timeoutId = setTimeout(hideCursor, 5000);

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', showCursor);
    document.addEventListener('keydown', showCursor);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', showCursor);
      document.removeEventListener('keydown', showCursor);
      
      // Clean up the style element
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      
      // Remove the class if it's still there
      document.body.classList.remove('cursor-hidden');
    };
  }, []);

  return (
    <ThemeProvider 
      initialThemeId={settings.theme.selectedThemeId}
      customThemes={settings.theme.customThemes}
    >
      <CssBaseline />
      <NotificationProvider>
        <Box sx={{ height: '100vh', width: '100%' }}>
          <MidiController />
        </Box>
        <NotificationSnackbar />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
