import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Megaphone, Inbox, Sparkles, MapPin, Menu, X } from 'lucide-react';

export type FolderSection = 'daily' | 'wall' | 'dms' | 'mei' | 'field';

interface FolderTabsProps {
  activeSection: FolderSection;
  onSelect: (section: FolderSection) => void;
  unreadCount: number;
  /** Secondary views reachable from the hamburger menu. */
  menuItems: { id: string; label: string }[];
  activeMenuId: string | null;
  onSelectMenu: (id: string) => void;
  /** Optional trailing element (notification bell). */
  rightSlot?: React.ReactNode;
}

const FOLDERS: { id: FolderSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'daily', label: 'Daily', icon: BookOpen },
  { id: 'wall', label: 'Wall', icon: Megaphone },
  { id: 'dms', label: 'DMs', icon: Inbox },
  { id: 'mei', label: 'Mei', icon: Sparkles },
  { id: 'field', label: 'Field', icon: MapPin },
];

/**
 * Folder-divider navigation: the app's primary sections as physical
 * planner tabs. The active folder sits raised; the rest sit lower.
 * Secondary views live behind the hamburger menu.
 */
export const FolderTabs: React.FC<FolderTabsProps> = ({
  activeSection, onSelect, unreadCount, menuItems, activeMenuId, onSelectMenu, rightSlot,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <div className="border-b-2 border-stone-200 dark:border-white/10 bg-cream-canvas/80 dark:bg-transparent print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-end gap-1 pt-2 overflow-x-auto">
        {FOLDERS.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`relative flex items-center gap-1.5 px-4 sm:px-5 pt-2.5 rounded-t-2xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap
                ${active
                  ? 'pb-3 -mb-0.5 bg-gradient-to-b from-[#2da2ee] to-[#ea4798] text-white shadow-lg z-10'
                  : 'pb-2 bg-stone-200/70 dark:bg-white/5 text-stone-500 dark:text-stone-400 hover:bg-stone-300/70 dark:hover:bg-white/10 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'dms' && unreadCount > 0 && (
                <span className={`ml-0.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-black flex items-center justify-center ${active ? 'bg-white text-[#ea4798]' : 'bg-[#ea4798] text-white'}`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
        <div className="relative ml-auto pb-1.5 flex items-center gap-1" ref={menuRef}>
          {rightSlot}
          <button
            onClick={() => setMenuOpen(o => !o)}
            title="More sections"
            className={`p-2.5 rounded-xl transition-colors ${menuOpen || activeMenuId ? 'bg-stone-300 dark:bg-white/15 text-stone-800 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'}`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-2xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-[#0e1c30] shadow-2xl z-50 overflow-hidden">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onSelectMenu(item.id); setMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${activeMenuId === item.id ? 'bg-[#2da2ee]/15 text-[#2da2ee]' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
