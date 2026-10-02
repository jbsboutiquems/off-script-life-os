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
import { Music, Image as ImageIcon, Video, Mic, Library, Sparkles } from 'lucide-react';
import { studioApi, StudioNotConfiguredError } from './studioApi';
import { StudioHeader, StudioNotConfiguredCard, PINK, TEAL } from './StudioShared';
import { MusicStudio } from './MusicStudio';
import { ImageStudio } from './ImageStudio';
import { VideoStudio } from './VideoStudio';
import { TranscribeStudio } from './TranscribeStudio';
import { MediaLibrary } from './MediaLibrary';
import {
  AI_CONSENT_CHANGED_EVENT,
  getAiConsent,
  reaskAiConsent,
  requestAiConsent,
  type AiConsentState
} from '../../services/aiConsent';

type StudioTab = 'music' | 'image' | 'video' | 'transcribe' | 'library';

const TABS: Array<{ id: StudioTab; label: string; icon: React.ReactNode }> = [
  { id: 'music', label: 'Music', icon: <Music size={16} /> },
  { id: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
  { id: 'video', label: 'Video', icon: <Video size={16} /> },
  { id: 'transcribe', label: 'Transcribe', icon: <Mic size={16} /> },
  { id: 'library', label: 'Library', icon: <Library size={16} /> }
];

export const AiStudioView: React.FC<{ userId?: string | null }> = ({ userId }) => {
  const [tab, setTab] = useState<StudioTab>('music');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [consent, setConsent] = useState<AiConsentState>(() => getAiConsent(userId));

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

  // First open: ask for Google Gemini consent if the user hasn't decided yet.
  useEffect(() => {
    if (getAiConsent(userId) === 'unknown') requestAiConsent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stay in sync when the consent modal resolves.
  useEffect(() => {
    const onChange = () => setConsent(getAiConsent(userId));
    window.addEventListener(AI_CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AI_CONSENT_CHANGED_EVENT, onChange);
  }, [userId]);

  const generativeTab = tab !== 'library';
  const consentDeclined = consent === 'declined';

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
        ) : consentDeclined && generativeTab ? (
          <div className="text-center py-10 px-4">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Sparkles size={22} />
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-stone-100 mb-2">
              Gemini is off — and that's fine
            </h3>
            <p className="text-sm text-slate-500 dark:text-stone-400 max-w-sm mx-auto mb-5">
              The {TABS.find((t) => t.id === tab)?.label} studio runs on Google&nbsp;Gemini, which you
              haven't enabled. Everything else in the app works normally.
            </p>
            <button
              onClick={() => reaskAiConsent(userId)}
              className="rounded-xl bg-gradient-to-r from-[#ea4798] to-[#2da2ee] px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:brightness-110"
            >
              Enable Gemini
            </button>
          </div>
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
