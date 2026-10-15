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
  { id: 'mei', label: 'Intent', icon: Sparkles },
  { id: 'field', label: 'Field', icon: MapPin },
];

/**
 * Hamburger menu groups (approved 2026-10-12). Menu items are assigned to
 * a section by id; anything unlisted falls into MORE so a new view can
 * never silently vanish from the menu. Admin always renders last.
 */
const MENU_SECTIONS: { title: string; ids: string[] }[] = [
  { title: 'Your Day', ids: ['reminders'] },
  { title: 'Your Stuff', ids: ['backup', 'frontmatter'] },
  { title: 'Get More', ids: ['studio', 'expansions', 'unlock'] },
  { title: 'People & Help', ids: ['crew', 'faq'] },
  { title: 'Admin', ids: ['admin'] },
];

/**
 * Folder-divider navigation: the app's primary sections as physical
 * planner tabs. The active folder sits raised; the rest sit lower.
 * Secondary views live behind the hamburger menu.
 *
 * Tab strip: horizontally scrollable with the active tab scrolled into
 * view, so first/last tabs are never clipped at the screen edge on
 * narrow phones (fixed 2026-10-14).
 */
export const FolderTabs: React.FC<FolderTabsProps> = ({
  activeSection, onSelect, unreadCount, menuItems, activeMenuId, onSelectMenu, rightSlot,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<FolderSection, HTMLButtonElement | null>>>({});

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menuOpen]);

  // Keep the active tab visible: scroll it into the strip instead of
  // letting it sit clipped behind the fade cue at the screen edge.
  useEffect(() => {
    tabRefs.current[activeSection]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeSection]);

  const groupedIds = new Set(MENU_SECTIONS.flatMap((s) => s.ids));
  const ungrouped = menuItems.filter((m) => !groupedIds.has(m.id));

  const renderMenuItem = (item: { id: string; label: string }) => (
    <button
      key={item.id}
      onClick={() => { onSelectMenu(item.id); setMenuOpen(false); }}
      className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${activeMenuId === item.id ? 'bg-[#2da2ee]/15 text-[#2da2ee]' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5'}`}
    >
      {item.label}
    </button>
  );

  return (
    <div className="border-b-2 border-stone-200 dark:border-white/10 bg-cream-canvas/80 dark:bg-transparent print:hidden">
      <div className="relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-end gap-1 pt-2 overflow-x-auto scroll-smooth scroll-px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FOLDERS.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              ref={(el) => { tabRefs.current[id] = el; }}
              onClick={() => onSelect(id)}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 sm:px-5 pt-2.5 rounded-t-2xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap
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
        <div className="relative ml-auto pb-1.5 flex shrink-0 items-center gap-1" ref={menuRef}>
          {rightSlot}
          <button
            onClick={() => setMenuOpen(o => !o)}
            title="More sections"
            aria-label="More sections"
            aria-expanded={menuOpen}
            className={`p-2.5 rounded-xl transition-colors ${menuOpen || activeMenuId ? 'bg-stone-300 dark:bg-white/15 text-stone-800 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'}`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-60 max-h-[70vh] overflow-y-auto rounded-2xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-[#0e1c30] shadow-2xl z-50">
              {MENU_SECTIONS.map((section) => {
                const items = section.ids
                  .map((id) => menuItems.find((m) => m.id === id))
                  .filter((m): m is { id: string; label: string } => !!m);
                if (items.length === 0) return null;
                return (
                  <div key={section.title} className="py-1 border-b border-stone-100 dark:border-white/5 last:border-b-0">
                    <div className="px-4 pt-2 pb-1 text-[10px] font-black font-mono-code uppercase tracking-widest text-stone-400 dark:text-stone-500">
                      {section.title}
                    </div>
                    {items.map(renderMenuItem)}
                  </div>
                );
              })}
              {ungrouped.length > 0 && (
                <div className="py-1 border-b border-stone-100 dark:border-white/5 last:border-b-0">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-black font-mono-code uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    More
                  </div>
                  {ungrouped.map(renderMenuItem)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Fade cue: the strip scrolls on narrow phones — this signals there's more */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-cream-canvas dark:from-[#000a15] to-transparent" />
      </div>
    </div>
  );
};
