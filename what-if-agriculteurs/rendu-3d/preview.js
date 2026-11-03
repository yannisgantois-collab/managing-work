const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const ids = JSON.parse(fs.readFileSync('shots.json', 'utf8')).shots.map(s => s.id).filter(i => !process.argv[2] || process.argv[2].split(',').includes(i));
  fs.mkdirSync('prev', { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of ids) {
    const p = await b.newPage({ viewport: { width: 270, height: 480 } });
    p.on('pageerror', e => console.log(id, 'pageerror:', e.message)); p.on('console', m => { if (m.text().startsWith('ERR')) console.log(id, m.text().slice(0, 300)); });
    await p.goto(`http://127.0.0.1:8765/video.html?shot=${id}&w=270&fps=30&scale=1`);
    await p.waitForFunction(() => document.title === 'ready' || document.title === 'error', null, { timeout: 300000 });
    const info = await p.evaluate(() => window.info); const n = info.nFrames;
    const picks = [0, Math.floor(n / 2), n - 1]; const st = [];
    for (const [k, i] of picks.entries()) { st.push(await p.evaluate(i => window.frame(i), i)); await p.screenshot({ path: `prev/${id}_${k}.jpg`, type: 'jpeg', quality: 85 }); }
    console.log(id, JSON.stringify(info), JSON.stringify(st));
    await p.close();
  }
  await b.close();
})();
