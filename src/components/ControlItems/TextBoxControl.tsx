import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, TextField } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';
import { saveControlValue, loadControlValue } from '../../utils/controlValueStorage';

interface TextBoxControlProps {
  control: ControlItem;
  onChange?: (value: number) => void;
  onSelect?: (id: string) => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  selectedMidiOutput?: string | null;
}

export default function TextBoxControl({ 
  control,
  onChange,
  onSelect,
  isEditMode = false,
  isSelected = false,
  selectedMidiOutput
}: TextBoxControlProps) {
  const { config } = control;
  const { sendCC } = useMIDI();
  const theme = useTheme();
  const [value, setValue] = useState(config.value || 0);
  const [textValue, setTextValue] = useState('');
  
  const minVal = config.midi?.min !== undefined ? config.midi.min : 0;
  const maxVal = config.midi?.max !== undefined ? config.midi.max : 127;
  const showLabel = config.showLabel !== false;
  const color = config.color || theme.palette.primary.main;

  // Add defaults for MIDI channel and CC
  const channel = config.midi?.channel ?? 1;  // Default to channel 1
  const cc = config.midi?.cc ?? 0;  // Default to CC 0
  
  // Load saved value on mount
  useEffect(() => {
    const savedValue = loadControlValue(control.id);
    if (savedValue !== null) {
      setValue(savedValue);
      setTextValue(savedValue.toString());
      onChange?.(savedValue);
    }
  }, [control.id]);
  
  // Update the text value when the numeric value changes
  useEffect(() => {
    setTextValue(value.toString());
  }, [value]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
  };
  
  const handleBlur = () => {
    let newValue = parseInt(textValue, 10);
    
    // Handle invalid input
    if (isNaN(newValue)) {
      newValue = value;
      setTextValue(value.toString());
      return;
    }
    
    // Clamp the value to min/max range
    newValue = Math.max(minVal, Math.min(maxVal, newValue));
    
    // Update state
    setValue(newValue);
    setTextValue(newValue.toString());
    saveControlValue(control.id, newValue);
    
    // Send MIDI if applicable
    if (config.midi && selectedMidiOutput) {
      sendCC(channel, cc, newValue);
    }
    
    onChange?.(newValue);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      onSelect?.(control.id);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 1,
        opacity: isEditMode && !isSelected ? 0.7 : 1,
      }}
      onClick={handleClick}
    >
      {showLabel && (
        <Typography
          variant="body2"
          align="center"
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {config.label || 'Textbox'}
        </Typography>
      )}
      
      <TextField
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={isEditMode}
        size="small"
        inputProps={{
          style: { textAlign: 'center' },
          min: minVal,
          max: maxVal,
        }}
        sx={{
          width: '100%',
          flexGrow: 1,
          '& .MuiInputBase-root': {
            height: '100%',
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: color,
            },
            '&:hover fieldset': {
              borderColor: color,
            },
            '&.Mui-focused fieldset': {
              borderColor: color,
            },
          },
        }}
      />
    </Box>
  );
}
