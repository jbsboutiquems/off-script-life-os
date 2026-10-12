/**
 * Dev-mode flag for scaffolding that must never ship to customers.
 * Enabled via `?dev=1` in the URL, when running on localhost, or via the
 * persisted toggle in Identity Base → Developer (admin-gated).
 * Build instructions, dev-server notes, and other shop talk hide behind this.
 */
const DEV_MODE_KEY = 'offscript_dev_mode';

export function isDevMode(): boolean {
  try {
    if (localStorage.getItem(DEV_MODE_KEY) === '1') return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") return true;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "";
  } catch {
    return false;
  }
}

/** Persist the dev-mode toggle from Settings. Takes effect on next render. */
export function setDevMode(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DEV_MODE_KEY, '1');
    else localStorage.removeItem(DEV_MODE_KEY);
  } catch { /* ignore */ }
}
