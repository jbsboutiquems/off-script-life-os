import React, { useState } from 'react';
import { CHAOS_THEMES, ChaosMonthTheme } from '../data/themes';
import { Award, Compass, Sparkles, ChevronRight } from 'lucide-react';

export const ThemesGalleryView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const activeTheme: ChaosMonthTheme = CHAOS_THEMES.find(t => t.month === selectedMonth) || CHAOS_THEMES[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-2 border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-purple-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            ANNUAL CALENDAR
          </span>
          <span className="text-xs text-stone-500 font-mono-code">12 MONTHLY CHAOS THEMES</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
          12 Arc Themes of 2027
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Each month shifts the focal lens from structural reset to feral emergence, sovereign craft, and winter hibernation.
        </p>
      </div>

      {/* Month Selector Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {CHAOS_THEMES.map((theme) => (
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
            <div className="text-xs font-serif-display font-bold truncate">
              {theme.name}
            </div>
            <div className={`text-[11px] truncate mt-0.5 ${selectedMonth === theme.month ? 'text-purple-200' : 'text-stone-500'}`}>
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
