// First-launch Android runtime permission explainer.
//
// Only renders on native Android. Shows ONE friendly card naming the two
// permissions the app genuinely uses — camera (QR pack scanning in the
// Unlock screen) and microphone (voice-note transcription in the AI Studio)
// — then triggers the OS prompt via getUserMedia (Capacitor forwards this to
// the Android runtime permission flow).
//
// Denial or dismissal never blocks the app; we ask exactly once per user.
// No other permissions are requested.
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, Mic, X } from 'lucide-react';

interface Props {
  userId?: string | null;
}

const keyFor = (userId?: string | null) => `lifeos:${userId || 'anon'}:android-perms:v1`;

function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export const AndroidPermissionGate: React.FC<Props> = ({ userId }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isNativeAndroid()) return;
    try {
      if (localStorage.getItem(keyFor(userId))) return; // already asked once
    } catch {
      // ignore — storage unavailable, still ask once per mount
    }
    // Let first paint land before we ask for anything.
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [userId]);

  const dismiss = () => {
    try {
      localStorage.setItem(keyFor(userId), '1');
    } catch {
      // ignore
    }
    setShow(false);
  };

  const enable = async () => {
    try {
      // Triggers the Android runtime permission prompt for CAMERA +
      // RECORD_AUDIO (both declared in AndroidManifest.xml). We stop the
      // tracks immediately — we only needed the prompt, not the stream.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // Denied or unavailable — fine. The app works without them.
    }
    dismiss();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="android-perms-title"
    >
      <div className="mx-auto w-full max-w-md rounded-2xl border-2 border-[#2da2ee]/40 bg-[#faf7f0] dark:bg-[#000a15] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="android-perms-title" className="text-base font-black text-slate-900 dark:text-stone-100">
            Two quick permissions
          </h2>
          <button
            onClick={dismiss}
            aria-label="Not now"
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-stone-300"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-stone-300 mb-4">
          Off*Script only asks for what it actually uses — nothing else, ever:
        </p>

        <ul className="space-y-3 mb-5">
          <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2da2ee]/15 text-[#2da2ee]">
              <Camera size={18} />
            </span>
            <span className="text-sm text-slate-600 dark:text-stone-300">
              <strong className="text-slate-900 dark:text-stone-100">Camera</strong> — scans QR codes
              to unlock content packs.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ea4798]/15 text-[#ea4798]">
              <Mic size={18} />
            </span>
            <span className="text-sm text-slate-600 dark:text-stone-300">
              <strong className="text-slate-900 dark:text-stone-100">Microphone</strong> — records
              voice notes for transcription in the AI&nbsp;Studio.
            </span>
          </li>
        </ul>

        <div className="flex gap-2">
          <button
            onClick={enable}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#2da2ee] to-[#ea4798] px-4 py-2.5 text-sm font-black text-white shadow-lg transition hover:brightness-110"
          >
            Enable
          </button>
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl border-2 border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-stone-300 transition hover:border-slate-400"
          >
            Not now
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-stone-500 text-center">
          Saying no changes nothing — the app works fine without them.
        </p>
      </div>
    </div>
  );
};
