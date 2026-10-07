// Author: Andrew Fisher. v8.92 leaves every money figure identical: the P&L summary, Costs to job end, the Finance handover, the
// business's lines, the by-branch rows, the Transport view's totals, the Rehire by branch card and every reconciliation tie-out are
// read from the base page and from the candidate, as JSON, and must be the same string. One browser at a time; read-only.
//   BASE=<base page> PAGE=<candidate page> [MOB=1] node test_money892.cjs
const fs = require('fs'), {open} = require('../../toolchain/harness/open_page');
const figures = async (pageFile, MOB) => { const s = await open({pageFile, W: MOB ? 390 : 1440, H: MOB ? 844 : 900, mobile: MOB, dpr: MOB ? 2 : 1}); try { const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof transport888Core === 'function', null, {timeout: 180000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0 && !!document.getElementById('recon888'); } catch (e) { return false; } }, null, {timeout: 60000}); await p.waitForTimeout(800);
  const J = await p.evaluate(() => holdAssets(() => { const M = moneySummary(), X = cj764Model(), H = fh866Model(), P = pl770Model(), B = pl752Rows(), V = transport888View(), R = recon888Model(), RH = typeof rh766Model === 'function' ? rh766Model() : null, LP = labourPlan();
    const strip = o => JSON.parse(JSON.stringify(o, (k, v) => (k === 'asAt' || k === 'at' || k === 'now' || k === 'generated') ? undefined : v));
    return JSON.stringify({M: strip(M), X: strip(X), H: strip(H), P: strip(P), B: strip(B), V: {tot: V.tot, byBranch: V.byBranch, byCarrier: V.byCarrier, revenueTotal: V.revenueTotal, provisionalTotal: V.provisionalTotal, lines: V.lines.length}, R: R.ties.map(t => ({what: t.what, ok: t.ok, parts: t.parts})), RH: strip(RH), LP: {all: LP.all}}); }));
  const version = await p.evaluate(() => (document.getElementById('footL') || {}).textContent || ''), has892 = await p.evaluate(() => !!document.getElementById('aplus892-script') && !!document.getElementById('aplus892-style'));
  return {J, version, has892, errors: s.errors, blocked: s.counts.blocked}; } finally { await s.browser.close(); } };
(async () => { const MOB = !!process.env.MOB; const a = await figures(process.env.BASE, MOB); const b = await figures(process.env.PAGE, MOB);
  /* the figures: every number in the models, in order, must be the same number; the words may differ only by the v8.92 vocabulary
     (sub-hired, Costs & P&L, Customer rates & charges, oversized, Rate 1, the Rehire stream names, the Equipment tab) */
  const nums = s => (s.match(/-?\d+(?:\.\d+)?/g) || []); const na = nums(a.J), nb = nums(b.J);
  const sameNums = na.length === nb.length && na.every((x, i) => x === nb[i]);
  const words = s => s.replace(/\bsub-hired\b/gi, m => m[0] === 'S' ? 'Subhired' : 'subhired').replace(/\bsub-hire\b/gi, 'subhired').replace(/Costs & P&L/g, 'Costs & charges').replace(/Customer rates & charges/g, 'Pricing tab').replace(/\boversized\b/gi, m => m[0] === 'O' ? 'Oversize' : 'oversize').replace(/\bRate ([123])\b/g, 'rate $1').replace(/— Rehire\b/g, '— subhired').replace(/Equipment tab/g, 'Register tab');
  const same = words(a.J) === words(b.J); const R = [];
  const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  ok('every figure on Costs & P&L is identical to the base (' + na.length + ' numbers compared, ' + Math.round(a.J.length / 1024) + ' KB of models)', sameNums, sameNums ? {} : {numbers: [na.length, nb.length], firstDiff: na.findIndex((x, i) => x !== nb[i])});
  ok('the models read the same apart from the v8.92 words', same, same ? {} : {diffAt: [...words(a.J)].findIndex((c, i) => c !== words(b.J)[i])});
  ok('the candidate carries v8.92 (its style and script) and the base does not', b.has892 && !a.has892, {base: a.has892, cand: b.has892, baseFooter: a.version.slice(-30), candFooter: b.version.slice(-30)});
  ok('no page errors on either', a.errors.length === 0 && b.errors.length === 0, {base: a.errors.slice(0, 3), cand: b.errors.slice(0, 3)});
  ok('no writes attempted', a.blocked === 0 && b.blocked === 0, {});
  if (!same) { const A = words(a.J), B = words(b.J); const i = [...A].findIndex((c, k) => c !== B[k]); console.log('first difference near:', A.slice(Math.max(0, i - 160), i + 160).replace(/\$\s?[0-9][0-9,]*(\.[0-9]+)?/g, '$—'), '\n   vs', B.slice(Math.max(0, i - 160), i + 160).replace(/\$\s?[0-9][0-9,]*(\.[0-9]+)?/g, '$—')); }
  R.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 300)}`));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'laptop'}: ${R.length - fails}/${R.length}`); process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error('TEST FAIL', e); process.exit(2); });
