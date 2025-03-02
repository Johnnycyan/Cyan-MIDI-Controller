import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { GetApp as DownloadIcon } from '@mui/icons-material';
import { checkForUpdates } from '../utils/updateChecker';
import ChangelogDialog from './ChangelogDialog';
import pkg from '../../package.json';

export default function UpdateButton() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [changelogOpen, setChangelogOpen] = useState(false);

    useEffect(() => {
        const checkUpdate = async () => {
            console.log(`[UpdateChecker] Checking for updates. Current version: ${pkg.version}`);
            const [hasUpdate, updateVersion, errorMessage] = await checkForUpdates(pkg.version);
            if (errorMessage) {
                console.error(`[UpdateChecker] Error checking for updates: ${errorMessage}`);
                return;
            } else {
                console.log(`[UpdateChecker] ${hasUpdate ? (updateVersion ? `Update available: ${updateVersion}` : "Update available but no version was supplied") : (updateVersion ? `No updates available. Server version: ${updateVersion}` : "No updates available")}`);
            }
            setUpdateAvailable(hasUpdate);
        };

        // Check immediately on mount
        checkUpdate();

        // Then check periodically
        const interval = setInterval(checkUpdate, 1000 * 60 * 10); // Every 10 minutes

        return () => clearInterval(interval);
    }, []);

    const handleShowChangelog = () => {
        setChangelogOpen(true);
    };

    // Don't render anything if no update is available
    if (!updateAvailable) {
        return null;
    }

    return (
        <>
            <Button
                color="info"
                onClick={handleShowChangelog}
                startIcon={<DownloadIcon />}
                sx={{ ml: 1, p: 2 }}
            >
                Update
            </Button>

            <ChangelogDialog 
                open={changelogOpen} 
                onClose={() => setChangelogOpen(false)} 
                showUpdateButton={true}
            />
        </>
    );
}
