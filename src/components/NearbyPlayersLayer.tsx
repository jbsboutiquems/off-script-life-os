import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Ghost, Users, Gamepad2 } from 'lucide-react';
import { NEARBY_FIXTURES, type NearbyFixture } from '../lib/fieldStaging';
import type { RegionProfile } from '../game/regions';
import { apiUrl } from '../services/api';

/**
 * NEARBY PLAYERS — the Field's public layer, staged build.
 *
 * Mounted by FieldView ONLY when the staging fixtures flag is on
 * (see src/lib/fieldStaging.ts). In this build presence is simulated
 * locally by fixtures; nothing is sent to or stored on any server.
 *
 * The locked rules, as implemented here:
 *  1. OPT-IN GATE — default OFF. Nobody appears and you see nobody
 *     until the user explicitly turns nearby players on. Off = no
 *     dots, no panel, nothing. Ghost is one tap, no dialog, instant.
 *  2. COARSE DOTS ONLY — players are colored dots at snapped, coarse
 *     positions inside the zone. No names, no roster, no list, no
 *     counts, no exact positions anywhere in this component.
 *  3. QUIET DURING ACTIVE GAMES — while the user is in an active
 *     game (server-reported game state, or the staging simulation),
 *     the layer shows no dots at all. It returns when the game ends.
 *  4. LOCATION MINIMAL — this component never reads GPS and never
 *     transmits anything. Positions are bearings + bands, rendered
 *     locally; nothing is recorded.
 */

type NearbyState = 'off' | 'on' | 'ghosted';
const STATE_KEY = 'field_nearby_state_v1';
const TOKEN_KEY = 'lifeos:auth:token';

function loadState(): NearbyState {
  try {
    const v = localStorage.getItem(STATE_KEY);
    return v === 'on' || v === 'ghosted' ? v : 'off';
  } catch {
    return 'off';
  }
}

/** Snap a 0..1 panel coordinate to a coarse grid — a dot is an area, never a point. */
function snapCoarse(v: number): number {
  const snapped = Math.round(v * 8) / 8;
  return Math.min(0.92, Math.max(0.08, snapped));
}

function dotPosition(f: NearbyFixture): { left: string; top: string } {
  const radius = [0.30, 0.58, 0.85][f.rangeBand] * 0.5;
  const rad = (f.bearingDeg * Math.PI) / 180;
  const x = snapCoarse(0.5 + radius * Math.sin(rad));
  const y = snapCoarse(0.5 - radius * Math.cos(rad));
  return { left: `${x * 100}%`, top: `${y * 100}%` };
}

async function fetchServerInGame(): Promise<boolean> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    const res = await fetch(apiUrl('/api/field/game/active'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const d = await res.json();
    return !!d?.active;
  } catch {
    return false;
  }
}

interface Props {
  region: RegionProfile | null;
}

export const NearbyPlayersLayer: React.FC<Props> = ({ region }) => {
  const [state, setState] = useState<NearbyState>(loadState);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const [serverInGame, setServerInGame] = useState(false);
  const [simInGame, setSimInGame] = useState(false);
  const inGame = serverInGame || simInGame;

  useEffect(() => {
    try { localStorage.setItem(STATE_KEY, state); } catch { /* ignore */ }
    if (state !== 'ghosted') setConfirmingReturn(false);
  }, [state]);

  // Watch the app's real game state while the layer is switched on.
  useEffect(() => {
    if (state === 'off') return;
    let cancelled = false;
    const check = () => { fetchServerInGame().then((v) => { if (!cancelled) setServerInGame(v); }); };
    check();
    const id = setInterval(check, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [state]);

  const zoneLabel = region ? `${region.creature} · ${region.city}` : 'Your Familiar zone';

  const stagingBar = (
    <div className="max-w-2xl mx-auto mt-3 px-4 py-3 rounded-2xl border-2 border-dashed border-amber-500/60 bg-amber-500/10 text-center space-y-2">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
        Staging controls — not in the real app
      </p>
      <button
        onClick={() => setSimInGame((g) => !g)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-amber-500 text-black hover:brightness-110 transition"
      >
        <Gamepad2 className="w-4 h-4" />
        {simInGame ? 'End simulated game' : 'Simulate a game starting'}
      </button>
      <p className="text-xs opacity-70">
        Simulated players are local to this phone. Nothing is sent anywhere.
      </p>
    </div>
  );

  // ---- OFF: the layer does not exist except for its gate. ----
  if (state === 'off') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border-2 border-stone-300 dark:border-white/15 p-6 text-center space-y-3">
          <h3 className="font-black uppercase tracking-wider text-sm flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4" /> Nearby players
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Turn this on to see other players in your zone as colored dots — and to be
            seen the same way. Dots are approximate areas, never exact spots, and only
            while this is on. Ghost any time, instantly. Nothing is saved.
          </p>
          <button
            onClick={() => setState('on')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-white bg-gradient-to-r from-[#2da2ee] to-[#ea4798] hover:brightness-110 transition shadow"
          >
            <Eye className="w-4 h-4" /> Show nearby players
          </button>
        </div>
        {stagingBar}
      </div>
    );
  }

  // ---- IN A GAME: the layer goes completely quiet. ----
  if (inGame) {
    return (
      <div className="max-w-2xl mx-auto">
        {stagingBar}
      </div>
    );
  }

  // ---- GHOSTED: two-way door — can't be seen, can't see. ----
  if (state === 'ghosted') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border-2 border-stone-300 dark:border-white/15 p-6 text-center space-y-3">
          <h3 className="font-black uppercase tracking-wider text-sm flex items-center justify-center gap-1.5">
            <Ghost className="w-4 h-4" /> You're ghosted
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Nobody can see you, and you see nobody. Your dot doesn't exist right now.
          </p>
          {!confirmingReturn ? (
            <button
              onClick={() => setConfirmingReturn(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black border-2 border-stone-300 dark:border-white/20 hover:scale-[1.02] transition"
            >
              <Eye className="w-4 h-4" /> Come back
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold max-w-md mx-auto">
                Come back? You'll share your approximate dot in {zoneLabel} again, and
                see other players' dots, until you ghost or turn this off.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setState('on')}
                  className="px-5 py-2.5 rounded-2xl font-black text-white bg-gradient-to-r from-[#2da2ee] to-[#ea4798] hover:brightness-110 transition shadow"
                >
                  Yes, share my dot
                </button>
                <button
                  onClick={() => setConfirmingReturn(false)}
                  className="px-5 py-2.5 rounded-2xl font-bold border-2 border-stone-300 dark:border-white/20"
                >
                  Stay ghosted
                </button>
              </div>
            </div>
          )}
        </div>
        {stagingBar}
      </div>
    );
  }

  // ---- ON: coarse dots in the zone. ----
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl border-2 border-stone-300 dark:border-white/15 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-black uppercase tracking-wider text-sm flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Nearby players
          </h3>
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">{zoneLabel}</span>
        </div>

        <div className="relative w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10">
          {/* zone bands */}
          <div className="absolute rounded-full border border-dashed border-stone-300 dark:border-white/15" style={{ inset: '7%' }} />
          <div className="absolute rounded-full border border-dashed border-stone-300 dark:border-white/15" style={{ inset: '21%' }} />
          <div className="absolute rounded-full border border-dashed border-stone-300 dark:border-white/15" style={{ inset: '35%' }} />

          {/* nearby players — dots only, no names, no list */}
          {NEARBY_FIXTURES.map((f) => (
            <span
              key={f.id}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full shadow"
              style={{
                ...dotPosition(f),
                backgroundColor: f.color,
                opacity: f.quietMinutes > 5 ? 0.35 : 1,
              }}
            />
          ))}

          {/* you */}
          <span className="absolute left-1/2 top-1/2 w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-gradient-to-br from-[#2da2ee] to-[#ea4798] ring-4 ring-white/70 dark:ring-white/20 shadow-lg" />
        </div>

        <p className="text-xs text-center text-stone-500 dark:text-stone-400 max-w-md mx-auto">
          Dots are areas, not exact spots. Dimmer dots have been quiet a while.
          Live only — nothing here is recorded.
        </p>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setState('ghosted')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white bg-stone-900 dark:bg-white dark:text-stone-900 hover:scale-[1.03] transition shadow-lg"
          >
            <Ghost className="w-5 h-5" /> Ghost
          </button>
          <button
            onClick={() => setState('off')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 border-stone-300 dark:border-white/15"
          >
            <EyeOff className="w-4 h-4" /> Turn off nearby players
          </button>
        </div>
      </div>
      {stagingBar}
    </div>
  );
};
