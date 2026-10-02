export type ChaosTheme = 'cream' | 'midnight';

const STORAGE_KEY = 'lifeos_theme';

export function getTheme(): ChaosTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'midnight' || saved === 'cream') return saved;
  } catch { /* ignore */ }
  return 'cream';
}

export function applyTheme(theme: ChaosTheme) {
  const isDark = theme === 'midnight';
  document.documentElement.classList.toggle('dark', isDark);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch { /* ignore */ }
}

export function toggleTheme(): ChaosTheme {
  const next: ChaosTheme = getTheme() === 'midnight' ? 'cream' : 'midnight';
  applyTheme(next);
  return next;
}

export function initTheme() {
  applyTheme(getTheme());
}
