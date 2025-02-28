import { memo } from 'react';
import { Box } from '@mui/material';
import { ControlItem, ControlType } from '../types';
import MidiSlider from './ControlItems/MidiSlider';
import MidiToggle from './ControlItems/MidiToggle';
import MidiButton from './ControlItems/MidiButton';
import LabelControl from './ControlItems/LabelControl';
import TextBoxControl from './ControlItems/TextBoxControl';

interface GridItemProps {
  control: ControlItem;
  cellWidth: number;
  cellHeight: number;
  isSelected: boolean;
  isDragging?: boolean;
  isEditMode: boolean;
  selectedMidiOutput?: string | null;
  preview?: {
    position: { x: number; y: number };
    size: { w: number; h: number };
  } | null;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => void;
  transitionSettings?: {
    duration: number;
    easing: string;
  };
}

const GridItem = memo(({
  control,
  cellWidth,
  cellHeight,
  isSelected,
  isDragging = false,
  isEditMode,
  selectedMidiOutput,
  preview = null,
  onSelect,
  onDragStart,
  onResizeStart,
  transitionSettings = { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, // Default values
}: GridItemProps) => {
  const { position, size, type } = control;
  
  // Calculate pixel positions from grid coordinates
  const left = position.x * cellWidth;
  const top = position.y * cellHeight;
  const width = size.w * cellWidth;
  const height = size.h * cellHeight;
  
  // Control component renderer
  const renderControl = () => {
    const commonProps = {
      control,
      onChange: () => {}, // Will be implemented by actual component
      isEditMode,
      selectedMidiOutput,
      onSelect,
      isSelected,
    };

    switch (type as ControlType) {
      case 'slider':
        return <MidiSlider {...commonProps} />;
      case 'button':
        return <MidiButton {...commonProps} />;
      case 'toggle':
        return <MidiToggle {...commonProps} />;
      case 'label':
        return <LabelControl {...commonProps} />;
      case 'textbox':
        return <TextBoxControl {...commonProps} />;
      default:
        return <Box>Unknown control type</Box>;
    }
  };
  
  // Only render resize handles when selected AND in edit mode
  const renderResizeHandles = () => {
    if (!isSelected || !isEditMode) return null;
    
    const handleSize = Math.min(16, cellWidth * 0.2, cellHeight * 0.2);
    const halfHandleSize = handleSize / 2;
    
    const handles = [
      { position: 'nw', cursor: 'nw-resize', top: -halfHandleSize, left: -halfHandleSize },
      { position: 'n', cursor: 'n-resize', top: -halfHandleSize, left: '50%', transform: 'translateX(-50%)' },
      { position: 'ne', cursor: 'ne-resize', top: -halfHandleSize, right: -halfHandleSize },
      { position: 'e', cursor: 'e-resize', top: '50%', right: -halfHandleSize, transform: 'translateY(-50%)' },
      { position: 'se', cursor: 'se-resize', bottom: -halfHandleSize, right: -halfHandleSize },
      { position: 's', cursor: 's-resize', bottom: -halfHandleSize, left: '50%', transform: 'translateX(-50%)' },
      { position: 'sw', cursor: 'sw-resize', bottom: -halfHandleSize, left: -halfHandleSize },
      { position: 'w', cursor: 'w-resize', top: '50%', left: -halfHandleSize, transform: 'translateY(-50%)' },
    ];
    
    return handles.map(handle => (
      <Box
        key={handle.position}
        sx={{
          position: 'absolute',
          width: handleSize,
          height: handleSize,
          backgroundColor: 'primary.main',
          border: '1px solid white',
          borderRadius: '50%',
          cursor: handle.cursor,
          top: handle.top,
          left: handle.left,
          right: handle.right,
          bottom: handle.bottom,
          transform: handle.transform,
          zIndex: 10,
          '&:hover': {
            backgroundColor: 'primary.light',
          },
        }}
        onMouseDown={(e) => onResizeStart(e, handle.position as any)}
        onClick={(e) => e.stopPropagation()}
      />
    ));
  };

  // Create transition string with configurable values
  const transitionStyle = isDragging 
    ? 'none' 
    : `all ${transitionSettings.duration}ms ${transitionSettings.easing}`;

  return (
    <Box
      sx={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        zIndex: isSelected ? 2 : 1,
        border: isSelected && isEditMode ? '2px dashed primary.main' : 'none',
        boxSizing: 'border-box',
        cursor: isEditMode ? 'move' : 'default',
        transition: transitionStyle, // Use synchronized transition
        opacity: isDragging ? 0.8 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        pointerEvents: isDragging && !isEditMode ? 'none' : 'auto',
      }}
      onMouseDown={isEditMode ? onDragStart : undefined}
      onClick={isEditMode ? onSelect : undefined}
    >
      {renderControl()}
      {renderResizeHandles()}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these specific props change
  const prevSameProps = (
    prevProps.control.id === nextProps.control.id &&
    prevProps.control.position.x === nextProps.control.position.x &&
    prevProps.control.position.y === nextProps.control.position.y &&
    prevProps.control.size.w === nextProps.control.size.w &&
    prevProps.control.size.h === nextProps.control.size.h &&
    prevProps.cellWidth === nextProps.cellWidth &&
    prevProps.cellHeight === nextProps.cellHeight &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isEditMode === nextProps.isEditMode &&
    prevProps.selectedMidiOutput === nextProps.selectedMidiOutput
  );
  
  // Also compare transition settings
  const sameTransition = 
    prevProps.transitionSettings?.duration === nextProps.transitionSettings?.duration &&
    prevProps.transitionSettings?.easing === nextProps.transitionSettings?.easing;
    
  return prevSameProps && sameTransition;
});

export default GridItem;
