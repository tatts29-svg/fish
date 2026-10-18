// Author: Andrew Fisher. v8.95's money effect, measured on the pages themselves: every money figure the page's models give (the
// same models test_money892.cjs reads - the P&L summary, Costs to job end, the Finance handover, the P&L, the business's lines,
// the Transport view, the 17 tie-outs, Rehire by branch, the labour plan) is read from page A (the chain without v8.95) and page B
// (with it), both against the same shared record version, and every number that differs is listed by its path with the direction
// and the percentage only. No amount is written to the log. "No record writes" and "no money moves" are different claims; this is
// the measurement behind the second. One browser at a time; read-only.
//   A=<page without v8.95> B=<page with v8.95> [MOB=1] node compare_money895.cjs
const {open} = require('../../toolchain/harness/open_page');
const figures = async (pageFile, MOB) => { const s = await open({pageFile, W: MOB ? 390 : 1440, H: MOB ? 844 : 900, mobile: MOB, dpr: MOB ? 2 : 1}); try { const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof transport888Core === 'function', null, {timeout: 180000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0 && !!document.getElementById('recon888'); } catch (e) { return false; } }, null, {timeout: 60000}); await p.waitForTimeout(800);
  const J = await p.evaluate(() => holdAssets(() => { const M = moneySummary(), X = cj764Model(), H = fh866Model(), P = pl770Model(), B = pl752Rows(), V = transport888View(), R = recon888Model(), RH = typeof rh766Model === 'function' ? rh766Model() : null, LP = labourPlan();
    const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'asAt' || k === 'at' || k === 'now' || k === 'generated') ? undefined : v));
    return JSON.stringify({M: strip(M), X: strip(X), H: strip(H), P: strip(P), B: strip(B), V: {tot: V.tot, byBranch: V.byBranch, byCarrier: V.byCarrier, revenueTotal: V.revenueTotal, provisionalTotal: V.provisionalTotal, lines: V.lines.length}, R: R.ties.map(t => ({what: t.what, ok: t.ok, parts: t.parts})), RH: strip(RH), LP: {all: LP.all}}); }));
  const ver = await p.evaluate(() => { try { return SYNC.backend.readVersion821(); } catch (e) { return null; } }), day = await p.evaluate(() => todayIso());
  const footer = await p.evaluate(() => ((document.getElementById('footL') || {}).textContent || '').slice(-12));
  return {J, ver, day, footer, errors: s.errors, blocked: s.counts.blocked}; } finally { await s.browser.close(); } };
(async () => { const MOB = !!process.env.MOB; let a = await figures(process.env.A, MOB), b = await figures(process.env.B, MOB), tries = 0;
  /* the live record can move between the two reads; read again (twice at most) until both pages hold the same version */
  while ((a.ver == null || a.ver !== b.ver || a.day !== b.day) && tries++ < 2) { a = await figures(process.env.A, MOB); if (a.ver !== b.ver || a.day !== b.day) b = await figures(process.env.B, MOB); }
  if (a.ver == null || a.ver !== b.ver || a.day !== b.day) { console.log('INCONCLUSIVE the shared record moved between the two reads (record ' + a.ver + ' and ' + b.ver + ', days ' + a.day + ' and ' + b.day + '); nothing compared'); process.exitCode = 2; return; }
  const JA = JSON.parse(a.J), JB = JSON.parse(b.J);
  const seg = k => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(k) ? '[name]' : k;   // a person's name is never written to the log
  const diffs = [], structural = []; let sameN = 0;
  const walk = (x, y, path) => {
    if (typeof x === 'number' && typeof y === 'number') { if (x === y) sameN++; else diffs.push({path, change: x === 0 ? 'from nil' : y === 0 ? 'to nil' : (y > x ? 'up ' : 'down ') + (Math.abs((y - x) / x) * 100).toFixed(2) + '%'}); return; }
    if (Array.isArray(x) && Array.isArray(y)) { if (x.length !== y.length) structural.push(path + ' length ' + x.length + ' -> ' + y.length); const n = Math.min(x.length, y.length); for (let i = 0; i < n; i++) walk(x[i], y[i], path + '[' + i + ']'); return; }
    if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { if (!(k in x) || !(k in y)) { structural.push(path + '.' + seg(k) + (k in x ? ' removed' : ' added')); continue; } walk(x[k], y[k], path + '.' + seg(k)); } return; }
    if (typeof x === 'string' && typeof y === 'string') { if (x !== y) { const nx = (x.match(/-?\d[\d,]*(\.\d+)?/g) || []).join(), ny = (y.match(/-?\d[\d,]*(\.\d+)?/g) || []).join(); if (nx !== ny) diffs.push({path, change: 'a text carrying figures differs'}); } return; }
    if (x !== y) structural.push(path + ' changed (' + typeof x + ' -> ' + typeof y + ')');
  };
  walk(JA, JB, '');
  const NAMES = {M: 'P&L summary (moneySummary)', X: 'Costs to job end (cj764)', H: 'Finance handover (fh866)', P: 'P&L (pl770)', B: "the business's lines (pl752)", V: 'Transport view (transport888)', R: 'tie-outs (recon888)', RH: 'Rehire by branch (rh766)', LP: 'labour plan'};
  console.log(`page A ${a.footer.trim()} vs page B ${b.footer.trim()}; record ${a.ver} (${a.day}); ${sameN} numbers the same, ${diffs.length} differ, ${structural.length} structural differences`);
  const byModel = {}; diffs.forEach(d => { const m = d.path.split('.')[1] || '?'; (byModel[m] = byModel[m] || []).push(d); });
  for (const m of Object.keys(NAMES)) { const L = byModel[m] || []; console.log(`${NAMES[m]}: ${L.length ? L.length + ' differ' : 'same'}`); L.forEach(d => console.log('   ' + d.path.replace(/^\.[A-Z]+\.?/, '') + '  ' + d.change)); }
  structural.forEach(s => console.log('structural: ' + s));
  const tied = J => J.R.filter(t => t.ok).length + '/' + J.R.length;
  console.log(`tie-outs tied: A ${tied(JA)}, B ${tied(JB)}`);
  console.log(`errors A ${a.errors.length} B ${b.errors.length}; writes attempted A ${a.blocked} B ${b.blocked}`);
  process.exitCode = (a.errors.length || b.errors.length || a.blocked || b.blocked) ? 1 : 0;
})().catch(e => { console.error('COMPARE FAIL', e); process.exit(2); });
