/**
 * Fingerprint / face unlock (biometric login) — Amber, Nov 27, 2026.
 *
 * Native-only (installed Capacitor app). On plain web this module is inert:
 * every check returns false and no biometric UI is ever shown, because the
 * secure-storage web fallback is plain localStorage and must never hold a
 * password.
 *
 * How it works:
 * - After a successful password login, the app offers a one-tap opt-in.
 *   Accepting stores the login (identifier + password) in the device's
 *   secure storage — Android Keystore-encrypted (AES-GCM) via
 *   @aparajita/capacitor-secure-storage, iOS Keychain — NEVER in
 *   localStorage. A plain boolean flag in localStorage only records that
 *   biometric unlock is switched on; it holds no secret.
 * - On the login screen, if unlock is switched on and the device has
 *   biometrics enrolled, an "Unlock with fingerprint/face" button appears.
 *   Tapping it runs the native biometric prompt (via
 *   @aparajita/capacitor-biometric-auth); only on success are the stored
 *   credentials read out of secure storage and used to sign in.
 * - Any failure (cancel, no biometry, missing/stale credentials) falls
 *   back to the normal password form — nobody is ever locked out.
 * - Turning it off (Settings, or the login screen) deletes the stored
 *   credentials and the flag.
 */
import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
} from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const CRED_KEY = 'biometric-login';
const FLAG_KEY = 'lifeos:biometric:enabled';

/** True only inside the installed Android/iOS app — never on the web. */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Whether the user switched biometric unlock on (flag only, no secret). */
export function isBiometricLoginEnabled(): boolean {
  if (!isNativeApp()) return false;
  try {
    return localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export interface BiometricInfo {
  available: boolean;
  /** 'fingerprint' | 'face' | 'iris' | 'biometric' — for button labels. */
  label: string;
}

export async function checkBiometricAvailability(): Promise<BiometricInfo> {
  if (!isNativeApp()) return { available: false, label: 'biometric' };
  try {
    const info = await BiometricAuth.checkBiometry();
    if (!info.isAvailable) return { available: false, label: 'biometric' };
    const t = info.biometryType;
    const label =
      t === BiometryType.fingerprintAuthentication || t === BiometryType.touchId
        ? 'fingerprint'
        : t === BiometryType.faceAuthentication || t === BiometryType.faceId
          ? 'face'
          : t === BiometryType.irisAuthentication
            ? 'iris'
            : 'biometric';
    return { available: true, label };
  } catch {
    return { available: false, label: 'biometric' };
  }
}

/** Store the login behind device secure storage. Call only after a good login. */
export async function enableBiometricLogin(identifier: string, password: string): Promise<void> {
  if (!isNativeApp()) throw new Error('Biometric unlock is only available in the installed app.');
  await SecureStorage.set(CRED_KEY, JSON.stringify({ identifier, password }));
  try {
    localStorage.setItem(FLAG_KEY, '1');
  } catch {
    /* flag is best-effort; the credentials are the source of truth */
  }
}

/** Delete the stored login and the flag. Never throws. */
export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStorage.remove(CRED_KEY);
  } catch {
    /* already gone */
  }
  try {
    localStorage.removeItem(FLAG_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Run the native biometric prompt, then read the stored login.
 * Throws on cancel/failure — the caller falls back to the password form.
 */
export async function unlockWithBiometrics(): Promise<{ identifier: string; password: string }> {
  if (!isNativeApp()) throw new Error('Biometric unlock is only available in the installed app.');
  await BiometricAuth.authenticate({
    reason: 'Unlock Life OS with your fingerprint or face',
    cancelTitle: 'Use password instead',
    allowDeviceCredential: true,
    androidTitle: 'Unlock Life OS',
    androidSubtitle: 'Use your fingerprint or face to log in',
    androidConfirmationRequired: false,
  });
  const raw = await SecureStorage.get(CRED_KEY);
  if (!raw) throw new Error('No saved login found — please log in with your password.');
  const creds = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!creds?.identifier || !creds?.password) {
    throw new Error('Saved login is incomplete — please log in with your password.');
  }
  return creds as { identifier: string; password: string };
}

/** True when the user backed out of the biometric prompt on purpose. */
export function isUserCancelledBiometry(err: unknown): boolean {
  return (
    err instanceof BiometryError &&
    (err.code === BiometryErrorType.userCancel ||
      err.code === BiometryErrorType.systemCancel ||
      err.code === BiometryErrorType.userFallback)
  );
}
