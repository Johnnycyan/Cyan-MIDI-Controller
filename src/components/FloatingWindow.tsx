import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Paper, 
  Box, 
  IconButton, 
  Typography,
  useTheme
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Position } from '../types/index';

interface FloatingWindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  initialPosition?: Position;
  minWidth?: number;
  minHeight?: number;
}

export default function FloatingWindow({
  title,
  children,
  onClose,
  initialPosition = { x: 100, y: 100 },
  minWidth = 300,
  minHeight = 200
}: FloatingWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  
  // Handle dragging
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only allow left mouse button
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  // Handle resizing
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only allow left mouse button
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(minWidth, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(minHeight, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, minWidth, minHeight]);

  return createPortal(
    <Paper
      ref={windowRef}
      sx={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.shadows[16],
        overflow: 'hidden',
        zIndex: 1200,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 1,
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'move',
        }}
        onMouseDown={startDrag}
      >
        <Typography variant="subtitle1" sx={{ flexGrow: 1, userSelect: 'none' }}>
          {title}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'inherit', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' } }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {children}
      </Box>
      
      {/* Resize Handle */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 20,
          height: 20,
          cursor: 'nwse-resize',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 0 10px 10px',
            borderColor: `transparent transparent ${theme.palette.divider} transparent`,
          },
        }}
        onMouseDown={startResize}
      />
    </Paper>,
    document.body
  );
}
