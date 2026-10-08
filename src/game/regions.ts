/**
 * Familiar regions for the Off*Script location game.
 * Merged from the Testerrepo prototype (2026-10-07). The prototype's UI was
 * not carried over — this is the data + geo foundation for the scavenger
 * hunt / hide-and-seek / krewe-mode work.
 */

export type RegionId = 'biloxi' | 'kosciusko' | 'orange-grove' | 'gulfport' | 'hattiesburg';

export type VibeKind = 'carnival' | 'festival' | 'opera' | 'baseball' | 'football' | 'hockey' | 'plain';

export interface RegionProfile {
  id: RegionId;
  city: string;
  state: string;
  creature: string;
  epithet: string;
  voice: string;
  coordinates: { latitude: number; longitude: number };
  radiusKm: number;
  colors: { accent: string; secondary: string; surface: string };
  greeting: string;
  prompt: string;
}

export interface LocalPass {
  regionId: RegionId;
  issuedAt: number;
  expiresAt: number;
  source: 'signed-ticket' | 'preview';
  signedJson?: string;
}

export interface SignedTicketPass {
  payload: {
    version: 1;
    regionId: RegionId;
    issuedAt: number;
    expiresAt: number;
    nonce: string;
  };
  signature: string;
}

export const FAMILIARS: RegionProfile[] = [
  {
    id: 'biloxi',
    city: 'Biloxi',
    state: 'Mississippi',
    creature: 'Zamboni',
    epithet: 'The Penalty Box Instigator',
    voice: 'rapid-fire rink heckler',
    coordinates: { latitude: 30.396, longitude: -88.8853 },
    radiusKm: 12,
    colors: { accent: '#d4f4ff', secondary: '#7be0ea', surface: '#102127' },
    greeting: 'All right, hotshot. The coast is your rink now.',
    prompt: 'Take the weird route. The obvious one is already crowded.',
  },
  {
    id: 'kosciusko',
    city: 'Kosciusko',
    state: 'Mississippi',
    creature: 'Gyzmeaux',
    epithet: 'Feral Swamp Gremlin King',
    voice: 'mossy carnival oracle',
    coordinates: { latitude: 33.0582, longitude: -89.589 },
    radiusKm: 12,
    colors: { accent: '#b6ff2e', secondary: '#c26bff', surface: '#171a12' },
    greeting: 'The swamp has noticed you. Try not to make it weird. (You will.)',
    prompt: 'Find a little magic in the place you almost drove past.',
  },
  {
    id: 'orange-grove',
    city: 'Orange Grove',
    state: 'Mississippi',
    creature: 'Red Reb',
    epithet: 'The Extra-Innings Instigator',
    voice: 'chaotic dugout announcer',
    coordinates: { latitude: 30.398, longitude: -89.0585 },
    radiusKm: 5,
    colors: { accent: '#ff725e', secondary: '#f5c46a', surface: '#241613' },
    greeting: 'You are up to bat. The bat is metaphorical. Probably.',
    prompt: 'Take one more lap. The good stuff happens after the seventh inning.',
  },
  {
    id: 'gulfport',
    city: 'Gulfport',
    state: 'Mississippi',
    creature: 'The Admiral',
    epithet: 'Commander of the Almost-Sea',
    voice: 'precise naval cartographer',
    coordinates: { latitude: 30.3674, longitude: -89.0928 },
    radiusKm: 5,
    colors: { accent: '#f1f0e8', secondary: '#77c9c5', surface: '#151d21' },
    greeting: 'Coordinates acquired. Drama levels remain under observation.',
    prompt: 'Plot a course toward something that is not on your to-do list.',
  },
  {
    id: 'hattiesburg',
    city: 'Hattiesburg',
    state: 'Mississippi',
    creature: 'Golden Eagle',
    epithet: 'The Blitz Coordinator',
    voice: 'high-intensity sideline caller',
    coordinates: { latitude: 31.3271, longitude: -89.2903 },
    radiusKm: 8,
    colors: { accent: '#ffd35f', secondary: '#c88a44', surface: '#211c12' },
    greeting: 'The play is called: absolutely not another productivity hack.',
    prompt: 'Go all in on a small, delightful detour.',
  },
];

export const FAMILIAR_BY_ID = Object.fromEntries(FAMILIARS.map((familiar) => [familiar.id, familiar])) as Record<RegionId, RegionProfile>;

export function getFamiliar(regionId: RegionId | null | undefined): RegionProfile {
  return FAMILIAR_BY_ID[regionId ?? 'kosciusko'] ?? FAMILIAR_BY_ID.kosciusko;
}
