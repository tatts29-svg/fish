#!/usr/bin/env node
/* Author: Andrew Fisher. v10.38 test: opening the page can no longer double the fencing papers.

   Replays the 16 Oct 2026 10:12 AEST doubling from the record's own backups, inside the built page (the harness opens
   it at the live address; every write is ABORTED, the live record is only read):
     stale  = backup_state_20261015T232006Z.json  (record 6643, 09:20 AEST: the sixteen week-1 agreements with the old
              note "Owner sign-off: Andrew Fisher") - what a browser that last had the page then still keeps;
     shared = backup_state_20261015T232819Z.json  (record 6693, 09:28 AEST: the same agreements, note "Andrew",
              re-saved and re-stamped at 09:23).
   The old merge (no live flag, as before) must still double them - that is the bug, reproduced. The live merge must
   not: one version each, the shared record's, under their plain ids. Then the edge cases the rule has to get right.

     PAGE=build/GC500_v10.38/GC500_Delivery_Control_hosted.html node tests/test_sync1038.cjs */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PAGE = process.env.PAGE || path.join(ROOT, 'build', 'GC500_v10.38', 'GC500_Delivery_Control_hosted.html');
const REC = path.join(ROOT, 'record_16Oct2026_hire_agreements_36601_36616');
const stale = JSON.parse(fs.readFileSync(path.join(REC, 'backup_state_20261015T232006Z.json'), 'utf8')).docs;
const shared = JSON.parse(fs.readFileSync(path.join(REC, 'backup_state_20261015T232819Z.json'), 'utf8')).docs;
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));

let failed = 0, total = 0;
const check = (what, ok, detail) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + what + (detail ? ' - ' + detail : '')); };

(async () => {
  const s = await open({pageFile: PAGE, hash: '#fencing'});
  try {
    await s.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    const r = await s.page.evaluate(({stale, shared}) => {
      const asS = docs => { const o = {}; Object.keys(SYNC_COLLS).forEach(n => { o[n] = fromDocs(n, docs[n] || {}); }); return o; };
      const A0 = asS(stale), B0 = asS(shared);
      const wk1 = list => (list || []).filter(d => /^366(0[1-9]|1[0-6])$/.test(String(d.docket_no)));
      const suffixed = list => (list || []).filter(d => /·[0-9a-f]{4}$/.test(String(d.id))).map(d => d.id);
      const summary = m => ({wk1: wk1(m.fenceDockets).length, suffixedWk1: suffixed(wk1(m.fenceDockets)).length, ids: wk1(m.fenceDockets).map(d => d.id).sort(),
        notesNew: wk1(m.fenceDockets).filter(d => /Owner sign-off: Andrew, 16 Oct/.test(d.note || '')).length, notesOld: wk1(m.fenceDockets).filter(d => /Andrew Fisher, 16 Oct/.test(d.note || '')).length});
      const out = {footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0], marker: String(mergeRecords).includes('live-merge-1038') && String(mergeRecords).includes(',opts);'), syncFirstLive: String(syncFirst).includes('{live: true}')};
      const clone = x => JSON.parse(JSON.stringify(x));
      out.before = {staleOld: wk1(A0.fenceDockets).filter(d => /Andrew Fisher, 16 Oct/.test(d.note || '')).length, sharedNew: wk1(B0.fenceDockets).filter(d => /Owner sign-off: Andrew, 16 Oct/.test(d.note || '')).length};
      out.old = summary(mergeRecords(clone(A0), clone(B0)).merged);
      const live = mergeRecords(clone(A0), clone(B0), {live: true});
      out.live = summary(live.merged); out.liveClashes = live.report.clashes.filter(c => /3660|3661/.test(c)).length; out.liveOlder = live.report.liveOlder1038 || 0;
      out.liveSame = wk1(live.merged.fenceDockets).every(d => { const b = wk1(B0.fenceDockets).find(x => x.id === d.id); return b && JSON.stringify(Object.assign({}, b, {_k: undefined})) === JSON.stringify(Object.assign({}, d, {_k: undefined})); });
      out.live592 = live.merged.fenceDockets.filter(d => String(d.docket_no) === '36592').map(d => d.id).sort();
      out.shared592 = B0.fenceDockets.filter(d => String(d.docket_no) === '36592').map(d => d.id).sort();
      /* the same, the other way round: the shared copy as "mine" must not change the answer for the shared record's papers */
      /* a later edit made in this browser still goes up, under the shared record's id */
      { const A = clone(A0), B = clone(B0); const d = A.fenceDockets.find(x => x.id === 'F-AF-0005'); d.quantities = {clean: 999}; d.note = 'edited later in this browser'; A.stamps['fenceDockets/F-AF-0005'] = '2099-01-01T00:00:00.000Z';
        const m = mergeRecords(A, B, {live: true}).merged; const got = m.fenceDockets.filter(x => String(x.docket_no) === '36605');
        out.laterEdit = got.map(x => ({id: x.id, clean: x.quantities.clean})); }
      /* a new paper typed in this browser and not yet sent is kept */
      { const A = clone(A0), B = clone(B0); A.fenceDockets.push(Object.assign(clone(A.fenceDockets.find(x => x.id === 'F-AF-0001')), {id: 'F-AF-0099', docket_no: '36999', note: 'new'}));
        const m = mergeRecords(A, B, {live: true}).merged; out.newPaper = m.fenceDockets.filter(x => x.docket_no === '36999').map(x => x.id); }
      /* the shared record's id·hash is kept, not renamed to the plain id */
      { const A = clone(A0), B = clone(B0); A.fenceDockets = A.fenceDockets.filter(x => String(x.docket_no) !== '36592'); B.fenceDockets = B.fenceDockets.filter(x => x.id !== 'F-AFV-0035·1e26');
        const m = mergeRecords(A, B, {live: true}).merged; out.keepsHashId = m.fenceDockets.filter(x => String(x.docket_no) === '36592').map(x => x.id);
        const mo = mergeRecords(clone(A), clone(B)).merged; out.oldRenames = mo.fenceDockets.filter(x => String(x.docket_no) === '36592').map(x => x.id); }
      /* two DIFFERENT papers under one id are both kept, as before */
      { const A = clone(A0), B = clone(B0); const a = A.fenceDockets.find(x => x.id === 'F-AF-0016'); a.docket_no = '36650'; a.note = 'a different paper';
        const m = mergeRecords(A, B, {live: true}).merged; out.differentPapers = m.fenceDockets.filter(x => /^F-AF-0016/.test(x.id)).map(x => x.docket_no).sort(); }
      /* duplicates the shared record itself holds are left for a person */
      { const A = clone(A0), B = clone(B0); out.sharedDups = B.fenceDockets.filter(x => String(x.docket_no) === '36592').length;
        const m = mergeRecords(A, B, {live: true}).merged; out.sharedDupsAfter = m.fenceDockets.filter(x => String(x.docket_no) === '36592').length; }
      /* service notes and collection forms follow the same rule */
      { const A = clone(A0), B = clone(B0); const n = (A.serviceNotes || [])[0]; if (n) { n.labour_hours = 77; }
        const m = mergeRecords(A, B, {live: true}).merged; out.notesSuffixed = (m.serviceNotes || []).filter(x => /·[0-9a-f]{4}$/.test(x.id)).length; out.notesSuffixedB = (B.serviceNotes || []).filter(x => /·[0-9a-f]{4}$/.test(x.id)).length; }
      return out;
    }, {stale, shared});

    check('the page is v10.38 with the live merge in place', r.footer === 'v10.38' && r.marker && r.syncFirstLive, JSON.stringify({footer: r.footer, marker: r.marker, syncFirstLive: r.syncFirstLive}));
    check('the backups are the 10:12 situation (old notes kept by the browser, new notes on the shared record)', r.before.staleOld === 16 && r.before.sharedNew === 16, JSON.stringify(r.before));
    check('REPRODUCED: the old merge doubles the sixteen agreements', r.old.wk1 === 32 && r.old.suffixedWk1 === 32, JSON.stringify({wk1: r.old.wk1, suffixed: r.old.suffixedWk1}));
    check('FIXED: the live merge keeps sixteen, one each, plain ids', r.live.wk1 === 16 && r.live.suffixedWk1 === 0, JSON.stringify({wk1: r.live.wk1, suffixed: r.live.suffixedWk1}));
    check('the shared record\'s version stands (the newer note), the browser\'s old copy is dropped', r.live.notesNew === 16 && r.live.notesOld === 0 && r.liveSame && r.liveOlder === 16, JSON.stringify({notesNew: r.live.notesNew, notesOld: r.live.notesOld, same: r.liveSame, dropped: r.liveOlder}));
    check('no clash dialog for an older copy', r.liveClashes === 0, String(r.liveClashes));
    check('36592 as the shared record holds it', JSON.stringify(r.live592) === JSON.stringify(r.shared592), JSON.stringify(r.live592));
    check('a later edit made in this browser still goes up, once, under the shared id', r.laterEdit.length === 1 && r.laterEdit[0].id === 'F-AF-0005' && r.laterEdit[0].clean === 999, JSON.stringify(r.laterEdit));
    check('a new paper typed in this browser is kept', JSON.stringify(r.newPaper) === '["F-AF-0099"]', JSON.stringify(r.newPaper));
    check('the shared record\'s id·hash is kept on load (the old merge renamed it)', JSON.stringify(r.keepsHashId) === '["F-AFV-0035·2904"]' && JSON.stringify(r.oldRenames) === '["F-AFV-0035"]', JSON.stringify({live: r.keepsHashId, old: r.oldRenames}));
    check('two different papers under one id are both kept', JSON.stringify(r.differentPapers) === '["36616","36650"]', JSON.stringify(r.differentPapers));
    check('duplicates the shared record holds are left as they are', r.sharedDups === 2 && r.sharedDupsAfter === 2, JSON.stringify({before: r.sharedDups, after: r.sharedDupsAfter}));
    check('service notes: an older copy kept by the browser is not doubled', r.notesSuffixed === r.notesSuffixedB, JSON.stringify({live: r.notesSuffixed, shared: r.notesSuffixedB}));
    check('no page errors and no writes reached the service', s.errors.length === 0, (s.errors[0] || '') + ' · aborted writes ' + s.counts.blocked);
  } finally { await s.browser.close(); }
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
