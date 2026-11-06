/* Author: Andrew Fisher. v10.77 check (read-only, every write aborted): the VMS board register lists VMS01..VMS24 (23 boards,
   no VMS05) in number order, 20 marked turned up and VMS21, VMS22, VMS24 still to come, heading "23 boards · 20 turned up ·
   3 still to come"; VMS counts as v10.76; footer v10.77; no page errors.   PAGE=... [MOB=1] node test_v1077.cjs */
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(3000);
  await p.evaluate(() => go('plant')); await p.waitForTimeout(3500);
  const pg = await p.$('[data-pg="VMS boards"]'); if (pg) { await pg.click(); await p.waitForTimeout(3500); }
  const r = await p.evaluate(() => {
    const fold = document.querySelector('[data-vms913]'); if (fold && fold.tagName === 'DETAILS') fold.open = true;
    const head = fold ? (fold.querySelector('summary') || {}).innerText || '' : '';
    const rows = [...document.querySelectorAll('[data-vms913-row]')].map(e => { const b = e.querySelector('.vms913c.b'); return {name: (b.querySelector('b') || {}).textContent, up: !!b.querySelector('.vms1077up'), rego: ((e.querySelector('[data-l="Rego"]') || {}).innerText || '').trim()}; });
    const tr = [...document.querySelectorAll('#invCard tr')].find(t => /^\s*VMS\b/.test(t.innerText));
    return {head: head.replace(/\s+/g, ' ').trim(), rows, vmsRow: tr ? tr.innerText.replace(/\s+/g, ' ').trim() : '', foot: ((document.getElementById('footL') || {}).textContent || '').trim()};
  });
  const fails = [], want = ['VMS01','VMS02','VMS03','VMS04','VMS06','VMS07','VMS08','VMS09','VMS10','VMS11','VMS12','VMS13','VMS14','VMS15','VMS16','VMS17','VMS18','VMS19','VMS20','VMS21','VMS22','VMS23','VMS24'];
  if (JSON.stringify(r.rows.map(x => x.name)) !== JSON.stringify(want)) fails.push('order: ' + r.rows.map(x => x.name).join(' '));
  const notUp = r.rows.filter(x => !x.up).map(x => x.name).join(' '); if (notUp !== 'VMS21 VMS22 VMS24') fails.push('still to come: ' + notUp);
  if (r.rows.filter(x => x.up && /not given/.test(x.rego)).length) fails.push('a turned-up board has no rego');
  if (!/^VMS board register\b.*23 boards · 20 turned up · 3 still to come · 20 regos given/.test(r.head)) fails.push('heading: ' + r.head);
  if (!/\b20 14 0 3 23$/.test(r.vmsRow)) fails.push('VMS row: ' + r.vmsRow);
  if (!/v10\.77$/.test(r.foot)) fails.push('footer ' + r.foot.slice(-10));
  if (errs.length) fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', pass: !fails.length, fails, head: r.head, order: r.rows.map(x => x.name + (x.up ? '' : '(to come)')).join(' '), vmsRow: r.vmsRow}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
