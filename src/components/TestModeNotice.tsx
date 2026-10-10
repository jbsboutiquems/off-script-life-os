// One-time test-mode notice. A dismissible banner (not a modal) shown while
// the app is in test mode — it never blocks other UI, so it can't stack
// under/over dialogs like the buddy creator (fixed 2026-10-10).
// Flip TEST_MODE to false at public launch and it disappears everywhere.
//
// Mount once near the top of the authenticated app layout:
//   <TestModeNotice />
import React, { useState, useEffect } from 'react';
import { FlaskConical, X } from 'lucide-react';

// <-- SET TO false AT PUBLIC LAUNCH
export const TEST_MODE = true;

const SEEN_KEY = 'offscript_testmode_seen_v1';

export const TestModeNotice: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!TEST_MODE) return;
    try {
      if (!localStorage.getItem(SEEN_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!TEST_MODE || !visible) return null;

  return (
    <div className="print:hidden bg-gradient-to-r from-[#ea4798] to-[#2da2ee] text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <FlaskConical size={16} className="shrink-0" />
        <p className="flex-1 text-xs font-bold">
          Test mode — things might break. Found a problem?{' '}
          <a
            href="mailto:support@lifeosoffscript.info?subject=Off*Script%20bug%20report"
            className="underline underline-offset-2"
          >
            Report it
          </a>{' '}
          so it's fixed before launch.
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss test mode notice"
          className="shrink-0 rounded-lg p-1 hover:bg-white/20"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
