/* v7.12 - THE DAY'S LIST, ONE LINE PER LOAD. The project manager, 27 Sep 2026: the Timeline "looks like too much is
 happening" - nine references on Mon 28 Sep were nine fully open delivery cards, about 6,900 px. Agreed: one compact line
 per LOAD (a truck), tap to open.

 A load is the printed sheets' own grouping, dpLoads(d) (v7.00): the same load time and carrier, or a load named on the
 transport plan, otherwise one reference on its own. The lines number the loads exactly as the Day documents plate and
 the PDFs do, so "Load 4" on the list is Load 4 on the Drivers and Install sheets. Due out gets the same lines, carrying
 on the same numbering (dpLoads puts the removals after the deliveries).

 Each line: Load n; the reference codes, big, each with what it is, its lamp and its word (on site, in transit, not on
 site, no record - deliveryView, the words the page already uses) and its ticks; the load time and carrier; one short
 place. Tapping a line opens it in place to show that load's full delivery cards - dayCards(), the same renderer, so
 every control on them is the one already live. One load open at a time; which one is kept in state.tlLoad, so the
 4-second sync redraw does not close it. A note half-typed in an open card survives any redraw of the Timeline.

 Under the list, Moved off this day, the rows with no reference, the cancelled references and what the carrier says
 is coming are folded to one line each with a count, closed until pressed. The Every day view is unchanged. */
const LD_WORD = {green: 'On site', amber: 'In transit', red: 'Not on site'};
const LD_PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>';
/* the load's own name in state: the day, due in or out, and its first reference - a reference is on one load only */
function ldId(d, g){ return d.iso + '|' + g.kind + '|' + ((g.rows[0] || {}).a || {}).key; }
function ldIsOpen(d, g){
 const o = state.tlLoad; if (!o) return false;
 const p = String(o).split('|'), key = p.slice(2).join('|');
 return p[0] === d.iso && p[1] === g.kind && g.rows.some(r => r.a.key === key);
}
/* a place that only names the thing again ("Toilets" for a toilet) is not a place */
function ldFlat(s){ return String(s || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/s$/, ''); }
function ldGeneric(a, s){
 const w = ldFlat(s); if (!w) return true;
 return [a.product, a.discipline].concat(a.item_types || []).some(x => ldFlat(x) === w);
}
/* the nearest named landmark the master plan puts beside it */
function ldNear(a){
 let m = null; try { m = typeof masterLoc === 'function' ? masterLoc(a.key) : null; } catch (e) { m = null; }
 if (!m || !(m.near || []).length) return '';
 let best = null;
 m.near.forEach(x => { const s = String(x), mm = s.match(/\(~\s*(\d+)\s*m\)/), n = mm ? +mm[1] : 1e9, w = s.replace(/\s*\(~[^)]*\)\s*$/, '').trim();
  if (w && (!best || n < best.n)) best = {n, w}; });
 return best ? best.w : '';
}
function ldPlace(a){
 let main = ''; try { main = whereText(a).main || ''; } catch (e) { main = ''; }
 if (main && !ldGeneric(a, main)) return main;
 const near = ldNear(a); if (near) return 'near ' + near;
 const link = (a.drawing_links || [])[0];
 return main || (link && link.label ? 'callout ' + link.label : '');
}
/* what it is, short: the schedule's items, with the count where there is more than one */
function ldWhat(r){
 let it = []; try { it = dpItems(r); } catch (e) { it = []; }
 const s = it.map(x => x.item ? x.item + (x.qty && /^\d+$/.test(x.qty) && +x.qty > 1 ? ' ×' + x.qty : '') : '').filter(Boolean);
 return s.length ? dpUniq(s).join(', ') : ((r.a.item_types || []).join(', ') || r.a.product || '');
}
/* the lamp and its word, from the one status reading every surface shares */
function ldState(a){
 const v = deliveryView(a);
 if (a._cancelled) return {c: 'cx', word: 'Cancelled', said: 'Cancelled', hire: false};
 const c = v.moved ? 'none' : v.recorded ? v.c : 'none';
 const word = v.moved ? v.short : v.recorded ? (LD_WORD[v.c] || v.label) : 'No record';
 return {c, word, said: v.said, hire: !!(v.recorded && v.d && v.d.where === 'rental')};
}
function ldLamp(s, cls){ return `<i class="ld-lamp ${s.c}${s.hire ? ' hire' : ''}${cls ? ' ' + cls : ''}" aria-hidden="true"></i>`; }
function ldTicks(a){
 let d = null; try { d = deliveryOf(a.key); } catch (e) { d = null; }
 if (!d) return '';
 const t = [];
 if (d.done) t.push('<i class="ld-tk" title="Complete">✓</i>');
 if (d.levelled) t.push(`<i class="ld-tk lv" title="Positioned and levelled">${levelGlyph(12)}</i>`);
 if (d.steps) t.push(`<i class="ld-tk sp" title="Steps installed">${stepsGlyph(12)}</i>`);
 return t.length ? `<span class="ld-tks">${t.join('')}</span>` : '';
}
function ldLine(d, g, n, open, timed){
 const id = ldId(d, g), body = 'ldb-' + id.replace(/[^A-Za-z0-9]+/g, '-');
 const sts = g.rows.map(r => ldState(r.a));
 const places = dpUniq(g.rows.map(r => ldPlace(r.a)));
 const refs = g.rows.map((r, i) => `<span class="ld-ref" title="${esc(r.a.key + ' · ' + sts[i].said)}"><span class="ld-c"><b>${esc(r.a.key)}</b>${ldLamp(sts[i])}<span class="ld-sw ${sts[i].c}">${esc(sts[i].word)}</span>${ldTicks(r.a)}</span><span class="ld-w">${esc(ldWhat(r))}</span></span>`).join('');
 /* the same lamps, grouped by word, for the narrow screen's second row */
 const grp = []; sts.forEach(s => { const x = grp.find(y => y.word === s.word); if (x) x.n++; else grp.push({word: s.word, c: s.c, hire: s.hire, n: 1}); });
 const sum = grp.map(x => `<span class="ld-g ${x.c}">${ldLamp(x).repeat(x.n)}<span>${esc(x.word)}</span></span>`).join('');
 const when = timed ? `<span class="ld-t"><b class="${g.time ? '' : 'nt'}">${esc(g.time || '—')}</b><em>${esc(g.carrier || 'no carrier')}</em></span>` : '';
 const place = places.length ? `<span class="ld-p" title="${esc(places.join(' · '))}">${LD_PIN}<span>${/^near /.test(places[0]) ? '<i class="ld-near">near </i>' + esc(places[0].slice(5)) : esc(places[0])}</span>${places.length > 1 ? `<em>+${places.length - 1}</em>` : ''}</span>` : '<span class="ld-p"></span>';
 const say = `Load ${n}${g.time ? ', ' + g.time : ''}${g.carrier ? ', ' + g.carrier : ''}: ` + g.rows.map((r, i) => r.a.key + ' ' + sts[i].word.toLowerCase()).join(', ');
 return `<div class="ld${open ? ' on' : ''}${g.kind === 'removals' ? ' out' : ''}${g.rows.length > 1 ? ' multi' : ''}" role="listitem">`
  + `<button type="button" class="ldl" data-ld="${esc(id)}" aria-expanded="${open}"${open ? ` aria-controls="${esc(body)}"` : ''} aria-label="${esc(say + (open ? '. Press to close.' : '. Press to open the delivery cards.'))}">`
  + `<span class="ld-n"><em>Load</em><b>${n}</b></span>${when}<span class="ld-refs${g.rows.length > 1 ? ' multi' : ''}">${refs}</span>${place}<span class="ld-sum">${sum}</span><span class="ld-x" aria-hidden="true"></span></button>`
  + (open ? `<div class="ldb" id="${esc(body)}">${dayCards(g.rows, g.kind)}</div>` : '') + '</div>';
}
/* the day's loads of one kind, numbered as the plate numbers them, holding only the rows the list shows */
function ldGroups(d, shown, kind){
 const keep = new Set(shown.map(r => r.a.key));
 return dpLoads(d).map((g, i) => ({g, n: i + 1})).filter(x => x.g.kind === kind).map(x => ({n: x.n, open: ldIsOpen(d, x.g),
  g: Object.assign({}, x.g, {rows: x.g.rows.filter(r => keep.has(r.a.key))})})).filter(x => x.g.rows.length);
}
function ldCount(d, shown, kind){
 let n = 0; try { n = ldGroups(d, shown, kind).length; } catch (e) { return ''; }
 return n ? `<span class="ldcnt"> · ${n} load${n === 1 ? '' : 's'}</span>` : '';
}
function ldList(d, shown, kind){
 let L; try { L = ldGroups(d, shown, kind); } catch (e) { return dayCards(shown, kind); }
 if (!L.length) return dayCards(shown, kind);
 const timed = L.some(x => x.g.time || x.g.carrier);
 return `<div class="ldlist${timed ? ' timed' : ''}" role="list" aria-label="${kind === 'removals' ? 'Due out' : 'Due in'}, one line per load">${L.map(x => ldLine(d, x.g, x.n, x.open, timed)).join('')}</div>`;
}
/* a block under the list, folded to one line with its count; closed until pressed, and kept as left through redraws */
function ldFoldIf(full, key, title, n, html){
 if (!html || !String(html).trim()) return '';
 if (!full) return html;
 let inner = String(html);
 const m = inner.match(/^\s*<details class="rowsoff"><summary>[\s\S]*?<\/summary>/);
 if (m) inner = inner.slice(m[0].length).replace(/<\/details>\s*$/, '');
 const open = !!(state.tlSecs || {})[key];
 return `<details class="ldsec" data-ldsec="${esc(key)}"${open ? ' open' : ''}><summary><span class="ldsec-t">${esc(title)}</span><b class="ldsec-n">${n}</b><span class="ldsec-x" aria-hidden="true"></span></summary><div class="ldsec-b">${inner}</div></details>`;
}
/* a redraw replaces every box on the Timeline: a note typed and not yet saved, and the cursor in it, are put back */
function ldKeep(){
 const pane = document.getElementById('pane-timeline'); if (!pane) return null;
 const notes = {};
 pane.querySelectorAll('input[data-dnote]').forEach(n => { let rec = ''; try { rec = deliveryOf(n.dataset.dnote).note || ''; } catch (e) { rec = ''; }
  if (n.value.trim() !== String(rec).trim()) notes[n.dataset.dnote] = n.value; });
 const el = document.activeElement;
 const focus = el && pane.contains(el) && el.matches && el.matches('input[data-dnote]') ? {key: el.dataset.dnote, sel: [el.selectionStart, el.selectionEnd]} : null;
 return Object.keys(notes).length || focus ? {notes, focus} : null;
}
function ldPutBack(k){
 if (!k) return;
 const pane = document.getElementById('pane-timeline'); if (!pane) return;
 const box = key => [...pane.querySelectorAll('input[data-dnote]')].find(x => x.dataset.dnote === key);
 Object.keys(k.notes).forEach(key => { const n = box(key); if (n && !n.readOnly) n.value = k.notes[key]; });
 if (k.focus) { const n = box(k.focus.key); if (n) { try { n.focus({preventScroll: true}); } catch (e) { n.focus(); }
  try { n.setSelectionRange(k.focus.sel[0], k.focus.sel[1]); } catch (e) {} } }
}
/* the box that scrolls the Timeline (the page's main, not the window) */
function ldScroller(el){
 for (let e = el && el.parentElement; e && e !== document.body; e = e.parentElement) {
  const oy = getComputedStyle(e).overflowY;
  if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight) return e;
 }
 return document.scrollingElement || document.documentElement;
}
/* open one load, or close it; the line pressed stays where it was on the screen */
function ldToggle(b){
 /* measured from the top of the day's list, so a panel above it that is still settling is not chased */
 const top = el => { const l = el.closest('.dayblock'); return el.getBoundingClientRect().top - (l ? l.getBoundingClientRect().top : 0); };
 const id = b.dataset.ld, y0 = top(b);
 state.tlLoad = state.tlLoad === id ? null : id;
 render();
 const pane = document.getElementById('pane-timeline'), nb = pane && [...pane.querySelectorAll('.ldl[data-ld]')].find(x => x.dataset.ld === id);
 if (!nb) return;
 const dy = top(nb) - y0;
 if (Math.abs(dy) > 1) { const sc = ldScroller(nb); sc.scrollTop += dy; }
 try { nb.focus({preventScroll: true}); } catch (e) {}
}
function ldWire(pane){
 pane.querySelectorAll('.ldl[data-ld]').forEach(b => b.onclick = () => ldToggle(b));
 pane.querySelectorAll('details.ldsec[data-ldsec]').forEach(dt => dt.addEventListener('toggle', () => {
  const s = state.tlSecs || (state.tlSecs = {}); s[dt.dataset.ldsec] = dt.open; }));
}
