import { useState, useEffect } from 'react';
import { Box, Slider, Typography, styled } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';

const StyledSlider = styled(Slider)(({ theme, color }) => ({
  color: color || theme.palette.primary.main,
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&::before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: color || theme.palette.primary.main,
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&::before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
}));

interface MidiSliderProps {
  control: ControlItem;
  onChange: (value: number) => void;
  isEditMode?: boolean;
  selectedMidiOutput?: string | null;
}

export default function MidiSlider({ 
  control, 
  onChange,
  isEditMode = false,
  selectedMidiOutput
}: MidiSliderProps) {
  const { config } = control;
  const { sendCC } = useMIDI();
  const [localValue, setLocalValue] = useState(config.value);
  
  // Set min and max values from config or use defaults
  const minVal = config.midi?.min !== undefined ? config.midi.min : 0;
  const maxVal = config.midi?.max !== undefined ? config.midi.max : 127;
  
  // Default to vertical slider unless specified
  const isVertical = config.orientation !== 'horizontal';
  
  useEffect(() => {
    setLocalValue(config.value);
  }, [config.value]);
  
  const handleChange = (_event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setLocalValue(value);
  };
  
  const handleChangeCommitted = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    
    // If we have MIDI config and a selected output, send the MIDI message
    if (config.midi && selectedMidiOutput && !isEditMode) {
      sendCC(config.midi.channel, config.midi.cc, value);
    }
    
    onChange(value);
  };
  
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          mb: isVertical ? 1 : 0,
          mr: isVertical ? 0 : 2,
          userSelect: 'none',
        }}
      >
        {config.label || 'Slider'}
      </Typography>

      <Box sx={{ 
        flexGrow: 1,
        width: isVertical ? '80%' : '100%',
        height: isVertical ? '100%' : '80%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <StyledSlider
          orientation={isVertical ? 'vertical' : 'horizontal'}
          value={localValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={minVal}
          max={maxVal}
          valueLabelDisplay="auto"
          color={config.color as any}
          disabled={isEditMode}
        />
      </Box>
      
      <Typography
        variant="caption"
        sx={{ 
          mt: isVertical ? 1 : 0,
          ml: isVertical ? 0 : 2,
          userSelect: 'none'
        }}
      >
        {localValue}
      </Typography>
    </Box>
  );
}
