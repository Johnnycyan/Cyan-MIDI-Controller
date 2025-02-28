import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';

interface MidiButtonProps {
  control: ControlItem;
  onChange: (value: number) => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  // Removed unused selectedMidiOutput prop
}

export default function MidiButton({
  control,
  onChange,
  isEditMode = false,
}: MidiButtonProps) {
  const { config } = control;
  const { sendCC, isConnected, selectedOutput } = useMIDI();
  const theme = useTheme();
  
  const [isPressed, setIsPressed] = useState(false);
  
  // Get button type from config (momentary or toggle)
  const buttonType = config.buttonType || 'momentary';
  
  // Set on and off values from config or use defaults
  const onValue = config.midi?.max !== undefined ? config.midi.max : 127;
  const offValue = config.midi?.min !== undefined ? config.midi.min : 0;
  
  // Update when config value changes
  useEffect(() => {
    if (buttonType === 'toggle') {
      setIsPressed(config.value === onValue);
    }
  }, [config.value, onValue, buttonType]);
  
  const handleMouseDown = () => {
    if (isEditMode) return;
    
    if (buttonType === 'momentary') {
      setIsPressed(true);
      sendMidiValue(onValue);
    } else {
      // Toggle mode
      const newPressed = !isPressed;
      setIsPressed(newPressed);
      sendMidiValue(newPressed ? onValue : offValue);
    }
  };
  
  const handleMouseUp = () => {
    if (isEditMode || buttonType === 'toggle') return;
    
    // Only for momentary buttons, release when mouse up
    setIsPressed(false);
    sendMidiValue(offValue);
  };
  
  const handleMouseLeave = () => {
    if (isEditMode || buttonType === 'toggle' || !isPressed) return;
    
    // Only for momentary buttons, release when mouse leaves
    setIsPressed(false);
    sendMidiValue(offValue);
  };
  
  const sendMidiValue = (value: number) => {
    // Always send the MIDI message regardless of selectedMidiOutput
    // as the hook will handle the case when no device is connected
    if (config.midi) {
      console.log(`Sending MIDI CC: ch=${config.midi.channel || 1}, cc=${config.midi.cc || 1}, val=${value}, connected=${isConnected}, output=${selectedOutput?.name || 'none'}`);
      const success = sendCC(
        config.midi.channel || 1,
        config.midi.cc || 1,
        value
      );
      
      if (!success) {
        console.warn('MIDI send failed - check connection status');
      }
    }
    
    onChange(value);
  };
  
  // Get the color from config or use theme default
  const color = config.color || theme.palette.primary.main;
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '70%',
          borderRadius: theme.shape.borderRadius,
          backgroundColor: isPressed ? color : 'transparent',
          border: `2px solid ${isEditMode ? 'rgba(255,255,255,0.3)' : color}`,
          color: isPressed ? theme.palette.getContrastText(color) : color,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.1s ease-out',
          cursor: isEditMode ? 'default' : 'pointer',
          boxShadow: isPressed ? 'none' : theme.shadows[2],
          transform: isPressed ? 'translateY(2px)' : 'translateY(0)',
          userSelect: 'none',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Button text or indication */}
        {buttonType === 'toggle' && isPressed && (
          <Typography variant="caption" sx={{ position: 'absolute', top: '5px', right: '5px' }}>
            ON
          </Typography>
        )}
        
        {/* Debugging display */}
        {config.midi && (
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute',
              bottom: '5px',
              left: '5px',
              fontSize: '0.6rem',
              opacity: 0.7,
              color: isPressed ? theme.palette.getContrastText(color) : 'text.secondary',
            }}
          >
            CC:{config.midi.cc} CH:{config.midi.channel}
          </Typography>
        )}
      </Box>
      
      <Typography
        variant="body2"
        align="center"
        sx={{
          mt: 1,
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          userSelect: 'none',
        }}
      >
        {config.label || 'Button'}
      </Typography>
    </Box>
  );
}