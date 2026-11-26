// Snoopster's voice — high-pitched, playful, male.
//
// Pure Web Speech API (window.speechSynthesis): free, no API key, no
// network, works in browsers and in the Capacitor WebView. The text is
// spoken on-device by the device's own speech engine — nothing about
// the voice leaves the app.
//
// Snoopster's sound: high pitch (1.5) and a slightly brisk rate (1.1),
// so he sounds like an excited little chihuahua even on a standard
// male voice.
//
// Voice pick: prefer an English male voice (name heuristics), fall back
// to any English voice, then any voice at all — the pitch/rate still
// apply, so he stays high and playful. Voices load async, so we keep a
// cached list refreshed on `voiceschanged`.

export const SNOOPSTER_VOICE_PITCH = 1.5;
export const SNOOPSTER_VOICE_RATE = 1.1;

// Common male voice names across Chrome / Android Google TTS / macOS /
// Windows. Word-boundary matched so "female" never counts as male and
// "Alexandra" never counts as "Alex".
const MALE_VOICE_PATTERN =
  /\b(male|david|daniel|james|alex|fred|george|guy|ryan|christopher|mark|aaron|brian|kevin|adam|andrew|anthony|benjamin|charles|edward|frank|henry|jack|jason|jeffrey|joseph|joshua|justin|kenneth|larry|matthew|nicholas|patrick|paul|peter|richard|robert|ronald|samuel|scott|sean|stephen|thomas|timothy|william)\b/i;

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    !!window.speechSynthesis
  );
}

// Cached voice list — getVoices() is empty until voices load, then the
// browser fires `voiceschanged`. Keep the cache fresh so the pick is
// right even if the user taps speak before the event fires.
let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices(): void {
  if (!isSpeechSupported()) return;
  cachedVoices = window.speechSynthesis.getVoices();
}

if (isSpeechSupported()) {
  refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

function isMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name;
  if (/\bfemale\b/i.test(name)) return false;
  return MALE_VOICE_PATTERN.test(name);
}

export function pickSnoopsterVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  refreshVoices();
  const voices = cachedVoices;
  if (voices.length === 0) return null;
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = en.length > 0 ? en : voices;
  return (
    pool.find((v) => isMaleVoice(v)) ??
    pool.find((v) => v.default) ??
    pool[0] ??
    null
  );
}

export interface SpeakOptions {
  onEnd?: () => void;
  onError?: () => void;
}

// Speak text as Snoopster. Cancels anything already playing first.
// Returns true if speech started, false if speech is unsupported or
// the text is empty.
export function speakSnoopster(text: string, opts: SpeakOptions = {}): boolean {
  if (!isSpeechSupported()) return false;
  const clean = text.trim();
  if (!clean) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voice = pickSnoopsterVoice();
  if (voice) utterance.voice = voice;
  utterance.pitch = SNOOPSTER_VOICE_PITCH;
  utterance.rate = SNOOPSTER_VOICE_RATE;
  utterance.volume = 1;
  utterance.onend = () => opts.onEnd?.();
  utterance.onerror = () => opts.onError?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSnoopster(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
