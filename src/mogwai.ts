import { userGet, userSet } from './storage';

/**
 * Mogwai transformation engine.
 *
 * The buddy starts sweet/innocent (stage 0, "Gizmo") and transforms
 * stage-by-stage toward full gremlin (stage 3) as the three rules break:
 *   - sunlight/heat: racing through features (interaction velocity)
 *   - fed after midnight: saving content between 00:00–05:00 local
 *   - wet: hard device shake
 * Stages decay after ~20 min of calm use; full reset at 05:00 local daily.
 * Everything degrades gracefully when sensors/APIs are unavailable.
 */

export const MOGWAI_MAX_STAGE = 3;

export type MogwaiWarningKind = 'heat' | 'sleepy' | 'wet' | 'stage-up' | 'soothed';

export interface MogwaiWarning {
  kind: MogwaiWarningKind;
  stage: number;
  message: string;
}

const STAGE_KEY = 'mogwai_stage';
const STAGE_META_KEY = 'mogwai_meta';

interface MogwaiMeta {
  lastActivityAt: number;
  lastDecayCheck: number;
  lastResetDay: string; // YYYY-MM-DD
  sleepyWarnedDay: string | null;
}

type StageListener = (stage: number) => void;
type WarningListener = (w: MogwaiWarning) => void;

const stageListeners = new Set<StageListener>();
const warningListeners = new Set<WarningListener>();

export function onMogwaiStage(cb: StageListener): () => void {
  stageListeners.add(cb);
  return () => { stageListeners.delete(cb); };
}

export function onMogwaiWarning(cb: WarningListener): () => void {
  warningListeners.add(cb);
  return () => { warningListeners.delete(cb); };
}

function emitStage(stage: number) {
  stageListeners.forEach(cb => { try { cb(stage); } catch { /* ignore */ } });
}

function emitWarning(w: MogwaiWarning) {
  warningListeners.forEach(cb => { try { cb(w); } catch { /* ignore */ } });
}

function getMeta(): MogwaiMeta {
  const now = Date.now();
  return userGet<MogwaiMeta>(STAGE_META_KEY) || {
    lastActivityAt: now,
    lastDecayCheck: now,
    lastResetDay: '',
    sleepyWarnedDay: null,
  };
}

function setMeta(patch: Partial<MogwaiMeta>) {
  userSet(STAGE_META_KEY, { ...getMeta(), ...patch });
}

export function getMogwaiStage(): number {
  const s = userGet<number>(STAGE_KEY);
  return typeof s === 'number' ? Math.max(0, Math.min(MOGWAI_MAX_STAGE, s)) : 0;
}

function setStage(stage: number) {
  const clamped = Math.max(0, Math.min(MOGWAI_MAX_STAGE, stage));
  userSet(STAGE_KEY, clamped);
  setMeta({ lastActivityAt: Date.now() });
  emitStage(clamped);
}

const STAGE_UP_COPY = [
  'Gizmo is still sweet. For now.',
  "Gizmo's ears just got pointier…",
  'Scales are forming. Careful.',
  'FULL GREMLIN. It was nice knowing sweet Gizmo.',
];

/** Advance one stage (max 3). Returns the new stage. */
export function advanceMogwaiStage(reason: 'sunlight' | 'midnight-snack' | 'wet'): number {
  const next = Math.min(MOGWAI_MAX_STAGE, getMogwaiStage() + 1);
  const before = getMogwaiStage();
  setStage(next);
  if (next !== before) {
    emitWarning({ kind: 'stage-up', stage: next, message: STAGE_UP_COPY[next] });
  }
  return next;
}

/** Any calm interaction pushes the decay clock back. */
export function noteCalmActivity() {
  setMeta({ lastActivityAt: Date.now() });
}

// ---------- Sunlight / heat: interaction velocity ----------

const HEAT_WINDOW_MS = 10_000;
const HEAT_THRESHOLD = 12;
let tapTimes: number[] = [];
let heatWarnedAt = 0;
let heatStageAt = 0;

function pruneTaps(now: number) {
  tapTimes = tapTimes.filter(t => now - t < HEAT_WINDOW_MS);
}

/** Call on pointerdown / tab switch. Never throws. */
export function trackInteraction() {
  try {
    const now = Date.now();
    pruneTaps(now);
    tapTimes.push(now);
    setMeta({ lastActivityAt: now });
    if (tapTimes.length >= HEAT_THRESHOLD) {
      // First crossing: warm shimmer warning. Sustained rushing: stage up.
      if (now - heatWarnedAt > 30_000) {
        heatWarnedAt = now;
        emitWarning({ kind: 'heat', stage: getMogwaiStage(), message: "Too fast — you're overheating Gizmo!" });
      } else if (now - heatStageAt > 30_000 && tapTimes.length >= HEAT_THRESHOLD * 1.5) {
        heatStageAt = now;
        advanceMogwaiStage('sunlight');
      }
    }
  } catch { /* never break the app */ }
}

// ---------- Fed after midnight: save hook ----------

/**
 * Call from every content-saving action (entries, goals, debriefs, notes).
 * Saving between 00:00 and 05:00 local = feeding after midnight.
 */
export function noteSaveAction(when: Date = new Date()) {
  try {
    noteCalmActivity();
    const h = when.getHours();
    if (h >= 0 && h < 5) {
      advanceMogwaiStage('midnight-snack');
    }
  } catch { /* ignore */ }
}

/** Once per evening: "Gizmo's getting sleepy" beat at 23:55. */
export function checkSleepyWarning(when: Date = new Date()) {
  try {
    const day = when.toISOString().slice(0, 10);
    const meta = getMeta();
    if (when.getHours() === 23 && when.getMinutes() >= 55 && meta.sleepyWarnedDay !== day) {
      setMeta({ sleepyWarnedDay: day });
      emitWarning({ kind: 'sleepy', stage: getMogwaiStage(), message: "Gizmo's getting sleepy… no snacks after midnight." });
    }
  } catch { /* ignore */ }
}

// ---------- Wet: device shake ----------

let shakeArmed = false;
let lastShakeAt = 0;
let shakeHits = 0;

function handleMotion(e: DeviceMotionEvent) {
  try {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    // Hard shake ≈ sustained high acceleration beyond resting ~9.8
    if (mag > 24) {
      const now = Date.now();
      if (now - lastShakeAt > 1500) shakeHits = 0;
      shakeHits++;
      lastShakeAt = now;
      if (shakeHits >= 2) {
        shakeHits = 0;
        emitWarning({ kind: 'wet', stage: getMogwaiStage(), message: 'You shook Gizmo. It got wet!' });
        advanceMogwaiStage('wet');
      }
    }
  } catch { /* ignore */ }
}

/**
 * Start listening for shakes. Safe no-op on desktop / unsupported browsers.
 * On iOS, motion permission needs a user gesture — call
 * `requestMotionPermission()` from a button tap first.
 */
export function initShakeListener() {
  try {
    if (shakeArmed) return;
    if (typeof window === 'undefined' || typeof (window as any).DeviceMotionEvent === 'undefined') return;
    window.addEventListener('devicemotion', handleMotion as EventListener, { passive: true });
    shakeArmed = true;
  } catch { /* ignore */ }
}

/** iOS 13+: must be called from a user gesture. Returns granted or not. */
export async function requestMotionPermission(): Promise<boolean> {
  try {
    const DME = (window as any).DeviceMotionEvent;
    if (DME && typeof DME.requestPermission === 'function') {
      const res = await DME.requestPermission();
      if (res === 'granted') initShakeListener();
      return res === 'granted';
    }
    initShakeListener();
    return true;
  } catch {
    return false;
  }
}

// ---------- Forgiveness: decay + dawn reset ----------

const DECAY_MS = 20 * 60 * 1000;

function dayStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Run on an interval (and on init). Decays one stage after 20 calm minutes. */
export function tickForgiveness(when: Date = new Date()) {
  try {
    const meta = getMeta();
    const now = when.getTime();
    // Dawn reset: full return to sweet at 05:00 local, once per day.
    if (when.getHours() >= 5 && meta.lastResetDay !== dayStr(when)) {
      const before = getMogwaiStage();
      setMeta({ lastResetDay: dayStr(when) });
      if (before > 0) {
        setStage(0);
        emitWarning({ kind: 'soothed', stage: 0, message: 'Dawn breaks. Gizmo is sweet again.' });
      }
      return;
    }
    // Calm decay.
    if (now - meta.lastActivityAt > DECAY_MS && now - meta.lastDecayCheck > DECAY_MS) {
      setMeta({ lastDecayCheck: now });
      const stage = getMogwaiStage();
      if (stage > 0) {
        setStage(stage - 1);
        emitWarning({ kind: 'soothed', stage: stage - 1, message: 'Gizmo calms down a little…' });
      }
    }
    checkSleepyWarning(when);
  } catch { /* ignore */ }
}
