import { createTheme } from '@mui/material/styles';

// Create a very simple theme with minimal configuration
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

export default theme;
