import React, { useState, useRef } from 'react';
import { X, Check, ChevronRight, ChevronLeft, PawPrint, Upload } from 'lucide-react';
import {
  BUDDY_CREATURES, BUDDY_PALETTES, buddyImageUrl,
  type BuddyProfile, type BuddyCreature,
} from '../buddy';

interface BuddyCreatorProps {
  open: boolean;
  onClose: () => void;
  /** Existing buddy for re-picking; null for first creation. */
  initial?: BuddyProfile | null;
  onSave: (buddy: BuddyProfile) => void;
}

/** 3-step buddy creation: pick creature → name it → recolor it. */
export const BuddyCreator: React.FC<BuddyCreatorProps> = ({ open, onClose, initial, onSave }) => {
  const [step, setStep] = useState(0);
  const [creatureId, setCreatureId] = useState(initial?.creatureId || BUDDY_CREATURES[0].id);
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || BUDDY_PALETTES[0].color);
  const [customImage, setCustomImage] = useState(initial?.customImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const creature: BuddyCreature = BUDDY_CREATURES.find(c => c.id === creatureId) || BUDDY_CREATURES[0];
  const isCustom = creatureId === 'custom';
  const portraitSrc = isCustom ? customImage : buddyImageUrl(creature);
  const effectiveName = name.trim() || creature.defaultName;
  const canNext = (step === 0 ? (creatureId !== 'custom' || !!customImage) : true)
    && (step === 1 ? effectiveName.length > 0 : true);

  /** Device upload for the 'custom' tile: downscale to max 512px, store as dataURL. */
  const pickCustomImage = () => {
    setCreatureId('custom');
    fileInputRef.current?.click();
  };
  const onCustomFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const max = 512;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      setCustomImage(canvas.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const save = () => {
    onSave({
      creatureId,
      name: effectiveName.slice(0, 24),
      color,
      customImage: isCustom ? customImage : undefined,
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Create your AI buddy">
      <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col rounded-3xl bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-black">
              {initial ? 'Reshape your buddy' : 'Meet your AI buddy'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {['Pick', 'Name', 'Recolor'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === step ? 'text-white' : 'bg-stone-200 dark:bg-white/10 opacity-60'}`}
                style={i === step ? { background: color } : undefined}
              >
                {i + 1}
              </div>
              <span className={`text-xs font-bold ${i === step ? '' : 'opacity-50'}`}>{label}</span>
              {i < 2 && <div className="w-6 h-0.5 bg-stone-200 dark:bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1 min-h-0">
          {step === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUDDY_CREATURES.map(c => {
                const selected = c.id === creatureId;
                const customTile = c.id === 'custom';
                return (
                  <button
                    key={c.id}
                    onClick={() => (customTile ? pickCustomImage() : setCreatureId(c.id))}
                    className={`rounded-2xl border-2 p-2 text-center transition-all ${selected ? 'scale-[1.03]' : 'border-stone-200 dark:border-white/10 hover:border-stone-400'}`}
                    style={selected ? { borderColor: color, boxShadow: `0 0 14px ${color}55` } : undefined}
                  >
                    {customTile ? (
                      customImage ? (
                        <img src={customImage} alt="Your upload" className="w-full aspect-square object-cover rounded-xl" draggable={false} />
                      ) : (
                        <div className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 bg-stone-100 dark:bg-white/5">
                          <Upload className="w-8 h-8 opacity-50" />
                          <span className="text-[11px] font-black opacity-60">Upload photo</span>
                        </div>
                      )
                    ) : (
                      <img src={buddyImageUrl(c)} alt={c.defaultName} className="w-full aspect-square object-cover rounded-xl" draggable={false} />
                    )}
                    <div className="mt-1.5 text-sm font-black">{customTile && customImage ? 'Your photo' : c.defaultName}</div>
                    <div className="text-[11px] opacity-60 leading-tight">{customTile && customImage ? 'Tap to change it.' : c.blurb}</div>
                  </button>
                );
              })}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onCustomFile} aria-label="Upload a buddy photo" />

          {step === 1 && (
            <div className="text-center">
              <img src={portraitSrc} alt={creature.defaultName} className="w-36 h-36 object-cover rounded-full mx-auto" style={{ boxShadow: `0 0 0 4px ${color}, 0 0 24px ${color}66` }} draggable={false} />
              <p className="mt-4 text-sm opacity-70">Every buddy mirrors your tone — it learns to talk like <em>you</em> from your entries.</p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={creature.defaultName}
                maxLength={24}
                autoFocus
                className="mt-3 w-full max-w-xs mx-auto block px-4 py-3 rounded-2xl border-2 border-stone-300 dark:border-white/20 bg-transparent text-center text-xl font-black outline-none focus:border-pink-500"
              />
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden" style={{ boxShadow: `0 0 0 4px ${color}, 0 0 28px ${color}88` }}>
                <img src={portraitSrc} alt={effectiveName} className="w-full h-full object-cover" draggable={false} />
                {!isCustom && (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: color, opacity: 0.18, mixBlendMode: 'color' }} />
                )}
              </div>
              <div className="mt-2 text-lg font-black" style={{ color }}>{effectiveName}</div>
              {isCustom && <div className="mt-1 text-[11px] opacity-60">Uploads keep their own colors — the ring still applies.</div>}
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                {BUDDY_PALETTES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setColor(p.color)}
                    title={p.name}
                    aria-label={p.name}
                    className={`w-10 h-10 rounded-full border-2 transition-transform ${p.color === color ? 'scale-110 border-white' : 'border-transparent'}`}
                    style={{ background: p.color, boxShadow: p.color === color ? `0 0 12px ${p.color}` : undefined }}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs opacity-60">{BUDDY_PALETTES.find(p => p.color === color)?.name}</div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-stone-200 dark:border-white/10">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Later' : 'Back'}
          </button>
          {step < 2 ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className="inline-flex items-center gap-1 px-5 py-2 rounded-xl font-black text-sm text-white disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${color}, #ea4798)` }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={save}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-black text-sm text-white"
              style={{ background: `linear-gradient(135deg, ${color}, #ea4798)` }}
            >
              <Check className="w-4 h-4" /> {initial ? 'Save changes' : 'Adopt buddy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
