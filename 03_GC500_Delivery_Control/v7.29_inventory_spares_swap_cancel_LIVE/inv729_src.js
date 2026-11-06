/* v7.29 - INVENTORY, SPARES, SWAP AND CANCEL (see patch_v729.py). Andrew Fisher, 28 Sep 2026: "We need an inventory, and it
   says how much of each we currently have in stock. More so to work out how many sub-hired things are on site. More so
   again somewhere to put asset numbers that are not allocated anywhere - I have a spare Coates portaloo on site and one
   spare Event Portables toilet. Can I go into P12 and change a Coates toilet for a sub-hired one. And an option to cancel
   an order completely."
   - SPARES: S.spares, one record per unit that is on site and not at any location: its type, whose it is (Coates or the
     sub-hire company), its number if it has one, where it is parked. Synced as its own collection, merged, exported.
   - INVENTORY: per item type, what is ordered, what is on site at locations (Coates numbered, sub-hired by company, not
     numbered yet), the spares, and the total on site. Read from the same delivery record every other count reads.
   - SWAP: in Change deliveries, any Coates number or sub-hire unit on a location can be swapped for a spare or a new unit;
     the one coming out goes to spares (it stays on site) unless the box is unticked.
   - CANCEL: Cancel this order sits on the Change form, through the page's own cancel (setRowOff): off every day, list,
     count and sheet, with the name and the reason, and put back with one press. An order on site can hand its numbers
     to spares as it is cancelled. */
const INV = {disc: 'Toilets & amenities', swap: null};
const INV_COATES = 'Coates';
function spareList(){ return Object.entries(S.spares || {}).filter(([id, s]) => s && s.type).map(([id, s]) => Object.assign({}, s, {id})).sort((x, y) => String(x.type).localeCompare(String(y.type)) || String(x.co).localeCompare(String(y.co)) || String(x.no || '').localeCompare(String(y.no || ''))); }
function invTypeKey(l, a){ return (l.discipline || (a && a.discipline) || 'Other') + '|' + l.item; }
function invTypeWord(t){ const p = String(t || '').split('|'); return p.length > 1 ? p.slice(1).join('|') : String(t || ''); }
function invTypeDisc(t){ return String(t || '').split('|')[0]; }
/* a location's type for a unit coming in or going out: its biggest line (WC01 is two FWF and one accessible - FWF) */
function invTypeOf(a){ const L = (a && chargeLines(a)) || []; if (!L.length) return a ? (a.discipline || 'Other') + '|' + ((a.item_types || [])[0] || a.product || 'Unit') : null;
 const l = L.slice().sort((x, y) => (qtyOf(y) != null ? qtyOf(y) : 1) - (qtyOf(x) != null ? qtyOf(x) : 1))[0]; return invTypeKey(l, a); }
function invTypes(){ const s = new Set(); allAssets().filter(a => !a.relocation).forEach(a => chargeLines(a).forEach(l => l.item && s.add(invTypeKey(l, a)))); spareList().forEach(x => s.add(x.type)); return [...s].sort(); }
/* the Coates numbers on a location, as its count reads them (locNums), less any that are a supplier's */
function invCoatesNums(a){ const subNos = new Set(subOf(a.key).map(x => String(x.no)).filter(Boolean));
 return ((a._buildingNumbers && a._buildingNumbers.length) ? a._buildingNumbers : (a.asset_numbers || [])).map(String).filter(x => /^\d{5,8}$/.test(x) && !subNos.has(x)); }
function invOnSite(a, td){ const d = deliveryAsOf(a.key, td); return !!(d.recorded && (d.state === 'on site' || d.done)); }
/* every sub-hire company named anywhere: on a location or in spares */
function invCompanies(){ const s = new Set(subCompanies()); spareList().forEach(x => x.co && x.co !== INV_COATES && s.add(x.co)); return [...s]; }
function inventory(){
 const td = todayIso(), rows = new Map();
 const row = t => { if (!rows.has(t)) rows.set(t, {type: t, disc: invTypeDisc(t), item: invTypeWord(t), asked: 0, on: 0, coates: 0, sub: {}, nonum: 0, spareC: 0, spareSub: {}, spares: 0}); return rows.get(t); };
 allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key)).forEach(a => {
  const L = chargeLines(a); if (!L.length) return;
  const on = invOnSite(a, td), irs = on ? itemRows(a) : [];
  const lines = L.filter(l => l.item).map(l => { const asked = qtyOf(l) != null ? qtyOf(l) : 1, ir = irs.find(i => i.asked === l.item);
   const sup = ir && ir.qty_supplied != null && String(ir.qty_supplied).trim() !== '' && Number.isFinite(Number(ir.qty_supplied)) ? Number(ir.qty_supplied) : null;
   return {t: invTypeKey(l, a), asked, onq: on ? (sup != null ? sup : asked) : 0}; }).sort((x, y) => y.asked - x.asked);
  let coates = invCoatesNums(a).length; const subs = subOf(a.key).slice();
  lines.forEach(x => { const r = row(x.t); r.asked += x.asked; if (!x.onq) return; r.on += x.onq;
   const s = subs.splice(0, x.onq); s.forEach(u => { r.sub[u.co] = (r.sub[u.co] || 0) + 1; });
   const c = Math.min(coates, x.onq - s.length); coates -= c; r.coates += c; r.nonum += x.onq - s.length - c; });
 });
 spareList().forEach(s => { const r = row(s.type); r.spares++; if (s.co === INV_COATES) r.spareC++; else r.spareSub[s.co] = (r.spareSub[s.co] || 0) + 1; });
 const list = [...rows.values()].filter(r => r.asked || r.on || r.spares).sort((x, y) => x.disc.localeCompare(y.disc) || x.item.localeCompare(y.item));
 /* by company: sub-hired units on site, at locations and in spares */
 const cos = {};
 list.forEach(r => { Object.entries(r.sub).forEach(([c, n]) => { (cos[c] = cos[c] || {at: 0, spare: 0}).at += n; }); Object.entries(r.spareSub).forEach(([c, n]) => { (cos[c] = cos[c] || {at: 0, spare: 0}).spare += n; }); });
 /* spares whose number is also on a location - counted twice until somebody says which is right */
 const twice = spareList().filter(s => s.no).map(s => ({s, on: invNumberOn(s.no)})).filter(x => x.on.length);
 /* cancelled orders still carrying numbers or sub-hire units: on site they are stock nobody is using */
 const offOn = allAssets().filter(a => a._cancelled && (invCoatesNums(a).length || subOf(a.key).length)).map(a => ({a, nums: invCoatesNums(a), subs: subOf(a.key), on: invOnSite(a, td)}));
 return {list, cos, twice, offOn, spares: spareList(), td};
}
/* where else a number sits: a location's Coates numbers, or a sub-hire unit on a location */
function invNumberOn(no, exceptKey){
 const s = String(no || '').trim(); if (!s) return [];
 const out = numberOwners(s, exceptKey || '').filter(o => o.how === 'number').map(o => o.key);
 allAssets().forEach(a => { if (a.key !== exceptKey && subOf(a.key).some(x => String(x.no) === s) && !out.includes(a.key)) out.push(a.key); });
 return out;
}
/* ---- the writes. Each carries the name of whoever made it, and the time */
function spareCheck(co, no, exceptKey, exceptSpare){
 co = String(co || '').trim().replace(/\s+/g, ' '); no = String(no || '').trim().replace(/\s+/g, '');
 if (!co) return {err: 'Say whose it is - Coates, or the company it is sub-hired from.'};
 if (co.toLowerCase() === 'coates') co = INV_COATES;
 if (no && !/^[A-Za-z0-9-]{3,12}$/.test(no)) return {err: 'An asset number is digits, sometimes with letters - 1195658, not ' + no + '.'};
 if (no) { const dup = spareList().find(x => x.id !== exceptSpare && String(x.no || '').toLowerCase() === no.toLowerCase() && x.co === co);
  if (dup) return {err: no + ' is already in spares (' + invTypeWord(dup.type) + ').'};
  const on = invNumberOn(no, exceptKey); if (on.length) return {err: no + ' is on ' + on.join(' and ') + '. Swap it there, or take it off there first.'}; }
 return {co, no};
}
function spareWrite(type, co, no, note, who){
 S.spares = S.spares || {};
 const id = 'SP-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
 S.spares[id] = {type, co, no: no || null, note: String(note || '').trim().slice(0, 80) || null, by: who, at: new Date().toISOString()};
 stampIt('spares', id, who);
 return id;
}
function spareDrop(id, who){ if (!(S.spares || {})[id]) return false; delete S.spares[id]; stampIt('spares', id, who); return true; }
function spareAdd(f){
 if (!mayWrite('a spare')) return false;
 const type = String(f.type || '').trim(); if (!type) { flash('Pick what it is first.'); return false; }
 const c = spareCheck(f.co, f.no); if (c.err) { flash(c.err); return false; }
 const who = whoAmI(); if (!who) return false;
 spareWrite(type, c.co, c.no, f.note, who); bump();
 flash('Spare ' + invTypeWord(type) + ' (' + c.co + (c.no ? ' no. ' + c.no : '') + ') recorded by ' + who + '.');
 return true;
}
function spareRemove(id){
 if (!mayWrite('a spare')) return false;
 const s = (S.spares || {})[id]; if (!s) return false;
 const who = whoAmI(); if (!who) return false;
 spareDrop(id, who); bump();
 flash('Spare ' + invTypeWord(s.type) + (s.no ? ' ' + s.no : '') + ' taken out of spares by ' + who + '.');
 return true;
}
/* one unit onto a location: a Coates number, or a sub-hire unit named for its company */
function invPutOn(key, co, no, who){
 if (co === INV_COATES) { numberPutOn(key, no, who); return true; }
 const have = subOf(key).filter(x => x.co.toLowerCase() === co.toLowerCase());
 return unitAdd(key, {label: 'Sub-hire: ' + co + (no ? '' : ' · unit ' + (have.filter(x => !x.no).length + 1)), asset_no: no || ''});
}
/* one unit off a location, as the form's own x takes it off */
function invTakeOff(key, from, who){
 if (from.kind === 'c') { if (!(numberIsOursAlone(key, from.no) && numberErase(key, from.no))) numberTakeOff(key, from.no, who); return true; }
 return unitRemove(key, from.no ? {asset_no: from.no} : {label: from.label});
}
function spareUse(id, key){
 if (!mayWrite('a spare')) return false;
 const s = (S.spares || {})[id], a = assetOf(key); if (!s || !a) return false;
 if (s.co === INV_COATES && !s.no) { flash('A Coates spare needs its asset number before it can go on a location - take it out and add it again with the number.'); return false; }
 if (s.no) { const on = invNumberOn(s.no, key); if (on.length) { flash(s.no + ' is already on ' + on.join(' and ') + '.'); return false; } }
 const who = whoAmI(); if (!who) return false;
 if (!invPutOn(key, s.co, s.no, who)) return false;
 spareDrop(id, who); bump();
 flash(invTypeWord(s.type) + ' ' + (s.no || '(' + s.co + ')') + ' is now on ' + key + ' - out of spares. By ' + who + '.');
 return true;
}
/* THE SWAP. What comes out goes to spares (it is still on site) unless the box says it has gone; what goes in comes
   out of spares, or is a new unit typed here. Everything is checked before anything is written. */
function invSwap(key, from, to, keep){
 if (!mayWrite('a swap')) return false;
 const a = assetOf(key); if (!a) return false;
 const type = invTypeOf(a) || '';
 let tgt = null;
 if (to.spare) { const s = (S.spares || {})[to.spare]; if (!s) { flash('That spare is not in spares any more.'); return false; }
  if (s.co === INV_COATES && !s.no) { flash('That Coates spare has no asset number - it cannot go on a location until it has one.'); return false; }
  if (s.no && String(s.no) !== String(from.no || '')) { const on = invNumberOn(s.no, key); if (on.length) { flash(s.no + ' is on ' + on.join(' and ') + '.'); return false; } }
  tgt = {co: s.co, no: s.no || '', spare: to.spare}; }
 else { const c = spareCheck(to.co, to.no, key); if (c.err) { flash(c.err); return false; }
  if (c.co === INV_COATES && !c.no) { flash('Type the Coates asset number going in.'); return false; }
  tgt = {co: c.co, no: c.no}; }
 if (tgt.co === (from.kind === 'c' ? INV_COATES : from.co) && tgt.no && String(tgt.no) === String(from.no || '')) { flash('That is the same unit.'); return false; }
 const who = whoAmI(); if (!who) return false;
 const outWord = (from.kind === 'c' ? from.no : from.co + (from.no ? ' ' + from.no : ''));
 invTakeOff(key, from, who);
 if (keep) spareWrite(type, from.kind === 'c' ? INV_COATES : from.co, from.no || '', 'Swapped out of ' + key, who);
 invPutOn(key, tgt.co, tgt.no, who);
 if (tgt.spare) spareDrop(tgt.spare, who);
 INV.swap = null;
 chSay(key + ': ' + outWord + ' out' + (keep ? ' (to spares)' : '') + ', ' + (tgt.co === INV_COATES ? tgt.no : tgt.co + (tgt.no ? ' ' + tgt.no : '')) + ' in');
 bump();
 return true;
}
/* a cancelled order's numbers to spares - the units are on site and free to be used somewhere else */
function spareFromCancelled(key){
 if (!mayWrite('a spare')) return false;
 const a = assetOf(key); if (!a) return false;
 const who = whoAmI(); if (!who) return false;
 const type = invTypeOf(a) || '', nums = invCoatesNums(a), subs = subOf(key);
 nums.forEach(n => { invTakeOff(key, {kind: 'c', no: n}, who); spareWrite(type, INV_COATES, n, 'From cancelled ' + key, who); });
 subs.forEach(x => { invTakeOff(key, {kind: 's', co: x.co, no: x.u.asset_no || '', label: x.u.label}, who); spareWrite(type, x.co, x.u.asset_no || '', 'From cancelled ' + key, who); });
 bump();
 flash((nums.length + subs.length) + ' unit' + (nums.length + subs.length === 1 ? '' : 's') + ' from cancelled ' + key + ' moved to spares by ' + who + '.');
 return true;
}
/* ---- the cancel dialog's extra line: an order on site can hand its numbers to spares as it goes */
function cxSpareHtml(key){
 const a = assetOf(key); if (!a) return '';
 const nums = invCoatesNums(a), subs = subOf(key), n = nums.length + subs.length; if (!n) return '';
 const on = invOnSite(a, todayIso());
 const what = nums.concat(subs.map(x => x.co + (x.no ? ' ' + x.no : ''))).join(', ');
 return `<label class="chk invchk"><input type="checkbox" id="cxSpare"${on ? ' checked' : ''}> Put its ${n === 1 ? 'unit' : n + ' units'} (${esc(what)}) in spares - ${on ? 'it is on site, so it can be used somewhere else' : 'only if it is actually on site'}</label>`;
}
/* ---- the Change form: the cancel row, and the swap */
function chCancelRow(a, ro){
 const k = a.key, dis = ro ? ' disabled' : '';
 if (a._cancelled) return `<div class="notice warn chcx"><div><b>${esc(k)} is cancelled.</b> ${esc(rowOffWords(k))}</div><button type="button" class="btn sm" data-restorek="${esc(k)}"${dis}>Put ${esc(k)} back on</button></div>`;
 return `<div class="chcx"><button type="button" class="btn ghost sm chcxbtn" data-cancelk="${esc(k)}"${dis}>Cancel this order</button><span class="hint">Not coming? It comes off every day, list, count and sheet, with your name and the reason. One press puts it back.</span></div>`;
}
function chSwapBtn(k, from, dis){ return `<button type="button" class="chswapb" data-chswap="${esc(JSON.stringify(from))}"${dis} aria-label="Swap this unit at ${esc(k)}" title="Swap it for a spare or another unit">⇄ Swap</button>`; }
function chSwapHtml(a, ro){
 const sw = INV.swap; if (!sw || sw.key !== a.key || ro) return '';
 const k = a.key, from = sw.from, type = invTypeOf(a) || '', sp = spareList().filter(s => !(s.co === INV_COATES && !s.no));
 /* same type first, and within it the other owner first - a Coates unit out is most often a sub-hire in, and back */
 const fromCo = from.kind === 'c' ? INV_COATES : from.co, rank = s => s.co === fromCo ? 1 : 0;
 const same = sp.filter(s => s.type === type).sort((x, y) => rank(x) - rank(y)), other = sp.filter(s => s.type !== type);
 const opt = s => `<option value="sp|${esc(s.id)}">${esc(invTypeWord(s.type))} · ${esc(s.co)}${s.no ? ' no. ' + esc(s.no) : ' (no number)'}${s.note ? ' · ' + esc(s.note) : ''}</option>`;
 const outWord = from.kind === 'c' ? 'Coates ' + from.no : from.co + (from.no ? ' no. ' + from.no : ' (no number)');
 const pick = sw.pick || (same.length ? 'sp|' + same[0].id : 'new-sub');
 return `<div class="notice info chswapbox" id="chSwapBox"><b>Swap ${esc(outWord)} at ${esc(k)} for</b>
 <select id="chSwapTo" aria-label="What goes in">
 ${same.length ? `<optgroup label="Spares - ${esc(invTypeWord(type))}">${same.map(opt).join('')}</optgroup>` : ''}
 ${other.length ? `<optgroup label="Other spares">${other.map(opt).join('')}</optgroup>` : ''}
 <optgroup label="Not in spares"><option value="new-sub">A sub-hire unit - type it below</option><option value="new-c">A Coates unit - type its number below</option></optgroup></select>
 <div class="chdrow" id="chSwapNew"${/^sp\|/.test(pick) ? ' hidden' : ''}><input id="chSwapCo" list="chSubCos" autocomplete="off" placeholder="company" value="${esc(pick === 'new-c' ? INV_COATES : (invCompanies()[0] || ''))}">
 <input id="chSwapNo" autocomplete="off" placeholder="its asset number"></div>
 <label class="chk"><input type="checkbox" id="chSwapKeep" checked> ${esc(outWord)} stays on site - put it in spares</label>
 <div class="chacts"><button type="button" class="btn primary" id="chSwapGo">Swap</button><button type="button" class="btn ghost" id="chSwapX">Leave it</button></div>
 <div class="hint">Untick the box if ${esc(outWord)} has left site. Both ends carry your name and the time, and the inventory follows.</div></div>`;
}
function chSwapBind(pane){
 const q = s => pane.querySelector(s);
 pane.querySelectorAll('[data-chswap]').forEach(b => b.onclick = () => { let from = null; try { from = JSON.parse(b.dataset.chswap); } catch (e) {} if (!from) return;
  INV.swap = {key: CHG.key, from}; render(); setTimeout(() => { const x = $('#chSwapBox'); if (x) { try { x.scrollIntoView({block: 'nearest'}); } catch (e) {} } }, 0); });
 const to = q('#chSwapTo'); if (!to || !INV.swap) return;
 if (INV.swap.pick) to.value = INV.swap.pick;
 to.onchange = () => { INV.swap.pick = to.value; const nw = q('#chSwapNew'), co = q('#chSwapCo'); if (nw) nw.hidden = /^sp\|/.test(to.value);
  if (co && to.value === 'new-c') co.value = INV_COATES; else if (co && to.value === 'new-sub' && co.value === INV_COATES) co.value = invCompanies()[0] || ''; };
 q('#chSwapX').onclick = () => { INV.swap = null; render(); };
 q('#chSwapGo').onclick = () => { const v = to.value, keep = !!(q('#chSwapKeep') || {}).checked;
  const target = /^sp\|/.test(v) ? {spare: v.slice(3)} : {co: v === 'new-c' ? INV_COATES : (q('#chSwapCo') || {}).value, no: (q('#chSwapNo') || {}).value};
  invSwap(INV.swap.key, INV.swap.from, target, keep); };
}
/* ---- the Inventory card, under the day on Change deliveries */
function invHtml(ro){
 const I = inventory(), dis = ro ? ' disabled' : '';
 const discs = [...new Set(I.list.map(r => r.disc))];
 if (INV.disc && INV.disc !== '*' && !discs.includes(INV.disc)) INV.disc = '*';
 const rows = I.list.filter(r => INV.disc === '*' || r.disc === INV.disc);
 const tot = k => rows.reduce((n, r) => n + r[k], 0), sumObj = k => rows.reduce((n, r) => n + Object.values(r[k]).reduce((m, v) => m + v, 0), 0);
 const coTxt = o => Object.entries(o).map(([c, n]) => `${esc(c)} ${n}`).join('<br>') || '<span class="norate">-</span>';
 const cosLine = Object.entries(I.cos).sort((x, y) => x[0].localeCompare(y[0])).map(([c, v]) => `<span class="invco"><b>${esc(c)}</b> ${v.at + v.spare} on site <span class="w">(${v.at} at locations${v.spare ? ', ' + v.spare + ' spare' : ''})</span></span>`).join('');
 const chips = [['*', 'Everything']].concat(discs.map(d => [d, d])).map(([v, w]) => `<button type="button" class="chip invdisc${INV.disc === v ? ' on' : ''}" data-invdisc="${esc(v)}" aria-pressed="${INV.disc === v}">${esc(w)}</button>`).join('');
 const types = invTypes(), tDiscs = [...new Set(types.map(invTypeDisc))];
 const typeSel = `<select id="spType" aria-label="What it is"><option value="">- what it is -</option>${tDiscs.map(d => `<optgroup label="${esc(d)}">${types.filter(t => invTypeDisc(t) === d).map(t => `<option value="${esc(t)}"${INV.spType === t ? ' selected' : ''}>${esc(invTypeWord(t))}</option>`).join('')}</optgroup>`).join('')}</select>`;
 const cos = [INV_COATES].concat(invCompanies());
 const live = allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key));
 const useSel = s => { const same = live.filter(a => invTypeOf(a) === s.type).map(a => a.key).sort(), rest = live.filter(a => invTypeOf(a) !== s.type && invTypeDisc(invTypeOf(a) || '') === invTypeDisc(s.type)).map(a => a.key).sort();
  return `<select data-spuse-to="${esc(s.id)}" aria-label="Location for this spare"${dis}><option value="">use at...</option>${same.length ? `<optgroup label="${esc(invTypeWord(s.type))}">${same.map(k => `<option>${esc(k)}</option>`).join('')}</optgroup>` : ''}${rest.length ? `<optgroup label="Other ${esc(invTypeDisc(s.type).toLowerCase())}">${rest.map(k => `<option>${esc(k)}</option>`).join('')}</optgroup>` : ''}</select><button type="button" class="btn sm" data-spuse="${esc(s.id)}"${dis}>Use</button>`; };
 const spRows = I.spares.map(s => `<li><div class="invsp1"><b>${esc(invTypeWord(s.type))}</b> · ${esc(s.co)}${s.no ? ` <b class="mono">${esc(s.no)}</b>` : ' <span class="norate">no number</span>'}${s.note ? ` <span class="w">· ${esc(s.note)}</span>` : ''}<span class="w"> · ${esc(s.by || 'unnamed')} ${esc(fmtStamp(s.at || ''))}</span></div>
 <div class="chdrow invsp2">${useSel(s)}<button type="button" class="chnumx" data-spoff="${esc(s.id)}"${dis} aria-label="Take this one out of spares" title="Take it out of spares - it has left site">×</button></div></li>`).join('');
 const warn = [].concat(
  I.twice.map(x => `<li><b class="mono">${esc(x.s.no)}</b> is in spares and also on ${esc(x.on.join(' and '))} - counted twice. <button type="button" class="btn ghost sm" data-spoff="${esc(x.s.id)}"${dis}>Take it out of spares</button></li>`),
  I.offOn.map(x => `<li><b>${esc(x.a.key)}</b> is cancelled but still carries ${esc(x.nums.concat(x.subs.map(s => s.co + (s.no ? ' ' + s.no : ''))).join(', '))}${x.on ? ' and is marked on site' : ''}. <button type="button" class="btn ghost sm" data-spfromcx="${esc(x.a.key)}"${dis}>Move to spares</button></li>`));
 return `<div class="card invcard nosfold" id="invCard"><div class="invhead"><h3>Inventory - on site now</h3><span class="sub">${esc(fmtDate(I.td))} · from the delivery record, so it moves as things are ticked on site</span></div>
 ${cosLine ? `<div class="invcos"><span class="w">Sub-hired on site:</span> ${cosLine}</div>` : '<p class="norate">Nothing is recorded as sub-hired on site yet.</p>'}
 <div class="invchips" role="group" aria-label="Which trade">${chips}</div>
 <div class="invwrap"><table class="invtab"><thead><tr><th>Type</th><th class="num">Total on site</th><th>Sub-hire</th><th>Spare</th><th class="num">At locations</th><th class="num">Coates numbered</th><th class="num">No number yet</th><th class="num">Ordered</th></tr></thead>
 <tbody>${rows.map(r => `<tr><td>${esc(r.item)}${INV.disc === '*' ? `<span class="w"> · ${esc(r.disc)}</span>` : ''}</td><td class="num"><b>${r.on + r.spares}</b></td><td>${coTxt(r.sub)}</td>
 <td>${r.spares ? [r.spareC ? 'Coates ' + r.spareC : ''].concat(Object.entries(r.spareSub).map(([c, n]) => esc(c) + ' ' + n)).filter(Boolean).join('<br>') : '<span class="norate">-</span>'}</td>
 <td class="num">${r.on}</td><td class="num">${r.coates}</td><td class="num">${r.nonum || '<span class="norate">0</span>'}</td><td class="num">${r.asked}</td></tr>`).join('') || '<tr><td colspan="8" class="norate">Nothing of this trade on the job.</td></tr>'}</tbody>
 <tfoot><tr><td>Total</td><td class="num"><b>${tot('on') + tot('spares')}</b></td><td>${sumObj('sub')}</td><td>${tot('spares')}</td><td class="num">${tot('on')}</td><td class="num">${tot('coates')}</td><td class="num">${tot('nonum')}</td><td class="num">${tot('asked')}</td></tr></tfoot></table></div>
 <div class="hint">Total on site = at locations + spares. At locations: the order's quantity once it is ticked on site (or what was recorded as supplied). A location with two types counts its numbers against its biggest line. Cancelled orders are not counted.</div>
 ${warn.length ? `<div class="notice warn invwarn"><b>Check</b><ul>${warn.join('')}</ul></div>` : ''}
 <h3 class="invh">Spares - on site, not allocated anywhere (${I.spares.length})</h3>
 ${I.spares.length ? `<ul class="chnums invspares">${spRows}</ul>` : '<p class="norate">No spares recorded.</p>'}
 <div class="invadd"><div class="invaddrow">${typeSel}<input id="spCo" list="spCos" autocomplete="off" placeholder="whose - Coates or the company" value="${esc(INV.spCo || INV_COATES)}"${dis}><datalist id="spCos">${cos.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
 <div class="invaddrow"><input id="spNo" autocomplete="off" placeholder="asset number (if it has one)"${dis}><input id="spNote" autocomplete="off" maxlength="80" placeholder="where it is - e.g. Coates compound"${dis}><button type="button" class="btn" id="spAdd"${dis}>Add spare</button></div>
 <div class="hint">One per unit. A spare can go onto a location from here (Use), or through Swap on a location's form above.</div></div></div>`;
}
function invBind(pane){
 const q = s => pane.querySelector(s);
 pane.querySelectorAll('[data-invjump]').forEach(b => b.onclick = () => { const c = $('#invCard'); if (c) { try { c.scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (e) { c.scrollIntoView(); } } });
 pane.querySelectorAll('[data-invdisc]').forEach(b => b.onclick = () => { INV.disc = b.dataset.invdisc; render(); });
 pane.querySelectorAll('[data-spoff]').forEach(b => b.onclick = () => spareRemove(b.dataset.spoff));
 pane.querySelectorAll('[data-spuse]').forEach(b => b.onclick = () => { const sel = pane.querySelector('[data-spuse-to="' + b.dataset.spuse + '"]'), k = sel ? sel.value : '';
  if (!k) { flash('Pick the location it is going to.'); return; } spareUse(b.dataset.spuse, k); });
 pane.querySelectorAll('[data-spfromcx]').forEach(b => b.onclick = () => spareFromCancelled(b.dataset.spfromcx));
 const ty = q('#spType'), co = q('#spCo'); if (ty) ty.onchange = () => { INV.spType = ty.value; }; if (co) co.onchange = () => { INV.spCo = co.value; };
 const add = q('#spAdd'); if (add) add.onclick = () => { const no = q('#spNo'), note = q('#spNote');
  if (spareAdd({type: ty ? ty.value : '', co: co ? co.value : '', no: no ? no.value : '', note: note ? note.value : ''})) { INV.spType = ty ? ty.value : ''; INV.spCo = co ? co.value : ''; } };
}
/* a number typed straight onto a location, while it sits in spares, has been used: it leaves spares, named */
function spareClaim(no, co, who){
 const s = String(no || '').trim(); if (!s) return false;
 const hit = spareList().filter(x => String(x.no || '') === s && (co === INV_COATES ? x.co === INV_COATES : x.co.toLowerCase() === String(co || '').toLowerCase()));
 hit.forEach(x => spareDrop(x.id, who));
 return hit.length > 0;
}
