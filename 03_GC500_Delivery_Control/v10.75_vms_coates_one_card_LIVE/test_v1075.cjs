/* Author: Andrew Fisher. v10.75 check (read-only, every write aborted): the VMS counts match the site - 20 on site,
   Premiair Hire 6, Coates numbered 14, none without a number; one card per board on T0001, T0103, T0128 and T0158 with no
   duplicate warning; one company name; footer v10.75; and the lines of Costs and Today that differ from BASE.
   PAGE=build.html [BASE=live.html] [MOB=1] node test_v1075.cjs */
const {open} = require('../toolchain/harness/open_page');
async function run(pageFile, MOB) {
  const s = await open(MOB ? {pageFile, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const r = {errs};
  await p.evaluate(() => go('plant')); await p.waitForTimeout(3500);
  r.strip = await p.evaluate(() => [...document.querySelectorAll('.invcos')].map(e => e.innerText.replace(/\s+/g, ' ').trim()).join(' | '));
  const pg = await p.$('[data-pg="VMS boards"]'); if (pg) { await pg.click(); await p.waitForTimeout(3500); }
  r.vmsRow = await p.evaluate(() => { const tr = [...document.querySelectorAll('#invCard tr')].find(t => /^\s*VMS\b/.test(t.innerText)); return tr ? tr.innerText.replace(/\s+/g, ' ').trim() : ''; });
  r.inv = await p.evaluate(() => { const inv = typeof inventory === 'function' ? inventory() : null; const v = inv && (inv.rows || []).find(x => x.item === 'VMS'); return v ? JSON.parse(JSON.stringify(v)) : null; });
  r.text = await p.evaluate(() => document.body.innerText);
  r.drawers = {};
  for (const ref of ['T0001', 'T0103', 'T0128', 'T0158']) r.drawers[ref] = await p.evaluate(ref => gcModel925(assetOf(ref)).rows.filter(u => u.source !== 'history').map(u => ({no: String(u.assetNo), owner: u.owner, physical: !!u.physical, review: u.identityReview || ''})), ref);
  for (const t of ['costs', 'today']) { await p.evaluate(t => go(t), t); await p.waitForTimeout(5000); for (let i = 0; i < 2; i++) { await p.evaluate(t => document.querySelectorAll('#pane-' + t + ' details:not([open])').forEach(d => { d.open = true; }), t); await p.waitForTimeout(1200); } r[t] = await p.evaluate(t => ((document.getElementById('pane-' + t) || {}).innerText || '').replace(/v10\.7\d/g, 'vX'), t); }
  r.foot = await p.evaluate(() => ((document.getElementById('footL') || {}).textContent || '').trim());
  try { if (s.browser) await s.browser.close(); } catch (e) {}
  return r;
}
const diff = (a, b) => { const A = a.split('\n'), B = b.split('\n'), sa = new Set(A), sb = new Set(B); return {gone: A.filter(l => !sb.has(l)), added: B.filter(l => !sa.has(l))}; };
(async () => {
  const MOB = !!process.env.MOB, r = await run(process.env.PAGE, MOB), fails = [];
  if (!/Premiair Hire 6 on site/.test(r.strip)) fails.push('strip: ' + r.strip);
  if (!/Premiair Hire 6\b/.test(r.vmsRow) || !/\b20 14 0 0 20$/.test(r.vmsRow)) fails.push('VMS row: ' + r.vmsRow);
  const want = {T0001: 7, T0103: 2, T0128: 2, T0158: 9};
  for (const [ref, n] of Object.entries(want)) { const u = r.drawers[ref], nums = u.map(x => x.no);
    if (u.length !== n || new Set(nums).size !== n || u.some(x => !x.physical) || u.some(x => /Duplicate/.test(x.review))) fails.push(ref + ' cards: ' + JSON.stringify(u)); }
  if (r.drawers.T0158.some(x => x.no === '1191957') || !r.drawers.T0158.some(x => x.no === '1191657')) fails.push('VMS13 is not 1191657 alone');
  const m = r.text.match(/PremAir Hire|SUB-HIRED\s*[—·-]\s*Premiair(?! Hire)|Premiair sub-hire|sub-hire supplier PRE808/); if (m) fails.push('Equipment shows "' + m[0] + '"');
  if (!/v10\.75$/.test(r.foot)) fails.push('footer ' + r.foot.slice(-12));
  if (r.errs.length) fails.push('page errors: ' + r.errs.join(' | '));
  let base = null;
  if (process.env.BASE) { const b = await run(process.env.BASE, MOB); base = {costs: diff(b.costs, r.costs), today: diff(b.today, r.today), baseVmsRow: b.vmsRow, baseStrip: b.strip}; }
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', pass: !fails.length, fails, strip: r.strip, vmsRow: r.vmsRow, drawers: Object.fromEntries(Object.entries(r.drawers).map(([k, v]) => [k, v.map(x => x.no + (x.physical ? '' : '*')).join(' ')])), foot: r.foot, base}, null, 1));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
