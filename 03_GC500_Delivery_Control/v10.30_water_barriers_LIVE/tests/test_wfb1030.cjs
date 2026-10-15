// v10.30 checks: the Water barriers card, the programme on the page and in the drawer, the contract joins, no agent name.
// Read-only: every write the page tries is aborted. PAGE=build/GC500_v10.30/GC500_Delivery_Control_hosted.html node tests/test_wfb1030.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
let fails = 0, n = 0;
const ok = (what, cond, more) => { n++; console.log((cond ? 'PASS ' : 'FAIL ') + what + (cond ? '' : ' :: ' + JSON.stringify(more || null).slice(0, 500))); if (!cond) fails++; };
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#today', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await p.waitForTimeout(4000);
  const X = await p.evaluate(() => {
    const areas = todayWorkMetrics840(todayIso());
    const b = areas.find(a => a.id === 'barriers');
    const ids = areas.map(a => a.id);
    const expectTotal = allAssets().filter(a => !a._cancelled && a.product === 'WFB').reduce((t, a) => t + chargeLines(a).reduce((u, l) => u + (l.item === 'TL2' ? (l.quantity || 0) : 0), 0), 0);
    const expectDone = allAssets().filter(a => !a._cancelled && a.product === 'WFB' && deliveryOf(a.key).done).reduce((t, a) => t + chargeLines(a).reduce((u, l) => u + (l.item === 'TL2' ? (l.quantity || 0) : 0), 0), 0);
    const board = (document.getElementById('pane-today') || {}).innerText || '';
    const i = board.indexOf('Work progress'); const text = board.slice(i, i + 6000);
    const joins = (ONHIRE_ROWS || []).filter(r => r.rental_contract == '9972648' && r.match && r.match.to === 'asset').map(r => r.match.key);
    const ms = typeof ms1025Areas === 'function' ? ms1025Areas() : null;
    const all = (ONHIRE_ROWS || []).map(r => { let c = null; try { c = contractCharge(r); } catch (e) {} return {key: r.rental_contract + '/' + r.line, amount: c && c.amount}; });
    const footer = (document.body.innerText.match(/v10\.\d+/g) || []).pop();
    return {ids, b: b && {total: b.total, done: b.done, remaining: b.remaining, pct: b.pct, refs: b.totalRefs, complete: b.completeRefs, notes: b.notes, issues: b.issues, rows: b.rows.map(r => ({key: r.key, q: r.quantity, done: r.done, status: r.status, detail: r.detail}))}, expectTotal, expectDone, text, joins, all, footer, esc: esc('Andrew Fisher via Codex · 01 Oct'), esc2: esc('moved by Andrew Fisher via Claude (phone) · x')};
  });
  ok('the board has a Water barriers area, after Toilets and Fencing', X.ids.join() === 'buildings,toilets,fencing,barriers,generators,lighting,vms,equipment', X.ids);
  ok('its total is the schedule\'s Coates WB barriers (' + X.expectTotal + ') and Done the barriers of the references ticked complete (' + X.expectDone + ')', X.b && X.b.total === X.expectTotal && X.b.done === X.expectDone && X.b.remaining === X.expectTotal - X.expectDone, X.b && {total: X.b.total, done: X.b.done, remaining: X.b.remaining, pct: X.b.pct, issues: X.b.issues});
  ok('15 references on the card, none unquantified', X.b && X.b.refs === 15 && !X.b.issues.length, X.b && {refs: X.b.refs, issues: X.b.issues});
  ok('every row carries its programme install, fill and removal', X.b && X.b.rows.every(r => /Programme: install \w{3} \d+ \w{3} \d\d:\d\d · Coates · fill \d\d:\d\d · .+ · remove \w{3} \d+ \w{3}/.test(r.detail)), X.b && X.b.rows.filter(r => !/Programme: install/.test(r.detail)).slice(0, 3));
  ok('the notes name the programme, Downer left out, WB21 and WB22 without a reference, and the three quantity differences', X.b && X.b.notes.some(t => /TP02-26003-03/.test(t) && /Downer/.test(t)) && X.b.notes.some(t => /WB21/.test(t) && /WB22/.test(t)) && X.b.notes.some(t => /WB04 schedule 14 · programme 13 · contract 12/.test(t) && /WB07/.test(t)), X.b && X.b.notes);
  ok('the card is drawn on Today with its counts', /Water barriers/.test(X.text) && /WATER BARRIERS/.test(X.text), X.text.slice(0, 300));
  ok('the 17 lines of contract 9972648 are joined to 15 WB references', X.joins.length === 17 && new Set(X.joins).size === 15, X.joins);
  ok('esc() prints the person, never the assistant', X.esc === 'Andrew Fisher · 01 Oct' && X.esc2 === 'moved by Andrew Fisher · x', [X.esc, X.esc2]);
  ok('footer reads v10.30', X.footer === 'v10.30', X.footer);
  const S = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/';
  if (fs.existsSync(S + 'charges_build29.json')) { const b29 = Object.fromEntries(JSON.parse(fs.readFileSync(S + 'charges_build29.json')).map(r => [r.key, r.amount])); const moved = X.all.filter(r => b29[r.key] !== undefined && b29[r.key] !== r.amount); ok('every contract line charges what v10.29 charged (' + X.all.length + ' lines; the joins move no money)', moved.length === 0, moved.slice(0, 6)); }
  // the drawer
  await p.evaluate(() => openAsset('WB06')); await p.waitForTimeout(1800);
  const D = await p.evaluate(() => { const d = document.getElementById('drawer'); const sec = d.querySelector('[data-wfb1030]'); const where = d.querySelector('.where816'); return {has: !!sec, text: sec ? sec.innerText : '', beforeWhere: !!(sec && where && (sec.compareDocumentPosition(where) & Node.DOCUMENT_POSITION_FOLLOWING)), drawer: d.innerText.slice(0, 200)}; });
  ok('WB06\'s drawer carries the programme card before Where it is: install Thu 15 Oct 10:00 Coates, fill 10:30 City of Gold Coast, remove Tue 27 Oct 19:00, 154 on the programme and the schedule, three contract lines', D.has && D.beforeWhere && /Thu 15 Oct 10:00/.test(D.text) && /10:30 · City of Gold Coast/.test(D.text) && /Tue 27 Oct 19:00/.test(D.text) && /154 on the programme · 154 on the schedule · 154 on the contract/.test(D.text) && /line 6/.test(D.text) && /line 16/.test(D.text) && /line 17/.test(D.text) && /only install 10x/.test(D.text), D.text.slice(0, 700));
  await p.screenshot({path: S + 'shots_wb/wb06_drawer_1030.png'});
  await p.evaluate(() => { try { state.drawerClose && state.drawerClose(); } catch (e) {} });
  await p.evaluate(() => openAsset('P60')); await p.waitForTimeout(1200);
  const D2 = await p.evaluate(() => !!document.querySelector('#drawer [data-wfb1030]'));
  ok('a building\'s drawer has no programme card', !D2);
  await p.evaluate(() => { try { state.drawerClose && state.drawerClose(); } catch (e) {} go('today'); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const el = [...document.querySelectorAll('#pane-today h3')].find(h => /Water barriers/.test(h.textContent)); if (el) el.scrollIntoView({block: 'start'}); const m = document.querySelector('main'); if (m) m.scrollTop = Math.max(0, m.scrollTop - 60); });
  await p.waitForTimeout(600); await p.screenshot({path: S + 'shots_wb/board_barriers_1030.png'});
  await s.browser.close();
  console.log(fails ? `${fails} of ${n} CHECKS FAILED` : `ALL ${n} CHECKS PASSED`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
