import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';
import { toggleHandler } from '../../midi/toggleHandler';
import { saveControlValue, loadControlValue } from '../../utils/controlValueStorage';
import { midiSync } from '../../utils/midiSync';

interface MidiToggleProps {
  control: ControlItem;
  onChange: (value: number) => void;
  onSelect?: (id: string) => void;  // Add this prop
  isEditMode?: boolean;
  isSelected?: boolean;
  selectedMidiOutput?: string | null;
}

export default function MidiToggle({
  control,
  onChange,
  onSelect,  // Add this prop
  isEditMode = false,
  isSelected = false,
  selectedMidiOutput,
}: MidiToggleProps) {
  const { config } = control;
  const { 
    subscribeToCC, 
    selectInputDevice, 
    selectOutputDevice,
    sendCC,  // Add this
    devices, 
    isConnected 
  } = useMIDI();
  const theme = useTheme();
  
  // Set on and off values from config or use defaults
  const onValue = config.midi?.max !== undefined ? config.midi.max : 127;
  const offValue = config.midi?.min !== undefined ? config.midi.min : 0;
  
  const [checked, setChecked] = useState(config.value === onValue);
  const [midiStatus, setMidiStatus] = useState<'ready'|'sent'|'error'>('ready');
  
  // Update state when config value changes
  useEffect(() => {
    setChecked(config.value === onValue);
  }, [config.value, onValue]);
  
  // Reset MIDI status indicator after 1 second
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (midiStatus !== 'ready') {
      timeout = setTimeout(() => setMidiStatus('ready'), 1000);
    }
    return () => clearTimeout(timeout);
  }, [midiStatus]);
  
  // Help debug MIDI device connection issues
  useEffect(() => {
    if (config.midi && selectedMidiOutput && !selectedMidiOutput) {
      console.log(`MidiToggle: Device ID ${selectedMidiOutput} doesn't match any output. Available devices:`, 
        devices.map(d => `${d.name} (${d.type}): ${d.id}`));
    }
  }, [config.midi, selectedMidiOutput, devices]);
  
  // Force synchronize the real selected device with the one passed as prop
  useEffect(() => {
    // Only run once when the component mounts or if selectedMidiOutput changes
    if (selectedMidiOutput && !isConnected) {
      console.log(`MidiToggle: Forcing sync with device ID: ${selectedMidiOutput}`);
      selectOutputDevice(selectedMidiOutput);
    }
  }, [selectedMidiOutput, isConnected, selectOutputDevice]);
  
  // Subscribe to CC changes when the component mounts
  useEffect(() => {
    if (!config.midi || isEditMode) return;

    // Find corresponding input device
    const outputDevice = devices.find(d => d.id === selectedMidiOutput);
    if (!outputDevice) return;

    // Find input device with same name
    const inputDevice = devices.find(d => 
      d.type === 'input' && 
      d.name === outputDevice.name
    );

    if (!inputDevice) {
      console.warn(`No matching input device found for ${outputDevice.name}`);
      return;
    }

    // Select the input device and subscribe to CC changes
    if (selectInputDevice(inputDevice.id)) {
      const unsubscribe = subscribeToCC(
        config.midi.channel || 1,
        config.midi.cc || 1,
        (value: number) => {
          console.log(`Received CC value ${value} for channel ${config.midi?.channel} cc ${config.midi?.cc}`);
          setChecked(value === onValue);
          onChange(value);
        }
      );

      // Request current value
      try {
        sendCC(config.midi.channel || 1, 0x62, config.midi.cc || 1);
      } catch (err) {
        console.debug('Value request not supported by device');
      }

      return () => {
        unsubscribe();
      };
    }
  }, [config.midi, selectedMidiOutput, devices, onValue, isEditMode, selectInputDevice, subscribeToCC, onChange]);

  // Subscribe to sync events
  useEffect(() => {
    if (!config.midi || isEditMode) return;

    const unsubscribe = midiSync.subscribe(
      config.midi.channel,
      config.midi.cc,
      (value) => {
        setChecked(value === onValue);
        onChange(value);
      }
    );

    return unsubscribe;
  }, [config.midi?.channel, config.midi?.cc, isEditMode, onValue]);

  // Load saved value on mount
  useEffect(() => {
    const savedValue = loadControlValue(control.id);
    if (savedValue !== null) {
      setChecked(savedValue === onValue);
      onChange(savedValue);
    }
  }, [control.id]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isEditMode) {
      // In edit mode, select the control
      onSelect?.(control.id);
      return;
    }
    
    handleToggle();
  };

  const handleToggle = async () => {
    if (isEditMode) return;
    
    const newChecked = !checked;
    const newValue = newChecked ? onValue : offValue;
    
    // Save the new value
    saveControlValue(control.id, newValue);
    
    if (config.midi) {
      const previousValue = config.value;
      
      // Optimistically update UI
      setChecked(newChecked);
      setMidiStatus('sent');
      
      try {
        const success = await toggleHandler.sendToggleState(
          config.midi.channel || 1,
          config.midi.cc || 1,
          newValue,
          previousValue
        );
        
        if (!success) {
          // Revert UI on failure
          setChecked(!newChecked);
          setMidiStatus('error');
          console.error('Failed to send MIDI toggle state');
          return;
        }

        // Add sync notification after successful MIDI send
        midiSync.notify(config.midi.channel, config.midi.cc, newValue);
      } catch (err) {
        console.error('Toggle error:', err);
        setMidiStatus('error');
        setChecked(!newChecked);
        return;
      }
    }
    
    onChange(newValue);
  };

  // Reset toggle handler when unmounting
  useEffect(() => {
    return () => {
      toggleHandler.reset();
    };
  }, []);

  // Get the color from config or use theme default
  const color = config.color || theme.palette.primary.main;
  
  // Create a render function for MIDI info to handle the null check once
  const renderMidiInfo = () => {
    if (!config.midi || !isEditMode) return null;
    
    return (
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
    );
  };
  
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
      onClick={handleClick}
    >
      <Box 
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 1,
          border: `2px solid ${isEditMode ? (isSelected ? theme.palette.primary.main : 'rgba(255,255,255,0.3)') : color}`,
          backgroundColor: checked ? color : 'transparent',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'all 0.2s ease-in-out',
          boxShadow: checked ? theme.shadows[4] : 'none',
          position: 'relative',
          '&:hover': {
            opacity: 0.9,
            borderColor: isEditMode ? theme.palette.primary.main : color,
          },
        }}
      >
        {checked && (
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              top: '5px', 
              right: '5px',
              color: theme.palette.getContrastText(color),
            }}
          >
            ON
          </Typography>
        )}
        
        <Typography
          variant="body2"
          align="center"
          sx={{
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            userSelect: 'none',
            color: checked ? theme.palette.getContrastText(color) : 'text.primary',
            fontWeight: checked ? 'bold' : 'normal',
            px: 1,
          }}
        >
          {config.label || 'Toggle'}
        </Typography>
        
        {renderMidiInfo()}
      </Box>
    </Box>
  );
}
