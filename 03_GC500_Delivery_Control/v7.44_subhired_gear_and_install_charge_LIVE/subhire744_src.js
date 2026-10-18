/* v7.44 - Add sub-hired gear where the location is opened.
   Author: Andrew Fisher
   Supplier units keep the existing units record; marking a whole location is a separate choice.
   Opening a form never changes the record or removes Coates numbers. */
const SUB744 = {drafts: {}, open: null, mark: null};
function subhire744Draft(key){
 const mk = subhireCo(key);
 const d = SUB744.drafts[key] || (SUB744.drafts[key] = {co: mk || subCompanies()[0] || '', numbers: '', off: false});
 if (mk) d.co = mk;
 return d;
}
function subhire744Check(key, co, no){
 co = String(co || '').trim().replace(/\s+/g, ' '); no = String(no || '').trim().replace(/\s+/g, '');
 if (!assetOf(key)) return {err: 'Choose a location first.'};
 if (!co || co.toLowerCase() === 'coates') return {err: 'Name the company it is sub-hired from - Event Portables, for example.'};
 const mk = subhireCo(key);
 if (mk && co.toLowerCase() !== mk.toLowerCase()) return {err: key + ' is marked as ' + mk + ' gear. Change that mark before recording another company here.'};
 if (mk) co = mk;
 if (no && !subNoRx(co).test(no)) return {err: 'A fleet number is 1 to 12 letters, digits or hyphens.'};
 if (no) {
  const n = no.toLowerCase(), a = assetOf(key);
  if (unitsOf(key).some(x => String(x.asset_no || '').toLowerCase() === n) || (a.asset_numbers || []).some(x => String(x).toLowerCase() === n) || (a.accessories || []).some(x => String(x.asset_no || '').toLowerCase() === n)) return {err: no + ' is already on ' + key + '.'};
  const elsewhere = [...new Set(numberOwners(no, key).map(x => x.key).concat(allAssets().filter(x => x.key !== key && (subOf(x.key).some(u => String(u.no).toLowerCase() === n) || contentsNumbersOf(x).some(v => String(v).toLowerCase() === n))).map(x => x.key)))];
  if (elsewhere.length) return {err: no + ' is on ' + elsewhere.join(' and ') + ' - take it off there first.'};
 }
 return {co, no};
}
function subhire744One(key, co, no, place){
 if (!mayWrite('sub-hired gear')) return false;
 /* The drawing form can place an existing supplier unit. Adding gear cannot replace one. */
 if (place) {
  const owner = subhire744Check(key, co, ''); if (owner.err) { flash(owner.err); return false; }
  const num = String(no || '').trim().replace(/\s+/g, '').toLowerCase();
  const existing = num && subOf(key).find(x => x.co.toLowerCase() === owner.co.toLowerCase() && String(x.no).toLowerCase() === num);
  if (existing) return unitAdd(key, {label: existing.u.label, asset_no: existing.u.asset_no, sheet: place.sheet || '', callout: place.callout || ''});
 }
 const c = subhire744Check(key, co, no); if (c.err) { flash(c.err); return false; }
 let label = 'Sub-hire: ' + c.co;
 if (!c.no || unitsOf(key).some(u => !u.asset_no && String(u.label || '').toLowerCase() === label.toLowerCase())) { let i = 1; const used = new Set(unitsOf(key).map(u => String(u.label || '').toLowerCase()));
  while (used.has((label + ' · unit ' + i).toLowerCase())) i++;
  label += ' · unit ' + i;
 }
 const p = place || {};
 if (!unitAdd(key, {label, asset_no: c.no, sheet: p.sheet || '', callout: p.callout || ''})) return false;
 if (spareClaim(c.no, c.co, whoAmI())) bump();
 return true;
}
function subhire744Many(key, co, text){
 if (!mayWrite('sub-hired gear')) return null;
 const ns = subNumbersIn(text), check = subhire744Check(key, co, '');
 if (check.err) { flash(check.err); return null; }
 if (!ns.length) { flash('Enter the fleet numbers, or choose Add one without a number.'); return null; }
 const res = {added: [], refused: []};
 ns.forEach(no => { const c = subhire744Check(key, check.co, no);
  if (c.err) { res.refused.push([no, c.err]); return; }
  if (subhire744One(key, check.co, no)) res.added.push(no); else res.refused.push([no, 'not recorded']);
 });
 SUBH.res = {key, co: check.co, ...res};
 bump();
 flash(key + ': ' + res.added.length + ' ' + check.co + ' unit' + (res.added.length === 1 ? '' : 's') + ' recorded' + (res.refused.length ? '; ' + res.refused.length + ' refused - see the list.' : '.'));
 return res;
}
function subhire744Banner(a){
 const mk = subhireOf(a.key); if (!mk) return '';
 const mine = subOf(a.key).filter(x => x.co.toLowerCase() === mk.co.toLowerCase());
 const nos = mine.map(x => x.no).filter(Boolean), other = unitsOf(a.key).filter(u => !mine.some(x => sameUnit(x.u, u)));
 const coates = invCountNums(a);
 return `<div class="notice subhirebanner" role="status"><span class="subhirebig">SUB-HIRED · ${esc(mk.co)}</span>
 <span class="subhirewords">${mine.length ? `${mine.length} unit${mine.length === 1 ? '' : 's'} at ${esc(a.key)} belong to ${esc(mk.co)}${nos.length ? ' - their numbers <b class="mono">' + esc(nos.join(' ')) + '</b>' : ', with no fleet numbers recorded yet'}.` : `${esc(a.key)} is marked as ${esc(mk.co)} gear; no supplier units are recorded yet.`} Coates contract and branch details are hidden for this location.${other.length || coates.length ? ' Other recorded units or Coates numbers are kept in the lists below; they have not been removed or reassigned.' : ''}${mk.coates_off && mk.coates_off.length ? ` Coates numbers ${esc(mk.coates_off.join(', '))} came off when it was marked.` : ''}</span>
 <span class="w">Marked by ${esc(mk.by || 'unnamed')}${mk.at ? ' · ' + fmtStamp(mk.at) : ''}.</span>
 ${canEdit() ? `<span class="subhireacts"><button type="button" class="btn ghost sm" data-subhireoff="${esc(a.key)}">Not sub-hired after all</button></span>` : ''}</div>`;
}
function subhire744DrawerHtml(a){
 const k = a.key, mk = subhireOf(k), d = subhire744Draft(k), subs = subOf(k), ro = !canEdit(), dis = ro ? ' disabled' : '';
 const opened = SUB744.open === k, ask = SUB744.mark === k, nums = invCountNums(a);
 const r = SUBH.res && SUBH.res.key === k ? SUBH.res : null;
 return `<section class="sub744" aria-label="Sub-hired gear at ${esc(k)}"><div class="sub744head"><h3>Sub-hired gear at ${esc(k)}</h3>
 <button type="button" class="btn primary" data-s744-open="${esc(k)}" aria-expanded="${opened}"${dis}>Add sub-hired gear</button></div>
 ${subs.length ? `<p class="sub744existing">${[...new Set(subs.map(x => x.co))].map(co => `<b>${esc(co)}</b>: ${subs.filter(x => x.co === co).map(x => x.no ? `<span class="mono">${esc(x.no)}</span>` : 'no number yet').join(', ')}`).join('<br>')}</p>` : '<p class="hint">Record the supplier and their fleet numbers at this location.</p>'}
 ${ro ? '<p class="hint">View only. Open your edit link to add sub-hired gear.</p>' : ''}
 ${opened ? `<div class="sub744form"><div class="f"><label for="sub744Co">Sub-hire company</label><input id="sub744Co" list="sub744Companies" autocomplete="off" value="${esc(d.co)}"${mk ? ' readonly' : ''}${dis}><datalist id="sub744Companies">${subCompanies().map(co => `<option value="${esc(co)}">`).join('')}</datalist></div>
 <div class="f"><label for="sub744Numbers">Their fleet numbers</label><textarea id="sub744Numbers" rows="3" placeholder="One number per line, or separated by spaces"${dis}>${esc(d.numbers)}</textarea><div class="hint">Short numbers and leading zeros are kept. One number records one unit.</div></div>
 <div class="sub744actions"><button type="button" class="btn primary" data-s744-add="${esc(k)}"${dis}>Add gear to ${esc(k)}</button><button type="button" class="btn ghost" data-s744-none="${esc(k)}"${dis}>Add one without a number</button></div>
 ${r ? `<p class="sub744result" role="status">${r.added.length ? 'Recorded: ' + esc(r.added.join(', ')) + '. ' : ''}${r.refused.length ? 'Not added: ' + r.refused.map(([n, why]) => esc(n + ' - ' + why)).join('; ') : ''}</p>` : ''}
 ${!mk ? `<div class="sub744mark"><p class="hint">Adding gear keeps any Coates units here. Mark the whole location only if all its gear is sub-hired.</p>
 <button type="button" class="btn ghost sm" data-s744-ask="${esc(k)}"${dis}>This whole location is sub-hired…</button>
 ${ask ? `<div class="notice warn"><b>Mark ${esc(k)} as sub-hired from the company above?</b>
 ${nums.length ? `<label class="sub744off"><input type="checkbox" id="sub744Off"${d.off ? ' checked' : ''}${dis}> Also take its Coates numbers off (${esc(nums.join(', '))})${invOnSite(a, todayIso()) ? ' and put them in spares' : ''}</label>` : '<p class="hint">There are no Coates numbers to take off.</p>'}
 <p class="hint">This hides Coates contract and branch details for this location. It does not change charges or costs.</p>
 <div class="sub744actions"><button type="button" class="btn" data-s744-confirm="${esc(k)}"${dis}>Confirm whole location is sub-hired</button><button type="button" class="btn ghost" data-s744-cancel="${esc(k)}"${dis}>Not now</button></div></div>` : ''}</div>` : `<p class="hint">This location is marked as ${esc(mk.co)} gear. New units use that company.</p>`}
 </div>` : ''}</section>`;
}
function subhire744DrawerBind(a){
 const root = $('#drawer'), k = a.key, q = s => root.querySelector(s), d = subhire744Draft(k);
 const redraw = () => openAsset(k, {keep: true});
 const bind = (s, fn) => { const b = q(s); if (b) b.onclick = fn; };
 bind('[data-s744-open]', () => { if (!mayWrite('sub-hired gear')) return; SUB744.open = k; redraw(); const f = q('#sub744Co'); if (f) f.focus({preventScroll: true}); });
 const co = q('#sub744Co'), ns = q('#sub744Numbers'), off = q('#sub744Off');
 if (co) co.oninput = () => { d.co = co.value; };
 if (ns) ns.oninput = () => { d.numbers = ns.value; };
 if (off) off.onchange = () => { d.off = off.checked; };
 bind('[data-s744-add]', () => {
  if (!mayWrite('sub-hired gear')) return;
  const text = d.numbers; d.numbers = ''; if (ns) ns.value = '';
  const r = subhire744Many(k, d.co, text);
  d.numbers = r ? r.refused.map(x => x[0]).join('\n') : text;
  redraw();
 });
 bind('[data-s744-none]', () => { if (subhire744One(k, d.co, '')) { SUBH.res = null; redraw(); } });
 bind('[data-s744-ask]', () => { if (!mayWrite('a sub-hired location')) return; SUB744.mark = k; redraw(); });
 bind('[data-s744-cancel]', () => { SUB744.mark = null; d.off = false; redraw(); });
 bind('[data-s744-confirm]', () => {
  if (!mayWrite('a sub-hired location')) return;
  const c = subhire744Check(k, d.co, ''); if (c.err) { flash(c.err); return; }
  const others = [...new Set(subOf(k).filter(x => x.co.toLowerCase() !== c.co.toLowerCase()).map(x => x.co))];
  if (others.length) { flash('This location also has ' + others.join(' and ') + ' gear. Keep it mixed, or change those units before marking the whole location.'); return; }
  SUB744.mark = null; const takeOff = d.off; d.off = false;
  subhireMark(k, c.co, takeOff);
 });
}
function subhire744RegisterHtml(ro){
 const dis = ro ? ' disabled' : '';
 return `<div class="sub744pick"><div class="f"><label for="sub744Ref">Location for sub-hired gear</label><select id="sub744Ref"${dis}><option value="">Choose a location…</option>${allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key)).sort((a,b) => a.key.localeCompare(b.key, undefined, {numeric:true})).map(a => `<option value="${esc(a.key)}">${esc(a.key + ' - ' + (a.name || (a.item_types || []).join(', ') || a.discipline || ''))}</option>`).join('')}</select></div><button type="button" class="btn primary" data-s744-pick${dis}>Add sub-hired gear</button></div>${ro ? '<p class="hint">Open your edit link to add gear to a location.</p>' : ''}`;
}
function subhire744RegisterBind(pane){
 const b = pane.querySelector('[data-s744-pick]'); if (!b) return;
 b.onclick = () => { if (!mayWrite('sub-hired gear')) return; const s = pane.querySelector('#sub744Ref'), k = s && s.value;
  if (!k) { flash('Choose the location for this gear.'); if (s) s.focus(); return; }
  SUB744.open = k; openAsset(k); const f = $('#drawer').querySelector('#sub744Co'); if (f) f.focus({preventScroll: true});
 };
}
