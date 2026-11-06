/* Read-only parity: open BASE and PAGE side by side (same fixed clock, same live record read at the same time), then
   compare: innerText of every tab pane + header/footer, the drawer text of every asset (sample), the codex model digests
   (asset units, charge lines, rental, completion, costs, labour, finance rows) and BuildWork986.day for every programme day.
   env: BASE, PAGE, MOB=1, DRAWERS=n (number of asset drawers to compare, default all) */
const {open} = require('./open2.cjs'); const crypto = require('crypto'); const fs = require('fs');
const H = v => crypto.createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex').slice(0, 16);
const FIXED = new Date('2026-10-18T06:30:00+10:00');
async function start(file, MOB) {
  return open({pageFile: file, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900}), before: async page => { await page.clock.setFixedTime(FIXED); }});
}
async function settle(p, ms) { await p.waitForTimeout(ms); }
async function snapshot(s, label) {
  const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
  await settle(p, 8000);
  const out = {label};
  out.sourceDigest = await p.evaluate(() => JSON.stringify(S).length + ':' + JSON.stringify(Object.keys(S).sort().map(k => [k, JSON.stringify(S[k]).length])));
  out.sourceFull = await p.evaluate(() => JSON.stringify(S));
  out.tabs = await p.evaluate(() => TABS.map(t => t[0]));
  out.panes = {};
  for (const k of out.tabs) {
    await p.evaluate(k => go(k), k); await settle(p, 2500);
    out.panes[k] = await p.evaluate(k => { const el = document.getElementById('pane-' + k); return el ? el.innerText : '(no pane)'; }, k);
  }
  await p.evaluate(() => go('plant')); await settle(p, 2500);
  out.chrome = await p.evaluate(() => ['#tabs', 'header', '#foot', '#footR'].map(q => { const n = document.querySelector(q); return q + '=' + (n ? n.innerText : ''); }).join('\n'));
  out.model = await p.evaluate(() => holdAssets(() => ({
    assets: allAssets().map(a => ({ref: a.key, units: gcModel925(a), charges: chargeLines(a), rental: rentalOf(a.key), complete: gc500IsComplete897(a.key)})),
    complete: gc500CompleteKeys897(), costs: allCosts(), labour: labourPlan(), finance: fin745Rows(todayIso())})));
  out.modelUnheld = await p.evaluate(() => ({complete: gc500CompleteKeys897(), units: allAssets().slice(0, 400).map(a => gcModel925(a))}));
  out.work = await p.evaluate(() => { const today = todayIso(); const days = (typeof calendarDays === 'function' ? calendarDays() : []).map(d => d.iso).filter(Boolean);
    const held = holdAssets(() => days.map(iso => { try { return [iso, BuildWork986.day(iso, today)]; } catch (e) { return [iso, 'ERR ' + e.message]; } }));
    const unheld = days.slice(0, 60).map(iso => { try { return [iso, BuildWork986.day(iso, today)]; } catch (e) { return [iso, 'ERR ' + e.message]; } });
    return {n: days.length, held, unheld}; });
  // drawers: open every asset drawer via the page's own open function and read its text
  out.drawers = await p.evaluate(async N => { const keys = allAssets().map(a => a.key).slice(0, N); const r = {}; const fn = typeof openAsset === 'function' ? openAsset : null;
    if (!fn) return {err: 'no drawer fn'}; for (const k of keys) { try { fn(k); await new Promise(res => requestAnimationFrame(() => setTimeout(res, 30))); const d = document.getElementById('drawer'); r[k] = d ? d.innerText : ''; } catch (e) { r[k] = 'ERR ' + e.message; } }
    return r; }, +(process.env.DRAWERS || 0));
  out.errors = s.errors.slice(); out.blocked = s.counts.blocked;
  return out;
}
(async () => {
  const MOB = process.env.MOB === '1';
  const [a, b] = await Promise.all([start(process.env.BASE, MOB), start(process.env.PAGE, MOB)]);
  try {
    const [A, B] = await Promise.all([snapshot(a, 'base'), snapshot(b, 'page')]);
    const rep = {mob: MOB, sameSource: A.sourceFull === B.sourceFull, sourceLen: [A.sourceFull.length, B.sourceFull.length], tabs: A.tabs.length, diffs: [], errors: {base: A.errors, page: B.errors}, blocked: [A.blocked, B.blocked]};
    if (JSON.stringify(A.tabs) !== JSON.stringify(B.tabs)) rep.diffs.push('tab list');
    for (const k of A.tabs) if (A.panes[k] !== B.panes[k]) rep.diffs.push('pane ' + k);
    if (A.chrome !== B.chrome) rep.diffs.push('chrome');
    for (const key of ['assets', 'complete', 'costs', 'labour', 'finance']) if (H(A.model[key]) !== H(B.model[key])) rep.diffs.push('model ' + key);
    if (H(A.modelUnheld) !== H(B.modelUnheld)) rep.diffs.push('modelUnheld');
    if (H(A.work) !== H(B.work)) rep.diffs.push('BuildWork986.day');
    const dk = Object.keys(A.drawers); let dd = 0; for (const k of dk) if (A.drawers[k] !== B.drawers[k]) { dd++; if (dd <= 10) rep.diffs.push('drawer ' + k); }
    rep.drawersCompared = dk.length; rep.drawerDiffs = dd; rep.workDays = A.work.n; rep.assets = A.model.assets.length;
    rep.paneChars = Object.fromEntries(A.tabs.map(k => [k, A.panes[k].length]));
    fs.writeFileSync(process.env.OUTJSON || 'runs/parity_last.json', JSON.stringify({A: {...A, sourceFull: undefined}, B: {...B, sourceFull: undefined}}, null, 0));
    console.log(JSON.stringify(rep, null, 1));
  } finally { await a.browser.close(); await b.browser.close(); }
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
