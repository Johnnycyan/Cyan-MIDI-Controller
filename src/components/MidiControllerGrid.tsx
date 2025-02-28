import { Box, useTheme } from '@mui/material';
import { ControlItem } from '../types/index';
import MidiSlider from './ControlItems/MidiSlider';
import MidiKnob from './ControlItems/MidiKnob';
import MidiButton from './ControlItems/MidiButton';
import MidiToggle from './ControlItems/MidiToggle';
import MidiTextBox from './ControlItems/MidiTextBox';
import MidiLabel from './ControlItems/MidiLabel';

interface MidiControllerGridProps {
  controls: ControlItem[];
  columns: number;
  rows: number;
  isEditMode: boolean;
  selectedControlId: string | null;
  onSelectControl: (id: string | null) => void;
  onUpdateControl: (id: string, updatedValues: Partial<ControlItem>) => void; // Changed from ControlItem['config']
  selectedMidiOutput?: string | null;
  onMoveControl?: (id: string, dx: number, dy: number) => void;
  onResizeControl?: (id: string, dw: number, dh: number) => void;
}

export default function MidiControllerGrid({
  controls,
  columns,
  rows,
  isEditMode,
  selectedControlId,
  onSelectControl,
  onUpdateControl,
  selectedMidiOutput,
  onMoveControl,
  onResizeControl,
}: MidiControllerGridProps) {
  const theme = useTheme();
  
  // Calculate cell dimensions
  const cellWidth = 100 / columns;
  const cellHeight = 100 / rows;
  
  // Render the appropriate control component based on type
  const renderControl = (control: ControlItem) => {
    const isSelected = control.id === selectedControlId;
    
    // Common props for all controls
    const commonProps = {
      control,
      isEditMode,
      isSelected,
      onSelect: () => onSelectControl(control.id),
      onChange: (value: number) => {
        onUpdateControl(control.id, { 
          config: { ...control.config, value } 
        });
      },
      // Pass the selected MIDI output ID to the control components
      selectedMidiOutput
    };
    
    // Position and size styles
    const controlSx = {
      position: 'absolute',
      left: `${control.position.x * cellWidth}%`,
      top: `${control.position.y * cellHeight}%`,
      width: `${control.size.w * cellWidth}%`,
      height: `${control.size.h * cellHeight}%`,
      border: isSelected ? `2px solid ${theme.palette.primary.main}` : isEditMode ? '1px dashed rgba(255,255,255,0.3)' : 'none',
      boxSizing: 'border-box',
      zIndex: isSelected ? 2 : 1,
      borderRadius: theme.shape.borderRadius,
      overflow: 'hidden' // Ensure contents don't overflow
    };
    
    // Render the appropriate control component based on type
    switch (control.type) {
      case 'slider':
        return (
          <Box 
            key={control.id} 
            sx={controlSx} 
            onClick={(e) => {
              if (isEditMode) {
                e.stopPropagation();
                onSelectControl(control.id);
              }
            }}
          >
            <MidiSlider {...commonProps} />
          </Box>
        );
      case 'knob':
        return (
          <Box 
            key={control.id} 
            sx={controlSx} 
            onClick={(e) => {
              if (isEditMode) {
                e.stopPropagation();
                onSelectControl(control.id);
              }
            }}
          >
            <MidiKnob {...commonProps} />
          </Box>
        );
      case 'button':
        return (
          <Box 
            key={control.id} 
            sx={controlSx} 
            onClick={(e) => {
              if (isEditMode) {
                e.stopPropagation();
                onSelectControl(control.id);
              }
            }}
          >
            <MidiButton {...commonProps} />
          </Box>
        );
      case 'toggle':
        return (
          <Box 
            key={control.id} 
            sx={controlSx} 
            onClick={(e) => {
              if (isEditMode) {
                e.stopPropagation();
                onSelectControl(control.id);
              }
            }}
          >
            <MidiToggle {...commonProps} />
          </Box>
        );
      case 'textbox':
        return (
          <Box 
            key={control.id} 
            sx={controlSx} 
            onClick={(e) => {
              if (isEditMode) {
                e.stopPropagation();
                onSelectControl(control.id);
              }
            }}
          >
            <MidiTextBox {...commonProps} />
          </Box>
        );
      case 'label':
        return (
          <Box 
            key={control.id} 
            sx={controlSx} 
            onClick={(e) => {
              if (isEditMode) {
                e.stopPropagation();
                onSelectControl(control.id);
              }
            }}
          >
            <MidiLabel {...commonProps} />
          </Box>
        );
      default:
        return null;
    }
  };

  // Create helper grid lines when in edit mode
  const renderGridLines = () => {
    if (!isEditMode) return null;
    
    const verticalLines = [];
    for (let i = 1; i < columns; i++) {
      verticalLines.push(
        <Box
          key={`v-${i}`}
          sx={{
            position: 'absolute',
            left: `${i * cellWidth}%`,
            top: 0,
            width: '1px',
            height: '100%',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        />
      );
    }
    
    const horizontalLines = [];
    for (let i = 1; i < rows; i++) {
      horizontalLines.push(
        <Box
          key={`h-${i}`}
          sx={{
            position: 'absolute',
            left: 0,
            top: `${i * cellHeight}%`,
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        />
      );
    }
    
    return [...verticalLines, ...horizontalLines];
  };
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? 
          'rgba(30, 30, 30, 0.8)' : 'rgba(240, 240, 240, 0.8)',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: theme.shadows[4]
      }}
      onClick={(e) => {
        // Only clear selection when clicking the grid background
        if (e.currentTarget === e.target && isEditMode) {
          onSelectControl(null);
        }
      }}
    >
      {/* Add a hidden debug element to show the current MIDI output */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 5, 
        right: 5, 
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        pointerEvents: 'none',
        zIndex: 5
      }}>
        {selectedMidiOutput ? `MIDI: ${selectedMidiOutput}` : 'No MIDI selected'}
      </Box>

      {renderGridLines()}
      {controls.map(renderControl)}
    </Box>
  );
}
