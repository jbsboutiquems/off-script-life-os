/**
 * Settings — private account settings only (Amber, 2026-10-29).
 *
 * Separate from Profile (what others see). Nothing in this tab is public.
 * Sections: email + verification status + resend, update email, password,
 * recovery code, phone.
 *
 * Staged (2026-11-01): email display, verification resend, recovery-code
 * rotation and phone status/request/verify all use existing server routes.
 * Password change reuses the existing recovery-code flow
 * (/api/auth/recover: email + recovery code + new password).
 * Update email has NO server endpoint yet — the field is shown disabled
 * with that flagged, rather than pretending a save works. Wiring that
 * endpoint (uniqueness check, reset emailVerified, send a new verification
 * link) is the remaining Settings item.
 */
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { ShieldAlert, Mail, KeyRound, Smartphone, BadgeCheck } from 'lucide-react';

interface SettingsViewProps {
  user: UserProfile;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Email verification
  const [resending, setResending] = useState(false);
  const resend = async () => {
    setMsg(null); setErr(null); setResending(true);
    try {
      await api.resendVerification();
      setMsg('Verification email re-sent. Check your inbox.');
    } catch (e: any) { setErr(e.message || 'Could not resend.'); }
    finally { setResending(false); }
  };

  // Password via recovery-code flow
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const changePassword = async () => {
    setMsg(null); setErr(null);
    if (!user.email) { setErr('No email on this account — password change needs your account email.'); return; }
    setPwBusy(true);
    try {
      const out = await api.recoverAccount(user.email, recoveryCode, newPassword);
      setMsg('Password changed. Your recovery code was also rotated — save the new one from the recovery section.');
      setRecoveryCode(''); setNewPassword('');
      setNewCode(out.recoveryCode);
    } catch (e: any) { setErr(e.message || 'Could not change password.'); }
    finally { setPwBusy(false); }
  };

  // Recovery code rotation
  const [newCode, setNewCode] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const rotate = async () => {
    setMsg(null); setErr(null); setRotating(true);
    try {
      const out = await api.rotateRecoveryCode();
      setNewCode(out.recoveryCode);
    } catch (e: any) { setErr(e.message || 'Could not mint a new code.'); }
    finally { setRotating(false); }
  };

  // Phone
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneLoaded, setPhoneLoaded] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  useEffect(() => {
    api.phoneStatus()
      .then((s) => { setPhone(s.phone || ''); setPhoneVerified(s.phoneVerified); setPhoneLoaded(true); })
      .catch(() => setPhoneLoaded(true));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" /> Settings — private
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Account settings only. Nothing here is shown on your public profile.
        </p>
        {msg && <p className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{msg}</p>}
        {err && <p className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300">{err}</p>}
      </div>

      {/* Email */}
      <section className="bg-white dark:bg-[#02142e] rounded-2xl border border-stone-300 dark:border-white/10 p-6 space-y-3">
        <h3 className="font-bold text-sm uppercase flex items-center gap-2"><Mail className="w-4 h-4 text-rose-600" /> Email</h3>
        <p className="text-sm font-semibold">{user.email || 'No email on this account.'}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
          Verification: {user.emailVerified ? (<><BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified</>) : 'Not verified'}
        </p>
        {!user.emailVerified && user.email && (
          <button type="button" onClick={resend} disabled={resending}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl disabled:opacity-50">
            {resending ? 'Sending…' : 'Re-send verification email'}
          </button>
        )}
        <div className="pt-3 border-t border-stone-200 dark:border-white/10">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Update email — NOT YET WIRED</label>
          <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
            There is no server endpoint for changing an account email yet, so this
            field is disabled on purpose. Remaining work: an endpoint that checks
            uniqueness, resets verification, and sends a new verification link.
          </p>
          <input type="email" disabled placeholder="New email address"
            className="mt-2 w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-stone-100 dark:bg-white/5 text-sm opacity-60" />
        </div>
      </section>

      {/* Password + recovery code */}
      <section className="bg-white dark:bg-[#02142e] rounded-2xl border border-stone-300 dark:border-white/10 p-6 space-y-4">
        <h3 className="font-bold text-sm uppercase flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-600" /> Password &amp; recovery code</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Password change uses the existing recovery-code flow: your account email
          + current recovery code + a new password (8+ characters). A password
          change kills every session — log in again everywhere.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <input type="text" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="Current recovery code"
            className="px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 font-mono-code" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (8+ characters)"
            className="px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5" />
        </div>
        <button type="button" onClick={changePassword} disabled={pwBusy || !recoveryCode || newPassword.length < 8}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-50">
          {pwBusy ? 'Changing…' : 'Change password'}
        </button>
        <div className="pt-3 border-t border-stone-200 dark:border-white/10">
          <button type="button" onClick={rotate} disabled={rotating}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl disabled:opacity-50">
            {rotating ? 'Minting…' : 'Get a new recovery code'}
          </button>
          {newCode && (
            <p className="mt-2 text-xs font-mono-code font-bold bg-amber-50 dark:bg-amber-950/50 border border-amber-300 rounded-xl px-3 py-2 break-all">
              New recovery code (shown once — save it now): {newCode}
            </p>
          )}
        </div>
      </section>

      {/* Phone */}
      <section className="bg-white dark:bg-[#02142e] rounded-2xl border border-stone-300 dark:border-white/10 p-6 space-y-3">
        <h3 className="font-bold text-sm uppercase flex items-center gap-2"><Smartphone className="w-4 h-4 text-teal-600" /> Phone
          {phoneVerified && <span className="text-[10px] font-mono-code font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-full px-2 py-0.5">Verified</span>}
        </h3>
        {phoneLoaded ? (
          <>
            <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneCodeSent(false); }} placeholder="10-digit mobile number" disabled={phoneVerified}
              className="w-full px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 text-sm font-semibold disabled:opacity-60" />
            {!phoneVerified && (
              <button type="button" disabled={phoneBusy || !phone.trim()}
                onClick={async () => {
                  setPhoneBusy(true); setErr(null);
                  try { await api.requestPhoneCode(phone); setPhoneCodeSent(true); setMsg('Code sent — check your texts (or the server log if texting is not live yet).'); }
                  catch (e: any) { setErr(e.message); }
                  finally { setPhoneBusy(false); }
                }}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                {phoneBusy ? 'Sending…' : phoneCodeSent ? 'Resend code' : 'Text me a code'}
              </button>
            )}
            {!phoneVerified && phoneCodeSent && (
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code"
                  className="flex-1 px-3 py-2 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 font-mono-code tracking-[0.3em]" />
                <button type="button" disabled={phoneBusy || phoneCode.length !== 6}
                  onClick={async () => {
                    setPhoneBusy(true); setErr(null);
                    try { await api.verifyPhoneCode(phoneCode); setPhoneVerified(true); setMsg('Number verified.'); }
                    catch (e: any) { setErr(e.message); }
                    finally { setPhoneBusy(false); }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-50">
                  Verify
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-stone-400 font-mono-code">Loading phone status…</p>
        )}
      </section>

      {/* Contact */}
      <section className="bg-white dark:bg-[#02142e] rounded-2xl border border-stone-300 dark:border-white/10 p-6 space-y-2">
        <h3 className="font-bold text-sm uppercase flex items-center gap-2"><Mail className="w-4 h-4 text-rose-600" /> Questions?</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Reach us at <a href="mailto:lifeosoffscript@gmail.com" className="font-semibold text-rose-600 underline">lifeosoffscript@gmail.com</a>.
        </p>
      </section>
    </div>
  );
};
