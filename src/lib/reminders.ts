/**
 * Reminder due-computation. Pure (no DOM) — imported by both the client
 * and server.ts, so the logic can't drift between them.
 *
 * Caveat: the server computes due-ness on the server's clock/timezone.
 * For a self-hosted prototype that clock is usually the deployer's machine.
 * True push notifications need a deployer's push setup — this is in-app only.
 */

export interface ReminderSettings {
  dailyEnabled: boolean;
  /** "HH:MM" 24-hour local time */
  dailyTime: string;
  weeklyEnabled: boolean;
  /** 0 = Sunday … 6 = Saturday */
  weeklyDay: number;
  /** "HH:MM" 24-hour local time */
  weeklyTime: string;
}

export interface DueReminder {
  id: string;
  kind: 'daily_log' | 'weekly_debrief';
  title: string;
  detail: string;
}

export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO-8601 week number (1–53) for a date. */
export function isoWeekNumber(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (t.getUTCDay() + 6) % 7; // Monday = 0
  t.setUTCDate(t.getUTCDate() - dayNum + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const fDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fDayNum + 3);
  return 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

/** "HH:MM" -> minutes since midnight, or null when malformed. */
export function timeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Which reminders are due right now.
 * - Daily log: due when enabled, the nudge time has passed today, and no
 *   entry exists for today.
 * - Weekly debrief: due when enabled, the nudge day/time has passed this
 *   week, and no debrief exists for the current ISO week.
 */
export function computeDueReminders(
  settings: ReminderSettings,
  entryDates: string[],
  debriefWeekNumbers: number[],
  now: Date
): DueReminder[] {
  const due: DueReminder[] = [];
  const entries = new Set(entryDates);
  const today = localDateStr(now);
  const mins = nowMinutes(now);

  if (settings.dailyEnabled) {
    const at = timeToMinutes(settings.dailyTime);
    if (at !== null && mins >= at && !entries.has(today)) {
      due.push({
        id: 'daily_log',
        kind: 'daily_log',
        title: "Today's flight log is still on the runway",
        detail: `Your nudge was set for ${settings.dailyTime}. Five honest minutes — launch, orbit, landing.`,
      });
    }
  }

  if (settings.weeklyEnabled) {
    const at = timeToMinutes(settings.weeklyTime);
    const dow = now.getDay();
    const dayReached = dow > settings.weeklyDay || (dow === settings.weeklyDay && at !== null && mins >= at);
    const week = isoWeekNumber(now);
    if (at !== null && dayReached && !debriefWeekNumbers.includes(week)) {
      due.push({
        id: 'weekly_debrief',
        kind: 'weekly_debrief',
        title: 'Weekly debrief is waiting for its close-up',
        detail: `Week ${week} hasn't been debriefed yet. Eight questions, zero performance-review energy.`,
      });
    }
  }

  return due;
}
