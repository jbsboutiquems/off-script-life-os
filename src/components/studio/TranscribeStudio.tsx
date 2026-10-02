// AI Studio — Transcribe tab. Record or upload audio, get verbatim text
// back via our own /api/studio/transcribe endpoint.
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Copy, Check } from 'lucide-react';
import { studioApi, fileToDataUrl, StudioNotConfiguredError } from './studioApi';
import { StudioSectionTitle, StudioError, StudioNotConfiguredCard, StudioGenerateButton, PINK, TEAL } from './StudioShared';

export const TranscribeStudio: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioReady, setAudioReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>('audio/webm');
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    setAudioReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mimeRef.current = recorder.mimeType || 'audio/webm';
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        blobRef.current = new Blob(chunksRef.current, { type: mimeRef.current });
        setAudioReady(true);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone access was denied. You can still upload an audio file instead.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('Could not read that recording.'));
      r.readAsDataURL(blob);
    });

  const handleTranscribe = async () => {
    if (!blobRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await blobToDataUrl(blobRef.current);
      const res = await studioApi.transcribe({ audioBase64: dataUrl, mimeType: mimeRef.current });
      setTranscript(res.transcription || res.transcript || '');
      if (!res.transcription && !res.transcript) setError('Nothing came back — the audio may be silent.');
    } catch (e: any) {
      if (e instanceof StudioNotConfiguredError) setNotConfigured(true);
      else setError(e.message || 'Transcription failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setTranscript('');
    try {
      const dataUrl = await fileToDataUrl(file);
      // data URL -> blob for a uniform path
      const resp = await fetch(dataUrl);
      blobRef.current = await resp.blob();
      mimeRef.current = file.type || 'audio/webm';
      setAudioReady(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopy = async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed — select the text manually.');
    }
  };

  if (notConfigured) return <StudioNotConfiguredCard />;

  return (
    <div className="space-y-4">
      <StudioSectionTitle
        icon={<Mic size={20} />}
        title="Transcribe"
        blurb="Rant into the void, get your exact words back. Verbatim — no summarizing your brilliance away."
      />

      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow"
            style={{ background: `linear-gradient(135deg, ${TEAL}, ${PINK})` }}
          >
            <Mic size={16} /> Start recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow bg-rose-600"
          >
            <Square size={16} /> Stop
          </button>
        )}
        <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-pink-400">
          <Upload size={16} /> Upload audio file
          <input type="file" accept="audio/*" className="hidden" onChange={handleFilePick} />
        </label>
        {recording && <span className="text-sm font-semibold text-rose-500 animate-pulse">● Recording…</span>}
      </div>

      {error && <StudioError message={error} />}

      {audioReady && !busy && !transcript && (
        <StudioGenerateButton onClick={handleTranscribe} busy={busy} busyLabel="Listening…" label="Transcribe it" icon={<Mic size={16} />} />
      )}
      {busy && <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Listening closely…</p>}

      {transcript && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your words, exactly</p>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              style={{ color: PINK }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">{transcript}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Saved to your studio library.</p>
        </div>
      )}
    </div>
  );
};
