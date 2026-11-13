/**
 * STAGING ONLY — Field nearby-players fixtures.
 *
 * The nearby-players layer (src/components/NearbyPlayersLayer.tsx) is a
 * staged tap-through build. It renders ONLY when the build sets
 * VITE_FIELD_NEARBY_FIXTURES=1. In every normal build the flag is unset,
 * this is false, and the Field behaves exactly as it always has.
 *
 * There are no real nearby players in the staged build: presence is
 * simulated locally by the fixtures below so the visibility rules
 * (opt-in gate, coarse dots only, quiet during games, ghost) can be
 * exercised end to end on a phone. Real player-to-player presence
 * needs a backend step that ships only after the visibility rules
 * are locked — nothing here talks to the server.
 */
export const FIELD_NEARBY_FIXTURES_ENABLED =
  import.meta.env.VITE_FIELD_NEARBY_FIXTURES === '1';

/**
 * FIELD HIDDEN 2026-11-13 per Amber ("hide all familiars for now").
 * Set to true to restore the Field tab. Reversible: no Field code or
 * familiar data was deleted — this flag gates every entry point
 * (the folder tab in FolderTabs.tsx and the mount in App.tsx).
 */
export const FIELD_ENABLED = false;

/**
 * SNOOPSTER — the ONE familiar cleared to be live, 2026-11-13 per Amber
 * ("add snoopster as familiar globally"). Amber is his permission holder
 * (her own dog), so he is EXEMPT from the Field hide above: the Field
 * tab returns for Snoopster alone, and he appears in the world.
 * He is NOT zone-tied — he shows up regardless of GPS zone, home base
 * Kosciusko. Presence ONLY: no sniffing, no cloaking, no Beast Mode
 * stage tiers — those are unapproved (staged file 2026-11-05).
 * The epithet / greeting / prompt below are DRAFT copy from that staged
 * file, never approved — used as-is per the brief; Amber can correct it.
 * The other five Mississippi familiars stay hidden until permissions
 * are given (FIELD_ENABLED=false still gates them).
 */
export const SNOOPSTER_ENABLED = true;

export const SNOOPSTER = {
  name: 'Snoopster',
  epithet: 'The One Who Notices First',
  greeting: "I already found it. You're welcome.",
  prompt: 'Sniff out the thing you almost walked past.',
  city: 'Kosciusko, Mississippi',
  homeBase: 'Kosciusko, Mississippi',
  photo: '/snoopster.jpg',
  colors: { white: '#F5F5F0', black: '#1A1A1A', sage: '#7A9A8A' },
};

export interface NearbyFixture {
  /** Internal id — never rendered. */
  id: string;
  /** Internal codename — obviously fake, never rendered. */
  codename: string;
  /** Dot color. */
  color: string;
  /** Direction from the user, degrees (0 = up/north on the panel). */
  bearingDeg: number;
  /** Coarse distance band: 0 = close, 1 = mid-zone, 2 = edge of zone. */
  rangeBand: 0 | 1 | 2;
  /** Minutes since this fixture last "checked in" — >5 renders faded (stale). */
  quietMinutes: number;
}

/**
 * Four simulated players at coarse offsets around the user's zone.
 * Obviously fake; positions are bearings + bands, never coordinates.
 */
export const NEARBY_FIXTURES: NearbyFixture[] = [
  { id: 'fixture-alpha', codename: 'FIXTURE-ALPHA', color: '#60d0f8', bearingDeg: 40, rangeBand: 1, quietMinutes: 1 },
  { id: 'fixture-bravo', codename: 'FIXTURE-BRAVO', color: '#c26bff', bearingDeg: 150, rangeBand: 0, quietMinutes: 2 },
  { id: 'fixture-charlie', codename: 'FIXTURE-CHARLIE', color: '#f5c46a', bearingDeg: 225, rangeBand: 2, quietMinutes: 7 },
  { id: 'fixture-delta', codename: 'FIXTURE-DELTA', color: '#ff725e', bearingDeg: 320, rangeBand: 1, quietMinutes: 0 },
];
