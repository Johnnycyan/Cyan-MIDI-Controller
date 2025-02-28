import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';
import { toggleHandler } from '../../midi/toggleHandler';

interface MidiToggleProps {
  control: ControlItem;
  onChange: (value: number) => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  selectedMidiOutput?: string | null;
}

export default function MidiToggle({
  control,
  onChange,
  isEditMode = false,
  selectedMidiOutput
}: MidiToggleProps) {
  const { config } = control;
  const { 
    subscribeToCC, 
    selectInputDevice, 
    selectOutputDevice,
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

      return () => {
        unsubscribe();
      };
    }
  }, [config.midi, selectedMidiOutput, devices, onValue, isEditMode, selectInputDevice, subscribeToCC, onChange]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isEditMode) return;
    
    const newChecked = !checked;
    const newValue = newChecked ? onValue : offValue;
    
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
    if (!config.midi) return null;
    
    return (
      <>
        <Typography 
          variant="caption" 
          sx={{ 
            position: 'absolute',
            bottom: '5px',
            left: '5px',
            fontSize: '0.6rem',
            opacity: 0.7,
            color: checked ? theme.palette.getContrastText(color) : 'text.secondary',
          }}
        >
          CC:{config.midi.cc} CH:{config.midi.channel}
        </Typography>
        
        {/* MIDI Send Status Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: midiStatus === 'sent' 
              ? '#4caf50' 
              : midiStatus === 'error'
                ? '#f44336'
                : isConnected
                  ? '#2196f3'
                  : '#9e9e9e',
            opacity: midiStatus === 'ready' ? 0.4 : 1,
          }}
        />
      </>
    );
  };
  
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
        cursor: isEditMode ? 'default' : 'pointer',
      }}
      onClick={handleToggle}
    >
      <Box 
        sx={{
          width: '100%',
          height: '70%',
          borderRadius: 1,
          border: `2px solid ${isEditMode ? 'rgba(255,255,255,0.3)' : color}`,
          backgroundColor: checked ? color : 'transparent',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'background-color 0.2s ease-in-out',
          boxShadow: checked ? theme.shadows[4] : 'none',
          position: 'relative',
          '&:hover': {
            opacity: isEditMode ? 1 : 0.9,
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
        
        {/* MIDI Info with null check */}
        {renderMidiInfo()}
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
          color: checked ? color : 'text.primary',
          fontWeight: checked ? 'bold' : 'normal',
        }}
      >
        {config.label || 'Toggle'}
      </Typography>
    </Box>
  );
}
