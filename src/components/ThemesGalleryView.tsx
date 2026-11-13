import React, { useState } from 'react';
import { KHAOS_THEMES, KhaosMonthTheme } from '../data/themes';
import { getYearScheme } from '../lib/yearScheme';
import { Award, Compass, Sparkles, ChevronRight } from 'lucide-react';

export const ThemesGalleryView: React.FC = () => {
  // Year-aware (2026-11-01): the month-theme cards below are the 2027
  // flagship set and must not be presented as 2026's. Selecting 2026 shows
  // the Q4 scheme (hunter/pink/yellow) with Think/Imagine/Do; 2028 shows
  // its navy/gold/cosmic scheme with monthly themes still to be defined.
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const scheme = getYearScheme(selectedYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const activeTheme: KhaosMonthTheme = KHAOS_THEMES.find(t => t.month === selectedMonth) || KHAOS_THEMES[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-2 border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-purple-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            ANNUAL CALENDAR
          </span>
          <span className="text-xs text-stone-500 font-mono-code">12 MONTHLY KHAOS THEMES</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
          {selectedYear === 2027 ? '12 Arc Themes of 2027' : `${scheme.label} — year scheme`}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          {selectedYear === 2027
            ? 'Each month shifts the focal lens from structural reset to feral emergence, sovereign craft, and winter hibernation.'
            : 'Month themes follow the year, not just the month. October 2026 is not 2027 October — it is Q4 Think, in hunter/pink/yellow.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[2026, 2027, 2028].map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedYear === y ? 'bg-slate-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
              {y}
            </button>
          ))}
          <span className="ml-1 inline-flex items-center gap-2 text-xs font-bold text-stone-700">
            <span className="inline-flex gap-1">
              <span className="w-4 h-4 rounded-full border border-black/10 inline-block" style={{ background: scheme.colors.primary }} />
              <span className="w-4 h-4 rounded-full border border-black/10 inline-block" style={{ background: scheme.colors.secondary }} />
              <span className="w-4 h-4 rounded-full border border-black/10 inline-block" style={{ background: scheme.colors.accent }} />
            </span>
            {scheme.label} · {scheme.paletteLabel}
          </span>
        </div>
        {scheme.months && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {scheme.months.map((m) => (
              <div key={m.month} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="text-[10px] font-mono-code font-bold uppercase text-stone-500">{m.name}</div>
                <div className="text-sm font-bold font-serif-display">{m.themeTitle} <span className="text-xs text-stone-500 font-mono-code">· {m.keyword}</span></div>
              </div>
            ))}
          </div>
        )}
        {scheme.note && <p className="text-xs text-stone-500 italic mt-2">{scheme.note}</p>}
        {selectedYear !== 2027 && (
          <p className="text-xs text-stone-500 mt-2">
            The 12 month cards below are the 2027 flagship set, shown for reference — they are not {selectedYear}'s themes.
          </p>
        )}
      </div>

      {/* Month Selector Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {KHAOS_THEMES.map((theme) => (
          <button
            key={theme.month}
            onClick={() => setSelectedMonth(theme.month)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedMonth === theme.month
                ? 'bg-purple-900 text-white border-purple-950 shadow-md font-bold'
                : 'bg-white text-stone-700 border-stone-200 hover:border-purple-300 hover:bg-purple-50/40'
            }`}
          >
            <div className="text-[10px] font-mono-code uppercase opacity-75">
              Month {String(theme.month).padStart(2, '0')}
            </div>
            <div className="text-xs font-serif-display font-bold leading-snug">
              {theme.name}
            </div>
            {/* Full theme title: previously `truncate` cut every non-selected
                card to "The Khaos of Longing / I…" — the titles wrap now. */}
            <div className={`text-[11px] leading-snug mt-0.5 ${selectedMonth === theme.month ? 'text-purple-200' : 'text-stone-500'}`}>
              {theme.themeTitle}
            </div>
          </button>
        ))}
      </div>

      {/* Deep-Dive Theme Focus Card */}
      <div className="bg-[#fffdf9] rounded-2xl border-2 border-purple-300 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono-code font-bold ${activeTheme.badgeBg} ${activeTheme.badgeText} px-2 py-0.5 rounded`}>
                MONTH {activeTheme.month} · {activeTheme.name.toUpperCase()} · KEYWORD: {activeTheme.keyword}
              </span>
              <span className="text-xs text-stone-400 font-mono-code">2027 LIFE OS</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
              "{activeTheme.themeTitle}"
            </h3>
            <p className="text-sm font-semibold text-purple-900 italic mt-0.5 font-serif-display">
              "{activeTheme.tagline}"
            </p>
          </div>
        </div>

        {/* Narrative & Core Question */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <h4 className="font-display-punch text-xs uppercase font-bold text-slate-900">
              The Monthly Arc Description
            </h4>
            <p className="text-stone-700 leading-relaxed bg-white p-4 rounded-xl border border-stone-200 text-sm">
              {activeTheme.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <span className="text-[10px] uppercase font-mono-code font-bold text-amber-800 block mb-0.5">
                Monthly Guiding Question:
              </span>
              <p className="text-sm font-bold text-amber-950 font-serif-display">
                "{activeTheme.monthlyQuestion}"
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-mono-code font-bold text-purple-800 block mb-1">
                Life OS Monthly Stance:
              </span>
              <p className="text-xs text-purple-950 font-medium">
                Hold this theme as a loose filter for your Daily Launch intentions and Weekly Debrief reflections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
