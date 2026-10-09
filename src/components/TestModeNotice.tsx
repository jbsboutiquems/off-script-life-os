// One-time test-mode notice. Shows a single popup while the app is in test
// mode — not a watermark, not nagging, just one heads-up per app version.
// Flip TEST_MODE to false at public launch and it disappears everywhere.
//
// Mount once near the top level of the authenticated app:
//   <TestModeNotice />
import React, { useState, useEffect } from 'react';
import { FlaskConical, Bug } from 'lucide-react';

// <-- SET TO false AT PUBLIC LAUNCH
export const TEST_MODE = true;

const SEEN_KEY = 'offscript_testmode_seen_v1';

export const TestModeNotice: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!TEST_MODE) return;
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!TEST_MODE || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="testmode-title"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-[#ea4798]/40 bg-[#faf7f0] dark:bg-[#000a15] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea4798] to-[#2da2ee] text-white">
            <FlaskConical size={20} />
          </span>
          <h2 id="testmode-title" className="text-lg font-black text-slate-900 dark:text-stone-100">
            PLEASE NOTE: THIS APP IS STILL IN TEST MODE
          </h2>
        </div>
        <p className="text-sm text-slate-700 dark:text-stone-300 mb-4">
          You're one of the early ones — thank you. Things might break, look
          weird, or do something unexpected. That's what you're here for:{' '}
          <strong>if you find a problem, please report it</strong> so it gets
          fixed before launch.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="mailto:support@lifeosoffscript.info?subject=Off*Script%20bug%20report"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ea4798] to-[#2da2ee] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Bug size={16} />
            Report a problem
          </a>
          <button
            onClick={dismiss}
            className="rounded-xl border border-slate-300 dark:border-stone-700 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-stone-300"
          >
            Got it — let's break things
          </button>
        </div>
      </div>
    </div>
  );
};
