export interface StickerItem {
  id: string;
  category: 'essentials' | 'mindset' | 'goals' | 'mood' | 'power_words';
  label: string;
  emoji: string;
  color: string; // Tailwind background classes
  border: string;
  textColor: string;
}

export const STICKER_COLLECTION: StickerItem[] = [
  // Essentials
  { id: 'stk-todo', category: 'essentials', label: 'To Do', emoji: '✔️', color: 'bg-emerald-500', border: 'border-emerald-600', textColor: 'text-white' },
  { id: 'stk-priority', category: 'essentials', label: 'Priority', emoji: '⭐', color: 'bg-amber-500', border: 'border-amber-600', textColor: 'text-white' },
  { id: 'stk-dontforget', category: 'essentials', label: "Don't Forget", emoji: '🧠', color: 'bg-purple-600', border: 'border-purple-700', textColor: 'text-white' },
  { id: 'stk-reminder', category: 'essentials', label: 'Reminder', emoji: '🔔', color: 'bg-rose-500', border: 'border-rose-600', textColor: 'text-white' },
  { id: 'stk-deadline', category: 'essentials', label: 'Deadline', emoji: '🚩', color: 'bg-red-600', border: 'border-red-700', textColor: 'text-white' },
  { id: 'stk-payday', category: 'essentials', label: 'Pay Day', emoji: '💰', color: 'bg-teal-600', border: 'border-teal-700', textColor: 'text-white' },

  // Mindset & Motivation
  { id: 'stk-enough', category: 'mindset', label: 'I Am Enough', emoji: '⚡', color: 'bg-pink-600', border: 'border-pink-700', textColor: 'text-white' },
  { id: 'stk-capable', category: 'mindset', label: 'I Am Capable', emoji: '⭐', color: 'bg-blue-600', border: 'border-blue-700', textColor: 'text-white' },
  { id: 'stk-choose-me', category: 'mindset', label: 'I Choose Me', emoji: '💪', color: 'bg-lime-600', border: 'border-lime-700', textColor: 'text-white' },
  { id: 'stk-becoming', category: 'mindset', label: 'I Am Becoming', emoji: '💫', color: 'bg-violet-600', border: 'border-violet-700', textColor: 'text-white' },
  { id: 'stk-progress', category: 'mindset', label: 'Progress Not Perfection', emoji: '📈', color: 'bg-orange-600', border: 'border-orange-700', textColor: 'text-white' },
  { id: 'stk-unstoppable', category: 'mindset', label: 'Off*Script', emoji: '🔥', color: 'bg-rose-600', border: 'border-rose-700', textColor: 'text-white' },

  // Goals & Habits
  { id: 'stk-monthly-goal', category: 'goals', label: 'Monthly Goal', emoji: '🎯', color: 'bg-rose-500', border: 'border-rose-600', textColor: 'text-white' },
  { id: 'stk-weekly-win', category: 'goals', label: 'Weekly Win', emoji: '🏆', color: 'bg-amber-500', border: 'border-amber-600', textColor: 'text-white' },
  { id: 'stk-streak', category: 'goals', label: 'Habit Streak', emoji: '🔥', color: 'bg-sky-600', border: 'border-sky-700', textColor: 'text-white' },
  { id: 'stk-done-done', category: 'goals', label: 'Done & Done', emoji: '✅', color: 'bg-emerald-600', border: 'border-emerald-700', textColor: 'text-white' },
  { id: 'stk-level-up', category: 'goals', label: 'Level Up', emoji: '⬆️', color: 'bg-indigo-600', border: 'border-indigo-700', textColor: 'text-white' },
  { id: 'stk-crushed-it', category: 'goals', label: 'Crushed It!', emoji: '💥', color: 'bg-fuchsia-600', border: 'border-fuchsia-700', textColor: 'text-white' },

  // Moods & Feelings
  { id: 'stk-feral', category: 'mood', label: 'Feral', emoji: '🦁', color: 'bg-red-700', border: 'border-red-800', textColor: 'text-white' },
  { id: 'stk-drained', category: 'mood', label: 'Drained', emoji: '😴', color: 'bg-slate-600', border: 'border-slate-700', textColor: 'text-white' },
  { id: 'stk-overwhelmed', category: 'mood', label: 'Overwhelmed', emoji: '😵', color: 'bg-rose-700', border: 'border-rose-800', textColor: 'text-white' },
  { id: 'stk-inspired', category: 'mood', label: 'Inspired', emoji: '✨', color: 'bg-purple-600', border: 'border-purple-700', textColor: 'text-white' },
  { id: 'stk-grateful', category: 'mood', label: 'Grateful', emoji: '🙏', color: 'bg-amber-600', border: 'border-amber-700', textColor: 'text-white' },
  { id: 'stk-flow-state', category: 'mood', label: 'Flow State', emoji: '🌊', color: 'bg-cyan-600', border: 'border-cyan-700', textColor: 'text-white' },

  // Power Words
  { id: 'stk-brave', category: 'power_words', label: 'BRAVE', emoji: '⚡', color: 'bg-red-600', border: 'border-red-700', textColor: 'text-white font-bold tracking-wider' },
  { id: 'stk-bold', category: 'power_words', label: 'BOLD', emoji: '★', color: 'bg-rose-600', border: 'border-rose-700', textColor: 'text-white font-bold tracking-wider' },
  { id: 'stk-wild', category: 'power_words', label: 'WILD', emoji: '🔥', color: 'bg-lime-600', border: 'border-lime-700', textColor: 'text-white font-bold tracking-wider' },
  { id: 'stk-real', category: 'power_words', label: 'REAL', emoji: '💎', color: 'bg-sky-600', border: 'border-sky-700', textColor: 'text-white font-bold tracking-wider' },
  { id: 'stk-own-it', category: 'power_words', label: 'OWN IT', emoji: '👑', color: 'bg-emerald-600', border: 'border-emerald-700', textColor: 'text-white font-bold tracking-wider' },
  { id: 'stk-loud', category: 'power_words', label: 'LOUD', emoji: '📣', color: 'bg-amber-600', border: 'border-amber-700', textColor: 'text-white font-bold tracking-wider' }
];
