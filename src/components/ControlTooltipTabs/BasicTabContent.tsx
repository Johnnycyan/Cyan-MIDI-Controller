import { memo } from 'react';
import { Box } from '@mui/material';
import { ControlItem } from '../../types/index';
import { ColorField, TextField2, PositionEditor } from './CommonComponents';

interface BasicTabContentProps {
  selectedControl: ControlItem;
  updateControlConfig: (key: string, value: any) => void;
  updatePosition: (axis: 'x'|'y', value: number) => void;
  updateSize: (dim: 'w'|'h', value: number) => void;
  handleMove: (dx: number, dy: number) => void;
  gridColumns: number;
  gridRows: number;
}

const BasicTabContent = memo(({
  selectedControl,
  updateControlConfig,
  updatePosition,
  updateSize,
  handleMove,
  gridColumns,
  gridRows
}: BasicTabContentProps) => {
  return (
    <Box sx={{ pt: 1 }}>
      <TextField2
        label="Label"
        value={selectedControl.config.label || ''}
        onChange={(newValue) => updateControlConfig('label', newValue)}
      />

      {selectedControl.type !== 'label' && (
        <ColorField
          value={selectedControl.config.color || '#2196f3'}
          onChange={(newValue) => updateControlConfig('color', newValue)}
        />
      )}

      <PositionEditor
        position={selectedControl.position}
        size={selectedControl.size}
        gridColumns={gridColumns}
        gridRows={gridRows}
        onPositionChange={updatePosition}
        onSizeChange={updateSize}
        onMove={handleMove}
      />
    </Box>
  );
});

BasicTabContent.displayName = 'BasicTabContent';
export default BasicTabContent;
