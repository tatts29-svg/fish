// v8.18 - meet points, site rules and the Event Portables load plan: checks. Author: Andrew Fisher.
// Read only: open_page.js serves the build at the live address and aborts every write; window.print is replaced by a
// counter so no dialog opens. Nothing here edits the record.
//   cd 03_GC500_Delivery_Control && CHROMIUM_PATH=/opt/pw-browsers/chromium SHOTS=<dir> node v8.18_meet_points_ep_plan_DRAFT/evidence/v818_tests.js
// Writes <SHOTS>/qr818.json (every QR element screenshot with the URL it must decode to) for qr_decode818.py.
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE || path.join(ROOT, 'build/GC500_v8.18/GC500_Delivery_Control_hosted.html');
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, {recursive: true});
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'meet_points_03Oct2026/event_portables_plan.json'), 'utf8'));
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0, passes = 0; const ok = (c, what, d = '') => { if (c) passes++; else fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d !== '' && d != null ? '  - ' + (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 500) : '')); };
const QR = []; let qn = 0, CURP = null;
/* the very SVG the page drew, copied whole into a 480 px box so one module is several pixels (a 1x screen capture of a
   92 px code is about 1.5 px a module, below what a decoder reads) */
async function qrShot(el, want, tag) {
  const f = path.join(SHOTS, `qr_${String(++qn).padStart(3, '0')}_${tag.replace(/[^\w-]+/g, '_')}.png`);
  const pg = await el.evaluate(e => { const svg = e.tagName.toLowerCase() === 'svg' ? e : e.querySelector('svg'); const d = document.createElement('div'); d.id = 'qr818shot';
    d.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:480px;background:#fff;z-index:2147483647;padding:0;margin:0'; d.innerHTML = svg ? svg.outerHTML : '';
    const s = d.querySelector('svg'); if (s) { s.setAttribute('width', '480'); s.setAttribute('height', '480'); s.style.cssText = 'display:block;width:480px;height:480px'; } document.body.appendChild(d); return !!svg; });
  const box = await CURP.$('#qr818shot'); await box.screenshot({path: f}); await box.evaluate(e => e.remove());
  QR.push({file: f, want, tag, svg: pg});
}
async function ready(p) {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length && typeof meetPoint818 === 'function', null, {timeout: 240000});
  await wait(2500);
  await p.evaluate(() => { window.__prints818 = 0; window.print = () => { window.__prints818++; }; });
}
const navUrl = ll => `https://www.google.com/maps/dir/?api=1&destination=${ll[0].toFixed(6)},${ll[1].toFixed(6)}&travelmode=driving`;
async function run(name, dev) {
  console.log(`\n== ${name}`);
  const s = await open({pageFile: BUILD, hash: '#timeline', ...dev}); const p = s.page; const cons = []; CURP = p;
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await ready(p);
  const phone = !!dev.mobile, tag = phone ? 'phone' : 'desktop';
  // ---------------- release marker and footer
  const rel = await p.evaluate(() => ({meta: (document.querySelector('meta[name="gc500-release"]') || {}).content, foot: document.getElementById('footL').textContent}));
  ok(rel.meta === 'v8.18' && /v8\.18$/.test(rel.foot), `${name}: the release marker and the footer read v8.18`, rel);
  // ---------------- the drawer: every reference carries its meet point; one sample per point is screenshot and its QR decoded
  const keys = await p.evaluate(() => allAssets().map(a => a.key));
  const per = {}, bad = [];
  const list = phone ? null : keys;
  const sample = {};
  for (const k of (list || [])) {
    await p.evaluate(k => openAsset(k), k); await wait(260);
    const r = await p.evaluate(k => { const a = allAssets().find(x => x.key === k), m = meetPoint818(a), b = document.querySelector('#drawer .where816 .mp818');
      return {id: m.p.id, name: m.p.name, ll: m.p.ll, box: b ? b.dataset.mp818 : null, txt: b ? b.querySelector('.mp818-n').textContent : '', href: b ? b.querySelector('a.mp818-qr').getAttribute('href') : '', park: !!(b && b.querySelector('.mp818-park')), svg: !!(b && b.querySelector('a.mp818-qr svg'))}; }, k);
    const good = r.box === r.id && r.txt === 'Meet point: ' + r.name && r.href === navUrl(r.ll) && r.svg && r.park === (r.id === 'ISLAND_WEST_PARK');
    if (!good) bad.push({k, r}); per[r.id] = (per[r.id] || 0) + 1; if (!sample[r.id]) sample[r.id] = k;
  }
  if (!phone) {
    ok(!bad.length && keys.length > 150, `${name}: all ${keys.length} reference drawers show "Meet point: <name>", a directions QR to that point and the parkland box only for the parkland`, bad.slice(0, 5));
    console.log('   by meet point:', JSON.stringify(per));
    ok(Object.keys(per).length === 10, `${name}: all ten meet points are in use across the drawers`, Object.keys(per));
  }
  const show = phone ? {ISLAND_WEST_PARK: 'WC02', PITLANE: 'WC21', COMMODORE: 'WC38'} : sample;
  for (const [id, k] of Object.entries(show)) {
    await p.evaluate(k => openAsset(k), k); await wait(1400);
    const el = await p.$('#drawer .mp818'); ok(!!el, `${name}: ${k} drawer shows its meet point box (${id})`);
    if (!el) continue;
    await el.scrollIntoViewIfNeeded(); await wait(300);
    const want = await p.evaluate(() => document.querySelector('#drawer a.mp818-qr').getAttribute('href'));
    await qrShot(await p.$('#drawer a.mp818-qr'), want, `${tag}_drawer_${k}`);
    if (id === 'ISLAND_WEST_PARK' || (phone && id === 'PITLANE')) await p.screenshot({path: path.join(SHOTS, `${tag}_drawer_${k}.png`)});
  }
  const park = await p.evaluate(() => { const b = document.querySelector('#drawer .mp818-park'); return b ? b.innerText : null; });
  await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(400);
  await p.evaluate(k => openAsset(k), 'WC02'); await wait(1200);
  const parkTxt = await p.evaluate(() => { const b = document.querySelector('#drawer .mp818-park'); return b ? b.innerText : ''; });
  ok(PLAN.park_rules.rules.every(x => parkTxt.includes(x)), `${name}: the WC02 drawer carries the parkland rules word for word`, parkTxt);
  await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(400);
  // ---------------- the Timeline load plan
  await p.evaluate(() => go('timeline')); await wait(2500);
  const P = await p.evaluate(() => { const c = document.getElementById('ep818'); if (!c) return null;
    const rows = [...c.querySelectorAll('.ep818-ld')].map(r => ({fwf: parseInt(r.querySelector('.ld-c b').textContent, 10), n: r.querySelector('.ld-n b').textContent, t: r.querySelector('.ld-t').textContent, pr: !!r.querySelector('[data-ep818-print]')}));
    const q = c.querySelector('.ep818-qt'); const nowc = [...q.querySelectorAll('td.nowc')];
    return {rows, inTimeline: !!c.closest('#pane-timeline'), rules: [...c.querySelectorAll('.ep818-box.sr ol li')].map(x => x.textContent), park: (c.querySelector('.ep818-park') || {}).textContent || '',
      demob: [...c.querySelectorAll('.ep818-box.dm li')].map(x => x.textContent), head: c.querySelector('.ep818-box.dm h4').textContent, ord: c.querySelector('.ep818-ord').textContent,
      qhead: [...q.querySelectorAll('th')].map(x => x.textContent), nowcBg: nowc.map(x => getComputedStyle(x).backgroundColor), nowcN: nowc.map(x => x.querySelector('b').textContent),
      qnote: q.querySelector('.ep818-nw').textContent, cx: [...c.querySelectorAll('.ep818-cx tbody tr')].map(r => r.cells[0].textContent), text: c.innerText, w: c.scrollWidth, cw: c.clientWidth}; });
  ok(!!P && P.inTimeline, `${name}: the Event Portables load plan card is on the Timeline`);
  if (P) {
    ok(P.rows.length === 5 && P.rows.every(r => r.fwf === 24) && P.rows.reduce((s, r) => s + r.fwf, 0) === 120, `${name}: 5 loads, 24 FWF each, 120 FWF in all`, P.rows);
    ok(P.rows.every(r => r.pr), `${name}: every load has a Print run sheet button`);
    ok(/Fri 9 Oct/.test(P.rows[0].t), `${name}: Load 1 is Fri 9 Oct`, P.rows[0].t);
    ok(JSON.stringify(P.rules) === JSON.stringify(PLAN.site_rules), `${name}: site rules word for word from the plan`, P.rules);
    ok(PLAN.park_rules.rules.every(x => P.park.includes(x)) && P.park.includes(PLAN.park_rules.area), `${name}: parkland rules with the site rules`);
    ok(P.head === 'Demob – pick-up' && JSON.stringify(P.demob) === JSON.stringify(PLAN.demob_notice.lines), `${name}: demob notice word for word`, P.demob);
    const asked = 'Coates will issue a demob plan and run sheets before pick-up. Collect only what is on the Coates run sheet. Nothing is to be picked up unless it has been emptied. If a unit has not been emptied, leave it and call the Coates lead.';
    const dm = P.demob.join(' ');
    ok(asked.split('. ').every(x => dm.includes(x.replace(/\.$/, ''))), `${name}: the demob notice carries every sentence of the brief`);
    ok(P.ord.includes('Stop order within a load is suggested') && P.ord.includes('Early is fine') && !/Andrew/.test(P.ord), `${name}: the early-delivery rule sits beside the fill-order wording`, P.ord);
    ok(P.qhead.join('|').includes('No WC allocation') && P.nowcBg.length === 6 && P.nowcBg.every(c => c === 'rgb(253, 224, 205)'), `${name}: the No WC allocation column is highlighted in Coates orange`, P.nowcBg);
    ok(JSON.stringify(P.nowcN) === JSON.stringify(['56', '0', '0', '4', '3', '63']), `${name}: No WC allocation 56 / 0 / 0 / 4 / 3, 63 in all`, P.nowcN);
    ok(P.qnote === PLAN.quote_vs_allocation.no_wc_allocation_note, `${name}: the No WC allocation note`);
    ok(JSON.stringify(P.cx) === JSON.stringify(['WC32', 'WC66', 'WC09']), `${name}: the cancelled list WC32, WC66, WC09`, P.cx);
    ok(!/\$\s?\d|SiteIQ/i.test(P.text) && !/(?<!\d)(?:\+?61\s?|0)[2-478](?:[\s-]?\d){8}(?!\d)/.test(P.text), `${name}: no money, phone numbers or SiteIQ in the card`);
    ok(P.w <= P.cw + 1, `${name}: the card does not scroll sideways`, {w: P.w, cw: P.cw});
  }
  // open Load 1 and look at it
  await p.click('[data-ep818-ld="1"]'); await wait(500);
  const st = await p.evaluate(() => { const b = document.getElementById('ep818b1'); return {shown: !b.hidden, left: [...b.querySelectorAll('tbody tr')].map(r => r.cells[4].textContent.trim()), hrefs: [...b.querySelectorAll('tbody td a')].map(a => a.getAttribute('href'))}; });
  ok(st.shown && st.left[st.left.length - 1] === '0' && st.left.length === PLAN.loads[0].stops.length, `${name}: Load 1 opens to its ${st.left.length} stops, left on truck down to 0`, st.left);
  ok(JSON.stringify(st.hrefs) === JSON.stringify(PLAN.loads[0].stops.map(s => s.directions_url)), `${name}: each stop links to driving directions to its meet point`);
  await p.evaluate(() => { document.getElementById('ep818').scrollIntoView({block: 'start'}); }); await wait(600);
  await p.screenshot({path: path.join(SHOTS, `${tag}_panel.png`)});
  await p.evaluate(() => { document.querySelector('#ep818 .ep818-qt').scrollIntoView({block: 'start'}); }); await wait(400);
  await p.screenshot({path: path.join(SHOTS, `${tag}_panel_quote.png`)});
  // the open state survives a redraw of the Timeline
  await p.evaluate(() => renderPass()); await wait(1200);
  ok(await p.evaluate(() => !document.getElementById('ep818b1').hidden), `${name}: an open load stays open through a redraw`);
  // ---------------- the run sheets: one A4 page each, every QR to its meet point
  for (const L of PLAN.loads) {
    if (phone && L.n !== 1) continue;
    const p0 = await p.evaluate(() => window.__prints818);
    await p.evaluate(n => document.querySelector(`[data-ep818-print="${n}"]`).click(), L.n); await wait(900);
    const R = await p.evaluate(() => { const w = document.getElementById('ep818print'), pg = w && w.querySelector('.rs818');
      return pg ? {over: w.__over, fit: pg.scrollHeight <= pg.clientHeight + 1, k: pg.dataset.k, stops: pg.querySelectorAll('.rs-tbl tbody tr').length, qrs: [...pg.querySelectorAll('.rs-qr')].map(x => x.dataset.ep818Url),
        left: [...pg.querySelectorAll('.rs-tbl tbody tr')].map(r => r.cells[4].textContent.trim()), bar: pg.querySelector('.rs-bar').textContent, txt: pg.innerText, prints: window.__prints818} : null; });
    ok(!!R && R.fit && !R.over.length, `${name}: Load ${L.n} run sheet fits one A4 page (scale ${R && R.k})`);
    if (!R) continue;
    ok(R.prints === p0 + 1, `${name}: Print run sheet opens the print dialog once`);
    ok(R.stops === L.stops.length && JSON.stringify(R.qrs) === JSON.stringify(L.stops.map(s => s.directions_url)) && R.left[R.left.length - 1] === '0', `${name}: Load ${L.n}: ${R.stops} stops, a QR per stop to its meet point, counts down to 0`, R.left);
    ok(R.bar === `Load ${L.n} of 5 · ${['Fri 9 Oct 2026', 'Tue 13 Oct 2026', 'Thu 15 Oct 2026', 'Mon 19 Oct 2026', 'Mon 19 Oct 2026'][L.n - 1]} · 24 FWF${L.n === 1 ? ' (+6 pee panels)' : ''}`, `${name}: Load ${L.n} header`, R.bar);
    ok(PLAN.site_rules.every(x => R.txt.includes(x)) && PLAN.demob_notice.lines.every(x => R.txt.includes(x)) && /Sign-off/.test(R.txt) && /Driver name/.test(R.txt) && R.txt.includes('Early is fine') && R.txt.includes('Author: Andrew Fisher'),
      `${name}: Load ${L.n} sheet carries the site rules, the early-delivery rule, the demob notice, sign-off and the author`);
    ok(!/\$\s?\d|SiteIQ/i.test(R.txt) && !/(?<!\d)(?:\+?61\s?|0)[2-478](?:[\s-]?\d){8}(?!\d)/.test(R.txt), `${name}: Load ${L.n} sheet has no money, phone numbers or SiteIQ`);
    if (!phone) {
      const qs = await p.$$('#ep818print .rs-qr');
      for (let i = 0; i < qs.length; i++) await qrShot(qs[i], L.stops[i].directions_url, `runsheet_L${L.n}_S${i + 1}`);
      await p.emulateMedia({media: 'print'});
      const pdf = path.join(SHOTS, `runsheet_load${L.n}.pdf`); await p.pdf({path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true});
      await p.emulateMedia({media: 'screen'});
      QR.push({pdf, load: L.n});
    }
    const sh = await p.$('#ep818print .rs818'); if (sh && (L.n === 1 || L.n === 4)) await sh.screenshot({path: path.join(SHOTS, `${tag}_runsheet_load${L.n}.png`)});
    if (phone) await p.screenshot({path: path.join(SHOTS, `${tag}_runsheet_preview.png`)});
    await p.evaluate(() => { const x = document.querySelector('#ep818print [data-ep818-x]'); if (x) x.click(); }); await wait(300); /* page.pdf fires afterprint, which already closes it */
    ok(await p.evaluate(() => !document.body.classList.contains('ep818-printing') && document.getElementById('ep818print').hidden), `${name}: Close puts the page back`);
  }
  // ---------------- the driver sheets: the meet point section, with a QR per meet point and the site rules
  for (const iso of phone ? ['2026-10-06'] : ['2026-09-28', '2026-10-06']) {
    /* the page's own print, as the Drivers button runs it from a link (the #print/drivers route waits in this rig, on live too) */
    await p.evaluate(iso => { window.__dpLast = null; dpPrint(iso, 'drv', {link: true}); }, iso); await p.waitForFunction(() => window.__dpLast, null, {timeout: 40000}).catch(() => {}); await wait(800);
    const D = await p.evaluate(() => { const pages = [...document.querySelectorAll('#dayprint .dp-page.dp-drv')];
      return {n: pages.length, last: window.__dpLast || null, sec: pages.map(pg => { const s = pg.querySelector('.mp818s'); if (!s) return null;
        return {qrs: [...s.querySelectorAll('.mp818d-q')].map(q => q.dataset.mp818Url), refs: [...pg.querySelectorAll('.dp-refg > *')].length, rules: s.querySelectorAll('.mp818d-r li:not(.mp818d-park)').length, park: !!s.querySelector('.mp818d-park'), txt: s.innerText}; })}; });
    ok(D.n > 0 && D.sec.every(Boolean), `${name}: ${iso}: every driver sheet (${D.n}) has the Meet point · site rules section`);
    ok(D.sec.every(x => x && x.qrs.length >= 1 && x.rules === 3 && x.park), `${name}: ${iso}: each has a QR per meet point, the three site rules beyond the hours and the parkland rules`, D.sec.map(x => x && [x.qrs.length, x.rules, x.park]));
    ok(D.last && !(D.last.over || []).length, `${name}: ${iso}: no driver sheet runs past one page`, D.last && D.last.over);
    const want = await p.evaluate(() => [...document.querySelectorAll('#dayprint .dp-page.dp-drv')].map(pg => [...pg.querySelectorAll('.dp-tbl .dp-rk, .dp-refg b')].map(x => x.textContent.trim()).filter(Boolean)));
    const truth = await p.evaluate(() => [...document.querySelectorAll('#dayprint .dp-page.dp-drv')].map(pg => [...pg.querySelectorAll('.mp818d')].map(c => c.querySelector('.mp818d-q').dataset.mp818Url)));
    const expect = await p.evaluate(iso => { const d = programmeDays().find(x => x.iso === iso); return dpLoads(d).map(g => [...new Set(g.rows.map(r => navUrl({lat: meetPoint818(r.a).p.ll[0], lon: meetPoint818(r.a).p.ll[1]})))]); }, iso);
    ok(JSON.stringify(truth) === JSON.stringify(expect), `${name}: ${iso}: each sheet's meet point QRs are its loads' meet points, in order`);
    if (!phone) { const qs = await p.$$('#dayprint .dp-page .mp818d-q'); for (let i = 0; i < Math.min(qs.length, 8); i++) await qrShot(qs[i], await qs[i].evaluate(e => e.dataset.mp818Url), `drv_${iso}_${i + 1}`); }
    const pg = await p.$('#dayprint .dp-page.dp-drv'); if (pg && iso === '2026-10-06') { await pg.screenshot({path: path.join(SHOTS, `${tag}_driver_sheet_${iso}.png`)}); }
    await p.evaluate(() => { try { dpBarClose(); } catch (e) {} }); await wait(800);
  }
  ok(s.errors.length === 0, `${name}: no page errors`, s.errors);
  ok(cons.length === 0, `${name}: no console errors`, cons);
  ok(s.counts.blocked === 0, `${name}: no write was attempted`, s.counts);
  await s.browser.close();
}
(async () => {
  await run('desktop 1440', {W: 1440, H: 900});
  await run('phone 390', {W: 390, H: 844, dpr: 2, mobile: true});
  fs.writeFileSync(path.join(SHOTS, 'qr818.json'), JSON.stringify(QR, null, 1));
  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
