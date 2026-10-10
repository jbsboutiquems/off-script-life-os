/**
 * Dev-mode flag for scaffolding that must never ship to customers.
 * Enabled via `?dev=1` in the URL or when running on localhost.
 * Build instructions, dev-server notes, and other shop talk hide behind this.
 */
export function isDevMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") return true;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "";
  } catch {
    return false;
  }
}
