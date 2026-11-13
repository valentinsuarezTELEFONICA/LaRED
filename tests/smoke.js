// Prueba de humo en Chromium real (Playwright). Uso: node tests/smoke.js [captura.png]
// Requiere `playwright` (en el entorno cloud ya viene: require('playwright') funciona).
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch();
  let fail = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
  for (const page of ['index.html', 'editor.html']) {
    const p = await b.newPage({ viewport: { width: 3840, height: 2160 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(root, page));
    await p.waitForTimeout(6000);
    const boxes = await p.locator('#stage .box').count();
    const sz = await p.evaluate(() => { const s = document.querySelector('#stage'); const r = s && s.getBoundingClientRect(); return r ? [r.width, r.height] : [0, 0]; });
    ok(errs.length === 0, page + ' sin errores JS ' + errs.join('|'));
    ok(boxes === 10, page + ' 10 cajas (' + boxes + ')');
    ok(sz[0] > 0 && sz[1] > 0, page + ' #stage con tamaño ' + sz.join('x'));
    if (page === 'index.html' && process.argv[2]) await p.screenshot({ path: process.argv[2] });
    await p.close();
  }
  await b.close();
  process.exit(fail ? 1 : 0);
})();
