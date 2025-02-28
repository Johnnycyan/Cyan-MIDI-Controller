import { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';

interface MidiTextBoxProps {
  control: ControlItem;
  onChange: (value: number) => void;
  isEditMode?: boolean;
  selectedMidiOutput?: string | null;
}

export default function MidiTextBox({
  control,
  onChange,
  isEditMode = false,
  selectedMidiOutput
}: MidiTextBoxProps) {
  const { config } = control;
  const { sendCC } = useMIDI();
  
  // Ensure initial value is a valid number and converted to string
  const initialValue = typeof config.value === 'number' && !isNaN(config.value) 
    ? String(config.value) 
    : '0';
  
  const [inputValue, setInputValue] = useState(initialValue);
  
  // Set min and max values from config or use defaults
  const minVal = config.midi?.min !== undefined ? config.midi.min : 0;
  const maxVal = config.midi?.max !== undefined ? config.midi.max : 127;
  
  // Update input value when config value changes
  useEffect(() => {
    const newValue = typeof config.value === 'number' && !isNaN(config.value)
      ? String(config.value)
      : '0';
    setInputValue(newValue);
  }, [config.value]);
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Only allow empty string (for typing) or valid numbers
    if (value === '' || !isNaN(Number(value))) {
      setInputValue(value);
    }
  };
  
  const handleBlur = () => {
    if (isEditMode) return;
    
    // Convert to number and handle invalid input
    let newValue = parseInt(inputValue, 10);
    if (isNaN(newValue)) {
      newValue = config.value || 0;
    }
    
    // Clamp value to range
    newValue = Math.max(minVal, Math.min(maxVal, newValue));
    setInputValue(String(newValue));
    
    // Only update if the value has changed
    if (newValue !== config.value) {
      if (config.midi && selectedMidiOutput) {
        sendCC(config.midi.channel, config.midi.cc, newValue);
      }
      onChange(newValue);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };
  
  // Ensure the displayed value is always a valid string
  const displayValue = inputValue === '' ? '0' : inputValue;
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 1,
      }}
    >
      {config.showLabel !== false && (
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {config.label || 'Value'}
        </Typography>
      )}
      
      <TextField
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isEditMode}
        variant="outlined"
        size="small"
        type="number"
        inputProps={{
          min: minVal,
          max: maxVal,
          style: { textAlign: 'center' }
        }}
        sx={{
          flexGrow: 1,
          '& .MuiOutlinedInput-root': {
            height: '100%',
          },
        }}
      />
    </Box>
  );
}
