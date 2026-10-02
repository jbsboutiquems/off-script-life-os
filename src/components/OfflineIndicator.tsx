import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

/**
 * Subtle offline badge. Renders nothing while online;
 * when offline, a small fixed pill appears in the bottom-right
 * so it stays visible without blocking the main content.
 */
export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-stone-950 dark:bg-white text-amber-200 dark:text-amber-700 border border-amber-500/40 px-3.5 py-2 text-xs font-mono-code font-semibold shadow-2xl animate-fade-in print:hidden">
      <WifiOff className="w-4 h-4 text-amber-400 dark:text-amber-600 animate-pulse" />
      <span>Offline — cached mode</span>
    </div>
  );
};
