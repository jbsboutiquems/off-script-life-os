export interface ChaosMonthTheme {
  month: number;
  name: string;
  themeTitle: string;
  keyword: string;
  tagline: string;
  description: string;
  monthlyQuestion: string;
  accentColor: string; // Tailwind color class or hex
  badgeBg: string;
  badgeText: string;
}

export const CHAOS_THEMES: ChaosMonthTheme[] = [
  {
    month: 1,
    name: "January",
    themeTitle: "The Chaos of Beginning",
    keyword: "UNRAVEL",
    tagline: "The blank page, the first breath, the decision to start before you're ready.",
    description: "January doesn't ask you to have it all figured out. It asks you to show up anyway — imperfectly, uncertainly, honestly. The chaos of beginning is not a problem to solve. It is the invitation.",
    monthlyQuestion: "What are you finally willing to start?",
    accentColor: "#2da2ee", // Sky
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800"
  },
  {
    month: 2,
    name: "February",
    themeTitle: "The Chaos of Longing / Intimacy",
    keyword: "FERAL",
    tagline: "What you want but haven't said out loud. What you miss. What you ache for.",
    description: "Showing up for yourself is not dramatic. It is the quietest revolution. This month isn't about love as a performance — it's about intimacy as a practice with yourself.",
    monthlyQuestion: "Who are you when no one needs anything from you?",
    accentColor: "#ea4798", // Rose
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800"
  },
  {
    month: 3,
    name: "March",
    themeTitle: "The Chaos of Becoming / Discipline",
    keyword: "DISRUPT",
    tagline: "The uncomfortable in-between. You're not who you were, not yet who you're going to be.",
    description: "Growth is not a feeling. It is a decision made quietly, over and over again. Discipline is not a cage; it is the host to your highest momentum.",
    monthlyQuestion: "What are you finally ready to be disciplined about?",
    accentColor: "#2da2ee", // Emerald
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800"
  },
  {
    month: 4,
    name: "April",
    themeTitle: "The Chaos of Desire / Audacity",
    keyword: "WILD",
    tagline: "What pulls you forward. Ambition, hunger, want — examined without shame.",
    description: "Change doesn't ask for your comfort. It asks for your willingness. April arrives like an argument you didn't start but have to finish with audacity.",
    monthlyQuestion: "What needs to change that you've been calling 'just how things are'?",
    accentColor: "#f59e0b", // Amber
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800"
  },
  {
    month: 5,
    name: "May",
    themeTitle: "The Chaos of Light / The Weight of Becoming",
    keyword: "MESSY",
    tagline: "Joy, ease, softness — and learning to let yourself have them.",
    description: "May asks you to hold two truths at once — who you were and who you're turning into. That weight is not a sign something is wrong; it's proof you're actively doing the work.",
    monthlyQuestion: "What are you becoming that you haven't named yet?",
    accentColor: "#ea4798", // Purple
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800"
  },
  {
    month: 6,
    name: "June",
    themeTitle: "The Chaos of Expansion / Friction of Staying",
    keyword: "FRICTION",
    tagline: "Where are you growing beyond your own edges? What are you becoming too small for?",
    description: "Staying is not the same as settling. One is a choice. The other is a surrender. June is the month that tests your commitments in the messy middle.",
    monthlyQuestion: "Where in your life is staying the harder, braver choice right now?",
    accentColor: "#2da2ee", // Green
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-800"
  },
  {
    month: 7,
    name: "July",
    themeTitle: "The Chaos of Fire / The Loudness of Summer",
    keyword: "LOUD",
    tagline: "Passion, anger, urgency — the emotions you've been told to turn down.",
    description: "Summer doesn't whisper. It arrives, turns everything up, and dares you to match its volume. Stop shrinking to keep the room comfortable.",
    monthlyQuestion: "What noise in your life is yours — and what have you been carrying for someone else?",
    accentColor: "#ea580c", // Orange
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800"
  },
  {
    month: 8,
    name: "August",
    themeTitle: "The Chaos of Truth / The Quiet Before the Shift",
    keyword: "UNHINGED",
    tagline: "What you actually think. What you actually feel. No performance required.",
    description: "August sits in a doorway. Summer is winding down, but the shift hasn't landed yet. The quiet before the shift is not empty. It is full of intelligence.",
    monthlyQuestion: "What needs to be finished, released, or decided before the season changes?",
    accentColor: "#2da2ee", // Indigo
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-800"
  },
  {
    month: 9,
    name: "September",
    themeTitle: "The Chaos of Transition / Return to Structure",
    keyword: "REBOOT",
    tagline: "Every ending is a beginning in disguise. What are you moving through?",
    description: "Structure is not a cage. It is the container that makes the chaos navigable. September is about building systems that honor who you actually are.",
    monthlyQuestion: "What structure have you been resisting that might actually set you free?",
    accentColor: "#2da2ee", // Light blue
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800"
  },
  {
    month: 10,
    name: "October",
    themeTitle: "The Chaos of Shadow / The Courage of Honesty",
    keyword: "RAW",
    tagline: "The parts of yourself you haven't made peace with. The ones that show up anyway.",
    description: "October strips things back. There is nowhere left to hide. Honesty is not cruelty; it is the highest form of respect for your one wild life.",
    monthlyQuestion: "What have you been dishonest about — with yourself most of all?",
    accentColor: "#ea4798", // Crimson
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-900"
  },
  {
    month: 11,
    name: "November",
    themeTitle: "The Chaos of Stillness / The Practice of Enough",
    keyword: "UNFILTERED",
    tagline: "Quiet isn't empty. What do you hear when the noise is gone?",
    description: "Enough is not a compromise. It is a destination most people never reach because they never decide where it is. Not performing thankfulness — practicing presence.",
    monthlyQuestion: "What would your life feel like if you stopped measuring it against someone else's?",
    accentColor: "#d97706", // Gold
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900"
  },
  {
    month: 12,
    name: "December",
    themeTitle: "The Chaos of Return / The Art of Ending Well",
    keyword: "RECKLESS",
    tagline: "Coming back to yourself at year's end. Wiser, stranger, more you than ever.",
    description: "Ending well is not the same as ending happily. It is ending honestly — with your eyes open and your hands empty of what no longer belongs to you. You did the year.",
    monthlyQuestion: "What does this year deserve from you in its final days?",
    accentColor: "#09090b", // Deep Black/Slate
    badgeBg: "bg-slate-200",
    badgeText: "text-slate-900"
  }
];
