import React from 'react';
import { Slide } from '@mui/material';

interface SlideTransitionProps {
  children: React.ReactElement;
  direction: 'left' | 'right';
  show: boolean;
}

export default function SlideTransition({ children, direction, show }: SlideTransitionProps) {
  // Invert the direction when hiding to make both pages move the same way
  const slideDirection = show ? direction : (direction === 'left' ? 'right' : 'left');
  
  return (
    <Slide
      direction={slideDirection}
      in={show}
      mountOnEnter
      unmountOnExit
      timeout={300}
    >
      {children}
    </Slide>
  );
}
