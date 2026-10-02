// AI Studio Hub — Off*Script media generation studio (Gemini-backed, server-side only).
// Tabs: Music, Image, Video, Transcribe, Library.
// The client NEVER calls Google directly — all work goes through /api/studio/*.
// When GEMINI_API_KEY is unset on the server, each tab shows friendly
// "studio not configured" messaging instead of the feature.
//
// Mount me in App nav as: <AiStudioView />
// Suggested mount point: a new top-level nav tab ("AI Studio") next to the
// existing views (Cosmic Corner, Holidays, etc.) — or inside Cosmic Corner as
// a creative-tools section. Do NOT add Gemini anywhere else.
import React, { useState, useEffect } from 'react';
import { Music, Image as ImageIcon, Video, Mic, Library } from 'lucide-react';
import { studioApi, StudioNotConfiguredError } from './studioApi';
import { StudioHeader, StudioNotConfiguredCard, PINK, TEAL } from './StudioShared';
import { MusicStudio } from './MusicStudio';
import { ImageStudio } from './ImageStudio';
import { VideoStudio } from './VideoStudio';
import { TranscribeStudio } from './TranscribeStudio';
import { MediaLibrary } from './MediaLibrary';

type StudioTab = 'music' | 'image' | 'video' | 'transcribe' | 'library';

const TABS: Array<{ id: StudioTab; label: string; icon: React.ReactNode }> = [
  { id: 'music', label: 'Music', icon: <Music size={16} /> },
  { id: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
  { id: 'video', label: 'Video', icon: <Video size={16} /> },
  { id: 'transcribe', label: 'Transcribe', icon: <Mic size={16} /> },
  { id: 'library', label: 'Library', icon: <Library size={16} /> }
];

export const AiStudioView: React.FC = () => {
  const [tab, setTab] = useState<StudioTab>('music');
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    studioApi
      .status()
      .then((s) => {
        if (!cancelled) setConfigured(s.configured);
      })
      .catch((e) => {
        if (!cancelled) setConfigured(!(e instanceof StudioNotConfiguredError));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <StudioHeader />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border-2 transition ${
              tab === t.id ? 'text-white' : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
            style={tab === t.id ? { background: `linear-gradient(135deg, ${TEAL}, ${PINK})`, borderColor: 'transparent' } : undefined}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-6">
        {configured === false ? (
          <StudioNotConfiguredCard />
        ) : (
          <>
            {tab === 'music' && <MusicStudio />}
            {tab === 'image' && <ImageStudio />}
            {tab === 'video' && <VideoStudio />}
            {tab === 'transcribe' && <TranscribeStudio />}
            {tab === 'library' && <MediaLibrary />}
          </>
        )}
      </div>
    </div>
  );
};
