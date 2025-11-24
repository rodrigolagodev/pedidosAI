'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { forwardRef } from 'react';

// Cast Button to avoid onDrag type mismatch between React.HTMLAttributes and Framer Motion
const ButtonComponent = Button as React.ComponentType<ButtonProps>;
export const MotionButton = motion.create(ButtonComponent);

export const TapButton = forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<'button'>>(
  (props, ref) => {
    return (
      <MotionButton
        ref={ref}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
        {...props}
      />
    );
  }
);

TapButton.displayName = 'TapButton';
