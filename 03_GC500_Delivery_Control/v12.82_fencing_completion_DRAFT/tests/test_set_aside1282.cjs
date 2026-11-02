// Author: Andrew Fisher. Synthetic set-aside fixture, never a record action.
// PAGE=<held candidate> STATE=<private original frozen state> EVIDENCE=<private folder>
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const harness = path.resolve(__dirname, '../../toolchain/harness');
const fixture = JSON.parse(fs.readFileSync(process.env.STATE, 'utf8'));
const id = 'F-AF-0082', rec = fixture.docs.fenceDockets[id];
assert.equal(rec.docket_no, '36641');
// The native action removes the active list member, keeps it under aside and
// tombstones its ID. This changes only a private GET fixture served to Chromium.
delete fixture.docs.fenceDockets[id];
fixture.docs.aside[id] = {coll:'fenceDockets', rec, at:'2026-11-02T08:47:01.000Z', by:'Synthetic test only'};
fixture.docs.deleted[id] = '2026-11-02T08:47:01.000Z';
const fetcher = require(harness + '/curlfetch'), native = fetcher.curlFetch;
fetcher.curlFetch = async (url, headers, method, body) => {
 const u = new URL(url);
 if (u.origin === 'https://gc500-production.up.railway.app' && ['/api/state', '/api/version'].includes(u.pathname)) {
  const data = u.pathname === '/api/state' ? fixture : {version:fixture.version, updated:fixture.updated, level:'view'};
  return {status:200, headers:{'content-type':'application/json'}, body:Buffer.from(JSON.stringify(data))};
 }
 return native(url, headers, method, body);
};
const {open} = require(harness + '/open_page');
(async () => {
 const h = await open({pageFile:process.env.PAGE});
 try {
  await h.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && photoIndex().state === 'ready', null, {timeout:120000});
  const result = await h.page.evaluate(() => {
   const check = (condition, why) => { if (!condition) throw Error(why); };
   const records = JSON.stringify(allDockets()), cat = DATA.fence_ccb_review847, rows = cat.rows;
   check(!allDockets().some(r => r.docket_no === '36641'), 'Set-aside docket still active');
   const a = fenceOverall853('2026-11-02');
   cat.rows = rows.filter(r => r.docket_no !== '36641');
   const b = fenceOverall853('2026-11-02');
   cat.rows = rows;
   check(JSON.stringify(a) === JSON.stringify(b), 'Review changes the model after the docket is set aside');
   check(a.recorded === 20797.5, 'Set-aside work is still counted');
   check(a.pct.min === 100 && a.pct.max === 100 && a.allGreen, 'The existing completion rule did not apply without this docket');
   check(records === JSON.stringify(allDockets()), 'Test altered active records');
   return {synthetic:true, checks:5, withoutDocket:{total:a.total, recorded:a.recorded, pct:a.pct, left:a.left, allGreen:a.allGreen}, candidateAndOriginalModelIdentical:true};
  });
  assert.deepEqual(h.errors, []); assert.equal(h.counts.blocked, 0);
  if (process.env.EVIDENCE) fs.writeFileSync(path.join(process.env.EVIDENCE, 'test-set-aside.json'), JSON.stringify({...result,errors:h.errors,counts:h.counts},null,2));
  console.log(JSON.stringify({pass:7,synthetic:true,candidateAndOriginalModelIdentical:result.candidateAndOriginalModelIdentical,errors:h.errors.length,writes:h.counts.blocked}));
 } finally { await h.browser.close(); }
})().catch(e=>{console.error(e.stack);process.exit(1);});
