'use client';

import * as React from 'react';

import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface BaseProps {
  children: React.ReactNode;
}

interface RootResponsiveDialogProps extends BaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ResponsiveDialogProps extends BaseProps {
  className?: string;
  asChild?: true;
}

const ResponsiveDialogContext = React.createContext<{ isDesktop: boolean }>({
  isDesktop: false,
});

export function ResponsiveDialog({ children, ...props }: RootResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <ResponsiveDialogContext.Provider value={{ isDesktop }}>
      {isDesktop ? <Dialog {...props}>{children}</Dialog> : <Drawer {...props}>{children}</Drawer>}
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({ className, children, ...props }: ResponsiveDialogProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogTrigger className={className} {...props}>
        {children}
      </DialogTrigger>
    );
  }

  return (
    <DrawerTrigger className={className} {...props}>
      {children}
    </DrawerTrigger>
  );
}

export function ResponsiveDialogContent({ className, children, ...props }: ResponsiveDialogProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={className} {...props}>
      {children}
    </DrawerContent>
  );
}

export function ResponsiveDialogHeader({ className, children, ...props }: ResponsiveDialogProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogHeader className={className} {...props}>
        {children}
      </DialogHeader>
    );
  }

  return (
    <DrawerHeader className={className} {...props}>
      {children}
    </DrawerHeader>
  );
}

export function ResponsiveDialogTitle({ className, children, ...props }: ResponsiveDialogProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogTitle className={className} {...props}>
        {children}
      </DialogTitle>
    );
  }

  return (
    <DrawerTitle className={className} {...props}>
      {children}
    </DrawerTitle>
  );
}

export function ResponsiveDialogDescription({
  className,
  children,
  ...props
}: ResponsiveDialogProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogDescription className={className} {...props}>
        {children}
      </DialogDescription>
    );
  }

  return (
    <DrawerDescription className={className} {...props}>
      {children}
    </DrawerDescription>
  );
}

export function ResponsiveDialogFooter({ className, children, ...props }: ResponsiveDialogProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogFooter className={className} {...props}>
        {children}
      </DialogFooter>
    );
  }

  return (
    <DrawerFooter className={className} {...props}>
      {children}
    </DrawerFooter>
  );
}
