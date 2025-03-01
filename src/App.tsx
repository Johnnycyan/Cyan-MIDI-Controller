import { useState, useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { NotificationProvider } from './context/NotificationContext';
import MidiController from './components/MidiController';

function App() {
  const [darkMode] = useState(true);
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
      },
      h2: {
        fontSize: '2rem',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            height: '100%',
          },
          body: {
            height: '100%',
            overflow: 'hidden',
            // Add this to disable text selection globally
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          },
          '#root': {
            height: '100%',
          },
        },
      },
    },
  });

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
    <ThemeProvider theme={theme}>
      <NotificationProvider>
          <CssBaseline />
          <Box sx={{ height: '100vh', width: '100%' }}>
            <MidiController />
          </Box>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
