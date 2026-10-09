// machine v5.85: auto gears + fast wheels + blur, safety officer, nothing blocks the view, no hoses
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({ignoreHTTPSErrors: true, viewport: {width: 1280, height: 800}})).newPage(); const logs = [];
  page.on('pageerror', e => logs.push('PAGEERROR ' + String(e).slice(0, 300))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ' ' + m.text().slice(0, 200)); });
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 400000, polling: 2000});
  console.log('scene', JSON.stringify(await page.evaluate(() => { const c = __cw.crew, s = c.men && c.men.safety; return {hoses: !!__cw.scene.getObjectByName('extraction hose, near') && !!__cw.scene.getObjectByName('extraction hose, near').parent, safety: !!s, vest: !!__cw.scene.getObjectByName('Safety officer hi-vis vest'), dyno: __cw.dyno}; })));
  await page.click('#start'); await page.evaluate(() => __cw.advance(3, 1 / 30, () => __cw.drive.running));
  await page.evaluate(() => { const t = document.querySelector('#throttle'); t.value = 100; t.dispatchEvent(new Event('input', {bubbles: true})); });
  const trace = [];
  for (let i = 0; i < 6; i++) { trace.push(await page.evaluate(() => { __cw.advance(2, 1 / 30); return {gear: __cw.cabin.gear, spin: +__cw.dyno.spin.toFixed(1), rpm: Math.round(__cw.powertrain.rpm), kmh: Math.round(__cw.powertrain.kmhDial || 0)}; })); }
  console.log('run', JSON.stringify(trace));
  await page.waitForTimeout(2500); await page.screenshot({path: 'machine_qa/v585_run_car.png', timeout: 180000});
  console.log('safety at', JSON.stringify(await page.evaluate(() => { const s = __cw.crew.men.safety; return [+s.pos.x.toFixed(2), +s.pos.z.toFixed(2)]; })));
  // occlusion: put the camera behind a hall object - look from the far side past the console / gantry
  for (const [n, eye] of [['console', [0, 1.6, -6.5]], ['crane', [2.5, 4.5, 4.0]], ['wide', [-7, 3.2, 6.5]]]) {
    await page.evaluate(eye => { const c = __cw.camera, ctl = __cw.controls; ctl.target.set(0, .7, 0); c.position.set(...eye); ctl.update(); }, eye);
    await page.waitForTimeout(3500); const st = await page.evaluate(() => __cw.dyno.faded);
    await page.screenshot({path: `machine_qa/v585_occl_${n}.png`, timeout: 180000}); console.log('occlusion', n, 'faded', st);
  }
  // lift off: back to neutral after a while
  await page.evaluate(() => { const t = document.querySelector('#throttle'); t.value = 0; t.dispatchEvent(new Event('input', {bubbles: true})); __cw.advance(8, 1 / 30); });
  console.log('lift', JSON.stringify(await page.evaluate(() => ({gear: __cw.cabin.gear, spin: +__cw.dyno.spin.toFixed(2), fast: __cw.dyno.fast}))));
  console.log('logs', JSON.stringify(logs.slice(0, 20), null, 1));
  await browser.close(); })();
