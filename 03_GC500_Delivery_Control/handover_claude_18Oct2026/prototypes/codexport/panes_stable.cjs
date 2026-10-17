/* Read-only: BASE vs PAGE side by side, fixed clock; for each tab in TABS wait until the pane text is stable for 3 s (max 60 s), then compare. */
const {open} = require('./open2.cjs'); const fs = require('fs');
const FIXED = new Date('2026-10-18T06:30:00+10:00');
const start = (f, MOB) => open({pageFile: f, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900}), before: async page => { await page.clock.setFixedTime(FIXED); }});
async function grab(s, tabs) { const p = s.page; await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500}); await p.waitForTimeout(10000);
  const r = {}; for (const k of tabs) { r[k] = await p.evaluate(async k => { go(k); const txt = () => (document.getElementById('pane-' + k) || {}).innerText || ''; let last = txt(), st = 0, t = 0; while (t < 60000) { await new Promise(res => setTimeout(res, 250)); t += 250; const n = txt(); if (n === last) { st += 250; if (st >= 3000) break; } else { st = 0; last = n; } } return {t, text: last}; }, k); }
  return {src: await p.evaluate(() => JSON.stringify(S)), r, errors: s.errors}; }
(async () => { const MOB = process.env.MOB === '1', tabs = (process.env.TABS || 'today,timeline').split(',');
  const [a, b] = await Promise.all([start(process.env.BASE, MOB), start(process.env.PAGE, MOB)]);
  try { const [A, B] = await Promise.all([grab(a, tabs), grab(b, tabs)]); const out = {mob: MOB, sameSource: A.src === B.src, tabs: {}};
    for (const k of tabs) { const x = A.r[k].text.split('\n'), y = B.r[k].text.split('\n'); let i = 0; while (i < Math.min(x.length, y.length) && x[i] === y[i]) i++; out.tabs[k] = {same: A.r[k].text === B.r[k].text, settleMs: [A.r[k].t, B.r[k].t], firstDiff: A.r[k].text === B.r[k].text ? null : [i, x.slice(i, i + 3), y.slice(i, i + 3)]}; }
    console.log(JSON.stringify(out)); } finally { await a.browser.close(); await b.browser.close(); } })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
