import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';
import { saveControlValue } from '../../utils/controlValueStorage';
import { midiSync } from '../../utils/midiSync';

interface MidiButtonProps {
  control: ControlItem;
  onChange: (value: number) => void;
  onSelect?: () => void;  // Changed to accept no parameters
  isEditMode?: boolean;
  isSelected?: boolean;
  selectedMidiOutput?: string | null;
}

export default function MidiButton({
  control,
  onChange,
  onSelect,  // Updated type
  isEditMode = false,
  isSelected = false,
  selectedMidiOutput,
}: MidiButtonProps) {
  const { config } = control;
  const { 
    subscribeToCC, 
    selectInputDevice, 
    sendCC,
    devices
  } = useMIDI();
  const theme = useTheme();
  
  const onValue = config.midi?.max !== undefined ? config.midi.max : 127;
  const offValue = config.midi?.min !== undefined ? config.midi.min : 0;
  
  const [isPressed, setIsPressed] = useState(false);
  const [_, setMidiStatus] = useState<'ready'|'sent'|'error'>('ready');

  // Add MIDI monitoring setup
  useEffect(() => {
    if (!config.midi || isEditMode) return;

    const outputDevice = devices.find(d => d.id === selectedMidiOutput);
    if (!outputDevice) return;

    const inputDevice = devices.find(d => 
      d.type === 'input' && 
      d.name === outputDevice.name
    );

    if (!inputDevice) {
      console.warn(`No matching input device found for ${outputDevice.name}`);
      return;
    }

    if (selectInputDevice(inputDevice.id)) {
      const unsubscribe = subscribeToCC(
        config.midi.channel ?? 1,  // Default to channel 1
        config.midi.cc ?? 0,  // Default to CC 0
        (value: number) => {
          setIsPressed(value === onValue);
          onChange(value);
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [config.midi, selectedMidiOutput, devices, onValue, isEditMode]);

  // Handle MIDI sync
  useEffect(() => {
    if (!config.midi || isEditMode) return;

    const unsubscribe = midiSync.subscribe(
      config.midi.channel ?? 1,  // Default to channel 1
      config.midi.cc ?? 0,  // Default to CC 0
      (value) => {
        setIsPressed(value === onValue);
        onChange(value);
      }
    );

    return unsubscribe;
  }, [config.midi?.channel, config.midi?.cc, isEditMode, onValue]);

  // Modify these event handlers to allow drag in edit mode
  const handleMouseDown = async (e: React.MouseEvent) => {
    // In edit mode, we delegate the event handling to the parent
    if (isEditMode) {
      onSelect?.();
      // Important: Don't stop propagation in edit mode
      return;
    }
    
    // Normal button behavior in non-edit mode
    e.stopPropagation();
    setIsPressed(true);
    setMidiStatus('sent');
    saveControlValue(control.id, onValue);

    if (config.midi) {
      try {
        const success = sendCC(config.midi.channel ?? 1, config.midi.cc ?? 0, onValue);  // Default to channel 1 and CC 0
        if (!success) {
          setMidiStatus('error');
          return;
        }
        midiSync.notify(config.midi.channel ?? 1, config.midi.cc ?? 0, onValue);  // Default to channel 1 and CC 0
      } catch (err) {
        console.error('Button error:', err);
        setMidiStatus('error');
        return;
      }
    }
    
    onChange(onValue);
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    // Skip in edit mode
    if (isEditMode) return;
    
    // Normal button behavior in non-edit mode
    e.stopPropagation();
    setIsPressed(false);
    saveControlValue(control.id, offValue);

    if (config.midi) {
      try {
        const success = sendCC(config.midi.channel ?? 1, config.midi.cc ?? 0, offValue);  // Default to channel 1 and CC 0
        if (!success) {
          setMidiStatus('error');
          return;
        }
        midiSync.notify(config.midi.channel ?? 1, config.midi.cc ?? 0, offValue);  // Default to channel 1 and CC 0
      } catch (err) {
        console.error('Button error:', err);
        setMidiStatus('error');
        return;
      }
    }
    
    onChange(offValue);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Skip in edit mode
    if (isEditMode) return;
    
    if (isPressed) {
      handleMouseUp(e);
    }
  };

  const color = config.color || theme.palette.primary.main;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1,
        cursor: isEditMode ? 'pointer' : 'pointer',
        opacity: isEditMode && !isSelected ? 0.7 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      // Use pointer-events none in edit mode so parent can receive events
      style={isEditMode ? { pointerEvents: isSelected ? 'auto' : 'none' } : undefined}
    >
      <Box 
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 1,
          border: `2px solid ${isEditMode ? (isSelected ? theme.palette.primary.main : 'rgba(255,255,255,0.3)') : color}`,
          backgroundColor: isPressed ? color : 'transparent',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.1s ease-in-out',
          boxShadow: isPressed ? 'none' : theme.shadows[4],
          transform: isPressed ? 'scale(0.97)' : 'scale(1)',
          position: 'relative',
        }}
      >
        <Typography
          variant="body2"
          align="center"
          sx={{
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            userSelect: 'none',
            color: isPressed ? theme.palette.getContrastText(color) : 'text.primary',
            fontWeight: isPressed ? 'bold' : 'normal',
            px: 1,
          }}
        >
          {config.label || 'Button'}
        </Typography>
        
        {isEditMode && config.midi && (
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute',
              bottom: '5px',
              left: '5px',
              fontSize: '0.6rem',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '2px 4px',
              borderRadius: 1,
              zIndex: 2,
            }}
          >
            {config.midi.cc} | {config.midi.channel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}