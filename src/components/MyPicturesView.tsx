import React, { useMemo, useState } from 'react';
import { ArrowLeft, Images, Trash2, X } from 'lucide-react';
import type { UserProfile, UserUpload } from '../types';
import type { BuddyProfile } from '../buddy';
import { isPicture } from '../lib/profilePicture';
import { ProfilePicturePicker } from './ProfilePicturePicker';

interface GalleryItem {
  id: string;
  kind: 'profile' | 'buddy' | 'other';
  label: string;
  detail: string;
  dataUrl: string;
}

interface MyPicturesViewProps {
  user: UserProfile;
  /** App's buddy state (for the buddy picture + clearing it). */
  buddy?: BuddyProfile | null;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
  onSaveBuddy: (buddy: BuddyProfile) => void;
  onBack: () => void;
  onOpenProfile: () => void;
}

/**
 * My pictures — the one home for every picture the user has uploaded.
 *
 * Everything here is pulled from the server user record (the profile
 * picture, the buddy's custom photo, and any standalone uploads), never
 * from localStorage alone — so pictures survive app updates, storage
 * clears, and logging in on another device. Tapping a thumbnail opens it
 * full-size; deleting removes it server-side too, and clears the
 * profile/buddy reference when the deleted picture was in use.
 */
export const MyPicturesView: React.FC<MyPicturesViewProps> = ({
  user,
  buddy,
  onSaveProfile,
  onSaveBuddy,
  onBack,
  onOpenProfile,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const items: GalleryItem[] = useMemo(() => {
    const list: GalleryItem[] = [];
    if (isPicture(user.profile_picture)) {
      list.push({
        id: 'profile',
        kind: 'profile',
        label: 'Profile picture',
        detail: 'Shows in the header and on your public profile.',
        dataUrl: user.profile_picture as string,
      });
    }
    const buddyPic = (user as any).buddy?.customImage ?? buddy?.customImage;
    if (isPicture(buddyPic)) {
      list.push({
        id: 'buddy',
        kind: 'buddy',
        label: `Buddy picture — ${buddy?.name || (user as any).buddy?.name || 'your buddy'}`,
        detail: 'The custom photo for your AI buddy.',
        dataUrl: buddyPic as string,
      });
    }
    const uploads: UserUpload[] = Array.isArray((user as any).uploads) ? (user as any).uploads : [];
    for (const u of uploads) {
      if (isPicture(u.dataUrl)) {
        list.push({
          id: `upload:${u.id}`,
          kind: 'other',
          label: u.label || 'Uploaded picture',
          detail: u.created_at ? `Saved ${new Date(u.created_at).toLocaleDateString()}.` : 'Saved to your account.',
          dataUrl: u.dataUrl,
        });
      }
    }
    return list;
  }, [user, buddy]);

  const selected = items.find((i) => i.id === selectedId) || null;

  const deleteItem = (item: GalleryItem) => {
    if (confirmingId !== item.id) {
      setConfirmingId(item.id);
      return;
    }
    setConfirmingId(null);
    setSelectedId(null);
    if (item.kind === 'profile') {
      // Clearing server-side: null merges over the stored picture.
      onSaveProfile({ profile_picture: null });
    } else if (item.kind === 'buddy') {
      const current = buddy || (user as any).buddy;
      if (current) onSaveBuddy({ ...current, customImage: null });
    } else {
      const id = item.id.replace('upload:', '');
      const uploads: UserUpload[] = Array.isArray((user as any).uploads) ? (user as any).uploads : [];
      onSaveProfile({ uploads: uploads.filter((u) => u.id !== id) });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono-code uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-teal-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            MY PICTURES
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono-code">
            {items.length ? `${items.length} saved` : 'NOTHING YET'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-1">
          Every picture you've uploaded
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
          Profile picture, buddy photo, and anything else you upload — all kept on your account,
          so they survive app updates and follow you to a new phone.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-[#02142e] rounded-2xl border border-dashed border-stone-300 dark:border-white/15 p-8 text-center space-y-4">
          <Images className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600" />
          <p className="text-sm font-bold text-slate-900 dark:text-cream-canvas">
            No pictures yet — this spot is waiting for you.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Add a profile picture and it'll live here, next to your buddy's photo and anything
            else you upload. Nothing here is public unless you put it on your public profile.
          </p>
          <div className="flex justify-center">
            <ProfilePicturePicker
              picture={user.profile_picture}
              name={user.khaos_name || 'Operator'}
              onChange={(picture) => onSaveProfile({ profile_picture: picture })}
              size={72}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="group text-left bg-white dark:bg-[#02142e] rounded-2xl border border-stone-300 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all"
            >
              <span className="block aspect-square overflow-hidden">
                <img
                  src={item.dataUrl}
                  alt={item.label}
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                />
              </span>
              <span className="block p-3">
                <span className="block text-xs font-bold text-slate-900 dark:text-cream-canvas truncate">
                  {item.label}
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {item.kind === 'profile' ? 'In use as your profile picture' : item.kind === 'buddy' ? "In use as your buddy's photo" : item.detail}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Full-size view */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => { setSelectedId(null); setConfirmingId(null); }}
          role="dialog"
          aria-label={`${selected.label} — full size`}
        >
          <div
            className="bg-white dark:bg-[#02142e] rounded-2xl max-w-lg w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-cream-canvas">{selected.label}</h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{selected.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedId(null); setConfirmingId(null); }}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selected.dataUrl}
              alt={selected.label}
              draggable={false}
              className="w-full max-h-[65vh] object-contain rounded-xl bg-stone-100 dark:bg-white/5"
            />
            <div className="flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={onOpenProfile}
                className="text-xs font-bold text-rose-700 hover:text-rose-600 underline"
              >
                {selected.kind === 'profile' ? 'Change it on your profile →' : 'Go to your profile →'}
              </button>
              <button
                type="button"
                onClick={() => deleteItem(selected)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                  confirmingId === selected.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmingId === selected.id ? 'Tap again to delete' : 'Delete picture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
