// Author: Andrew Fisher. v12.63 on the real page with the live record, writing nothing: the delivery history merge honours
// the record's tombstone for a history entry (both sides, live and file merges), keeps the old union where there is no
// tombstone, and the page's own back/ undo still puts an entry back; the live WC41 document, which carries the duplicate
// today, loses it once the tombstone is on; no page errors, no writes.
//   PAGE=build/GC500_v12.63/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_v1263.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, hash: '#today'}), p = s.page;
  const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const lines = [];
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const KEY = 'hist/WC41/in transit|2026-10-28T02:20:44.187Z';
      const e0 = {state: 'not on site', at: '2026-09-28T02:50:20.664Z', by: 'Andrew Fisher'};
      const e1 = {state: 'on site', at: '2026-09-28T02:50:22.336Z', by: 'Andrew Fisher'};
      const old = {state: 'in transit', at: '2026-10-28T02:20:44.187Z', by: 'Andrew Fisher', collection996: {version: 1, kind: 'collection', id: 'X', date: '2026-10-28', departedAt1211: '2026-10-28T12:15:00+10:00', items: [], complete: true}};
      const neu = {state: 'in transit', at: '2026-10-30T00:15:13.212Z', by: 'Andrew Fisher', collection996: {version: 1, kind: 'collection', id: 'X', date: '2026-10-30', departedAt1211: '2026-10-30T09:40:00+10:00', items: [], complete: true}};
      const mk = (hist, extra) => Object.assign({delivery: {WC41: {state: 'in transit', set_at: '2026-10-28T02:20:44.187Z', by: 'Andrew Fisher', history: hist}}}, extra || {});
      const keys = m => (m.delivery.WC41.history || []).map(h => h.state + '|' + h.at);
      const stale = mk([e0, e1, old, neu]);                                                       // the device's saved copy
      const server = mk([e0, e1, neu], {deleted: {[KEY]: '2026-10-30T05:00:00.000Z'}});           // the service, tombstone on
      const live = mergeRecords(stale, server, {live: true}).merged;                              // opening the page on that device
      const other = mergeRecords(server, stale).merged;                                           // the other way round
      const noTomb = mergeRecords(stale, mk([e0, e1, neu])).merged;                               // no tombstone: the old union
      const back = mergeRecords(stale, mk([e0, e1, neu], {deleted: {[KEY]: '2026-10-30T05:00:00.000Z', ['back/' + KEY]: '2026-10-30T06:00:00.000Z'}})).merged; // put back later
      const tombOnStale = mergeRecords(mk([e0, e1, old, neu], {deleted: {[KEY]: '2026-10-30T05:00:00.000Z'}}), mk([e0, e1, old, neu])).merged; // the removing side holds the entry too
      /* the live record as this page holds it today (S), and the same record with the tombstone on */
      const S0 = JSON.parse(JSON.stringify(S)), w = (S0.delivery || {}).WC41 || {};
      const liveKeys = (w.history || []).map(h => h.state + '|' + h.at), liveColl = (w.history || []).filter(h => h && h.collection996).length;
      const withTomb = JSON.parse(JSON.stringify(S0)); withTomb.deleted = Object.assign({}, withTomb.deleted || {}, {[KEY]: '2026-10-30T05:00:00.000Z'});
      const fixed = mergeRecords(withTomb, S0, {live: true}).merged;
      const foot = (document.body.innerText.match(/v12\.\d+(?:\.\d+)?/g) || []).slice(-1)[0] || null;
      return {KEY, live: keys(live), other: keys(other), noTomb: keys(noTomb), back: keys(back), tombOnStale: keys(tombOnStale), liveDel: Object.keys(live.deleted || {}),
        liveKeys, liveColl, liveTombed: tombed(S0, KEY), fixedKeys: keys(fixed), fixedColl: (fixed.delivery.WC41.history || []).filter(h => h && h.collection996).length, foot, fn: typeof gone1263 === 'undefined'};
    });
    const OLDK = 'in transit|2026-10-28T02:20:44.187Z', NEWK = 'in transit|2026-10-30T00:15:13.212Z';
    check(r.live.length === 3 && !r.live.includes(OLDK) && r.live.includes(NEWK), 'opening the page on the stale device: the tombstoned entry stays off, the corrected one stays: ' + r.live.join(', '));
    check(r.other.length === 3 && !r.other.includes(OLDK), 'the other way round, the same: ' + r.other.join(', '));
    check(r.liveDel.includes(r.KEY), 'the merged record carries the tombstone on, so the device saves it too: ' + r.liveDel.join(', '));
    check(r.noTomb.length === 4 && r.noTomb.includes(OLDK), 'no tombstone: the union is as it was (both entries): ' + r.noTomb.join(', '));
    check(r.back.length === 4 && r.back.includes(OLDK), 'a later back/ undo puts the entry back: ' + r.back.join(', '));
    check(r.tombOnStale.length === 3 && !r.tombOnStale.includes(OLDK), 'the tombstone works when the removing side still holds the entry too: ' + r.tombOnStale.join(', '));
    check(r.liveTombed === false && r.liveColl >= 1, 'the live record has no tombstone yet (today: ' + r.liveColl + ' collection entries on WC41)');
    check(r.fixedColl === Math.max(1, r.liveColl - (r.liveKeys.includes(OLDK) ? 1 : 0)) && !r.fixedKeys.includes(OLDK), 'the live WC41 document with the tombstone on loses the 28 Oct entry: ' + r.fixedKeys.join(', '));
    check(r.foot === 'v12.63', 'footer reads v12.63: ' + r.foot);
    check(s.errors.length === 0 && cons.length === 0, 'no page errors or console errors: ' + JSON.stringify(s.errors.slice(0, 2)) + JSON.stringify(cons.slice(0, 2)));
    check(s.counts.blocked === 0, 'no write attempted: ' + s.counts.blocked);
    lines.push(`v12.63 ${tag}: ${checks}/${checks} checks passed`, 'live WC41 today: ' + r.liveKeys.join(' · '), 'with the tombstone: ' + r.fixedKeys.join(' · '));
    if (dir) { fs.mkdirSync(dir, {recursive: true}); fs.writeFileSync(path.join(dir, `test_${tag}.txt`), lines.join('\n') + '\n'); }
    console.log(lines.join('\n'));
  } catch (e) {
    console.error(`v12.63 ${tag}: FAILED after ${checks} checks: ${e.message}`); process.exitCode = 1;
  } finally { await s.browser.close(); }
})();
