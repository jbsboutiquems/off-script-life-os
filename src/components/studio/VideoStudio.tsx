// AI Studio — Video tab. Veo via our own /api/studio/video endpoints
// (generate → poll status → download through the server proxy).
import React, { useState, useEffect, useRef } from 'react';
import { Video, Upload, Download, Clock } from 'lucide-react';
import { studioApi, fileToDataUrl, StudioNotConfiguredError } from './studioApi';
import { StudioSectionTitle, StudioError, StudioNotConfiguredCard, StudioGenerateButton, PromptTextarea, PINK, TEAL } from './StudioShared';

export const VideoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('Cinematic aerial shot skimming over a misty pine forest into golden morning sunlight, slow and dreamy.');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [sourcePhoto, setSourcePhoto] = useState<string | null>(null);
  const [sourceMime, setSourceMime] = useState<string>('image/png');
  const [busy, setBusy] = useState(false);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = async (opName: string) => {
    try {
      const res = await studioApi.videoStatus(opName);
      if (res.done) {
        stopPolling();
        setStatusText('Render complete — pulling it down…');
        setDownloading(true);
        try {
          const url = await studioApi.downloadVideo(opName);
          setVideoUrl(url);
          setStatusText('Ready. Saved to your studio library.');
        } catch (dlErr: any) {
          setError(dlErr.message || 'Could not download the video.');
          setStatusText('');
        } finally {
          setDownloading(false);
        }
      } else {
        setStatusText('Rendering… this usually takes a few minutes. Feel free to wander off; I\u2019ll keep checking.');
      }
    } catch (e: any) {
      if (e instanceof StudioNotConfiguredError) {
        stopPolling();
        setNotConfigured(true);
      }
      // transient poll errors: keep polling quietly
    }
  };

  const handleGenerate = async () => {
    stopPolling();
    setBusy(true);
    setVideoUrl(null);
    setOperationName(null);
    setStatusText('Sending your scene to the render farm…');
    setError(null);
    try {
      const res = await studioApi.generateVideo({
        prompt,
        aspectRatio,
        imageBase64: sourcePhoto || undefined,
        mimeType: sourceMime
      });
      setOperationName(res.operationName);
      setStatusText('Render started — checking progress…');
      pollRef.current = setInterval(() => pollStatus(res.operationName), 8000);
      void pollStatus(res.operationName);
    } catch (e: any) {
      if (e instanceof StudioNotConfiguredError) setNotConfigured(true);
      else setError(e.message || 'Video generation failed.');
      setStatusText('');
    } finally {
      setBusy(false);
    }
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSourcePhoto(await fileToDataUrl(file));
      setSourceMime(file.type || 'image/png');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (notConfigured) return <StudioNotConfiguredCard />;

  return (
    <div className="space-y-4">
      <StudioSectionTitle
        icon={<Video size={20} />}
        title="Video Studio"
        blurb="Type a scene, get a cinematic clip. Optionally start from one of your own photos."
      />
      <PromptTextarea value={prompt} onChange={setPrompt} placeholder="Describe the scene…" rows={3} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Frame:</span>
        {(['16:9', '9:16'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAspectRatio(a)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold border-2 transition ${
              aspectRatio === a ? 'text-white' : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
            style={aspectRatio === a ? { background: `linear-gradient(135deg, ${TEAL}, ${PINK})`, borderColor: 'transparent' } : undefined}
          >
            {a === '16:9' ? '16:9 landscape' : '9:16 vertical'}
          </button>
        ))}
        <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-pink-400">
          <Upload size={16} /> {sourcePhoto ? 'Swap start photo' : 'Start from a photo (optional)'}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
        </label>
        {sourcePhoto && (
          <img src={sourcePhoto} alt="video start frame" className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700" />
        )}
      </div>

      {error && <StudioError message={error} />}
      <StudioGenerateButton onClick={handleGenerate} busy={busy} busyLabel="Sending…" label="Render video" icon={<Video size={16} />} />

      {statusText && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Clock size={15} className="animate-pulse" style={{ color: TEAL }} />
          {statusText}
        </div>
      )}

      {videoUrl && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <video controls src={videoUrl} className="rounded-xl w-full max-h-[420px] bg-black" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">Operation logged in your studio library — you can re-download it from there.</p>
            <a
              href={videoUrl}
              download={`offscript-video-${Date.now()}.mp4`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              style={{ color: PINK }}
            >
              <Download size={14} /> Save to device
            </a>
          </div>
        </div>
      )}
      {!videoUrl && operationName && downloading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Fetching your finished render…</p>
      )}
    </div>
  );
};
