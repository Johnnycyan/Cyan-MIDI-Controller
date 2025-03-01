import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { Update as UpdateIcon, History as HistoryIcon } from '@mui/icons-material';
import { checkForUpdates } from '../utils/updateChecker';
import ChangelogDialog from './ChangelogDialog';
import pkg from '../../package.json';

export default function UpdateButton() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [changelogOpen, setChangelogOpen] = useState(false);

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

    return (
        <>
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
