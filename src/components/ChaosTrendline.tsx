import React, { useState, useMemo } from 'react';
import { DailyEntry } from '../types';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid
} from 'recharts';
import {
  Flame,
  ShieldCheck,
  AlertTriangle,
  Compass,
  TrendingUp,
  Activity,
  Info,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';

interface ChaosTrendlineProps {
  entries?: DailyEntry[];
  currentDate: string;
  onSelectDate?: (date: string) => void;
}

interface TrendDataPoint {
  date: string;
  displayDate: string;
  score: number;
  type: 'controlled' | 'uncontrolled' | 'stagnant';
  typeLabel: string;
  note: string;
  intention: string;
  microDareCompleted: boolean;
  dayOfWeek: string;
  isRealEntry: boolean;
}

export const ChaosTrendline: React.FC<ChaosTrendlineProps> = ({
  entries = [],
  currentDate,
  onSelectDate
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'spikes' | 'controlled' | 'dips'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);
  const isDark = useDarkMode();

  // Chart palette: luminous brand colors on the deep navy canvas in Midnight Chaos.
  const chart = {
    grid: isDark ? '#274264' : '#e7e5e4',
    axis: isDark ? '#8b93a8' : '#78716c',
    zoneFill: isDark ? '#f5c51b' : '#fef3c7',
    zoneLabel: isDark ? '#fde68a' : '#92400e',
    spikeLine: isDark ? '#ea4798' : '#ea4798',
    spikeLabel: isDark ? '#f49ac2' : '#ea4798',
    lullLine: isDark ? '#8b93a8' : '#64748b',
    lullLabel: isDark ? '#a3abc0' : '#475569',
    dipDot: isDark ? '#8b93a8' : '#475569',
  };

  // Generate 30 days of data, filling in actual user entries and realistic sample context
  const trendData: TrendDataPoint[] = useMemo(() => {
    const points: TrendDataPoint[] = [];
    const entriesMap = new Map<string, DailyEntry>();
    entries.forEach(e => {
      if (e.entry_date) entriesMap.set(e.entry_date, e);
    });

    const baseDate = new Date(currentDate);

    // Realistic baseline pattern seed for days without explicit entries
    const sampleVariations = [
      { score: 5, note: "Steady sovereign flow. Kept boundaries intact.", dare: true },
      { score: 6, note: "Pushed into unfamiliar design experiments.", dare: true },
      { score: 3, note: "Felt overly cautious and stuck in email loops.", dare: false },
      { score: 7, note: "Chaotic schedule but handled with creative humor.", dare: true },
      { score: 9, note: "Uncontrolled friction spike. Meeting overload & zero rest.", dare: false },
      { score: 4, note: "Quiet recovery day. Walking without phone.", dare: false },
      { score: 6, note: "Defied deadline anxiety, worked at natural rhythm.", dare: true },
      { score: 2, note: "Complete inertia. Felt numb to priorities.", dare: false },
      { score: 5, note: "Balanced focus. Refused two unnecessary calls.", dare: true },
      { score: 8, note: "Cognitive overload. Overcommitted to helping others.", dare: false },
      { score: 7, note: "Off-script bookstore exploration. High serendipity.", dare: true },
      { score: 5, note: "Normal operating cadence. One creative breakthrough.", dare: true }
    ];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const displayDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      const dayOfWeek = dayNames[d.getDay()];

      const existingEntry = entriesMap.get(dateStr);

      let score: number;
      let note = "";
      let intention = "";
      let microDareCompleted = false;
      let isRealEntry = false;

      if (existingEntry && typeof existingEntry.chaos_score === 'number') {
        score = existingEntry.chaos_score;
        note = existingEntry.evening_notes || "Field notes recorded in Daily OS.";
        intention = existingEntry.morning_intention || "";
        microDareCompleted = existingEntry.micro_dare_completed || false;
        isRealEntry = true;
      } else {
        const seed = sampleVariations[(i + d.getDate()) % sampleVariations.length];
        score = seed.score;
        note = seed.note;
        intention = "Maintain autonomy and clarity";
        microDareCompleted = seed.dare;
        isRealEntry = false;
      }

      let type: 'controlled' | 'uncontrolled' | 'stagnant';
      let typeLabel: string;

      if (score >= 8) {
        type = 'uncontrolled';
        typeLabel = 'Uncontrolled Chaos (Overwhelm)';
      } else if (score >= 4) {
        type = 'controlled';
        typeLabel = 'Controlled Chaos (Sweet Spot)';
      } else {
        type = 'stagnant';
        typeLabel = 'Rigid Order / Stagnation';
      }

      points.push({
        date: dateStr,
        displayDate,
        score,
        type,
        typeLabel,
        note,
        intention,
        microDareCompleted,
        dayOfWeek,
        isRealEntry
      });
    }

    return points;
  }, [entries, currentDate]);

  // Analytical Calculations
  const stats = useMemo(() => {
    const scores = trendData.map(p => p.score);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const controlledCount = trendData.filter(p => p.type === 'controlled').length;
    const controlledPct = Math.round((controlledCount / trendData.length) * 100);
    const spikeCount = trendData.filter(p => p.type === 'uncontrolled').length;
    const dipCount = trendData.filter(p => p.type === 'stagnant').length;

    // Pattern Recognition: Check if spikes follow consecutive low scores
    let reboundSpikes = 0;
    for (let i = 1; i < trendData.length; i++) {
      if (trendData[i].score >= 8 && trendData[i - 1].score <= 3) {
        reboundSpikes++;
      }
    }

    // Weekend vs Weekday analysis
    const weekendPoints = trendData.filter(p => p.dayOfWeek === 'Sat' || p.dayOfWeek === 'Sun');
    const weekdayPoints = trendData.filter(p => p.dayOfWeek !== 'Sat' && p.dayOfWeek !== 'Sun');
    const weekendAvg = (weekendPoints.reduce((a, b) => a + b.score, 0) / (weekendPoints.length || 1)).toFixed(1);
    const weekdayAvg = (weekdayPoints.reduce((a, b) => a + b.score, 0) / (weekdayPoints.length || 1)).toFixed(1);

    return {
      avgScore,
      controlledCount,
      controlledPct,
      spikeCount,
      dipCount,
      reboundSpikes,
      weekendAvg,
      weekdayAvg
    };
  }, [trendData]);

  // Filtered dataset for table or visual markers
  const filteredData = useMemo(() => {
    if (filterMode === 'spikes') return trendData.filter(p => p.type === 'uncontrolled');
    if (filterMode === 'controlled') return trendData.filter(p => p.type === 'controlled');
    if (filterMode === 'dips') return trendData.filter(p => p.type === 'stagnant');
    return trendData;
  }, [trendData, filterMode]);

  return (
    <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header & Philosophy Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-mono-code font-bold uppercase px-2.5 py-0.5 rounded tracking-wider shadow-2xs">
              CHAOS PATTERN FORENSICS
            </span>
            <span className="text-xs text-stone-500 font-mono-code">30-DAY TRAJECTORY</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
            Chaos Trendline &amp; Pattern Map
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Visualize the critical distinction between <span className="font-bold text-amber-800">Controlled Chaos</span> (deliberate play, boundary pushing) and <span className="font-bold text-rose-700">Uncontrolled Chaos</span> (burnout, reactive spiraling).
          </p>
        </div>

        {/* Zone Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-code">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Spikes (8-10): Overwhelm
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Sweet Spot (4-7): Sovereign
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-bold">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Dips (1-3): Rigid/Stagnant
          </span>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl">
          <div className="text-[10px] font-mono-code uppercase font-bold text-stone-500">
            30-Day Mean Chaos
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900 mt-0.5 flex items-baseline gap-1">
            {stats.avgScore} <span className="text-xs text-stone-400 font-normal">/ 10</span>
          </div>
          <div className="text-[11px] text-stone-600 mt-1 font-medium">
            Cadence: {Number(stats.avgScore) >= 7 ? 'High Friction' : Number(stats.avgScore) >= 4 ? 'Sovereign Balance' : 'Rigid Script'}
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl">
          <div className="text-[10px] font-mono-code uppercase font-bold text-amber-800">
            Controlled Chaos Ratio
          </div>
          <div className="text-2xl font-bold font-mono-code text-amber-900 mt-0.5">
            {stats.controlledPct}%
          </div>
          <div className="text-[11px] text-amber-800 mt-1 font-medium">
            {stats.controlledCount} of 30 days in sweet spot
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl">
          <div className="text-[10px] font-mono-code uppercase font-bold text-rose-800">
            Uncontrolled Spikes
          </div>
          <div className="text-2xl font-bold font-mono-code text-rose-700 mt-0.5">
            {stats.spikeCount} <span className="text-xs text-rose-400 font-normal">days</span>
          </div>
          <div className="text-[11px] text-rose-800 mt-1 font-medium">
            Score ≥ 8 (Overdrive alert)
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
          <div className="text-[10px] font-mono-code uppercase font-bold text-slate-600">
            Rigid Order / Lulls
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-800 mt-0.5">
            {stats.dipCount} <span className="text-xs text-slate-400 font-normal">days</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium">
            Score ≤ 3 (Hiding in script)
          </div>
        </div>
      </div>

      {/* Main Recharts Trendline Visualization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono-code font-bold text-slate-800 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-600" />
            <span>TRAJECTORY CURVE (SCORES 1 - 10)</span>
          </div>
          <span className="text-[11px] font-mono-code text-stone-500">
            Hover points for diagnostic notes · Click to inspect day
          </span>
        </div>

        <div className="h-72 w-full bg-[#fdfbf7] border border-stone-300 rounded-2xl p-2 sm:p-4 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const point = e.activePayload[0].payload as TrendDataPoint;
                  if (onSelectDate) onSelectDate(point.date);
                }
              }}
            >
              <defs>
                {/* Gradient for the sovereign sweet spot curve */}
                <linearGradient id="chaosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea4798" stopOpacity={0.45} />
                  <stop offset="35%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="75%" stopColor="#2da2ee" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
              
              {/* Background Reference Zone for Controlled Chaos (Sweet Spot: 4 to 7.5) */}
              <ReferenceArea
                y1={4}
                y2={7.5}
                fill={chart.zoneFill}
                fillOpacity={isDark ? 0.12 : 0.45}
                label={{
                  value: "CONTROLLED CHAOS (SOVEREIGN FLOW)",
                  position: "insideTopRight",
                  fill: chart.zoneLabel,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "DM Mono, monospace"
                }}
              />

              {/* Threshold Lines */}
              <ReferenceLine
                y={7.5}
                stroke={chart.spikeLine}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "Spike Threshold (≥8)",
                  position: "insideTopLeft",
                  fill: chart.spikeLabel,
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
              <ReferenceLine
                y={3.5}
                stroke={chart.lullLine}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "Inertia Lull (≤3)",
                  position: "insideBottomLeft",
                  fill: chart.lullLabel,
                  fontSize: 10,
                  fontWeight: 600
                }}
              />

              <XAxis
                dataKey="displayDate"
                tickLine={false}
                stroke={chart.axis}
                tick={{ fontSize: 10, fill: chart.axis, fontFamily: 'DM Mono, monospace' }}
                interval={4}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[1, 3, 5, 7, 9, 10]}
                tickLine={false}
                stroke={chart.axis}
                tick={{ fontSize: 10, fill: chart.axis, fontFamily: 'DM Mono, monospace' }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrendDataPoint;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl border border-stone-700 shadow-xl text-xs max-w-xs space-y-1.5 font-sans">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-mono-code text-[11px]">
                          <span className="font-bold text-amber-300">
                            {data.displayDate} ({data.dayOfWeek})
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            data.type === 'uncontrolled'
                              ? 'bg-rose-900 text-rose-200'
                              : data.type === 'controlled'
                              ? 'bg-amber-900 text-amber-200'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            Score: {data.score}/10
                          </span>
                        </div>
                        
                        <div className="text-[11px] font-bold text-rose-400">
                          {data.typeLabel}
                        </div>

                        <p className="text-[11px] text-stone-300 italic font-serif-display leading-snug">
                          "{data.note}"
                        </p>

                        <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono-code text-stone-400">
                          <span>Micro-Dare: {data.microDareCompleted ? '✅ Done' : '⚠️ Skipped'}</span>
                          <span className="text-amber-400 font-bold">Click to open day →</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="score"
                stroke="#ea4798"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#chaosGradient)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isSpike = payload.score >= 8;
                  const isDip = payload.score <= 3;
                  const fillColor = isSpike ? '#ea4798' : isDip ? chart.dipDot : '#f59e0b';
                  const radius = isSpike ? 5 : isDip ? 4 : 3;

                  return (
                    <circle
                      key={payload.date}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="cursor-pointer hover:r-7 transition-all"
                    />
                  );
                }}
                activeDot={{
                  r: 7,
                  fill: '#ea4798',
                  stroke: '#ffffff',
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pattern Recognition & Forensic Takeaways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Diagnostic Pattern Insight */}
        <div className="bg-[#faf5eb] border border-amber-300 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-800 text-white font-mono-code text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              MEI PATTERN RADAR
            </span>
            <span className="font-bold text-slate-900 font-display-punch">The Rhythm of Your Chaos</span>
          </div>

          <p className="text-stone-700 leading-relaxed">
            {stats.reboundSpikes > 0 ? (
              <>
                <strong className="text-rose-700">Suppression Blowout Detected:</strong> You experienced {stats.reboundSpikes} uncontrolled spikes immediately following days of low chaos (score ≤ 3). When you force yourself into rigid order for too long, the system over-corrects into reactive explosion.
              </>
            ) : (
              <>
                <strong className="text-emerald-800">Stable Boundary Regulation:</strong> You have kept chaos largely in the sovereign flow zone without severe rebound blowouts. Your transitions between high-creativity and recovery are relatively smooth.
              </>
            )}
          </p>

          <div className="pt-1 text-[11px] font-mono-code text-amber-950 font-semibold flex items-center gap-1.5">
            <span>⚡ Antidote Rule:</span>
            <span>Schedule deliberate micro-dares during quiet days to let off pressure.</span>
          </div>
        </div>

        {/* Weekly Day-of-Week Variance */}
        <div className="bg-white border border-stone-300 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-slate-800 text-white font-mono-code text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              TEMPORAL VARIANCE
            </span>
            <span className="font-bold text-slate-900 font-display-punch">Weekday vs. Weekend</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono-code">
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 block">WEEKDAY MEAN</span>
              <span className="text-lg font-bold text-slate-900">{stats.weekdayAvg} / 10</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 block">WEEKEND MEAN</span>
              <span className="text-lg font-bold text-slate-900">{stats.weekendAvg} / 10</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-600 mt-1">
            {Number(stats.weekdayAvg) > Number(stats.weekendAvg)
              ? "External demands drive most weekday chaos. Protect your Sunday reset ritual."
              : "Weekend restlessness is driving your spikes. Try intentional open studio time."}
          </p>
        </div>

      </div>

      {/* Filterable Dips & Spikes Inspector Table */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-mono-code font-bold text-slate-900 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span>INSPECT DIPS &amp; SPIKES BY CATEGORY</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-mono-code">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All (30)
            </button>
            <button
              onClick={() => setFilterMode('spikes')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'spikes'
                  ? 'bg-rose-700 text-white font-bold'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Spikes ({stats.spikeCount})
            </button>
            <button
              onClick={() => setFilterMode('controlled')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'controlled'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              Controlled ({stats.controlledCount})
            </button>
            <button
              onClick={() => setFilterMode('dips')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterMode === 'dips'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Dips ({stats.dipCount})
            </button>
          </div>
        </div>

        {/* Mini Item List */}
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100">
          {filteredData.slice(0, 10).map((pt) => (
            <div
              key={pt.date}
              onClick={() => onSelectDate && onSelectDate(pt.date)}
              className="pt-2 flex items-center justify-between text-xs hover:bg-stone-50 p-2 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <span className={`w-8 text-center font-mono-code font-bold text-xs py-1 rounded-md ${
                  pt.type === 'uncontrolled'
                    ? 'bg-rose-100 text-rose-800'
                    : pt.type === 'controlled'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-stone-200 text-stone-700'
                }`}>
                  {pt.score}
                </span>

                <div className="overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 font-mono-code">{pt.displayDate}</span>
                    <span className="text-[10px] font-mono-code text-stone-400">({pt.dayOfWeek})</span>
                    <span className={`text-[10px] font-mono-code px-1.5 py-0.2 rounded font-semibold ${
                      pt.type === 'uncontrolled'
                        ? 'text-rose-700'
                        : pt.type === 'controlled'
                        ? 'text-amber-800'
                        : 'text-stone-500'
                    }`}>
                      {pt.type === 'uncontrolled' ? 'Friction Spike' : pt.type === 'controlled' ? 'Sovereign Flow' : 'Rigid Lull'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 truncate mt-0.5">
                    {pt.note}
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-mono-code text-stone-400 group-hover:text-slate-900 flex items-center gap-1 flex-shrink-0 ml-2">
                <span>Inspect</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
