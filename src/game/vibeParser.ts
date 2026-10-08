import type { VibeKind } from './regions';

const RULES: Array<{ kind: Exclude<VibeKind, 'plain'>; terms: string[] }> = [
  { kind: 'carnival', terms: ['carnival', 'mardi gras', 'king cake', 'parade', 'krewe'] },
  { kind: 'festival', terms: ['festival', 'fair', 'street fest', 'art walk', 'market'] },
  { kind: 'opera', terms: ['opera', 'symphony', 'ballet', 'theater', 'theatre', 'concert hall'] },
  { kind: 'baseball', terms: ['baseball', 'ballgame', 'dugout', 'innings'] },
  { kind: 'football', terms: ['football', 'touchdown', 'blitz', 'stadium'] },
  { kind: 'hockey', terms: ['hockey', 'rink', 'penalty box', 'hat trick'] },
];

export function parseVibe(input: string): VibeKind {
  const normalized = input.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ');
  return RULES.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.kind ?? 'plain';
}

export function vibeLabel(vibe: VibeKind): string {
  const labels: Record<VibeKind, string> = {
    carnival: 'Carnival trouble',
    festival: 'Festival wandering',
    opera: 'Fancy feelings',
    baseball: 'Extra innings',
    football: 'Blitz energy',
    hockey: 'Rink-side khaos',
    plain: 'Unscheduled nonsense',
  };
  return labels[vibe];
}
