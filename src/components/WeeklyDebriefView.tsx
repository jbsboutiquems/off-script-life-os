import React, { useState } from 'react';
import { WeeklyFlightDebrief } from '../types';
import { BookOpen, Save, Flame, Compass, Printer } from 'lucide-react';

interface WeeklyDebriefViewProps {
  onSaveDebrief?: (debrief: WeeklyFlightDebrief) => void;
  initialWeek?: number;
}

export const WeeklyDebriefView: React.FC<WeeklyDebriefViewProps> = ({
  onSaveDebrief,
  initialWeek = 1
}) => {
  const [weekNumber, setWeekNumber] = useState(initialWeek);
  const [khaosLevel, setKhaosLevel] = useState(6);
  const [q1, setQ1] = useState("Felt pressure to follow a rigid routine that collapsed by Wednesday.");
  const [q2, setQ2] = useState("Admitting I didn't want to attend the group planning call.");
  const [q3, setQ3] = useState("A 20-minute unscheduled walk completely solved a sticky architecture bottleneck.");
  const [q4, setQ4] = useState("Refused to apologize for not answering non-urgent messages immediately.");
  const [q5, setQ5] = useState("FERAL");
  const [q6, setQ6] = useState("Quiet mornings with zero screens.");
  const [q7, setQ7] = useState("Other people's urgency projection.");
  const [q8, setQ8] = useState("Ship the core prototype and ignore second-round doubts.");
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveDebrief) {
      onSaveDebrief({
        id: `debrief_w${weekNumber}`,
        week_number: weekNumber,
        date_range: `Week ${weekNumber} (2027)`,
        khaos_level: khaosLevel,
        q1_script_disapproval: q1,
        q2_honest_moment: q2,
        q3_useful_surprise: q3,
        q4_refusal_to_perform: q4,
        q5_one_word: q5,
        q6_more_oxygen: q6,
        q7_less_attention: q7,
        q8_next_move: q8,
        updated_at: new Date().toISOString()
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Print-Only Document Header */}
      <div className="hidden print:block pb-3 mb-2 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-sky-700">
              LIFE OS · OFF*SCRIPT 2027 · FORENSIC NON-PRODUCTIVITY REVIEW
            </span>
            <h1 className="text-2xl font-bold font-serif-display text-slate-900 mt-0.5">
              Weekly Flight Debrief — Week {weekNumber} of 52
            </h1>
            <p className="text-xs text-stone-600 font-mono-code">
              Forensic examination: Where you showed up vs. where you refused to perform.
            </p>
          </div>
          <div className="text-right font-mono-code text-xs space-y-1">
            <div className="font-bold text-slate-900 px-2 py-0.5 bg-sky-50 border border-sky-300 rounded inline-block">
              WEEK {weekNumber} / 52
            </div>
            <div className="text-[11px] text-stone-600">
              Overall Khaos Level: <strong className="text-rose-700">{khaosLevel} / 10</strong> · Slogan: "Boredom=Death"
            </div>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border-2 border-stone-800 rounded-2xl p-6 shadow-sm print:p-4 print:border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-sky-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                ORBITAL REVIEW
              </span>
              <span className="text-xs text-stone-500 font-mono-code">WEEKLY FLIGHT DEBRIEF</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
              Weekly Flight Debrief (8 Questions)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Not a productivity scorecard or corporate audit. A forensic examination of where you showed up and where you refused to perform.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-mono-code text-stone-600 font-bold">Week #</label>
            <select
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-mono-code font-bold bg-stone-50 focus:outline-sky-600 print:hidden"
            >
              {Array.from({ length: 52 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Week {i + 1} of 52
                </option>
              ))}
            </select>
            <span className="hidden print:inline-block font-mono-code font-bold text-xs bg-stone-100 px-2.5 py-1 rounded border border-stone-300">
              Week {weekNumber} of 52
            </span>
            <button
              type="button"
              id="print-weekly-debrief-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold font-mono-code rounded-lg shadow-xs transition-colors print:hidden"
              title="Export Weekly Flight Debrief to structured PDF / Print"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Weekly Khaos Score Gauge */}
        <div className="mt-4 pt-3 border-t border-stone-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Overall Week Khaos Level (1–10):</span>
            </label>
            <span className="font-mono-code font-bold text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              {khaosLevel} / 10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={khaosLevel}
            onChange={(e) => setKhaosLevel(Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer print:hidden"
          />
          <div className="hidden print:block w-full bg-stone-100 rounded-full h-2.5 border border-stone-300 overflow-hidden mt-1">
            <div
              className="bg-rose-600 h-full rounded-full"
              style={{ width: `${khaosLevel * 10}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              1. Where did you deviate from the script and feel disapproval?
            </label>
            <div className="hidden print:block p-2.5 border border-stone-200 rounded-lg bg-stone-50 font-mono-code text-slate-900 text-xs whitespace-pre-wrap min-h-[48px]">
              {q1 || '—'}
            </div>
            <textarea
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              rows={2}
              className="w-full p-2 border border-stone-300 rounded-lg focus:outline-sky-500 print:hidden"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              2. What was your most honest moment this week?
            </label>
            <div className="hidden print:block p-2.5 border border-stone-200 rounded-lg bg-stone-50 font-mono-code text-slate-900 text-xs whitespace-pre-wrap min-h-[48px]">
              {q2 || '—'}
            </div>
            <textarea
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              rows={2}
              className="w-full p-2 border border-stone-300 rounded-lg focus:outline-sky-500 print:hidden"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              3. What surprise turned out to be useful?
            </label>
            <div className="hidden print:block p-2.5 border border-stone-200 rounded-lg bg-stone-50 font-mono-code text-slate-900 text-xs whitespace-pre-wrap min-h-[48px]">
              {q3 || '—'}
            </div>
            <textarea
              value={q3}
              onChange={(e) => setQ3(e.target.value)}
              rows={2}
              className="w-full p-2 border border-stone-300 rounded-lg focus:outline-sky-500 print:hidden"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              4. Where did you refuse to perform?
            </label>
            <div className="hidden print:block p-2.5 border border-stone-200 rounded-lg bg-stone-50 font-mono-code text-slate-900 text-xs whitespace-pre-wrap min-h-[48px]">
              {q4 || '—'}
            </div>
            <textarea
              value={q4}
              onChange={(e) => setQ4(e.target.value)}
              rows={2}
              className="w-full p-2 border border-stone-300 rounded-lg focus:outline-sky-500 print:hidden"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              5. One word for how this week actually felt:
            </label>
            <div className="hidden print:block p-2 border border-stone-200 rounded-lg bg-stone-50 font-mono-code uppercase font-bold text-rose-700 text-xs">
              {q5 || '—'}
            </div>
            <input
              type="text"
              value={q5}
              onChange={(e) => setQ5(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-mono-code uppercase font-bold text-rose-700 print:hidden"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              6. What needs more oxygen next week?
            </label>
            <div className="hidden print:block p-2 border border-stone-200 rounded-lg bg-stone-50 font-mono-code text-slate-900 text-xs">
              {q6 || '—'}
            </div>
            <input
              type="text"
              value={q6}
              onChange={(e) => setQ6(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-sky-500 print:hidden"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              7. What deserves less of your attention?
            </label>
            <div className="hidden print:block p-2 border border-stone-200 rounded-lg bg-stone-50 font-mono-code text-slate-900 text-xs">
              {q7 || '—'}
            </div>
            <input
              type="text"
              value={q7}
              onChange={(e) => setQ7(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-sky-500 print:hidden"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs print:border print:shadow-none break-inside-avoid">
            <label className="block text-slate-900 font-bold mb-1">
              8. The single non-negotiable next move:
            </label>
            <div className="hidden print:block p-2 border border-stone-200 rounded-lg bg-stone-50 font-mono-code font-bold text-slate-900 text-xs">
              {q8 || '—'}
            </div>
            <input
              type="text"
              value={q8}
              onChange={(e) => setQ8(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-sky-500 font-bold text-slate-900 print:hidden"
            />
          </div>

        </div>

        <div className="flex items-center justify-between pt-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-mono-code font-bold rounded-xl transition-all shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Weekly Forensic Report</span>
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Debrief Logged!' : 'Commit Week Debrief'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
