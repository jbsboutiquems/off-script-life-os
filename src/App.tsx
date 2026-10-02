import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DailyEntry, PersonalitySnapshot, Goal, AntiGoal, WeeklyFlightDebrief, MonthlyMoneyMap, ChaosPointEntry, FlightCrewContact } from './types';
import { api, AuthError } from './services/api';
import { initTheme, getTheme, toggleTheme } from './theme';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { OAuthUsernameStep } from './components/OAuthUsernameStep';
import { DashboardView, type DashboardTab } from './components/DashboardView';
import { CosmicCornerView } from './components/CosmicCornerView';
import { HolidaysView } from './components/HolidaysView';
import { TourGuideView } from './components/TourGuideView';
import { DailyOSView } from './components/DailyOSView';
import { MeiDiagnosticCard } from './components/MeiDiagnosticCard';
import { Big6GoalsTracker } from './components/Big6GoalsTracker';
import { IdentityProfileView } from './components/IdentityProfileView';
import { WeeklyDebriefView } from './components/WeeklyDebriefView';
import { MonthlyMoneyMapView } from './components/MonthlyMoneyMapView';
import { ThemesGalleryView } from './components/ThemesGalleryView';
import { StickersSheetModal } from './components/StickersSheetModal';
import { SocialShareModal, type ShareContextType } from './components/SocialShareModal';
import { UnlockScreen } from './components/UnlockScreen';
import { CoverArtView } from './components/CoverArtView';
import { ChaosTrendline } from './components/ChaosTrendline';
import { ChaosPointsView } from './components/ChaosPointsView';
import { FlightCrewView } from './components/FlightCrewView';
import { DriveBackupView } from './components/DriveBackupView';
import { OnboardingTour } from './components/OnboardingTour';
import { RemindersView } from './components/RemindersView';
import { SearchView } from './components/SearchView';
import { ChaosWallView } from './components/ChaosWallView';
import { InboxView } from './components/InboxView';
import { FrontMatterView } from './components/frontmatter';
import { AiStudioView } from './components/studio/AiStudioView';
import { InstallBanner } from './components/InstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AiConsentGate } from './components/AiConsentGate';
import { AndroidPermissionGate } from './components/AndroidPermissionGate';
import { PackageAppModal } from './components/PackageAppModal';
import { computeStreak } from './lib/streaks';
import { ChevronLeft, Activity, Mail } from 'lucide-react';

initTheme();

type ActiveTab = 'dashboard' | DashboardTab;

function blankDailyEntry(dateStr: string): DailyEntry {
  return {
    id: `entry_${dateStr}`,
    entry_date: dateStr,
    morning_intention: '',
    today_i_am: '',
    anchor_question_answer: '',
    priorities: ['', '', ''],
    midday_checkin: '',
    micro_dare_completed: false,
    micro_dare_notes: '',
    evening_notes: '',
    chaos_score: 5,
    updated_at: new Date().toISOString()
  };
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [oauthPending, setOauthPending] = useState<{ key: string; provider: 'google' | 'facebook' } | null>(null);
  const [darkMode, setDarkMode] = useState(() => getTheme() === 'midnight');
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stickersModalOpen, setStickersModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [shareContext, setShareContext] = useState<ShareContextType>('daily');
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);

  // Core data states
  const [dailyEntry, setDailyEntry] = useState<DailyEntry>(() => blankDailyEntry(new Date().toISOString().split('T')[0]));
  const [latestSnapshot, setLatestSnapshot] = useState<PersonalitySnapshot | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [antiGoals, setAntiGoals] = useState<AntiGoal[]>([]);
  const [points, setPoints] = useState<ChaosPointEntry[]>([]);
  const [flightCrew, setFlightCrew] = useState<FlightCrewContact[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [debriefs, setDebriefs] = useState<WeeklyFlightDebrief[]>([]);
  const [moneyMaps, setMoneyMaps] = useState<MonthlyMoneyMap[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tourDismissed, setTourDismissed] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer-safe toast: a new message replaces the current one and restarts the
  // clock, so an older timer can never clear a newer toast.
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
      toastTimer.current = null;
    }, 3000);
  };

  const pointsTotal = points.reduce((s, p) => s + p.points, 0);

  // Award chaos points and refresh the ledger. Dedupe is enforced server-side by ref.
  const awardPoints = async (action: 'daily_log' | 'micro_dare' | 'weekly_debrief' | 'antigoal_quashed' | 'goal_completed' | 'diagnostic_run' | 'share_fired', ref: string, label: string) => {
    try {
      const result = await api.awardPoints(action, ref, label);
      if (!result.duplicate) {
        const list = await api.getPoints();
        setPoints(list);
        showToast(`+${result.entry.points} Chaos Points — ${label}`);
      }
    } catch (e) {
      if (!(e instanceof AuthError)) console.warn('Points award failed', e);
    }
  };

  const handleOpenShare = (context: ShareContextType = 'daily') => {
    setShareContext(context);
    setShareModalOpen(true);
  };

  const handleLogout = async (silent = false) => {
    try {
      await api.logout();
    } catch {
      // clearing the local token is what matters
    }
    // Clear every scrap of account data so the next login starts clean.
    setUser(null);
    setGoals([]);
    setAntiGoals([]);
    setPoints([]);
    setFlightCrew([]);
    setAllEntries([]);
    setDebriefs([]);
    setMoneyMaps([]);
    setDueCount(0);
    setUnreadCount(0);
    setTourDismissed(false);
    setLatestSnapshot(null);
    setDailyEntry(blankDailyEntry(currentDate));
    setActiveTab('dashboard');
    if (!silent) showToast('Logged out. Chaos contained.');
  };

  // Full data load after authentication
  const loadAll = async () => {
    try {
      const [e, snaps, g, ags, allE, pts, crew, debs, mms] = await Promise.all([
        api.getDailyEntry(currentDate),
        api.getSnapshots(),
        api.getGoals(),
        api.getAntiGoals(),
        api.getAllDailyEntries(),
        api.getPoints(),
        api.getFlightCrew(),
        api.getAllDebriefs(),
        api.getAllMoneyMaps()
      ]);

      if (e) setDailyEntry(e);
      if (snaps && snaps.length > 0) setLatestSnapshot(snaps[0]);
      if (g) setGoals(g);
      if (ags) setAntiGoals(ags);
      if (allE) setAllEntries(allE);
      if (pts) setPoints(pts);
      if (crew) setFlightCrew(crew);
      if (debs) setDebriefs(debs);
      if (mms) setMoneyMaps(mms);
    } catch (err) {
      if (!(err instanceof AuthError)) console.warn('Data load issue', err);
    }
    refreshBadgeCounts();
  };

  // Bell badges: due reminders + inbox unread. Refreshed on login and periodically.
  const refreshBadgeCounts = async () => {
    try {
      const [rem, threads] = await Promise.all([
        api.getDueReminders().catch(() => null),
        api.getInboxThreads().catch(() => []),
      ]);
      if (rem) setDueCount((rem.due || []).length);
      setUnreadCount((threads || []).reduce((n: number, t: any) => n + (t.unread || 0), 0));
    } catch {
      // badges are decorative; silence is fine
    }
  };

  // Auth bootstrap: restore session if a token exists, then load data.
  // Also handles OAuth callbacks: #oauth=<token> (signed in) and
  // #oauth_pending=<key>&provider=<p> (must choose a username first).
  useEffect(() => {
    let isActive = true;
    api.onAuthFailure(() => {
      if (isActive) handleLogout(true);
    });
    (async () => {
      const hash = window.location.hash || '';
      const oauthToken = /#oauth=([a-f0-9]+)/.exec(hash)?.[1];
      const pendingMatch = /#oauth_pending=([a-f0-9]+)&provider=(google|facebook)/.exec(hash);
      if (oauthToken) {
        api.setToken(oauthToken);
        window.history.replaceState(null, '', window.location.pathname);
      } else if (pendingMatch) {
        window.history.replaceState(null, '', window.location.pathname);
        if (isActive) {
          setOauthPending({ key: pendingMatch[1], provider: pendingMatch[2] as 'google' | 'facebook' });
          setAuthLoading(false);
        }
        return;
      }
      if (api.getToken()) {
        try {
          const me = await api.getMe();
          if (!isActive) return;
          setUser(me);
          await loadAll();
        } catch (e) {
          if (!(e instanceof AuthError)) console.warn('Session restore failed', e);
        }
      }
      if (isActive) setAuthLoading(false);
    })();
    return () => {
      isActive = false;
      api.onAuthFailure(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll badge counts quietly while signed in (no WebSockets in this prototype).
  useEffect(() => {
    if (!user) return;
    const id = setInterval(refreshBadgeCounts, 60000);
    const onFocus = () => refreshBadgeCounts();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleFinishOnboarding = async (dontShowAgain: boolean) => {
    setTourDismissed(true);
    if (dontShowAgain && user) {
      await handleSaveProfile({ onboarding_seen: true });
    }
  };

  const showTour = !!user && !user.onboarding_seen && !tourDismissed;

  // Jump to a search result's door.
  const handleSearchNavigate = (door: string, target?: string) => {
    if (door === 'flight-log') {
      if (target) setCurrentDate(target);
      setActiveTab('daily');
    } else if (door === 'goals') setActiveTab('goals');
    else if (door === 'anti-goals') setActiveTab('antigoals');
    else if (door === 'debrief') setActiveTab('weekly');
    else if (door === 'money') setActiveTab('money');
    else if (door === 'crew') setActiveTab('crew');
    else if (door === 'holidays') setActiveTab('holidays');
  };

  const streak = computeStreak(allEntries.map((e) => e.entry_date), new Date().toISOString().split('T')[0]);

  // Reload the day's entry when the date changes (authenticated only).
  useEffect(() => {
    if (!user) return;
    let isActive = true;
    api.getDailyEntry(currentDate)
      .then((e) => {
        if (isActive) setDailyEntry(e || blankDailyEntry(currentDate));
      })
      .catch((err) => {
        if (!(err instanceof AuthError)) console.warn('Entry reload failed', err);
      });
    return () => { isActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // Handle Saving Daily Entry
  const handleSaveDailyEntry = async (updates: Partial<DailyEntry>) => {
    const updatedEntry: DailyEntry = {
      ...dailyEntry,
      ...updates,
      entry_date: currentDate,
      updated_at: new Date().toISOString()
    };
    setDailyEntry(updatedEntry);

    // Update allEntries array for immediate chart refresh
    setAllEntries(prev => {
      const idx = prev.findIndex(item => item.entry_date === currentDate);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedEntry;
        return copy;
      }
      return [...prev, updatedEntry];
    });

    try {
      await api.saveDailyEntry(updatedEntry);
      showToast("Daily Flight Log saved.");
    } catch (err) {
      if (!(err instanceof AuthError)) showToast("Saved locally.");
    }
    awardPoints('daily_log', `daily_log:${currentDate}`, `Daily Flight Log · ${currentDate}`);
    if (updatedEntry.micro_dare_completed) {
      awardPoints('micro_dare', `micro_dare:${currentDate}`, `Micro-Dare · ${currentDate}`);
    }
  };

  // Handle Running Mei Diagnostic
  const handleRunDiagnostic = async () => {
    if (!user) return;
    setIsDiagnosing(true);
    try {
      const snapshot = await api.runMeiDiagnostic({
        entry_date: currentDate,
        evening_notes: dailyEntry.evening_notes || '',
        morning_intention: dailyEntry.morning_intention || '',
        midday_checkin: dailyEntry.midday_checkin || '',
        chaos_score: dailyEntry.chaos_score || 5,
        user_profile: user
      });

      setLatestSnapshot(snapshot);
      setActiveTab('diagnostic');
      showToast("Mei Diagnostic complete! Honest mirror updated.");
      awardPoints('diagnostic_run', `diagnostic_run:${currentDate}`, `Mei Diagnostic · ${currentDate}`);
    } catch (err) {
      if (!(err instanceof AuthError)) {
        console.error("Diagnosis error:", err);
        showToast("Failed to run diagnosis. Check server connection.");
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Goals Handlers
  const handleAddGoal = async (newGoal: Omit<Goal, 'id' | 'created_at' | 'is_completed'>) => {
    try {
      const created = await api.createGoal(newGoal);
      setGoals([...goals, created]);
      showToast("Goal committed to slot.");
    } catch (err) {
      // Local fallback is only for an unreachable server. Validation errors
      // (like the six-goal maximum) must surface, not create an extra goal.
      if (err instanceof TypeError) {
        const fallbackGoal: Goal = {
          ...newGoal,
          id: `goal_${Date.now()}`,
          is_completed: false,
          created_at: new Date().toISOString()
        };
        setGoals([...goals, fallbackGoal]);
        showToast("Goal committed locally.");
      } else if (!(err instanceof AuthError)) {
        showToast(err instanceof Error ? err.message : "Could not add goal.");
      }
    }
  };

  const handleToggleGoal = async (id: string, isCompleted: boolean) => {
    try {
      await api.updateGoal(id, { is_completed: isCompleted });
    } catch (e) {
      if (!(e instanceof AuthError)) console.warn(e);
    }
    setGoals(goals.map(g => g.id === id ? { ...g, is_completed: isCompleted } : g));
    if (isCompleted) {
      const goal = goals.find(g => g.id === id);
      awardPoints('goal_completed', `goal_completed:${id}`, `Goal completed: ${goal?.title || id}`);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await api.deleteGoal(id);
    } catch (e) {
      if (!(e instanceof AuthError)) console.warn(e);
    }
    setGoals(goals.filter(g => g.id !== id));
    showToast("Goal removed from slot.");
  };

  // Anti-Goals Handlers
  const handleAddAntiGoal = async (newAntiGoal: Omit<AntiGoal, 'id' | 'created_at' | 'is_completed'> & { is_completed?: boolean }) => {
    try {
      const created = await api.createAntiGoal(newAntiGoal);
      setAntiGoals(prev => [...prev, created]);
      showToast("Anti-Goal commitment logged.");
    } catch (err) {
      if (err instanceof AuthError) return;
      const fallback: AntiGoal = {
        ...newAntiGoal,
        id: `antigoal_${Date.now()}`,
        is_completed: Boolean(newAntiGoal.is_completed),
        created_at: new Date().toISOString()
      };
      setAntiGoals(prev => [...prev, fallback]);
      showToast("Anti-Goal logged locally.");
    }
  };

  const handleToggleAntiGoal = async (id: string, isCompleted: boolean) => {
    try {
      await api.updateAntiGoal(id, { is_completed: isCompleted });
    } catch (e) {
      if (!(e instanceof AuthError)) console.warn(e);
    }
    setAntiGoals(prev => prev.map(ag => ag.id === id ? { ...ag, is_completed: isCompleted } : ag));
    if (isCompleted) {
      showToast("Habit eliminated! Strikethrough protocol active.");
      const ag = antiGoals.find(a => a.id === id);
      awardPoints('antigoal_quashed', `antigoal_quashed:${id}`, `Anti-Goal quashed: ${ag?.title || id}`);
    } else {
      showToast("Anti-Goal reopened as active commitment.");
    }
  };

  const handleDeleteAntiGoal = async (id: string) => {
    try {
      await api.deleteAntiGoal(id);
    } catch (e) {
      if (!(e instanceof AuthError)) console.warn(e);
    }
    setAntiGoals(prev => prev.filter(ag => ag.id !== id));
    showToast("Anti-Goal removed.");
  };

  // Profile Save Handler
  const handleSaveProfile = async (profileUpdates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...profileUpdates };
    setUser(updated);
    try {
      await api.updateUser(updated);
      showToast("Identity Base updated.");
    } catch (err) {
      if (!(err instanceof AuthError)) showToast("Identity Base saved locally.");
    }
  };

  // Flight Crew Handlers
  const handleAddCrewContact = async (data: Omit<FlightCrewContact, 'id' | 'created_at'>) => {
    try {
      const created = await api.createFlightCrewContact(data);
      setFlightCrew(prev => [...prev, created]);
      showToast("Contact added to the flight crew.");
    } catch (err) {
      if (!(err instanceof AuthError)) showToast("Could not add contact.");
    }
  };

  const handleUpdateCrewContact = async (id: string, updates: Partial<FlightCrewContact>) => {
    try {
      const updated = await api.updateFlightCrewContact(id, updates);
      setFlightCrew(prev => prev.map(c => c.id === id ? updated : c));
      showToast("Contact updated.");
    } catch (err) {
      if (!(err instanceof AuthError)) showToast("Could not update contact.");
    }
  };

  const handleDeleteCrewContact = async (id: string) => {
    try {
      await api.deleteFlightCrewContact(id);
      setFlightCrew(prev => prev.filter(c => c.id !== id));
      showToast("Contact removed from crew.");
    } catch (err) {
      if (!(err instanceof AuthError)) showToast("Could not remove contact.");
    }
  };

  const handleToggleAppTheme = () => {
    const next = toggleTheme();
    setDarkMode(next === 'midnight');
  };

  // ---------- Auth gate ----------
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-canvas text-stone-600 dark:bg-[#000a15] dark:text-stone-300">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-rose-600" />
          <p className="font-mono-code text-xs uppercase tracking-widest">Waking up the chaos…</p>
        </div>
      </main>
    );
  }

  if (oauthPending && !user) {
    return (
      <OAuthUsernameStep
        pendingKey={oauthPending.key}
        provider={oauthPending.provider}
        onAuthed={(authedUser) => {
          setOauthPending(null);
          setUser(authedUser);
          setActiveTab('dashboard');
          loadAll();
        }}
      />
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthed={(authedUser) => {
          setUser(authedUser);
          setActiveTab('dashboard');
          loadAll();
        }}
      />
    );
  }

  const onOpenDashboardDoor = (tab: DashboardTab) => setActiveTab(tab);

  return (
    <div className="min-h-screen bg-cream-canvas text-stone-900 dark:bg-[#000a15] dark:text-cream-canvas flex flex-col font-sans selection:bg-rose-200 selection:text-rose-900">

      <InstallBanner />

      <Header
        username={user.chaos_name}
        pointsTotal={pointsTotal}
        activeTab={activeTab}
        darkMode={darkMode}
        dueCount={dueCount}
        unreadCount={unreadCount}
        toggleTheme={handleToggleAppTheme}
        onDashboard={() => setActiveTab('dashboard')}
        onOpenProfile={() => setActiveTab('identity')}
        onOpenPoints={() => setActiveTab('points')}
        onOpenSearch={() => setActiveTab('search')}
        onOpenInbox={() => setActiveTab('inbox')}
        onOpenReminders={() => setActiveTab('reminders')}
        onLogout={() => handleLogout()}
      />

      {/* Email verification nudge */}
      {user.email && !user.emailVerified && (
        <div className="bg-amber-100 dark:bg-amber-950/60 border-b-2 border-amber-300 dark:border-amber-700/50 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Mail className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {user.email} isn't verified yet. Click the link we sent — it takes ten seconds.
            </p>
            <button
              onClick={async () => {
                try {
                  await api.resendVerification();
                  showToast('Verification email re-sent. Check your inbox.');
                } catch (e) {
                  showToast(e instanceof Error ? e.message : 'Could not resend.');
                }
              }}
              className="text-[11px] font-bold font-mono-code uppercase tracking-wider px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
            >
              Re-send email
            </button>
          </div>
        </div>
      )}

      {/* Main App Layout: Dashboard + section views */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">

        {/* Back to dashboard breadcrumb */}
        {activeTab !== 'dashboard' && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono-code uppercase tracking-wider bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-white/20 transition-colors print:hidden"
          >
            <ChevronLeft className="w-4 h-4" /> All doors
          </button>
        )}

        <main className="min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              pointsTotal={pointsTotal}
              goalsCount={goals.length}
              crewCount={flightCrew.length}
              streak={streak}
              dueCount={dueCount}
              unreadCount={unreadCount}
              onOpen={onOpenDashboardDoor}
            />
          )}

          {activeTab === 'cover' && (
            <CoverArtView
              onOpenDaily={() => setActiveTab('daily')}
              wordOfTheYear={user.word_of_the_year}
              chaosName={user.chaos_name}
              slogan={user.slogan || "Boredom=Death"}
            />
          )}

          {activeTab === 'daily' && (
            <div className="space-y-8">
              {/* Daily OS 3-Part Component (Launch, Orbit, Landing / Rant Box) */}
              <DailyOSView
                entry={dailyEntry}
                onSaveEntry={handleSaveDailyEntry}
                onRunDiagnostic={handleRunDiagnostic}
                isDiagnosing={isDiagnosing}
                user={user}
                currentDate={currentDate}
                onDateChange={(d) => setCurrentDate(d)}
                onOpenStickers={() => setStickersModalOpen(true)}
                onOpenShare={handleOpenShare}
              />

              {/* Mei Diagnostic Card right below */}
              <MeiDiagnosticCard
                snapshot={latestSnapshot}
                onTriggerDiagnosis={handleRunDiagnostic}
                isLoading={isDiagnosing}
                hasLatestEntryContent={Boolean(dailyEntry.evening_notes && dailyEntry.evening_notes.length > 5)}
              />

              {/* Chaos Trendline Teaser Card */}
              <div className="bg-gradient-to-r from-stone-900 via-slate-900 to-rose-950 text-white rounded-3xl p-6 border-2 border-stone-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <span className="bg-rose-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded">
                      PATTERN MAP
                    </span>
                    <span className="text-xs text-amber-300 font-mono-code">DIPS &amp; SPIKES RADAR</span>
                  </div>
                  <h4 className="text-lg font-bold font-serif-display text-white">
                    30-Day Chaos Trajectory: Controlled vs. Uncontrolled
                  </h4>
                  <p className="text-xs text-stone-300">
                    See where your system operates in the sovereign sweet spot (4–7) versus reactionary overwhelm (8–10).
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('trendline')}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold font-mono-code rounded-xl shadow-sm transition-all whitespace-nowrap flex items-center space-x-1.5"
                >
                  <Activity className="w-4 h-4" />
                  <span>Open Chaos Trendline →</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'trendline' && (
            <div className="space-y-6">
              <ChaosTrendline
                entries={allEntries}
                currentDate={currentDate}
                onSelectDate={(selectedD) => {
                  setCurrentDate(selectedD);
                  setActiveTab('daily');
                  showToast(`Switched flight log date to ${selectedD}`);
                }}
              />
            </div>
          )}

          {activeTab === 'diagnostic' && (
            <div className="space-y-6">
              <MeiDiagnosticCard
                snapshot={latestSnapshot}
                onTriggerDiagnosis={handleRunDiagnostic}
                isLoading={isDiagnosing}
                hasLatestEntryContent={Boolean(dailyEntry.evening_notes && dailyEntry.evening_notes.length > 5)}
              />

              {/* Quick Jump back to write notes */}
              <div className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-cream-canvas font-serif-display">
                    Need to feed more raw notes to the diagnostic mirror?
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Jump into today's Evening Rant Box to pour out your uncurated field notes.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('daily')}
                  className="px-4 py-2 bg-slate-900 dark:bg-amber-400 hover:bg-black dark:hover:bg-amber-300 text-white dark:text-stone-950 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                >
                  Go to Rant Box →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cosmic' && (
            <CosmicCornerView
              user={user}
              onEditProfile={() => setActiveTab('identity')}
              onSaveProfile={handleSaveProfile}
            />
          )}

          {activeTab === 'holidays' && (
            <HolidaysView />
          )}

          {activeTab === 'goals' && (
            <Big6GoalsTracker
              section="goals"
              goals={goals}
              onAddGoal={handleAddGoal}
              onToggleGoal={handleToggleGoal}
              onDeleteGoal={handleDeleteGoal}
              onOpenShare={handleOpenShare}
            />
          )}

          {activeTab === 'antigoals' && (
            <Big6GoalsTracker
              section="antigoals"
              goals={goals}
              onAddGoal={handleAddGoal}
              onToggleGoal={handleToggleGoal}
              onDeleteGoal={handleDeleteGoal}
              antiGoals={antiGoals}
              onAddAntiGoal={handleAddAntiGoal}
              onToggleAntiGoal={handleToggleAntiGoal}
              onDeleteAntiGoal={handleDeleteAntiGoal}
              onOpenShare={handleOpenShare}
            />
          )}

          {activeTab === 'weekly' && (
            <WeeklyDebriefView
              onSaveDebrief={async (debrief) => {
                try {
                  await api.saveWeeklyDebrief(debrief);
                  showToast("Weekly Flight Debrief committed.");
                  awardPoints('weekly_debrief', `weekly_debrief:${debrief.week_number}`, `Weekly Debrief · Week ${debrief.week_number}`);
                } catch (e) {
                  if (!(e instanceof AuthError)) showToast("Weekly Debrief saved locally.");
                }
              }}
            />
          )}

          {activeTab === 'money' && (
            <MonthlyMoneyMapView
              onSaveMoneyMap={async (m) => {
                try {
                  await api.saveMoneyMap(m);
                  showToast("Monthly Money Map saved.");
                } catch (e) {
                  if (!(e instanceof AuthError)) showToast("Money Map saved locally.");
                }
              }}
            />
          )}

          {activeTab === 'themes' && (
            <ThemesGalleryView />
          )}

          {activeTab === 'identity' && (
            <IdentityProfileView
              user={user}
              onSaveProfile={handleSaveProfile}
            />
          )}

          {activeTab === 'points' && (
            <ChaosPointsView
              points={points}
              entryDates={allEntries.map((e) => e.entry_date)}
              onRefresh={loadAll}
            />
          )}

          {activeTab === 'crew' && (
            <FlightCrewView
              contacts={flightCrew}
              onAdd={handleAddCrewContact}
              onUpdate={handleUpdateCrewContact}
              onDelete={handleDeleteCrewContact}
            />
          )}

          {activeTab === 'backup' && (
            <DriveBackupView onRestored={loadAll} entries={allEntries} />
          )}

          {activeTab === 'unlock' && (
            <UnlockScreen
              onUnlocked={(packId) => showToast(`Pack unlocked: ${packId}`)}
            />
          )}

          {activeTab === 'tourguide' && (
            <TourGuideView />
          )}

          {activeTab === 'frontmatter' && (
            <FrontMatterView
              user={user}
              onSaveProfile={handleSaveProfile}
              onNavigateToGoals={() => setActiveTab('goals')}
              onNavigateToDaily={() => setActiveTab('daily')}
              onToast={showToast}
            />
          )}

          {activeTab === 'studio' && (
            <AiStudioView userId={user.id} />
          )}

          {activeTab === 'wall' && (
            <ChaosWallView user={user} myUserId={user.id} />
          )}

          {activeTab === 'inbox' && (
            <InboxView
              user={user}
              myUserId={user.id}
              onUnreadChange={(n) => setUnreadCount(n)}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersView
              user={user}
              onSaveProfile={handleSaveProfile}
              onNavigate={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'search' && (
            <SearchView
              user={user}
              entries={allEntries}
              goals={goals}
              antiGoals={antiGoals}
              debriefs={debriefs}
              moneyMaps={moneyMaps}
              flightCrew={flightCrew}
              onNavigate={handleSearchNavigate}
            />
          )}
        </main>
      </div>

      {/* STICKERS SHEET MODAL */}
      <StickersSheetModal
        isOpen={stickersModalOpen}
        onClose={() => setStickersModalOpen(false)}
        onPasteStickerToNotes={(stk) => {
          const currentNotes = dailyEntry.evening_notes || '';
          const stamped = `${currentNotes}\n\n[STICKER STAMP: ${stk.emoji} ${stk.label}]`;
          handleSaveDailyEntry({ evening_notes: stamped });
          showToast(`Stamped ${stk.label} to field notes!`);
        }}
      />

      <SocialShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        user={user}
        dailyEntry={dailyEntry}
        snapshot={latestSnapshot}
        antiGoals={antiGoals}
        initialContext={shareContext}
        onToast={showToast}
        onShareFired={() => awardPoints('share_fired', `share_fired:${currentDate}`, `Shared the Chaos · ${currentDate}`)}
      />

      <PackageAppModal
        isOpen={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        onToast={showToast}
      />

      <OfflineIndicator />

      {/* Google Gemini consent gate + Android first-launch permission explainer.
          Both are passive overlays: declining/dismissing never blocks the app. */}
      <AiConsentGate userId={user.id} />
      <AndroidPermissionGate userId={user.id} />

      {/* First-run onboarding tour */}
      {showTour && (
        <OnboardingTour onDone={handleFinishOnboarding} />
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-mono-code flex items-center space-x-2 border border-stone-700 shadow-[0_0_28px_rgba(234,71,152,0.28)] animate-fade-in print:hidden">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-stone-300 dark:border-white/10 bg-[#faf7f0] dark:bg-[#000a15] py-6 px-4 text-center text-xs text-stone-500 dark:text-stone-400 font-mono-code mt-auto print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 dark:text-stone-200">Life OS: Off*Script 2027.</span>
            <span>·</span>
            <span>Chaos Year Edition</span>
          </div>
          <div className="text-stone-400 dark:text-stone-500">
            Mei-Style Natural Language Personality Engine · No Toxic Positivity
          </div>
          <button
            onClick={() => setPackageModalOpen(true)}
            className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors underline underline-offset-2"
          >
            Package the Android app
          </button>
        </div>
      </footer>
    </div>
  );
}
