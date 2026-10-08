import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, Heart, Inbox, Users } from 'lucide-react';
import { api } from '../services/api';

interface NotificationItem {
  id: string;
  kind: string;
  text: string;
  refId: string | null;
  created_at: string;
  read: boolean;
}

const KIND_ICON: Record<string, React.ReactNode> = {
  reply: <MessageCircle className="w-4 h-4 text-[#2da2ee]" />,
  reaction: <Heart className="w-4 h-4 text-[#ea4798]" />,
  dm: <Inbox className="w-4 h-4 text-amber-500" />,
  room: <Users className="w-4 h-4 text-emerald-500" />,
};

function relativeTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * In-app notification bell: replies, reactions, DMs, room activity.
 * Polls every 30s; opening the tray marks everything read.
 */
export const NotificationBell: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const { items, unread } = await api.getNotifications();
      setItems(items);
      setUnread(unread);
    } catch { /* ignore — offline or logged out */ }
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open ]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await api.markNotificationsRead();
        setUnread(0);
        setItems(prev => prev.map(i => ({ ...i, read: true })));
      } catch { /* ignore */ }
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        title="Notifications"
        className={`p-2.5 rounded-xl transition-colors relative ${open ? 'bg-stone-300 dark:bg-white/15' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ea4798] text-white text-[10px] font-black flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-80 max-w-[90vw] rounded-2xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-[#0e1c30] shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-100 dark:border-white/5 font-black text-sm uppercase tracking-wider">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-sm text-stone-400 text-center italic">Nothing yet. Go make some noise.</p>
            )}
            {items.map(n => (
              <div key={n.id} className={`flex items-start gap-2.5 px-4 py-3 border-b border-stone-50 dark:border-white/5 last:border-0 ${n.read ? 'opacity-60' : ''}`}>
                <span className="mt-0.5 shrink-0">{KIND_ICON[n.kind] || KIND_ICON.reply}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{n.text}</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{relativeTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
