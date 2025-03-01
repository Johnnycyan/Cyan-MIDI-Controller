import { AppBar, Toolbar } from '@mui/material';
import UpdateButton from './UpdateButton';

export default function TopBar() {
    return (
        <AppBar position="static">
            <Toolbar>
                {/* ...existing toolbar content... */}
                <UpdateButton />
            </Toolbar>
        </AppBar>
    );
}
