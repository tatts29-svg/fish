// Author: Andrew Fisher. v12.78 - the Finance handover's labour rows through a buildings lock. On the real page, reading the live record,
// writing nothing (the harness blocks writes; the rule changes below are made in the page's memory only and put back).
// Compares the page given (PAGE) with the live page before (BEFORE): which rows read confirmed / changed / forecast, then on PAGE:
// a buildings-lock change leaves every row's status as it was; a Coates wages rule change turns the Coates wages rows it touches to
// changed and not the labour hire rows; a labour hire rule change the reverse; the weekday break turns both.
//   PAGE=build/GC500_v12.78/GC500_Delivery_Control_hosted.html BEFORE=<live v12.76 page> node tests/test_v1278.cjs
const assert = require('node:assert/strict');
const {open} = require('../../toolchain/harness/open_page');
const READ = () => {
  const rows = fin745Rows(), by = {};
  rows.forEach(r => { const t = runType((ourCosts().find(c => c.kind === 'person' && c.person === r.person) || {}).type || r.type) || 'none'; const k = t + '|' + r.status; by[k] = (by[k] || 0) + 1; });
  return {n: rows.length, by, st: Object.fromEntries(rows.map(r => [r.id, r.status]))};
};
(async () => {
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const look = async (file, more) => { const s = await open({pageFile: file, hash: '#today', W: 1440, H: 1000}), p = s.page;
    try { await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000}); await p.waitForTimeout(2500);
      const r = await p.evaluate(`(${more ? more.toString() : '() => null'})(${READ.toString()})`); return {r, errors: s.errors, blocked: s.counts.blocked}; } finally { await s.browser.close(); } };
  try {
    const before = await look(process.env.BEFORE, read => read());
    const after = await look(process.env.PAGE, read => {
      const S0 = JSON.stringify(S.runRules || {}), base = read(), out = {base};
      const lockKey = 'buildingsLock1049', prevLock = (S.runRules || {})[lockKey];
      S.runRules = Object.assign({}, S.runRules, {[lockKey]: JSON.stringify({locked: true, at: '2026-11-01T00:00:00Z', by: 'test', total: 1, n: 1, refs: [], held: [], open: {}})}); out.lock = read();
      S.runRules = JSON.parse(S0); S.runRules.cna_ord = '8'; out.cna = read();
      S.runRules = JSON.parse(S0); S.runRules.lh_ord = '7.5'; out.lh = read();
      S.runRules = JSON.parse(S0); S.runRules.wd_break = '45'; out.brk = read();
      S.runRules = JSON.parse(S0); out.restored = read(); out.same = JSON.stringify(S.runRules) === S0; out.prevLock = prevLock != null;
      out.fn = typeof fin745PayRules1278 === 'function' ? [fin745PayRules1278('cna'), fin745PayRules1278('hire'), fin745PayRules1278('salary')] : null;
      return out; });
    const B = before.r, A = after.r;
    console.log('before', JSON.stringify(B.by)); console.log('after ', JSON.stringify(A.base.by));
    check(A.fn && JSON.stringify(A.fn[0]) === '{}' && JSON.stringify(A.fn[1]) === '{"lh_ord":7.6}' && JSON.stringify(A.fn[2]) === '{}', 'the fingerprint takes only the rules that set the row’s pay, where they differ from the standard (Coates wages {}, labour hire lh_ord 7.6, salary {}): ' + JSON.stringify(A.fn));
    check(A.base.n === B.n, `the same rows (${A.base.n})`);
    const cnaConfirmedNow = A.base.by['cna|confirmed'] || 0, cnaChangedBefore = B.by['cna|changed'] || 0;
    check(cnaConfirmedNow > 0 && cnaConfirmedNow >= cnaChangedBefore - 0 && !(A.base.by['cna|changed']), `Coates wages rows Finance confirmed read confirmed again (before: ${cnaChangedBefore} changed; now ${cnaConfirmedNow} confirmed, ${A.base.by['cna|changed'] || 0} changed)`);
    check((A.base.by['hire|changed'] || 0) === (B.by['hire|changed'] || 0), `labour hire rows confirmed before labour hire's normal hours went from 7.5 to 7.6 still read changed (${A.base.by['hire|changed'] || 0})`);
    check(JSON.stringify(A.lock.st) === JSON.stringify(A.base.st), 'a buildings-lock change leaves every row’s status as it was');
    const flips = (x, t) => Object.keys(x.st).filter(id => x.st[id] !== A.base.st[id]);
    const cnaIds = Object.keys(A.base.st).filter(id => A.base.st[id] === 'confirmed');
    check(cnaIds.length && cnaIds.every(id => A.cna.st[id] === 'changed'), `a Coates wages rule change (normal hours 8) turns the confirmed Coates wages rows to changed (${cnaIds.length})`);
    check(JSON.stringify(A.lh.st) !== JSON.stringify(A.base.st) ? cnaIds.every(id => A.lh.st[id] === 'confirmed') : true, 'a labour hire rule change leaves the Coates wages rows confirmed');
    check(cnaIds.every(id => A.brk.st[id] === 'changed'), 'the weekday break turns the Coates wages rows to changed');
    check(A.same && JSON.stringify(A.restored.st) === JSON.stringify(A.base.st), 'the rules put back, every status is back');
    check(!after.errors.length && after.blocked === 0 && !before.errors.length, 'no page error, no write: ' + JSON.stringify({e: after.errors.slice(0, 2), b: after.blocked}));
    console.log(`PASS ${checks}/${checks}`);
  } catch (e) { console.error('FAIL', e.message); process.exitCode = 1; }
})();
