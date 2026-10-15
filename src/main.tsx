import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
