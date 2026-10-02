/** Client-side export helpers: one-tap downloads, no Drive required. */
import type { DailyEntry } from '../types';

export function downloadFile(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Flatten daily entries to CSV — spreadsheet-friendly, human-readable. */
export function entriesToCsv(entries: DailyEntry[]): string {
  const header = [
    'entry_date', 'morning_intention', 'today_i_am', 'anchor_question_answer',
    'priority_1', 'priority_2', 'priority_3', 'midday_checkin',
    'micro_dare_completed', 'micro_dare_notes', 'evening_notes',
    'chaos_score', 'holiday_title', 'holiday_adventure',
  ];
  const rows = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const lines = [header.join(',')];
  for (const e of rows) {
    lines.push([
      e.entry_date, e.morning_intention, e.today_i_am, e.anchor_question_answer,
      e.priorities?.[0] ?? '', e.priorities?.[1] ?? '', e.priorities?.[2] ?? '',
      e.midday_checkin, e.micro_dare_completed ? 'yes' : 'no', e.micro_dare_notes ?? '',
      e.evening_notes, e.chaos_score ?? '', e.holiday_title ?? '', e.holiday_adventure ?? '',
    ].map(csvCell).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}
