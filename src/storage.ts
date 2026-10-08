/**
 * Per-user localStorage helpers shared by the buddy / mogwai / tone modules.
 * Mirrors the `lifeos:<userId>:` namespacing convention in services/api.ts
 * without importing it (avoids module cycles).
 */

let activeUserId: string | null = null;

/** Called by services/api.ts whenever auth state resolves or clears. */
export function setActiveUserId(id: string | null) {
  activeUserId = id;
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

/** Namespaced key for the active user (falls back to 'anon' like api.ts). */
export function userKey(key: string): string {
  return `lifeos:${activeUserId || 'anon'}:${key}`;
}

export function userGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(userKey(key));
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function userSet(key: string, val: unknown) {
  try {
    localStorage.setItem(userKey(key), JSON.stringify(val));
  } catch {
    // ignore
  }
}
