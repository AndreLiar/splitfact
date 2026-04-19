'use client';

import { useState } from 'react';

interface FeedbackButtonProps {
  variant?: 'primary' | 'outline' | 'link' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  position?: 'sidebar' | 'navbar' | 'dashboard' | 'floating';
}

export default function FeedbackButton({ 
  variant = 'outline', 
  size = 'md', 
  className = '',
  showText = true,
  position = 'dashboard'
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const feedbackUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfXgPPkGdxl9Rz94wFy5kpy-7JovQscAyNy6yp0h4NcEzzikQ/viewform?usp=dialog";
  
  const handleFeedbackClick = () => {
    // Open in a modal-like popup window
    const width = 700;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      feedbackUrl,
      'feedback_form',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  // Different styles based on variant and position
  const getButtonStyles = () => {
    const baseStyles = {
      transition: 'all 0.2s ease-in-out',
      border: 'none',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: '#0d6efd',
          color: 'white',
          borderRadius: '8px'
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: '#0d6efd',
          border: '1px solid #0d6efd',
          borderRadius: '8px'
        };
      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: '#6c757d',
          border: 'none'
        };
      case 'floating':
        return {
          ...baseStyles,
          position: 'fixed' as const,
          bottom: '20px',
          right: '20px',
          zIndex: 1050,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#0d6efd',
          color: 'white',
          boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)',
          border: 'none'
        };
      default:
        return baseStyles;
    }
  };

  const getSizeClass = () => {
    if (variant === 'floating') return '';
    
    switch (size) {
      case 'sm': return 'btn-sm px-2';
      case 'lg': return 'btn-lg px-4';
      default: return 'px-3';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return '0.9rem';
      case 'lg': return '1.3rem';
      default: return '1.1rem';
    }
  };

  // Position-specific content
  const getButtonContent = () => {
    switch (position) {
      case 'sidebar':
        return (
          <>
            <i className="bi bi-chat-dots me-2" style={{ fontSize: getIconSize() }}></i>
            {showText && <span>Feedback</span>}
          </>
        );
      case 'navbar':
        return (
          <>
            <i className="bi bi-chat-dots me-1" style={{ fontSize: getIconSize() }}></i>
            {showText && <span className="d-none d-md-inline">Feedback</span>}
          </>
        );
      case 'floating':
        return <i className="bi bi-chat-dots" style={{ fontSize: '1.4rem' }}></i>;
      default:
        return (
          <>
            <i className="bi bi-chat-dots me-2" style={{ fontSize: getIconSize() }}></i>
            {showText && <span>Donner mon avis</span>}
          </>
        );
    }
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleFeedbackClick}
        style={getButtonStyles()}
        className={`btn ${className}`}
        title="Donner votre avis sur Splitfact"
        aria-label="Ouvrir le formulaire de feedback"
      >
        {getButtonContent()}
      </button>
    );
  }

  return (
    <button
      onClick={handleFeedbackClick}
      style={getButtonStyles()}
      className={`btn ${getSizeClass()} ${className}`}
      title="Donner votre avis sur Splitfact"
      aria-label="Ouvrir le formulaire de feedback"
    >
      {getButtonContent()}
    </button>
  );
}

// Alternative component for dropdown menu items
export function FeedbackMenuItem({ className = '' }: { className?: string }) {
  const handleFeedbackClick = () => {
    const feedbackUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfXgPPkGdxl9Rz94wFy5kpy-7JovQscAyNy6yp0h4NcEzzikQ/viewform?usp=dialog";
    
    const width = 700;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      feedbackUrl,
      'feedback_form',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  return (
    <button 
      className={`dropdown-item d-flex align-items-center py-2 ${className}`}
      onClick={handleFeedbackClick}
      style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
    >
      <i className="bi bi-chat-dots me-2"></i>
      Donner mon avis
    </button>
  );
}