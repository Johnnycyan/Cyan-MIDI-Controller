import { memo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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
        <Box sx={{ width: '80px', flexShrink: 0 }}>
          Channel:
        </Box>
        <FormControl size="small" fullWidth>
          <Select
            value={(selectedControl.config.midi?.channel || 1)}
            onChange={(e) => updateMidiConfig('channel', Number(e.target.value))}
            sx={{ height: 32 }}
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
