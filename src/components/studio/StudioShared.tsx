// Shared bits for the AI Studio tabs — pink-teal Off*Script styling, error and
// "not configured" states. No Google calls here; only our /api/studio/* endpoints.
import React from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';

export const TEAL = '#2da2ee';
export const PINK = '#ea4798';

export function StudioSectionTitle({ icon, title, blurb }: { icon: React.ReactNode; title: string; blurb: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${TEAL}, ${PINK})` }}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{blurb}</p>
      </div>
    </div>
  );
}

export function StudioError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
      {message}
    </div>
  );
}

export function StudioNotConfiguredCard({ detail }: { detail?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3">
      <div
        className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${TEAL}, ${PINK})` }}
      >
        <SlidersHorizontal size={22} />
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white">The studio is still backstage</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {detail || 'AI Studio needs a Gemini API key on the server before it can make noise. Ask whoever runs this server to set GEMINI_API_KEY — nothing here is broken, it just isn\u2019t switched on.'}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Your Off*Script features keep working. This is a private backstage tool, not a broken feature.
      </p>
    </div>
  );
}

export function StudioGenerateButton({
  onClick,
  busy,
  busyLabel,
  label,
  icon
}: {
  onClick: () => void;
  busy: boolean;
  busyLabel: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow disabled:opacity-60 disabled:cursor-wait"
      style={{ background: `linear-gradient(135deg, ${TEAL}, ${PINK})` }}
    >
      {busy ? (
        <>
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          {busyLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}

export function PromptTextarea({
  value,
  onChange,
  placeholder,
  rows = 3
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2"
      style={{ ['--tw-ring-color' as string]: TEAL }}
    />
  );
}

export function StudioHeader() {
  return (
    <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, #0b2536, #123)` }}>
      <div className="absolute -right-6 -top-10 w-48 h-48 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${PINK}, transparent 70%)` }} />
      <div className="absolute -left-8 -bottom-12 w-56 h-56 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${TEAL}, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase" style={{ color: PINK }}>
          <Sparkles size={14} /> Off*Script AI Studio
        </div>
        <h2 className="text-2xl font-black mt-1">Make some beautiful noise</h2>
        <p className="text-sm text-slate-300 mt-1 max-w-xl">
          Compose tracks, conjure images, render video, and transcribe voice notes — a private backstage
          for your chaos. Everything stays inside your Life OS.
        </p>
      </div>
    </div>
  );
}
