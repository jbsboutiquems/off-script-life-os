import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Package,
  Rocket,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  GitBranch,
  Terminal,
  Info,
  Bell,
  Home
} from 'lucide-react';

type PackageTab = 'overview' | 'sideload' | 'release';

interface PackageAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

const RELEASE_WORKFLOW_PATH = '.github/workflows/android-release.yml';
const REPO = 'github.com/jbsboutiquems/off-script-life-os';

const LOCAL_BUILD_COMMAND = `cd android
./gradlew assembleRelease`;

export const PackageAppModal: React.FC<PackageAppModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<PackageTab>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2500);
      if (onToast) onToast('Copied to clipboard!');
    } catch {
      // clipboard unavailable; no-op
    }
  };

  const tabs: { id: PackageTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'The Packaged App', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'sideload', label: 'Debug APK Install', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'release', label: 'Release Builds', icon: <Rocket className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fade-in print:hidden">
      <div
        className="bg-[#faf7f0] border-2 border-stone-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#02142e] text-white px-5 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2da2ee] to-[#ea4798] flex items-center justify-center text-white">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-serif-display text-base sm:text-lg text-white">
                  Package &amp; Ship the App
                </h3>
                <span className="bg-[#ea4798] text-white font-black text-[10px] font-mono-code px-1.5 py-0.5 rounded tracking-wider uppercase">
                  OFF*SCRIPT ANDROID
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-mono-code">
                What the packaged app is, how to install it, and where release builds come from.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-mono-code font-bold shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#ea4798] text-[#ea4798]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-stone-700 text-xs">

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#eaf6fd] border border-[#bfe3fa] flex items-start gap-3">
                <Info className="w-5 h-5 text-[#2da2ee] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-serif-display text-[#02142e] text-sm">
                    The Off*Script app, packed into an Android app
                  </h4>
                  <p className="text-slate-700 mt-1">
                    Life OS is a web app at heart — React + TypeScript with a Node/Express backend
                    and JSON-file persistence. Capacitor wraps it in a native Android shell
                    (<span className="font-mono-code font-bold">app.offscript.lifeos</span>, app name{' '}
                    <span className="font-bold">Off*Script</span>), so it installs like a real app
                    and opens full-screen, no browser bar.
                  </p>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-2">
                <span className="font-mono-code font-bold text-[11px] uppercase text-slate-900 block">
                  What's inside the package:
                </span>
                <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
                  <li><strong>Mei Chat</strong> — all AI endpoints run through Mei (called by bot ID). No Gemini, no Groq, no Firebase, no API keys in the app.</li>
                  <li><strong>Full Life OS</strong> — Daily OS, Big 6 Goals, Weekly Debriefs, Money Maps, Cosmic Corner, Chaos Points.</li>
                  <li><strong>Chaos Wall + private DMs</strong> — the gated community layer, just like the web app.</li>
                  <li><strong>Drive backup</strong> — your data can be backed up to Google Drive from inside the app.</li>
                  <li><strong>Playdate ND game corner</strong> — zero timers, zero scores, zero pressure.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#faf8f4]">
                  <span className="text-[10px] font-mono-code uppercase font-bold text-stone-500 block">
                    App ID
                  </span>
                  <span className="font-bold text-slate-900 text-xs font-mono-code">
                    app.offscript.lifeos
                  </span>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Matches the real package identity on every build
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#faf8f4]">
                  <span className="text-[10px] font-mono-code uppercase font-bold text-stone-500 block">
                    Not on a store
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    Sideload &amp; Home Screen only
                  </span>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    No Play Store listing — install straight from an APK or Add to Home Screen
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fdf2f7] border border-[#f7c8e0] flex items-start gap-3">
                <Home className="w-5 h-5 text-[#ea4798] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-serif-display text-[#5c1231] text-sm">
                    No-install option: Add to Home Screen
                  </h4>
                  <p className="text-[#7a2c4f] mt-1">
                    Open Life OS in Chrome on your phone, tap <strong>⋮ → Add to Home Screen</strong>,
                    and you get the same full-screen app icon without touching an APK file.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SIDELOAD */}
          {activeTab === 'sideload' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-serif-display text-emerald-950 text-sm">
                    Sideload the debug APK
                  </h4>
                  <p className="text-emerald-800 mt-1">
                    Debug builds are signed for sideloading — that's the fast way to get the
                    Off*Script app on your own phone for testing. Debug-signed only: not for
                    the Play Store, not for anyone else's device as a final product.
                  </p>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-2">
                <span className="font-mono-code font-bold text-[11px] uppercase text-slate-900 block">
                  Install steps:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-600 pl-1">
                  <li>
                    <strong>Get the APK.</strong> It's shared via a Drive or file link —{' '}
                    <strong>Gmail blocks APK attachments</strong>, so it won't come as an email file.
                  </li>
                  <li>
                    <strong>Download it on your phone.</strong> Tap the file in your notifications or Files app.
                  </li>
                  <li>
                    <strong>Allow the install.</strong> Android will ask you to allow{' '}
                    <strong>"Install unknown apps"</strong> for your browser or Files app — toggle it on and continue.
                  </li>
                  <li>
                    <strong>Tap Install.</strong> The Off*Script icon lands in your app drawer,
                    app ID <span className="font-mono-code font-bold">app.offscript.lifeos</span>.
                  </li>
                  <li>
                    <strong>Open and sign in</strong> like you would on the web app — same account, same data.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 text-slate-200 flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Debug builds get a new signature check every time they're rebuilt — if Android
                  refuses an update install, uninstall the old copy first, then install the new APK.
                </p>
              </div>
            </div>
          )}

          {/* TAB: RELEASE */}
          {activeTab === 'release' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-stone-700">
                <h4 className="font-bold font-serif-display text-white text-sm flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-[#ea4798]" />
                  <span>Release builds come from GitHub Actions</span>
                </h4>
                <p className="text-stone-300 mt-1 text-[11px]">
                  Real, signed release APKs (and Play-ready AABs) are produced by the Android
                  release pipeline — not by building on a laptop. Every push to{' '}
                  <span className="font-mono-code font-bold text-white">main</span> runs it
                  automatically, and you can also trigger it by hand from the Actions tab.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono-code text-stone-500">
                  <span>Pipeline file (in the repo root):</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(RELEASE_WORKFLOW_PATH, 'wf')}
                    className="flex items-center gap-1 text-[#ea4798] hover:text-[#d1337f] cursor-pointer"
                  >
                    {copiedCode === 'wf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'wf' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono-code text-[11px] overflow-x-auto">
                  {RELEASE_WORKFLOW_PATH}
                </pre>
                <p className="text-[11px] text-stone-500 font-mono-code">
                  Repo: {REPO}
                </p>
              </div>

              <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-2">
                <span className="font-mono-code font-bold text-[11px] uppercase text-slate-900 block">
                  How a release gets built:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-600 pl-1">
                  <li>Code is pushed to <span className="font-mono-code font-bold">main</span> on GitHub.</li>
                  <li>The <span className="font-mono-code">android-release</span> workflow spins up, builds the web app, syncs Capacitor, and assembles a signed release APK with JDK 21.</li>
                  <li>Finished APK/AAB artifacts download from the workflow run's Artifacts section.</li>
                  <li>Prefer manual? Open the repo → <strong>Actions</strong> → <strong>Android Release</strong> → <strong>Run workflow</strong>.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono-code text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Local equivalent (for reference only):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(LOCAL_BUILD_COMMAND, 'gradle')}
                    className="flex items-center gap-1 text-[#ea4798] hover:text-[#d1337f] cursor-pointer"
                  >
                    {copiedCode === 'gradle' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'gradle' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono-code text-[11px] overflow-x-auto">
                  {LOCAL_BUILD_COMMAND}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-[#fdf2f7] border border-[#f7c8e0] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#ea4798] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-serif-display text-[#5c1231] text-sm">
                    Boredom=Death, shipped
                  </h4>
                  <p className="text-[#7a2c4f] mt-1">
                    Debug APK for your pocket today. Release pipeline for the real thing tomorrow.
                    Same app, same Mei-powered brains, zero app-store gatekeeping in between.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-300 flex items-center justify-between shrink-0 text-xs font-mono-code text-stone-600">
          <span className="truncate">
            <strong className="text-slate-900">Off*Script</strong> · app.offscript.lifeos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold rounded-lg transition-colors shrink-0 ml-3 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
