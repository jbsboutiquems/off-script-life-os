// AI Studio client helper. Calls ONLY our own /api/studio/* endpoints —
// the client NEVER talks to Google directly and never sees GEMINI_API_KEY.
//
// Generative endpoints (music/image/video/transcribe) additionally send the
// X-AI-Consent header when the user has granted Google Gemini consent. The
// server refuses those calls without it; declining consent never breaks the
// rest of the app.
import { aiConsentHeaders } from '../../services/aiConsent';

const TOKEN_KEY = 'lifeos:auth:token';

export class StudioNotConfiguredError extends Error {
  code = 'STUDIO_NOT_CONFIGURED';
  constructor(message: string) {
    super(message);
    this.name = 'StudioNotConfiguredError';
  }
}

export class AiConsentRequiredError extends Error {
  code = 'AI_CONSENT_REQUIRED';
  constructor(message: string) {
    super(message);
    this.name = 'AiConsentRequiredError';
  }
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function studioReq(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...aiConsentHeaders(),
    ...((options.headers as Record<string, string>) || {})
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  if (res.status === 503) {
    const body = await res.json().catch(() => ({}));
    throw new StudioNotConfiguredError(
      body.error || 'AI Studio is not configured on this server yet.'
    );
  }
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    if (body.code === 'AI_CONSENT_REQUIRED') {
      throw new AiConsentRequiredError(
        body.error || 'Google Gemini needs your OK first.'
      );
    }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Studio request failed (${res.status})`);
  }
  return res.json();
}

export interface StudioMediaItem {
  id: string;
  type: 'music' | 'image' | 'video' | 'transcript';
  prompt: string;
  resultUrl: string;
  transcript?: string;
  mimeType?: string;
  aspectRatio?: string;
  model?: string;
  operationName?: string;
  createdAt: string;
}

export const studioApi = {
  async status(): Promise<{ configured: boolean }> {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/studio/status', { headers });
    if (!res.ok) return { configured: false };
    return res.json();
  },

  async generateMusic(input: { prompt: string; model?: string; imageBase64?: string }) {
    return studioReq('/api/studio/music', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async generateImage(input: { prompt: string; aspectRatio?: string }) {
    return studioReq('/api/studio/image', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async editImage(input: { imageBase64: string; prompt: string; mimeType?: string }) {
    return studioReq('/api/studio/image/edit', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async generateVideo(input: { prompt: string; imageBase64?: string; mimeType?: string; aspectRatio?: string }) {
    return studioReq('/api/studio/video', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async videoStatus(operationName: string) {
    return studioReq('/api/studio/video/status', {
      method: 'POST',
      body: JSON.stringify({ operationName })
    });
  },

  /** Downloads via the server proxy; returns an object URL. */
  async downloadVideo(operationName: string): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...aiConsentHeaders()
    };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/studio/video/download', {
      method: 'POST',
      headers,
      body: JSON.stringify({ operationName })
    });
    if (res.status === 503) throw new StudioNotConfiguredError('AI Studio is not configured on this server yet.');
    if (res.status === 404) throw new Error('Video is still rendering — check back in a bit.');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Video download failed (${res.status})`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  async transcribe(input: { audioBase64: string; mimeType?: string }) {
    return studioReq('/api/studio/transcribe', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async listMedia(): Promise<StudioMediaItem[]> {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/studio/media', { headers });
    if (!res.ok) throw new Error('Could not load your studio library.');
    return res.json();
  },

  async deleteMedia(id: string) {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/studio/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Could not delete that item.');
    return res.json();
  }
};

/** Read a File into a data URL (base64). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}
