/* Author: Andrew Fisher. v10.84 on the live record, read-only (the harness aborts every write).
     node tests/test_v1084.cjs [page]   (default build/GC500_v10.84/GC500_Delivery_Control_hosted.html) */
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
module.paths.unshift(path.join(ROOT, 'toolchain', 'node_modules'));
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
const PAGE = process.argv[2] || path.join(ROOT, 'build', 'GC500_v10.84', 'GC500_Delivery_Control_hosted.html');
const EVID = path.join(__dirname, '..', 'evidence'); fs.mkdirSync(EVID, {recursive: true});
let pass = 0, fail = 0; const fails = [];
const check = (n, ok, d) => { if (ok) { pass++; console.log('PASS ' + n); } else { fail++; fails.push(n); console.log('FAIL ' + n + ' — ' + JSON.stringify(d === undefined ? null : d).slice(0, 700)); } };
(async () => {
  const s = await open({pageFile: PAGE}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const M = window.Supplier996.model(), row = (ref, item) => M.inventory.filter(x => x.ref === ref && x.item === item).map(x => ({received: x.received, onSite: x.onSite, hold: !!x.dispatchHold, location: x.location, basis: x.locationBasis, numbers: x.numbers}));
      const dest = k => { const d = dest782(assetOf(k)); return d && {kind: d.kind, andrew: !!d.andrew, lat: d.ll.lat, lon: d.ll.lon, label: d.label}; };
      const pl = pl770Model(), rm = (pl.cost || []).filter(l => l.code === '2357');
      const badLoc = M.inventory.filter(x => !x.location || /^(false|true|null|undefined)/.test(String(x.location))).map(x => x.ref);
      return {badLoc, footer: (document.body.innerText.match(/v10\.\d+/g) || []).includes('v10.84'),
        tabs: TABS.map(t => t[0]), pane: !!document.getElementById('pane-servicing'),
        t24: row('T0024', 'FWF'), wc31: row('WC31', '16Pan Block'),
        dT24: dest('T0024'), dWC31: dest('WC31'), dPG01: dest('PG01'), dWC07: dest('WC07'), dWC85: dest('WC85'),
        rm, svcDays: SVC1067_DATA.days.map(d => d.id), svcExtras: SVC1067_DATA.extras, svcPlans: Object.keys(SVC1067_DATA.plans),
        cardHasGroups: /data-save/.test(SVC1067_CARD.html) && /~\(\[a-z\]\{1,12\}\)/.test(SVC1067_CARD.html) || /saveclose/.test(SVC1067_CARD.html),
        stateExtras: typeof SvcState.countedFor === 'function'};
    });
    check('footer says v10.84', r.footer);
    check('no inventory location prints a stray false/undefined', r.badLoc.length === 0, r.badLoc);
    check('Servicing tab sits after Event nights, with its own pane', r.tabs.indexOf('servicing') === r.tabs.indexOf('nights') + 1 && r.pane, r.tabs);
    check('WC31 16-pan: 2 received, 2 on site (12, 74), no hold', r.wc31.length === 1 && r.wc31[0].received === 2 && r.wc31[0].onSite === 2 && !r.wc31[0].hold, r.wc31);
    check('T0024 FWF: 0164 1 received, 1 on site, no hold', r.t24.length === 1 && r.t24[0].received === 1 && r.t24[0].onSite === 1 && !r.t24[0].hold, r.t24);
    check("T0024 location: Andrew's pin at -27.983217, 153.426642 (not 'Location not confirmed')", /Andrew’s pin/.test(r.t24[0].location) && /-27\.983217, 153\.426642/.test(r.t24[0].location) && !/not confirmed/i.test(r.t24[0].location) && r.t24[0].basis === 'Andrew’s pin', r.t24[0]);
    check("WC31 location: Andrew's pin at -27.982533, 153.425151 (not the master plan)", /Andrew’s pin/.test(r.wc31[0].location) && /-27\.982533, 153\.425151/.test(r.wc31[0].location), r.wc31[0]);
    check("Navigate: T0024, WC31, PG01, WC85 go to Andrew's pins", [r.dT24, r.dWC31, r.dPG01, r.dWC85].every(d => d && d.andrew) && r.dWC31.lat === -27.982533 && r.dWC31.lon === 153.425151, [r.dT24, r.dWC31, r.dPG01, r.dWC85]);
    check('Navigate: WC07 (master plan tag, not Andrew\'s pin) is unchanged in kind', r.dWC07 && !r.dWC07.andrew, r.dWC07);
    check('Costs: no Repairs & Maintenance (code 2357) line', r.rm.length === 0, r.rm);
    check('tracker block: Fri/Sat/Sun, Refilled extra, seven kinds, shared rule leaves extras out', JSON.stringify(r.svcDays) === '["2026-10-23","2026-10-24","2026-10-25"]' && JSON.stringify(r.svcExtras) === '["refill"]' && r.svcPlans.length === 7 && r.stateExtras, r);
    check('the crew card template carries Save & close', r.cardHasGroups);
    await p.evaluate(() => go('costs')); await p.waitForTimeout(5000);
    const costs = await p.evaluate(() => document.getElementById('pane-costs').innerText);
    check('Costs tab no longer shows "Total Repairs & Maintenance" or $578', !/Repairs & Maintenance/.test(costs) && !/\$578\.00/.test(costs));
    await p.evaluate(() => go('servicing')); await p.waitForTimeout(2500);
    const sv = await p.evaluate(() => { const pane = document.getElementById('pane-servicing'); return {on: pane.classList.contains('on'), text: pane.innerText, head: !!pane.querySelector('.panehead')}; });
    check('Servicing tab opens; on the view link it says progress is on the edit link', sv.on && sv.head && /edit link/.test(sv.text), sv);
    await p.screenshot({path: path.join(EVID, 'servicing_tab_view_link.png')});
    await p.evaluate(() => go('nights')); await p.waitForTimeout(2000);
    check('Event nights no longer carries the tracker panel', !(await p.evaluate(() => { const h = document.getElementById('svc1067-host'); return h && h.offsetParent !== null && h.closest('#pane-nights'); })));
    check('no page errors', s.errors.length === 0, s.errors);
    check('no writes attempted', s.counts.blocked === 0, s.counts);
  } finally { await s.browser.close(); }
  console.log('\n' + pass + ' passed, ' + fail + ' failed'); if (fail) { console.log('FAILED: ' + fails.join(' | ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
