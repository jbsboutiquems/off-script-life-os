import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, X } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { apiUrl } from '../services/api';

/**
 * Self-update banner for sideloaded APKs. Compares the installed
 * versionCode against the server's latest and offers a one-tap download.
 * Only renders on native Android — web users just refresh.
 */
export const UpdateBanner: React.FC = () => {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    (async () => {
      try {
        const info = await CapApp.getInfo();
        const installed = parseInt(info.build || '0', 10);
        if (!installed) return;
        const res = await fetch(apiUrl('/api/app-version'));
        if (!res.ok) return;
        const latest = (await res.json()) as { versionCode: number; url: string };
        if (!cancelled && latest.versionCode > installed && latest.url) {
          setUpdateUrl(latest.url);
        }
      } catch {
        // update check is best-effort — never block the app
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!updateUrl || dismissed) return null;

  return (
    <div className="sticky top-0 z-[60] px-4 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <ArrowDownToLine className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 text-xs font-bold">A newer version of the app is ready.</p>
        <a
          href={updateUrl}
          className="px-4 py-1.5 bg-white text-rose-700 text-xs font-black rounded-xl shadow cursor-pointer"
        >
          Update
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="p-1 opacity-80 hover:opacity-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
