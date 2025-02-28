import { useState, useEffect, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Label as LabelIcon,
  TextFields as TextFieldsIcon,
  ToggleOn as ToggleOnIcon,
  RadioButtonChecked as KnobIcon,
  SmartButton as ButtonIcon,
  PlayArrow as PlayArrowIcon,
  SlideshowOutlined as SliderIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// Import components
import ControlEditorPanel from './ControlEditorPanel';
import useMIDI from '../hooks/useMIDI';
import { ControlItem, ControlType, MidiControllerPreset } from '../types/index';
import { useNotification } from '../context/NotificationContext';
import { createNewControl, findAvailablePosition, checkOverlap } from '../utils/gridHelpers';
import MidiControllerGrid from './MidiControllerGrid';
import PresetManager from './PresetManager';

// Create localStorage utility functions
const savePresets = (presets: MidiControllerPreset[]): void => {
  try {
    localStorage.setItem('midi_controller_presets', JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save presets to local storage', error);
  }
};

const loadPresets = (): MidiControllerPreset[] => {
  try {
    const presets = localStorage.getItem('midi_controller_presets');
    return presets ? JSON.parse(presets) : [];
  } catch (error) {
    console.error('Failed to load presets from local storage', error);
    return [];
  }
};

const saveActivePresetId = (presetId: string | null): void => {
  try {
    if (presetId) {
      localStorage.setItem('midi_controller_active_preset', presetId);
    } else {
      localStorage.removeItem('midi_controller_active_preset');
    }
  } catch (error) {
    console.error('Failed to save active preset ID', error);
  }
};

const loadActivePresetId = (): string | null => {
  try {
    return localStorage.getItem('midi_controller_active_preset');
  } catch (error) {
    console.error('Failed to load active preset ID', error);
    return null;
  }
};

export default function MidiController() {
  // Preset state
  const [presets, setPresets] = useState<MidiControllerPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  
  // Editor state
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [controls, setControls] = useState<ControlItem[]>([]);
  const [gridColumns, setGridColumns] = useState(12);
  const [gridRows, setGridRows] = useState(8);
  
  // MIDI state - add requestMIDIAccess to destructured values
  const { 
    devices, 
    selectOutputDevice, 
    selectedOutput, 
    isConnected, 
    isInitialized, 
    error,
    requestMIDIAccess 
  } = useMIDI();
  const [midiDeviceId, setMidiDeviceId] = useState<string | null>(null);
  const connectionAttemptsRef = useRef(0);
  
  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const { showNotification } = useNotification();

  // Create a new preset
  const createNewPreset = () => {
    const newPreset: MidiControllerPreset = {
      id: uuidv4(),
      name: `Preset ${presets.length + 1}`,
      controls: [],
      gridSize: {
        columns: 12,
        rows: 8
      }
    };
    
    // Fix for the type error: Using the functional update form of setState
    setPresets(prevPresets => [...prevPresets, newPreset]);
    setActivePresetId(newPreset.id);
    setControls([]);
    setSelectedControlId(null);
    setGridColumns(newPreset.gridSize.columns);
    setGridRows(newPreset.gridSize.rows);
    showNotification('New preset created', 'success');
  };

  // Load presets from local storage on initial load
  useEffect(() => {
    const loadedPresets = loadPresets();
    if (loadedPresets.length > 0) {
      setPresets(loadedPresets);
      
      // Try to load the previously active preset
      const activeId = loadActivePresetId();
      if (activeId && loadedPresets.some((p: MidiControllerPreset) => p.id === activeId)) {
        setActivePresetId(activeId);
        const activePreset = loadedPresets.find((p: MidiControllerPreset) => p.id === activeId);
        if (activePreset) {
          setControls(activePreset.controls);
          setGridColumns(activePreset.gridSize.columns);
          setGridRows(activePreset.gridSize.rows);
          
          // Connect to MIDI device if there was one saved
          if (activePreset.midiDeviceId) {
            // Remove any type suffix from saved device ID
            const baseDeviceId = activePreset.midiDeviceId.split('-')[0];
            setMidiDeviceId(baseDeviceId);
            selectOutputDevice(baseDeviceId);
          }
        }
      } else if (loadedPresets.length > 0) {
        // If no active preset was saved, use the first one
        setActivePresetId(loadedPresets[0].id);
        setControls(loadedPresets[0].controls);
        setGridColumns(loadedPresets[0].gridSize.columns);
        setGridRows(loadedPresets[0].gridSize.rows);
        
        if (loadedPresets[0].midiDeviceId) {
          // Remove any type suffix from saved device ID
          const baseDeviceId = loadedPresets[0].midiDeviceId.split('-')[0];
          setMidiDeviceId(baseDeviceId);
          selectOutputDevice(baseDeviceId);
        }
      }
    } else {
      // Create default preset if none exist
      createNewPreset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save presets to local storage whenever they change
  useEffect(() => {
    if (presets.length > 0) {
      savePresets(presets);
    }
  }, [presets]);
  
  // Save active preset ID whenever it changes
  useEffect(() => {
    if (activePresetId) {
      saveActivePresetId(activePresetId);
    }
  }, [activePresetId]);

  // Improved device connection logic with retry mechanism
  useEffect(() => {
    if (!isInitialized || !midiDeviceId) {
      // Reset connection attempts when device ID changes or initialization status changes
      connectionAttemptsRef.current = 0;
      return;
    }

    console.log(`MIDI initialized and device ID available: ${midiDeviceId}`);
    
    // Implement a retry mechanism with exponential backoff
    const attemptConnection = () => {
      const attempt = connectionAttemptsRef.current + 1;
      connectionAttemptsRef.current = attempt;
      
      console.log(`Connection attempt ${attempt} for device ${midiDeviceId}`);
      
      try {
        const success = selectOutputDevice(midiDeviceId);
        
        if (!success && attempt < 3) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Connection not successful, retrying in ${delay}ms`);
          setTimeout(attemptConnection, delay);
        } else if (success) {
          console.log("MIDI device connected successfully");
          connectionAttemptsRef.current = 0;
        } else {
          console.warn("Failed to connect MIDI device after multiple attempts");
          showNotification('Could not connect to MIDI device. Check connections and try again.', 'error');
        }
      } catch (err) {
        console.error('Error during connection attempt:', err);
        showNotification('Error connecting to MIDI device', 'error');
      }
    };
    
    const timer = setTimeout(attemptConnection, 500);
    return () => clearTimeout(timer);
  }, [midiDeviceId, isInitialized, selectOutputDevice, showNotification]);

  // Select a preset
  const selectPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    setActivePresetId(preset.id);
    setControls(preset.controls);
    setGridColumns(preset.gridSize.columns);
    setGridRows(preset.gridSize.rows);
    setSelectedControlId(null);
    
    if (preset.midiDeviceId) {
      setMidiDeviceId(preset.midiDeviceId);
      selectOutputDevice(preset.midiDeviceId);
    } else {
      setMidiDeviceId(null);
    }
  };
  
  // Update preset name
  const updatePresetName = (presetId: string, name: string) => {
    setPresets(prevPresets => prevPresets.map(p => {
      if (p.id === presetId) {
        return { ...p, name };
      }
      return p;
    }));
  };
  
  // Duplicate a preset
  const duplicatePreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const newPreset: MidiControllerPreset = {
      ...preset,
      id: uuidv4(),
      name: `${preset.name} (Copy)`,
      controls: JSON.parse(JSON.stringify(preset.controls)) // Deep clone controls
    };
    
    setPresets(prevPresets => [...prevPresets, newPreset]);
    setActivePresetId(newPreset.id);
    setControls(newPreset.controls);
    setGridColumns(newPreset.gridSize.columns);
    setGridRows(newPreset.gridSize.rows);
    setSelectedControlId(null);
  };
  
  // Delete a preset
  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    
    if (updatedPresets.length === 0) {
      createNewPreset();
      return;
    }
    
    setPresets(updatedPresets);
    
    // If the active preset was deleted, select another one
    if (activePresetId === presetId) {
      const newActivePreset = updatedPresets[0];
      setActivePresetId(newActivePreset.id);
      setControls(newActivePreset.controls);
      setGridColumns(newActivePreset.gridSize.columns);
      setGridRows(newActivePreset.gridSize.rows);
      setSelectedControlId(null);
      
      if (newActivePreset.midiDeviceId) {
        setMidiDeviceId(newActivePreset.midiDeviceId);
        selectOutputDevice(newActivePreset.midiDeviceId);
      } else {
        setMidiDeviceId(null);
      }
    }
  };
  
  // Import a preset
  const importPreset = (preset: MidiControllerPreset) => {
    // Make sure the preset has a unique ID
    const newPreset: MidiControllerPreset = {
      ...preset,
      id: uuidv4()
    };
    
    setPresets(prevPresets => [...prevPresets, newPreset]);
    setActivePresetId(newPreset.id);
    setControls(newPreset.controls);
    setGridColumns(newPreset.gridSize.columns);
    setGridRows(newPreset.gridSize.rows);
    setSelectedControlId(null);
  };
  
  // Save the current preset
  const saveCurrentPreset = () => {
    if (!activePresetId) return;
    
    setPresets(prevPresets => prevPresets.map(p => {
      if (p.id === activePresetId) {
        return {
          ...p,
          controls,
          gridSize: { columns: gridColumns, rows: gridRows },
          midiDeviceId
        } as MidiControllerPreset;
      }
      return p;
    }));
    
    showNotification('Preset saved', 'success');
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode - save the changes
      saveCurrentPreset();
    }
    
    setIsEditMode(!isEditMode);
    setSelectedControlId(null);
    setSpeedDialOpen(false);
  };
  
  // Add a new control
  const addControl = (type: ControlType) => {
    // Find a position for the new control
    const defaultSize = type === 'slider' ? { w: 1, h: 3 } : { w: 2, h: 1 };
    const position = findAvailablePosition(controls, defaultSize, gridColumns, gridRows);
    
    const newControl = createNewControl(type, position, gridColumns, gridRows);
    setControls([...controls, newControl]);
    setSelectedControlId(newControl.id);
    setSpeedDialOpen(false);
  };
  
  // Update a control
  const updateControl = (id: string, updatedValues: Partial<ControlItem>) => {
    const updatedControls = controls.map(control => {
      if (control.id === id) {
        return { ...control, ...updatedValues };
      }
      return control;
    });
    
    setControls(updatedControls);
  };
  
  // Delete a control
  const deleteControl = (id: string) => {
    const updatedControls = controls.filter(control => control.id !== id);
    setControls(updatedControls);
    setSelectedControlId(null);
  };
  
  // Move a control
  const moveControl = (id: string, dx: number, dy: number) => {
    const control = controls.find(c => c.id === id);
    if (!control) return;
    
    const newPosition = {
      x: control.position.x + dx,
      y: control.position.y + dy
    };
    
    // Check if the move would be within grid bounds
    if (
      newPosition.x < 0 ||
      newPosition.y < 0 ||
      newPosition.x + control.size.w > gridColumns ||
      newPosition.y + control.size.h > gridRows
    ) {
      return;
    }
    
    // Check for collisions with other controls
    if (checkOverlap(newPosition, control.size, controls, id)) {
      return;
    }
    
    const updatedControls = controls.map(c => {
      if (c.id === id) {
        return { ...c, position: newPosition };
      }
      return c;
    });
    
    setControls(updatedControls);
  };
  
  // Resize a control
  const resizeControl = (id: string, dw: number, dh: number) => {
    const control = controls.find(c => c.id === id);
    if (!control) return;
    
    const newSize = {
      w: control.size.w + dw,
      h: control.size.h + dh
    };
    
    // Check if the resize would be within grid bounds
    if (
      newSize.w <= 0 ||
      newSize.h <= 0 ||
      control.position.x + newSize.w > gridColumns ||
      control.position.y + newSize.h > gridRows
    ) {
      return;
    }
    
    // Check for collisions with other controls
    if (checkOverlap(control.position, newSize, controls, id)) {
      return;
    }
    
    const updatedControls = controls.map(c => {
      if (c.id === id) {
        return { ...c, size: newSize };
      }
      return c;
    });
    
    setControls(updatedControls);
  };
  
  // Change grid dimensions
  const handleGridSizeChange = (columns: number, rows: number) => {
    setGridColumns(columns);
    setGridRows(rows);
  };
  
  // Handle MIDI device selection - with additional validation
  const handleMidiDeviceChange = (event: SelectChangeEvent<string>) => {
    const deviceId = event.target.value;
    
    // Debug the device selection
    console.log({
      selectedId: deviceId,
      availableDevices: devices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type
      }))
    });
    
    if (!deviceId) {
      setMidiDeviceId(null);
      return;
    }

    // Find output device
    const selectedDevice = devices.find(d => d.id === deviceId && d.type === 'output');

    if (!selectedDevice) {
      console.warn('No device found with ID:', deviceId);
      return;
    }
    
    // Store just the device ID without type suffix
    setMidiDeviceId(deviceId);
    
    // Update the current preset with the selected MIDI device
    if (activePresetId) {
      setPresets(prevPresets => prevPresets.map(p => {
        if (p.id === activePresetId) {
          return { ...p, midiDeviceId: deviceId } as MidiControllerPreset;
        }
        return p;
      }));
    }
  };
  
  // Get the active preset name
  const getActivePresetName = () => {
    if (!activePresetId) return 'No preset selected';
    const preset = presets.find(p => p.id === activePresetId);
    return preset ? preset.name : 'Unknown preset';
  };
  
  // Get the selected control
  const getSelectedControl = () => {
    if (!selectedControlId) return null;
    return controls.find(control => control.id === selectedControlId) || null;
  };
  
  // Speed dial actions for adding controls
  const speedDialActions = [
    { icon: <SliderIcon />, name: 'Slider', action: () => addControl('slider') },
    { icon: <KnobIcon />, name: 'Knob', action: () => addControl('knob') },
    { icon: <ButtonIcon />, name: 'Button', action: () => addControl('button') },
    { icon: <ToggleOnIcon />, name: 'Toggle', action: () => addControl('toggle') },
    { icon: <TextFieldsIcon />, name: 'Text Box', action: () => addControl('textbox') },
    { icon: <LabelIcon />, name: 'Label', action: () => addControl('label') },
  ];

  // Settings dialog - add refresh MIDI button
  const handleRefreshMIDI = () => {
    console.log("User requested MIDI refresh");
    requestMIDIAccess();
    showNotification('Refreshing MIDI connections...', 'info');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cyan MIDI Controller - {getActivePresetName()}
          </Typography>
          
          <Button 
            color="inherit" 
            onClick={() => setShowPresetManager(true)}
            startIcon={<TuneIcon />}
          >
            Presets
          </Button>
          
          <IconButton 
            color="inherit"
            onClick={() => setIsSettingsOpen(true)}
          >
            <SettingsIcon />
          </IconButton>
          
          <Button 
            color="inherit"
            variant={isEditMode ? "outlined" : "text"}
            startIcon={isEditMode ? <PlayArrowIcon /> : <EditIcon />}
            onClick={toggleEditMode}
            sx={{ ml: 1 }}
          >
            {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        overflow: 'hidden',
        height: 'calc(100vh - 64px)',
        position: 'relative'
      }}>
        {/* MIDI Loading & Error Indicators */}
        {!isInitialized && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2">
              Initializing MIDI system...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: isInitialized ? 0 : 40,
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(220,0,0,0.7)',
              color: 'white',
              padding: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2">
              MIDI Error: {error}
            </Typography>
          </Box>
        )}
        
        {/* Grid Area */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 2,
          overflow: 'hidden',
          height: '100%'
        }}>
          <MidiControllerGrid
            controls={controls}
            columns={gridColumns}
            rows={gridRows}
            isEditMode={isEditMode}
            selectedControlId={selectedControlId}
            onSelectControl={setSelectedControlId}
            onUpdateControl={updateControl}  // Changed to use updateControl instead of updateControlConfig
            onMoveControl={moveControl}      // Add this
            onResizeControl={resizeControl}  // Add this
            selectedMidiOutput={midiDeviceId}
          />
        </Box>
        
        {/* Side Panel - Only visible in edit mode */}
        {isEditMode && (
          <Box sx={{ 
            width: 300, 
            borderLeft: '1px solid',
            borderColor: 'divider',
            p: 2,
            overflow: 'auto',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <ControlEditorPanel
              selectedControl={getSelectedControl()}
              onUpdateControl={updateControl}
              onDeleteControl={deleteControl}
              onMoveControl={moveControl}
              onResizeControl={resizeControl}
              gridColumns={gridColumns}
              gridRows={gridRows}
            />
          </Box>
        )}
      </Box>
      
      {/* Speed Dial for adding controls (only visible in edit mode) */}
      {isEditMode && (
        <SpeedDial
          ariaLabel="Add control"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.action}
            />
          ))}
        </SpeedDial>
      )}
      
      {/* Settings Dialog */}
      <Dialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>MIDI Device</Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography 
                variant="body2" 
                color={isInitialized ? "text.secondary" : "info.main"}
              >
                {isInitialized 
                  ? "MIDI system initialized"
                  : "MIDI system is initializing..."
                }
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              size="small"
              onClick={handleRefreshMIDI}
              disabled={!isInitialized}
            >
              Refresh MIDI
            </Button>
          </Box>
          
          {error && (
            <Box sx={{ 
              mb: 2, 
              p: 1.5, 
              bgcolor: 'error.main', 
              color: 'error.contrastText',
              borderRadius: 1 
            }}>
              <Typography variant="body2">
                {error}
              </Typography>
            </Box>
          )}
          
          <Typography 
            variant="body2" 
            color={isConnected ? "success.main" : "error.main"}
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            {isConnected && selectedOutput
              ? `Connected to ${selectedOutput.name}`
              : midiDeviceId
                ? "MIDI device selected but not connected"
                : "No MIDI device selected" 
            }
          </Typography>
          
          {!isInitialized ? (
            <Typography color="text.secondary">
              Please wait while the MIDI system initializes...
            </Typography>
          ) : devices.length === 0 ? (
            <Box>
              <Typography color="warning.main" gutterBottom>
                No MIDI devices detected.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Make sure your MIDI devices are connected and try refreshing.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleRefreshMIDI}
                sx={{ mr: 1 }}
              >
                Refresh MIDI
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </Box>
          ) : (
            <FormControl fullWidth margin="normal">
              <InputLabel>Output Device</InputLabel>
              <Select
                value={midiDeviceId || ''}
                onChange={handleMidiDeviceChange}
                label="Output Device"
              >
                <MenuItem value="">None</MenuItem>
                {devices.filter(device => device.type === 'output').map(device => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name} ({device.manufacturer || 'Unknown manufacturer'})
                  </MenuItem>
                ))}
              </Select>
              {/* Show selected device details for debugging */}
              {midiDeviceId && (
                <Box mt={1} p={1} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
                  <Typography variant="caption" component="div">
                    Selected Device ID: {midiDeviceId}
                  </Typography>
                  <Typography variant="caption" component="div" color={isConnected ? "success.main" : "error.main"}>
                    Connection: {isConnected ? "Connected" : "Disconnected"}
                  </Typography>
                </Box>
              )}
            </FormControl>
          )}

          <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              MIDI Troubleshooting Tips:
            </Typography>
            <Typography variant="caption" component="ul" sx={{ pl: 2 }}>
              <li>Make sure your MIDI devices are connected and powered on</li>
              <li>Reload the page if devices aren't appearing</li>
              <li>Some browsers may require HTTPS for MIDI access</li>
              <li>Check browser permissions for MIDI access</li>
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Grid Size</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Columns"
                type="number"
                fullWidth
                value={gridColumns}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(48, parseInt(e.target.value) || 1));
                  handleGridSizeChange(value, gridRows);
                }}
                inputProps={{ min: 1, max: 48 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Rows"
                type="number"
                fullWidth
                value={gridRows}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(48, parseInt(e.target.value) || 1));
                  handleGridSizeChange(gridColumns, value);
                }}
                inputProps={{ min: 1, max: 48 }}
              />
            </Grid>
          </Grid>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Note: Changing grid size could cause controls to overlap or go out of bounds.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Preset Manager Dialog */}
      <Dialog
        open={showPresetManager}
        onClose={() => setShowPresetManager(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Preset Manager</DialogTitle>
        <DialogContent sx={{ minHeight: '300px' }}>
          <PresetManager
            presets={presets}
            activePresetId={activePresetId}
            onCreatePreset={createNewPreset}
            onSelectPreset={selectPreset}
            onUpdatePreset={updatePresetName}
            onDuplicatePreset={duplicatePreset}
            onDeletePreset={deletePreset}
            onImportPreset={importPreset}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPresetManager(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
