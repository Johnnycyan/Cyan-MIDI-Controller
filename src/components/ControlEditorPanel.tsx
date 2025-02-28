import { useState, useEffect } from 'react';
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
  SelectChangeEvent
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  ArrowUpward, 
  ArrowDownward, 
  ArrowBack, 
  ArrowForward 
} from '@mui/icons-material';
import { ControlItem, SliderConfig } from '../types/index';

interface ControlEditorPanelProps {
  selectedControl: ControlItem | null;
  onUpdateControl: (id: string, updatedValues: Partial<ControlItem>) => void;
  onDeleteControl: (id: string) => void;
  onMoveControl: (id: string, dx: number, dy: number) => void;
  gridColumns: number;
  gridRows: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`control-tabpanel-${index}`}
      aria-labelledby={`control-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && children}
    </div>
  );
}

export default function ControlEditorPanel({
  selectedControl,
  onUpdateControl,
  onDeleteControl,
  onMoveControl,
  gridColumns,
  gridRows
}: Omit<ControlEditorPanelProps, 'onResizeControl'>) {
  const [activeTab, setActiveTab] = useState(0);
  const [label, setLabel] = useState('');
  const [colorValue, setColorValue] = useState('#2196f3');
  const [midiChannel, setMidiChannel] = useState(1);
  const [midiCC, setMidiCC] = useState(1);
  const [midiMin, setMidiMin] = useState(0);
  const [midiMax, setMidiMax] = useState(127);

  // Special control-type specific settings
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [onValue, setOnValue] = useState(127);
  const [offValue, setOffValue] = useState(0);
  const [showLabel, setShowLabel] = useState(true);
  const [textVariant, setTextVariant] = useState('body1');
  const [textAlign, setTextAlign] = useState('center');
  const [fontWeight, setFontWeight] = useState('normal');
  const [wrapText, setWrapText] = useState(true);

  // Load control data when a control is selected
  useEffect(() => {
    if (selectedControl) {
      const { config } = selectedControl;
      setLabel(config.label || '');
      setColorValue(config.color || '#2196f3');
      
      // MIDI settings
      if (config.midi) {
        setMidiChannel(config.midi.channel);
        setMidiCC(config.midi.cc);
        setMidiMin(config.midi.min !== undefined ? config.midi.min : 0);
        setMidiMax(config.midi.max !== undefined ? config.midi.max : 127);
      }
      
      // Control-specific settings
      if (selectedControl.type === 'slider') {
        setOrientation(config.orientation || 'vertical');
      } else if (selectedControl.type === 'button') {
        setOnValue(config.onValue !== undefined ? config.onValue : 127);
        setOffValue(config.offValue !== undefined ? config.offValue : 0);
      } else if (selectedControl.type === 'toggle') {
        setOnValue(config.onValue !== undefined ? config.onValue : 127);
        setOffValue(config.offValue !== undefined ? config.offValue : 0);
      } else if (selectedControl.type === 'textbox') {
        setShowLabel(config.showLabel !== undefined ? config.showLabel : true);
      } else if (selectedControl.type === 'label') {
        setTextVariant(config.variant || 'body1');
        setTextAlign(config.textAlign || 'center');
        setFontWeight(config.fontWeight || 'normal');
        setWrapText(config.wrap !== undefined ? config.wrap : true);
      }
    }
  }, [selectedControl]);

  if (!selectedControl) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="body1" align="center" sx={{ py: 2 }}>
          Select a control to edit its properties
        </Typography>
      </Paper>
    );
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, label: newLabel }
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColorValue(newColor);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, color: newColor }
    });
  };

  const handleMidiChannelChange = (e: SelectChangeEvent<number>) => {
    const newChannel = Number(e.target.value);
    setMidiChannel(newChannel);
    const currentMidi = selectedControl.config.midi || { channel: 1, cc: 1 };
    onUpdateControl(selectedControl.id, {
      config: { 
        ...selectedControl.config, 
        midi: { ...currentMidi, channel: newChannel } 
      }
    });
  };

  const handleMidiCCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCC = parseInt(e.target.value, 10);
    setMidiCC(newCC);
    const currentMidi = selectedControl.config.midi || { channel: 1, cc: 1 };
    onUpdateControl(selectedControl.id, {
      config: { 
        ...selectedControl.config, 
        midi: { ...currentMidi, cc: newCC } 
      }
    });
  };

  const handleMidiMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseInt(e.target.value, 10);
    setMidiMin(newMin);
    const currentMidi = selectedControl.config.midi || { channel: 1, cc: 1 };
    onUpdateControl(selectedControl.id, {
      config: { 
        ...selectedControl.config, 
        midi: { ...currentMidi, min: newMin } 
      }
    });
  };

  const handleMidiMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value, 10);
    setMidiMax(newMax);
    const currentMidi = selectedControl.config.midi || { channel: 1, cc: 1 };
    onUpdateControl(selectedControl.id, {
      config: { 
        ...selectedControl.config, 
        midi: { ...currentMidi, max: newMax } 
      }
    });
  };

  const handleOrientationChange = (e: SelectChangeEvent<'vertical' | 'horizontal'>) => {
    const newOrientation = e.target.value as 'vertical' | 'horizontal';
    setOrientation(newOrientation);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, orientation: newOrientation }
    });
  };

  const handleOnValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setOnValue(newValue);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, onValue: newValue }
    });
  };

  const handleOffValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setOffValue(newValue);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, offValue: newValue }
    });
  };

  const handleShowLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const show = e.target.checked;
    setShowLabel(show);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, showLabel: show }
    });
  };

  const handleTextVariantChange = (e: SelectChangeEvent<string>) => {
    const variant = e.target.value;
    setTextVariant(variant);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, variant }
    });
  };

  const handleTextAlignChange = (e: SelectChangeEvent<string>) => {
    const align = e.target.value;
    setTextAlign(align);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, textAlign: align }
    });
  };

  const handleFontWeightChange = (e: SelectChangeEvent<string>) => {
    const weight = e.target.value;
    setFontWeight(weight);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, fontWeight: weight }
    });
  };

  const handleWrapTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const wrap = e.target.checked;
    setWrapText(wrap);
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, wrap }
    });
  };

  const handleDeleteControl = () => {
    onDeleteControl(selectedControl.id);
  };

  const canMoveUp = selectedControl.position.y > 0;
  const canMoveDown = selectedControl.position.y + selectedControl.size.h < gridRows;
  const canMoveLeft = selectedControl.position.x > 0;
  const canMoveRight = selectedControl.position.x + selectedControl.size.w < gridColumns;

  // Add handlers for position and size changes
  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (!selectedControl) return;
    
    const newPosition = {
      ...selectedControl.position,
      [axis]: value
    };
    
    onUpdateControl(selectedControl.id, { position: newPosition });
  };

  const handleSizeChange = (dimension: 'w' | 'h', value: number) => {
    if (!selectedControl) return;
    
    const newSize = {
      ...selectedControl.size,
      [dimension]: value
    };
    
    onUpdateControl(selectedControl.id, { size: newSize });
  };

  const handleSliderSettingsChange = (settings: Partial<SliderConfig>) => {
    if (!selectedControl) return;
    
    const currentViewMode = selectedControl.config.sliderConfig?.viewMode || {};
    const updatedViewMode = settings.viewMode 
      ? { ...currentViewMode, ...settings.viewMode }
      : currentViewMode;
    
    onUpdateControl(selectedControl.id, {
      config: {
        ...selectedControl.config,
        sliderConfig: {
          ...selectedControl.config.sliderConfig,
          ...settings,
          ...(Object.keys(updatedViewMode).length > 0 ? { viewMode: updatedViewMode } : {})
        }
      }
    });
  };

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
          <TextField
            label="Label"
            value={label}
            onChange={handleLabelChange}
            fullWidth
            margin="normal"
            size="small"
          />

          {selectedControl.type !== 'label' && (
            <TextField
              label="Color"
              type="color"
              value={colorValue}
              onChange={handleColorChange}
              fullWidth
              margin="normal"
              size="small"
            />
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Position & Size</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="X"
                  type="number"
                  value={selectedControl?.position.x ?? 0}
                  onChange={(e) => handlePositionChange('x', parseInt(e.target.value, 10))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, max: gridColumns - (selectedControl?.size.w ?? 1) }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Y"
                  type="number"
                  value={selectedControl?.position.y ?? 0}
                  onChange={(e) => handlePositionChange('y', parseInt(e.target.value, 10))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, max: gridRows - (selectedControl?.size.h ?? 1) }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Width"
                  type="number"
                  value={selectedControl?.size.w ?? 1}
                  onChange={(e) => handleSizeChange('w', parseInt(e.target.value, 10))}
                  fullWidth
                  size="small"
                  inputProps={{ 
                    min: 1, 
                    max: gridColumns - (selectedControl?.position.x ?? 0) 
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Height"
                  type="number"
                  value={selectedControl?.size.h ?? 1}
                  onChange={(e) => handleSizeChange('h', parseInt(e.target.value, 10))}
                  fullWidth
                  size="small"
                  inputProps={{ 
                    min: 1, 
                    max: gridRows - (selectedControl?.position.y ?? 0) 
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, 0, -1)}
                disabled={!canMoveUp}
              >
                <ArrowUpward />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, -1, 0)}
                disabled={!canMoveLeft}
              >
                <ArrowBack />
              </IconButton>
              
              <Box sx={{ px: 2 }}>
                <Typography variant="body2" align="center">Move</Typography>
              </Box>
              
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, 1, 0)}
                disabled={!canMoveRight}
              >
                <ArrowForward />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <IconButton 
                onClick={() => onMoveControl(selectedControl.id, 0, 1)}
                disabled={!canMoveDown}
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
              value={midiChannel}
              onChange={handleMidiChannelChange}
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
            value={midiCC}
            onChange={handleMidiCCChange}
            fullWidth
            margin="normal"
            size="small"
            InputProps={{ inputProps: { min: 0, max: 127 } }}
          />

          {(selectedControl.type === 'slider' || selectedControl.type === 'knob' || selectedControl.type === 'textbox') && (
            <>
              <TextField
                label="Min Value"
                type="number"
                value={midiMin}
                onChange={handleMidiMinChange}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{ inputProps: { min: 0, max: 127 } }}
              />
              
              <TextField
                label="Max Value"
                type="number"
                value={midiMax}
                onChange={handleMidiMaxChange}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{ inputProps: { min: 0, max: 127 } }}
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
                  value={orientation}
                  onChange={handleOrientationChange}
                  label="Orientation"
                >
                  <MenuItem value="vertical">Vertical</MenuItem>
                  <MenuItem value="horizontal">Horizontal</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Steps"
                type="number"
                value={selectedControl.config.sliderConfig?.steps || ''}
                onChange={(e) => handleSliderSettingsChange({
                  steps: parseInt(e.target.value) || undefined
                })}
                fullWidth
                margin="normal"
                size="small"
                helperText="Leave empty for smooth sliding"
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Value Display Settings
              </Typography>

                <TextField
                    label="Min Value"
                    type="number"
                    value={selectedControl.config.sliderConfig?.viewMode?.minValue ?? ''}
                    onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        handleSliderSettingsChange({
                        viewMode: {
                            ...selectedControl.config.sliderConfig?.viewMode,
                            minValue: value
                        }
                        });
                    }}
                    fullWidth
                    margin="normal"
                    size="small"
                />
                <TextField
                    label="Max Value"
                    type="number"
                    value={selectedControl.config.sliderConfig?.viewMode?.maxValue ?? ''}
                    onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        handleSliderSettingsChange({
                        viewMode: {
                            ...selectedControl.config.sliderConfig?.viewMode,
                            maxValue: value
                        }
                        });
                    }}
                    fullWidth
                    margin="normal"
                    size="small"
                />

              <TextField
                label="Extra Text (units)"
                value={selectedControl.config.sliderConfig?.viewMode?.extraText ?? ''}
                onChange={(e) => handleSliderSettingsChange({
                  viewMode: {
                    ...selectedControl.config.sliderConfig?.viewMode,
                    extraText: e.target.value
                  }
                })}
                fullWidth
                margin="normal"
                size="small"
                placeholder="e.g. dB, %, Hz"
              />

              <TextField
                label="Decimal Places"
                type="number"
                value={selectedControl.config.sliderConfig?.viewMode?.decimalPlaces ?? 1}
                onChange={(e) => handleSliderSettingsChange({
                  viewMode: {
                    ...selectedControl.config.sliderConfig?.viewMode,
                    decimalPlaces: parseInt(e.target.value) || 0
                  }
                })}
                fullWidth
                margin="normal"
                size="small"
                inputProps={{ min: 0, max: 10 }}
              />
            </>
          )}

          {selectedControl.type === 'button' && (
            <>        
              <TextField
                label="On Value"
                type="number"
                value={onValue}
                onChange={handleOnValueChange}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{ inputProps: { min: 0, max: 127 } }}
              />
              
              <TextField
                label="Off Value"
                type="number"
                value={offValue}
                onChange={handleOffValueChange}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{ inputProps: { min: 0, max: 127 } }}
              />
            </>
          )}

          {selectedControl.type === 'toggle' && (
            <>
              <TextField
                label="On Value"
                type="number"
                value={onValue}
                onChange={handleOnValueChange}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{ inputProps: { min: 0, max: 127 } }}
              />
              
              <TextField
                label="Off Value"
                type="number"
                value={offValue}
                onChange={handleOffValueChange}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{ inputProps: { min: 0, max: 127 } }}
              />
            </>
          )}

          {selectedControl.type === 'textbox' && (
            <FormControlLabel
              control={
                <Switch
                  checked={showLabel}
                  onChange={handleShowLabelChange}
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
                  value={textVariant}
                  onChange={handleTextVariantChange}
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
                  value={textAlign}
                  onChange={handleTextAlignChange}
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
                  value={fontWeight}
                  onChange={handleFontWeightChange}
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
                    checked={wrapText}
                    onChange={handleWrapTextChange}
                  />
                }
                label="Wrap Text"
                sx={{ mt: 1 }}
              />

              <TextField
                label="Background Color"
                type="color"
                value={selectedControl.config.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  onUpdateControl(selectedControl.id, {
                    config: { ...selectedControl.config, backgroundColor: e.target.value }
                  });
                }}
                fullWidth
                margin="normal"
                size="small"
              />
              
              <TextField
                label="Text Color"
                type="color"
                value={colorValue}
                onChange={handleColorChange}
                fullWidth
                margin="normal"
                size="small"
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
        onClick={handleDeleteControl}
        fullWidth
      >
        Delete Control
      </Button>
    </Paper>
  );
}
