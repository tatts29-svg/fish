/* Author: Andrew Fisher. Physical counts only: an explicitly source-linked alias is
 * retained as history, while its uniquely matching scheduled machine is counted once.
 * Never deduplicate by a name, a shared number, or a similar location alone.
 * Every guard is replayed against current inputs; no native record is changed. */
function physicalCountAssets963(input, options) {
 const list = Array.isArray(input) ? input : [], opts = options || {};
 const text = x => String(x == null ? '' : x).trim();
 const keyOf = a => text(a && a.key);
 const qty = l => opts.quantityOf ? opts.quantityOf(l) : typeof qtyOf === 'function' ? qtyOf(l) : l.quantity;
 const linesOf = a => opts.linesOf ? opts.linesOf(a) : typeof chargeLines === 'function' ? chargeLines(a) : a.charge_lines || [];
 const moved = a => !!(a._movedTo || a._locationMoved || a.relocation || a.rest_of || (opts.movedAway ? opts.movedAway(a.key) : typeof movedAway === 'function' && movedAway(a.key)));
 const idsOf = a => {
  if (opts.identitiesOf) return opts.identitiesOf(a).map(text).filter(Boolean).sort();
  const ids = (a.asset_numbers || []).filter(n => text(n).toUpperCase() !== 'MISCITEM').map(n => 'asset:' + text(n));
  if (typeof unitsOf === 'function') unitsOf(a.key).forEach(u => ids.push('unit:' + text(u.co) + ':' + text(u.asset_no) + ':' + text(u.label)));
  if (typeof subOf === 'function') subOf(a.key).forEach(u => ids.push('supplier:' + text(u.co).toLowerCase() + ':' + text(u.no)));
  return [...new Set(ids)].sort();
 };
 const locations = a => (a.locations || []).map(text).filter(Boolean).sort();
 const byKey = new Map(), claims = new Map(), aliases = [], pending = [];
 list.forEach(a => { if (!a) return; const k = keyOf(a); byKey.set(k, (byKey.get(k) || []).concat(a));
  if (!a._cancelled && text(a.source_row)) { const src = text(a.source_row); claims.set(src, (claims.get(src) || []).concat(a)); } });
 for (const a of list) {
  if (!a || a._cancelled || !text(a.source_row)) continue;
  const ref = keyOf(a), source = text(a.source_row), parents = byKey.get(source) || [], p = parents[0];
  const fail = reason => pending.push({ref, source, reason});
  if (!ref || (byKey.get(ref) || []).length !== 1 || parents.length !== 1 || source === ref || (claims.get(source) || []).length !== 1) { fail('The source link is missing or ambiguous.'); continue; }
  if (!a._added || !p._plant || p.origin !== 'schedule' || text(p.source_row) || p._cancelled || (claims.get(ref) || []).length || moved(a) || moved(p) || (a.events || []).length) { fail('The source link is not an unchanged, active alias of one scheduled delivery.'); continue; }
  const al = linesOf(a).filter(l => l && l.item), pl = linesOf(p).filter(l => l && l.item);
  if (al.length !== 1 || pl.length !== 1 || text(al[0].item) !== text(pl[0].item) || qty(al[0]) !== 1 || qty(pl[0]) !== 1) { fail('The single-machine item and quantity do not match.'); continue; }
  const loc = locations(a), plc = locations(p), day = text(a.first_date), item = text(al[0].item);
  if (loc.length !== 1 || plc.length !== 1 || loc[0] !== plc[0] || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day !== text(p.first_date)) { fail('The source location or scheduled start does not match.'); continue; }
  const evidence = (p.events || []).filter(e => e.task_id === source && e.movement === 'place' && e.phase === 'Build' && text(e.sheet) && e.date === day && text(e.item) === item && e.quantity_raw === 1 && text(e.location) === loc[0]);
  if (evidence.length !== 1) { fail('The original schedule row does not uniquely support this machine.'); continue; }
  const own = idsOf(a), parent = new Set(idsOf(p));
  if (own.some(id => !parent.has(id))) { fail('An identity on the alias differs from the scheduled machine.'); continue; }
  const e = evidence[0];
  aliases.push({ref, source, item, quantity: 1, location: loc[0], date: day,
   evidence: {task_id: source, sheet: e.sheet, date: e.date, item: e.item, quantity: e.quantity_raw, location: e.location}});
 }
 const hidden = new Set(aliases.map(a => a.ref));
 return {assets: list.filter(a => !hidden.has(keyOf(a))), aliases, pending};
}
function physicalAliasHtml963(model) {
 const m = model || physicalCountAssets963(allAssets());
 if (!m.aliases.length && !m.pending.length) return '';
 const link = key => '<button type="button" class="linkish" data-open="' + esc(key) + '">' + esc(key) + '</button>';
 return '<div class="notice info" data-physical-alias963><b>Source-linked references</b><p>' + m.aliases.map(a => link(a.ref) + ' links to ' + link(a.source) + ' · ' + esc(a.item) + ' at ' + esc(a.location) + '. Counted once under ' + esc(a.source) + '; both histories remain available.').join(' ') + '</p>'
  + (m.pending.length ? '<p class="norate">' + m.pending.map(a => link(a.ref) + ' → ' + link(a.source) + ': ' + esc(a.reason) + ' Both references remain in the counts pending reconciliation.').join(' ') + '</p>' : '') + '</div>';
}
