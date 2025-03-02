import { Box, useTheme } from '@mui/material';
import { ControlItem, AppSettings } from '../types/index';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import GridItem from './GridItem';
import { checkOverlap, findAvailablePosition } from '../utils/gridHelpers';

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
  // Update this line to include isMultiSelected parameter:
  onRightClickControl?: (id: string | null, element: HTMLElement | null, isMultiSelected?: boolean) => void;
  onLongPressControl?: (id: string | null, element: HTMLElement | null) => void; // New prop
  onUpdateControl: (id: string, updatedValues: Partial<ControlItem>) => void;
  selectedMidiOutput?: string | null;
  onMoveControl?: (id: string, dx: number, dy: number) => void;
  onResizeControl?: (id: string, dw: number, dh: number) => void;
  transitionSettings?: {
    duration: number;
    easing: string;
  };
  onDragStateChange?: (isDragging: boolean) => void;
  settings: AppSettings;  // Add this prop to the interface
  onSelectControls?: (ids: string[]) => void; // Add this prop
  multiSelectedControlIds?: string[]; // Add this prop
}

const MidiControllerGrid = ({
  controls,
  columns,
  rows,
  isEditMode,
  selectedControlId,
  onSelectControl,
  onRightClickControl,
  // onLongPressControl,
  onUpdateControl,
  selectedMidiOutput,
  transitionSettings = { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  onDragStateChange,
  settings,
  onSelectControls, // Add this prop here
  multiSelectedControlIds, // Add this prop here
}: MidiControllerGridProps) => {
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
    isMultiSelected?: boolean; // Add this flag to track multi-selection dragging
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPreview, setDragPreview] = useState<{
    controlId: string;
    position: { x: number; y: number };
    size: { w: number; h: number };
  } | null>(null);
  const [lastValidPositions, setLastValidPositions] = useState<Record<string, {
    position: { x: number; y: number };
    size: { w: number; h: number };
  }>>({});

  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    active: boolean;
  } | null>(null);

  // @ts-ignore: Used in future implementation
  const [selectedControls, setSelectedControls] = useState<string[]>([]);

  // Add this state to track if we just finished a selection operation
  const [justFinishedSelection, setJustFinishedSelection] = useState(false);

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
  const handleControlRightClick = useCallback((
    id: string | null, 
    element: HTMLElement | null, 
    isMultiSelected?: boolean
  ) => {
    onRightClickControl?.(id, element, isMultiSelected);
  }, [onRightClickControl]);

  // Handle long press on control
  const handleControlLongPress = useCallback((id: string | null, element: HTMLElement | null) => {
    // Check if this is a multi-selected control
    const isMultiSelected = multiSelectedControlIds?.includes(id || '');
    
    // Use the right-click handler for long press, passing the multi-selection status
    onRightClickControl?.(id, element, isMultiSelected);
  }, [onRightClickControl, multiSelectedControlIds]);

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

        // Calculate mouse movement delta from original position
        // const deltaX = preciseX / cellWidth - control.position.x;
        // const deltaY = preciseY / cellHeight - control.position.y;

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

        // Calculate rounded delta for all controls in a multi-selection
        const snapDeltaX = clampedX - Math.round(control.position.x);
        const snapDeltaY = clampedY - Math.round(control.position.y);

        // Handle multi-selected controls movement
        if (dragState.isMultiSelected && multiSelectedControlIds) {
          // Check if any control in the selection would go out of bounds or overlap
          let wouldOverlap = false;
          
          // Store new positions for all controls in the selection
          const newPositions: Record<string, Position> = {};
          
          // First pass: calculate new positions for all selected controls
          multiSelectedControlIds.forEach(id => {
            const selectedControl = controlsById[id];
            if (selectedControl) {
              // Apply the same delta to all selected controls
              const newX = Math.round(selectedControl.position.x) + snapDeltaX;
              const newY = Math.round(selectedControl.position.y) + snapDeltaY;
              
              // Check bounds
              if (newX < 0 || newY < 0 || 
                  newX + selectedControl.size.w > columns ||
                  newY + selectedControl.size.h > rows) {
                wouldOverlap = true;
              }
              
              newPositions[id] = { x: newX, y: newY };
            }
          });
          
          // Second pass: check for overlaps with non-selected controls
          if (!wouldOverlap) {
            for (const id of multiSelectedControlIds) {
              const selectedControl = controlsById[id];
              if (selectedControl) {
                const newPos = newPositions[id];
                // Check if this control would overlap with any non-selected control
                if (checkOverlap(
                  newPos,
                  selectedControl.size,
                  controls.filter(c => !multiSelectedControlIds.includes(c.id)),
                  id
                )) {
                  wouldOverlap = true;
                  break;
                }
              }
            }
          }

          // Update all selected controls precisely (for fluid movement)
          multiSelectedControlIds.forEach(id => {
            const selectedControl = controlsById[id];
            if (selectedControl && id !== dragState.controlId) {
              // Calculate the direct delta from mouse movement
              const originalOffsetX = selectedControl.position.x - control.position.x;
              const originalOffsetY = selectedControl.position.y - control.position.y;
              
              // Apply the same precise movement to all controls
              onUpdateControl(id, {
                position: {
                  // Use direct calculation for smoother movement
                  x: (preciseX / cellWidth) + originalOffsetX,
                  y: (preciseY / cellHeight) + originalOffsetY
                }
              });
            }
          });

          // Update preview for all selected controls
          if (!wouldOverlap) {
            // No overlap, we can use these positions
            const previewUpdates: Record<string, {position: Position; size: Size}> = {};
            
            multiSelectedControlIds.forEach(id => {
              const selectedControl = controlsById[id];
              if (selectedControl) {
                const newPos = newPositions[id];
                previewUpdates[id] = {
                  position: newPos,
                  size: { ...selectedControl.size }
                };
              }
            });
            
            // Store as last valid positions for all controls
            setLastValidPositions(previewUpdates);
            
            // Update main drag preview (for the primary dragged control)
            setDragPreview({
              controlId: control.id,
              position: newPositions[control.id],
              size: { ...control.size }
            });
          } else {
            // Use last valid positions for preview
            setDragPreview({
              controlId: control.id,
              position: lastValidPositions[control.id]?.position || control.position,
              size: { ...control.size }
            });
          }
          
          // Update the dragged control's actual position (follows mouse exactly)
          onUpdateControl(dragState.controlId, {
            position: {
              x: preciseX / cellWidth,
              y: preciseY / cellHeight
            }
          });
        } else {
          // Single control movement (existing logic)
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
        }
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
      
      if (control) {
        if (dragState?.isMultiSelected && multiSelectedControlIds && dragPreview) {
          // For multi-selection, apply the delta between original and final positions to all controls
          // const mainControlDeltaX = dragPreview.position.x - Math.round(dragState.startPos.x);
          // const mainControlDeltaY = dragPreview.position.y - Math.round(dragState.startPos.y);
          
          multiSelectedControlIds.forEach(id => {
            if (id === control.id) {
              // Already handled by the main preview
              onUpdateControl(id, {
                position: { ...dragPreview.position }
              });
            } else {
              // Apply same delta to all other selected controls
              const selectedControl = controlsById[id];
              if (selectedControl && lastValidPositions[id]) {
                onUpdateControl(id, {
                  position: lastValidPositions[id].position
                });
              }
            }
          });
        } else if (dragPreview) {
          // For single control, just apply the preview position
          onUpdateControl(control.id, {
            position: { ...dragPreview.position },
            size: { ...dragPreview.size }
          });
        }
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
    
    // Check if we're dragging as part of a multi-selection
    const isMultiSelected = multiSelectedControlIds?.includes(controlId);
    
    setDragState({
      controlId,
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...control.position },
      startSize: { ...control.size },
      isMultiSelected // Add this flag to track multi-selection dragging
    });
    
    onSelectControl(controlId, e.currentTarget as HTMLElement);

    // Track last valid positions for all controls in the selection
    const validPositions: Record<string, {position: Position; size: Size}> = {};
    
    if (isMultiSelected && multiSelectedControlIds) {
      // Initialize last valid positions for all selected controls
      multiSelectedControlIds.forEach(id => {
        const selectedControl = controlsById[id];
        if (selectedControl) {
          validPositions[id] = {
            position: { ...selectedControl.position },
            size: { ...selectedControl.size }
          };
        }
      });
    } else {
      // Just track the single control
      validPositions[controlId] = {
        position: { ...control.position },
        size: { ...control.size }
      };
    }
    
    setLastValidPositions(validPositions);

    // Signal that dragging has started
    onDragStateChange?.(true);
  }, [isEditMode, controlsById, cellWidth, cellHeight, onSelectControl, onDragStateChange, multiSelectedControlIds]);

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

  // Add touch move handler to document
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (dragState && isEditMode) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [dragState, isEditMode]);

  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || e.button !== 0 || e.target !== e.currentTarget) {
      console.log("Grid mouse down ignored:", {
        isEditMode,
        button: e.button,
        targetIsCurrentTarget: e.target === e.currentTarget
      });
      return;
    }
    
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) {
      console.log("No grid ref available");
      return;
    }
    
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    console.log("Starting selection box at:", { startX, startY });
    
    setSelectionBox({
      startX,
      startY,
      endX: startX,
      endY: startY,
      active: true
    });
  }, [isEditMode]);

  const handleGridMouseMove = useCallback((e: MouseEvent) => {
    if (!selectionBox?.active || !isEditMode) {
      return;
    }
    
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // Only log occasionally to avoid console spam
    if (Math.random() < 0.05) {
      console.log("Moving selection box to:", { currentX, currentY });
    }
    
    setSelectionBox(prev => {
      if (!prev) return null;
      return {
        ...prev,
        endX: currentX,
        endY: currentY
      };
    });
  }, [selectionBox, isEditMode]);

  // Update the handleGridMouseUp function to debug selection and fix any issues
const handleGridMouseUp = useCallback(() => {
  if (!selectionBox?.active || !isEditMode) {
    setSelectionBox(null);
    return;
  }
  
  console.log("Selection box:", selectionBox);
  
  // Check if the selection box is too small (might be an accidental click)
  const selectionWidth = Math.abs(selectionBox.endX - selectionBox.startX);
  const selectionHeight = Math.abs(selectionBox.endY - selectionBox.startY);
  
  if (selectionWidth < 5 && selectionHeight < 5) {
    console.log("Selection box too small, treating as a click");
    setSelectionBox(null);
    return;
  }
  
  // Convert the selection box coordinates to grid coordinates
  const gridStartX = selectionBox.startX / cellWidth;
  const gridStartY = selectionBox.startY / cellHeight;
  const gridEndX = selectionBox.endX / cellWidth;
  const gridEndY = selectionBox.endY / cellHeight;
  
  // Normalize coordinates (in case of dragging from right to left or bottom to top)
  const gridLeft = Math.min(gridStartX, gridEndX);
  const gridTop = Math.min(gridStartY, gridEndY);
  const gridRight = Math.max(gridStartX, gridEndX);
  const gridBottom = Math.max(gridStartY, gridEndY);
  
  console.log("Selection area in grid coordinates:", 
    { left: gridLeft, top: gridTop, right: gridRight, bottom: gridBottom });
  
  // Log all control positions for debugging
  console.log("All controls:", controls.map(control => ({
    id: control.id, 
    type: control.type,
    position: {
      left: control.position.x,
      top: control.position.y,
      right: control.position.x + control.size.w,
      bottom: control.position.y + control.size.h
    }
  })));
  
  // Find controls that intersect with the selection box
  const newSelectedControlIds = controls.filter(control => {
    const controlLeft = control.position.x;
    const controlTop = control.position.y;
    const controlRight = control.position.x + control.size.w;
    const controlBottom = control.position.y + control.size.h;
    
    // Use AABB (Axis-Aligned Bounding Box) intersection test
    const intersects = (
      controlLeft < gridRight &&
      controlRight > gridLeft &&
      controlTop < gridBottom &&
      controlBottom > gridTop
    );
    
    if (intersects) {
      console.log(`Control ${control.id} (${control.type}) intersects with selection box`);
    }
    
    return intersects;
  }).map(control => control.id);
  
  console.log("Selected control IDs:", newSelectedControlIds);
  
  // Update selected controls state
  setSelectedControls(newSelectedControlIds);
  
  // Notify parent component about the selection
  if (newSelectedControlIds.length > 0) {
    console.log("Notifying parent of multiple selection:", newSelectedControlIds);
    onSelectControls?.(newSelectedControlIds);
    
    // Set this flag to prevent immediate selection clearing
    setJustFinishedSelection(true);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setJustFinishedSelection(false);
    }, 100); // Short delay to ensure the click handler doesn't fire immediately
  } else {
    console.log("No controls selected, clearing selection");
    onSelectControls?.([]);
    onSelectControl(null, null);
  }
  
  // Reset the selection box
  setSelectionBox(null);
}, [selectionBox, isEditMode, cellWidth, cellHeight, controls, onSelectControl, onSelectControls]);

  useEffect(() => {
    if (selectionBox?.active) {
      document.addEventListener('mousemove', handleGridMouseMove);
      document.addEventListener('mouseup', handleGridMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGridMouseMove);
        document.removeEventListener('mouseup', handleGridMouseUp);
      };
    }
  }, [selectionBox?.active, handleGridMouseMove, handleGridMouseUp]);

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
        touchAction: 'none', // Prevent browser touch actions
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onClick={(e) => {
        // Check if we just finished a selection - if so, don't clear
        if (justFinishedSelection) {
          console.log("Ignoring click because selection just finished");
          return;
        }
        
        if (e.currentTarget === e.target && isEditMode) {
          console.log("Clicked on grid background, clearing selection");
          onSelectControl(null, null);
          setSelectedControls([]);
          onSelectControls?.([]);
        }
      }}
      onMouseDown={handleGridMouseDown} // Add this handler
      onContextMenu={(e) => {
        e.preventDefault(); // Prevent browser context menu
        if (e.currentTarget === e.target && isEditMode) {
          onSelectControl(null, null); // Deselect when right-clicking background
        }
      }}
      onTouchStart={(e) => {
        // Prevent scrolling while dragging
        if (isEditMode) {
          e.preventDefault();
          e.stopPropagation();
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
        {isEditMode ? (selectedMidiOutput ? `MIDI: ${selectedMidiOutput}` : 'No MIDI selected') : ''}
      </Box>

      {controls.map(control => (
        <GridItem
          key={control.id}
          control={control}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          isSelected={control.id === selectedControlId}
          isMultipleSelected={multiSelectedControlIds?.includes(control.id) || false}
          isDragging={dragState?.controlId === control.id || 
                      (dragState?.isMultiSelected && multiSelectedControlIds?.includes(control.id))}
          isMovingWithMultiSelection={dragState?.isMultiSelected && 
                                     multiSelectedControlIds?.includes(control.id) && 
                                     control.id !== dragState.controlId}
          isEditMode={isEditMode}
          selectedMidiOutput={selectedMidiOutput}
          // Only pass preview to the GridItem if we're NOT actively dragging
          // This prevents duplicate previews when dragging
          preview={!dragState && dragPreview && dragPreview.controlId === control.id ? dragPreview : null}
          onSelect={(element) => selectControl(control.id, element)}
          onContextMenu={(_, element) => handleControlRightClick(
            control.id, 
            element, 
            multiSelectedControlIds?.includes(control.id)
          )}
          onLongPress={(element) => handleControlLongPress(control.id, element)} // New prop
          onDragStart={(e) => handleDragStart(e, control.id)}
          onResizeStart={(e, handle) => handleResizeStart(e, control.id, handle)}
          transitionSettings={transitionSettings}
          settings={settings}
        />
      ))}

      {/* Only show grid snap preview during active dragging */}
      {showPreview && dragPreview && (
        <>
          {/* Preview box for the primary dragged control */}
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
          
          {/* Preview boxes for all other selected controls */}
          {dragState?.isMultiSelected && multiSelectedControlIds && 
            multiSelectedControlIds
              .filter(id => id !== dragState.controlId && lastValidPositions[id])
              .map(id => {
                const previewPos = lastValidPositions[id].position;
                const previewSize = lastValidPositions[id].size;
                const controlItem = controlsById[id];
                
                if (!previewPos || !previewSize || !controlItem) return null;
                
                return (
                  <Box
                    key={`preview-${id}`}
                    sx={{
                      position: 'absolute',
                      left: previewPos.x * cellWidth,
                      top: previewPos.y * cellHeight,
                      width: previewSize.w * cellWidth,
                      height: previewSize.h * cellHeight,
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      pointerEvents: 'none',
                      transition: 'none',
                      zIndex: 1,
                    }}
                  />
                );
              })
          }
        </>
      )}

      {/* Selection box */}
      {selectionBox && (
        <Box
          sx={{
            position: 'absolute',
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY),
            border: '2px dashed',
            borderColor: 'secondary.main',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}
    </Box>
  );
};

export default MidiControllerGrid;
