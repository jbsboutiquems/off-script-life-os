import React, { useState } from 'react';
import { CORE_HOLIDAYS } from '../data/holidays';
import { ChaosHoliday } from '../types';
import { PartyPopper, ChevronDown } from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function HolidayCard({ holiday }: { holiday: ChaosHoliday }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">
            {MONTH_NAMES[holiday.month - 1]} {holiday.day}
          </div>
          <h3 className="text-lg font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-0.5">
            {holiday.title}
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 italic mt-0.5">{holiday.tagline}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold font-mono-code uppercase bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200 rounded-lg transition-colors"
        >
          {open ? 'Hide' : 'What even is this?'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-white/10 space-y-2 animate-fade-in">
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{holiday.meaning}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            <strong className="text-slate-700 dark:text-stone-200">Try it:</strong> {holiday.adventures[0]}
          </p>
        </div>
      )}
    </div>
  );
}

export const HolidaysView: React.FC = () => {
  const holidays = Object.values(CORE_HOLIDAYS).sort((a, b) => a.month - b.month || a.day - b.day);
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-500 text-stone-950 text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            UNOFFICIAL HOLIDAYS
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono-code">{holidays.length} DAYS WORTH CELEBRATING BADLY</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-1 flex items-center gap-2">
          The Holiday Vault <PartyPopper className="w-6 h-6 text-amber-500" />
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          Fourteen made-up holidays with real meaning. Tap "what even is this?" for the explainer — no greeting-card nonsense.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {holidays.map((h) => (
          <HolidayCard key={h.dateKey} holiday={h} />
        ))}
      </div>
    </div>
  );
};
