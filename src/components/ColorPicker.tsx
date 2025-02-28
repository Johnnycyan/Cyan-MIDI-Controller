import { useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import '@melloware/coloris/dist/coloris.css';
import Coloris from '@melloware/coloris';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  useEffect(() => {
    Coloris.init();
    Coloris({
        themeMode: 'dark',
        alpha: false,
        format: 'hex',
        el: ''
    });
  }, []);

  return (
    <Box>
      {label && <Typography variant="body2" mb={1}>{label}</Typography>}
      <TextField
        fullWidth
        data-coloris
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
}
