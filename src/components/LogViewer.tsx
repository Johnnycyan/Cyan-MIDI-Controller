import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { validateToken } from '../utils/auth';
import LoginForm from './LoginForm';

export default function LogViewer() {
  const { logId } = useParams();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const checkAuthAndFetchLog = async () => {
      if (!token) return;
      
      const isValid = await validateToken(token);
      if (!isValid) {
        localStorage.removeItem('token');
        setToken(null);
        return;
      }

      try {
        const response = await fetch(`/api/logs/${logId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchLog();
  }, [logId, token]);

  const handleLogin = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Log Details</Typography>
      <Box sx={{ 
        mt: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider'
      }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {content}
        </pre>
      </Box>
    </Paper>
  );
}
