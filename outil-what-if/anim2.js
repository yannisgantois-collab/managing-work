// Episode 2 « la coupure » : camera moves, extra character animation, live counters.
import { animPerson } from './lib.js';
const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add3 = (a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
const drift = (b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 0.3) * 0.04, Math.sin(t * 0.21) * 0.02, 0]) });

export const CAMANIM = {
  P01: (u, b, t) => drift(b, t),
  P02: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.12 * ease(u)) }),
  P03: (u, b) => ({ ...b, pos: add3(b.pos, [-1.2 * u, -0.3 * u, 0]) }),
  P04: (u, b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 1.3) * 0.02, Math.sin(t * 2.1) * 0.012, -2.2 * u]), look: add3(b.look, [0, 0, -2.2 * u]) }),
  P05: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.18 * ease(u)) }),
  P06: (u, b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 0.7) * 0.004, 0, 0]) }),
  P07: (u, b, t) => drift(b, t),
  P08: (u, b) => ({ ...b, pos: add3(b.pos, [-1.25 * u, 0, 1.0 * u]), look: add3(b.look, [-1.25 * u, 0, 1.0 * u]) }),
  P09: (u, b) => ({ ...b, pos: add3(b.pos, [0, 0, -1.6 * u]), look: add3(b.look, [0, 0, -1.6 * u]) }),
  P10: (u, b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 0.5) * 0.02, 0, 0]) }),
  P11: (u, b, t) => drift(b, t),
  P12: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.14 * ease(u)) }),
  P13: (u, b) => ({ ...b, pos: add3(b.pos, [0.12 * u, 0, 0.1 * u]) }),
  P14: (u, b, t) => drift(b, t),
  P15: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, -0.12 * ease(u)) }),
  P16: (u, b) => ({ ...b, pos: add3(b.pos, [-1.5 * u, 0, 0.5 * u]) }),
  P17: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.05 * ease(u)) }),
  P18: (u, b) => ({ ...b, pos: add3(b.pos, [0.3 * u, 0, -0.2 * u]) }),
};

// every decor animates itself through ctx.anim; shots built from episode 1 decors get their life here
export function objAnim(id, ctx, t, dur, frame) {
  if (!ctx) return {};
  if (ctx.anim) ctx.anim.forEach(f => f(t, dur, frame));
  if (id === 'P07' && ctx.people) {
    ctx.people.forEach((p, i) => animPerson(p, t, { breath: 1, look: 0.8, sway: 1.5, phase: i * 1.3 }));
    if (ctx.walker) { const d = 1.1 * Math.max(0, t - 0.3); ctx.walker.position.x = 0.4 + d; animPerson(ctx.walker, t, { walk: t > 0.3 ? 1.4 : 0, look: 0.3, phase: 2 }); }
  }
  return {};
}

// counters
const T0 = 19 * 60 + 42;                           // the blackout starts on day 1 at 19:42
const ADV = { P02: 1, P03: 1, P04: 1, P05: 1, P06: 4, P07: 9, P08: 9, P09: 12, P10: 12, P11: 12, P12: 9, P13: 6 };   // minutes elapsed during the shot
const parseDur = (v) => { const m = /(\d+)\s*h\s*(\d+)/.exec(v); return m ? +m[1] * 60 + +m[2] : null; };
const fmtDur = (min) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
const clock = (min) => { const a = T0 + min, d = 1 + Math.floor(a / 1440), r = a % 1440; return `JOUR ${d} · ${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`; };
export function hudValue(id, T, t, dur, st, shot) {
  if (id === 'P16') {                                // Spain, sourced steps only: 61 % just after midnight, 88 % around 4 a.m., 99.95 % the next morning (S3, S4)
    const k = clamp(t / dur), roll = (k0, v0, v1) => v0 + (v1 - v0) * ease((k - k0) / 0.08);
    const v = k < 0.3 ? 61 : k < 0.62 ? roll(0.3, 61, 88) : roll(0.62, 88, 99.95);
    const tl = k < 0.34 ? 'PEU APRÈS MINUIT' : k < 0.66 ? 'VERS 4 H DU MATIN' : 'LE LENDEMAIN MATIN';
    return { value: (v >= 99.9 ? '99,95' : String(Math.round(v))) + '\u202f%', tl };
  }
  if (shot && shot.hud && shot.hud.label === 'DURÉE DE LA COUPURE' && id !== 'P18') {
    const m0 = parseDur(shot.hud.value); if (m0 === null) return null;
    const m = m0 + Math.floor((ADV[id] || 0) * clamp(t / dur));
    return { value: fmtDur(m), tl: clock(m) };
  }
  return null;
}
