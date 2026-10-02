/** Consecutive-day logging streaks, computed from entry dates (self-healing). Pure — no DOM. */

function parseDay(s: string): number {
  // YYYY-MM-DD -> UTC midnight millis (DST-proof).
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function dayToStr(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY_MS = 24 * 3600 * 1000;

/**
 * Current streak: consecutive days with entries ending today — or ending
 * yesterday when today hasn't been logged yet (the streak is still alive).
 * A missed calendar day breaks it; back-filling the missed day restores it,
 * because this is computed from dates, not a counter.
 */
export function computeStreak(entryDates: string[], todayStr: string): number {
  const set = new Set(entryDates);
  let cursor = parseDay(todayStr);
  if (!set.has(dayToStr(cursor))) cursor -= DAY_MS; // today not logged yet — grace
  let n = 0;
  while (set.has(dayToStr(cursor))) {
    n += 1;
    cursor -= DAY_MS;
  }
  return n;
}

/** Playful, non-repetitive streak copy. Never shame, never doom. */
export function streakCopy(n: number): string {
  if (n <= 0) return 'No streak yet. Log today and the legend begins — every streak starts somewhere unimpressive.';
  if (n === 1) return '1 day of showing up. The streak is a newborn. Handle with care.';
  if (n === 2) return '2 days in a row. The streak is learning to walk.';
  if (n === 3) return '3 days of showing up. The streak is officially unhinged.';
  if (n < 7) return `${n} days straight. The streak has main-character energy now.`;
  if (n < 14) return `${n} days. A full week-ish of proof you can be consistent when you feel like it.`;
  if (n < 30) return `${n} days. The streak is feral and thriving.`;
  return `${n} days. The streak has tenure. Protect it like a good parking spot.`;
}
