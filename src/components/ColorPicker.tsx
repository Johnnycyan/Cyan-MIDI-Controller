import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Popover, Grid } from '@mui/material';
import { MuiColorInput } from 'mui-color-input';

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string) => void;
  label?: string;
  fullWidth?: boolean;
  multipleValues?: string[];
}

const ColorPicker = ({ value, onChange, label, fullWidth, multipleValues = [] }: ColorPickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [internalValue, setInternalValue] = useState<string>(value || '#3f51b5');
  
  // Update internal state when props change, but only if it's actually different
  useEffect(() => {
    if (value && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);
  
  // Get unique colors for the multi-select palette, ensure we filter out any null/undefined/empty values
  const uniqueColors = Array.from(new Set(multipleValues.filter(Boolean)));
  
  // Determine if we ACTUALLY have multiple DIFFERENT colors
  const hasMultipleColors = uniqueColors.length > 1;
  
  // For debugging
  useEffect(() => {
    console.log('ColorPicker - value:', value);
    console.log('ColorPicker - internalValue:', internalValue);
    console.log('ColorPicker - multipleValues:', multipleValues);
    console.log('ColorPicker - uniqueColors:', uniqueColors);
    console.log('ColorPicker - hasMultipleColors:', hasMultipleColors);
  }, [value, internalValue, multipleValues, uniqueColors, hasMultipleColors]);

  // Handle color change from the picker
  const handleColorChange = (newColor: string) => {
    console.log('MuiColorInput onChange fired with:', newColor);
    setInternalValue(newColor);
    
    // Immediately propagate changes, as long as it's a valid hex color
    if (newColor && newColor.startsWith('#')) {
      onChange(newColor);
    }
  };

  // Handle click to show multi-color palette
  const handleMultipleColorsClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hasMultipleColors) {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    }
  };

  // Close the multi-color palette
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Choose one of the existing colors
  const handleSelectColor = (color: string) => {
    console.log('Selected color from palette:', color);
    // Ensure the color string is valid and properly formatted
    const formattedColor = color.toLowerCase().trim();
    setInternalValue(formattedColor);
    onChange(formattedColor);
    handleClose();
  };

  return (
    <Box sx={{ mt: 2, mb: 1 }}> {/* Add consistent margin like other form fields */}
      {label && <Typography variant="body2" mb={1}>{label}</Typography>}
      
      <Box 
        onClick={hasMultipleColors ? handleMultipleColorsClick : undefined}
        sx={{ cursor: hasMultipleColors ? 'pointer' : 'default' }}
        data-testid="color-picker-wrapper"
      >
        <MuiColorInput
          format="hex"
          value={hasMultipleColors ? "" : internalValue}
          onChange={handleColorChange}
          fullWidth={fullWidth}
          sx={{
            '& .MuiSvgIcon-root': {
              color: hasMultipleColors ? 'rgba(255,255,255,0.5)' : internalValue,
            }
          }}
          placeholder={hasMultipleColors ? "Multiple colors" : undefined}
          helperText={hasMultipleColors ? "Click to select from multiple colors" : undefined}
        />
      </Box>
      
      {/* Popover for selecting from multiple colors - only show if there are actually multiple colors */}
      {hasMultipleColors && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="color-chip-popover"
        >
          <Box sx={{ p: 2, maxWidth: '300px' }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Select from existing colors:</Typography>
            <Grid container spacing={1}>
              {uniqueColors.map((color, index) => (
                <Grid item key={index}>
                  <Chip
                    label={color}
                    onClick={() => handleSelectColor(color)}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent focus issues
                    data-testid={`color-chip-${index}`}
                    sx={{
                      backgroundColor: color,
                      color: isDarkColor(color) ? 'white' : 'black',
                      minWidth: '80px',
                      justifyContent: 'center',
                      '&:hover': {
                        backgroundColor: color,
                        opacity: 0.9
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Or use the color picker to set a new color for all selected components
            </Typography>
          </Box>
        </Popover>
      )}
    </Box>
  );
};

// Helper function to determine if a color is dark (for readability of text)
function isDarkColor(color: string): boolean {
  // For hex colors
  if (color.startsWith('#')) {
    try {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      // Calculate perceived brightness (YIQ equation)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    } catch (e) {
      console.error('Error parsing color:', color, e);
      return false;
    }
  }
  return false;
}

export default ColorPicker;
