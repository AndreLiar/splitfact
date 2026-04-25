'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, revalidateNotifications } from '@/app/hooks/useApi';
import type { Notification } from '@/app/hooks/useApi';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();

  const { notifications, isLoading: loading } = useNotifications(filter === 'unread');

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      await revalidateNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      await revalidateNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      await revalidateNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Get notification icon and color
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'INVOICE_BLOCKED': return 'bi-exclamation-octagon';
      case 'COMPLIANCE_ALERT': return 'bi-shield-exclamation';
      case 'PAYMENT_REMINDER': return 'bi-credit-card';
      default: return 'bi-info-circle';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'INVOICE_BLOCKED': return 'text-danger';
      case 'COMPLIANCE_ALERT': return 'text-warning';
      case 'PAYMENT_REMINDER': return 'text-primary';
      default: return 'text-info';
    }
  };

  const getBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'INVOICE_BLOCKED': return 'bg-danger';
      case 'COMPLIANCE_ALERT': return 'bg-warning';
      case 'PAYMENT_REMINDER': return 'bg-primary';
      default: return 'bg-info';
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'INVOICE_BLOCKED': return 'Bloquée';
      case 'COMPLIANCE_ALERT': return 'Conformité';
      case 'PAYMENT_REMINDER': return 'Paiement';
      case 'GENERAL': return 'Général';
      default: return 'Info';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="main-container">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">
            <i className="bi bi-bell me-2"></i>
            Notifications
          </h1>
          <p className="text-muted mb-0">
            {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Toutes les notifications sont lues'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            className="btn btn-outline-primary"
            onClick={markAllAsRead}
          >
            <i className="bi bi-check-all me-1"></i>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="card shadow-subtle mb-4">
        <div className="card-body p-2">
          <div className="btn-group w-100" role="group">
            <input
              type="radio"
              className="btn-check"
              name="filter"
              id="all"
              checked={filter === 'all'}
              onChange={() => setFilter('all')}
            />
            <label className="btn btn-outline-primary" htmlFor="all">
              <i className="bi bi-list me-1"></i>
              Toutes ({notifications.length})
            </label>

            <input
              type="radio"
              className="btn-check"
              name="filter"
              id="unread"
              checked={filter === 'unread'}
              onChange={() => setFilter('unread')}
            />
            <label className="btn btn-outline-primary" htmlFor="unread">
              <i className="bi bi-dot me-1"></i>
              Non lues ({unreadCount})
            </label>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card shadow-subtle">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-3 text-muted">Chargement des notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash display-1 text-muted mb-3"></i>
              <h5 className="text-muted">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h5>
              <p className="text-muted">
                {filter === 'unread' 
                  ? 'Toutes vos notifications ont été lues' 
                  : 'Vous recevrez ici les alertes de conformité et de facturation'}
              </p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`list-group-item list-group-item-action position-relative ${
                    !notification.isRead ? 'bg-light border-start border-primary border-3' : ''
                  }`}
                >
                  <div className="d-flex align-items-start">
                    {/* Icon */}
                    <div className={`me-3 ${getNotificationColor(notification.type)}`}>
                      <i className={`${getNotificationIcon(notification.type)} fs-4`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className={`mb-0 ${!notification.isRead ? 'fw-bold' : ''}`}>
                          {notification.title}
                        </h6>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${getBadgeColor(notification.type)} text-white`}>
                            {getTypeLabel(notification.type)}
                          </span>
                          {!notification.isRead && (
                            <span className="badge bg-primary">Nouveau</span>
                          )}
                        </div>
                      </div>
                      
                      <p className="mb-2 text-muted">
                        {notification.message}
                      </p>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {formatDate(notification.createdAt)}
                          {notification.isRead && notification.readAt && (
                            <span className="ms-2">
                              • Lu le {formatDate(notification.readAt)}
                            </span>
                          )}
                        </small>
                        
                        <div className="btn-group btn-group-sm">
                          {!notification.isRead && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              title="Marquer comme lu"
                            >
                              <i className="bi bi-check"></i>
                            </button>
                          )}
                          {notification.actionUrl && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleNotificationClick(notification)}
                              title="Voir les détails"
                            >
                              <i className="bi bi-arrow-right"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
                                deleteNotification(notification.id);
                              }
                            }}
                            title="Supprimer"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}