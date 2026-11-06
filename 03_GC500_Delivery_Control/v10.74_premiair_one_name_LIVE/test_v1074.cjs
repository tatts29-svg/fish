/* Author: Andrew Fisher. v10.74 check (read-only, every write aborted): the Premiair sub-hire company shows once, as
   "Premiair Hire", in every view that showed it twice; each sub-hired board has one card; Costs and Today read the same
   text as the page given in BASE. PAGE=build.html [BASE=live.html] [MOB=1] node test_v1074.cjs */
const {open} = require('../toolchain/harness/open_page');
const crypto = require('crypto');
const h = t => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
async function run(pageFile, MOB) {
  const s = await open(MOB ? {pageFile, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const out = {texts: {}, errs};
  const body = () => p.evaluate(() => document.body.innerText);
  await p.evaluate(() => go('plant')); await p.waitForTimeout(3500);
  out.cos = await p.evaluate(() => [...document.querySelectorAll('.invcos')].map(e => e.innerText.replace(/\s+/g, ' ').trim()).join(' | '));
  const pg = await p.$('[data-pg="VMS boards"]'); if (pg) { await pg.click(); await p.waitForTimeout(3500); }
  await p.evaluate(() => document.querySelectorAll('details').forEach(d => { if (/VMS board register|Every reference/i.test((d.querySelector('summary') || {}).textContent || '')) d.open = true; }));
  await p.waitForTimeout(1500); out.texts.equipment = await body();
  out.register = await p.evaluate(() => vms913Boards().filter(b => !b.coates).map(b => b.name + '=' + vms913Of(b).co));
  await p.evaluate(() => go('subhired')); await p.waitForTimeout(3500);
  out.buttons = await p.evaluate(() => [...document.querySelectorAll('[data-supplier932-company]')].map(b => b.innerText.replace(/\s+/g, ' ').trim()));
  out.texts.subhired = await body();
  for (const t of ['timeline', 'change', 'vms']) { await p.evaluate(t => go(t), t); await p.waitForTimeout(3500); out.texts[t] = await body(); }
  for (const t of ['costs', 'today']) { await p.evaluate(t => go(t), t); await p.waitForTimeout(5000); out[t] = await p.evaluate(t => (document.getElementById('pane-' + t) || document.body).innerText.replace(/\s+/g, ' ').replace(/v10\.7\d/g, 'vX'), t); }
  out.drawers = {};
  for (const r of ['T0103', 'T0128', 'T0158']) {
    await p.evaluate(r => openAsset(r), r); await p.waitForTimeout(3000);
    out.drawers[r] = await p.evaluate(r => ({units: [...document.querySelectorAll('[data-units925="' + r + '"] .units925-unit')].map(e => [(e.querySelector('.item933-number') || {}).textContent, (e.querySelector('.item933-owner') || {}).textContent, (e.querySelector('.units925-warning') || {}).textContent || ''].join(' | ').replace(/\s+/g, ' ').trim())}), r);
    out.texts['drawer ' + r] = await body();
  }
  out.foot = await p.evaluate(() => ((document.getElementById('footL') || {}).textContent || '').trim());
  try { if (s.browser) await s.browser.close(); } catch (e) {}
  return out;
}
(async () => {
  const MOB = !!process.env.MOB, r = await run(process.env.PAGE, MOB), fails = [];
  const BAD = /PremAir Hire|SUB-HIRED\s*[—·-]\s*Premiair(?! Hire)|SUB-HIRED\s*[—·-]\s*PremAir|sub-hire supplier PRE808|Premiair sub-hire/;
  for (const [k, t] of Object.entries(r.texts)) { const m = t.match(BAD); if (m) fails.push(k + ' still shows "' + m[0] + '"'); }
  const prem = r.buttons.filter(b => /prem/i.test(b)); if (prem.length !== 1 || !/Premiair Hire/.test(prem[0])) fails.push('Sub-hired buttons: ' + JSON.stringify(prem));
  const notOne = r.register.filter(x => /prem|PRE808/i.test(x) && !/=Premiair Hire$/.test(x)); if (notOne.length) fails.push('register: ' + notOne.join(', '));
  if (/PremAir|Premiair(?! Hire)/.test(r.cos)) fails.push('Equipment strip: ' + r.cos);
  for (const [ref, want] of Object.entries({T0103: ['120T'], T0128: ['467T'], T0158: ['472T', '475T', '487T', '453T']})) {
    const cards = r.drawers[ref].units.filter(u => /Premiair/i.test(u));
    const nums = cards.map(u => u.split(' | ')[0].trim());
    if (want.some(n => nums.filter(x => x === n).length !== 1) || cards.length !== want.length) fails.push(ref + ' Premiair cards: ' + JSON.stringify(cards));
    if (cards.some(u => /Duplicate/i.test(u))) fails.push(ref + ' duplicate warning: ' + JSON.stringify(cards));
  }
  if (!/v10\.74$/.test(r.foot)) fails.push('footer ' + r.foot.slice(-12));
  if (r.errs.length) fails.push('page errors: ' + r.errs.join(' | '));
  let parity = null;
  if (process.env.BASE) { const b = await run(process.env.BASE, MOB); parity = {costs: h(r.costs) === h(b.costs), today: h(r.today) === h(b.today), costsHash: h(r.costs), todayHash: h(r.today)};
    if (!parity.costs) fails.push('Costs text differs from the base page'); if (!parity.today) fails.push('Today text differs from the base page'); }
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', pass: !fails.length, fails, buttons: prem, register: r.register, cos: r.cos, drawers: r.drawers, foot: r.foot, parity}, null, 1));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
