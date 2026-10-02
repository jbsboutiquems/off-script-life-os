import React, { useState } from 'react';
import { STICKER_COLLECTION, StickerItem } from '../data/stickers';
import { X, Copy, Check, Sparkles } from 'lucide-react';

interface StickersSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasteStickerToNotes?: (sticker: StickerItem) => void;
}

export const StickersSheetModal: React.FC<StickersSheetModalProps> = ({
  isOpen,
  onClose,
  onPasteStickerToNotes
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Stickers' },
    { id: 'essentials', label: 'Essentials' },
    { id: 'mindset', label: 'Mindset & Defiance' },
    { id: 'goals', label: 'Goals & Habits' },
    { id: 'mood', label: 'Moods & Chaos' },
    { id: 'power_words', label: 'Power Words' },
  ];

  const filteredStickers = activeCategory === 'all'
    ? STICKER_COLLECTION
    : STICKER_COLLECTION.filter(s => s.category === activeCategory);

  const handleCopySticker = (sticker: StickerItem) => {
    navigator.clipboard.writeText(`${sticker.emoji} [${sticker.label}]`);
    setCopiedId(sticker.id);
    if (onPasteStickerToNotes) {
      onPasteStickerToNotes(sticker);
    }
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#faf7f0] border-2 border-stone-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-300 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono-code bg-rose-600 text-white font-bold px-2 py-0.5 rounded uppercase">
                DIGITAL STICKER PACK
              </span>
              <span className="text-xs font-mono-code text-stone-500">{STICKER_COLLECTION.length} STICKERS</span>
            </div>
            <h3 className="text-xl font-bold font-serif-display text-slate-900 mt-1">
              Planner Stamps &amp; Stickers
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-slate-900 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex space-x-1.5 py-3 overflow-x-auto border-b border-stone-200 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stickers Grid */}
        <div className="py-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredStickers.map((stk) => {
            const isCopied = copiedId === stk.id;
            return (
              <div
                key={stk.id}
                onClick={() => handleCopySticker(stk)}
                className="bg-white border border-stone-300 hover:border-rose-400 p-3 rounded-xl cursor-pointer transition-all hover:scale-102 hover:shadow-sm flex flex-col items-center justify-between text-center relative group"
              >
                <div className="text-2xl sm:text-3xl mb-1 select-none">
                  {stk.emoji}
                </div>
                <div className="font-mono-code text-xs font-bold text-slate-900 leading-tight">
                  {stk.label}
                </div>
                <div className="text-[10px] text-stone-400 font-mono-code mt-0.5 capitalize">
                  {stk.category.replace('_', ' ')}
                </div>

                <div className="mt-2 text-[10px] font-mono-code font-bold text-rose-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isCopied ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Copy className="w-3 h-3" /> Click to Stamp
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-300 flex items-center justify-between text-xs text-stone-600">
          <span className="font-mono-code text-[11px]">
            Click any sticker to stamp directly into today's Field Notes
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
