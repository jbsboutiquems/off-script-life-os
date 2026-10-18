#!/usr/bin/env node
/**
 * Backfill Amber as first friend for EXISTING users.
 *
 * New signups are auto-friended by the server (befriendAmberOnSignup).
 * This script covers accounts created BEFORE that shipped.
 *
 * DRY-RUN BY DEFAULT — prints what it would do and changes nothing.
 *   node scripts/backfill-amber-friends.mjs [--data <path>] [--amber-id <id> | --amber-email <email> | --amber-username <name>]
 *   node scripts/backfill-amber-friends.mjs --apply [--welcome-dms]
 *
 * --apply writes the data file (a .bak-<timestamp> copy is made first).
 * --welcome-dms also seeds Amber's welcome DM for each newly friended user
 * (same text the server sends new signups). Without it, the friendship is
 * created but no DM thread appears until someone messages.
 *
 * Amber is resolved from --amber-id / --amber-username, else the
 * AMBER_USER_ID / AMBER_USERNAME env vars. Nothing about her is hardcoded.
 *
 * SEQUENCING (Amber, Oct 17): do NOT set AMBER_USER_ID / AMBER_USERNAME in
 * the deploy env — and do NOT run this script — until AFTER the account
 * wipe. The wipe deletes all accounts, so her account will be recreated
 * fresh and the env value must be her NEW post-wipe account ID, not the
 * current one. Order: wipe → she recreates her account → set
 * AMBER_USER_ID to the new ID → then run this backfill / activation.
 * For the record (Amber, Oct 17): her app username is SnoopsMommy — that
 * is the AMBER_USERNAME value to use post-wipe. It is a username, not the
 * numeric account ID; do not set or assume anything before the wipe.
 */
import fs from "node:fs";
import path from "node:path";

const AMBER_WELCOME_DM =
  "Welcome to the Khaos Krew! I'm Amber — your first friend here. Say hi anytime. 💫";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};

const dataPath = path.resolve(opt("--data") || process.env.DATA_FILE || "khaos_os_data.json");
const apply = flag("--apply");
const welcomeDms = flag("--welcome-dms");

if (!fs.existsSync(dataPath)) {
  console.error(`Data file not found: ${dataPath}`);
  process.exit(1);
}
const db = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
db.friendships = Array.isArray(db.friendships) ? db.friendships : [];
db.dmMessages = Array.isArray(db.dmMessages) ? db.dmMessages : [];

const amberIdArg = opt("--amber-id") || process.env.AMBER_USER_ID || "";
const amberEmailArg = (opt("--amber-email") || process.env.AMBER_EMAIL || "").toLowerCase();
const amberNameArg = (opt("--amber-username") || process.env.AMBER_USERNAME || "").toLowerCase();
let amber = null;
if (amberIdArg) amber = db.accounts.find((a) => a.id === amberIdArg);
// AMBER_EMAIL: verified email ONLY — never match an unverified account,
// or anyone could squat the identity post-wipe by registering with her
// email before she does. Same rule as resolveAmberAccountId() in server.ts.
if (!amber && amberEmailArg) amber = db.accounts.find((a) => (a.email || "").toLowerCase() === amberEmailArg && a.emailVerified === true);
if (!amber && amberNameArg) amber = db.accounts.find((a) => (a.usernameKey || a.username || "").toLowerCase() === amberNameArg);
if (!amber) {
  console.error("Could not resolve Amber's account. Pass --amber-id <id>, --amber-email <email>, or --amber-username <name>, or set AMBER_USER_ID / AMBER_EMAIL / AMBER_USERNAME.");
  process.exit(1);
}

const areFriends = (a, b) => db.friendships.some((f) => f.userId === a && f.friendId === b);
const targets = db.accounts.filter(
  (a) => a.id !== "legacy" && a.id !== amber.id && !areFriends(a.id, amber.id)
);

console.log(`Amber: ${amber.username} (${amber.id})`);
console.log(`Accounts missing Amber as a friend: ${targets.length}`);
for (const t of targets) console.log(`  - ${t.username} (${t.id})`);

if (targets.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}
if (!apply) {
  console.log("\nDRY RUN — nothing changed. Re-run with --apply to write (a .bak backup is made first).");
  process.exit(0);
}

const backup = `${dataPath}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
fs.copyFileSync(dataPath, backup);
console.log(`Backup: ${backup}`);

const now = new Date().toISOString();
let dmCount = 0;
for (const t of targets) {
  db.friendships.push(
    { userId: t.id, friendId: amber.id, created_at: now },
    { userId: amber.id, friendId: t.id, created_at: now }
  );
  if (welcomeDms) {
    const hasThread = db.dmMessages.some(
      (m) => (m.fromId === amber.id && m.toId === t.id) || (m.fromId === t.id && m.toId === amber.id)
    );
    if (!hasThread) {
      db.dmMessages.push({
        id: `dm_backfill_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        fromId: amber.id,
        fromUsername: amber.username,
        toId: t.id,
        toUsername: t.username,
        text: AMBER_WELCOME_DM,
        created_at: now,
      });
      dmCount++;
    }
  }
}
fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
console.log(`APPLIED: ${targets.length} friendships created${welcomeDms ? `, ${dmCount} welcome DMs seeded` : " (no welcome DMs — re-run with --welcome-dms to add them)"}.`);
