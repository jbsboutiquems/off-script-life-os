import crypto from "crypto";

/**
 * sms.ts — SMS sending for phone verification + phone recovery.
 * Provider model: Twilio (REST, no SDK) when TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN and TWILIO_FROM are set; otherwise messages are
 * logged to the server console (dev mode) so the API contract stays
 * testable without spending a cent.
 *
 * NOTE: real SMS delivery needs either funded Twilio credentials or a
 * switch to Firebase Phone Auth (free 10k/mo). Nothing here sends a
 * real text until those env vars exist.
 */

interface SmsConfig {
  accountSid: string;
  authToken: string;
  from: string;
}

function twilioConfig(): SmsConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_FROM || "";
  if (!accountSid || !authToken || !from) return null;
  return { accountSid, authToken, from };
}

export function smsConfigured(): boolean {
  return twilioConfig() !== null;
}

/** Normalize a raw phone entry to E.164. Assumes US (+1) for bare 10-digit numbers. */
export function normalizePhone(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const cfg = twilioConfig();
  if (!cfg) {
    console.log(`[sms] (dev — not sent) to ${to}: ${body}`);
    return;
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: cfg.from, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio SMS failed (${res.status}): ${text.slice(0, 120)}`);
  }
}

/** 6-digit numeric code, crypto-random. */
export function generateSmsCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}
