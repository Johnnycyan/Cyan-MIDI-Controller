import { useState, useEffect, useRef } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';
import { saveControlValue, loadControlValue } from '../../utils/controlValueStorage';
import { midiSync } from '../../utils/midiSync';

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
  const { sendCC, devices, selectInputDevice, subscribeToCC } = useMIDI();
  const [localValue, setLocalValue] = useState(config.value);
  const theme = useTheme();
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const minVal = config.midi?.min !== undefined ? config.midi.min : 0;
  const maxVal = config.midi?.max !== undefined ? config.midi.max : 127;
  const color = config.color || theme.palette.primary.main;
  const fillPercentage = ((localValue - minVal) / (maxVal - minVal)) * 100;
  const isVertical = config.orientation !== 'horizontal';

  useEffect(() => {
    setLocalValue(config.value);
  }, [config.value]);

  // Load saved value on mount
  useEffect(() => {
    const savedValue = loadControlValue(control.id);
    if (savedValue !== null) {
      setLocalValue(savedValue);
      onChange(savedValue);
    }
  }, [control.id]);

  const snapToStep = (value: number) => {
    if (!config.sliderConfig?.steps) return value;
    
    const step = (maxVal - minVal) / config.sliderConfig.steps;
    return Math.round(value / step) * step;
  };

  const formatDisplayValue = (value: number) => {
    if (isEditMode) return value;

    if (config.sliderConfig?.viewMode) {
      const { minValue, maxValue, extraText, decimalPlaces = 1 } = config.sliderConfig.viewMode;
      
      // Check if we have both min and max values defined
      if (minValue !== undefined && maxValue !== undefined) {
        const percentage = (value - minVal) / (maxVal - minVal);
        const displayValue = minValue + (maxValue - minValue) * percentage;
        return `${displayValue.toFixed(decimalPlaces)}${extraText || ''}`;
      }
    }

    // Default percentage display if viewMode is not properly configured
    return `${Math.round((value - minVal) / (maxVal - minVal) * 100)}%`;
  };

  const handleMouseInteraction = (clientX: number, clientY: number) => {
    if (!sliderRef.current || isEditMode) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const scaleActive = document.activeElement === sliderRef.current;
    const scale = scaleActive ? 0.97 : 1;
    
    // Adjust the rect dimensions based on scale
    const scaledRect = {
      top: rect.top + (rect.height * (1 - scale)) / 2,
      bottom: rect.bottom - (rect.height * (1 - scale)) / 2,
      left: rect.left + (rect.width * (1 - scale)) / 2,
      right: rect.right - (rect.width * (1 - scale)) / 2,
      width: rect.width * scale,
      height: rect.height * scale
    };

    let percentage;
    if (isVertical) {
      const height = scaledRect.bottom - scaledRect.top;
      percentage = 1 - ((clientY - scaledRect.top) / height);
    } else {
      const width = scaledRect.right - scaledRect.left;
      percentage = (clientX - scaledRect.left) / width;
    }

    percentage = Math.max(0, Math.min(1, percentage));
    let value = Math.round(minVal + percentage * (maxVal - minVal));
    
    // Snap to steps if configured
    value = snapToStep(value);
    
    setLocalValue(value);
    saveControlValue(control.id, value);
    
    if (config.midi && selectedMidiOutput) {
      sendCC(config.midi.channel, config.midi.cc, value);
      midiSync.notify(config.midi.channel, config.midi.cc, value);
    }
    onChange(value);
  };

  // Subscribe to sync events
  useEffect(() => {
    if (!config.midi || isEditMode) return;

    const unsubscribe = midiSync.subscribe(
      config.midi.channel,
      config.midi.cc,
      (value) => {
        setLocalValue(value);
        onChange(value);
      }
    );

    return unsubscribe;
  }, [config.midi?.channel, config.midi?.cc, isEditMode]);

  // Subscribe to MIDI messages when component mounts
  useEffect(() => {
    if (!config.midi || isEditMode) return;

    const loadInitialValue = async () => {
      try {
        if (selectedMidiOutput && config.midi) {
          // Find input device matching the output
          const outputDevice = devices.find(d => d.id === selectedMidiOutput);
          if (!outputDevice) return;

          const inputDevice = devices.find(d => 
            d.type === 'input' && d.name === outputDevice.name
          );

          if (inputDevice) {
            // Select input device and subscribe to CC messages
            selectInputDevice(inputDevice.id);
            const unsubscribe = subscribeToCC(
              config.midi.channel,
              config.midi.cc,
              (value) => {
                setLocalValue(value);
                onChange(value);
              }
            );

            // Send a request for the current value if the device supports it
            // Note: Not all devices support this feature
            try {
              const success = sendCC(config.midi.channel, 0x62, config.midi.cc);
              if (!success) {
                console.debug('Device might not support value request');
              }
            } catch (err) {
              console.debug('Value request not supported by device');
            }

            return unsubscribe;
          }
        }
      } catch (err) {
        console.error('Error setting up MIDI monitoring:', err);
      }
    };

    loadInitialValue();
  }, [config.midi, selectedMidiOutput, isEditMode, devices]);

  return (
    <Box sx={{
      width: '100%', 
      height: '100%', 
      display: 'flex',
      flexDirection: isVertical ? 'column' : 'column', // Always column
      padding: 1,
      userSelect: 'none',
    }}>
      {isVertical && (
        <Typography
          variant="body2"
          sx={{
            width: '100%',
            textAlign: 'center',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: fillPercentage > 0 ? theme.palette.getContrastText(color) : 'text.primary',
            fontWeight: fillPercentage > 0 ? 'bold' : 'normal',
          }}
        >
          {config.label || 'Slider'}
        </Typography>
      )}

      <Box
        ref={sliderRef}
        sx={{
          position: 'relative',
          flexGrow: 1,
          border: `2px solid ${color}`,
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: 'transparent',
          cursor: isEditMode ? 'default' : 'pointer',
          transition: theme.transitions.create(['transform', 'box-shadow'], {
            duration: '100ms'
          }),
          boxShadow: theme.shadows[1],
          '&:active': {
            transform: isEditMode ? 'none' : 'scale(0.97)',
            boxShadow: 'none'
          },
        }}
        onMouseDown={(e) => {
          if (isEditMode) return;
          handleMouseInteraction(e.clientX, e.clientY);
          
          const handleMouseMove = (moveEvent: MouseEvent) => {
            handleMouseInteraction(moveEvent.clientX, moveEvent.clientY);
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            ...(isVertical ? {
              bottom: 0,
              left: 0,
              width: '100%',
              height: `${fillPercentage}%`,
            } : {
              bottom: 0,
              left: 0,
              width: `${fillPercentage}%`,
              height: '100%',
            }),
            backgroundColor: color,
            transition: 'none',
          }}
        />
        
        {/* For horizontal sliders, show label in center */}
        {!isVertical && (
          <Typography
            variant="body2"
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: fillPercentage > 50 ? theme.palette.getContrastText(color) : 'text.primary',
              fontWeight: fillPercentage > 50 ? 'bold' : 'normal',
              zIndex: 1,
              textAlign: 'center',
              width: '100%',
              padding: '0 8px',
            }}
          >
            {config.label || 'Slider'}
          </Typography>
        )}

        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            color: fillPercentage > 80 ? theme.palette.getContrastText(color) : 'text.primary',
            backgroundColor: isEditMode ? 'rgba(0,0,0,0.6)' : 'transparent',
            padding: isEditMode ? '2px 4px' : 0,
            borderRadius: 1,
            zIndex: 1,
          }}
        >
          {formatDisplayValue(localValue)}
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
