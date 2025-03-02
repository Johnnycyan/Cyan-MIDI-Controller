// src/components/MultiControlEditor.tsx
import { useState } from 'react';
import {
  Box,
  Popover,
  Typography,
  Tabs,
  Tab,
  Divider,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ControlItem, ControlType } from '../types';
import ColorPicker from './ColorPicker';

interface MultiControlEditorProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  selectedControls: ControlItem[];
  controlsType: ControlType | null; 
  onUpdateControls: (updatedControls: ControlItem[]) => void;
  onDeleteControls: (ids: string[]) => void;
}

const MultiControlEditor = ({
  anchorEl,
  open,
  onClose,
  selectedControls,
  controlsType,
  onUpdateControls,
  onDeleteControls,
}: MultiControlEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>('common');

  // Update the updateCommonAttribute function to check if it should update in config
  const updateCommonAttribute = (attribute: string, value: any) => {
    console.log(`Updating ${attribute} to ${value} for ${selectedControls.length} controls`);
    
    // Determine if this attribute belongs in the config object
    const shouldUpdateInConfig = ['color', 'label'].includes(attribute);
    
    const updatedControls = selectedControls.map(control => {
      // Create a deep copy to ensure we're not modifying the original
      const updatedControl = JSON.parse(JSON.stringify(control));
      
      // Update in the right place
      if (shouldUpdateInConfig) {
        if (!updatedControl.config) {
          updatedControl.config = {};
        }
        updatedControl.config[attribute] = value;
        
        // Also update at the top level for backwards compatibility
        updatedControl[attribute] = value;
      } else {
        // For other attributes, update directly
        updatedControl[attribute] = value;
      }
      
      return updatedControl;
    });
    
    // Add explicit console log to see what's being updated
    console.log('Updated controls:', updatedControls);
    onUpdateControls(updatedControls);
  };

  // Update type-specific config
  const updateConfig = (configKey: string, value: any) => {
    const updatedControls = selectedControls.map(control => ({
      ...control,
      config: {
        ...control.config,
        [configKey]: value
      }
    }));
    onUpdateControls(updatedControls);
  };

  // First, update the updateConfig method to handle nested slider configs:
  const updateSliderConfig = (key: string, value: any) => {
    const updatedControls = selectedControls.map(control => {
      if (!control.config.sliderConfig) {
        control.config.sliderConfig = {};
      }
      
      // Create a new config object that we'll modify
      const updatedConfig = {...control.config};
      
      // If it's orientation, also update at top level for backward compatibility
      if (key === 'orientation') {
        updatedConfig.orientation = value;
      }
      
      return {
        ...control,
        config: {
          ...updatedConfig,
          sliderConfig: {
            ...control.config.sliderConfig,
            [key]: value
          }
        }
      };
    });
    onUpdateControls(updatedControls);
  };

  // Add another function for slider viewMode settings
  const updateSliderViewMode = (key: string, value: any) => {
    const updatedControls = selectedControls.map(control => {
      if (!control.config.sliderConfig) {
        control.config.sliderConfig = {};
      }
      if (!control.config.sliderConfig.viewMode) {
        control.config.sliderConfig.viewMode = {};
      }
      
      return {
        ...control,
        config: {
          ...control.config,
          sliderConfig: {
            ...control.config.sliderConfig,
            viewMode: {
              ...control.config.sliderConfig.viewMode,
              [key]: value
            }
          }
        }
      };
    });
    onUpdateControls(updatedControls);
  };

  // For MIDI settings
  const updateMidiConfig = (key: string, value: any) => {
    const updatedControls = selectedControls.map(control => {
      if (!control.config.midi) {
        control.config.midi = {};
      }
      
      return {
        ...control,
        config: {
          ...control.config,
          midi: {
            ...control.config.midi,
            [key]: value
          }
        }
      };
    });
    onUpdateControls(updatedControls);
  };

  // Handle delete for all selected controls
  const handleDeleteAll = () => {
    onDeleteControls(selectedControls.map(c => c.id));
    onClose();
  };

  // Update the getCommonAttributeValue function to check both locations
  const getCommonAttributeValue = (attribute: string, defaultValue: any = ''): any => {
    if (selectedControls.length === 0) return defaultValue;
    
    // Check if this attribute might be in config
    const shouldCheckConfig = ['color', 'label'].includes(attribute);
    
    const getAttributeValue = (control: ControlItem) => {
      // First try direct access
      const directValue = (control as any)[attribute];
      if (directValue !== undefined) return directValue;
      
      // Then try in config if appropriate
      if (shouldCheckConfig && control.config && control.config[attribute] !== undefined) {
        return control.config[attribute];
      }
      
      return defaultValue;
    };
    
    const firstValue = getAttributeValue(selectedControls[0]);
    const allSame = selectedControls.every(control => 
      JSON.stringify(getAttributeValue(control)) === JSON.stringify(firstValue)
    );
    
    return allSame ? firstValue : '';
  };

  // Add this function to handle config property values
  const getCommonConfigValue = (configKey: string, defaultValue: any = ''): any => {
    if (selectedControls.length === 0) return defaultValue;
    
    // Check if first control has a config property
    if (!selectedControls[0].config) return defaultValue;
    
    const firstValue = selectedControls[0].config[configKey];
    const allSame = selectedControls.every(control => 
      control.config && JSON.stringify(control.config[configKey]) === JSON.stringify(firstValue)
    );
    
    return allSame ? firstValue : '';
  };

  // Add getter functions for nested values
  const getSliderConfig = (key: string, defaultValue: any = '') => {
    if (selectedControls.length === 0) return defaultValue;
    
    const firstValue = selectedControls[0]?.config?.sliderConfig && 
      (selectedControls[0]?.config?.sliderConfig as Record<string, any>)[key];
    const allSame = selectedControls.every(control => 
      control.config?.sliderConfig && 
      (control.config?.sliderConfig as Record<string, any>)[key] === firstValue
    );
    
    return allSame ? (firstValue ?? defaultValue) : '';
  };

  const getSliderViewMode = (key: string, defaultValue: any = '') => {
    if (selectedControls.length === 0) return defaultValue;
    
    const firstValue = selectedControls[0]?.config?.sliderConfig?.viewMode && 
      (selectedControls[0]?.config?.sliderConfig.viewMode as Record<string, any>)[key];
    const allSame = selectedControls.every(control => 
      control.config?.sliderConfig?.viewMode && 
      (control.config?.sliderConfig.viewMode as Record<string, any>)[key] === firstValue
    );
    
    return allSame ? (firstValue ?? defaultValue) : '';
  };

  const getMidiConfig = (key: string, defaultValue: any = '') => {
    if (selectedControls.length === 0) return defaultValue;
    
    const firstValue = selectedControls[0]?.config?.midi && 
      (selectedControls[0]?.config?.midi as Record<string, any>)[key];
    const allSame = selectedControls.every(control => 
      control.config?.midi && 
      (control.config?.midi as Record<string, any>)[key] === firstValue
    );
    
    return allSame ? (firstValue ?? defaultValue) : '';
  };

  // Update getAllColors to check both locations
  const getAllColors = () => {
    // First collect all colors
    const colors = selectedControls
      .map(control => {
        // Try to get color from direct property first
        let color = (control as any).color;
        
        // If not found, try from config
        if (!color && control.config && control.config.color) {
          color = control.config.color;
        }
        
        return color && color.startsWith('#') ? color.toLowerCase() : '#3f51b5'; // Use default if color is not valid
      });
    
    // Log the colors for debugging
    console.log("Raw colors from controls:", colors);
    
    // Return the array of colors
    return colors;
  };

  console.log("All controls for color selection:", selectedControls.map(c => ({
    id: c.id,
    color: (c as any).color
  })));

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'left',
      }}
      sx={{ 
        '& .MuiPopover-paper': { 
          width: '300px', 
          maxHeight: '80vh',
          overflow: 'auto' 
        } 
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Edit {selectedControls.length} {controlsType || 'Mixed'} Control{selectedControls.length !== 1 ? 's' : ''}
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Common" value="common" />
          {controlsType && <Tab label={controlsType} value="type-specific" />}
        </Tabs>

        {activeTab === 'common' && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Appearance</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <ColorPicker
                  key={`color-picker-${selectedControls.map(c => c.id).join('-')}`} // Add key to force re-render
                  label="Color"
                  value={getCommonAttributeValue('color', '#3f51b5')}
                  onChange={(color) => {
                    // Make sure color is a valid hex color and apply it immediately
                    if (color && color.startsWith('#')) {
                      console.log('Valid color selected, applying immediately:', color);
                      updateCommonAttribute('color', color);
                    } else {
                      console.warn('Invalid color format:', color);
                    }
                  }}
                  fullWidth
                  multipleValues={getAllColors()}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Label"
                  placeholder={selectedControls.length > 1 ? 'Multiple values' : ''}
                  value={getCommonAttributeValue('label', '')}
                  onChange={(e) => updateCommonAttribute('label', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAll}
                  fullWidth
                >
                  Delete Selected Controls
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>MIDI Settings</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="MIDI Channel"
                  type="number"
                  value={getMidiConfig('channel', 1)}
                  onChange={(e) => updateMidiConfig('channel', Number(e.target.value))}
                  size="small"
                  fullWidth
                  inputProps={{ min: 1, max: 16 }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'type-specific' && controlsType === 'slider' && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Slider Settings</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Min Value"
                  type="number"
                  value={getMidiConfig('min', 0)}
                  onChange={(e) => updateMidiConfig('min', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Max Value"
                  type="number"
                  value={getMidiConfig('max', 127)}
                  onChange={(e) => updateMidiConfig('max', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Orientation</InputLabel>
                  <Select
                    value={getSliderConfig('orientation', 'vertical')}
                    onChange={(e) => updateSliderConfig('orientation', e.target.value)}
                    label="Orientation"
                  >
                    <MenuItem value="vertical">Vertical</MenuItem>
                    <MenuItem value="horizontal">Horizontal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Value Display Settings
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Steps"
                  type="number"
                  value={getSliderConfig('steps', 0)}
                  onChange={(e) => updateSliderConfig('steps', Number(e.target.value))}
                  size="small"
                  fullWidth
                  inputProps={{ min: 0, max: 127 }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Decimal Places"
                  type="number"
                  value={getSliderViewMode('decimalPlaces', 1)}
                  onChange={(e) => updateSliderViewMode('decimalPlaces', Number(e.target.value))}
                  size="small"
                  fullWidth
                  inputProps={{ min: 0, max: 10 }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Display Min"
                  type="number"
                  value={getSliderViewMode('minValue', 0)}
                  onChange={(e) => updateSliderViewMode('minValue', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Display Max"
                  type="number"
                  value={getSliderViewMode('maxValue', 100)}
                  onChange={(e) => updateSliderViewMode('maxValue', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Units"
                  value={getSliderViewMode('extraText', '')}
                  onChange={(e) => updateSliderViewMode('extraText', e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="e.g. dB, %, Hz"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'type-specific' && controlsType === 'button' && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Button Settings</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Value"
                  type="number"
                  value={getCommonConfigValue('value', 127)}
                  onChange={(e) => updateConfig('value', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mode</InputLabel>
                  <Select
                    value={getCommonConfigValue('momentary', true) ? 'momentary' : 'toggle'}
                    onChange={(e) => updateConfig('momentary', e.target.value === 'momentary')}
                    label="Mode"
                  >
                    <MenuItem value="momentary">Momentary</MenuItem>
                    <MenuItem value="toggle">Toggle</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'type-specific' && controlsType === 'toggle' && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Toggle Settings</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Off Value"
                  type="number"
                  value={getCommonConfigValue('offValue', 0)}
                  onChange={(e) => updateConfig('offValue', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="On Value"
                  type="number"
                  value={getCommonConfigValue('onValue', 127)}
                  onChange={(e) => updateConfig('onValue', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {activeTab === 'type-specific' && controlsType === 'label' && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Label Settings</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Text Align</InputLabel>
                  <Select
                    value={getCommonConfigValue('textAlign', 'center')}
                    onChange={(e) => updateConfig('textAlign', e.target.value)}
                    label="Text Align"
                  >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {activeTab === 'type-specific' && controlsType === 'textbox' && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Text Box Settings</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Text"
                  multiline
                  rows={3}
                  value={getCommonConfigValue('text', '')}
                  onChange={(e) => updateConfig('text', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default MultiControlEditor;