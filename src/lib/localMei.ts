// ================= LOCAL MEI =================
// The home-grown conversation engine behind Ask Mei. Built 2026-11-25 per
// Amber: "Don't use theirs. We're not going to use them. They want more
// than Google." The external Messages Improved API is GONE — this file IS
// Mei now. No network calls, no keys, no outside service, no new
// dependencies. Everything runs on this server from the user's own planner
// data (latest personality snapshot, today's entry, recent entries, goals).
//
// How it works:
//   1. The message is normalized and scored against a list of intents.
//      Each intent has keyword/regex patterns; the score is the number
//      of words the patterns actually match, so a specific phrase
//      ("how does this app work") beats a generic word ("work").
//      The highest score wins; ties go to the more specific intent
//      (they are listed first).
//   2. Sentiment (positive/negative word counts) nudges the tone of the
//      generic fallback when no intent matches.
//   3. The winning intent builds its reply from templates, filled with
//      the user's own data when it exists (mood, burnout risk, today's
//      priorities, today's mission, word of year). When the data isn't
//      there, the reply uses a no-data variant instead of inventing facts.
//   4. Reply variants are picked by a hash of the message, so the same
//      question gets a steady answer while different questions vary.
//
// Honest limits (stated when asked, never pretended otherwise):
//   - It matches patterns; it does not understand like a model. It can't
//     reason about things it has no pattern for, and it has no memory of
//     past chats — each message is answered fresh from the planner data.
//   - It never calls any outside service and never sends the user's words
//     anywhere. What you type stays on this server.
//   - It is not a therapist, doctor, or crisis line. For heavy stuff it
//     stays steady, reflects the user's own words, and offers the plain
//     choice: keep talking or be left alone.

export interface LocalMeiContext {
  username?: string;
  khaosName?: string;
  wordOfYear?: string;
  latestSnapshot?: {
    detected_mood?: string;
    burnout_risk?: string;
    micro_dare?: string;
    contradiction_callout?: string;
    observed_word?: string;
  } | null;
  todayEntry?: {
    entry_date?: string;
    morning_intention?: string;
    today_i_am?: string;
    priorities?: string[];
    midday_checkin?: string;
    khaos_score?: number;
    holiday_title?: string;
    holiday_adventure?: string;
  } | null;
  /** Average khaos score (1-10) across recent entries, when available. */
  recentKhaosAvg?: number | null;
  openGoalCount?: number;
}

export interface LocalMeiReply {
  reply: string;
  intent: string;
}

// ---------- small helpers ----------

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], seed: string): T {
  return arr[hashStr(seed) % arr.length];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
}

function chicagoNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
}

function nameOf(ctx: LocalMeiContext): string {
  return (ctx.khaosName || ctx.username || "").trim();
}

function moodLine(ctx: LocalMeiContext): string {
  const m = ctx.latestSnapshot?.detected_mood;
  return m ? ` Last snapshot had you at "${m}".` : "";
}

function burnoutLine(ctx: LocalMeiContext): string {
  const b = ctx.latestSnapshot?.burnout_risk;
  if (b === "High" || b === "Critical") return ` Your last snapshot put burnout at ${b} — that's not a vibe, that's a bill coming due.`;
  if (b === "Moderate") return ` Burnout's sitting at Moderate — not a crisis, not nothing.`;
  return "";
}

// ---------- micro-dares ----------
// Concrete, slightly provocative, doable. The dare list is the engine's
// "do-first" muscle: every stuck/plan/bored reply can pull one.

export const LOCAL_MEI_DARES: readonly string[] = [
  "Text one person you actually like and tell them one true thing.",
  "Do the smallest piece of the thing you're avoiding — two minutes, badly, then stop.",
  "Take a different route on your next errand, even if it's longer.",
  "Put your phone in another room for 30 minutes and see what your hands do.",
  "Write the meanest, truest sentence about today in your field notes. No filter.",
  "Eat one meal today sitting down, no screen, no multitasking.",
  "Say no to one thing you were going to say yes to out of guilt.",
  "Move one thing in your space to somewhere wrong on purpose. Leave it.",
  "Do one thing today the 'productive' version of you would call a waste of time.",
  "Drink a glass of water before your next coffee.",
  "Step outside for five minutes. No destination.",
  "Delete one app you open when you're bored, just for today.",
  "Write tomorrow's top 3 tonight, then close the book.",
  "Tell someone the real answer to 'how are you' — one person, one sentence.",
  "Do the dishes to one full song, loud.",
  "Wear the thing you've been saving for a special occasion. Today is it.",
  "Leave one task undone on purpose and notice that nothing collapses.",
  "Take a photo of something ugly-beautiful and keep it.",
  "Say the thing you've been rehearsing in your head, out loud, to the mirror first.",
  "Go to bed 30 minutes earlier than usual. No negotiation.",
  "Start the task you've been circling by doing only the first physical move — open the doc, pick up the pen.",
  "Ask for help with one small thing today, even if you could do it yourself.",
  "Cross one thing off your list that doesn't actually need doing. Delete it.",
  "Do one thing that makes future-you's morning easier, then stop.",
];

function dareFor(seed: string): string {
  return pick(LOCAL_MEI_DARES, seed);
}

// ---------- sentiment (fallback tone only) ----------

const POSITIVE_WORDS = ["good", "great", "happy", "excited", "proud", "awesome", "amazing", "love", "loved", "win", "won", "better", "relieved", "grateful", "thankful", "fun", "calm", "peaceful", "strong"];
const NEGATIVE_WORDS = ["bad", "sad", "tired", "angry", "mad", "hate", "awful", "terrible", "worst", "stressed", "anxious", "scared", "afraid", "lonely", "alone", "stuck", "lost", "hopeless", "exhausted", "overwhelmed", "frustrated", "annoyed", "upset", "hurt", "pain", "cry", "crying", "depressed", "down"];

function sentiment(text: string): "positive" | "negative" | "neutral" {
  const words = new Set(text.split(" "));
  let pos = 0;
  let neg = 0;
  for (const w of words) {
    if (POSITIVE_WORDS.includes(w)) pos++;
    if (NEGATIVE_WORDS.includes(w)) neg++;
  }
  if (neg > pos) return "negative";
  if (pos > neg) return "positive";
  return "neutral";
}

// ---------- intents ----------
// Listed most-specific first: ties go to the earlier intent. Patterns use
// word boundaries so "planner" doesn't trip the "plan" intent, and "later"
// alone doesn't trip "goodbye".

type Ctx = LocalMeiContext;
type ReplyFn = (c: Ctx, seed: string) => string;

interface IntentDef {
  id: string;
  patterns: RegExp[];
  reply: ReplyFn;
}

const INTENTS: IntentDef[] = [
  {
    id: "whoAreYou",
    patterns: [/\bwho are you\b/, /\bwhat are you\b/, /\bare you mei\b/, /\bare you ai\b/, /\bare you real\b/, /\bare you a robot\b/, /\bare you human\b/, /\bwhat is mei\b/],
    reply: () =>
      "I'm the local Mei — home-grown, built into this app. No outside service, no data leaves this server. I'm pattern-matching, not a mind reader: I read the shape of what you say and answer from your own planner — your mood, your priorities, today's mission. I can't reason like the big models, and I don't remember past chats. What I can do: help you plan, push you when you're stuck, and tell you the truth without the pep talk.",
  },
  {
    id: "datetime",
    patterns: [/\bwhat time is it\b/, /\bwhat day is it\b/, /\bwhat's the date\b/, /\bwhats the date\b/, /\bwhat date is it\b/, /\bwhat day of the week\b/],
    reply: () => {
      const now = chicagoNow();
      const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `It's ${date} — ${time}, Chicago time. The day's still yours; what's the one thing you want done before it ends?`;
    },
  },
  {
    id: "dare",
    patterns: [/\bdare me\b/, /\bgive me a dare\b/, /\bmicro dare\b/, /\bchallenge me\b/, /\bi need a dare\b/, /\bgive me a challenge\b/],
    reply: (_c, seed) => `Your dare: ${dareFor(seed)} No negotiating with it — do it, then tell me how it went.`,
  },
  {
    id: "mission",
    patterns: [/\bmission\b/, /\bdaily mission\b/, /\btoday's adventure\b/, /\bwhat's my mission\b/, /\bwhats my mission\b/, /\btoday's mission\b/],
    reply: (c) => {
      const t = c.todayEntry;
      if (t?.holiday_title || t?.holiday_adventure) {
        const title = t.holiday_title ? `Today's mission: ${t.holiday_title}. ` : "";
        const adv = t.holiday_adventure ? `${t.holiday_adventure} ` : "";
        return `${title}${adv}Do-first order: lead task, then the adventure, then the soul questions. Start with the lead task — badly counts.`;
      }
      return "No mission on the books for today. Make one: one lead task, one adventure, one soul question. That's the whole day — everything else is noise.";
    },
  },
  {
    id: "audit",
    patterns: [/\bhow am i doing\b/, /\bam i doing ok\b/, /\bam i doing okay\b/, /\blife audit\b/, /\bcheck in on me\b/, /\bhow's my week\b/, /\bhows my week\b/, /\bhow was my week\b/, /\bmy snapshot\b/, /\bmy mood\b/],
    reply: (c, seed) => {
      const s = c.latestSnapshot;
      if (s) {
        const parts: string[] = [];
        if (s.detected_mood) parts.push(`mood ${s.detected_mood}`);
        if (s.burnout_risk) parts.push(`burnout ${s.burnout_risk}`);
        const head = parts.length ? `Last snapshot: ${parts.join(", ")}.` : "Got your last snapshot.";
        const contra = s.contradiction_callout ? ` The honest mirror caught this: ${s.contradiction_callout}` : "";
        const dare = s.micro_dare ? ` Your micro-dare was: ${s.micro_dare}` : "";
        return `${head}${contra}${dare} Want a fresh dare, or do you want to talk about what's actually going on underneath it?`;
      }
      return `No snapshot yet — run an evening check-in (field notes + khaos score) and I'll have something real to say back. Until then: how's today actually going, in your own words?`;
    },
  },
  {
    id: "planToday",
    patterns: [/\bwhat should i do today\b/, /\bplan my day\b/, /\btoday's plan\b/, /\bwhat's today\b/, /\bwhats today\b/, /\bhelp me plan\b/, /\bplan today\b/, /\bwhat do i do today\b/, /\bwhat should i do\b/],
    reply: (c) => {
      const p = c.todayEntry?.priorities?.filter(Boolean) || [];
      if (p.length) {
        const list = p.map((x, i) => `${i + 1}) ${x}`).join("\n");
        return `Today's top ${p.length}:\n${list}\n\nDo-first order. Lead task first — start it badly if you have to, starting beats planning.`;
      }
      return "No entry for today yet. Write your top 3 on today's page — lead task first, then the adventure, then one soul question. Then do the lead task. Planning without the doing is just a prettier way to stall.";
    },
  },
  {
    id: "priorities",
    patterns: [/\bpriorities\b/, /\btop 3\b/, /\bmost important\b/, /\bwhat matters most\b/, /\bwhat are my priorities\b/],
    reply: (c) => {
      const p = c.todayEntry?.priorities?.filter(Boolean) || [];
      if (p.length) return `Your priorities today: ${p.join(" • ")}. Three max — that's the rule. If everything's a priority, nothing is.`;
      return "No priorities set for today. Three max — lead task, adventure, soul question. Pick them, write them down, then do the first one.";
    },
  },
  {
    id: "money",
    patterns: [/\bmoney\b/, /\bbudget\b/, /\bbroke\b/, /\bspending\b/, /\bsaving\b/, /\bdebt\b/, /\bbills\b/, /\bcan't afford\b/, /\bcant afford\b/, /\bfinances\b/],
    reply: () =>
      "Money stress is real, and no pep talk fixes a balance. Smallest honest move: look at one number today — just one. Your Money Map's in the app if you want the full picture. What's the one money thing weighing on you most right now?",
  },
  {
    id: "love",
    patterns: [/\blove\b/, /\brelationship\b/, /\bpartner\b/, /\bboyfriend\b/, /\bgirlfriend\b/, /\bdating\b/, /\bcrush\b/, /\bmy husband\b/, /\bmy wife\b/, /\bmy fiance\b/],
    reply: () =>
      "Love stuff is the hardest to think straight about. Say it plain: what's actually happening — not the story, the facts? I'm not a therapist, just a mirror. Talk it out and I'll reflect it back straight, no sugar on it.",
  },
  {
    id: "work",
    patterns: [/\bwork\b/, /\bmy job\b/, /\bboss\b/, /\bcareer\b/, /\bbusiness\b/, /\bmy shop\b/, /\bselling\b/, /\bcustomers\b/],
    reply: () =>
      "Work. Okay. Is it the workload, the people, or the 'what am I even doing this for' part? Name the piece and we'll shrink it to one move. Vague dread gets nothing done — a named problem does.",
  },
  {
    id: "sleep",
    patterns: [/\bsleep\b/, /\binsomnia\b/, /\bcan't sleep\b/, /\bcant sleep\b/, /\bcan't fall asleep\b/, /\bawake all night\b/, /\bup all night\b/],
    reply: () =>
      "Sleep's a foundation thing, not a hack. Boring and true: no screens an hour before bed, same time every night. What's keeping you up — the thoughts, or the schedule?",
  },
  {
    id: "stuck",
    patterns: [/\bstuck\b/, /\bcan't start\b/, /\bcant start\b/, /\bcan't get going\b/, /\bprocrastinat/, /\bcan't focus\b/, /\bcant focus\b/, /\bcan't get myself to\b/],
    reply: (_c, seed) =>
      `Stuck isn't a character flaw, it's a starting problem. Shrink it to a stupid-small first move — hands, not head. ${dareFor(seed)} Two minutes, badly. That's the whole assignment.`,
  },
  {
    id: "overwhelmed",
    patterns: [/\boverwhelmed\b/, /\btoo much\b/, /\bdrowning\b/, /\bstressed\b/, /\banxious\b/, /\banxiety\b/, /\btoo many things\b/, /\bcan't handle\b/, /\bcant handle\b/, /\bfalling apart\b/],
    reply: (c) => {
      const p = c.todayEntry?.priorities?.filter(Boolean) || [];
      const lead = p.length ? ` Your first priority today is "${p[0]}" — start there, nothing else.` : "";
      return `Too much at once is a list problem, not a you problem. Dump it out — every thread — then circle ONE lead task. Just one. The rest waits.${lead}`;
    },
  },
  {
    id: "survival",
    patterns: [/\bsurvival mode\b/, /\bjust surviving\b/, /\bbarely holding\b/, /\bholding on\b/, /\bsurviving\b/, /\bgetting by\b/],
    reply: () =>
      "Survival mode means the bar drops to the floor, and that's allowed. One thing today: eat, drink water, do the smallest necessary thing. That's a full day when you're surviving. No gold stars, no guilt — just the next small thing.",
  },
  {
    id: "sad",
    patterns: [/\bsad\b/, /\bdepressed\b/, /\bdown bad\b/, /\bi feel down\b/, /\blonely\b/, /\bfeel alone\b/, /\bwant to cry\b/, /\bgrief\b/, /\bgrieving\b/, /\bheartbroken\b/],
    reply: () =>
      "I'm here. I don't have a fix for this, and I won't pretend I do. Say as much or as little as you want — keep talking, or I can leave you alone with it. Your call.",
  },
  {
    id: "tired",
    patterns: [/\btired\b/, /\bexhausted\b/, /\bno energy\b/, /\bdrained\b/, /\bburnout\b/, /\bburned out\b/, /\bburnt out\b/, /\bso tired\b/, /\brunning on empty\b/],
    reply: (c) =>
      `Tired is information, not failure.${burnoutLine(c)} Rest is a move, not a reward you earn after collapsing. What can come off today's plate — one thing, for real?`,
  },
  {
    id: "focus",
    patterns: [/\bfocus\b/, /\bdistracted\b/, /\bcan't concentrate\b/, /\bcant concentrate\b/, /\bscattered\b/, /\bmy brain\b/, /\btoo many tabs\b/],
    reply: (c) => {
      const p = c.todayEntry?.priorities?.filter(Boolean) || [];
      const lead = p.length ? ` The lead task is "${p[0]}".` : "";
      return `Scattered is a narrowing problem. One lead task, ten minutes. Phone in another room. If your brain wanders, let it — then come back to the one thing.${lead} What's the lead task?`;
    },
  },
  {
    id: "bored",
    patterns: [/\bbored\b/, /\bboring\b/, /\bboredom\b/, /\bnothing to do\b/, /\bnothing going on\b/],
    reply: (_c, seed) =>
      `Boredom=Death — you know the slogan. Boredom is the signal, not the sentence. Break the script with one small thing: ${dareFor(seed)}`,
  },
  {
    id: "motivation",
    patterns: [/\bmotivat/, /\binspire me\b/, /\bgive up\b/, /\bquitting\b/, /\bi quit\b/, /\bno point\b/, /\bwhat's the point\b/, /\bwhy bother\b/],
    reply: (c, seed) => {
      const w = c.wordOfYear ? ` Your word is ${c.wordOfYear}. What would ${c.wordOfYear} do right now?` : "";
      return `Motivation is a myth that sells planners. You don't need to feel like it — you need a first move. ${dareFor(seed)} Do it badly. Done beats inspired.${w}`;
    },
  },
  {
    id: "greeting",
    patterns: [/\bgood (morning|afternoon|evening)\b/, /^(hi|hey|hello|hiya|yo)\b/, /\bhey there\b/, /\bhello there\b/],
    reply: (c) => {
      const n = nameOf(c);
      const hour = chicagoNow().getHours();
      const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      return pick(
        [
          `Hey${n ? ` ${n}` : ""}. What's actually on your mind?`,
          `Good ${part}. One thing at a time — what's first?`,
          `Hey. I'm here. What do you need — a plan, a push, or just to talk it out?`,
        ],
        `greet:${part}:${n}`,
      );
    },
  },
  {
    id: "howAreYou",
    patterns: [/\bhow are you\b/, /\bhow's it going\b/, /\bhows it going\b/, /\bhow are u\b/, /\bhow you doing\b/],
    reply: (c) =>
      `Running steady. No feelings to report, no bad days — I just work. More useful question: how are YOU doing?${moodLine(c)}`,
  },
  {
    id: "thanks",
    patterns: [/\bthank you\b/, /\bthanks\b/, /\bthx\b/, /\bappreciate you\b/],
    reply: (_c, seed) =>
      pick(["Anytime. Go do the thing.", "You're welcome. Now go be off-script.", "Of course. One thing at a time."], `thanks:${seed}`),
  },
  {
    id: "goodbye",
    patterns: [/\bgood ?night\b/, /\bgoodbye\b/, /\bbye\b/, /\bsee you\b/, /\bsee ya\b/, /\btalk later\b/, /\bgtg\b/],
    reply: (_c, seed) =>
      pick(
        ["Later. The planner will be here when you are.", "Go rest. Tomorrow's page is blank until you write it.", "Okay. One thing at a time, whenever you're back."],
        `bye:${seed}`,
      ),
  },
  {
    id: "appHelp",
    patterns: [/\bhow does this app work\b/, /\bhow do i use\b/, /\bwhat can you do\b/, /\bwhat can i ask\b/, /\bhelp me\b/, /\bwhat is life os\b/, /\bwhat is off ?script\b/, /\bhow do i\b/],
    reply: () =>
      "Here's what I can do: help you plan the day, give you a dare, check your audit, talk through what's stuck. Ask me about today, your mission, your priorities — or just tell me what's on your mind. I run entirely inside the app — nothing you say leaves this server.",
  },
  {
    id: "planner",
    patterns: [/\bplanner\b/, /\bmy book\b/, /\bthe book\b/, /\bjanuary\b/, /\bfebruary\b/, /\bmarch\b/, /\bedition\b/, /\bbuy\b/, /\bshop\b/, /\bprice\b/, /\bhow much\b/],
    reply: () =>
      "The 2027 books live in the shop — January and February are out now, March is on its way. Digital is $15, print is $23. The planner's the same deal as always: do-first, restart > perfect, Boredom=Death. Want me to point you at a specific month?",
  },
  {
    id: "shortAck",
    patterns: [/^(ok|okay|yeah|yes|yep|no|nope|lol|haha|hmm|k|cool|nice|alright|right|got it|i see)\.?$/],
    reply: (_c, seed) =>
      pick(["Mm-hm.", "Got it. What's next?", "Alright. One thing at a time.", "Okay — say more when you're ready."], `ack:${seed}`),
  },
];

// ---------- fallback ----------

const FALLBACK_NEGATIVE: readonly string[] = [
  "That's a lot in one breath. Say a little more — what's the heaviest part?",
  "Okay. I'm listening. What's the one thing underneath all of that?",
  "That sounds heavy. Keep going — the real version, not the short version.",
];

const FALLBACK_POSITIVE: readonly string[] = [
  "Good. What's making today work?",
  "Nice — hold onto that. What's next on the page?",
  "Love to hear it. What are you doing with that energy?",
];

const FALLBACK_NEUTRAL: readonly string[] = [
  "Say more — I work best with the real version, not the short version. What's actually going on?",
  "Got it. What do you want from me on this — a plan, a push, or just to talk it out?",
  "Hmm. Give me one more sentence — the honest one.",
];

// ---------- main entry ----------

/**
 * Answer one user message with the local engine. Pure function of the
 * message + the user's planner context; no network, no stored chat
 * history, no side effects. Returns the reply and the intent that won.
 */
export function answerLocalMei(text: string, ctx: LocalMeiContext = {}): LocalMeiReply {
  const raw = (text || "").trim();
  const norm = normalize(raw);
  if (!norm) return { reply: "Say something first — even just one honest sentence.", intent: "empty" };

  // Score each intent by the number of words its patterns actually match:
  // a 5-word phrase ("how does this app work") beats a 1-word hit ("work"),
  // so specific questions win over generic topic words. Ties go to the
  // more specific intent (listed first).
  let best: IntentDef | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const p of intent.patterns) {
      const m = norm.match(p);
      if (m) score += Math.max(1, m[0].trim().split(/\s+/).length);
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  if (best) {
    try {
      return { reply: best.reply(ctx, norm), intent: best.id };
    } catch {
      // A reply builder must never take the route down with it.
    }
  }

  const s = sentiment(norm);
  const pool = s === "negative" ? FALLBACK_NEGATIVE : s === "positive" ? FALLBACK_POSITIVE : FALLBACK_NEUTRAL;
  return { reply: pick(pool, norm), intent: "fallback" };
}
