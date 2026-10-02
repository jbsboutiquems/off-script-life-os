import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ShieldAlert, Save, Sparkles, User, Key, Flame, KeyRound, X } from 'lucide-react';
import { api } from '../services/api';
import { RecoveryCodeReveal } from './RecoveryCodeReveal';

interface IdentityProfileViewProps {
  user: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
}

export const IdentityProfileView: React.FC<IdentityProfileViewProps> = ({
  user,
  onSaveProfile
}) => {
  const [chaosName, setChaosName] = useState(user.chaos_name || '');
  const [wordOfYear, setWordOfYear] = useState(user.word_of_the_year || '');
  const [slogan, setSlogan] = useState(user.slogan || 'Boredom=Death');
  const [chaosMantra, setChaosMantra] = useState(user.chaos_mantra || '');
  const [whatDonePretending, setWhatDonePretending] = useState(user.what_done_pretending || '');
  const [whatReadyToAdmit, setWhatReadyToAdmit] = useState(user.what_ready_to_admit || '');
  const [relationshipWithChaos, setRelationshipWithChaos] = useState(user.relationship_with_chaos || '');
  const [permissionGranted, setPermissionGranted] = useState(user.permission_granted || '');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [birthTime, setBirthTime] = useState(user.birth_time || '');
  const [birthplace, setBirthplace] = useState(user.birthplace || '');
  const [isSaved, setIsSaved] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSuggestions, setRenameSuggestions] = useState<string[]>([]);
  const [renameOk, setRenameOk] = useState<string | null>(null);

  const changeUsername = async () => {
    setRenameError(null);
    setRenameSuggestions([]);
    setRenameOk(null);
    setRenaming(true);
    try {
      const result = await api.changeUsername(newUsername.trim());
      // Keep the header/profile in lockstep: the server syncs the display name
      // when it was still the old username; mirror it locally either way.
      const syncedName = result.chaosName || result.username;
      setChaosName(syncedName);
      onSaveProfile({ chaos_name: syncedName });
      setRenameOk(`You are now “${result.username}” everywhere — wall, inbox, all of it.`);
      setNewUsername('');
    } catch (err: any) {
      setRenameError(err instanceof Error ? err.message : 'Could not change username.');
      if (Array.isArray(err?.suggestions)) setRenameSuggestions(err.suggestions);
    } finally {
      setRenaming(false);
    }
  };

  const rotateCode = async () => {
    setRotateError(null);
    setRotating(true);
    try {
      const result = await api.rotateRecoveryCode();
      setNewCode(result.recoveryCode);
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : 'Could not mint a new code.');
    } finally {
      setRotating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      chaos_name: chaosName.trim(),
      word_of_the_year: wordOfYear.trim().toUpperCase(),
      slogan: slogan.trim(),
      chaos_mantra: chaosMantra.trim(),
      what_done_pretending: whatDonePretending.trim(),
      what_ready_to_admit: whatReadyToAdmit.trim(),
      relationship_with_chaos: relationshipWithChaos.trim(),
      permission_granted: permissionGranted.trim(),
      birthday: birthday.trim(),
      birth_time: birthTime.trim(),
      birthplace: birthplace.trim()
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-rose-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            IDENTITY ARCHITECTURE
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono-code">GROUND ZERO</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-1">
          Identity Base &amp; Self-Sovereignty
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          Before tracking hours or organizing tasks, define who is running the machine and what rules you have officially burned.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity Tags */}
        <div className="bg-white rounded-2xl border border-stone-300 p-6 shadow-xs space-y-5">
          <div className="border-b border-stone-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900 font-display-punch uppercase flex items-center gap-2">
              <User className="w-4 h-4 text-rose-600" />
              <span>Operator Coordinates</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Chaos Alias / Chosen Name:
              </label>
              <input
                type="text"
                value={chaosName}
                onChange={(e) => setChaosName(e.target.value)}
                placeholder="e.g. The Unruly Architect"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50/50 focus:outline-rose-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Word of the Year <span className="text-stone-400 font-normal font-mono-code">(one defiant word)</span>:
              </label>
              <input
                type="text"
                value={wordOfYear}
                onChange={(e) => setWordOfYear(e.target.value)}
                placeholder="e.g. UNGOVERNABLE, FERAL, TENDER, EXPANSIVE"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50/50 focus:outline-rose-500 font-mono-code uppercase font-bold text-rose-700"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Official Operational Slogan:
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder='e.g. Boredom=Death'
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50/50 focus:outline-rose-500 font-mono-code font-bold text-slate-900"
              />
              <span className="text-[10px] text-stone-500 mt-0.5 block font-mono-code">
                Planner mandate: Boredom is the true mortal hazard.
              </span>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Personal Operating Mantra:
              </label>
              <input
                type="text"
                value={chaosMantra}
                onChange={(e) => setChaosMantra(e.target.value)}
                placeholder="e.g. An intention is not a prison. I am allowed to update the map."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50/50 focus:outline-rose-500 font-medium italic"
              />
            </div>
          </div>
        </div>

        {/* Cosmic Coordinates: birthday powers the Cosmic Corner */}
        <div className="bg-gradient-to-br from-indigo-50 to-rose-50 dark:from-[#02142e] dark:to-[#1c1125] rounded-2xl border border-indigo-200 dark:border-indigo-400/30 p-6 shadow-xs space-y-5">
          <div className="border-b border-indigo-200 dark:border-indigo-400/30 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-cream-canvas font-display-punch uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              <span>Cosmic Coordinates</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Feeds the Cosmic Corner: your daily horoscope and your (playful) natal chart. Birth time is optional — it unlocks your for-fun rising sign.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                Birthday:
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-indigo-500 font-semibold text-slate-900 dark:text-cream-canvas"
              />
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                Birth time <span className="text-stone-400 font-normal font-mono-code">(optional)</span>:
              </label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-indigo-500 font-semibold text-slate-900 dark:text-cream-canvas"
              />
            </div>

            <div>
              <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                Birthplace <span className="text-stone-400 font-normal font-mono-code">(optional)</span>:
              </label>
              <input
                type="text"
                value={birthplace}
                onChange={(e) => setBirthplace(e.target.value)}
                placeholder="e.g. Kosciusko, MS"
                className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-lg bg-stone-50/50 dark:bg-white/5 focus:outline-indigo-500 font-semibold text-slate-900 dark:text-cream-canvas"
              />
            </div>
          </div>
        </div>

        {/* The Truth Box: What I'm Done Pretending */}
        <div className="bg-[#fffdfa] rounded-2xl border-2 border-rose-300/80 p-6 shadow-xs space-y-5">
          <div className="border-b border-rose-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900 font-display-punch uppercase flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>Unfiltered Truth Inventory</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              The Mei Diagnostic engine checks your daily rants against these core confessions.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-800 font-bold mb-1">
                1. What I am officially done pretending:
              </label>
              <textarea
                value={whatDonePretending}
                onChange={(e) => setWhatDonePretending(e.target.value)}
                placeholder="Pretending I enjoy networking breakfasts, that I can work 70 hours without spiraling, that I don't care about..."
                rows={3}
                className="w-full p-3 border border-stone-300 rounded-xl focus:outline-rose-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-stone-800 font-bold mb-1">
                2. What I am finally ready to admit about myself:
              </label>
              <textarea
                value={whatReadyToAdmit}
                onChange={(e) => setWhatReadyToAdmit(e.target.value)}
                placeholder="I lose interest after the architecture phase, I need 10 hours of solitude every Sunday, I create best under..."
                rows={3}
                className="w-full p-3 border border-stone-300 rounded-xl focus:outline-rose-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-stone-800 font-bold mb-1">
                3. My redefined relationship with chaos:
              </label>
              <textarea
                value={relationshipWithChaos}
                onChange={(e) => setRelationshipWithChaos(e.target.value)}
                placeholder="Chaos is not my failure to be orderly. It is the unmapped terrain where real breakthroughs happen..."
                rows={2}
                className="w-full p-3 border border-stone-300 rounded-xl focus:outline-rose-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* The Irrevocable Permission Slip */}
        <div className="bg-[#faf5eb] border-2 border-dashed border-stone-800 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-rose-700">
              IRREVOCABLE PERMISSION SLIP
            </span>
            <span className="text-xs font-mono-code text-stone-500">SIGNED IN FULL CONSCIOUSNESS</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-stone-600 italic">
              "By operating the 2027 Life OS, I hereby grant myself irrevocable permission to:"
            </p>
            <textarea
              value={permissionGranted}
              onChange={(e) => setPermissionGranted(e.target.value)}
              placeholder="Change my mind without writing an apology memo, leave events early, cancel projects that feel dead, and sleep without earning it..."
              rows={3}
              className="w-full p-3 border border-stone-400 rounded-xl bg-white text-xs font-serif-display text-slate-900 focus:outline-stone-800"
            />
          </div>
        </div>

        {/* Account safety: recovery code rotation */}
        <div className="bg-[#fffdfa] rounded-2xl border-2 border-amber-300/80 p-6 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 font-display-punch uppercase flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Account Safety</span>
          </h3>
          <p className="text-xs text-stone-500">
            Your recovery code is the backup way back in if you forget your password. Accounts with a verified
            email can also reset by email; no email on file means this code is the only way back — guard it
            like a good parking spot.
            Mint a fresh one any time; the old code retires immediately and the new one is shown exactly once.
          </p>
          <div className="pt-1 border-t border-amber-200/70">
            <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 mt-3 mb-1">
              Change username
            </div>
            <p className="text-xs text-stone-500 mb-2">
              This is the name on the Chaos Wall and in inboxes. Limit: 3 changes per 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={user.chaos_name || 'new username'}
                className="flex-1 px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-cream-canvas focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={changeUsername}
                disabled={renaming || !newUsername.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {renaming ? 'Checking…' : 'Change it'}
              </button>
            </div>
            {renameError && (
              <div className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/60 rounded-xl px-3 py-2">
                {renameError}
                {renameSuggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {renameSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setNewUsername(s); setRenameError(null); setRenameSuggestions([]); }}
                        className="px-2 py-1 bg-white dark:bg-white/10 border border-rose-300 dark:border-rose-700 rounded-lg font-mono-code text-[11px] hover:bg-rose-100 dark:hover:bg-white/20"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {renameOk && (
              <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{renameOk}</p>
            )}
          </div>
          {rotateError && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded-xl px-3 py-2">
              {rotateError}
            </div>
          )}
          <button
            type="button"
            onClick={rotateCode}
            disabled={rotating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            {rotating ? 'Minting…' : 'Get a new recovery code'}
          </button>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Identity Coordinates Locked!' : 'Save Identity Base'}</span>
          </button>
        </div>
      </form>

      {/* One-time recovery code reveal */}
      {newCode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md relative">
            <button
              onClick={() => setNewCode(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-md hover:bg-black z-10"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <RecoveryCodeReveal
              code={newCode}
              context="rotate"
              doneLabel="Saved it — back to base"
              onDone={() => setNewCode(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
