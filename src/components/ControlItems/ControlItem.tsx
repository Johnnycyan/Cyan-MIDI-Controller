import { Paper } from '@mui/material';
import MidiSlider from './MidiSlider';
import MidiButton from './MidiButton';
import MidiKnob from './MidiKnob';
import MidiToggle from './MidiToggle';
import MidiLabel from './MidiLabel';
import MidiTextBox from './MidiTextBox';
import { ControlItem as ControlItemType } from '../../types/index';

interface ControlItemProps {
  control: ControlItemType;
  onUpdate: (id: string, updatedValues: Partial<ControlItemType['config']>) => void;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  selectedMidiOutput?: string | null;
}

export default function ControlItem({
  control,
  onUpdate,
  isEditMode,
  isSelected,
  onSelect,
  selectedMidiOutput
}: ControlItemProps) {
  const handleValueChange = (value: number) => {
    onUpdate(control.id, { value });
  };
  
  const getControlComponent = () => {
    switch (control.type) {
      case 'slider':
        return (
          <MidiSlider
            control={control}
            onChange={handleValueChange}
            isEditMode={isEditMode}
            selectedMidiOutput={selectedMidiOutput}
          />
        );
      case 'button':
        return (
          <MidiButton
            control={control}
            onChange={handleValueChange}
            isEditMode={isEditMode}
          />
        );
      case 'knob':
        return (
          <MidiKnob
            control={control}
            onChange={handleValueChange}
            isEditMode={isEditMode}
            selectedMidiOutput={selectedMidiOutput}
          />
        );
      case 'toggle':
        return (
          <MidiToggle
            control={control}
            onChange={handleValueChange}
            isEditMode={isEditMode}
            selectedMidiOutput={selectedMidiOutput}
          />
        );
      case 'label':
        return <MidiLabel control={control} />;
      case 'textbox':
        return (
          <MidiTextBox
            control={control}
            onChange={handleValueChange}
            isEditMode={isEditMode}
            selectedMidiOutput={selectedMidiOutput}
          />
        );
      default:
        return <div>Unknown control type: {control.type}</div>;
    }
  };
  
  return (
    <Paper
      sx={{
        gridColumnStart: control.position.x + 1,
        gridColumnEnd: control.position.x + control.size.w + 1,
        gridRowStart: control.position.y + 1,
        gridRowEnd: control.position.y + control.size.h + 1,
        cursor: isEditMode ? 'pointer' : 'default',
        boxSizing: 'border-box',
        border: isSelected ? '2px solid #2196f3' : '1px solid rgba(0,0,0,0.12)',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        transition: 'border-color 0.2s ease',
        '&:hover': {
          borderColor: isEditMode ? '#2196f3' : 'inherit',
        },
      }}
      elevation={isSelected ? 4 : 1}
      onClick={isEditMode ? onSelect : undefined}
    >
      {getControlComponent()}
    </Paper>
  );
}
