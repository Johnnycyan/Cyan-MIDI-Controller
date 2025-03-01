import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';

interface MidiControlProps {
  isEditMode: boolean;
  onRightClickControl?: (element: HTMLElement | null) => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onDrag?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
}

const MidiControl: React.FC<MidiControlProps> = ({
  isEditMode,
  onRightClickControl,
  onDragStart,
  onDrag,
  onDragEnd
}) => {
  const controlRef = useRef<HTMLDivElement>(null);
  const [touchTimeout, setTouchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditMode) return;
    
    // Prevent scrolling and other default touch behaviors
    e.preventDefault();
    e.stopPropagation();
  
    const touch = e.touches[0];
    
    // Start long press timer
    const timeout = setTimeout(() => {
      onRightClickControl?.(controlRef.current);
    }, 500);
  
    setTouchTimeout(timeout);
  
    // Convert touch to mouse event for drag handling
    const fakeEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {},
      button: 0
    } as unknown as React.MouseEvent;
  
    onDragStart?.(fakeEvent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEditMode) return;
    
    // Prevent scrolling and other default touch behaviors
    e.preventDefault();
    e.stopPropagation();
  
    // Clear long press timeout if moving
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
  
    const touch = e.touches[0];
    
    // Convert touch to mouse event for drag handling
    const fakeEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {},
      buttons: 1  // Indicate primary button is pressed
    } as unknown as React.MouseEvent;
  
    onDrag?.(fakeEvent);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isEditMode) return;
    
    // Prevent any default touch behaviors
    e.preventDefault();
    e.stopPropagation();
  
    // Clear long press timeout
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
  
    onDragEnd?.();
  };

  return (
    <Box
      ref={controlRef}
      sx={{
        // ...existing styles...
        touchAction: 'none', // Prevent browser touch actions
      }}
      onMouseDown={onDragStart}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        // Prevent default context menu
        e.preventDefault();
        if (isEditMode) {
          onRightClickControl?.(controlRef.current);
        }
      }}
    >
      {/* ...existing code... */}
    </Box>
  );
};

export default MidiControl;
