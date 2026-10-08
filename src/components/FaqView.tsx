import React, { useState } from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';

interface FaqEntry {
  q: string;
  a: React.ReactNode;
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    q: 'Where can I print photos cheaply for my planner pages?',
    a: (
      <div className="space-y-3">
        <p>Standard 4x6 prints at store kiosks and instant pick-up — prices move around, so check the app before you go:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-stone-300 dark:border-white/20">
                <th className="py-2 pr-3 font-mono-code uppercase">Retailer</th>
                <th className="py-2 pr-3 font-mono-code uppercase">4x6 price</th>
                <th className="py-2 font-mono-code uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-white/10">
              <tr>
                <td className="py-2 pr-3 font-bold">Walmart Photo</td>
                <td className="py-2 pr-3">$0.18</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">Cheapest local instant option; 5x7 runs ~$1.28.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-bold">Walgreens Photo</td>
                <td className="py-2 pr-3">$0.29–$0.44</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">Promos frequently knock 40–50% off.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-bold">CVS Photo</td>
                <td className="py-2 pr-3">$0.42–$0.69</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">5x7 prints run ~$4.99.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-bold">Office Depot / Staples</td>
                <td className="py-2 pr-3">$0.68–$1.19</td>
                <td className="py-2 text-stone-600 dark:text-stone-400">Color copies on standard paper; photo paper costs extra.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-400">
          <li>Ordering through the store app for same-day pickup is usually cheaper than walking up to the kiosk with a USB drive.</li>
          <li>Walgreens and CVS almost always have a promo code on their site — check before you pay full price.</li>
          <li>Online services (Shutterfly, Snapfish, Amazon Photo) go as low as $0.09–$0.15 per print, but shipping makes a single print silly.</li>
        </ul>
        <p className="text-[11px] italic text-stone-500">Prices checked October 2026 — retailers change them whenever they feel like it.</p>
      </div>
    ),
  },
  {
    q: 'Is the app free?',
    a: (
      <p>
        Yes — the app is free. Optional expansions (monthly themes, holiday specials, zodiac, wedding) are paid extras.
        Community play stays free, always: pay for privacy and things, never for play.
      </p>
    ),
  },
  {
    q: 'The app says it is in test mode. What does that mean?',
    a: (
      <p>
        You're using a tester build. Things may break, look weird, or lose your data. That's the point —
        break it, then use the report-a-problem button to tell us what broke so we can fix it before launch.
      </p>
    ),
  },
];

export const FaqView: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2da2ee] to-[#ea4798] text-white flex items-center justify-center border border-stone-800">
            <CircleHelp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold font-serif-display text-xl text-slate-900 dark:text-cream-canvas">FAQ</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Real questions, straight answers. No corporate fog.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {FAQ_ENTRIES.map((entry, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
              >
                <span className="font-bold text-sm text-slate-900 dark:text-cream-canvas">{entry.q}</span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {entry.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
