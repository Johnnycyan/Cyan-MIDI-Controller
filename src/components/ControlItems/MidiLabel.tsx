import { Box, Typography } from '@mui/material';
import { ControlItem } from '../../types/index';

interface MidiLabelProps {
  control: ControlItem;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange?: (value: number) => void;
}

export default function MidiLabel({
  control,
  isEditMode = false,
}: MidiLabelProps) {
  const { config } = control;
  
  // Variant type safety
  const validVariants = ["h1", "h2", "h3", "h4", "h5", "h6", "subtitle1", "subtitle2", "body1", "body2", "caption", "button", "overline"];
  const variant = validVariants.includes(config.variant) ? config.variant : 'body1';

  // Text align type safety
  const validTextAlign = ["left", "center", "right"];
  const textAlign = validTextAlign.includes(config.textAlign) ? config.textAlign : 'center';
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 1,
        backgroundColor: config.backgroundColor || 'transparent',
        pointerEvents: isEditMode ? 'none' : 'auto',
      }}
    >
      <Typography
        variant={variant as any}
        align={textAlign as any}
        sx={{
          color: config.color || 'inherit',
          fontWeight: config.fontWeight || 'normal',
          whiteSpace: config.wrap ? 'normal' : 'nowrap',
          overflow: 'hidden',
          width: '100%',
          userSelect: 'none',
        }}
      >
        {config.label || 'Label'}
      </Typography>
    </Box>
  );
}
