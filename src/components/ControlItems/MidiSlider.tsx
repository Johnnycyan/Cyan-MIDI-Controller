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
  
  const minVal = config.midi?.min !== undefined ? config.midi.min : 0;
  const maxVal = config.midi?.max !== undefined ? config.midi.max : 127;
  const color = config.color || theme.palette.primary.main;
  const fillPercentage = ((localValue - minVal) / (maxVal - minVal)) * 100;
  const isVertical = config.orientation !== 'horizontal';

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the width needed for the rotated input to match the container height
  const [inputWidth, setInputWidth] = useState('100%');
  
  useEffect(() => {
    if (isVertical && sliderContainerRef.current) {
      const container = sliderContainerRef.current;
      // The rotated input needs to be as wide as the container is tall
      const heightPercent = (container.clientHeight / container.clientWidth) * 100;
      setInputWidth(`${heightPercent}%`);
    }
  }, [isVertical]);

  useEffect(() => {
    setLocalValue(config.value);
  }, [config.value]);

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
        ref={sliderContainerRef}
        sx={{
          position: 'relative',
          flexGrow: 1,
          border: `2px solid ${color}`,
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        {/* Fill background */}
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
            pointerEvents: 'none',
          }}
        />
        
        {/* Value display */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            color: fillPercentage > 80 ? theme.palette.getContrastText(color) : 'text.primary',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {localValue}
        </Typography>

        <input
          type="range"
          min={minVal}
          max={maxVal}
          value={localValue}
          disabled={isEditMode}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setLocalValue(value);
            if (!isEditMode) {
              if (config.midi && selectedMidiOutput) {
                sendCC(config.midi.channel, config.midi.cc, value);
              }
              onChange(value);
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: isVertical ? inputWidth : '100%',
            height: '100%',
            opacity: 0,
            margin: 0,
            cursor: isEditMode ? 'pointer' : 'pointer',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            ...(isVertical ? {
              transform: 'rotate(-90deg)',
              transformOrigin: 'left center',
            } : {})
          }}
        />
      </Box>
    </Box>
  );
}
