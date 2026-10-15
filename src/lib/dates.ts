/**
 * Device-local date keys (YYYY-MM-DD).
 *
 * NEVER derive a date key with `new Date().toISOString().split('T')[0]` —
 * toISOString() is UTC, so at 9 PM CDT the key is already tomorrow. That
 * shipped the Daily view a day ahead of Mission Control (fixed 2026-10-14).
 * Every date key in the app must come from here.
 */

/** Local YYYY-MM-DD key for a Date in the device's own timezone. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD key back into a local-midnight Date. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}
