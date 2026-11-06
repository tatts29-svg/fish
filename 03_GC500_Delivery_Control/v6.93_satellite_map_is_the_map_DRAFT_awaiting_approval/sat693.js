const {open} = require('./lh2'); const OUT = '/tmp/claude-0/stage4/shots/'; require('fs').mkdirSync(OUT, {recursive: true});
const PAGE = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/GC500_Delivery_Control_hosted_v693.html';
(async () => { const mob = process.env.PHONE === '1', tag = (process.env.TAG || 'v693') + (mob ? '_phone' : '');
  const s = await open({pageFile: PAGE, hash: '#map', mobile: mob, W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: mob ? 2 : 1}); const p = s.page; const res = {};
  await p.waitForFunction(() => document.querySelector('#satboard canvas'), null, {timeout: 120000}).catch(() => {});
  await p.waitForFunction(() => { try { return LIVEMAP.board && LIVEMAP.board.getLayer('sb-drawn') && LIVEMAP.board.loaded(); } catch (e) { return false; } }, null, {timeout: 120000}).catch(() => {});
  await p.waitForTimeout(6000);
  res.hash = await p.evaluate(() => location.hash);
  res.chips = await p.evaluate(() => [...document.querySelectorAll('.satchip')].map(b => b.innerText.replace(/\s+/g, ' ').trim() + (b.getAttribute('aria-pressed') === 'true' ? ' ✓' : '')));
  res.buttons = await p.evaluate(() => [...document.querySelectorAll('#pane-map .sheetbtn')].map(b => b.innerText.trim()));
  res.feat = await p.evaluate(() => { const m = LIVEMAP.board; const f = m.querySourceFeatures('sb-drawn'); const by = {}; f.forEach(x => by[x.properties.g] = (by[x.properties.g] || 0) + 1); return by; });
  res.gestures = await p.evaluate(() => ({coop: LIVEMAP.board._cooperativeGestures ? true : false, scroll: LIVEMAP.board.scrollZoom.isEnabled()}));
  await p.screenshot({path: OUT + tag + '_1_open.png'});
  // zoom to the pit area to see labels, generators and light towers
  await p.evaluate(() => LIVEMAP.board.jumpTo({center: [153.4283, -27.9868], zoom: 17.2, bearing: 0})); await p.waitForTimeout(9000);
  res.rendered = await p.evaluate(() => { const f = LIVEMAP.board.queryRenderedFeatures({layers: ['sb-drawn']}); const by = {}; f.forEach(x => by[x.properties.g] = (by[x.properties.g] || 0) + 1); return by; });
  await p.screenshot({path: OUT + tag + '_2_zoom.png'});
  // chips: only generators and light towers, plus gates and big screens
  await p.evaluate(() => { for (const b of document.querySelectorAll('.satchip[data-st]')) if (!['gen', 'lt'].includes(b.dataset.st)) b.click(); for (const k of ['gate', 'screen']) { const b = document.querySelector(`.satchip[data-sx="${k}"]`); if (b) b.click(); } });
  await p.evaluate(() => LIVEMAP.board.jumpTo({center: [153.4283, -27.9880], zoom: 15.6})); await p.waitForTimeout(8000);
  res.afterChips = await p.evaluate(() => { const f = LIVEMAP.board.queryRenderedFeatures({layers: ['sb-drawn', 'sb-extra']}); const by = {}; f.forEach(x => { const k = x.properties.g || x.properties.layer; by[k] = (by[k] || 0) + 1; }); return by; });
  await p.screenshot({path: OUT + tag + '_3_gen_lt.png'});
  await p.evaluate(() => document.getElementById('satfull').click()); await p.waitForTimeout(4000); res.full = await p.evaluate(() => !!document.querySelector('.mapcard.satfull'));
  await p.screenshot({path: OUT + tag + '_4_full.png'});
  res.errors = s.errors; res.counts = s.counts; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
