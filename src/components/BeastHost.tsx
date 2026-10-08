import React, { useEffect, useState } from 'react';
import { Ghost, Sun, MoonStar, Droplets, Sparkles } from 'lucide-react';
import {
  trackInteraction, initShakeListener, tickForgiveness, getBeastStage,
  onBeastStage, onBeastWarning, type BeastWarning,
} from '../beast';
import type { BuddyProfile } from '../buddy';

interface Toast extends BeastWarning {
  id: number;
}

const ICONS: Record<BeastWarning['kind'], React.ReactNode> = {
  heat: <Sun className="w-4 h-4" />,
  sleepy: <MoonStar className="w-4 h-4" />,
  wet: <Droplets className="w-4 h-4" />,
  'stage-up': <Ghost className="w-4 h-4" />,
  soothed: <Sparkles className="w-4 h-4" />,
};

/**
 * Invisible host for the Beast engine: interaction-velocity tracking,
 * shake listener, forgiveness ticks, and warning toasts. Also paints the
 * app-wide beast aura class for the current transformation stage.
 */
export const BeastHost: React.FC<{ buddy: BuddyProfile | null }> = ({ buddy }) => {
  const [stage, setStage] = useState(() => getBeastStage());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [heatShimmer, setHeatShimmer] = useState(false);

  useEffect(() => {
    const pushToast = (w: BeastWarning) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev.slice(-2), { ...w, id }]);
      if (w.kind === 'heat') {
        setHeatShimmer(true);
        window.setTimeout(() => setHeatShimmer(false), 4000);
      }
      window.setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 6000);
    };

    const offStage = onBeastStage(setStage);
    const offWarn = onBeastWarning(pushToast);

    const onPointer = () => trackInteraction();
    const onNav = () => trackInteraction();
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('hashchange', onNav);

    initShakeListener();
    tickForgiveness();
    const tick = window.setInterval(() => tickForgiveness(), 60_000);

    return () => {
      offStage();
      offWarn();
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('hashchange', onNav);
      window.clearInterval(tick);
    };
  }, []);

  // App-wide aura class follows the transformation stage.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('beast-aura-1', stage >= 1);
    el.classList.toggle('beast-aura-2', stage >= 2);
    el.classList.toggle('beast-aura-3', stage >= 3);
    return () => {
      el.classList.remove('beast-aura-1', 'beast-aura-2', 'beast-aura-3');
    };
  }, [stage]);

  return (
    <>
      {heatShimmer && <div className="heat-shimmer" aria-hidden="true" />}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white shadow-xl border border-white/20"
            style={{
              background: t.kind === 'stage-up' && t.stage >= 3
                ? 'linear-gradient(135deg, #3a5a12, #0c1206)'
                : 'linear-gradient(135deg, #1b3a6b, #0b1c33)',
            }}
          >
            <span className={t.kind === 'heat' ? 'text-amber-300' : t.kind === 'wet' ? 'text-sky-300' : 'text-lime-300'}>
              {ICONS[t.kind]}
            </span>
            <span>
              {t.message}
              {buddy && t.kind === 'stage-up' && t.stage > 0 && (
                <span className="opacity-70"> — {buddy.name} is changing…</span>
              )}
            </span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run();
                  setToasts(prev => prev.filter(x => x.id !== t.id));
                }}
                className="ml-1 shrink-0 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-[#b6ff2e] text-[#0c1206] hover:brightness-110 transition"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
