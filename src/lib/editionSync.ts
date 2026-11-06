/**
 * Edition sync: theme/scheme + missions/daily structure, Q4 2026 and January 2027.
 * Staged only — this lookup is not yet wired into Dashboard/DailyOSView, so it
 * changes nothing the user sees today. Wiring + deploy still need Amber's yes.
 *
 * Why this file exists: the app's month themes (KHAOS_THEMES) are 2027-flagship
 * only, with no year distinction. October 2026 therefore showed 2027 October
 * (RAW) instead of 2026 Q4 (Think), and January 2027 showed a sky-blue accent
 * instead of the January book's pink/teal/navy. YEAR_SCHEMES (src/lib/yearScheme.ts)
 * already carries the year palettes; this file adds the month-level sync on top:
 * which theme, which keyword, which colors, for a given YYYY-MM-DD date.
 *
 * Q4 daily content: the Q4 book's daily pages are largely image-based in the
 * 2026-10-24 PDF, so its 92 daily titles do NOT extract reliably from that file.
 * Q4 is therefore synced here at theme/scheme + missions-structure level only
 * (Think/Imagine/Do, hunter/pink/yellow, Launch/Orbit/Landing, Week-End Debrief
 * + Weekly Money Ledger after Sundays). No Q4 daily titles are invented here.
 * January 2027 daily content IS text-extractable and lives in
 * src/data/january2027Daily.ts, synced from v115.
 */

import { getYearScheme } from './yearScheme';
import { KHAOS_THEMES } from '../data/themes';

export interface EditionSyncTheme {
  date: string;
  year: number;
  month: number;
  monthName: string;
  themeTitle: string;
  keyword: string;
  colors: { primary: string; secondary: string; accent: string };
  editionLabel: string;
  note?: string;
}

const Q4_2026: Record<number, { themeTitle: string; keyword: string }> = {
  10: { themeTitle: 'Think', keyword: 'THINK' },
  11: { themeTitle: 'Imagine', keyword: 'IMAGINE' },
  12: { themeTitle: 'Do', keyword: 'DO' },
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Theme/scheme for a given YYYY-MM-DD date, Q4 2026 and January 2027 synced. */
export function getEditionThemeForDate(dateKey: string): EditionSyncTheme {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || '');
  const year = m ? Number(m[1]) : new Date().getFullYear();
  const month = m ? Number(m[2]) : new Date().getMonth() + 1;
  const scheme = getYearScheme(year);

  if (year === 2026 && Q4_2026[month]) {
    return {
      date: dateKey, year, month,
      monthName: MONTH_NAMES[month],
      themeTitle: Q4_2026[month].themeTitle,
      keyword: Q4_2026[month].keyword,
      colors: scheme.colors,
      editionLabel: '2026 • Q4',
      note: 'Be is the culmination. Q4 is the funnel to the 2027 flagship.',
    };
  }

  if (year === 2027 && month === 1) {
    return {
      date: dateKey, year, month,
      monthName: 'January',
      themeTitle: 'The Khaos of Beginning',
      keyword: 'UNRAVEL',
      colors: { primary: '#EA4798', secondary: '#007D7A', accent: '#03224F' },
      editionLabel: '2027 • January • UNRAVEL',
      note: 'January 2027 book v115: pink/teal/navy. Daily holidays in january2027Daily.ts.',
    };
  }

  const fallback = KHAOS_THEMES.find((t) => t.month === month);
  return {
    date: dateKey, year, month,
    monthName: MONTH_NAMES[month] || '',
    themeTitle: fallback?.themeTitle ?? '',
    keyword: fallback?.keyword ?? '',
    colors: scheme.colors,
    editionLabel: scheme.label,
  };
}

/** Missions/daily structure shared by Q4 and January: same reality, book = deep work, app = reminder layer. */
export const DAILY_MISSION_STRUCTURE = {
  launch: 'Morning intention',
  orbit: 'Midday check-in',
  landing: 'Evening notes',
  khaosScore: 'Khaos score /10',
  weekly: 'Week-End Debrief + Weekly Money Ledger after Sundays (Date / What / In / Out / Balance, 20 rows, carry balance forward)',
} as const;
