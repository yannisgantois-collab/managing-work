const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const W = +(process.argv[2] || 540), only = (process.argv[3] || '').split(',').filter(Boolean), ui = process.argv[4] !== '0', out = process.argv[5] || 'frames';
  const H = Math.round(W * 16 / 9);
  fs.mkdirSync(out, { recursive: true });
  const ids = JSON.parse(fs.readFileSync(process.env.DATA || 'shots.json', 'utf8')).shots.map(s => s.id).filter(i => !only.length || only.includes(i));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of ids) {
    const t0 = Date.now();
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    p.on('console', m => { const t = m.text(); if (!t.includes('THREE.WebGLRenderer: Context Lost')) console.log(id, 'console:', t.slice(0, 400)); });
    p.on('pageerror', e => console.log(id, 'pageerror:', e.message));
    await p.goto(`http://127.0.0.1:8765/render.html?shot=${id}&w=${W}&ui=${ui ? 1 : 0}&data=${process.env.DATA || 'shots.json'}`);
    await p.waitForFunction(() => document.title.startsWith('done'), null, { timeout: 300000 });
    await p.screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 88 });
    console.log(id, await p.title(), ((Date.now() - t0) / 1000).toFixed(1) + 's');
    await p.close();
  }
  await b.close();
})();
