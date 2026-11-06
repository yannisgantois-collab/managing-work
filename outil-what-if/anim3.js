// Episode 3 « Et si Paris atteignait 50 °C ? » : camera moves, decor animation, live counters.
const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add3 = (a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
const drift = (b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 0.3) * 0.05, Math.sin(t * 0.21) * 0.03, 0]) });
export const CAMANIM = {
  P01: (u, b) => ({ ...b, pos: add3(b.pos, [-3.0 * u, 0, 0]), look: add3(b.look, [-3.0 * u, 0, 0]) }),
  P02: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.1 * ease(u)) }),
  P03: (u, b) => ({ ...b, pos: add3(b.pos, [0, 0, 1.6 * u]) }),
  P04: (u, b, t) => drift(b, t),
  P05: (u, b) => ({ ...b, look: add3(b.look, [22 * u, 0, 0]) }),   // slow pan that brings the water-temperature board into frame
  P06: (u, b) => ({ ...b, pos: lerp3(b.pos, [0.55, 1.85, 3.0], ease(u)), look: lerp3(b.look, [0.8, 1.7, 0], ease(u)) }),   // push in on the notice, kept above the subtitle
  P07: (u, b) => ({ ...b, look: add3(b.look, [0, -3.5 * ease(u), 0]) }),
  P08: (u, b) => ({ ...b, pos: add3(b.pos, [-1.2 * u, 0, 0]), look: add3(b.look, [-1.2 * u, 0, 0]) }),
  P09: (u, b, t) => drift(b, t),
  P10: (u, b) => ({ ...b, pos: add3(b.pos, [0, 0, -1.2 * u]), look: add3(b.look, [0, 0, -1.2 * u]) }),
  P11: (u, b, t) => drift(b, t),
  P12: (u, b, t) => ({ ...b, pos: add3(b.pos, [Math.sin(t * 1.7) * 0.03, Math.sin(t * 2.3) * 0.02, 0]) }),
  P13: (u, b, t) => drift(b, t),
  P14: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.08 * ease(u)) }),
  P15: (u, b) => ({ ...b, pos: add3(b.pos, [1.4 * u, 0, -0.4 * u]) }),
  P16: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, -0.08 * ease(u)) }),
  P17: (u, b, t) => drift(b, t),
  P18: (u, b) => ({ ...b, pos: lerp3(b.pos, b.look, 0.12 * ease(u)) }),
};
export function objAnim(id, ctx, t, dur, frame) { if (ctx && ctx.anim) ctx.anim.forEach(f => f(t, dur, frame)); return {}; }
// counters: every number comes from shots.json (fix D02); only the in-between frames are computed
const deg = (v, dec = 0) => v.toFixed(dec).replace('.', ',') + ' °C';
const thou = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export function hudValue(id, T, t, dur, st, shot) {
  const k = clamp(t / dur);
  if (id === 'P11') return { value: deg(49.4 + 0.6 * ease(k / 0.6), 1) };            // 49,4 -> 50,0 °C at 16:00
  if (id === 'P13') return { value: deg(38 - 9 * ease((k - 0.25) / 0.6)) };          // the storm: 38 -> 29 °C
  if (id === 'P16') return { value: thou(14802 * ease(k / 0.8)) };                  // 0 -> 14 802 (S2)
  if (id === 'P01') return { value: deg(34 + 2 * ease(k / 0.7)) };                   // 34 -> 36 °C
  return null;
}
