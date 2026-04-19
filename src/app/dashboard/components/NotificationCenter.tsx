'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const isActive = pathname === '/dashboard/notifications';

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true&limit=1', {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount ?? data.notifications?.length ?? 0);
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      className={className}
      aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ''}`}
      style={{
        position: 'relative',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: isActive
          ? '1px solid rgba(212,146,26,0.3)'
          : '1px solid rgba(255,255,255,0.09)',
        backgroundColor: isActive
          ? 'rgba(212,146,26,0.10)'
          : 'rgba(255,255,255,0.04)',
        color: isActive ? '#F0AE38' : '#d0d6e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        transition: 'all 150ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement;
          el.style.backgroundColor = 'rgba(255,255,255,0.08)';
          el.style.borderColor = 'rgba(255,255,255,0.14)';
          el.style.color = '#f7f8f8';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement;
          el.style.backgroundColor = 'rgba(255,255,255,0.04)';
          el.style.borderColor = 'rgba(255,255,255,0.09)';
          el.style.color = '#d0d6e0';
        }
      }}
    >
      <i
        className={`bi bi-bell${unreadCount > 0 ? '-fill' : ''}`}
        style={{ fontSize: '1rem', lineHeight: 1 }}
      />
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '16px',
            height: '16px',
            borderRadius: '9999px',
            backgroundColor: '#e05252',
            border: '1.5px solid #08090a',
            fontSize: '0.625rem',
            fontWeight: 590,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationCenter;
