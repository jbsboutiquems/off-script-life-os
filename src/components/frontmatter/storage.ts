/**
 * Front-matter persistence, local to this module.
 *
 * Mirrors the per-user namespacing convention from src/services/api.ts
 * (`lifeos:<userId>:<key>`) so front-matter entries never leak one
 * account's data into another's on a shared browser. Profile-bound fields
 * (word of the year, core values, permission commitment) are NOT stored
 * here — they flow through onSaveProfile → api.updateUser instead.
 */

const PREFIX = 'frontmatter';

function ns(userId: string, key: string): string {
  return `lifeos:${userId || 'anon'}:${PREFIX}:${key}`;
}

export const FM_KEYS = {
  wordReflections: 'word_reflections',
  visionDump: 'vision_dump',
  lifeAudit: 'life_audit',
  permissionSlip: 'permission_slip',
  contacts: 'contacts'
} as const;

export function loadFrontMatter<T>(userId: string, key: string): T | null {
  try {
    const raw = localStorage.getItem(ns(userId, key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveFrontMatter(userId: string, key: string, value: unknown): void {
  try {
    localStorage.setItem(ns(userId, key), JSON.stringify(value));
  } catch {
    // ignore — same fail-soft convention as api.ts
  }
}
