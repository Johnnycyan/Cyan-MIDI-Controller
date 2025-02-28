import { useState, useEffect, useRef } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ControlItem } from '../../types/index';
import useMIDI from '../../hooks/useMIDI';

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

  const handleMouseInteraction = (clientX: number, clientY: number) => {
    if (!sliderRef.current || isEditMode) return;

    const rect = sliderRef.current.getBoundingClientRect();
    let percentage;

    if (isVertical) {
      const height = rect.bottom - rect.top;
      percentage = 1 - ((clientY - rect.top) / height);
    } else {
      const width = rect.right - rect.left;
      percentage = (clientX - rect.left) / width;
    }

    percentage = Math.max(0, Math.min(1, percentage));
    const value = Math.round(minVal + percentage * (maxVal - minVal));
    
    setLocalValue(value);
    
    if (config.midi && selectedMidiOutput) {
      sendCC(config.midi.channel, config.midi.cc, value);
    }
    onChange(value);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 1 }}>
      <Typography
        variant="body2"
        sx={{
          width: '100%',
          textAlign: 'center',
          mb: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          color: fillPercentage > 0 ? theme.palette.getContrastText(color) : 'text.primary',
          fontWeight: fillPercentage > 0 ? 'bold' : 'normal',
        }}
      >
        {config.label || 'Slider'}
      </Typography>

      <Box
        ref={sliderRef}
        sx={{
          position: 'relative',
          flexGrow: 1,
          border: `2px solid ${color}`,
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: 'transparent',
          cursor: 'pointer',
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
        
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            color: fillPercentage > 80 ? theme.palette.getContrastText(color) : 'text.primary',
            zIndex: 1,
          }}
        >
          {localValue}
        </Typography>
      </Box>
    </Box>
  );
}
