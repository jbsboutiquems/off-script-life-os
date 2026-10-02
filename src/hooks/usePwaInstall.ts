import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/** Chromium's install prompt event (not in TS DOM lib). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // Inside the Capacitor native shell an install prompt is meaningless — consumers stay hidden there.
  const [isNative] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    // Detect standalone display mode (already installed / launched from home screen).
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect platform from user agent.
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(userAgent));
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /** Fires the captured install prompt. Resolves true when the user accepts. */
  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    /** True once Chromium has fired beforeinstallprompt (browser deems the app installable). */
    isInstallable: !!deferredPrompt,
    /** True when running in standalone/installed mode. */
    isInstalled,
    isAndroid,
    isIOS,
    /** True inside the Capacitor native wrapper — install UI must stay hidden. */
    isNative,
    install,
    promptEvent: deferredPrompt,
  };
}
