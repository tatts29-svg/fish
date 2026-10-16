#!/usr/bin/env node
/* Author: Andrew Fisher. v10.38 end-to-end: a browser opens an edit link holding the copy of the record it kept at
   09:20 AEST on 16 Oct (record 6643), while the shared record is 6693. The page's own opening path runs - syncFirst,
   the merge, the stage - with the sender held (and the harness aborting every write anyway); the test reads what the
   page would write up. v10.37 (the base) writes the doubled papers; v10.38 writes none of them.

     node tests/test_open1038.cjs <page.html> [<page.html> ...] */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const REC = path.join(ROOT, 'record_16Oct2026_hire_agreements_36601_36616');
const stale = JSON.parse(fs.readFileSync(path.join(REC, 'backup_state_20261015T232006Z.json'), 'utf8')).docs;
const shared = JSON.parse(fs.readFileSync(path.join(REC, 'backup_state_20261015T232819Z.json'), 'utf8')).docs;
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
(async () => {
  const pages = process.argv.slice(2); const res = {};
  for (const pageFile of pages) {
    const s = await open({pageFile, hash: '#fencing'});
    try {
      await s.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
      res[path.basename(pageFile)] = await s.page.evaluate(({stale, shared}) => {
        syncSend = function () {}; clearTimeout(SYNC.timer);
        Object.keys(SYNC_COLLS).forEach(n => SYNC_COLLS[n].set(fromDocs(n, JSON.parse(JSON.stringify(stale[n] || {})))));
        SYNC.queue = {}; SYNC.pending = {}; Object.keys(SYNC_COLLS).forEach(n => { SYNC.pending[n] = JSON.parse(JSON.stringify(shared[n] || {})); });
        SYNC.first = new Set(); SYNC.readonly = false; capability = () => 'edit'; mayWrite = () => true;
        try { clashDialog = function () {}; } catch (_) {}
        syncFirst(); syncStage();
        const q = SYNC.queue.fenceDockets || {};
        const puts = Object.keys(q).filter(k => q[k] !== null), dels = Object.keys(q).filter(k => q[k] === null);
        const wk1 = (S.fenceDockets || []).filter(d => /^366(0[1-9]|1[0-6])$/.test(String(d.docket_no)));
        return {fenceDocketWrites: puts.length, fenceDocketDeletes: dels.length, sample: puts.slice(0, 3), wk1OnScreen: wk1.length, suffixed: wk1.filter(d => /·[0-9a-f]{4}$/.test(d.id)).length,
          footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0]};
      }, {stale, shared});
    } finally { await s.browser.close(); }
  }
  console.log(JSON.stringify(res, null, 1));
  const v37 = Object.values(res)[0], v38 = Object.values(res)[1];
  if (v38) {
    const ok37 = v37.fenceDocketWrites >= 16 && v37.suffixed === 32, ok38 = v38.fenceDocketWrites === 0 && v38.fenceDocketDeletes === 0 && v38.wk1OnScreen === 16 && v38.suffixed === 0;
    console.log((ok37 ? 'PASS' : 'FAIL') + ' v10.37 reproduces the doubling on opening'); console.log((ok38 ? 'PASS' : 'FAIL') + ' v10.38 opens with sixteen papers and writes none of them back');
    process.exit(ok37 && ok38 ? 0 : 1);
  }
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
