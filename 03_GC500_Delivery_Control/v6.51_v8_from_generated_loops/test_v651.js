// v6.51: with sound on, the engine runs from the three generated loops (mode loops), gains finite, the crowd bed plays; the Engine chooser switches to the designed V8 and back
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 800}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(8000);
  const pre = await page.evaluate(() => ({mounted: !!GC3D.S, soundBtn: !document.querySelector('#showSound').hidden, clips: Object.keys(DATA.showSound).filter(k => k !== 'about')}));
  console.log('pre', JSON.stringify(pre));
  await page.click('#showSound'); await page.waitForTimeout(6000);
  const s1 = await page.evaluate(() => { const S = GC3D.sound; return {on: S.isOn(), mode: S.mode, ctx: S.ctx && S.ctx.state, bufs: Object.keys(S.bufs).filter(k => !k.endsWith('_pending')), loops: S.nodes.loops ? S.nodes.loops.map(L => [L.name, +L.src.playbackRate.value.toFixed(2), +L.g.gain.value.toFixed(3)]) : null, crowd: !!S.nodes.crowd, crowdG: S.g.crowd && +S.g.crowd.gain.value.toFixed(3), engG: +S.g.engine.gain.value.toFixed(3), rpm: Math.round(S.rpm), log: S.log.slice(-8).map(l => l.what), chooser: !document.querySelector('#showEngineL').hidden, sel: document.querySelector('#showEngine').value}; });
  console.log('loops', JSON.stringify(s1));
  await page.selectOption('#showEngine', 'engine'); await page.waitForTimeout(3000);
  const s2 = await page.evaluate(() => { const S = GC3D.sound; return {mode: S.mode, pref: localStorage.getItem('gc500.showengine'), loops: !!S.nodes.loops, engine: !!S.nodes.engine, log: S.log.slice(-4).map(l => l.what)}; });
  console.log('designed', JSON.stringify(s2));
  await page.selectOption('#showEngine', 'loops'); await page.waitForTimeout(3000);
  console.log('back', JSON.stringify(await page.evaluate(() => ({mode: GC3D.sound.mode, loops: !!GC3D.sound.nodes.loops, finite: GC3D.sound.nodes.loops ? GC3D.sound.nodes.loops.every(L => isFinite(L.g.gain.value) && isFinite(L.src.playbackRate.value)) : null}))));
  console.log('errors', errs.slice(0, 5));
  await browser.close(); })();
