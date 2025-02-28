import { memo, useState, useEffect, useCallback, useRef, forwardRef, lazy, Suspense } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  IconButton,
  Collapse,
  Popper,
  ClickAwayListener,
  Grow,
  Fade,
  CircularProgress,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Close as CloseIcon,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { ControlItem } from '../types/index';

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

// Memoized form components
const ColorField = memo(({ value, onChange, label }: {
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

const TextField2 = memo(({ value, onChange, label, ...props }: {
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

const NumberField = memo(({ value, onChange, label, min, max }: {
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

// Position editor section component
const PositionEditor = memo(({
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

// Main tooltip editor component
function ControlTooltipEditor({
  anchorEl,
  selectedControl,
  onClose,
  onUpdateControl,
  onDeleteControl,
  onMoveControl,
  gridColumns,
  gridRows,
  isDragging = false
}: {
  anchorEl: HTMLElement | null;
  selectedControl: ControlItem | null;
  onClose: () => void;
  onUpdateControl: (id: string, updatedValues: Partial<ControlItem>) => void;
  onDeleteControl: (id: string) => void;
  onMoveControl: (id: string, dx: number, dy: number) => void;
  gridColumns: number;
  gridRows: number;
  isDragging?: boolean;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [isClosing, setIsClosing] = useState(false);
  const popperRef = useRef<HTMLDivElement>(null);
  const prevAnchorElRef = useRef<HTMLElement | null>(null);
  
  // Only show if we have an anchor, a selected control, and no dragging is happening
  const open = Boolean(anchorEl) && Boolean(selectedControl) && !isDragging && !isClosing;
  
  // Reset the closing state when anchor changes or is removed
  useEffect(() => {
    if (anchorEl !== prevAnchorElRef.current) {
      setIsClosing(false);
      prevAnchorElRef.current = anchorEl;
      
      // Reset active tab when a new control is selected
      if (anchorEl) {
        setActiveTab(0);
      }
    }
  }, [anchorEl]);

  // Calculate optimal placement with initial position
  useEffect(() => {
    if (!anchorEl || !selectedControl) return;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const anchorRect = anchorEl.getBoundingClientRect();

    const spaceAbove = anchorRect.top;
    const spaceBelow = viewportHeight - anchorRect.bottom;
    const spaceLeft = anchorRect.left;
    const spaceRight = viewportWidth - anchorRect.right;

    // Find the side with the most space
    const spaces = [
      { side: 'top' as const, space: spaceAbove },
      { side: 'bottom' as const, space: spaceBelow },
      { side: 'left' as const, space: spaceLeft },
      { side: 'right' as const, space: spaceRight }
    ];

    spaces.sort((a, b) => b.space - a.space);
    setPlacement(spaces[0].side);
  }, [anchorEl, selectedControl]);

  // Handle smooth closing
  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Delay actual close to allow animation to complete
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Match with Grow exit timeout
  }, [onClose]);
  
  // Close when clicking outside - fix ClickAwayListener type issue
  const handleClickAway = useCallback((event: MouseEvent | TouchEvent) => {
    // Only close if click wasn't on the anchor element
    if (anchorEl && event.target instanceof Node && !anchorEl.contains(event.target)) {
      handleClose();
    }
  }, [anchorEl, handleClose]);

  if (!selectedControl) return null;

  // Create a handler function that correctly updates the control
  const updateControlConfig = (key: string, value: any) => {
    onUpdateControl(selectedControl.id, {
      config: { ...selectedControl.config, [key]: value }
    });
  };

  // Update nested MIDI properties
  const updateMidiConfig = (key: string, value: any) => {
    const currentMidi = selectedControl.config.midi || { channel: 1, cc: 1 };
    onUpdateControl(selectedControl.id, {
      config: { 
        ...selectedControl.config, 
        midi: { ...currentMidi, [key]: value } 
      }
    });
  };

  // Update slider view mode settings
  const updateSliderViewMode = (key: string, value: any) => {
    const currentViewMode = selectedControl.config.sliderConfig?.viewMode || {};
    onUpdateControl(selectedControl.id, {
      config: {
        ...selectedControl.config,
        sliderConfig: {
          ...selectedControl.config.sliderConfig,
          viewMode: { ...currentViewMode, [key]: value }
        }
      }
    });
  };

  // Update position
  const updatePosition = (axis: 'x' | 'y', value: number) => {
    onUpdateControl(selectedControl.id, {
      position: {
        ...selectedControl.position,
        [axis]: value
      }
    });
  };

  // Update size
  const updateSize = (dimension: 'w' | 'h', value: number) => {
    onUpdateControl(selectedControl.id, {
      size: {
        ...selectedControl.size,
        [dimension]: value
      }
    });
  };

  // Move control
  const handleMove = (dx: number, dy: number) => {
    onMoveControl(selectedControl.id, dx, dy);
  };

  // Pass shared props to tab contents
  const sharedTabProps = {
    selectedControl,
    updateControlConfig,
    updateMidiConfig,
    updateSliderViewMode,
    updatePosition,
    updateSize,
    handleMove,
    gridColumns,
    gridRows,
  };

  // Must use forwardRef to fix the React warning about refs
  const PopperContent = forwardRef<HTMLDivElement>((_, ref) => (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Paper 
        ref={ref}
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
            {selectedControl.type.charAt(0).toUpperCase() + selectedControl.type.slice(1)}
          </Typography>
          <IconButton size="small" onClick={handleClose}>
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
          <Tab label={selectedControl.type === 'slider' ? 'Slider' : 'Extra'} />
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
              onDeleteControl(selectedControl.id);
              handleClose();
            }}
            fullWidth
            sx={{ mt: 2 }}
            size="small"
          >
            Delete Control
          </Button>
        </Fade>
      </Paper>
    </ClickAwayListener>
  ));

  PopperContent.displayName = 'PopperContent';

  return (
    <Popper
      ref={popperRef}
      open={open}
      anchorEl={anchorEl}
      placement={placement}
      transition
      modifiers={[
        {
          name: 'preventOverflow',
          options: {
            padding: 16,
            boundary: document.body
          }
        },
        {
          name: 'offset',
          options: {
            offset: [0, 12],
          },
        },
        {
          name: 'flip',
          enabled: true,
          options: {
            fallbackPlacements: ['bottom', 'left', 'right'],
          },
        },
        // This is critical - it ensures the popper is positioned correctly on first render
        {
          name: 'computeStyles',
          options: {
            gpuAcceleration: false, // Better initial positioning
            adaptive: false // Prevents "jumping" when menu is resizing
          }
        }
      ]}
      popperOptions={{
        placement: placement,
        strategy: 'fixed', // Use fixed positioning to avoid jumps
      }}
      sx={{
        zIndex: 9999, // Very high z-index
        transformOrigin: 'center center',
      }}
    >
      {({ TransitionProps }) => (
        <Grow
          {...TransitionProps}
          timeout={{ enter: 300, exit: 200 }}
          style={{ transformOrigin: 'center center' }}
        >
          <PopperContent />
        </Grow>
      )}
    </Popper>
  );
}

export default memo(ControlTooltipEditor);
