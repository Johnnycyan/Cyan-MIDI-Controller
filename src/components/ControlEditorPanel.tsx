import { useState, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Button,
  Tabs,
  Tab,
  Divider,
  Grid,
  IconButton,
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  ArrowUpward, 
  ArrowDownward, 
  ArrowBack, 
  ArrowForward 
} from '@mui/icons-material';
import { ControlItem } from '../types/index';
import ColorPicker from './ColorPicker';

// Create an optimized TabPanel component
const TabPanel = memo(({ children, value, index }: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) => {
  if (value !== index) return null;
  
  return (
    <Box 
      role="tabpanel"
      id={`control-tabpanel-${index}`}
      aria-labelledby={`control-tab-${index}`}
      sx={{ pt: 2 }}
    >
      {children}
    </Box>
  );
});

// Create memoized form field components to reduce re-renders
const ColorField = memo(({ value, onChange, label }: {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
}) => (
  <ColorPicker
    value={value}
    onChange={(newValue) => {
      // Apply color changes immediately
      if (newValue && newValue.startsWith('#')) {
        onChange(newValue);
      }
    }}
    label={label}
    fullWidth
    multipleValues={[value]} // Just provide the current color
  />
));

const TextField2 = memo(({ value, onChange, label, ...props }: {
  value: string;
  onChange: (newValue: string) => void;
  label: string;
  [key: string]: any;
}) => (
  <TextField
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    fullWidth
    margin="normal"
    size="small"
    {...props}
  />
));

const NumberField = memo(({ value, onChange, label, min, max }: {
  value: number;
  onChange: (newValue: number) => void;
  label: string;
  min?: number;
  max?: number;
}) => (
  <TextField
    label={label}
    type="number"
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
    fullWidth
    margin="normal"
    size="small"
    inputProps={{ min, max }}
  />
));

// Create a control editor panel with optimized rendering
function ControlEditorPanel({
  selectedControl,
  onUpdateControl,
  onDeleteControl,
  onMoveControl,
  gridColumns,
  gridRows
}: {
  selectedControl: ControlItem | null;
  onUpdateControl: (id: string, updatedValues: Partial<ControlItem>) => void;
  onDeleteControl: (id: string) => void;
  onMoveControl: (id: string, dx: number, dy: number) => void;
  gridColumns: number;
  gridRows: number;
}) {
  const [activeTab, setActiveTab] = useState(0);

  // If no control is selected, show a placeholder
  if (!selectedControl) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="body1" align="center" sx={{ py: 2 }}>
          Select a control to edit its properties
        </Typography>
      </Paper>
    );
  }

  // Create a handler function that correctly updates the control
  const updateControlConfig = useCallback((key: string, value: any) => {
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, [key]: value }
    });
  }, [selectedControl?.id, selectedControl?.config, onUpdateControl]);

  // Update nested MIDI properties
  const updateMidiConfig = useCallback((key: string, value: any) => {
    const currentMidi = selectedControl.config.midi || { channel: 1, cc: 1 };
    onUpdateControl(selectedControl.id, {
      config: { 
        ...selectedControl.config, 
        midi: { ...currentMidi, [key]: value } 
      }
    });
  }, [selectedControl?.id, selectedControl?.config, onUpdateControl]);

  // Update slider view mode settings
  const updateSliderViewMode = useCallback((key: string, value: any) => {
    const currentViewMode = selectedControl.config.sliderConfig?.viewMode || {};
    onUpdateControl(selectedControl.id, {
      config: {
        ...selectedControl.config,
        sliderConfig: {
          ...selectedControl.config.sliderConfig,
          viewMode: { ...currentViewMode, [key]: value }
        }
      }
    });
  }, [selectedControl?.id, selectedControl?.config, onUpdateControl]);

  // Update position
  const updatePosition = useCallback((axis: 'x' | 'y', value: number) => {
    if (!selectedControl) return;
    
    const newPosition = {
      ...selectedControl.position,
      [axis]: value
    };
    
    onUpdateControl(selectedControl.id, { position: newPosition });
  }, [selectedControl?.id, selectedControl?.position, onUpdateControl]);

  // Update size
  const updateSize = useCallback((dimension: 'w' | 'h', value: number) => {
    if (!selectedControl) return;
    
    const newSize = {
      ...selectedControl.size,
      [dimension]: value
    };
    
    onUpdateControl(selectedControl.id, { size: newSize });
  }, [selectedControl?.id, selectedControl?.size, onUpdateControl]);

  // Position constraints
  const canMoveUp = selectedControl.position.y > 0;
  const canMoveDown = selectedControl.position.y + selectedControl.size.h < gridRows;
  const canMoveLeft = selectedControl.position.x > 0;
  const canMoveRight = selectedControl.position.x + selectedControl.size.w < gridColumns;

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Edit {selectedControl.type.charAt(0).toUpperCase() + selectedControl.type.slice(1)}
      </Typography>
      
      <Tabs 
        value={activeTab} 
        onChange={(_e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Basic" />
        <Tab label="MIDI" />
        <Tab label="Extra" />
      </Tabs>

      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <TabPanel value={activeTab} index={0}>
          <TextField2
            label="Label"
            value={selectedControl.config.label || ''}
            onChange={(newValue) => updateControlConfig('label', newValue)}
          />

          {selectedControl.type !== 'label' && (
            <ColorField
              label="Color"
              value={selectedControl.config.color || '#2196f3'}
              onChange={(newValue) => updateControlConfig('color', newValue)}
            />
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Position & Size</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <NumberField
                  label="X"
                  value={selectedControl.position.x}
                  onChange={(value) => updatePosition('x', value)}
                  min={0}
                  max={gridColumns - selectedControl.size.w}
                />
              </Grid>
              <Grid item xs={6}>
                <NumberField
                  label="Y"
                  value={selectedControl.position.y}
                  onChange={(value) => updatePosition('y', value)}
                  min={0}
                  max={gridRows - selectedControl.size.h}
                />
              </Grid>
              <Grid item xs={6}>
                <NumberField
                  label="Width"
                  value={selectedControl.size.w}
                  onChange={(value) => updateSize('w', value)}
                  min={1}
                  max={gridColumns - selectedControl.position.x}
                />
              </Grid>
              <Grid item xs={6}>
                <NumberField
                  label="Height"
                  value={selectedControl.size.h}
                  onChange={(value) => updateSize('h', value)}
                  min={1}
                  max={gridRows - selectedControl.position.y}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, 0, -1)}
                disabled={!canMoveUp}
                color="primary"
              >
                <ArrowUpward />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, -1, 0)}
                disabled={!canMoveLeft}
                color="primary"
              >
                <ArrowBack />
              </IconButton>
              
              <Box sx={{ px: 2 }}>
                <Typography variant="body2" align="center">Move</Typography>
              </Box>
              
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, 1, 0)}
                disabled={!canMoveRight}
                color="primary"
              >
                <ArrowForward />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, 0, 1)}
                disabled={!canMoveDown}
                color="primary"
              >
                <ArrowDownward />
              </IconButton>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>MIDI Channel</InputLabel>
            <Select
              value={(selectedControl.config.midi?.channel || 1)}
              onChange={(e) => updateMidiConfig('channel', Number(e.target.value))}
              label="MIDI Channel"
            >
              {Array.from({ length: 16 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  Channel {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="CC Number"
            type="number"
            value={selectedControl.config.midi?.cc || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string or just a minus sign
              if (value === '') {
                updateMidiConfig('cc', value);
                return;
              }
              // Parse as float to allow decimals
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                updateMidiConfig('cc', value);
              }
            }}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />

          {(selectedControl.type === 'slider' || selectedControl.type === 'textbox') && (
            <>
              <TextField
                label="Min Value"
                type="number"
                value={selectedControl.config.midi?.min ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string
                  if (value === '') {
                    updateMidiConfig('min', value);
                    return;
                  }
                  // Parse as float to allow decimals
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    updateMidiConfig('min', value);
                  }
                }}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              />

              <TextField
                label="Max Value"
                type="number"
                value={selectedControl.config.midi?.max ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string
                  if (value === '') {
                    updateMidiConfig('max', value);
                    return;
                  }
                  // Parse as float to allow decimals
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    updateMidiConfig('max', value);
                  }
                }}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              />
            </>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {selectedControl.type === 'slider' && (
            <>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={selectedControl.config.orientation || 'vertical'}
                  onChange={(e) => updateControlConfig('orientation', e.target.value)}
                  label="Orientation"
                >
                  <MenuItem value="vertical">Vertical</MenuItem>
                  <MenuItem value="horizontal">Horizontal</MenuItem>
                </Select>
              </FormControl>

              <NumberField
                label="Steps"
                value={selectedControl.config.sliderConfig?.steps || 0}
                onChange={(value) => {
                  onUpdateControl(selectedControl.id, {
                    config: {
                      ...selectedControl.config,
                      sliderConfig: {
                        ...selectedControl.config.sliderConfig,
                        steps: value || undefined
                      }
                    }
                  });
                }}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Value Display Settings
              </Typography>

              <NumberField
                label="Min Value"
                value={selectedControl.config.sliderConfig?.viewMode?.minValue || 0}
                onChange={(value) => updateSliderViewMode('minValue', value)}
              />

              <NumberField
                label="Max Value"
                value={selectedControl.config.sliderConfig?.viewMode?.maxValue || 100}
                onChange={(value) => updateSliderViewMode('maxValue', value)}
              />

              <TextField2
                label="Extra Text (units)"
                value={selectedControl.config.sliderConfig?.viewMode?.extraText || ''}
                onChange={(value) => updateSliderViewMode('extraText', value)}
                placeholder="e.g. dB, %, Hz"
              />

              <NumberField
                label="Decimal Places"
                value={selectedControl.config.sliderConfig?.viewMode?.decimalPlaces || 1}
                onChange={(value) => updateSliderViewMode('decimalPlaces', value)}
                min={0}
                max={10}
              />
            </>
          )}

          {(selectedControl.type === 'button' || selectedControl.type === 'toggle') && (
            <>
              <TextField
                label="On Value"
                type="number"
                value={selectedControl.config.onValue || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string
                  if (value === '') {
                    updateControlConfig('onValue', value);
                    return;
                  }
                  // Parse as float to allow decimals
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    updateControlConfig('onValue', value);
                  }
                }}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              />

              <TextField
                label="Off Value"
                type="number"
                value={selectedControl.config.offValue || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string
                  if (value === '') {
                    updateControlConfig('offValue', value);
                    return;
                  }
                  // Parse as float to allow decimals
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    updateControlConfig('offValue', value);
                  }
                }}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              />
            </>
          )}

          {selectedControl.type === 'textbox' && (
            <FormControlLabel
              control={
                <Switch
                  checked={selectedControl.config.showLabel !== false}
                  onChange={(e) => updateControlConfig('showLabel', e.target.checked)}
                />
              }
              label="Show Label"
              sx={{ mt: 1 }}
            />
          )}

          {selectedControl.type === 'label' && (
            <>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Text Variant</InputLabel>
                <Select
                  value={selectedControl.config.variant || 'body1'}
                  onChange={(e) => updateControlConfig('variant', e.target.value)}
                  label="Text Variant"
                >
                  <MenuItem value="h1">Heading 1</MenuItem>
                  <MenuItem value="h2">Heading 2</MenuItem>
                  <MenuItem value="h3">Heading 3</MenuItem>
                  <MenuItem value="h4">Heading 4</MenuItem>
                  <MenuItem value="h5">Heading 5</MenuItem>
                  <MenuItem value="h6">Heading 6</MenuItem>
                  <MenuItem value="subtitle1">Subtitle 1</MenuItem>
                  <MenuItem value="subtitle2">Subtitle 2</MenuItem>
                  <MenuItem value="body1">Body 1</MenuItem>
                  <MenuItem value="body2">Body 2</MenuItem>
                  <MenuItem value="caption">Caption</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Text Alignment</InputLabel>
                <Select
                  value={selectedControl.config.textAlign || 'center'}
                  onChange={(e) => updateControlConfig('textAlign', e.target.value)}
                  label="Text Alignment"
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Font Weight</InputLabel>
                <Select
                  value={selectedControl.config.fontWeight || 'normal'}
                  onChange={(e) => updateControlConfig('fontWeight', e.target.value)}
                  label="Font Weight"
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="bold">Bold</MenuItem>
                  <MenuItem value="lighter">Lighter</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedControl.config.wrap !== false}
                    onChange={(e) => updateControlConfig('wrap', e.target.checked)}
                  />
                }
                label="Wrap Text"
                sx={{ mt: 1 }}
              />

              <ColorField
                label="Background Color"
                value={selectedControl.config.backgroundColor || '#ffffff'}
                onChange={(value) => updateControlConfig('backgroundColor', value)}
              />
              
              <ColorField
                label="Text Color"
                value={selectedControl.config.color || '#000000'}
                onChange={(value) => updateControlConfig('color', value)}
              />
            </>
          )}
        </TabPanel>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Button
        variant="contained"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={() => onDeleteControl(selectedControl.id)}
        fullWidth
      >
        Delete Control
      </Button>
    </Paper>
  );
}

// Optimize rendering with memoization
export default memo(ControlEditorPanel, (prevProps, nextProps) => {
  // Only re-render if the selected control changes or if grid dimensions change
  if (prevProps.selectedControl === null && nextProps.selectedControl === null) return true;
  if (prevProps.selectedControl === null || nextProps.selectedControl === null) return false;
  
  return (
    prevProps.selectedControl.id === nextProps.selectedControl.id &&
    prevProps.gridColumns === nextProps.gridColumns &&
    prevProps.gridRows === nextProps.gridRows &&
    JSON.stringify(prevProps.selectedControl.config) === JSON.stringify(nextProps.selectedControl.config) &&
    prevProps.selectedControl.position.x === nextProps.selectedControl.position.x &&
    prevProps.selectedControl.position.y === nextProps.selectedControl.position.y &&
    prevProps.selectedControl.size.w === nextProps.selectedControl.size.w &&
    prevProps.selectedControl.size.h === nextProps.selectedControl.size.h
  );
});
