import { memo, useState, useRef, lazy, Suspense } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  Popover as MuiPopover,
  ClickAwayListener,
  Fade,
  CircularProgress,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ControlItem } from '../types/index';

export interface ControlTooltipEditorProps {
  anchorEl: HTMLElement | null;
  control: ControlItem;
  onClose: () => void;
  updateControl: (control: ControlItem) => void;
  onDeleteControl: (id: string) => void;
  open: boolean;
  isMoving: boolean; // Changed from isDragging to isMoving to better reflect its purpose
}

interface SharedTabProps {
  selectedControl: ControlItem;
  updateControlConfig: (key: string, value: any) => void;
  updateMidiConfig?: (key: string, value: any) => void;
  updateSliderViewMode?: (key: string, value: any) => void;
}

// Fix lazy loading to properly handle module exports
const BasicTabContent = lazy(() => 
  new Promise<{ default: React.ComponentType<any> }>(resolve => {
    // Add slight delay to ensure animation completes before heavy render
    setTimeout(() => 
      import('./ControlTooltipTabs/BasicTabContent').then(module => resolve({ default: module.default }))
    , 100);
  })
);

const MidiTabContent = lazy(() => 
  new Promise<{ default: React.ComponentType<any> }>(resolve => {
    setTimeout(() => 
      import('./ControlTooltipTabs/MidiTabContent').then(module => resolve({ default: module.default }))
    , 100);
  })
);

const ExtraTabContent = lazy(() => 
  new Promise<{ default: React.ComponentType<any> }>(resolve => {
    setTimeout(() => 
      import('./ControlTooltipTabs/ExtraTabContent').then(module => resolve({ default: module.default }))
    , 100);
  })
);

// Loading placeholder for lazy-loaded content
const TabContentLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
    <CircularProgress size={24} />
  </Box>
);

// Optimized TabPanel
const TabPanel = memo(({ children, value, index }: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) => {
  if (value !== index) return null;
  return (
    <Fade in={value === index} timeout={300}>
      <Box sx={{ pt: 1 }}>{children}</Box>
    </Fade>
  );
});

// Main tooltip editor component
const ControlTooltipEditor = memo(({ anchorEl, onClose, open, control, updateControl, onDeleteControl }: ControlTooltipEditorProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const sharedTabProps: SharedTabProps = {
    selectedControl: control,
    updateControlConfig: (key: string, value: any) => {
      updateControl({
        ...control,
        config: {
          ...control.config,
          [key]: value
        }
      });
    },
    updateMidiConfig: (key: string, value: any) => {
      updateControl({
        ...control,
        config: {
          ...control.config,
          midi: {
            channel: control.config.midi?.channel ?? 1,
            cc: control.config.midi?.cc ?? 0,
            min: control.config.midi?.min ?? 0,
            max: control.config.midi?.max ?? 127,
            ...control.config.midi,
            [key]: value
          }
        }
      });
    },
    updateSliderViewMode: (key: string, value: any) => {
      updateControl({
        ...control,
        config: {
          ...control.config,
          sliderConfig: {
            ...control.config.sliderConfig,
            viewMode: {
              ...(control.config.sliderConfig?.viewMode || {}),
              [key]: value
            }
          }
        }
      });
    }
  };

  return (
    <MuiPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 300,
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            pointerEvents: 'auto'
          }
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Paper 
        elevation={6} // Increased elevation for better shadow
        sx={{ 
          p: 2, 
          width: 320, // Fixed width
          height: 400, // Fixed height
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999, // Very high z-index to ensure it's on top
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {control.type.charAt(0).toUpperCase() + control.type.slice(1)}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Tabs 
          value={activeTab} 
          onChange={(_e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ 
            minHeight: 32, 
            mb: 1,
            '& .MuiTab-root': {
              minHeight: 32,
              py: 0.5
            }
          }}
        >
          <Tab label="Basic" />
          <Tab label="MIDI" />
          <Tab label={control.type === 'slider' ? 'Slider' : 'Extra'} />
        </Tabs>

        {/* Scrollable content area with fixed height */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          pr: 1, // Add right padding for scrollbar
          mr: -1, // Negative margin to offset padding
        }}>
          <Suspense fallback={<TabContentLoader />}>
            {/* Tab panels - only render the active one */}
            <TabPanel value={activeTab} index={0}>
              <BasicTabContent {...sharedTabProps} />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <MidiTabContent {...sharedTabProps} />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <ExtraTabContent {...sharedTabProps} />
            </TabPanel>
          </Suspense>
        </Box>

        <Fade in={true} timeout={400} style={{ transitionDelay: '200ms' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              onDeleteControl(control.id);
              onClose();
            }}
            fullWidth
            sx={{ mt: 2 }}
            size="small"
          >
            Delete Control
          </Button>
        </Fade>
      </Paper>
    </MuiPopover>
  );
});

ControlTooltipEditor.displayName = 'ControlTooltipEditor';
export default memo(ControlTooltipEditor);
