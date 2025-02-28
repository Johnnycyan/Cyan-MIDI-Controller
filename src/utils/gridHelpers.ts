import { ControlItem, Position, Size, ControlType } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

// Generate grid template for CSS grid
export function generateGridTemplate(count: number): string {
  return `repeat(${count}, 1fr)`;
}

// Check if a control would overlap with existing controls
export const checkOverlap = (
  position: Position,
  size: Size,
  controls: ControlItem[],
  excludeId?: string
): boolean => {
  for (const control of controls) {
    // Skip the control with the exclude ID (useful when moving an existing control)
    if (excludeId && control.id === excludeId) continue;
    
    // Check for intersection between the two rectangles
    if (
      position.x < control.position.x + control.size.w &&
      position.x + size.w > control.position.x &&
      position.y < control.position.y + control.size.h &&
      position.y + size.h > control.position.y
    ) {
      return true; // Overlap detected
    }
  }
  
  return false; // No overlap
};

// Find next available position for a new control
export const findAvailablePosition = (
  controls: ControlItem[],
  size: Size,
  columns: number,
  rows: number
): Position => {
  for (let y = 0; y <= rows - size.h; y++) {
    for (let x = 0; x <= columns - size.w; x++) {
      const position = { x, y };
      if (!checkOverlap(position, size, controls)) {
        return position;
      }
    }
  }
  
  // If we can't find a position, return 0,0 (will cause overlap)
  return { x: 0, y: 0 };
};

// Create a new control with default settings based on type
export const createNewControl = (
  type: ControlType,
  position: Position
): ControlItem => {
  const id = uuidv4();
  let size: Size;
  let config: any = {
    label: getDefaultLabel(type),
    color: '#2196f3',
    midi: { channel: 1, cc: 1, min: 0, max: 127 }
  };

  // Set size based on control type
  switch (type) {
    case 'slider':
      size = { w: 1, h: 3 };
      config.orientation = 'vertical';
      break;
    case 'knob':
      size = { w: 2, h: 2 };
      break;
    case 'button':
      size = { w: 2, h: 1 };
      config.buttonType = 'momentary';
      config.onValue = 127;
      config.offValue = 0;
      break;
    case 'toggle':
      size = { w: 2, h: 1 };
      config.onValue = 127;
      config.offValue = 0;
      break;
    case 'textbox':
      size = { w: 3, h: 1 };
      config.showLabel = true;
      break;
    case 'label':
      size = { w: 3, h: 1 };
      config.variant = 'body1';
      config.textAlign = 'center';
      config.fontWeight = 'normal';
      config.wrap = true;
      config.backgroundColor = 'transparent';
      break;
    default:
      size = { w: 2, h: 1 };
  }

  return {
    id,
    type,
    position,
    size,
    config
  };
};

// Get a default label based on control type
const getDefaultLabel = (type: ControlType): string => {
  switch (type) {
    case 'slider':
      return 'Slider';
    case 'knob':
      return 'Knob';
    case 'button':
      return 'Button';
    case 'toggle':
      return 'Toggle';
    case 'textbox':
      return 'Value';
    case 'label':
      return 'Label Text';
    default:
      return 'Control';
  }
};

// Validate if position and size are within grid boundaries
export function isWithinGrid(
  position: Position,
  size: Size,
  columns: number,
  rows: number
): boolean {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + size.w <= columns &&
    position.y + size.h <= rows
  );
}

// Export preset to JSON string
export function exportPresetToJson(preset: any): string {
  return JSON.stringify(preset, null, 2);
}

// Parse JSON string to preset object
export function parsePresetFromJson(json: string): any {
  try {
    const parsed = JSON.parse(json);
    return parsed;
  } catch (error) {
    throw new Error('Invalid preset JSON format');
  }
}
