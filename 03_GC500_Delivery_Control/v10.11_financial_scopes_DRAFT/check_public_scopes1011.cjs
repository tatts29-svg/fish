/* Author: Andrew Fisher. Actual public bytes and standalone financial read; GET-only. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
if (process.env.PAGE || process.env.BASE_PAGE) throw new Error('Public scope check requires PAGE and BASE_PAGE unset');
const {open} = require('../toolchain/harness/open_page');
const expected = 'a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557';
(async () => {
 let h, timer;
 try {
  h = await open({hash: '#costs', W: 1440, H: 1000});
  // Obtain the body of the exact navigation the browser will evaluate. No local
  // page file is accepted and the harness excludes this address from caching.
  const response = await h.page.reload({waitUntil: 'load', timeout: 180000});
  if (!response || response.status() !== 200) throw new Error('Public page did not return HTTP 200');
  const body = await response.body(), sha256 = crypto.createHash('sha256').update(body).digest('hex');
  if (sha256 !== expected) throw new Error('Public page SHA mismatch: ' + sha256);
  await h.page.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
  const cdp = await h.page.context().newCDPSession(h.page);
  let expired = false;
  timer = setTimeout(() => { expired = true; cdp.send('Runtime.terminateExecution').catch(() => {}); }, 15000);
  const result = await h.page.evaluate(() => {
   const state = JSON.stringify(S), raw = JSON.stringify(ONHIRE.rows), version = SYNC.backend.readVersion821(), checks = [];
   const check = (name, pass) => checks.push({name, pass: !!pass});
   check('Read starts outside render hold', !ASSETS_HELD);
   check('Published scope module installed', FinancialScopes1011.entries.includes('fh866Model'));
   let assetBuilds = 0; const indexes = {}, previousBuild = buildAllAssets, previousMemo = heldMemo;
   buildAllAssets = function () { assetBuilds++; return previousBuild.apply(this, arguments); };
   heldMemo = function (key, read) { return previousMemo(key, () => { if (['contractReferenceBranches1010', 'currentFwfOwners1010'].includes(key)) indexes[key] = (indexes[key] || 0) + 1; return read(); }); };
   let standalone, held, elapsed, standaloneBuilds, standaloneIndexes;
   try {
    sharedCache975(); const started = performance.now(); standalone = fh866Model(); elapsed = performance.now() - started;
    standaloneBuilds = assetBuilds; standaloneIndexes = {...indexes};
    check('Standalone hold clears on return', !ASSETS_HELD && HELD_MEMO.size === 0);
    sharedCache975(); held = holdAssets(() => fh866Model());
    check('Standalone financial values equal explicit held read', JSON.stringify(standalone) === JSON.stringify(held));
    check('Each standalone read builds one asset snapshot', standaloneBuilds === 1);
    check('Each ownership/reference index builds once', Object.values(standaloneIndexes).every(n => n === 1));
    check('Standalone read completes within 15 seconds', elapsed < 15000);
    check('Financial reconciliation controls pass', Object.values(standalone.invCheck).every(Boolean) && standalone.costCheck && standalone.peopleCheck);
   } finally { buildAllAssets = previousBuild; heldMemo = previousMemo; sharedCache975(); }
   check('Shared record unchanged', JSON.stringify(S) === state);
   check('Original contract source unchanged', JSON.stringify(ONHIRE.rows) === raw);
   check('Native version unchanged', SYNC.backend.readVersion821() === version);
   check('Final scope is empty', !ASSETS_HELD && HELD_MEMO.size === 0);
   return {nativeVersion: version, milliseconds: Math.round(elapsed), assetBuilds: standaloneBuilds, indexes: standaloneIndexes, invoiceTotals: standalone.invTotal, checks};
  });
  clearTimeout(timer); timer = null;
  if (expired) throw new Error('Public financial check exceeded 15 seconds');
  result.checks.push({name: 'No local page substitution', pass: h.counts.page === 0});
  result.checks.push({name: 'No browser errors or operational write attempts', pass: !h.errors.length && h.counts.blocked === 0});
  Object.assign(result, {author: 'Andrew Fisher', at: new Date().toISOString(), sha256, bytes: body.length, errors: h.errors, requests: h.counts, actualPublic: true});
  const out = process.env.OUT || '/workspace/private-gc5001011-public'; fs.mkdirSync(out, {recursive: true});
  fs.writeFileSync(path.join(out, 'public-scope-performance.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  if (result.checks.some(c => !c.pass)) process.exitCode = 1;
 } finally { clearTimeout(timer); if (h) await h.browser.close(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
