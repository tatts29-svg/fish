// v8.19 - meet points, site rules and the Event Portables load plan: checks. Author: Andrew Fisher.
// Read only: open_page.js serves the build at the live address and aborts every write; window.print is replaced by a
// counter so no dialog opens. Nothing here edits the record.
//   cd 03_GC500_Delivery_Control && CHROMIUM_PATH=/opt/pw-browsers/chromium SHOTS=<dir> node v8.19_meet_points_ep_plan_DRAFT/evidence/v819_tests.js
// Writes <SHOTS>/qr819.json (every QR element screenshot with the URL it must decode to) for qr_decode819.py.
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE || path.join(ROOT, 'build/GC500_v8.19/GC500_Delivery_Control_hosted.html');
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, {recursive: true});
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'meet_points_03Oct2026/event_portables_plan.json'), 'utf8'));
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0, passes = 0; const ok = (c, what, d = '') => { if (c) passes++; else fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d !== '' && d != null ? '  - ' + (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 500) : '')); };
const QR = []; let qn = 0, CURP = null;
/* the very SVG the page drew, copied whole into a 480 px box so one module is several pixels (a 1x screen capture of a
   92 px code is about 1.5 px a module, below what a decoder reads) */
async function qrShot(el, want, tag) {
  const f = path.join(SHOTS, `qr_${String(++qn).padStart(3, '0')}_${tag.replace(/[^\w-]+/g, '_')}.png`);
  const pg = await el.evaluate(e => { const svg = e.tagName.toLowerCase() === 'svg' ? e : e.querySelector('svg'); const d = document.createElement('div'); d.id = 'qr819shot';
    d.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:480px;background:#fff;z-index:2147483647;padding:0;margin:0'; d.innerHTML = svg ? svg.outerHTML : '';
    const s = d.querySelector('svg'); if (s) { s.setAttribute('width', '480'); s.setAttribute('height', '480'); s.style.cssText = 'display:block;width:480px;height:480px'; } document.body.appendChild(d); return !!svg; });
  const box = await CURP.$('#qr819shot'); await box.screenshot({path: f}); await box.evaluate(e => e.remove());
  QR.push({file: f, want, tag, svg: pg});
}
async function ready(p) {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length && typeof meetPoint819 === 'function', null, {timeout: 240000});
  await wait(2500);
  await p.evaluate(() => { window.__prints819 = 0; window.print = () => { window.__prints819++; }; });
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
  ok(rel.meta === 'v8.19' && /v8\.19$/.test(rel.foot), `${name}: the release marker and the footer read v8.19`, rel);
  // ---------------- the drawer: every reference carries its meet point; one sample per point is screenshot and its QR decoded
  const keys = await p.evaluate(() => allAssets().map(a => a.key));
  const per = {}, bad = [];
  const list = phone ? null : keys;
  const sample = {};
  for (const k of (list || [])) {
    await p.evaluate(k => openAsset(k), k); await wait(260);
    const r = await p.evaluate(k => { const a = allAssets().find(x => x.key === k), m = meetPoint819(a), b = document.querySelector('#drawer .where816 .mp819');
      return {id: m.p.id, name: m.p.name, ll: m.p.ll, box: b ? b.dataset.mp819 : null, txt: b ? b.querySelector('.mp819-n').textContent : '', href: b ? b.querySelector('a.mp819-qr').getAttribute('href') : '', park: !!(b && b.querySelector('.mp819-park')), svg: !!(b && b.querySelector('a.mp819-qr svg'))}; }, k);
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
    const el = await p.$('#drawer .mp819'); ok(!!el, `${name}: ${k} drawer shows its meet point box (${id})`);
    if (!el) continue;
    await el.scrollIntoViewIfNeeded(); await wait(300);
    const want = await p.evaluate(() => document.querySelector('#drawer a.mp819-qr').getAttribute('href'));
    await qrShot(await p.$('#drawer a.mp819-qr'), want, `${tag}_drawer_${k}`);
    if (id === 'ISLAND_WEST_PARK' || (phone && id === 'PITLANE')) await p.screenshot({path: path.join(SHOTS, `${tag}_drawer_${k}.png`)});
  }
  /* the reviewer's cases: pinned / confirmed gear gets the area and nearest rules too; pit garages say so */
  const X = await p.evaluate(() => Object.fromEntries(['T0022', 'T0023', 'P47', 'PG01'].map(k => { const a = allAssets().find(x => x.key === k); if (!a) return [k, null]; const r = meetPoint819(a); let D = null; try { D = dest782(a); } catch (e) {} return [k, {id: r.p.id, how: r.how, kind: D && D.kind, why: mpWhy819(r, k)}]; })));
  ok(X.T0022 && X.T0022.id === 'ISLAND_WEST_PARK' && X.T0023 && X.T0023.id === 'ISLAND_WEST_PARK', `${name}: T0022 and T0023 get the island west parkland point`, X);
  ok(X.P47 && X.P47.id === 'COMMODORE', `${name}: P47 gets Commodore Park`, X.P47);
  ok(X.PG01 && X.PG01.id === 'PITLANE' && X.PG01.why === 'Pit lane entry – pit garages', `${name}: pit garages: "Pit lane entry – pit garages"`, X.PG01);
  for (const k of ['T0022', 'T0023']) { await p.evaluate(k => openAsset(k), k); await wait(1000); const pk = await p.evaluate(() => !!document.querySelector('#drawer .mp819-park')); ok(pk, `${name}: the ${k} drawer carries the parkland safety box`); }
  await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(400);
  const park = await p.evaluate(() => { const b = document.querySelector('#drawer .mp819-park'); return b ? b.innerText : null; });
  await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(400);
  await p.evaluate(k => openAsset(k), 'WC02'); await wait(1200);
  const parkTxt = await p.evaluate(() => { const b = document.querySelector('#drawer .mp819-park'); return b ? b.innerText : ''; });
  ok(PLAN.park_rules.rules.every(x => parkTxt.includes(x)), `${name}: the WC02 drawer carries the parkland rules word for word`, parkTxt);
  await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(400);
  // ---------------- the Timeline load plan
  await p.evaluate(() => go('timeline')); await wait(2500);
  const P = await p.evaluate(() => { const c = document.getElementById('ep819'); if (!c) return null;
    const rows = [...c.querySelectorAll('.ep819-ld')].map(r => ({fwf: parseInt(r.querySelector('.ld-c b').textContent, 10), n: r.querySelector('.ld-n b').textContent, t: r.querySelector('.ld-t').textContent, pr: !!r.querySelector('[data-ep819-print]')}));
    const q = c.querySelector('.ep819-qt'); const nowc = [...q.querySelectorAll('td.nowc')];
    return {rows, inTimeline: !!c.closest('#pane-timeline'), rules: [...c.querySelectorAll('.ep819-box.sr ol li')].map(x => x.textContent), park: (c.querySelector('.ep819-park') || {}).textContent || '',
      demob: [...c.querySelectorAll('.ep819-box.dm li')].map(x => x.textContent), head: c.querySelector('.ep819-box.dm h4').textContent, ord: c.querySelector('.ep819-ord').textContent,
      qhead: [...q.querySelectorAll('th')].map(x => x.textContent), nowcBg: nowc.map(x => getComputedStyle(x).backgroundColor), nowcN: nowc.map(x => x.querySelector('b').textContent),
      qnote: q.querySelector('.ep819-nw').textContent, tot: !!q.querySelector('tr.tot'), rec: [...c.querySelectorAll('.ep819-rec')].map(x => x.textContent), cxh: [...c.querySelectorAll('.ep819-cx th')].map(x => x.textContent), cx: [...c.querySelectorAll('.ep819-cx tbody tr')].map(r => r.cells[0].textContent), text: c.innerText, w: c.scrollWidth, cw: c.clientWidth}; });
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
    ok(P.qhead.join('|').includes('No WC allocation') && P.nowcBg.length === 5 && P.nowcBg.every(c => c === 'rgb(253, 224, 205)'), `${name}: the No WC allocation column is highlighted in Coates orange`, P.nowcBg);
    ok(JSON.stringify(P.nowcN) === JSON.stringify(['56', '0', '0', '4', '3']) && !P.tot, `${name}: No WC allocation 56 / 0 / 0 / 4 / 3, and no total row adding unlike items`, P.nowcN);
    ok(P.qnote === PLAN.quote_vs_allocation.no_wc_allocation_note, `${name}: the No WC allocation note`);
    ok(JSON.stringify(P.cx) === JSON.stringify(['WC32', 'WC66', 'WC09']), `${name}: the cancelled list WC32, WC66, WC09`, P.cx);
    ok(!/\$\s?\d|SiteIQ/i.test(P.text) && !/(?<!\d)(?:\+?61\s?|0)[2-478](?:[\s-]?\d){8}(?!\d)/.test(P.text), `${name}: no money, phone numbers or SiteIQ in the card`);
    ok(!/\b(Codex|Claude)\b/i.test(P.text) && P.cxh[3] === 'Source', `${name}: no agent named on the card; the cancelled list's last column is Source`, P.cxh);
    /* the record-date lines, against the record worked out here independently: every plan reference whose record
       delivery days do not include its load's day is named, under the right wording, and no other */
    const RL = await p.evaluate(() => { const days = new Map(); programmeDays().forEach(d => (dpLoads(d) || []).forEach(g => { if (g.kind === 'removals') return; (g.rows || []).forEach(r => { const k = r.a && r.a.key; if (k) days.set(k, (days.get(k) || []).concat(d.iso)); }); }));
      const dw = iso => { const [y, m, dd] = iso.split('-').map(Number), d = new Date(Date.UTC(y, m - 1, dd)); return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()] + ' ' + dd + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]; };
      return EP819.loads.map((l, i) => { const shown = (document.querySelectorAll('#ep819 .ep819-ld')[i].querySelector('.ep819-rec') || {}).textContent || '';
        const off = []; l.stops.forEach(s => s.drops.forEach(x => { const ds = x.ref && days.get(x.ref); if (ds && ds.length && !ds.includes(l.date)) off.push({ref: x.ref, days: [...new Set(ds)].sort()}); }));
        const moved = off.filter(o => l.date === '2026-10-09' && o.days.every(d => d >= '2026-10-05' && d <= '2026-10-08'));
        return {n: l.n, shown, off, good: off.every(o => shown.includes(o.ref) && o.days.every(d => shown.includes(dw(d)))) && (off.length ? true : shown === '')
          && moved.every(o => /Record still shows .* – moving to Fri 9 Oct per Coates/.test(shown)) && (!/per Coates/.test(shown) || l.date === '2026-10-09')
          && (shown.match(/WC\d+|T\d{4}/g) || []).every(r => off.some(o => o.ref === r))}; }); });
    ok(RL.every(x => x.good), `${name}: each load names exactly the references the record has on another day (moves per Coates only for next week onto Fri 9 Oct)`, RL.map(x => [x.n, x.shown, x.off.map(o => o.ref + '@' + o.days.join('/'))]));
    ok(P.w <= P.cw + 1, `${name}: the card does not scroll sideways`, {w: P.w, cw: P.cw});
  }
  // open Load 1 and look at it
  await p.click('[data-ep819-ld="1"]'); await wait(500);
  const st = await p.evaluate(() => { const b = document.getElementById('ep819b1'); return {shown: !b.hidden, left: [...b.querySelectorAll('tbody tr')].map(r => r.cells[4].textContent.trim()), hrefs: [...b.querySelectorAll('tbody td a')].map(a => a.getAttribute('href'))}; });
  ok(st.shown && st.left[st.left.length - 1] === '0' && st.left.length === PLAN.loads[0].stops.length, `${name}: Load 1 opens to its ${st.left.length} stops, left on truck down to 0`, st.left);
  ok(JSON.stringify(st.hrefs) === JSON.stringify(PLAN.loads[0].stops.map(s => s.directions_url)), `${name}: each stop links to driving directions to its meet point`);
  await p.evaluate(() => { document.getElementById('ep819').scrollIntoView({block: 'start'}); }); await wait(600);
  await p.screenshot({path: path.join(SHOTS, `${tag}_panel.png`)});
  await p.evaluate(() => { document.querySelector('#ep819 .ep819-qt').scrollIntoView({block: 'start'}); }); await wait(400);
  await p.screenshot({path: path.join(SHOTS, `${tag}_panel_quote.png`)});
  // the open state survives a redraw of the Timeline
  await p.evaluate(() => renderPass()); await wait(1200);
  ok(await p.evaluate(() => !document.getElementById('ep819b1').hidden), `${name}: an open load stays open through a redraw`);
  // ---------------- the run sheets: one A4 page each, every QR to its meet point
  for (const L of PLAN.loads) {
    if (phone && L.n !== 1) continue;
    const p0 = await p.evaluate(() => window.__prints819);
    await p.evaluate(n => document.querySelector(`[data-ep819-print="${n}"]`).click(), L.n); await wait(900);
    const R = await p.evaluate(() => { const w = document.getElementById('ep819print'), pg = w && w.querySelector('.rs819');
      return pg ? {over: w.__over, fit: pg.scrollHeight <= pg.clientHeight + 1, k: pg.dataset.k, stops: pg.querySelectorAll('.rs-tbl tbody tr').length, qrs: [...pg.querySelectorAll('.rs-qr')].map(x => x.dataset.ep819Url),
        left: [...pg.querySelectorAll('.rs-tbl tbody tr')].map(r => r.cells[4].textContent.trim()), bar: pg.querySelector('.rs-bar').textContent, txt: pg.innerText, prints: window.__prints819} : null; });
    ok(!!R && R.fit && !R.over.length, `${name}: Load ${L.n} run sheet fits one A4 page (scale ${R && R.k})`);
    if (!R) continue;
    ok(R.prints === p0 + 1, `${name}: Print run sheet opens the print dialog once`);
    ok(R.stops === L.stops.length && JSON.stringify(R.qrs) === JSON.stringify(L.stops.map(s => s.directions_url)) && R.left[R.left.length - 1] === '0', `${name}: Load ${L.n}: ${R.stops} stops, a QR per stop to its meet point, counts down to 0`, R.left);
    ok(R.bar === `Load ${L.n} of 5 · ${['Fri 9 Oct 2026', 'Tue 13 Oct 2026', 'Thu 15 Oct 2026', 'Mon 19 Oct 2026', 'Mon 19 Oct 2026'][L.n - 1]} · 24 FWF${L.n === 1 ? ' (+6 pee panels)' : ''}`, `${name}: Load ${L.n} header`, R.bar);
    ok(PLAN.site_rules.every(x => R.txt.includes(x)) && PLAN.demob_notice.lines.every(x => R.txt.includes(x)) && /Sign-off/.test(R.txt) && /Driver name/.test(R.txt) && R.txt.includes('Early is fine') && R.txt.includes('Author: Andrew Fisher'),
      `${name}: Load ${L.n} sheet carries the site rules, the early-delivery rule, the demob notice, sign-off and the author`);
    { const want = await p.evaluate(n => epRecLine819(EP819.loads.find(x => x.n === n)), L.n);
      ok(R.txt.includes('Event Portables delivery plan (to quote Q6845)') && (!want || R.txt.includes(want)), `${name}: Load ${L.n} run sheet carries the plan label${want ? ' and its record line' : ''}`, want); }
    { const PD = PLAN.pre_departure_check; const so = await p.evaluate(() => { const s = document.querySelector('#ep819print .rs-so'), pd = s && s.querySelector('.rs-pd'), tb = s && s.querySelector('table');
        return {txt: pd ? pd.innerText : '', box: !!(pd && pd.querySelector('.rs-bx')), above: !!(pd && tb && (pd.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING))}; });
      ok(!!PD && so.txt.includes(PD.text) && so.txt.includes(PD.source) && so.box && so.above, `${name}: Load ${L.n} sheet has the pre-departure check as a tick box in the sign-off, above the signatures, with its source`, so); }
    ok(!/\$\s?\d|SiteIQ/i.test(R.txt) && !/(?<!\d)(?:\+?61\s?|0)[2-478](?:[\s-]?\d){8}(?!\d)/.test(R.txt), `${name}: Load ${L.n} sheet has no money, phone numbers or SiteIQ`);
    if (!phone) {
      const qs = await p.$$('#ep819print .rs-qr');
      for (let i = 0; i < qs.length; i++) await qrShot(qs[i], L.stops[i].directions_url, `runsheet_L${L.n}_S${i + 1}`);
      await p.emulateMedia({media: 'print'});
      const pdf = path.join(SHOTS, `runsheet_load${L.n}.pdf`); await p.pdf({path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true});
      await p.emulateMedia({media: 'screen'});
      QR.push({pdf, load: L.n});
    }
    const sh = await p.$('#ep819print .rs819'); if (sh && (L.n === 1 || L.n === 4)) await sh.screenshot({path: path.join(SHOTS, `${tag}_runsheet_load${L.n}.png`)});
    if (phone) await p.screenshot({path: path.join(SHOTS, `${tag}_runsheet_preview.png`)});
    await p.evaluate(() => { const x = document.querySelector('#ep819print [data-ep819-x]'); if (x) x.click(); }); await wait(300); /* page.pdf fires afterprint, which already closes it */
    ok(await p.evaluate(() => !document.body.classList.contains('ep819-printing') && document.getElementById('ep819print').hidden), `${name}: Close puts the page back`);
  }
  // ---------------- review 1: a print still waiting to start is cancelled by Close and by Escape (the app is never printed)
  for (const how of ['Close', 'Escape']) {
    const r = await p.evaluate(async how => { const p0 = window.__prints819; ep819Print(1);
      const open = document.body.classList.contains('ep819-printing');
      if (how === 'Close') document.querySelector('#ep819print [data-ep819-x]').click(); else document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
      await new Promise(r => setTimeout(r, 400));
      return {open, prints: window.__prints819 - p0, closed: !document.body.classList.contains('ep819-printing'), timer: EPP819.timer, after: !!EPP819.after}; }, how);
    ok(r.open && r.closed && r.prints === 0 && !r.timer && !r.after, `${name}: ${how} before the print starts cancels it - nothing is printed afterwards`, r);
  }
  // ---------------- review 2: the print view as a modal, by keyboard - focus in, Tab / Shift-Tab kept inside, Escape back to the button
  {
    await p.evaluate(() => { const b = document.querySelector('[data-ep819-print="1"]'); b.scrollIntoView({block: 'center'}); b.focus(); });
    await p.keyboard.press('Enter'); await wait(500);
    const f0 = await p.evaluate(() => { const a = document.activeElement; return {inside: !!a.closest('#ep819print'), go: a.hasAttribute('data-ep819-go'), role: document.getElementById('ep819print').getAttribute('role'), modal: document.getElementById('ep819print').getAttribute('aria-modal')}; });
    ok(f0.inside && f0.go && f0.role === 'dialog' && f0.modal === 'true', `${name}: keyboard - opening the run sheet puts focus inside it (on Print / Save as PDF)`, f0);
    const seq = [];
    for (const k of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) { await p.keyboard.press(k); seq.push(await p.evaluate(() => { const a = document.activeElement; return a.closest('#ep819print') ? (a.hasAttribute('data-ep819-go') ? 'go' : a.hasAttribute('data-ep819-x') ? 'x' : 'other') : 'OUTSIDE'; })); }
    ok(JSON.stringify(seq) === JSON.stringify(['x', 'go', 'x', 'go', 'x', 'go']), `${name}: keyboard - Tab and Shift-Tab stay inside the run sheet and wrap`, seq);
    await p.keyboard.press('Escape'); await wait(300);
    const f1 = await p.evaluate(() => ({closed: !document.body.classList.contains('ep819-printing'), back: document.activeElement === document.querySelector('[data-ep819-print="1"]')}));
    ok(f1.closed && f1.back, `${name}: keyboard - Escape closes it and focus goes back to Load 1's Print run sheet button`, f1);
  }
  // ---------------- the source boundary: the plan is labelled as the supplier plan, and stays out of the native day data
  {
    const B = await p.evaluate(() => { const c = document.getElementById('ep819'); ep819Print(2, {hold: true}); const hd = document.querySelector('#ep819print .rs-hd').innerText, bar = document.querySelector('#ep819print .ep819-pbar span').textContent; ep819Close();
      const days = JSON.stringify(programmeDays().map(d => { try { return dpLoads(d).map(g => (g.rows || []).map(r => r.a && r.a.key)); } catch (e) { return String(e); } }));
      return {h3: c.querySelector('h3').textContent, hd, bar, dataLd: c.querySelectorAll('[data-ld], [data-ldsec]').length, inDay: !!c.closest('.day, .dayblock, [data-day]'), epInDays: /EP819|ep819|Load run sheet/.test(days), data: typeof DATA !== 'undefined' && Object.keys(DATA).some(k => /ep819|event_portables/i.test(k))}; });
    const L = 'Event Portables delivery plan (to quote Q6845)';
    ok(B.h3 === L && B.hd.includes(L) && B.bar.includes(L), `${name}: the card, the run sheet and its preview bar are labelled "${L}"`, B);
    ok(B.dataLd === 0 && !B.inDay && !B.epInDays && !B.data, `${name}: plan loads are not in the Timeline's day lists, programmeDays()/dpLoads() or DATA (the plan lives only in EP819)`, B);
  }
  // ---------------- the driver sheets: the meet point section, with a QR per meet point and the site rules
  for (const iso of phone ? ['2026-10-06'] : ['2026-09-28', '2026-10-06']) {
    /* the page's own print, as the Drivers button runs it from a link (the #print/drivers route waits in this rig, on live too) */
    await p.evaluate(iso => { window.__dpLast = null; dpPrint(iso, 'drv', {link: true}); }, iso); await p.waitForFunction(() => window.__dpLast, null, {timeout: 40000}).catch(() => {}); await wait(800);
    const D = await p.evaluate(() => { const pages = [...document.querySelectorAll('#dayprint .dp-page.dp-drv')];
      return {n: pages.length, last: window.__dpLast || null, sec: pages.map(pg => { const mp = [...pg.querySelectorAll('[data-mp819]')], rl = pg.querySelector('.dp-rline');
        return {mps: mp.length, qrs: pg.querySelectorAll('.mp819d-q').length, rows: pg.querySelectorAll('.dp-wtbl tbody tr').length || 1, inWhere: mp.every(x => x.closest('.dp-pos-t, .dp-wtbl')),
          rl: rl ? rl.textContent : '', park: !!pg.querySelector('.mp819l-park'), parkMp: mp.some(x => x.dataset.mp819 === 'ISLAND_WEST_PARK'), band: !!pg.querySelector('.mp819s, .mp819d-band')}; })}; });
    ok(D.n > 0 && D.sec.every(x => x.mps === x.rows && x.qrs === x.rows && x.inWhere && !x.band), `${name}: ${iso}: every driver sheet (${D.n}) shows each reference's meet point and its QR inside Where it goes, with no extra band`, D.sec.map(x => [x.mps, x.qrs, x.rows, x.inWhere]));
    ok(D.sec.every(x => x.rl.includes('Go to the meet point – Coates meets you') && x.rl.includes('If unsure, go to the pit lane entry') && x.rl.includes('Site hours') && x.park === x.parkMp), `${name}: ${iso}: the site rules are on the sheet's own rules line, with the parkland rules only where the load goes to the parkland`, D.sec.map(x => x.rl.slice(-80)));
    ok(D.last && !(D.last.over || []).length, `${name}: ${iso}: no driver sheet runs past one page`, D.last && D.last.over);
    const truth = await p.evaluate(() => [...document.querySelectorAll('#dayprint .dp-page.dp-drv')].map(pg => [...pg.querySelectorAll('.mp819d-q')].map(q => q.dataset.mp819Url)));
    const expect = await p.evaluate(iso => { const d = programmeDays().find(x => x.iso === iso); return dpLoads(d).map(g => g.rows.map(r => navUrl({lat: meetPoint819(r.a).p.ll[0], lon: meetPoint819(r.a).p.ll[1]}))); }, iso);
    ok(JSON.stringify(truth) === JSON.stringify(expect), `${name}: ${iso}: each sheet's meet point QRs are its references' meet points, in order`);
    if (!phone) { const qs = await p.$$('#dayprint .dp-page .mp819d-q'); for (let i = 0; i < Math.min(qs.length, 8); i++) await qrShot(qs[i], await qs[i].evaluate(e => e.dataset.mp819Url), `drv_${iso}_${i + 1}`); }
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
  fs.writeFileSync(path.join(SHOTS, 'qr819.json'), JSON.stringify(QR, null, 1));
  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
