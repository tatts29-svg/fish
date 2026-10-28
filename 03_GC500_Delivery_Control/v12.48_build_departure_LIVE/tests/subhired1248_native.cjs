/* Author: Andrew Fisher. Native supplier departure presentation; read-only private evidence. */
'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const {openCandidate} = require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const populated = docs => Object.fromEntries(Object.entries(docs).filter(([, value]) => Object.keys(value || {}).length));
(async () => {
  for (const name of ['PAGE', 'BASE', 'STATE', 'OUT', 'EXPECTED_PAGE_SHA']) assert(process.env[name], name + ' required');
  assert.equal(sha(process.env.PAGE), process.env.EXPECTED_PAGE_SHA);
  fs.mkdirSync(process.env.OUT, {recursive: true});
  const frozen = JSON.parse(fs.readFileSync(process.env.STATE));
  const session = await openCandidate(), page = session.page;
  try {
    await page.evaluate(() => { go('subhired'); renderSubhired932(); });
    const owners = await page.locator('[data-supplier932-company]').evaluateAll(nodes => nodes.map(n => n.dataset.supplier932Company));
    const report = {author: 'Andrew Fisher', page_sha256: sha(process.env.PAGE), base_sha256: sha(process.env.BASE), state_sha256: sha(process.env.STATE), state_version: frozen.version, companies: [], checks: 0};
    let stamped = 0, partial = 0, noDeparture = 0, photographed = false;
    for (const owner of owners) {
      await page.locator('[data-supplier932-company="' + owner + '"]').click();
      const actual = await page.evaluate(() => {
        const pane = document.getElementById('pane-subhired');
        return holdAssets(() => [...pane.querySelectorAll('.units925-company-list [data-unit925-open]')].map(node => {
          const ref = node.dataset.unit925Open, item = node.dataset.unit925Item, id = node.dataset.unit925Target;
          const native = Departure1211.status(ref), isQuantity = node.hasAttribute('data-quantity-subhire964');
          const row = id && gcModel925(assetOf(ref), {loading: false}).rows.find(row => row.id === id);
          const event = row?.physical && !native?.issues?.length ? Departure1211.unit(ref, id, undefined, item) : null;
          const stamp = node.querySelector('.sh1248-status .stamp1232');
          const expected = event ? (() => { const span = document.createElement('span'); span.innerHTML = Stamp1232.html({at: event.departedAt1211 || null, date: event.date || null, by: event.by || ''}); return span.textContent; })() : null;
          return {ref, item, id, isQuantity, physical: row?.physical || false, native, event, stamp: stamp?.textContent || null, status: node.querySelector('.sh1248-status')?.textContent || '', kind: node.querySelector('.sh1248-status')?.dataset.subhired1248 || null, expected};
        }));
      });
      for (const row of actual) {
        if (row.isQuantity) {
          if (row.kind === 'partial') { assert(!row.stamp); partial++; }
        } else if (row.event) { assert.equal(row.stamp, row.expected); assert.equal(row.kind, 'left'); stamped++; }
        else { assert.equal(row.stamp, null); noDeparture++; }
        report.checks++;
      }
      const preserved = await page.evaluate(() => {
        const pane = document.getElementById('pane-subhired');
        const originalMarkup = () => { const clone = pane.cloneNode(true); clone.querySelectorAll('.sh1248-status').forEach(n => n.remove()); return clone.innerHTML; };
        const before = originalMarkup(), api = window.Subhired1248;
        try { window.Subhired1248 = null; renderSubhired932(); return before === originalMarkup(); }
        finally { window.Subhired1248 = api; renderSubhired932(); }
      });
      assert.equal(preserved, true, 'Existing company HTML/controls remain exact'); report.checks++;
      if (!photographed && actual.some(row => row.stamp)) {
        for (const [label, width, height] of [['desktop', 1440, 1000], ['phone', 390, 844]]) {
          await page.setViewportSize({width, height});
          const fold = page.locator('[data-subhire975-units]');
          if (await fold.count()) await fold.evaluate(n => { n.open = true; });
          const unit = page.locator('.units925-company-unit').filter({has: page.locator('.sh1248-status .stamp1232')}).first();
          await unit.scrollIntoViewIfNeeded();
          assert.equal(await unit.evaluate(n => n.scrollWidth <= n.clientWidth + 1), true, 'Departure row must not overflow');
          await unit.screenshot({path: process.env.OUT + '/supplier-departure-' + label + '.png'});
        }
        photographed = true;
      }
      report.companies.push({owner, rows: actual.length, departed: actual.filter(row => row.stamp).length, partial: actual.filter(row => row.kind === 'partial').length});
    }
    assert(stamped > 0, 'Actual identified departures must be exercised'); assert(noDeparture > 0, 'Remaining/planned identities must be exercised'); assert(photographed);
    const end = await page.evaluate(() => ({docs: JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))), queued: Object.values(SYNC.queue || {}).reduce((n, q) => n + Object.keys(q).length, 0), inflight: Object.keys(SYNC.inflight || {}).length}));
    assert.deepEqual(populated(end.docs), populated(frozen.docs)); assert.equal(end.queued, 0); assert.equal(end.inflight, 0);
    assert.deepEqual(session.errors, []); assert.deepEqual(session.consoleErrors, []); assert.equal(session.counts.blocked, 0);
    Object.assign(report, {stamped, partial, noDeparture, records_preserved: true, existing_html_preserved: true, errors: session.errors, console_errors: session.consoleErrors, operational_writes: session.counts.blocked});
    fs.writeFileSync(process.env.OUT + '/native-report.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({passed: true, checks: report.checks, companies: report.companies.length, stamped, partial, noDeparture, errors: 0, writes: 0}));
  } finally { await session.browser.close(); }
})().catch(error => { if (process.env.OUT) { fs.mkdirSync(process.env.OUT, {recursive: true}); fs.writeFileSync(process.env.OUT + '/failure.txt', error.stack || String(error)); } console.error(error.message); process.exit(1); });
