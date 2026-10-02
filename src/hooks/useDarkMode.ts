import { useEffect, useState } from 'react';

/**
 * Tracks whether Midnight Chaos (the `dark` class on <html>) is active.
 * Observes the class so components re-render when the theme toggles.
 */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
