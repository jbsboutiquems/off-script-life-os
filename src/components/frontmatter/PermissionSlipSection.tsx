import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { PERMISSION_STATEMENTS, type PermissionSlipData } from '../../data/frontmatter';
import { FM_KEYS, loadFrontMatter, saveFrontMatter } from './storage';
import { SectionCard } from './SectionCard';
import type { FrontMatterSectionProps } from './props';

const DEFAULT_COMMITMENT =
  'I commit to honoring my human rhythms, showing up with honest intent, and dropping performative pressure.';

/**
 * 09 — The Permission Slip. The written commitment lives on the user profile
 * (shared with Identity Base); signature + date + stamped state persist
 * per-user in localStorage.
 */
export const PermissionSlipSection: React.FC<FrontMatterSectionProps> = ({ user, onSaveProfile, onToast }) => {
  const [commitment, setCommitment] = useState(user.permission_granted || DEFAULT_COMMITMENT);
  const [signature, setSignature] = useState(user.chaos_name || '');
  const [date, setDate] = useState('2027-01-01');
  const [committed, setCommitted] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    setCommitment(user.permission_granted || DEFAULT_COMMITMENT);
  }, [user.permission_granted]);

  useEffect(() => {
    const saved = loadFrontMatter<PermissionSlipData>(user.id, FM_KEYS.permissionSlip);
    if (saved) {
      setSignature(saved.sig || user.chaos_name || '');
      setDate(saved.date || '2027-01-01');
      setCommitted(Boolean(saved.committed));
    } else {
      setSignature(user.chaos_name || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSaveCommitment = () => {
    onSaveProfile({ permission_granted: commitment });
    setSavedTick(true);
    window.setTimeout(() => setSavedTick(false), 2000);
    if (onToast) onToast('Commitment written in ink.');
  };

  const handleCommit = () => {
    setCommitted(true);
    saveFrontMatter(user.id, FM_KEYS.permissionSlip, { sig: signature, date, committed: true });
    if (onToast) onToast('Permission Slip officially signed and granted!');
  };

  return (
    <SectionCard
      badge="09 — THE PERMISSION SLIP"
      cardClass="bg-[#fffdf9] dark:bg-[#02142e] border-[#ea4798] dark:border-[#ea4798]/50"
      kicker="CHAOS YEAR 2027"
    >
      <h3 className="text-3xl sm:text-4xl font-black font-serif-display text-slate-900 dark:text-cream-canvas">
        The Permission Slip.
      </h3>

      <div className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-sans border-y border-stone-200 dark:border-white/10 py-4">
        {PERMISSION_STATEMENTS.map((s, i) => (
          <p key={s} className="flex items-center gap-2">
            <span className="text-[#ea4798] font-bold">{i % 3 === 0 ? '✦' : i % 3 === 1 ? '■' : '✧'}</span>
            {s}
          </p>
        ))}
      </div>

      <div className="space-y-3">
        <label className="text-xs font-mono-code font-bold uppercase text-slate-900 dark:text-cream-canvas block">
          My commitment to myself in 2027:
        </label>
        <textarea
          value={commitment}
          onChange={(e) => setCommitment(e.target.value)}
          className="w-full p-3.5 rounded-xl border border-stone-300 dark:border-white/10 text-xs bg-white dark:bg-white/5 dark:text-stone-200 focus:ring-2 focus:ring-[#ea4798] focus:outline-hidden"
          rows={2}
        />
        <button
          type="button"
          onClick={handleSaveCommitment}
          className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-[#ea4798] dark:hover:bg-[#d63a85] text-white rounded-xl text-xs font-mono-code font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{savedTick ? '✓ Saved' : 'Save Commitment'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className="text-[11px] font-mono-code uppercase font-bold text-stone-500 dark:text-stone-400 block mb-1">
            Signed:
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Your Sovereign Signature"
            className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-white/10 text-sm font-serif-display font-bold italic bg-white dark:bg-white/5 dark:text-cream-canvas focus:ring-2 focus:ring-[#ea4798] focus:outline-hidden"
          />
        </div>
        <div>
          <label className="text-[11px] font-mono-code uppercase font-bold text-stone-500 dark:text-stone-400 block mb-1">
            Date:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-white/10 text-xs font-mono-code bg-white dark:bg-white/5 dark:text-stone-200 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#ea4798] text-white flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs sm:text-sm font-bold font-serif-display">
          Off*Script. On Purpose. All 2027.
        </span>
        <button
          type="button"
          onClick={handleCommit}
          className="px-4 py-2 bg-white text-[#a1245f] rounded-xl text-xs font-mono-code font-bold shadow-md hover:bg-stone-100 transition-all cursor-pointer"
        >
          {committed ? '✓ Permission Granted' : 'Stamp & Grant'}
        </button>
      </div>
    </SectionCard>
  );
};
