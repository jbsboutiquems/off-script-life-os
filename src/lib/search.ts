/** Global chaos search. Pure — ranked, no DOM. */

export interface SearchDoc {
  /** machine key, e.g. 'entry' | 'goal' | 'antigoal' | 'debrief' | 'money' | 'crew' | 'holiday' */
  kind: string;
  kindLabel: string;
  title: string;
  body: string;
  /** dashboard door id to jump to */
  door: string;
  /** unique id for rendering keys */
  id: string;
  /** optional jump target, e.g. an entry date */
  target?: string;
}

export interface SearchResult extends SearchDoc {
  score: number;
  snippet: string;
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function countOccurrences(hay: string, needle: string): number {
  let n = 0;
  let i = hay.indexOf(needle);
  while (i !== -1) {
    n += 1;
    i = hay.indexOf(needle, i + needle.length);
  }
  return n;
}

function hasWordBoundary(hay: string, needle: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(hay);
}

function makeSnippet(title: string, body: string, terms: string[]): string {
  const lower = body.toLowerCase();
  let best = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (best === -1 || i < best)) best = i;
  }
  if (best === -1) return title.length > 140 ? title.slice(0, 140) + '…' : title;
  const start = Math.max(0, best - 60);
  const end = Math.min(body.length, best + 90);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < body.length ? '…' : '';
  return prefix + body.slice(start, end).replace(/\s+/g, ' ').trim() + suffix;
}

/**
 * Ranked AND search: every term must appear in title or body.
 * Title hits outrank body hits; word-boundary hits outrank substring hits.
 */
export function searchDocs(docs: SearchDoc[], query: string, limit = 50): SearchResult[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const out: SearchResult[] = [];
  for (const doc of docs) {
    const title = doc.title.toLowerCase();
    const body = doc.body.toLowerCase();
    let score = 0;
    let matchedAll = true;
    for (const t of terms) {
      let termScore = 0;
      if (title.includes(t)) termScore += hasWordBoundary(title, t) ? 8 : 5;
      const occ = countOccurrences(body, t);
      if (occ > 0) termScore += Math.min(occ, 4);
      if (termScore === 0) {
        matchedAll = false;
        break;
      }
      score += termScore;
    }
    if (!matchedAll) continue;
    // Slight boost for shorter, punchier docs — a title match on a goal
    // should beat a passing mention inside a long entry.
    score += Math.max(0, 3 - doc.body.length / 800);
    out.push({ ...doc, score, snippet: makeSnippet(doc.title, doc.body, terms) });
  }
  out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return out.slice(0, limit);
}
