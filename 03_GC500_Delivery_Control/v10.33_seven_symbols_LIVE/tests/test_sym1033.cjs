// v10.33: the seven symbols on the row and in the drawer. Read-only against the service (every write aborted); the toggles
// change only this browser's copy. PAGE=build/GC500_v10.33/GC500_Delivery_Control_hosted.html node tests/test_sym1033.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const OUT = process.env.OUT || ''; const shot = name => OUT ? {path: require('path').join(OUT, name)} : null; let fails = 0, n = 0;
const ok = (what, cond, more) => { n++; console.log((cond ? 'PASS ' : 'FAIL ') + what + (cond ? '' : ' :: ' + JSON.stringify(more || null).slice(0, 600))); if (!cond) fails++; };
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#plant', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await p.waitForTimeout(3500);
  const X = await p.evaluate(() => holdAssets(() => {
    const order = k => { const dom = [...document.querySelectorAll('[data-sym1033][data-symref="' + k + '"]')].map(b => b.dataset.sym1033); if (dom.length) return dom; const st = sym1033State(k) || {}; return ['delivery', 'install', 'levelling', 'steps', 'cleaning', 'demob', 'pickup'].filter(s => st[s] && st[s].applies); };
    const st = k => { const x = sym1033State(k); return Object.fromEntries(Object.entries(x).map(([a, b]) => [a, {applies: b.applies, on: b.on, all: b.all, charge: b.charge, money: b.money}])); };
    const firstB = 'P01'; return {firstB, P01: order('P01'), P01s: st('P01'), WC07: order('WC07'), WC07s: st('WC07'), WC05: order('WC05'), WB06: order('WB06'), GN21: order('GN21'), footer: (document.body.innerText.match(/v10\.\d+/g) || []).pop(), rows: document.querySelectorAll('[data-sym1033]').length};
  }));
  ok(X.firstB + ' (building) carries the seven in order: delivery, install, levelling, steps, cleaning, demob, pickup', X.P01.join() === 'delivery,install,levelling,steps,cleaning,demob,pickup', X.P01);
  ok('WC07 (20 FWF) carries install and demob only, with the transport legs if the card prices them', X.WC07.filter(k => ['levelling', 'steps', 'cleaning'].includes(k)).length === 0 && X.WC07.includes('install') && X.WC07.includes('demob'), X.WC07);
  ok('WB06 (barriers) and GN21 (generator) carry only what the card gives them, no levelling, steps or cleaning', !X.WB06.some(k => ['levelling', 'steps', 'cleaning'].includes(k)) && !X.GN21.some(k => ['levelling', 'steps', 'cleaning'].includes(k)), {WB06: X.WB06, GN21: X.GN21});
  ok('WC05 (block and tank) carries install, levelling, steps, cleaning, demob', ['install', 'levelling', 'steps', 'cleaning', 'demob'].every(k => X.WC05.includes(k)), X.WC05);
  ok('symbols are drawn on the Equipment list (' + X.rows + ' buttons)', X.rows > 200, X.rows);
  ok('footer reads v10.33', X.footer === 'v10.33', X.footer);
  await p.evaluate(() => { const m = document.querySelector('main'); const r = document.querySelector('[data-sym1033][data-symref="P01"]'); if (r) r.scrollIntoView({block: 'center'}); });
  await p.waitForTimeout(500); if (OUT) await p.screenshot(shot('sym1033_equipment_desktop.png'));
  // toggles change this browser's copy only: install on a building that has it off, delivery leg on
  const T = await p.evaluate(() => holdAssets(() => {
    /* this browser's copy only: the harness aborts every write; the page is told it may write so the setters run */
    S.operator = 'Andrew Fisher'; SYNC.readonly = false; SYNC.level = 'edit';
    const before = sym1033State('P01'); const labour0 = before.install.all; const tr0 = buildingTransportModel831().actualAdditional1006;
    sym1033Toggle('P01', 'install'); const mid = sym1033State('P01');
    sym1033Toggle('P01', 'delivery'); const after = sym1033State('P01'); const tr1 = buildingTransportModel831().actualAdditional1006;
    sym1033Toggle('P01', 'delivery'); const tr2 = buildingTransportModel831().actualAdditional1006; const off = sym1033State('P01').delivery;
    return {labour0, installOnAfter: mid.install.on, installAll: mid.install.all, deliveryOn: after.delivery.on, tr0, tr1, tr2, offed: off.off, chargeP01: after.delivery.charge};
  }));
  ok('ticking Install on P01 flips its labour lines (all on: ' + T.labour0 + ' → ' + T.installAll + ')', T.installAll === !T.labour0, T);
  ok('ticking Delivery makes P01\'s delivery leg actual (' + T.tr0 + ' → ' + T.tr1 + '), and un-ticking leaves it out (' + T.tr2 + ')', T.deliveryOn === true && T.tr1 >= T.tr0 && T.tr2 <= T.tr1 && T.offed === true, T);
  await p.evaluate(() => openAsset('P60')); await p.waitForTimeout(1800);
  const D = await p.evaluate(() => { const d = document.getElementById('drawer'); return {rows: [...d.querySelectorAll('.sym1033-row')].map(b => b.dataset.sym1033), text: (d.querySelector('.cmp816') || {}).innerText || ''}; });
  ok('the drawer\'s Complete it island carries the symbol rows in order', D.rows.join() === 'delivery,install,levelling,steps,cleaning,demob,pickup', D);
  if (OUT) await p.screenshot(shot('sym1033_drawer_desktop.png'));
  await s.browser.close();
  const m = await open({pageFile: process.env.PAGE, hash: '#plant', W: 390, H: 844, dpr: 2, mobile: true}); await m.page.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000}); await m.page.waitForTimeout(3500);
  await m.page.evaluate(() => { const r = document.querySelector('[data-sym1033][data-symref="P01"]'); if (r) r.scrollIntoView({block: 'center'}); }); await m.page.waitForTimeout(500);
  if (OUT) await m.page.screenshot(shot('sym1033_equipment_phone.png')); await m.browser.close();
  console.log(fails ? `${fails} of ${n} CHECKS FAILED` : `ALL ${n} CHECKS PASSED`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
