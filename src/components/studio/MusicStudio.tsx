// AI Studio — Music tab. Lyria 3 via our own /api/studio/music endpoint.
import React, { useState } from 'react';
import { Music, ImagePlus, X } from 'lucide-react';
import { studioApi, fileToDataUrl, StudioNotConfiguredError } from './studioApi';
import { StudioSectionTitle, StudioError, StudioNotConfiguredCard, StudioGenerateButton, PromptTextarea, PINK, TEAL } from './StudioShared';

export const MusicStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('Warm analog synth pad with distant rain and vinyl dust, calming lo-fi tempo for unhurried journaling.');
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const handleGenerate = async () => {
    setBusy(true);
    setAudioUrl(null);
    setInfo(null);
    setError(null);
    try {
      const res = await studioApi.generateMusic({
        prompt,
        model,
        imageBase64: inspirationImage || undefined
      });
      if (res.audioUrl) {
        setAudioUrl(res.audioUrl);
        setInfo(`Composed with ${res.modelUsed}${model === 'lyria-3-clip-preview' ? ' (clip, up to 30s)' : ' (full track)'}. Saved to your studio library.`);
      } else {
        setInfo(res.text || 'Composition structured.');
      }
    } catch (e: any) {
      if (e instanceof StudioNotConfiguredError) setNotConfigured(true);
      else setError(e.message || 'Music generation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setInspirationImage(await fileToDataUrl(file));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (notConfigured) return <StudioNotConfiguredCard />;

  return (
    <div className="space-y-4">
      <StudioSectionTitle
        icon={<Music size={20} />}
        title="Music Studio"
        blurb="Describe a vibe. Lyria turns it into an actual track — no theory degree required."
      />
      <PromptTextarea value={prompt} onChange={setPrompt} placeholder="What should it sound like?" rows={3} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Engine:</label>
        {(['lyria-3-clip-preview', 'lyria-3-pro-preview'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModel(m)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold border-2 transition ${
              model === m ? 'text-white' : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
            style={model === m ? { background: `linear-gradient(135deg, ${TEAL}, ${PINK})`, borderColor: 'transparent' } : undefined}
          >
            {m === 'lyria-3-clip-preview' ? 'Clip (quick, ≤30s)' : 'Pro (full track)'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-pink-400">
          <ImagePlus size={16} /> Add an inspiration image (optional)
          <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        </label>
        {inspirationImage && (
          <div className="relative">
            <img src={inspirationImage} alt="inspiration" className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700" />
            <button
              onClick={() => setInspirationImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center"
              aria-label="Remove inspiration image"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {error && <StudioError message={error} />}
      <StudioGenerateButton onClick={handleGenerate} busy={busy} busyLabel="Composing…" label="Generate track" icon={<Music size={16} />} />

      {audioUrl && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your track</p>
          <audio controls src={audioUrl} className="w-full" />
          {info && <p className="text-xs text-slate-500 dark:text-slate-400">{info}</p>}
        </div>
      )}
      {!audioUrl && info && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{info}</p>
      )}
    </div>
  );
};
