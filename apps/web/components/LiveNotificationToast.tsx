'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare, Home, CheckCircle2, XCircle, Bell, X, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';
import { NotificationType } from '@sakany/shared';

function getPopupIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return <MessageSquare size={20} className="text-door" />;
    case NotificationType.NEW_APPLICATION:
      return <Home size={20} className="text-amber-600" />;
    case NotificationType.APPLICATION_ACCEPTED:
      return <CheckCircle2 size={20} className="text-emerald-600" />;
    case NotificationType.APPLICATION_REJECTED:
      return <XCircle size={20} className="text-rose-600" />;
    default:
      return <Bell size={20} className="text-door" />;
  }
}

export function LiveNotificationToast() {
  const router = useRouter();
  const { latestToast, dismissToast } = useNotifications();

  if (!latestToast) return null;

  const handleOpen = () => {
    const link = latestToast.link || '/messages';
    dismissToast();
    router.push(link);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
      <div className="flex items-start gap-3 rounded-2xl border border-sand/90 bg-white/95 backdrop-blur-md p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)] hover:shadow-2xl transition">
        {/* Icon Circle */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-door/10 shadow-2xs">
          {getPopupIcon(latestToast.type)}
        </div>

        {/* Message Info */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={handleOpen}>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-door animate-pulse" />
            <h4 className="text-xs font-bold text-ink truncate">{latestToast.title}</h4>
          </div>
          <p className="mt-1 text-xs text-ink-soft line-clamp-2 leading-relaxed">
            {latestToast.message}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-door hover:underline">
            <span>Consulter</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={dismissToast}
          className="shrink-0 rounded-full p-1 text-ink-soft hover:bg-sand/40 hover:text-ink transition"
          aria-label="Fermer la notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
