import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { 
  Edit as EditIcon, 
  Settings as SettingsIcon, 
  Tune as TuneIcon, 
  PlayArrow as PlayArrowIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import UpdateButton from './UpdateButton';

interface TopBarProps {
  presetName: string;
  isEditMode: boolean;
  toggleEditMode: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  showPresetManager: () => void;
  showSettings: () => void;
}

export default function TopBar({
  presetName,
  isEditMode,
  toggleEditMode,
  isFullscreen,
  toggleFullscreen,
  showPresetManager,
  showSettings
}: TopBarProps) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Cyan MIDI Controller - {presetName}
        </Typography>
        
        <Button 
          color="inherit" 
          onClick={showPresetManager}
          startIcon={<TuneIcon />}
        >
          Presets
        </Button>
        
        <IconButton 
          color="inherit"
          onClick={showSettings}
        >
          <SettingsIcon />
        </IconButton>
        
        <Button 
          color="inherit"
          variant={isEditMode ? "outlined" : "text"}
          startIcon={isEditMode ? <PlayArrowIcon /> : <EditIcon />}
          onClick={toggleEditMode}
          sx={{ ml: 1 }}
        >
          {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
        </Button>

        <IconButton 
          color="inherit"
          onClick={toggleFullscreen}
          sx={{ ml: 1 }}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
        
        <UpdateButton />
      </Toolbar>
    </AppBar>
  );
}
