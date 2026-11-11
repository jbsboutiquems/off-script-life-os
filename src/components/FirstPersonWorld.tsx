import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PLACES, TILES, FAMILIARS, COMPANIONS } from './TorqueWorldView';

/**
 * First-person 3D walkthrough of Torque World — STAGED ONLY (2026-11-06,
 * Amber's call: "First-person walk — see through your own eyes").
 *
 * Same 7x5 world as the 2D grid in TorqueWorldView: same tiles, same
 * Commons centre, same Familiar Grove, same places. Rendered in Three.js
 * with low-poly boxes/cones/spheres only — no textures, no shadows, pixel
 * ratio capped at 1.5 so it runs on a 2026 Moto G Play.
 *
 * Honesty rules, unchanged: solo playtest only, walk log stays local,
 * nothing synced, no backend, no new API calls. The 18+ gate stays in
 * front (it lives in TorqueWorldView, above this component). Companions
 * are scripted bots, shown here as coloured markers with name labels —
 * not live AI sessions.
 *
 * Controls: WASD / arrow keys to walk, drag (mouse or touch) to look.
 * On touch: the visible trackball (bottom-left) walks — push it further
 * to walk faster; the right side of the screen is look-drag. On-screen
 * arrow buttons are a fallback.
 */

const TILE = 4; // world units per grid tile
const WORLD_W = 7 * TILE;
const WORLD_H = 5 * TILE;
const JOY_R = 40; // trackball travel in px — push further to walk faster

type PlaceId = 'commons' | 'games' | 'missions' | 'grove' | 'tower' | 'dock' | 'wild';

const TILE_COLORS: Record<PlaceId, number> = {
  commons: 0x8a2f5e,
  games: 0x5b3a8a,
  missions: 0x0f5f5c,
  grove: 0x2e5d33,
  tower: 0x8a6d2b,
  dock: 0x1f4d6e,
  wild: 0x1d3320,
};

const FAMILIAR_COLORS = ['#b6ff2e', '#7be0ea', '#ff725e', '#77c9c5', '#ffd35f'];
const COMPANION_COLORS = ['#ea4798', '#60d0f8', '#ffd35f', '#b6ff2e', '#c26bff'];

const tileAt = (x: number, y: number) =>
  TILES.find((t) => t.x === x && t.y === y) ?? TILES[10];

const worldToTile = (wx: number, wz: number) => ({
  x: Math.min(6, Math.max(0, Math.round(wx / TILE) + 3)),
  y: Math.min(4, Math.max(0, Math.round(wz / TILE) + 2)),
});

function makeLabelSprite(text: string, fg = '#ffffff', bg = 'rgba(5,8,23,0.85)'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(4, 8, 248, 48, 12);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 34);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

interface FirstPersonWorldProps {
  pos: { x: number; y: number };
  onArrive: (x: number, y: number) => void;
  onExit: () => void;
}

export const FirstPersonWorld: React.FC<FirstPersonWorldProps> = ({ pos, onArrive, onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentTile, setCurrentTile] = useState(() => tileAt(pos.x, pos.y));
  const [sensitivity, setSensitivity] = useState(() => {
    try {
      return Number(localStorage.getItem('torque-world-fp-sensitivity') ?? '1') || 1;
    } catch {
      return 1;
    }
  });
  const [compass, setCompass] = useState('N');
  // Visible trackball (bottom-left, thumb-reachable): drag it to walk.
  // Knob offset in px, clamped to JOY_R; feeds the same joyRef the
  // invisible left-half joystick and the frame loop already use, so push
  // distance controls walk speed. Works with touch and mouse (pointer
  // events). The D-pad buttons and WASD/arrows keep working alongside.
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyActiveId = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const stateRef = useRef({ pos, onArrive });
  stateRef.current = { pos, onArrive };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = 420;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050817);
    scene.fog = new THREE.Fog(0x050817, 12, 34);

    const camera = new THREE.PerspectiveCamera(68, width / height, 0.1, 100);
    // Eye height 1.6. Start in the Commons (grid 3,2 -> world 0,0), facing
    // north (toward the Guide Tower at grid 3,0).
    const start = stateRef.current.pos;
    const player = {
      x: (start.x - 3) * TILE,
      z: (start.y - 2) * TILE,
      // Yaw 0 = facing -z, i.e. north, toward the Guide Tower at grid (3,0).
      yaw: 0,
      pitch: 0,
    };
    camera.position.set(player.x, 1.6, player.z);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf6f7ff, 0x1d3320, 1.1));
    const sun = new THREE.DirectionalLight(0xffe9c4, 1.4);
    sun.position.set(8, 14, 6);
    scene.add(sun);

    // --- Ground: one flat box per grid tile, coloured by place ---
    const tileGeo = new THREE.BoxGeometry(TILE - 0.08, 0.12, TILE - 0.08);
    const tileMats = new Map<number, THREE.MeshLambertMaterial>();
    const matFor = (color: number) => {
      let m = tileMats.get(color);
      if (!m) {
        m = new THREE.MeshLambertMaterial({ color });
        tileMats.set(color, m);
      }
      return m;
    };
    for (const t of TILES) {
      const mesh = new THREE.Mesh(tileGeo, matFor(TILE_COLORS[t.place as PlaceId]));
      mesh.position.set((t.x - 3) * TILE, -0.06, (t.y - 2) * TILE);
      scene.add(mesh);
    }
    // Dark apron under the world so the edges read as ground, not void.
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_W + 30, WORLD_H + 30),
      new THREE.MeshLambertMaterial({ color: 0x0a0f1e }),
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.14;
    scene.add(apron);

    // --- Colliders (circle vs box, checked in the move step) ---
    const colliders: { x: number; z: number; r: number }[] = [];
    const addCollider = (x: number, z: number, r: number) => colliders.push({ x, z, r });

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const coneGeo = new THREE.ConeGeometry(0.9, 2.2, 6);
    const cylGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.4, 8);
    const sphereGeo = new THREE.SphereGeometry(0.55, 12, 10);
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1, 6);
    const treeTopGeo = new THREE.ConeGeometry(0.85, 1.9, 6);

    const addBox = (x: number, z: number, w: number, h: number, d: number, color: number, collide = true) => {
      const m = new THREE.Mesh(boxGeo, matFor(color));
      m.scale.set(w, h, d);
      m.position.set(x, h / 2, z);
      scene.add(m);
      if (collide) addCollider(x, z, Math.max(w, d) / 2 + 0.35);
      return m;
    };

    // Place landmarks (same places as the 2D grid).
    // Guide Tower — tall pillar at grid (3,0).
    addBox(0, -8, 1.6, 7, 1.6, 0xc9a227);
    const towerTop = new THREE.Mesh(coneGeo, matFor(0xffd35f));
    towerTop.position.set(0, 8.1, -8);
    scene.add(towerTop);
    const towerLabel = makeLabelSprite('Guide Tower');
    towerLabel.position.set(0, 5.4, -8);
    scene.add(towerLabel);
    // Games Board — dice block at grid (1,0).
    addBox(-8, -8, 1.8, 1.8, 1.8, 0x7b5cff);
    const gamesLabel = makeLabelSprite('Games Board');
    gamesLabel.position.set(-8, 3, -8);
    scene.add(gamesLabel);
    // Missions Board — scroll board at grid (5,0).
    addBox(8, -8, 2.2, 2.6, 0.4, 0x28d7ff);
    const missionsLabel = makeLabelSprite('Missions Board');
    missionsLabel.position.set(8, 3.8, -8);
    scene.add(missionsLabel);
    // Daily Dock — anchor post at grid (6,2).
    addBox(12, 0, 0.5, 3.2, 0.5, 0x77c9c5);
    const dockLabel = makeLabelSprite('Daily Dock');
    dockLabel.position.set(12, 4.2, 0);
    scene.add(dockLabel);
    // Commons fountain — basin + column at grid (3,1), north of the start.
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.5, 10), matFor(0x28d7ff));
    basin.position.set(0, 0.25, -4);
    scene.add(basin);
    const column = new THREE.Mesh(cylGeo, matFor(0xea4798));
    column.position.set(0, 0.9, -4);
    scene.add(column);
    addCollider(0, -4, 1.9);
    const commonsLabel = makeLabelSprite('The Commons');
    commonsLabel.position.set(0, 3.4, -4);
    scene.add(commonsLabel);

    // Familiar Grove — five coloured Familiar markers in an arc at grid (0,2).
    FAMILIARS.forEach((f, i) => {
      const angle = Math.PI * (0.15 + (i / 5) * 0.7);
      const fx = -12 + Math.cos(angle) * 1.6;
      const fz = Math.sin(angle) * 2.2;
      const orb = new THREE.Mesh(sphereGeo, new THREE.MeshLambertMaterial({ color: FAMILIAR_COLORS[i % FAMILIAR_COLORS.length], emissive: FAMILIAR_COLORS[i % FAMILIAR_COLORS.length], emissiveIntensity: 0.45 }));
      orb.position.set(fx, 0.9, fz);
      scene.add(orb);
      const label = makeLabelSprite(f.name, '#ffffff');
      label.position.set(fx, 2.1, fz);
      scene.add(label);
    });
    const groveLabel = makeLabelSprite('Familiar Grove');
    groveLabel.position.set(-12, 3.6, 0);
    scene.add(groveLabel);

    // Companions — five coloured markers standing in the Commons.
    COMPANIONS.forEach((c, i) => {
      const angle = (i / COMPANIONS.length) * Math.PI * 2 + 0.5;
      const cx = Math.cos(angle) * 2.6;
      const cz = Math.sin(angle) * 2.6;
      const body = new THREE.Mesh(cylGeo, new THREE.MeshLambertMaterial({ color: COMPANION_COLORS[i % COMPANION_COLORS.length] }));
      body.position.set(cx, 0.7, cz);
      scene.add(body);
      const head = new THREE.Mesh(sphereGeo, new THREE.MeshLambertMaterial({ color: 0xf6f7ff }));
      head.scale.setScalar(0.62);
      head.position.set(cx, 1.7, cz);
      scene.add(head);
      const label = makeLabelSprite(c.name);
      label.position.set(cx, 2.6, cz);
      scene.add(label);
    });

    // Wild Edge trees — one low-poly tree per wild tile (seeded, stable).
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (const t of TILES) {
      if (t.place !== 'wild') continue;
      const tx = (t.x - 3) * TILE + (rand() - 0.5) * 1.6;
      const tz = (t.y - 2) * TILE + (rand() - 0.5) * 1.6;
      const trunk = new THREE.Mesh(trunkGeo, matFor(0x6b4a2b));
      trunk.position.set(tx, 0.5, tz);
      scene.add(trunk);
      const top = new THREE.Mesh(treeTopGeo, matFor(0x2e7d32));
      top.position.set(tx, 1.9, tz);
      scene.add(top);
      addCollider(tx, tz, 0.5);
    }

    // Low hedge around the world edge so the boundary is visible.
    const hedgeMat = matFor(0x244d2a);
    const hedge = (x: number, z: number, w: number, d: number) => {
      const m = new THREE.Mesh(boxGeo, hedgeMat);
      m.scale.set(w, 0.9, d);
      m.position.set(x, 0.45, z);
      scene.add(m);
    };
    hedge(0, -10.4, WORLD_W + 1, 0.6);
    hedge(0, 10.4, WORLD_W + 1, 0.6);
    hedge(-14.4, 0, 0.6, WORLD_H + 1);
    hedge(14.4, 0, 0.6, WORLD_H + 1);

    // --- Input: keyboard ---
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // --- Input: drag to look (mouse + touch), left-half joystick to walk ---
    let lookId: number | null = null;
    let lookLast = { x: 0, y: 0 };
    let joyId: number | null = null;
    let joyOrigin = { x: 0, y: 0 };
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';
    canvas.style.display = 'block';
    canvas.style.width = '100%';

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      if (px < rect.width / 2 && joyId === null) {
        joyId = e.pointerId;
        joyOrigin = { x: e.clientX, y: e.clientY };
        joyRef.current = { x: 0, y: 0 };
      } else if (lookId === null) {
        lookId = e.pointerId;
        lookLast = { x: e.clientX, y: e.clientY };
      }
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId === lookId) {
        const dx = e.clientX - lookLast.x;
        const dy = e.clientY - lookLast.y;
        lookLast = { x: e.clientX, y: e.clientY };
        player.yaw -= dx * 0.004 * sensitivity;
        player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - dy * 0.004 * sensitivity));
      } else if (e.pointerId === joyId) {
        const dx = Math.max(-50, Math.min(50, e.clientX - joyOrigin.x)) / 50;
        const dy = Math.max(-50, Math.min(50, e.clientY - joyOrigin.y)) / 50;
        joyRef.current = { x: dx, y: dy };
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId === lookId) lookId = null;
      if (e.pointerId === joyId) {
        joyId = null;
        joyRef.current = { x: 0, y: 0 };
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const onResize = () => {
      const w = mount.clientWidth || 640;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', onResize);

    // --- Frame loop ---
    let raf = 0;
    let last = performance.now();
    let lastTile = tileAt(start.x, start.y);
    const SPEED = 3.4; // world units per second — a calm walk, not a run
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const keys = keysRef.current;
      let fwd = 0;
      let strafe = 0;
      if (keys.has('w') || keys.has('arrowup')) fwd += 1;
      if (keys.has('s') || keys.has('arrowdown')) fwd -= 1;
      if (keys.has('a') || keys.has('arrowleft')) strafe -= 1;
      if (keys.has('d') || keys.has('arrowright')) strafe += 1;
      // Joystick: up = forward, left/right = strafe.
      fwd += -joyRef.current.y;
      strafe += joyRef.current.x;
      const len = Math.hypot(fwd, strafe);
      if (len > 1) {
        fwd /= len;
        strafe /= len;
      }
      if (fwd !== 0 || strafe !== 0) {
        const sin = Math.sin(player.yaw);
        const cos = Math.cos(player.yaw);
        // Forward is -z rotated by yaw; strafe is +x rotated by yaw.
        let nx = player.x + (-sin * fwd + cos * strafe) * SPEED * dt;
        let nz = player.z + (-cos * fwd - sin * strafe) * SPEED * dt;
        // World bounds.
        nx = Math.max(-13.2, Math.min(13.2, nx));
        nz = Math.max(-9.2, Math.min(9.2, nz));
        // Simple circle-vs-collider push-out.
        for (const c of colliders) {
          const dx = nx - c.x;
          const dz = nz - c.z;
          const d = Math.hypot(dx, dz);
          const min = c.r + 0.4;
          if (d < min && d > 0.001) {
            nx = c.x + (dx / d) * min;
            nz = c.z + (dz / d) * min;
          }
        }
        player.x = nx;
        player.z = nz;
      }
      camera.position.set(player.x, 1.6, player.z);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch;

      const tile = worldToTile(player.x, player.z);
      if (tile.x !== lastTile.x || tile.y !== lastTile.y) {
        lastTile = tile;
        setCurrentTile(tileAt(tile.x, tile.y));
        stateRef.current.onArrive(tile.x, tile.y);
      }
      // Heading clockwise from north: forward is (-sin yaw, -cos yaw),
      // so the compass angle is -yaw.
      const deg = ((-player.yaw * 180) / Math.PI % 360 + 360) % 360;
      setCompass(dirs[Math.round(deg / 45) % 8]);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
    // Mount once; player state lives in refs. Sensitivity changes re-mount
    // the scene (acceptable: it re-reads the saved grid position).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensitivity]);

  const place = PLACES[currentTile.place as PlaceId];
  const pressKey = (key: string) => {
    keysRef.current.add(key);
    window.setTimeout(() => keysRef.current.delete(key), 350);
  };

  const updateJoyFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > JOY_R) {
      dx = (dx / len) * JOY_R;
      dy = (dy / len) * JOY_R;
    }
    joyRef.current = { x: dx / JOY_R, y: dy / JOY_R };
    setJoyKnob({ x: dx, y: dy });
  };
  const endJoy = () => {
    joyActiveId.current = null;
    joyRef.current = { x: 0, y: 0 };
    setJoyKnob({ x: 0, y: 0 });
  };

  return (
    <div className="rounded-3xl border border-stone-300 dark:border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="font-bold">First-person walk — see through your own eyes</h3>
        <span className="text-xs text-stone-500 ml-auto">Drag to look · WASD / arrows / trackball to walk</span>
        <button onClick={onExit} className="px-3 py-2 bg-stone-200 dark:bg-white/10 rounded-xl text-xs font-bold">
          ← Back to 2D grid
        </button>
      </div>
      <div ref={mountRef} className="relative rounded-2xl overflow-hidden border border-stone-800 bg-[#050817]" style={{ height: 420 }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-lg leading-none pointer-events-none select-none" aria-hidden>
          +
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs font-bold pointer-events-none">
          Facing {compass}
        </div>
        {/* Visible trackball — bottom-left, thumb-reachable. Drag to walk;
            push further to walk faster. Touch and mouse. */}
        <div
          className="absolute left-3 bottom-3 w-28 h-28 rounded-full border-2 border-white/30 bg-black/40"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            joyActiveId.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateJoyFromEvent(e);
          }}
          onPointerMove={(e) => {
            if (joyActiveId.current === e.pointerId) updateJoyFromEvent(e);
          }}
          onPointerUp={endJoy}
          onPointerCancel={endJoy}
          role="application"
          aria-label="Trackball — drag to walk, push further to walk faster"
        >
          <div
            className="absolute w-12 h-12 rounded-full bg-white/80 border-2 border-white shadow"
            style={{ left: `calc(50% - 24px + ${joyKnob.x}px)`, top: `calc(50% - 24px + ${joyKnob.y}px)` }}
          />
        </div>
      </div>
      <p className="text-sm mt-3">
        <strong>You are at:</strong> {place.name} — {place.blurb}
      </p>
      <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">{place.action}</p>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <div className="flex items-center gap-2">
          <button onClick={() => pressKey('arrowleft')} aria-label="Walk left" className="px-4 py-3 rounded-xl bg-stone-200 dark:bg-white/10 text-lg font-bold">◀</button>
          <button onClick={() => pressKey('arrowup')} aria-label="Walk forward" className="px-4 py-3 rounded-xl bg-stone-200 dark:bg-white/10 text-lg font-bold">▲</button>
          <button onClick={() => pressKey('arrowdown')} aria-label="Walk back" className="px-4 py-3 rounded-xl bg-stone-200 dark:bg-white/10 text-lg font-bold">▼</button>
          <button onClick={() => pressKey('arrowright')} aria-label="Walk right" className="px-4 py-3 rounded-xl bg-stone-200 dark:bg-white/10 text-lg font-bold">▶</button>
        </div>
        <label className="text-xs font-bold flex items-center gap-2 ml-auto">
          Look speed
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.25}
            value={sensitivity}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSensitivity(v);
              try { localStorage.setItem('torque-world-fp-sensitivity', String(v)); } catch { /* solo playtest */ }
            }}
            aria-label="Look sensitivity"
          />
          {sensitivity.toFixed(2)}×
        </label>
      </div>
      <p className="text-xs text-stone-500 mt-2">
        Solo playtest — this walk stays in your browser, not synced. Familiars appear as glowing markers in the Grove; companions as coloured figures in the Commons. Walking into a new tile updates your 2D position and walk log too.
      </p>
    </div>
  );
};
