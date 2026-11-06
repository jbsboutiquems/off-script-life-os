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
  { id: 'fixture-alpha', codename: 'FIXTURE-ALPHA', color: '#2da2ee', bearingDeg: 40, rangeBand: 1, quietMinutes: 1 },
  { id: 'fixture-bravo', codename: 'FIXTURE-BRAVO', color: '#c26bff', bearingDeg: 150, rangeBand: 0, quietMinutes: 2 },
  { id: 'fixture-charlie', codename: 'FIXTURE-CHARLIE', color: '#f5c46a', bearingDeg: 225, rangeBand: 2, quietMinutes: 7 },
  { id: 'fixture-delta', codename: 'FIXTURE-DELTA', color: '#ff725e', bearingDeg: 320, rangeBand: 1, quietMinutes: 0 },
];
