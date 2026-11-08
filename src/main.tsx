import {StrictMode, type ComponentType, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { Capacitor } from '@capacitor/core';
import { injectContentsquareScript } from '@contentsquare/tag-sdk';
import App from './App.tsx';
import { api } from './services/api';
import './index.css';

// Offline support (item 19): service worker for the app shell + API cache.
// Production web builds only — never on native (APK assets are already
// local), never in dev (stale SW caches make dev miserable).
if (import.meta.env.PROD && 'serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // SW is progressive enhancement — the localStorage fallbacks still work.
    });
  });
}

// Replay queued offline writes the moment connectivity returns.
// (App also flushes at the start of loadAll and refreshes after reconnect;
// flushOutbox dedupes concurrent runs, so the double trigger is safe.)
window.addEventListener('online', () => {
  api.flushOutbox().catch(() => { /* retry on the next reconnect / loadAll */ });
});

// LaunchDarkly (staged, uncommitted): React client SDK + observability
// plugins, reusing the same client-side ID. The ID comes only from
// VITE_LAUNCHDARKLY_CLIENT_SIDE_ID — never hardcoded. Until a real ID is
// set, the app renders without the provider so nothing breaks.
const clientSideID = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_SIDE_ID?.trim();

// Contentsquare session replay — tag ID from Amber's Contentsquare account.
// main.tsx runs in the browser only, so this injects the CS tag script
// client-side. (Contentsquare masks typed text by default.)
injectContentsquareScript({ clientId: '4d0b8a97b26bb' });

void (async () => {
  let LDProvider: ComponentType<{ children: ReactNode }> | null = null;
  if (clientSideID) {
    try {
      // Perf: the LaunchDarkly client + observability/session-replay
      // plugins are ~1 MB of JS. They are only needed when a client-side
      // ID is configured, so load them on demand instead of in the
      // initial bundle. With no ID set (the normal case) nothing loads.
      const [{ asyncWithLDProvider }, { default: Observability }, { default: SessionReplay }] =
        await Promise.all([
          import('launchdarkly-react-client-sdk'),
          import('@launchdarkly/observability'),
          import('@launchdarkly/session-replay'),
        ]);
      LDProvider = await asyncWithLDProvider({
        clientSideID,
        context: { kind: 'user', key: 'anonymous', anonymous: true },
        timeout: 5,
        options: {
          plugins: [
            new Observability(),
            new SessionReplay({ privacySetting: 'strict' }),
          ],
        },
      });
    } catch {
      // Flag evaluation is progressive enhancement — a failed init must
      // not take the app down. Render without the provider instead.
      LDProvider = null;
    }
  }

  const tree = (
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>
  );

  createRoot(document.getElementById('root')!).render(
    LDProvider ? <LDProvider>{tree}</LDProvider> : tree,
  );
})();
