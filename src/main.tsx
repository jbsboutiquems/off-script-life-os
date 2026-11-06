import {StrictMode, type ComponentType, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { Capacitor } from '@capacitor/core';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import Observability from '@launchdarkly/observability';
import SessionReplay from '@launchdarkly/session-replay';
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

void (async () => {
  let LDProvider: ComponentType<{ children: ReactNode }> | null = null;
  if (clientSideID) {
    try {
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
