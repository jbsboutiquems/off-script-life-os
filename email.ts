/**
 * Outbound email for the Off*Script Life OS prototype.
 * Configured entirely through env vars — nothing here is Amber's job to code.
 *
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE ("1" for 465)
 *   BASE_URL — public base URL of this instance, used to build links
 *
 * Dev/test hook: SMTP_STUB_CAPTURE=/tmp/emails.json — instead of sending,
 * the email is appended as JSON to that file. Never set this in production.
 */
import nodemailer from "nodemailer";
import fs from "fs";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST || "";
  if (!host) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    secure: process.env.SMTP_SECURE === "1",
  };
}

export function smtpConfigured(): boolean {
  // The stub capture counts as configured: it's a deliberate dev/test email sink.
  return getSmtpConfig() !== null || !!process.env.SMTP_STUB_CAPTURE;
}

export function baseUrl(): string {
  return (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(email: OutboundEmail): Promise<void> {
  const stubFile = process.env.SMTP_STUB_CAPTURE;
  if (stubFile) {
    const line = JSON.stringify({ ...email, captured_at: new Date().toISOString() }) + "\n";
    fs.appendFileSync(stubFile, line, "utf-8");
    console.log(`[mail-stub] captured email to ${email.to} -> ${stubFile}`);
    return;
  }
  const cfg = getSmtpConfig();
  if (!cfg) throw new Error("SMTP is not configured.");
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  await transporter.sendMail({ from: cfg.from, to: email.to, subject: email.subject, html: email.html });
}

function shell(title: string, body: string, cta: { label: string; href: string } | null): string {
  return `<!doctype html><html><body style="font-family:Georgia,serif;background:#faf5eb;padding:32px;color:#1c1917">
<div style="max-width:560px;margin:0 auto;background:#fffdfa;border:2px solid #1c1917;border-radius:16px;padding:32px">
<div style="font-size:28px;margin-bottom:8px">⚡</div>
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
<div style="font-size:14px;line-height:1.6">${body}</div>
${cta ? `<p style="margin:24px 0"><a href="${cta.href}" style="display:inline-block;background:#ea4798;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold">${cta.label}</a></p>
<p style="font-size:12px;color:#78716c">Or paste this link into your browser:<br><span style="word-break:break-all">${cta.href}</span></p>` : ``}
<p style="font-size:12px;color:#78716c;margin-top:24px">Structure without the cage. — The Off*Script Life OS</p>
</div></body></html>`;
}

export function verificationEmail(to: string, link: string): OutboundEmail {
  return {
    to,
    subject: "Confirm your email — Off*Script Life OS",
    html: shell(
      "One click and you're in for real.",
      `<p>You signed up for the Off*Script Life OS with this email. Click below to prove it's actually yours.</p>
       <p style="font-size:12px;color:#78716c">Didn't sign up? Ignore this — the account can't do anything until it's verified… well, it can, but we'd rather you clicked.</p>`,
      { label: "Verify my email", href: link }
    ),
  };
}

export function resetEmail(to: string, link: string): OutboundEmail {
  return {
    to,
    subject: "Reset your password — Off*Script Life OS",
    html: shell(
      "Locked out? Let's fix that.",
      `<p>Someone (hopefully you) asked to reset the password on your Off*Script account. Click below to set a new one. The link expires in 1 hour.</p>
       <p style="font-size:12px;color:#78716c">Didn't ask for this? Ignore it — your password stays exactly as it is.</p>`,
      { label: "Set a new password", href: link }
    ),
  };
}
