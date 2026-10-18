import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ShieldAlert, Save, Sparkles, User, Key, Flame, KeyRound, X, Smartphone, BadgeCheck } from 'lucide-react';
import { api } from '../services/api';
import { isDevMode, setDevMode } from '../lib/devmode';
import { RecoveryCodeReveal } from './RecoveryCodeReveal';

interface IdentityProfileViewProps {
  user: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
}

import { PwInput } from './PwInput';

export const IdentityProfileView: React.FC<IdentityProfileViewProps> = ({
  user,
  onSaveProfile
}) => {
  const [khaosName, setKhaosName] = useState(user.khaos_name || '');
  const [wordOfYear, setWordOfYear] = useState(user.word_of_the_year || '');
  const [slogan, setSlogan] = useState(user.slogan || 'Boredom=Death');
  const [khaosMantra, setKhaosMantra] = useState(user.khaos_mantra || '');
  const [whatDonePretending, setWhatDonePretending] = useState(user.what_done_pretending || '');
  const [whatReadyToAdmit, setWhatReadyToAdmit] = useState(user.what_ready_to_admit || '');
  const [relationshipWithKhaos, setRelationshipWithKhaos] = useState(user.relationship_with_khaos || '');
  const [permissionGranted, setPermissionGranted] = useState(user.permission_granted || '');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [birthTime, setBirthTime] = useState(user.birth_time || '');
  const [birthplace, setBirthplace] = useState(user.birthplace || '');
  const [isSaved, setIsSaved] = useState(false);
  const [devMode, setDevModeState] = useState(isDevMode());
  // Developer password gate
  const [devPasswordSet, setDevPasswordSet] = useState<boolean | null>(null);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devPwInput, setDevPwInput] = useState('');
  const [devNewPw, setDevNewPw] = useState('');
  const [devNewPw2, setDevNewPw2] = useState('');
  const [devBusy, setDevBusy] = useState(false);
  const [devErr, setDevErr] = useState<string | null>(null);
  const [devMsg, setDevMsg] = useState<string | null>(null);
  useEffect(() => {
    api.devStatus()
      .then((s) => setDevPasswordSet(s.passwordSet))
      .catch(() => setDevPasswordSet(false));
  }, []);
  // Phone verification state
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneLoaded, setPhoneLoaded] = useState(false);
  const [smsLive, setSmsLive] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  // Friend discovery state
  const [findingFriends, setFindingFriends] = useState(false);
  const [friendMatches, setFriendMatches] = useState<{ id: string; username: string }[] | null>(null);
  const [friendErr, setFriendErr] = useState<string | null>(null);
  // Friend request state (send side) + recipient side (incoming requests
  // and friends list, with accept/decline)
  const [amberReqBusy, setAmberReqBusy] = useState(false);
  const [amberReqMsg, setAmberReqMsg] = useState<string | null>(null);
  const [amberReqErr, setAmberReqErr] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  // Incoming pending requests + current friends (recipient side)
  type FriendRequestItem = { id: string; fromId: string; fromUsername: string; toId: string; status: string; created_at: string };
  type FriendItem = { id: string; username: string };
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[] | null>(null);
  const [friends, setFriends] = useState<FriendItem[] | null>(null);
  const [friendsErr, setFriendsErr] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const loadFriendLists = async () => {
    setFriendsErr(null);
    try {
      const [reqs, fr] = await Promise.all([api.listFriendRequests(), api.listFriends()]);
      setIncomingRequests(reqs.incoming);
      setFriends(fr);
    } catch (e: any) {
      setFriendsErr(e.message || 'Could not load friend requests.');
    }
  };
  useEffect(() => { loadFriendLists(); }, []);
  const answerRequest = async (id: string, accept: boolean) => {
    setActingOnId(id); setFriendsErr(null);
    try {
      if (accept) await api.acceptFriendRequest(id);
      else await api.declineFriendRequest(id);
      await loadFriendLists();
    } catch (e: any) {
      setFriendsErr(e.message || 'Could not answer that request.');
    } finally {
      setActingOnId(null);
    }
  };
  useEffect(() => {
    api.phoneStatus()
      .then((s) => {
        setPhone(s.phone || '');
        setPhoneVerified(s.phoneVerified);
        setSmsLive(s.smsLive);
        setPhoneLoaded(true);
      })
      .catch(() => setPhoneLoaded(true));
  }, []);
  const [observedWord, setObservedWord] = useState<string | null>(null);
  useEffect(() => {
    api.getSnapshots()
      .then((snaps) => {
        const latest = (snaps || []).find((s) => s && s.observed_word);
        if (latest && latest.observed_word) setObservedWord(latest.observed_word);
      })
      .catch(() => {});
  }, []);
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
      const syncedName = result.khaosName || result.username;
      setKhaosName(syncedName);
      onSaveProfile({ khaos_name: syncedName });
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
      khaos_name: khaosName.trim(),
      word_of_the_year: wordOfYear.trim().toUpperCase(),
      slogan: slogan.trim(),
      khaos_mantra: khaosMantra.trim(),
      what_done_pretending: whatDonePretending.trim(),
      what_ready_to_admit: whatReadyToAdmit.trim(),
      relationship_with_khaos: relationshipWithKhaos.trim(),
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
                Khaos Alias / Chosen Name:
              </label>
              <input
                type="text"
                value={khaosName}
                onChange={(e) => setKhaosName(e.target.value)}
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
              <span className="text-[10px] text-stone-500 mt-1 block font-mono-code">
                Observed word:{" "}
                <span className="font-bold text-teal-700 uppercase">
                  {observedWord || "— run the Intent diagnostic to reveal yours"}
                </span>
                <span className="text-stone-400"> — the word your writing actually lives.</span>
              </span>
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
                value={khaosMantra}
                onChange={(e) => setKhaosMantra(e.target.value)}
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
              The Intent engine checks your daily rants against these core confessions.
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
                3. My redefined relationship with khaos:
              </label>
              <textarea
                value={relationshipWithKhaos}
                onChange={(e) => setRelationshipWithKhaos(e.target.value)}
                placeholder="Khaos is not my failure to be orderly. It is the unmapped terrain where real breakthroughs happen..."
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
            Your recovery code is the way back in if you forget your password — guard it
            like a good parking spot.
            Mint a fresh one any time; the old code retires immediately and the new one is shown exactly once.
          </p>
          <div className="pt-1 border-t border-amber-200/70">
            <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 mt-3 mb-1">
              Change username
            </div>
            <p className="text-xs text-stone-500 mb-2">
              This is the name on the Khaos Wall and in inboxes. Limit: 3 changes, ever — choose well.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={user.khaos_name || 'new username'}
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

        {/* Phone verification + friend discovery */}
        {phoneLoaded && (
          <div className="bg-[#fffdfa] rounded-2xl border-2 border-teal-300/80 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 font-display-punch uppercase flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-600" />
              <span>Phone</span>
              {phoneVerified && (
                <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-mono-code font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-full px-2 py-0.5">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500">
              Verify your number for SMS password recovery — and so friends can find you by it.
              {!smsLive && (
                <span className="block mt-1 text-amber-700 font-semibold">
                  Live texting isn't wired up yet — codes are logged on the server for now.
                </span>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneCodeSent(false); setPhoneMsg(null); setPhoneErr(null); }}
                placeholder="10-digit mobile number"
                disabled={phoneVerified}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-xl bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              />
              {!phoneVerified && (
                <button
                  type="button"
                  disabled={phoneBusy || !phone.trim()}
                  onClick={async () => {
                    setPhoneBusy(true); setPhoneErr(null); setPhoneMsg(null);
                    try {
                      await api.requestPhoneCode(phone);
                      setPhoneCodeSent(true);
                      setPhoneMsg(smsLive ? 'Code sent — check your texts.' : 'Code logged on the server (texting not live yet).');
                    } catch (e: any) { setPhoneErr(e.message); }
                    finally { setPhoneBusy(false); }
                  }}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {phoneBusy ? 'Sending…' : phoneCodeSent ? 'Resend code' : 'Text me a code'}
                </button>
              )}
            </div>
            {!phoneVerified && phoneCodeSent && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-xl bg-white text-sm font-mono-code font-bold tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  disabled={phoneBusy || phoneCode.length !== 6}
                  onClick={async () => {
                    setPhoneBusy(true); setPhoneErr(null); setPhoneMsg(null);
                    try {
                      await api.verifyPhoneCode(phoneCode);
                      setPhoneVerified(true);
                      setPhoneMsg('Number verified. Welcome to the reachable.');
                    } catch (e: any) { setPhoneErr(e.message); }
                    finally { setPhoneBusy(false); }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {phoneBusy ? 'Checking…' : 'Verify'}
                </button>
              </div>
            )}
            {phoneMsg && <p className="text-xs font-semibold text-emerald-700">{phoneMsg}</p>}
            {phoneErr && <p className="text-xs font-semibold text-rose-700">{phoneErr}</p>}

            <div className="pt-3 border-t border-teal-200/70">
              <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500 mb-1">
                Find friends
              </div>
              <p className="text-xs text-stone-500 mb-2">
                Pick contacts from your phone — their numbers are hashed on your device and only
                the hashes leave it. Anyone already verified here shows up.
              </p>
              <button
                type="button"
                disabled={findingFriends}
                onClick={async () => {
                  setFindingFriends(true); setFriendErr(null); setFriendMatches(null);
                  try {
                    const nav = navigator as any;
                    if (!nav.contacts || !nav.contacts.select) {
                      throw new Error('Contact picking isn\'t supported in this browser — try Chrome on Android.');
                    }
                    const picked = await nav.contacts.select(['tel'], { multiple: true });
                    const normalize = (raw: string): string | null => {
                      const d = String(raw || '').replace(/\D/g, '');
                      if (d.length === 10) return `+1${d}`;
                      if (d.length === 11 && d.startsWith('1')) return `+${d}`;
                      if (d.length > 11 && d.length <= 15) return `+${d}`;
                      return null;
                    };
                    const nums = new Set<string>();
                    for (const c of picked || []) {
                      for (const t of c.tel || []) {
                        const n = normalize(t);
                        if (n) nums.add(n);
                      }
                    }
                    if (nums.size === 0) throw new Error('No usable phone numbers in the contacts you picked.');
                    const hashes: string[] = [];
                    for (const n of nums) {
                      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(n));
                      hashes.push(Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join(''));
                    }
                    const res = await api.discoverFriends(hashes);
                    setFriendMatches(res.matches);
                  } catch (e: any) {
                    if (e?.name === 'NotAllowedError') setFriendErr('Contact access was denied — no worries, nothing left your phone.');
                    else setFriendErr(e.message || 'Could not look anyone up.');
                  } finally { setFindingFriends(false); }
                }}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {findingFriends ? 'Scanning…' : 'Choose contacts to find'}
              </button>
              {friendErr && <p className="mt-2 text-xs font-semibold text-rose-700">{friendErr}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={amberReqBusy}
                  onClick={async () => {
                    setAmberReqBusy(true); setAmberReqErr(null); setAmberReqMsg(null);
                    try {
                      const out = await api.sendFriendRequestToAmber();
                      if (out.alreadyFriends) setAmberReqMsg("You're already friends with Amber. She's your first friend here.");
                      else if (out.duplicate) setAmberReqMsg('Request already sent — sitting in her pending list.');
                      else setAmberReqMsg('Friend request sent to Amber.');
                    } catch (e: any) { setAmberReqErr(e.message || 'Could not send that request.'); }
                    finally { setAmberReqBusy(false); }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {amberReqBusy ? 'Sending…' : 'Add Amber as a friend'}
                </button>
                {amberReqMsg && <span className="text-xs font-semibold text-emerald-700">{amberReqMsg}</span>}
                {amberReqErr && <span className="text-xs font-semibold text-rose-700">{amberReqErr}</span>}
              </div>
              {friendMatches && (
                <div className="mt-2">
                  {friendMatches.length === 0 ? (
                    <p className="text-xs text-stone-500">No matches — none of those numbers are verified here yet. You're early. Good.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {friendMatches.map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                          <span className="text-sm font-bold text-slate-900 font-mono-code">{m.username}</span>
                          <button
                            type="button"
                            disabled={requestedIds.has(m.id)}
                            onClick={async () => {
                              try {
                                await api.sendFriendRequest(m.id);
                                setRequestedIds((s) => new Set(s).add(m.id));
                              } catch { /* keep the button enabled so they can retry */ }
                            }}
                            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            {requestedIds.has(m.id) ? 'Request sent' : 'Add friend'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="pt-3 mt-3 border-t border-teal-200/70">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500">
                    Friend requests
                  </div>
                  <button
                    type="button"
                    onClick={() => loadFriendLists()}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-600"
                  >
                    Refresh
                  </button>
                </div>
                {friendsErr && <p className="mt-1 text-xs font-semibold text-rose-700">{friendsErr}</p>}
                {incomingRequests === null ? (
                  <p className="mt-1 text-xs text-stone-400 font-mono-code">Loading…</p>
                ) : incomingRequests.length === 0 ? (
                  <p className="mt-1 text-xs text-stone-500">No pending friend requests.</p>
                ) : (
                  <ul className="mt-1 space-y-1.5">
                    {incomingRequests.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="text-sm font-bold text-slate-900 font-mono-code">{r.fromUsername}</span>
                        <span className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={actingOnId === r.id}
                            onClick={() => answerRequest(r.id, true)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            {actingOnId === r.id ? '…' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            disabled={actingOnId === r.id}
                            onClick={() => answerRequest(r.id, false)}
                            className="px-3 py-1.5 bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            {actingOnId === r.id ? '…' : 'Decline'}
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-teal-200/70">
                <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-500">
                  Friends
                </div>
                {friends === null ? (
                  <p className="mt-1 text-xs text-stone-400 font-mono-code">Loading…</p>
                ) : friends.length === 0 ? (
                  <p className="mt-1 text-xs text-stone-500">No friends yet — send a request or let someone find you.</p>
                ) : (
                  <ul className="mt-1 space-y-1.5">
                    {friends.map((f) => (
                      <li key={f.id} className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                        <span className="text-sm font-bold text-slate-900 font-mono-code">{f.username}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Developer: password-gated dev mode */}
        <div className="bg-[#fffdfa] rounded-2xl border-2 border-slate-300/80 p-6 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 font-display-punch uppercase flex items-center gap-2">
            <Flame className="w-4 h-4 text-slate-600" />
            <span>Developer</span>
            {devUnlocked && (
              <span className="ml-1 text-[10px] font-mono-code font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-300 rounded-full px-2 py-0.5">
                Unlocked
              </span>
            )}
          </h3>
          <p className="text-xs text-stone-500">
            Builder tooling lives behind a password. Know it, you're in — otherwise, move along.
          </p>

          {devPasswordSet === null && (
            <p className="text-xs text-stone-400 font-mono-code">Checking the gate…</p>
          )}

          {devPasswordSet === false && (
            user.is_admin ? (
              <div className="space-y-2">
                <p className="text-xs text-stone-500">No dev password exists yet. Create one — you'll need it to open this section.</p>
                <PwInput
                  value={devNewPw}
                  onChange={setDevNewPw}
                  placeholder="New dev password (8+ characters)"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <PwInput
                  value={devNewPw2}
                  onChange={setDevNewPw2}
                  placeholder="Repeat it"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <button
                  type="button"
                  disabled={devBusy || devNewPw.length < 8 || devNewPw !== devNewPw2}
                  onClick={async () => {
                    setDevBusy(true); setDevErr(null); setDevMsg(null);
                    try {
                      await api.setDevPassword(devNewPw);
                      setDevPasswordSet(true);
                      setDevNewPw(''); setDevNewPw2('');
                      setDevMsg('Dev password set. The gate is live.');
                    } catch (e: any) { setDevErr(e.message); }
                    finally { setDevBusy(false); }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {devBusy ? 'Setting…' : 'Set dev password'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-stone-500">No dev password exists yet — an admin needs to create one.</p>
            )
          )}

          {devPasswordSet === true && !devUnlocked && (
            <div className="flex flex-col sm:flex-row gap-2">
              <PwInput
                value={devPwInput}
                onChange={(v) => { setDevPwInput(v); setDevErr(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).closest('div')?.querySelector('button')?.click(); }}
                placeholder="Dev password"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <button
                type="button"
                disabled={devBusy || !devPwInput}
                onClick={async () => {
                  setDevBusy(true); setDevErr(null);
                  try {
                    await api.unlockDev(devPwInput);
                    setDevUnlocked(true);
                    setDevPwInput('');
                  } catch (e: any) { setDevErr(e.message); }
                  finally { setDevBusy(false); }
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {devBusy ? 'Checking…' : 'Unlock'}
              </button>
            </div>
          )}

          {devPasswordSet === true && devUnlocked && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                Dev mode reveals builder tooling (like the Android packaging guide in the
                footer). It sticks on this device until you turn it off.
              </p>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  role="switch"
                  aria-checked={devMode}
                  onClick={() => {
                    const next = !devMode;
                    setDevMode(next);
                    setDevModeState(next);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${devMode ? 'bg-teal-600' : 'bg-stone-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${devMode ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <span className="text-xs font-bold text-slate-700 font-mono-code uppercase tracking-wider">
                  Dev mode {devMode ? 'on' : 'off'}
                </span>
              </label>
              {user.is_admin && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-stone-500 font-mono-code uppercase tracking-wider text-[10px] font-bold">Change dev password</summary>
                  <div className="mt-2 space-y-2">
                    <PwInput
                      value={devNewPw}
                      onChange={setDevNewPw}
                      placeholder="New dev password (8+ characters)"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    <button
                      type="button"
                      disabled={devBusy || devNewPw.length < 8}
                      onClick={async () => {
                        setDevBusy(true); setDevErr(null); setDevMsg(null);
                        try {
                          await api.setDevPassword(devNewPw);
                          setDevNewPw('');
                          setDevMsg('Dev password changed.');
                        } catch (e: any) { setDevErr(e.message); }
                        finally { setDevBusy(false); }
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {devBusy ? 'Saving…' : 'Change it'}
                    </button>
                  </div>
                </details>
              )}
            </div>
          )}

          {devMsg && <p className="text-xs font-semibold text-emerald-700">{devMsg}</p>}
          {devErr && <p className="text-xs font-semibold text-rose-700">{devErr}</p>}
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
