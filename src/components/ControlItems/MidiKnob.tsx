import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';

interface MidiKnobProps {
  control: ControlItem;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange: (value: number) => void;
  selectedMidiOutput?: string | null;
}

export default function MidiKnob({
  control,
  onChange,
  isEditMode = false,
  selectedMidiOutput
}: MidiKnobProps) {
  const { config } = control;
  const { sendCC } = useMIDI();
  const [value, setValue] = useState(config.value || 0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Set min and max values from config or use defaults
  const minVal = config.midi?.min !== undefined ? config.midi.min : 0;
  const maxVal = config.midi?.max !== undefined ? config.midi.max : 127;
  const range = maxVal - minVal;
  
  // Update the local value when the config value changes
  useEffect(() => {
    setValue(config.value || 0);
  }, [config.value]);
  
  // Handle mouse drag to turn the knob
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Prevent text selection
    e.preventDefault();
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Use vertical movement for knob rotation
    const sensitivity = 2; // Pixel movement per value change
    const delta = -e.movementY / sensitivity; // Negative because up = increase
    
    let newValue = value + delta;
    newValue = Math.max(minVal, Math.min(maxVal, newValue)); // Clamp to range
    
    setValue(newValue);
    onChange(newValue);
    
    // Send MIDI if we have a connection
    if (config.midi && selectedMidiOutput) {
      sendCC(config.midi.channel, config.midi.cc, Math.round(newValue));
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Calculate the knob's rotation angle
  const rotation = ((value - minVal) / range) * 270 - 135; // -135 to +135 degrees
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        cursor: isEditMode ? 'default' : 'pointer',
      }}
    >
      <Box
        sx={{
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          backgroundColor: config.color || '#2196f3',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.2)',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Knob indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            width: '2px',
            height: '20%',
            backgroundColor: 'white',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: 'bottom',
          }}
        />
        
        {/* Value display */}
        <Typography
          variant="caption"
          sx={{
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {Math.round(value)}
        </Typography>
      </Box>
      
      {/* Label */}
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          px: 1,
        }}
      >
        {config.label || 'Knob'}
      </Typography>
    </Box>
  );
}
