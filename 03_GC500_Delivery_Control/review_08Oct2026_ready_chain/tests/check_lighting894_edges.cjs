// Author: Andrew Fisher. Read-only completion review fixtures for v8.94.
// Run only in the root agent's serial browser slot. Uses in-memory function
// wrappers, restores each in finally, and never calls a record setter.
const fs = require('fs');
const crypto = require('crypto');
const {open} = require('../../toolchain/harness/open_page');
const pageFile = process.env.PAGE;
if (!pageFile) throw new Error('PAGE must name the local candidate');
const expected = process.env.EXPECTED_SHA || null;
(async () => {
  let s;
  try {
    const sha = crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');
    if (expected && sha !== expected) throw new Error('Candidate does not match EXPECTED_SHA');
    s = await open({pageFile, W: 1440, H: 1000});
    const p = s.page;
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.Lighting894 && document.getElementById('where885'), null, {timeout: 150000});
    await p.waitForTimeout(1200);
    await p.evaluate(() => go('today'));
    await p.waitForSelector('#tw840-card-lighting [data-tw840-mode="done"]');
    const baseline = await p.evaluate(() => holdAssets(() => {
      const day = todayWorkDay841(), audit = Lighting894.audit(day);
      const area = todayWorkMetrics840(day).find(a => a.id === 'lighting');
      const summary = todayWorkSummary848(day).byId.lighting;
      return {scope: audit.scope, credited: audit.credited, recorded: audit.recorded,
        headline: {done: summary.done, total: summary.total, kind: summary.pctKind},
        nativeRows: area.rows.map(r => ({key:r.key, quantity:r.quantity, done:r.done, complete:r.complete})),
        baselineDoneRowTotal: area.rows.reduce((n,r) => n + (r.done || 0), 0)};
    }));
    const modal = {};
    for (const mode of ['done', 'total']) {
      await p.locator('#tw840-card-lighting [data-tw840-mode="' + mode + '"]').first().click();
      await p.waitForSelector('#gc500-work-dialog840[open]');
      modal[mode] = await p.evaluate(() => {
        const d = document.getElementById('gc500-work-dialog840');
        return {title:d.querySelector('h2')?.textContent, headline:d.querySelector('.tw840-dialog-top p')?.textContent,
          summary:d.querySelector('.tw840-detail-summary')?.innerText,
          rows:[...d.querySelectorAll('[data-tw844-reference]')].map(r => ({key:r.dataset.tw844Reference,
            quantity:r.querySelector('[data-tw844-quantity]')?.textContent,
            quantityLabel:r.querySelector('.tw844-item-quantity')?.textContent})),
          basis:d.querySelector('.tw840-definition p')?.textContent};
      });
      await p.locator('#gc500-work-dialog840 [data-tw840-close]').click();
    }
    const shortage = await p.evaluate(() => {
      const before = JSON.stringify(S), original = shortOf;
      let out;
      try {
        shortOf = function(a) {
          if (a && a.key === 'T0002') return [{item:chargeLines(a).find(l => /light.*tower/i.test(l.item))?.item || 'Light Tower', q:5, g:3}];
          return original.apply(this, arguments);
        };
        out = holdAssets(() => {
          const day = todayWorkDay841(), area = todayWorkMetrics840(day).find(a => a.id === 'lighting');
          const native = todayWorkSummary842(day, todayWorkMetrics840(day)).byId.lighting;
          const summary = todayWorkSummary848(day).byId.lighting;
          const audit = Lighting894.audit(day), status = timeline841State(assetOf('T0002'));
          return {fixture:'T0002 retains Complete but only 3 of 5 towers supplied',
            native:{done:native.done,kind:native.pctKind,reviewRefs:native.reviewRefs,shortConflictRefs:area.shortConflictRefs},
            projected:{done:summary.done,pct:summary.pct,kind:summary.pctKind,reviewRefs:summary.reviewRefs,credited:audit.credited},
            timeline:{label:status.label,stage:status.stage},
            wronglyConfirmed:summary.pctKind === 'confirmed' && summary.done > native.done};
        });
      } finally { shortOf = original; }
      out.functionRestored = shortOf === original;
      out.recordUnchanged = before === JSON.stringify(S);
      holdAssets(() => Lighting894.audit(todayWorkDay841()));
      return out;
    });
    const promoted = await p.evaluate(() => {
      const before = JSON.stringify(S), originalDelivery = deliveryOf, originalNumbers = assetNumbersOf;
      let out;
      try {
        deliveryOf = function(key) {
          const d = originalDelivery.apply(this, arguments);
          if (key === 'LT01') return {...d, done:true, recorded:true, state:'on site'};
          if (key === 'T0002') return {...d, done:false};
          return d;
        };
        assetNumbersOf = function(a) {
          const k = a && a.key || a;
          return k === 'LT01' ? ['REVIEW-FIXTURE-LT01'] : originalNumbers.apply(this, arguments);
        };
        out = holdAssets(() => {
          const day = todayWorkDay841(), audit = Lighting894.audit(day);
          const area = todayWorkMetrics840(day).find(a => a.id === 'lighting');
          const lt = area.rows.find(r => r.key === 'LT01');
          return {fixture:'LT01 gains asset and Complete evidence; T0002 Complete withdrawn',
            inRegister:allAssets().some(a => a.key === 'LT01'), nativeLT01:lt && {quantity:lt.quantity,done:lt.done,complete:lt.complete},
            credited:audit.credited, complete:audit.complete,
            groups:audit.groups.map(g => ({name:g.name,records:g.records.map(r => r.key),credited:g.credited})),
            promotedButUncredited:!!lt?.complete && audit.credited === 0};
        });
      } finally { deliveryOf = originalDelivery; assetNumbersOf = originalNumbers; }
      out.functionsRestored = deliveryOf === originalDelivery && assetNumbersOf === originalNumbers;
      out.recordUnchanged = before === JSON.stringify(S);
      holdAssets(() => Lighting894.audit(todayWorkDay841()));
      return out;
    });
    console.log(JSON.stringify({author:'Andrew Fisher',candidate:sha,baseline,modal,shortage,promoted,
      pageErrors:s.errors,blockedWrites:s.counts.blocked}, null, 2));
    if (shortage.wronglyConfirmed || promoted.promotedButUncredited || s.errors.length || s.counts.blocked || !shortage.functionRestored || !shortage.recordUnchanged || !promoted.functionsRestored || !promoted.recordUnchanged) process.exitCode = 1;
  } finally { if (s) await s.browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
