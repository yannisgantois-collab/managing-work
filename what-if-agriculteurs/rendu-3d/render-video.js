// Renders shots to H.264 segments: node render-video.js <shots,comma,separated> [scale] [maxFrames]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
(async () => {
  const ids = process.argv[2].split(','), scale = +(process.argv[3] || 1), maxF = +(process.argv[4] || 0), W = 1080, H = 1920, fps = 30, out = process.env.OUT || 'segments';
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of ids) {
    const t0 = Date.now();
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    p.on('console', m => { const t = m.text(); if (t.startsWith('ERR') || t.includes('rror')) console.log(id, 'console:', t.slice(0, 300)); });
    p.on('pageerror', e => console.log(id, 'pageerror:', e.message));
    await p.goto(`http://127.0.0.1:8765/video.html?shot=${id}&w=${W}&fps=${fps}&scale=${scale}`);
    await p.waitForFunction(() => document.title === 'ready' || document.title === 'error', null, { timeout: 300000 });
    if ((await p.title()) === 'error') { console.log(id, 'FAILED to build'); await p.close(); continue; }
    const info = await p.evaluate(() => window.info);
    const n = maxF ? Math.min(maxF, info.nFrames) : info.nFrames;
    const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), `${out}/${id}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    let last = {};
    for (let i = 0; i < n; i++) {
      last = await p.evaluate(i => window.frame(i), i);
      const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 30 === 0) process.stdout.write(`${id} ${i}/${n}\n`);
    }
    ff.stdin.end(); await done;
    console.log(id, 'done', n, 'frames', ((Date.now() - t0) / 1000).toFixed(1) + 's', 'info', JSON.stringify(info), 'last', JSON.stringify(last));
    await p.close();
  }
  await b.close();
})();
