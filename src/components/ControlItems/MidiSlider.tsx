import { useState, useEffect, useRef, useMemo } from 'react';
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
  
  const channel = config.midi?.channel ?? 1;  // Default to channel 1
  const cc = config.midi?.cc ?? 0;  // Default to CC 0
  const minVal = config.midi?.min ?? 0; // Use nullish coalescing
  const maxVal = config.midi?.max ?? 127;
  
  // Validate and get the actual min/max values considering their order
  const [actualMin, actualMax] = useMemo(() => {
    return [
      Math.min(minVal, maxVal),
      Math.max(minVal, maxVal)
    ];
  }, [minVal, maxVal]);

  const color = config.color || theme.palette.primary.main;
  const fillPercentage = ((localValue - actualMin) / (actualMax - actualMin)) * 100;
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
    
    const range = actualMax - actualMin;
    const stepSize = range / config.sliderConfig.steps;
    
    // Calculate how many steps we are from the minimum
    const steps = Math.round((value - actualMin) / stepSize);
    
    // Convert steps back to value
    return actualMin + (steps * stepSize);
  };

  // Allow any combination of min/max values including zero and negatives
  const formatDisplayValue = (value: number) => {
    if (isEditMode) return Math.round(value);

    if (config.sliderConfig?.viewMode) {
      const { minValue, maxValue, extraText, decimalPlaces = 1 } = config.sliderConfig.viewMode;
      
      if (minValue !== undefined && maxValue !== undefined) {
        const range = maxValue - minValue;
        const percentage = range === 0 
          ? 0 
          : (value - actualMin) / (actualMax - actualMin);
          
        const displayValue = minValue + (range * percentage);
        return `${displayValue.toFixed(decimalPlaces)}${extraText || ''}`;
      }
    }

    // Default percentage display
    const range = actualMax - actualMin;
    const percentage = range === 0 ? 0 : ((value - actualMin) / range) * 100;
    return `${Math.round(percentage)}%`;
  };

  // Add debounce ref and time constant
  const lastUserInteractionRef = useRef<number>(0);
  const MIDI_DEBOUNCE_MS = 2000; // Ignore MIDI input for 500ms after user interaction

  // Common handler for both mouse and touch events
  const handleInteraction = (clientX: number, clientY: number) => {
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
    // Important: sliderRef now only refers to the actual slider part, not the label
    if (isVertical) {
      const height = scaledRect.bottom - scaledRect.top;
      percentage = 1 - ((clientY - scaledRect.top) / height);
    } else {
      const width = scaledRect.right - scaledRect.left;
      percentage = (clientX - scaledRect.left) / width;
    }

    percentage = Math.max(0, Math.min(1, percentage));
    // Calculate raw value first
    let value = actualMin + percentage * (actualMax - actualMin);
    
    // Snap to step if configured
    value = snapToStep(value);
    
    // Ensure value is within bounds after snapping
    value = Math.max(actualMin, Math.min(actualMax, value));
    
    setLocalValue(value);
    saveControlValue(control.id, value);
    
    if (config.midi && selectedMidiOutput) {
      // Ensure MIDI CC values are integers
      const midiValue = Math.round(value);
      sendCC(channel, cc, midiValue);
      midiSync.notify(channel, cc, midiValue);
    }
    onChange(value);

    // Record the interaction time
    lastUserInteractionRef.current = Date.now();
  };

  // Update mouse handler to use common function
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return;
    
    // Apply visual feedback for mouse events too
    if (sliderRef.current) {
      sliderRef.current.style.transform = 'scale(0.97)';
      sliderRef.current.style.boxShadow = 'none';
    }
    
    handleInteraction(e.clientX, e.clientY);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleInteraction(moveEvent.clientX, moveEvent.clientY);
    };
    
    const handleMouseUp = () => {
      // Reset visual state
      if (sliderRef.current) {
        sliderRef.current.style.transform = '';
        sliderRef.current.style.boxShadow = '';
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Add touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditMode) return;
    e.preventDefault(); // Prevent scrolling
    
    // Immediately apply the "active" visual state
    if (sliderRef.current) {
      sliderRef.current.style.transform = 'scale(0.97)';
      sliderRef.current.style.boxShadow = 'none';
    }
    
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      handleInteraction(moveTouch.clientX, moveTouch.clientY);
    };

    const handleTouchEnd = () => {
      // Explicitly reset the "active" visual state
      if (sliderRef.current) {
        sliderRef.current.style.transform = '';
        sliderRef.current.style.boxShadow = '';
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd); // Also handle touch cancellation
  };

  // Subscribe to sync events
  useEffect(() => {
    if (!config.midi || isEditMode) return;

    const unsubscribe = midiSync.subscribe(
      channel,
      cc,
      (value) => {
        // Check if we're within the debounce period
        const timeSinceLastInteraction = Date.now() - lastUserInteractionRef.current;
        if (timeSinceLastInteraction < MIDI_DEBOUNCE_MS) {
          console.debug('Ignoring MIDI input during debounce period');
          return;
        }
        
        setLocalValue(value);
        onChange(value);
      }
    );

    return unsubscribe;
  }, [channel, cc, isEditMode]);

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
              channel,
              cc,
              (value) => {
                // Check if we're within the debounce period
                const timeSinceLastInteraction = Date.now() - lastUserInteractionRef.current;
                if (timeSinceLastInteraction < MIDI_DEBOUNCE_MS) {
                  console.debug('Ignoring MIDI input during debounce period');
                  return;
                }
                
                // Make sure incoming values are integers too
                const intValue = Math.round(value);
                setLocalValue(intValue);
                onChange(intValue);
              }
            );

            // Send a request for the current value if the device supports it
            // Note: Not all devices support this feature
            try {
              // Ensure request CC values are integers
              const success = sendCC(channel, 0x62, Math.round(cc));
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
  }, [config.midi, selectedMidiOutput, isEditMode, devices, channel, cc]);

  return (
    <Box sx={{
      width: '100%', 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column',
      padding: 1,
      userSelect: 'none',
    }}>
      {/* Label for vertical sliders */}
      {isVertical && (
        <Box
          sx={{
            width: '100%',
            mb: 1,
            borderRadius: 1,
            backgroundColor: color,
            padding: '4px',
            textAlign: 'center',
            boxShadow: theme.shadows[1],
          }}
        >
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              color: theme.palette.getContrastText(color),
              fontWeight: 'bold',
            }}
          >
            {config.label || 'Slider'}
          </Typography>
        </Box>
      )}

      {/* Slider element - this is what sliderRef points to */}
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
          // '@media (hover: hover)': {
          //   '&:active': {
          //     transform: isEditMode ? 'none' : 'scale(0.97)',
          //     boxShadow: 'none'
          //   }
          // },
          touchAction: 'none', // Prevent default touch actions
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        tabIndex={isEditMode ? -1 : 0} // Make it focusable when not in edit mode
      >
        {/* Fill area */}
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

        {/* Value display */}
        <Box
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '2px 4px',
            borderRadius: 1,
            zIndex: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.primary',
              fontWeight: 'medium',
              verticalAlign: 'middle',
            }}
          >
            {formatDisplayValue(localValue)}
          </Typography>
        </Box>

        {/* MIDI info in edit mode */}
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