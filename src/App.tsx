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

    const hideCursor = () => {
      document.body.style.cursor = 'none';
      cursorVisible = false;
    };

    const showCursor = () => {
      document.body.style.cursor = 'default';
      cursorVisible = true;
      // Reset timer
      clearTimeout(timeoutId);
      timeoutId = setTimeout(hideCursor, 10000);
    };

    const handleMouseMove = () => {
      if (!cursorVisible) {
        showCursor();
      } else {
        // Just reset timer if cursor is already visible
        clearTimeout(timeoutId);
        timeoutId = setTimeout(hideCursor, 10000);
      }
    };

    // Initial timer
    timeoutId = setTimeout(hideCursor, 10000);

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', showCursor);
    document.addEventListener('keydown', showCursor);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', showCursor);
      document.removeEventListener('keydown', showCursor);
      document.body.style.cursor = 'default';
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
