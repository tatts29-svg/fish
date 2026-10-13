/* Author: Andrew Fisher. Actual public release verification; GET-only, no simulated saves. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
if (process.env.PAGE || process.env.BASE_PAGE) throw new Error('Public verification requires PAGE and BASE_PAGE unset');
const expected = 'cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105';
const publicResponses = [], rejectedMethods = [], curl = require('../toolchain/harness/curlfetch'), liveFetch = curl.curlFetch;
// Observe the actual navigation response before the harness fulfils it. No
// response fields or bytes are changed, and no local candidate is supplied.
curl.curlFetch = async function (url, headers, method, body) {
 if (method !== 'GET') { rejectedMethods.push(method); throw new Error('Public verifier permits GET only'); }
 const response = await liveFetch(url, headers, method, body);
 if (/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url)) publicResponses.push({url, status: response.status, bytes: response.body.length, sha256: crypto.createHash('sha256').update(response.body).digest('hex')});
 return response;
};
const {open} = require('../toolchain/harness/open_page');
(async () => {
 let h, timer;
 try {
  h = await open({hash: '#costs', W: 1440, H: 1000});
  const navigation = publicResponses.at(-1);
  if (!navigation || navigation.status !== 200) throw new Error('Actual public page did not return HTTP 200');
  if (navigation.sha256 !== expected) throw new Error('Public page SHA mismatch: ' + navigation.sha256);
  if (h.counts.page !== 0) throw new Error('Local page substitution is forbidden');
  await h.page.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
  const result = await h.page.evaluate(() => {
   const before = JSON.stringify(S), source = JSON.stringify(ONHIRE.rows), version = SYNC.backend.readVersion821(), checks = [];
   const check = (name, pass) => checks.push({name, pass: !!pass});
   check('Explicit loading Save module installed', typeof LoadingSave1012?.createController === 'function' && typeof LoadingSave1012?.model === 'function');
   check('Native selection Save module installed', typeof SelectionSave1012?.explicitSave === 'function' && SelectionSave1012.families.length === 11);
   check('Readable controls stylesheet installed', !!document.getElementById('selection-save1012-style'));
   check('Quantity and percentage modules installed', typeof descriptionQuantity1012 === 'function' && typeof ProgressPercent1012?.ratio === 'function');
   const quantity = (line, context) => descriptionQuantity1012(line, context).quantity;
   check('Described item defaults to one', quantity({item: 'Portable building', quantity: null}) === 1);
   check('Explicit description quantity is used', quantity({item: 'Portable building'}, 'Team office qty 3') === 3);
   check('Recorded quantity overrides description', quantity({item: 'Portable building', quantity: 4}, 'Team office qty 3') === 4);
   check('Dimensions and asset numbers do not become counts', quantity({item: 'Building 6000 x 3000 mm', description: 'Asset 1189408'}) === 1);
   check('Generator size is not a quantity', quantity({item: 'Generator 200 kVA'}) === 1);
   check('Explicit multiplied panel quantity is used', quantity({item: 'Pee Panel', description: '6 × Pee Panel'}) === 6);
   check('Explicit zero remains zero', quantity({item: 'FWF', quantity: 0}) === 0);
   check('Invalid recorded quantity remains unknown', quantity({item: 'FWF', quantity: -3}) === null);
   check('Missing description does not invent an item', quantity({quantity: null}) === null);
   const P = ProgressPercent1012;
   check('89.9 percent retains its precision', P.text(P.ratio(899, 1000)) === '89.9');
   check('Almost complete never displays 100 percent', P.text(P.ratio(19999, 20000)) === '99.99' && !P.complete(19999, 20000));
   check('Exact completion displays 100 percent', P.text(P.ratio(20000, 20000)) === '100' && P.complete(20000, 20000));
   check('Unknown and zero scope remain unavailable', P.ratio(null, 10) === null && P.ratio(1, 0) === null && P.text(null) === '—');
   check('Averaging cannot promote incomplete scope', P.mean([100, 100, 100, 100, 100, 100, 100 - Number.EPSILON * 100]) < 100);
   check('Conservative percentage preserves exact hundredths', P.display(P.ratio(113, 10000), true) === 1.13);
   holdAssets(() => {
    const I = inventory();
    for (const ref of ['WC70', 'WC72']) {
     const a = assetOf(ref), physical = a ? gcModel925(a).rows.filter(u => u.physical && u.id && u.item === 'FWF') : [];
     const row = I.list.find(r => r.item === 'FWF' && r.refs[ref])?.refs[ref];
     check(ref + ' inventory uses its confirmed Event Portables units', physical.length > 0 && physical.every(u => u.owner === 'event-portables') && row?.on === physical.length && row?.sub === physical.length && row?.coates === 0);
    }
   });
   check('Pure checks leave shared record unchanged', JSON.stringify(S) === before);
   check('Pure checks leave original contracts unchanged', JSON.stringify(ONHIRE.rows) === source);
   check('Pure checks leave native version unchanged', SYNC.backend.readVersion821() === version);
   return {nativeVersion: version, checks};
  });
  const cdp = await h.page.context().newCDPSession(h.page);
  let expired = false;
  timer = setTimeout(() => { expired = true; cdp.send('Runtime.terminateExecution').catch(() => {}); }, 15000);
  const financial = await h.page.evaluate(() => {
   const before = JSON.stringify(S), raw = JSON.stringify(ONHIRE.rows), version = SYNC.backend.readVersion821(), checks = [];
   const check = (name, pass) => checks.push({name, pass: !!pass});
   check('Standalone read starts outside render hold', !ASSETS_HELD);
   check('Bounded financial scope remains installed', FinancialScopes1011.entries.includes('fh866Model'));
   let assetBuilds = 0; const indexes = {}, previousBuild = buildAllAssets, previousMemo = heldMemo;
   buildAllAssets = function () { assetBuilds++; return previousBuild.apply(this, arguments); };
   heldMemo = function (key, read) { return previousMemo(key, () => { if (['contractReferenceBranches1010', 'currentFwfOwners1010'].includes(key)) indexes[key] = (indexes[key] || 0) + 1; return read(); }); };
   let elapsed, standaloneBuilds, standaloneIndexes;
   try {
    sharedCache975(); const started = performance.now(), standalone = fh866Model(); elapsed = performance.now() - started;
    standaloneBuilds = assetBuilds; standaloneIndexes = {...indexes};
    check('Standalone hold clears on return', !ASSETS_HELD && HELD_MEMO.size === 0);
    sharedCache975(); const held = holdAssets(() => fh866Model());
    check('Standalone financial values equal held read', JSON.stringify(standalone) === JSON.stringify(held));
    check('Standalone call builds one asset snapshot', standaloneBuilds === 1);
    check('Each ownership and reference index builds once', ['contractReferenceBranches1010', 'currentFwfOwners1010'].every(key => standaloneIndexes[key] === 1));
    check('Standalone financial call completes within 15 seconds', elapsed < 15000);
    check('Public financial reconciliation controls pass', Object.values(standalone.invCheck).every(Boolean) && standalone.costCheck && standalone.peopleCheck);
   } finally { buildAllAssets = previousBuild; heldMemo = previousMemo; sharedCache975(); }
   check('Financial read leaves shared record unchanged', JSON.stringify(S) === before);
   check('Financial read leaves source contracts unchanged', JSON.stringify(ONHIRE.rows) === raw);
   check('Financial read leaves native version unchanged', SYNC.backend.readVersion821() === version);
   check('Final asset scope is empty', !ASSETS_HELD && HELD_MEMO.size === 0);
   return {nativeVersion: version, milliseconds: Math.round(elapsed), assetBuilds: standaloneBuilds, indexes: standaloneIndexes, checks};
  });
  clearTimeout(timer); timer = null;
  if (expired) throw new Error('Public financial evaluation exceeded 15 seconds');
  result.checks.push(...financial.checks);
  result.financial = {milliseconds: financial.milliseconds, assetBuilds: financial.assetBuilds, indexes: financial.indexes};
  result.checks.push({name: 'Same native record throughout checks', pass: result.nativeVersion === financial.nativeVersion});
  const out = process.env.OUT || '/workspace/private-gc5001012-public'; fs.mkdirSync(out, {recursive: true});
  await h.page.setViewportSize({width: 390, height: 844});
  await h.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await h.page.screenshot({path: path.join(out, 'public-costs-phone-viewport.png'), fullPage: false});
  result.checks.push({name: 'No local page substitution', pass: h.counts.page === 0});
  result.checks.push({name: 'No non-GET requests reached network', pass: rejectedMethods.length === 0});
  result.checks.push({name: 'No browser errors or operational write attempts', pass: !h.errors.length && h.counts.blocked === 0});
  Object.assign(result, {author: 'Andrew Fisher', at: new Date().toISOString(), sha256: navigation.sha256, expectedSha256: expected, bytes: navigation.bytes, navigationResponses: publicResponses, errors: h.errors, requests: h.counts, rejectedMethods, actualPublic: true, screenshot: 'public-costs-phone-viewport.png'});
  fs.writeFileSync(path.join(out, 'public-verification1012.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  if (result.checks.some(c => !c.pass)) process.exitCode = 1;
 } finally { clearTimeout(timer); if (h) await h.browser.close(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
