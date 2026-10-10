/**
 * Native local notifications for reminders (2026-10-10).
 * Reminders were previously evaluated only while the app was open —
 * on a phone that means they never fire. This schedules them on-device
 * via @capacitor/local-notifications. No server push needed.
 * Best-effort: failures never block the app.
 */
import { Capacitor } from '@capacitor/core';

export interface NativeReminderSettings {
  dailyEnabled: boolean;
  dailyTime: string; // "HH:MM"
  weeklyEnabled: boolean;
  weeklyDay: number; // 0 = Sunday … 6 = Saturday
  weeklyTime: string; // "HH:MM"
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = String(t || '20:00').split(':').map(Number);
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 20,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

export async function syncNativeReminders(settings: NativeReminderSettings): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    // Clear anything we scheduled before, then re-schedule from settings.
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      }).catch(() => {});
    }

    const notifications: any[] = [];
    if (settings.dailyEnabled) {
      const { hour, minute } = parseTime(settings.dailyTime);
      notifications.push({
        id: 1001,
        title: 'Daily Flight Log ✈️',
        body: 'Time to log today — intention, stance, and the rant box are waiting.',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
        smallIcon: 'ic_launcher',
      });
    }
    if (settings.weeklyEnabled) {
      const { hour, minute } = parseTime(settings.weeklyTime);
      notifications.push({
        id: 1002,
        title: 'Weekly Flight Debrief 📋',
        body: 'Your weekly debrief is due — 8 questions, zero toxic positivity.',
        // Capacitor weekday: 1 = Sunday … 7 = Saturday
        schedule: { on: { weekday: settings.weeklyDay + 1, hour, minute }, allowWhileIdle: true },
        smallIcon: 'ic_launcher',
      });
    }
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
    /* notifications are best-effort; never break the app */
  }
}
