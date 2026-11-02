// Author: Andrew Fisher. Source guards and shared fencing completion, read only.
// PAGE=<candidate> STATE=<optional frozen /api/state JSON> EVIDENCE=<private folder>
// MOB=1 uses a phone. The shared harness blocks every operational write.
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const harness = path.resolve(__dirname, '../../toolchain/harness');
if (process.env.STATE) {
 const fetcher = require(harness + '/curlfetch'), native = fetcher.curlFetch;
 const snapshot = JSON.parse(fs.readFileSync(process.env.STATE, 'utf8'));
 fetcher.curlFetch = async (url, headers, method, body) => {
  const u = new URL(url);
  if (u.origin === 'https://gc500-production.up.railway.app' && ['/api/state', '/api/version'].includes(u.pathname)) {
   const data = u.pathname === '/api/state' ? snapshot : {version: snapshot.version, updated: snapshot.updated, level: 'view'};
   return {status: 200, headers: {'content-type': 'application/json'}, body: Buffer.from(JSON.stringify(data))};
  }
  return native(url, headers, method, body);
 };
}
const {open} = require(harness + '/open_page');
(async () => {
 const mobile = !!process.env.MOB;
 const h = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, hash: '#today'});
 const consoleErrors = [];
 h.page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
 try {
  await h.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && photoIndex().state === 'ready', null, {timeout: 120000});
  const result = await h.page.evaluate(() => {
   const copy = x => JSON.parse(JSON.stringify(x)), checks = [];
   const check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
   const catalogue = DATA.fence_ccb_review847;
   const rows = catalogue.rows, sources = catalogue.sources;
   const added = rows.filter(r => r.docket_no === '36641');
   check('one reviewed docket', added.length === 1);
   const record = allDockets().find(r => r.docket_no === '36641');
   const files = photoIndex().files;
   const overall = day => { const f = todayFencingSummary848(day), w = todayWorkSummary848(day, undefined, undefined, f); return {fencing: f, work: w, overall: fenceOverall853(day, w, f)}; };
   const financial = () => JSON.stringify({pack: PLF1272.data, packSHA: PLF1272.sha, money: moneySummary(), fence: fenceDerived(), forecast: cj764Fencing()});
   const docketBytes = JSON.stringify(allDockets()), sourceBytes = JSON.stringify(DATA.fencing), moneyBefore = financial();
   const normal = overall('2026-11-02'), n = normal.overall;
   check('review confirms only current Event allocation', fenceCcbReview847(record).state === 'confirmed' && fenceCcbReview847(record).confirmedType === 'ccb_event');
   check('no unresolved CCB classifications on current build', normal.fencing.classification.pendingCount === 0 && !n.classificationPending);
   check('native completion rule restores 100% and all lights', n.pct.min === 100 && n.pct.max === 100 && n.allGreen === true && !!n.buildComplete1181 && !n.provisional);
   check('closed docket basis restored without inventing work', n.total === 20098.5 && n.credited.min === 20098.5 && n.credited.max === 20098.5 && n.left.min === 0 && n.left.max === 0 && n.recorded === 20822.5);
   const demarc = normal.work.fencingRows.find(r => r.id === 'ccb_demarc');
   check('original programme gap retained in completion evidence', demarc.closedBuild1181.programme === 5205 && demarc.closedBuild1181.left === 142.5 && demarc.done === 5062.5 && demarc.total === 5062.5);
   check('Event raw total remains recorded 2220', normal.fencing.classification.rawByType.ccb_event === 2220 && normal.fencing.classification.confirmedByType.ccb_event === 2220);
   const historical = overall('2026-10-20');
   check('before race weekend is not closed by this review', !historical.overall.buildComplete1181 && !historical.work.closedBuild1181);
   catalogue.rows = rows.filter(r => r.docket_no !== '36641');
   const baseline = overall('2026-11-02'), b = baseline.overall;
   check('baseline reproduces reported range from one pending docket', baseline.fencing.classification.pendingCount === 1 && baseline.fencing.classification.pendingMetres === 25 && b.total === 20241 && b.credited.min === 20098.5 && b.credited.max === 20123.5 && b.left.min === 117.5 && b.left.max === 142.5 && !b.allGreen);
   check('historical day before the new docket is identical', JSON.stringify(overall('2026-10-20')) === JSON.stringify(historical));
   check('raw overall and gate numbers unchanged', b.recorded === n.recorded && JSON.stringify(b.gates) === JSON.stringify(n.gates));
   check('all operational dockets and source programme unchanged', docketBytes === JSON.stringify(allDockets()) && sourceBytes === JSON.stringify(DATA.fencing));
   check('P&L pack and working financial models unchanged', moneyBefore === financial());
   catalogue.rows = rows;
   const options = {catalogue, records: allDockets(), files};
   for (const [key, value] of Object.entries({date:'2026-10-22', location:'Changed location', quantities:{ccb_event:26}, components:{cc_barrier:11}, note:record.note + ' Changed'})) {
    const changed = {...record, [key]: value}, r = fenceCcbReview847(changed, options);
    check('changed ' + key + ' requires a fresh review', r.state === 'pending' && r.reviewState === 'stale');
   }
   for (const id of added[0].source_ids) {
    const missing = {...files}; delete missing[id];
    let r = fenceCcbReview847(record, {...options, files: missing});
    check('unavailable source stays pending: ' + id, r.state === 'pending' && r.reviewState === 'unavailable');
    const changed = {...files, [id]: {...files[id], sha256: '0'.repeat(64)}};
    r = fenceCcbReview847(record, {...options, files: changed});
    check('changed source stays pending: ' + id, r.state === 'pending' && r.reviewState === 'stale');
   }
   let r = fenceCcbReview847(record, {...options, records: allDockets().concat(record)});
   check('duplicate current docket stays pending', r.state === 'pending' && r.reviewState === 'ambiguous');
   const duplicate = copy(catalogue); duplicate.rows.push(copy(added[0]));
   r = fenceCcbReview847(record, {...options, catalogue: duplicate});
   check('duplicate review stays pending', r.state === 'pending' && r.reviewState === 'ambiguous');
   r = fenceCcbReview847({...record, id:'synthetic-new-record', docket_no:'synthetic-new-docket'}, {...options, records:[{...record, id:'synthetic-new-record', docket_no:'synthetic-new-docket'}]});
   check('unreviewed CCB never inherits this confirmation', r.state === 'pending' && r.reviewState === 'none');
   const stale = copy(added[0]); stale.expected.note += ' changed';
   catalogue.rows = rows.filter(r => r.docket_no !== '36641').concat(stale);
   check('changed fingerprint reopens native warning instead of forcing 100%', overall('2026-11-02').overall.classificationPending && !overall('2026-11-02').overall.allGreen);
   catalogue.rows = rows;
   check('tests leave reviewed sources and records untouched', JSON.stringify(allDockets()) === docketBytes && catalogue.sources === sources && financial() === moneyBefore);
   const progress = progress881Model();
   const fence = progress.rows.find(r => r.id === 'fencing');
   check('shared progress index also reads confirmed 100%', fence.min === 100 && fence.max === 100 && !fence.provisional);
   return {checks, record:SYNC.backend.readVersion821(), total:n.total, recorded:n.recorded, credited:n.credited, left:n.left, pct:n.pct, allGreen:n.allGreen, baseline:{total:b.total, credited:b.credited, left:b.left, pct:b.pct}, sourceRefs:fenceCcbReview847(record).sourceRefs};
  });
  console.log(result.checks.length + ' shared-model and guard checks passed');
  const evidence = process.env.EVIDENCE;
  if (evidence) {
   fs.mkdirSync(evidence, {recursive:true});
   fs.writeFileSync(path.join(evidence, mobile ? 'test-phone.json' : 'test-desktop.json'), JSON.stringify({...result, errors:h.errors, consoleErrors, counts:h.counts}, null, 2));
  }
  await h.page.evaluate(() => { go('today'); });
  // Today puts the finished build inside its own custom fold, outside <details>.
  const buildToggle = h.page.locator('#build1191 .b1191-btn');
  if (await buildToggle.getAttribute('aria-expanded') !== 'true') await buildToggle.click();
  await h.page.waitForSelector('[data-tw853-overall] [data-complete="true"]', {state:'attached', timeout:60000});
  await h.page.locator('#pane-today [data-tw853-overall]').evaluateAll(els => els.forEach(el => {
   for (let node = el; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
  }));
  const face = h.page.locator('#pane-today [data-tw853-overall]:visible').first();
  const text = await face.innerText();
  assert.match(text, /Build complete at the docket numbers/);
  assert.doesNotMatch(text, /99\.29|99\.42|117\.5|142\.5|Provisional programme/);
  result.checks.push('Today card displays the native completed reading without stale range');
  if (evidence) {
   fs.mkdirSync(evidence, {recursive:true});
   fs.writeFileSync(path.join(evidence, mobile ? 'test-phone.json' : 'test-desktop.json'), JSON.stringify({...result, errors:h.errors, consoleErrors, counts:h.counts}, null, 2));
   await face.screenshot({path:path.join(evidence, mobile ? 'fencing-phone.png' : 'fencing-desktop.png')});
  }
  assert.deepEqual(h.errors, []);
  assert.deepEqual(consoleErrors, []);
  assert.equal(h.counts.blocked, 0);
  console.log(JSON.stringify({pass:result.checks.length + 3, record:result.record, total:result.total, pct:result.pct, allGreen:result.allGreen, errors:h.errors.length, consoleErrors:consoleErrors.length, writes:h.counts.blocked}));
 } finally { await h.browser.close(); }
})().catch(e => { console.error(e.stack); process.exit(1); });
