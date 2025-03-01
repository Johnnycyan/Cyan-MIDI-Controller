export interface Position {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface MidiConfig {
  channel?: number;     // Make channel optional
  cc?: number;          // Make cc optional
  min?: number;        // Min value (0-127, default 0)
  max?: number;        // Max value (0-127, default 127)
}

export type ControlType = 'slider' | 'button' | 'toggle' | 'label' | 'textbox';

interface SliderViewMode {
  minValue: number;
  maxValue: number;
  extraText?: string;
  decimalPlaces?: number;
}

export interface SliderConfig {
  steps?: number;
  viewMode?: Partial<SliderViewMode>;  // Changed to allow partial view mode settings
}

export interface ControlConfig {
  label: string;
  color?: string;
  midi?: MidiConfig;
  value: number;
  [key: string]: any; // For control-specific config
  sliderConfig?: SliderConfig;
}

export interface ControlItem {
  id: string;
  type: ControlType;
  position: Position;
  size: Size;
  config: ControlConfig;
}

export interface MidiControllerPreset {
  id: string;
  name: string;
  controls: ControlItem[];
  gridSize: {
    columns: number;
    rows: number;
  };
  midiDeviceId?: string;
}

export const demoChartData = [
  { timestamp: '2023-07-01T10:00:00', successful: 5, total: 8 },
  { timestamp: '2023-07-01T11:00:00', successful: 10, total: 12 },
  { timestamp: '2023-07-01T12:00:00', successful: 15, total: 18 },
  { timestamp: '2023-07-01T13:00:00', successful: 20, total: 22 },
  { timestamp: '2023-07-01T14:00:00', successful: 25, total: 28 },
  { timestamp: '2023-07-01T15:00:00', successful: 30, total: 32 },
  { timestamp: '2023-07-01T16:00:00', successful: 35, total: 38 },
];

export interface ResizeHandleSettings {
  minSize: number;
  maxSize: number;
  scalePercent: number;
  color: string;
  borderColor: string;
  borderWidth: number;
}

export interface AppSettings {
  resizeHandles: ResizeHandleSettings;
  fontSize: {
    controls: number;
    labels: number;
  };
}
