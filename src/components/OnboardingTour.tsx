import React, { useState } from 'react';
import { DoorOpen, Compass, Star, Trophy, ArrowRight, ArrowLeft, X } from 'lucide-react';

interface OnboardingTourProps {
  onDone: (dontShowAgain: boolean) => void;
}

const STEPS = [
  {
    icon: DoorOpen,
    title: 'Welcome to the cockpit',
    body: 'Every room in this app is a door. Open one when you need it, ignore the rest. No streak guilt, no optimization theater — structure without the cage. This tour is 4 steps and skippable, like everything else here.',
  },
  {
    icon: Compass,
    title: 'The Daily Flight Log is home base',
    body: 'Log your launch, orbit, and landing. Do the micro-dare. Each log earns Chaos Points and feeds your streak — consecutive days of showing up, computed from your actual entries, so back-filling a missed day heals it. No shame spirals, just field notes.',
  },
  {
    icon: Star,
    title: 'The Cosmic Corner reads you (lovingly)',
    body: 'A daily horoscope written by the app, not the stars — plus a playful natal chart drawn from your birthday. Flip the RUDE / NICE toggle to pick your poison: warm encouragement or spicy tough-love. Both are entertainment. Neither is fate.',
  },
  {
    icon: Trophy,
    title: 'The rest of the ship',
    body: 'Big 6 Goals (six slots, no more). The Chaos Wall — scream into the void, together. A private Inbox for your people. Reminders that nudge instead of nag. Global search when you lose a brilliant 2am note. One-tap export when you want your data back. Poke around — you can\'t break anything a backup can\'t fix.',
  },
];

/**
 * First-run walkthrough. Shown once per user (persisted on the profile),
 * skippable at any point, with a "don't show again" that actually sticks.
 */
export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(true);
  const last = step === STEPS.length - 1;
  const { icon: Icon, title, body } = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between">
          <span className="bg-indigo-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            First flight · {step + 1} of {STEPS.length}
          </span>
          <button
            onClick={() => onDone(dontShow)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10"
            title="Skip the tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-600 text-white flex items-center justify-center border-2 border-stone-800 shadow-sm">
            <Icon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-display-punch text-slate-900 dark:text-cream-canvas">{title}</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{body}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-indigo-600' : 'w-2 bg-stone-300 dark:bg-white/20 hover:bg-stone-400'}`}
              title={`Step ${i + 1}`}
            />
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-500 dark:text-stone-400">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          Don't show this again
        </label>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono-code uppercase tracking-wider bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/20 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            onClick={() => onDone(dontShow)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono-code uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          >
            Skip
          </button>
          <button
            onClick={() => (last ? onDone(dontShow) : setStep(step + 1))}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono-code uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-sm flex items-center justify-center gap-1.5"
          >
            {last ? 'Start flying' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
