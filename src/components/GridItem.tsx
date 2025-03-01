import { memo, useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { ControlItem, ControlType, AppSettings } from '../types';
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
  onSelect: (element: HTMLElement | null) => void; // Modified to pass element
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => void;
  onContextMenu?: (e: React.MouseEvent, element: HTMLElement | null) => void; // New prop
  onLongPress?: (element: HTMLElement | null) => void; // New prop for long press
  transitionSettings?: {
    duration: number;
    easing: string;
  };
  settings: AppSettings;
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
  onContextMenu, // New prop
  transitionSettings = { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, // Default values
  settings,
}: GridItemProps) => {
  const { position, size, type } = control;
  const itemRef = useRef<HTMLDivElement>(null);

  // Long press detection state
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add touch drag state
  const [touchDragActive, setTouchDragActive] = useState(false);

  // Calculate pixel positions from grid coordinates
  const left = position.x * cellWidth;
  const top = position.y * cellHeight;
  const width = size.w * cellWidth;
  const height = size.h * cellHeight;
  
  // Fix the onSelect adapter to match control component expectations
  const handleControlSelect = () => {
    if (isEditMode) {
      onSelect(itemRef.current); // Pass the DOM element for tooltip
    } else {
      // Just pass the ID when not in edit mode
      control.id && control.id;
    }
  };
  
  // Control component renderer - with adapter for onSelect
  const renderControl = () => {
    const commonProps = {
      control,
      onChange: () => {}, // Will be implemented by actual component
      isEditMode,
      selectedMidiOutput,
      // Fix: Adapt the onSelect signature to match what control components expect
      onSelect: () => control.id && handleControlSelect(),
      isSelected,
      settings: settings, // Pass settings to control components
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
  
  const createTouchToMouseHandler = (handle?: string) => {
    return (e: React.TouchEvent) => {
      if (!isEditMode) return; // Early return if not in edit mode
      
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      setTouchDragActive(true);
      
      // Initial mousedown event
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      // Start the operation (either drag or resize)
      if (handle) {
        onResizeStart(mouseDownEvent as unknown as React.MouseEvent, handle as any);
      } else {
        onDragStart(mouseDownEvent as unknown as React.MouseEvent);
      }

      // Document-level handlers for continuous updates
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        document.dispatchEvent(mouseMoveEvent);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        
        const mouseUpEvent = new MouseEvent('mouseup', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        document.dispatchEvent(mouseUpEvent);
        
        setTouchDragActive(false);
        
        // Clean up
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      // Add temporary document listeners
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
    };
  };

  // Only render resize handles when selected AND in edit mode
  const renderResizeHandles = () => {
    if (!isSelected || !isEditMode) return null;
    
    // Use settings for handle sizing
    const { resizeHandles } = settings;
    const minHandleSize = Math.max(resizeHandles.minSize, Math.min(cellWidth, cellHeight) * (resizeHandles.scalePercent / 100));
    const maxHandleSize = Math.min(resizeHandles.maxSize, Math.min(cellWidth, cellHeight) * (resizeHandles.scalePercent / 100));
    const handleSize = Math.min(maxHandleSize, Math.max(minHandleSize, Math.min(cellWidth, cellHeight) * 0.2));
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
          backgroundColor: resizeHandles.color,
          border: `${resizeHandles.borderWidth}px solid ${resizeHandles.borderColor}`,
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
        onTouchStart={createTouchToMouseHandler(handle.position)}
        onClick={(e) => e.stopPropagation()}
      />
    ));
  };

  // Create transition string with configurable values
  const transitionStyle = isDragging 
    ? 'none' 
    : `all ${transitionSettings.duration}ms ${transitionSettings.easing}`;

  // Handle selection on the wrapper element
  const handleItemSelect = () => {
    if (isEditMode) {
      onSelect(itemRef.current);
    }
  };

  // Handle right-click for showing the editor
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditMode && onContextMenu) {
      onContextMenu(e, itemRef.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  // Render preview overlay if needed
  const renderPreview = () => {
    if (!preview) return null;
    
    // Calculate preview position and size in pixels
    const previewLeft = preview.position.x * cellWidth;
    const previewTop = preview.position.y * cellHeight;
    const previewWidth = preview.size.w * cellWidth;
    const previewHeight = preview.size.h * cellHeight;
    
    return (
      <Box
        sx={{
          position: 'absolute',
          left: previewLeft,
          top: previewTop,
          width: previewWidth,
          height: previewHeight,
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 1,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
    );
  };

  return (
    <Box
      ref={itemRef}
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
        transition: transitionStyle,
        opacity: isDragging || touchDragActive ? 0.8 : 1,
        transform: isDragging || touchDragActive ? 'scale(1.02)' : 'scale(1)',
        pointerEvents: 'auto', // Remove the isDragging condition to always allow interactions
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none', // Prevent iOS context menu
      }}
      onMouseDown={isEditMode ? onDragStart : undefined}
      onClick={isEditMode ? handleItemSelect : undefined}
      onContextMenu={handleContextMenu} // Add context menu handler
      // Add touch event handlers
      onTouchStart={isEditMode ? createTouchToMouseHandler() : undefined}
      onTouchMove={isEditMode ? (e) => e.preventDefault() : undefined} // Prevent any default touch handling
      onTouchEnd={isEditMode ? (e) => e.preventDefault() : undefined}
      onTouchCancel={isEditMode ? (e) => e.preventDefault() : undefined}
    >
      {renderControl()}
      {renderResizeHandles()}
      {renderPreview()}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Fix: Update the comparison function to always return a boolean
  // Custom comparison function for memo
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
  
  // Fix: Compare preview safely, make sure it returns a boolean
  let samePreview = false;
  
  if (!prevProps.preview && !nextProps.preview) {
    samePreview = true;
  } else if (prevProps.preview && nextProps.preview) {
    samePreview = (
      prevProps.preview.position.x === nextProps.preview.position.x &&
      prevProps.preview.position.y === nextProps.preview.position.y &&
      prevProps.preview.size.w === nextProps.preview.size.w &&
      prevProps.preview.size.h === nextProps.preview.size.h
    );
  } else {
    samePreview = false; // One is defined and the other is not
  }
  
  // Fix: Compare transition settings safely
  const sameTransition = (
    prevProps.transitionSettings?.duration === nextProps.transitionSettings?.duration &&
    prevProps.transitionSettings?.easing === nextProps.transitionSettings?.easing
  );
  
  // Make sure we return a boolean
  return !!(prevSameProps && samePreview && sameTransition);
});

export default GridItem;
