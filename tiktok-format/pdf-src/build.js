// Rend guide.html en PDF A4 et signale les pages dont le contenu déborde sur le pied de page.
const path = require('path');
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;

(async () => {
  const out = process.argv[2] || path.join(__dirname, 'guide.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.goto('file://' + path.join(__dirname, 'guide.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const report = await page.evaluate(() =>
    [...document.querySelectorAll('.page')].map((p, i) => {
      const pr = p.getBoundingClientRect();
      const f = p.querySelector('.footer').getBoundingClientRect();
      let max = 0, maxEl = null, right = 0, rightEl = null;
      p.querySelectorAll('*').forEach(el => {
        if (el.closest('.footer') || el.closest('.hero')) return;
        const r = el.getBoundingClientRect();
        if (!r.height) return;
        if (r.bottom > max) { max = r.bottom; maxEl = el; }
        if (r.right > right) { right = r.right; rightEl = el; }
      });
      const tag = el => el && (el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      return { page: i + 1, freeBottom: Math.round(f.top - max), last: tag(maxEl), overRight: Math.round(right - (pr.right - 64)), rightEl: tag(rightEl) };
    })
  );
  for (const r of report) console.log(JSON.stringify(r));
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  console.log('fonts loaded:', fonts.join(', '));
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('PDF:', out);
})();
