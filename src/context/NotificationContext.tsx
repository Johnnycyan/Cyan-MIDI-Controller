import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert, Snackbar, SnackbarCloseReason } from '@mui/material';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (message: string, type: NotificationType) => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notification: null,
  showNotification: () => {},
  clearNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const handleClose = (_event: React.SyntheticEvent<any> | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        clearNotification,
      }}
    >
      {children}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={notification?.type} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
