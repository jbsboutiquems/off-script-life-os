import React, { useState, useEffect, useCallback } from 'react';
import { PersonalitySnapshot, SubTrait, InterpersonalInsight, RelationshipType, type BuddyProfile } from '../types';
import { api } from '../services/api';
import { BuddyAvatar } from './BuddyAvatar';
import { Sparkles, AlertTriangle, Zap, Eye, ChevronDown, ChevronUp, RefreshCw, Quote, ArrowRight, Activity, Users } from 'lucide-react';

interface MeiDiagnosticCardProps {
  snapshot: PersonalitySnapshot | null;
  onTriggerDiagnosis?: () => void;
  isLoading?: boolean;
  hasLatestEntryContent?: boolean;
  /** The user's AI buddy — shown as the face of Mei. */
  buddy?: BuddyProfile | null;
  onEditBuddy?: () => void;
}

const typeBadge: Record<RelationshipType, string> = {
  romantic: 'bg-rose-100 text-rose-800 border-rose-300',
  friendly: 'bg-sky-100 text-sky-800 border-sky-300',
  family: 'bg-amber-100 text-amber-800 border-amber-300',
  professional: 'bg-slate-200 text-slate-700 border-slate-300',
};

/**
 * "You × Them" — Mei's interpersonal half. Reads the user's own DM threads
 * (relationship type, warmth, tension, initiation balance) and renders one
 * card per contact. Fetches on mount; graceful empty state when there are no
 * DMs. Users only ever see analysis of their own conversations.
 */
const InterpersonalSection: React.FC = () => {
  const [insights, setInsights] = useState<InterpersonalInsight[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.getInterpersonalInsights()
      .then((r) => setInsights(r))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mt-8 border-t-2 border-dashed border-stone-200 pt-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-rose-600" />
            <h3 className="text-lg font-bold font-serif-display text-slate-900">You × Them</h3>
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest bg-violet-100 text-violet-800 px-2 py-0.5 rounded">
              Relationship Radar
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Mei reads your DM threads — relationship type, warmth, tension, who reaches out first. Only your own conversations, only visible to you.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
          title="Re-scan DM threads"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Scanning...' : 'Re-scan'}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Reading the room...</span>
        </div>
      ) : !insights || insights.length === 0 ? (
        <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center">
          <Users className="w-6 h-6 mx-auto text-stone-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No DM threads yet</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Your relationship radar lights up here once you start messaging your people — type, warmth, tension, and who reaches out first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map((ins) => (
            <div key={ins.partnerId} className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-slate-900 truncate" title={ins.partnerUsername}>
                  @{ins.partnerUsername}
                </span>
                <span className={`shrink-0 text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${typeBadge[ins.relationship_type]}`}>
                  {ins.relationship_type}
                </span>
              </div>
              <p className="text-[13px] text-slate-700 leading-relaxed mb-3">{ins.insight}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-stone-500 font-semibold">Warmth</span>
                    <span className="font-mono-code font-bold text-slate-800">{ins.warmth}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${ins.warmth}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-stone-500 font-semibold">Tension</span>
                    <span className="font-mono-code font-bold text-slate-800">{ins.tension}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-500 h-full rounded-full" style={{ width: `${ins.tension}%` }} />
                  </div>
                </div>
                <div className="text-stone-600">
                  <span className="font-semibold text-stone-500">You initiate:</span>{' '}
                  <span className="font-bold text-slate-800">{ins.initiation_balance}%</span>
                </div>
                <div className="text-stone-600">
                  <span className="font-semibold text-stone-500">Replies:</span>{' '}
                  <span className="font-bold text-slate-800">
                    {ins.avg_reply_hours_you != null ? `you ~${ins.avg_reply_hours_you}h` : 'you —'}
                    {' · '}
                    {ins.avg_reply_hours_them != null ? `them ~${ins.avg_reply_hours_them}h` : 'them —'}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-mono-code">
                <span>{ins.message_count} messages · {ins.days_active}d active</span>
                {ins.confidence === 'low' && ins.message_count >= 4 && <span className="italic">low-confidence read — thin thread</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MeiDiagnosticCard: React.FC<MeiDiagnosticCardProps> = ({
  snapshot,
  onTriggerDiagnosis,
  isLoading = false,
  hasLatestEntryContent = true,
  buddy = null,
  onEditBuddy,
}) => {
  const [showSubTraits, setShowSubTraits] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<string>('All');

  if (!snapshot) {
    return (
      <>
      <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-stone-300 text-center shadow-xs">
        {buddy ? (
          <div className="mb-4 flex justify-center">
            <BuddyAvatar buddy={buddy} size={72} showName />
          </div>
        ) : (
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
        )}
        <h3 className="text-xl font-bold font-serif-display text-slate-900 mb-2">
          Mei Self-Relationship Engine Idle
        </h3>
        <p className="text-sm text-stone-600 max-w-md mx-auto mb-6">
          Write your Evening Field Notes / Rant Box in the Daily Landing section below, then ask the Mei engine to hold up the honest mirror.
        </p>
        {onTriggerDiagnosis && (
          <button
            onClick={onTriggerDiagnosis}
            disabled={isLoading || !hasLatestEntryContent}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning NLP Patterns...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Run Diagnostic on Today's Notes</span>
              </>
            )}
          </button>
        )}
      </div>
        <div className="bg-white rounded-2xl border border-stone-300 shadow-sm mt-6 p-5 sm:p-7">
          <InterpersonalSection />
        </div>
      </>
    );
  }

  // Dimension color tokens
  const bigFiveConfig = [
    {
      key: 'openness',
      name: 'Openness to Experience',
      short: 'Openness',
      letter: 'O',
      val: snapshot.openness,
      color: 'bg-sky-500',
      textColor: 'text-sky-700',
      bgLight: 'bg-sky-50',
      borderColor: 'border-sky-200',
      definition: 'Curiosity, imaginative depth, defiance of conventional scripts, tolerance of ambiguity.'
    },
    {
      key: 'conscientiousness',
      name: 'Conscientiousness',
      short: 'Conscientiousness',
      letter: 'C',
      val: snapshot.conscientiousness,
      color: 'bg-teal-500',
      textColor: 'text-teal-700',
      bgLight: 'bg-teal-50',
      borderColor: 'border-teal-200',
      definition: 'Self-discipline, execution power, structural order, recovery from broken streaks.'
    },
    {
      key: 'extraversion',
      name: 'Extraversion / Energy',
      short: 'Extraversion',
      letter: 'E',
      val: snapshot.extraversion,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
      borderColor: 'border-amber-200',
      definition: 'Social bandwidth, assertiveness in taking up space, vocal presence without apologies.'
    },
    {
      key: 'agreeableness',
      name: 'Agreeableness / Honesty',
      short: 'Agreeableness',
      letter: 'A',
      val: snapshot.agreeableness,
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-200',
      definition: 'Compassion balance, refusal of performative politeness, uncurated truth-telling.'
    },
    {
      key: 'neuroticism',
      name: 'Neuroticism / Stress Spikes',
      short: 'Neuroticism',
      letter: 'N',
      val: snapshot.neuroticism,
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      bgLight: 'bg-rose-50',
      borderColor: 'border-rose-200',
      definition: 'Vulnerability to anxiety, latency in emotional resets, over-thinking friction.'
    }
  ];

  // Burnout status styling
  const burnoutColors = {
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Moderate: 'bg-amber-100 text-amber-800 border-amber-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Critical: 'bg-rose-100 text-rose-800 border-rose-400 font-bold animate-pulse'
  };

  const filteredSubTraits = selectedDimension === 'All'
    ? snapshot.sub_traits
    : snapshot.sub_traits.filter(st => st.dimension.toLowerCase() === selectedDimension.toLowerCase());

  return (
    <section className="bg-white rounded-2xl border border-stone-300 shadow-sm overflow-hidden mb-8">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-stone-900 to-rose-950 text-white p-5 sm:p-6 border-b border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] font-mono-code tracking-widest text-rose-300 uppercase font-bold">
                MEI-STYLE DIAGNOSTIC ENGINE · ACTIVE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-display mt-1 text-cream-canvas">
              Self-Relationship Snapshot
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              NLP analysis of your latest Field Notes & Rants · Snapshot date: <span className="font-mono-code font-bold text-amber-300">{snapshot.snapshot_date}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {buddy && (
              <button onClick={onEditBuddy} title={`${buddy.name} — your AI buddy (tap to reshape)`} className="shrink-0">
                <BuddyAvatar buddy={buddy} size={52} showName />
              </button>
            )}
            {onTriggerDiagnosis && (
              <button
                onClick={onTriggerDiagnosis}
                disabled={isLoading || !hasLatestEntryContent}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                title="Re-run diagnostic analysis using current entry notes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Diagnosing...' : 'Re-Diagnose'}</span>
              </button>
            )}

            <div className="flex items-center space-x-2 bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
              <span className="text-[11px] text-stone-400 font-mono-code">Mood:</span>
              <span className="text-xs font-bold text-amber-300 font-mono-code">
                {snapshot.detected_mood}
              </span>
            </div>
          </div>
        </div>

        {/* Burnout & Stress Radar Bar */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-800 flex items-center justify-between">
            <span className="text-stone-400">Burnout Indicator:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] border font-bold ${burnoutColors[snapshot.burnout_risk] || burnoutColors.Moderate}`}>
              {snapshot.burnout_risk} Risk
            </span>
          </div>

          <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-800 flex items-center justify-between">
            <span className="text-stone-400">Self-Sabotage Alert:</span>
            <span className="text-rose-300 font-semibold truncate max-w-[170px]" title={snapshot.self_sabotage_alert}>
              {snapshot.self_sabotage_alert ? 'Detected' : 'Clear'}
            </span>
          </div>

          <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-800 flex items-center justify-between">
            <span className="text-stone-400">Diagnostic Persona:</span>
            <span className="text-amber-400 font-bold font-mono-code">
              Sassy Mirror (Zero BS)
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-7">
        
        {/* SASSY HONEST MIRROR FEEDBACK (The Centerpiece) */}
        <div className="bg-[#fffdfa] border-2 border-rose-300/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-rose-600 text-white font-mono-code text-[10px] tracking-widest px-3 py-1 font-bold rounded-bl-xl uppercase">
            THE HONEST MIRROR · CALLOUT
          </div>

          <div className="flex items-start space-x-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0 flex items-center justify-center font-bold text-lg">
              🪞
            </div>
            <div>
              <h4 className="font-bold text-slate-900 font-serif-display text-base sm:text-lg">
                What You're Saying vs. What You're Actually Doing
              </h4>
              <p className="text-xs text-rose-800/80 font-mono-code">
                No toxic positivity. Calling out your cognitive contradictions.
              </p>
            </div>
          </div>

          {/* Contradiction Callout Box */}
          {snapshot.contradiction_callout && (
            <div className="bg-rose-50/70 border-l-4 border-rose-600 p-3 rounded-r-lg my-3 text-xs text-rose-950 font-medium">
              <span className="font-bold text-rose-900 uppercase font-mono-code text-[10px] block mb-0.5">Contradiction Detected:</span>
              "{snapshot.contradiction_callout}"
            </div>
          )}

          {/* AI Feedback paragraphs */}
          <div className="text-sm text-slate-800 leading-relaxed space-y-2.5 whitespace-pre-line font-sans border-t border-stone-200/80 pt-3">
            {snapshot.ai_feedback}
          </div>

          {/* Prescribed Micro-Dare */}
          {snapshot.micro_dare && (
            <div className="mt-4 pt-3 border-t border-dashed border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-mono-code font-bold text-[10px] uppercase tracking-wider">
                  Prescribed Micro-Dare
                </span>
                <span className="text-xs font-semibold text-amber-950">
                  {snapshot.micro_dare}
                </span>
              </div>
              <span className="text-[11px] text-amber-800 italic flex items-center gap-1 font-mono-code">
                Boredom=Death <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>

        {/* BIG 5 OCEAN METERS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-serif-display text-slate-900">
                Big 5 (OCEAN) Personality Trait Meters
              </h3>
              <p className="text-xs text-stone-600">
                Calculated dynamically from linguistics, emotional valence, and response latency.
              </p>
            </div>
            <button
              onClick={() => setShowSubTraits(!showSubTraits)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-100 transition-colors"
            >
              <span>{showSubTraits ? 'Hide 30 Sub-Traits' : 'Inspect 30 Sub-Traits'}</span>
              {showSubTraits ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {bigFiveConfig.map((item) => (
              <div
                key={item.key}
                className={`p-4 rounded-xl border ${item.borderColor} ${item.bgLight} transition-all hover:shadow-xs`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center font-display-punch font-bold text-xs text-slate-900 border border-stone-200">
                    {item.letter}
                  </span>
                  <span className="text-sm font-bold font-mono-code text-slate-900">
                    {item.val}%
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate mb-1" title={item.name}>
                  {item.short}
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-stone-200 mb-2">
                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${item.val}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-600 leading-tight line-clamp-2" title={item.definition}>
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 30 SUB-TRAITS EXPANSION DRAWER */}
        {showSubTraits && (
          <div className="bg-stone-50 border border-stone-300 rounded-xl p-5 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-serif-display">
                  Detailed Sub-Trait Breakdown (30 Dimensions)
                </h4>
                <p className="text-xs text-stone-600">
                  Granular facets modeled after the Mei psychological natural language framework.
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono-code">
                {['All', 'Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'].map((dim) => (
                  <button
                    key={dim}
                    onClick={() => setSelectedDimension(dim)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedDimension === dim
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {dim}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubTraits.map((trait, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{trait.name}</span>
                    <span className="font-mono-code font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px]">
                      {trait.score}%
                    </span>
                  </div>
                  <div className="text-[10px] font-mono-code text-stone-400 mb-1.5 uppercase tracking-wider">
                    {trait.dimension}
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full ${
                        trait.dimension === 'Openness' ? 'bg-sky-500' :
                        trait.dimension === 'Conscientiousness' ? 'bg-teal-500' :
                        trait.dimension === 'Extraversion' ? 'bg-amber-500' :
                        trait.dimension === 'Agreeableness' ? 'bg-purple-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${trait.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug">
                    {trait.trait_description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="px-5 sm:px-7 pb-6 sm:pb-7">
        <InterpersonalSection />
      </div>
    </section>
  );
};
