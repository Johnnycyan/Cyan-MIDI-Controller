import { Box, Typography } from '@mui/material';
import { ControlItem } from '../../types/index';

interface LabelControlProps {
  control: ControlItem;
  onChange?: (value: number) => void;
  onSelect?: (id: string) => void;
  isEditMode?: boolean;
  isSelected?: boolean;
}

export default function LabelControl({ 
  control, 
  onSelect,
  isEditMode = false,
  isSelected = false
}: LabelControlProps) {
  const { config } = control;
  const variant = config.variant || 'body1';
  const textAlign = config.textAlign || 'center';
  const fontWeight = config.fontWeight || 'normal';
  const wrap = config.wrap !== false;
  const backgroundColor = config.backgroundColor || 'transparent';
  const color = config.color || 'text.primary';

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      onSelect?.(control.id);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1,
        backgroundColor,
        opacity: isEditMode && !isSelected ? 0.7 : 1,
      }}
      onClick={handleClick}
    >
      <Typography
        variant={variant as any}
        align={textAlign as any}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'center' ? 'center' : 
                          textAlign === 'right' ? 'flex-end' : 'flex-start',
          color,
          fontWeight,
          overflow: 'hidden',
          whiteSpace: wrap ? 'normal' : 'nowrap',
          wordBreak: 'break-word',
          userSelect: 'none',
        }}
      >
        {config.label || 'Label'}
      </Typography>
    </Box>
  );
}
