'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, shouldShowAsToast } from './ToastProvider';

interface Notification {
  id: string;
  type: 'URSSAF_REMINDER' | 'TVA_THRESHOLD_WARNING' | 'TVA_THRESHOLD_EXCEEDED' | 'GENERAL' | 'FISCAL_INSIGHT' | 'DEADLINE' | 'CASH_FLOW';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt: string;
  readAt?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [animating, setAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { addToast } = useToast();

  // Fetch notifications with error handling and debugging
  const fetchNotifications = async () => {
    // Don't fetch if component is unmounted or already loading
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Use Promise.allSettled for better error handling
      const [notificationResponse, insightsResponse] = await Promise.allSettled([
        fetch('/api/notifications?limit=8', {
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch('/api/insights?type=insights', {
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      let regularNotifications = [];
      let insightNotifications = [];

      // Handle notifications response
      if (notificationResponse.status === 'fulfilled' && notificationResponse.value.ok) {
        const data = await notificationResponse.value.json();
        regularNotifications = data.notifications || [];
      }

      // Handle insights response
      if (insightsResponse.status === 'fulfilled' && insightsResponse.value.ok) {
        const insights = await insightsResponse.value.json();
        insightNotifications = (insights || []).slice(0, 3).map((insight: any) => ({
          id: `insight-${insight.id}`,
          type: insight.type === 'deadline' ? 'DEADLINE' : 'FISCAL_INSIGHT',
          title: insight.title,
          message: insight.description,
          isRead: false,
          actionUrl: insight.actionUrl,
          priority: insight.priority,
          createdAt: insight.createdAt,
          metadata: { 
            estimatedImpact: insight.estimatedImpact,
            category: insight.category 
          }
        }));
      }

      const newNotifications = [...insightNotifications, ...regularNotifications];
      const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
        
      // Check for new urgent notifications to show as toasts
      if (notifications.length > 0) {
        const existingIds = new Set(notifications.map(n => n.id));
          const urgentNewNotifications = newNotifications.filter((notification: Notification) => 
            !existingIds.has(notification.id) && 
            !notification.isRead && 
            shouldShowAsToast(notification.type)
          );
          
          // Show urgent notifications as toasts
          urgentNewNotifications.forEach((notification: Notification) => {
            addToast({
              type: notification.type,
              title: notification.title,
              message: notification.message,
              actionUrl: notification.actionUrl,
            });
          });
        }
        
        setNotifications(newNotifications);
        
        // Animate notification badge if count increased
        if (newUnreadCount > unreadCount && unreadCount > 0) {
          setAnimating(true);
          setTimeout(() => setAnimating(false), 600);
        }
        
        setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Refresh notifications every 60 seconds in production, 30 seconds in development
    const intervalTime = process.env.NODE_ENV === 'development' ? 30000 : 60000;
    const interval = setInterval(fetchNotifications, intervalTime);
    
    return () => clearInterval(interval);
  }, []); // Remove unreadCount dependency to prevent unnecessary refetches

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key closes dropdown
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
      // Ctrl/Cmd + N opens notifications
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !showDropdown) {
        event.preventDefault();
        setShowDropdown(true);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification, event?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Mark as read first
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Navigate if there's an action URL
      if (notification.actionUrl) {
        // Close dropdown immediately for better UX
        setShowDropdown(false);
        
        // Navigate with error handling
        try {
          router.push(notification.actionUrl);
        } catch (navError) {
          // Fallback: try opening in new tab if push fails
          window.open(notification.actionUrl, '_blank');
        }
      } else {
        // Just close dropdown if no actionUrl
        setShowDropdown(false);
      }
    } catch (error) {
      setShowDropdown(false);
    }
  };

  // Get notification display info based on type
  const getNotificationInfo = (type: string) => {
    switch (type) {
      case 'URSSAF_REMINDER':
        return {
          icon: 'bi-calendar-check',
          color: 'text-primary',
          bgColor: 'bg-primary',
          lightBg: 'bg-primary bg-opacity-10',
          label: 'URSSAF'
        };
      case 'TVA_THRESHOLD_WARNING':
        return {
          icon: 'bi-exclamation-triangle',
          color: 'text-warning',
          bgColor: 'bg-warning',
          lightBg: 'bg-warning bg-opacity-10',
          label: 'TVA'
        };
      case 'TVA_THRESHOLD_EXCEEDED':
        return {
          icon: 'bi-exclamation-octagon',
          color: 'text-danger',
          bgColor: 'bg-danger',
          lightBg: 'bg-danger bg-opacity-10',
          label: 'URGENT'
        };
      case 'FISCAL_INSIGHT':
        return {
          icon: 'bi-lightbulb',
          color: 'text-success',
          bgColor: 'bg-success',
          lightBg: 'bg-success bg-opacity-10',
          label: 'IA'
        };
      case 'DEADLINE':
        return {
          icon: 'bi-calendar-event',
          color: 'text-warning',
          bgColor: 'bg-warning',
          lightBg: 'bg-warning bg-opacity-10',
          label: 'ÉCHÉANCE'
        };
      case 'CASH_FLOW':
        return {
          icon: 'bi-cash-stack',
          color: 'text-info',
          bgColor: 'bg-info',
          lightBg: 'bg-info bg-opacity-10',
          label: 'TRÉSORERIE'
        };
      default:
        return {
          icon: 'bi-info-circle',
          color: 'text-info',
          bgColor: 'bg-info',
          lightBg: 'bg-info bg-opacity-10',
          label: 'INFO'
        };
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Notification Bell */}
      <button
        className={`btn btn-outline-light border-0 position-relative rounded-circle p-2 ${
          showDropdown ? 'bg-primary text-white' : 'hover-bg-light'
        } transition-all`}
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-expanded={showDropdown}
        aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} non lues` : ''}`}
        style={{ 
          width: '44px', 
          height: '44px',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <i className={`bi bi-bell fs-5 ${animating ? 'animate-bounce' : ''}`}></i>
        {unreadCount > 0 && (
          <span 
            className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm ${
              animating ? 'animate-pulse' : ''
            }`}
            style={{ 
              fontSize: '0.7rem',
              minWidth: '18px',
              height: '18px',
              lineHeight: '18px'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="visually-hidden">notifications non lues</span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="notification-backdrop"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="notification-dropdown dropdown-menu dropdown-menu-end show shadow-lg border-0 p-0" 
            style={{ 
              maxHeight: '600px',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center p-4 bg-light border-bottom">
            <div>
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-bell me-2 text-primary"></i>
                Notifications
              </h6>
              {unreadCount > 0 ? (
                <small className="text-muted">{unreadCount} nouvelle(s)</small>
              ) : (
                <small className="text-muted">Aucune nouvelle notification</small>
              )}
            </div>
            <div className="d-flex gap-2">
              {/* Refresh button */}
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-2"
                onClick={() => fetchNotifications()}
                disabled={loading}
                title="Actualiser les notifications"
              >
                <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
              </button>
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                  onClick={markAllAsRead}
                >
                  <i className="bi bi-check-all me-1"></i>
                  Tout lire
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-auto" style={{ maxHeight: '450px' }}>
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2 text-muted small">Chargement des notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4">
                <i className="bi bi-bell display-4 mb-3 text-primary opacity-75"></i>
                <h6 className="mb-3 text-darkGray">Aucune notification pour le moment</h6>
                <p className="mb-3 small text-mediumGray">
                  Vous recevrez ici des notifications pour :
                </p>
                <div className="text-start">
                  <small className="text-mediumGray d-block mb-1">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Rappels de déclarations URSSAF
                  </small>
                  <small className="text-mediumGray d-block mb-1">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Alertes de seuil TVA
                  </small>
                  <small className="text-mediumGray d-block mb-1">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Conseils fiscaux personnalisés
                  </small>
                  <small className="text-mediumGray d-block mb-3">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Échéances importantes
                  </small>
                </div>
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    className="btn btn-sm btn-outline-primary rounded-pill"
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/dashboard/assistant');
                    }}
                  >
                    <i className="bi bi-robot me-1"></i>
                    Assistant IA
                  </button>
                  <button
                    className="btn btn-sm btn-primary rounded-pill"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/notifications/restore', { method: 'POST' });
                        if (response.ok) {
                          // Refresh notifications after restoring
                          setTimeout(() => {
                            fetchNotifications();
                          }, 500);
                        }
                      } catch (error) {
                        console.error('Failed to restore notifications:', error);
                      }
                    }}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i>
                    Restaurer
                  </button>
                </div>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map((notification) => {
                  const info = getNotificationInfo(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`list-group-item border-0 position-relative ${
                        notification.actionUrl ? 'cursor-pointer' : ''
                      } ${!notification.isRead ? info.lightBg : ''} hover-bg-light transition-all`}
                      onClick={(e) => handleNotificationClick(notification, e)}
                      style={{ 
                        cursor: notification.actionUrl ? 'pointer' : 'default',
                        borderLeft: !notification.isRead ? `4px solid var(--bs-${info.color.replace('text-', '')})` : 'none'
                      }}
                    >
                      <div className="d-flex align-items-start p-3">
                        {/* Icon with background */}
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${info.lightBg}`}
                          style={{ width: '40px', height: '40px', minWidth: '40px' }}
                        >
                          <i className={`${info.icon} ${info.color}`}></i>
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <h6 className={`mb-0 ${!notification.isRead ? 'fw-bold' : 'fw-semibold'}`}>
                              {notification.title}
                            </h6>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge ${info.bgColor} text-white`} style={{ fontSize: '0.65rem' }}>
                                {info.label}
                              </span>
                              {!notification.isRead && (
                                <span className="badge bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                              )}
                            </div>
                          </div>
                          
                          <p className="mb-2 small text-muted" style={{ lineHeight: '1.4' }}>
                            {notification.message.length > 100 
                              ? `${notification.message.substring(0, 100)}...` 
                              : notification.message
                            }
                          </p>
                          
                          <div className="d-flex align-items-center justify-content-between">
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {formatRelativeTime(notification.createdAt)}
                            </small>
                            {notification.actionUrl && (
                              <button
                                className={`btn btn-sm btn-outline-primary rounded-pill px-3 py-1 notification-action-btn`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent parent click
                                  handleNotificationClick(notification, e);
                                }}
                                style={{ 
                                  fontSize: '0.75rem',
                                  minWidth: '90px'
                                }}
                              >
                                <i className="bi bi-arrow-right me-1"></i>
                                Voir détails
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>


          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-top bg-light p-3 text-center">
              <button
                className="btn btn-sm btn-primary rounded-pill px-4"
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/dashboard/notifications');
                }}
              >
                <i className="bi bi-list me-1"></i>
                Voir toutes les notifications
                {notifications.length > 8 && (
                  <span className="badge bg-white text-primary ms-2">
                    +{notifications.length > 100 ? '99' : notifications.length - 8}
                  </span>
                )}
              </button>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;