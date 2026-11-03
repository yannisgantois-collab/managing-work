// Decors for episode 2 « Et si la France entière perdait l'électricité pendant une semaine ? »
import { THREE, glow, M, E, glass, mesh, box, rbox, cyl, sph, canvasTex, noiseTex, signTex, sun, hemi, point, spot, person, randPerson, WALK, SIT, ground, instanced, shaft, dust, seed, rnd, rr, pick, animPerson, flick } from './lib.js';
const ease = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

// character sheets (fix D04)
export const JEANNE = { skin: 0xf0c9ab, hair: 0xe6e1d8, hairStyle: 'bun', top: 0x7a2e3a, pants: 0x3b3b44, shoes: 0x2b2421 };
export const YANIS = { skin: 0xc68e62, hair: 0x1f1712, hairStyle: 'short', top: 0x2e5b4a, pants: 0x2a3040, shoes: 0xe8e8e8 };

function grad(stops, w = 16, h = 512) {
  return canvasTex(w, h, (g) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}
const castAll = (o) => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

// ---------- night facades: one diffuse map + emissive maps for electric light and candles ----------
const FAC = {};
function facade(variantSeed, wall = '#7d776c') {
  const key = variantSeed + wall; if (FAC[key]) return FAC[key];
  seed(1000 + variantSeed);
  const cols = 6, rows = 7, W = 256, H = 384, cw = W / cols, rh = H / rows;
  const lit = [], cand = [], tint = [];
  for (let i = 0; i < cols * rows; i++) { lit.push(rnd() < 0.74); cand.push(rnd() < 0.3); tint.push(pick(['#ffd08a', '#ffc670', '#ffe2b0', '#ffb860'])); }
  const win = (g, r, c, fill) => { g.fillStyle = fill; g.fillRect(c * cw + cw * 0.27, r * rh + rh * 0.2, cw * 0.46, rh * 0.6); };
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, r * rh, W, 3); for (let c = 0; c < cols; c++) { win(g, r, c, '#161b24'); if (r === 1 || r === rows - 2) { g.fillStyle = 'rgba(20,20,20,0.85)'; g.fillRect(c * cw + cw * 0.18, r * rh + rh * 0.8, cw * 0.64, rh * 0.06); } } }
  });
  const on = canvasTex(W, H, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (lit[r * cols + c]) win(g, r, c, tint[r * cols + c]); });
  const candle = canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (cand[r * cols + c]) {
      const x = c * cw + cw * 0.5, y = r * rh + rh * 0.68, gr = g.createRadialGradient(x, y, 0, x, y, cw * 0.26);
      gr.addColorStop(0, 'rgba(255,170,80,1)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(c * cw, r * rh, cw, rh);
    }
  });
  return (FAC[key] = { map, on, candle });
}
// a Paris block whose windows can be switched: mode 'on' | 'off' | 'candle'
function block(w, h, d, mode, vs, wall) {
  const f = facade(vs, wall); const rep = Math.max(1, Math.round(w / 13));
  const mk = (t) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = THREE.RepeatWrapping; c.repeat.set(rep, 1); return c; };
  const mat = new THREE.MeshStandardMaterial({ map: mk(f.map), emissive: 0xffffff, emissiveMap: mk(mode === 'candle' ? f.candle : f.on), emissiveIntensity: mode === 'off' ? 0 : (mode === 'candle' ? 1.5 : 1.4), roughness: 0.92 });
  const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(w, h, d), mat, 0, h / 2, 0, false, true); g.add(b);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1, 1, 4, 1), M(0x2f353d, 0.8)); roof.scale.set(w * 0.7, 3, d * 0.7); roof.rotation.y = Math.PI / 4; roof.position.y = h + 1.5; g.add(roof);
  for (let i = 0; i < 3; i++) g.add(box(0.6, 1.6, 1.0, M(0x4a4440, 0.9), -w / 3 + i * w / 3, h + 3.2, 0));
  g.userData = { mat, onI: mode === 'candle' ? 1.5 : 1.4 };
  return g;
}

// ---------- SKYLINE: Paris seen from Jeanne's window, 6th floor ----------
export function skyline(scene, { variant }) {
  scene.background = grad([[0, '#03050b'], [0.55, '#0b1426'], [1, '#1c2a44']]);
  scene.fog = new THREE.Fog(0x0d1626, 320, 3200); scene.environmentIntensity = 0.03;
  seed(202);
  const blocks = [], lamps = [];
  const front = variant === 'restore' ? 'left' : 'right';         // which half is already dark (wave) / already lit (restore)
  const stateAt = (x) => {
    if (variant === 'candles') return 'candle';
    if (variant === 'wave') return x > 15 ? 'off' : 'on';           // the blackout sweeps in from the east (right)
    if (variant === 'restore') return x < -10 ? 'on' : 'off';       // light comes back from the west (left)
    return 'on';
  };
  for (let row = 0; row < 18; row++) {
    const z = -75 - row * 32 - rr(0, 6);
    for (let x = -330; x < 330; x += rr(20, 30)) {
      const w = rr(15, 24), d = rr(14, 20), h = rr(16, 22);
      const b = block(w, h, d, stateAt(x), Math.floor(rnd() * 5), pick(['#7d776c', '#857e70', '#736d63', '#8c8576']));
      b.position.set(x + w / 2, 0, z); b.userData.x = x; scene.add(b); blocks.push(b);
    }
    for (let x = -320; x < 320; x += 26) { const on = stateAt(x) === 'on'; const l = glow(0xffc27a, 5, x, 6, z + 12, on ? 0.75 : 0); scene.add(l); lamps.push({ l, x }); }
  }
  scene.add(ground(3000, M(0x080a10, 1)));
  for (let i = 0; i < 26; i++) { const t = new THREE.Group(); t.add(cyl(0.3, 0.45, 5, M(0x0c0d10, 1), 0, 2.5, 0, 6)); t.add(mesh(new THREE.IcosahedronGeometry(rr(3, 4.5), 1), M(0x0b0f0c, 1, 0, { flatShading: true }), 0, 7, 0, false, false)); t.position.set(rr(-60, 50), 0, rr(-55, -20)); scene.add(t); }
  // Eiffel Tower in the distance (lit unless the wave already reached it)
  const towerLit = variant === 'wave' || variant === 'restore';
  const tw = new THREE.Group(); tw.position.set(-120, 0, -980);
  const tm = towerLit ? new THREE.MeshStandardMaterial({ color: 0x3a2a14, emissive: 0xffa740, emissiveIntensity: 1.25, roughness: 0.8 }) : M(0x1a1b20, 0.9);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = mesh(new THREE.CylinderGeometry(2.2, 6, 120, 6), tm, sx * 28, 55, sz * 28, false, false); leg.rotation.z = sx * 0.36; leg.rotation.x = -sz * 0.36; tw.add(leg);
  }
  tw.add(mesh(new THREE.BoxGeometry(70, 4, 70), tm, 0, 58, 0, false, false));
  tw.add(mesh(new THREE.CylinderGeometry(3, 18, 120, 6), tm, 0, 170, 0, false, false));
  tw.add(mesh(new THREE.BoxGeometry(30, 3, 30), tm, 0, 115, 0, false, false));
  tw.add(mesh(new THREE.CylinderGeometry(1.2, 3, 70, 6), tm, 0, 265, 0, false, false));
  if (towerLit) { for (let i = 0; i < 70; i++) { const y = rr(10, 290), r = 30 * (1 - y / 300) + 3; tw.add(glow(0xfff1c8, rr(2, 5), rr(-r, r), y, rr(-r, r), 0.9)); } tw.add(glow(0xffb050, 160, 0, 120, 0, 0.22)); }
  scene.add(tw);
  // moon and stars
  scene.add(sph(14, new THREE.MeshBasicMaterial({ color: 0xe8ecf5, fog: false }), 260, 420, -1300, 32)); scene.add(glow(0xbcd0ff, 140, 260, 420, -1290, 0.35));
  scene.add(dust(1800, [-1500, 150, -1400, 1500, 900, -1350], 0xffffff, 3, 0.85));
  // Jeanne's French window: frame, mullions, iron railing, curtains (silhouettes in the foreground)
  const wood = M(0x171310, 0.8), iron = M(0x0c0c0e, 0.5, 0.6);
  const W = new THREE.Group(); W.position.set(0.2, 27, -1.3);
  for (const x of [-0.95, 0, 0.95]) W.add(box(0.09, 4.0, 0.08, wood, x, 0, 0));
  for (const y of [-0.45, 0.5, 1.5]) for (const x of [-0.48, 0.48]) W.add(box(0.95, 0.06, 0.06, wood, x, y, 0));
  W.add(box(2.2, 0.12, 0.12, wood, 0, -1.0, 0));
  for (let x = -1.0; x <= 1.0; x += 0.11) W.add(box(0.025, 0.9, 0.025, iron, x, -1.55, -0.35));
  W.add(box(2.2, 0.05, 0.05, iron, 0, -1.1, -0.35));
  for (const x of [-1.25, 1.25]) W.add(box(0.5, 4.2, 0.2, M(0x2a1416, 0.95), x, 0.2, 0.25));
  scene.add(W);
  const moon = new THREE.DirectionalLight(0x8ea8e0, 0.6); moon.position.set(260, 420, -1300); scene.add(moon);
  hemi(scene, 0x2a3a5e, 0x05060a, 0.5);
  const sparks = tw.children.filter(c => c.isSprite);
  const anim = [(t, dur) => {
    if (variant === 'candles') { blocks.forEach((b, i) => { b.userData.mat.emissiveIntensity = b.userData.onI * (0.45 + 0.9 * (flick(t * 0.9, i * 1.3) - 0.5) + 0.3); }); return; }
    const u = Math.min(1, t / dur);
    const xf = variant === 'wave' ? 380 - Math.pow(u, 1.1) * 680 : -380 + Math.pow(u, 0.85) * 720;   // position of the wave front
    for (const b of blocks) b.userData.mat.emissiveIntensity = b.userData.x + 10 < xf ? b.userData.onI : 0;
    for (const L of lamps) L.l.material.opacity = L.x < xf ? 0.75 : 0;
    const tOn = -120 < xf; if (tm.emissive) tm.emissiveIntensity = tOn ? 1.25 : 0;
    sparks.forEach((sp, i) => { sp.material.opacity = tOn ? (i === sparks.length - 1 ? 0.22 : 0.95 * flick(t * 2.3, i)) : 0; });
  }];
  return { blocks, lamps, tower: tw, anim };
}

// ---------- APARTMENT: Jeanne's living room (variants dark | cold | neighbor | restored) ----------
export function apartment(scene, { variant }) {
  const day = variant === 'neighbor' || variant === 'restored';
  scene.background = new THREE.Color(0x05070b); scene.environmentIntensity = day ? 0.22 : 0.03;
  const floorM = new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = ['#7a5536', '#6f4c30', '#835c3a', '#74512f'][(i + j * 3) % 4]; g.fillRect(j * w / 4 + (i % 2) * w / 8, i * h / 16, w / 4, h / 16); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * h / 16, w, 2); } }, [2, 2]), roughness: 0.55 });
  const wallM = new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#9aa58e'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(240,235,210,0.22)'; for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 * 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); } }, [5, 3]), roughness: 0.95 });
  scene.add(ground(14, floorM));
  // back wall (z=-2.5) with a window x∈[-1.5,-0.3], y∈[0.85,2.35]
  scene.add(box(1.0, 2.8, 0.12, wallM, -2.0, 1.4, -2.5)); scene.add(box(2.8, 2.8, 0.12, wallM, 1.1, 1.4, -2.5));
  scene.add(box(1.2, 0.85, 0.12, wallM, -0.9, 0.425, -2.5)); scene.add(box(1.2, 0.45, 0.12, wallM, -0.9, 2.575, -2.5));
  // right wall (x=2.5) with the entrance door z∈[0.15,1.1]
  scene.add(box(0.12, 2.8, 2.65, wallM, 2.5, 1.4, -1.175)); scene.add(box(0.12, 2.8, 1.4, wallM, 2.5, 1.4, 1.8)); scene.add(box(0.12, 0.7, 0.95, wallM, 2.5, 2.45, 0.625));
  scene.add(box(0.12, 2.8, 5.2, wallM, -2.5, 1.4, 0)); scene.add(box(5.2, 0.1, 5.2, M(0xd8d2c4, 0.95), 0, 2.82, 0));
  // window: frame + outside view (night city silhouette or grey day)
  const wood = M(0xe8e2d6, 0.7);
  for (const x of [-1.5, -0.9, -0.3]) scene.add(box(0.06, 1.5, 0.08, wood, x, 1.6, -2.5));
  for (const y of [0.85, 1.6, 2.35]) scene.add(box(1.25, 0.06, 0.08, wood, -0.9, y, -2.5));
  const outside = canvasTex(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); if (day) { gr.addColorStop(0, '#9aa7b4'); gr.addColorStop(1, '#c9ced2'); } else { gr.addColorStop(0, '#05070e'); gr.addColorStop(1, '#16223a'); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = day ? '#6f7680' : '#05060a';
    for (let x = 0; x < w; x += 70) { const bh = 180 + (x * 37 % 120); g.fillRect(x, h - bh, 64, bh); }
    if (variant === 'restored') { g.fillStyle = '#ffd08a'; for (let i = 0; i < 70; i++) g.fillRect((i * 53) % w, h - 30 - (i * 29) % 160, 7, 10); }
    if (!day) { g.fillStyle = '#e8ecf5'; g.beginPath(); g.arc(380, 110, 26, 0, 7); g.fill(); }
  });
  const view = mesh(new THREE.PlaneGeometry(2.6, 2.2), new THREE.MeshBasicMaterial({ map: outside }), -0.9, 1.6, -3.4, false, false); scene.add(view);
  for (const x of [-1.75, -0.05]) scene.add(box(0.35, 2.4, 0.12, M(0x6b2f2a, 0.95), x, 1.55, -2.38));
  // armchair + Jeanne
  const chairM = M(0x6b5a4a, 0.92);
  const ch = new THREE.Group(); ch.position.set(-0.85, 0, -1.2); ch.rotation.y = 0.4;
  ch.add(rbox(0.9, 0.45, 0.85, 0.08, chairM, 0, 0.25, 0)); ch.add(rbox(0.9, 0.85, 0.2, 0.08, chairM, 0, 0.75, -0.36));
  for (const s of [-1, 1]) ch.add(rbox(0.18, 0.3, 0.85, 0.06, chairM, 0.4 * s, 0.6, 0));
  castAll(ch); scene.add(ch);
  let jeanne = null, yanis = null;
  if (variant !== 'restored') {
    const look = variant === 'neighbor' ? [0.05, 0.9, 0] : variant === 'cold' ? [0.12, 0.1, 0] : [0.05, 0, 0];
    jeanne = person({ ...JEANNE, ...SIT, lsh: [-0.55, 0.1], rsh: [-0.55, -0.1], lel: -0.9, rel: -0.9, neck: look, spine: 0.08 });
    jeanne.position.set(0, -0.42, 0.02); ch.add(jeanne);
    if (variant === 'cold') {
      const plaid = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#7d3b30'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(230,200,150,0.55)'; for (let i = 0; i < w; i += 32) { g.fillRect(i, 0, 6, h); g.fillRect(0, i, w, 6); } }, [2, 2]), roughness: 1 });
      ch.add(rbox(0.75, 0.28, 0.6, 0.1, plaid, 0, 0.62, 0.12)); ch.add(rbox(0.56, 0.3, 0.22, 0.1, plaid, 0, 1.02, -0.1));
    }
  }
  // round side table with a candle
  scene.add(cyl(0.27, 0.27, 0.04, M(0x4a3020, 0.6), -0.05, 0.6, -1.65, 28)); scene.add(cyl(0.03, 0.05, 0.58, M(0x4a3020, 0.6), -0.05, 0.3, -1.65, 10));
  scene.add(box(0.14, 0.18, 0.02, M(0x2a2018, 0.6), 0.05, 0.71, -1.74));
  const candleOn = variant === 'cold' || variant === 'dark';
  scene.add(cyl(0.025, 0.025, 0.13, M(0xf2ead8, 0.6), -0.12, 0.69, -1.58, 12));
  let candle = null;
  if (variant === 'cold') { const fl = sph(0.016, E(0xffb347, 6), -0.12, 0.77, -1.58, 10); fl.scale.set(1, 1.8, 1); scene.add(fl); const li = point(scene, 0xff9a40, 2.2, 5, -0.12, 0.82, -1.58, true); const gl = glow(0xffa040, 0.25, -0.12, 0.78, -1.58, 0.8); scene.add(gl); candle = { fl, li, gl }; }
  // TV on a cabinet (off), bookshelf, rug
  scene.add(rbox(1.2, 0.5, 0.42, 0.03, M(0x3a2a20, 0.6), 2.15, 0.25, -1.4)).children;
  const tv = rbox(0.06, 0.62, 1.0, 0.02, M(0x08090b, 0.15, 0.3), 2.2, 0.85, -1.4); scene.add(tv);
  const tvScreen = mesh(new THREE.PlaneGeometry(0.92, 0.55), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x7fa8e8, emissiveIntensity: 0, roughness: 0.3 }), 2.165, 0.85, -1.4, false, false); tvScreen.rotation.y = -Math.PI / 2; scene.add(tvScreen);
  const tvLight = variant === 'dark' ? point(scene, 0x7fa8e8, 0, 4, 1.7, 0.95, -1.4) : null;
  const shelf = new THREE.Group(); shelf.position.set(-2.3, 0, 0.6);
  shelf.add(box(0.32, 2.0, 1.3, M(0x4a3426, 0.7), 0, 1.0, 0));
  seed(31); for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) shelf.add(box(0.22, rr(0.22, 0.32), 0.1, M(pick([0x7a2e2e, 0x2f4a6d, 0x3f5d3a, 0xc49a3a, 0xd9d2c3, 0x5a3a6a]), 0.8), 0.06, 0.25 + r * 0.48 + 0.14, -0.55 + k * 0.13));
  castAll(shelf); scene.add(shelf);
  const rug = mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshStandardMaterial({ map: canvasTex(128, 96, (g, w, h) => { g.fillStyle = '#5a2a2e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a46a'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16); g.strokeRect(20, 20, w - 40, h - 40); }), roughness: 1 }), -0.4, 0.012, -0.7, false, true); rug.rotation.x = -Math.PI / 2; scene.add(rug);
  // dining table and two chairs (used in 'restored')
  const tbl = new THREE.Group(); tbl.position.set(1.0, 0, 0.9);
  tbl.add(cyl(0.48, 0.48, 0.04, M(0x5a3a26, 0.55), 0, 0.75, 0, 32)); tbl.add(cyl(0.05, 0.08, 0.74, M(0x5a3a26, 0.55), 0, 0.37, 0, 12));
  const chair = (x, ry) => { const c = new THREE.Group(); c.position.set(x, 0, 0); c.rotation.y = ry; c.add(rbox(0.44, 0.05, 0.44, 0.02, M(0x5a3a26, 0.6), 0, 0.46, 0)); c.add(rbox(0.44, 0.5, 0.04, 0.02, M(0x5a3a26, 0.6), 0, 0.72, -0.2)); for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.add(cyl(0.02, 0.02, 0.46, M(0x5a3a26, 0.6), a, 0.23, b, 6)); return c; };
  const c1 = chair(-0.75, Math.PI / 2), c2 = chair(0.75, -Math.PI / 2); tbl.add(c1); tbl.add(c2);
  castAll(tbl); scene.add(tbl);
  if (variant === 'restored') {
    const j = person({ ...JEANNE, ...SIT, lsh: [-0.9, 0.1], rsh: [-1.0, -0.1], lel: -0.7, rel: -0.8, neck: [0.05, 0, 0] }); j.position.set(1.0 - 0.7, -0.46, 0.9); j.rotation.y = Math.PI / 2; scene.add(j); jeanne = j;
    const y2 = person({ ...YANIS, ...SIT, lsh: [-0.9, 0.1], rsh: [-1.0, -0.1], lel: -0.7, rel: -0.8, mouth: 'open' }); y2.position.set(1.0 + 0.7, -0.46, 0.9); y2.rotation.y = -Math.PI / 2; scene.add(y2); yanis = y2;
    for (const x of [-0.22, 0.22]) { scene.add(cyl(0.04, 0.035, 0.08, M(0xf3efe6, 0.4), 1.0 + x, 0.81, 0.9, 16)); scene.add(cyl(0.035, 0.035, 0.005, M(0x3a2010, 0.3), 1.0 + x, 0.85, 0.9, 16)); }
    scene.add(cyl(0.06, 0.08, 0.2, M(0x8a8f94, 0.3, 0.8), 1.0, 0.87, 1.1, 16));
  }
  // entrance door: closed, or open with Yanis bringing water
  const doorM = M(0x5a4030, 0.6);
  if (variant === 'neighbor') {
    var hinge = new THREE.Group(); hinge.position.set(2.45, 0, 1.09); scene.add(hinge); hinge.add(box(0.05, 2.08, 0.93, doorM, 0, 1.04, -0.465)); hinge.rotation.y = 1.25;
    scene.add(box(2.0, 2.8, 0.12, M(0x2a2a2c, 0.9), 3.6, 1.4, -0.4)); scene.add(box(2.0, 2.8, 0.12, M(0x2a2a2c, 0.9), 3.6, 1.4, 1.65)); scene.add(box(0.12, 2.8, 2.2, M(0x232325, 0.9), 4.6, 1.4, 0.6));
    var YG = new THREE.Group(); YG.position.x = 0.35; scene.add(YG);   // starts back in the landing so nothing pokes through the closed door
    const y = person({ ...YANIS, lsh: [-1.0, 0.25], lel: -0.6, rsh: [-0.9, -0.2], rel: -0.7, neck: [0.1, -0.2, 0] }); y.position.set(2.85, 0, 0.62); y.rotation.y = -Math.PI / 2 - 0.2; YG.add(y); yanis = y;
    const pack = new THREE.Group(); pack.position.set(2.45, 0.98, 0.42);
    for (let i = 0; i < 6; i++) pack.add(cyl(0.045, 0.045, 0.3, glass(0x9fc8e8, 0.55), (i % 3) * 0.1 - 0.1, 0, Math.floor(i / 3) * 0.1 - 0.05, 12));
    pack.add(box(0.33, 0.12, 0.22, M(0x2f6fb0, 0.7), 0, -0.05, 0)); YG.add(pack);
    YG.add(cyl(0.025, 0.03, 0.18, M(0x222222, 0.5), 2.5, 1.08, 0.86, 10));
    const fl = spot(scene, 0xf2f6ff, 14, 2.45, 1.1, 0.85, -0.6, 0.9, -1.1, 0.35, 0.5, true, 9); YG.add(fl); YG.add(fl.target);
    const beam = shaft(2.45, 1.1, 0.85, 3.4, 0.03, 0.6, 0xdfe8ff, 0.05, 0, 0); beam.rotation.set(-1.2, 0, 1.0); YG.add(beam);
  } else { scene.add(box(0.06, 2.08, 0.93, doorM, 2.45, 1.04, 0.625)); }
  // ceiling pendant
  scene.add(cyl(0.01, 0.01, 0.4, M(0x222222, 0.5), 0, 2.6, -0.4, 6));
  const shadeOn = variant === 'restored';
  const shadeMat = new THREE.MeshStandardMaterial({ color: shadeOn ? 0xf3e3c3 : 0xd8cfbf, emissive: 0xffc27a, emissiveIntensity: shadeOn ? 0.6 : 0, side: THREE.DoubleSide, roughness: 0.9 });
  scene.add(mesh(new THREE.CylinderGeometry(0.12, 0.28, 0.22, 24, 1, true), shadeMat, 0, 2.32, -0.4));
  const lampLight = variant === 'dark' ? point(scene, 0xffc27a, 0, 8, 0, 2.2, -0.4) : null;
  // lighting per variant
  if (variant === 'dark') { hemi(scene, 0x3d4f80, 0x0a0806, 0.2); spot(scene, 0x8ea8ff, 30, -0.9, 2.4, -4.2, -0.6, 0.6, -0.8, 0.5, 0.5, true, 12); }
  if (variant === 'cold') { hemi(scene, 0x2d3b60, 0x0a0806, 0.12); spot(scene, 0x8ea8ff, 10, -0.9, 2.4, -4.2, -0.6, 0.6, -0.8, 0.5, 0.5, false, 12); }
  if (variant === 'neighbor') { hemi(scene, 0xc5cfd8, 0x4a4036, 0.7); spot(scene, 0xdfe6ee, 30, -0.9, 2.2, -4.6, -0.3, 0.4, 0.0, 0.6, 0.6, true, 14); point(scene, 0xcfd8e0, 4, 6, 3.6, 2.2, 0.6); }
  if (variant === 'restored') { hemi(scene, 0xe7dcc8, 0x4a3a2a, 0.55); point(scene, 0xffc27a, 5.5, 8, 0, 2.2, -0.4, true); spot(scene, 0xffd9b0, 10, -0.9, 2.2, -4.6, 0.6, 0.6, 0.6, 0.6, 0.6, true, 14); }
  scene.add(dust(120, [-2, 0.3, -2.2, 2, 2.4, 1.5], day ? 0xfff2d8 : 0xbcd0ff, 0.012, 0.35));
  const puffs = [];
  if (variant === 'cold') for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0, depthWrite: false })); scene.add(m); puffs.push(m); }
  const pj = jeanne, py = yanis, anim = [];
  if (variant === 'dark') anim.push((t) => {   // the TV and the ceiling light die at 19:42
    const on = t < 0.38, k2 = t > 0.24 && t < 0.38 ? (Math.sin(t * 95) > 0 ? 1 : 0.15) : 1;
    tvScreen.material.emissiveIntensity = on ? 0.9 * k2 * (0.8 + 0.2 * flick(t * 2)) : 0; tvLight.intensity = on ? 1.8 * k2 : 0;
    lampLight.intensity = on ? 3.5 * k2 : 0; shadeMat.emissiveIntensity = on ? 0.6 * k2 : 0;
    animPerson(pj, t, { breath: 1, look: 0.3, nod: 0.4 });
    const R = pj.userData.rig, k = ease((t - 0.45) / 1.6);
    R.head.rotation.y += 0.95 * (1 - k) - 0.25 * k; R.head.rotation.x += -0.16 * k;
  });
  if (variant === 'cold') anim.push((t) => {
    const f = flick(t * 1.3, 2); candle.fl.scale.set(1, 1.5 + 0.5 * f, 1); candle.li.intensity = 1.7 + 1.0 * f; candle.gl.material.opacity = 0.55 + 0.35 * f;
    animPerson(pj, t, { breath: 1.6, look: 0.35, nod: 0.6, sway: 0.5 });
    puffs.forEach((m, i) => { const c = ((t + i * 0.73) % 2.2) / 2.2; m.position.set(-0.78 + c * 0.1, 1.31 + c * 0.12, -1.0 + c * 0.17); m.scale.setScalar(0.6 + c * 1.8); m.material.opacity = c < 0.15 ? (c / 0.15) * 0.3 : 0.3 * (1 - (c - 0.15) / 0.85); });
  });
  if (variant === 'neighbor') anim.push((t) => {   // the door opens, Yanis walks in with the water
    hinge.rotation.y = 1.25 * ease(t / 0.7);
    const k = ease((t - 0.45) / 2.4); YG.position.x = 0.35 - 1.15 * k;
    animPerson(py, t, { walk: k > 0.02 && k < 0.98 ? 1.5 : 0, stride: 0.33, armSwing: 0, look: 0.3, phase: 1 });
    animPerson(pj, t, { breath: 1, look: 0.15 });
    pj.userData.rig.head.rotation.y += -0.9 + 0.9 * ease(t / 1.4);
  });
  if (variant === 'restored') anim.push((t) => {
    animPerson(pj, t, { breath: 1, talk: 0.5, nod: 1.2, look: 0.25, phase: 0 });
    animPerson(py, t, { breath: 1, talk: 1.0, nod: 1.0, look: 0.25, phase: 2 });
    py.userData.rig.torso.rotation.x += Math.sin(t * 14) * 0.035 * Math.max(0, Math.sin(t * 1.1));
  });
  return { jeanne, yanis, tv, anim };
}

// ---------- cars ----------
export function car(o = {}) {
  const g = new THREE.Group(); const body = M(o.color ?? 0x8a1f1f, 0.35, 0.35), dark = M(0x151619, 0.7);
  g.add(rbox(4.2, 0.72, 1.82, 0.22, body, 0, 0.68, 0));
  g.add(rbox(2.3, 0.62, 1.64, 0.24, glass(0x1d2530, 0.85), -0.25, 1.32, 0));
  g.add(rbox(2.0, 0.08, 1.5, 0.04, body, -0.3, 1.64, 0));
  for (const x of [1.35, -1.35]) for (const s of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18), dark, x, 0.34, 0.84 * s); w.rotation.x = Math.PI / 2; g.add(w); }
  for (const s of [-1, 1]) { g.add(box(0.06, 0.13, 0.34, o.lights ? E(0xfff3d6, 5) : M(0xd9dde0, 0.2, 0.6), 2.1, 0.76, 0.6 * s)); g.add(box(0.06, 0.12, 0.3, o.lights ? E(0xff2a1a, 3) : M(0x7a1a14, 0.4), -2.1, 0.8, 0.62 * s)); }
  castAll(g); return g;
}
function trafficLight(x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const p = M(0x23262a, 0.5, 0.5);
  g.add(cyl(0.07, 0.09, 3.2, p, 0, 1.6, 0, 10)); g.add(rbox(0.36, 1.0, 0.3, 0.05, M(0x1a1c1f, 0.6), 0, 3.5, 0));
  for (let i = 0; i < 3; i++) { const d = mesh(new THREE.CircleGeometry(0.1, 20), M(0x2b2d31, 0.3), 0, 3.82 - i * 0.32, 0.152); g.add(d); }
  castAll(g); return g;
}
function dayBlock(w, h, d, wall) {
  const t = canvasTex(256, 384, (g, W, H) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H); const cols = 5, rows = 6, cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { g.fillStyle = '#2a3036'; g.fillRect(c * cw + cw * 0.3, r * rh + rh * 0.2, cw * 0.4, rh * 0.6); g.fillStyle = '#2f5e46'; g.fillRect(c * cw + cw * 0.16, r * rh + rh * 0.2, cw * 0.12, rh * 0.6); g.fillRect(c * cw + cw * 0.72, r * rh + rh * 0.2, cw * 0.12, rh * 0.6); if (r > 0) { g.fillStyle = 'rgba(30,30,30,0.8)'; g.fillRect(c * cw + cw * 0.2, r * rh + rh * 0.8, cw * 0.6, rh * 0.05); } }
  });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(w / 12)), 1);
  const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), 0, h / 2, 0));
  g.add(box(w + 0.4, 0.5, d + 0.4, M(0xd8cfc0, 0.9), 0, h + 0.25, 0)); castAll(g); return g;
}

// ---------- CROSSROADS: Paris at night (blackout) | Spanish street by day (28 April 2025) ----------
export function crossroads(scene, { variant }) {
  const day = variant === 'day';
  scene.background = day ? grad([[0, '#5f95d6'], [1, '#cfe3f2']]) : new THREE.Color(0x05070c);
  scene.fog = day ? new THREE.Fog(0xd6e2ea, 70, 260) : new THREE.Fog(0x0c111b, 14, 95);
  scene.environmentIntensity = day ? 0.35 : 0.03;
  scene.add(ground(400, M(day ? 0x4a4a4c : 0x1c1e22, day ? 0.85 : 0.35, 0.05)));
  const walk = M(day ? 0xb9b2a6 : 0x3a3a3c, 0.9);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) scene.add(box(60, 0.16, 60, walk, sx * 36, 0.08, sz * 36));
  const white = M(day ? 0xf2f2ee : 0x9a9a9a, 0.6);
  for (const [axis, off] of [['x', 7.4], ['x', -7.4], ['z', 7.4], ['z', -7.4]]) for (let k = -5; k <= 5; k++) { const b = axis === 'x' ? box(0.5, 0.02, 2.4, white, k * 1.0, 0.02, off) : box(2.4, 0.02, 0.5, white, off, 0.02, k * 1.0); b.castShadow = false; scene.add(b); }
  seed(77);
  const mk = (x, z, w, d, h) => { const b = day ? dayBlock(w, h, d, pick(['#efe6d6', '#e8d2a8', '#f3eee4', '#d9b98a'])) : block(w, h, d, 'off', Math.floor(rnd() * 5), pick(['#5d5850', '#66615a'])); b.position.set(x, 0.16, z); scene.add(b); };
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { mk(sx * 22, sz * 22, 26, 26, day ? rr(16, 20) : rr(18, 22)); mk(sx * 22, sz * 58, 26, 30, rr(16, 22)); mk(sx * 58, sz * 22, 30, 26, rr(16, 22)); }
  for (const [x, z, r] of [[7.6, 7.6, Math.PI * 0.75], [-7.6, 7.6, -Math.PI * 0.75], [7.6, -7.6, Math.PI * 0.25], [-7.6, -7.6, -Math.PI * 0.25]]) scene.add(trafficLight(x, z, r));
  const cars = [];
  const colors = [0x8a1f1f, 0x2f4a6d, 0xd9d9d6, 0x1d1d1f, 0x6b6f74, 0x3f5d3a, 0xb8862a];
  const layout = day ? [[2.8, 18, Math.PI / 2], [2.8, 25, Math.PI / 2], [-2.8, -16, -Math.PI / 2], [17, -2.8, Math.PI], [25, -2.8, Math.PI], [-18, 2.8, 0]] :
    [[1.8, 3.0, Math.PI / 2 + 0.5], [-3.2, -1.0, 0.25], [4.5, -3.5, Math.PI - 0.3], [-1.5, 8.5, -Math.PI / 2 + 0.2], [9.5, 1.8, Math.PI + 0.15], [-10, -2.6, 0], [2.6, -12, -Math.PI / 2]];
  layout.forEach(([x, z, ry], i) => { const c = car({ color: colors[i % colors.length], lights: !day }); c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c); cars.push(c);
    if (!day && i < 4) { const dir = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)); spot(scene, 0xfff1d0, 30, x + dir.x * 2.2, 0.8, z + dir.z * 2.2, x + dir.x * 12, 0, z + dir.z * 12, 0.45, 0.6, i < 2, 26); scene.add(shaft(x + dir.x * 2.2, 0.8, z + dir.z * 2.2, 9, 0.2, 1.6, 0xfff1d0, 0.03, 0, 0)).children; }
  });
  const anim = [];
  if (day) {
    const cop = person({ skin: 0xd8a37a, hair: 0x2b1d14, top: 0xd4dc32, pants: 0x1f2a44, shoes: 0x111111, hat: 'cap', hatColor: 0x1f2a44, rsh: [-2.9, -0.2], rel: -0.2, lsh: [-1.2, 0.3], lel: -0.4 }); cop.position.set(0.5, 0, 0.5); cop.rotation.y = 0.8; scene.add(cop);
    const walkers = [];
    for (let k = 0; k < 9; k++) {   // pedestrians crossing on the zebra crossings, in front of the camera
      const dir = k % 2 ? 1 : -1, onZ = k < 5;
      const p = person(randPerson({ skin: pick([0xe0ac86, 0xc98e66, 0xf1c6a5]) }));
      if (onZ) { p.position.set(-dir * rr(3, 7), 0.02, 7.4 + rr(-0.8, 0.8)); p.rotation.y = dir * Math.PI / 2; } else { p.position.set(7.4 + rr(-0.8, 0.8), 0.02, -dir * rr(2, 6)); p.rotation.y = dir > 0 ? 0 : Math.PI; }
      scene.add(p); walkers.push({ p, x0: p.position.x, z0: p.position.z, sp: rr(0.9, 1.4), ph: rr(0, 6) });
    }
    sun(scene, { pos: [40, 60, 30], color: 0xfff1d6, intensity: 2.8, size: 45, far: 200 }); hemi(scene, 0xbcd6f0, 0x6a5e50, 0.6);
    const c2 = cars[2], c2z = c2.position.z;   // the far car rolls up and stops before the empty far crossing (the near ones carry pedestrians)
    anim.push((t) => {
      animPerson(cop, t, { wave: true, look: 0.6 }); cop.rotation.y = 0.8 + Math.sin(t * 0.6) * 0.25;
      for (const w of walkers) { const d = w.sp * t; w.p.position.x = w.x0 + Math.sin(w.p.rotation.y) * d; w.p.position.z = w.z0 + Math.cos(w.p.rotation.y) * d; animPerson(w.p, t, { walk: w.sp * 1.15, phase: w.ph, look: 0.3 }); }
      c2.position.z = c2z + 4.7 * ease((t - 0.6) / 3.2);
    });
  } else {
    const PG = new THREE.Group(); scene.add(PG);
    // a pedestrian lights the far crossing with a phone, between the stuck cars (in frame, clear of the counter and the subtitle)
    const p = person(randPerson({ coat: true, rsh: [-1.3, -0.1], rel: -0.9 })); p.position.set(3.0, 0.02, -7.4); p.rotation.y = -Math.PI / 2; PG.add(p);
    const ph = box(0.01, 0.13, 0.07, E(0xffffff, 6), 2.6, 1.32, -7.45); PG.add(ph); PG.add(point(scene, 0xe8efff, 3, 6, 2.45, 1.35, -7.45));
    hemi(scene, 0x243150, 0x05060a, 0.25); const moon = new THREE.DirectionalLight(0x7f9ccc, 0.25); moon.position.set(-30, 60, -20); scene.add(moon);
    const c4 = cars[4], c4x = c4.position.x, c4z = c4.position.z, r4 = c4.rotation.y;
    anim.push((t) => {
      PG.position.set(-0.95 * t, 0, 0);
      animPerson(p, t, { walk: 1.0, stride: 0.35, armSwing: 0.2, look: 0.5, phase: 0.5 });
      const k = 1.4 * ease(t / 4); c4.position.set(c4x + Math.cos(r4) * k, 0, c4z - Math.sin(r4) * k);
    });
  }
  return { cars, anim };
}

// ---------- METRO: a train stopped in the tunnel, emergency lighting ----------
export function metro(scene) {
  scene.background = new THREE.Color(0x020306); scene.environmentIntensity = 0.03;
  const L = 18, W = 2.7, H = 2.3;
  scene.add(box(W, 0.1, L, M(0x4a4d52, 0.8), 0, -0.05, -L / 2 + 2));
  scene.add(box(W, 0.08, L, M(0xd6d2c8, 0.7), 0, H, -L / 2 + 2));
  const wallM = M(0xcfc8b6, 0.75);
  for (const s of [-1, 1]) {
    scene.add(box(0.08, 0.95, L, wallM, s * W / 2, 0.475, -L / 2 + 2)); scene.add(box(0.08, 0.45, L, wallM, s * W / 2, H - 0.225, -L / 2 + 2));
    const g = box(0.02, 0.9, L, glass(0x0a0d12, 0.85), s * W / 2, 1.4, -L / 2 + 2); g.castShadow = false; scene.add(g);
    for (let z = 1.5; z > -L + 2; z -= 2.2) { scene.add(box(0.1, 0.9, 0.12, wallM, s * W / 2, 1.4, z)); scene.add(glow(0x5f6f8a, 1.2, s * (W / 2 + 1.4), 1.6, z - 1.1, 0.25)); }
  }
  const seatM = M(0x2c4f8a, 0.9), steel = M(0xc9ced2, 0.25, 0.9);
  for (let z = 0.5; z > -L + 3; z -= 3.0) for (const s of [-1, 1]) {
    for (const dz of [0, -1.15]) { scene.add(rbox(0.5, 0.12, 0.95, 0.04, seatM, s * (W / 2 - 0.35), 0.46, z + dz - 0.2)); scene.add(rbox(0.12, 0.55, 0.95, 0.04, seatM, s * (W / 2 - 0.12), 0.78, z + dz - 0.2)); }
    scene.add(cyl(0.025, 0.025, H, steel, s * 0.55, H / 2, z - 0.8, 10));
  }
  const strips = [], people = [], phones = [];
  for (let z = 1; z > -L + 2; z -= 3) { const st = box(0.16, 0.03, 1.2, E(0x7f9cff, 0.7), 0, H - 0.04, z); scene.add(st); strips.push(st); point(scene, 0x7f95d6, 0.55, 4.5, 0, H - 0.2, z); }
  seed(88);
  const spots = [[-0.9, -1.0, 'sit'], [0.9, -2.2, 'sit'], [-0.9, -4.2, 'sit'], [0.3, -3.2, 'stand'], [-0.3, -6.0, 'stand'], [0.9, -7.2, 'sit'], [-0.9, -9.6, 'sit'], [0.4, -9.0, 'stand'], [0.9, -11.2, 'sit'], [-0.2, -12.5, 'stand']];
  spots.forEach(([x, z, k], i) => {
    const sit = k === 'sit'; const p = person(randPerson({ coat: rnd() < 0.5, ...(sit ? SIT : {}), rsh: [-1.1, -0.1], rel: -1.0, neck: [0.35, 0, 0] }));
    p.position.set(x, sit ? -0.46 : 0, z); p.rotation.y = sit ? (x < 0 ? Math.PI / 2 : -Math.PI / 2) : rr(-0.6, 0.6) + Math.PI; scene.add(p); people.push({ p, sit, ph: i * 1.7 });
    if (i % 2 === 0 || !sit) { const fx = x + (sit ? (x < 0 ? 0.35 : -0.35) : 0), fz = z + (sit ? 0 : -0.35), fy = sit ? 0.82 : 1.25; scene.add(box(0.07, 0.01, 0.13, E(0xf4f8ff, 2), fx, fy, fz)); phones.push(point(scene, 0xeaf0ff, 0.7, 3, fx, fy + 0.15, fz)); }
  });
  hemi(scene, 0x1c2438, 0x020304, 0.3);
  const anim = [(t) => {
    strips.forEach((m, i) => { m.material.emissiveIntensity = 0.7 * (0.85 + 0.15 * flick(t * 0.6, i)); });
    people.forEach(({ p, sit, ph }) => animPerson(p, t, sit ? { breath: 1, nod: 0.6, look: 0.4, phase: ph } : { breath: 1, sway: 2.5, look: 0.6, phase: ph }));
    phones.forEach((L, i) => { L.intensity = 0.7 * (0.9 + 0.1 * flick(t, i)); });
  }];
  return { anim };
}

// ---------- PHONE: Jeanne's phone, no network ----------
function screenTex(mode = 'failed') {
  return canvasTex(512, 1100, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#24324a'); gr.addColorStop(1, '#0d121b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.font = '600 30px Inter'; g.textAlign = 'left'; g.fillText('Aucun service', 36, 62);
    g.textAlign = 'right'; g.fillText('41 %', w - 36, 62);
    g.textAlign = 'center'; g.font = '600 150px Inter'; g.fillText('20:12', w / 2, 330);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.roundRect(40, 520, w - 80, 220, 34); g.fill();
    g.fillStyle = '#ffffff'; g.font = '700 34px Inter'; g.fillText(mode === 'calling' ? 'Nathalie' : 'Appel impossible', w / 2, 600);
    g.font = '600 30px Inter'; g.fillStyle = 'rgba(255,255,255,0.82)'; g.fillText(mode === 'calling' ? 'Appel en cours…' : 'Aucun réseau mobile', w / 2, 660);
  });
}
export function phone(scene) {
  scene.background = new THREE.Color(0x050608); scene.environmentIntensity = 0.02;
  scene.add(box(3, 0.05, 2, M(0x3b2618, 0.55), 0, 0.725, -0.4));
  const cand = new THREE.Group(); cand.position.set(-0.28, 0.75, -0.55);
  cand.add(cyl(0.03, 0.03, 0.16, M(0xf2ead8, 0.6), 0, 0.08, 0, 12)); const fl = sph(0.018, E(0xffb347, 8), 0, 0.18, 0, 10); fl.scale.set(1, 1.8, 1); cand.add(fl); cand.add(glow(0xffa040, 0.16, 0, 0.18, 0, 0.5));
  scene.add(cand); point(scene, 0xff9a40, 0.9, 4, -0.28, 0.95, -0.55, true);
  const ph = new THREE.Group(); ph.position.set(0.0, 0.86, 0.0); ph.rotation.set(-0.95, 0.12, 0.05);
  ph.add(rbox(0.076, 0.158, 0.009, 0.006, M(0x111214, 0.3, 0.6), 0, 0, 0));
  const scr = mesh(new THREE.PlaneGeometry(0.069, 0.149), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screenTex('failed'), emissiveIntensity: 0.42, roughness: 0.2 }), 0, 0, 0.0047, false, false); ph.add(scr);
  const skin = M(JEANNE.skin, 0.55);
  ph.add(rbox(0.09, 0.1, 0.03, 0.012, skin, 0.004, -0.045, -0.02));
  for (let i = 0; i < 4; i++) { const f = mesh(new THREE.CapsuleGeometry(0.0085, 0.045, 4, 8), skin, -0.046, 0.03 - i * 0.022, -0.004); f.rotation.z = 0.25; ph.add(f); }
  const th = mesh(new THREE.CapsuleGeometry(0.01, 0.05, 4, 8), skin, 0.05, -0.02, 0.006); th.rotation.z = -0.6; ph.add(th);
  const sleeve = mesh(new THREE.CapsuleGeometry(0.035, 0.12, 4, 12), M(JEANNE.top, 0.85), 0.01, -0.13, -0.03); ph.add(sleeve);
  scene.add(ph);
  hemi(scene, 0x1a2030, 0x050403, 0.15);
  const texCall = screenTex('calling'), texFail = scr.material.emissiveMap;
  const anim = [(t) => {
    const failed = t > 1.5; const want = failed ? texFail : texCall; if (scr.material.emissiveMap !== want) { scr.material.emissiveMap = want; scr.material.needsUpdate = true; }
    ph.rotation.set(-0.95 + Math.sin(t * 2.1) * 0.012 + (flick(t * 3, 1) - 0.5) * 0.012, 0.12 + Math.sin(t * 1.3) * 0.015, 0.05 + Math.sin(t * 1.7) * 0.01);
    const f = flick(t * 1.2, 3); fl.scale.set(1, 1.5 + 0.5 * f, 1);
  }];
  return { anim };
}

// ---------- KITCHEN: last drop from the tap | the fridge after 48 h ----------
export function kitchen(scene, { variant }) {
  scene.background = new THREE.Color(0x040507); scene.environmentIntensity = 0.03;
  const tiles = new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d9d6cc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,115,100,0.6)'; g.lineWidth = 3; for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }, [6, 3]), roughness: 0.35 });
  scene.add(box(6, 2.8, 0.1, tiles, 0, 1.4, -0.75)); scene.add(ground(10, M(0x5b5450, 0.4)));
  scene.add(box(3.2, 0.9, 0.62, M(0x46505a, 0.6), 0, 0.45, -0.42));
  scene.add(box(3.24, 0.05, 0.66, M(0x2a2a2c, 0.35, 0.1), 0, 0.925, -0.42));
  scene.add(box(0.6, 0.02, 0.42, M(0x9aa0a4, 0.25, 0.9), 0, 0.94, -0.45)); scene.add(box(0.54, 0.02, 0.36, M(0x3a3e42, 0.3, 0.9), 0, 0.945, -0.45));
  const chrome = M(0xd0d4d8, 0.15, 1.0);
  scene.add(cyl(0.03, 0.035, 0.05, chrome, 0, 0.97, -0.7, 16)); scene.add(cyl(0.016, 0.016, 0.3, chrome, 0, 1.12, -0.7, 12));
  const spout = mesh(new THREE.TorusGeometry(0.11, 0.016, 12, 24, Math.PI), chrome, 0, 1.27, -0.59); spout.rotation.y = Math.PI / 2; scene.add(spout);
  scene.add(cyl(0.012, 0.016, 0.06, chrome, 0, 1.24, -0.48, 12)); scene.add(box(0.1, 0.012, 0.025, chrome, 0.05, 1.3, -0.7));
  const drop = sph(0.007, glass(0xcfe8ff, 0.7), 0, 1.185, -0.48, 12); drop.scale.set(1, 1.5, 1); scene.add(drop);
  scene.add(mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.11, 20, 1, true), glass(0xe8f2ff, 0.3), 0, 1.0, -0.48));
  scene.add(cyl(0.031, 0.031, 0.012, glass(0x9fd0ff, 0.6), 0, 0.957, -0.48, 20));
  const cand = new THREE.Group(); cand.position.set(-0.8, 0.95, -0.45);
  cand.add(cyl(0.028, 0.028, 0.14, M(0xf2ead8, 0.6), 0, 0.07, 0, 12)); const fl = sph(0.016, E(0xffb347, 8), 0, 0.16, 0, 10); fl.scale.set(1, 1.8, 1); cand.add(fl); cand.add(glow(0xffa040, 0.16, 0, 0.16, 0, 0.6));
  scene.add(cand); const cl = point(scene, 0xff9a40, 0.75, 5, -0.8, 1.15, -0.45, true); const cg = cand.children[cand.children.length - 1];
  const ring = mesh(new THREE.TorusGeometry(0.01, 0.0015, 6, 24), glass(0xe8f4ff, 0.7), 0, 0.964, -0.48, false, false); ring.rotation.x = Math.PI / 2; ring.visible = false; scene.add(ring);
  const drips = []; let fs = null;
  if (variant === 'fridge') {
    const fr = new THREE.Group(); fr.position.set(1.0, 0, -0.35);
    const white = M(0xe6e8ea, 0.35, 0.1);
    fr.add(box(0.72, 1.85, 0.05, white, 0, 0.925, -0.33)); for (const s of [-1, 1]) fr.add(box(0.05, 1.85, 0.68, white, s * 0.335, 0.925, 0)); fr.add(box(0.72, 0.05, 0.68, white, 0, 1.83, 0)); fr.add(box(0.72, 0.05, 0.68, white, 0, 0.02, 0));
    fr.add(box(0.62, 0.03, 0.6, white, 0, 1.4, 0));
    for (const y of [0.45, 0.8, 1.1]) fr.add(box(0.62, 0.01, 0.58, glass(0xe0f0ff, 0.4), 0, y, 0));
    seed(9); for (let i = 0; i < 12; i++) fr.add(box(rr(0.08, 0.16), rr(0.06, 0.18), rr(0.08, 0.14), M(pick([0xd94b3d, 0xf2e2c4, 0x5aa65a, 0xf0b23a, 0xffffff, 0x7a4fb0]), 0.6), rr(-0.22, 0.22), [0.5, 0.85, 1.15][i % 3] + 0.06, rr(-0.2, 0.2)));
    const door = new THREE.Group(); door.position.set(0.36, 0, 0.34); door.rotation.y = -1.9;
    door.add(box(0.72, 1.85, 0.06, white, 0.36, 0.925, 0)); for (const y of [0.5, 0.95, 1.4]) door.add(box(0.62, 0.1, 0.1, white, 0.36, y, 0.08));
    for (let i = 0; i < 4; i++) door.add(cyl(0.035, 0.035, 0.24, glass(0x9fd0a0, 0.6), 0.16 + i * 0.13, 1.08, 0.09, 12));
    fr.add(door);
    for (let i = 0; i < 6; i++) { const d2 = sph(0.012, glass(0xcfe8ff, 0.7), rr(-0.25, 0.25), 1.37, rr(0.1, 0.3), 8); d2.scale.set(1, 1.6, 1); fr.add(d2); drips.push(d2); }
    castAll(fr); scene.add(fr);
    const puddle = mesh(new THREE.CircleGeometry(0.45, 32), M(0x1a2a3a, 0.05, 0.2), 1.05, 0.006, 0.25, false, true); puddle.rotation.x = -Math.PI / 2; scene.add(puddle);
    fs = spot(scene, 0xf2f6ff, 18, -0.4, 1.4, 1.6, 1.0, 1.0, -0.35, 0.28, 0.5, true, 9);
    scene.add(shaft(-0.4, 1.4, 1.6, 2.4, 0.02, 0.45, 0xe8f0ff, 0.04, 0, 0));
  }
  hemi(scene, 0x1c2438, 0x050403, 0.15);
  const anim = [(t) => {
    const f = flick(t * 1.2, 4); fl.scale.set(1, 1.5 + 0.5 * f, 1); cl.intensity = 0.55 + 0.4 * f; cg.material.opacity = 0.45 + 0.25 * f;
    if (variant === 'tap') {
      if (t < 1.7) { const k = t / 1.7; drop.visible = true; ring.visible = false; drop.position.y = 1.185 - k * 0.006; const sc = 0.6 + 0.6 * k; drop.scale.set(sc, sc * 1.5, sc); }
      else if (t < 2.05) { const tt = t - 1.7; drop.position.y = 1.179 - 0.5 * 9.81 * tt * tt; drop.visible = drop.position.y > 0.966; }
      else { drop.visible = false; const k = (t - 2.05) / 0.8; ring.visible = k < 1; ring.scale.setScalar(1 + k * 2.2); ring.material.opacity = 0.7 * Math.max(0, 1 - k); }
    }
    drips.forEach((d, i) => { const c = (t * 0.9 + i * 0.37) % 1; d.position.y = 1.37 - c * c * 1.3; });
    if (fs) { fs.target.position.x = 1.0 + Math.sin(t * 0.9) * 0.28; fs.target.position.y = 1.0 + Math.sin(t * 0.6) * 0.15; }
  }];
  return { drop, anim };
}

// ---------- STATION: petrol station, pumps dead ----------
export function station(scene) {
  scene.background = grad([[0, '#8c949c'], [1, '#c9ccce']]); scene.fog = new THREE.Fog(0xbfc3c6, 30, 220); scene.environmentIntensity = 0.3;
  scene.add(ground(400, M(0x4f5054, 0.85)));
  scene.add(box(26, 0.06, 16, M(0x9c9a94, 0.9), 0, 0.03, -2));
  const can = new THREE.Group(); can.position.set(0, 0, -2);
  can.add(box(20, 0.7, 11, M(0xeeeeec, 0.6), 0, 5.4, 0)); can.add(box(20.1, 0.25, 11.1, M(0xa3231d, 0.5), 0, 5.0, 0));
  for (const [x, z] of [[-8, -4], [8, -4], [-8, 4], [8, 4]]) can.add(box(0.5, 5.0, 0.5, M(0xd8d8d4, 0.6), x, 2.5, z));
  for (let x = -7; x <= 7; x += 3.5) for (const z of [-3, 0, 3]) can.add(box(1.4, 0.05, 0.4, M(0x6b6e72, 0.4), x, 5.03, z));
  castAll(can); scene.add(can);
  const sign = signTex(['EN PANNE'], { w: 512, h: 220, bg: '#f7f4ec', fg: '#b3261e', font: 'Newsreader', italic: true, weight: 600, size: 110, hand: true });
  for (const x of [-4, 4]) {
    const isl = new THREE.Group(); isl.position.set(x, 0, -2);
    isl.add(rbox(1.3, 0.22, 4.6, 0.05, M(0xd0cec8, 0.8), 0, 0.11, 0));
    for (const z of [-1.2, 1.2]) {
      isl.add(rbox(0.9, 1.9, 0.6, 0.06, M(0xf2f2f0, 0.5), 0, 1.17, z)); isl.add(box(0.92, 0.25, 0.62, M(0xa3231d, 0.5), 0, 2.0, z));
      for (const s of [-1, 1]) { isl.add(box(0.5, 0.32, 0.02, M(0x0c0d0f, 0.2), 0, 1.45, z + s * 0.31)); const p = mesh(new THREE.PlaneGeometry(0.42, 0.18), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.9 }), 0, 1.05, z + s * 0.315); if (s < 0) p.rotation.y = Math.PI; isl.add(p); }
      isl.add(cyl(0.03, 0.03, 0.25, M(0x222222, 0.5), 0.47, 1.25, z, 8));
    }
    castAll(isl); scene.add(isl);
  }
  const tot = new THREE.Group(); tot.position.set(12, 0, 6); tot.add(box(1.4, 6, 0.4, M(0xeeeeec, 0.6), 0, 3, 0)); for (let i = 0; i < 3; i++) tot.add(box(1.1, 0.7, 0.42, M(0x111214, 0.3), 0, 4.6 - i * 0.95, 0)); tot.add(box(1.4, 0.8, 0.42, M(0xa3231d, 0.5), 0, 5.7, 0)); castAll(tot); scene.add(tot);
  const shop = new THREE.Group(); shop.position.set(-2, 0, -14); shop.add(box(16, 3.8, 6, M(0xe4e2dc, 0.8), 0, 1.9, 0)); shop.add(box(10, 2.6, 0.1, glass(0x1b2028, 0.85), 1, 1.5, 3.02)); castAll(shop); scene.add(shop);
  seed(14); const colors = [0x8a1f1f, 0x2f4a6d, 0xd9d9d6, 0x1d1d1f, 0x6b6f74, 0x3f5d3a, 0xb8862a, 0x4c7f99];
  for (const [x, z, ry] of [[-4, -0.2, Math.PI / 2], [4, -3.6, -Math.PI / 2]]) { const c = car({ color: pick(colors) }); c.position.set(x + 1.6, 0, z); c.rotation.y = ry; scene.add(c); }
  for (let k = 0; k < 4; k++) { const c = car({ color: colors[(k + 2) % colors.length] }); c.position.set(5.6, 0, 2.2 + k * 5.4); c.rotation.y = Math.PI / 2; scene.add(c); }
  const MG = new THREE.Group(); scene.add(MG);
  const man = person(randPerson({ coat: true, rsh: [0.1, -0.2], rel: -0.1 })); man.position.set(6.5, 0, 4.5); man.rotation.y = -0.9; MG.add(man);
  const jerry = rbox(0.3, 0.38, 0.16, 0.03, M(0xc0261c, 0.5), 6.6, 0.4, 4.2); MG.add(jerry);
  hemi(scene, 0xd7dde3, 0x5a564f, 0.9); sun(scene, { pos: [20, 30, 25], color: 0xe8ecef, intensity: 0.9, size: 40, far: 140 });
  const anim = [(t) => { const d = 1.05 * t; MG.position.set(Math.sin(-0.9) * d, 0, Math.cos(-0.9) * d); animPerson(man, t, { walk: 1.55, stride: 0.42, armSwing: 0.5, look: 0.3 }); jerry.rotation.z = Math.sin(t * 1.55 * Math.PI * 2) * 0.12; }];
  return { anim };
}

// ---------- HOSPITAL: corridor on emergency power ----------
export function hospital(scene) {
  scene.background = new THREE.Color(0x05070a); scene.fog = new THREE.Fog(0x0b0f14, 8, 40); scene.environmentIntensity = 0.04;
  const L = 34; scene.add(box(3.4, 0.05, L, M(0xb9beb8, 0.22, 0.05), 0, 0, -L / 2 + 3));
  scene.add(box(3.4, 0.05, L, M(0xd8dcd6, 0.9), 0, 2.9, -L / 2 + 3));
  for (const s of [-1, 1]) {
    scene.add(box(0.06, 1.2, L, M(0x9fc2b4, 0.7), s * 1.7, 0.6, -L / 2 + 3)); scene.add(box(0.06, 1.7, L, M(0xe6e8e2, 0.8), s * 1.7, 2.05, -L / 2 + 3));
    scene.add(box(0.06, 0.06, L, M(0x8a6a4a, 0.6), s * 1.64, 0.92, -L / 2 + 3));
    for (let z = 0; z > -L + 3; z -= 5) { scene.add(box(0.05, 2.1, 1.1, M(0x5a7fa8, 0.6), s * 1.66, 1.05, z)); scene.add(box(0.06, 0.4, 0.3, glass(0x101418, 0.8), s * 1.65, 1.55, z)); }
  }
  let k = 0; const panels = [], monitors = [], patients = [];
  for (let z = 1.5; z > -L + 3; z -= 2.5, k++) {
    const on = k % 3 === 0;
    const pm = box(0.9, 0.03, 0.6, on ? E(0xffe0b0, 1.4) : M(0x6a6e70, 0.5), 0, 2.86, z); scene.add(pm);
    if (on) panels.push({ pm, li: point(scene, 0xffd9a0, 3.2, 7, 0, 2.6, z, k < 6) });
  }
  const exit = mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshStandardMaterial({ map: signTex(['SORTIE'], { w: 512, h: 170, bg: '#1f8a3a', fg: '#ffffff', font: 'Inter', weight: 800, size: 110 }), emissive: 0xffffff, emissiveMap: signTex(['SORTIE'], { w: 512, h: 170, bg: '#1f8a3a', fg: '#ffffff', font: 'Inter', weight: 800, size: 110 }), emissiveIntensity: 1.2 }), 0, 2.55, -L + 3.1, false, false); scene.add(exit);
  seed(51);
  for (const z of [-2.5, -6.5, -11, -16]) {
    const bed = new THREE.Group(); bed.position.set(-1.05, 0, z);
    bed.add(box(0.95, 0.08, 2.0, M(0xc9ced2, 0.3, 0.7), 0, 0.55, 0)); bed.add(rbox(0.9, 0.16, 1.95, 0.05, M(0xf2f4f5, 0.9), 0, 0.67, 0)); bed.add(rbox(0.6, 0.12, 0.35, 0.05, M(0xffffff, 0.9), 0, 0.8, -0.75));
    for (const [a, b] of [[-0.4, -0.9], [0.4, -0.9], [-0.4, 0.9], [0.4, 0.9]]) bed.add(cyl(0.025, 0.025, 0.55, M(0x9aa0a4, 0.3, 0.8), a, 0.27, b, 8));
    const p = person(randPerson({ top: 0xa9c3d6 })); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.86, 0.95); bed.add(p); patients.push(p);
    bed.add(rbox(0.88, 0.2, 1.5, 0.08, M(0xb9d3e6, 0.95), 0, 0.82, 0.22));
    castAll(bed); scene.add(bed);
    const mon = box(0.25, 0.18, 0.05, E(0x30ff80, 0.9), -1.62, 1.35, z - 0.6); scene.add(mon); monitors.push(mon);
  }
  const NG = new THREE.Group(); scene.add(NG);
  const nurse = person({ skin: 0xd8a37a, hair: 0x2b1d14, hairStyle: 'bun', top: 0xdbe9ef, pants: 0xdbe9ef, shoes: 0xffffff }); nurse.position.set(0.4, 0, -7.5); nurse.rotation.y = -0.08; NG.add(nurse);
  const lamp = cyl(0.03, 0.03, 0.04, E(0xffffff, 6), 0.4, 1.86, -7.36, 10); lamp.rotation.x = Math.PI / 2; NG.add(lamp);
  const hl = spot(scene, 0xf2f6ff, 16, 0.4, 1.86, -7.3, 0.3, 0.2, -1.0, 0.33, 0.5, true, 12); NG.add(hl); NG.add(hl.target);
  const hb = shaft(0.4, 1.86, -7.3, 6, 0.03, 0.9, 0xe8f0ff, 0.018, 0, 0); hb.rotation.x = -1.35; NG.add(hb);
  hemi(scene, 0x1a2230, 0x030405, 0.2);
  const anim = [(t) => {
    NG.position.z = 1.0 * t; animPerson(nurse, t, { walk: 1.6, stride: 0.4, look: 0.4 });
    panels.forEach(({ pm, li }, i) => { const f = 0.88 + 0.12 * flick(t * 0.8, i) - (i === 1 && Math.sin(t * 7) > 0.92 ? 0.5 : 0); pm.material.emissiveIntensity = 1.4 * f; li.intensity = 3.2 * f; });
    monitors.forEach((m, i) => { m.material.emissiveIntensity = 0.4 + 0.7 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.15 + i * 1.7)), 8); });
    patients.forEach((p, i) => animPerson(p, t, { breath: 0.7, look: 0.08, nod: 0.1, phase: i }));
  }];
  return { nurse, anim };
}

// ---------- MAP: the Iberian Peninsula (2025) | France (1978), seen at night ----------
const IBERIA = [[-8.9, 42.2], [-8.8, 41.9], [-8.7, 41.2], [-8.9, 40.3], [-9.4, 39.4], [-9.5, 38.75], [-9.0, 38.5], [-8.8, 38.0], [-8.9, 37.4], [-9.0, 37.0], [-8.6, 37.1], [-7.4, 37.2], [-6.9, 37.1], [-6.4, 36.8], [-6.25, 36.5], [-6.0, 36.2], [-5.6, 36.0], [-5.35, 36.15], [-4.9, 36.5], [-4.4, 36.7], [-3.5, 36.75], [-2.9, 36.75], [-2.2, 36.8], [-1.9, 37.1], [-1.65, 37.4], [-0.9, 37.55], [-0.7, 37.7], [-0.75, 38.0], [-0.5, 38.25], [-0.1, 38.6], [0.2, 38.75], [-0.15, 39.1], [-0.35, 39.5], [-0.05, 39.95], [0.4, 40.4], [0.85, 40.7], [1.0, 41.05], [1.5, 41.2], [2.2, 41.4], [2.75, 41.65], [3.2, 41.95], [3.2, 42.35], [3.05, 42.45], [2.0, 42.4], [1.4, 42.6], [0.7, 42.8], [0.0, 42.7], [-0.75, 42.85], [-1.4, 43.05], [-1.8, 43.35], [-2.5, 43.4], [-3.3, 43.45], [-3.8, 43.45], [-4.5, 43.4], [-5.4, 43.55], [-5.85, 43.65], [-6.6, 43.55], [-7.4, 43.75], [-8.0, 43.7], [-8.3, 43.5], [-8.95, 43.25], [-9.25, 42.9], [-9.0, 42.5]];
const PT_BORDER = [[-8.85, 41.87], [-8.2, 42.1], [-7.2, 41.9], [-6.6, 41.95], [-6.2, 41.6], [-6.85, 41.0], [-6.95, 40.25], [-7.0, 39.65], [-7.5, 39.6], [-7.15, 39.1], [-7.0, 38.75], [-7.3, 38.4], [-7.05, 38.05], [-7.5, 37.55], [-7.4, 37.2]];
const FRANCE = [[2.55, 51.08], [1.6, 50.95], [1.6, 50.4], [1.4, 50.1], [0.5, 49.85], [0.15, 49.7], [0.0, 49.5], [-0.3, 49.3], [-1.1, 49.4], [-1.3, 49.65], [-1.95, 49.7], [-1.85, 49.3], [-1.6, 48.85], [-1.4, 48.65], [-2.0, 48.6], [-2.7, 48.55], [-3.2, 48.85], [-3.9, 48.7], [-4.7, 48.6], [-4.8, 48.35], [-4.4, 48.25], [-4.6, 48.0], [-4.3, 47.8], [-3.5, 47.7], [-2.8, 47.5], [-2.2, 47.25], [-2.1, 47.0], [-1.9, 46.7], [-1.4, 46.3], [-1.2, 46.05], [-1.05, 45.6], [-1.2, 45.2], [-1.25, 44.7], [-1.35, 44.2], [-1.5, 43.6], [-1.8, 43.37], [-1.4, 43.05], [-0.75, 42.85], [0.0, 42.7], [0.7, 42.8], [1.4, 42.6], [2.0, 42.4], [3.05, 42.45], [3.1, 42.8], [3.05, 43.05], [3.3, 43.25], [3.7, 43.4], [4.1, 43.55], [4.65, 43.4], [5.0, 43.35], [5.4, 43.2], [5.8, 43.1], [6.2, 43.1], [6.65, 43.2], [6.95, 43.45], [7.25, 43.65], [7.5, 43.78], [7.65, 44.1], [7.0, 44.25], [6.9, 44.6], [7.05, 45.0], [6.8, 45.3], [7.0, 45.65], [6.8, 45.95], [6.5, 46.4], [6.15, 46.25], [5.95, 46.15], [6.1, 46.6], [6.6, 47.0], [7.0, 47.35], [7.4, 47.45], [7.6, 47.6], [7.55, 48.0], [7.8, 48.5], [8.2, 48.95], [7.6, 49.05], [7.0, 49.2], [6.7, 49.45], [6.3, 49.5], [5.8, 49.55], [5.4, 49.6], [5.0, 49.8], [4.85, 50.15], [4.15, 49.95], [4.1, 50.3], [3.7, 50.35], [3.25, 50.7], [2.6, 50.85]];
const CORSICA = [[9.4, 43.0], [9.55, 42.6], [9.5, 42.1], [9.25, 41.6], [9.1, 41.38], [8.75, 41.55], [8.6, 41.9], [8.55, 42.3], [8.7, 42.6], [9.05, 42.7], [9.3, 43.0]];
const CITIES_IB = [['Madrid', -3.70, 40.42, 3], ['Barcelona', 2.17, 41.39, 3], ['Lisboa', -9.14, 38.72, 2.6], ['Valencia', -0.38, 39.47, 2], ['Sevilla', -5.98, 37.39, 2], ['Porto', -8.61, 41.15, 2], ['Zaragoza', -0.88, 41.65, 1.5], ['Málaga', -4.42, 36.72, 1.5], ['Bilbao', -2.93, 43.26, 1.5], ['Murcia', -1.13, 37.99, 1.2], ['Valladolid', -4.72, 41.65, 1.1], ['Vigo', -8.72, 42.24, 1.1], ['A Coruña', -8.41, 43.36, 1], ['Granada', -3.6, 37.18, 1], ['Alicante', -0.48, 38.35, 1.2], ['Córdoba', -4.78, 37.89, 1], ['Braga', -8.42, 41.55, 0.9], ['Coimbra', -8.43, 40.2, 0.8], ['Faro', -7.93, 37.02, 0.7], ['Salamanca', -5.66, 40.97, 0.8], ['Badajoz', -6.97, 38.88, 0.7], ['Santander', -3.8, 43.46, 0.8], ['Oviedo', -5.85, 43.36, 0.9], ['Pamplona', -1.64, 42.81, 0.8], ['San Sebastián', -1.98, 43.32, 0.8], ['Toledo', -4.02, 39.86, 0.7], ['Cádiz', -6.29, 36.53, 0.8], ['Almería', -2.46, 36.84, 0.8], ['León', -5.57, 42.6, 0.7], ['Burgos', -3.7, 42.34, 0.7], ['Tarragona', 1.25, 41.12, 0.8], ['Girona', 2.82, 41.98, 0.7], ['Lleida', 0.62, 41.62, 0.7], ['Castellón', -0.05, 39.99, 0.7], ['Cáceres', -6.37, 39.47, 0.6], ['Albacete', -1.86, 38.99, 0.7]];
const CITIES_IB_OUT = [['Bordeaux', -0.58, 44.84, 1.6], ['Toulouse', 1.44, 43.6, 1.6], ['Bayonne', -1.47, 43.49, 0.8], ['Pau', -0.37, 43.3, 0.7], ['Perpignan', 2.9, 42.7, 0.8], ['Montpellier', 3.88, 43.61, 1.2], ['Narbonne', 3.0, 43.18, 0.6], ['Tanger', -5.8, 35.77, 1.2], ['Tétouan', -5.37, 35.57, 0.9], ['Rabat', -6.84, 34.02, 1.6], ['Kénitra', -6.58, 34.26, 0.9], ['Fès', -5.0, 34.03, 1.3], ['Larache', -6.15, 35.19, 0.6]];
const CITIES_FR = [['Paris', 2.35, 48.86, 3.4], ['Lyon', 4.84, 45.76, 2], ['Marseille', 5.37, 43.3, 2], ['Toulouse', 1.44, 43.6, 1.6], ['Nice', 7.26, 43.7, 1.4], ['Nantes', -1.55, 47.22, 1.4], ['Montpellier', 3.88, 43.61, 1.2], ['Bordeaux', -0.58, 44.84, 1.6], ['Lille', 3.06, 50.63, 1.6], ['Rennes', -1.68, 48.11, 1.2], ['Reims', 4.03, 49.26, 1], ['Le Havre', 0.11, 49.49, 1], ['Saint-Étienne', 4.39, 45.43, 1], ['Toulon', 5.93, 43.12, 1], ['Grenoble', 5.72, 45.19, 1], ['Dijon', 5.04, 47.32, 0.9], ['Angers', -0.55, 47.47, 0.8], ['Brest', -4.49, 48.39, 0.8], ['Le Mans', 0.2, 48.0, 0.8], ['Clermont-Ferrand', 3.09, 45.78, 0.9], ['Tours', 0.69, 47.39, 0.8], ['Limoges', 1.26, 45.83, 0.8], ['Amiens', 2.3, 49.9, 0.8], ['Rouen', 1.1, 49.44, 1], ['Caen', -0.37, 49.18, 0.8], ['Orléans', 1.9, 47.9, 0.8], ['Perpignan', 2.9, 42.7, 0.7], ['Poitiers', 0.34, 46.58, 0.7], ['Ajaccio', 8.74, 41.92, 0.6], ['Besançon', 6.02, 47.24, 0.8],
  ['Strasbourg', 7.75, 48.58, 1.4, 'east'], ['Metz', 6.18, 49.12, 1, 'east'], ['Nancy', 6.18, 48.69, 1, 'east'], ['Mulhouse', 7.34, 47.75, 0.9, 'east'], ['Colmar', 7.36, 48.08, 0.6, 'east'], ['Thionville', 6.17, 49.36, 0.6, 'east'], ['Épinal', 6.45, 48.17, 0.5, 'east']];
const CITIES_FR_OUT = [['Bruxelles', 4.35, 50.85, 1.6], ['Anvers', 4.4, 51.2, 1.1], ['Liège', 5.57, 50.63, 0.9], ['Luxembourg', 6.13, 49.61, 0.8], ['Cologne', 6.96, 50.94, 1.4], ['Francfort', 8.68, 50.11, 1.4], ['Sarrebruck', 7.0, 49.23, 0.8], ['Karlsruhe', 8.4, 49.0, 0.9], ['Stuttgart', 9.18, 48.78, 1.2], ['Fribourg', 7.85, 47.99, 0.7], ['Bâle', 7.59, 47.56, 0.9], ['Zurich', 8.54, 47.37, 1.1], ['Berne', 7.45, 46.95, 0.7], ['Genève', 6.14, 46.2, 0.9], ['Lausanne', 6.63, 46.52, 0.7], ['Turin', 7.69, 45.07, 1.3], ['Milan', 9.19, 45.46, 1.6], ['Gênes', 8.93, 44.41, 1], ['Barcelone', 2.17, 41.39, 1.6], ['Bilbao', -2.93, 43.26, 1], ['Saragosse', -0.88, 41.65, 0.9], ['Londres', -0.12, 51.5, 2.2], ['Brighton', -0.14, 50.82, 0.7], ['Southampton', -1.4, 50.9, 0.7], ['Plymouth', -4.14, 50.37, 0.6]];

export function map(scene, { variant }) {
  const ib = variant === 'iberia';
  const lon0 = ib ? -3.5 : 2.5, lat0 = ib ? 40.0 : 46.5, k = 8, cl = Math.cos(lat0 * Math.PI / 180);
  const P = (lon, lat) => [(lon - lon0) * cl * k, -(lat - lat0) * k];
  scene.background = grad([[0, '#010204'], [1, '#071020']]); scene.environmentIntensity = 0.02;
  scene.add(ground(2000, new THREE.MeshStandardMaterial({ map: noiseTex('#0a0f19', 10, 256, 256, [12, 12], 1600), roughness: 1 })));
  const slab = (poly, h = 0.7) => {
    const s = new THREE.Shape(); poly.forEach(([lo, la], i) => { const [x, z] = P(lo, la); if (i) s.lineTo(x, -z); else s.moveTo(x, -z); });
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.2, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, M(0x263244, 0.95)); m.receiveShadow = true; scene.add(m);
    const pts = poly.map(([lo, la]) => { const [x, z] = P(lo, la); return new THREE.Vector3(x, h + 0.25, z); });
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x7f93b3, transparent: true, opacity: 0.85 })));
  };
  const line = (poly, h = 0.7) => { const pts = poly.map(([lo, la]) => { const [x, z] = P(lo, la); return new THREE.Vector3(x, h + 0.3, z); }); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x5f7090, transparent: true, opacity: 0.7 }))); };
  const lights = [];
  const onMat = E(0xffd9a0, 4), offMat = M(0x2a2f38, 0.8);
  const city = ([name, lo, la, sz, tag], on, y = 1.0, toggles = false) => {
    const [x, z] = P(lo, la);
    const g = glow(0xffc27a, sz * 3.8, x, y + 1.2, z, on ? 0.85 : 0); const c = sph(0.25 + sz * 0.12, on ? onMat : offMat, x, y, z, 10);
    scene.add(g); scene.add(c); const subs = [];
    if (on || toggles) for (let i = 0; i < Math.round(sz * 6); i++) { const s2 = glow(0xffb860, rr(0.8, 2.0), x + rr(-1.6, 1.6) * sz, y + 0.5, z + rr(-1.6, 1.6) * sz, on ? 0.7 : 0); scene.add(s2); subs.push(s2); }
    lights.push({ name, x, tag, toggles, g, set: (k) => { g.material.opacity = 0.85 * k; subs.forEach(s2 => { s2.material.opacity = 0.7 * k; }); c.material = k > 0.5 ? onMat : offMat; } });
  };
  seed(5);
  if (ib) {
    slab(IBERIA); line(PT_BORDER);
    CITIES_IB.forEach(c => city(c, false, 1.0, true)); CITIES_IB_OUT.forEach(c => city(c, true, 0.3));
  } else {
    slab(FRANCE); slab(CORSICA);
    CITIES_FR.forEach(c => city(c, c[4] === 'east', 1.0, c[4] !== 'east')); CITIES_FR_OUT.forEach(c => city(c, true, 0.3));
  }
  seed(17); const delays = lights.map(() => rr(0, 0.45));
  const xs = lights.filter(l => l.toggles).map(l => l.x), xmin = Math.min(...xs), xmax = Math.max(...xs);
  const anim = [(t) => {
    lights.forEach((l, i) => {
      if (!l.toggles) { l.g.material.opacity = 0.85 * (0.9 + 0.1 * flick(t * 0.7, i)); return; }
      const tOff = ib ? 1.0 + delays[i] : 0.6 + ((l.x - xmin) / Math.max(1, xmax - xmin)) * 3.0 + delays[i] * 0.4;
      l.set(t < tOff ? 1 : Math.max(0, 1 - (t - tOff) / 0.12));
    });
  }];
  hemi(scene, 0x2a3a5c, 0x020305, 0.6);
  const moon = new THREE.DirectionalLight(0x9db5e6, 0.8); moon.position.set(-60, 120, 80); scene.add(moon);
  return { lights, anim };
}

export const SETS2 = { skyline, apartment, crossroads, metro, phone, kitchen, station, hospital, map };
export const CAMS2 = {
  'skyline:wave': [52, [0.2, 27, 0.6], [-12, 13, -230], { far: 3500, near: 0.5, ao: false, bloom: [0.6, 0.5, 0.45] }],
  'skyline:candles': [52, [0.2, 27, 0.6], [-12, 13, -230], { far: 3500, near: 0.5, ao: false, bloom: [0.7, 0.5, 0.4] }],
  'skyline:restore': [52, [0.2, 27, 0.6], [-12, 13, -230], { far: 3500, near: 0.5, ao: false, bloom: [0.6, 0.5, 0.45] }],
  'apartment:dark': [46, [1.6, 1.45, 1.3], [-0.85, 0.95, -1.35], {}],
  'apartment:cold': [42, [0.85, 1.35, 0.75], [-0.7, 0.85, -1.3], { bloom: [0.6, 0.5, 0.7] }],
  'apartment:neighbor': [52, [-2.1, 1.75, -1.7], [2.3, 1.15, 0.65], {}],
  'apartment:restored': [60, [-0.6, 1.6, 3.6], [1.1, 0.95, 0.9], {}],
  'crossroads:night': [50, [15, 7.5, 17], [0, 0.4, 0], { ao: false, bloom: [0.9, 0.6, 0.5] }],
  'crossroads:day': [50, [15, 7.5, 17], [0, 0.4, 0], { ao: false }],
  'metro:car': [58, [0, 1.62, 1.7], [0, 1.25, -14], { bloom: [0.5, 0.4, 0.75] }],
  'phone:hand': [30, [0.02, 1.08, 0.36], [0, 0.86, 0.0], { dof: { focus: 0.42, aperture: 0.014, maxblur: 0.01 }, bloom: [0.45, 0.4, 0.82] }],
  'kitchen:tap': [32, [0.32, 1.28, 0.5], [0, 1.08, -0.5], { dof: { focus: 1.05, aperture: 0.012, maxblur: 0.01 }, bloom: [0.45, 0.4, 0.8] }],
  'kitchen:fridge': [48, [-0.9, 1.5, 2.3], [0.8, 0.95, -0.4], { bloom: [0.6, 0.6, 0.7] }],
  'station:day': [48, [12.5, 1.75, 10], [2.5, 1.3, -2.5], {}],
  'hospital:corridor': [54, [0.3, 1.55, 2.4], [0, 1.25, -20], { bloom: [0.7, 0.5, 0.7] }],
  'map:iberia': [40, [0, 160, 108], [0, 0, 17], { ao: false, bloom: [0.9, 0.6, 0.35] }],
  'map:france': [40, [-4, 162, 106], [-4, 0, 16], { ao: false, bloom: [0.9, 0.6, 0.35] }],
  'bakery:cash': [50, [3.0, 1.65, 6.8], [0.4, 2.1, -4.6], {}],
};
