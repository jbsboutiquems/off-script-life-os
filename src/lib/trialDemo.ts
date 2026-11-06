// Trial demo mode — the public "look around" build of the app that runs
// at lifeosoffscript.vercel.app/try.
//
// Locked trial rules (owner, 2026-10-21 / 2026-10-23):
//   - Visitors look around freely: every page browses, no sign-in wall.
//   - Reactions and stickers are free for trial visitors.
//   - WORDS are gated: posting, replying, commenting, and DMs do not go
//     through — they prompt the app download instead.
//   - Login / sign-up on the web does not exist here: any auth door in
//     the demo prompts the app download. Accounts live in the app.
//   - No Add-to-Home-Screen popup, ever. The only install path is the
//     explicit download CTA below.
//
// This module is inert unless the build sets VITE_TRIAL_DEMO=1. Normal
// builds (APK, GitHub Pages, server-served) never read the flag as true,
// so their behavior is exactly what it was before this file existed.
import type { UserProfile } from '../types';

export const TRIAL_DEMO: boolean = (import.meta as any).env?.VITE_TRIAL_DEMO === '1';

/**
 * The download CTA target: the same GitHub releases latest-download link
 * the Facebook Page "Learn More" buttons and the marketing site use.
 */
export const APK_DOWNLOAD_URL =
  'https://github.com/jbsboutiquems/off-script-life-os/releases/latest/download/app-release.apk';

export const TRIAL_DOWNLOAD_PROMPT_EVENT = 'offscript:trial-download-prompt';

/**
 * Ask the app shell to show the "get the app" prompt. Called from every
 * gated action (posting, replying, DMing, auth doors) in trial mode.
 * No-op in normal builds.
 */
export function promptAppDownload(): void {
  if (!TRIAL_DEMO) return;
  try {
    window.dispatchEvent(new CustomEvent(TRIAL_DOWNLOAD_PROMPT_EVENT));
  } catch {
    /* the prompt is an enhancement; a gated action failing silently is fine */
  }
}

/**
 * The demo visitor. The app hard-requires a signed-in user to render at
 * all, so the trial build walks in as this local-only identity: no token
 * is ever created, no account exists on the server, and every /api call
 * the shell makes simply fails soft into the app's offline fallbacks.
 */
export const DEMO_USER: UserProfile = {
  id: 'trial-visitor',
  khaos_name: 'Visitor',
  word_of_the_year: '',
  khaos_mantra: '',
  what_done_pretending: '',
  what_ready_to_admit: '',
  relationship_with_khaos: '',
  permission_granted: '',
  email: null,
  emailVerified: true,
  onboarding_seen: true,
  created_at: new Date().toISOString(),
  core_values: {
    autonomy: 5,
    honesty: 5,
    creativity: 5,
    presence: 5,
    resilience: 5,
    playfulness: 5,
    rest: 5,
    discipline: 5,
  },
};

// ---------- Sample community content ----------
// The community surfaces are server-backed and need a real account, so
// the demo shows representative sample content instead. Reactions on it
// work locally; anything that writes words prompts the download.

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export interface TrialWallReply {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
}

export interface TrialWallPost {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
  replies: TrialWallReply[];
  reactions: Record<string, string[]>;
  pinned: boolean;
}

export function sampleWallPosts(): TrialWallPost[] {
  return [
    {
      id: 'demo-post-pinned',
      userId: 'khaos-mod',
      username: 'khaos_mod',
      text: '👋 Welcome to the Wall — you\'re looking at the demo feed. The real Krew posts live in the app. React to anything here, go ahead. Screaming (posting) takes the app — it\'s free. Boredom = Death.',
      created_at: hoursAgo(2),
      replies: [],
      reactions: { '❤️': ['demo-a', 'demo-b'], '🔥': ['demo-c'] },
      pinned: true,
    },
    {
      id: 'demo-post-2',
      userId: 'gremlin-in-chief',
      username: 'gremlin_in_chief',
      text: 'Day 12 of doing the exact opposite of my to-do list. Productivity is furious. I am thriving.',
      created_at: hoursAgo(5),
      replies: [
        {
          id: 'demo-reply-1',
          userId: 'boredomslayer',
          username: 'boredomslayer',
          text: 'The list never stood a chance.',
          created_at: hoursAgo(4),
        },
      ],
      reactions: { '🔥': ['demo-a', 'demo-b', 'demo-c'], '😂': ['demo-d'] },
      pinned: false,
    },
    {
      id: 'demo-post-3',
      userId: 'boredomslayer',
      username: 'boredomslayer',
      text: 'Unpopular opinion: a nap is a strategy meeting with your subconscious, and the minutes are always excellent.',
      created_at: hoursAgo(26),
      replies: [],
      reactions: { '❤️': ['demo-a', 'demo-b', 'demo-c', 'demo-d'], '💀': ['demo-e', 'demo-f'] },
      pinned: false,
    },
  ];
}

export interface TrialThreadSummary {
  partnerId: string;
  partnerUsername: string;
  lastText: string;
  lastAt: string;
  lastFromMe: boolean;
  unread: number;
}

export interface TrialDm {
  id: string;
  fromId: string;
  fromUsername: string;
  text: string;
  created_at: string;
}

export function sampleInboxThreads(): TrialThreadSummary[] {
  return [
    {
      partnerId: 'khaos-mod',
      partnerUsername: 'khaos_mod',
      lastText: 'Here in the demo you can read — sending takes the app.',
      lastAt: hoursAgo(1),
      lastFromMe: false,
      unread: 0,
    },
  ];
}

export function sampleThreadMessages(partnerId: string): TrialDm[] {
  if (partnerId !== 'khaos-mod') return [];
  return [
    {
      id: 'demo-dm-1',
      fromId: 'khaos-mod',
      fromUsername: 'khaos_mod',
      text: 'You found the DMs. 👀',
      created_at: hoursAgo(1),
    },
    {
      id: 'demo-dm-2',
      fromId: 'khaos-mod',
      fromUsername: 'khaos_mod',
      text: 'In the app, this is where you talk to your actual people — no audience, no performance, no algorithm in the middle.',
      created_at: hoursAgo(1),
    },
    {
      id: 'demo-dm-3',
      fromId: 'khaos-mod',
      fromUsername: 'khaos_mod',
      text: 'Here in the demo you can read — sending takes the app. It\'s free. It\'s always been free.',
      created_at: hoursAgo(1),
    },
  ];
}

export interface TrialRoomSummary {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberCount: number;
  lastAt: string;
}

export interface TrialRoomMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
}

export function sampleRooms(): TrialRoomSummary[] {
  return [
    {
      id: 'demo-room-lobby',
      name: 'The Lobby',
      description: 'Where demo visitors hang out. The real rooms — krewes, book clubs, conspiracies — live in the app.',
      ownerId: 'khaos-mod',
      memberCount: 12,
      lastAt: hoursAgo(3),
    },
  ];
}

export function sampleRoomMessages(roomId: string): TrialRoomMessage[] {
  if (roomId !== 'demo-room-lobby') return [];
  return [
    {
      id: 'demo-room-msg-1',
      userId: 'gremlin-in-chief',
      username: 'gremlin_in_chief',
      text: 'Rooms are group chats for your crew. This one\'s a demo — the door is open, the talking is in the app.',
      created_at: hoursAgo(3),
    },
    {
      id: 'demo-room-msg-2',
      userId: 'boredomslayer',
      username: 'boredomslayer',
      text: 'Rule one of the Lobby: nobody performs productivity in here.',
      created_at: hoursAgo(3),
    },
  ];
}
