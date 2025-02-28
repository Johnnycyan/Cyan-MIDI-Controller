import { useState } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Tooltip, 
  TextFieldProps 
} from '@mui/material';
import { Visibility, VisibilityOff, ContentCopy } from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';

interface SecretFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export default function SecretField({ 
  label, 
  value, 
  onChange, 
  readOnly = false,
  ...rest 
}: SecretFieldProps & Omit<TextFieldProps, 'onChange' | 'value'>) {
  const [showSecret, setShowSecret] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);
  const { showNotification } = useNotification();

  const handleToggleVisibility = () => {
    setShowSecret(!showSecret);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fieldValue)
      .then(() => {
        showNotification('Copied to clipboard!', 'success');
      })
      .catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <TextField
      fullWidth
      label={label}
      type={showSecret ? 'text' : 'password'}
      value={fieldValue}
      onChange={handleChange}
      InputProps={{
        readOnly: readOnly,
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title={showSecret ? "Hide" : "Show"}>
              <IconButton onClick={handleToggleVisibility} edge="end">
                {showSecret ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy">
              <IconButton onClick={handleCopy} edge="end">
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  );
}
