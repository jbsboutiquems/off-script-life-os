import React, { useState, useEffect, useRef } from 'react';
import { Zap, Home, LogOut, Sun, Moon, User, Search, Inbox, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  username: string;
  pointsTotal: number;
  activeTab: string;
  darkMode: boolean;
  dueCount: number;
  unreadCount: number;
  toggleTheme: () => void;
  onDashboard: () => void;
  onOpenProfile: () => void;
  onOpenPoints: () => void;
  onOpenSearch: () => void;
  onOpenInbox: () => void;
  onOpenReminders: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  username, pointsTotal, activeTab, darkMode, dueCount, unreadCount,
  toggleTheme, onDashboard, onOpenProfile, onOpenPoints,
  onOpenSearch, onOpenInbox, onOpenReminders, onLogout
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const iconBtn = (active: boolean) =>
    `relative p-2 rounded-xl transition-colors ${
      active
        ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-stone-950 shadow-xs'
        : 'bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-white/20'
    }`;

  const badge = (n: number) =>
    n > 0 ? (
      <span className="absolute -top-1 -right-1 text-[9px] font-black font-mono-code bg-rose-600 text-white rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center">
        {n > 9 ? '9+' : n}
      </span>
    ) : null;

  return (
    <>
      {/* Brand tag */}
      <div className="bg-gradient-to-r from-rose-600 via-amber-500 to-teal-500 text-white text-center py-1.5 px-4">
        <p className="text-[10px] sm:text-[11px] font-mono-code font-bold uppercase tracking-[0.2em]">
          Ideation &gt; Optimization · Progress over Performance · Structure without the Cage
        </p>
      </div>

      {/* Slim top bar */}
      <header className="sticky top-0 z-40 bg-cream-canvas/95 dark:bg-[#000a15]/95 backdrop-blur-sm border-b-2 border-stone-800 dark:border-amber-400/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left: brand + dashboard */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center text-lg font-bold border-2 border-stone-800 dark:border-white/20 shadow-sm flex-shrink-0">
              ⚡
            </div>
            <button
              onClick={onDashboard}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono-code uppercase tracking-wider transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Dashboard
            </button>
          </div>

          {/* Right: search, bells, points, theme, user menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenSearch}
              className={iconBtn(activeTab === 'search')}
              title="Search your chaos"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenInbox}
              className={iconBtn(activeTab === 'inbox')}
              title="Inbox"
            >
              <Inbox className="w-4 h-4" />
              {badge(unreadCount)}
            </button>

            <button
              onClick={onOpenReminders}
              className={iconBtn(activeTab === 'reminders')}
              title="Reminders"
            >
              <Bell className="w-4 h-4" />
              {badge(dueCount)}
            </button>

            <button
              onClick={onOpenPoints}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold font-mono-code border border-amber-700/30 shadow-sm hover:from-amber-400 hover:to-orange-400 transition-all"
              title="Chaos Points & Sharing"
            >
              <Zap className="w-3.5 h-3.5" fill="currentColor" />
              <span>{pointsTotal}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-amber-300 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors"
              title={darkMode ? 'Switch to Cream Canvas' : 'Switch to Midnight Chaos'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User menu dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors text-xs font-bold font-mono-code max-w-[130px] sm:max-w-[180px]"
                title="Your menu"
              >
                <span className="truncate">{username || 'operator'}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-white/20 rounded-xl shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => { setMenuOpen(false); onOpenProfile(); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-t border-stone-200 dark:border-white/10"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile dashboard link row */}
        <div className="sm:hidden border-t border-stone-200 dark:border-white/10 px-3 py-1.5">
          <button
            onClick={onDashboard}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono-code uppercase tracking-wider ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-stone-950'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            <Home className="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </header>
    </>
  );
};
