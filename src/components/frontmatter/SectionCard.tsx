import React from 'react';

interface SectionCardProps {
  badge: string;
  badgeClass?: string;
  kicker?: string;
  cardClass?: string;
  children: React.ReactNode;
}

/**
 * Standard front-matter card shell: badge row + optional kicker, brand
 * styling matching the rest of the app's views (stone borders, cream/dark
 * surfaces, rounded-3xl).
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  badge,
  badgeClass = 'bg-[#ea4798]',
  kicker,
  cardClass = 'bg-white dark:bg-[#02142e] border-stone-800 dark:border-amber-400/40',
  children
}) => (
  <div className={`${cardClass} border-2 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6`}>
    <div className="flex items-center justify-between flex-wrap gap-2">
      <span className={`${badgeClass} text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded`}>
        {badge}
      </span>
      {kicker && (
        <span className="text-xs font-mono-code font-bold text-stone-500 dark:text-stone-400">
          {kicker}
        </span>
      )}
    </div>
    {children}
  </div>
);
