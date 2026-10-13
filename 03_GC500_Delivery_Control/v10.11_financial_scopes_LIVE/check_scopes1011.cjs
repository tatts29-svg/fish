/* Author: Andrew Fisher. GET-only parity and bounded standalone financial performance. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {open} = require('../toolchain/harness/open_page');
const source = fs.readFileSync(path.join(__dirname, 'financial_scopes1011.js'), 'utf8');
const out = process.env.OUT || '/workspace/private-gc500-financial-scopes1011';
const checks = [], timings = [];
function check(name, value) { checks.push({name, pass: !!value}); if (!value) throw new Error(name); }
(async () => {
 let h;
 try {
  h = await open({pageFile: process.env.BASE_PAGE, hash: '#costs', W: 1440, H: 1000});
  await h.page.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
  let cdp = await h.page.context().newCDPSession(h.page);
  async function bounded(label, fn, arg) {
   let timer, expired = false;
   try {
    timer = setTimeout(() => { expired = true; cdp.send('Runtime.terminateExecution').catch(() => {}); }, 15000);
    const r = await h.page.evaluate(fn, arg);
    if (expired) throw new Error(label + ' exceeded 15 seconds');
    return r;
   } finally { clearTimeout(timer); }
  }
  const instrument = () => {
   const expected = new Map(), stringify = value => JSON.stringify(value, (_, v) => v instanceof Map ? {map: [...v]} : v instanceof Set ? {set: [...v]} : v);
   const state = JSON.stringify(S), raw = JSON.stringify(ONHIRE.rows), version = SYNC.backend.readVersion821();
   const stats = {assets: 0, indexes: {}};
   const originalBuild = buildAllAssets, originalMemo = heldMemo;
   buildAllAssets = function () { stats.assets++; return originalBuild.apply(this, arguments); };
   heldMemo = function (key, read) { return originalMemo(key, () => { if (['contractReferenceBranches1010', 'currentFwfOwners1010'].includes(key)) stats.indexes[key] = (stats.indexes[key] || 0) + 1; return read(); }); };
   function args(name) {
    if (name === 'branchFinancial978') return holdAssets(() => [pl752Rows(), moneySummary()]);
    if (name === 'acc761Model') return ['2026-10'];
    if (name === 'branchRollup') return [todayIso()];
    if (name === 'contractFigures') return [ONHIRE_ROWS];
    if (['generatorBranch1004', 'finance928ContractOwner'].includes(name)) return [ONHIRE_ROWS.find(r => String(r.rental_contract) === '9968955' && Number(r.line) === 102)];
    return [];
   }
   window.scopeAudit1011 = {expected, stringify, state, raw, version, stats, args,
    reset() { sharedCache975(); stats.assets = 0; stats.indexes = {}; },
    restored() { return JSON.stringify(S) === state && JSON.stringify(ONHIRE.rows) === raw && SYNC.backend.readVersion821() === version; }};
   return {version, outsideHold: !ASSETS_HELD, sourceUntouched: JSON.stringify(ONHIRE.rows) === raw};
  };
  const ready = await bounded('instrumentation', instrument);
  check('Baseline starts outside render scope', ready.outsideHold);
  const names = require('./financial_scopes1011').entries;
  for (const name of names) {
   const r = await bounded('Baseline ' + name, name => {
    const a = scopeAudit1011; a.reset(); const input = a.args(name); a.reset(); const t = performance.now();
    const value = holdAssets(() => window[name](...input)); const elapsed = performance.now() - t;
    a.expected.set(name, a.stringify(value));
    return {name, baselineMs: Math.round(elapsed), cleaned: !ASSETS_HELD && HELD_MEMO.size === 0, assets: a.stats.assets, indexes: {...a.stats.indexes}};
   }, name);
   timings.push(r); check('Baseline cleanup ' + name, r.cleaned);
  }
  const expected = await h.page.evaluate(() => [...scopeAudit1011.expected]);
  await h.browser.close(); h = null;
  h = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000});
  await h.page.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
  cdp = await h.page.context().newCDPSession(h.page);
  const candidateReady = await bounded('candidate instrumentation', instrument);
  check('Same native version in exact candidate', ready.version === candidateReady.version);
  await h.page.evaluate(expected => { scopeAudit1011.expected = new Map(expected); }, expected);
  for (const name of names) {
   const r = await bounded('Standalone ' + name, name => {
    const a = scopeAudit1011; a.reset(); const input = a.args(name); a.reset(); const t = performance.now();
    const value = window[name](...input), elapsed = performance.now() - t;
    return {name, standaloneMs: Math.round(elapsed), parity: a.stringify(value) === a.expected.get(name), cleaned: !ASSETS_HELD && HELD_MEMO.size === 0, assets: a.stats.assets, indexes: {...a.stats.indexes}, untouched: a.restored()};
   }, name);
   Object.assign(timings.find(t => t.name === name), r);
   check('Exact model parity ' + name, r.parity); check('Fresh standalone cleanup ' + name, r.cleaned);
   check('One asset snapshot ' + name, r.assets === 1); check('Each index built at most once ' + name, Object.values(r.indexes).every(n => n <= 1));
   check('No record/source changes ' + name, r.untouched);
   console.log(JSON.stringify({entry: name, milliseconds: r.standaloneMs, indexes: r.indexes}));
  }
  const edit = await bounded('Freshness and nested scopes', () => {
   const a = scopeAudit1011, row = ONHIRE_ROWS.find(r => String(r.rental_contract) === '9968955' && Number(r.line) === 102), results = {};
   function restore() { const state = JSON.parse(a.state); for (const key of Object.keys(S)) delete S[key]; Object.assign(S, state); sharedCache975(); }
   try {
    a.reset(); const before = generatorBranch1004(row); S.branch.WC09 = 'NVAC'; sharedCache975();
    results.nextCallSeesEdit = generatorBranch1004(row) === 'NVAC' && before !== 'NVAC';
    restore(); a.reset();
    results.nested = holdAssets(() => { const first = currentFwfOwners1010(); const second = currentFwfOwners1010(); const one = generatorBranch1004(row); S.branch.WC09 = 'NVAC'; sharedCache975(); const two = generatorBranch1004(row); return {sameIndex: first === second, before: one, after: two}; });
    results.savedInsideHoldFresh = results.nested.before !== 'NVAC' && results.nested.after === 'NVAC';
    results.savedInsideHoldCleaned = !ASSETS_HELD && HELD_MEMO.size === 0;
    restore(); a.reset();
    const error = new Error('expected scope audit throw'), originalSelect = ItemIdentity979.select;
    let caught;
    ItemIdentity979.select = () => { throw error; };
    try { contractReferenceBranches1010(); } catch (e) { caught = e; } finally { ItemIdentity979.select = originalSelect; }
    results.throwIdentityPreserved = caught === error; results.throwCleaned = !ASSETS_HELD && HELD_MEMO.size === 0;
    a.reset(); results.recoveryAfterThrow = generatorBranch1004(row) === before;
    restore(); const moneyBefore = moneySummary().charge.total;
    S.lineRates[Pricing1010.hireKey] = '500'; sharedCache975();
    results.priceEditFresh = Math.round((moneySummary().charge.total - moneyBefore) * 100) === -103301;
    restore(); results.priceResetFresh = moneySummary().charge.total === moneyBefore;
    S.supplied.WC09.items.find(i => i.asked === 'Pee Panel').qty_supplied = 4; sharedCache975();
    results.quantityEditFresh = onsiteComplete979().rows.find(r => r.ref === 'WC09' && r.item === 'Pee Panel').hire === 2688.67;
    restore(); results.quantityResetFresh = onsiteComplete979().rows.find(r => r.ref === 'WC09' && r.item === 'Pee Panel').hire === 4033.01;
   } finally { restore(); }
   results.untouched = a.restored(); results.cleaned = !ASSETS_HELD && HELD_MEMO.size === 0;
   return results;
  });
  for (const key of ['nextCallSeesEdit', 'savedInsideHoldFresh', 'savedInsideHoldCleaned', 'throwIdentityPreserved', 'throwCleaned', 'recoveryAfterThrow', 'priceEditFresh', 'priceResetFresh', 'quantityEditFresh', 'quantityResetFresh', 'untouched', 'cleaned']) check(key, edit[key]);
  check('Nested models reuse index', edit.nested.sameIndex);
  check('No browser errors or write attempts', !h.errors.length && !h.counts.blocked);
  const result = {author: 'Andrew Fisher', baseSha256: crypto.createHash('sha256').update(fs.readFileSync(process.env.BASE_PAGE)).digest('hex'), candidateSha256: crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'), moduleSha256: crypto.createHash('sha256').update(source).digest('hex'), nativeVersion: ready.version, checks, timings, edits: edit, errors: h.errors, requests: h.counts};
  fs.mkdirSync(out, {recursive: true}); fs.writeFileSync(path.join(out, 'scope-performance.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({checks: checks.length, pass: checks.every(c => c.pass), maxStandaloneMs: Math.max(...timings.map(r => r.standaloneMs)), nativeVersion: ready.version, errors: h.errors, requests: h.counts}));
 } finally { if (h) await h.browser.close(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
