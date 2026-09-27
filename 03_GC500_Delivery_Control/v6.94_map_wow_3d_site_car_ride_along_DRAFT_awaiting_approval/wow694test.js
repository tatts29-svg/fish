const {open} = require('./lh2'); const OUT = '/tmp/claude-0/stage4/shots/'; require('fs').mkdirSync(OUT, {recursive: true});
const PAGE = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/GC500_Delivery_Control_hosted_v694.html';
(async () => { const mob = process.env.PHONE === '1', tag = 'w694' + (mob ? '_phone' : ''); const res = {};
  const s = await open({pageFile: PAGE, hash: '#map', mobile: mob, W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: mob ? 2 : 1}); const p = s.page;
  await p.waitForFunction(() => { try { return LIVEMAP.board && LIVEMAP.board.isStyleLoaded() && WOW.carReady; } catch (e) { return false; } }, null, {timeout: 180000}).catch(() => {});
  res.state = await p.evaluate(() => ({style: LIVEMAP.board.getStyle().name, fallback: !!WOW.fallback, car: WOW.carReady, lap: WOW.lap && Math.round(WOW.lap.L), layers: ['sb-3d', 'sb-lap', 'sb-car', 'sb-heat', 'sb-trail'].filter(id => LIVEMAP.board.getLayer(id)), preset: wowPreset()}));
  await p.waitForTimeout(9000); await p.evaluate(() => document.querySelector('.satwrap').scrollIntoView({block: 'start'})); await p.waitForTimeout(3000);
  await p.screenshot({path: OUT + tag + '_1_flyin.png'});
  const shot = async (n, fn, wait = 9000) => { await p.evaluate(fn); await p.waitForTimeout(wait); await p.screenshot({path: OUT + tag + '_' + n + '.png'}); };
  // the pit straight area pitched, day
  await shot('2_site_day', () => { WOW.carOn = false; const m = LIVEMAP.board; m.setConfigProperty('basemap', 'lightPreset', 'day'); m.jumpTo({center: [153.42845, -27.98695], zoom: 17.6, pitch: 64, bearing: 35}); });
  await shot('3_site_night', () => { const m = LIVEMAP.board; m.setConfigProperty('basemap', 'lightPreset', 'night'); m.jumpTo({center: [153.42845, -27.98695], zoom: 17.6, pitch: 64, bearing: 35}); });
  await shot('4_overview_night', () => { const m = LIVEMAP.board; m.jumpTo({center: [153.4272, -27.9885], zoom: 14.3, pitch: 45, bearing: -20}); });
  // the car and ride along (dusk)
  res.ride = await p.evaluate(() => { LIVEMAP.board.setConfigProperty('basemap', 'lightPreset', 'dusk'); WOW.carOn = true; wowStart(); document.querySelector('.wowbar [data-wow="ride"]').click(); return WOW.ride; });
  await p.waitForTimeout(12000); await p.screenshot({path: OUT + tag + '_5_ride.png'});
  res.car = await p.evaluate(() => ({s: Math.round(WOW.s), v: Math.round(WOW.v * 3.6), hud: WOW.hud && WOW.hud.innerText}));
  await p.evaluate(() => wowRide(false));
  // status colours, overview day
  await shot('6_status', () => { const m = LIVEMAP.board; m.setConfigProperty('basemap', 'lightPreset', 'day'); const sel = document.querySelector('.wowbar [data-wow="colour"]'); sel.value = 'status'; sel.dispatchEvent(new Event('change')); m.jumpTo({center: [153.4283, -27.9875], zoom: 16.2, pitch: 40, bearing: 0}); });
  // find WC23
  await p.evaluate(() => { const sel = document.querySelector('.wowbar [data-wow="colour"]'); sel.value = 'trade'; sel.dispatchEvent(new Event('change')); const f = document.querySelector('.wowfind'); f.value = 'WC23'; f.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'})); });
  await p.waitForTimeout(7000); await p.screenshot({path: OUT + tag + '_7_find.png'});
  // hover card
  if (!mob) { const pt = await p.evaluate(() => { const m = LIVEMAP.board, d = WOW.drawn.find(x => x.key === 'WC23'), px = m.project([d.lon, d.lat]), r = m.getCanvas().getBoundingClientRect(); return [r.left + px.x, r.top + px.y]; });
    await p.mouse.move(pt[0], pt[1]); await p.waitForTimeout(3000); res.card = await p.evaluate(() => (document.querySelector('.wowc') || {}).innerText || null); await p.screenshot({path: OUT + tag + '_8_card.png'}); }
  res.errors = s.errors; res.counts = s.counts; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
