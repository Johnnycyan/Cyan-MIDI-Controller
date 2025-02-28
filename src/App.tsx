import { useState } from 'react';
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
