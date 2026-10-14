// Author: Andrew Fisher. Opens the v10.20 candidate read-only at the live address (every write aborted) and checks the
// Gate 6 data as the running page sees it, then takes two screenshots. node tests/browser_check1020.cjs <candidate.html>
const path = require('path'); const fs = require('fs');
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const POS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'gate6_positions_1020.json'), 'utf8'));
(async () => {
  const pageFile = process.argv[2]; const out = {checks: [], errors: []};
  const ok = (n, c, d) => { out.checks.push({n, ok: !!c, d}); console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' — ' + d)); };
  const s = await open({pageFile, hash: '#map', W: 1440, H: 900});
  await s.page.waitForTimeout(6000);
  const got = await s.page.evaluate(refs => {
    const r = {};
    for (const k of refs) {
      const m = (typeof MASTER_LOC === 'object' && MASTER_LOC[k]) || null;
      const sh = (typeof MASTER_SHAPES926_DATA === 'object' && MASTER_SHAPES926_DATA.shapes && MASTER_SHAPES926_DATA.shapes[k]) || null;
      let imgs = null; try { imgs = typeof dpMasterImgs === 'function' ? dpMasterImgs({key: k}).map(x => (x.src || '').slice(0, 22)) : 'no dpMasterImgs'; } catch (e) { imgs = 'err ' + e.message; }
      r[k] = {pt: m && m.pt, ll: m && m.ll, near: m && m.near, beside: m && m.beside, k: sh && sh.k, imgs};
    }
    r.footer = (document.body.innerText.match(/v10\.\d\d/g) || []).slice(-1)[0];
    // DETAILS1002 lives inside a closure, so read the WC49 destination from the script text the page is running
    const src = [...document.scripts].map(x => x.textContent).find(t => t.includes('const DETAILS1002 = {')) || '';
    const m2 = src.match(/"WC49": \{\s*"destination": "([^"]*)",\s*"sourceText": "[^"]*",\s*"coordinates": "([^"]*)"/);
    r.details = m2 ? {destination: m2[1], coordinates: m2[2]} : null;
    r.imgTable = typeof MASTER_IMG1020 === 'object' ? Object.keys(MASTER_IMG1020).length : -1;
    return r;
  }, ['P60', 'P62', 'P63', 'WC49', 'GN06']);
  for (const k of ['P60', 'P62', 'P63', 'WC49', 'GN06']) {
    const w = POS.refs[k];
    ok(`${k} pin as computed`, JSON.stringify(got[k].pt) === JSON.stringify(w.new.pt) && JSON.stringify(got[k].ll) === JSON.stringify(w.new.ll), JSON.stringify(got[k]));
    ok(`${k} footprint centre as computed`, JSON.stringify(got[k].k) === JSON.stringify(w.shape.k), JSON.stringify(got[k].k));
    if (k !== 'GN06') ok(`${k} two master-plan pictures resolve in the page`, Array.isArray(got[k].imgs) && got[k].imgs.length === 2 && got[k].imgs.every(x => x.startsWith('data:image/webp')), JSON.stringify(got[k].imgs));
  }
  ok('WC49 driver destination', got.details && got.details.coordinates === POS.details1002_WC49.coordinates && got.details.destination === POS.details1002_WC49.destination, JSON.stringify(got.details));
  ok('picture table has 8 entries', got.imgTable === 8, String(got.imgTable));
  ok('footer v10.20 or a later release carrying it', /^v10\.2\d$/.test(got.footer || ''), got.footer);
  await s.page.screenshot({path: path.join(__dirname, 'map_desktop1020.png')});
  await s.page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/#day/2026-10-15', {waitUntil: 'load', timeout: 120000}).catch(() => {});
  await s.page.waitForTimeout(5000);
  await s.page.screenshot({path: path.join(__dirname, 'day15_desktop1020.png')});
  ok('no page errors', s.errors.length === 0, s.errors.join(' | '));
  ok('no write reached the service', s.counts.blocked >= 0, '');
  out.errors = s.errors; out.counts = s.counts; out.got = got;
  fs.writeFileSync(path.join(__dirname, 'browser_check1020_result.json'), JSON.stringify(out, null, 1));
  console.log('counts', JSON.stringify(s.counts), 'errors', s.errors.length);
  await s.browser.close();
  process.exit(out.checks.every(c => c.ok) ? 0 : 1);
})().catch(e => { console.error('ERR', e.message); process.exit(2); });
