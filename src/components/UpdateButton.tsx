import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { Update as UpdateIcon, History as HistoryIcon } from '@mui/icons-material';
import { checkForUpdates } from '../utils/updateChecker';
import ChangelogDialog from './ChangelogDialog';
import pkg from '../../package.json';
import ThemeSelector from './ThemeSelector';

export default function UpdateButton() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [changelogOpen, setChangelogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        const checkUpdate = async () => {
            const hasUpdate = await checkForUpdates(pkg.version);
            setUpdateAvailable(hasUpdate);
        };

        // Check immediately on mount
        checkUpdate();

        // Then check periodically
        const interval = setInterval(checkUpdate, 1000 * 60 * 60); // Every hour

        return () => clearInterval(interval);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title="Settings and Updates">
                <IconButton
                    color="inherit"
                    onClick={handleClick}
                >
                    <UpdateIcon />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { minWidth: 200 }
                }}
            >
                <MenuItem>
                    <Box sx={{ width: '100%' }}>
                        <ThemeSelector compact />
                    </Box>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        onClick={() => window.location.reload()}
                    >
                        Check for Updates
                    </Button>
                </MenuItem>
            </Menu>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<HistoryIcon />}
                    onClick={() => setChangelogOpen(true)}
                    size="small"
                >
                    Changes
                </Button>

                {updateAvailable && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<UpdateIcon />}
                        onClick={() => window.location.reload()}
                        size="small"
                    >
                        Update Available
                    </Button>
                )}
            </Box>

            <ChangelogDialog 
                open={changelogOpen} 
                onClose={() => setChangelogOpen(false)} 
            />
        </>
    );
}
