import React, { useEffect, useState } from 'react';
import { creatureFor, buddyPortraitSrc, type BuddyProfile } from '../buddy';
import { getBeastStage, onBeastStage } from '../beast';

interface BuddyAvatarProps {
  buddy: BuddyProfile | null;
  /** Beast stage 0–3. When omitted, subscribes live to stage changes. */
  stage?: number;
  size?: number;
  showName?: boolean;
  ringClassName?: string;
}

/**
 * The buddy's portrait — the visual face of the Intent. `beast-stage-N` classes
 * (defined in index.css) progressively push the portrait toward gremlin.
 */
export const BuddyAvatar: React.FC<BuddyAvatarProps> = ({
  buddy, stage: stageProp, size = 56, showName = false, ringClassName = '',
}) => {
  const [liveStage, setLiveStage] = useState(() => getBeastStage());
  useEffect(() => {
    if (stageProp !== undefined) return;
    return onBeastStage(setLiveStage);
  }, [stageProp]);
  const stage = stageProp !== undefined ? stageProp : liveStage;
  const creature = creatureFor(buddy);
  const src = buddy ? buddyPortraitSrc(buddy) : '';
  if (!creature || !buddy || !src) {
    return (
      <div
        className={`rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center ${ringClassName}`}
        style={{ width: size, height: size }}
        aria-label="No buddy yet"
      >
        <span style={{ fontSize: size * 0.45 }}>✦</span>
      </div>
    );
  }
  const tint = buddy.color || '#2da2ee';
  const isCustom = buddy.creatureId === 'custom';
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative rounded-full overflow-hidden beast-stage-${stage} ${ringClassName}`}
        style={{ width: size, height: size, boxShadow: `0 0 0 3px ${tint}, 0 0 18px ${tint}66` }}
      >
        <img
          src={src}
          alt={`${buddy.name} the buddy`}
          className="buddy-portrait w-full h-full object-cover"
          draggable={false}
        />
        {/* Recolor tint wash — species only; uploads keep their own colors */}
        {!isCustom && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: tint, opacity: 0.18, mixBlendMode: 'color' }}
          />
        )}
      </div>
      {showName && (
        <div className="text-center leading-tight">
          <div className="text-xs font-bold" style={{ color: tint }}>{buddy.name}</div>
          <div className="text-[10px] opacity-60">your AI buddy</div>
        </div>
      )}
    </div>
  );
};
