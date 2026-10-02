import React, { useState } from 'react';
import { FRONT_MATTER_TABS, type FrontMatterSectionId } from '../../data/frontmatter';
import { ManifestoSection } from './ManifestoSection';
import { TourGuideSection } from './TourGuideSection';
import { ManualSection } from './ManualSection';
import { WordOfYearSection } from './WordOfYearSection';
import { VisionDumpSection } from './VisionDumpSection';
import { ValuesSection } from './ValuesSection';
import { LifeAuditSection } from './LifeAuditSection';
import { PermissionSlipSection } from './PermissionSlipSection';
import { PeopleSection } from './PeopleSection';
import type { FrontMatterViewProps } from './props';

/**
 * Front Matter & Operating Manual — the planner's pages 01–14 as in-app
 * sections: manifesto, tour guide, operating manual, one word, vision dump,
 * core values, life audit, permission slip, and the people address book.
 *
 * Profile-bound fields (word of the year, core values, permission
 * commitment) save through onSaveProfile; everything else persists to
 * per-user namespaced localStorage keys (`lifeos:<userId>:frontmatter:*`).
 */
export const FrontMatterView: React.FC<FrontMatterViewProps> = ({
  user,
  onSaveProfile,
  onNavigateToGoals,
  onNavigateToDaily,
  onToast
}) => {
  const [activeSection, setActiveSection] = useState<FrontMatterSectionId>('manifesto');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Front Matter navigation */}
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-stone-100 dark:border-white/10">
          <div>
            <span className="bg-[#ea4798] text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
              Official Planner Codex
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-1">
              Front Matter &amp; Operating Manual
            </h2>
          </div>
          <span className="text-xs font-mono-code text-stone-500 dark:text-stone-400">
            Pages 01–14 · Chaos Year Edition
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-none text-xs font-mono-code">
          {FRONT_MATTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-stone-900 dark:bg-[#ea4798] text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'manifesto' && <ManifestoSection />}
      {activeSection === 'tour_guide' && <TourGuideSection />}
      {activeSection === 'manual' && (
        <ManualSection onNavigateToGoals={onNavigateToGoals} onNavigateToDaily={onNavigateToDaily} />
      )}
      {activeSection === 'word' && (
        <WordOfYearSection user={user} onSaveProfile={onSaveProfile} onToast={onToast} />
      )}
      {activeSection === 'vision' && (
        <VisionDumpSection user={user} onSaveProfile={onSaveProfile} onToast={onToast} />
      )}
      {activeSection === 'values' && (
        <ValuesSection user={user} onSaveProfile={onSaveProfile} onToast={onToast} />
      )}
      {activeSection === 'audit' && (
        <LifeAuditSection user={user} onSaveProfile={onSaveProfile} onToast={onToast} />
      )}
      {activeSection === 'permission' && (
        <PermissionSlipSection user={user} onSaveProfile={onSaveProfile} onToast={onToast} />
      )}
      {activeSection === 'people' && (
        <PeopleSection user={user} onSaveProfile={onSaveProfile} onToast={onToast} />
      )}
    </div>
  );
};

export type { FrontMatterViewProps } from './props';
