// Author: Andrew Fisher. 25 Oct 2026 - the page's own VMS model (positions, boards, arrivals), read only.
//   PAGE=<live page file> OUT=<private json> node dump_vms.cjs
const {open} = require('../toolchain/harness/open_page');
const fs = require('fs');
(async () => {
 const h = await open({pageFile: process.env.PAGE, hash: '#vms', W: 1400, H: 900});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const d = await p.evaluate(() => {
   const out = {positions: [], status: null, boards913: null};
   for (const b of VMS1024.boards()) {
    let id = null, pos = null; try { id = VMS1024.identity(b); } catch (e) { id = {err: String(e)}; } try { pos = VMS1024.position(b); } catch (e) { pos = {err: String(e)}; }
    const r = VMS1024.rec(b.pos) || {};
    out.positions.push({pos: b.pos, label: VMS1024.label(b), phase: b.phase, board: b.board || b.default_board, title: b.title, moves_to: b.moves_to, session: !!b.session, identity: id, position: pos, inPlace: r.inPlace, arrival: r.arrival1098 || null, completion: r.completion1101 || null, conflict: b.canonicalIdentityConflict1103 || null});
   }
   try { out.status = VMSArrival1098.count(todayIso()); } catch (e) { out.status = {err: String(e)}; }
   try { out.boards913 = vms913Boards().map(b => ({key: b.key, name: b.name, tid: typeof vms913TidOf === 'function' ? vms913TidOf(b) : null, line: b.line, asset: b.asset, fleet: b.fleet, rego: b.rego, co: b.co, on: typeof vms913OnOf === 'function' ? vms913OnOf(b) : null})); } catch (e) { out.boards913 = {err: String(e)}; }
   return out;
  });
  fs.writeFileSync(process.env.OUT, JSON.stringify(d, null, 1));
  console.log(JSON.stringify({positions: d.positions.length, boards: Array.isArray(d.boards913) ? d.boards913.length : d.boards913, errors: h.errors.length, blocked: h.counts.blocked}));
 } finally { await h.browser.close(); }
})();
