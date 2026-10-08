import { userGet, userSet } from './storage';

/** One AI buddy per user. The buddy is the visual face of Mei. */
export interface BuddyProfile {
  /** Creature id from BUDDY_CREATURES, e.g. 'alien'. 'custom' = device upload. */
  creatureId: string;
  /** User-chosen display name. */
  name: string;
  /** Recolor choice: hex color used for the buddy's glow ring + tint. */
  color: string;
  /** Device-upload portrait as a dataURL. Only set when creatureId === 'custom'. */
  customImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuddyCreature {
  id: string;
  /** Friendly default name shown in the picker. */
  defaultName: string;
  /** Short flavor line for the picker card. */
  blurb: string;
  /** File in /buddies (served from public/). */
  file: string;
}

export const BUDDY_CREATURES: BuddyCreature[] = [
  { id: 'alien', defaultName: 'Zib', blurb: 'Not from around here. Obviously.', file: 'buddy-alien.webp' },
  { id: 'narwhal', defaultName: 'Nori', blurb: 'Unicorn of the sea, sass of the land.', file: 'buddy-narwhal.webp' },
  { id: 'unicorn', defaultName: 'Lulu', blurb: 'Sparkles with plausible deniability.', file: 'buddy-unicorn.webp' },
  { id: 'dolphin', defaultName: 'Finn', blurb: 'Clicks, whistles, knows things.', file: 'buddy-dolphin.webp' },
  { id: 'cat', defaultName: 'Miso', blurb: 'Loves you. On its own terms.', file: 'buddy-cat.webp' },
  { id: 'dog', defaultName: 'Biscuit', blurb: 'Loyal to the last crumb.', file: 'buddy-dog.webp' },
  { id: 'goldfish', defaultName: 'Guppy', blurb: 'Three-second memory, infinite vibes.', file: 'buddy-goldfish.webp' },
  { id: 'custom', defaultName: 'Custom', blurb: 'Upload a photo from your device.', file: '' },
];

/**
 * Vaulted starter set — delisted from the picker, files stay on disk.
 * Reserved for a future premium species pack.
 */
export const VAULTED_BUDDY_CREATURES: BuddyCreature[] = [
  { id: 'teal-puff', defaultName: 'Puff', blurb: 'Round, fluffy, suspiciously calm.', file: 'media-generation-buddy-teal-puff-0-f83bc4f8-8594-4735-8496-b83b0c4a0983.webp' },
  { id: 'pink-bat', defaultName: 'Pip', blurb: 'Big ears. Bigger opinions.', file: 'media-generation-buddy-pink-bat-0-4ce85434-b4b7-4374-af63-4c35209d49aa.webp' },
  { id: 'purple-starbelly', defaultName: 'Nova', blurb: 'Carries the whole night sky.', file: 'media-generation-buddy-purple-starbelly-0-b33e177c-966f-4a0d-96ff-90481c19e0dd.webp' },
  { id: 'cream-blob', defaultName: 'Mochi', blurb: 'Sleepy. Judging you softly.', file: 'media-generation-buddy-cream-blob-0-6d47464a-397f-4d8b-a0de-8499a94df3bd.webp' },
  { id: 'navy-fox', defaultName: 'Comet', blurb: 'A fox that read your diary.', file: 'media-generation-buddy-navy-fox-0-1a66fe54-c35a-4072-9ac5-c05b4a5c474f.webp' },
  { id: 'lime-imp', defaultName: 'Zig', blurb: 'Trying SO hard to look innocent.', file: 'media-generation-buddy-lime-imp-0-6262a6c0-6866-4295-9503-342ce274c316.webp' },
];

export interface BuddyPalette {
  id: string;
  name: string;
  /** Hex used for ring + tint. */
  color: string;
}

export const BUDDY_PALETTES: BuddyPalette[] = [
  { id: 'teal', name: 'Teal', color: '#2da2ee' },
  { id: 'pink', name: 'Hot Pink', color: '#ea4798' },
  { id: 'purple', name: 'Electric Purple', color: '#c26bff' },
  { id: 'lime', name: 'Acid Lime', color: '#b6ff2e' },
  { id: 'navy', name: 'Deep Navy', color: '#1b3a6b' },
  { id: 'cream', name: 'Cream', color: '#f2ecdc' },
  { id: 'midnight', name: 'Midnight Chaos', color: '#0b1c33' },
  { id: 'daybreak', name: 'Daybreak', color: '#7cc7f2' },
  { id: 'beast', name: 'Beast Mode', color: '#4a7a1e' },
];

const BUDDY_KEY = 'buddy_profile';

export function getBuddy(): BuddyProfile | null {
  return userGet<BuddyProfile>(BUDDY_KEY);
}

export function saveBuddy(buddy: BuddyProfile) {
  userSet(BUDDY_KEY, { ...buddy, updatedAt: new Date().toISOString() });
}

export function creatureFor(buddy: BuddyProfile | null): BuddyCreature | null {
  if (!buddy) return null;
  return BUDDY_CREATURES.find(c => c.id === buddy.creatureId)
    || VAULTED_BUDDY_CREATURES.find(c => c.id === buddy.creatureId)
    || BUDDY_CREATURES[0];
}

/** Public URL for a creature portrait (served from Vite public/). */
export function buddyImageUrl(creature: BuddyCreature): string {
  return `${import.meta.env.BASE_URL}buddies/${creature.file}`;
}

/**
 * Portrait source for a buddy: device-upload dataURL when creatureId is
 * 'custom', otherwise the creature's file URL.
 */
export function buddyPortraitSrc(buddy: BuddyProfile): string {
  if (buddy.creatureId === 'custom') return buddy.customImage || '';
  const creature = creatureFor(buddy);
  return creature && creature.file ? buddyImageUrl(creature) : '';
}
