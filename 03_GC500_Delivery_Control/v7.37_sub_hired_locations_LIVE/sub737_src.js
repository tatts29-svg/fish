/* v7.37 - SUB-HIRED LOCATIONS (see patch_v737.py). Andrew Fisher, 29 Sep 2026: "Sub-hired needs some work. I want an
   option when I go into, for example, WC41 to clearly say this is a sub-hired unit, then it removes anything to do with
   Coates - with an option to do so. ... We need some attention to make sure this is easy, and also define sub-hired gear
   and where it is."
   - SUB-HIRED LOCATION: the Change form's Sub-hire box has "This location is sub-hired". It asks first: whose gear it is,
     and whether to take the location's Coates numbers off (to spares if it is on site). Once marked, the location says
     SUB-HIRED · the company on the form, in the walk-around and on the driver and install sheets; no Coates number is
     asked for there; the walk-around records its units as that company's whoever is set at the top. "Change back to
     Coates" undoes it. Stored as its own synced collection, subhire, one document per location, with who and when.
   - SHORT FLEET NUMBERS: a sub-hire company's number can be 1 to 12 characters (Event Portables "12", "0065"); leading
     zeros are kept. Coates numbers are unchanged.
   - MANY AT ONCE: paste a location's fleet numbers (one per line, or spaces, or commas) and Add all. Each is checked:
     a number already here, or on another location, is refused and named.
   - SUB-HIRE REGISTER: under the inventory, every sub-hired unit on the job by company - which location, what it is,
     its fleet numbers, how many of the order are numbered - and the company's spares.
   Money is not touched: what is charged and what is paid read the contracts, quotes and dockets as before. */
function subhireOf(key){ const r = (S.subhire || {})[key]; return r && r.co ? r : null; }
function subhireCo(key){ const r = subhireOf(key); return r ? r.co : ''; }
function subhireChip(key){ const c = subhireCo(key); return c ? ` <span class="chip subhirechip" title="${esc(key)} is sub-hired from ${esc(c)} - its units belong to ${esc(c)}, not Coates">SUB-HIRED · ${esc(c)}</span>` : ''; }
function subNoRx(co){ return String(co || '').trim().toLowerCase() === 'coates' ? /^[A-Za-z0-9-]{3,12}$/ : /^[A-Za-z0-9-]{1,12}$/; }
const SUBH = {ask: null, res: null};
function subhireAskHtml(a, ro){
 const k = a.key, dis = ro ? ' disabled' : '', cos = subCompanies(), mk = subhireOf(k);
 if (mk) return `<div class="notice subhirebox"><div><b>SUB-HIRED · ${esc(mk.co)}</b> - ${esc(k)} is ${esc(mk.co)} gear. No Coates number is asked for here, and its units count as ${esc(mk.co)} units in the inventory, the walk-around and the sheets.<span class="w"> Marked by ${esc(mk.by || 'unnamed')} ${esc(fmtStamp(mk.at || ''))}${mk.coates_off && mk.coates_off.length ? ' · Coates numbers taken off: ' + esc(mk.coates_off.join(', ')) : ''}</span></div><button type="button" class="btn ghost sm" data-subhireoff="${esc(k)}"${dis}>Change back to Coates</button></div>`;
 if (SUBH.ask !== k) return `<div class="chdrow"><button type="button" class="btn ghost sm" data-subhireask="${esc(k)}"${dis}>This location is sub-hired…</button></div>`;
 const nums = invCountNums(a), on = invOnSite(a, todayIso());
 return `<div class="notice warn subhireask"><div><b>Mark ${esc(k)} as sub-hired?</b>
  <div class="chdrow"><label for="subhCo">Whose gear</label><input id="subhCo" list="chSubCos" autocomplete="off" value="${esc(cos[0] || 'Event Portables')}"${dis}></div>
  ${nums.length ? `<label class="chk"><input type="checkbox" id="subhOff" checked${dis}> Take its Coates number${nums.length === 1 ? '' : 's'} off (${esc(nums.join(', '))})${on ? ' - into spares, as it is on site' : ''}</label>` : '<p class="w">It carries no Coates number, so nothing comes off.</p>'}
  <p class="w">From then on ${esc(k)} asks for the company's fleet numbers only. Charges and costs are not changed.</p></div>
  <div class="chdrow"><button type="button" class="btn primary sm" data-subhireyes="${esc(k)}"${dis}>Yes, it is sub-hired</button><button type="button" class="btn ghost sm" data-subhireno${dis}>Not now</button></div></div>`;
}
function subhireMark(key, co, takeOff){
 if (!mayWrite('a sub-hired location')) return false;
 const a = assetOf(key); if (!a) return false;
 co = String(co || '').trim().replace(/\s+/g, ' ');
 if (!co || co.toLowerCase() === 'coates') { flash('Say whose gear it is - Event Portables, for example.'); return false; }
 const who = whoAmI(); if (!who) return false;
 const off = [];
 if (takeOff) { const on = invOnSite(a, todayIso());
  invCountNums(a).forEach(n => { const t = invTypeOfNumber(a, n); numberTakeOff(key, n, who); if (unitsOf(key).some(u => String(u.asset_no || '').trim() === n)) unitRemove(key, {asset_no: n});
   if (on) spareWrite(t, INV_COATES, n, 'Off ' + key + ' - sub-hired location', who); off.push(n); }); }
 S.subhire = S.subhire || {};
 S.subhire[key] = {co, by: who, at: new Date().toISOString(), coates_off: off.length ? off : null};
 stampIt('subhire', key, who);
 SUBH.ask = null; bump();
 flash(key + ' is sub-hired from ' + co + (off.length ? ' - ' + off.join(', ') + ' taken off' + (invOnSite(a, todayIso()) ? ' and put in spares' : '') : '') + '. By ' + who + '.');
 return true;
}
function subhireUnmark(key){
 if (!mayWrite('a sub-hired location')) return false;
 if (!subhireOf(key)) return false;
 const who = whoAmI(); if (!who) return false;
 delete S.subhire[key]; stampIt('subhire', key, who); bump();
 flash(key + ' is back to Coates - its sub-hire units stay recorded until you take them off. By ' + who + '.');
 return true;
}
/* many fleet numbers at once */
function subNumbersIn(text){ return [...new Set(String(text || '').split(/[\s,;]+/).map(s => s.trim()).filter(Boolean))]; }
function subAddMany(key, co, text){
 if (!mayWrite('sub-hire units')) return null;
 co = String(co || '').trim().replace(/\s+/g, ' ');
 if (!co || co.toLowerCase() === 'coates') { flash('Say whose units these are - Event Portables, for example. Coates numbers go in Allocated asset numbers.'); return null; }
 const who = whoAmI(); if (!who) return null;
 const ns = subNumbersIn(text), res = {added: [], refused: []};
 if (!ns.length) { flash('Paste or type the numbers first - one per line.'); return null; }
 ns.forEach(n => {
  if (!subNoRx(co).test(n)) { res.refused.push([n, 'not a number']); return; }
  if (subOf(key).some(x => String(x.no).toLowerCase() === n.toLowerCase())) { res.refused.push([n, 'already on ' + key]); return; }
  const on = invNumberOn(n, key); if (on.length) { res.refused.push([n, 'on ' + on.join(' and ')]); return; }
  if (unitAdd(key, {label: 'Sub-hire: ' + co, asset_no: n})) { res.added.push(n); spareClaim(n, co, who); } else res.refused.push([n, 'not recorded']);
 });
 SUBH.res = {key, co, ...res}; bump();
 flash(key + ': ' + res.added.length + ' ' + co + ' unit' + (res.added.length === 1 ? '' : 's') + ' recorded' + (res.refused.length ? ', ' + res.refused.length + ' refused - see the list' : '') + '. By ' + who + '.');
 return res;
}
function subManyHtml(a, ro){
 const k = a.key, dis = ro ? ' disabled' : '', r = SUBH.res && SUBH.res.key === k ? SUBH.res : null;
 return `<details class="submany"${r ? ' open' : ''}><summary>Add many at once</summary>
  <textarea id="chSubMany" rows="4" placeholder="one number per line - 0521&#10;0996&#10;0191" aria-label="Fleet numbers for ${esc(k)}"${dis}></textarea>
  <div class="chdrow"><button type="button" class="btn" id="chSubManyAdd"${dis}>Add all${subhireCo(k) ? ' as ' + esc(subhireCo(k)) : ''}</button></div>
  ${r ? `<p class="w">${r.added.length ? 'Recorded: <span class="mono">' + esc(r.added.join(', ')) + '</span>. ' : ''}${r.refused.length ? 'Refused: ' + r.refused.map(([n, w]) => `<span class="mono">${esc(n)}</span> (${esc(w)})`).join(', ') + '.' : ''}</p>` : ''}</details>`;
}
function subhireBind(pane){
 pane.querySelectorAll('[data-subhireask]').forEach(b => b.onclick = () => { SUBH.ask = b.dataset.subhireask; render(); });
 pane.querySelectorAll('[data-subhireno]').forEach(b => b.onclick = () => { SUBH.ask = null; render(); });
 pane.querySelectorAll('[data-subhireyes]').forEach(b => b.onclick = () => { const co = pane.querySelector('#subhCo'), off = pane.querySelector('#subhOff'); subhireMark(b.dataset.subhireyes, co ? co.value : '', off ? off.checked : false); });
 pane.querySelectorAll('[data-subhireoff]').forEach(b => b.onclick = () => subhireUnmark(b.dataset.subhireoff));
 const ma = pane.querySelector('#chSubManyAdd'); if (ma) ma.onclick = () => { const k = CHG.key, t = pane.querySelector('#chSubMany'), c = pane.querySelector('#chSubCo');
  subAddMany(k, subhireCo(k) || (c ? c.value : ''), t ? t.value : ''); };
}
/* the sub-hire register: every sub-hired unit on the job, by company, and where it is */
function subRegister(){
 const td = todayIso(), by = {};
 const co = c => by[c] || (by[c] = {co: c, locs: [], units: 0, numbered: 0, spares: spareList().filter(s => s.co === c)});
 allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key)).forEach(a => {
  const subs = subOf(a.key), mk = subhireOf(a.key); if (!subs.length && !mk) return;
  const names = [...new Set(subs.map(x => x.co).concat(mk ? [mk.co] : []))];
  names.forEach(c => { const mine = subs.filter(x => x.co === c), C = locNums(a);
   co(c).locs.push({a, whole: !!(mk && mk.co === c), nos: mine.filter(x => x.no).map(x => x.no), none: mine.filter(x => !x.no).length, on: invOnSite(a, td), c: C,
    what: chargeLines(a).filter(l => l.item).map(l => l.item + (qtyOf(l) != null && qtyOf(l) !== 1 ? ' ×' + qtyOf(l) : '')).join(' + ')});
   co(c).units += mine.length; co(c).numbered += mine.filter(x => x.no).length; });
 });
 spareList().filter(s => s.co !== INV_COATES).forEach(s => co(s.co));
 return Object.values(by).sort((x, y) => x.co.localeCompare(y.co));
}
function subRegHtml(ro){
 const R = subRegister();
 const body = R.length ? R.map(g => `<div class="subreg"><h4>${esc(g.co)} <span class="w">${g.units} unit${g.units === 1 ? '' : 's'} at ${g.locs.length} location${g.locs.length === 1 ? '' : 's'} · ${g.numbered} with a fleet number${g.spares.length ? ' · ' + g.spares.length + ' spare' : ''}</span></h4>
  <div class="tblwrap"><table class="subregtab"><thead><tr><th>Location</th><th>What</th><th>Fleet numbers</th><th class="num">Numbered</th></tr></thead><tbody>${
   g.locs.sort((x, y) => x.a.key.localeCompare(y.a.key, undefined, {numeric: true})).map(L => `<tr><td><button type="button" class="invref" data-fixref="${esc(L.a.key)}" title="Open ${esc(L.a.key)} on the form">${refPlate(L.a.key, 18)}</button>${L.whole ? ' <span class="chip subhirechip">whole location</span>' : ''}${L.on ? '' : ' <span class="norate">not on site</span>'}</td><td>${esc(L.what)}${shortChip(L.a)}</td><td class="mono">${L.nos.length ? esc(L.nos.join(' ')) : ''}${L.none ? ` <span class="norate">+${L.none} with no number</span>` : ''}${!L.nos.length && !L.none ? '<span class="norate">none recorded yet</span>' : ''}</td><td class="num">${L.c ? `<span class="chip ${L.c.n < L.c.q ? 'act' : 'ok'}">${L.c.n} of ${L.c.q}</span>` : ''}</td></tr>`).join('')}${
   g.spares.map(s => `<tr><td><span class="chip">spare</span></td><td>${esc(invTypeWord(s.type))}${s.note ? ' <span class="w">' + esc(s.note) + '</span>' : ''}</td><td class="mono">${esc(s.no || '')}</td><td></td></tr>`).join('')}</tbody></table></div></div>`).join('')
  : '<p class="norate">No sub-hired gear recorded yet.</p>';
 return `<div class="card subregcard nosfold" id="subRegCard"><div class="invhead"><h3>Sub-hire register - whose gear is where</h3></div>
 <p class="sub">Every unit on the job that belongs to a sub-hire company, from the delivery record as it stands. Press a location to open it on the form.</p>${body}</div>`;
}
