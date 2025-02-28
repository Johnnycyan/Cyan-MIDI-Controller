import { useState } from 'react';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';
import { login } from '../utils/auth';
import { useNotification } from '../context/NotificationContext';

interface LoginFormProps {
  onLogin: (token: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await login(username, password);
      if (token) {
        onLogin(token);
        showNotification('Successfully logged in', 'success');
      } else {
        showNotification('Invalid credentials', 'error');
      }
    } catch (error) {
      showNotification('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 2
      }}
    >
      <Paper 
        sx={{ 
          p: 4, 
          maxWidth: 400, 
          width: '100%',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Log In
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
          
          <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
            For showcase purposes: any username/password combination will work
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
