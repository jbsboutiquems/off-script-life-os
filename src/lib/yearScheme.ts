/**
 * Year-aware color schemes (Amber, 2026-10-29).
 *
 * The app's month themes are 2027 flagship themes (KHAOS_THEMES in
 * src/data/themes.ts) — they must NOT be changed. The bug was that the app
 * applied those month themes with no year distinction, so October 2026
 * showed the 2027 October (RAW) look instead of the 2026 Q4 look.
 *
 * This layer is separate from the month themes: it answers "what year are
 * we in, and what is that year's scheme?" — 2026 Q4 = hunter/pink/yellow,
 * 2027 = pink/teal Khaos, 2028 = navy/gold/cosmic. It does not retheme every
 * component (that global CSS retheme is still open); it surfaces the scheme
 * on the Dashboard and in the Themes gallery, and gives the gallery a
 * year selector so 2026 Q4 shows Think/Imagine/Do instead of 2027's set.
 */

export interface YearScheme {
  year: number;
  label: string;
  /** Short human-readable palette, e.g. "Hunter / Pink / Yellow". */
  paletteLabel: string;
  colors: { primary: string; secondary: string; accent: string };
  /** 2026 Q4 months only; 2027 is a full year; 2028 monthly themes TBD. */
  months?: { month: number; name: string; themeTitle: string; keyword: string }[];
  note?: string;
}

export const YEAR_SCHEMES: Record<number, YearScheme> = {
  2026: {
    year: 2026,
    label: '2026 • Q4',
    paletteLabel: 'Hunter / Pink / Yellow',
    colors: { primary: '#355E3B', secondary: '#EA4798', accent: '#F59E0B' },
    months: [
      { month: 10, name: 'October', themeTitle: 'Think', keyword: 'THINK' },
      { month: 11, name: 'November', themeTitle: 'Imagine', keyword: 'IMAGINE' },
      { month: 12, name: 'December', themeTitle: 'Do', keyword: 'DO' },
    ],
    note: 'Be is the culmination. Q4 is the funnel to the 2027 flagship.',
  },
  2027: {
    year: 2027,
    label: '2027 • Khaos',
    paletteLabel: 'Pink / Teal Khaos',
    colors: { primary: '#EA4798', secondary: '#007D7A', accent: '#03224F' },
  },
  2028: {
    year: 2028,
    label: '2028 • Zodiac',
    paletteLabel: 'Navy / Gold / Cosmic',
    colors: { primary: '#03224F', secondary: '#D4AF37', accent: '#1E1B4B' },
    note: 'Zodiac year. Monthly themes are not yet defined — scheme only.',
  },
};

/** Years with a defined scheme. Unknown years fall back to the nearest defined year. */
export function getYearScheme(year: number): YearScheme {
  if (YEAR_SCHEMES[year]) return YEAR_SCHEMES[year];
  if (year < 2026) return YEAR_SCHEMES[2026];
  if (year > 2028) return YEAR_SCHEMES[2028];
  return YEAR_SCHEMES[2027];
}

export function getYearSchemeForDate(dateKey: string): YearScheme {
  const m = /^(\d{4})-/.exec(dateKey || '');
  return getYearScheme(m ? Number(m[1]) : new Date().getFullYear());
}
