import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { EMPTY_WORD_REFLECTIONS, type WordReflections } from '../../data/frontmatter';
import { FM_KEYS, loadFrontMatter, saveFrontMatter } from './storage';
import { SectionCard } from './SectionCard';
import type { FrontMatterSectionProps } from './props';

const inputClass =
  'w-full p-3 rounded-xl border border-stone-300 dark:border-white/10 text-xs focus:ring-2 focus:ring-[#ea4798] focus:outline-hidden bg-[#faf8f4] dark:bg-white/5 dark:text-stone-200';

/**
 * 03 — One Word. The word itself lives on the user profile (shared with
 * Identity Base); the four reflections persist per-user in localStorage.
 */
export const WordOfYearSection: React.FC<FrontMatterSectionProps> = ({ user, onSaveProfile, onToast }) => {
  const [word, setWord] = useState(user.word_of_the_year || '');
  const [editingWord, setEditingWord] = useState(false);
  const [reflections, setReflections] = useState<WordReflections>(EMPTY_WORD_REFLECTIONS);
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    setWord(user.word_of_the_year || '');
  }, [user.word_of_the_year]);

  useEffect(() => {
    const saved = loadFrontMatter<WordReflections>(user.id, FM_KEYS.wordReflections);
    if (saved) setReflections({ ...EMPTY_WORD_REFLECTIONS, ...saved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSaveWord = () => {
    const trimmed = word.trim().toUpperCase();
    onSaveProfile({ word_of_the_year: trimmed });
    setWord(trimmed);
    setEditingWord(false);
    if (onToast) onToast(trimmed ? `Your word is ${trimmed}. Mean it.` : 'Word cleared.');
  };

  const handleSaveReflections = () => {
    saveFrontMatter(user.id, FM_KEYS.wordReflections, reflections);
    setSavedTick(true);
    window.setTimeout(() => setSavedTick(false), 2000);
    if (onToast) onToast('One Word reflections preserved.');
  };

  const set = (k: keyof WordReflections) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setReflections({ ...reflections, [k]: e.target.value });

  return (
    <SectionCard badge="03 — WORD" kicker="ONE WORD. ONE YEAR. PICK IT. MEAN IT.">
      <div className="border-b border-stone-200 dark:border-white/10 pb-4">
        <h3 className="text-3xl font-black font-serif-display text-slate-900 dark:text-cream-canvas">
          One Word. All Year.
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          Not a resolution. Not a rebrand. One word that becomes your compass when everything else is noise. Pick it. Mean it. Live it.
        </p>
      </div>

      <div className="bg-[#ea4798]/10 border-2 border-[#ea4798]/40 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full">
          <span className="text-[10px] font-mono-code uppercase font-bold text-[#ea4798] block mb-1">
            My word for 2027:
          </span>
          {editingWord ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="SOVEREIGN"
                maxLength={24}
                className="flex-1 p-2.5 rounded-xl border border-[#ea4798]/50 text-2xl font-black font-serif-display tracking-wider bg-white dark:bg-white/5 dark:text-cream-canvas focus:outline-hidden focus:ring-2 focus:ring-[#ea4798]"
              />
              <button
                type="button"
                onClick={handleSaveWord}
                className="px-4 py-2 bg-[#ea4798] hover:bg-[#d63a85] text-white rounded-xl text-xs font-mono-code font-bold cursor-pointer"
              >
                Set
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingWord(true)}
              title="Change your word"
              className="text-3xl sm:text-4xl font-black font-serif-display text-slate-900 dark:text-cream-canvas tracking-wider cursor-pointer hover:text-[#ea4798] transition-colors"
            >
              {word || 'SOVEREIGN'}
            </button>
          )}
        </div>
        <span className="text-xs font-mono-code text-[#ea4798] italic whitespace-nowrap">
          Boredom=Death
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold font-mono-code text-slate-800 dark:text-stone-200 mb-1">Why this word?</label>
          <textarea value={reflections.why} onChange={set('why')} placeholder="What made you choose this word over every other possibility?" className={inputClass} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-bold font-mono-code text-slate-800 dark:text-stone-200 mb-1">What does it unlock for you?</label>
          <textarea value={reflections.unlocks} onChange={set('unlocks')} placeholder="What permission does this word grant that you didn't have before?" className={inputClass} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-bold font-mono-code text-slate-800 dark:text-stone-200 mb-1">What does it protect you from?</label>
          <textarea value={reflections.protects} onChange={set('protects')} placeholder="What bad habits, performative tasks, or distractions does it shield you from?" className={inputClass} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-bold font-mono-code text-slate-800 dark:text-stone-200 mb-1">What does it sound like in your head at 2am?</label>
          <input type="text" value={reflections.soundAt2am} onChange={set('soundAt2am')} placeholder="The unvarnished whisper when doubts surface..." className={inputClass} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveReflections}
        className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-[#ea4798] dark:hover:bg-[#d63a85] text-white rounded-xl text-xs font-mono-code font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{savedTick ? '✓ Saved' : 'Save Word Reflections'}</span>
      </button>
    </SectionCard>
  );
};
