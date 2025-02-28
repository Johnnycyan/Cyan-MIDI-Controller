import { memo, useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, Collapse } from '@mui/material';
import { ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, ExpandMore, ExpandLess } from '@mui/icons-material';

// Shared UI components for the tooltip tabs
export const ColorField = memo(({ value, onChange, label }: {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <Typography variant="caption" sx={{ width: '80px', flexShrink: 0 }}>
      {label || "Color"}:
    </Typography>
    <TextField
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      sx={{ width: '100%' }}
      InputProps={{ sx: { height: 32 } }}
    />
  </Box>
));

export const TextField2 = memo(({ value, onChange, label, ...props }: {
  value: string;
  onChange: (newValue: string) => void;
  label: string;
  [key: string]: any;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <Typography variant="caption" sx={{ width: '80px', flexShrink: 0 }}>
      {label}:
    </Typography>
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      sx={{ width: '100%' }}
      {...props}
    />
  </Box>
));

export const NumberField = memo(({ value, onChange, label, min, max }: {
  value: number;
  onChange: (newValue: number) => void;
  label: string;
  min?: number;
  max?: number;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <Typography variant="caption" sx={{ width: '80px', flexShrink: 0 }}>
      {label}:
    </Typography>
    <TextField
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      size="small"
      sx={{ width: '100%' }}
      inputProps={{ min, max }}
    />
  </Box>
));

// Position editor component
export const PositionEditor = memo(({
  position,
  size,
  gridColumns,
  gridRows,
  onPositionChange,
  onSizeChange,
  onMove
}: {
  position: { x: number, y: number };
  size: { w: number, h: number };
  gridColumns: number;
  gridRows: number;
  onPositionChange: (axis: 'x'|'y', value: number) => void;
  onSizeChange: (dim: 'w'|'h', value: number) => void;
  onMove: (dx: number, dy: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  // Position constraints
  const canMoveUp = position.y > 0;
  const canMoveDown = position.y + size.h < gridRows;
  const canMoveLeft = position.x > 0;
  const canMoveRight = position.x + size.w < gridColumns;

  return (
    <Box sx={{ mb: 1 }}>
      <Button
        fullWidth
        onClick={() => setExpanded(!expanded)}
        endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
        variant="text"
        size="small"
        sx={{ justifyContent: 'space-between', mb: 1, fontSize: '0.8rem' }}
      >
        Position & Size
      </Button>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', mb: 1, gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <NumberField
              label="X"
              value={position.x}
              onChange={(value) => onPositionChange('x', value)}
              min={0}
              max={gridColumns - size.w}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <NumberField
              label="Y"
              value={position.y}
              onChange={(value) => onPositionChange('y', value)}
              min={0}
              max={gridRows - size.h}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <NumberField
              label="Width"
              value={size.w}
              onChange={(value) => onSizeChange('w', value)}
              min={1}
              max={gridColumns - position.x}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <NumberField
              label="Height"
              value={size.h}
              onChange={(value) => onSizeChange('h', value)}
              min={1}
              max={gridRows - position.y}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 1 }}>
          <IconButton 
            size="small"
            onClick={() => onMove(0, -1)}
            disabled={!canMoveUp}
            color="primary"
          >
            <ArrowUpward fontSize="small" />
          </IconButton>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <IconButton
              size="small" 
              onClick={() => onMove(-1, 0)}
              disabled={!canMoveLeft}
              color="primary"
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Move
            </Typography>
            
            <IconButton 
              size="small"
              onClick={() => onMove(1, 0)}
              disabled={!canMoveRight}
              color="primary"
            >
              <ArrowForward fontSize="small" />
            </IconButton>
          </Box>
          
          <IconButton 
            size="small"
            onClick={() => onMove(0, 1)}
            disabled={!canMoveDown}
            color="primary"
          >
            <ArrowDownward fontSize="small" />
          </IconButton>
        </Box>
      </Collapse>
    </Box>
  );
});

// Add display names to all components for better debugging
ColorField.displayName = 'ColorField';
TextField2.displayName = 'TextField2';
NumberField.displayName = 'NumberField';
PositionEditor.displayName = 'PositionEditor';
