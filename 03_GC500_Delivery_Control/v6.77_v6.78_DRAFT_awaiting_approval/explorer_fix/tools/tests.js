// Acceptance checks for the staged explorer.   node tests.js [before]
// Loads the live address with the staged files served locally (GET only; writes are aborted by the harness).
const {open, settle} = require('./harness'); const fs = require('fs');
const V = process.argv[2] === 'before' ? 'before' : 'after', WORK = '/tmp/claude-0/stage/work/';
const DIRS = V === 'before' ? [WORK + 'before_site'] : ['/tmp/claude-0/stage/explorer', WORK + 'before_site'];
let pass = 0, fail = 0; const quiet = () => {};
function check(name, ok, detail = '') { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  — ' + detail : '')); }
const booted = p => p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000, polling: 250});
const banner = p => p.evaluate(() => { const b = document.getElementById('satBanner'); return b && !b.hidden ? b.innerText.replace(/\s+/g, ' ').trim() : null; });
const qual = p => p.evaluate(() => ({text: document.getElementById('qualText').textContent, cls: document.getElementById('qual').className}));
const waitBanner = p => { const t0 = Date.now(); return p.waitForFunction(() => { const b = document.getElementById('satBanner'); return b && !b.hidden; }, null, {timeout: 20000, polling: 200}).then(() => ((Date.now() - t0) / 1000).toFixed(1) + ' s after ready').catch(() => 'not within 20 s'); };
const MAPBOX = /api\.mapbox\.com/;
async function t(name, opts, fn) { const s = await open({dirs: DIRS, log: quiet, ...opts}); try { await fn(s.page, s); } catch (e) { check(name + ' (ran)', false, e.message.split('\n')[0]); } finally { await s.browser.close(); } }
(async () => {
  console.log('== load, start mode, alignment (1440 x 900)');
  await t('load', {}, async (p, s) => { await booted(p); await p.waitForTimeout(4000); await settle(p);
    check('boots without page errors', !s.errors.length && await p.evaluate(() => !window.__bootError), s.errors.join('; '));
    check('opens in Satellite + plan', await p.evaluate(() => window.GC500Explorer.state.mode) === 'hybrid', await p.evaluate(() => window.GC500Explorer.state.mode));
    check('mode button shows Satellite + plan pressed', await p.getAttribute('button[data-mode=hybrid]', 'aria-pressed') === 'true');
    const al = await p.evaluate(() => ({t: document.getElementById('alText').textContent, c: document.getElementById('alDot').className}));
    check('alignment amber and "not yet signed off" while unreviewed', !/\bok\b/.test(al.c) && /not yet signed off/.test(al.t), JSON.stringify(al));
    check('satellite imagery arrives (live tiles)', (await qual(p)).cls.indexOf('bad') < 0 && await p.evaluate(() => window.GC500Explorer.state.tiles) > 0, JSON.stringify(await qual(p)));
    await p.click('button[data-mode=original]'); check('explicit choice is remembered', await p.evaluate(() => localStorage.getItem('gc500.explorer.mode')) === 'original'); });
  for (const [hash, want] of [['#original', 'original'], ['#hybrid', 'hybrid'], ['#satellite', 'satellite']])
    await t('hash ' + hash, {hash}, async p => { await booted(p); check('deep link ' + hash + ' opens ' + want, await p.evaluate(() => window.GC500Explorer.state.mode) === want); });
  await t('stored', {storage: {'gc500.explorer.mode': 'original'}}, async p => { await booted(p); check('a stored choice (Original plan) is kept on the next visit', await p.evaluate(() => window.GC500Explorer.state.mode) === 'original'); });
  await t('stored+hash', {storage: {'gc500.explorer.mode': 'original'}, hash: '#hybrid'}, async p => { await booted(p); check('a #hybrid link beats the stored choice', await p.evaluate(() => window.GC500Explorer.state.mode) === 'hybrid'); });
  await t('find', {search: '?find=WC69'}, async p => { await booted(p); await p.waitForTimeout(500); const m = await p.evaluate(() => window.__marksCount()); check('?find=WC69 still selects WC69', m.selected === 'WC69', JSON.stringify(m) + ' label=' + await p.textContent('#viewName')); });
  await t('find+original', {search: '?find=WC69', hash: '#original'}, async p => { await booted(p); await p.waitForTimeout(500); const m = await p.evaluate(() => ({s: window.__marksCount().selected, mode: window.GC500Explorer.state.mode})); check('?find=WC69#original selects WC69 in Original plan', m.s === 'WC69' && m.mode === 'original', JSON.stringify(m)); });

  console.log('== Original plan: no black areas (E1)');
  await t('orig', {dpr: 2, hash: '#original'}, async (p, s) => { await booted(p); await p.evaluate(() => { window.GC500Explorer.goto([380, 520, 1110, 1090], 'Macintosh Island'); window.GC500Explorer.zoom(5); }); await p.waitForTimeout(2500); await settle(p); await p.waitForTimeout(1500);
    const black = await p.evaluate(() => { const c = document.getElementById('display'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; let n = 0, k = 0; for (let i = 0; i < d.length; i += 64) { k++; if (d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114 < 40) n++; } return n / k; });
    check('Macintosh Island at 500 %: near-black share of the view under 10 % (was ~76 %)', black < 0.10, (black * 100).toFixed(1) + '%'); check('no page errors', !s.errors.length); });
  await t('orig-guard', {hash: '#original', fail: u => /assets\/underlay\/manifest\.json/.test(u) ? {status: 200, contentType: 'application/json', body: fs.readFileSync(WORK + 'before_site/assets/underlay/manifest.json')} : /assets\/underlay\/x\d+\.webp/.test(u) ? {status: 200, contentType: 'image/webp', body: fs.readFileSync(WORK + 'before_site/assets/underlay/' + u.split('/').pop())} : null}, async p => {
    await booted(p); await p.evaluate(() => { window.GC500Explorer.goto([380, 520, 1110, 1090], 'x'); window.GC500Explorer.zoom(5); }); await p.waitForTimeout(2500); await settle(p); await p.waitForTimeout(1000);
    const black = await p.evaluate(() => { const c = document.getElementById('display'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, k = 0; for (let i = 0; i < d.length; i += 64) { k++; if (d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114 < 40) n++; } return n / k; });
    check('guard: the old alpha-less patch set is refused (no black areas even if re-uploaded)', black < 0.10, (black * 100).toFixed(1) + '%'); });

  console.log('== phone 390 x 844 (E2)');
  for (const mode of ['hybrid', 'original'])
    await t('phone ' + mode, {W: 390, H: 844, dpr: 3, mobile: true, hash: '#' + mode}, async (p, s) => { await booted(p); await p.waitForTimeout(2500);
      const r = await p.evaluate(() => { const vw = innerWidth, vh = innerHeight, box = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return {s, l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), on: b.left >= 0 && b.right <= vw && b.top >= 0 && b.bottom <= vh && b.width > 0}; };
        return {doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, header: document.querySelector('header').scrollWidth, vw,
          items: ['button[data-mode=original]', 'button[data-mode=hybrid]', 'button[data-mode=satellite]', '#navBtn', '#zoomOut', '#zoomIn', '#fitBtn', '#boxBtn', '#exportBtn', '#northBtn', '#sheetBtn', '#rotL', '#rotR', '#attrib', '#qual'].map(box),
          attribClipped: (() => { const a = document.getElementById('attrib'); return a.scrollWidth > a.clientWidth + 1; })(), attrib: document.getElementById('attrib').textContent}; });
      check(mode + ': no horizontal overflow (document ' + r.doc + ', header ' + r.header + ' ≤ ' + r.vw + ')', r.doc <= r.vw && r.body <= r.vw && r.header <= r.vw);
      const off = r.items.filter(i => !i.on); check(mode + ': mode buttons, ☰, zoom bar, Fit, PNG, compass, attribution, status all on screen', !off.length, off.map(i => i.s + JSON.stringify(i)).join(' '));
      check(mode + ': attribution shown in full', !r.attribClipped, r.attrib);
      const qa = r.items.find(i => i.s === '#qual'), at = r.items.find(i => i.s === '#attrib'), ro = r.items.find(i => i.s === '#rotR'); const ov = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      check(mode + ': status, attribution and compass do not overlap', !ov(qa, at) && !ov(ro, at) && !ov(qa, ro));
      await p.click('#navBtn'); await p.waitForTimeout(400); const links = await p.$$eval('#xnavSide a', a => a.map(x => x.textContent)); check(mode + ': page links are in the ☰ menu', links.length === 4, links.join(' | '));
      check(mode + ': no page errors', !s.errors.length, s.errors.join('; ')); });

  console.log('== satellite tiles failing (E3)');
  for (const [tag, rule] of [['503', {status: 503, headers: {'access-control-allow-origin': '*'}, body: ''}], ['404', {status: 404, headers: {'access-control-allow-origin': '*'}, body: '{"message":"Tile not found"}'}], ['network down', 'abort']])
    await t('tiles ' + tag, {hash: '#hybrid', fail: u => MAPBOX.test(u) ? rule : null}, async p => { await booted(p); const wb = await waitBanner(p); await p.waitForTimeout(300);
      const b = await banner(p), q = await qual(p); check('tiles ' + tag + ': plain-English banner with Retry and Show the plan only', !!b && /Satellite imagery isn't loading/.test(b) && /Retry/.test(b) && /Show the plan only/.test(b), wb + ' · ' + b);
      check('tiles ' + tag + ': status red, not "Source detail rendered"', /\bbad\b/.test(q.cls) && !/Source detail rendered/.test(q.text), JSON.stringify(q)); });
  let failUntil = 0;
  failUntil = Date.now() + 1e9;
  await t('tiles recover', {hash: '#hybrid', fail: u => MAPBOX.test(u) && Date.now() < failUntil ? {status: 503, headers: {'access-control-allow-origin': '*'}, body: ''} : null}, async (p, s) => {
    await booted(p); const wb = await waitBanner(p); check('retry: banner while the imagery server is down', !!await banner(p), wb);
    const before = s.counts.failed; await p.waitForTimeout(7000); check('retry: failed tiles are asked for again with backoff (not cached as errors for good)', s.counts.failed > before + 2, (s.counts.failed - before) + ' more attempts in 7 s');
    failUntil = 0; await p.waitForTimeout(12000); const q = await qual(p); check('retry: imagery comes back on its own once the server recovers; banner clears', !await banner(p) && !/bad/.test(q.cls), JSON.stringify(q));
  });
  failUntil = Date.now() + 1e9;
  await t('tiles retry button', {hash: '#hybrid', fail: u => MAPBOX.test(u) && Date.now() < failUntil ? 'abort' : null}, async (p, s) => {
    await booted(p); await waitBanner(p); const f0 = s.counts.failed; await p.click('#satRetry'); await p.waitForTimeout(1000);
    check('Retry button: asks for the failed tiles again at once', s.counts.failed > f0, (s.counts.failed - f0) + ' new attempts within 1 s of the click');
    failUntil = 0; await p.evaluate(() => document.getElementById('satRetry').click()); await p.waitForTimeout(4000);
    check('Retry button: once the imagery is reachable, it loads and the banner clears', !await banner(p) && !/bad/.test((await qual(p)).cls), JSON.stringify(await qual(p)));
    failUntil = Date.now() + 1e9; await p.evaluate(() => window.GC500Explorer.zoom(3)); await waitBanner(p); await p.click('#satPlan'); await p.waitForTimeout(500);
    check('Show the plan only: switches to Original plan and hides the banner', await p.evaluate(() => window.GC500Explorer.state.mode) === 'original' && !await banner(p)); });
  await t('map key 500', {hash: '#hybrid', fail: u => /\/api\/map-key/.test(u) ? {status: 500, contentType: 'application/json', body: '{"error":"x"}'} : null}, async p => { await booted(p); await p.waitForTimeout(2500); const b = await banner(p); check('no map key: same banner, says why', !!b && /did not give this page a key/.test(b), b); });

  console.log('== loading failures (E6)');
  const bootFail = async (name, rule, want, wait = 60000) => t(name, {fail: rule}, async p => { const t0 = Date.now(); await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: wait, polling: 250}).catch(() => {});
    const r = await p.evaluate(() => ({text: document.getElementById('loadText').textContent, retry: !document.getElementById('bootRetry').hidden, err: window.__bootError || null}));
    check(name + ': friendly message and Try again (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)', r.err && r.retry && want.test(r.text) && !/scene \d{3}/.test(r.text), JSON.stringify(r.text)); });
  await bootFail('scene-worker.js 404', u => /scene-worker\.js/.test(u) ? {status: 404, body: 'nf'} : null, /did not load/);
  await bootFail('drawing-scene.bin 404', u => /drawing-scene\.bin/.test(u) ? {status: 404, body: 'nf'} : null, /missing from the server/);
  await bootFail('drawing-scene.bin 503', u => /drawing-scene\.bin/.test(u) ? {status: 503, body: 'x'} : null, /try again/i);
  await bootFail('drawing-scene.bin never answers', u => /drawing-scene\.bin/.test(u) ? 'hang' : null, /taking too long/, 70000);
  await t('preview 404', {fail: u => /original-preview\.webp/.test(u) ? {status: 404, body: 'nf'} : null}, async (p, s) => { await booted(p); const r = await p.evaluate(() => ({ready: !!window.__ready, err: window.__bootError || null})); check('preview image missing: the app still opens', r.ready && !r.err && !s.errors.length, JSON.stringify(r)); });
  console.log(`\n${V}: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
