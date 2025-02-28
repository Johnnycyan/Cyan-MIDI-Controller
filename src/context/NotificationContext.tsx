import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Alert, Snackbar, SnackbarCloseReason } from '@mui/material';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  clearNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [duration, setDuration] = useState(4000);

  const showNotification = useCallback((
    message: string,
    notificationType: NotificationType = 'info',
    notificationDuration: number = 4000
  ) => {
    setMessage(message);
    setType(notificationType);
    setDuration(notificationDuration);
    setOpen(true);
  }, []);

  const clearNotification = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClose = (_event: React.SyntheticEvent<any> | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotification }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={type} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
