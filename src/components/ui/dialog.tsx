'use client';

import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ className = '', children }) => {
  return (
    <div className={`modal-content ${className}`}>
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ className = '', children }) => {
  return (
    <div className={`modal-header ${className}`}>
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ className = '', children }) => {
  return (
    <h5 className={`modal-title ${className}`}>
      {children}
    </h5>
  );
};

export const DialogFooter: React.FC<DialogFooterProps> = ({ className = '', children }) => {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  );
};