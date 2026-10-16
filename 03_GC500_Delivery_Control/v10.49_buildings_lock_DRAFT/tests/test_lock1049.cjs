// v10.49 buildings lock. GET-only: the harness lets no write reach the service; edit rights are simulated in the page.
//   node test_lock1049.cjs path/to/page.html [shot.png]
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2], shot = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
async function load(mob){ const h = await open(Object.assign({pageFile: page, hash: '#costs'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {}));
 const errs = []; h.page.on('pageerror', e => errs.push(e.message)); h.errs = errs;
 await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await h.page.waitForTimeout(4000); return h; }
(async () => {
 let h = await load();
 try {
  const r = await h.page.evaluate(() => {
   const out = {}; out.foot = document.getElementById('footL').textContent;
   const c0 = document.querySelector('#pane-costs #lock1049'); out.card0 = c0 && c0.dataset.lock1049; out.card0txt = c0 && c0.innerText;
   const s = snap1049(); out.n = s.n; out.total = s.total;
   // simulate edit rights inside the page only (the harness refuses every write to the service)
   capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher';
   const L = () => S.labour || {}, k = labourKey('P05', 'Portable buildings', 'Building 6m', 'demob');
   out.lock = lock1049(); const st = state1049(); out.locked = !!(st && st.locked); out.lockedTotal = st && st.total; out.lockedBy = st && st.by;
   renderCosts(); const c1 = document.querySelector('#pane-costs #lock1049'); out.card1 = c1 && c1.dataset.lock1049; out.card1txt = c1 && c1.innerText;
   const had = !!L()[k]; out.refused = setLabour('P05', 'Portable buildings', 'Building 6m', 'demob', false) === false && !!L()[k] === had;
   out.doneRefused = setDone('P05', false) === false && deliveryOf('P05').done === true;
   const tk = labourKey('WC02', 'Toilets & amenities', 'FWF', 'cleaning'), tHad = !!L()[tk]; out.toiletAllowed = setLabour('WC02', 'Toilets & amenities', 'FWF', 'cleaning', !tHad) !== false && !!L()[tk] !== tHad; setLabour('WC02', 'Toilets & amenities', 'FWF', 'cleaning', tHad);
   // a change that slips past (made directly in the record) shows as drift
   delete S.labour[k]; RENDER_MEMO.clear(); const d = drift1049(state1049(), snap1049()); out.drift = d.map(x => x.ref + ' ' + x.what + ' ' + x.d);
   renderCosts(); const c2 = document.querySelector('#pane-costs #lock1049'); out.card2txt = c2 && c2.innerText; S.labour[k] = true; RENDER_MEMO.clear();
   window.confirm = () => true; out.unlock = unlock1049(); const st2 = state1049(); out.unlocked = !!(st2 && !st2.locked && st2.unlocked_by === 'Andrew Fisher');
   out.afterUnlock = setLabour('P05', 'Portable buildings', 'Building 6m', 'demob', true) !== false;
   renderCosts(); const c3 = document.querySelector('#pane-costs #lock1049'); out.card3 = c3 && c3.dataset.lock1049; out.card3txt = c3 && c3.innerText;
   const ns = nightService1040(assetOf('WC86')); out.wc86 = ns && ns.lines.map(l => l.kind + ' ' + l.units + ' ' + l.total);
   const ns01 = nightService1040(assetOf('WC01')); out.wc01 = ns01 && ns01.lines.map(l => l.kind + ' ' + l.units + ' ' + l.total);
   out.svc = (servicing748().card_lines || []).map(l => l.card_line + ' ' + l.units1040 + ' ' + l.amount);
   out.noAgent = !/Codex|Claude/.test(document.getElementById('pane-costs').innerText.slice(0, 3000));
   return out; });
  console.log(JSON.stringify({card0txt: r.card0txt, card1txt: r.card1txt, card2txt: r.card2txt, card3txt: r.card3txt, drift: r.drift, wc86: r.wc86, wc01: r.wc01, svc: r.svc}, null, 1));
  ok(/v10\.(49|50)$/.test(r.foot), 'footer v10.49 or v10.50 (built together)');
  ok(r.card0 === 'open' && /Buildings · not locked/.test(r.card0txt), 'Costs shows the Buildings card, not locked');
  const exp = /v10\.50$/.test(r.foot) ? 149017.32 : 147017.32; /* v10.50 adds the containers' contract transport, $2,000 */
  ok(r.n === 52 && Math.abs(r.total - exp) < 0.005, 'snapshot: 52 buildings, ' + exp + ' (the verified breakdown' + (exp > 147017.32 ? ' + containers on the contract' : '') + ') — got ' + r.n + ' ' + r.total);
  ok(r.lock === true && r.locked && Math.abs(r.lockedTotal - r.total) < 0.005 && r.lockedBy === 'Andrew Fisher', 'Lock stores the snapshot with the person');
  ok(r.card1 === 'locked' && /No change since the lock/.test(r.card1txt), 'locked card: no change since the lock');
  ok(r.refused, 'while locked a building tick cannot be changed');
  ok(r.doneRefused, 'while locked a building complete cannot be changed');
  ok(r.toiletAllowed, 'toilets are not locked');
  ok(r.drift.length === 1 && /P05 Demob taken off -145.74/.test(r.drift[0]), 'a change past the lock shows as drift: ' + r.drift.join('; '));
  ok(/1 change since the lock/.test(r.card2txt || ''), 'the card says 1 change since the lock');
  ok(r.unlock === true && r.unlocked, 'Unlock records the person');
  ok(r.afterUnlock, 'after unlock a building tick can change again');
  ok(r.card3 === 'open' && /last locked .* unlocked/.test(r.card3txt), 'unlocked card shows the last lock and unlock');
  ok(r.wc86 && r.wc86.length === 1 && /^fwf 1 218\.61$/.test(r.wc86[0]), 'WC86 accessible toilet: FWF servicing 1 × $72.87 × 3 = $218.61');
  ok(r.wc01 && r.wc01.some(x => /^fwf /.test(x)), 'WC01 includes its accessible toilet in FWF servicing: ' + r.wc01);
  ok(r.noAgent, 'no agent name on Costs');
  ok(h.errs.length === 0, 'no page errors ' + h.errs.join(' | '));
 } finally { await h.browser.close(); }
 h = await load(true);
 try {
  const m = await h.page.evaluate(() => { const c = document.querySelector('#lock1049'); if (c) c.scrollIntoView(); return {has: !!c, over: document.documentElement.scrollWidth > window.innerWidth + 1, btnHidden: !!c && getComputedStyle(c.querySelector('.lock1049-btn')).display === 'none'}; });
  ok(m.has && !m.over, 'phone: card shows, no sideways scroll');
  ok(m.btnHidden, 'view link: the Lock button is hidden');
  if (shot) await h.page.screenshot({path: shot});
 } finally { await h.browser.close(); }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
