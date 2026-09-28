/* v7.30 - WALK-AROUND NUMBERS AND SHORT DELIVERIES (see patch_v730.py). Andrew Fisher, 29 Sep 2026: "I will need to go
   around today and get asset numbers off Event Portables loos. Is there any way I can add this into the reference, e.g.
   WC11, and add a new sub-hired toilet asset number. Also some locations like WC01 have multiple items; it says it is
   complete even if one did not turn up. How can we fix."
   - WALK-AROUND: on Change deliveries, every location of a trade with its "n of q numbered", the numbers already on it,
     and one box: type the number off the unit, Add (or Enter), and the box moves on to the next location still missing
     numbers. Whose it is (Event Portables, Coates, another company) is set once at the top.
   - WHAT TURNED UP: the Change form asks, per item on the location, how many arrived (the same supplied record the
     location's own details card writes). Blank is not recorded; a number under what was ordered is a short delivery.
   - SHORT: a location with an item short says so beside its light and its Complete tick, on the Timeline load line and
     on Questions, until the rest arrives or the order is changed. */
const WALK = {open: false, disc: 'Toilets & amenities', co: 'Event Portables', all: false, find: '', focus: null, idx: -1, order: []};
function shortOf(a){
 if (!a || a._cancelled || a.relocation) return [];
 const L = chargeLines(a); if (!L.length) return [];
 return itemRows(a).map(r => { const l = L.find(x => x.item === r.asked), q = l ? (qtyOf(l) != null ? qtyOf(l) : 1) : null;
  const g = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' && Number.isFinite(Number(r.qty_supplied)) ? Number(r.qty_supplied) : null;
  return {item: r.asked, q, g}; }).filter(x => x.q != null && x.g != null && x.g < x.q);
}
function shortWords(a){ return shortOf(a).map(x => `${x.item} ${x.g} of ${x.q}`).join(', '); }
function shortChip(a){ const A = a && a.key ? a : assetOf(a); const w = A ? shortWords(A) : ''; return w ? ` <span class="chip act shortchip" title="What turned up is less than the order: ${esc(w)}. Record the rest when it arrives, or change the order.">Short · ${esc(w)}</span>` : ''; }
/* the Change form: what turned up, per item */
function chGotHtml(a, ro){
 const L = chargeLines(a).filter(l => l.item); if (!L.length || a.relocation) return '';
 const rows = itemRows(a), dis = ro ? ' disabled' : '';
 return `<div class="f chgot"><label>What turned up</label><table class="chgottab"><thead><tr><th>Item</th><th class="num">Ordered</th><th class="num">Arrived</th><th></th></tr></thead><tbody>${
  L.map((l, i) => { const q = qtyOf(l) != null ? qtyOf(l) : 1, r = rows.find(x => x.asked === l.item) || {}, g = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' ? Number(r.qty_supplied) : null;
   const st = g == null ? '<span class="norate">not recorded</span>' : g < q ? `<span class="chip act">short ${q - g}</span>` : g > q ? `<span class="chip cand">${g - q} extra</span>` : '<span class="chip ok">all here</span>';
   return `<tr><td>${esc(l.item)}</td><td class="num">${q}</td><td class="num"><input type="number" min="0" step="1" inputmode="numeric" data-chgot="${esc(l.item)}" value="${g == null ? '' : g}" placeholder="${q}" aria-label="How many ${esc(l.item)} arrived at ${esc(a.key)}"${dis}></td><td>${st}</td></tr>`; }).join('')}</tbody></table>
 <div class="hint">Blank means nobody has counted it. If one did not turn up, put what did arrive - ${esc(a.key)} shows <b>Short</b> on the Timeline and in Questions until the rest arrives.</div></div>`;
}
/* ---- the walk-around */
function walkRefs(){
 const f = String(WALK.find || '').trim().toLowerCase();
 return allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key) && a.discipline === WALK.disc).map(a => ({a, c: locNums(a)})).filter(x => x.c).filter(x => WALK.all || x.c.n < x.c.q || f).filter(x => !f || x.a.key.toLowerCase().includes(f) || String(x.a.name || '').toLowerCase().includes(f)).sort((x, y) => x.a.key.localeCompare(y.a.key, undefined, {numeric: true}));
}
function walkHtml(ro){
 const dis = ro ? ' disabled' : '';
 const head = `<div class="invhead"><h3>Walk-around - record asset numbers</h3><button type="button" class="btn${WALK.open ? ' ghost' : ' primary'} sm" data-wkopen>${WALK.open ? 'Close' : 'Start'}</button></div>`;
 if (!WALK.open) return `<div class="card walkcard nosfold" id="walkCard">${head}<p class="sub">Go round with your phone: every location with how many units carry a number, and one box to type the number off each unit. Sub-hire (Event Portables) or Coates.</p></div>`;
 const discs = [...new Set(allAssets().filter(a => !a._cancelled && !a.relocation && locNums(a)).map(a => a.discipline))].sort();
 const list = walkRefs(); WALK.order = list.map(x => x.a.key);
 const cos = [...new Set(['Event Portables', INV_COATES].concat(invCompanies()))];
 const all = allAssets().filter(a => !a._cancelled && !a.relocation && a.discipline === WALK.disc).map(a => locNums(a)).filter(Boolean);
 const nq = all.reduce((s, c) => s + c.q, 0), nn = all.reduce((s, c) => s + c.n, 0);
 const rows = list.map(({a, c}) => { const k = a.key, own = invCoatesNums(a), subs = subOf(k), what = chargeLines(a).map(l => `${l.item}${qtyOf(l) != null && qtyOf(l) !== 1 ? ' ×' + qtyOf(l) : ''}`).join(' + ');
  return `<li class="wkrow${c.n >= c.q ? ' done' : ''}" data-wkrow="${esc(k)}"><div class="wkh">${refPlate(k, 22)}<div class="wkw"><b>${esc(what || a.product || '')}</b>${a.name ? `<span class="w"> · ${esc(a.name)}</span>` : ''}</div>
  <span class="chip ${c.n < c.q ? 'act' : 'ok'}">${c.n} of ${c.q}</span>${shortChip(a)}</div>
  ${own.length || subs.length ? `<div class="wknums">${own.map(n => `<span class="mono">${esc(n)}</span>`).join(' ')}${subs.map(x => ` <span class="wksub">${esc(x.co)}${x.no ? ' <span class="mono">' + esc(x.no) + '</span>' : ' (no number)'}</span>`).join('')}</div>` : ''}
  <div class="chdrow wkadd"><input data-wkno="${esc(k)}" autocomplete="off" autocapitalize="characters" placeholder="${WALK.co === INV_COATES ? 'Coates no.' : 'their no.'} at ${esc(k)}" aria-label="${esc(WALK.co)} asset number at ${esc(k)}"${dis}><button type="button" class="btn" data-wkadd="${esc(k)}"${dis}>Add</button>${WALK.co !== INV_COATES ? `<button type="button" class="btn ghost sm" data-wknone="${esc(k)}"${dis} title="A ${esc(WALK.co)} unit with no readable number">No number</button>` : ''}</div></li>`; }).join('');
 return `<div class="card walkcard nosfold" id="walkCard">${head}
 <div class="wktop"><label for="wkCo">Whose units</label><input id="wkCo" list="wkCos" value="${esc(WALK.co)}" autocomplete="off"${dis}><datalist id="wkCos">${cos.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
 <input id="wkFind" type="search" placeholder="find a location - WC11" value="${esc(WALK.find)}" autocomplete="off"></div>
 <div class="invchips">${[WALK.disc].concat(discs.filter(d => d !== WALK.disc)).map(d => `<button type="button" class="chip invdisc${WALK.disc === d ? ' on' : ''}" data-wkdisc="${esc(d)}">${esc(d)}</button>`).join('')}</div>
 <p class="sub"><b>${nn} of ${nq}</b> ${esc(WALK.disc.toLowerCase())} carry a number. <label class="chk wkall"><input type="checkbox" id="wkAll"${WALK.all ? ' checked' : ''}> show the finished ones too</label></p>
 ${rows ? `<ul class="wklist">${rows}</ul>` : `<p class="norate">${WALK.find ? 'No location matches that.' : 'Every location here carries its numbers.'}</p>`}
 <div class="hint">Type the number off the sticker and press Add (or Enter) - the box moves to the next location. A Coates sticker: set Whose units to Coates. A number already on another location is refused and named.</div></div>`;
}
function walkAdd(key, no, blank){
 if (!mayWrite('an asset number')) return false;
 const a = assetOf(key); if (!a) return false;
 const co = String(WALK.co || '').trim().replace(/\s+/g, ' ');
 const n = String(no || '').trim().replace(/\s+/g, '').toUpperCase();
 if (!co) { flash('Say whose units these are first - Event Portables, Coates or the company.'); return false; }
 if (!blank && !n) { flash('Type the number off the sticker first.'); return false; }
 if (n && !/^[A-Za-z0-9-]{3,12}$/.test(n)) { flash('An asset number is digits, sometimes with letters - ' + n + ' does not look like one.'); return false; }
 const who = whoAmI(); if (!who) return false;
 WALK.focus = key; WALK.idx = WALK.order.indexOf(key);
 if (co.toLowerCase() === 'coates') {
  if (invCoatesNums(a).includes(n) || (a.asset_numbers || []).includes(n)) { flash(n + ' is already on ' + key + '.'); return false; }
  const on = invNumberOn(n, key); if (on.length) { flash(n + ' is on ' + on.join(' and ') + ' - not added. Take it off there first, or use Swap.'); return false; }
  numberPutOn(key, n, who); const sp = spareClaim(n, INV_COATES, who); bump();
  flash(n + ' is on ' + key + (sp ? ' - out of spares' : '') + '. By ' + who + '.'); return true;
 }
 if (n) { if (subOf(key).some(x => String(x.no).toUpperCase() === n)) { flash(n + ' is already on ' + key + '.'); return false; }
  const on = invNumberOn(n, key); if (on.length) { flash(n + ' is on ' + on.join(' and ') + ' - not added.'); return false; } }
 subAdd(key, co, n);
 return true;
}
function walkBind(pane){
 const q = s => pane.querySelector(s);
 pane.querySelectorAll('[data-walkjump]').forEach(b => b.onclick = () => { WALK.open = true; render(); setTimeout(() => { const c = $('#walkCard'); if (c) { try { c.scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (e) { c.scrollIntoView(); } } }, 0); });
 pane.querySelectorAll('[data-wkopen]').forEach(b => b.onclick = () => { WALK.open = !WALK.open; render(); });
 pane.querySelectorAll('[data-wkdisc]').forEach(b => b.onclick = () => { WALK.disc = b.dataset.wkdisc; render(); });
 const co = q('#wkCo'); if (co) co.onchange = () => { WALK.co = co.value.trim() || 'Event Portables'; render(); };
 const fd = q('#wkFind'); if (fd) fd.oninput = () => { WALK.find = fd.value; clearTimeout(walkBind.t); walkBind.t = setTimeout(() => { WALK.focus = null; render(); const f = $('#wkFind'); if (f) { f.focus(); try { f.setSelectionRange(f.value.length, f.value.length); } catch (e) {} } }, 250); };
 const al = q('#wkAll'); if (al) al.onchange = () => { WALK.all = al.checked; render(); };
 pane.querySelectorAll('[data-wkadd]').forEach(b => b.onclick = () => { const k = b.dataset.wkadd, i = pane.querySelector('[data-wkno="' + k + '"]'); walkAdd(k, i ? i.value : ''); });
 pane.querySelectorAll('[data-wknone]').forEach(b => b.onclick = () => walkAdd(b.dataset.wknone, '', true));
 pane.querySelectorAll('[data-wkno]').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); walkAdd(i.dataset.wkno, i.value); } });
 /* after an Add the box stays with the location, or moves to the next one if that location is now finished */
 if (WALK.open && WALK.focus) { const k = WALK.order.includes(WALK.focus) ? WALK.focus : WALK.order[Math.min(Math.max(WALK.idx, 0), WALK.order.length - 1)];
  const i = k && pane.querySelector('[data-wkno="' + k + '"]'); WALK.focus = null;
  if (i) setTimeout(() => { try { i.focus({preventScroll: true}); i.scrollIntoView({block: 'center', behavior: 'smooth'}); } catch (e) { i.focus(); } }, 0); }
 /* what turned up, on the Change form */
 pane.querySelectorAll('[data-chgot]').forEach(el => el.onchange = () => {
  const k = CHG.key, item = el.dataset.chgot, v = el.value.trim();
  if (v !== '' && v !== '0' && wholeQty(v) == null) { flash('A count is a whole number of things - "' + v.slice(0, 20) + '" was not recorded.'); return; }
  if (!whoAmI()) return;
  const n = v === '' ? null : (v === '0' ? 0 : wholeQty(v));
  if (setSupplied(k, item, {qty_supplied: n}) === false) return;
  const a = assetOf(k), sh = a ? shortWords(a) : '';
  chSay(k + ': ' + item + (n == null ? ' count cleared' : ' - ' + n + ' arrived') + (sh ? ' · short: ' + sh : ''));
  bump();
 });
}
