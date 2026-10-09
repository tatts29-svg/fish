/* v7.34 - THE REST OF AN ORDER ON ANOTHER DAY (see patch_v734.py). Andrew Fisher, 29 Sep 2026: "Since the accessible
   toilet did not turn up, how do we get this as not turned up, or push it to a next-day delivery?"
   Not turned up: What turned up, 0 - the location shows Short (v7.30).
   Pushed to another day: "Deliver the rest on <day>" makes a follow-up reference (WC01-R1) - a delivery only. It has its
   own day on the Timeline, its own light, its own driver and install sheets and the location's map spot; the order, its
   money, its asset number and its install ticks stay on WC01. When the follow-up is ticked on site, it counts as
   arrived on WC01 and WC01's Short clears by itself. */
function restRefsOf(key, item){ return (S.added || []).filter(x => x && x.rest_of === key && (!item || x.rest_item === item) && isRef(x.key) && !(assetOf(x.key) || {})._cancelled); }
function restArrived(a, item){ const td = todayIso(); return restRefsOf(a.key || a, item).filter(x => { const r = assetOf(x.key); return r && invOnSite(r, td); }).reduce((n, x) => n + (Number(x.rest_qty) || 1), 0); }
function restPending(a, item){ const td = todayIso(); return restRefsOf(a.key || a, item).filter(x => { const r = assetOf(x.key); return r && !invOnSite(r, td); }); }
function restKeyFor(p){
 const base = String(p).replace(/-/g, '').slice(0, 8);
 for (let n = 1; n < 10; n++) { const k = base + '-R' + n; if (/^[A-Z][A-Z0-9]{0,7}(-[A-Z0-9]{1,4})?$/.test(k) && !isRef(k) && !tombedHere(k) && !deletionOf(k)) return k; }
 return null;
}
/* the follow-up: WC01's short item, on a day of its own */
function bookRest(key, item, day){
 if (!mayWrite('a follow-up delivery')) return false;
 const a = assetOf(key); if (!a) return false;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day || ''))) { flash('Pick the day the rest is coming.'); return false; }
 const l = chargeLines(a).find(x => x.item === item), q = l && qtyOf(l) != null ? qtyOf(l) : 1;
 const r = itemRows(a).find(x => x.asked === item) || {}, g = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' ? Number(r.qty_supplied) : null;
 if (g == null) { flash('Count what turned up first - put how many ' + item + ' arrived at ' + key + '.'); return false; }
 const n = q - g - restArrived(a, item) - restPending(a, item).reduce((s, x) => s + (Number(x.rest_qty) || 1), 0);
 if (n <= 0) { flash('Nothing of ' + item + ' is still to come at ' + key + '.'); return false; }
 const nk = restKeyFor(key); if (!nk) { flash('No free follow-up reference for ' + key + '.'); return false; }
 const who = whoAmI(); if (!who) return false;
 const e = effectiveDates(a);
 const made = addReference({key: nk, disc: a.discipline, type: item, name: item + ' ×' + n + ' - rest of ' + key + (a.name ? ' (' + a.name + ')' : ''),
  from: day, to: e.out && e.out >= day ? e.out : null, loc: chWhere(a) || key, branch: (S.branch || {})[key] || '',
  note: 'Rest of ' + key + ': ' + item + ' ×' + n + ' did not arrive' + (e.in ? ' on ' + chShort(e.in) : '') + '. Its order, number and install stay on ' + key + '.'});
 if (!made) return false;
 const rec = (S.added || []).find(x => x.key === nk); if (rec) Object.assign(rec, {rest_of: key, rest_item: item, rest_qty: n});
 chSay(key + ': ' + item + ' ×' + n + ' now due ' + chShort(day) + ' as ' + nk);
 bump(); return true;
}
/* on the follow-up's own form: what it is, and the way back to the order */
function restNotice(a){
 if (!a || !a.rest_of) return '';
 return `<div class="notice info chrestn"><b>${esc(a.key)} is the rest of ${esc(a.rest_of)}</b> - ${esc(a.rest_item || '')} ×${esc(String(a.rest_qty || 1))}. Tick it on site when it arrives and it counts as arrived on ${esc(a.rest_of)}. Its asset number and install ticks go on ${esc(a.rest_of)}. <button type="button" class="btn ghost sm" data-fixref="${esc(a.rest_of)}">Open ${esc(a.rest_of)}</button></div>`;
}
/* the rest, under a short line on What turned up */
function chRestRow(a, l, q, g, ro){
 const dis = ro ? ' disabled' : '', arr = restArrived(a, l.item), pend = restPending(a, l.item);
 const booked = pend.map(x => { const r = assetOf(x.key), d = r ? effectiveDates(r).in : null; return `<span class="chresto">${esc(x.key)} · ${esc(String(x.rest_qty || 1))} due ${d ? esc(chShort(d)) : 'no day'} <button type="button" class="linkish" data-fixref="${esc(x.key)}">Open</button></span>`; }).join('')
  + (arr ? `<span class="chresto">${arr} arrived on a follow-up</span>` : '');
 const left = g == null ? 0 : q - g - arr - pend.reduce((s, x) => s + (Number(x.rest_qty) || 1), 0);
 const tomorrow = (() => { const d = new Date(todayIso() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
 if (!booked && left <= 0) return '';
 return `<tr class="chrestr"><td colspan="4">${booked}${left > 0 ? `<span class="chrestb">Deliver the rest (${left}) on <input type="date" data-chrestday="${esc(l.item)}" value="${esc(tomorrow)}"${dis}> <button type="button" class="btn sm" data-chrest="${esc(l.item)}"${dis}>Book it</button></span>` : ''}</td></tr>`;
}
