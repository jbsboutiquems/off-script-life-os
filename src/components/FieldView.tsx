import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, Clock, Loader2, AlertTriangle, Users, Eye, EyeOff } from 'lucide-react';
import { findCandidateRegions, describeDistance, type RegionMatch } from '../game/geoRadius';
import { getFamiliar, type RegionId } from '../game/regions';
import { apiUrl } from '../services/api';

interface FieldCheckIn {
  regionId: RegionId;
  at: number;
}

interface NearbyPlayer {
  username: string;
  regionId: string;
  seenAt: number;
}

const LOG_KEY = 'field_log_v1';
const VISIBLE_KEY = 'field_visible_v1';
const TOKEN_KEY = 'lifeos:auth:token';

/** Best-effort authed fetch — returns null when logged out, offline, or on error. */
async function fieldApi(path: string, options: RequestInit = {}): Promise<any | null> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(apiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function loadLog(): FieldCheckIn[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(c => c && typeof c.regionId === 'string' && typeof c.at === 'number') : [];
  } catch {
    return [];
  }
}

function relativeTime(at: number): string {
  const min = Math.floor((Date.now() - at) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

type Status = 'idle' | 'locating' | 'error';

/**
 * FIELD — the location game tab. Finds your Familiar zone from the
 * device GPS (coordinates are quantized and discarded; only the claimed
 * region is kept), lets you choose when zones overlap, and logs check-ins.
 */
export const FieldView: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RegionMatch[] | null>(null);
  const [selectedId, setSelectedId] = useState<RegionId | null>(null);
  const [log, setLog] = useState<FieldCheckIn[]>(loadLog);
  const [checkedIn, setCheckedIn] = useState(false);
  const [visible, setVisible] = useState<boolean>(() => {
    try { return localStorage.getItem(VISIBLE_KEY) === '1'; } catch { return false; }
  });
  const [nearby, setNearby] = useState<NearbyPlayer[] | null>(null);
  const [inGame, setInGame] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(VISIBLE_KEY, visible ? '1' : '0'); } catch { /* ignore */ }
    if (!visible) {
      // Going invisible — clear server presence.
      fieldApi('/api/field/presence', { method: 'DELETE' });
      setNearby(null);
    }
  }, [visible]);

  // Active game gate: nearby players stay hidden while in a game.
  useEffect(() => {
    fieldApi('/api/field/game/active').then((d) => { if (d) setInGame(!!d.active); });
  }, []);

  // Heartbeat: announce region presence while visible.
  useEffect(() => {
    if (visible && selectedId) {
      fieldApi('/api/field/presence', {
        method: 'POST',
        body: JSON.stringify({ regionId: selectedId, visible: true }),
      });
    }
  }, [visible, selectedId]);

  // Nearby players: only when not in an active game.
  useEffect(() => {
    if (inGame || !selectedId) { setNearby(null); return; }
    let cancelled = false;
    fieldApi(`/api/field/nearby?regionId=${encodeURIComponent(selectedId)}`).then((d) => {
      if (!cancelled && d) setNearby(Array.isArray(d.nearby) ? d.nearby : []);
    });
    return () => { cancelled = true; };
  }, [inGame, selectedId]);

  useEffect(() => {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch { /* ignore */ }
  }, [log]);

  const locate = () => {
    setError(null);
    setCheckedIn(false);
    if (!('geolocation' in navigator)) {
      setError('This device does not share its location.');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const matches = findCandidateRegions(
          { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          (pos.coords.accuracy || 0) / 1000,
        );
        setCandidates(matches);
        setSelectedId(matches.length === 1 ? matches[0].region.id : null);
        setStatus('idle');
        // Raw coordinates are discarded here — only region matches are kept.
      },
      (err) => {
        setStatus('idle');
        setError(err.code === err.PERMISSION_DENIED
          ? 'Location permission was denied. The Field needs it to find your Familiar.'
          : 'Could not get your location. Try again.');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };

  const selected = candidates?.find(c => c.region.id === selectedId) ?? null;

  const checkIn = () => {
    if (!selectedId) return;
    setLog(prev => [{ regionId: selectedId, at: Date.now() }, ...prev].slice(0, 100));
    setCheckedIn(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight">The Field</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
          Your Familiar zones are anchored to real places. Go outside, find yours, claim the khaos.
        </p>
        <button
          onClick={locate}
          disabled={status === 'locating'}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white bg-gradient-to-r from-[#2da2ee] to-[#ea4798] hover:brightness-110 disabled:opacity-60 transition shadow-lg"
        >
          {status === 'locating' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
          {status === 'locating' ? 'Triangulating…' : 'Find my Familiar'}
        </button>
        {error && (
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}
        <button
          onClick={() => setVisible((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border-2 border-stone-300 dark:border-white/15 hover:scale-[1.02] transition"
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {visible ? 'Visible on the Field' : 'Show me on the Field'}
        </button>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          {visible
            ? 'Other players in your zone can see your username. Region only — never your exact location. Presence fades after 15 minutes.'
            : 'Turn this on and nearby players can see you when you check in.'}
        </p>
      </div>

      {candidates && candidates.length === 0 && (
        <div className="max-w-md mx-auto text-center p-6 rounded-2xl border-2 border-dashed border-stone-300 dark:border-white/15">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          <p className="font-bold">No Familiar zone in range.</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            The known zones are in Mississippi — for now. More territory is coming.
          </p>
        </div>
      )}

      {candidates && candidates.length > 1 && !selected && (
        <div className="max-w-2xl mx-auto space-y-3">
          <p className="text-center font-black text-lg">You're in range of {candidates.length} zones. Which khaos are you claiming today?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {candidates.map(({ region, distanceKm }) => (
              <button
                key={region.id}
                onClick={() => setSelectedId(region.id)}
                className="text-left p-4 rounded-2xl border-2 transition hover:scale-[1.02]"
                style={{ borderColor: region.colors.accent, background: region.colors.surface }}
              >
                <p className="font-black text-lg" style={{ color: region.colors.accent }}>{region.creature}</p>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70" style={{ color: region.colors.secondary }}>{region.epithet}</p>
                <p className="text-sm mt-1 opacity-80" style={{ color: region.colors.accent }}>{region.city} · {describeDistance(distanceKm)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div
          className="max-w-2xl mx-auto rounded-3xl border-2 p-6 sm:p-8 text-center space-y-3"
          style={{ borderColor: selected.region.colors.accent, background: selected.region.colors.surface }}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: selected.region.colors.secondary }}>
            {selected.region.city}, {selected.region.state} · {describeDistance(selected.distanceKm)}
          </p>
          <h3 className="text-3xl font-black" style={{ color: selected.region.colors.accent }}>{selected.region.creature}</h3>
          <p className="font-bold" style={{ color: selected.region.colors.secondary }}>{selected.region.epithet}</p>
          <p className="italic" style={{ color: selected.region.colors.accent }}>“{selected.region.greeting}”</p>
          <p className="font-bold" style={{ color: selected.region.colors.secondary }}>{selected.region.prompt}</p>
          {candidates && candidates.length > 1 && (
            <button onClick={() => setSelectedId(null)} className="text-xs font-bold underline opacity-70" style={{ color: selected.region.colors.secondary }}>
              Choose a different zone
            </button>
          )}
          <div>
            <button
              onClick={checkIn}
              disabled={checkedIn}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[#0c1206] bg-[#b6ff2e] hover:brightness-110 disabled:opacity-60 transition"
            >
              <Check className="w-5 h-5" /> {checkedIn ? 'Claimed!' : 'Check in'}
            </button>
          </div>
        </div>
      )}

      {!inGame && nearby && nearby.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <h3 className="font-black uppercase tracking-wider text-sm mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Players nearby
          </h3>
          <div className="space-y-2">
            {nearby.map((p) => (
              <div key={p.username} className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-white/5">
                <span className="font-bold">{p.username}</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">{relativeTime(p.seenAt)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
            Same zone, right now. Say hi — or don't. Khaos is neutral.
          </p>
        </div>
      )}

      {log.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <h3 className="font-black uppercase tracking-wider text-sm mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Field log
          </h3>
          <div className="space-y-2">
            {log.slice(0, 10).map((entry, i) => {
              const familiar = getFamiliar(entry.regionId);
              return (
                <div key={`${entry.at}-${i}`} className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-white/5">
                  <span className="font-bold">{familiar.creature} <span className="font-normal opacity-60">· {familiar.city}</span></span>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60">{relativeTime(entry.at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
