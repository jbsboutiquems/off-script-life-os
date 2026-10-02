import React, { useState } from 'react';
import { UserProfile } from '../types';
import { SunSign, SUN_SIGNS, sunSignFromBirthday, getDailyHoroscope, forFunPlacements, ROMAN_HOUSES } from '../data/cosmic';
import { Sparkles, Moon, Sunrise, Cake } from 'lucide-react';

interface CosmicCornerViewProps {
  user: UserProfile;
  onEditProfile: () => void;
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void> | void;
}

// ---------- Stylized natal chart wheel (SVG) ----------
// Whole-sign houses, ASC on the left. Sun is placed from the birth date
// (calendar math). Moon + rising are playful guesses — labeled as such.

function ChartWheel({ sun, moon, rising, birthplace }: { sun: SunSign; moon: SunSign; rising: SunSign | null; birthplace?: string }) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const outer = 190;
  const inner = 128;
  const mid = (outer + inner) / 2;

  const startIndex = rising ? SUN_SIGNS.findIndex((s) => s.name === rising.name) : SUN_SIGNS.findIndex((s) => s.name === 'Aries');
  const houseSign = (house: number): SunSign => SUN_SIGNS[(startIndex + house + 12) % 12];

  const polar = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // House 0 starts at ASC (left, 180°) and runs counterclockwise.
  const houseMidDeg = (house: number) => 180 - house * 30 - 15;

  const sunHouse = (SUN_SIGNS.findIndex((s) => s.name === sun.name) - startIndex + 12) % 12;
  const moonHouse = (SUN_SIGNS.findIndex((s) => s.name === moon.name) - startIndex + 12) % 12;
  const moonNudged = moonHouse === sunHouse; // avoid glyph pile-up

  const segments = [];
  for (let h = 0; h < 12; h++) {
    const a0 = 180 - h * 30;
    const a1 = 180 - (h + 1) * 30;
    const p0 = polar(outer, a0);
    const p1 = polar(outer, a1);
    const p2 = polar(inner, a1);
    const p3 = polar(inner, a0);
    const midP = polar(mid, houseMidDeg(h));
    const numP = polar(inner - 16, houseMidDeg(h));
    const lineEnd = polar(outer, a0);
    const lineStart = polar(inner, a0);
    segments.push(
      <g key={h}>
        <path
          d={`M ${p0.x} ${p0.y} A ${outer} ${outer} 0 0 0 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${inner} ${inner} 0 0 1 ${p3.x} ${p3.y} Z`}
          fill={h === 0 ? 'rgba(251,191,36,0.10)' : 'transparent'}
          stroke="#fbbf24"
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} stroke="#fbbf24" strokeOpacity={0.35} strokeWidth={1} />
        <text x={midP.x} y={midP.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fill="#f2ecdc">
          {houseSign(h).glyph}
        </text>
        <text x={numP.x} y={numP.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="#62b9f2" opacity={0.9} fontFamily="monospace">
          {ROMAN_HOUSES[h]}
        </text>
      </g>
    );
  }

  const sunP = polar(mid, houseMidDeg(sunHouse));
  const moonP = polar(mid + (moonNudged ? 34 : 0), houseMidDeg(moonHouse) + (moonNudged ? 8 : 0));
  const ascP = polar(outer, 180);

  return (
    <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#000a15' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[430px] mx-auto" role="img" aria-label="Stylized natal chart wheel">
        <circle cx={cx} cy={cy} r={outer} fill="none" stroke="#fbbf24" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={inner} fill="none" stroke="#fbbf24" strokeOpacity={0.55} strokeWidth={1} />
        {segments}
        {/* Sun — placed from the birth date */}
        <g>
          <circle cx={sunP.x} cy={sunP.y} r={17} fill="#ea4798" opacity={0.9} />
          <text x={sunP.x} y={sunP.y} textAnchor="middle" dominantBaseline="central" fontSize={18} fill="#000a15" fontWeight="bold">☉</text>
        </g>
        {/* Moon — for fun */}
        <g>
          <circle cx={moonP.x} cy={moonP.y} r={15} fill="none" stroke="#62b9f2" strokeWidth={2} strokeDasharray="4 3" />
          <text x={moonP.x} y={moonP.y} textAnchor="middle" dominantBaseline="central" fontSize={16} fill="#62b9f2" fontWeight="bold">☽</text>
        </g>
        {/* ASC marker */}
        <g>
          <line x1={ascP.x - 14} y1={ascP.y} x2={ascP.x + 14} y2={ascP.y} stroke={rising ? '#62b9f2' : '#8b93a8'} strokeWidth={rising ? 3 : 2} strokeDasharray={rising ? undefined : '5 4'} />
          <text x={ascP.x} y={ascP.y - 20} textAnchor="middle" fontSize={13} fill={rising ? '#62b9f2' : '#8b93a8'} fontWeight="bold" fontFamily="monospace">
            {rising ? `ASC ${rising.glyph}` : 'ASC ?'}
          </text>
        </g>
        {/* Center */}
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={30} fill="#fbbf24">{sun.glyph}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize={13} fill="#f2ecdc" fontWeight="bold" fontFamily="monospace">
          ☉ IN {sun.name.toUpperCase()}
        </text>
        {birthplace ? (
          <text x={cx} y={cy + 34} textAnchor="middle" fontSize={10} fill="#8b93a8" fontStyle="italic">
            {birthplace}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

// ---------- Main view ----------

export const CosmicCornerView: React.FC<CosmicCornerViewProps> = ({ user, onEditProfile, onSaveProfile }) => {
  const [tab, setTab] = useState<'horoscope' | 'chart'>('horoscope');
  const today = new Date().toISOString().split('T')[0];

  const birthday = user.birthday || '';
  const sign = sunSignFromBirthday(birthday);
  const placements = forFunPlacements(birthday, user.birth_time, user.birthplace);
  const tone: 'nice' | 'rude' = user.horoscope_tone === 'rude' ? 'rude' : 'nice';
  const horoscope = sign ? getDailyHoroscope(sign, today, tone) : null;

  const flipTone = (t: 'nice' | 'rude') => {
    if (t !== tone) onSaveProfile({ horoscope_tone: t });
  };

  const needsBirthday = (
    <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-8 text-center shadow-sm max-w-lg mx-auto">
      <Cake className="w-10 h-10 mx-auto text-rose-500 mb-3" />
      <h3 className="text-xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
        The stars need a birth date. You have not given them one.
      </h3>
      <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
        Add your birthday in your Identity Base and the Cosmic Corner will light up — horoscope, sun sign, and your (playful) natal chart.
      </p>
      <button
        onClick={onEditProfile}
        className="mt-4 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
      >
        Add my birthday →
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#02142e] border-2 border-stone-800 dark:border-amber-400/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-indigo-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            THE COSMIC CORNER
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono-code">WRITTEN BY THE APP, NOT THE STARS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas mt-1">
          Horoscope &amp; Natal Chart <span className="text-indigo-500">✨</span>
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          For fun, not fate. Zero doom, zero shame — just a daily nudge and a pretty wheel.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTab('horoscope')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono-code uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              tab === 'horoscope'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Daily Horoscope
          </button>
          <button
            onClick={() => setTab('chart')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono-code uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              tab === 'chart'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/20'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> Natal Chart
          </button>
        </div>
      </div>

      {/* HOROSCOPE TAB */}
      {tab === 'horoscope' && (
        <>
          {!sign || !horoscope ? (
            needsBirthday
          ) : (
            <div className="space-y-6">
              {/* Sign card */}
              <div className="bg-gradient-to-br from-indigo-950 via-[#02142e] to-rose-950 text-white rounded-2xl p-6 border-2 border-stone-800 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="text-6xl leading-none">{sign.glyph}</div>
                  <div>
                    <div className="text-[10px] font-mono-code uppercase tracking-widest text-amber-300">YOUR SUN SIGN</div>
                    <h3 className="text-2xl font-bold font-serif-display">{sign.name} <span className="text-sm font-normal text-stone-300">{sign.dates} · {sign.element}</span></h3>
                    <p className="text-sm text-stone-300 mt-1 italic">{sign.blurb}</p>
                  </div>
                </div>
              </div>

              {/* Today's horoscope */}
              <div className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                    TODAY · {today}
                  </span>
                  {/* RUDE / NICE tone toggle — persisted on the profile */}
                  <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-white/10 rounded-lg" title="Pick your horoscope's attitude">
                    <button
                      onClick={() => flipTone('nice')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black font-mono-code uppercase tracking-wider transition-all ${
                        tone === 'nice'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                      }`}
                    >
                      😇 Nice
                    </button>
                    <button
                      onClick={() => flipTone('rude')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black font-mono-code uppercase tracking-wider transition-all ${
                        tone === 'rude'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                      }`}
                    >
                      😈 Rude
                    </button>
                  </div>
                </div>
                <div className="text-[10px] font-mono-code uppercase tracking-widest text-stone-400 dark:text-stone-500">
                  mood: {horoscope.mood} · mode: {tone === 'rude' ? 'spicy tough-love' : 'warm encouragement'}
                </div>
                <p className="text-base font-serif-display text-slate-900 dark:text-cream-canvas leading-relaxed">
                  {horoscope.opener}
                </p>
                <div className="border-l-4 border-amber-400 pl-4">
                  <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">Today's focus</div>
                  <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">{horoscope.focus}</p>
                </div>
                <div className="border-l-4 border-rose-500 pl-4">
                  <div className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-rose-700 dark:text-rose-300">Cosmic micro-dare</div>
                  <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">{horoscope.dare}</p>
                </div>
                {horoscope.footnote && (
                  <p className="text-xs italic text-indigo-600 dark:text-indigo-300 font-serif-display">
                    {horoscope.footnote}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-white/10">
                  <span className="text-xs font-mono-code text-stone-500 dark:text-stone-400">
                    Lucky chaos number: <strong className="text-amber-600 dark:text-amber-300 text-base">{horoscope.luckyNumber}</strong>
                  </span>
                  <span className="text-[10px] italic text-stone-400 dark:text-stone-500">
                    Written by the app, not the stars. For fun, not fate.
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* NATAL CHART TAB */}
      {tab === 'chart' && (
        <>
          {!placements ? (
            needsBirthday
          ) : (
            <div className="space-y-6">
              <ChartWheel
                sun={placements.sun}
                moon={placements.moon}
                rising={placements.rising}
                birthplace={user.birthplace}
              />

              {/* Placement legend */}
              <div className="bg-white dark:bg-[#02142e] border border-stone-300 dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-cream-canvas font-display-punch uppercase">
                  Your placements <span className="normal-case font-normal text-stone-500 dark:text-stone-400 font-sans">(the honest edition)</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold flex-shrink-0">☉</span>
                    <p className="text-stone-700 dark:text-stone-300">
                      <strong>Sun in {placements.sun.name}</strong> {placements.sun.glyph} — placed from your birth date. That part is real calendar math.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full border-2 border-dashed border-sky-400 text-sky-500 flex items-center justify-center font-bold flex-shrink-0">☽</span>
                    <p className="text-stone-700 dark:text-stone-300">
                      <strong>Moon in {placements.moon.name}</strong> {placements.moon.glyph} — <em>for fun.</em> Drawn by the app, not the ephemeris.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full border-2 border-dashed border-teal-400 text-teal-500 flex items-center justify-center flex-shrink-0">
                      <Sunrise className="w-4 h-4" />
                    </span>
                    {placements.rising ? (
                      <p className="text-stone-700 dark:text-stone-300">
                        <strong>Rising in {placements.rising.name}</strong> {placements.rising.glyph} — <em>for fun,</em> from the birth time you gave us. A real rising sign needs an exact time and place; treat ours as a costume, not a credential.
                      </p>
                    ) : (
                      <p className="text-stone-700 dark:text-stone-300">
                        <strong>Rising sign: unknown.</strong> A real rising sign needs your birth time, and we refuse to fake one.
                        {' '}<button onClick={onEditProfile} className="underline font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-500">Add your birth time</button> for a playful guess.
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] italic text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-200 dark:border-white/10">
                  This wheel is decorative mischief, not an ephemeris calculation. Houses are whole-sign, placements are playful, and no planet was consulted.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
