const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1280, height: 800}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(2000);
  await page.evaluate(() => go('map')); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('#stage').scrollIntoView({block: 'center'})); await page.waitForTimeout(400);
  const bb = await (await page.$('#stage')).boundingBox();
  // where marker P12 sits relative to the drawing, as a fraction of the image
  const rel = () => page.evaluate(() => { const im = document.querySelector('#inner img').getBoundingClientRect(), m = document.querySelector('#pane-map .mk[data-keys="P12"]').getBoundingClientRect();
    return [+(((m.left + m.width / 2) - im.left) / im.width).toFixed(4), +(((m.top + m.height / 2) - im.top) / im.height).toFixed(4), +state.zoom.toFixed(3), document.querySelector('#stage').classList.contains('zooming')]; });
  console.log('start', JSON.stringify(await rel()));
  await page.mouse.move(bb.x + bb.width * .6, bb.y + bb.height * .5);
  await page.evaluate(() => { window.__fr = []; let last = performance.now(); const f = t => { window.__fr.push([t - last, state.zoom]); last = t; if (window.__fr.length < 150) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(60); }
  const mid = await rel(); await page.waitForTimeout(700);
  console.log('mid', JSON.stringify(mid), 'settled', JSON.stringify(await rel()));
  console.log('zoom steps', JSON.stringify(await page.evaluate(() => window.__fr.slice(0, 40).map(x => +x[1].toFixed(2)))));
  await page.click('#stage [data-z="in"]'); await page.waitForTimeout(700); console.log('button in', JSON.stringify(await rel()));
  await page.mouse.dblclick(bb.x + bb.width * .3, bb.y + bb.height * .4); await page.waitForTimeout(700); console.log('dblclick', JSON.stringify(await rel()));
  await page.click('#stage [data-z="reset"]'); await page.waitForTimeout(400); console.log('reset', JSON.stringify(await rel()));
  // drag pan still works
  await page.mouse.wheel(0, -300); await page.waitForTimeout(600); const b4 = await page.evaluate(() => [state.ox, state.oy]);
  await page.mouse.move(bb.x + 500, bb.y + 200); await page.mouse.down(); for (let i = 0; i < 8; i++) await page.mouse.move(bb.x + 500 - i * 25, bb.y + 200 - i * 5); await page.mouse.up(); await page.waitForTimeout(300);
  console.log('pan', JSON.stringify(b4), '->', JSON.stringify(await page.evaluate(() => [state.ox, state.oy])), 'zooming after', await page.evaluate(() => document.querySelector('#stage').classList.contains('zooming')));
  // a marker click still opens
  console.log('errors', JSON.stringify(errs)); await browser.close(); })();
