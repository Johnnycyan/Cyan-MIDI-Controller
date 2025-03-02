import { AppBar, Toolbar, Typography, Button } from '@mui/material';
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

      <UpdateButton />

      <Button 
        color="inherit"
        onClick={showSettings}
        startIcon={<SettingsIcon />}
        sx={{ p: 2 }}
      >
        Settings
      </Button>
      
      <Button 
        color="inherit" 
        onClick={showPresetManager}
        startIcon={<TuneIcon />}
        sx={{ p: 2 }}
      >
        Presets
      </Button>

      <Button 
        color="inherit"
        startIcon={isEditMode ? <PlayArrowIcon /> : <EditIcon />}
        onClick={toggleEditMode}
        sx={{ ml: 1, p: 2 }}
      >
        {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
      </Button>

      <Button 
        color="inherit"
        onClick={toggleFullscreen}
        startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        sx={{ ml: 1, p: 2 }}
      >
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </Button>
      </Toolbar>
    </AppBar>
  );
}
