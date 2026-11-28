import React, { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { pickProfilePicture } from '../lib/profilePicture';
import { UserAvatar } from './UserAvatar';

interface ProfilePicturePickerProps {
  /** Current stored picture dataURL, or null/undefined when none is set. */
  picture?: string | null;
  /** Name for the initial fallback. */
  name: string;
  /** Called with the new picture dataURL, or null when removed. The caller saves it. */
  onChange: (picture: string | null) => void;
  size?: number;
  /** Compact layout (dashboard nudge): avatar + buttons on one row. */
  compact?: boolean;
}

/**
 * Add / change / remove a profile picture. Picking uses the native
 * camera/gallery prompt in the app and a file input on web; the image is
 * square-cropped to 256px before it ever leaves this component, so the
 * stored value stays small. Removing is one tap and saves immediately via
 * onChange(null) — the caller clears it server-side.
 */
export const ProfilePicturePicker: React.FC<ProfilePicturePickerProps> = ({
  picture,
  name,
  onChange,
  size = 88,
  compact = false,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await pickProfilePicture();
      if (next) onChange(next);
    } catch {
      setError('Could not use that photo — try a different one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-3' : 'flex items-center gap-4'}>
      <UserAvatar picture={picture} name={name} size={size} className="border-2 border-stone-800 dark:border-white/20 shadow-sm" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-stone-950 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            {busy ? 'Working…' : picture ? 'Change photo' : 'Add photo'}
          </button>
          {picture && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-600 underline disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
          {picture
            ? 'Stored with your account — it survives app updates and follows you to a new phone.'
            : 'Square-cropped, kept small. Optional — skip it and your initial shows instead.'}
        </p>
        {error && <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mt-1">{error}</p>}
      </div>
    </div>
  );
};
