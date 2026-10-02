import React, { useState, useEffect, useRef } from 'react';
import { DailyEntry, UserProfile, ChaosHoliday } from '../types';
import { getHolidayForDate } from '../data/holidays';
import { Sun, Compass, Moon, Sparkles, CheckCircle2, Circle, Flame, AlertCircle, Save, ArrowLeft, ArrowRight, Wand2, Mic, MicOff, Radio, Volume2, Printer, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MorningMantraGenerator } from './MorningMantraGenerator';

interface DailyOSViewProps {
  entry: DailyEntry;
  onSaveEntry: (entry: Partial<DailyEntry>) => void;
  onRunDiagnostic: () => void;
  isDiagnosing: boolean;
  user: UserProfile;
  currentDate: string;
  onDateChange: (date: string) => void;
  onOpenStickers: () => void;
  onOpenShare?: (context?: 'daily' | 'identity' | 'mantra' | 'antigoals' | 'diagnostic') => void;
}

export const DailyOSView: React.FC<DailyOSViewProps> = ({
  entry,
  onSaveEntry,
  onRunDiagnostic,
  isDiagnosing,
  user,
  currentDate,
  onDateChange,
  onOpenStickers,
  onOpenShare
}) => {
  const [morningIntention, setMorningIntention] = useState(entry.morning_intention || '');
  const [todayIAm, setTodayIAm] = useState(entry.today_i_am || '');
  const [anchorAnswer, setAnchorAnswer] = useState(entry.anchor_question_answer || '');
  const [priority0, setPriority0] = useState(entry.priorities?.[0] || '');
  const [priority1, setPriority1] = useState(entry.priorities?.[1] || '');
  const [priority2, setPriority2] = useState(entry.priorities?.[2] || '');
  const [middayCheckin, setMiddayCheckin] = useState(entry.midday_checkin || '');
  const [microDareCompleted, setMicroDareCompleted] = useState(entry.micro_dare_completed || false);
  const [microDareNotes, setMicroDareNotes] = useState(entry.micro_dare_notes || '');
  const [eveningNotes, setEveningNotes] = useState(entry.evening_notes || '');
  const [chaosScore, setChaosScore] = useState(entry.chaos_score || 5);
  const [showHolidayMeaning, setShowHolidayMeaning] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Web Speech API Voice-to-Text State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Cleanup speech recognition on unmount or date shift
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [currentDate]);

  const toggleVoiceToText = () => {
    if (!isSpeechSupported) {
      setSpeechError('Web Speech API is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping speech recognition:', e);
        }
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    setSpeechError(null);
    setInterimTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (finalChunk) {
          setEveningNotes((prev) => {
            const trimmed = prev.trim();
            const chunk = finalChunk.trim();
            if (!trimmed) return chunk;
            return `${trimmed} ${chunk}`;
          });
        }

        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          return;
        } else if (event.error === 'audio-capture') {
          setSpeechError('No microphone detected. Please check your audio hardware.');
        } else if (event.error === 'network') {
          setSpeechError('Speech recognition network communication error.');
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError(err.message || 'Could not initiate microphone.');
      setIsListening(false);
    }
  };

  // Sync state when entry changes (e.g. user toggled date)
  useEffect(() => {
    setMorningIntention(entry.morning_intention || '');
    setTodayIAm(entry.today_i_am || '');
    setAnchorAnswer(entry.anchor_question_answer || '');
    setPriority0(entry.priorities?.[0] || '');
    setPriority1(entry.priorities?.[1] || '');
    setPriority2(entry.priorities?.[2] || '');
    setMiddayCheckin(entry.midday_checkin || '');
    setMicroDareCompleted(entry.micro_dare_completed || false);
    setMicroDareNotes(entry.micro_dare_notes || '');
    setEveningNotes(entry.evening_notes || '');
    setChaosScore(entry.chaos_score || 5);
  }, [entry]);

  const holiday: ChaosHoliday = getHolidayForDate(currentDate);

  const handleSave = () => {
    onSaveEntry({
      morning_intention: morningIntention,
      today_i_am: todayIAm,
      anchor_question_answer: anchorAnswer,
      priorities: [priority0, priority1, priority2],
      midday_checkin: middayCheckin,
      micro_dare_completed: microDareCompleted,
      micro_dare_notes: microDareNotes,
      evening_notes: eveningNotes,
      chaos_score: chaosScore,
      holiday_title: holiday.title,
      holiday_adventure: holiday.adventures[0] || ''
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleToggleMicroDare = () => {
    const nextVal = !microDareCompleted;
    setMicroDareCompleted(nextVal);
    if (nextVal) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const wordCount = eveningNotes.trim().split(/\s+/).filter(Boolean).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Print-Only Document Header */}
      <div className="hidden print:block pb-3 mb-2 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-rose-700">
              LIFE OS · OFF*SCRIPT 2027 · DAILY LIVING FLIGHT LOG
            </span>
            <h1 className="text-2xl font-bold font-serif-display text-slate-900 mt-0.5">
              {new Date(currentDate + "T00:00:00").toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h1>
            <p className="text-xs text-stone-600 font-mono-code">
              Pilot: {user.chaos_name} · Word of the Year: "{user.word_of_the_year}"
            </p>
          </div>
          <div className="text-right font-mono-code text-xs space-y-1">
            <div className="font-bold text-slate-900 px-2.5 py-0.5 bg-amber-100 border border-amber-300 rounded inline-block">
              SLOGAN: "{user.slogan || 'Boredom=Death'}"
            </div>
            <div className="text-[11px] text-stone-600">
              Chaos Rating: <strong className="text-rose-700">{chaosScore} / 10</strong> · Unofficial Holiday: {holiday.title}
            </div>
          </div>
        </div>
      </div>

      {/* Date & Holiday Banner */}
      <div className="bg-[#faf7f0] border-2 border-stone-800 rounded-2xl p-5 shadow-sm relative overflow-hidden print:p-4 print:border">
        {/* Background watermark */}
        <div className="absolute -right-6 -bottom-8 select-none pointer-events-none opacity-5 font-display-punch text-8xl font-black print:hidden">
          OFF*SCRIPT
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="bg-rose-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                Daily Living Flight Log
              </span>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                SLOGAN: "{user.slogan || 'Boredom=Death'}"
              </span>
              <span className="text-xs text-stone-500 font-mono-code">
                Day {(new Date(currentDate).getTime() - new Date("2027-01-01").getTime()) / (1000 * 3600 * 24) + 1 > 0
                  ? Math.floor((new Date(currentDate).getTime() - new Date("2027-01-01").getTime()) / (1000 * 3600 * 24) + 1)
                  : 1} of 365
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
              {new Date(currentDate + "T00:00:00").toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                ✦ Unofficial Holiday: {holiday.title}
              </span>
              <span className="text-xs text-stone-600 hidden md:inline">"{holiday.tagline}"</span>
              <button
                type="button"
                onClick={() => setShowHolidayMeaning((s) => !s)}
                className="text-[11px] font-mono-code font-bold text-sky-700 hover:text-sky-900 underline underline-offset-2 print:hidden"
                title="What does this holiday mean?"
              >
                {showHolidayMeaning ? 'hide explainer ▲' : 'what even is this? ▼'}
              </button>
            </div>
            {showHolidayMeaning && (
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-stone-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="font-bold text-amber-900 font-mono-code text-[10px] uppercase tracking-wider block mb-0.5">What it means</span>
                {holiday.meaning}
              </p>
            )}
          </div>

          {/* Quick Date Stepper & Save & Print */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors print:hidden"
              title="Previous Day"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="p-2 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors print:hidden"
              title="Next Day"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="print-daily-os-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold font-mono-code rounded-lg shadow-xs transition-colors print:hidden"
              title="Print Daily Flight Log & Diagnostic Insights to structured PDF"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>Print / PDF</span>
            </button>
            {onOpenShare && (
              <button
                type="button"
                id="share-daily-os-btn"
                onClick={() => onOpenShare('daily')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold font-mono-code rounded-lg shadow-xs transition-colors print:hidden"
                title="Share Today's Flight Log & Chaos Rating to Social Media"
              >
                <Share2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Share Spread</span>
              </button>
            )}
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors print:hidden"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavedNotice ? 'Saved!' : 'Save Day'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-PART FLIGHT SYSTEM: LAUNCH, ORBIT, LANDING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. LAUNCH (MORNING INTENTION & STANCE) */}
        <div className="bg-white rounded-2xl border border-stone-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-display-punch tracking-tight uppercase">
                    01 · The Launch
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono-code">Morning Stance & Priorities</p>
                </div>
              </div>
              <span className="text-[10px] font-mono-code bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
                A.M.
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Morning Mantra Generator (Edgy, Non-toxic Affirmation Engine) */}
              <MorningMantraGenerator
                onAdoptAsIntention={(text) => setMorningIntention(text)}
                onShare={() => onOpenShare?.('mantra')}
                wordOfTheYear={user.word_of_the_year}
              />

              {/* Morning Intention */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Morning Intention <span className="font-normal text-stone-500 font-mono-code">(one sentence energy)</span>:
                </label>
                <input
                  type="text"
                  value={morningIntention}
                  onChange={(e) => setMorningIntention(e.target.value)}
                  placeholder="e.g. Today I am choosing steadiness over optimization."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-rose-500 bg-stone-50/50"
                />
              </div>

              {/* Today I Am */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Today I Am <span className="font-normal text-stone-500 font-mono-code">(stance/persona)</span>:
                </label>
                <input
                  type="text"
                  value={todayIAm}
                  onChange={(e) => setTodayIAm(e.target.value)}
                  placeholder="e.g. An unhurried architect of my own space."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-rose-500 bg-stone-50/50"
                />
              </div>

              {/* Anchor Question from Holiday */}
              <div className="bg-amber-50/70 border-l-4 border-amber-500 p-3 rounded-r-lg">
                <span className="text-[10px] uppercase font-mono-code font-bold text-amber-900 block mb-0.5">
                  Daily Anchor Question:
                </span>
                <p className="text-xs font-semibold text-amber-950 mb-1.5 font-serif-display">
                  "{holiday.anchorQuestion}"
                </p>
                <div className="hidden print:block p-2 text-xs border border-amber-300 rounded bg-white font-mono-code text-amber-950 whitespace-pre-wrap min-h-[36px]">
                  {anchorAnswer || '—'}
                </div>
                <textarea
                  value={anchorAnswer}
                  onChange={(e) => setAnchorAnswer(e.target.value)}
                  placeholder="Sit with it. Let it follow you through the day..."
                  rows={2}
                  className="w-full p-2 text-xs border border-amber-300 rounded bg-white focus:outline-amber-600 print:hidden"
                />
              </div>

              {/* Strict Top 3 Priorities */}
              <div>
                <label className="block text-stone-700 font-bold mb-1 flex items-center justify-between">
                  <span>The Focus (Top 3 Priorities strictly):</span>
                  <span className="text-[10px] text-stone-400 font-normal">Scarcity of focus is a gift</span>
                </label>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono-code font-bold text-stone-400 w-4">1.</span>
                    <input
                      type="text"
                      value={priority0}
                      onChange={(e) => setPriority0(e.target.value)}
                      placeholder="Priority 1"
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-md bg-stone-50/40 focus:outline-rose-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono-code font-bold text-stone-400 w-4">2.</span>
                    <input
                      type="text"
                      value={priority1}
                      onChange={(e) => setPriority1(e.target.value)}
                      placeholder="Priority 2"
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-md bg-stone-50/40 focus:outline-rose-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono-code font-bold text-stone-400 w-4">3.</span>
                    <input
                      type="text"
                      value={priority2}
                      onChange={(e) => setPriority2(e.target.value)}
                      placeholder="Priority 3"
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-md bg-stone-50/40 focus:outline-rose-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Morning anchor locked</span>
            <span className="font-mono-code text-amber-700">08:00 AM READY</span>
          </div>
        </div>

        {/* 2. ORBIT (MIDDAY CHECK-IN & MICRO-DARE ADVENTURE) */}
        <div className="bg-white rounded-2xl border border-stone-300 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-display-punch tracking-tight uppercase">
                    02 · The Orbit
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono-code">Midday Check-In & Adventure</p>
                </div>
              </div>
              <span className="text-[10px] font-mono-code bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-bold border border-sky-200">
                NOON
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Midday Check-in prompt */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Midday Check-in <span className="font-normal text-stone-500 font-mono-code">(How's it actually going, right now?)</span>:
                </label>
                <div className="hidden print:block p-2 text-xs border border-stone-300 rounded-lg bg-stone-50 font-mono-code text-slate-900 whitespace-pre-wrap min-h-[40px]">
                  {middayCheckin || '—'}
                </div>
                <textarea
                  value={middayCheckin}
                  onChange={(e) => setMiddayCheckin(e.target.value)}
                  placeholder="Not how should it be going. Not how you'll report it later. How is it actually going?"
                  rows={3}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-sky-500 bg-stone-50/50 print:hidden"
                />
              </div>

              {/* Unofficial Holiday Daily Adventure / Micro-Dare */}
              <div className="border border-sky-200 bg-sky-50/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-mono-code font-bold text-sky-800">
                      Daily Living Adventure
                    </span>
                    <span className="text-[9px] font-mono-code bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                      "Boredom=Death" Antidote
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-code text-stone-500">Law-Abiding · Free to $20 Max</span>
                </div>

                <div 
                  onClick={handleToggleMicroDare}
                  className="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-sky-200 cursor-pointer hover:border-sky-400 transition-colors"
                >
                  <button type="button" className="mt-0.5 text-sky-600 focus:outline-none">
                    {microDareCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                  <div className="text-xs">
                    <p className={`font-semibold ${microDareCompleted ? 'line-through text-stone-500' : 'text-slate-900'}`}>
                      {holiday.adventures[0] || "Take an unscripted detour and notice three unexpected things."}
                    </p>
                  </div>
                </div>

                {holiday.whoIsThisSoul[0] && (
                  <p className="text-[11px] text-sky-950 italic pt-1">
                    "{holiday.whoIsThisSoul[0]}"
                  </p>
                )}

                <div>
                  <input
                    type="text"
                    value={microDareNotes}
                    onChange={(e) => setMicroDareNotes(e.target.value)}
                    placeholder="Adventure debrief or artifact note..."
                    className="w-full px-2.5 py-1.5 text-xs border border-sky-200 rounded-md bg-white focus:outline-sky-500"
                  />
                </div>
              </div>

              {/* Quick Stickers Button */}
              <div className="pt-2 flex items-center justify-between print:hidden">
                <span className="text-stone-500 text-[11px]">Decorate your spread:</span>
                <button
                  onClick={onOpenStickers}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold font-mono-code underline"
                >
                  + Open Digital Stickers Sheet
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Midday pause taken</span>
            <span className="font-mono-code text-sky-700">1:00 PM CHECK</span>
          </div>
        </div>

        {/* 3. LANDING (EVENING FIELD NOTES / RANT BOX -> MEI ENGINE FEEDER) */}
        <div className="bg-[#fffdf9] rounded-2xl border-2 border-rose-300 p-5 shadow-xs flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 bg-rose-600 text-white font-mono-code text-[10px] tracking-widest px-3 py-1 font-bold rounded-bl-xl uppercase">
            MEI ENGINE INPUT
          </div>

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-display-punch tracking-tight uppercase">
                    03 · The Landing
                  </h3>
                  <p className="text-[11px] text-rose-700 font-mono-code">Evening Field Notes & Rant Box</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-stone-800 font-bold flex items-center gap-1.5">
                    <span>Field Notes / The Rant Box:</span>
                    <span className="text-[10px] font-mono-code font-normal text-stone-400">
                      ({wordCount} words)
                    </span>
                  </label>
                  <div className="flex items-center space-x-2 print:hidden">
                    <button
                      type="button"
                      id="voice-to-text-rant-btn"
                      onClick={toggleVoiceToText}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-bold flex items-center space-x-1.5 transition-all shadow-2xs border ${
                        isListening
                          ? 'bg-rose-600 text-white border-rose-700 animate-pulse ring-2 ring-rose-300'
                          : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400'
                      }`}
                      title={
                        isListening
                          ? 'Click to stop voice dictation'
                          : isSpeechSupported
                          ? 'Dictate your daily rant hands-free using Web Speech API'
                          : 'Web Speech API is not supported in this browser'
                      }
                    >
                      {isListening ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          <MicOff className="w-3 h-3 text-white" />
                          <span>Stop Dictating</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-rose-600" />
                          <span>Voice-to-Text</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Raw & Uncurated
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 italic mb-2">
                  Write, draw, spiral, rant, dream, map. Where the armor comes off. Feeds directly into the personality diagnostic engine.
                </p>

                {/* Real-time Voice Transcription Banner */}
                {isListening && (
                  <div className="mb-2 p-2.5 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-300 rounded-xl text-xs font-mono-code flex items-start space-x-2 shadow-2xs print:hidden">
                    <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">
                          Listening to your rant...
                        </span>
                        <span className="text-[9px] text-rose-500 font-bold animate-pulse">
                          ● REC LIVE
                        </span>
                      </div>
                      {interimTranscript ? (
                        <p className="text-stone-800 text-[11px] mt-0.5 italic break-words">
                          "{interimTranscript}..."
                        </p>
                      ) : (
                        <p className="text-stone-400 text-[11px] mt-0.5 italic">
                          Speak naturally. Words will stream directly into the rant box...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Speech Error Notice */}
                {speechError && (
                  <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-center justify-between print:hidden">
                    <div className="flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{speechError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpeechError(null)}
                      className="text-stone-500 hover:text-stone-800 font-bold px-1.5 py-0.5 text-xs font-mono-code"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Print-friendly expanded Evening Notes */}
                <div className="hidden print:block p-3 text-xs border border-rose-200 rounded-xl bg-white font-mono-code text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                  {eveningNotes || '—'}
                </div>

                <textarea
                  value={eveningNotes}
                  onChange={(e) => setEveningNotes(e.target.value)}
                  placeholder="Dump everything here. Contradictions, frustrations, secret wins, things you resented doing, where you felt fake, what you're actually tired of..."
                  rows={6}
                  className="w-full p-3 text-xs border border-rose-200 rounded-xl focus:outline-rose-500 bg-white font-mono-code text-slate-800 leading-relaxed shadow-inner print:hidden"
                />
              </div>

              {/* Chaos Level Scale Slider (1-10) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-800 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Daily Chaos Level (1–10):</span>
                  </label>
                  <span className="font-mono-code font-bold text-sm text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {chaosScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={chaosScore}
                  onChange={(e) => setChaosScore(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer print:hidden"
                />
                <div className="hidden print:block w-full bg-stone-100 rounded-full h-2.5 border border-stone-300 overflow-hidden mt-1">
                  <div
                    className="bg-rose-600 h-full rounded-full"
                    style={{ width: `${chaosScore * 10}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-400 font-mono-code mt-0.5 print:hidden">
                  <span>1: Running on fumes</span>
                  <span>5: Balanced chaos</span>
                  <span>10: Truly unhinged</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Mei Diagnostic Button */}
          <div className="mt-5 pt-3 border-t border-rose-200 print:hidden">
            <button
              onClick={() => {
                handleSave();
                onRunDiagnostic();
              }}
              disabled={isDiagnosing || wordCount < 3}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isDiagnosing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Extracting Big 5 & Contradictions...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Analyze Relationship With Self (Mei Engine)</span>
                </>
              )}
            </button>
            {wordCount < 3 && (
              <p className="text-[10px] text-stone-400 text-center mt-1">
                Type a few thoughts in the Rant Box to activate the honest mirror.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* QUICK INSPIRATION / OPERATING MANUAL QUOTE */}
      <div className="bg-[#f0ece1] border border-stone-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-700 print:hidden">
        <div className="flex items-center space-x-2">
          <span className="font-mono-code font-bold text-rose-700 uppercase tracking-widest text-[11px]">
            THE MANIFESTO:
          </span>
          <span className="italic font-serif-display text-slate-800">
            "Build it for who you actually are. Not who you planned to be in January. Not who the algorithm wants you to be."
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold font-mono-code text-stone-700 hover:text-stone-900 underline whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
          <button
            onClick={handleSave}
            className="text-xs font-bold text-stone-900 underline hover:text-rose-600 whitespace-nowrap"
          >
            Save All Sections
          </button>
        </div>
      </div>
    </div>
  );
};
