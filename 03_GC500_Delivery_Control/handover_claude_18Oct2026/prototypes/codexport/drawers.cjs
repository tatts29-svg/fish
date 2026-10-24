/* Read-only: open every asset drawer on BASE and PAGE side by side (fixed clock) and compare its text once it is stable.
   env BASE, PAGE, MOB, KEYS (comma list, default all) */
const {open} = require('./open2.cjs'); const fs = require('fs');
const FIXED = new Date('2026-10-18T06:30:00+10:00');
const start = (f, MOB) => open({pageFile: f, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900}), before: async page => { await page.clock.setFixedTime(FIXED); }});
async function grab(s, keysWanted) { const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500}); await p.waitForTimeout(8000);
  const src = await p.evaluate(() => JSON.stringify(S));
  const keys = keysWanted || await p.evaluate(() => allAssets().map(a => a.key)); const r = {};
  for (const k of keys) r[k] = await p.evaluate(async k => { openAsset(k); await new Promise(res => setTimeout(res, 900)); const txt = () => (document.getElementById('drawer') || {}).innerText || ''; let last = txt(), stableFor = 0, t = 0;
      while (t < 4000) { await new Promise(res => setTimeout(res, 100)); t += 100; const now = txt(); if (now === last) { stableFor += 100; if (stableFor >= 400) break; } else { stableFor = 0; last = now; } }
      return last.split('\n').filter(l => !/^Loading picture/.test(l)).join('\n'); }, k);
  return {src, r, errors: s.errors, blocked: s.counts.blocked}; }
(async () => { const MOB = process.env.MOB === '1', keys = process.env.KEYS ? process.env.KEYS.split(',') : null;
  const [a, b] = await Promise.all([start(process.env.BASE, MOB), start(process.env.PAGE, MOB)]);
  try { const [A, B] = await Promise.all([grab(a, keys), grab(b, keys)]); const diff = Object.keys(A.r).filter(k => A.r[k] !== B.r[k]);
    fs.writeFileSync(process.env.OUTJSON || 'runs/drawers_last.json', JSON.stringify({A: A.r, B: B.r}));
    console.log(JSON.stringify({mob: MOB, sameSource: A.src === B.src, compared: Object.keys(A.r).length, diffs: diff, errors: [A.errors, B.errors], blocked: [A.blocked, B.blocked]})); }
  finally { await a.browser.close(); await b.browser.close(); } })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
