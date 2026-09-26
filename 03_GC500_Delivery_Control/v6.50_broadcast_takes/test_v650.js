// v6.50: the Broadcast plays Andrew's takes over the scenes - the button offers it, a press starts the programme on turn 1 from the hosted media, the take actually plays, and the scene follows the slot
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 800}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
  await page.goto(process.argv[2] + '#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  const pre = await page.evaluate(() => ({turns: bcTurns().length, have: bcHave(), withAudio: bcTurns().filter(t => t.audio).length, sample: String(bcTurns()[0].audio).slice(0, 60), about: DATA.broadcast.about.have + '/' + DATA.broadcast.about.of}));
  console.log('data', JSON.stringify(pre));
  await page.click('#showStart'); await page.waitForTimeout(1500);
  const btn = await page.evaluate(() => { const b = document.querySelector('#showBroadcast'); return {hidden: b.hidden, text: b.textContent, title: b.title.slice(0, 80)}; });
  console.log('button', JSON.stringify(btn));
  await page.click('#showBroadcast'); await page.waitForTimeout(4000);
  const st = await page.evaluate(() => ({on: BC.on, slot: BC.i, src: BC.el && BC.el.src.replace(/\/m\/[^/]+\//, '/m/<token>/'), paused: BC.el && BC.el.paused, t: BC.el && +BC.el.currentTime.toFixed(2), dur: BC.el && +BC.el.duration.toFixed(2), err: BC.el && BC.el.error && BC.el.error.code, scene: SHOW_ORDER[SHOW.i], label: document.querySelector('#showBroadcast').textContent}));
  console.log('playing', JSON.stringify(st));
  // the media file itself
  const r = await page.evaluate(async () => { const u = BC.el.src; const x = await fetch(u); return {status: x.status, type: x.headers.get('content-type'), len: x.headers.get('content-length')}; });
  console.log('media', JSON.stringify(r));
  await page.waitForTimeout(11000);
  console.log('later', JSON.stringify(await page.evaluate(() => ({slot: BC.i, ran: BC.ran, scene: SHOW_ORDER[SHOW.i], t: BC.el && +BC.el.currentTime.toFixed(1)}))));
  await page.click('#showBroadcast'); await page.waitForTimeout(500);
  console.log('stopped', JSON.stringify(await page.evaluate(() => ({on: BC.on, el: !!BC.el, playing: SHOW.playing}))));
  console.log('errors', errs.slice(0, 5));
  await browser.close(); })();
