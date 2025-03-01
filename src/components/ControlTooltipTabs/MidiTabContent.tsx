import { memo } from 'react';
import { Box, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import { ControlItem } from '../../types/index';
import { NumberField } from './CommonComponents';

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

      <NumberField
        label="CC Number"
        value={selectedControl.config.midi?.cc || 1}
        onChange={(value) => updateMidiConfig('cc', value)}
        min={0}
        max={127}
      />

      {(selectedControl.type === 'slider' || selectedControl.type === 'textbox') && (
        <>
          <NumberField
            label="Min Value"
            value={selectedControl.config.midi?.min || 0}
            onChange={(value) => updateMidiConfig('min', value)}
            min={0}
            max={127}
          />
          
          <NumberField
            label="Max Value"
            value={selectedControl.config.midi?.max || 127}
            onChange={(value) => updateMidiConfig('max', value)}
            min={0}
            max={127}
          />
        </>
      )}
    </Box>
  );
});

MidiTabContent.displayName = 'MidiTabContent';
export default MidiTabContent;
