import { useState } from 'react';
import { Box, Slider, TextField, Paper, Typography } from '@mui/material';
import { hexToHSL, HSLToHex } from '../utils/colors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function CustomColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [hsl, setHsl] = useState(hexToHSL(value));

  const handleHSLChange = (index: number, newValue: number) => {
    const newHsl = [...hsl];
    newHsl[index] = newValue;
    setHsl(newHsl as [number, number, number]);
    onChange(HSLToHex(newHsl[0], newHsl[1], newHsl[2]));
  };

  const presetColors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  ];

  return (
    <Paper sx={{ p: 2 }}>
      {label && <Typography gutterBottom>{label}</Typography>}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption">Hue</Typography>
          <Slider
            value={hsl[0]}
            min={0}
            max={360}
            onChange={(_, v) => handleHSLChange(0, v as number)}
            sx={{
              background: `linear-gradient(to right, 
                #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`,
            }}
          />
          <Typography variant="caption">Saturation</Typography>
          <Slider
            value={hsl[1]}
            min={0}
            max={100}
            onChange={(_, v) => handleHSLChange(1, v as number)}
            sx={{
              background: `linear-gradient(to right, 
                ${HSLToHex(hsl[0], 0, hsl[2])},
                ${HSLToHex(hsl[0], 100, hsl[2])})`
            }}
          />
          <Typography variant="caption">Lightness</Typography>
          <Slider
            value={hsl[2]}
            min={0}
            max={100}
            onChange={(_, v) => handleHSLChange(2, v as number)}
            sx={{
              background: `linear-gradient(to right, #000000,
                ${HSLToHex(hsl[0], hsl[1], 50)},
                #ffffff)`
            }}
          />
        </Box>
        <Box sx={{ width: 80 }}>
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              height: 80,
              bgcolor: value,
              border: '2px solid white',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
            }}
          />
          <TextField
            value={value}
            size="small"
            sx={{ mt: 1 }}
            onChange={(e) => onChange(e.target.value)}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1 }}>
        {presetColors.map((color) => (
          <Paper
            key={color}
            sx={{
              bgcolor: color,
              paddingTop: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' }
            }}
            onClick={() => onChange(color)}
          />
        ))}
      </Box>
    </Paper>
  );
}
