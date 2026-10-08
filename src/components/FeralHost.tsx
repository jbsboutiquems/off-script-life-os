import React, { useEffect, useState } from 'react';
import { Ghost, Sun, MoonStar, Droplets, Sparkles } from 'lucide-react';
import {
  trackInteraction, initShakeListener, tickForgiveness, getFeralStage,
  onFeralStage, onFeralWarning, type FeralWarning,
} from '../feral';
import type { BuddyProfile } from '../buddy';

interface Toast extends FeralWarning {
  id: number;
}

const ICONS: Record<FeralWarning['kind'], React.ReactNode> = {
  heat: <Sun className="w-4 h-4" />,
  sleepy: <MoonStar className="w-4 h-4" />,
  wet: <Droplets className="w-4 h-4" />,
  'stage-up': <Ghost className="w-4 h-4" />,
  soothed: <Sparkles className="w-4 h-4" />,
};

/**
 * Invisible host for the Feral engine: interaction-velocity tracking,
 * shake listener, forgiveness ticks, and warning toasts. Also paints the
 * app-wide feral aura class for the current transformation stage.
 */
export const FeralHost: React.FC<{ buddy: BuddyProfile | null }> = ({ buddy }) => {
  const [stage, setStage] = useState(() => getFeralStage());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [heatShimmer, setHeatShimmer] = useState(false);

  useEffect(() => {
    const pushToast = (w: FeralWarning) => {
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

    const offStage = onFeralStage(setStage);
    const offWarn = onFeralWarning(pushToast);

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
    el.classList.toggle('feral-aura-1', stage >= 1);
    el.classList.toggle('feral-aura-2', stage >= 2);
    el.classList.toggle('feral-aura-3', stage >= 3);
    return () => {
      el.classList.remove('feral-aura-1', 'feral-aura-2', 'feral-aura-3');
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
          </div>
        ))}
      </div>
    </>
  );
};
