/* Author: Andrew Fisher. v10.72 check (read-only; the harness aborts every write): on the page given, the VMS boards
   register names the eight 7-October Coates boards by Andrew's VMS numbers with their asset numbers and regos, VMS09 says it
   was first VMS05, record keys are unchanged, and the footer reads v10.72.   PAGE=... [MOB=1] node test_v1072.cjs */
const {open} = require('../toolchain/harness/open_page');
const WANT = {'1211354': ['VMS01', 'EX0017'], '1211370': ['VMS02', 'ES3206'], '1271129': ['VMS03', '536UOO'], '1191877': ['VMS04', 'EM6306'],
  '1211359': ['VMS06', 'ER9247'], '1182999': ['VMS07', '410UFQ'], '1211383': ['VMS08', 'ER9381']};
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page; const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 240000});
  await p.waitForTimeout(3000);
  const r = await p.evaluate((WANT) => {
    const bs = vms913Boards(), out = {rows: [], fails: []};
    for (const [asset, [name, rego]] of Object.entries(WANT)) {
      const b = bs.find(x => x.asset === asset && x.key === asset);
      if (!b) { out.fails.push(asset + ' no board keyed by its asset'); continue; }
      const v = vms913Of(b);
      if (b.name !== name) out.fails.push(asset + ' named ' + b.name + ' not ' + name);
      if (v.rego !== rego) out.fails.push(asset + ' rego ' + v.rego + ' not ' + rego);
      if (b.vms) out.fails.push(asset + ' plan position changed to ' + b.vms);
      out.rows.push([b.key, b.name, v.fleet, v.rego]);
    }
    const v9 = bs.find(x => x.key === 'VMS09'); if (!v9 || v9.was1072 !== 'VMS05' || vms913Of(v9).rego !== 'TF15JR') out.fails.push('VMS09 history/rego');
    const html = vms913Html(bs), d = document.createElement('div'); d.innerHTML = html; const txt = d.textContent.replace(/\s+/g, ' ');
    for (const [asset, [name, rego]] of Object.entries(WANT)) { const row = [...d.querySelectorAll('[data-vms913-row]')].find(x => x.getAttribute('data-vms913-row') === asset);
      const t = row ? row.textContent.replace(/\s+/g, ' ') : ''; if (!t.includes(name) || !t.includes(asset) || !t.includes(rego)) out.fails.push('register row ' + asset + ': ' + t.slice(0, 120)); }
    if (!/first VMS05, taken off and made VMS09/.test(txt)) out.fails.push('VMS09 row does not say first VMS05');
    out.keys = Object.keys(S.vmsboard || {}).sort(); out.footer = (document.getElementById('footL') || {}).textContent || '';
    if (!/v10\.72$/.test(out.footer.trim())) out.fails.push('footer ' + out.footer.slice(-20));
    return out;
  }, WANT);
  if (errs.length) r.fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', pass: !r.fails.length, ...r}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(r.fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
