// AI Studio — Library tab. Saved generations, persisted server-side per user.
import React, { useState, useEffect } from 'react';
import { Library, Trash2, Music, Image as ImageIcon, Video, Mic, RefreshCw, Download } from 'lucide-react';
import { studioApi, StudioMediaItem } from './studioApi';
import { StudioSectionTitle, StudioError, PINK, TEAL } from './StudioShared';

function typeIcon(type: StudioMediaItem['type']) {
  switch (type) {
    case 'music': return <Music size={14} />;
    case 'image': return <ImageIcon size={14} />;
    case 'video': return <Video size={14} />;
    case 'transcript': return <Mic size={14} />;
  }
}

function typeLabel(type: StudioMediaItem['type']) {
  switch (type) {
    case 'music': return 'Track';
    case 'image': return 'Image';
    case 'video': return 'Video';
    case 'transcript': return 'Transcript';
  }
}

export const MediaLibrary: React.FC = () => {
  const [items, setItems] = useState<StudioMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await studioApi.listMedia());
    } catch (e: any) {
      setError(e.message || 'Could not load your studio library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await studioApi.deleteMedia(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleVideoDownload = async (item: StudioMediaItem) => {
    if (!item.operationName) return;
    setDownloadingId(item.id);
    setError(null);
    try {
      const url = await studioApi.downloadVideo(item.operationName);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offscript-video-${item.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      setError(e.message || 'Video download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <StudioSectionTitle
          icon={<Library size={20} />}
          title="Studio Library"
          blurb="Everything you've made in here, newest first. Private to your account."
        />
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-pink-400"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <StudioError message={error} />}
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Digging through the archives…</p>}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Nothing here yet.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Make something loud, strange, or beautiful in the other tabs — it\u2019ll land here.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white rounded-full px-2.5 py-1"
                style={{ background: `linear-gradient(135deg, ${TEAL}, ${PINK})` }}
              >
                {typeIcon(item.type)} {typeLabel(item.type)}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-slate-400 hover:text-rose-500"
                aria-label="Delete item"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {item.type === 'image' && item.resultUrl && (
                <img src={item.resultUrl} alt={item.prompt || 'studio image'} className="rounded-xl w-full max-h-56 object-cover" />
              )}
              {item.type === 'music' && item.resultUrl && (
                <audio controls src={item.resultUrl} className="w-full" />
              )}
              {item.type === 'transcript' && item.transcript && (
                <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-4 whitespace-pre-wrap">{item.transcript}</p>
              )}
              {item.type === 'video' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVideoDownload(item)}
                    disabled={downloadingId === item.id || !item.operationName}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${TEAL}, ${PINK})` }}
                  >
                    <Download size={13} />
                    {downloadingId === item.id ? 'Fetching…' : 'Download video'}
                  </button>
                </div>
              )}
              {item.prompt && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">“{item.prompt}”</p>
              )}
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {new Date(item.createdAt).toLocaleString()}
                {item.model ? ` · ${item.model}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
