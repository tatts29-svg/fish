const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1280, height: 800}})).newPage(); const logs = [];
  page.on('pageerror', e => logs.push(String(e).slice(0, 300)));
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 400000, polling: 2000});
  console.log(JSON.stringify(await page.evaluate(() => { const c = __cw.crew, s = c.men.safety, out = [];
    for (let i = 0; i < 6; i++) { __cw.advance(3, 1 / 30); out.push([+s.pos.x.toFixed(2), +s.pos.z.toFixed(2), !!s.path, s.arrived]); }
    const info = c.info ? c.info() : null; return {out, keys: Object.keys(c.scripts || {}), info: info && JSON.stringify(info).slice(0, 400)}; })));
  // close-up of the near rear wheel while spinning
  await page.click('#start'); await page.evaluate(() => __cw.advance(3, 1 / 30, () => __cw.drive.running));
  await page.evaluate(() => { const t = document.querySelector('#throttle'); t.value = 100; t.dispatchEvent(new Event('input', {bubbles: true})); __cw.advance(6, 1 / 30);
    const w = __cw.scene.getObjectByName('Wheel speed blur'); const T = __cw.camera.position.constructor, p = new T(); w.parent.getWorldPosition(p);
    __cw.controls.target.copy(p); __cw.camera.position.set(p.x + .4, p.y + .5, p.z + (p.z > 0 ? 1.6 : -1.6)); __cw.controls.update(); });
  await page.waitForTimeout(3000); await page.screenshot({path: 'machine_qa/v585_wheel_close.png', timeout: 180000});
  console.log(JSON.stringify(await page.evaluate(() => ({spin: __cw.dyno.spin, gear: __cw.cabin.gear}))), logs);
  await browser.close(); })();
