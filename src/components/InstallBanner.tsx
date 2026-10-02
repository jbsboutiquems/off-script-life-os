import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { Smartphone, Download, X } from 'lucide-react';

const DISMISS_KEY = 'offscript_pwa_banner_dismissed';

/**
 * Install banner for the browser PWA. Shows only when ALL of these hold:
 * - running in a normal browser (never inside the Capacitor native shell),
 * - the app is not already installed/standalone,
 * - the browser fired beforeinstallprompt (install is actually possible),
 * - the user hasn't dismissed it (dismissal persists in localStorage — no nagging).
 */
export const InstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, isNative, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {
      /* storage unavailable — treat as not dismissed */
    }
  }, []);

  if (isNative || isInstalled || dismissed || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* storage unavailable — dismissal lasts for this session only */
    }
  };

  return (
    <div className="bg-gradient-to-r from-rose-600 via-pink-500 to-teal-500 text-white px-4 py-3 shadow-md relative z-40 print:hidden animate-fade-in">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/30 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/pwa-192x192.png"
              alt="Off*Script"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs sm:text-sm tracking-tight truncate">
                {isAndroid ? 'Off*Script for Android' : 'Off*Script App'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold bg-white/20 text-white border border-white/30 uppercase whitespace-nowrap">
                {isAndroid ? 'Android PWA' : 'Installable'}
              </span>
            </div>
            <p className="text-[11px] text-white/85 truncate">
              Install to your home screen for full-screen mode and faster chaos.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleInstall}
            disabled={isInstalling}
            className="px-4 py-1.5 bg-white text-stone-900 hover:bg-white/90 rounded-xl text-xs font-bold font-mono-code transition-all shadow-sm active:scale-95 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer disabled:opacity-70"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isInstalling
                ? 'Installing...'
                : isAndroid
                  ? 'Add to Android'
                  : 'Install App'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Dismiss — we won't ask again"
            aria-label="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
