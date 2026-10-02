// Google Gemini consent — explicit opt-in before any Gemini-powered feature.
//
// Covered surfaces:
//   - AI Studio (music / image / video / transcription generation)
//   - The Mei media-intent handoff (/api/mei/media-intent)
//   - The /api/diagnose Gemini fallback
// Everything else in the app stays on Mei and never needs this.
//
// The decision is persisted per user under the existing
// `lifeos:<userId>:` localStorage convention. Declining never blocks the app:
// Gemini features simply render a friendly disabled state instead.
//
// Event bridge: any view can call requestAiConsent() and the mounted
// AiConsentGate will show the modal — but only while the decision is still
// unknown, so users are never nagged twice.

export type AiConsentState = 'unknown' | 'granted' | 'declined';

export const AI_CONSENT_REQUEST_EVENT = 'offscript:ai-consent-request';
export const AI_CONSENT_CHANGED_EVENT = 'offscript:ai-consent-changed';
/** Header the client sends on Gemini-backed requests when consent is granted. */
export const AI_CONSENT_HEADER = 'X-AI-Consent';

const keyFor = (userId?: string | null) => `lifeos:${userId || 'anon'}:ai-consent:v1`;

let currentUserId: string | null = null;

/** Called by AiConsentGate so header helpers know whose decision applies. */
export function setAiConsentUser(userId: string | null | undefined): void {
  currentUserId = userId ?? null;
}

export function getAiConsent(userId?: string | null): AiConsentState {
  try {
    const v = localStorage.getItem(keyFor(userId));
    if (v === 'granted' || v === 'declined') return v;
  } catch {
    // ignore — storage unavailable means undecided
  }
  return 'unknown';
}

export function setAiConsent(userId: string | null | undefined, state: 'granted' | 'declined'): void {
  try {
    localStorage.setItem(keyFor(userId), state);
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent(AI_CONSENT_CHANGED_EVENT, { detail: { state } }));
  } catch {
    // ignore
  }
}

export function resetAiConsent(userId?: string | null): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    // ignore
  }
}

/** Ask the mounted AiConsentGate to show the modal (no-op if already decided). */
export function requestAiConsent(): void {
  try {
    window.dispatchEvent(new CustomEvent(AI_CONSENT_REQUEST_EVENT));
  } catch {
    // ignore
  }
}

/** Clear a previous decision and ask again — used by "Enable Gemini" buttons. */
export function reaskAiConsent(userId?: string | null): void {
  resetAiConsent(userId);
  requestAiConsent();
}

/**
 * Headers to attach to Gemini-backed API calls for the current user.
 * Empty when consent isn't granted — the server then refuses the call and
 * the client falls back to its non-Gemini behavior.
 */
export function aiConsentHeaders(): Record<string, string> {
  return getAiConsent(currentUserId) === 'granted' ? { [AI_CONSENT_HEADER]: 'granted' } : {};
}
