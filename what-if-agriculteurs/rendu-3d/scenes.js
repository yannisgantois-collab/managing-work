import { THREE, glow, M, E, glass, mesh, box, rbox, cyl, sph, cap, canvasTex, noiseTex, signTex, sun, hemi, point, spot, person, randPerson, WALK, SIT, cow, tractor, truck, farmhouse, shed, tree, bareTree, hedgeRow, haussmann, ground, instanced, shaft, dust, prism, seed, rnd, rr, pick } from './lib.js';

// Hélène — single character sheet reused in every shot (fix D04)
export const HELENE = { skin: 0xeec3a3, hair: 0xc4beb4, hairStyle: 'bun', top: 0x2f4f7a, pants: 0x3e4a3b, shoes: 0x2f5a33 };
const PYJAMA = { ...HELENE, top: 0x3d6aa8, pants: 0x3d6aa8, shoes: 0xd8cfc4 };

function gradientBg(stops, w = 16, h = 512) {
  return canvasTex(w, h, (g) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}

// ---------------- BEDROOM ----------------
function clockFace(lit) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#f3ecdc'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
    g.fillStyle = '#222'; g.font = '600 34px "Newsreader"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92); }
    const hand = (a, len, wdt, col) => { g.strokeStyle = col; g.lineWidth = wdt; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * len, 128 + Math.sin(a) * len); g.stroke(); };
    hand((4.5 / 12) * Math.PI * 2 - Math.PI / 2, 52, 9, '#1a1a1a'); // hour hand 4:30
    hand((30 / 60) * Math.PI * 2 - Math.PI / 2, 80, 6, '#1a1a1a');
    hand((0.2) * Math.PI * 2 - Math.PI / 2, 70, 2, '#b3261e');
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(128, 128, 8, 0, 7); g.fill();
  });
}
function alarmClock() {
  const g = new THREE.Group();
  const red = M(0xa3231d, 0.35, 0.3), chrome = M(0xd8d8d8, 0.2, 1.0);
  const body = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 40), red); body.rotation.x = Math.PI / 2; g.add(body);
  const face = mesh(new THREE.CircleGeometry(0.066, 40), new THREE.MeshStandardMaterial({ map: clockFace(), roughness: 0.5, emissive: 0xffffff, emissiveMap: clockFace(), emissiveIntensity: 0.22 }), 0, 0, 0.0232); g.add(face);
  const rim = mesh(new THREE.TorusGeometry(0.07, 0.007, 12, 48), chrome, 0, 0, 0.023); g.add(rim);
  const glassF = mesh(new THREE.CircleGeometry(0.066, 40), glass(0xffffff, 0.08), 0, 0, 0.026); g.add(glassF);
  for (const s of [-1, 1]) {
    const bell = mesh(new THREE.SphereGeometry(0.038, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), chrome, 0.045 * s, 0.085, 0); bell.rotation.z = -0.5 * s; g.add(bell);
    const leg = cyl(0.008, 0.012, 0.05, chrome, 0.05 * s, -0.085, 0, 10); leg.rotation.z = 0.4 * s; g.add(leg);
  }
  g.add(cyl(0.004, 0.004, 0.06, chrome, 0, 0.11, 0, 8));
  const ham = sph(0.008, chrome, 0.012, 0.12, 0, 10); g.add(ham);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function bedroom(scene, { variant }) {
  const night = variant !== 'wake';
  scene.background = new THREE.Color(0x0b0e16);
  const floorM = new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = ['#6b4a33', '#71503a', '#654530', '#6e4c35'][i % 4]; g.fillRect(0, i * h / 8, w, h / 8); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * h / 8, w, 2); } }, [2, 2]), roughness: 0.6 });
  const wallM = new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b9b49b'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,110,80,0.18)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 10, h); }, [4, 2]), roughness: 0.95 });
  scene.add(ground(12, floorM));
  scene.add(box(6, 2.7, 0.1, wallM, 0, 1.35, -2.2));            // back wall
  // left wall with a real window opening (z -1.05..-0.15, y 1.0..2.2) so the moonlight gets in
  scene.add(box(0.1, 2.7, 1.95, wallM, -2.4, 1.35, -2.025)); scene.add(box(0.1, 2.7, 3.15, wallM, -2.4, 1.35, 1.425));
  scene.add(box(0.1, 1.0, 0.9, wallM, -2.4, 0.5, -0.6)); scene.add(box(0.1, 0.5, 0.9, wallM, -2.4, 2.45, -0.6));
  scene.add(box(0.1, 2.7, 6, wallM, 2.6, 1.35, 0));
  scene.add(box(6, 0.1, 6, M(0xd7d1c2, 0.95), 0, 2.72, 0));
  // window (left wall)
  const winGlow = new THREE.MeshBasicMaterial({ color: night ? 0x4a6aa8 : 0x2a3550 });
  const wp = mesh(new THREE.PlaneGeometry(0.9, 1.2), winGlow, -2.6, 1.6, -0.6, false, false); wp.rotation.y = Math.PI / 2; scene.add(wp);
  scene.add(box(0.12, 0.06, 1.05, M(0xe8e2d6, 0.7), -2.33, 2.22, -0.6)); scene.add(box(0.12, 0.06, 1.05, M(0xe8e2d6, 0.7), -2.33, 0.98, -0.6));
  scene.add(box(0.12, 1.25, 0.06, M(0xe8e2d6, 0.7), -2.33, 1.6, -0.6));
  for (const z of [-1.25, 0.05]) scene.add(box(0.08, 1.9, 0.38, M(0x7b5c4a, 0.95), -2.28, 1.5, z));
  // bed
  const woodM = M(0x5a3b26, 0.6);
  scene.add(rbox(1.7, 1.0, 0.08, 0.03, woodM, 0, 0.75, -2.1));
  scene.add(rbox(1.7, 0.35, 2.1, 0.05, woodM, 0, 0.25, -1.05));
  scene.add(rbox(1.6, 0.22, 2.0, 0.08, M(0xeee9df, 0.9), 0, 0.52, -1.05));
  for (const x of [-0.42, 0.42]) { const pl = rbox(0.62, 0.16, 0.38, 0.08, M(0xf3efe7, 0.9), x, 0.7, -1.82); pl.rotation.x = -0.15; scene.add(pl); }
  // bedside table + lamp + clock (right of bed)
  scene.add(rbox(0.5, 0.6, 0.42, 0.03, woodM, 1.15, 0.3, -1.8));
  const clock = alarmClock(); clock.position.set(1.08, 0.7, -1.68); clock.rotation.y = -0.35; scene.add(clock);
  scene.add(cyl(0.05, 0.07, 0.04, M(0x2c2c2c, 0.5), 1.3, 0.62, -1.88, 16));
  scene.add(cyl(0.012, 0.012, 0.32, M(0x2c2c2c, 0.5), 1.3, 0.78, -1.88, 8));
  const shadeM = night ? M(0xe9dcc3, 0.9, 0, { side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ color: 0xf7e7c5, emissive: 0xffc27a, emissiveIntensity: 0.55, side: THREE.DoubleSide, roughness: 0.9 });
  scene.add(mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.2, 24, 1, true), shadeM, 1.3, 0.98, -1.88));
  // chair with clothes, a photo frame on wall
  scene.add(rbox(0.45, 0.06, 0.45, 0.02, woodM, -1.5, 0.48, -1.6)); scene.add(rbox(0.45, 0.6, 0.05, 0.02, woodM, -1.5, 0.8, -1.82));
  for (const [x, z] of [[-1.7, -1.4], [-1.3, -1.4], [-1.7, -1.8], [-1.3, -1.8]]) scene.add(cyl(0.02, 0.02, 0.46, woodM, x, 0.23, z, 8));
  scene.add(rbox(0.5, 0.12, 0.4, 0.05, M(HELENE.top, 0.9), -1.5, 0.56, -1.6));
  scene.add(box(0.5, 0.38, 0.03, M(0x3a2a1f, 0.6), 0.9, 1.75, -2.14)); scene.add(box(0.42, 0.3, 0.035, M(0x8aa080, 0.9), 0.9, 1.75, -2.13));

  // Hélène
  if (variant === 'wake') {
    const h = person({ ...PYJAMA, ...SIT, rsh: [-0.75, -0.25], rel: -0.55, lsh: [0.05, 0.12], lel: -0.3, neck: [0.1, -0.35, 0], spine: 0.1 });
    h.position.set(0.62, -0.3, -1.3); h.rotation.y = 1.25; scene.add(h);
    scene.add(rbox(1.5, 0.12, 1.2, 0.06, M(0xd9cfc0, 0.95), -0.15, 0.68, -0.75)); // pushed duvet
  } else {
    const h = person({ ...PYJAMA, neck: [0, 0, 0] });
    h.rotation.x = -Math.PI / 2; h.position.set(0.32, 0.84, 0.05); scene.add(h);
    // duvet over the body, head stays on the pillow
    const duv = rbox(1.64, 0.46, 1.72, 0.16, M(0xdcd2c2, 0.95), 0, 0.8, -0.7); scene.add(duv);
  }
  // lights
  scene.environmentIntensity = night ? 0.035 : 0.1;
  hemi(scene, 0x3d4f80, 0x0a0806, night ? 0.22 : 0.15);
  if (night) {
    spot(scene, 0x86a6ff, 38, -3.6, 2.4, -0.6, 0.4, 0.6, -1.1, 0.75, 0.45, true, 12);
    point(scene, 0x8fa8ff, 0.35, 3, 1.2, 1.2, -1.0);
  } else {
    point(scene, 0xffb46b, 3.2, 6, 1.32, 1.05, -1.75, true);
    spot(scene, 0x86a6ff, 14, -3.6, 2.4, -0.6, 0.4, 0.6, -1.1, 0.75, 0.45, false, 12);
  }
  scene.add(dust(160, [-1.8, 0.4, -1.8, 1.2, 2.2, 0.8], 0xbcd0ff, 0.012, 0.35));
  return { clock };
}

// ---------------- BARN ----------------
export function barn(scene, { variant }) {
  scene.background = new THREE.Color(0x1d1a17); scene.environmentIntensity = 0.22;
  scene.fog = new THREE.Fog(0x3a2e24, 12, 38);
  scene.add(ground(80, new THREE.MeshStandardMaterial({ map: noiseTex('#7d7468', 26, 256, 256, [6, 6]), roughness: 0.9 })));
  // feed alley strip + straw
  scene.add(box(40, 0.02, 2.2, M(0x9b9284, 0.95), 0, 0.01, 1.6));
  const straw = M(0xc8a85a, 1);
  for (let i = 0; i < 60; i++) { const s = box(rr(0.2, 0.5), 0.03, 0.04, straw, rr(-14, 14), 0.03, rr(0.6, 1.0)); s.rotation.y = rr(0, 3); scene.add(s); }
  // headlock barrier (cornadis)
  const metal = M(0x8c9aa0, 0.35, 0.8);
  scene.add(box(40, 0.07, 0.07, metal, 0, 1.25, 0.45)); scene.add(box(40, 0.07, 0.07, metal, 0, 0.55, 0.45));
  for (let x = -20; x < 20; x += 0.7) scene.add(cyl(0.025, 0.025, 0.75, metal, x, 0.9, 0.45, 8));
  scene.add(box(40, 0.4, 0.3, M(0x8a8a86, 0.9), 0, 0.2, 0.75)); // feed trough wall
  // cows behind the barrier, heads toward the alley (+z)
  seed(11);
  for (let i = 0; i < 12; i++) {
    const c = cow({ headDown: variant === 'milking' ? rnd() < 0.6 : rnd() < 0.25, brown: rnd() < 0.15 });
    c.rotation.y = -Math.PI / 2 + rr(-0.05, 0.05); c.position.set(-9 + i * 1.55, 0, -0.62); scene.add(c);
  }
  // back structure: posts, roof
  for (let x = -20; x <= 20; x += 5) { scene.add(box(0.25, 6, 0.25, M(0x5a5f62, 0.5, 0.4), x, 3, -4)); scene.add(box(0.25, 6, 0.25, M(0x5a5f62, 0.5, 0.4), x, 3, 4.5)); }
  const roof = mesh(new THREE.PlaneGeometry(44, 11), M(0x6a6e6b, 0.6, 0.3, { side: THREE.DoubleSide }), 0, 6.2, 0.2); roof.rotation.x = Math.PI / 2 + 0.12; scene.add(roof);
  scene.add(box(44, 3.8, 0.2, M(0x6f6455, 0.95), 0, 1.9, -4.2));
  for (let x = -18; x <= 18; x += 4.5) { // skylight slits on back wall
    scene.add(mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: 0xc9a77a }), x, 4.4, -4.08, false, false));
  }
  // dawn sun through the open side
  sun(scene, { pos: [-22, 8, 4], target: [0, 0, 0], color: 0xffb877, intensity: 3.6, size: 18, far: 70 });
  hemi(scene, 0x9fb4d0, 0x3a2a1c, 0.35);
  for (let i = 0; i < 6; i++) scene.add(shaft(-14 + i * 4.5, 6.0, -1.5 + (i % 2) * 1.5, 11, 0.4, 1.5, 0xffd29a, 0.045, 1.0, 0));
  scene.add(dust(500, [-10, 0.3, -3, 10, 5, 3], 0xffe2b0, 0.03, 0.55));
  if (variant === 'milking') {
    const h = person({ ...HELENE, hat: 'cap', hatColor: 0x2a3a2a, rsh: [-0.9, -0.15], rel: -0.7, lsh: [-0.7, 0.2], lel: -0.9, spine: 0.25, neck: [0.25, 0.2, 0], ...{ lhip: [0.1, 0], rhip: [-0.2, 0] } });
    h.position.set(0.9, 0, 1.55); h.rotation.y = -Math.PI / 2 - 0.35; scene.add(h);
    // pitchfork with hay
    const fork = cyl(0.018, 0.018, 1.6, M(0x7a5a3a, 0.8), 0.45, 0.85, 1.25, 8); fork.rotation.z = 0.9; fork.rotation.x = 0.3; scene.add(fork);
    for (let i = 0; i < 25; i++) { const s = box(rr(0.2, 0.5), 0.04, 0.04, straw, rr(-0.2, 0.6), rr(0.05, 0.25), rr(0.8, 1.3)); s.rotation.y = rr(0, 3); s.rotation.z = rr(-0.4, 0.4); scene.add(s); }
    // milk can
    scene.add(cyl(0.16, 0.18, 0.5, M(0xc9ced1, 0.25, 0.9), 2.2, 0.25, 1.9, 20)); scene.add(cyl(0.1, 0.14, 0.12, M(0xc9ced1, 0.25, 0.9), 2.2, 0.56, 1.9, 20));
  } else {
    // idle milking cluster hanging
    const hose = cyl(0.015, 0.015, 1.4, M(0x1a1a1a, 0.6), 2.4, 2.0, 1.2, 8); scene.add(hose);
    scene.add(cyl(0.07, 0.09, 0.14, M(0xbfc5c8, 0.25, 0.9), 2.4, 1.25, 1.2, 16));
  }
}

// ---------------- COUNTRYSIDE (aerial) ----------------
export function countryside(scene) {
  scene.background = gradientBg([[0, '#3d5f8a'], [0.45, '#c9a58a'], [0.62, '#f2c58e'], [1, '#f6d7a8']]);
  scene.fog = new THREE.Fog(0xf0caa0, 140, 520); scene.environmentIntensity = 0.35;
  seed(5);
  const cols = [0x6f8f3e, 0x8aa04a, 0xb9a65a, 0x5d7a36, 0xa28a52, 0x7b9a48, 0xc8b46a, 0x4f6d33];
  const S = 26;
  for (let i = -6; i <= 6; i++) for (let j = -8; j <= 4; j++) {
    const w = S - 1.5, d = S * rr(0.7, 1.0) - 1.5;
    const f = mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: noiseTex('#' + pick(cols).toString(16).padStart(6, '0'), 22, 128, 128, [3, 3], 900), roughness: 1 }), i * S + rr(-2, 2), 0, j * S);
    f.rotation.x = -Math.PI / 2; f.rotation.z = rr(-0.06, 0.06); scene.add(f);
  }
  scene.add(ground(900, M(0x55703a, 1), -0.05));
  const hedgeM = M(0x3b5527, 0.95, 0, { flatShading: true });
  for (let i = -7; i <= 7; i++) { const h = hedgeRow(330, hedgeM, 2.2); h.position.set(0, 0, i * S - 13); h.scale.set(1, 1.6, 1.6); scene.add(h); }
  for (let i = -7; i <= 7; i++) { const h = hedgeRow(330, hedgeM, 2.2); h.rotation.y = Math.PI / 2; h.position.set(i * S - 13, 0, -60); h.scale.set(1, 1.6, 1.6); scene.add(h); }
  const road = box(4, 0.06, 400, M(0x6d6a63, 0.9), 6, 0.03, -60); scene.add(road);
  for (let k = 0; k < 120; k++) { const t = tree({ s: rr(1.1, 1.8) }); t.position.set(rr(-170, 170), 0, rr(-210, 100)); scene.add(t); }
  const farms = [[-30, -8], [28, -30], [-60, -70], [50, 10], [-10, -120], [80, -95]];
  farms.forEach(([x, z], k) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rr(-0.6, 0.6);
    g.add(farmhouse({ w: 9, d: 6, h: 5, roof: pick([0x9c4a2e, 0x4c565c]) }));
    const sh = shed({ w: 16, d: 9, h: 5.5 }); sh.position.set(-14, 0, -4); g.add(sh);
    const tr = tractor(); tr.position.set(6, 0, 7); tr.rotation.y = rr(0, 6); tr.scale.setScalar(1.4); g.add(tr);
    if (k % 2 === 0) { const tk = truck({ color: 0xdedbd4, box: 0xc9ced3 }); tk.position.set(-2, 0, 9); tk.rotation.y = 0.3; g.add(tk); }
    scene.add(g);
  });
  // a few cows in pastures
  for (let k = 0; k < 18; k++) { const c = cow(); c.scale.setScalar(1.3); c.position.set(rr(-40, 10), 0, rr(10, 40)); c.rotation.y = rr(0, 6); scene.add(c); }
  sun(scene, { pos: [-120, 45, -160], target: [0, 0, -30], color: 0xffc58a, intensity: 3.2, size: 160, far: 500, bias: -0.0006, map: 4096, radius: 3 });
  hemi(scene, 0xb8cde8, 0x6a5a3a, 0.6);
}

// ---------------- SUPERMARKET ----------------
export function supermarket(scene) {
  scene.background = new THREE.Color(0xe9eef0);
  scene.add(ground(80, M(0xe8e6e0, 0.25, 0.0)));
  scene.add(box(40, 0.1, 80, M(0xf2f2f0, 0.9), 0, 5.2, 0));
  const shelfM = M(0xd8dcdf, 0.5, 0.3);
  seed(21);
  const prodGeo = new THREE.BoxGeometry(1, 1, 1);
  const pal = [0xd94b3d, 0xf0b23a, 0x3b7bd4, 0x5aa65a, 0xf2e2c4, 0xe86f9f, 0x7a4fb0, 0xffffff, 0xf5d547, 0x2f9e9b];
  for (const side of [-1, 1]) for (let seg = 0; seg < 10; seg++) {
    const z = -seg * 3.2, x = side * 2.0;
    scene.add(box(0.7, 2.2, 3.1, shelfM, x + side * 0.15, 1.1, z));
    const shelves = [0.25, 0.75, 1.25, 1.75];
    shelves.forEach(y => scene.add(box(0.85, 0.04, 3.1, M(0xbfc4c8, 0.4, 0.4), x - side * 0.05, y, z)));
    const n = 70;
    scene.add(instanced(prodGeo, M(0xffffff, 0.55), n, (i, o) => {
      const y = shelves[i % 4]; const empty = rnd() < (seg < 2 ? 0.55 : 0.7);
      if (empty) { o.scale.set(0.0001, 0.0001, 0.0001); return { color: 0xffffff }; }
      const h = rr(0.18, 0.4); o.position.set(x - side * rr(0.0, 0.25), y + h / 2 + 0.02, z + rr(-1.45, 1.45)); o.scale.set(rr(0.15, 0.3), h, rr(0.12, 0.3)); return { color: pick(pal) };
    }));
  }
  // ceiling lights
  for (let z = 2; z > -34; z -= 4) { scene.add(box(0.5, 0.05, 2.4, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 5.1, z)); point(scene, 0xfff6e8, 3.5, 12, 0, 4.6, z); }
  // hanging sign
  const sg = mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshStandardMaterial({ map: signTex(['PÂTES · RIZ · CONSERVES'], { w: 1024, h: 256, bg: '#1f5f3f', fg: '#ffffff', font: 'Inter', weight: 600, size: 72 }), roughness: 0.6 }), 0, 3.6, -7); scene.add(sg);
  // shoppers with carts
  const cart = () => { const g = new THREE.Group(); const wM = M(0xb8bec3, 0.3, 0.8); g.add(rbox(0.55, 0.45, 0.9, 0.03, glass(0xc0c6ca, 0.45), 0, 0.75, 0)); g.add(box(0.5, 0.03, 0.05, wM, 0, 1.05, 0.5)); for (const [x, z] of [[0.22, 0.38], [-0.22, 0.38], [0.22, -0.38], [-0.22, -0.38]]) g.add(sph(0.06, M(0x222222, 0.6), x, 0.06, z, 10)); g.add(box(0.5, 0.5, 0.04, wM, 0, 0.3, 0)); return g; };
  const ppl = [[-0.8, -3.0, 0.1], [0.9, -5.5, 3.2], [-0.4, -8.5, 0.2], [0.6, -11, 3.1], [-0.7, -14, 0.0], [0.5, -2.2, 2.9], [0.0, -17, 3.0]];
  ppl.forEach(([x, z, ry], k) => {
    const p = person(randPerson({ ...WALK(k), coat: rnd() < 0.4, rsh: [-0.6, -0.1], lsh: [-0.6, 0.1], rel: -0.4, lel: -0.4 }));
    p.position.set(x, 0, z); p.rotation.y = ry; scene.add(p);
    const c = cart(); c.position.set(x + Math.sin(ry) * 0.75, 0, z + Math.cos(ry) * 0.75); c.rotation.y = ry; scene.add(c);
    for (let i = 0; i < 6; i++) c.add(box(rr(0.12, 0.25), rr(0.15, 0.3), rr(0.12, 0.2), M(pick(pal), 0.6), rr(-0.15, 0.15), 0.9, rr(-0.3, 0.3)));
  });
  hemi(scene, 0xffffff, 0xbdb6a8, 0.45); scene.environmentIntensity = 0.25;
}

// ---------------- MARKET HALL (night) ----------------
export function market(scene) {
  scene.background = new THREE.Color(0x0d1014); scene.environmentIntensity = 0.05;
  scene.fog = new THREE.Fog(0x141a20, 25, 95);
  scene.add(ground(200, new THREE.MeshStandardMaterial({ map: noiseTex('#5d5f5e', 20, 256, 256, [10, 10]), roughness: 0.55, metalness: 0.1 })));
  const L = 90;
  for (const s of [-1, 1]) {
    scene.add(box(0.4, 9, L, M(0x3d4448, 0.8), s * 13, 4.5, -L / 2 + 10));
    for (let z = 8; z > -L + 10; z -= 6) { scene.add(box(0.3, 3.4, 4.8, M(0x52595e, 0.5, 0.4), s * 12.75, 1.7, z)); scene.add(box(0.1, 0.5, 4.8, E(0xffa04a, 0.6), s * 12.6, 3.6, z)); }
  }
  for (let z = 10; z > -L + 10; z -= 8) { const arch = mesh(new THREE.TorusGeometry(13, 0.25, 8, 40, Math.PI), M(0x4a5156, 0.5, 0.5), 0, 9, z); scene.add(arch); }
  const roof = mesh(new THREE.CylinderGeometry(13.2, 13.2, L, 40, 1, true, -Math.PI / 2, Math.PI), M(0x23292e, 0.9, 0, { side: THREE.DoubleSide }), 0, 9, -L / 2 + 10); roof.rotation.set(-Math.PI / 2, 0, 0); scene.add(roof);
  // lamps
  for (let z = 6; z > -70; z -= 10) { scene.add(cyl(0.35, 0.5, 0.25, E(0xffb060, 3), 0, 13.4, z, 16)); point(scene, 0xffa552, 60, 30, 0, 12.5, z, z > -25); }
  seed(31);
  const palM = M(0x9c7a4c, 0.95);
  for (let k = 0; k < 40; k++) { const x = rr(-10, 10), z = rr(-70, 4); if (Math.abs(x) < 2.2) continue; scene.add(box(1.2, 0.15, 1.0, palM, x, 0.08, z)); if (rnd() < 0.2) scene.add(box(1.0, rr(0.3, 0.8), 0.9, M(0x6f8a4a, 0.9), x, 0.5, z)); }
  const fork = (x, z, r) => { const g = new THREE.Group(); const y = M(0xe0a92a, 0.5, 0.2); g.add(rbox(1.0, 0.8, 1.6, 0.08, y, 0, 0.6, 0)); g.add(box(0.06, 2.2, 0.06, M(0x2a2a2a, 0.5, 0.5), 0.4, 1.3, 0.8)); g.add(box(0.06, 2.2, 0.06, M(0x2a2a2a, 0.5, 0.5), -0.4, 1.3, 0.8)); g.add(box(0.9, 0.06, 0.06, M(0x2a2a2a, 0.5, 0.5), 0, 2.3, 0.8)); g.add(box(0.12, 0.04, 1.0, M(0x2a2a2a, 0.5, 0.5), 0.25, 0.1, 1.3)); g.add(box(0.12, 0.04, 1.0, M(0x2a2a2a, 0.5, 0.5), -0.25, 0.1, 1.3)); g.add(rbox(1.0, 0.1, 0.9, 0.04, y, 0, 1.9, -0.2)); for (const s of [-1, 1]) for (const zz of [-0.5, 0.5]) { const w = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16), M(0x1a1a1a, 0.8), 0.5 * s, 0.22, zz); w.rotation.z = Math.PI / 2; g.add(w); } g.position.set(x, 0, z); g.rotation.y = r; g.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); return g; };
  scene.add(fork(-6, -12, 0.6)); scene.add(fork(7, -26, -0.4)); scene.add(fork(-8, -40, 2.4));
  const w = person({ ...randPerson(), top: 0x3c4a5a, hat: 'beanie', hatColor: 0x2b2b2b, coat: true }); w.position.set(0.4, 0, -14); w.rotation.y = 0.2; scene.add(w);
  hemi(scene, 0x334455, 0x1a1410, 0.25);
}

// ---------------- MARKET STALL (crates) ----------------
export function stall(scene) {
  scene.background = new THREE.Color(0x6f7a7f);
  scene.fog = new THREE.Fog(0x8a9296, 6, 22);
  scene.add(ground(60, M(0x6c6a66, 0.9)));
  scene.add(rbox(2.4, 0.85, 1.8, 0.02, M(0x2f6b3a, 0.95), 0, 0.42, 0)); scene.environmentIntensity = 0.3;
  seed(41);
  const crate = (x, z, label, fruit, n) => {
    const g = new THREE.Group(); g.position.set(x, 0.86, z); const wood = M(0xc9a26b, 0.85);
    g.add(box(0.62, 0.03, 0.44, wood, 0, 0.015, 0));
    for (const s of [-1, 1]) { g.add(box(0.62, 0.16, 0.025, wood, 0, 0.09, 0.21 * s)); g.add(box(0.025, 0.16, 0.44, wood, 0.3 * s, 0.09, 0)); }
    const lab = mesh(new THREE.PlaneGeometry(0.5, 0.14), new THREE.MeshStandardMaterial({ map: signTex([label], { w: 512, h: 144, bg: '#f4efe2', fg: '#1d1d1d', font: 'Inter', weight: 800, size: 84 }), roughness: 0.8 }), 0, 0.1, 0.226); lab.rotation.x = -0.35; g.add(lab);
    if (fruit) for (let i = 0; i < n; i++) { const f = sph(fruit.r * rr(0.9, 1.1), M(fruit.c, fruit.rough ?? 0.45), rr(-0.24, 0.24), 0.06 + fruit.r + (i > n * 0.55 ? fruit.r * 1.4 : 0), rr(-0.16, 0.16), 14); if (fruit.sx) f.scale.set(fruit.sx, 1, 1); g.add(f); }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
  };
  const ORANGE = { c: 0xf08a1c, r: 0.055 }, TOMATO = { c: 0xd8321f, r: 0.05, rough: 0.3 }, LEMON = { c: 0xf2d43a, r: 0.045, sx: 1.3 }, PEPPER = { c: 0x3f8f2f, r: 0.05 };
  [[-0.68, -0.5, 'ESPAGNE', ORANGE, 26], [0, -0.5, 'MAROC', TOMATO, 30], [0.68, -0.5, 'PAYS-BAS', PEPPER, 26],
   [-0.68, 0.02, 'FRANCE', null, 0], [0, 0.02, 'ITALIE', LEMON, 28], [0.68, 0.02, 'FRANCE', null, 0],
   [-0.68, 0.54, 'FRANCE', null, 0], [0, 0.54, 'FRANCE', null, 0], [0.68, 0.54, 'ESPAGNE', TOMATO, 22]].forEach(a => crate(...a));
  // price slate
  const slate = mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshStandardMaterial({ map: signTex(['Tomates', '9,80 € le kg'], { w: 512, h: 320, bg: '#1e2321', fg: '#f2f2ea', font: 'Newsreader', italic: true, weight: 500, size: 64 }), roughness: 0.9 }), -1.35, 1.25, 0.2); slate.rotation.x = -0.4; slate.rotation.y = 0.5; scene.add(slate);
  // awning
  const aw = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f3efe6' : '#2f6b3a'; g.fillRect(i * w / 8, 0, w / 8, h); } });
  const awn = mesh(new THREE.PlaneGeometry(4.6, 1.6), new THREE.MeshStandardMaterial({ map: aw, roughness: 0.9, side: THREE.DoubleSide }), 0, 2.3, -1.6); awn.rotation.x = -0.5; scene.add(awn);
  for (let k = 0; k < 5; k++) { const p = person(randPerson({ coat: true })); p.position.set(rr(-4, 4), 0, rr(-6, -3)); p.rotation.y = rr(-1, 1); scene.add(p); }
  sun(scene, { pos: [3, 9, 5], color: 0xf1ede6, intensity: 1.4, size: 6 });
  hemi(scene, 0xdde6ee, 0x55504a, 0.9);
}

// ---------------- BAKERY STREET (dawn, rain) ----------------
export function bakery(scene) {
  scene.background = gradientBg([[0, '#1d2b4a'], [1, '#55647e']]); scene.environmentIntensity = 0.05;
  scene.fog = new THREE.Fog(0x46526a, 14, 45);
  scene.add(ground(120, M(0x2c3036, 0.18, 0.1)));                // wet road
  scene.add(box(60, 0.18, 4, M(0x6b6a68, 0.35), 0, 0.09, -3));     // sidewalk
  const facade = haussmann({ w: 26, d: 6, floors: 6, lit: 0.18 }); facade.position.set(0, 0, -8); scene.add(facade);
  // shopfront
  const shopM = M(0x1f3d34, 0.5);
  scene.add(box(9, 4.2, 0.4, shopM, -1, 2.1, -4.9));
  const name = mesh(new THREE.PlaneGeometry(6.4, 0.8), new THREE.MeshStandardMaterial({ map: signTex(['BOULANGERIE'], { w: 1024, h: 128, bg: '#1f3d34', fg: '#d9b45a', font: 'Newsreader', weight: 600, size: 92 }), roughness: 0.5, metalness: 0.2 }), -1, 3.65, -4.68); scene.add(name);
  const winM = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc27a, emissiveIntensity: 1.1 });
  scene.add(box(3.8, 2.4, 0.05, winM, -3.0, 1.75, -4.68)); scene.add(box(2.2, 2.4, 0.05, winM, 2.3, 1.75, -4.68));
  scene.add(box(1.3, 2.8, 0.06, M(0x16302a, 0.5), 0.4, 1.6, -4.66));
  scene.add(box(0.9, 1.6, 0.03, winM, 0.4, 2.0, -4.62));
  const sign = mesh(new THREE.PlaneGeometry(0.82, 0.6), new THREE.MeshStandardMaterial({ map: signTex(['PLUS', 'DE PAIN'], { w: 512, h: 360, bg: '#f7f3ea', fg: '#202020', font: 'Newsreader', italic: true, weight: 600, size: 110, hand: true }), roughness: 0.9 }), 0.4, 1.95, -4.58); sign.rotation.z = 0.04; scene.add(sign);
  // empty baskets in window
  for (let i = 0; i < 4; i++) scene.add(rbox(0.6, 0.18, 0.4, 0.05, M(0x9a7444, 0.9), -4.4 + i * 0.9, 1.0, -4.85));
  point(scene, 0xffb66a, 18, 9, -1, 2.2, -3.6, true);
  // street lamps
  for (const x of [-9, 9]) { scene.add(cyl(0.07, 0.1, 4.5, M(0x1b2420, 0.5, 0.4), x, 2.25, -1.4, 10)); scene.add(sph(0.22, E(0xffd08a, 4), x, 4.6, -1.4, 16)); point(scene, 0xffc477, 20, 12, x, 4.4, -1.4); }
  // queue
  seed(51);
  for (let k = 0; k < 11; k++) { const p = person(randPerson({ coat: true, hat: rnd() < 0.3 ? 'beanie' : null, rsh: [rr(-0.3, 0.1), -0.1], lsh: [rr(-0.3, 0.1), 0.1] })); p.position.set(1.6 + k * 0.85, 0.18, -2.6 + rr(-0.2, 0.2)); p.rotation.y = -Math.PI / 2 + rr(-0.4, 0.4); scene.add(p); }
  hemi(scene, 0x6f86b8, 0x231d1a, 0.55);
  sun(scene, { pos: [10, 14, 12], color: 0x9fb2d8, intensity: 0.5, size: 20 });
  scene.add(dust(900, [-14, 0, -6, 14, 9, 6], 0xb8c8e8, 0.025, 0.4)); // rain-ish
}

// ---------------- FOOD BANK (night) ----------------
export function foodbank(scene) {
  scene.background = new THREE.Color(0x0b0f17); scene.environmentIntensity = 0.03;
  scene.fog = new THREE.Fog(0x101828, 10, 40);
  scene.add(ground(120, M(0x23272d, 0.2, 0.1)));
  const b = haussmann({ w: 30, d: 6, floors: 5, lit: 0.12 }); b.position.set(0, 0, -9); b.traverse(o => { if (o.isMesh && o.material.map) { o.material = o.material.clone(); o.material.color.setHex(0x8f8a80); } }); scene.add(b);
  // table and volunteers
  scene.add(rbox(3.2, 0.06, 0.9, 0.02, M(0xd8d3c8, 0.7), -4.5, 0.85, -3.2));
  for (const x of [-5.9, -3.1]) for (const z of [-3.55, -2.85]) scene.add(cyl(0.02, 0.02, 0.85, M(0x333333, 0.5), x, 0.42, z, 6));
  seed(61);
  for (let i = 0; i < 7; i++) scene.add(rbox(0.32, 0.4, 0.2, 0.03, M(0xb88a55, 0.95), -5.8 + i * 0.42, 1.08, -3.25));
  for (const x of [-5.4, -3.8]) { const v = person(randPerson({ top: 0xe46a1f, rsh: [-1.0, -0.1], rel: -0.6 })); v.position.set(x, 0, -4.1); scene.add(v); }
  // queue along the wall
  for (let k = 0; k < 13; k++) { const kid = rnd() < 0.18; const p = person(randPerson({ coat: true, h: kid ? 0.68 : rr(0.95, 1.05), hat: rnd() < 0.35 ? 'beanie' : null })); p.position.set(-2.4 + k * 0.95, 0, -3.0 + rr(-0.2, 0.25)); p.rotation.y = -Math.PI / 2 + rr(-0.5, 0.3); scene.add(p); }
  // lamps
  for (const x of [-6, 4, 14]) { scene.add(cyl(0.07, 0.1, 4.5, M(0x1b2420, 0.5, 0.4), x, 2.25, -1.2, 10)); scene.add(sph(0.22, E(0xffd08a, 4), x, 4.6, -1.2, 16)); point(scene, 0xffbe6e, 26, 11, x, 4.3, -1.2, x < 10); }
  hemi(scene, 0x34446a, 0x0f0c0a, 0.25);
  scene.add(dust(1200, [-12, 0, -6, 18, 8, 6], 0xaebfdc, 0.025, 0.45));
}

// ---------------- WHEAT FIELD (rotting) ----------------
export function wheat(scene) {
  scene.background = gradientBg([[0, '#6f7680'], [0.55, '#b9a88a'], [1, '#c9b48e']]); scene.environmentIntensity = 0.3;
  scene.fog = new THREE.Fog(0xc2ae8a, 20, 110);
  scene.add(ground(400, M(0x6d5a3a, 1)));
  seed(71);
  const stalk = new THREE.CylinderGeometry(0.007, 0.01, 0.85, 4); stalk.translate(0, 0.425, 0);
  const ear = new THREE.CapsuleGeometry(0.011, 0.075, 2, 5); ear.translate(0, 0.89, 0);
  const N = 26000;
  const pal = [0xa38c58, 0x8c784c, 0xb09a62, 0x7a6845, 0x947f52, 0x6e6044, 0x5f5640, 0x857a62];
  const place = (i, o) => { const near = i < N * 0.55; const x = near ? rr(-5, 5) : rr(-16, 16), z = near ? rr(-14, 5) : rr(-70, -10); o.position.set(x, 0, z); o.rotation.set(rr(-0.18, 0.18) + (rnd() < 0.3 ? rr(0.5, 1.2) : 0), rr(0, 6.3), rr(-0.18, 0.18)); o.scale.setScalar(rr(0.8, 1.1)); return { color: pick(pal) }; };
  seed(72); scene.add(instanced(stalk, M(0xffffff, 0.9), N, place));
  seed(72); scene.add(instanced(ear, M(0xffffff, 0.85), N, place));
  // distant combine harvester
  const cb = new THREE.Group(); cb.position.set(6, 0, -45); cb.rotation.y = 0.5;
  cb.add(rbox(4, 2.4, 2.6, 0.2, M(0x3f7a3a, 0.6), 0, 2.2, 0)); cb.add(rbox(1.6, 1.4, 1.6, 0.1, glass(0x9fb7c2, 0.6), 1.2, 3.9, 0)); cb.add(box(1.2, 0.8, 6, M(0xd0a020, 0.6), 3, 0.8, 0));
  for (const s of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 20), M(0x1b1b1b, 0.9), 0.8, 0.9, 1.3 * s); w.rotation.x = Math.PI / 2; cb.add(w); }
  scene.add(cb);
  // crows
  for (let k = 0; k < 9; k++) { const c = new THREE.Group(); const bm = M(0x111111, 0.6); c.add(sph(0.12, bm, 0, 0, 0, 10)); const wg = box(0.5, 0.02, 0.14, bm, 0, 0.02, 0); wg.rotation.z = rr(-0.4, 0.4); c.add(wg); c.position.set(rr(-6, 6), rr(3, 6), rr(-22, -8)); c.scale.setScalar(0.8); scene.add(c); }
  sun(scene, { pos: [-20, 18, -30], color: 0xffe2b5, intensity: 1.6, size: 30, far: 120 });
  hemi(scene, 0xc7c9cc, 0x4a3a28, 0.7);
}

// ---------------- PARK turned into vegetable patches ----------------
export function park(scene) {
  scene.background = gradientBg([[0, '#8e9aa6'], [1, '#cfd3d2']]);
  scene.fog = new THREE.Fog(0xb9bfc2, 30, 120);
  scene.add(ground(300, M(0x6f8a4a, 1)));
  seed(81);
  // turned soil beds
  for (let i = -4; i <= 4; i++) for (let j = 0; j < 6; j++) { const b = rbox(2.6, 0.18, 1.1, 0.06, new THREE.MeshStandardMaterial({ map: noiseTex('#5a4230', 40, 64, 64, [2, 1], 300), roughness: 1 }), i * 3.2, 0.06, -j * 2.0); scene.add(b); if (rnd() < 0.4) for (let k = 0; k < 8; k++) scene.add(sph(0.06, M(0x6aa040, 0.8), i * 3.2 + rr(-1.1, 1.1), 0.18, -j * 2.0 + rr(-0.35, 0.35), 8)); }
  scene.add(box(40, 0.02, 2.0, M(0xc9bfa6, 1), 0, 0.01, 2.2)); // gravel path
  // people digging
  const poses = [{ spine: 0.6, rsh: [-1.3, -0.1], lsh: [-1.0, 0.1], rel: -0.3, lel: -0.6 }, { spine: 0.2, rsh: [-0.6, -0.1], lsh: [-0.4, 0.1] }, { spine: 0.75, rsh: [-1.4, -0.2], lsh: [-1.2, 0.2], lhip: [-0.3, 0], lkn: 0.5 }];
  for (let k = 0; k < 12; k++) {
    const p = person(randPerson({ ...pick(poses), top: pick([0x2c2c34, 0x3a4a6a, 0x6b6b6b, 0xd9d2c3, 0x8a5a8f]) }));
    p.position.set(rr(-12, 12), 0.12, rr(-10, 0.5)); p.rotation.y = rr(-1.5, 1.5); scene.add(p);
    const sp = new THREE.Group(); sp.add(cyl(0.02, 0.02, 1.1, M(0x7a5a3a, 0.8), 0, 0.55, 0, 6)); sp.add(box(0.2, 0.26, 0.02, M(0x9aa0a4, 0.3, 0.8), 0, 0.02, 0)); sp.position.set(p.position.x + 0.35, 0.1, p.position.z + 0.3); sp.rotation.z = rr(-0.5, 0.5); scene.add(sp);
  }
  for (let k = 0; k < 10; k++) { const t = tree({ s: rr(1.4, 1.9), color: pick([0x56703a, 0x4a6433]) }); t.position.set(rr(-26, 26), 0, rr(-30, -16)); scene.add(t); }
  for (let i = -2; i <= 2; i++) { const h = haussmann({ w: 18, d: 10, floors: 6 }); h.position.set(i * 19, 0, -42); scene.add(h); }
  sun(scene, { pos: [10, 25, 12], color: 0xf2f0ea, intensity: 1.2, size: 26, far: 90 });
  hemi(scene, 0xdde3ea, 0x56503f, 1.0);
}

// ---------------- FALLOW FIELD ----------------
export function fallow(scene) {
  scene.background = gradientBg([[0, '#5e6670'], [1, '#a7aaa8']]); scene.environmentIntensity = 0.3;
  scene.fog = new THREE.Fog(0x9a9e9c, 15, 90);
  scene.add(ground(300, M(0x56603d, 1)));
  seed(91);
  const tuft = new THREE.ConeGeometry(0.12, 0.7, 5); tuft.translate(0, 0.35, 0);
  scene.add(instanced(tuft, M(0xffffff, 1, 0, { flatShading: true }), 7000, (i, o) => { o.position.set(rr(-20, 20), 0, rr(-50, 6)); o.rotation.set(rr(-0.4, 0.4), rr(0, 6), rr(-0.4, 0.4)); o.scale.set(rr(0.5, 1.1), rr(0.4, 1.3), rr(0.5, 1.1)); return { color: pick([0x6b7a3c, 0x7f8a45, 0x8e8a4c, 0x5a6834, 0x9a9055]) }; }));
  const bushM = M(0x46582c, 0.95, 0, { flatShading: true });
  for (let k = 0; k < 70; k++) { const b = mesh(new THREE.IcosahedronGeometry(rr(0.4, 1.2), 1), bushM, rr(-20, 20), rr(0.2, 0.6), rr(-50, -9)); scene.add(b); }
  for (let k = 0; k < 9; k++) { const t = tree({ s: rr(1.0, 1.5), color: pick([0x5a6236, 0x4d5a30, 0x6a6a3a]) }); t.position.set(rr(-22, 22), 0, rr(-45, -18)); scene.add(t); }
  const tr = tractor({ rusty: true }); tr.position.set(1.0, -0.15, -6); tr.rotation.y = 2.4; tr.rotation.z = 0.05; scene.add(tr);
  for (let k = 0; k < 160; k++) { const t2 = mesh(tuft, M(pick([0x6b7a3c, 0x8e8a4c]), 1, 0, { flatShading: true }), 1 + rr(-2.2, 2.2), 0, -6 + rr(-1.6, 1.6)); t2.scale.set(1, rr(1, 2.4), 1); t2.rotation.y = rr(0, 6); scene.add(t2); }
  sun(scene, { pos: [12, 20, -6], color: 0xdfe3e6, intensity: 0.9, size: 22 });
  hemi(scene, 0xc5ccd3, 0x45422f, 1.0);
}

// ---------------- FARM GATE at sunset ----------------
export function gate(scene) {
  scene.background = gradientBg([[0, '#2c2f5a'], [0.4, '#a2587a'], [0.7, '#f08a4b'], [1, '#ffcf7d']]);
  scene.fog = new THREE.Fog(0xe48d5a, 25, 140);
  scene.add(ground(400, M(0x4f5a30, 1)));
  seed(101);
  const wood = M(0x6b5136, 0.9);
  for (let x = -14; x <= 14; x += 2.2) { if (Math.abs(x) < 1.8) continue; scene.add(box(0.14, 1.3, 0.14, wood, x, 0.65, -2)); scene.add(box(2.2, 0.1, 0.06, wood, x + 1.1, 1.05, -2)); scene.add(box(2.2, 0.1, 0.06, wood, x + 1.1, 0.6, -2)); }
  // gate
  const gt = new THREE.Group(); gt.position.set(-1.6, 0, -2);
  for (const y of [0.35, 0.75, 1.15]) gt.add(box(3.2, 0.1, 0.07, wood, 1.6, y, 0));
  const diag = box(3.4, 0.09, 0.06, wood, 1.6, 0.75, 0); diag.rotation.z = 0.25; gt.add(diag);
  for (const x of [0, 3.2]) gt.add(box(0.16, 1.5, 0.16, wood, x, 0.75, 0));
  scene.add(gt);
  const sign = mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshStandardMaterial({ map: signTex(['FERME', 'À REPRENDRE'], { w: 640, h: 320, bg: '#f2ece0', fg: '#8a2c22', font: 'Inter', weight: 800, size: 92, border: 10, borderColor: '#8a2c22' }), roughness: 0.8, side: THREE.DoubleSide }), 0.25, 0.95, -1.95); scene.add(sign);
  // farm in background
  const fh = farmhouse({ w: 9, d: 6, h: 5, lit: 1.2, litMask: (i, fl) => i === 1 && fl === 0 }); fh.position.set(4, 0, -30); fh.rotation.y = -0.3; scene.add(fh);
  const sh = shed({ w: 16, d: 9, h: 5.5 }); sh.position.set(-10, 0, -36); scene.add(sh);
  for (let k = 0; k < 14; k++) { const t = tree({ s: rr(1.2, 2.0), color: 0x3e4a2a }); t.position.set(rr(-50, 50), 0, rr(-80, -40)); scene.add(t); }
  for (let k = 0; k < 6; k++) { const c = cow(); c.position.set(rr(-20, 10), 0, rr(-20, -8)); c.rotation.y = rr(0, 6); scene.add(c); }
  const h = person({ ...HELENE, hat: 'cap', hatColor: 0x2a3a2a, lsh: [0.05, 0.12], rsh: [0.05, -0.12], neck: [0, -0.25, 0] });
  h.position.set(1.75, 0, -0.6); h.rotation.y = Math.PI - 0.35; scene.add(h);
  sun(scene, { pos: [6, 4, -60], target: [0, 0, 0], color: 0xff9a55, intensity: 4.0, size: 30, far: 140 });
  hemi(scene, 0x8a7ab8, 0x3a2a20, 0.28); scene.environmentIntensity = 0.06;
  scene.add(sph(4, new THREE.MeshBasicMaterial({ color: 0xffe2b0, fog: false }), 14, 9, -150, 24));
}

// ---------------- VALLEY at night ----------------
export function valley(scene, { variant }) {
  scene.background = gradientBg([[0, '#05070d'], [0.6, '#0c1424'], [1, '#18233a']]);
  scene.fog = new THREE.FogExp2(0x0e1626, 0.0055);
  const geo = new THREE.PlaneGeometry(600, 600, 160, 160); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; const hgt = (x, z) => 10 * Math.sin(x * 0.012) * Math.cos(z * 0.01) + 22 * Math.max(0, Math.abs(x) / 160 - 0.35) + 4 * Math.sin(x * 0.05 + z * 0.03);
  for (let i = 0; i < pos.count; i++) pos.setY(i, hgt(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  scene.add(mesh(geo, M(0x3f5a4c, 1, 0, { flatShading: true }))); scene.environmentIntensity = 0.03;
  seed(111);
  const lastIdx = 7;
  for (let k = 0; k < 46; k++) {
    const x = k === lastIdx ? 6 : rr(-110, 110), z = k === lastIdx ? -40 : rr(-230, 40); const y = hgt(x, z);
    const lit = variant === 'last' ? k === lastIdx : rnd() < 0.68;
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rr(0, 6);
    g.add(box(5, 3, 3.5, M(0x3b3a38, 0.95), 0, 1.5, 0));
    const rf = prism(5.4, 1.6, 4, M(0x2a2624, 0.9)); rf.position.y = 3; g.add(rf);
    g.add(box(8, 3.4, 5, M(0x2f3436, 0.9), -7, 1.7, -1));
    if (lit) { g.add(box(0.7, 0.8, 0.1, E(0xffbf6a, 6), 0.8, 1.6, 1.78)); g.add(box(0.7, 0.8, 0.1, E(0xffbf6a, 5), -1.2, 1.6, 1.78)); scene.add(glow(0xffb45a, variant === 'last' ? 14 : 10, x, y + 2.5, z, 0.7)); if (k === lastIdx || k < 12) point(scene, 0xffa64d, k === lastIdx ? 260 : 90, 40, x, y + 3, z + 4); }
    else g.add(box(0.7, 0.8, 0.1, M(0x0c0e12, 0.4), 0.8, 1.6, 1.78));
    scene.add(g);
  }
  // roads (thin pale lines)
  for (let k = 0; k < 4; k++) { const r = box(1.2, 0.05, 600, M(0x2c3236, 0.9), rr(-80, 80), 0, -100); r.rotation.y = rr(-0.4, 0.4); r.position.y = 1; scene.add(r); }
  const moon = new THREE.DirectionalLight(0x9db5e6, 2.4); moon.position.set(-60, 120, 40); scene.add(moon);
  hemi(scene, 0x3d5282, 0x0a0c10, 0.8);
  const stars = dust(1500, [-400, 120, -500, 400, 300, -300], 0xffffff, 0.8, 0.8); scene.add(stars);
}

export const SETS = { bedroom, barn, countryside, supermarket, market, stall, bakery, foodbank, wheat, park, fallow, gate, valley };

// camera presets per shot: [fov, pos, look, finish options]
export const CAMS = {
  'bedroom:clock': [34, [1.36, 0.84, -1.0], [1.0, 0.8, -1.72], { dof: { focus: 0.74, aperture: 0.014, maxblur: 0.012 }, bloom: [0.7, 0.6, 0.6] }],
  'bedroom:wide': [46, [1.55, 1.85, -0.35], [0.38, 0.8, -1.68], {}],
  'bedroom:face': [44, [0.3, 2.4, -1.3], [0.3, 0.84, -1.48], { up: [0, 0, -1], bloom: [0.5, 0.6, 0.7] }],
  'bedroom:wake': [46, [2.45, 1.45, 1.0], [0.75, 0.82, -1.45], { bloom: [0.5, 0.5, 0.8] }],
  'barn:cows': [44, [-3.5, 1.55, 3.6], [1.5, 1.0, -0.4], { bloom: [0.55, 0.6, 0.8] }],
  'barn:milking': [40, [-1.6, 1.15, 3.9], [0.75, 1.05, 1.2], { bloom: [0.55, 0.6, 0.8] }],
  'countryside:aerial': [50, [-6, 34, 30], [-34, 0, -32], { aoRadius: 2.0 }],
  'supermarket:aisle': [56, [0.15, 1.6, 3.2], [0, 1.2, -16], { bloom: [0.35, 0.5, 0.9] }],
  'market:hall': [58, [0, 2.4, 10], [0, 3.2, -40], { bloom: [0.7, 0.6, 0.7] }],
  'stall:crates': [50, [0.05, 2.75, 2.15], [0, 0.95, 0.05], {}],
  'bakery:street': [50, [3.0, 1.65, 6.8], [0.4, 2.1, -4.6], { bloom: [0.7, 0.6, 0.72] }],
  'foodbank:queue': [46, [-8.6, 1.75, 2.6], [-1.6, 1.1, -3.1], { bloom: [0.7, 0.6, 0.72] }],
  'wheat:low': [50, [0, 1.7, 5.2], [0.6, 0.3, -22], {}],
  'park:wide': [48, [2, 7.5, 13], [0, 0.5, -8], {}],
  'fallow:wide': [46, [5.0, 2.3, 2.0], [0.6, 0.9, -8], {}],
  'gate:sunset': [46, [2.4, 1.35, 5.2], [-0.6, 1.5, -12], { bloom: [0.8, 0.7, 0.75] }],
  'valley:high': [52, [0, 95, 95], [0, 0, -90], { ao: false, bloom: [1.0, 0.6, 0.35] }],
  'valley:last': [48, [30, 62, 50], [6, 4, -40], { ao: false, bloom: [1.0, 0.6, 0.35] }],
};
