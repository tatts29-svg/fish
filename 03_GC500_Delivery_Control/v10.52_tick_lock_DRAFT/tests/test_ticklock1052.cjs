// Author: Andrew Fisher. v10.52 tick lock. GET-only: the harness lets no write reach the service; edit rights are
// simulated inside the page, so every change below happens in this browser's memory only.
//   node test_ticklock1052.cjs path/to/page.html [shotdir]
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2], shots = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
async function load(mob){ const h = await open(Object.assign({pageFile: page, hash: '#costs'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {}));
 await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await h.page.waitForTimeout(4000); return h; }
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop'; const h = await load(mob);
  try {
   const r = await h.page.evaluate(() => {
    const out = {}; out.foot = document.getElementById('footL').textContent;
    const c0 = document.querySelector('#pane-costs #lock1049'); out.card0txt = c0 && c0.innerText;
    capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher'; window.confirm = () => true; document.body.classList.remove('viewonly');
    const L = () => S.labour || {}, money = () => { RENDER_MEMO.clear(); const m = moneySummary(); return m; };
    const pk = labourKey('P05', 'Portable buildings', 'Building 6m', 'demob'), tk = labourKey('WC02', 'Toilets & amenities', 'FWF', 'cleaning');
    out.p05had = !!L()[pk]; out.wc02had = !!L()[tk];
    const m0 = money(); out.mKeys = Object.keys(m0 || {}).slice(0, 30);
    out.lock = lock1049(); const st = state1049(); out.v = st && st.v; out.held = st && st.held && st.held.length; out.heldHasWC02 = !!(st && st.held && st.held.includes('WC02'));
    out.notOnSite = allAssets().map(a => a.key).find(k => !st.held.includes(k) && !assetOf(k)._cancelled && (deliveryOf(k) || {}).state !== 'on site');
    renderCosts(); const c1 = document.querySelector('#pane-costs #lock1049'); out.card1txt = c1 && c1.innerText;
    out.bRefused = setLabour('P05', 'Portable buildings', 'Building 6m', 'demob', !out.p05had) === false && !!L()[pk] === out.p05had;
    out.tRefused = setLabour('WC02', 'Toilets & amenities', 'FWF', 'cleaning', !out.wc02had) === false && !!L()[tk] === out.wc02had;
    out.doneRefused = setDone('P05', false) === false && deliveryOf('P05').done === true;
    out.lightRefused = setLight('WC02', 'in transit') === false && deliveryOf('WC02').state === 'on site';
    out.allRefused = setLabourAll('Toilets & amenities', 'FWF', 'cleaning', false) === false;
    const rows05 = loading872Rows(assetOf('P05')); const id05 = rows05[0] && rows05[0].id; const side05 = id05 && loading872Side(assetOf('P05'), id05);
    out.doorRefused = !!side05 && loading872Set('P05', id05, side05 === 'driver' ? 'passenger' : 'driver') === false && loading872Side(assetOf('P05'), id05) === side05;
    const rows09 = loading872Rows(assetOf('P09')); const id09 = rows09[0] && rows09[0].id; out.p09side0 = id09 && loading872Side(assetOf('P09'), id09);
    out.doorFill = !out.p09side0 && loading872Set('P09', id09, 'passenger') !== false && loading872Side(assetOf('P09'), id09) === 'passenger';
    out.p65 = loading872Side(assetOf('P65'), (loading872Rows(assetOf('P65'))[0] || {}).id); out.p66 = loading872Side(assetOf('P66'), (loading872Rows(assetOf('P66'))[0] || {}).id);
    // drawer chip while locked
    openAsset('P05'); return out; });
   await h.page.waitForTimeout(1800);
   const d1 = await h.page.evaluate(() => { const ch = document.querySelector('#drawer .cmp816 .lock1052'); return {txt: ch && ch.innerText, locked: !!document.querySelector('#drawer .cmp816.locked1052')}; });
   if (shots && mob) { await h.page.evaluate(() => document.querySelector('#drawer .cmp816').scrollIntoView()); await h.page.waitForTimeout(400); await h.page.screenshot({path: shots + '/p05_locked_phone.png'}); }
   const r2 = await h.page.evaluate(async () => {
    const out = {}; const L = () => S.labour || {}; const money = () => { RENDER_MEMO.clear(); return moneySummary(); };
    const pk = labourKey('P05', 'Portable buildings', 'Building 6m', 'demob');
    const at = () => { RENDER_MEMO.clear(); return assetTotal(assetOf('P05')).labour; };
    const st0 = sym1033State('P05').demob; const m0 = money().charge.labour, a0 = at(), b0 = snap1049().refs.P05.t;
    sym1033Toggle('P05', 'demob'); out.lockedToggle = sym1033State('P05').demob.all === st0.all; out.lockedMsg = (document.querySelector('#flash, .flash, [role="status"]') || {}).innerText || ''; /* the drawer's own tick, refused while locked */
    out.open = setOpen1052('P05', true); out.isOpen = !!(state1049().open || {}).P05;
    sym1033Toggle('P05', 'demob'); const st1 = sym1033State('P05').demob; out.untick = st1.all !== st0.all;
    const m1 = money().charge.labour, a1 = at(), b1 = snap1049().refs.P05.t;
    out.bDelta = Math.round((b1 - b0) * 100) / 100; out.aDelta = Math.round((a1 - a0) * 100) / 100; out.mDelta = Math.round((m1 - m0) * 100) / 100;
    openAsset('P05'); const row = document.querySelector('#drawer .sym1033-row[data-sym1033="demob"]'); out.rowOff = !!row && row.getAttribute('aria-pressed') === String(st1.all); /* drawn at once by the drawer's own hook */
    out.drift = drift1049(state1049(), snap1049()).map(x => x.ref + ' ' + x.what + ' ' + x.d);
    renderCosts(); const c = document.querySelector('#pane-costs #lock1049'); out.cardTxt = c && c.innerText;
    out.wc02still = setLabour('WC02', 'Toilets & amenities', 'FWF', 'cleaning', !L()[labourKey('WC02', 'Toilets & amenities', 'FWF', 'cleaning')]) === false;
    sym1033Toggle('P05', 'demob'); out.back = sym1033State('P05').demob.all === st0.all; /* put it back in memory */
    out.close = setOpen1052('P05', false); sym1033Toggle('P05', 'demob'); out.reRefused = sym1033State('P05').demob.all === st0.all;
    out.unlockAll = unlock1049(); out.afterAll = setLabour('WC02', 'Toilets & amenities', 'FWF', 'cleaning', !!L()[labourKey('WC02', 'Toilets & amenities', 'FWF', 'cleaning')]) !== false;
    out.noAgent = !/Codex|Claude/.test(document.getElementById('pane-costs').innerText.slice(0, 4000));
    return out; });
   const errs = h.errors;
   if (!mob) console.log(JSON.stringify({card0: r.card0txt, card1: r.card1txt, held: r.held, notOnSite: r.notOnSite, drawer: d1, aDelta: r2.aDelta, mDelta: r2.mDelta, bDelta: r2.bDelta, drift: r2.drift, card: r2.cardTxt, p65: r.p65, p66: r.p66}, null, 1).slice(0, 5000));
   ok(/v10\.52$/.test(r.foot), tag + ': footer v10.52');
   ok(/Ticks · not locked/.test(r.card0txt || ''), tag + ': Costs shows the Ticks card, not locked');
   ok(r.lock === true && r.v === 2 && r.held > 100 && r.heldHasWC02, tag + ': Lock ticks holds everything on site (' + r.held + ')');
   ok(/Ticks · locked/.test(r.card1txt || '') && /No change since the lock/.test(r.card1txt || ''), tag + ': locked card, no change since the lock');
   ok(r.bRefused && r.tRefused, tag + ': while locked a building tick and a toilet tick are both refused');
   ok(r.doneRefused && r.lightRefused && r.allRefused, tag + ': complete, light and tick-all are refused too');
   ok(r.doorRefused, tag + ': a recorded door side cannot be changed while locked');
   ok(r.doorFill, tag + ': a missing door side can still be filled while locked (P09)');
   ok(r.p65 === 'passenger' && r.p66 === 'driver', tag + ': P65 passenger and P66 driver read again (recorded 9 Oct)');
   ok(d1.locked && /locked/i.test(d1.txt || '') && /unlock to change/i.test(d1.txt || ''), tag + ': drawer shows Locked with Unlock to change');
   ok(r2.open && r2.isOpen && r2.untick, tag + ': Unlock to change opens P05 alone, and its tick changes');
   ok(r2.lockedToggle, tag + ': the drawer tick itself is refused while locked');
   ok(Math.abs(Math.abs(r2.bDelta) - 145.74) < 0.005, tag + ': the buildings card figure moves by the demob $145.74 (' + r2.bDelta + ')');
   ok(Math.abs(Math.abs(r2.aDelta) - 145.74) < 0.005, tag + ': P05\'s own charge moves by $145.74 (' + r2.aDelta + ')');
   ok(Math.abs(Math.abs(r2.mDelta) - 145.74) < 0.005, tag + ': the job labour total on Costs and the P&L moves by $145.74 (' + r2.mDelta + ')');
   ok(r2.rowOff && r2.back, tag + ': the drawer row follows the tick, and it goes back');
   ok(r2.drift.length === 1 && /P05 Demob/.test(r2.drift[0]), tag + ': the lock card lists the change: ' + r2.drift.join('; '));
   ok(r2.wc02still, tag + ': the other references stay locked while P05 is open');
   ok(r2.close && r2.reRefused, tag + ': Lock again holds P05 again');
   ok(r2.unlockAll && r2.afterAll, tag + ': Unlock all opens everything');
   ok(r2.noAgent, tag + ': no agent name on Costs');
   ok(errs.length === 0, tag + ': no page errors ' + errs.slice(0, 3).join(' | '));
  } finally { await h.browser.close(); }
 }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
