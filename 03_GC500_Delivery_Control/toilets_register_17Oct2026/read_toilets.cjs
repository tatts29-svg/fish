/* Read-only: every toilet on the live GC500 record (GET only; writes are aborted by the harness). */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
(async () => { const h = await open({W: 1440, H: 900}); const p = h.page;
 try { await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof allAssets === 'function', null, {timeout: 180000}); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
   const TOILET = /^(FWF(\s*Trailer)?|Accessible\s*Toilet|Toilet\s*Block.*|\d+\s*Pan\s*Block|.*Toilet.*Block.*)$/i;
   const out = [], version = SYNC.backend.readVersion821 ? SYNC.backend.readVersion821() : null;
   for (const a of allAssets()) {
    if (!a || a.discipline !== 'Toilets & amenities' || a._cancelled) continue;
    const lines = (chargeLines(a) || []).map(l => ({item: String(l.item || ''), qty: Number(qtyOf(l)) || 0})).filter(l => TOILET.test(l.item));
    if (!lines.length) continue;
    const P = dpPos(a), W = dpPosWords(P), mp = meetPointOf819(a), m = (typeof MASTER_LOC !== 'undefined' && MASTER_LOC[a.key]) || null;
    out.push({key: a.key, name: a.name || '', locs: a.locations || [], state: (S.delivery[a.key] || {}).state || '', lines,
     units: gcUnits925(a).map(u => ({owner: u.owner || '', no: u.assetNo || u.nativeId || '', item: String(u.item || ''), label: u.label || ''})),
     pos: {kind: P.kind, lat: P.lat, lon: P.lon, label: W.label, line: W.line},
     area: {id: mp && mp.p && mp.p.id, name: mp && mp.p && mp.p.name, how: mp && mp.how}, sec: m && (m.sec || m.section) || '', prec: m && m.prec || ''});
   }
   return {version, at: new Date().toISOString(), rows: out};
  });
  fs.writeFileSync(process.argv[2], JSON.stringify(r, null, 1));
  console.log('refs', r.rows.length, 'version', r.version, 'errors', h.errors.length, 'blocked', h.counts.blocked);
 } finally { await h.browser.close(); } })();
