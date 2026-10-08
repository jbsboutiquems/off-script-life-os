export type KhaosTheme = 'light' | 'dark' | 'beast';

const STORAGE_KEY = 'lifeos_theme';

/** Cycle order for the header theme button: dark -> light -> beast -> dark. */
const THEME_ORDER: KhaosTheme[] = ['dark', 'light', 'beast'];

export const THEME_LABELS: Record<KhaosTheme, string> = {
  dark: 'Midnight Khaos',
  light: 'Daybreak',
  beast: 'Beast Mode',
};

export function getTheme(): KhaosTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'beast' || saved === 'gremlin') return 'beast';
    if (saved === 'dark' || saved === 'midnight') return 'dark';
    if (saved === 'light' || saved === 'cream') return 'light';
  } catch { /* ignore */ }
  return 'dark';
}

export function applyTheme(theme: KhaosTheme) {
  const el = document.documentElement;
  el.classList.toggle('dark', theme === 'dark');
  el.classList.toggle('beast', theme === 'beast');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch { /* ignore */ }
}

/** Advance to the next theme in the cycle and persist it. */
export function cycleTheme(): KhaosTheme {
  const current = getTheme();
  const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
  applyTheme(next);
  return next;
}

export function initTheme() {
  applyTheme(getTheme());
}
