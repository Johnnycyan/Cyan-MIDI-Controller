import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { useAppTheme } from '../context/ThemeContext';

interface ThemeSelectorProps {
  compact?: boolean;
}

export default function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { currentTheme, allThemes, setTheme } = useAppTheme();

  const handleThemeChange = (event: SelectChangeEvent) => {
    setTheme(event.target.value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {!compact && (
        <Typography variant="h6" sx={{ mb: 1 }}>
          Theme
        </Typography>
      )}
      
      <FormControl fullWidth size={compact ? "small" : "medium"}>
        <InputLabel id="theme-selector-label">Theme</InputLabel>
        <Select
          labelId="theme-selector-label"
          id="theme-selector"
          value={currentTheme.id}
          label="Theme"
          onChange={handleThemeChange}
        >
          {allThemes.map((theme) => (
            <MenuItem key={theme.id} value={theme.id}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: theme.colors.primary,
                    marginRight: 1,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                {theme.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
