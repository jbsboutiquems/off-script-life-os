import React, { useState, useMemo } from 'react';
import {
  UserProfile, DailyEntry, Goal, AntiGoal, WeeklyFlightDebrief, MonthlyMoneyMap, FlightCrewContact,
} from '../types';
import { searchDocs, SearchDoc } from '../lib/search';
import { CORE_HOLIDAYS } from '../data/holidays';
import { Search, ArrowRight } from 'lucide-react';

interface SearchViewProps {
  user: UserProfile;
  entries: DailyEntry[];
  goals: Goal[];
  antiGoals: AntiGoal[];
  debriefs: WeeklyFlightDebrief[];
  moneyMaps: MonthlyMoneyMap[];
  flightCrew: FlightCrewContact[];
  onNavigate: (tab: string, target?: string) => void;
}

/** Search only ever touches this user's own data. */
export const SearchView: React.FC<SearchViewProps> = (props) => {
  const [query, setQuery] = useState('');

  const items = useMemo<SearchDoc[]>(() => {
    const list: SearchDoc[] = [];
    const { entries, goals, antiGoals, debriefs, moneyMaps, flightCrew } = props;
    (entries || []).forEach((e) => {
      list.push({
        kind: 'entry',
        kindLabel: 'Flight log',
        id: `entry:${e.entry_date}`,
        title: `Flight log — ${e.entry_date}`,
        body: [
          e.morning_intention, e.today_i_am, e.anchor_question_answer,
          (e.priorities || []).join('\n'), e.midday_checkin,
          e.micro_dare_notes, e.evening_notes,
          e.holiday_title, e.holiday_adventure,
        ]
          .filter(Boolean)
          .join('\n'),
        door: 'flight-log',
        target: e.entry_date,
      });
    });
    (goals || []).forEach((g) =>
      list.push({ kind: 'goal',
      kindLabel: 'Goal', id: `goal:${g.id}`, title: `Goal: ${g.title}`, body: [g.why_statement, g.success_metric, g.first_step].filter(Boolean).join('\n'), door: 'goals' })
    );
    (antiGoals || []).forEach((g) =>
      list.push({ kind: 'anti-goal',
      kindLabel: 'Anti-goal', id: `antigoal:${g.id}`, title: `Anti-goal: ${g.title}`, body: [g.why_stopped, g.category].filter(Boolean).join('\n'), door: 'anti-goals' })
    );
    (debriefs || []).forEach((d) =>
      list.push({
        kind: 'debrief',
        kindLabel: 'Debrief',
        id: `debrief:${d.week_number}`,
        title: `Debrief — week ${d.week_number}`,
        body: [d.q1_script_disapproval, d.q2_honest_moment, d.q3_useful_surprise, d.q4_refusal_to_perform, d.q5_one_word, d.q6_more_oxygen, d.q7_less_attention, d.q8_next_move]
          .filter(Boolean)
          .join('\n'),
        door: 'debrief',
      })
    );
    (moneyMaps || []).forEach((m) =>
      list.push({
        kind: 'money',
        kindLabel: 'Money map',
        id: `money:${m.id}`,
        title: `Money map: ${m.year}-${String(m.month).padStart(2, '0')}`,
        body: [
          (m.income_sources || []).map((s) => s.source).join(' '),
          (m.fixed_expenses || []).map((x) => x.name).join(' '),
          (m.variable_logs || []).map((v) => v.note).join(' '),
          m.one_surprise, m.one_pattern, m.financial_commitment, m.no_shame_recap,
        ]
          .filter(Boolean)
          .join('\n'),
        door: 'money',
      })
    );
    (flightCrew || []).forEach((c) =>
      list.push({ kind: 'crew',
      kindLabel: 'Crew', id: `crew:${c.id}`, title: `Crew: ${c.name}`, body: [c.role, c.notes].filter(Boolean).join('\n'), door: 'crew' })
    );
    Object.entries(CORE_HOLIDAYS).forEach(([key, h]: any) =>
      list.push({ kind: 'holiday',
      kindLabel: 'Holiday', id: `holiday:${key}`, title: h.name, body: h.description || '', door: 'holidays' })
    );
    return list;
  }, [props.entries, props.goals, props.antiGoals, props.debriefs, props.moneyMaps, props.flightCrew]);

  const results = useMemo(() => searchDocs(items, query), [items, query]);

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas mb-1">
          Search the ship
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 italic font-serif-display">
          Your data only. Finds that brilliant 2am note wherever it hid.
        </p>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries, goals, debriefs, crew…"
            autoFocus
            className="w-full pl-9 pr-3 py-3 border-2 border-stone-300 dark:border-white/15 rounded-xl bg-stone-50/50 dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-cream-canvas focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {query.trim().length >= 2 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
          {results.length === 0 && (
            <div className="text-xs text-stone-500 dark:text-stone-400 border border-dashed border-stone-300 dark:border-white/15 rounded-xl px-4 py-6 text-center italic font-serif-display">
              Nothing. The void keeps its secrets. Try fewer words.
            </div>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => props.onNavigate(r.door, r.target)}
              className="w-full text-left bg-white dark:bg-[#02142e] border border-stone-200 dark:border-white/10 rounded-xl p-4 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-sm text-slate-900 dark:text-cream-canvas">{r.title}</div>
                <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono-code uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded">
                    {r.kindLabel}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              {r.snippet && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">…{r.snippet}…</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
