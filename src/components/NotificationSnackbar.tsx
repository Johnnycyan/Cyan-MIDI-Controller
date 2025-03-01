import { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNotification } from '../context/NotificationContext';

export default function NotificationSnackbar() {
  const { notification, clearNotification } = useNotification();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      setOpen(true);
    }
  }, [notification]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setTimeout(clearNotification, 300); // Clear after animation completes
  };

  // MUI expects a single ReactElement as children, not multiple nodes (text and elements)
  return (
    <Snackbar
      open={open && !!notification}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {notification ? 
        <Alert 
          onClose={handleClose} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
        : 
        <div />
      }
    </Snackbar>
  );
}
