import React from 'react';
import { isPicture } from '../lib/profilePicture';

interface UserAvatarProps {
  /** Stored picture dataURL, or null/undefined when none is set. */
  picture?: string | null;
  /** Name used for the initial fallback and alt text. */
  name: string;
  size?: number;
  className?: string;
}

/**
 * The user's face anywhere it appears: profile picture when set, first
 * initial on a rose circle when not. Never renders a broken image — a
 * missing or junk value falls back to the initial.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ picture, name, size = 40, className = '' }) => {
  const initial = (name || 'O').trim().charAt(0).toUpperCase();
  if (isPicture(picture)) {
    return (
      <img
        src={picture}
        alt={`${name || 'Operator'}'s profile picture`}
        width={size}
        height={size}
        draggable={false}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-label={`${name || 'Operator'} — no profile picture yet`}
      className={`rounded-full bg-gradient-to-br from-rose-600 to-amber-600 text-white font-bold flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initial}
    </span>
  );
};
