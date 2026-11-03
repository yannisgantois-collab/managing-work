// Per-shot animation: camera moves, animated objects and live counter values.
const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const add3 = (a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// Number of farms that go dark in P17 (all lit farms but Hélène's). Measured from the valley layout, used by P17 and P18.
export const VALLEY_LOST = 34;

// camera: (u = 0..1 within the shot, base = {fov,pos,look}, t = seconds) -> {fov,pos,look,up}
export const CAMANIM = {
  P01: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.16 * ease(u)) }),
  P02: (u, b) => ({ ...b, pos: add3(b.pos, [0.14 * u, 0, -0.06 * u]) }),
  P03: (u, b) => ({ ...b, pos: add3(b.pos, [0, -0.28 * ease(u), 0]) }),
  P04: (u, b) => ({ ...b, pos: add3(b.pos, [1.5 * u, 0, 0]), look: add3(b.look, [1.5 * u, 0, 0]) }),
  P05: (u, b) => ({ ...b, pos: add3(b.pos, [0, -4 * ease(u), -4 * ease(u)]) }),
  P06: (u, b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 1.7) * 0.02, Math.sin(t * 2.3) * 0.015, -1.8 * u]), look: add3(b.look, [Math.sin(t * 1.3) * 0.06, Math.sin(t * 1.9) * 0.035, -1.8 * u]) }),
  P07: (u, b) => ({ ...b, pos: add3(b.pos, [0, 0, 3 * ease(u)]) }),
  P08: (u, b) => ({ ...b, pos: add3(b.pos, [-0.22 + 0.44 * ease(u), 0, 0]), look: add3(b.look, [-0.22 + 0.44 * ease(u), 0, 0]) }),
  P09: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.05 * ease(u)) }),
  P10: (u, b) => ({ ...b, pos: add3(b.pos, [1.3 * u, 0, 0]), look: add3(b.look, [1.3 * u, 0, 0]) }),
  P11: (u, b) => ({ ...b, pos: add3(b.pos, [0, 0, -2.4 * u]) }),
  P12: (u, b) => ({ ...b, pos: add3(b.pos, [0, -0.6 * ease(u), -0.6 * ease(u)]) }),
  P13: (u, b) => ({ ...b, fov: b.fov - 5 * ease(u) }),
  P14: (u, b) => b,
  P15: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.07 * ease(u)) }),
  P16: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.06 * ease(u)) }),
  P17: (u, b) => b,
  P18: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.22 * ease(u)) }),
};

function shake(clock, frame, on) {
  const b = clock.userData.base || (clock.userData.base = { rz: clock.rotation.z, x: clock.position.x, y: clock.position.y });
  clock.rotation.z = b.rz + (on ? (hash(frame) - 0.5) * 0.09 : 0);
  clock.position.x = b.x + (on ? (hash(frame + 7.3) - 0.5) * 0.004 : 0);
  clock.position.y = b.y + (on ? (hash(frame + 3.1) - 0.5) * 0.002 : 0);
}

// When the alarm stops in P14 (seconds into the shot). The sound design uses the same value.
export const P14_CLICK = 1.0;

// objects: called every frame before rendering. Returns extra state (e.g. farms lost so far).
export function objAnim(id, ctx, t, dur, frame) {
  const out = {};
  if (!ctx) return out;
  if ((id === 'P01' || id === 'P02') && ctx.clock) shake(ctx.clock, frame, true);
  if (id === 'P14' && ctx.clock) {
    shake(ctx.clock, frame, t < P14_CLICK);
    const arm = ctx.helene && ctx.helene.userData.rArm;
    if (arm) { const b = arm.userData.bx ?? (arm.userData.bx = arm.rotation.x); arm.rotation.x = lerp(-0.15, b, ease(t / P14_CLICK)); }
  }
  if (id === 'P15' && ctx.helene) {
    const tor = ctx.helene.userData.torso; const b = tor.userData.bx ?? (tor.userData.bx = tor.rotation.x);
    tor.rotation.x = b + Math.sin(t * 2.2) * 0.07;
    if (ctx.fork) { const fb = ctx.fork.userData.bz ?? (ctx.fork.userData.bz = ctx.fork.rotation.z); ctx.fork.rotation.z = fb + Math.sin(t * 2.2) * 0.06; }
  }
  if (id === 'P05' && ctx.trucks) {
    const L = ctx.road.getLength();
    for (const tr of ctx.trucks) {
      const u = Math.max(0.0005, tr.u - (12.5 * t) / L);   // 45 km/h toward the camera
      const q = ctx.onRoad(ctx.road, u, -1.75); tr.obj.position.set(q.x, 0.3, q.z); tr.obj.rotation.y = q.ry + Math.PI;
    }
  }
  if (id === 'P11' && ctx.crows) {
    for (const c of ctx.crows) { c.c.position.x = c.x0 + c.sp * t * 1.3; c.c.position.y = c.y0 + Math.sin(t * 1.4 + c.ph) * 0.25; c.wg.rotation.z = Math.sin(t * 9 + c.ph) * 0.7; }
  }
  if (id === 'P17' && ctx.farms) {
    const others = ctx.farms.filter(f => !f.last);
    const order = others.map((f, i) => ({ f, r: hash(f.k * 3.7) })).sort((a, b) => a.r - b.r).map(o => o.f);
    const n = Math.min(order.length, Math.floor(order.length * Math.pow(clamp((t - 0.35) / (dur - 0.9)), 1.35) + 1e-6));
    order.forEach((f, i) => { const on = i >= n; f.w.forEach(w => { w.material.emissiveIntensity = on ? (w.userData.e ?? (w.userData.e = w.material.emissiveIntensity)) : 0; }); f.gl.visible = on; if (f.pl) { f.pl.userData.i ??= f.pl.intensity; f.pl.intensity = on ? f.pl.userData.i : 0; } });
    out.lost = n; out.total = order.length;
  }
  return out;
}

const fmt = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ');

// live counter value for a shot (null = use the value written in shots.json)
export function hudValue(id, T, t, dur, st) {
  const drop = (T0, T1) => 496365 * (1 - Math.pow(clamp((T - T0) / (T1 - T0)), 2));
  if (id === 'P02' || id === 'P03') return fmt(T < 3.6 ? 496365 : drop(3.6, 7.9));
  if (id === 'P12') return fmt(lerp(4120, 12870, 1 - Math.pow(1 - clamp(t / (dur * 0.9)), 2)));
  if (id === 'P13') return fmt(lerp(12870, 41302, 1 - Math.pow(1 - clamp(t / (dur * 0.9)), 2)));
  if (id === 'P17') return fmt(389000 - (st.lost || 0));
  if (id === 'P18') return fmt(389000 - VALLEY_LOST);
  return null;
}
