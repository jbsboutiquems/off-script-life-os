import React, { useState, useEffect } from 'react';
import { UserProfile, DailyEntry, PersonalitySnapshot, AntiGoal } from '../types';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  Flame,
  Ban,
  Compass,
  ShieldAlert,
  Smartphone,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type ShareContextType = 'daily' | 'identity' | 'mantra' | 'antigoals' | 'diagnostic';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  dailyEntry: DailyEntry;
  snapshot: PersonalitySnapshot | null;
  antiGoals?: AntiGoal[];
  initialContext?: ShareContextType;
  onToast?: (msg: string) => void;
  onShareFired?: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  user,
  dailyEntry,
  snapshot,
  antiGoals = [],
  initialContext = 'daily',
  onToast,
  onShareFired
}) => {
  const [selectedContext, setSelectedContext] = useState<ShareContextType>(initialContext);
  const [shareText, setShareText] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [cardAspect, setCardAspect] = useState<'square' | 'landscape'>('square');

  // Sync context when initialContext changes on open
  useEffect(() => {
    if (isOpen) {
      setSelectedContext(initialContext);
    }
  }, [isOpen, initialContext]);

  // Determine current app URL
  const appUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0].split('#')[0] : 'https://lifeos2027.app';

  // Points hook: fires at most once per share action; the caller dedupes (one award per day)
  const fireShare = () => {
    onShareFired?.();
  };

  // Build snippet according to selected context
  useEffect(() => {
    let text = '';
    const dateFormatted = new Date(dailyEntry.entry_date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (selectedContext === 'daily') {
      text = `⚡ 2027 LIFE OS: OFF*SCRIPT · Daily Living Flight Log (${dateFormatted})
Pilot: ${user.chaos_name || 'Unruly Sovereign'}
Slogan: "${user.slogan || 'Boredom=Death'}"
Chaos Score: ${dailyEntry.chaos_score}/10
Today's Intention: "${dailyEntry.morning_intention || 'Steadiness over optimization'}"
Anchor Note: "${dailyEntry.today_i_am || 'Architect of my own space'}"

No toxic positivity. Living off-script.
#OffScript2027 #LifeOS #ChaosYear #BoredomIsDeath`;
    } else if (selectedContext === 'identity') {
      text = `🛡️ MY 2027 LIFE OS FLIGHT IDENTITY
Pilot Designation: ${user.chaos_name || 'Unruly Sovereign'}
Official Slogan: "${user.slogan || 'Boredom=Death'}"
Word of the Year: "${user.word_of_the_year || 'Sovereignty'}"
 Core Manifesto: "${user.chaos_mantra || 'Reject polite busywork'}"

"Not a vibe board. An operating system for sovereign living."
#LifeOS2027 #OffScript #Identity`;
    } else if (selectedContext === 'mantra') {
      text = `🔥 MORNING LAUNCH MANTRA · Life OS 2027
"${dailyEntry.morning_intention || 'I refuse to perform enthusiasm for tasks that drain my soul.'}"

Pilot: ${user.chaos_name || 'Unruly Sovereign'} · Slogan: "${user.slogan || 'Boredom=Death'}"
(Edge Tier: Zero Toxic Positivity)
#OffScript2027 #MorningMantra #RealTalk`;
    } else if (selectedContext === 'antigoals') {
      const eliminatedCount = antiGoals.filter(ag => ag.is_completed).length;
      const topAnti = antiGoals.find(ag => !ag.is_completed)?.title || 'Apologizing before asking straightforward questions';
      text = `🚫 SUBTRACTIVE PROTOCOL · My Anti-Goals (${eliminatedCount}/${antiGoals.length} Stopped)
Sovereignty isn't stacking more tasks; it's refusing what steals your dignity.

Committed to STOPPING:
• ${topAnti}

"A crossed-out obligation creates more peace than ten completed to-do items."
#AntiGoals #SubtractiveProtocol #OffScript2027 #Boundaries`;
    } else if (selectedContext === 'diagnostic') {
      const mirrorQuote = snapshot?.ai_feedback
        ? snapshot.ai_feedback
        : "You crave order, but the minute things are too tidy, you shake the snowglobe.";
      text = `🪞 MEI SASSY MIRROR DIAGNOSTIC · Life OS 2027
" ${mirrorQuote} "

Detected Mood: ${snapshot?.detected_mood || 'Hyper-Reflective'}
Burnout Risk: ${snapshot?.burnout_risk || 'Low'}
 Big 5 Radar: Openness ${snapshot?.openness ?? 85}% · Neuroticism ${snapshot?.neuroticism ?? 42}%

#MeiDiagnostic #SassyMirror #PsychologicalHonesty #OffScript2027`;
    }

    setShareText(text);
  }, [selectedContext, user, dailyEntry, snapshot, antiGoals]);

  if (!isOpen) return null;

  // Social sharing direct handlers.
  // Points fire only when the popup actually opens — a blocked popup is not a share.
  const openSharePopup = (url: string): boolean => {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      fireShare();
      return true;
    }
    if (onToast) onToast('Popup was blocked — allow popups to share.');
    return false;
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    openSharePopup(url);
  };

  const handleShareThreads = () => {
    const fullMessage = `${shareText}\n\n${appUrl}`;
    const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(fullMessage)}`;
    openSharePopup(url);
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`;
    openSharePopup(url);
  };

  const handleShareWhatsApp = () => {
    const fullMessage = `${shareText}\n\n${appUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
    openSharePopup(url);
  };

  const handleShareReddit = () => {
    const title = `Life OS 2027 (Off*Script) - ${user.chaos_name}: ${user.slogan || 'Boredom=Death'}`;
    const url = `https://reddit.com/submit?url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent(title)}`;
    openSharePopup(url);
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
    openSharePopup(url);
  };

  // Native Web Share API
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `Life OS 2027: Off*Script (${user.chaos_name})`,
        text: shareText,
        url: appUrl
      });
      if (onToast) onToast("Shared successfully!");
      fireShare();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error:', err);
      }
    }
  };

  // Copy text to clipboard — preparation, not a completed share: no points.
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
      if (onToast) onToast("Copied post text to clipboard!");
    } catch {
      // fallback
    }
  };

  // Copy app link — preparation, not a completed share: no points.
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (onToast) onToast("Copied link to clipboard!");
    } catch {
      // fallback
    }
  };

  // Canvas Image Generator: Render stylish visual share card & download PNG.
  // Points fire only after the card renders and the download is kicked off.
  const handleGenerateAndDownloadCard = () => {
    setIsGeneratingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const width = cardAspect === 'square' ? 1080 : 1200;
      const height = cardAspect === 'square' ? 1080 : 630;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

    // 1. Background gradient (Deep slate luxury)
    const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#000a15');
      grad.addColorStop(0.5, '#02142e');
      grad.addColorStop(1, '#02142e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. High-contrast border frame
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Subtle gold corner ticks
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(28, 28, 40, 6);
      ctx.fillRect(28, 28, 6, 40);
      ctx.fillRect(width - 68, 28, 40, 6);
      ctx.fillRect(width - 34, 28, 6, 40);
      ctx.fillRect(28, height - 34, 40, 6);
      ctx.fillRect(28, height - 68, 6, 40);
      ctx.fillRect(width - 68, height - 34, 40, 6);
      ctx.fillRect(width - 34, height - 68, 6, 40);

      // 3. Header badges
      ctx.fillStyle = '#ea4798';
      ctx.beginPath();
      ctx.roundRect(70, 70, 240, 38, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "DM Mono", monospace';
      ctx.fillText('LIFE OS · OFF*SCRIPT', 88, 95);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px "DM Mono", monospace';
      ctx.fillText(`CHAOS 2027`, 330, 95);

      // Pilot Tag
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "DM Mono", monospace';
      ctx.fillText(`PILOT: ${user.chaos_name || 'UNRULY SOVEREIGN'}`, width - 380, 95);

      // 4. Slogan Pill
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(70, 130, 320, 36, 6);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 15px "DM Mono", monospace';
      ctx.fillText(`SLOGAN: "${user.slogan || 'Boredom=Death'}"`, 85, 154);

      // 5. Card Main Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px "Fraunces", Georgia, serif';
      let cardTitle = "Today's Living Flight Log";
      if (selectedContext === 'identity') cardTitle = "Sovereign Identity Protocol";
      if (selectedContext === 'mantra') cardTitle = "Daily Edge Launch Mantra";
      if (selectedContext === 'antigoals') cardTitle = "Subtractive Protocol (Anti-Goals)";
      if (selectedContext === 'diagnostic') cardTitle = "Mei Sassy Mirror Reality Check";
      ctx.fillText(cardTitle, 70, 230);

      // 6. Highlight Quote Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const boxY = 260;
      const boxHeight = cardAspect === 'square' ? 460 : 230;
      ctx.beginPath();
      ctx.roundRect(70, boxY, width - 140, boxHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text inside box
      let quote = `"${dailyEntry.morning_intention || 'Today I am choosing steadiness over optimization.'}"`;
      if (selectedContext === 'identity') {
        quote = `Word of the Year: "${user.word_of_the_year || 'Sovereignty'}"\nCore Rule: "${user.chaos_mantra || 'Reject polite busywork and artificial deadlines.'}"`;
      } else if (selectedContext === 'mantra') {
        quote = `"${dailyEntry.morning_intention || 'I refuse to perform enthusiasm for tasks that drain my soul.'}"`;
      } else if (selectedContext === 'antigoals') {
        const activeStopped = antiGoals.filter(a => a.is_completed).length;
        quote = `Commitments Quashed: ${activeStopped} Bad Habits Stopped.\n"A crossed-out obligation creates more peace than ten completed to-do items."`;
      } else if (selectedContext === 'diagnostic') {
        quote = `"${snapshot?.ai_feedback || 'You crave order, but the minute things are too tidy, you deliberately shake the snowglobe.'}"`;
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'italic 28px "Fraunces", serif';

      // Word wrap helper
      const words = quote.split(' ');
      let line = '';
      let currentY = boxY + 70;
      const maxWidth = width - 240;

      for (let i = 0; i < words.length; i++) {
        if (words[i].includes('\n')) {
          const parts = words[i].split('\n');
          line += parts[0];
          ctx.fillText(line, 110, currentY);
          currentY += 44;
          line = parts[1] + ' ';
          continue;
        }

        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, 110, currentY);
          line = words[i] + ' ';
          currentY += 44;
          if (currentY > boxY + boxHeight - 40) break;
        } else {
          line = testLine;
        }
      }
      if (line && currentY <= boxY + boxHeight - 30) {
        ctx.fillText(line, 110, currentY);
      }

      // 7. Chaos Score & Stats at bottom of card
      const footerY = cardAspect === 'square' ? 820 : 540;

      // Metric 1: Chaos Rating
      ctx.fillStyle = 'rgba(234, 71, 152, 0.15)';
      ctx.beginPath();
      ctx.roundRect(70, footerY, 260, 90, 12);
      ctx.fill();
      ctx.strokeStyle = '#ea4798';
      ctx.stroke();

      ctx.fillStyle = '#f49ac2';
      ctx.font = 'bold 13px "DM Mono", monospace';
      ctx.fillText('CHAOS INTENSITY', 90, footerY + 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "DM Mono", monospace';
      ctx.fillText(`${dailyEntry.chaos_score || 7} / 10`, 90, footerY + 72);

      // Metric 2: Word of the Year
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.beginPath();
      ctx.roundRect(350, footerY, 320, 90, 12);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 13px "DM Mono", monospace';
      ctx.fillText('WORD OF THE YEAR', 370, footerY + 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Fraunces", Georgia, serif';
      ctx.fillText(`"${user.word_of_the_year || 'Sovereign'}"`, 370, footerY + 70);

      // Brand Watermark on the right
      ctx.fillStyle = '#64748b';
      ctx.font = '14px "DM Mono", monospace';
      ctx.fillText('LIFE OS 2027 · OFF*SCRIPT', width - 300, footerY + 45);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('No Toxic Positivity Engine', width - 300, footerY + 70);

      // Confetti & download
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `offscript-share-${selectedContext}-${dailyEntry.entry_date}.png`;
      link.href = dataUrl;
      link.click();
      fireShare();

      if (onToast) onToast("Visual Social Card downloaded! Ready for Stories & Feed.");
    } catch (err) {
      console.warn('Card generation failed:', err);
      if (onToast) onToast("Card generation hiccuped — try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

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
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-serif-display text-base sm:text-lg text-white">
                  Share Your Life OS
                </h3>
                <span className="bg-amber-400 text-stone-950 font-black text-[10px] font-mono-code px-1.5 py-0.5 rounded tracking-wider uppercase">
                  SOCIAL DISPATCH
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-mono-code">
                Broadcast real progress, edgy mantras, and zero-bullshit reflections.
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

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Section 1: Choose What to Share */}
          <div>
            <label className="block text-xs font-bold font-mono-code uppercase text-stone-700 mb-2">
              1. Select What to Broadcast:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedContext('daily')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedContext === 'daily'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
              >
                <Compass className={`w-4 h-4 mb-1 ${selectedContext === 'daily' ? 'text-amber-400' : 'text-stone-500'}`} />
                <span className="text-xs font-bold font-serif-display leading-tight">Daily Spread</span>
                <span className="text-[10px] opacity-70 font-mono-code mt-0.5">Chaos & Intent</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedContext('identity')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedContext === 'identity'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 mb-1 ${selectedContext === 'identity' ? 'text-amber-400' : 'text-stone-500'}`} />
                <span className="text-xs font-bold font-serif-display leading-tight">Pilot Identity</span>
                <span className="text-[10px] opacity-70 font-mono-code mt-0.5">Slogan & Word</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedContext('mantra')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedContext === 'mantra'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
              >
                <Flame className={`w-4 h-4 mb-1 ${selectedContext === 'mantra' ? 'text-rose-400' : 'text-stone-500'}`} />
                <span className="text-xs font-bold font-serif-display leading-tight">Morning Mantra</span>
                <span className="text-[10px] opacity-70 font-mono-code mt-0.5">Edge Wake-Up</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedContext('antigoals')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedContext === 'antigoals'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
              >
                <Ban className={`w-4 h-4 mb-1 ${selectedContext === 'antigoals' ? 'text-rose-400' : 'text-stone-500'}`} />
                <span className="text-xs font-bold font-serif-display leading-tight">Anti-Goals</span>
                <span className="text-[10px] opacity-70 font-mono-code mt-0.5">Stop Commitments</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedContext('diagnostic')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedContext === 'diagnostic'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
              >
                <Sparkles className={`w-4 h-4 mb-1 ${selectedContext === 'diagnostic' ? 'text-amber-400' : 'text-stone-500'}`} />
                <span className="text-xs font-bold font-serif-display leading-tight">Sassy Mirror</span>
                <span className="text-[10px] opacity-70 font-mono-code mt-0.5">Mei NLP Insight</span>
              </button>
            </div>
          </div>

          {/* Section 2: Post Text Preview & Direct Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold font-mono-code uppercase text-stone-700">
                2. Caption / Post Snippet:
              </label>
              <span className="text-[11px] text-stone-500 font-mono-code">
                Editable before sharing
              </span>
            </div>
            <div className="relative">
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                rows={5}
                className="w-full p-3 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-mono-code text-slate-800 focus:outline-rose-600 leading-relaxed resize-y"
              />
              <button
                type="button"
                onClick={handleCopyText}
                className="absolute top-2.5 right-2.5 px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 rounded text-[11px] font-mono-code font-bold flex items-center space-x-1 shadow-2xs"
                title="Copy caption text to clipboard"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Direct Social Media Action Channels */}
          <div>
            <label className="block text-xs font-bold font-mono-code uppercase text-stone-700 mb-2">
              3. Share Directly to Social Channels:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* X / Twitter */}
              <button
                type="button"
                id="share-twitter-btn"
                onClick={handleShareTwitter}
                className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-black hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Post on X (Twitter)</span>
              </button>

              {/* Threads */}
              <button
                type="button"
                id="share-threads-btn"
                onClick={handleShareThreads}
                className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-[#101010] hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.186 24C5.503 24 0 18.608 0 12.053 0 5.498 5.503.107 12.186.107c6.613 0 12.072 5.253 12.072 11.758 0 3.823-1.848 7.377-5.071 9.754l-1.397-1.745c2.657-1.961 4.18-4.908 4.18-8.009 0-5.187-4.372-9.47-9.784-9.47-5.412 0-9.896 4.283-9.896 9.47 0 5.186 4.484 9.47 9.896 9.47 3.328 0 6.37-1.637 8.134-4.378l1.838 1.183C19.866 21.902 16.208 24 12.186 24zm4.18-12.053c0-2.31-1.874-4.185-4.18-4.185-2.307 0-4.181 1.875-4.181 4.185s1.874 4.186 4.181 4.186c2.306 0 4.18-1.876 4.18-4.186z"/>
                </svg>
                <span>Share to Threads</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                id="share-linkedin-btn"
                onClick={handleShareLinkedIn}
                className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24"/>
                </svg>
                <span>Post on LinkedIn</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                id="share-whatsapp-btn"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83-1.56 1.55-3.63 2.41-5.82 2.41-1.43 0-2.83-.37-4.08-1.07l-.29-.17-3.04.8 1.05-2.96-.19-.3a8.216 8.216 0 0 1-1.26-4.54c0-4.54 3.7-8.24 8.24-8.24m4.53 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.8 2.53 1.09 2.53.73 2.99.69.46-.04 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
                </svg>
                <span>WhatsApp Message</span>
              </button>

              {/* Reddit */}
              <button
                type="button"
                id="share-reddit-btn"
                onClick={handleShareReddit}
                className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-[#FF4500] hover:bg-[#e03d00] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
                <span>Post on Reddit</span>
              </button>

              {/* Native System Share (Mobile/Desktop) */}
              {canNativeShare && (
                <button
                  type="button"
                  id="share-native-btn"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Device Share Sheet</span>
                </button>
              )}

              {/* Copy App Link */}
              <button
                type="button"
                id="share-copylink-btn"
                onClick={handleCopyLink}
                className="flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-stone-200 hover:bg-stone-300 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy App Link'}</span>
              </button>
            </div>
          </div>

          {/* Section 4: Visual Social Card Export (For Instagram Stories, Feed, LinkedIn) */}
          <div className="bg-gradient-to-r from-stone-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold font-serif-display text-white">
                  Visual Image Card Generator
                </h4>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono-code">
                  INSTAGRAM / STORIES / FEED
                </span>
              </div>

              {/* Aspect Ratio Toggle */}
              <div className="flex items-center space-x-1 text-[11px] font-mono-code bg-stone-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCardAspect('square')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    cardAspect === 'square' ? 'bg-amber-400 text-slate-900 font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Square (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => setCardAspect('landscape')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    cardAspect === 'landscape' ? 'bg-amber-400 text-slate-900 font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Banner (16:9)
                </button>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Export high-resolution branded PNG cards customized with your Pilot callsign, slogan, chaos rating, and selected reflection. Perfect for Instagram Stories, Twitter image attachments, or desktop wallpapers.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800">
              <span className="text-[11px] font-mono-code text-stone-400 flex items-center gap-1">
                <span>Rendering resolution:</span>
                <strong className="text-amber-300">{cardAspect === 'square' ? '1080 × 1080 px' : '1200 × 630 px'}</strong>
              </span>

              <button
                type="button"
                id="download-card-png-btn"
                onClick={handleGenerateAndDownloadCard}
                disabled={isGeneratingImage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-bold font-mono-code rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingImage ? 'Composing...' : 'Download Image Card (.PNG)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-300 flex items-center justify-between shrink-0 text-xs font-mono-code text-stone-600">
          <span className="truncate">
            Pilot: <strong className="text-slate-900">{user.chaos_name || 'Unruly Sovereign'}</strong> · Slogan: "{user.slogan || 'Boredom=Death'}"
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold rounded-lg transition-colors shrink-0 ml-3"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
