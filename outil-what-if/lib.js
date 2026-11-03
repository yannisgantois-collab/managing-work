// Stylised-3D toolkit for the storyboard frames (three.js r170).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

export { THREE };

// ---------- deterministic random ----------
let _seed = 1;
export function seed(s) { _seed = s >>> 0 || 1; }
export function rnd() { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; }
export const rr = (a, b) => a + (b - a) * rnd();
export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

// ---------- materials ----------
const matCache = new Map();
export function M(color, rough = 0.78, metal = 0, extra = {}) {
  const key = JSON.stringify([color, rough, metal, extra]);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }));
  return matCache.get(key);
}
export function E(color, intensity = 2) { // emissive
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1 });
}
export function glass(color = 0x9ab8c8, opacity = 0.28) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.08, metalness: 0.1, transparent: true, opacity, depthWrite: false });
}

export function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true, recv = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; return m;
}
export const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
export const rbox = (w, h, d, r, mat, x, y, z) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat, x, y, z);
export const cyl = (rt, rb, h, mat, x, y, z, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
export const sph = (r, mat, x, y, z, seg = 24) => mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.66 | 0)), mat, x, y, z);
export const cap = (r, len, mat, x, y, z) => mesh(new THREE.CapsuleGeometry(r, len, 6, 16), mat, x, y, z);

// ---------- canvas textures ----------
export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
export function noiseTex(base, varAmt = 18, w = 256, h = 256, repeat = [1, 1], spots = 2200) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < spots; i++) {
      const v = (rnd() - 0.5) * varAmt; g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
      const s = rr(1, 5); g.fillRect(rnd() * w, rnd() * h, s, s);
    }
  }, repeat);
}
export function signTex(lines, { w = 512, h = 256, bg = '#f4efe2', fg = '#1d1d1d', font = 'Newsreader', weight = 600, size = 64, italic = false, border = 0, borderColor = '#1d1d1d', hand = false, align = 'center', lineH = 1.15 } = {}) {
  return canvasTex(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    if (border) { g.strokeStyle = borderColor; g.lineWidth = border; g.strokeRect(border / 2 + 6, border / 2 + 6, w - border - 12, h - border - 12); }
    g.fillStyle = fg; g.textAlign = align; g.textBaseline = 'middle';
    g.font = `${italic ? 'italic ' : ''}${weight} ${size}px "${font}"`;
    const n = lines.length; const total = n * size * lineH;
    lines.forEach((ln, i) => {
      const y = h / 2 - total / 2 + size * lineH * (i + 0.5);
      if (hand) { g.save(); g.translate(w / 2, y); g.rotate((rnd() - 0.5) * 0.06); g.fillText(ln, 0, 0); g.restore(); }
      else g.fillText(ln, align === 'center' ? w / 2 : 24, y);
    });
  });
}

// ---------- scene / renderer ----------
export function makeStage({ W, H, bg = 0x1a1f2b, fog = null, env = 0.35, exposure = 1.0 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  document.getElementById('stage').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = bg instanceof THREE.Texture ? bg : new THREE.Color(bg);
  if (fog) scene.fog = fog;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = env;
  return { renderer, scene };
}

export function sun(scene, { pos = [5, 10, 4], target = [0, 0, 0], color = 0xfff1dd, intensity = 2.2, size = 12, near = 0.5, far = 60, bias = -0.0004, map = 2048, radius = 4 } = {}) {
  const d = new THREE.DirectionalLight(color, intensity);
  d.position.set(...pos); d.target.position.set(...target);
  d.castShadow = true; d.shadow.mapSize.set(map, map);
  const c = d.shadow.camera; c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = near; c.far = far;
  d.shadow.bias = bias; d.shadow.normalBias = 0.02; d.shadow.radius = radius;
  scene.add(d); scene.add(d.target); return d;
}
export function hemi(scene, sky = 0xcfe0ff, ground = 0x3b3226, i = 0.6) { const h = new THREE.HemisphereLight(sky, ground, i); scene.add(h); return h; }
export function point(scene, color, intensity, dist, x, y, z, shadow = false) {
  const p = new THREE.PointLight(color, intensity, dist, 2); p.position.set(x, y, z);
  if (shadow) { p.castShadow = true; p.shadow.mapSize.set(1024, 1024); p.shadow.bias = -0.002; p.shadow.radius = 6; }
  scene.add(p); return p;
}
export function spot(scene, color, intensity, x, y, z, tx, ty, tz, angle = 0.6, pen = 0.6, shadow = true, dist = 30) {
  const s = new THREE.SpotLight(color, intensity, dist, angle, pen, 2); s.position.set(x, y, z); s.target.position.set(tx, ty, tz);
  if (shadow) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0008; s.shadow.radius = 5; }
  scene.add(s); scene.add(s.target); return s;
}

const FinishShader = {
  uniforms: { tDiffuse: { value: null }, vig: { value: 0.35 }, grain: { value: 0.035 }, lift: { value: new THREE.Vector3(0, 0, 0) }, sat: { value: 1.0 }, seed: { value: 0.3 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, grain, sat, seed; uniform vec3 lift; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed*43.1) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299,0.587,0.114)); c.rgb = mix(vec3(l), c.rgb, sat);
      c.rgb += lift * (1.0 - c.rgb);
      vec2 d = vUv - 0.5; d.x *= 0.75; float v = smoothstep(0.85, 0.2, length(d)); c.rgb *= mix(1.0 - vig, 1.0, v);
      c.rgb += (h(vUv*vec2(1080.0,1920.0)) - 0.5) * grain; gl_FragColor = c; }`
};

export function finish({ renderer, scene, camera, W, H, bloom = [0.45, 0.6, 0.85], ao = true, aoRadius = 0.5, vig = 0.35, grain = 0.03, lift = [0, 0, 0], sat = 1.0, dof = null }) {
  const comp = new EffectComposer(renderer);
  comp.setPixelRatio(1); comp.setSize(W, H);
  comp.addPass(new RenderPass(scene, camera));
  if (ao) {
    try {
      const g = new GTAOPass(scene, camera, W, H);
      g.updateGtaoMaterial({ radius: aoRadius, distanceExponent: 1.4, thickness: 1.2, scale: 1.2, samples: 16 });
      g.blendIntensity = 0.85; comp.addPass(g);
    } catch (e) { console.log('gtao fail ' + e.message); }
  }
  if (dof) comp.addPass(new BokehPass(scene, camera, { focus: dof.focus, aperture: dof.aperture, maxblur: dof.maxblur ?? 0.008 }));
  if (bloom) comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom[0], bloom[1], bloom[2]));
  comp.addPass(new OutputPass());
  const f = new ShaderPass(FinishShader); f.uniforms.vig.value = vig; f.uniforms.grain.value = grain; f.uniforms.lift.value.set(...lift); f.uniforms.sat.value = sat;
  comp.addPass(f);
  return comp;
}

export function cam(W, H, fov, pos, look, up) {
  const c = new THREE.PerspectiveCamera(fov, W / H, 0.05, 600); c.position.set(...pos); if (up) c.up.set(...up); c.lookAt(new THREE.Vector3(...look)); return c;
}

// ---------- characters ----------
const SKINS = [0xf1c6a5, 0xe0ac86, 0xc98e66, 0x9c6a48, 0x6e4a33, 0xf3d0b5];
const HAIRS = [0x2b1d14, 0x4a3020, 0x6b4a2e, 0x9a7b55, 0xc9c3b8, 0x1b1b1b, 0x8a3f22];
const TOPS = [0x2f4a6d, 0x7a2e2e, 0x3f5d3a, 0x6b6b6b, 0xc49a3a, 0x2c2c34, 0x8a5a8f, 0x4c7f99, 0xb85c38, 0xd9d2c3];
const PANTS = [0x23262e, 0x34405a, 0x4a4036, 0x2b2b2b, 0x56606b];
export function randPerson(extra = {}) {
  return { skin: pick(SKINS), hair: pick(HAIRS), top: pick(TOPS), pants: pick(PANTS), hairStyle: pick(['short', 'short', 'long', 'bun', 'bald', 'short']), ...extra };
}

// Pose angles in radians. sh = shoulder [x(forward-),z(out)], el = elbow x, hip = [x(forward-), z], kn = knee x
export function person(o = {}) {
  const p = Object.assign({ skin: 0xe8b896, top: 0x3a5a8a, pants: 0x2c2f38, shoes: 0x2a2421, hair: 0x5a3a22, hairStyle: 'short', hat: null, sleeves: true, coat: false,
    lsh: [0.05, 0.08], rsh: [0.05, -0.08], lel: -0.15, rel: -0.15, lhip: [0, 0], rhip: [0, 0], lkn: 0, rkn: 0, neck: [0, 0, 0], spine: 0, eyes: 'open', mouth: 'neutral', h: 1 }, o);
  const skinM = M(p.skin, 0.55), topM = M(p.top, 0.85), pantsM = M(p.pants, 0.85), shoeM = M(p.shoes, 0.6), hairM = M(p.hair, 0.7), dark = M(0x161210, 0.4);
  const root = new THREE.Group(); const rig = {};
  const hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
  // legs
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.1 * side, 0, 0); hips.add(hip);
    const [hx, hz] = side < 0 ? p.lhip : p.rhip; hip.rotation.x = hx; hip.rotation.z = hz;
    hip.add(cap(0.088, 0.3, pantsM, 0, -0.22, 0));
    const knee = new THREE.Group(); knee.position.y = -0.45; hip.add(knee); knee.rotation.x = side < 0 ? p.lkn : p.rkn;
    rig[side < 0 ? 'lHip' : 'rHip'] = hip; rig[side < 0 ? 'lKn' : 'rKn'] = knee;
    knee.add(cap(0.075, 0.3, pantsM, 0, -0.2, 0));
    knee.add(rbox(0.12, 0.09, 0.27, 0.04, shoeM, 0, -0.43, 0.05));
  }
  hips.add(rbox(0.36, 0.18, 0.24, 0.08, pantsM, 0, 0.02, 0));
  // torso
  const torso = new THREE.Group(); torso.rotation.x = p.spine; hips.add(torso);
  const body = cap(0.19, 0.34, topM, 0, 0.33, 0); body.scale.set(1.08, 1, 0.74); torso.add(body);
  if (p.coat) { const c2 = cap(0.2, 0.5, topM, 0, 0.2, 0); c2.scale.set(1.1, 1, 0.8); torso.add(c2); }
  torso.add(cyl(0.055, 0.06, 0.12, skinM, 0, 0.66, 0));
  // arms
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.235 * side, 0.56, 0); torso.add(sh);
    const [sx, sz] = side < 0 ? p.lsh : p.rsh; sh.rotation.x = sx; sh.rotation.z = -sz;
    sh.add(cap(0.064, 0.24, p.sleeves ? topM : skinM, 0, -0.15, 0));
    const el = new THREE.Group(); el.position.y = -0.31; sh.add(el); el.rotation.x = side < 0 ? p.lel : p.rel;
    el.add(cap(0.056, 0.22, p.sleeves ? topM : skinM, 0, -0.13, 0));
    el.add(sph(0.058, skinM, 0, -0.29, 0.005, 16));
    sh.userData.side = side; root.userData[side < 0 ? 'lArm' : 'rArm'] = sh; root.userData[side < 0 ? 'lHand' : 'rHand'] = el;
    rig[side < 0 ? 'lSh' : 'rSh'] = sh; rig[side < 0 ? 'lEl' : 'rEl'] = el;
  }
  // head
  const head = new THREE.Group(); head.position.y = 0.78; head.rotation.set(...p.neck); torso.add(head);
  const skull = sph(0.145, skinM, 0, 0.06, 0, 32); skull.scale.set(0.93, 1.08, 1); head.add(skull);
  // ears
  for (const s of [-1, 1]) { const e = sph(0.035, skinM, 0.135 * s, 0.05, 0, 12); e.scale.set(0.5, 1, 0.8); head.add(e); }
  // face
  if (p.eyes === 'closed') { for (const s of [-1, 1]) head.add(box(0.04, 0.008, 0.01, dark, 0.05 * s, 0.075, 0.138)); }
  else for (const s of [-1, 1]) { const e = sph(0.017, dark, 0.05 * s, 0.075, 0.132, 12); e.scale.set(1, 1.25, 0.6); head.add(e); }
  for (const s of [-1, 1]) { const b = box(0.05, 0.011, 0.012, hairM, 0.052 * s, 0.118, 0.132); b.rotation.z = s * (p.mouth === 'sad' ? 0.25 : -0.08); head.add(b); }
  const nose = sph(0.022, skinM, 0, 0.04, 0.148, 12); nose.scale.set(0.9, 1, 0.8); head.add(nose);
  const mouth = box(p.mouth === 'open' ? 0.04 : 0.05, p.mouth === 'open' ? 0.022 : 0.008, 0.01, M(0x5a2a26, 0.6), 0, -0.008, 0.138); head.add(mouth);
  // hair
  if (p.hairStyle !== 'bald') {
    const hg = new THREE.SphereGeometry(0.158, 32, 16, 0, Math.PI * 2, 0, p.hairStyle === 'long' ? 1.75 : 1.45);
    const hm = mesh(hg, hairM, 0, 0.075, -0.006); hm.scale.set(0.95, 1.06, 1.03); hm.rotation.x = -0.32; head.add(hm);
    if (p.hairStyle === 'long') { const l = cap(0.12, 0.2, hairM, 0, -0.04, -0.07); l.scale.set(1.15, 1, 0.55); head.add(l); }
    if (p.hairStyle === 'bun') head.add(sph(0.065, hairM, 0, 0.19, -0.1, 16));
  } else { const fr = new THREE.SphereGeometry(0.152, 32, 16, Math.PI * 0.62, Math.PI * 1.76, 1.15, 0.55); const hm = mesh(fr, M(p.hair, 0.7), 0, 0.07, -0.01); hm.scale.set(0.96, 1.05, 1.02); head.add(hm); }
  if (p.hat === 'cap') {
    const hc = mesh(new THREE.SphereGeometry(0.165, 32, 12, 0, Math.PI * 2, 0, 1.35), M(p.hatColor ?? 0x2f5d3a, 0.8), 0, 0.085, -0.005); hc.scale.set(0.97, 0.95, 1.03); head.add(hc);
    const brim = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.014, 24, 1, false, -Math.PI / 2, Math.PI), M(p.hatColor ?? 0x2f5d3a, 0.8), 0, 0.13, 0.11); brim.rotation.x = 0.12; brim.scale.set(1, 1, 0.8); head.add(brim);
  }
  if (p.hat === 'beanie') { const hc = mesh(new THREE.SphereGeometry(0.168, 32, 12, 0, Math.PI * 2, 0, 1.25), M(p.hatColor ?? 0x7a2e2e, 0.95), 0, 0.09, -0.005); head.add(hc); }
  root.scale.setScalar(p.h);
  root.userData.head = head; root.userData.torso = torso;
  rig.head = head; rig.torso = torso; rig.hips = hips;
  for (const k in rig) rig[k].userData.b = { x: rig[k].rotation.x, y: rig[k].rotation.y, z: rig[k].rotation.z, py: rig[k].position.y };
  root.userData.rig = rig;
  root.traverse(o2 => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  return root;
}
export const STAND = {};
export const WALK = (ph = 0) => ({ lhip: [Math.sin(ph) * 0.35, 0], rhip: [-Math.sin(ph) * 0.35, 0], lkn: Math.max(0, -Math.sin(ph)) * 0.4, rkn: Math.max(0, Math.sin(ph)) * 0.4, lsh: [-Math.sin(ph) * 0.35, 0.1], rsh: [Math.sin(ph) * 0.35, -0.1] });
export const SIT = { lhip: [-1.5, 0.06], rhip: [-1.5, -0.06], lkn: 1.5, rkn: 1.5 };

// ---------- animals ----------
let _cowTex = null;
function cowTex() {
  if (_cowTex) return _cowTex;
  _cowTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1a1a';
    for (let i = 0; i < 9; i++) { g.beginPath(); const x = rnd() * w, y = rnd() * h, r = rr(22, 60); for (let a = 0; a < 6.3; a += 0.5) { const rr2 = r * rr(0.7, 1.2); g.lineTo(x + Math.cos(a) * rr2 * 1.3, y + Math.sin(a) * rr2); } g.fill(); }
  });
  return _cowTex;
}
export function cow(o = {}) {
  const g = new THREE.Group();
  const bodyM = o.brown ? M(0x8a5a3a, 0.8) : new THREE.MeshStandardMaterial({ map: cowTex(), roughness: 0.8 });
  const pink = M(0xe7a9a0, 0.6), dark = M(0x1a1717, 0.5), horn = M(0xe8dcc0, 0.5);
  g.add(rbox(1.45, 0.72, 0.62, 0.2, bodyM, 0, 1.05, 0));
  const neck = rbox(0.42, 0.42, 0.36, 0.14, bodyM, 0.78, 1.12, 0); neck.rotation.z = -0.5; g.add(neck);
  const head = new THREE.Group(); head.position.set(0.98, 1.12, 0); head.rotation.z = o.headDown ? -0.9 : -0.25; g.add(head);
  head.add(rbox(0.3, 0.34, 0.3, 0.1, bodyM, 0.05, 0, 0));
  head.add(rbox(0.2, 0.18, 0.26, 0.07, pink, 0.2, -0.12, 0));
  for (const s of [-1, 1]) {
    head.add(sph(0.026, dark, 0.1, 0.08, 0.15 * s, 10));
    const ear = sph(0.07, bodyM, -0.02, 0.1, 0.2 * s, 12); ear.scale.set(0.5, 0.3, 1); head.add(ear);
    const hn = cyl(0.008, 0.025, 0.12, horn, -0.04, 0.2, 0.09 * s, 8); hn.rotation.x = 0.6 * s; head.add(hn);
    head.add(sph(0.02, dark, 0.31, -0.1, 0.05 * s, 8));
  }
  for (const [x, z] of [[0.55, 0.2], [0.55, -0.2], [-0.55, 0.2], [-0.55, -0.2]]) {
    g.add(cyl(0.075, 0.065, 0.72, bodyM, x, 0.38, z, 12));
    g.add(cyl(0.07, 0.075, 0.08, dark, x, 0.04, z, 12));
  }
  g.add(sph(0.16, pink, -0.42, 0.66, 0, 16));
  const tail = cyl(0.015, 0.015, 0.6, bodyM, -0.75, 0.85, 0, 6); tail.rotation.z = 0.15; g.add(tail);
  g.add(sph(0.045, dark, -0.79, 0.55, 0, 8));
  g.traverse(o2 => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  return g;
}

// ---------- vehicles ----------
export function tractor(o = {}) {
  const g = new THREE.Group();
  const bodyC = o.rusty ? 0x8a4a2a : (o.color ?? 0xb3261e);
  const bodyM = M(bodyC, o.rusty ? 1 : 0.45, o.rusty ? 0 : 0.2), tire = M(0x1b1b1b, 0.9), rim = M(o.rusty ? 0x6b4a2e : 0xd9b23a, 0.5, 0.3), darkM = M(0x222222, 0.6);
  g.add(rbox(1.7, 0.55, 0.62, 0.08, bodyM, 0.55, 1.0, 0));
  g.add(rbox(0.06, 0.45, 0.5, 0.02, darkM, 1.41, 0.98, 0));
  g.add(rbox(0.9, 0.25, 1.2, 0.05, bodyM, -0.35, 1.05, 0));
  // cabin
  const postM = M(0x1d1d1d, 0.5);
  for (const [x, z] of [[0.05, 0.5], [0.05, -0.5], [-0.75, 0.5], [-0.75, -0.5]]) g.add(box(0.06, 1.1, 0.06, postM, x, 1.7, z));
  g.add(rbox(1.0, 0.1, 1.15, 0.04, bodyM, -0.35, 2.28, 0));
  const gl = box(0.8, 1.0, 1.0, glass(0x8fb3c2, o.rusty ? 0.12 : 0.25), -0.35, 1.7, 0); gl.castShadow = false; g.add(gl);
  g.add(cyl(0.04, 0.04, 0.8, darkM, 0.95, 1.6, 0.18, 10));
  for (const s of [-1, 1]) {
    const rw = new THREE.Group(); rw.position.set(-0.45, 0.72, 0.68 * s); rw.rotation.x = Math.PI / 2; g.add(rw);
    rw.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.42, 32), tire));
    rw.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.44, 24), rim));
    const fw = new THREE.Group(); fw.position.set(1.05, 0.42, 0.5 * s); fw.rotation.x = Math.PI / 2; g.add(fw);
    fw.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 28), tire));
    fw.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 20), rim));
    g.add(rbox(1.0, 0.06, 0.48, 0.02, bodyM, -0.45, 1.48, 0.68 * s));
    if (o.lights) g.add(box(0.04, 0.1, 0.14, E(0xfff2c8, o.lights), 1.43, 1.12, 0.2 * s));
  }
  g.traverse(o2 => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  return g;
}
export function truck(o = {}) {
  const g = new THREE.Group(); const c = M(o.color ?? 0xe8e6e1, 0.5, 0.1), d = M(0x1b1b1b, 0.9);
  g.add(rbox(1.8, 2.0, 2.3, 0.1, c, 1.6, 1.5, 0));
  g.add(box(1.2, 0.9, 2.2, glass(0x6f8fa0, 0.6), 2.5, 2.0, 0));
  g.add(rbox(6.5, 2.6, 2.4, 0.06, M(o.box ?? 0xf2f2f2, 0.6), -2.6, 1.9, 0));
  for (const x of [2.0, -1.0, -4.6]) for (const s of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 20), d, x, 0.5, 1.15 * s); w.rotation.x = Math.PI / 2; g.add(w); }
  g.traverse(o2 => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  return g;
}

// ---------- buildings & nature ----------
export function prism(w, h, d, mat) { // gable roof along x
  const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.lineTo(-d / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); geo.translate(0, 0, -w / 2);
  const m = mesh(geo, mat); m.rotation.y = Math.PI / 2; return m;
}
export function farmhouse(o = {}) {
  const g = new THREE.Group(); const w = o.w ?? 7, d = o.d ?? 5, h = o.h ?? 4;
  const wallM = new THREE.MeshStandardMaterial({ map: noiseTex(o.wall ?? '#cdbb9a', 30, 256, 256, [2, 1]), roughness: 0.95 });
  g.add(box(w, h, d, wallM, 0, h / 2, 0));
  const roof = prism(w + 0.5, h * 0.55, d + 0.6, M(o.roof ?? 0x9c4a2e, 0.85)); roof.position.y = h; g.add(roof);
  g.add(box(0.6, 1.4, 0.6, wallM, w * 0.3, h + 1.2, 0));
  const lit = o.lit ?? 0; const winM = lit ? E(0xffc77a, lit) : M(0x2a3238, 0.3, 0.2);
  const shutM = M(o.shutter ?? 0x5d7f8f, 0.8);
  const nx = Math.max(2, Math.round(w / 2.2));
  for (let i = 0; i < nx; i++) for (let fl = 0; fl < 2; fl++) {
    const x = -w / 2 + (i + 0.5) * (w / nx), y = 1.2 + fl * 1.7;
    if (fl === 0 && i === Math.floor(nx / 2)) { g.add(box(0.9, 1.9, 0.1, M(0x5a3c28, 0.8), x, 0.95, d / 2 + 0.03)); continue; }
    const wl = (o.litMask ? o.litMask(i, fl) : true) ? winM : M(0x2a3238, 0.3, 0.2);
    g.add(box(0.7, 1.0, 0.08, wl, x, y, d / 2 + 0.03));
    for (const s of [-1, 1]) g.add(box(0.35, 1.0, 0.06, shutM, x + 0.55 * s, y, d / 2 + 0.05));
  }
  g.traverse(o2 => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  return g;
}
export function shed(o = {}) {
  const g = new THREE.Group(); const w = o.w ?? 14, d = o.d ?? 8, h = o.h ?? 5;
  const wallM = M(o.wall ?? 0x8e9a8a, 0.9);
  g.add(box(w, h, 0.2, wallM, 0, h / 2, -d / 2)); g.add(box(0.2, h, d, wallM, -w / 2, h / 2, 0)); g.add(box(0.2, h, d, wallM, w / 2, h / 2, 0));
  const roof = prism(w + 0.4, 1.6, d + 0.8, M(o.roof ?? 0x5d6b6f, 0.6, 0.3)); roof.position.y = h; g.add(roof);
  g.traverse(o2 => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  return g;
}
export function tree(o = {}) {
  const g = new THREE.Group(); const s = o.s ?? 1; const fol = M(o.color ?? pick([0x4f6b35, 0x5a7a3a, 0x46602f, 0x637f3c]), 0.9, 0, { flatShading: true });
  g.add(cyl(0.12 * s, 0.18 * s, 2.2 * s, M(0x5a4430, 0.9), 0, 1.1 * s, 0, 8));
  for (let i = 0; i < (o.n ?? 4); i++) { const b = mesh(new THREE.IcosahedronGeometry(rr(0.9, 1.4) * s, 1), fol, rr(-0.6, 0.6) * s, (2.4 + rr(0, 1.2)) * s, rr(-0.6, 0.6) * s); g.add(b); }
  g.traverse(o2 => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  return g;
}
export function bareTree(o = {}) {
  const g = new THREE.Group(); const s = o.s ?? 1; const m = M(0x3a3029, 0.95);
  g.add(cyl(0.1 * s, 0.16 * s, 2.6 * s, m, 0, 1.3 * s, 0, 7));
  for (let i = 0; i < 6; i++) { const b = cyl(0.02 * s, 0.06 * s, rr(1, 1.8) * s, m, 0, (2.2 + rr(0, 0.6)) * s, 0, 5); b.rotation.z = rr(-0.9, 0.9); b.rotation.y = rr(0, 6); b.position.x += Math.sin(b.rotation.z) * -0.5 * s; g.add(b); }
  return g;
}
export function hedgeRow(len, mat, step = 0.9) {
  const g = new THREE.Group();
  for (let x = -len / 2; x < len / 2; x += step) { const b = mesh(new THREE.IcosahedronGeometry(rr(0.55, 0.85), 1), mat, x, rr(0.4, 0.6), rr(-0.15, 0.15)); g.add(b); }
  return g;
}
export function haussmann(o = {}) {
  const g = new THREE.Group(); const w = o.w ?? 14, d = o.d ?? 10, floors = o.floors ?? 6, fh = 3.1;
  const tex = canvasTex(512, 512, (c, W, H) => {
    c.fillStyle = '#e3d6bd'; c.fillRect(0, 0, W, H);
    const cols = 6, rows = floors; const cw = W / cols, rh = H / rows;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const lit = o.lit && rnd() < o.lit;
      c.fillStyle = lit ? '#ffcf86' : '#3a4048'; c.fillRect(k * cw + cw * 0.28, r * rh + rh * 0.18, cw * 0.44, rh * 0.62);
      c.fillStyle = 'rgba(40,40,40,0.75)'; if (r === 1 || r === rows - 1) c.fillRect(k * cw + cw * 0.2, r * rh + rh * 0.78, cw * 0.6, rh * 0.06);
    }
    c.fillStyle = 'rgba(120,100,80,0.25)'; for (let r = 0; r < rows; r++) c.fillRect(0, r * rh, W, 3);
  });
  tex.repeat.set(Math.max(1, Math.round(w / 12)), 1); tex.wrapS = THREE.RepeatWrapping;
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const H = floors * fh; g.add(box(w, H, d, m, 0, H / 2, 0));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1, 1, 4, 1), M(0x5b6670, 0.7)); roof.scale.set(w * 0.7, 2.6, d * 0.7); roof.rotation.y = Math.PI / 4; roof.position.y = H + 1.3; roof.castShadow = true; g.add(roof);
  for (let i = 0; i < 3; i++) g.add(box(0.5, 1.4, 0.8, M(0xb9a88f, 0.9), -w / 3 + i * w / 3, H + 2.4, 0));
  return g;
}

export function ground(size, mat, y = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; }

export function instanced(geo, mat, n, fn) {
  const im = new THREE.InstancedMesh(geo, mat, n); const o = new THREE.Object3D(); const col = new THREE.Color();
  for (let i = 0; i < n; i++) { const r = fn(i, o, col); o.updateMatrix(); im.setMatrixAt(i, o.matrix); if (r !== false && r?.color !== undefined) im.setColorAt(i, col.set(r.color)); }
  im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; return im;
}

// light shaft (fake volumetric)
export function shaft(x, y, z, len, r1, r2, color = 0xffe2b0, opacity = 0.08, rotZ = 0, rotX = 0) {
  const geo = new THREE.CylinderGeometry(r1, r2, len, 24, 1, true); geo.translate(0, -len / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rotX, 0, rotZ); return m;
}
// dust/particles
export function dust(n, box3, color = 0xffe8c0, size = 0.03, opacity = 0.6) {
  const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = rr(box3[0], box3[3]); pos[i * 3 + 1] = rr(box3[1], box3[4]); pos[i * 3 + 2] = rr(box3[2], box3[5]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: roundTex(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
}

let _round = null;
export function roundTex() {
  if (_round) return _round;
  _round = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  return _round;
}
export function glow(color, scale, x, y, z, opacity = 0.9) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: roundTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.set(scale, scale, 1); s.position.set(x, y, z); return s;
}

// ---------- character animation: breathing, looking around, walking, gestures ----------
// o: { phase, breath, look, nod, walk (cycles/s), stride, armSwing, wave, talk, sip, sway }
export function animPerson(p, t, o = {}) {
  const R = p.userData.rig; if (!R) return;
  for (const k in R) { const j = R[k], b = j.userData.b; j.rotation.set(b.x, b.y, b.z); j.position.y = b.py; }
  const ph = o.phase ?? 0;
  R.torso.rotation.x += Math.sin(t * 1.6 + ph) * 0.022 * (o.breath ?? 1);
  R.torso.rotation.z += Math.sin(t * 0.7 + ph * 1.7) * 0.015 * (o.sway ?? 1);
  R.head.rotation.y += (Math.sin(t * 0.43 + ph * 2.3) * 0.12 + Math.sin(t * 1.13 + ph) * 0.04) * (o.look ?? 1);
  R.head.rotation.x += Math.sin(t * 0.8 + ph * 1.3) * 0.045 * (o.nod ?? 1);
  R.lSh.rotation.x += Math.sin(t * 1.6 + ph + 0.4) * 0.03; R.rSh.rotation.x += Math.sin(t * 1.6 + ph + 1.1) * 0.03;
  if (o.walk) {
    const w = t * o.walk * Math.PI * 2 + ph, s = Math.sin(w), st = o.stride ?? 0.45;
    R.lHip.rotation.x += s * st; R.rHip.rotation.x -= s * st;
    R.lKn.rotation.x += Math.max(0, -s) * st * 1.4; R.rKn.rotation.x += Math.max(0, s) * st * 1.4;
    const a = 0.38 * (o.armSwing ?? 1); R.lSh.rotation.x -= s * a; R.rSh.rotation.x += s * a; R.lEl.rotation.x -= 0.25 * (o.armSwing ?? 1); R.rEl.rotation.x -= 0.25 * (o.armSwing ?? 1);
    R.hips.position.y = R.hips.userData.b.py + Math.abs(Math.cos(w)) * 0.03;
  }
  if (o.wave) { R.rSh.rotation.z += Math.sin(t * 5.5 + ph) * 0.35; R.rEl.rotation.x += Math.sin(t * 5.5 + ph + 1) * 0.3; }
  if (o.talk) { R.rEl.rotation.x += Math.sin(t * 2.6 + ph) * 0.3 * o.talk; R.rSh.rotation.x += Math.sin(t * 1.3 + ph) * 0.12 * o.talk; R.head.rotation.x += Math.sin(t * 4.1 + ph) * 0.05 * o.talk; }
  if (o.sip) { const c = Math.max(0, Math.sin(t * 0.9 + ph)); R.lSh.rotation.x -= c * 0.6; R.lEl.rotation.x -= c * 0.9; R.head.rotation.x -= c * 0.08; }
}
// smooth pseudo-random flicker in [0,1]
export function flick(t, seed = 0) { return 0.5 + 0.25 * Math.sin(t * 13.1 + seed) + 0.15 * Math.sin(t * 23.7 + seed * 1.7) + 0.1 * Math.sin(t * 41.3 + seed * 2.9); }
