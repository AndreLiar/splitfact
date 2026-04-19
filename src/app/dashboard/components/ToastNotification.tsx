'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationType } from '@prisma/client';

interface ToastNotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  autoHide?: boolean;
  duration?: number;
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  type,
  title,
  message,
  actionUrl,
  autoHide = true,
  duration = 8000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHiding, setIsHiding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleClose = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  const handleClick = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (actionUrl) {
      router.push(actionUrl);
      handleClose();
    }
  };

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'URSSAF_REMINDER':
        return {
          icon: 'bi-calendar-check',
          color: 'text-primary',
          bgColor: 'bg-primary',
          lightBg: 'bg-primary bg-opacity-10',
          borderColor: 'border-primary'
        };
      case 'TVA_THRESHOLD_WARNING':
        return {
          icon: 'bi-exclamation-triangle',
          color: 'text-warning',
          bgColor: 'bg-warning',
          lightBg: 'bg-warning bg-opacity-10',
          borderColor: 'border-warning'
        };
      case 'TVA_THRESHOLD_EXCEEDED':
        return {
          icon: 'bi-exclamation-octagon',
          color: 'text-danger',
          bgColor: 'bg-danger',
          lightBg: 'bg-danger bg-opacity-10',
          borderColor: 'border-danger'
        };
      default:
        return {
          icon: 'bi-info-circle',
          color: 'text-info',
          bgColor: 'bg-info',
          lightBg: 'bg-info bg-opacity-10',
          borderColor: 'border-info'
        };
    }
  };

  if (!isVisible) return null;

  const config = getNotificationConfig(type);

  return (
    <div 
      className={`toast-notification ${isHiding ? 'hiding' : ''} ${config.borderColor} border-start border-4`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Progress bar for auto-hide */}
      {autoHide && (
        <div 
          className="toast-progress"
          style={{ 
            animationDuration: `${duration}ms`,
            animationPlayState: isHiding ? 'paused' : 'running'
          }}
        />
      )}

      <div className="d-flex align-items-start p-4">
        {/* Icon */}
        <div 
          className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${config.lightBg}`}
          style={{ width: '48px', height: '48px', minWidth: '48px' }}
        >
          <i className={`${config.icon} ${config.color} fs-4`}></i>
        </div>

        {/* Content */}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex align-items-start justify-content-between mb-2">
            <h6 className="mb-0 fw-bold">{title}</h6>
            <button
              type="button"
              className="btn-close btn-sm ms-2"
              aria-label="Fermer"
              onClick={handleClose}
            ></button>
          </div>
          
          <p className="mb-3 text-muted small lh-base">
            {message}
          </p>

          {/* Actions */}
          <div className="d-flex gap-2">
            {actionUrl && (
              <button
                className={`btn btn-sm ${config.bgColor} text-white rounded-pill px-3`}
                onClick={(e) => handleClick(e)}
              >
                <i className="bi bi-arrow-right me-1"></i>
                Voir détails
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={handleClose}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;