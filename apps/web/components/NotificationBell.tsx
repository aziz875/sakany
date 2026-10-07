'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, Home, CheckCircle2, XCircle, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notification-context';
import { AppNotification, NotificationType } from '@sakany/shared';

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'À l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(dateString).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return <MessageSquare size={16} className="text-door" />;
    case NotificationType.NEW_APPLICATION:
      return <Home size={16} className="text-amber-600" />;
    case NotificationType.APPLICATION_ACCEPTED:
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    case NotificationType.APPLICATION_REJECTED:
      return <XCircle size={16} className="text-rose-600" />;
    default:
      return <Bell size={16} className="text-door" />;
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClickNotification = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sand/80 bg-white text-ink-soft transition hover:border-door hover:text-door hover:bg-door/5 focus:outline-none"
        aria-label={`Notifications (${unreadCount} non lues)`}
      >
        <Bell size={19} className="transition-transform active:scale-90" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-sand/70 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sand/60 px-4 py-3 bg-sand/10">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-door/10 px-2 py-0.5 text-xs font-semibold text-door">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-door hover:underline"
              >
                <Check size={12} />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-sand/40">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-ink-soft">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Aucune notification pour le moment</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleClickNotification(notification)}
                  className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-sand/20 ${
                    !notification.read ? 'bg-door/[0.04]' : ''
                  }`}
                >
                  {/* Icon Circle */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand/50 shadow-2xs mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          !notification.read ? 'text-ink font-bold' : 'text-ink-soft'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-ink-soft/70">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-ink-soft line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notification.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-door mt-2" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-sand/60 p-2 text-center bg-sand/10">
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-door hover:underline block py-1"
            >
              Accéder à la messagerie
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
