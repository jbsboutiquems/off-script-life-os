import React, { useRef, useState } from 'react';
import { X, Camera, Upload, Sparkles } from 'lucide-react';

/**
 * Selfie → Avatar creator (staged, 2026-11-03).
 *
 * Amber's call, superseding the old no-selfie rule: selfie avatar creation
 * is allowed. This is NOT a face-recognition or identity tool: it takes a
 * photo the user deliberately takes/uploads, crops it square, applies a
 * chosen avatar style in-browser (canvas, no upload to any server), and
 * returns a dataURL the app stores locally as the avatar image — the same
 * shape BuddyCreator already uses for a custom photo (creatureId 'custom').
 *
 * Steps: 1 Take/upload selfie → 2 Pick a style + glow → 3 Name it → Save.
 * Camera: input capture="user" (front camera on phones) with a plain file
 * fallback, so it works in browsers without getUserMedia permission flows.
 * No photo ever leaves the device in this component.
 */

export type AvatarStyle = 'original' | 'pop' | 'neon' | 'sketch';

const STYLES: { id: AvatarStyle; label: string; hint: string; filter: string }[] = [
  { id: 'original', label: 'Original', hint: 'Your selfie, as-is, cropped square.', filter: 'none' },
  { id: 'pop', label: 'Pop', hint: 'Brighter, bolder — poster colours.', filter: 'saturate(1.6) contrast(1.25)' },
  { id: 'neon', label: 'Neon', hint: 'Pink/teal glow, dark edge — Off*Script neon.', filter: 'saturate(1.8) contrast(1.3) brightness(1.05)' },
  { id: 'sketch', label: 'Sketch', hint: 'High-contrast black-and-white line look.', filter: 'grayscale(1) contrast(1.6)' },
];

const GLOWS = ['#EA4798', '#007D7A', '#03224F', '#F59E0B', '#b6ff2e', '#c26bff'];

interface SelfieAvatarCreatorProps {
  open: boolean;
  onClose: () => void;
  onSave: (avatar: { name: string; image: string; style: AvatarStyle; glow: string }) => void;
}

export const SelfieAvatarCreator: React.FC<SelfieAvatarCreatorProps> = ({ open, onClose, onSave }) => {
  const [photo, setPhoto] = useState('');
  const [style, setStyle] = useState<AvatarStyle>('pop');
  const [glow, setGlow] = useState(GLOWS[0]);
  const [name, setName] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const loadFile = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      // Square centre-crop, max 512px, style applied via canvas filter.
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const chosen = STYLES.find((s) => s.id === style) ?? STYLES[0];
      ctx.filter = chosen.filter;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, 512, 512);
      setPhoto(canvas.toDataURL('image/jpeg', 0.9));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Re-apply the style to the current photo is a nice-to-have; the style is
  // baked in at load time, and the glow ring is applied at display/save.
  const save = () => {
    if (!photo) return;
    onSave({ name: name.trim() || 'My Avatar', image: photo, style, glow });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Create an avatar from a selfie">
      <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col rounded-3xl bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-white/20 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-black">Selfie → Avatar</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl bg-stone-200 dark:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Take a selfie, pick a style, name it. Your photo never leaves this device —
            the avatar is made right here in your browser and saved locally.
          </p>

          {!photo ? (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraRef.current?.click()} className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 font-bold text-sm flex flex-col items-center gap-2">
                <Camera className="w-6 h-6" /> Take a selfie
              </button>
              <button onClick={() => fileRef.current?.click()} className="p-4 rounded-2xl bg-stone-200 dark:bg-white/10 font-bold text-sm flex flex-col items-center gap-2">
                <Upload className="w-6 h-6" /> Upload a photo
              </button>
              <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }} aria-label="Take a selfie" />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }} aria-label="Upload a photo" />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <img
                  src={photo}
                  alt="Your avatar preview"
                  className="w-48 h-48 object-cover rounded-full border-8"
                  style={{ borderColor: glow, boxShadow: `0 0 32px ${glow}` }}
                />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-stone-500 mb-2">Style</p>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button key={s.id} onClick={() => setStyle(s.id)} className={`p-3 rounded-xl text-left text-sm font-bold border-2 ${style === s.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30' : 'border-stone-200 dark:border-white/10'}`}>
                      {s.label}
                      <span className="block text-xs font-normal text-stone-500 mt-0.5">{s.hint}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-500 mt-2">Style is baked in when the photo loads; change the style, then re-take/re-upload to re-apply it.</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-stone-500 mb-2">Glow ring</p>
                <div className="flex gap-2">
                  {GLOWS.map((g) => (
                    <button key={g} onClick={() => setGlow(g)} aria-label={`Glow ${g}`} className={`w-9 h-9 rounded-full border-4 ${glow === g ? 'border-stone-900 dark:border-white' : 'border-transparent'}`} style={{ background: g }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-stone-500" htmlFor="avatar-name">Avatar name</label>
                <input id="avatar-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Innie" maxLength={24} className="mt-1 w-full px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-transparent font-bold" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPhoto('')} className="flex-1 px-4 py-3 rounded-xl bg-stone-200 dark:bg-white/10 font-bold text-sm">Retake</button>
                <button onClick={save} className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-amber-400 dark:text-stone-950 font-bold text-sm flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Save avatar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
