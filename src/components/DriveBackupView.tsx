import React, { useState, useEffect, useCallback } from 'react';
import { HardDrive, Upload, Download, KeyRound, CheckCircle, AlertTriangle, Loader2, LogOut, FileJson, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';
import { downloadFile, entriesToCsv } from '../lib/exporter';
import { DailyEntry } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface DriveSettings {
  apiKey: string;
  clientId: string;
  /** Google Cloud project number — the numeric App ID the Picker API requires. */
  appId: string;
}

const SETTINGS_KEY = 'lifeos_drive_settings';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DEFAULT_SETTINGS: DriveSettings = { apiKey: '', clientId: '', appId: '' };

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

interface DriveBackupViewProps {
  onRestored: () => void;
  entries?: DailyEntry[];
}

export const DriveBackupView: React.FC<DriveBackupViewProps> = ({ onRestored, entries = [] }) => {
  const [settings, setSettings] = useState<DriveSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(() => localStorage.getItem('lifeos_last_drive_backup'));

  const saveSettings = (s: DriveSettings) => {
    setSettings(s);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  };

  const ensureGoogleScripts = useCallback(async () => {
    await loadScript('https://apis.google.com/js/api.js');
    await loadScript('https://accounts.google.com/gsi/client');
    await new Promise<void>((resolve) => window.gapi.load('picker', () => resolve()));
  }, []);

  const connectGoogle = async () => {
    if (!settings.apiKey.trim() || !settings.clientId.trim()) {
      setMessage({ kind: 'err', text: 'Add your Google API key and OAuth client ID first (gear icon).' });
      setShowSettings(true);
      return;
    }
    setBusy('connect');
    setMessage(null);
    try {
      await ensureGoogleScripts();
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: settings.clientId.trim(),
        scope: DRIVE_SCOPE,
        callback: (resp: any) => {
          if (resp && resp.access_token) {
            setAccessToken(resp.access_token);
            setMessage({ kind: 'ok', text: 'Google Drive connected. You can back up or restore now.' });
          } else {
            setMessage({ kind: 'err', text: 'Google sign-in was cancelled or failed.' });
          }
          setBusy(null);
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (e: any) {
      setBusy(null);
      setMessage({ kind: 'err', text: `Could not reach Google: ${e?.message || e}` });
    }
  };

  const disconnect = () => {
    if (accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, () => undefined);
    }
    setAccessToken(null);
    setMessage({ kind: 'info', text: 'Disconnected from Google Drive.' });
  };

  const backupNow = async () => {
    if (!accessToken) {
      setMessage({ kind: 'err', text: 'Connect Google Drive first.' });
      return;
    }
    setBusy('backup');
    setMessage(null);
    try {
      const sessionToken = api.getToken();
      const res = await fetch('/api/backup/export', {
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
      });
      if (!res.ok) throw new Error('Export failed on the server.');
      const payload = await res.json();
      const fileName = `off-script-life-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      const metadata = { name: fileName, mimeType: 'application/json' };
      const boundary = `-------314159265358979323846_${Date.now()}`;
      const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload)}\r\n` +
        `--${boundary}--`;
      const up = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      });
      if (!up.ok) {
        const errText = await up.text();
        throw new Error(`Drive upload failed (${up.status}): ${errText.slice(0, 200)}`);
      }
      const stamp = new Date().toISOString();
      setLastBackup(stamp);
      localStorage.setItem('lifeos_last_drive_backup', stamp);
      setMessage({ kind: 'ok', text: `Backed up to Google Drive as ${fileName}.` });
    } catch (e: any) {
      setMessage({ kind: 'err', text: `Backup failed: ${e?.message || e}` });
    } finally {
      setBusy(null);
    }
  };

  const restoreFromDrive = async () => {
    if (!accessToken) {
      setMessage({ kind: 'err', text: 'Connect Google Drive first.' });
      return;
    }
    setBusy('restore');
    setMessage(null);
    try {
      await ensureGoogleScripts();
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setMimeTypes('application/json')
        .setIncludeFolders(true);
      // Picker needs the numeric Google Cloud project number as its App ID.
      // Prefer the explicit value; fall back to the client-ID prefix only for
      // older setups (that inference is unreliable for newer client IDs).
      const inferred = settings.clientId.trim().split('-')[0].split('.')[0];
      const appId = settings.appId.trim() || inferred;
      if (!appId || !/^\d+$/.test(appId)) {
        setMessage({ kind: 'err', text: 'Add your Google Cloud project number (App ID) in settings — the picker needs the numeric project number, not the client ID.' });
        setShowSettings(true);
        setBusy(null);
        return;
      }
      const picker = new window.google.picker.PickerBuilder()
        .setAppId(appId)
        .setOAuthToken(accessToken)
        .setDeveloperKey(settings.apiKey.trim())
        .addView(view)
        .setTitle('Choose an Off*Script backup file')
        .setCallback(async (data: any) => {
          try {
            if (data.action === window.google.picker.Action.PICKED && data.docs?.length) {
              const fileId = data.docs[0].id;
              const dl = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (!dl.ok) throw new Error(`Download failed (${dl.status}).`);
              const backup = await dl.json();
              const sessionToken = api.getToken();
              const imp = await fetch('/api/backup/import', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
                },
                body: JSON.stringify(backup),
              });
              const result = await imp.json();
              if (!imp.ok) throw new Error(result.error || 'Import rejected by server.');
              setMessage({ kind: 'ok', text: 'Backup restored. Reloading your data…' });
              setTimeout(() => onRestored(), 800);
            } else if (data.action === window.google.picker.Action.CANCEL) {
              setMessage({ kind: 'info', text: 'Picker closed — nothing restored.' });
            }
          } catch (e: any) {
            setMessage({ kind: 'err', text: `Restore failed: ${e?.message || e}` });
          } finally {
            setBusy(null);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (e: any) {
      setBusy(null);
      setMessage({ kind: 'err', text: `Could not open picker: ${e?.message || e}` });
    }
  };

  useEffect(() => {
    return () => setBusy(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* One-tap exports — your data, your files, no Drive round trip needed */}
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-600 text-white flex items-center justify-center border border-stone-800">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold font-serif-display text-lg text-slate-900 dark:text-cream-canvas">Take your data with you</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">One tap. Downloads straight to this device.</p>
          </div>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <button
            onClick={async () => {
              const sessionToken = api.getToken();
              const res = await fetch('/api/backup/export', {
                headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
              });
              if (!res.ok) throw new Error('Export failed.');
              const payload = await res.json();
              downloadFile(
                `off-script-life-os-backup-${new Date().toISOString().split('T')[0]}.json`,
                'application/json',
                JSON.stringify(payload, null, 2)
              );
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-sm font-bold rounded-2xl transition-all"
          >
            <FileJson className="w-4 h-4" /> Full JSON backup
          </button>
          <button
            onClick={() => {
              const sortedEntries = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
              if (sortedEntries.length === 0) {
                setMessage({ kind: 'info', text: 'No flight logs yet — nothing to export.' });
                return;
              }
              downloadFile(
                `off-script-flight-logs-${new Date().toISOString().split('T')[0]}.csv`,
                'text/csv',
                entriesToCsv(sortedEntries)
              );
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-white/5 border-2 border-stone-300 dark:border-white/20 hover:border-indigo-500 text-slate-900 dark:text-cream-canvas text-sm font-bold rounded-2xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Flight logs as CSV
          </button>
        </div>
        <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400 italic font-serif-display">
          JSON has everything; CSV is just the flight logs, spreadsheet-friendly. Nobody else sees either.
        </p>
      </div>

      <div className="bg-white border border-stone-300 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center border border-stone-800">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif-display text-lg text-slate-900">Google Drive Backup</h3>
              <p className="text-xs text-stone-500">
                {lastBackup ? `Last backup: ${new Date(lastBackup).toLocaleString()}` : 'No Drive backup yet.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors"
              title="Google API credentials"
            >
              <KeyRound className="w-4 h-4 text-stone-500" /> {showSettings ? 'Hide keys' : 'API keys'}
            </button>
            {accessToken ? (
              <button
                onClick={disconnect}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-stone-500" /> Disconnect
              </button>
            ) : (
              <button
                onClick={connectGoogle}
                disabled={busy === 'connect'}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {busy === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Connect Google
              </button>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="mt-5 border-2 border-dashed border-stone-300 rounded-2xl p-4 space-y-3 bg-stone-50/60">
            <p className="text-xs text-stone-600">
              Create these free in the <span className="font-bold">Google Cloud Console</span>: an <span className="font-bold">API key</span> (enable
              Google Picker API + Google Drive API), an <span className="font-bold">OAuth 2.0 client ID</span> (web app — add this
              page's origin under authorized JavaScript origins), and your <span className="font-bold">project number</span> (the numeric
              App ID the file picker requires — find it on the Cloud Console dashboard). Keys stay in this browser only.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono-code uppercase tracking-wider text-stone-500 font-bold">API key</label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => saveSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="AIza…"
                  className="mt-1 w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-teal-400 font-mono-code"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono-code uppercase tracking-wider text-stone-500 font-bold">OAuth client ID</label>
                <input
                  type="password"
                  value={settings.clientId}
                  onChange={(e) => saveSettings({ ...settings, clientId: e.target.value })}
                  placeholder="…apps.googleusercontent.com"
                  className="mt-1 w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-teal-400 font-mono-code"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono-code uppercase tracking-wider text-stone-500 font-bold">
                  App ID · Google Cloud project number
                </label>
                <input
                  value={settings.appId}
                  onChange={(e) => saveSettings({ ...settings, appId: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="e.g. 123456789012"
                  inputMode="numeric"
                  className="mt-1 w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-teal-400 font-mono-code"
                />
                <p className="mt-1 text-[11px] text-stone-500">
                  Digits only — this is the project <span className="font-bold">number</span>, not the client ID. Without it the
                  picker can't open; older setups may still work via the client-ID fallback.
                </p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
              message.kind === 'ok'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : message.kind === 'err'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-sky-50 border-sky-300 text-sky-900'
            }`}
          >
            {message.kind === 'err' ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <button
            onClick={backupNow}
            disabled={!accessToken || busy === 'backup'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-40"
          >
            {busy === 'backup' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Back up to Drive
          </button>
          <button
            onClick={restoreFromDrive}
            disabled={!accessToken || busy === 'restore'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-stone-300 hover:border-emerald-500 text-slate-900 text-sm font-bold rounded-2xl transition-all disabled:opacity-40"
          >
            {busy === 'restore' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Restore from Drive…
          </button>
        </div>
        <p className="mt-3 text-[11px] text-stone-500 italic font-serif-display">
          Restore replaces everything on this device with the backup file. Back up first if you're unsure — future you says thanks.
        </p>
      </div>
    </div>
  );
};
