import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, TextField, List, ListItem, ListItemText } from '@mui/material';
import { Add, Delete, Edit, FileCopy, Download, Upload } from '@mui/icons-material';
import { MidiControllerPreset } from '../types/index';
import { useNotification } from '../context/NotificationContext';

// Helper functions for importing/exporting presets
const exportPresetToJson = (preset: any): string => {
  return JSON.stringify(preset, null, 2);
};

const parsePresetFromJson = (json: string): any => {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error('Invalid preset JSON format');
  }
};

interface PresetManagerProps {
  presets: MidiControllerPreset[];
  activePresetId: string | null;
  onCreatePreset: () => void;
  onSelectPreset: (id: string) => void;
  onUpdatePreset: (id: string, name: string) => void;
  onDuplicatePreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onImportPreset: (preset: MidiControllerPreset) => void;
}

export default function PresetManager({
  presets,
  activePresetId,
  onCreatePreset,
  onSelectPreset,
  onUpdatePreset,
  onDuplicatePreset,
  onDeletePreset,
  onImportPreset
}: PresetManagerProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPresetId, setEditPresetId] = useState<string | null>(null);
  const [editPresetName, setEditPresetName] = useState('');
  const { showNotification } = useNotification();

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          const preset = parsePresetFromJson(content);
          
          // Validate the preset structure
          if (!preset.id || !preset.name || !Array.isArray(preset.controls) || 
              !preset.gridSize || !preset.gridSize.columns || !preset.gridSize.rows) {
            throw new Error('Invalid preset format');
          }
          
          onImportPreset(preset);
          showNotification('Preset imported successfully', 'success');
        } catch (error) {
          console.error('Import failed', error);
          showNotification('Failed to import preset: Invalid format', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={onCreatePreset}
        >
          New Preset
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Upload />}
          component="label"
        >
          Import Preset
          <input
            type="file"
            accept=".json"
            hidden
            onChange={handleFileImport}
          />
        </Button>
      </Box>

      {/* Presets list */}
      <List sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 1, 
        height: 450,
        overflow: 'auto',
        }}>
        {presets.length === 0 ? (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
            No presets found. Create a new preset to get started.
          </Typography>
        ) : (
          presets.map((preset) => (
            <ListItem
              key={preset.id}
              sx={{
              mb: 1,
              ml: 1,
              mr: 1,
              width: 'auto',
              border: '1px solid',
              borderColor: preset.id === activePresetId ? 'primary.main' : 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              flexDirection: 'column',
              alignItems: 'stretch',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              }}
              onClick={() => onSelectPreset(preset.id)}
            >
              <ListItemText
              primary={preset.name}
              secondary={`${preset.controls.length} controls | ${preset.gridSize.columns}x${preset.gridSize.rows} grid`}
              />
              <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 1,
              width: '100%'
              }}>
              <Button
                size="large"
                startIcon={<Edit />}
                variant="outlined"
                fullWidth
                onClick={(e) => {
                e.stopPropagation();
                setEditPresetId(preset.id);
                setEditPresetName(preset.name);
                setEditDialogOpen(true);
                }}
              >
                Rename
              </Button>
              
              <Button
                size="large"
                startIcon={<FileCopy />}
                variant="outlined"
                fullWidth
                onClick={(e) => {
                e.stopPropagation();
                onDuplicatePreset(preset.id);
                showNotification('Preset duplicated', 'success');
                }}
              >
                Duplicate
              </Button>
              
              <Button
                size="large"
                startIcon={<Download />}
                variant="outlined"
                fullWidth
                onClick={(e) => {
                e.stopPropagation();
                try {
                  const json = exportPresetToJson(preset);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${preset.name.replace(/\s+/g, '-')}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  showNotification('Preset exported successfully', 'success');
                } catch (error) {
                  console.error('Export failed', error);
                  showNotification('Failed to export preset', 'error');
                }
                }}
              >
                Export
              </Button>

              <Button
                size="large"
                startIcon={<Delete />}
                variant="outlined"
                color="error"
                fullWidth
                onClick={(e) => {
                e.stopPropagation();
                onDeletePreset(preset.id);
                showNotification('Preset deleted', 'success');
                }}
              >
                Delete
              </Button>
              </Box>
            </ListItem>
          ))
        )}
      </List>

      {/* Edit preset name dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
      >
        <DialogTitle>Edit Preset Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editPresetName}
            onChange={(e) => setEditPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editPresetId && editPresetName.trim()) {
                onUpdatePreset(editPresetId, editPresetName.trim());
                setEditDialogOpen(false);
                showNotification('Preset name updated', 'success');
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (editPresetId && editPresetName.trim()) {
              onUpdatePreset(editPresetId, editPresetName.trim());
              setEditDialogOpen(false);
              showNotification('Preset name updated', 'success');
            }
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}