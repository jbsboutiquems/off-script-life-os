import { useEffect, useState } from 'react';
import type { ChaosTheme } from '../theme';

function readTheme(): ChaosTheme {
  if (typeof document === 'undefined') return 'dark';
  const cls = document.documentElement.classList;
  if (cls.contains('beast')) return 'beast';
  return cls.contains('dark') ? 'dark' : 'light';
}

/**
 * Tracks the active ChaosTheme (the `dark` / `beast` classes on <html>).
 * Observes the class so components re-render when the theme cycles.
 */
export function useTheme(): ChaosTheme {
  const [theme, setTheme] = useState<ChaosTheme>(readTheme);

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
 * Tracks whether Midnight Chaos (the `dark` class on <html>) is active.
 * Kept for call sites that only care about dark-vs-not.
 */
export function useDarkMode(): boolean {
  return useTheme() === 'dark';
}
