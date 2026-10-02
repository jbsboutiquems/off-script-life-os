import React, { useState } from 'react';
import { Goal, AntiGoal } from '../types';
import {
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  Target,
  Ban,
  ShieldAlert,
  Check,
  X,
  Lightbulb,
  Filter,
  CheckSquare,
  Square,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Big6GoalsTrackerProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'is_completed'>) => void;
  onToggleGoal: (id: string, isCompleted: boolean) => void;
  onDeleteGoal: (id: string) => void;
  antiGoals?: AntiGoal[];
  onAddAntiGoal?: (antiGoal: Omit<AntiGoal, 'id' | 'created_at' | 'is_completed'> & { is_completed?: boolean }) => void;
  onToggleAntiGoal?: (id: string, isCompleted: boolean) => void;
  onDeleteAntiGoal?: (id: string) => void;
  onOpenShare?: (context?: 'daily' | 'identity' | 'mantra' | 'antigoals' | 'diagnostic') => void;
  /** Render only one section (dashboard doors). Omit for the combined view. */
  section?: 'goals' | 'antigoals';
}

const ANTI_GOAL_PRESETS = [
  {
    title: "Apologizing before asking a straightforward question in team chats",
    category: "People Pleasing" as const,
    why: "Shrinks my presence and trains others to treat normal inquiries as an imposition."
  },
  {
    title: "Checking work notifications and email in bed before coffee",
    category: "Time Theft" as const,
    why: "Surrenders my nervous system to third-party demands before sunrise."
  },
  {
    title: "Saying 'yes' on the spot to non-urgent asks without sleeping on it",
    category: "Boundary" as const,
    why: "Instant compliance is fear masquerading as helpfulness."
  },
  {
    title: "Attending meetings without a written agenda or clear decision goals",
    category: "Time Theft" as const,
    why: "Performative calendar filler that consumes prime cognitive focus blocks."
  },
  {
    title: "Explaining and justifying my personal boundaries to people testing them",
    category: "Boundary" as const,
    why: "'No' is a complete sentence; explaining invites negotiation."
  },
  {
    title: "Polishing drafts for hours after 80% clarity has already been reached",
    category: "Perfectionism" as const,
    why: "Fear of judgment disguised as meticulous craft."
  },
  {
    title: "Working through lunch while staring at a laptop screen",
    category: "Energy Drain" as const,
    why: "Treats my body like a disposable machine running on fumes without maintenance."
  }
];

const CATEGORY_STYLES: Record<string, { badge: string }> = {
  'Boundary': { badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Time Theft': { badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  'Energy Drain': { badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  'People Pleasing': { badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  'Perfectionism': { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

export const Big6GoalsTracker: React.FC<Big6GoalsTrackerProps> = ({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  antiGoals,
  onAddAntiGoal,
  onToggleAntiGoal,
  onDeleteAntiGoal,
  onOpenShare,
  section
}) => {
  // Forward Goals state
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [whyStatement, setWhyStatement] = useState('');
  const [successMetric, setSuccessMetric] = useState('');
  const [firstStep, setFirstStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Anti-Goals state with fallback
  const [localAntiGoals, setLocalAntiGoals] = useState<AntiGoal[]>([
    {
      id: "antigoal_01",
      title: "Apologizing before asking a straightforward question in team chats",
      category: "People Pleasing",
      why_stopped: "Shrinking myself to make normal communication feel like an inconvenience.",
      is_completed: false,
      created_at: new Date().toISOString()
    },
    {
      id: "antigoal_02",
      title: "Saying 'yes' on the spot to non-urgent commitments without sleeping on it",
      category: "Boundary",
      why_stopped: "Immediate compliance is fear masquerading as helpfulness.",
      is_completed: true,
      created_at: new Date().toISOString()
    },
    {
      id: "antigoal_03",
      title: "Checking work notifications and email before getting out of bed",
      category: "Time Theft",
      why_stopped: "Hands over the keys of my nervous system to strangers before sunrise.",
      is_completed: false,
      created_at: new Date().toISOString()
    },
    {
      id: "antigoal_04",
      title: "Polishing drafts for hours when 80% clarity was reached 3 hours ago",
      category: "Perfectionism",
      why_stopped: "Procrastination dressed in bespoke calligraphy.",
      is_completed: false,
      created_at: new Date().toISOString()
    }
  ]);

  const effectiveAntiGoals = antiGoals !== undefined ? antiGoals : localAntiGoals;

  const [isAddingAntiGoal, setIsAddingAntiGoal] = useState(false);
  const [antiTitle, setAntiTitle] = useState('');
  const [antiCategory, setAntiCategory] = useState<'Boundary' | 'Time Theft' | 'Energy Drain' | 'People Pleasing' | 'Perfectionism'>('Boundary');
  const [antiWhy, setAntiWhy] = useState('');
  const [antiError, setAntiError] = useState('');
  const [antiFilter, setAntiFilter] = useState<'all' | 'active' | 'eliminated'>('all');

  // Big 6 goal creator
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Goal title is required.');
      return;
    }
    if (goals.length >= 6) {
      setErrorMsg('Strict limit reached! Only 6 goals allowed in the Big 6 Os.');
      return;
    }

    onAddGoal({
      title: title.trim(),
      quarter,
      why_statement: whyStatement.trim(),
      success_metric: successMetric.trim(),
      first_step: firstStep.trim()
    });

    setTitle('');
    setWhyStatement('');
    setSuccessMetric('');
    setFirstStep('');
    setIsAdding(false);
    setErrorMsg('');
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    onToggleGoal(id, !currentStatus);
    if (!currentStatus) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Anti-Goal creator
  const handleCreateAntiGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!antiTitle.trim()) {
      setAntiError('Please specify the habit or behavior you commit to stop doing.');
      return;
    }

    const payload = {
      title: antiTitle.trim(),
      category: antiCategory,
      why_stopped: antiWhy.trim(),
      is_completed: false
    };

    if (onAddAntiGoal) {
      onAddAntiGoal(payload);
    } else {
      const fallback: AntiGoal = {
        ...payload,
        id: `antigoal_${Date.now()}`,
        created_at: new Date().toISOString()
      };
      setLocalAntiGoals(prev => [...prev, fallback]);
    }

    setAntiTitle('');
    setAntiWhy('');
    setAntiError('');
    setIsAddingAntiGoal(false);
  };

  const handleToggleAntiGoalClick = (id: string, currentStatus: boolean) => {
    if (onToggleAntiGoal) {
      onToggleAntiGoal(id, !currentStatus);
    } else {
      setLocalAntiGoals(prev => prev.map(ag => ag.id === id ? { ...ag, is_completed: !currentStatus } : ag));
    }

    if (!currentStatus) {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ea4798', '#ec6aa2', '#f6b9d6', '#f59e0b', '#2da2ee']
      });
    }
  };

  const handleDeleteAntiGoalClick = (id: string) => {
    if (onDeleteAntiGoal) {
      onDeleteAntiGoal(id);
    } else {
      setLocalAntiGoals(prev => prev.filter(ag => ag.id !== id));
    }
  };

  const handleApplyPreset = (preset: typeof ANTI_GOAL_PRESETS[number]) => {
    setAntiTitle(preset.title);
    setAntiCategory(preset.category);
    setAntiWhy(preset.why);
    setIsAddingAntiGoal(true);
    setAntiError('');
  };

  // Up to 6 slots
  const slots = Array.from({ length: 6 }).map((_, index) => {
    return goals[index] || null;
  });

  const activeAntiCount = effectiveAntiGoals.filter(ag => !ag.is_completed).length;
  const eliminatedAntiCount = effectiveAntiGoals.filter(ag => ag.is_completed).length;

  const filteredAntiGoals = effectiveAntiGoals.filter(ag => {
    if (antiFilter === 'active') return !ag.is_completed;
    if (antiFilter === 'eliminated') return ag.is_completed;
    return true;
  });

  return (
    <div className="space-y-8">
      {(!section || section === 'goals') && (
      <>
      {/* SECTION 1: THE BIG 6 GOALS BANNER */}
      <div className="bg-white border-2 border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                CORE DISCIPLINE
              </span>
              <span className="text-xs text-stone-500 font-mono-code">
                {goals.length} of 6 SLOTS OCCUPIED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
              The Big 6 Goals OS
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Strict limit of six goals for the entire year. If you have 20 goals, you have zero goals. Each one demands a deep <em>Why</em>, a concrete <em>Metric</em>, and an immediate <em>First Step</em>.
            </p>
          </div>

          <div>
            {goals.length < 6 && (
              <button
                onClick={() => {
                  setIsAdding(!isAdding);
                  setErrorMsg('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>{isAdding ? 'Close Creator' : 'Add Big Goal'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mt-5 pt-4 border-t border-stone-200 flex items-center gap-3">
          <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(goals.filter(g => g.is_completed).length / 6) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono-code font-bold text-slate-700 whitespace-nowrap">
            {goals.filter(g => g.is_completed).length} / 6 Completed
          </span>
        </div>
      </div>

      {/* Add Goal Modal / Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-amber-50/60 border-2 border-dashed border-amber-400 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm font-display-punch uppercase flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600" />
              <span>Define New Big Goal (Slot {goals.length + 1} of 6)</span>
            </h3>
            <span className="text-xs text-amber-800 font-mono-code">No soft ambitions allowed</span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-bold mb-1">Goal Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Publish the Unfiltered Field Essay"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-amber-600 font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Target Quarter</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-amber-600 font-mono-code"
              >
                <option value="Q1">Q1 (Jan–Mar)</option>
                <option value="Q2">Q2 (Apr–Jun)</option>
                <option value="Q3">Q3 (Jul–Sep)</option>
                <option value="Q4">Q4 (Oct–Dec)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Why Statement (Emotional root)</label>
              <textarea
                value={whyStatement}
                onChange={(e) => setWhyStatement(e.target.value)}
                placeholder="Why does this matter? What happens if you skip it?"
                rows={2}
                className="w-full p-2 border border-stone-300 rounded-lg bg-white focus:outline-amber-600"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Success Metric (Hard proof)</label>
              <textarea
                value={successMetric}
                onChange={(e) => setSuccessMetric(e.target.value)}
                placeholder="How will you measure victory without ambiguity?"
                rows={2}
                className="w-full p-2 border border-stone-300 rounded-lg bg-white focus:outline-amber-600"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">First Step (24-hour action)</label>
              <textarea
                value={firstStep}
                onChange={(e) => setFirstStep(e.target.value)}
                placeholder="The physical next action you can take right now."
                rows={2}
                className="w-full p-2 border border-stone-300 rounded-lg bg-white focus:outline-amber-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs"
            >
              Commit to Slot
            </button>
          </div>
        </form>
      )}

      {/* The 6 Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {slots.map((goal, idx) => {
          const slotNumber = String(idx + 1).padStart(2, '0');

          if (!goal) {
            return (
              <div
                key={`empty-${idx}`}
                onClick={() => {
                  setIsAdding(true);
                  setErrorMsg('');
                }}
                className="border-2 border-dashed border-stone-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-stone-400 hover:bg-white/50 transition-all min-h-[220px]"
              >
                <span className="font-mono-code text-2xl font-bold text-stone-300 mb-1">
                  {slotNumber}
                </span>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Open Goal Slot
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Click to assign one of your Big 6
                </p>
              </div>
            );
          }

          return (
            <div
              key={goal.id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                goal.is_completed
                  ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                  : 'bg-white border-stone-300 shadow-xs hover:border-stone-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code font-bold text-xs bg-stone-900 text-amber-400 px-2 py-0.5 rounded">
                      SLOT {slotNumber}
                    </span>
                    <span className="font-mono-code text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                      {goal.quarter}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggle(goal.id, goal.is_completed)}
                      className="p-1 text-stone-400 hover:text-emerald-600 transition-colors"
                      title={goal.is_completed ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {goal.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300 hover:text-stone-500" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 text-stone-300 hover:text-rose-600 transition-colors"
                      title="Delete goal slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className={`font-serif-display font-bold text-base text-slate-900 mb-2 ${goal.is_completed ? 'line-through text-stone-500' : ''}`}>
                  {goal.title}
                </h3>

                <div className="space-y-2 text-xs text-stone-600">
                  {goal.why_statement && (
                    <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                      <span className="font-bold text-stone-800 block text-[10px] uppercase font-mono-code">Why It Matters:</span>
                      <p className="italic text-slate-800">"{goal.why_statement}"</p>
                    </div>
                  )}

                  {goal.success_metric && (
                    <div>
                      <span className="font-bold text-stone-700 text-[10px] uppercase font-mono-code">Success Metric:</span>
                      <p className="text-slate-800">{goal.success_metric}</p>
                    </div>
                  )}

                  {goal.first_step && (
                    <div>
                      <span className="font-bold text-stone-700 text-[10px] uppercase font-mono-code">First Step:</span>
                      <p className="text-amber-800 font-medium">{goal.first_step}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono-code">
                <span className={goal.is_completed ? 'text-emerald-700 font-bold' : 'text-stone-400'}>
                  {goal.is_completed ? 'STATUS: ACCOMPLISHED' : 'STATUS: IN FLIGHT'}
                </span>
                <span className="text-stone-400">LIFE OS: OFF*SCRIPT 2027.</span>
              </div>
            </div>
          );
        })}
      </div>

      </>
      )}
      {(!section || section === 'antigoals') && (
      <>
      {/* ========================================================================= */}
      {/* SECTION 2: ANTI-GOALS (WHAT YOU COMMIT TO STOP DOING) */}
      {/* ========================================================================= */}
      <div id="anti-goals-section" className="border-t-2 border-stone-300 pt-8 space-y-6">
        {/* Anti-Goals Banner Card */}
        <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-stone-100 border-2 border-stone-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          {/* Subtle accent border top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="bg-rose-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  SUBTRACTIVE PROTOCOL
                </span>
                <span className="text-xs text-rose-300 font-mono-code">
                  THE STOP-DOING COMMITMENT
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-white">
                Anti-Goals: What I Commit to Stop Doing
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                You do not build freedom solely by stacking ambitions; you preserve sovereignty by refusing to perform behaviors that leak energy, self-respect, and focus. Mark completed habits to strike them through your system forever.
              </p>
            </div>

            {/* Quick Metrics & Trigger Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <div className="flex items-center space-x-2 font-mono-code text-xs">
                <span className="bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700 text-stone-300">
                  <strong className="text-rose-400">{eliminatedAntiCount}</strong> / {effectiveAntiGoals.length} Stopped
                </span>
                <span className="bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700 text-stone-300">
                  <strong className="text-amber-400">{activeAntiCount}</strong> Active Boundaries
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onOpenShare && (
                  <button
                    type="button"
                    id="share-anti-goals-btn"
                    onClick={() => onOpenShare('antigoals')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="Share your Anti-Goals & Subtractive Protocol to Social Media"
                  >
                    <Share2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Share Stop-List</span>
                  </button>
                )}

                <button
                  type="button"
                  id="add-anti-goal-btn"
                  onClick={() => {
                    setIsAddingAntiGoal(!isAddingAntiGoal);
                    setAntiError('');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingAntiGoal ? 'Close Creator' : 'Commit to an Anti-Goal'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Strikethrough Elimination Progress Bar */}
          <div className="mt-5 pt-4 border-t border-stone-800/80 flex items-center gap-3">
            <div className="flex-1 bg-stone-800 rounded-full h-2 overflow-hidden border border-stone-700">
              <div
                className="bg-gradient-to-r from-rose-500 via-amber-400 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: effectiveAntiGoals.length > 0
                    ? `${(eliminatedAntiCount / effectiveAntiGoals.length) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <span className="text-[11px] font-mono-code text-stone-400 whitespace-nowrap">
              {effectiveAntiGoals.length > 0
                ? `${Math.round((eliminatedAntiCount / effectiveAntiGoals.length) * 100)}% Bad Habits Quashed`
                : '0% Eliminated'}
            </span>
          </div>
        </div>

        {/* Inline Anti-Goal Creator Form */}
        {isAddingAntiGoal && (
          <form
            onSubmit={handleCreateAntiGoal}
            className="bg-rose-50/70 border-2 border-dashed border-rose-300 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <div className="flex items-center space-x-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-slate-900 text-sm font-display-punch uppercase">
                  Log a New Anti-Goal (Behavior to Quench)
                </h4>
              </div>
              <span className="text-xs text-rose-800 font-mono-code">
                Commitment to refusal
              </span>
            </div>

            {antiError && (
              <div className="p-2.5 rounded-lg bg-rose-200 text-rose-900 text-xs font-semibold">
                {antiError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-stone-800 font-bold mb-1">
                  Behavior or Habit to Stop *
                </label>
                <input
                  type="text"
                  value={antiTitle}
                  onChange={(e) => setAntiTitle(e.target.value)}
                  placeholder="e.g., Apologizing before asking a straightforward question in team chats"
                  className="w-full px-3 py-2 border border-rose-200 rounded-lg bg-white focus:outline-rose-600 font-semibold text-slate-900 text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-800 font-bold mb-1">
                  Drain Category
                </label>
                <select
                  value={antiCategory}
                  onChange={(e) => setAntiCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-rose-200 rounded-lg bg-white focus:outline-rose-600 font-mono-code text-xs"
                >
                  <option value="Boundary">Boundary (Intrusion/Overreach)</option>
                  <option value="Time Theft">Time Theft (Performative busywork)</option>
                  <option value="Energy Drain">Energy Drain (Depleting friction)</option>
                  <option value="People Pleasing">People Pleasing (Polite compliance)</option>
                  <option value="Perfectionism">Perfectionism (Fear of judgment)</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-stone-800 font-bold mb-1">
                The Hidden Cost / Root Trap (Why this must be put down)
              </label>
              <textarea
                value={antiWhy}
                onChange={(e) => setAntiWhy(e.target.value)}
                placeholder="What does continuing this behavior cost you in energy, dignity, or calendar sovereignty?"
                rows={2}
                className="w-full p-2.5 border border-rose-200 rounded-lg bg-white focus:outline-rose-600 font-sans text-xs text-slate-800"
              />
            </div>

            {/* Quick Inspiration Presets */}
            <div className="pt-2 border-t border-rose-200/80">
              <div className="flex items-center space-x-1.5 text-[11px] font-bold font-mono-code text-rose-900 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>OR CHOOSE AN OFF*SCRIPT STARTER ANTI-GOAL:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ANTI_GOAL_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-slate-700 transition-colors text-left"
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
              <button
                type="button"
                onClick={() => setIsAddingAntiGoal(false)}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs"
              >
                Commit to Stop-List
              </button>
            </div>
          </form>
        )}

        {/* Filter Pills & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
          <div className="flex items-center space-x-1 text-xs font-mono-code">
            <span className="text-stone-400 text-[11px] uppercase mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setAntiFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                antiFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All ({effectiveAntiGoals.length})
            </button>
            <button
              type="button"
              onClick={() => setAntiFilter('active')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                antiFilter === 'active'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Active ({activeAntiCount})
            </button>
            <button
              type="button"
              onClick={() => setAntiFilter('eliminated')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                antiFilter === 'eliminated'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Quashed / Stopped ({eliminatedAntiCount})
            </button>
          </div>

          <span className="text-[11px] font-mono-code text-stone-500">
            Click checkbox to strike through eliminated behavior
          </span>
        </div>

        {/* Anti-Goals List with Strikethrough Visual Effect */}
        <div className="space-y-3">
          {filteredAntiGoals.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-2">
              <Ban className="w-8 h-8 text-stone-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm font-serif-display">
                No Anti-Goals in this view
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {antiFilter === 'eliminated'
                  ? "You haven't marked any behaviors as stopped yet. When you successfully eliminate a drain, check it off to activate the strikethrough effect."
                  : "All quiet on this front. Add an active commitment to stop performing drained habits."}
              </p>
              {antiFilter !== 'all' && (
                <button
                  onClick={() => setAntiFilter('all')}
                  className="text-xs text-rose-600 font-bold underline hover:text-rose-700 pt-1"
                >
                  View All Anti-Goals
                </button>
              )}
            </div>
          ) : (
            filteredAntiGoals.map((ag) => {
              const categoryBadge = CATEGORY_STYLES[ag.category || 'Boundary']?.badge || 'bg-stone-100 text-stone-800 border-stone-200';

              return (
                <div
                  key={ag.id}
                  className={`group rounded-2xl border transition-all duration-300 p-4 sm:p-5 flex items-start justify-between gap-4 ${
                    ag.is_completed
                      ? 'bg-stone-50/80 border-stone-200 hover:border-stone-300 text-stone-400'
                      : 'bg-white border-stone-300 hover:border-stone-400 shadow-2xs'
                  }`}
                >
                  {/* Left: Checkbox / Strikethrough Trigger */}
                  <div className="pt-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAntiGoalClick(ag.id, ag.is_completed)}
                      className="p-1 rounded-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      title={ag.is_completed ? 'Mark unquenched / active' : 'Mark as stopped / eliminated (activate strikethrough)'}
                    >
                      {ag.is_completed ? (
                        <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-stone-300 group-hover:border-rose-500 group-hover:bg-rose-50 flex items-center justify-center transition-colors">
                          <Ban className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-600 transition-colors" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Center: Content with Prominent Strikethrough Visual Effect */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded border ${categoryBadge}`}>
                        {ag.category || 'Boundary'}
                      </span>

                      {/* Status pill badge */}
                      {ag.is_completed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          <Check className="w-3 h-3 text-rose-600 stroke-[3]" />
                          STOPPED / QUASHED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          ACTIVE COMMITMENT
                        </span>
                      )}
                    </div>

                    {/* The Strikethrough Title */}
                    <div>
                      <h4
                        className={`font-serif-display font-bold text-sm sm:text-base leading-snug transition-all duration-300 ${
                          ag.is_completed
                            ? 'line-through text-stone-400 decoration-rose-600 decoration-[2.5px] select-none opacity-80'
                            : 'text-slate-900'
                        }`}
                      >
                        {ag.title}
                      </h4>

                      {/* Why Statement / Root Trap */}
                      {ag.why_stopped && (
                        <p
                          className={`text-xs mt-1 transition-all duration-300 ${
                            ag.is_completed
                              ? 'line-through text-stone-400 decoration-stone-300 italic select-none'
                              : 'text-stone-600 italic'
                          }`}
                        >
                          Cost / Root Trap: "{ag.why_stopped}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleToggleAntiGoalClick(ag.id, ag.is_completed)}
                      className={`text-xs font-mono-code font-semibold px-2 py-1 rounded transition-colors hidden sm:inline-block ${
                        ag.is_completed
                          ? 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/60'
                          : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      {ag.is_completed ? 'Reopen' : 'Stop It'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAntiGoalClick(ag.id)}
                      className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Remove this anti-goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Subtractive Manifesto Footer Note */}
        <div className="bg-[#f0ece1] border border-stone-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-700">
          <div className="flex items-center space-x-2">
            <span className="font-mono-code font-bold text-rose-700 uppercase tracking-widest text-[11px]">
              THE OFF*SCRIPT RULE:
            </span>
            <span className="italic">
              "A crossed-out obligation creates more peace than ten completed to-do items."
            </span>
          </div>
          <span className="text-[11px] font-mono-code text-stone-500 whitespace-nowrap">
            Anti-Goals Engine · 2027
          </span>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
