// AI Studio — Image tab. Create + edit via our own /api/studio/image endpoints.
import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Download } from 'lucide-react';
import { studioApi, fileToDataUrl, StudioNotConfiguredError } from './studioApi';
import { StudioSectionTitle, StudioError, StudioNotConfiguredCard, StudioGenerateButton, PromptTextarea, PINK, TEAL } from './StudioShared';

const ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const;

export const ImageStudio: React.FC = () => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('Risograph print of a bold geometric lightning bolt surrounded by abstract retro botanical patterns, deep rose and amber tones, gritty paper grain.');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMime, setSourceMime] = useState<string>('image/png');
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const handleSourcePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSourceImage(await fileToDataUrl(file));
      setSourceMime(file.type || 'image/png');
      setResultUrl(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'edit' && !sourceImage) {
      setError('Upload a source image first — the edit needs something to work with.');
      return;
    }
    setBusy(true);
    setResultUrl(null);
    setError(null);
    try {
      const res =
        mode === 'create'
          ? await studioApi.generateImage({ prompt, aspectRatio })
          : await studioApi.editImage({ imageBase64: sourceImage!, prompt, mimeType: sourceMime });
      setResultUrl(res.imageUrl);
    } catch (e: any) {
      if (e instanceof StudioNotConfiguredError) setNotConfigured(true);
      else setError(e.message || 'Image generation failed.');
    } finally {
      setBusy(false);
    }
  };

  if (notConfigured) return <StudioNotConfiguredCard />;

  return (
    <div className="space-y-4">
      <StudioSectionTitle
        icon={<ImageIcon size={20} />}
        title="Image Studio"
        blurb="Conjure new artwork from a sentence, or remix an image you already have."
      />

      <div className="flex gap-2">
        {(['create', 'edit'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResultUrl(null); setError(null); }}
            className={`rounded-xl px-4 py-2 text-sm font-bold border-2 transition ${
              mode === m ? 'text-white' : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
            style={mode === m ? { background: `linear-gradient(135deg, ${TEAL}, ${PINK})`, borderColor: 'transparent' } : undefined}
          >
            {m === 'create' ? 'Create new' : 'Edit an image'}
          </button>
        ))}
      </div>

      {mode === 'edit' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-pink-400">
            <Upload size={16} /> {sourceImage ? 'Swap source image' : 'Upload source image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleSourcePick} />
          </label>
          {sourceImage && (
            <img src={sourceImage} alt="source" className="w-20 h-20 rounded-xl object-cover border border-slate-300 dark:border-slate-700" />
          )}
        </div>
      )}

      <PromptTextarea value={prompt} onChange={setPrompt} placeholder={mode === 'create' ? 'Describe the image…' : 'Describe the edit — what should change?'} rows={3} />

      {mode === 'create' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mr-1">Shape:</span>
          {ASPECTS.map((a) => (
            <button
              key={a}
              onClick={() => setAspectRatio(a)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold border-2 transition ${
                aspectRatio === a ? 'text-white' : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
              style={aspectRatio === a ? { background: `linear-gradient(135deg, ${TEAL}, ${PINK})`, borderColor: 'transparent' } : undefined}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {error && <StudioError message={error} />}
      <StudioGenerateButton
        onClick={handleGenerate}
        busy={busy}
        busyLabel={mode === 'create' ? 'Conjuring…' : 'Remixing…'}
        label={mode === 'create' ? 'Generate image' : 'Apply edit'}
        icon={<ImageIcon size={16} />}
      />

      {resultUrl && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <img src={resultUrl} alt="generated" className="rounded-xl w-full max-h-[480px] object-contain bg-slate-100 dark:bg-slate-800" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">Saved to your studio library.</p>
            <a
              href={resultUrl}
              download={`offscript-image-${Date.now()}.png`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              style={{ color: PINK }}
            >
              <Download size={14} /> Save to device
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
