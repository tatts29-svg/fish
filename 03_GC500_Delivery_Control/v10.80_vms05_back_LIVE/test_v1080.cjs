/* Author: Andrew Fisher. v10.80 check (read-only, every write aborted).
   A. As the record stands: the VMS register has 24 boards (VMS01..VMS24, VMS05 back as Coates 1211356, "no contract line yet"),
      20 turned up and 4 still to come (VMS05, VMS21, VMS22, VMS24); the requirement is 24; footer v10.80; no page errors.
   B. In this browser's memory only, the record steps for VMS05 (T0001 quantity 8 and supplied 8, unit 1211356 VMS05, the
      register's rego ER9244 on T0001, the VMS plan's 05a pin) all take, and then 21 have turned up.
   PAGE=... [MOB=1] [LIVE=1] node test_v1080.cjs */
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const MOB = !!process.env.MOB, fails = [];
  const pf = process.env.LIVE ? {} : {pageFile: process.env.PAGE};
  const s = await open(MOB ? {...pf, W: 390, H: 844, dpr: 2, mobile: true} : {...pf, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && typeof vms913Boards === 'function', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const look = () => p.evaluate(() => { vms913Boards.b = null; const bs = vms913Boards(), c = vmsCount1076(todayIso(), null) || {};
    const v5 = bs.find(b => b.key === 'VMS05'), o5 = v5 ? vms913Of(v5) : {}, on5 = v5 ? vms913OnOf(v5).on : null;
    return {n: bs.length, names: bs.map(b => b.name).sort(), v5: v5 ? {asset: v5.asset, co: v5.co, noLine: !!v5.noLine1080, fleet: o5.fleet || null, rego: o5.rego || null, on: on5} : null,
      total: c.total, on: c.on, done: c.done, toCome: (c.toCome || []).map(x => x.key).sort(), lines: vms913LineCount(), foot: ((document.getElementById('footL') || {}).textContent || '').trim()}; });
  const A = await look();
  const want = ['VMS01','VMS02','VMS03','VMS04','VMS05','VMS06','VMS07','VMS08','VMS09','VMS10','VMS11','VMS12','VMS13','VMS14','VMS15','VMS16','VMS17','VMS18','VMS19','VMS20','VMS21','VMS22','VMS23','VMS24'];
  if (A.n !== 24 || JSON.stringify(A.names) !== JSON.stringify(want)) fails.push('A register: ' + A.n + ' ' + A.names.join(' '));
  if (!A.v5 || A.v5.asset !== '1211356' || A.v5.co !== 'Coates' || !A.v5.noLine) fails.push('A VMS05: ' + JSON.stringify(A.v5));
  if (A.total !== 24 || A.on !== 20 || JSON.stringify(A.toCome) !== '["VMS05","VMS21","VMS22","VMS24"]') fails.push('A count: ' + JSON.stringify({total: A.total, on: A.on, toCome: A.toCome}));
  await p.evaluate(() => go('plant')); await p.waitForTimeout(3500);
  { const pg = await p.$('[data-pg="VMS boards"]'); if (pg) { await pg.click(); await p.waitForTimeout(3500); } }
  const row = await p.evaluate(() => { const tr = [...document.querySelectorAll('#invCard tr')].find(t => /^\s*VMS\b/.test(t.innerText)); return tr ? tr.innerText.replace(/\s+/g, ' ').trim() : ''; });
  if (!/\b20 14 0 4 24$/.test(row)) fails.push('A Equipment VMS row (on 20, Coates 14, still to come 4, ordered 24): ' + row);
  if (!/v10\.80$/.test(A.foot)) fails.push('footer ' + A.foot.slice(-10));
  // B: the record steps, in memory
  const R = await p.evaluate(() => { capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher'; const out = [];
    out.push('qty ' + setQty('T0001', '8'));
    out.push('unit ' + JSON.stringify(unit925Save('T0001', {item: 'VMS', owner: 'coates', assetNo: '1211356', label: 'VMS05', branch: '', note: 'test', sourceKey: ''}, '', 'null', '')).slice(0, 60));
    vms913Boards.b = null; out.push('board ' + vms913Save('VMS05', 'Coates', '1211356', 'ER9244', 'T0001', null, true) + ' ' + (vms913St().said || ''));
    out.push('pin ' + VMS1024.setPosition('05a', -27.982639, 153.424639, 'test'));
    return out; });
  await p.waitForTimeout(1500);
  const B = await look();
  if (!R.every(x => /^(qty|unit|board|pin) (true|\{"ok":true)/.test(x))) fails.push('B steps: ' + R.join(' | '));
  if (!B.v5 || B.v5.rego !== 'ER9244' || B.v5.on !== 'T0001' || B.on !== 21 || JSON.stringify(B.toCome) !== '["VMS21","VMS22","VMS24"]') fails.push('B after: ' + JSON.stringify({v5: B.v5, on: B.on, done: B.done, toCome: B.toCome}));
  if (errs.length) fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', live: !!process.env.LIVE, pass: !fails.length, fails, A: {n: A.n, total: A.total, on: A.on, toCome: A.toCome, equipment: row, lines: A.lines, v5: A.v5}, steps: R, B: {on: B.on, done: B.done, toCome: B.toCome, v5: B.v5}}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
