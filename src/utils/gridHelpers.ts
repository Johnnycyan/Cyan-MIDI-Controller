import { v4 as uuidv4 } from 'uuid';
import { ControlItem, ControlType, Size, Position } from '../types';

/**
 * Check if a position and size would overlap with any existing controls
 * @param position The position to check
 * @param size The size to check
 * @param controls The existing controls
 * @param excludeId Optional ID to exclude from overlap check
 * @returns True if there is an overlap
 */
export const checkOverlap = (
  position: Position,
  size: Size,
  controls: ControlItem[],
  excludeId?: string
): boolean => {
  return controls.some(control => {
    // Skip the control we're checking against itself
    if (control.id === excludeId) return false;
    
    // Calculate bounds for this control
    const thisLeft = position.x;
    const thisRight = position.x + size.w;
    const thisTop = position.y;
    const thisBottom = position.y + size.h;
    
    // Calculate bounds for the other control
    const otherLeft = control.position.x;
    const otherRight = control.position.x + control.size.w;
    const otherTop = control.position.y;
    const otherBottom = control.position.y + control.size.h;
    
    // Check for overlap
    const isOverlapping = (
      thisLeft < otherRight &&
      thisRight > otherLeft &&
      thisTop < otherBottom &&
      thisBottom > otherTop
    );
    
    return isOverlapping;
  });
};

/**
 * Find the first available position for a control with the given size
 * @param controls Existing controls
 * @param size Size of the control to place
 * @param gridColumns Number of columns in the grid
 * @param gridRows Number of rows in the grid
 * @param excludeId Optional ID to exclude from overlap check
 * @returns The first available position
 */
export const findAvailablePosition = (
  controls: ControlItem[],
  size: Size,
  gridColumns: number,
  gridRows: number,
  excludeId?: string
): Position => {
  // Try each position on the grid
  for (let y = 0; y <= gridRows - size.h; y++) {
    for (let x = 0; x <= gridColumns - size.w; x++) {
      const position = { x, y };
      
      // Check if this position is free
      const hasOverlap = checkOverlap(position, size, controls, excludeId);
      
      if (!hasOverlap) {
        return position;
      }
    }
  }
  
  // Fallback: return the top-left corner
  return { x: 0, y: 0 };
};

/**
 * Create a new control with default settings
 * @param type The type of control to create
 * @param position The position for the control
 * @returns A new ControlItem
 */
export const createNewControl = (
  type: ControlType,
  position: Position
): ControlItem => {
  // Default size based on control type
  let size: Size;
  switch (type) {
    case 'slider':
      size = { w: 1, h: 3 };
      break;
    case 'toggle':
    case 'button':
    case 'textbox':
    case 'label':
      size = { w: 2, h: 1 };
      break;
    default:
      size = { w: 2, h: 1 };
  }
  
  // Generate base configs with defaults for the control type
  let config: any = {
    label: getDefaultLabel(type),
    value: 0,
    midi: {
      channel: 1,
      cc: getRandomCC(),
      min: 0,
      max: 127
    }
  };
  
  // Additional type-specific configuration
  switch (type) {
    case 'slider':
      config = {
        ...config,
        orientation: 'vertical',
        sliderConfig: {
          viewMode: {
            minValue: 0,
            maxValue: 100,
            decimalPlaces: 0
          }
        }
      };
      break;
    case 'toggle':
    case 'button':
      config = {
        ...config,
        onValue: 127,
        offValue: 0
      };
      break;
    case 'label':
      config = {
        ...config,
        label: 'Label',
        variant: 'body1',
        color: '#ffffff',
        backgroundColor: 'transparent',
        textAlign: 'center',
        fontWeight: 'normal',
        wrap: true,
      };
      delete config.midi;  // Labels don't need MIDI
      break;
    case 'textbox':
      config = {
        ...config,
        showLabel: true
      };
      break;
  }
  
  return {
    id: uuidv4(),
    type,
    position,
    size,
    config
  };
};

/**
 * Get a default label for a control type
 * @param type The control type
 * @returns A default label string
 */
const getDefaultLabel = (type: ControlType): string => {
  switch (type) {
    case 'slider':
      return 'Slider';
    case 'button':
      return 'Button';
    case 'toggle':
      return 'Toggle';
    case 'textbox':
      return 'Text Input';
    case 'label':
      return 'Label';
    default:
      return 'Control';
  }
};

/**
 * Get a random CC number between 1 and 127
 * @returns A random CC number
 */
const getRandomCC = (): number => {
  return Math.floor(Math.random() * 127) + 1;
};

/**
 * Generate grid template for CSS grid
 * @param count The number of columns or rows
 * @returns A string representing the grid template
 */
export function generateGridTemplate(count: number): string {
  return `repeat(${count}, 1fr)`;
}

/**
 * Validate if position and size are within grid boundaries
 * @param position The position to check
 * @param size The size to check
 * @param columns The number of columns in the grid
 * @param rows The number of rows in the grid
 * @returns True if within grid boundaries
 */
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

/**
 * Export preset to JSON string
 * @param preset The preset object to export
 * @returns A JSON string representing the preset
 */
export function exportPresetToJson(preset: any): string {
  return JSON.stringify(preset, null, 2);
}

/**
 * Parse JSON string to preset object
 * @param json The JSON string to parse
 * @returns The parsed preset object
 * @throws Error if the JSON is invalid
 */
export function parsePresetFromJson(json: string): any {
  try {
    const parsed = JSON.parse(json);
    return parsed;
  } catch (error) {
    throw new Error('Invalid preset JSON format');
  }
}
