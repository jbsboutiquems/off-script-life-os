import { useEffect, useState } from 'react';
import type { KhaosTheme } from '../theme';

function readTheme(): KhaosTheme {
  if (typeof document === 'undefined') return 'dark';
  const cls = document.documentElement.classList;
  if (cls.contains('beast')) return 'beast';
  return cls.contains('dark') ? 'dark' : 'light';
}

/**
 * Tracks the active KhaosTheme (the `dark` / `beast` classes on <html>).
 * Observes the class so components re-render when the theme cycles.
 */
export function useTheme(): KhaosTheme {
  const [theme, setTheme] = useState<KhaosTheme>(readTheme);

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setTheme(readTheme());
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

/**
 * Tracks whether Midnight Khaos (the `dark` class on <html>) is active.
 * Kept for call sites that only care about dark-vs-not.
 */
export function useDarkMode(): boolean {
  return useTheme() === 'dark';
}
