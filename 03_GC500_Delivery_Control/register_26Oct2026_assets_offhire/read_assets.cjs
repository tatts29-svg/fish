/* Author: Andrew Fisher. Read-only: every asset on the live GC500 record for the off-hire register (GET only; the harness
   aborts any write). Writes one JSON file: references, their units, building contents, fire extinguishers, map positions,
   the demob plan date, departures, VMS boards, contract lines and the subhire inventory.
     node read_assets.cjs out.json            (from 03_GC500_Delivery_Control/) */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require(path.join(process.cwd(), 'toolchain', 'harness', 'open_page'));
(async () => {
  const s = await open({pageFile: process.env.PAGE || undefined, hash: '#today', W: 1440, H: 1000});
  try {
    await s.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof allAssets === 'function', null, {timeout: 180000});
    await s.page.waitForTimeout(3500);
    const r = await s.page.evaluate(() => {
      const safe = (f, d = null) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
      const plain = v => JSON.parse(JSON.stringify(v ?? null));
      const out = {at: new Date().toISOString(), version: safe(() => SYNC.backend.readVersion821()), footer: safe(() => document.getElementById('footL').textContent), refs: [], vms: [], contract: [], supplier: null};
      const D = safe(() => demob816()), dep = window.Departure1211;
      out.demobDays = safe(() => days816());
      for (const a of allAssets()) {
        if (!a || a._cancelled) continue;
        const P = safe(() => dpPos(a)), W = P ? safe(() => dpPosWords(P)) : null, mp = safe(() => meetPointOf819(a)), m = safe(() => (typeof MASTER_LOC !== 'undefined' && MASTER_LOC[a.key]) || null);
        const d = D ? D.byKey.get(a.key) : null, dv = safe(() => deliveryOf(a.key)), st = dep ? safe(() => dep.status(a.key)) : null;
        out.refs.push({
          key: a.key, name: a.name || '', discipline: a.discipline || '', product: a.product || '', locations: a.locations || [], origin: a.origin || null, added: !!a._added,
          kind: safe(() => refKind(a)), branch: safe(() => { const b = branchOf(a.key); return b && (b.code || b); }),
          lines: safe(() => (chargeLines(a) || []).map(l => ({item: String(l.item || ''), qty: Number(qtyOf(l)) || 0})), []),
          units: safe(() => gcUnits925(a).map(u => ({id: u.id || null, owner: u.owner || '', no: u.assetNo || u.nativeId || '', item: String(u.item || ''), label: u.label || '', physical: u.physical !== false})), []),
          accessories: (a.accessories || []).filter(x => x && x.active !== false).map(x => ({type: x.type || '', qty: x.qty ?? null, no: x.asset_no || '', as_written: x.as_written || '', origin: x.origin || ''})),
          fire: plain(safe(() => fire914Of(a))),
          pos: P ? {kind: P.kind || null, lat: P.lat ?? null, lon: P.lon ?? null, label: W && W.label || '', line: W && W.line || ''} : null,
          area: mp && mp.p ? {id: mp.p.id || null, name: mp.p.name || ''} : null, section: m && (m.sec || m.section) || '',
          demob: d ? {iso: d.iso || null, src: d.src || null, zone: d.zone || null, side: d.side || null, contractEnd: d.contractEnd || null, sub: d.sub || null, portions: plain(d.portions || null)} : null,
          delivery: dv ? {state: dv.state || null, out_date: dv.out_date || null, date: dv.date || null, eta: dv.eta || null, done: !!dv.done, done_at: dv.done_at || null, levelled: !!dv.levelled, steps: !!dv.steps} : null,
          departure: st ? {collected: st.collected ?? null, remaining: st.remaining ?? null, complete: !!st.complete, label: st.label || null, last: st.last || null, unknown: !!st.unknown} : null,
          hire: a.hire ? {offhire: a.hire.offhire || null, offhire_date: a.hire.offhire_date || null, basis: a.hire.basis_short || null} : null,
          subhire: safe(() => { const x = subhireOf(a.key); return x ? {co: x.co || null} : null; }),
          note: a._note || null
        });
      }
      safe(() => { for (const b of window.VmsEquipment1103.model().boards) out.vms.push(plain({key: b.key ?? null, name: b.name ?? null, contract: b.contract ?? null, line: b.line ?? null, co: b.co ?? null, fleet: b.fleet ?? null, rego: b.rego ?? null, delivery: b.delivery ?? null, status: b.status ?? null, positions: (b.positions || []).map(p => ({pos: p.pos ?? null, title: p.title ?? null, phase: p.phase ?? null, lat: p.lat ?? null, lon: p.lon ?? null})), departure: b.departure1211 ? {at: b.departure1211.at || null} : null})); });
      out.contract = safe(() => ONHIRE_ROWS.map(r => ({contract: r.rental_contract, branch: r.branch_code, line: r.line, item: r.item, asset_no: r.asset_no || '', serial: r.serial || '', description: r.description || '', family: r.family || '', qty: r.quantity, status: r.status_as_written || '', start: r.start_date || null, start_time: r.start_time_as_written || null, expected_term: r.expected_term_date || null, expected_time: r.expected_offrental_time || null, term: r.term_date || null, booked_pickup: r.booked_pickup_date || null, demob_date: r.demob_date || null, sub: r.supplier_sub_rental || null, subhired: !!r.subhired, charge_line: !!r.charge_line, match_key: r.match && r.match.key || null, match_task: r.match && r.match.task_id || null, match_state: r.match && r.match.state || null})), []);
      out.fencing = safe(() => allDockets().filter(x => x && x.usable !== false).map(x => ({no: String(x.docket_no || x.note_no || x.id || ''), date: x.date || null, week: x.week || null, location: x.location || x.where || '', q: plain(x.quantities || {}), paid: x.paid_total ?? x.cost_total ?? null})), []);
      out.collections = safe(() => collectionRows().map(c => ({no: String(c.collection_no || c.docket_no || c.id || ''), date: c.date || null, location: c.location || '', collected: plain(c.collected || null)})), []);
      out.supplier = safe(() => { const M = window.Supplier996.model(); return {keys: Object.keys(M), inventory: plain((M.inventory || []).map(x => ({...x}))), remaining: plain(M.remaining || null)}; });
      return out;
    });
    fs.writeFileSync(process.argv[2], JSON.stringify(r, null, 1));
    console.log('fencing', (r.fencing || []).length, 'collections', (r.collections || []).length, 'refs', r.refs.length, 'vms', r.vms.length, 'contract', r.contract.length, 'supplier', r.supplier ? (r.supplier.inventory || []).length : null, 'version', r.version, 'errors', s.errors.length, 'blocked', s.counts.blocked);
  } catch (e) { console.log('ERR', String(e).slice(0, 500)); }
  await s.browser.close();
})();
