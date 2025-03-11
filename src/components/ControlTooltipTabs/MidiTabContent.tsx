import { memo } from 'react';
import { Box, FormControl, Select, MenuItem, InputLabel, TextField } from '@mui/material';
import { ControlItem } from '../../types/index';

interface MidiTabContentProps {
  selectedControl: ControlItem;
  updateMidiConfig: (key: string, value: any) => void;
}

const MidiTabContent = memo(({
  selectedControl,
  updateMidiConfig
}: MidiTabContentProps) => {
  return (
    <Box sx={{ pt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <FormControl size="small" fullWidth>
        <InputLabel id="channel-select-label">Channel</InputLabel>
          <Select
            labelId="channel-select-label"
            label="Channel"
            value={(selectedControl.config.midi?.channel || 1)}
            onChange={(e) => updateMidiConfig('channel', Number(e.target.value))}
            sx={{ height: 32 }}
            MenuProps={{
              sx: { zIndex: 9999 }
            }}
          >
            {Array.from({ length: 16 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {i + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TextField
        label="CC Number"
        type="number"
        value={selectedControl.config.midi?.cc ?? 1}
        onChange={(e) => {
          const value = e.target.value;
          // Allow empty string
          if (value === '') {
            updateMidiConfig('cc', value);
            return;
          }
          // Parse as float to allow decimals
          const numValue = parseInt(value);
          if (!isNaN(numValue)) {
            updateMidiConfig('cc', value);
          }
        }}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      />

      {(selectedControl.type === 'textbox') && (
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
    </Box>
  );
});

MidiTabContent.displayName = 'MidiTabContent';
export default MidiTabContent;
