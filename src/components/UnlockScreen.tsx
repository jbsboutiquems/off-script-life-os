import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, KeyRound, LoaderCircle, LockKeyhole, QrCode, ScanLine, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

interface UnlockScreenProps {
  onUnlocked: (packId: string) => void;
}

export const UnlockScreen: React.FC<UnlockScreenProps> = ({ onUnlocked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectingRef = useRef(false);
  const [token, setToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  };

  useEffect(() => stopCamera, []);

  const redeem = async (rawToken: string) => {
    const normalized = rawToken.trim().toUpperCase();
    if (!normalized || isRedeeming) return;
    setIsRedeeming(true);
    setError(null);
    setMessage('Verifying single-use code…');
    stopCamera();
    const result = await api.redeemToken(normalized);
    setIsRedeeming(false);
    if (!result.success || !result.packId) {
      setMessage(null);
      setError(result.error || 'Unable to unlock this content pack.');
      return;
    }
    setMessage(`${result.title || 'Content pack'} unlocked.`);
    onUnlocked(result.packId);
  };

  const startCamera = async () => {
    setError(null);
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera scanning is not available in this browser. Enter the printed token below instead.');
      return;
    }
    if (!window.BarcodeDetector) {
      setError('This browser does not expose QR detection. Enter the printed token below instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      setIsScanning(true);

      const scanFrame = async () => {
        if (!videoRef.current || !streamRef.current) return;
        if (!detectingRef.current) {
          detectingRef.current = true;
          try {
            const detections = await detector.detect(videoRef.current);
            const value = detections[0]?.rawValue;
            if (value) {
              setToken(value);
              await redeem(value);
              return;
            }
          } catch {
            // Continue scanning; camera frames can be undecodable while the user moves the code.
          } finally {
            detectingRef.current = false;
          }
        }
        frameRef.current = requestAnimationFrame(scanFrame);
      };
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (cameraError) {
      console.warn('Unable to start QR camera', cameraError);
      setError('Camera permission was unavailable. Enter the printed token below instead.');
      stopCamera();
    }
  };

  return (
    <main className="min-h-screen bg-cream-canvas px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-900 bg-slate-900 text-rose-300 shadow-lg">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-rose-700">Content access checkpoint</p>
          <h1 className="font-serif-display text-4xl font-bold text-slate-950">Unlock your Off*Script pack</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
            Scan the QR code printed with your physical planner. Each code is single-use and becomes permanently associated with this account after redemption.
          </p>
        </div>

        <section className="rounded-3xl border-2 border-stone-900 bg-white p-5 shadow-xl sm:p-7">
          <div className="mb-5 flex items-center gap-3 border-b border-stone-200 pb-4">
            <QrCode className="h-6 w-6 text-rose-600" />
            <div>
              <h2 className="font-bold text-slate-950">Scan QR code</h2>
              <p className="text-xs text-stone-500">Camera access stays on this device.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-stone-950">
            {isScanning ? (
              <div className="relative aspect-video">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-rose-400 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]">
                  <ScanLine className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-rose-300" />
                </div>
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center text-stone-300">
                <Camera className="h-10 w-10 text-rose-400" />
                <p className="text-sm">Your camera preview will appear here.</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {!isScanning ? (
              <button onClick={startCamera} disabled={isRedeeming} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">
                <Camera className="h-4 w-4" /> Scan with camera
              </button>
            ) : (
              <button onClick={stopCamera} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-100">
                Stop camera
              </button>
            )}
          </div>

          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            <span className="h-px flex-1 bg-stone-200" /> Or enter printed token <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={(event) => { event.preventDefault(); void redeem(token); }} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="qr-token" className="sr-only">QR token</label>
            <input id="qr-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="PACK-A8F92-9901" autoCapitalize="characters" autoCorrect="off" spellCheck={false} className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-3 py-3 font-mono-code text-sm uppercase outline-none ring-rose-300 focus:ring-2" />
            <button type="submit" disabled={!token.trim() || isRedeeming} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isRedeeming ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Unlock
            </button>
          </form>

          {message && <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />{message}</p>}
          {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800"><ShieldAlert className="h-4 w-4 shrink-0" />{error}</p>}
        </section>

        <p className="mt-5 text-center text-[11px] leading-5 text-stone-500">Never share a redeemed token. In production, redemption is enforced by an authenticated database transaction.</p>
      </div>
    </main>
  );
};

export default UnlockScreen;
