import { Box, useTheme } from '@mui/material';
import { ControlItem } from '../types/index';
// Remove unused imports
import { useState, useRef, useEffect } from 'react';
import GridItem from './GridItem';
import { checkOverlap } from '../utils/gridHelpers';

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
}: MidiControllerGridProps) {
  const theme = useTheme();
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState<{
    controlId: string;
    type: 'move' | 'resize';
    handle?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
    startSize: { w: number; h: number };
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Add the missing state variable
  const [resizeHandleOffset, setResizeHandleOffset] = useState({ x: 0, y: 0 });

  // Calculate cell size based on grid dimensions
  const cellWidth = gridSize.width / columns;
  const cellHeight = gridSize.height / rows;

  // Update grid size on initial render, on column/row changes, and on window resize
  useEffect(() => {
    const updateGridSize = () => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        setGridSize({ width: rect.width, height: rect.height });
      }
    };

    updateGridSize();

    // Use ResizeObserver for more reliable size updates
    let resizeObserver: ResizeObserver;
    if (gridRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(updateGridSize);
      resizeObserver.observe(gridRef.current);
    }

    // Also listen to window resize for fallback support
    window.addEventListener('resize', updateGridSize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateGridSize);
    };
  }, [columns, rows]);

  // Handle mouse move during drag operations with improved positioning
  useEffect(() => {
    if (!dragState || !isEditMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      if (!gridRef.current) return;

      const gridRect = gridRef.current.getBoundingClientRect();

      // Calculate mouse position relative to grid
      const mouseX = e.clientX - gridRect.left;
      const mouseY = e.clientY - gridRect.top;

      // Find the control we're dragging
      const control = controls.find(c => c.id === dragState.controlId);
      if (!control) return;

      if (dragState.type === 'move') {
        // Calculate mouse position in grid coordinates, considering drag offset
        const mouseGridX = mouseX / cellWidth;
        const mouseGridY = mouseY / cellHeight;
        
        // Calculate offset in grid units
        const offsetGridX = dragOffset.x / cellWidth;
        const offsetGridY = dragOffset.y / cellHeight;
        
        // Calculate target position, applying a consistent rounding rule
        // This ensures we move to a grid cell only when we're more than halfway across it
        const targetGridX = Math.floor(mouseGridX - offsetGridX + 0.5);
        const targetGridY = Math.floor(mouseGridY - offsetGridY + 0.5);
        
        // Apply constraints to keep the control within grid boundaries
        const newPosX = Math.max(0, Math.min(columns - control.size.w, targetGridX));
        const newPosY = Math.max(0, Math.min(rows - control.size.h, targetGridY));

        // Only update if position changed
        if (newPosX !== control.position.x || newPosY !== control.position.y) {
          // Check for collisions
          const wouldOverlap = checkOverlap(
            { x: newPosX, y: newPosY },
            control.size,
            controls,
            control.id
          );

          if (!wouldOverlap) {
            onUpdateControl(control.id, {
              position: { x: newPosX, y: newPosY }
            });
          }
        }
      } else if (dragState.type === 'resize') {
        // For resize, use a more conservative snapping approach
        // Only snap to next grid cell when mouse is at least 70% across the cell
        const snapThreshold = 0.7;
        
        // Calculate fractional grid coordinates
        const gridXFractional = mouseX / cellWidth;
        const gridYFractional = mouseY / cellHeight;
        
        // Calculate grid integers with threshold-based rounding
        let gridX = Math.floor(gridXFractional);
        let gridY = Math.floor(gridYFractional);
        
        // Only move to next grid if we're past threshold
        if (gridXFractional - gridX > snapThreshold) gridX += 1;
        if (gridYFractional - gridY > snapThreshold) gridY += 1;
        
        // Apply bounds
        gridX = Math.max(0, Math.min(columns, gridX));
        gridY = Math.max(0, Math.min(rows, gridY));
        
        // Handle resize based on which handle was grabbed
        const { handle, startPos, startSize } = dragState;
        let newX = control.position.x;
        let newY = control.position.y;
        let newW = control.size.w;
        let newH = control.size.h;

        // Calculate new positions based on handle type
        switch (handle) {
          case 'n':
            // North edge - adjust y and height
            // Only allow resizing if we won't make control too small
            if (startPos.y + startSize.h - gridY >= 1) {
              newY = gridY;
              newH = startPos.y + startSize.h - gridY;
            }
            break;
          case 's':
            // South edge - adjust height only
            newH = Math.max(1, gridY - startPos.y);
            break;
          case 'e':
            // East edge - adjust width only
            newW = Math.max(1, gridX - startPos.x);
            break;
          case 'w':
            // West edge - adjust x and width
            // Only allow resizing if we won't make control too small
            if (startPos.x + startSize.w - gridX >= 1) {
              newX = gridX;
              newW = startPos.x + startSize.w - gridX;
            }
            break;
          case 'ne':
            // Northeast corner - adjust y, height, and width
            if (startPos.y + startSize.h - gridY >= 1) {
              newY = gridY;
              newH = startPos.y + startSize.h - gridY;
            }
            newW = Math.max(1, gridX - startPos.x);
            break;
          case 'nw':
            // Northwest corner - adjust x, y, width, and height
            if (startPos.y + startSize.h - gridY >= 1) {
              newY = gridY;
              newH = startPos.y + startSize.h - gridY;
            }
            if (startPos.x + startSize.w - gridX >= 1) {
              newX = gridX;
              newW = startPos.x + startSize.w - gridX;
            }
            break;
          case 'se':
            // Southeast corner - adjust width and height
            newW = Math.max(1, gridX - startPos.x);
            newH = Math.max(1, gridY - startPos.y);
            break;
          case 'sw':
            // Southwest corner - adjust x, width, and height
            if (startPos.x + startSize.w - gridX >= 1) {
              newX = gridX;
              newW = startPos.x + startSize.w - gridX;
            }
            newH = Math.max(1, gridY - startPos.y);
            break;
        }

        // Enforce minimum size and grid boundaries
        newW = Math.max(1, Math.min(columns - newX, newW));
        newH = Math.max(1, Math.min(rows - newY, newH));

        // Check for overlap
        const wouldOverlap = checkOverlap(
          { x: newX, y: newY },
          { w: newW, h: newH },
          controls,
          control.id
        );

        if (!wouldOverlap) {
          onUpdateControl(control.id, {
            position: { x: newX, y: newY },
            size: { w: newW, h: newH }
          });
        }
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      setDragOffset({ x: 0, y: 0 });
      setResizeHandleOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, isEditMode, controls, columns, rows, cellWidth, cellHeight, onUpdateControl, dragOffset]);

  // Start drag operation for moving a control with improved offset calculation
  const handleDragStart = (e: React.MouseEvent, controlId: string) => {
    if (!isEditMode || e.button !== 0) return; // Only left mouse button

    e.preventDefault();
    e.stopPropagation();

    const control = controls.find(c => c.id === controlId);
    if (!control || !gridRef.current) return;

    // Calculate the grid rect
    const gridRect = gridRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to grid - moved before usage
    const mouseX = e.clientX - gridRect.left;
    const mouseY = e.clientY - gridRect.top;

    // Calculate control position in pixels
    const controlLeft = control.position.x * cellWidth;
    const controlTop = control.position.y * cellHeight;

    // Calculate offset within the control
    const offsetX = mouseX - controlLeft;
    const offsetY = mouseY - controlTop;

    setDragOffset({ x: offsetX, y: offsetY });
    
    setDragState({
      controlId,
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...control.position },
      startSize: { ...control.size }
    });

    onSelectControl(controlId);
  };

  // Start resize operation with simplified approach
  const handleResizeStart = (
    e: React.MouseEvent,
    controlId: string,
    handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) => {
    if (!isEditMode || e.button !== 0) return; // Only left mouse button

    e.preventDefault();
    e.stopPropagation();

    const control = controls.find(c => c.id === controlId);
    if (!control || !gridRef.current) return;

    // No need to calculate complex handle offsets
    // Just store the initial state and handle position
    setDragState({
      controlId,
      type: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...control.position },
      startSize: { ...control.size }
    });

    onSelectControl(controlId);
  };

  return (
    <Box
      ref={gridRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.mode === 'dark' ?
          'rgba(30, 30, 30, 0.8)' : 'rgba(240, 240, 240, 0.8)',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: theme.shadows[4],
        backgroundImage: isEditMode ? 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)' : 'none',
        backgroundSize: isEditMode ? `${100 / columns}% ${100 / rows}%` : 'auto',
        border: isEditMode ? '1px dashed rgba(255,255,255,0.1)' : 'none',
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

      {controls.map(control => (
        <GridItem
          key={control.id}
          control={control}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          isSelected={control.id === selectedControlId}
          isEditMode={isEditMode}
          selectedMidiOutput={selectedMidiOutput}
          onSelect={() => onSelectControl(control.id)}
          onDragStart={(e) => handleDragStart(e, control.id)}
          onResizeStart={(e, handle) => handleResizeStart(e, control.id, handle)}
        />
      ))}
    </Box>
  );
}
