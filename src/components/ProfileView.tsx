/**
 * Profile — what others see (Amber, 2026-10-29).
 *
 * This replaces Identity Base as the profile entry point. Identity Base
 * mixed public persona with private account bits; it is no longer the
 * profile. The preview card below is the public persona only: chosen name,
 * word of the year, and slogan — the user-chosen words/tags that show
 * publicly by default. Birthday / birth time / birthplace are edited here
 * because they power the Cosmic Corner, but they are NOT in the public
 * preview and must never be rendered as public.
 *
 * Private account settings (email, verification, password, recovery code,
 * phone) live in SettingsView, not here.
 */
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Save, Sparkles, Images } from 'lucide-react';
import { ProfilePicturePicker } from './ProfilePicturePicker';
import { UserAvatar } from './UserAvatar';

interface ProfileViewProps {
  user: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
  onOpenSettings: () => void;
  onOpenPictures: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onSaveProfile, onOpenSettings, onOpenPictures }) => {
  const [khaosName, setKhaosName] = useState(user.khaos_name || '');
  const [wordOfYear, setWordOfYear] = useState(user.word_of_the_year || '');
  const [slogan, setSlogan] = useState(user.slogan || 'Boredom=Death');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [birthTime, setBirthTime] = useState(user.birth_time || '');
  const [birthplace, setBirthplace] = useState(user.birthplace || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      khaos_name: khaosName.trim(),
      word_of_the_year: wordOfYear.trim().toUpperCase(),
      slogan: slogan.trim(),
      birthday: birthday.trim(),
      birth_time: birthTime.trim(),
      birthplace: birthplace.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-rose-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            PUBLIC PROFILE
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono-code">WHAT OTHERS SEE</span>
        </div>
        <div className="flex items-start gap-4 mt-1">
          <UserAvatar picture={user.profile_picture} name={user.khaos_name || 'Operator'} size={64} className="border-2 border-stone-800 dark:border-white/20 shadow-sm" />
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
              {user.khaos_name || 'Operator'}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              Word of the year: <strong className="uppercase">{user.word_of_the_year || '—'}</strong>
              {' '}· Slogan: <strong>{user.slogan || 'Boredom=Death'}</strong>
            </p>
          </div>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
          This preview is the public persona only. Birthday, email, password,
          recovery code and phone are never shown here — they live in Settings.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={onOpenPictures}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-600 underline"
          >
            <Images className="w-3.5 h-3.5" /> My pictures →
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs font-bold text-rose-700 hover:text-rose-600 underline"
          >
            Go to Settings (private account) →
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#02142e] rounded-2xl border border-stone-300 dark:border-white/10 p-6 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-cream-canvas font-display-punch uppercase flex items-center gap-2">
          <User className="w-4 h-4 text-rose-600" /> Profile picture
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
          This is the face on your public profile and in the header. Saved to your account,
          so it survives app updates and follows you to a new phone.
        </p>
        <ProfilePicturePicker
          picture={user.profile_picture}
          name={user.khaos_name || 'Operator'}
          onChange={(picture) => onSaveProfile({ profile_picture: picture })}
        />
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#02142e] rounded-2xl border border-stone-300 dark:border-white/10 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-cream-canvas font-display-punch uppercase flex items-center gap-2">
          <User className="w-4 h-4 text-rose-600" /> Edit your public persona
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Khaos Alias / Chosen Name:</label>
            <input type="text" value={khaosName} onChange={(e) => setKhaosName(e.target.value)} required
              className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-rose-500 font-semibold" />
          </div>
          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Word of the Year (one defiant word):</label>
            <input type="text" value={wordOfYear} onChange={(e) => setWordOfYear(e.target.value)} required
              className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-rose-500 font-mono-code uppercase font-bold text-rose-700" />
          </div>
        </div>
        <div className="text-xs">
          <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Official Operational Slogan:</label>
          <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-rose-500 font-mono-code font-bold" />
        </div>

        <div className="border-t border-stone-200 dark:border-white/10 pt-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-cream-canvas font-display-punch uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Cosmic Coordinates — private, not public
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Feeds the Cosmic Corner only. Your birthday is not shown on your public profile.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Birthday:</label>
              <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-indigo-500 font-semibold" />
            </div>
            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Birth time (optional):</label>
              <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-indigo-500 font-semibold" />
            </div>
            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Birthplace (optional):</label>
              <input type="text" value={birthplace} onChange={(e) => setBirthplace(e.target.value)} placeholder="e.g. Kosciusko, MS"
                className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-indigo-500 font-semibold" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all">
            <Save className="w-4 h-4" />
            <span>{saved ? 'Profile saved!' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
