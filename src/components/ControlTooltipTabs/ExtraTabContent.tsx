import { memo } from 'react';
import { Box, FormControl, Select, MenuItem, Switch, FormControlLabel, Typography, InputLabel, TextField } from '@mui/material';
import { ControlItem } from '../../types/index';
import { NumberField, TextField2, ColorField } from './CommonComponents';

interface ExtraTabContentProps {
  selectedControl: ControlItem;
  updateControlConfig: (key: string, value: any) => void;
  updateSliderViewMode: (key: string, value: any) => void;
}

const ExtraTabContent = memo(({
  selectedControl,
  updateControlConfig,
  updateSliderViewMode
}: ExtraTabContentProps) => {
  const handleStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for typing
    if (value === '') {
      updateControlConfig('sliderConfig', {
        ...selectedControl.config.sliderConfig,
        steps: value
      });
      return;
    }

    // Parse as integer and ensure it's positive
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      updateControlConfig('sliderConfig', {
        ...selectedControl.config.sliderConfig,
        steps: numValue || undefined
      });
    }
  };

  return (
    <Box sx={{ pt: 1 }}>
      {selectedControl.type === 'slider' && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="orientation-select-label">Orientation</InputLabel>
              <Select
                labelId="orientation-select-label"
                label="Orientation"
                value={selectedControl.config.orientation || 'vertical'}
                onChange={(e) => updateControlConfig('orientation', e.target.value)}
                sx={{ height: 32 }}
                MenuProps={{
                  sx: { zIndex: 9999 }
                }}
              >
                <MenuItem value="vertical">Vertical</MenuItem>
                <MenuItem value="horizontal">Horizontal</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Steps"
            type="text"
            value={selectedControl.config.sliderConfig?.steps ?? ''}
            onChange={handleStepsChange}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            placeholder="Leave empty for smooth sliding"
          />
          
          {/* Display settings section */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="caption" fontWeight="bold">Value Display Settings</Typography>
          </Box>

          <TextField
            label="Display Min Value"
            type="text"
            value={selectedControl.config.sliderConfig?.viewMode?.minValue ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string or just a minus sign
              if (value === '' || value === '-') {
                updateSliderViewMode('minValue', value);
                return;
              }
              // Parse as float to allow decimals
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                updateSliderViewMode('minValue', numValue);
              }
            }}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Display Max Value"
            type="text"
            value={selectedControl.config.sliderConfig?.viewMode?.maxValue ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string or just a minus sign
              if (value === '' || value === '-') {
                updateSliderViewMode('maxValue', value);
                return;
              }
              // Parse as float to allow decimals
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                updateSliderViewMode('maxValue', numValue);
              }
            }}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField2
            label="Units"
            value={selectedControl.config.sliderConfig?.viewMode?.extraText || ''}
            onChange={(value) => updateSliderViewMode('extraText', value)}
            placeholder="e.g. dB, %, Hz"
          />

          <NumberField
            label="Decimals"
            value={selectedControl.config.sliderConfig?.viewMode?.decimalPlaces || 1}
            onChange={(value) => updateSliderViewMode('decimalPlaces', value)}
            min={0}
            max={10}
          />
        </>
      )}

      {(selectedControl.type === 'button' || selectedControl.type === 'toggle') && (
        <>        
          <NumberField
            label="On Value"
            value={selectedControl.config.onValue || 127}
            onChange={(value) => updateControlConfig('onValue', value)}
            min={0}
            max={127}
          />
          
          <NumberField
            label="Off Value"
            value={selectedControl.config.offValue || 0}
            onChange={(value) => updateControlConfig('offValue', value)}
            min={0}
            max={127}
          />
        </>
      )}

      {selectedControl.type === 'textbox' && (
        <FormControlLabel
          control={
            <Switch
              checked={selectedControl.config.showLabel !== false}
              onChange={(e) => updateControlConfig('showLabel', e.target.checked)}
              size="small"
            />
          }
          label="Show Label"
        />
      )}

      {selectedControl.type === 'label' && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: '80px', flexShrink: 0 }}>
              Text Style:
            </Box>
            <FormControl fullWidth size="small">
              <Select
                value={selectedControl.config.variant || 'body1'}
                onChange={(e) => updateControlConfig('variant', e.target.value)}
                sx={{ height: 32 }}
                MenuProps={{
                  sx: { zIndex: 9999 }
                }}
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
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: '80px', flexShrink: 0 }}>
              Alignment:
            </Box>
            <FormControl fullWidth size="small">
              <Select
                value={selectedControl.config.textAlign || 'center'}
                onChange={(e) => updateControlConfig('textAlign', e.target.value)}
                sx={{ height: 32 }}
                MenuProps={{
                  sx: { zIndex: 9999 }
                }}
              >
                <MenuItem value="left">Left</MenuItem>
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="right">Right</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: '80px', flexShrink: 0 }}>
              Font Weight:
            </Box>
            <FormControl fullWidth size="small">
              <Select
                value={selectedControl.config.fontWeight || 'normal'}
                onChange={(e) => updateControlConfig('fontWeight', e.target.value)}
                sx={{ height: 32 }}
                MenuProps={{
                  sx: { zIndex: 9999 }
                }}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="bold">Bold</MenuItem>
                <MenuItem value="lighter">Lighter</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={selectedControl.config.wrap !== false}
                onChange={(e) => updateControlConfig('wrap', e.target.checked)}
                size="small"
              />
            }
            label="Wrap Text"
          />

          <ColorField
            label="Background"
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
    </Box>
  );
});

ExtraTabContent.displayName = 'ExtraTabContent';
export default ExtraTabContent;