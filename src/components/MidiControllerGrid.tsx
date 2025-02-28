import { Box, useTheme } from '@mui/material';
import { ControlItem } from '../types/index';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import GridItem from './GridItem';
import { checkOverlap, findAvailablePosition } from '../utils/gridHelpers';
import { TransitionGroup } from 'react-transition-group';

// Type for position
interface Position {
  x: number;
  y: number;
}

// Type for size
interface Size {
  w: number;
  h: number;
}

interface MidiControllerGridProps {
  controls: ControlItem[];
  columns: number;
  rows: number;
  isEditMode: boolean;
  selectedControlId: string | null;
  onSelectControl: (id: string | null, element: HTMLElement | null) => void;
  onRightClickControl?: (id: string | null, element: HTMLElement | null) => void;
  onUpdateControl: (id: string, updatedValues: Partial<ControlItem>) => void;
  selectedMidiOutput?: string | null;
  onMoveControl?: (id: string, dx: number, dy: number) => void;
  onResizeControl?: (id: string, dw: number, dh: number) => void;
  transitionSettings?: {
    duration: number;
    easing: string;
  };
  onDragStateChange?: (isDragging: boolean) => void;
}

export default function MidiControllerGrid({
  controls,
  columns,
  rows,
  isEditMode,
  selectedControlId,
  onSelectControl,
  onRightClickControl,
  onUpdateControl,
  selectedMidiOutput,
  onMoveControl,
  onResizeControl,
  transitionSettings = { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  onDragStateChange,
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
  const [resizeHandleOffset] = useState({ x: 0, y: 0 });
  const [dragPreview, setDragPreview] = useState<{
    controlId: string;
    position: { x: number; y: number };
    size: { w: number; h: number };
  } | null>(null);
  const [lastValidPositions, setLastValidPositions] = useState<Record<string, {
    position: { x: number; y: number };
    size: { w: number; h: number };
  }>>({});

  // Fix the duplicate preview issue - only show the grid's preview when actively dragging
  const showPreview = dragState !== null && dragPreview !== null;

  // Memoize cell dimensions calculation
  const { cellWidth, cellHeight } = useMemo(() => ({
    cellWidth: gridSize.width / columns,
    cellHeight: gridSize.height / rows
  }), [gridSize.width, gridSize.height, columns, rows]);

  // Memoize controls by ID for quick lookup
  const controlsById = useMemo(() => {
    const map: Record<string, ControlItem> = {};
    controls.forEach(control => {
      map[control.id] = control;
    });
    return map;
  }, [controls]);

  // Optimize the selection handler
  const selectControl = useCallback((id: string | null, element: HTMLElement | null) => {
    onSelectControl(id, element);
  }, [onSelectControl]);

  // Handle right-click on control
  const handleControlRightClick = useCallback((id: string | null, element: HTMLElement | null) => {
    onRightClickControl?.(id, element);
  }, [onRightClickControl]);

  // Memoize grid background style
  const gridBackgroundStyle = useMemo(() => ({
    backgroundImage: isEditMode ? 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)' : 'none',
    backgroundSize: isEditMode ? `${100 / columns}% ${100 / rows}%` : 'auto',
    border: isEditMode ? '1px dashed rgba(255,255,255,0.1)' : 'none',
    transition: `all ${transitionSettings.duration}ms ${transitionSettings.easing}`,
  }), [isEditMode, columns, rows, transitionSettings]);

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

  // Find nearest available position for a control
  const findNearestAvailablePosition = (
    controlId: string, 
    targetX: number, 
    targetY: number,
    width: number,
    height: number
  ): Position => {
    // First check if the target position itself is available
    if (!checkOverlap(
      { x: targetX, y: targetY },
      { w: width, h: height },
      controls,
      controlId
    )) {
      return { x: targetX, y: targetY };
    }
    
    // If not, find the closest available position using a spiral search pattern
    
    // Try to find a position within a reasonable distance
    const maxDistance = Math.max(columns, rows);
    
    for (let distance = 1; distance <= maxDistance; distance++) {
      // Check positions in a spiral pattern around the target
      for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
          // Skip positions that aren't on the edge of the current spiral distance
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== distance) continue;
          
          const testX = targetX + dx;
          const testY = targetY + dy;
          
          // Skip if out of bounds
          if (testX < 0 || testY < 0 || testX + width > columns || testY + height > rows) continue;
          
          // Check if this position is available
          if (!checkOverlap(
            { x: testX, y: testY },
            { w: width, h: height },
            controls,
            controlId
          )) {
            return { x: testX, y: testY };
          }
        }
      }
    }
    
    // If no position is found, use findAvailablePosition as fallback
    return findAvailablePosition(controls, { w: width, h: height }, columns, rows, controlId);
  };

  // Update last valid position when drag starts or preview changes
  useEffect(() => {
    if (dragPreview) {
      setLastValidPositions(prev => ({
        ...prev,
        [dragPreview.controlId]: {
          position: { ...dragPreview.position },
          size: { ...dragPreview.size }
        }
      }));
    }
  }, [dragPreview]);

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
        const clampedX = Math.max(0, Math.min(columns - control.size.w, targetGridX));
        const clampedY = Math.max(0, Math.min(rows - control.size.h, targetGridY));

        // Check if the position would cause an overlap
        const wouldOverlap = checkOverlap(
          { x: clampedX, y: clampedY },
          control.size,
          controls,
          control.id
        );

        // Get the last valid position or use findNearestAvailablePosition
        let previewPosition: Position;
        if (wouldOverlap) {
          // Use last valid position if available, otherwise find nearest valid position
          if (lastValidPositions[control.id]) {
            previewPosition = lastValidPositions[control.id].position;
          } else {
            previewPosition = findNearestAvailablePosition(
              control.id,
              clampedX,
              clampedY,
              control.size.w,
              control.size.h
            );
          }
        } else {
          // No overlap, we can use this position
          previewPosition = { x: clampedX, y: clampedY };
          
          // Store this as the last valid position
          setLastValidPositions(prev => ({
            ...prev,
            [control.id]: {
              position: previewPosition,
              size: { ...control.size }
            }
          }));
        }

        // Update the preview position
        setDragPreview({
          controlId: control.id,
          position: previewPosition,
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

        // Calculate snapped preview position and size
        const snapX = Math.round(newPreciseX);
        const snapY = Math.round(newPreciseY);
        const snapW = Math.round(newPreciseW);
        const snapH = Math.round(newPreciseH);

        // Check if snapped position would cause an overlap
        const wouldOverlap = checkOverlap(
          { x: snapX, y: snapY },
          { w: snapW, h: snapH },
          controls,
          control.id
        );

        let previewPosition: Position;
        let previewSize: Size;
        if (wouldOverlap) {
          // Use last valid position if available
          if (lastValidPositions[control.id]) {
            previewPosition = lastValidPositions[control.id].position;
            previewSize = lastValidPositions[control.id].size;
          } else {
            // Find nearest valid position as fallback
            previewPosition = findNearestAvailablePosition(
              control.id,
              snapX,
              snapY,
              snapW,
              snapH
            );
            previewSize = { 
              w: Math.min(columns - previewPosition.x, snapW),
              h: Math.min(rows - previewPosition.y, snapH)
            };
          }
        } else {
          // No overlap, we can use this position and size
          previewPosition = { x: snapX, y: snapY };
          previewSize = { 
            w: Math.min(columns - snapX, snapW),
            h: Math.min(rows - snapY, snapH)
          };
          
          // Store this as the last valid position/size
          setLastValidPositions(prev => ({
            ...prev,
            [control.id]: {
              position: previewPosition,
              size: previewSize
            }
          }));
        }
        
        setDragPreview({
          controlId: control.id,
          position: previewPosition,
          size: previewSize
        });
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
      setLastValidPositions({});  // Clear last valid positions

      // Signal that dragging has ended
      onDragStateChange?.(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, isEditMode, controls, columns, rows, cellWidth, cellHeight, onUpdateControl, dragOffset, lastValidPositions, onDragStateChange]);

  // Optimize the drag handler with useCallback
  const handleDragStart = useCallback((e: React.MouseEvent, controlId: string) => {
    if (!isEditMode || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const control = controlsById[controlId];
    if (!control || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const mouseX = e.clientX - gridRect.left;
    const mouseY = e.clientY - gridRect.top;
    
    const controlLeft = control.position.x * cellWidth;
    const controlTop = control.position.y * cellHeight;
    
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
    
    onSelectControl(controlId, e.currentTarget as HTMLElement);
    
    setLastValidPositions({
      [controlId]: {
        position: { ...control.position },
        size: { ...control.size }
      }
    });

    // Signal that dragging has started
    onDragStateChange?.(true);
  }, [isEditMode, controlsById, cellWidth, cellHeight, onSelectControl, onDragStateChange]);

  // Optimize resize handler with useCallback
  const handleResizeStart = useCallback((e: React.MouseEvent, controlId: string, handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => {
    if (!isEditMode || e.button !== 0) return; // Only left mouse button

    e.preventDefault();
    e.stopPropagation();

    const control = controlsById[controlId];
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

    onSelectControl(controlId, e.currentTarget as HTMLElement);

    // Initialize the last valid position when resize starts
    if (control) {
      setLastValidPositions({
        [controlId]: {
          position: { ...control.position },
          size: { ...control.size }
        }
      });
    }

    // Signal that resizing (dragging) has started
    onDragStateChange?.(true);
  }, [isEditMode, controlsById, onSelectControl, onDragStateChange]);

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
        ...gridBackgroundStyle,
      }}
      onClick={(e) => {
        if (e.currentTarget === e.target && isEditMode) {
          onSelectControl(null, null);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault(); // Prevent browser context menu
        if (e.currentTarget === e.target && isEditMode) {
          onSelectControl(null, null); // Deselect when right-clicking background
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
          // Only pass preview to the GridItem if we're NOT actively dragging
          // This prevents duplicate previews when dragging
          preview={!dragState && dragPreview && dragPreview.controlId === control.id ? dragPreview : null}
          onSelect={(element) => selectControl(control.id, element)}
          onContextMenu={(e, element) => handleControlRightClick(control.id, element)}
          onDragStart={(e) => handleDragStart(e, control.id)}
          onResizeStart={(e, handle) => handleResizeStart(e, control.id, handle)}
          transitionSettings={transitionSettings}
        />
      ))}

      {/* Only show grid snap preview during active dragging */}
      {showPreview && dragPreview && (
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
