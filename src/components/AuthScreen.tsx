import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { LogIn, UserPlus, Zap, KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { RecoveryCodeReveal } from './RecoveryCodeReveal';

interface AuthScreenProps {
  onAuthed: (user: UserProfile) => void;
}

type Mode = 'login' | 'register' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthed }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [emailMode, setEmailMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [freshCodeContext, setFreshCodeContext] = useState<'register' | 'recover'>('register');
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [authConfig, setAuthConfig] = useState({ google: false, facebook: false, email: true, smtp: false });

  useEffect(() => {
    api.getAuthConfig().then(setAuthConfig).catch(() => {});
  }, []);

  const fail = (err: unknown, fallback: string) => {
    const e = err as any;
    setError(e instanceof Error ? e.message : fallback);
    setSuggestions(Array.isArray(e?.suggestions) ? e.suggestions : []);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuggestions([]);
    setBusy(true);
    try {
      if (mode === 'login') {
        const result = emailMode
          ? await api.emailLogin(email.trim(), password)
          : await api.login(username.trim(), password);
        onAuthed(result.user);
      } else if (mode === 'register') {
        const result = emailMode
          ? await api.emailRegister(email.trim(), username.trim(), password)
          : await api.register(username.trim(), password);
        // Hold the session: the user only enters the app after saving the code.
        setPendingUser(result.user);
        setFreshCode(result.recoveryCode || null);
        setFreshCodeContext('register');
      } else {
        if (newPassword !== confirmPassword) throw new Error('The two passwords are not matching. Try again.');
        const result = await api.recoverAccount(username.trim(), recoveryCode, newPassword);
        setFreshCode(result.recoveryCode);
        setFreshCodeContext('recover');
      }
    } catch (err) {
      fail(err, 'Something went sideways. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotSent(null);
    setBusy(true);
    try {
      const result = await api.forgotByEmail(forgotEmail.trim());
      if (result.fallback === 'recovery-code') {
        setError(result.message || 'Email sending is not configured.');
      } else {
        setForgotSent(result.message || 'Reset link sent. Check your inbox.');
      }
    } catch (err) {
      fail(err, 'Could not send the reset link.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuggestions([]);
    setFreshCode(null);
    setPendingUser(null);
    setForgotSent(null);
  };

  // A fresh recovery code must be acknowledged before anything else happens.
  if (freshCode) {
    return (
      <main className="min-h-screen bg-cream-canvas text-stone-900 flex items-center justify-center px-4 py-10 font-sans">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center text-2xl font-bold border-2 border-stone-800 shadow-md">
              ⚡
            </div>
            <h1 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas">
              2027 Life OS <span className="text-rose-600 italic font-serif-display font-normal">Off*Script</span>
            </h1>
          </div>
          <RecoveryCodeReveal
            code={freshCode}
            context={freshCodeContext}
            doneLabel={freshCodeContext === 'register' ? 'Saved it — enter the chaos' : 'Saved it — back to log in'}
            onDone={() => {
              setFreshCode(null);
              if (freshCodeContext === 'register' && pendingUser) {
                onAuthed(pendingUser);
              } else {
                setPendingUser(null);
                switchMode('login');
                setPassword('');
              }
            }}
          />
        </div>
      </main>
    );
  }

  const inputCls = "w-full px-3 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-stone-50/50 dark:bg-white/5 text-slate-900 dark:text-cream-canvas font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500";

  return (
    <main className="min-h-screen bg-cream-canvas text-stone-900 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center text-2xl font-bold border-2 border-stone-800 shadow-md">
            ⚡
          </div>
          <h1 className="text-2xl font-bold font-display-punch tracking-tight text-slate-900 dark:text-cream-canvas">
            2027 Life OS <span className="text-rose-600 italic font-serif-display font-normal">Off*Script</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-mono-code uppercase tracking-widest">
            Chaos Year Edition · Members Only (kinda)
          </p>
        </div>

        <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-md">
          {mode !== 'forgot' ? (
            <>
              {/* OAuth buttons — only when the deployer configured them */}
              {(authConfig.google || authConfig.facebook) && (
                <div className="space-y-2 mb-5">
                  {authConfig.google && (
                    <button
                      onClick={() => { window.location.href = '/api/auth/oauth/google'; }}
                      className="w-full py-2.5 bg-white dark:bg-white/5 border-2 border-stone-300 dark:border-white/20 rounded-xl text-sm font-bold text-stone-700 dark:text-stone-200 hover:border-stone-500 dark:hover:border-white/40 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-base font-black"><span className="text-blue-500">G</span></span>
                      Continue with Google
                    </button>
                  )}
                  {authConfig.facebook && (
                    <button
                      onClick={() => { window.location.href = '/api/auth/oauth/facebook'; }}
                      className="w-full py-2.5 bg-[#1877f2] hover:bg-[#1466d6] rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-white text-[#1877f2] flex items-center justify-center text-xs font-black">f</span>
                      Continue with Facebook
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-mono-code uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    <span className="flex-1 border-t border-stone-200 dark:border-white/10" />
                    or
                    <span className="flex-1 border-t border-stone-200 dark:border-white/10" />
                  </div>
                </div>
              )}

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 dark:bg-white/10 rounded-xl mb-4">
                <button
                  onClick={() => switchMode('login')}
                  className={`py-2 rounded-lg text-xs font-bold font-mono-code uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'login' ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-stone-950 shadow-xs' : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Log in
                </button>
                <button
                  onClick={() => switchMode('register')}
                  className={`py-2 rounded-lg text-xs font-bold font-mono-code uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'register' ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-stone-950 shadow-xs' : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Sign up
                </button>
              </div>

              {/* Email / username switch */}
              <button
                type="button"
                onClick={() => { setEmailMode(!emailMode); setError(null); setSuggestions([]); }}
                className="mb-4 w-full text-center text-[11px] font-bold font-mono-code uppercase tracking-wider text-indigo-600 dark:text-indigo-300 hover:underline"
              >
                {emailMode ? '← Use username instead' : 'Use email instead →'}
              </button>

              <form onSubmit={submit} className="space-y-4">
                {emailMode && (
                  <div>
                    <label htmlFor="auth-email" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Email
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className={inputCls}
                    />
                  </div>
                )}
                {(!emailMode || mode === 'register') && (
                  <div>
                    <label htmlFor="auth-username" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Username {mode === 'register' && <span className="font-normal text-stone-400">(required — this is your name everywhere)</span>}
                    </label>
                    <input
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. feral_operator"
                      autoComplete="username"
                      required
                      className={inputCls}
                    />
                    {mode === 'register' && (
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 font-mono-code">3–24 chars: letters, numbers, _ or -</p>
                    )}
                  </div>
                )}
                <div>
                  <label htmlFor="auth-password" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Make it a good one"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    className={inputCls}
                  />
                  {mode === 'register' && (
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 font-mono-code">
                      8+ characters. You will get a recovery code at sign-up — guard it like a houseplant.
                    </p>
                  )}
                </div>

                {error && (
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/60 rounded-xl px-3 py-2.5">
                    {error}
                    {suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { setUsername(s); setError(null); setSuggestions([]); }}
                            className="px-2 py-1 bg-white dark:bg-white/10 border border-rose-300 dark:border-rose-700 rounded-lg font-mono-code text-[11px] hover:bg-rose-100 dark:hover:bg-white/20"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {busy ? 'Working…' : mode === 'login' ? 'Enter the chaos' : 'Claim your chaos'}
                </button>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline font-mono-code uppercase tracking-wider"
                  >
                    Forgot password? →
                  </button>
                )}
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => switchMode('login')}
                className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold font-mono-code uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to log in
              </button>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold font-display-punch text-slate-900 dark:text-cream-canvas">
                  Get back in
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                Two ways back, depending on what you still have.
              </p>

              {/* Option 1: email reset link */}
              {authConfig.smtp ? (
                <form onSubmit={sendResetLink} className="space-y-3 mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono-code uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    <Mail className="w-3.5 h-3.5" /> Email me a reset link
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={inputCls}
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {busy ? 'Sending…' : 'Send reset link'}
                  </button>
                  {forgotSent && (
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{forgotSent}</p>
                  )}
                </form>
              ) : (
                <p className="text-[11px] text-stone-400 dark:text-stone-500 italic mb-4">
                  Email reset isn't switched on for this instance — the recovery-code route below has you covered.
                </p>
              )}

              {/* Option 2: recovery code */}
              <form onSubmit={submit} className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold font-mono-code uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <KeyRound className="w-3.5 h-3.5" /> Use my recovery code
                </div>
                <div>
                  <label htmlFor="recover-username" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Username
                  </label>
                  <input
                    id="recover-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    className={`${inputCls} font-mono-code`}
                  />
                </div>
                <div>
                  <label htmlFor="recover-code" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Recovery code
                  </label>
                  <input
                    id="recover-code"
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    spellCheck={false}
                    required
                    className={`${inputCls} font-mono-code tracking-widest uppercase`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="recover-new" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      New password
                    </label>
                    <input
                      id="recover-new"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="recover-confirm" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Confirm it
                    </label>
                    <input
                      id="recover-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {busy ? 'Verifying…' : 'Verify & set new password'}
                </button>
              </form>

              {error && (
                <div className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/60 rounded-xl px-3 py-2.5">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 italic font-serif-display">
          Your data lives in your own lane. Nobody else can see your mess — that is the whole point.
        </p>
      </div>
    </main>
  );
};
