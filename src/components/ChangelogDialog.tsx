import { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    Button,
    Typography,
    CircularProgress,
    Box
} from '@mui/material';
import { getLatestChangelog } from '../utils/changelogFetcher';

interface ChangelogDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function ChangelogDialog({ open, onClose }: ChangelogDialogProps) {
    const [changelog, setChangelog] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getLatestChangelog()
                .then(setChangelog)
                .finally(() => setLoading(false));
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Latest Changes</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Typography whiteSpace="pre-wrap">
                        {changelog}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
