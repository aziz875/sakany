'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { AppNotification } from '@sakany/shared';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  latestToast: AppNotification | null;
  dismissToast: () => void;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  latestToast: null,
  dismissToast: () => {},
  markAllAsRead: async () => {},
  markAsRead: async () => {},
  refreshNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);

  const knownIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const consecutiveFailures = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!token || isFetchingRef.current) return;
    // Don't poll when the page is in the background
    if (typeof document !== 'undefined' && document.hidden) return;
    // Stop polling after 3 consecutive auth failures
    if (consecutiveFailures.current >= 3) return;

    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        consecutiveFailures.current += 1;
        return;
      }
      consecutiveFailures.current = 0;
      const data = await res.json();
      const list: AppNotification[] = data.notifications || [];
      const unread: number = data.unreadCount || 0;

      setNotifications(list);
      setUnreadCount(unread);

      if (!initialLoadDone.current) {
        list.forEach((n) => knownIds.current.add(n.id));
        initialLoadDone.current = true;
      } else {
        // Detect newly arrived unread notifications
        const incoming = list.filter((n) => !n.read && !knownIds.current.has(n.id));
        if (incoming.length > 0) {
          const newest = incoming[0];
          incoming.forEach((n) => knownIds.current.add(n.id));

          setLatestToast(newest);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => {
            setLatestToast(null);
          }, 7000);
        }
      }
    } catch {
      // Ignore background network errors
    } finally {
      isFetchingRef.current = false;
    }
  }, [token]);

  useEffect(() => {
    if (!user || !token) {
      setNotifications([]);
      setUnreadCount(0);
      setLatestToast(null);
      knownIds.current.clear();
      initialLoadDone.current = false;
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Smart polling: every 30 seconds only when tab is visible
    const interval = setInterval(fetchNotifications, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [user, token, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notificationId: id }),
    }).catch(() => {});
  };

  const dismissToast = () => {
    setLatestToast(null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        latestToast,
        dismissToast,
        markAllAsRead,
        markAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
