import { Box, useTheme } from '@mui/material';
import { ControlItem } from '../types/index';
// Remove unused imports
import { useState, useRef, useEffect } from 'react';
import GridItem from './GridItem';
import { checkOverlap } from '../utils/gridHelpers';
import { TransitionGroup } from 'react-transition-group';

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
  // Add new state for preview positioning
  const [dragPreview, setDragPreview] = useState<{
    controlId: string;
    position: { x: number; y: number };
    size: { w: number; h: number };
  } | null>(null);

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

  // Handle mouse move during drag operations with improved positioning and previews
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
        // For the actual control's precise position (follows mouse exactly)
        const preciseX = mouseX - dragOffset.x;
        const preciseY = mouseY - dragOffset.y;

        // For the snapping preview
        // Calculate mouse position in grid coordinates, considering drag offset
        const mouseGridX = mouseX / cellWidth;
        const mouseGridY = mouseY / cellHeight;

        // Calculate offset in grid units
        const offsetGridX = dragOffset.x / cellWidth;
        const offsetGridY = dragOffset.y / cellHeight;

        // Calculate target position, applying a consistent rounding rule
        const targetGridX = Math.floor(mouseGridX - offsetGridX + 0.5);
        const targetGridY = Math.floor(mouseGridY - offsetGridY + 0.5);

        // Apply constraints for the preview
        const snapX = Math.max(0, Math.min(columns - control.size.w, targetGridX));
        const snapY = Math.max(0, Math.min(rows - control.size.h, targetGridY));

        // Check for collisions for the preview
        const wouldOverlap = checkOverlap(
          { x: snapX, y: snapY },
          control.size,
          controls,
          control.id
        );

        // Update the preview position (for snapping guidelines)
        setDragPreview({
          controlId: control.id,
          position: {
            x: wouldOverlap ? control.position.x : snapX,
            y: wouldOverlap ? control.position.y : snapY
          },
          size: { ...control.size }
        });

        // Update the actual control with precise position (follows mouse exactly)
        onUpdateControl(control.id, {
          position: {
            x: preciseX / cellWidth,
            y: preciseY / cellHeight
          }
        });
      } else if (dragState.type === 'resize') {
        // Get precise mouse position in grid coordinates
        const preciseGridX = mouseX / cellWidth;
        const preciseGridY = mouseY / cellHeight;

        // Get the initial control position and size
        const { startPos, startSize, handle } = dragState;

        // Calculate new precise dimensions based on handle
        let newPreciseX = control.position.x;
        let newPreciseY = control.position.y;
        let newPreciseW = control.size.w;
        let newPreciseH = control.size.h;

        // Apply fluid resize calculations based on handle type
        switch (handle) {
          case 'n':
            // Adjust y and height for north handle
            newPreciseY = preciseGridY;
            newPreciseH = Math.max(1, startPos.y + startSize.h - preciseGridY);
            break;
          case 's':
            // Adjust height for south handle
            newPreciseH = Math.max(1, preciseGridY - startPos.y);
            break;
          case 'e':
            // Adjust width for east handle
            newPreciseW = Math.max(1, preciseGridX - startPos.x);
            break;
          case 'w':
            // Adjust x and width for west handle
            newPreciseX = preciseGridX;
            newPreciseW = Math.max(1, startPos.x + startSize.w - preciseGridX);
            break;
          case 'ne':
            // Adjust y, height, and width for northeast handle
            newPreciseY = preciseGridY;
            newPreciseH = Math.max(1, startPos.y + startSize.h - preciseGridY);
            newPreciseW = Math.max(1, preciseGridX - startPos.x);
            break;
          case 'nw':
            // Adjust x, y, width, and height for northwest handle
            newPreciseX = preciseGridX;
            newPreciseY = preciseGridY;
            newPreciseW = Math.max(1, startPos.x + startSize.w - preciseGridX);
            newPreciseH = Math.max(1, startPos.y + startSize.h - preciseGridY);
            break;
          case 'se':
            // Adjust width and height for southeast handle
            newPreciseW = Math.max(1, preciseGridX - startPos.x);
            newPreciseH = Math.max(1, preciseGridY - startPos.y);
            break;
          case 'sw':
            // Adjust x, width, and height for southwest handle
            newPreciseX = preciseGridX;
            newPreciseW = Math.max(1, startPos.x + startSize.w - preciseGridX);
            newPreciseH = Math.max(1, preciseGridY - startPos.y);
            break;
        }

        // Apply bounds to fluid position and size
        newPreciseX = Math.max(0, newPreciseX);
        newPreciseY = Math.max(0, newPreciseY);
        newPreciseW = Math.min(columns - newPreciseX, newPreciseW);
        newPreciseH = Math.min(rows - newPreciseY, newPreciseH);

        // Update control with fluid position (follows mouse exactly)
        onUpdateControl(control.id, {
          position: { x: newPreciseX, y: newPreciseY },
          size: { w: newPreciseW, h: newPreciseH }
        });

        // Now calculate the snapped preview position and size
        const snapX = Math.round(newPreciseX);
        const snapY = Math.round(newPreciseY);
        const snapW = Math.round(newPreciseW);
        const snapH = Math.round(newPreciseH);

        // Check for collisions with the snapped preview
        const wouldOverlap = checkOverlap(
          { x: snapX, y: snapY },
          { w: snapW, h: snapH },
          controls,
          control.id
        );

        // Update the preview to show where it will snap
        if (!wouldOverlap) {
          setDragPreview({
            controlId: control.id,
            position: { x: snapX, y: snapY },
            size: { w: snapW, h: snapH }
          });
        }
      }
    };

    const handleMouseUp = () => {
      const control = controls.find(c => c.id === dragState?.controlId);
      if (control && dragPreview) {
        // On mouse up, snap to the preview position/size
        onUpdateControl(control.id, {
          position: { ...dragPreview.position },
          size: { ...dragPreview.size }
        });
      }

      // Clear states
      setDragState(null);
      setDragPreview(null);
      setDragOffset({ x: 0, y: 0 });
      setResizeHandleOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, isEditMode, controls, columns, rows, cellWidth, cellHeight, onUpdateControl, dragOffset, dragPreview]);

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
          isDragging={dragState?.controlId === control.id}
          isEditMode={isEditMode}
          selectedMidiOutput={selectedMidiOutput}
          preview={dragPreview && dragPreview.controlId === control.id ? dragPreview : null}
          onSelect={() => onSelectControl(control.id)}
          onDragStart={(e) => handleDragStart(e, control.id)}
          onResizeStart={(e, handle) => handleResizeStart(e, control.id, handle)}
        />
      ))}

      {/* Show grid snap preview */}
      {dragPreview && (
        <Box
          sx={{
            position: 'absolute',
            left: dragPreview.position.x * cellWidth,
            top: dragPreview.position.y * cellHeight,
            width: dragPreview.size.w * cellWidth,
            height: dragPreview.size.h * cellHeight,
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 1,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            pointerEvents: 'none',
            transition: 'none',
            zIndex: 1,
          }}
        />
      )}
    </Box>
  );
}
