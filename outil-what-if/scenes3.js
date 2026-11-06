// Decors for episode 3 « Et si Paris atteignait 50 °C ? »
import { THREE, M, E, glass, mesh, box, rbox, cyl, sph, canvasTex, noiseTex, signTex, sun, hemi, point, spot, person, randPerson, SIT, ground, instanced, shaft, dust, seed, rnd, rr, pick, glow, tree, animPerson, flick, roundTex } from './lib.js';
import { car, FRANCE, CORSICA } from './scenes2.js';
const ease = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const castAll = (o) => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
function grad(stops, w = 16, h = 512) {
  return canvasTex(w, h, (g) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}

// character sheet (fix D04): Inès, 21, student in a 9 m² maid's room under the zinc roof
export const INES = { skin: 0xb27c55, hair: 0x15100c, hairStyle: 'bun', top: 0xeadca0, sleeves: false, pants: 0x4d6c8f, shorts: true, shoes: 0xf0f0ee };
const SUMMER = () => randPerson({ sleeves: rnd() < 0.3, shorts: rnd() < 0.5, top: pick([0xe8e0cc, 0xf2f0ea, 0x9fb7c9, 0xd9b48a, 0xc77d5a, 0x7f9a6a, 0xe7c86b]) });

// ---------- shared pieces ----------
let _zt = null;
const ZINC = () => { if (!_zt) { _zt = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#7c8790'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(30,36,42,0.55)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 2, 0, 1, h); } }); _zt.wrapS = _zt.wrapT = THREE.RepeatWrapping; } return new THREE.MeshStandardMaterial({ map: _zt, roughness: 0.42, metalness: 0.55 }); };
function frustum(w0, d0, w1, d1, h) {   // rectangle w0×d0 at y=0 to w1×d1 at y=h, with a top
  const a = [[-w0 / 2, 0, -d0 / 2], [w0 / 2, 0, -d0 / 2], [w0 / 2, 0, d0 / 2], [-w0 / 2, 0, d0 / 2]], b = [[-w1 / 2, h, -d1 / 2], [w1 / 2, h, -d1 / 2], [w1 / 2, h, d1 / 2], [-w1 / 2, h, d1 / 2]];
  const p = []; const quad = (q0, q1, q2, q3) => p.push(...q0, ...q1, ...q2, ...q0, ...q2, ...q3);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(a[j], a[i], b[i], b[j]); }
  quad(b[3], b[2], b[1], b[0]);
  const uv = []; for (let i = 0; i < p.length; i += 3) uv.push((p[i] + p[i + 2]) * 0.6, p[i + 1] * 0.6);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
// Haussmann stone facade: tall windows, iron balconies on floors 2 and 5; optional lit windows at night and shops at street level
const FACS = {};
function facadeTex(key, { floors = 6, night = false, shops = false, lit = 0.6 } = {}) {
  const k = key + floors + night + shops + lit; if (FACS[k]) return FACS[k];
  seed(4000 + key);
  const cols = 5, W = 320, rowH = 64, H = rowH * floors, cw = W / cols;
  const litW = []; for (let i = 0; i < cols * floors; i++) litW.push(rnd() < lit);
  const map = canvasTex(W, H, (g) => {
    g.fillStyle = night ? '#6d6558' : '#e4d6bb'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < floors; r++) {
      const y = r * rowH; g.fillStyle = night ? 'rgba(0,0,0,0.25)' : 'rgba(120,96,70,0.22)'; g.fillRect(0, y, W, 3);
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        if (shops && r === floors - 1) { g.fillStyle = '#1d2228'; g.fillRect(x + cw * 0.08, y + rowH * 0.18, cw * 0.84, rowH * 0.82); continue; }
        g.fillStyle = night ? '#1a1d24' : '#2b333d'; g.fillRect(x + cw * 0.3, y + rowH * 0.16, cw * 0.4, rowH * 0.66);
        g.fillStyle = night ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.18)'; g.fillRect(x + cw * 0.49, y + rowH * 0.16, 2, rowH * 0.66);
        if (r === 1 || r === 4) { g.fillStyle = 'rgba(25,25,25,0.9)'; g.fillRect(x + (r === 1 ? 0 : cw * 0.22), y + rowH * 0.66, r === 1 ? cw : cw * 0.56, rowH * 0.05); for (let i = 0; i < 9; i++) g.fillRect(x + (r === 1 ? 0 : cw * 0.22) + i * (r === 1 ? cw : cw * 0.56) / 9, y + rowH * 0.66, 1.5, rowH * 0.16); }
      }
    }
  });
  const emis = night ? canvasTex(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < floors; r++) for (let c = 0; c < cols; c++) if (litW[r * cols + c] && !(shops && r === floors - 1)) { g.fillStyle = pick(['#ffb85c', '#ffc778', '#ffd59a', '#ff9e4a']); g.fillRect(c * cw + cw * 0.3, r * rowH + rowH * 0.16, cw * 0.4, rowH * 0.66); }
  }) : null;
  return (FACS[k] = { map, emis, floors, rowH: 3.2 });
}
function facadeMat(key, w, opts) {
  const f = facadeTex(key, opts); const rep = Math.max(1, Math.round(w / 13));
  const mk = (t) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = THREE.RepeatWrapping; c.repeat.set(rep, 1); return c; };
  return new THREE.MeshStandardMaterial({ map: mk(f.map), emissive: f.emis ? 0xffffff : 0x000000, emissiveMap: f.emis ? mk(f.emis) : null, emissiveIntensity: f.emis ? 1.3 : 0, roughness: 0.92 });
}
// one Paris building: stone box, cornice, two-slope zinc mansard with dormers, chimney stacks with clay pots
function building(w, d, floors, { key = 0, night = false, shops = false, lit = 0.55, dormers = true, chimneys = true } = {}) {
  const g = new THREE.Group(), H = floors * 3.2;
  const side = facadeMat(key, w, { floors, night, shops, lit }), side2 = facadeMat(key + 7, d, { floors, night, shops, lit });
  const plain = M(night ? 0x5f584d : 0xd9cbb0, 0.92);
  g.add(mesh(new THREE.BoxGeometry(w, H, d), [side2, side2, plain, plain, side, side], 0, H / 2, 0, true, true));
  g.add(box(w + 0.5, 0.35, d + 0.5, M(night ? 0x4f493f : 0xcfc0a2, 0.9), 0, H + 0.1, 0));
  const zinc = ZINC(), slope = mesh(frustum(w + 0.2, d + 0.2, w - 2.4, d - 2.4, 2.8), zinc, 0, H + 0.27, 0); g.add(slope);
  g.add(mesh(frustum(w - 2.4, d - 2.4, w - 4.4, d - 4.4, 0.7), zinc, 0, H + 3.07, 0));
  if (dormers) for (let x = -w / 2 + 2.2; x < w / 2 - 1.5; x += 3.1) for (const s of [-1, 1]) {
    const dg = new THREE.Group(); dg.position.set(x, H + 0.9, s * (d / 2 - 0.55)); dg.rotation.y = s > 0 ? 0 : Math.PI;
    dg.add(box(0.95, 1.35, 0.9, zinc, 0, 0.6, 0)); const top = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 12, 1, false, 0, Math.PI), zinc, 0, 1.28, 0); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; dg.add(top);
    dg.add(box(0.55, 0.85, 0.02, night && rnd() < lit ? E(0xffbf6a, 1.6) : M(0x1d222a, 0.25), 0, 0.6, 0.46)); g.add(dg);
  }
  if (chimneys) for (let i = 0; i < Math.max(1, Math.round(w / 6)); i++) {
    const cx = -w / 2 + 2.5 + i * (w - 5) / Math.max(1, Math.round(w / 6) - 1 || 1), cz = rr(-d / 5, d / 5);
    const brick = M(pick([0xb8654a, 0xc9b79a, 0xa65a40]), 0.9);
    g.add(box(0.7, 1.7, 1.9, brick, cx, H + 3.6, cz));
    for (let k = 0; k < 4; k++) g.add(cyl(0.08, 0.1, 0.42, M(0xc06a3c, 0.85), cx, H + 4.66, cz - 0.7 + k * 0.46, 10));
  }
  castAll(g); return g;
}
function sunDisk(scene, x, y, z, s = 140, color = 0xfff8e8) { scene.add(glow(color, s, x, y, z, 0.9)); scene.add(glow(0xffe2b0, s * 1.7, x, y, z, 0.12)); }
function people(n, area, opts = {}) {
  const out = []; for (let i = 0; i < n; i++) { const p = person({ ...SUMMER(), ...opts }); p.position.set(rr(area[0], area[1]), opts.y ?? 0, rr(area[2], area[3])); p.rotation.y = opts.ry ?? rr(-Math.PI, Math.PI); out.push(p); } return out;
}
function rainLines(n, box3, len = 0.6, color = 0xcfd8e2, opacity = 0.35) {
  const p = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) { const x = rr(box3[0], box3[3]), y = rr(box3[1], box3[4]), z = rr(box3[2], box3[5]); p.set([x, y, z, x + 0.03, y - len, z + 0.02], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
}

// birds: a few pigeons / swifts circling or crossing, wings flapping
function bird(color = 0x2b2b2e) {
  const g = new THREE.Group(), m = M(color, 0.8); g.add(box(0.12, 0.08, 0.32, m, 0, 0, 0));
  const wl = new THREE.Group(), wr = new THREE.Group(); wl.add(box(0.36, 0.02, 0.16, m, -0.18, 0, 0)); wr.add(box(0.36, 0.02, 0.16, m, 0.18, 0, 0)); g.add(wl); g.add(wr);
  g.userData.wings = [wl, wr]; return g;
}
function flock(scene, n, c, r, y, sp, scale = 1, color) {
  const bs = []; for (let i = 0; i < n; i++) { const b = bird(color); b.scale.setScalar(scale * rr(0.8, 1.2)); scene.add(b); bs.push({ b, a0: rr(0, 6.28), r: r * rr(0.7, 1.3), y: y + rr(-3, 3) * scale, w: sp * rr(0.8, 1.2), f: rr(9, 13) }); }
  return (t) => bs.forEach(({ b, a0, r: rad, y: yy, w, f }, i) => { const a = a0 + t * w; b.position.set(c[0] + Math.cos(a) * rad, yy + Math.sin(t * 1.3 + i) * 0.4 * scale, c[2] + Math.sin(a) * rad * 0.5); b.rotation.y = -a + (w > 0 ? Math.PI : 0); const fl = Math.sin(t * f + i) * 0.7; b.userData.wings[0].rotation.z = fl; b.userData.wings[1].rotation.z = -fl; });
}
function cloud(color, s, x, y, z, op) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: roundTex(), color, transparent: true, opacity: op, depthWrite: false, fog: false })); sp.scale.set(s * 1.8, s, 1); sp.position.set(x, y, z); return sp; }

// ---------- ROOFS: the zinc rooftops of Paris (noon | night | storm) ----------
export function roofs(scene, { variant }) {
  const night = variant === 'night', storm = variant === 'storm';
  scene.background = night ? grad([[0, '#05070f'], [0.6, '#16172a'], [1, '#5a3a2a']]) : storm ? grad([[0, '#1d2128'], [0.6, '#3a4048'], [1, '#6b6f70']]) : grad([[0, '#9fb9cf'], [0.55, '#d9dccf'], [1, '#efc78e']]);
  scene.fog = new THREE.Fog(night ? 0x2a2026 : storm ? 0x4c5156 : 0xe6caa0, night ? 120 : 140, night ? 900 : storm ? 520 : 1100);
  scene.environmentIntensity = night ? 0.05 : storm ? 0.2 : 0.28;
  scene.add(ground(3000, M(night ? 0x1c1a1a : 0x6e675e, 0.95), -18));
  seed(31); const anim = [];
  for (let row = 0; row < 9; row++) for (let i = 0; i < 9; i++) {
    const w = rr(12, 20), d = rr(11, 15), fl = pick([5, 6, 6, 6, 7]);
    const x = -95 + i * 23 + rr(-3, 3) + (row % 2) * 9, z = -18 - row * 26 + rr(-3, 3);
    const b = building(w, d, fl, { key: (row * 9 + i) % 6, night, lit: 0.5, dormers: row < 5, chimneys: row < 6 });
    b.position.set(x, -18 + rr(-1.5, 1.5) + (6 - fl) * 1.2, z); b.rotation.y = rr(-0.06, 0.06); scene.add(b);
  }
  // the roof we stand on
  if (night) { const near = building(26, 14, 6, { key: 3, night, lit: 0.6 }); near.position.set(4, -15.6, 7); scene.add(near); }
  // a far dome and two idle cranes
  const dome = new THREE.Group(); dome.position.set(-60, 0, -330);
  dome.add(cyl(26, 26, 40, M(night ? 0x3a352f : 0xe8dcc3, 0.9), 0, 20, 0, 32)); dome.add(cyl(18, 18, 14, M(night ? 0x3a352f : 0xe8dcc3, 0.9), 0, 47, 0, 32));
  const dm = mesh(new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(night ? 0x34393f : 0x9aa4a8, 0.5, 0.4), 0, 54, 0); dome.add(dm); dome.add(cyl(2.5, 3, 12, M(0xd8cdb5, 0.8), 0, 78, 0, 12)); scene.add(dome);
  const jibs = []; for (const [cx, cz] of [[70, -260], [130, -420]]) { const cr = new THREE.Group(); cr.position.set(cx, 0, cz); const y = M(0xd9a520, 0.6, 0.3); cr.add(box(2, 70, 2, y, 0, 35, 0)); const jib = new THREE.Group(); jib.position.y = 70; jib.add(box(60, 1.6, 1.6, y, 12, 0, 0)); jib.add(box(4, 3, 3, M(0x555a60, 0.6), -14, -3, 0)); jib.add(cyl(0.15, 0.15, 22, M(0x333333, 0.5), 30, -11, 0, 6)); cr.add(jib); jibs.push(jib); scene.add(cr); }
  anim.push((t) => jibs.forEach((j, i) => { j.rotation.y = 0.4 + i + Math.sin(t * 0.25 + i) * 0.35; }));
  if (night) {
    hemi(scene, 0x2b2c48, 0x4a2a1a, 0.55); const city = new THREE.DirectionalLight(0xff9c5a, 0.35); city.position.set(0, 20, -200); scene.add(city);
    scene.add(glow(0xfff2dc, 26, -120, 140, -700, 0.9));
    // people out on the balconies and the roof, windows wide open
    const ps = people(3, [-6, 14, -2, 2], { y: 1.0 }); [[-4.1, 2.2], [-2.6, 3.4], [-1.4, 1.2]].forEach(([x, z], i) => { const p = ps[i]; p.position.set(x, 7.4, z); p.rotation.y = rr(-0.5, 0.5) + Math.PI; scene.add(p); });
    const a = point(scene, 0xffb46a, 6, 14, 2, 3, -3);
    const tvs = []; for (let i = 0; i < 7; i++) { const g = glow(0x7fa8ff, rr(1.5, 2.6), rr(-55, 25), rr(-9, -1), -11.2 - (i % 3) * 26, 0.0); scene.add(g); tvs.push(g); }
    const plane = new THREE.Group(); plane.add(glow(0xff4a3a, 3, 0, 0, 0, 0.9)); plane.add(glow(0xffffff, 2.2, 4, 0, 0, 0.9)); plane.position.set(-200, 120, -600); scene.add(plane);
    anim.push((t) => { ps.forEach((p, i) => animPerson(p, t, { breath: 1.2, look: 0.8, sway: 1.4, phase: i * 1.7, talk: i === 1 ? 0.5 : 0 }));
      tvs.forEach((g, i) => { g.material.opacity = 0.18 + 0.22 * flick(t * 0.6, i * 3.1); });
      plane.position.x = -200 + t * 38; plane.children[0].material.opacity = (t * 1.5) % 1 < 0.15 ? 1 : 0.2; });
  } else if (storm) {
    hemi(scene, 0x8a94a0, 0x2a2a2a, 0.75); const d = sun(scene, { pos: [-60, 90, 40], color: 0xc9d4e6, intensity: 0.9, size: 90, far: 400, target: [0, 0, -80] });
    const R = rainLines(5000, [-60, -5, -120, 60, 60, 10], 1.2, 0xc8d2dc, 0.28); scene.add(R);
    const bolt = []; let x = 14, y = 165, z = -380; for (let i = 0; i < 14; i++) { bolt.push(new THREE.Vector3(x, y, z)); x += rr(-9, 9); y -= rr(9, 13); }
    const BL = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bolt), new THREE.LineBasicMaterial({ color: 0xf2f6ff, transparent: true, opacity: 1 })); scene.add(BL);
    const flash = glow(0xdfe8ff, 200, 14, 110, -390, 0.35); scene.add(flash);
    const steam = dust(900, [-40, -3, -70, 50, 3, 4], 0xe9eef2, 1.6, 0.22); scene.add(steam);
    const clouds = []; for (let i = 0; i < 9; i++) { const c = cloud(0x1e2228, rr(140, 260), rr(-420, 260), rr(150, 260), -600 - rr(0, 200), 0.55); scene.add(c); clouds.push(c); }
    anim.push((t) => clouds.forEach((c, i) => { c.position.x += 0.35 + (i % 3) * 0.12; }));
    anim.push((t) => { R.position.y = -((t * 22) % 8); const f = t > 1.2 && t < 1.45 ? 1 : t > 1.55 && t < 1.65 ? 0.7 : 0; BL.material.opacity = f; flash.material.opacity = 0.1 + 0.5 * f; d.intensity = 0.9 + 3 * f; steam.position.y = (t * 0.4) % 1.5; });
  } else {
    hemi(scene, 0xfff3dc, 0x7a6450, 0.45);
    sun(scene, { pos: [60, 120, -40], color: 0xfff4dc, intensity: 2.2, size: 110, far: 400, target: [0, 0, -60] });
    sunDisk(scene, 40, 215, -900, 80);
    const haze = dust(300, [-80, -2, -160, 80, 6, -10], 0xffe4b8, 2.5, 0.03); scene.add(haze);
    anim.push((t) => { haze.position.x = Math.sin(t * 0.7) * 0.8; haze.position.y = Math.sin(t * 1.3) * 0.2; });
    anim.push(flock(scene, 7, [-20, 0, -60], 26, 22, 0.55, 2.2));
  }
  return { anim };
}

// ---------- ATTIC: Inès's 9 m² maid's room under the zinc (day | night | rain) ----------
export function attic(scene, { variant }) {
  const day = variant === 'day', night = variant === 'night', rain = variant === 'rain';
  scene.background = night ? grad([[0, '#05081a'], [1, '#3b2a32']]) : rain ? grad([[0, '#5d646d'], [1, '#9aa1a8']]) : grad([[0, '#ffffff'], [1, '#f6e7c8']]);
  scene.environmentIntensity = night ? 0.03 : rain ? 0.18 : 0.22;
  const wall = new THREE.MeshStandardMaterial({ map: noiseTex('#e9e2d4', 10, 256, 256, [3, 3], 1800), roughness: 0.95, side: THREE.DoubleSide });
  const floorM = new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 12; i++) { g.fillStyle = ['#9a6b45', '#8f6340', '#a3744c'][i % 3]; g.fillRect(0, i * h / 12, w, h / 12); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * h / 12, w, 2); for (let k = 0; k < 3; k++) g.fillRect(((i * 97 + k * 173) % w), i * h / 12, 2, h / 12); } }, [2, 2]), roughness: 0.6 });
  const X0 = -1.7, X1 = 1.7, Z0 = -1.6, Z1 = 1.6, KW = 1.1, TOP = 2.6, XR = 0.5;   // knee wall height, ridge where the slope meets the flat ceiling
  const slopeY = (x) => KW + (TOP - KW) * (x - X0) / (XR - X0);
  scene.add(ground(20, floorM));
  // back wall shaped by the slope
  const sh = new THREE.Shape(); sh.moveTo(X0, 0); sh.lineTo(X1, 0); sh.lineTo(X1, TOP); sh.lineTo(XR, TOP); sh.lineTo(X0, KW); sh.lineTo(X0, 0);
  const bw = mesh(new THREE.ShapeGeometry(sh), wall, 0, 0, Z0); scene.add(bw);
  scene.add(box(0.1, KW, Z1 - Z0, wall, X0 - 0.05, KW / 2, 0)); scene.add(box(0.1, TOP, Z1 - Z0, wall, X1 + 0.05, TOP / 2, 0));
  scene.add(box(X1 - XR, 0.1, Z1 - Z0, wall, (X1 + XR) / 2, TOP + 0.05, 0));
  // sloped ceiling with the skylight (s in [0.36, 0.72] along the slope, z in [-1.05, -0.25])
  const L = Math.hypot(XR - X0, TOP - KW), ang = Math.atan2(TOP - KW, XR - X0);
  const S0 = 0.36, S1 = 0.72, SZ0 = -1.05, SZ1 = -0.25;
  const slopeG = new THREE.Group(); slopeG.position.set(X0, KW, 0); slopeG.rotation.z = ang; scene.add(slopeG);
  const panel = (u0, u1, z0, z1) => { const m = box((u1 - u0) * L, 0.1, z1 - z0, wall, (u0 + u1) / 2 * L, 0.05, (z0 + z1) / 2); slopeG.add(m); };
  panel(0, S0, Z0, Z1); panel(S1, 1, Z0, Z1); panel(S0, S1, Z0, SZ0); panel(S0, S1, SZ1, Z1);
  const zinc = ZINC(); const outer = box(L + 0.2, 0.05, Z1 - Z0 + 0.4, zinc, L / 2, 0.14, 0); outer.visible = false; slopeG.add(outer);
  const frameM = M(0x3b3f45, 0.5, 0.4);
  for (const [u, z, a, b] of [[S0, (SZ0 + SZ1) / 2, 0.06, SZ1 - SZ0], [S1, (SZ0 + SZ1) / 2, 0.06, SZ1 - SZ0]]) slopeG.add(box(a, 0.16, b + 0.06, frameM, u * L, 0.1, z));
  for (const z of [SZ0, SZ1]) slopeG.add(box((S1 - S0) * L + 0.06, 0.16, 0.06, frameM, (S0 + S1) / 2 * L, 0.1, z));
  const hinge = new THREE.Group(); hinge.position.set(S1 * L, 0.18, 0); slopeG.add(hinge);
  const pane = box((S1 - S0) * L, 0.03, SZ1 - SZ0, glass(0xbfd6e6, 0.35), -(S1 - S0) * L / 2, 0, (SZ0 + SZ1) / 2); pane.castShadow = false; hinge.add(pane);
  hinge.rotation.z = -(rain ? 0.85 : day ? 0.55 : 0.4);
  const skyC = new THREE.Vector3((X0 + Math.cos(ang) * (S0 + S1) / 2 * L), KW + Math.sin(ang) * (S0 + S1) / 2 * L, (SZ0 + SZ1) / 2);
  // furniture
  const bed = new THREE.Group(); bed.position.set(-1.12, 0, -0.45); scene.add(bed);
  bed.add(box(0.95, 0.28, 2.0, M(0x6b4b35, 0.7), 0, 0.14, 0)); bed.add(rbox(0.9, 0.18, 1.95, 0.06, M(0xefe9dd, 0.95), 0, 0.37, 0));
  const sheet = rbox(0.92, 0.06, 1.3, 0.03, M(night ? 0x9fb8c9 : 0xb9cfdc, 0.95), 0.02, 0.48, 0.25); sheet.rotation.z = 0.04; bed.add(sheet);
  bed.add(rbox(0.6, 0.13, 0.36, 0.06, M(0xf4f1ea, 0.95), 0, 0.52, -0.75));
  const desk = new THREE.Group(); desk.position.set(1.28, 0, -1.05); scene.add(desk);
  desk.add(box(0.75, 0.04, 1.1, M(0xd8c6a6, 0.6), 0, 0.74, 0)); for (const [x, z] of [[-0.33, -0.5], [0.33, -0.5], [-0.33, 0.5], [0.33, 0.5]]) desk.add(box(0.04, 0.74, 0.04, M(0x2b2b2b, 0.5), x, 0.37, z));
  desk.add(box(0.34, 0.02, 0.24, M(0x9da2a8, 0.35, 0.6), -0.05, 0.77, 0.1));
  const scr = box(0.34, 0.22, 0.012, night ? M(0x1a1c20, 0.3) : E(0xa9c7ff, 0.9), -0.05, 0.89, -0.02); scr.rotation.x = -0.25; scr.rotation.y = 0; desk.add(scr);
  for (let i = 0; i < 9; i++) desk.add(box(0.05, rr(0.18, 0.26), 0.17, M(pick([0x7a2e2e, 0x2f4a6d, 0xd9b48a, 0x3f5d3a, 0xe8e0cc]), 0.8), 0.32 - i * 0.06, 1.42, -0.42));
  desk.add(box(0.7, 0.03, 0.22, M(0xd8c6a6, 0.6), 0.02, 1.3, -0.42));
  // wall thermometer (fiction: the room's own reading)
  const reading = night ? '38 °C' : rain ? '29 °C' : '39 °C', THX = night ? [-1.25, 1.2] : [-0.5, 1.45];
  const th = mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshBasicMaterial({ map: signTex([reading], { w: 256, h: 160, bg: '#141619', fg: night || day ? '#ff5b3a' : '#9fe3a8', font: 'IBM Plex Mono', weight: 600, size: 74 }) }), ...THX, Z0 + 0.03, false, false); scene.add(th);
  scene.add(box(0.33, 0.22, 0.02, M(0x2a2c30, 0.5), ...THX, Z0 + 0.012));
  // posters
  for (const [x, y, c1, c2] of [[0.15, 1.75, '#d8573a', '#f2d39b'], [1.25, 2.05, '#2f4a6d', '#e3c26a']]) scene.add(mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshStandardMaterial({ map: canvasTex(128, 170, (g, w, h) => { g.fillStyle = c2; g.fillRect(0, 0, w, h); g.fillStyle = c1; g.beginPath(); g.arc(w / 2, h * 0.42, w * 0.3, 0, 7); g.fill(); g.fillRect(w * 0.15, h * 0.78, w * 0.7, 6); g.fillRect(w * 0.25, h * 0.86, w * 0.5, 4); }), roughness: 0.9 }), x, y, Z0 + 0.01, false, true));
  // stand fan facing the bed
  const fan = new THREE.Group(); fan.position.set(0.05, 0, -1.1); fan.rotation.y = -Math.PI / 2 - 0.35; scene.add(fan);
  const fm = M(0xf0efe9, 0.45), fd = M(0x3a3d42, 0.5, 0.3);
  fan.add(cyl(0.18, 0.2, 0.04, fm, 0, 0.02, 0, 24)); fan.add(cyl(0.02, 0.02, 1.0, fd, 0, 0.52, 0, 8)); fan.add(cyl(0.07, 0.08, 0.16, fm, 0, 1.08, -0.07, 16).rotateX(Math.PI / 2));
  const blades = new THREE.Group(); blades.position.set(0, 1.08, 0.04); fan.add(blades);
  for (let i = 0; i < 3; i++) { const b = box(0.07, 0.17, 0.01, M(0x9fc4d8, 0.4), 0, 0.1, 0); const bg = new THREE.Group(); bg.rotation.z = i * Math.PI * 2 / 3; bg.add(b); blades.add(bg); }
  for (const zz of [0.0, 0.08]) { const r = mesh(new THREE.TorusGeometry(0.21, 0.006, 6, 40), fd, 0, 1.08, zz); fan.add(r); }
  for (let i = 0; i < 12; i++) { const s2 = box(0.004, 0.42, 0.004, fd, 0, 1.08, 0.08); s2.rotation.z = i * Math.PI / 12; fan.add(s2); }
  // water bottles, towel on the floor
  for (const [x, z] of [[0.15, 0.2], [0.28, 0.12]]) scene.add(cyl(0.04, 0.04, 0.3, glass(0xcfe3f2, 0.5), x, 0.15, z, 14));
  const anim = [(t) => { blades.rotation.z = rain ? -18 * Math.min(t - t * t / 8, 2) : -t * 18; fan.rotation.y = -Math.PI / 2 - 0.35 + Math.sin(t * 0.9) * (rain ? 0.35 * Math.max(0, 1 - t / 3) : 0.35); }];
  // Inès
  let ines;
  if (day) {
    ines = person({ ...INES, ...SIT, rsh: [-2.1, -0.15], rel: -1.25, lsh: [-0.35, 0.12], lel: -0.6, neck: [0.18, 0.15, 0.05], mouth: 'open' }); ines.position.set(-0.62, -0.42 + 0.03, -0.25); ines.rotation.y = Math.PI / 2 - 0.2; scene.add(ines);
    const nb = box(0.21, 0.28, 0.012, M(0xd9534a, 0.7), 0, -0.3, 0.06); nb.rotation.x = 0.2; ines.userData.rig.rEl.add(nb);
    const towel = mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 24, Math.PI * 1.3), M(0x8fc0d4, 0.95), 0, 0.64, 0.02); towel.rotation.x = Math.PI / 2; towel.rotation.z = Math.PI * 0.85; ines.userData.rig.torso.add(towel);
    const fly = sph(0.012, M(0x111111, 0.6), 0, 1.6, -0.6, 8); scene.add(fly);
    anim.push((t) => { animPerson(ines, t, { breath: 1.6, look: 0.4, sway: 0.6, phase: 0.4 }); ines.userData.rig.rEl.rotation.x += Math.sin(t * 9) * 0.35; ines.userData.rig.head.rotation.y += Math.sin(t * 0.8) * 0.18;
      fly.position.set(-0.2 + Math.sin(t * 2.3) * 0.5 + Math.sin(t * 7.1) * 0.06, 1.45 + Math.sin(t * 3.1) * 0.25, -0.5 + Math.cos(t * 1.7) * 0.4); });
  } else if (night) {
    ines = person({ ...INES, lhip: [-1.75, 0.12], rhip: [-1.75, -0.12], lkn: 2.1, rkn: 2.1, lsh: [-1.15, 0.28], rsh: [-1.15, -0.28], lel: -1.45, rel: -1.45, neck: [0.32, 0, 0], spine: -0.12 }); ines.position.set(-1.38, -0.44, -0.55); ines.rotation.y = Math.PI / 2; scene.add(ines);
    const ph = box(0.075, 0.15, 0.01, E(0xdfe8ff, 0.7), 0, -0.31, 0.05); ph.rotation.x = 0.6; ines.userData.rig.rEl.add(ph);
    // the screen lights her face, not the low ceiling right above her
    ines.updateMatrixWorld(true); const hp = new THREE.Vector3(), pp = new THREE.Vector3(); ines.userData.rig.head.getWorldPosition(hp); ph.getWorldPosition(pp);
    const face = spot(scene, 0xcfe0ff, 2.2, pp.x, pp.y, pp.z, hp.x, hp.y + 0.06, hp.z, 0.5, 0.8, false, 1.4);
    anim.push((t) => { animPerson(ines, t, { breath: 2.2, look: 0.25, nod: 0.3, phase: 1 }); const k = 0.75 + 0.25 * Math.sin(t * 2.7) * Math.sin(t * 1.1); ph.material.emissiveIntensity = 0.7 * k; face.intensity = 2.2 * k; ines.userData.rig.rEl.rotation.x += Math.sin(t * 3.3) * 0.05; });
  } else {
    ines = person({ ...INES, lsh: [-0.5, 0.5], lel: -0.3, rsh: [-0.5, -0.5], rel: -0.3, neck: [-0.75, 0, 0], eyes: 'closed', mouth: 'open' }); ines.position.set(skyC.x + 0.05, 0, skyC.z); ines.rotation.y = Math.PI / 2 + 0.3; scene.add(ines);
    anim.push((t) => { animPerson(ines, t, { breath: 1.2, look: 0.15, sway: 0.8, phase: 2 }); const a = ease(t / 2.6), R0 = ines.userData.rig;
      R0.lSh.rotation.x -= 0.9 * a; R0.rSh.rotation.x -= 0.9 * a; R0.lSh.rotation.z -= 0.5 * a; R0.rSh.rotation.z += 0.5 * a; R0.lEl.rotation.x -= 0.5 * a; R0.rEl.rotation.x -= 0.5 * a; R0.head.rotation.x -= 0.1 * a; });
    const splash = dust(160, [skyC.x - 0.45, 0.0, skyC.z - 0.45, skyC.x + 0.45, 0.12, skyC.z + 0.45], 0xeef4fa, 0.02, 0.8); scene.add(splash);
    scene.add(mesh(new THREE.CircleGeometry(0.42, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6d5a48, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.55 }), skyC.x + 0.3, 0.004, skyC.z, false, true));
    anim.push((t) => { splash.position.y = Math.abs(Math.sin(t * 11)) * 0.05; splash.rotation.y = t * 2; });
    const R = rainLines(500, [skyC.x - 0.5, skyC.y - 1.2, skyC.z - 0.5, skyC.x + 0.5, skyC.y + 3, skyC.z + 0.5], 0.3, 0xe6eef6, 0.45); scene.add(R);
    const R2 = rainLines(2500, [-8, 2, -12, 8, 14, -2], 0.8, 0xdde5ee, 0.3); scene.add(R2);
    anim.push((t) => { R.position.y = -((t * 7) % 1.5); R2.position.y = -((t * 9) % 3); });
  }
  // light through the skylight
  if (day) {
    spot(scene, 0xfff1d6, 170, skyC.x - 0.6, skyC.y + 6, skyC.z - 0.3, skyC.x + 0.14, 0.5, skyC.z + 0.07, 0.3, 0.45, true, 14);
    scene.add(shaft(skyC.x, skyC.y + 0.05, skyC.z, 1.9, 0.36, 0.62, 0xfff0d0, 0.07, 0.1, 0));
    const motes = dust(260, [skyC.x - 0.6, 0.4, skyC.z - 0.4, skyC.x + 0.5, skyC.y, skyC.z + 0.4], 0xfff3dc, 0.018, 0.7); scene.add(motes);
    anim.push((t) => { motes.position.y = Math.sin(t * 0.6) * 0.08; motes.position.x = Math.sin(t * 0.37) * 0.05; motes.rotation.y = t * 0.05; });
    hemi(scene, 0xffe9c8, 0x6b4a32, 0.5); point(scene, 0xffc98a, 2.4, 4, -0.6, 0.7, -0.3); point(scene, 0xffd9b0, 3.2, 6, 0.9, 1.6, 1.3);
  } else if (night) {
    spot(scene, 0x7f98d8, 30, skyC.x - 1.7, skyC.y + 5.7, skyC.z, skyC.x + 0.4, 0.5, skyC.z, 0.35, 0.6, true, 12);
    hemi(scene, 0x34406a, 0x2a1a14, 0.42); point(scene, 0xff9a5a, 0.8, 4, 1.2, 2.2, 1.0);
    scene.add(glow(0xff5b3a, 0.3, ...THX, Z0 + 0.06, 0.3));
  } else {
    spot(scene, 0xc9d6e6, 70, skyC.x - 0.6, skyC.y + 6, skyC.z, skyC.x + 0.14, 0.4, skyC.z, 0.35, 0.6, true, 14);
    scene.add(shaft(skyC.x, skyC.y + 0.05, skyC.z, 1.9, 0.36, 0.62, 0xd9e4f0, 0.05, 0.1, 0));
    hemi(scene, 0xaebccc, 0x3a3430, 0.45);
  }
  return { ines, anim };
}

// ---------- STREET: a Haussmann street in the heat (pharmacy | peak | ambulance) ----------
function pharmacyCross(texts) {
  if (!Array.isArray(texts)) texts = [texts];
  const texs = texts.map(text => canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); const a = w * 0.33;
    g.fillStyle = '#0d2a17'; g.fillRect(a, 0, w - 2 * a, h); g.fillRect(0, a, w, h - 2 * a);
    g.fillStyle = '#21d36b'; for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) { const inX = x > a && x < w - a, inY = y > a && y < h - a; if (inX || inY) { g.globalAlpha = 0.35; g.fillRect(x - 2, y - 2, 4, 4); } }
    g.globalAlpha = 1; g.fillStyle = '#d9ffe6'; g.font = '600 78px "IBM Plex Mono"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#3dff8a'; g.shadowBlur = 18; g.fillText(text, w / 2, h / 2 + 4);
  }));
  const m = new THREE.MeshBasicMaterial({ map: texs[0], transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, toneMapped: false });
  const g = new THREE.Group(); const p = mesh(new THREE.PlaneGeometry(1.25, 1.25), m, 0, 0, 0, false, false); g.add(p);
  const back = box(1.25, 0.4, 0.12, M(0x1b1e22, 0.4), 0, 0, -0.07); const back2 = box(0.4, 1.25, 0.12, M(0x1b1e22, 0.4), 0, 0, -0.07); g.add(back); g.add(back2);
  g.add(box(0.5, 0.06, 0.06, M(0x2a2d31, 0.4, 0.5), 0.75, 0, -0.07));
  g.userData.show = (i) => { m.map = texs[Math.min(i, texs.length - 1)]; };
  return g;
}
function umbrellaPerson() {
  const p = person({ ...SUMMER(), rsh: [-1.25, -0.1], rel: -1.0, top: 0xe7c86b }); const u = new THREE.Group();
  u.add(mesh(new THREE.ConeGeometry(0.62, 0.28, 16, 1, true), M(0x2c3e66, 0.7), 0, 0.82, 0)); u.add(cyl(0.008, 0.008, 0.85, M(0x222222, 0.5), 0, 0.4, 0, 6));
  u.children[0].position.y = 0; u.children[1].position.y = -0.42; u.position.set(0.1, 1.3, 0.1); p.userData.rig.torso.add(u); return p;   // carried above the head, steady while she walks
}
function busGeneric() {
  const g = new THREE.Group(); g.add(rbox(12, 3.0, 2.5, 0.3, M(0xeeeeec, 0.4, 0.1), 0, 1.75, 0)); g.add(box(12.02, 0.9, 2.52, glass(0x1e2630, 0.85), 0, 2.2, 0)); g.add(box(12.04, 0.25, 2.54, M(0x3c6e9e, 0.5), 0, 0.85, 0));
  for (const x of [-4, 4]) for (const s of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 18), M(0x151619, 0.7), x, 0.5, 1.2 * s); w.rotation.x = Math.PI / 2; g.add(w); }
  castAll(g); return g;
}
function ambulance() {
  const g = new THREE.Group(), W = M(0xf4f4f2, 0.4, 0.15);
  g.add(rbox(5.6, 2.3, 2.1, 0.18, W, 0, 1.55, 0)); g.add(rbox(1.5, 1.4, 2.0, 0.2, W, 3.2, 1.0, 0));
  g.add(box(1.0, 0.7, 1.9, glass(0x1d2530, 0.85), 3.35, 1.55, 0)); g.add(box(5.62, 0.3, 2.12, M(0xf2b230, 0.5), 0, 1.1, 0)); g.add(box(5.62, 0.16, 2.12, M(0x2f62b4, 0.5), 0, 1.35, 0));
  const blue = E(0x3f7dff, 4); for (const z of [-0.6, 0.6]) g.add(box(0.5, 0.16, 0.3, blue, 2.4, 2.8, z)); g.add(box(0.3, 0.14, 1.6, blue, -2.7, 2.78, 0));
  for (const s of [-1, 1]) { const d = box(0.05, 2.0, 1.0, W, -2.82, 1.5, 0.5 * s); d.position.x = -2.82 - 0.5; d.rotation.y = s * 1.45; d.position.z = 1.05 * s; g.add(d); }
  for (const x of [-1.8, 2.3]) for (const s of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.26, 18), M(0x151619, 0.7), x, 0.4, 1.02 * s); w.rotation.x = Math.PI / 2; g.add(w); }
  castAll(g); return { g, blue };
}
export function street(scene, { variant }) {
  const peak = variant === 'peak', amb = variant === 'ambulance';
  scene.background = grad([[0, '#9fb9cf'], [0.55, '#d9dccf'], [1, '#efc78e']]);
  scene.fog = new THREE.Fog(0xe6caa0, 90, peak ? 420 : 520); scene.environmentIntensity = 0.28;
  const road = new THREE.MeshStandardMaterial({ map: noiseTex('#3d3d40', 10, 256, 256, [30, 30], 2500), roughness: peak ? 0.22 : 0.55, metalness: peak ? 0.25 : 0.05 });
  scene.add(ground(500, road));
  const walk = M(0xb9b0a2, 0.85); for (const s of [-1, 1]) scene.add(box(4, 0.15, 260, walk, s * 7, 0.075, -110));
  for (let z = -2; z > -60; z -= 4.5) for (const s of [-1, 1]) scene.add(box(0.9, 0.012, 0.18, M(0xe6e1d6, 0.7), s * 0.15, 0.006, z));
  seed(53);
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const b = building(14, 14, 6, { key: (i + (s > 0 ? 3 : 0)) % 6, shops: true }); b.position.set(s * 16, 0, 2 - i * 14.6); scene.add(b); }
  const endB = building(40, 14, 7, { key: 2, shops: true }); endB.position.set(0, 0, -150); scene.add(endB);
  // shop awnings and the pharmacy
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { if (s > 0 && i === 1) continue; const aw = box(0.9, 0.08, 6, M(pick([0x7a2e2e, 0x2f4a6d, 0x3f5d3a, 0xb8862a]), 0.8), s * 8.6, 3.6, -3 - i * 14.6); aw.rotation.z = s * 0.35; scene.add(aw); }
  const sign = mesh(new THREE.PlaneGeometry(6, 0.7), new THREE.MeshStandardMaterial({ map: signTex(['PHARMACIE'], { w: 1024, h: 120, bg: '#1f7a46', fg: '#ffffff', font: 'Inter', weight: 700, size: 76 }), roughness: 0.6 }), 8.95, 3.9, -12.6, false, false); sign.rotation.y = -Math.PI / 2; scene.add(sign);
  const cross = pharmacyCross(peak ? ['49°C', '50°C'] : amb ? ['50°C', '16:40'] : ['43°C', '16:30']); cross.position.set(8.15, 4.6, -9.5); scene.add(cross);
  scene.add(glow(0x2dff7a, 2.6, 8.15, 4.6, -9.45, 0.25));
  // plane trees
  const trees = []; for (let z = -26; z > -120; z -= 10) for (const s of [-1, 1]) { const t = tree({ s: 1.5, color: pick([0x6d8a3c, 0x7a8f40, 0x8a9a45]) }); t.position.set(s * 6.2, 0.15, z + (s > 0 ? 4 : 0)); scene.add(t); trees.push(t); }
  hemi(scene, 0xfff1d8, 0x806a55, 0.42);
  sun(scene, { pos: [40, 90, 10], color: 0xfff2d8, intensity: 2.2, size: 70, far: 260, target: [0, 0, -30] });
  const anim = [(t) => { trees.forEach((tr, i) => { tr.rotation.z = Math.sin(t * 0.9 + i) * 0.012; tr.rotation.x = Math.sin(t * 0.7 + i * 1.7) * 0.008; }); if (!peak) cross.userData.show(Math.floor(t / 1.6) % 2); }];
  if (variant === 'pharmacy') {
    const walkers = [];
    const u = umbrellaPerson(); u.position.set(5.4, 0.15, -9); u.rotation.y = 0.08; scene.add(u); walkers.push([u, 0.8, -9]);
    const drinker = person({ ...SUMMER(), rsh: [-2.4, -0.35], rel: -1.7, neck: [-0.45, 0, 0] }); drinker.position.set(7.6, 0.15, -9); drinker.rotation.y = -Math.PI / 2 + 0.4; scene.add(drinker);
    drinker.userData.rig.rEl.add(cyl(0.035, 0.035, 0.22, glass(0xcfe3f2, 0.55), 0, -0.32, 0.06, 12));
    const ps = people(7, [5.4, 8.0, -42, -14], { y: 0.15 }); ps.forEach((p, i) => { p.rotation.y = (i % 2 ? Math.PI : 0) + rr(-0.08, 0.08); scene.add(p); walkers.push([p, rr(0.7, 1.05), p.position.z]); });
    const ls = people(3, [-8.2, -6.0, -60, -30], { y: 0.15 }); ls.forEach((p, i) => { p.rotation.y = i % 2 ? Math.PI : 0; scene.add(p); walkers.push([p, rr(0.9, 1.2), p.position.z]); });
    const bus = busGeneric(); bus.position.set(-2.2, 0, -90); bus.rotation.y = Math.PI / 2; scene.add(bus);
    anim.push((t) => { walkers.forEach(([p, sp, z0], i) => { p.position.z = z0 + Math.cos(p.rotation.y) * sp * t; animPerson(p, t, { walk: sp * 1.35, stride: 0.36, look: 0.4, phase: i, armSwing: p === u ? 0 : 1 }); });
      animPerson(drinker, t, { breath: 1.3, look: 0.1, phase: 3 }); drinker.userData.rig.rSh.rotation.x += Math.sin(t * 1.4) * 0.12; bus.position.z = -90 + 5.5 * t; });
  } else if (peak) {
    const mist = new THREE.Group(); mist.position.set(5.2, 0.15, -8); scene.add(mist);
    mist.add(cyl(0.06, 0.07, 3.2, M(0x2f3236, 0.5, 0.5), 0, 1.6, 0, 10)); mist.add(mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 24), M(0x2f3236, 0.5, 0.5), 0, 3.2, 0).rotateX(Math.PI / 2));
    const fog = dust(420, [-0.9, 1.0, -0.9, 0.9, 3.3, 0.9], 0xffffff, 0.35, 0.22); mist.add(fog);
    const lone = person({ ...SUMMER(), rsh: [-0.2, -0.1] }); lone.position.set(-6.5, 0.15, -48); scene.add(lone);
    const pig = flock(scene, 4, [0, 0, -30], 9, 9, 0.8, 1.2, 0x5a5f66);
    anim.push((t) => { fog.rotation.y = t * 0.6; fog.position.y = -((t * 0.5) % 0.6); lone.position.z = -48 + 0.6 * t; animPerson(lone, t, { walk: 0.75, stride: 0.28, phase: 1, look: 0.3 }); cross.userData.show(t >= 2.7 ? 1 : 0); pig(t); });
  } else {
    const A = ambulance(); A.g.position.set(4.0, 0, -6.5); A.g.rotation.y = Math.PI / 2; scene.add(A.g);
    const b1 = point(scene, 0x3f7dff, 9, 12, 4.2, 3.0, -3.8), b2 = point(scene, 0x3f7dff, 9, 12, 3.8, 3.0, -9);
    const str = new THREE.Group(); str.position.set(5.2, 0, -1.7); str.rotation.y = 0.15; scene.add(str);
    str.add(box(0.62, 0.08, 1.95, M(0x2a2d31, 0.5, 0.5), 0, 0.82, 0)); for (const [x, z] of [[-0.25, -0.85], [0.25, -0.85], [-0.25, 0.85], [0.25, 0.85]]) { str.add(box(0.04, 0.75, 0.04, M(0x8a8f94, 0.4, 0.6), x, 0.42, z)); str.add(sph(0.06, M(0x151619, 0.6), x, 0.06, z, 10)); }
    str.add(rbox(0.6, 0.1, 1.9, 0.04, M(0xf0f0ee, 0.9), 0, 0.91, 0));
    const old = person({ skin: 0xf0c9ab, hair: 0xe8e4dc, hairStyle: 'bald', top: 0x6f8aa0, pants: 0x4a4a4a, eyes: 'closed', lsh: [0.1, 0.1], rsh: [0.1, -0.1] }); old.rotation.order = 'YXZ'; old.rotation.x = -Math.PI / 2; old.rotation.y = Math.PI; old.position.set(0, 1.04, -0.95); str.add(old);
    str.add(rbox(0.64, 0.08, 1.15, 0.03, M(0xe4b84a, 0.35, 0.5), 0, 1.12, -0.38));
    const medic = { skin: 0xd8a37a, top: 0x1d2a44, pants: 0x1d2a44, shoes: 0x111111, hairStyle: 'short' };
    const m1 = person({ ...medic, hair: 0x2b1d14, rsh: [-0.6, -0.1], lsh: [-0.6, 0.1], rel: -0.4, lel: -0.4 }); m1.position.set(5.0, 0, 0.0); m1.rotation.y = Math.PI + 0.15; scene.add(m1);
    const m2 = person({ ...medic, skin: 0x9c6a48, hair: 0x1b1b1b, rsh: [-0.6, -0.1], lsh: [-0.6, 0.1], rel: -0.4, lel: -0.4 }); m2.position.set(5.45, 0, -3.5); m2.rotation.y = 0.15; scene.add(m2);
    for (const m of [m1, m2]) for (const k of ['lSh', 'rSh']) m.userData.rig[k].add(box(0.14, 0.04, 0.14, E(0xd9ff3a, 0.5), 0, -0.2, 0));
    const door = box(2.4, 3.6, 0.2, M(0x2f4a3a, 0.6), 8.92, 1.8, -1.2); door.rotation.y = Math.PI / 2; scene.add(door);
    const nbr = person({ ...SUMMER(), sleeves: true, top: 0x8a5a8f }); nbr.position.set(8.4, 6.6, -6.2); nbr.rotation.y = -Math.PI / 2 + 0.3; scene.add(nbr);
    anim.push((t) => { const f = (Math.sin(t * 14) > 0 ? 1 : 0.15); A.blue.emissiveIntensity = 4 * f; b1.intensity = 9 * f; b2.intensity = 9 * (1.15 - f); [m1, m2].forEach((m, i) => animPerson(m, t, { walk: 0.9, stride: 0.22, armSwing: 0, look: 0.2, phase: i * 2 })); const dz = -1.1 * ease(t / 4); str.position.z = -1.7 + dz; m1.position.z = 0.0 + dz; m2.position.z = -3.5 + dz; animPerson(nbr, t, { breath: 1.2, look: 0.6, sway: 1, phase: 4 }); cross.userData.show(Math.floor(t / 1.6) % 2); });
  }
  return { anim };
}

// ---------- RAILS: suburban line in the heat, a train crawling past a 40 board ----------
export function rails(scene) {
  scene.background = grad([[0, '#9fb9cf'], [0.55, '#d9dccf'], [1, '#efc78e']]);
  scene.fog = new THREE.Fog(0xe6caa0, 120, 900); scene.environmentIntensity = 0.28;
  scene.add(ground(2000, new THREE.MeshStandardMaterial({ map: noiseTex('#b7a065', 22, 256, 256, [80, 80], 3500), roughness: 1 })));
  const bal = new THREE.Shape(); bal.moveTo(-5.2, 0); bal.lineTo(5.2, 0); bal.lineTo(4.0, 0.45); bal.lineTo(-4.0, 0.45); bal.lineTo(-5.2, 0);
  const bg = new THREE.ExtrudeGeometry(bal, { depth: 700, bevelEnabled: false }); bg.translate(0, 0, -650);
  scene.add(mesh(bg, new THREE.MeshStandardMaterial({ map: noiseTex('#7c746a', 30, 256, 256, [6, 160], 6000), roughness: 1 }), 0, 0, 0, false, true));
  for (const tx of [-2.1, 2.1]) {
    scene.add(instanced(new THREE.BoxGeometry(2.6, 0.16, 0.26), M(0x9c978e, 0.9), 1100, (i, o) => { o.position.set(tx, 0.5, 40 - i * 0.6); }));
    for (const s of [-1, 1]) scene.add(box(0.07, 0.16, 700, M(0x9b9ea2, 0.28, 0.85), tx + s * 0.72, 0.66, -300));
  }
  // catenary
  const steel = M(0x6b7076, 0.5, 0.6);
  for (let z = 20; z > -600; z -= 48) { scene.add(box(0.28, 7.6, 0.28, steel, -4.7, 3.8, z)); scene.add(box(5.8, 0.12, 0.12, steel, -1.9, 6.9, z)); }
  for (const tx of [-2.1, 2.1]) { const w = cyl(0.012, 0.012, 640, M(0x3a3d40, 0.4, 0.8), tx, 6.1, -300, 4); w.rotation.x = Math.PI / 2; w.castShadow = false; scene.add(w); }
  // the train on the left track, coming towards us at walking pace
  const train = new THREE.Group(); train.position.set(-2.1, 0.75, -46); scene.add(train);
  const body = M(0xeef0f0, 0.38, 0.15), band = M(0x2b4f8c, 0.5), gl = glass(0x1a222c, 0.9);
  for (let c = 0; c < 4; c++) { const z = -c * 26.5; train.add(rbox(2.9, 3.4, 26, 0.35, body, 0, 1.9, z - 13)); train.add(box(2.92, 0.32, 25.6, band, 0, 1.05, z - 13)); train.add(box(2.94, 0.75, 24, gl, 0, 2.55, z - 13)); }
  const nose = rbox(2.9, 2.2, 2.6, 0.6, body, 0, 1.6, 1.0); train.add(nose); train.add(box(2.4, 1.0, 0.1, gl, 0, 2.7, 0.2).rotateX(-0.35));
  for (const s of [-1, 1]) train.add(box(0.28, 0.14, 0.05, E(0xfff6e0, 6), 0.95 * s, 1.15, 2.32));
  train.add(box(2.0, 0.08, 0.08, steel, 0, 3.85, -6)); train.add(box(0.06, 1.0, 0.06, steel, 0, 4.3, -6).rotateZ(0.6));
  castAll(train);
  // temporary speed limit board
  const brd = new THREE.Group(); brd.position.set(-4.6, 0, -9); scene.add(brd);
  brd.add(box(0.1, 2.2, 0.1, M(0x2b2b2b, 0.6), 0, 1.1, 0)); brd.add(mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: signTex(['40'], { w: 256, h: 256, bg: '#f2c230', fg: '#111111', font: 'Inter', weight: 800, size: 150 }), roughness: 0.6 }), 0, 2.45, 0.06, false, false));
  // suburb: low houses, poplars
  seed(62); for (let i = 0; i < 40; i++) { const s = pick([-1, 1]), x = s * rr(14, 70), z = rr(-420, -20); const h = new THREE.Group(); h.add(box(rr(7, 10), rr(5, 7), rr(7, 9), M(pick([0xe6dccb, 0xd8c6a6, 0xefe6d6]), 0.9), 0, 3, 0)); h.add(mesh(new THREE.ConeGeometry(6.5, 3, 4), M(0x9a5a3c, 0.8), 0, 7.4, 0).rotateY(Math.PI / 4)); h.position.set(x, 0, z); castAll(h); scene.add(h); }
  for (let i = 0; i < 26; i++) { const t = tree({ s: rr(1.1, 1.6), color: pick([0x7a8a40, 0x8a8f45, 0x6f7f3a]) }); t.position.set(pick([-1, 1]) * rr(9, 40), 0, rr(-300, -10)); scene.add(t); }
  hemi(scene, 0xfff3dc, 0x7a6a50, 0.42); sun(scene, { pos: [50, 80, 30], color: 0xfff2d8, intensity: 2.2, size: 60, far: 240, target: [0, 0, -30] });
  sunDisk(scene, 200, 260, -700, 120);
  const haze = dust(200, [-6, 0.6, -120, 6, 2.0, -6], 0xfff0d0, 1.0, 0.025); scene.add(haze);
  const perched = []; for (let i = 0; i < 4; i++) { const b = bird(0x222326); b.scale.setScalar(1.7); b.position.set(-2.1 + rr(-0.05, 0.05), 6.22, -22 - i * 0.8); b.rotation.y = rr(-0.5, 0.5); scene.add(b); perched.push({ b, x0: b.position.x, z0: b.position.z, d: rr(0, 0.5) }); }
  const anim = [(t) => { train.position.z = -46 + 1.1 * t; haze.position.x = Math.sin(t * 2.1) * 0.15;
    perched.forEach(({ b, x0, z0, d }, i) => { const k = Math.max(0, t - 1.3 - d); b.position.set(x0 + k * (2 + i) * (i % 2 ? 1 : -1), 6.22 + k * k * 2.2 + k * 1.4, z0 + k * 2.5); const fl = k > 0 ? Math.sin(t * 15 + i) * 0.8 : 0.08 * Math.sin(t * 3 + i); b.userData.wings[0].rotation.z = fl; b.userData.wings[1].rotation.z = -fl; }); }];
  return { anim };
}

// ---------- PLANT: a nuclear plant on a low, too-warm river ----------
function tower(h = 120, r0 = 46, r1 = 27, r2 = 31) {
  const pts = []; for (let i = 0; i <= 24; i++) { const y = i / 24 * h, k = y / h; const r = k < 0.78 ? r1 + (r0 - r1) * Math.pow(1 - k / 0.78, 1.6) : r1 + (r2 - r1) * (k - 0.78) / 0.22; pts.push(new THREE.Vector2(r, y)); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ map: noiseTex('#d7d2c8', 12, 256, 256, [6, 2], 2000), roughness: 0.95, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true; return m;
}
export function plant(scene) {
  scene.background = grad([[0, '#9fb9cf'], [0.55, '#d9dccf'], [1, '#efc78e']]);
  scene.fog = new THREE.Fog(0xe6caa0, 300, 2400); scene.environmentIntensity = 0.28;
  scene.add(ground(4000, new THREE.MeshStandardMaterial({ map: noiseTex('#a99566', 20, 256, 256, [60, 60], 3000), roughness: 1 })));
  // cracked mud banks and the shrunken river
  const mud = new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#9c8463'; g.fillRect(0, 0, w, h); seed(9); g.strokeStyle = 'rgba(60,45,30,0.85)'; g.lineWidth = 2; for (let i = 0; i < 180; i++) { let x = rr(0, w), y = rr(0, h); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rr(-30, 30); y += rr(-30, 30); g.lineTo(x, y); } g.stroke(); } }, [14, 4]), roughness: 1 });
  scene.add(mesh(new THREE.PlaneGeometry(2400, 150).rotateX(-Math.PI / 2), mud, 0, 0.05, -60, false, true));
  scene.add(mesh(new THREE.PlaneGeometry(2400, 80).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4f6f66, roughness: 0.1, metalness: 0.4 }), 0, 0.12, -62, false, true));
  // the plant on the far bank
  const P = new THREE.Group(); P.position.set(0, 0, -600); scene.add(P);
  const t1 = tower(); t1.position.set(-45, 0, 0); P.add(t1); const t2 = tower(); t2.position.set(50, 0, -40); P.add(t2);
  const conc = M(0xe2ded6, 0.85);
  for (const [x, z] of [[120, 60], [170, 60]]) { P.add(cyl(18, 18, 45, conc, x, 22.5, z, 32)); P.add(mesh(new THREE.SphereGeometry(18, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), conc, x, 45, z)); }
  P.add(box(110, 28, 34, M(0xcfd3d6, 0.8), 175, 14, 110)); P.add(box(60, 18, 30, M(0xbfc5c9, 0.8), 260, 9, 40)); P.add(cyl(3, 4, 90, conc, 245, 45, 120, 16));
  castAll(P);
  const steam = []; for (const [x, z] of [[-45, 0], [50, -40]]) { const s = dust(160, [x - 18, 122, z - 18, x + 18, 150, z + 18], 0xffffff, 26, 0.18); P.add(s); steam.push(s); }
  // pylons
  for (let i = 0; i < 6; i++) { const py = new THREE.Group(); py.position.set(-300 + i * 120, 0, -260 - i * 15); py.add(box(2, 50, 2, M(0x8a8f94, 0.6, 0.5), 0, 25, 0)); py.add(box(26, 1.2, 1.2, M(0x8a8f94, 0.6, 0.5), 0, 44, 0)); py.add(box(18, 1.2, 1.2, M(0x8a8f94, 0.6, 0.5), 0, 36, 0)); scene.add(py); }
  // water-temperature board on our bank (text is part of the decor, written cleanly: fix D03)
  const bd = new THREE.Group(); bd.position.set(3.6, 1.4, 6); bd.rotation.y = -0.2; scene.add(bd);
  for (const x of [-1.1, 1.1]) bd.add(box(0.12, 4.0, 0.12, M(0x3a3d40, 0.6, 0.4), x, 0.6, 0));
  bd.add(mesh(new THREE.PlaneGeometry(2.6, 1.4), new THREE.MeshStandardMaterial({ map: signTex(['EAU', '28 °C'], { w: 512, h: 280, bg: '#f4f2ec', fg: '#b3261e', font: 'Inter', weight: 800, size: 96 }), roughness: 0.7 }), 0, 2.2, 0.07, false, false));
  bd.add(box(2.7, 1.5, 0.08, M(0x3a3d40, 0.6), 0, 2.2, 0.0)); castAll(bd);
  for (let i = 0; i < 18; i++) { const t = tree({ s: rr(1.2, 1.8), color: pick([0x8a8f45, 0x9a9045, 0x7a8a40]) }); t.position.set(rr(-200, 200), 0, rr(20, 90) * pick([1, -1]) - (rnd() < 0.5 ? 0 : 160)); scene.add(t); }
  hemi(scene, 0xfff1d8, 0x7a6a50, 0.42); sun(scene, { pos: [120, 220, 60], color: 0xfff2d8, intensity: 2.2, size: 400, far: 1200, target: [0, 0, -200], map: 4096 });
  sunDisk(scene, -380, 420, -1200, 200);
  const anim = [(t) => { steam.forEach((s, i) => { s.position.y = (t * 3 + i * 5) % 12; s.material.opacity = 0.16 + 0.03 * Math.sin(t + i); s.material.size = 26 + 7 * Math.sin(t * 0.8 + i); }); }];
  anim.push(flock(scene, 3, [0, 0, -140], 150, 28, 0.1, 3.2, 0x6b6f74));
  return { anim };
}

// ---------- SCHOOL: closed for the heatwave | turned into a shady "cour oasis" ----------
export function school(scene, { variant }) {
  const oasis = variant === 'oasis';
  scene.background = grad([[0, '#9fb9cf'], [0.55, '#d9dccf'], [1, '#efc78e']]);
  scene.fog = new THREE.Fog(0xe6caa0, 120, 520); scene.environmentIntensity = 0.28;
  scene.add(ground(600, new THREE.MeshStandardMaterial({ map: noiseTex('#3d3d40', 10, 256, 256, [30, 30], 2500), roughness: 0.6 })));
  scene.add(box(80, 0.15, 5, M(0xb9b0a2, 0.85), 0, 0.075, 3.5));
  // school building at the back of the yard
  const stone = M(0xe3d6bc, 0.92);
  const fac = mesh(new THREE.BoxGeometry(46, 13, 10), [stone, stone, stone, stone, new THREE.MeshStandardMaterial({ map: canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#e3d6bc'; g.fillRect(0, 0, w, h); for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) { g.fillStyle = '#3a4250'; g.fillRect(c * w / 12 + 10, r * h / 3 + 10, w / 12 - 20, h / 3 - 18); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(c * w / 12 + w / 24 - 1, r * h / 3 + 10, 2, h / 3 - 18); } }), roughness: 0.92 }), stone], 0, 6.5, -24); scene.add(fac);
  scene.add(mesh(frustum(46.4, 10.4, 43, 7, 2.6), ZINC(), 0, 13, -24));
  const eng = (lines, w, h, y, size) => scene.add(mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(lines, { w: 1024, h: Math.round(1024 * h / w), bg: '#d8caae', fg: '#5a4a38', font: 'Newsreader', weight: 600, size }), roughness: 0.9 }), 0, y, -18.94, false, false));
  eng(['LIBERTÉ  ÉGALITÉ  FRATERNITÉ'], 7.6, 0.5, 11.9, 70); eng(['ÉCOLE ÉLÉMENTAIRE'], 6.4, 0.72, 10.95, 104);
  // flag
  const fl = new THREE.Group(); fl.position.set(0, 12.6, -18.8); fl.rotation.z = -0.5; scene.add(fl); fl.add(cyl(0.03, 0.03, 2.4, M(0xd9d9d9, 0.4, 0.6), 0, 1.2, 0, 8));
  const flagP = []; [0x1f3a8a, 0xf4f4f4, 0xd62b2b].forEach((c, i) => { const p = box(0.42, 0.95, 0.01, M(c, 0.8), 0.24 + i * 0.42, 1.9, 0.0); p.rotation.z = 0.5; p.position.x = 0.24 + i * 0.42 * Math.cos(0.5); p.position.y = 1.9 + i * 0.42 * Math.sin(0.5); fl.add(p); flagP.push(p); });
  // street wall and gate
  const wallM = M(0xd4c7ad, 0.92); scene.add(box(18, 2.4, 0.5, wallM, -12, 1.2, 0)); scene.add(box(18, 2.4, 0.5, wallM, 12, 1.2, 0));
  for (const x of [-3.2, 3.2]) scene.add(box(0.9, 3.2, 0.9, wallM, x, 1.6, 0));
  const green = M(0x24453a, 0.5, 0.4);
  const leaf = (sgn) => { const g = new THREE.Group(); g.position.set(-2.75 * sgn, 0, 0); scene.add(g); for (let i = 0; i < 18; i++) g.add(box(0.05, 2.6, 0.05, green, sgn * (0.15 + i * 0.15), 1.4, 0)); g.add(box(2.75, 0.08, 0.06, green, sgn * 1.375, 0.25, 0)); g.add(box(2.75, 0.08, 0.06, green, sgn * 1.375, 2.55, 0)); return g; };
  const gl = leaf(1), gr = leaf(-1);
  if (oasis) { gl.rotation.y = 1.45; gr.rotation.y = -1.45; }
  const yard = new THREE.MeshStandardMaterial({ map: noiseTex(oasis ? '#7f8c4f' : '#45454a', 16, 256, 256, [10, 10], 2400), roughness: oasis ? 1 : 0.5 });
  scene.add(mesh(new THREE.PlaneGeometry(44, 18).rotateX(-Math.PI / 2), yard, 0, 0.02, -9.5, false, true));
  const anim = [(t) => flagP.forEach((p, i) => { p.rotation.y = Math.sin(t * 5.5 - i * 0.9) * 0.4; p.position.z = Math.sin(t * 5.5 - i * 0.9 - 0.5) * 0.08 * i; })];
  if (!oasis) {
    for (const [x, z, r] of [[-6, -8, 2.2], [5, -12, 2.6]]) scene.add(mesh(new THREE.RingGeometry(r, r + 0.1, 48).rotateX(-Math.PI / 2), M(0xf2f2ee, 0.7), x, 0.03, z, false, true));
    for (let i = 0; i < 8; i++) scene.add(box(0.9, 0.012, 0.9, M(0xf2f2ee, 0.7), -1.5 + (i % 2) * 1.0, 0.03, -4 - Math.floor(i / 2) * 1.0));
    const hoop = new THREE.Group(); hoop.position.set(10, 0, -16); hoop.add(box(0.15, 3.4, 0.15, M(0x2f3236, 0.5, 0.4), 0, 1.7, 0)); hoop.add(box(1.4, 1.0, 0.05, M(0xf2f2ee, 0.6), 0, 3.4, 0.3)); castAll(hoop); scene.add(hoop);
    // the notice on the gate (fix D03: clean text in the decor)
    const notice = mesh(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshStandardMaterial({ map: canvasTex(372, 516, (g, w, h) => { g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h); g.fillStyle = '#c62d24'; g.font = '800 52px Inter'; g.textAlign = 'center'; g.fillText('ÉCOLE', w / 2, 92); g.fillText('FERMÉE', w / 2, 152); g.fillStyle = '#1d1d1d'; g.font = '700 40px Inter'; g.fillText('CANICULE', w / 2, 240); g.fillRect(60, 278, w - 120, 4); g.font = '600 34px Inter'; g.fillText('BREVET', w / 2, 350); g.fillText('REPORTÉ', w / 2, 396); g.font = 'italic 500 24px Newsreader'; g.fillStyle = '#444'; g.fillText('La direction', w / 2, 470); }), roughness: 0.8 }), 0.85, 1.45, 0.08, false, false);
    notice.rotation.z = 0.03; scene.add(notice);
    for (const [x, y] of [[0.57, 1.85], [1.13, 1.85], [0.57, 1.05], [1.13, 1.05]]) scene.add(box(0.07, 0.03, 0.005, M(0xd9cfa8, 0.9), x, y, 0.085));
    const haze = dust(160, [-14, 0.2, -18, 14, 1.2, -2], 0xfff0d0, 0.7, 0.025); scene.add(haze);
    const leafy = box(0.12, 0.01, 0.08, M(0xb8862a, 0.8), -7, 0.1, -3); scene.add(leafy);
    anim.push((t) => { haze.position.x = Math.sin(t * 1.9) * 0.2; notice.rotation.x = Math.sin(t * 3.1) * 0.05; notice.rotation.y = Math.sin(t * 2.3) * 0.04; leafy.position.set(-7 + t * 2.4, 0.06 + Math.abs(Math.sin(t * 4.5)) * 0.35, -3 - t * 0.6); leafy.rotation.set(t * 7, t * 3, t * 5); });
    hemi(scene, 0xfff1d8, 0x806a55, 0.42); sun(scene, { pos: [30, 70, 30], color: 0xfff2d8, intensity: 2.2, size: 45, far: 200, target: [0, 0, -10] });
  } else {
    seed(88);
    const otrees = []; for (const [x, z] of [[-4.2, -5], [-3.2, -13], [3.4, -8], [4.6, -15], [-9, -9], [9, -6], [0.5, -18]]) { const t = tree({ s: rr(1.5, 1.9), color: pick([0x4f7a35, 0x5a8a3a, 0x46702f]) }); t.position.set(x, 0, z); scene.add(t); otrees.push(t); }
    for (const [x, z, r] of [[-2.2, -9.5, 2.6], [2.6, -12, 2.4], [-6, -14, 2.8]]) { const m = mesh(new THREE.SphereGeometry(r, 24, 8, 0, Math.PI * 2, 0, 0.6), M(0x5f8a3a, 0.95), x, -r * 0.82, z); scene.add(m); }
    for (const [x, z, ry] of [[-2.5, -5, 0.2], [4.5, -4.5, -0.3]]) { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; b.add(box(2.2, 0.1, 0.5, M(0xa77b4f, 0.8), 0, 0.45, 0)); for (const s of [-1, 1]) b.add(box(0.1, 0.45, 0.45, M(0xa77b4f, 0.8), s * 0.9, 0.22, 0)); castAll(b); scene.add(b); }
    const fnt = new THREE.Group(); fnt.position.set(1.2, 0, -9); fnt.add(cyl(0.25, 0.3, 0.9, M(0x8a8f94, 0.4, 0.5), 0, 0.45, 0, 16)); fnt.add(cyl(0.3, 0.25, 0.08, M(0x8a8f94, 0.4, 0.5), 0, 0.94, 0, 16)); castAll(fnt); scene.add(fnt);
    const kids = [];
    for (let i = 0; i < 10; i++) { const k = person({ ...SUMMER(), h: rr(0.62, 0.72) }); const z = rr(-14, -4.5); k.position.set(rr(-0.25, 0.25) * (-z) + rr(-0.6, 0.6), 0, z); k.rotation.y = rr(-3, 3); scene.add(k); kids.push(k); }
    const teacher = person({ ...SUMMER(), top: 0x3f5d3a, sleeves: true }); teacher.position.set(-1.6, 0, -6.0); teacher.rotation.y = 0.6; scene.add(teacher);
    hemi(scene, 0xfff1d8, 0x5a6a45, 0.45); sun(scene, { pos: [25, 70, 20], color: 0xfff2d8, intensity: 2.0, size: 40, far: 200, target: [0, 0, -10] });
    const k0 = kids.map(k => [k.position.x, k.position.z]);
    const ball = sph(0.11, M(0xd8473a, 0.5), 0, 0.11, -7, 16); scene.add(ball);
    const jet = dust(120, [-0.06, 0.95, -0.06, 0.06, 1.35, 0.06], 0xdff0ff, 0.035, 0.8); jet.position.set(1.2, 0, -9); scene.add(jet);
    anim.push(flock(scene, 5, [0, 0, -12], 9, 11, 0.6, 1.3, 0x3a3a3e));
    anim.push((t) => { kids.forEach((k, i) => { const r = 0.5 + (i % 3) * 0.35, a = t * (1.1 + (i % 4) * 0.25) + i; k.position.x = k0[i][0] + Math.cos(a) * r; k.position.z = k0[i][1] + Math.sin(a) * r; k.rotation.y = -a; animPerson(k, t, { walk: 2.4, stride: 0.55, phase: i }); });
      animPerson(teacher, t, { breath: 1, talk: 0.6, look: 0.6 }); otrees.forEach((tr, i) => { tr.rotation.z = Math.sin(t * 1.1 + i) * 0.015; });
      const seg = Math.floor(t / 0.9) % 2, u = (t / 0.9) % 1, A = kids[seg ? 2 : 4].position, B = kids[seg ? 4 : 2].position; ball.position.set(A.x + (B.x - A.x) * u, 0.11 + Math.sin(u * Math.PI) * 1.1, A.z + (B.z - A.z) * u);
      jet.position.y = (t * 0.6) % 0.2; jet.rotation.y = t * 3; });
  }
  return { anim };
}

// ---------- FACADE: air-conditioners blowing their heat into the street ----------
function acUnit() {
  const g = new THREE.Group(); g.add(rbox(1.0, 0.72, 0.38, 0.05, M(0xeceeea, 0.5), 0, 0, 0));
  g.add(mesh(new THREE.CircleGeometry(0.27, 24), M(0x2b2f34, 0.6), 0.14, 0, 0.195)); for (let i = 0; i < 6; i++) g.add(box(0.54, 0.014, 0.01, M(0x9a9ea2, 0.5), 0.14, -0.23 + i * 0.09, 0.2));
  const bl = new THREE.Group(); bl.position.set(0.14, 0, 0.198); for (let i = 0; i < 3; i++) { const b = box(0.06, 0.46, 0.004, M(0x8a8f94, 0.4, 0.4), 0, 0, 0); b.rotation.z = i * Math.PI / 3; bl.add(b); } g.add(bl); g.userData.blades = bl;
  castAll(g); return g;
}
function bike() {
  const g = new THREE.Group(), fr = M(0x2a6f8f, 0.4, 0.5), tyre = M(0x151619, 0.8);
  const spokes = []; for (const x of [-0.52, 0.52]) { const w = mesh(new THREE.TorusGeometry(0.33, 0.03, 8, 32), tyre, x, 0.36, 0); g.add(w); const sp = new THREE.Group(); sp.position.set(x, 0.36, 0); for (let i = 0; i < 4; i++) { const s = box(0.012, 0.64, 0.012, M(0xb9bec4, 0.3, 0.8), 0, 0, 0); s.rotation.z = i * Math.PI / 4; sp.add(s); } g.add(sp); spokes.push(sp); }
  g.userData.spokes = spokes;
  const bar = (x0, y0, x1, y1) => { const l = Math.hypot(x1 - x0, y1 - y0); const c = cyl(0.022, 0.022, l, fr, (x0 + x1) / 2, (y0 + y1) / 2, 0, 8); c.rotation.z = Math.atan2(x0 - x1, y1 - y0); g.add(c); };
  bar(-0.52, 0.36, -0.05, 0.36); bar(-0.05, 0.36, -0.15, 0.85); bar(-0.15, 0.85, 0.42, 0.88); bar(0.42, 0.88, 0.52, 0.36); bar(-0.05, 0.36, 0.42, 0.88); bar(-0.52, 0.36, -0.15, 0.85);
  g.add(box(0.06, 0.04, 0.5, fr, 0.48, 1.06, 0)); g.add(box(0.24, 0.05, 0.1, M(0x1b1b1b, 0.6), -0.17, 0.92, 0));
  castAll(g); return g;
}
export function facade(scene) {
  scene.background = grad([[0, '#9fb9cf'], [0.55, '#d9dccf'], [1, '#efc78e']]); scene.fog = new THREE.Fog(0xe6caa0, 120, 520); scene.environmentIntensity = 0.28;
  scene.add(ground(400, new THREE.MeshStandardMaterial({ map: noiseTex('#3d3d40', 10, 256, 256, [30, 30], 2500), roughness: 0.5 })));
  scene.add(box(60, 0.15, 4, M(0xb9b0a2, 0.85), 0, 0.075, -2));
  const b = building(28, 14, 7, { key: 1, shops: true }); b.position.set(0, 0, -11); scene.add(b);
  const b2 = building(24, 14, 6, { key: 4, shops: true }); b2.position.set(-27, 0, -11); scene.add(b2);
  const b3 = building(24, 14, 6, { key: 5, shops: true }); b3.position.set(27, 0, -11); scene.add(b3);
  // balconies (floors 2 and 5) and the units
  const iron = M(0x1d1f22, 0.5, 0.4);
  for (const fl of [2, 5]) { const y = fl * 3.2 + 0.1; scene.add(box(28, 0.12, 0.9, M(0xcfc0a2, 0.9), 0, y, -3.6)); for (let x = -13.8; x <= 13.8; x += 0.18) scene.add(box(0.025, 0.95, 0.025, iron, x, y + 0.5, -3.2)); scene.add(box(28, 0.05, 0.05, iron, 0, y + 0.98, -3.2)); }
  seed(19); const units = [], heat = [];
  for (let fl = 1; fl < 7; fl++) for (let c = 0; c < 6; c++) {
    if (rnd() < (fl < 4 ? 0.15 : 0.45)) continue;
    const u = acUnit(); const x = -11.5 + c * 4.6 + rr(-0.4, 0.4), y = fl * 3.2 + (fl === 2 || fl === 5 ? 0.62 : -0.35), z = fl === 2 || fl === 5 ? -3.6 : -3.75;
    u.position.set(x, y, z); scene.add(u); units.push(u);
    if (!(fl === 2 || fl === 5)) { scene.add(box(0.9, 0.05, 0.4, iron, x, y - 0.33, z)); }
    const hz = glow(0xffa060, 2.0, x + 0.14, y + 0.25, z + 0.7, 0.2); scene.add(hz); heat.push(hz);
  }
  // delivery rider
  const rider = new THREE.Group(); rider.position.set(1.6, 0, 1.6); rider.rotation.y = Math.PI; scene.add(rider);
  const bk = bike(); rider.add(bk);
  const p = person({ ...SUMMER(), top: 0x3fa7a0, lhip: [-1.2, 0.08], rhip: [-0.7, -0.08], lkn: 1.4, rkn: 0.9, lsh: [-1.1, 0.15], rsh: [-1.1, -0.15], lel: -0.3, rel: -0.3, spine: 0.35, hat: 'cap', hatColor: 0x2f3236 });
  p.position.set(-0.17, 0.08, 0); p.rotation.y = Math.PI / 2; rider.add(p);
  const bag = rbox(0.42, 0.42, 0.42, 0.05, M(0x3fa7a0, 0.6), 0, 0, 0); bag.position.set(-0.3, 1.55, 0); rider.add(bag); castAll(rider);
  hemi(scene, 0xfff1d8, 0x806a55, 0.42); sun(scene, { pos: [30, 70, 40], color: 0xfff2d8, intensity: 2.2, size: 50, far: 220, target: [0, 8, -10] });
  const anim = [(t) => { rider.position.x = 1.6 - 1.05 * t; heat.forEach((h, i) => { h.material.opacity = 0.12 + 0.06 * Math.sin(t * 5 + i); h.position.y += Math.sin(t * 3 + i) * 0.002; }); animPerson(p, t, { breath: 1.4, look: 0.2 }); p.userData.rig.lKn.rotation.x = 0.9 + 0.5 * Math.sin(t * 5); p.userData.rig.rKn.rotation.x = 0.9 - 0.5 * Math.sin(t * 5); bk.userData.spokes.forEach(s => { s.rotation.z = t * 3.2; }); units.forEach((u, i) => { u.userData.blades.rotation.z = -t * (14 + (i % 4) * 2); }); }];
  return { anim };
}

// ---------- PARK: night, Parisians sleeping on the lawn ----------
function lying(o, side = false) { const p = person({ ...SUMMER(), ...o }); p.rotation.order = 'YXZ'; p.rotation.x = side ? 0 : -Math.PI / 2; if (side) p.rotation.z = Math.PI / 2; return p; }
export function park(scene) {
  scene.background = grad([[0, '#060914'], [0.55, '#151a33'], [1, '#6a3f2c']]);
  scene.fog = new THREE.Fog(0x241c26, 30, 220); scene.environmentIntensity = 0.04;
  scene.add(ground(600, new THREE.MeshStandardMaterial({ map: noiseTex('#2b3a22', 16, 256, 256, [40, 40], 3500), roughness: 1 })));
  scene.add(mesh(new THREE.PlaneGeometry(3.2, 200).rotateX(-Math.PI / 2), M(0x8a8070, 1), 7, 0.01, -60, false, true));
  seed(71);
  for (let i = 0; i < 22; i++) { const t = tree({ s: rr(1.6, 2.2), color: pick([0x24361d, 0x2b3f22, 0x1f301a]) }); t.position.set(rr(-30, 30), 0, rr(-70, -12)); scene.add(t); }
  const lamps = [];
  for (const [x, z] of [[5.2, -6], [5.2, -26], [5.2, -46], [-9, -18]]) { const l = new THREE.Group(); l.position.set(x, 0, z); l.add(cyl(0.06, 0.08, 3.6, M(0x1d1f22, 0.5, 0.4), 0, 1.8, 0, 8)); l.add(sph(0.22, E(0xffc27a, 3), 0, 3.75, 0, 16)); scene.add(l); scene.add(glow(0xffb45c, 1.1, x, 3.75, z, 0.6)); lamps.push(point(scene, 0xffb45c, 24, 20, x, 3.6, z, x === 5.2 && z === -6)); }
  // city skyline behind the trees
  for (let i = 0; i < 14; i++) { const b = building(rr(14, 22), 12, pick([6, 7]), { key: i % 6, night: true, lit: 0.55, dormers: false }); b.position.set(-90 + i * 14, 0, -110 - rr(0, 20)); scene.add(b); }
  // sleepers on sheets
  const sheets = [0xe8e0cc, 0x9fb7c9, 0xd9b48a, 0xc77d5a, 0xf2f0ea, 0x7f9a6a];
  const spots = [[1.6, -3.6, 0.3], [3.7, -6.6, -0.4], [0.5, -8.2, 0.9], [4.2, -11.2, 0.2], [1.2, -13.5, -0.8], [-1.2, -16, 1.4], [6.0, -15.5, -1.2], [2.2, -19, 0.4]];
  const sleepers = [];
  spots.forEach(([x, z, r], i) => {
    const sh = rbox(1.0, 0.02, 2.0, 0.01, M(pick(sheets), 0.95), x, 0.02, z); sh.rotation.y = r; scene.add(sh);
    const p = lying({ eyes: i % 3 ? 'closed' : 'open', lsh: [0.2, 0.3], rsh: [-2.6, -0.2], rel: -1.6 }, i % 4 === 1); p.position.set(x, i % 4 === 1 ? 0.2 : 0.18, z); p.rotation.y = r + Math.PI; scene.add(p); sleepers.push(p);
  });
  const sitter = person({ ...SUMMER(), lhip: [-1.5, 0.3], rhip: [-1.5, -0.3], lkn: 2.2, rkn: 2.2, lsh: [-0.6, 0.2], rsh: [-0.6, -0.2] }); sitter.position.set(-0.6, -0.4, -11.5); sitter.rotation.y = 1.2; scene.add(sitter);
  // Inès arrives with her pillow
  const ines = person({ ...INES, lsh: [-0.9, 0.35], rsh: [-0.9, -0.35], lel: -1.3, rel: -1.3 }); ines.position.set(4.0, 0.02, -8.0); ines.rotation.y = -1.9; scene.add(ines);
  const pillow = rbox(0.5, 0.32, 0.14, 0.06, M(0xf4f1ea, 0.95), 0, 0.98, 0.26); ines.userData.rig.torso.add(pillow); pillow.position.set(0, 0.38, 0.22);
  hemi(scene, 0x3a4270, 0x3a2414, 0.8); const moon = new THREE.DirectionalLight(0x8fa6d6, 0.6); moon.position.set(-40, 80, 30); scene.add(moon);
  scene.add(glow(0xfff2dc, 5, -14, 34, -150, 0.85));
  const moths = []; for (let i = 0; i < 7; i++) { const m = glow(0xffe6c0, 0.07, 5.2, 3.7, -6, 0.95); scene.add(m); moths.push(m); }
  const spr = new THREE.Group(); spr.position.set(-0.8, 0.05, -5.5); scene.add(spr); spr.add(cyl(0.03, 0.04, 0.25, M(0x2a2d31, 0.5, 0.5), 0, 0.12, 0, 8));
  const arc = new Float32Array(150 * 3); for (let i = 0; i < 150; i++) { const x = (i / 150) * 3.2; arc.set([x, 0.25 + 1.3 * x * (1 - x / 3.2) + rr(-0.03, 0.03), rr(-0.04, 0.04)], i * 3); }
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(arc, 3)); const water = new THREE.Points(ag, new THREE.PointsMaterial({ color: 0xdfe8f2, size: 0.03, map: roundTex(), transparent: true, opacity: 0.7, depthWrite: false })); spr.add(water);
  const anim = [(t) => {
    sleepers.forEach((p, i) => animPerson(p, t, { breath: 2.5, look: 0.08, nod: 0.1, sway: 0.2, phase: i * 1.3 }));
    animPerson(sitter, t, { breath: 1.2, look: 0.7, phase: 2 });
    ines.position.x = 4.0 + Math.sin(-1.9) * 0.75 * t; ines.position.z = -8.0 + Math.cos(-1.9) * 0.75 * t;
    animPerson(ines, t, { walk: 1.25, stride: 0.38, armSwing: 0, look: 0.4, phase: 1 });
    lamps.forEach((l, i) => { l.intensity = 24 * (0.96 + 0.04 * flick(t * 0.3, i)); });
    moths.forEach((m, i) => { const a = t * (3 + i * 0.45) + i * 0.9; m.position.set(5.2 + Math.cos(a) * (0.3 + 0.12 * Math.sin(t * 2 + i)), 3.72 + Math.sin(a * 1.3) * 0.22, -6 + Math.sin(a) * 0.3); });
    spr.rotation.y = 0.6 + Math.sin(t * 0.9) * 1.1;
  }];
  return { ines, anim };
}

// ---------- CRISIS ROOM: the "Paris à 50 °C" exercise ----------
function screenTex(kind, p = 1, blink = 1) { return canvasTex(512, 288, (g, w, h) => drawScreen(g, w, h, kind, p, blink)); }
function drawScreen(g, w, h, kind, p = 1, blink = 1) {
  {
    g.save(); g.textAlign = 'left'; g.globalAlpha = 1; g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h);
    if (kind === 'map') {
      g.fillStyle = '#18243a'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.36, h * 0.36, 0.08, 0, 7); g.fill();
      g.strokeStyle = '#4a7ab8'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * 0.12, h * 0.42); g.bezierCurveTo(w * 0.35, h * 0.2, w * 0.55, h * 0.75, w * 0.88, h * 0.52); g.stroke();
      for (const [x, y, r0, a] of [[0.45, 0.45, 0.2, 0.8], [0.62, 0.38, 0.14, 0.7], [0.36, 0.62, 0.12, 0.6], [0.58, 0.62, 0.1, 0.65]]) { const r = r0 * (0.75 + 0.35 * p); const gr = g.createRadialGradient(w * x, h * y, 0, w * x, h * y, w * r); gr.addColorStop(0, `rgba(255,70,40,${a})`); gr.addColorStop(1, 'rgba(255,70,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      g.fillStyle = '#ffffff'; g.font = '600 22px Inter'; g.fillText('PARIS · TEMPÉRATURES', 18, 32);
    } else if (kind === 'dome') {
      g.fillStyle = blink > 0.5 ? '#a3231a' : '#5a140e'; g.fillRect(0, 0, w, 54); g.fillStyle = '#ffffff'; g.font = '800 30px Inter'; g.textAlign = 'center'; g.fillText('EXERCICE · EXERCICE · EXERCICE', w / 2, 38);
      g.font = '800 54px Inter'; g.fillText('DÔME DE CHALEUR', w / 2, 140); g.fillStyle = '#ff5b3a'; g.font = '800 64px Inter'; g.fillText('PIC À 50 °C', w / 2, 220);
    } else if (kind === 'curve') {
      g.strokeStyle = '#33415a'; g.lineWidth = 1; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(40, i * h / 6); g.lineTo(w - 20, i * h / 6); g.stroke(); }
      g.strokeStyle = '#ff6a3d'; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= Math.round(40 * p); i++) { const x = 40 + i * (w - 60) / 40, v = 0.15 + 0.8 * Math.pow(i / 40, 1.6) + 0.04 * Math.sin(i * 1.3); i ? g.lineTo(x, h - 20 - v * (h - 60)) : g.moveTo(x, h - 20 - v * (h - 60)); } g.stroke();
      g.fillStyle = '#ffffff'; g.font = '600 22px Inter'; g.fillText('°C · J1 → J4', 18, 32);
    } else if (kind === 'list') {
      g.fillStyle = '#ffffff'; g.font = '700 24px Inter'; g.fillText('ÉTAT DES SERVICES', 22, 40); g.font = '500 20px Inter';
      ['Hôpitaux', 'Écoles', 'Transports', 'Eau', 'Électricité', 'Parcs ouverts la nuit'].forEach((s, i) => { g.fillStyle = '#cfd8e6'; g.fillText(s, 22, 82 + i * 34); g.fillStyle = ['#ff5b3a', '#ffb13a', '#ffb13a', '#4ad07a', '#ffb13a', '#4ad07a'][i]; g.beginPath(); g.arc(w - 40, 76 + i * 34, 9, 0, 7); g.fill(); });
    } else { for (let i = 0; i < 6; i++) { const f = 0.85 + 0.15 * Math.sin(p * 9 + i * 2.1); g.fillStyle = `rgb(${Math.round((40 + i * 8) * f)},${Math.round((50 + i * 6) * f)},${Math.round((60 + i * 5) * f)})`; g.fillRect(10 + (i % 3) * 166, 10 + Math.floor(i / 3) * 138, 160, 130); } }
    g.restore();
  }
}
export function crisis(scene) {
  scene.background = new THREE.Color(0x0c0f14); scene.environmentIntensity = 0.12;
  scene.add(ground(60, new THREE.MeshStandardMaterial({ map: noiseTex('#2a2f38', 8, 256, 256, [10, 10], 1500), roughness: 0.95 })));
  const wallM = M(0x262b33, 0.9); scene.add(box(18, 4, 0.2, wallM, 0, 2, -6)); scene.add(box(0.2, 4, 16, wallM, -9, 2, 2)); scene.add(box(0.2, 4, 16, wallM, 9, 2, 2)); scene.add(box(18, 0.2, 16, M(0x1d2128, 0.9), 0, 4.05, 2));
  for (let i = 0; i < 6; i++) scene.add(box(1.4, 0.04, 0.6, E(0xe8f0ff, 1.1), -5 + (i % 3) * 5, 3.98, -2 + Math.floor(i / 3) * 5));
  const kinds = ['map', 'dome', 'curve', 'list', 'cams', 'map'];
  const live = []; kinds.forEach((k, i) => { const x = -4.1 + (i % 3) * 4.1, y = 3.25 - Math.floor(i / 3) * 1.5; scene.add(box(4.0, 1.5, 0.08, M(0x0a0a0c, 0.4), x, y, -5.86)); const tx = screenTex(k); live.push([tx, k, i]); scene.add(mesh(new THREE.PlaneGeometry(3.9, 1.42), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }), x, y, -5.81, false, false)); });
  scene.add(point(scene, 0x7aa2ff, 8, 12, 0, 2.4, -4.4));
  // U of tables with laptops and agents
  const desk = M(0xbfc4ca, 0.5, 0.2); const agents = [];
  const seat = (x, z, ry) => {
    const tb = box(1.6, 0.05, 0.8, desk, x, 0.75, z); tb.rotation.y = ry; scene.add(tb);
    const lap = new THREE.Group(); lap.position.set(x - Math.sin(ry) * 0.1, 0.78, z - Math.cos(ry) * 0.1); lap.rotation.y = ry - Math.PI; lap.add(box(0.36, 0.02, 0.25, M(0x8a8f94, 0.3, 0.6), 0, 0, 0)); const sc = box(0.36, 0.23, 0.01, E(0x6f9cff, 0.8), 0, 0.12, -0.12); sc.rotation.x = 0.25; lap.add(sc); scene.add(lap);
    const p = person({ ...randPerson({ sleeves: true }), ...SIT, rsh: [-0.9, -0.1], rel: -1.0, lsh: [-1.0, 0.1], lel: -0.9 }); p.position.set(x - Math.sin(ry) * 0.62, -0.42, z - Math.cos(ry) * 0.62); p.rotation.y = ry; scene.add(p); agents.push(p);
  };
  for (const x of [-4.5, -2.6, 2.6, 4.5]) seat(x, -2.4, Math.PI);
  for (const z of [-0.4, 1.5]) { seat(-6.2, z, Math.PI / 2); seat(6.2, z, -Math.PI / 2); }
  const lead = person({ ...randPerson({ sleeves: true }), top: 0x2c2c34, rsh: [-1.5, -0.3], rel: -0.1 }); lead.position.set(1.2, 0, -3.9); lead.rotation.y = -2.7; scene.add(lead);
  const phoneP = person({ ...randPerson({ sleeves: true }), rsh: [-2.5, -0.5], rel: -2.3, neck: [0.1, 0.4, 0] }); phoneP.position.set(-1.6, 0, -3.6); phoneP.rotation.y = 0.4; scene.add(phoneP);
  hemi(scene, 0xc8d6f0, 0x1a1c20, 0.6);
  const anim = [(t) => { agents.forEach((p, i) => animPerson(p, t, { breath: 1, look: 0.5, nod: 0.6, talk: i % 3 === 0 ? 0.5 : 0, phase: i })); animPerson(lead, t, { breath: 1, talk: 0.8, look: 0.4 }); animPerson(phoneP, t, { breath: 1, look: 0.3, phase: 4 });
    live.forEach(([tx, k, i]) => { if (k === 'list') return; const g = tx.image.getContext('2d'); const p = k === 'curve' ? Math.min(1, 0.15 + t / 3.5) : k === 'map' ? 0.5 + 0.5 * Math.sin(t * 2.2 + i) : k === 'dome' ? 1 : t; drawScreen(g, tx.image.width, tx.image.height, k, p, (t * 1.6) % 1 < 0.6 ? 1 : 0); tx.needsUpdate = true; }); }];
  return { anim };
}

// ---------- HEATMAP: France at night, tinted by heat (2003 | record) ----------
export function heatmap(scene, { variant }) {
  const rec = variant === 'record';
  const lon0 = 2.5, lat0 = 46.5, k = 8, cl = Math.cos(lat0 * Math.PI / 180);
  const P = (lon, lat) => [(lon - lon0) * cl * k, -(lat - lat0) * k];
  scene.background = grad([[0, '#020203'], [1, '#140707']]); scene.environmentIntensity = 0.02;
  scene.add(ground(2000, new THREE.MeshStandardMaterial({ map: noiseTex('#0d0a0a', 8, 256, 256, [12, 12], 1600), roughness: 1 })));
  const all = FRANCE.map(([lo, la]) => P(lo, la)); const xs = all.map(p => p[0]), zs = all.map(p => p[1]);
  const minX = Math.min(...xs) - 2, maxX = Math.max(...xs) + 2, minZ = Math.min(...zs) - 2, maxZ = Math.max(...zs) + 14;
  const hot = rec ? [[3.9, 43.7, 0.55, 1], [4.8, 44.0, 0.35, 0.8], [2.4, 48.8, 0.32, 0.55], [4.8, 45.8, 0.3, 0.6], [1.4, 43.6, 0.3, 0.6], [0.7, 45.2, 0.35, 0.5]]
    : [[2.35, 48.86, 0.42, 1], [1.9, 47.9, 0.3, 0.85], [0.7, 47.4, 0.28, 0.75], [4.84, 45.76, 0.25, 0.6], [3.1, 46.5, 0.4, 0.55], [5.0, 47.3, 0.25, 0.5], [-0.6, 44.8, 0.25, 0.4]];
  const tex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = rec ? '#7a1708' : '#3a0c08'; g.fillRect(0, 0, w, h);
    hot.forEach(([lo, la, r, a]) => { const [x, z] = P(lo, la); const u = (x - minX) / (maxX - minX) * w, v = (z - minZ) / (maxZ - minZ) * h; const gr = g.createRadialGradient(u, v, 0, u, v, r * w); gr.addColorStop(0, `rgba(255,${rec ? 190 : 120},60,${a})`); gr.addColorStop(0.5, `rgba(230,70,30,${a * 0.6})`); gr.addColorStop(1, 'rgba(160,30,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  });
  const slab = (poly, h = 0.7) => {
    const s = new THREE.Shape(); poly.forEach(([lo, la], i) => { const [x, z] = P(lo, la); if (i) s.lineTo(x, -z); else s.moveTo(x, -z); });
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.2, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2);
    scene.add(new THREE.Mesh(geo, M(0x1f0c0a, 0.9)));
    const top = new THREE.ShapeGeometry(s); const pos = top.attributes.position, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = -pos.getY(i); uv[i * 2] = (x - minX) / (maxX - minX); uv[i * 2 + 1] = 1 - (z - minZ) / (maxZ - minZ); }
    top.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); top.rotateX(-Math.PI / 2);
    const tm = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); const m = new THREE.Mesh(top, tm); m.position.y = h + 0.65; scene.add(m);
    const pts = poly.map(([lo, la]) => { const [x, z] = P(lo, la); return new THREE.Vector3(x, h + 0.75, z); });
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffb08a, transparent: true, opacity: 0.8 })));
    return tm;
  };
  const m1 = slab(FRANCE), m2 = slab(CORSICA);
  for (const [lo, la, s] of [[2.35, 48.86, 1.6], [4.84, 45.76, 1.1], [5.37, 43.3, 1.1], [1.44, 43.6, 1], [-0.58, 44.84, 1], [3.06, 50.63, 1], [-1.55, 47.22, 1], [7.75, 48.58, 1], [7.26, 43.7, 0.9], [3.88, 43.61, 0.9]]) { const [x, z] = P(lo, la); scene.add(glow(0xffe0b0, s * 2.4, x, 1.6, z, 0.75)); }
  const anim = [];
  if (rec) {
    const [x, z] = P(4.03, 43.71); const pin = new THREE.Group(); pin.position.set(x, 0.9, z); scene.add(pin);
    pin.add(cyl(0.16, 0.16, 8, M(0xe8e8e8, 0.4, 0.6), 0, 4, 0, 10)); pin.add(sph(1.4, E(0xff3b2a, 2.4), 0, 8.4, 0, 24)); pin.add(glow(0xff7a50, 6, 0, 8.4, 0, 0.5));
    const ring = mesh(new THREE.RingGeometry(1.2, 1.6, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0.8, toneMapped: false }), 0, 0.15, 0, false, false); pin.add(ring);
    anim.push((t) => { const d = ease((t - 0.3) / 0.5); pin.position.y = 0.9 + 9 * (1 - d); const r = (t * 0.8) % 1; ring.scale.setScalar(1 + r * 3); ring.material.opacity = 0.8 * (1 - r); const red = ease((t - 1.8) / 2.4); m1.color.setRGB(1, 1 - 0.25 * red, 1 - 0.35 * red); m2.color.copy(m1.color); });
  } else {
    const rings = [[2.35, 48.86], [1.9, 47.9], [0.7, 47.4], [4.84, 45.76]].map(([lo, la], i) => { const [x, z] = P(lo, la); const r = mesh(new THREE.RingGeometry(1.0, 1.35, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0, toneMapped: false }), x, 1.7, z, false, false); scene.add(r); return r; });
    anim.push((t) => { const p = ease(t / 3.5); m1.color.setRGB(0.55 + 0.45 * p, 0.55 + 0.45 * p, 0.55 + 0.45 * p); m2.color.copy(m1.color); rings.forEach((r, i) => { const u = ((t * 0.7) + i * 0.27) % 1; r.scale.setScalar(1 + u * (i ? 3 : 5)); r.material.opacity = 0.75 * (1 - u) * ease(t / 0.6); }); });
  }
  hemi(scene, 0x3a1c18, 0x020202, 0.6);
  return { anim };
}

export const SETS3 = { roofs, attic, street, rails, plant, school, facade, park, crisis, heatmap };
export const CAMS3 = {
  'roofs:noon': [50, [-2, 10, 4], [-30, -14, -160], { far: 2500, near: 0.3, ao: false, bloom: [0.25, 0.4, 0.95], heat: 0.0012 }],
  'roofs:night': [50, [-2, 9.4, 7.5], [-30, -3, -160], { far: 2500, near: 0.3, ao: false, bloom: [0.75, 0.55, 0.5] }],
  'roofs:storm': [50, [-2, 10, 4], [-30, -8, -160], { far: 2500, near: 0.3, ao: false, bloom: [0.6, 0.6, 0.7] }],
  'attic:day': [56, [0.7, 1.55, 2.7], [-0.75, 1.05, -0.7], { bloom: [0.4, 0.5, 0.9], heat: 0.0005 }],
  'attic:night': [54, [0.6, 1.3, 0.9], [-1.3, 0.85, -0.7], { bloom: [0.3, 0.45, 0.9] }],
  'attic:rain': [56, [1.0, 1.05, 1.6], [-0.45, 1.55, -0.65], { bloom: [0.4, 0.5, 0.9] }],
  'street:pharmacy': [52, [4.0, 1.65, 6.0], [8.0, 4.0, -30], { ao: false, bloom: [0.3, 0.45, 0.93], heat: 0.0014 }],
  'street:peak': [52, [4.0, 1.65, 6.0], [8.0, 4.0, -30], { ao: false, bloom: [0.3, 0.45, 0.93], heat: 0.0024 }],
  'street:ambulance': [48, [-0.5, 1.6, 6.5], [4.6, 1.3, -3.5], { ao: false, bloom: [0.6, 0.5, 0.8], heat: 0.0012 }],
  'rails:heat': [24, [-4.0, 1.05, 14], [-1.4, 1.9, -60], { far: 1500, ao: false, bloom: [0.22, 0.4, 0.95], heat: 0.0022 }],
  'plant:river': [36, [0, 8, 34], [0, 40, -600], { far: 3000, near: 0.5, ao: false, bloom: [0.22, 0.4, 0.95], heat: 0.0012 }],
  'school:closed': [50, [0, 1.6, 4.4], [0.25, 2.2, -4], { ao: false, bloom: [0.22, 0.4, 0.95], heat: 0.0014 }],
  'school:oasis': [54, [0.4, 1.55, 2.4], [-0.6, 2.2, -14], { ao: false, bloom: [0.22, 0.4, 0.95] }],
  'facade:ac': [52, [-1.5, 1.4, 7.5], [1.2, 6.0, -4], { ao: false, bloom: [0.22, 0.4, 0.95], heat: 0.0016 }],
  'park:night': [50, [2.2, 1.15, 1.0], [2.4, 0.55, -12], { ao: false, bloom: [0.85, 0.55, 0.45] }],
  'crisis:room': [52, [-5.2, 1.5, 6.0], [0.0, 1.6, -5.0], { ao: false, bloom: [0.7, 0.5, 0.55] }],
  'heatmap:2003': [40, [-4, 162, 106], [-4, 0, 16], { ao: false, far: 1500, bloom: [0.85, 0.6, 0.4] }],
  'heatmap:record': [40, [-4, 162, 106], [-4, 0, 16], { ao: false, far: 1500, bloom: [0.85, 0.6, 0.4] }],
};
