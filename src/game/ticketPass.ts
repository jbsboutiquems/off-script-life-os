import { FAMILIARS } from './regions';
import type { LocalPass, SignedTicketPass } from './regions';

export const SEVEN_DAYS_MS = 604_800_000;
const CLOCK_SKEW_MS = 5 * 60_000;

function bytesFromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function canonicalPassPayload(payload: SignedTicketPass['payload']): string {
  return JSON.stringify({
    expiresAt: payload.expiresAt,
    issuedAt: payload.issuedAt,
    nonce: payload.nonce,
    regionId: payload.regionId,
    version: payload.version,
  });
}

export function validatePassPayload(payload: SignedTicketPass['payload'], now = Date.now()): string | null {
  if (payload.version !== 1) return 'This pass version is not supported.';
  if (!FAMILIARS.some((region) => region.id === payload.regionId)) return 'This pass names an unknown region.';
  if (!Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.expiresAt)) return 'The pass timestamps are malformed.';
  if (typeof payload.nonce !== 'string' || !payload.nonce || payload.nonce.length > 128) return 'The pass identifier is malformed.';
  if (payload.expiresAt - payload.issuedAt !== SEVEN_DAYS_MS) return 'A ticket pass must be valid for exactly seven days.';
  if (payload.issuedAt > now + CLOCK_SKEW_MS) return 'This pass is not active yet.';
  if (payload.expiresAt <= now) return 'This pass has expired.';
  return null;
}

export type PassVerification =
  | { ok: true; pass: LocalPass }
  | { ok: false; reason: string };

export async function verifyTicketPass(
  rawJson: string,
  publicKeyBase64: string,
  now = Date.now(),
): Promise<PassVerification> {
  if (!publicKeyBase64.trim()) return { ok: false, reason: 'No ticket verification key is configured in this local build.' };
  if (rawJson.length > 8192) return { ok: false, reason: 'The signed pass is larger than the 8 KB limit.' };

  let candidate: SignedTicketPass;
  try {
    candidate = JSON.parse(rawJson) as SignedTicketPass;
  } catch {
    return { ok: false, reason: 'That is not valid ticket-pass JSON.' };
  }

  if (!candidate || typeof candidate !== 'object' || !candidate.payload || typeof candidate.payload !== 'object' || Array.isArray(candidate.payload) || typeof candidate.signature !== 'string') {
    return { ok: false, reason: 'The pass is missing its payload or signature.' };
  }

  const payloadError = validatePassPayload(candidate.payload, now);
  if (payloadError) return { ok: false, reason: payloadError };

  try {
    const publicKey = await crypto.subtle.importKey(
      'raw',
      bytesFromBase64(publicKeyBase64),
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    const isAuthentic = await crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      bytesFromBase64(candidate.signature),
      new TextEncoder().encode(canonicalPassPayload(candidate.payload)),
    );
    if (!isAuthentic) return { ok: false, reason: 'The pass signature could not be verified.' };
  } catch {
    return { ok: false, reason: 'This browser could not verify the offline pass.' };
  }

  return {
    ok: true,
    pass: {
      regionId: candidate.payload.regionId,
      issuedAt: candidate.payload.issuedAt,
      expiresAt: candidate.payload.expiresAt,
      source: 'signed-ticket',
      signedJson: rawJson,
    },
  };
}

export function passMillisecondsRemaining(pass: LocalPass, now = Date.now()): number {
  return Math.max(0, pass.expiresAt - now);
}
