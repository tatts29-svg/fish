// Author: Andrew Fisher. GET-only harness; placement practice stays in memory.
// NODE_PATH=... CHROMIUM_PATH=... node runtime_browser_tests.js <candidate.html> [results.json]
const fs = require('fs');
const crypto = require('crypto');
const assert = require('assert/strict');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile:process.argv[2]});
  try {
    await s.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout:90000});
    await s.page.waitForTimeout(1200);
    const report = await s.page.evaluate(() => {
      const results = [], check = (name, passed) => results.push({name, passed:!!passed});
      const original = JSON.stringify(S), backup = JSON.parse(original);
      const oldWrite = mayWrite, oldWho = whoAmI, oldBump = bump, oldFlash = flash;
      const messages = [];
      const exported = exportRecord(), bare = {...exported}; delete bare.records;
      const restored = recordsFrom(bare);
      for (const field of ['fixes','entries','places','givenRefs','lineRates','finance745']) {
        check('Current '+field+' survive bare export/import', JSON.stringify(restored[field] || {}) === JSON.stringify(exported[field] || {}));
      }
      const supplierRows = allAssets().filter(a => subOf(a.key).length).map(a => ({key:a.key, numbers:subOf(a.key).map(u => u.no), count:locNums(a)}));
      check('Existing numbered rehire units remain included in location asset counts', supplierRows.every(r => r.count && r.count.n >= r.numbers.filter(Boolean).length));
      check('Questions render without swallowed section errors', questionsList().fails.length === 0);
      check('Finance source shifts remain available', fin745Rows().length > 0);
      window.mayWrite = () => true;
      window.whoAmI = () => 'Andrew Fisher via Codex';
      window.bump = () => { throw new Error('A refused placement attempted a save'); };
      window.flash = message => messages.push(message);
      try {
        const removable = allAssets().flatMap(a => unitsOf(a.key).filter(u => u._where === 'committed').map(u => ({ref:a.key,u})))[0];
        if (!removable) throw new Error('Expected an existing committed unit for regression practice');
        const collision = allUnits().find(u => u.ref !== removable.ref && u.sheet && u.callout);
        if (!collision) throw new Error('Expected an occupied drawing place for regression practice');
        const {ref,u} = removable;
        delete S.units[ref];
        const id = unitTombId(ref,u);
        tomb(id,'Andrew Fisher via Codex');
        check('Practice starts with the unit removed', tombedHere(id) && !unitsOf(ref).some(x => sameUnit(x,u)));
        const beforeAttempt = JSON.stringify(S);
        const accepted = unitAdd(ref,{label:u.label,asset_no:u.asset_no,sheet:collision.sheet,callout:collision.callout});
        check('Occupied drawing place is refused', accepted === false && messages.some(m => m.includes('already has')));
        check('Refused placement leaves all record fields and audit unchanged', JSON.stringify(S) === beforeAttempt);
        check('Refused placement keeps the removed committed unit hidden', tombedHere(id) && !unitsOf(ref).some(x => sameUnit(x,u)));
      } finally {
        S = backup;
        window.mayWrite = oldWrite;
        window.whoAmI = oldWho;
        window.bump = oldBump;
        window.flash = oldFlash;
      }
      check('Practice restores the original browser record exactly', JSON.stringify(S) === original);
      return {author:'Andrew Fisher',tests:results,passed:results.filter(r => r.passed).length,failed:results.filter(r => !r.passed).length,live_record_writes:0};
    });
    report.page_errors = s.errors;
    report.requests = s.counts;
    report.candidate_sha256 = crypto.createHash('sha256').update(fs.readFileSync(process.argv[2])).digest('hex');
    if (process.argv[3]) fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
    assert.equal(report.failed,0,'Browser regressions');
    assert.deepEqual(s.errors,[],'No browser errors');
    assert.equal(s.counts.blocked,0,'No application write attempted');
    console.log(JSON.stringify({passed:report.passed,failed:0,page_errors:0,live_record_writes:0}));
  } finally { await s.browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
