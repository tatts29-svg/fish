#!/usr/bin/env python3
"""v6.40 - THE DELIVERY CARD ON THE TIMELINE (Andrew Fisher, 26 Sep 2026, from his three WB02 mock-ups: "time line ideas").

The one-day view's rows become cards, one per reference, laid out as his pictures are: the reference plate and what it
is across the top with the asset number, the location and its tags, and the event's name; then a plate of panels -
Status (the lamps, the state's words, who set it and when, and the record's own actions: the ticks and Next day),
Time · day (the planned time and the day, moved-from beside it), Quantity, Location (the callout, its sheet, pin where it
stands, a satellite thumbnail centred on the reference, Open on the map), Drawing / reference, Schedule says, Task
progress (the record's own checks as a bar), Notes, Site photographs (the drop photographs, when the service holds any)
and History (what was recorded, by whom, when); then a footer strip with the car and the Coates Way. Every figure is the
record's; nothing is invented - the mock-up's "Hold" is not a state the record has, so there is no Hold button, and
"Next" is the record's own Move to the next day. The Every day view keeps its table.

  python3 patch_v640.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

# ---------------------------------------------------------------------------------------------------- the card
OLD_FN = """function dayPinCell(a){"""
NEW_FN = r"""/* ------------------------------------------------------------------------------------------------ the delivery card
   v6.40 (Andrew Fisher, 26 Sep 2026, from his WB02 mock-ups). One card per reference on the day, every panel read from
   the record and the schedule. The controls are the page's own: the lamps (dstat, ctl), the ticks (doneBtn, levelBtn,
   stepsBtn), Next day (nextDayBtn), the planned time and the day (the same data-eta / data-date inputs the table has,
   handled by the same listeners), pin where it stands (dayPinCell), the note (data-dnote), Open, Drop sheet, On the map. */
const DC_ICO = {
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M9.5 13h6M9.5 17h6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  list: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 9l1.6 1.6L14 7.5M9 15l1.6 1.6L14 13.5"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 13h5"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3.5l1.5-2.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg>',
  hist: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5M12 8v4.5l3 1.8"/></svg>',
  lamp: '<svg viewBox="0 0 24 24"><rect x="8" y="2.5" width="8" height="19" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/></svg>'
};
const dcIco = k => `<i class="dcico" aria-hidden="true">${DC_ICO[k] || ''}</i>`;
/* the satellite thumbnail: the banner's circuit image (DATA.hzmap, the aerial's crop), zoomed and centred on the
   reference's point on the plan, with a dot at the centre. '' when the reference has no position on the plan. */
function dayCardMap(a){
  const M = DATA.hzmap; if (!M || !M.src || !M.crop || !M.aerial_px) return '';
  let pt = null; try { pt = aerialPointFor(a); } catch (e) { pt = null; }
  if (!pt) return '';
  const [x0, y0, x1, y1] = M.crop, AW = M.aerial_px[0], AH = M.aerial_px[1];
  const fx = (pt.ax * AW - x0) / (x1 - x0), fy = (pt.ay * AH - y0) / (y1 - y0);
  if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) return '';
  const src = typeof M.src === 'string' ? M.src : '';
  if (!src) return '';
  return `<span class="dcmap" style="--fx:${fx.toFixed(4)};--fy:${fy.toFixed(4)}" title="the satellite, centred on ${esc(a.key)}'s point on the plan - a drawing callout, not a surveyed position"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"><i class="dcdot"></i><em>${esc(a.key)}</em></span>`;
}
function dayCards(rows, kind){
  if (!rows.length) return '';
  const isIn = kind === 'deliveries';
  return `<div class="dcards">${rows.map(({a, events, moved_from}) => dayCard(a, events, moved_from, isIn)).join('')}</div>`;
}
function dayCard(a, events, moved_from, isIn){
  const key = a.key, d = deliveryOf(key), link = (a.drawing_links || [])[0], eff = effectiveDates(a);
  const qty = [...new Set((events || []).map(e => e.quantity_display).filter(Boolean))].join(' / ') || '';
  const says = (events || []).map(e => [e.sheet, e.activity, e.carrier ? 'carrier ' + e.carrier : null, e.dd, e.note]
    .filter(Boolean).map(esc).join(' · ')).filter(Boolean).join('<br>');
  const inferred = (events || []).some(e => !e.movement_stated);
  const carriers = [...new Set((events || []).map(e => e.carrier).filter(Boolean))];
  const day = isIn ? eff.in : eff.out;
  const dow = day ? fmtDay(day).dow : '';
  const what = (a.item_types || []).join(', ') || a.product || '';
  const where = (a.locations || [])[0] || a.name || '';
  const tags = [a.discipline, link ? link.sheet : null, ...(a.phases || []).slice(0, 1), ...carriers.map(c => 'carrier ' + c)].filter(Boolean);
  const cancelled = !!a._cancelled;
  /* the record's own checks, as a bar: on site, complete, and for a building, toilet or tank, levelled and steps */
  const checks = [['On site', d.recorded && d.c === 'green'], ['Complete', !!d.done]];
  if (needsLevel(a)) { checks.push(['Levelled', !!d.levelled]); checks.push(['Steps', !!d.steps]); }
  const doneN = checks.filter(c => c[1]).length, pct = Math.round(100 * doneN / checks.length);
  /* history: the lamp settings, the ticks and the moves, newest first */
  const hist = (d.history || []).map(h => ({at: h.at, what: (LIGHT[h.state] ? LIGHT[h.state].label : h.state) + (h.note ? ' · ' + h.note : ''), by: h.by, c: LIGHT[h.state] ? LIGHT[h.state].c : ''}));
  if (d.done_at) hist.push({at: d.done_at, what: 'Ticked complete', by: d.done_by, c: 'green'});
  if (d.levelled_at) hist.push({at: d.levelled_at, what: 'Positioned and levelled', by: d.levelled_by, c: 'green'});
  if (d.steps_at) hist.push({at: d.steps_at, what: 'Steps installed', by: d.steps_by, c: 'green'});
  if (d.date_at) hist.push({at: d.date_at, what: 'Day moved to ' + fmtDate(d.date || ''), by: d.date_by, c: ''});
  hist.sort((x, y) => String(y.at).localeCompare(String(x.at)));
  const photos = (typeof dropPhotosOf === 'function' ? dropPhotosOf(key) : []).map(ph => ({ph, url: dropPhotoUrl(ph)})).filter(x => x.url);
  const mapThumb = dayCardMap(a);
  const updated = d.moved || !d.recorded ? '' : d.where === 'rental' ? 'From the rental system' : ('Last updated ' + (d.set_at ? fmtStamp(d.set_at) : 'time not recorded') + (d.by ? ' by ' + d.by : ''));
  return `<article class="dcard ${rowClass(a)}${cancelled ? ' cancelled' : ''}" data-dckey="${esc(key)}">
    <header class="dch">
      <div class="dcplate"><span class="dcref">${refPlate(key, 26)}</span><span class="dctype">${esc(what || 'reference')}</span></div>
      <div class="dcno"><em>Asset no.</em><b>${assetNosLine(a) || '<span class="todo">none supplied</span>'}</b></div>
      <div class="dcloc"><b>${esc(link ? link.label : (a.drawing || '—'))}</b><span>${esc(where)}</span>
        ${tags.length ? `<span class="dctags">${tags.map(t => `<i>${esc(t)}</i>`).join('')}</span>` : ''}</div>
      <div class="dcbrand"><b>GC500 <i>2026</i></b><span>Surfers Paradise Street Circuit</span><i class="dflag" aria-hidden="true"></i></div>
    </header>
    <div class="dcg">
      <section class="dcp dcstatus"><h5>${dcIco('lamp')}Status</h5>
        ${cancelled ? lightCell(a) : `<div class="dcst">${dstat(a, {size: 'md', ctl: true})}</div>
        ${updated ? `<div class="dcupd">${esc(updated)}</div>` : ''}
        <div class="dcacts">${doneBtn(key, false)}${levelBtn(key, false)}${stepsBtn(key, false)}${isIn ? nextDayBtn(key, false) : ''}${doneChip(a)}${levelChip(a)}${stepsChip(a)}</div>`}
      </section>
      <section class="dcp dctime"><h5>${dcIco('cal')}Time · day</h5>
        <div class="dctd">${isIn ? `<input type="time" step="300" data-eta="${esc(key)}" value="${esc(d.eta || '')}" aria-label="Planned time to site for ${esc(key)}">` : `<b>${d.eta ? esc(d.eta) : '—'}</b>`}
          <input type="date" data-${isIn ? 'date' : 'outdate'}="${esc(key)}" value="${esc(day || '')}" aria-label="${isIn ? 'Day it is due in' : 'Day it is due out'} for ${esc(key)}" title="change the day — the plan date is kept beside it"></div>
        <div class="dcsub">${esc(dow)}${moved_from ? ` <span class="chip act" title="moved by ${esc((isIn ? eff.in_by : eff.out_by) || 'unnamed')} ${esc(fmtStamp((isIn ? eff.in_at : eff.out_at) || ''))}">moved from ${esc(fmtDay(moved_from).dm)}</span>` : ''}</div>
      </section>
      <section class="dcp dcqty"><h5>${dcIco('box')}Quantity</h5><b class="dcbig">${esc(qty || '—')}</b><span class="dcsub">${esc(what)}</span></section>
      <section class="dcp dcwhere"><h5>${dcIco('pin')}Location</h5>
        <div class="dcwrow"><div><b>${esc(link ? link.label : '—')}</b><span class="dcsub">${link ? esc(link.sheet) + ' · a drawing callout, not a surveyed position' : 'no drawing link'}</span>
          <div class="dcpin">${dayPinCell(a).replace(/^<br>/, '')}</div>
          ${mapSheetFor(a) ? `<button class="btn sm" data-map="${esc(key)}">Open on the map</button>` : ''}</div>
          ${mapThumb}</div>
      </section>
      <section class="dcp dcdraw"><h5>${dcIco('doc')}Drawing / reference</h5>
        ${link ? `<b>${esc(link.sheet)}</b><span class="dcsub">callout ${esc(link.label)}${link.state ? ' · ' + esc(link.state) : ''}</span>` : `<span class="chip">no drawing link</span>`}
        ${a.reference_state ? '<br><span class="chip crit">unresolved ref</span>' : ''}${bdBadge(key)}
      </section>
      <section class="dcp dcsays"><h5>${dcIco('clock')}Schedule says</h5><div class="dcsaid">${says || '<span class="todo">—</span>'}${inferred ? ' <span class="chip cand" title="the schedule row carries no movement word; the phase implies it">inferred</span>' : ''}</div></section>
      <section class="dcp dcprog"><h5>${dcIco('list')}Task progress</h5>
        <div class="dcbar"><i style="width:${pct}%"></i></div><b class="dcpct">${pct}%</b>
        <ul class="dcchecks">${checks.map(([w, on]) => `<li class="${on ? 'on' : ''}"><i>${on ? '✓' : ''}</i>${esc(w)}</li>`).join('')}</ul>
        <span class="dcsub">${doneN} of ${checks.length} recorded</span>
      </section>
      <section class="dcp dcnote"><h5>${dcIco('note')}Notes</h5>
        <input data-dnote="${esc(key)}" value="${esc(d.note || '')}" placeholder="Add a note…" aria-label="Delivery note for ${esc(key)}"${SYNC.readonly ? ' readonly' : ''}>
      </section>
      <section class="dcp dcphoto"><h5>${dcIco('cam')}Site photographs</h5>
        ${photos.length ? `<div class="dcshots">${photos.slice(0, 3).map((p, i) => `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" title="open the photograph full size"><img src="${esc(p.url)}" alt="photograph ${i + 1} of ${photos.length} for ${esc(key)}" loading="lazy" decoding="async"></a>`).join('')}</div><span class="dcsub">${photos.length} photograph${photos.length === 1 ? '' : 's'} · add more in the drawer</span>`
                        : `<span class="dcsub dcnone">No photograph yet${SYNC.backend && SYNC.backend.fileUrl ? ' — Open the reference to add one' : ''}</span>`}
      </section>
      <section class="dcp dchist"><h5>${dcIco('hist')}History</h5>
        ${hist.length ? `<ul class="dchl">${hist.slice(0, 5).map(h => `<li><i class="${esc(h.c || '')}"></i><span>${esc(fmtStamp(h.at))}</span><b>${esc(h.what)}</b><em>${esc(h.by || '')}</em></li>`).join('')}</ul>` : '<span class="dcsub dcnone">Nothing recorded yet</span>'}
      </section>
    </div>
    <footer class="dcf"><span class="dcfl"><b>GC500 <i>2026</i></b> · Surfers Paradise Street Circuit</span>
      <span class="dcfm">${COATES_WAY_VALUES.join(' · ')}</span>
      <span class="dcfa"><button class="btn" data-k="${esc(key)}">Open</button>${isIn && !cancelled ? `<button class="btn" data-drop="${esc(key)}">Drop sheet</button>` : ''}</span></footer>
  </article>`;
}
function dayPinCell(a){"""

OLD_IN = """</div>${dayRows(ins, 'deliveries')}`"""
NEW_IN = """</div>${full ? dayCards(ins, 'deliveries') : dayRows(ins, 'deliveries')}`"""
OLD_OUT = """</div>${dayRows(outs, 'removals')}`"""
NEW_OUT = """</div>${full ? dayCards(outs, 'removals') : dayRows(outs, 'removals')}`"""

OLD_WIRE = """  pane.querySelectorAll('[data-drop]').forEach(n => n.onclick = () => dropSheet(n.dataset.drop));
  pane.querySelectorAll('[data-copy-day]').forEach(n => n.onclick = () => copyLink('day/' + n.dataset.copyDay, fmtDate(n.dataset.copyDay)));"""
NEW_WIRE = """  pane.querySelectorAll('[data-drop]').forEach(n => n.onclick = () => dropSheet(n.dataset.drop));
  /* v6.40 - the delivery cards: the note writes the same record the drawer's note does; the car on the footer strip */
  pane.querySelectorAll('.dcard [data-dnote]').forEach(n => n.onchange = () => setDeliveryNote(n.dataset.dnote, n.value));
  try { const hz = getComputedStyle(document.querySelector('header.top')).getPropertyValue('--hzcar'); if (hz) document.documentElement.style.setProperty('--hzcar', hz); } catch (e) {}
  pane.querySelectorAll('[data-copy-day]').forEach(n => n.onclick = () => copyLink('day/' + n.dataset.copyDay, fmtDate(n.dataset.copyDay)));"""

OLD_END = """@media print{ .day .dface::before{background:#222!important;-webkit-print-color-adjust:exact;print-color-adjust:exact} }
</style></head>"""
NEW_END = """@media print{ .day .dface::before{background:#222!important;-webkit-print-color-adjust:exact;print-color-adjust:exact} }
/* ================================================================================================================
   v6.40 - THE DELIVERY CARD (Andrew Fisher, 26 Sep 2026, from his WB02 mock-ups). One card per reference on the day.
   ================================================================================================================ */
.dcards{display:flex;flex-direction:column;gap:16px;margin:8px 0 14px}
.dcard{border-radius:18px;overflow:hidden;background:var(--paper);border:1px solid var(--rule);box-shadow:var(--sh-card,0 10px 24px -12px rgba(20,14,10,.35));
  font-family:'Inter',var(--sans,system-ui,sans-serif);position:relative;transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s}
.dcard:hover{transform:translateY(-2px);box-shadow:0 18px 34px -14px rgba(20,14,10,.4)}
.dcard .dch{display:grid;grid-template-columns:auto auto minmax(0,1fr) auto;gap:0 18px;align-items:center;padding:0 16px 0 0;min-height:76px;color:#f4f0ea;
  background:radial-gradient(rgba(255,255,255,.07) 16%,transparent 17%) 0 0/4px 4px,radial-gradient(rgba(255,255,255,.07) 16%,transparent 17%) 2px 2px/4px 4px,linear-gradient(180deg,#2b2c30,#131315);
  border-bottom:3px solid var(--orange)}
.dcard.done .dch{border-bottom-color:#2eaa5c} .dcard.moving .dch{border-bottom-color:#e6a23c} .dcard.complete .dch{border-bottom-color:#1f8a4c}
.dcplate{display:flex;flex-direction:column;justify-content:center;gap:2px;padding:10px 26px 10px 18px;align-self:stretch;min-width:150px;
  background:linear-gradient(152deg,#FF8E35 0%,#FF761B 48%,#FF6A13 100%);clip-path:polygon(0 0,100% 0,calc(100% - 18px) 100%,0 100%);color:#1b1207}
.dcplate .dcref .rplate{font-size:26px} .dcplate .dctype{font-size:9.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#1b1207;opacity:.85;max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dcno{display:flex;flex-direction:column;gap:3px;padding-right:18px;border-right:1px solid rgba(255,255,255,.14);min-width:90px}
.dcno em,.dcloc .dcsub{font-style:normal} .dcno em{font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#a9b4b3} .dcno b{font-size:14px;color:#fff}
.dcno .anos{font-size:13px;color:#fff} .dcno .todo{color:#a9b4b3;font-weight:500}
.dcloc{display:flex;flex-direction:column;gap:2px;min-width:0;padding:8px 0}
.dcloc b{font-size:22px;font-weight:800;letter-spacing:-.01em;color:#fff;line-height:1.05} .dcloc > span{font-size:13px;color:#d2d8d2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dctags{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px} .dctags i{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#e8ede8}
.dcbrand{display:flex;flex-direction:column;align-items:flex-end;gap:2px;text-align:right;padding-left:14px;border-left:1px solid rgba(255,255,255,.14)}
.dcbrand b{font:italic 800 22px/1 'Barlow Condensed','Arial Narrow',var(--sans,system-ui,sans-serif);color:#fff;letter-spacing:-.01em} .dcbrand b i{color:var(--orange)}
.dcbrand span{font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a9b4b3} .dcbrand .dflag{margin-top:4px}
.dcg{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px;padding:12px}
.dcp{background:var(--tint);border:1px solid var(--rule2);border-radius:12px;padding:10px 12px 11px;min-width:0;display:flex;flex-direction:column;gap:6px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
.dcp h5{margin:0;display:flex;align-items:center;gap:7px;font-size:9.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--slate)}
.dcico{display:inline-flex;width:18px;height:18px;flex:0 0 auto;color:var(--ink2)} .dcico svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dcsub{font-size:11.5px;color:var(--mute);line-height:1.35} .dcnone{font-style:italic}
.dcbig{font-size:30px;font-weight:800;line-height:1;color:var(--ink);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.dcstatus{grid-column:span 5} .dctime{grid-column:span 4} .dcqty{grid-column:span 3}
.dcwhere{grid-column:span 5} .dcdraw{grid-column:span 3} .dcsays{grid-column:span 4}
.dcprog{grid-column:span 4} .dcnote{grid-column:span 4} .dcphoto{grid-column:span 4} .dchist{grid-column:span 12}
.dcst{display:flex;align-items:center} .dcst .dstat{gap:12px} .dcst .ds-w b{font-size:22px} .dcst .ds-w em{font-size:11.5px}
.dcupd{font-size:11px;color:var(--mute);letter-spacing:.02em}
.dcacts{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:2px}
.dctd{display:flex;align-items:center;gap:8px;flex-wrap:wrap} .dctd input{font:inherit;font-size:15px;font-weight:700;padding:6px 8px;border:1px solid var(--rule);border-radius:9px;background:var(--paper);color:var(--ink)}
.dctd input[type=time]{font-size:22px;font-weight:800;letter-spacing:-.02em;padding:4px 8px} .dctd b{font-size:22px;font-weight:800}
.dcwrow{display:flex;gap:10px;align-items:stretch} .dcwrow > div{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:5px} .dcwrow b{font-size:18px;font-weight:800}
.dcpin{font-size:12px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
.dcmap{position:relative;flex:0 0 150px;width:150px;aspect-ratio:4/3;border-radius:10px;overflow:hidden;background:#0d1214;border:1px solid var(--rule);--z:3.4;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.dcmap img{position:absolute;width:calc(var(--z) * 100%);max-width:none;left:calc(50% - var(--fx) * var(--z) * 100%);top:calc(50% - var(--fy) * var(--z) * 55.67%);pointer-events:none}
.dcmap .dcdot{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--orange);border:2px solid #fff;box-shadow:0 0 0 4px rgba(255,106,19,.35),0 2px 6px rgba(0,0,0,.6)}
.dcmap em{position:absolute;left:6px;bottom:5px;font:800 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;font-style:italic;color:#fff;background:rgba(0,0,0,.55);padding:3px 6px;border-radius:5px;letter-spacing:.04em}
.dcsaid{font-size:12.5px;line-height:1.45}
.dcbar{height:9px;border-radius:6px;background:var(--rule);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.18)} .dcbar i{display:block;height:100%;border-radius:6px;background:linear-gradient(180deg,#3fd27a,#1f9d4f);transition:width .6s cubic-bezier(.2,.7,.2,1)}
.dcpct{font-size:20px;font-weight:800;color:var(--ink);letter-spacing:-.02em;margin-top:-30px;align-self:flex-end;font-variant-numeric:tabular-nums;position:relative;top:-6px}
.dcchecks{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px 12px}
.dcchecks li{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--mute)} .dcchecks li i{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--rule);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-style:normal;color:#fff}
.dcchecks li.on{color:var(--ink)} .dcchecks li.on i{background:#1f9d4f;border-color:#1f9d4f}
.dcnote input{font:inherit;font-size:13px;padding:8px 10px;border:1px solid var(--rule);border-radius:9px;background:var(--paper);color:var(--ink);width:100%}
.dcshots{display:flex;gap:6px} .dcshots a{flex:1 1 0;min-width:0;aspect-ratio:4/3;border-radius:8px;overflow:hidden;border:1px solid var(--rule);background:#111} .dcshots img{width:100%;height:100%;object-fit:cover;display:block}
.dchl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.dchl li{display:grid;grid-template-columns:12px 150px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:12px} .dchl li i{width:9px;height:9px;border-radius:50%;background:var(--rule)}
.dchl li i.green{background:var(--tl-green)} .dchl li i.amber{background:var(--tl-amber)} .dchl li i.red{background:var(--tl-red)} .dchl li span{color:var(--mute);font-variant-numeric:tabular-nums} .dchl li b{font-weight:700;color:var(--ink)} .dchl li em{font-style:normal;color:var(--mute);font-size:11px}
.dcf{display:flex;align-items:center;gap:14px;padding:10px 16px 10px 200px;min-height:56px;position:relative;color:#d2d8d2;
  background:linear-gradient(90deg,#0f1516,#1c2426 60%,#0f1516);border-top:2px solid var(--orange)}
.dcf::before{content:"";position:absolute;left:8px;top:2px;width:184px;height:56px;background:var(--hzcar) center/contain no-repeat;filter:drop-shadow(0 6px 6px rgba(0,0,0,.7))}
.dcf::after{content:"";position:absolute;left:14px;right:40%;bottom:6px;height:2px;background:linear-gradient(90deg,transparent,rgba(255,150,80,.5) 30%,transparent);pointer-events:none}
.dcfl{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#a9b4b3;white-space:nowrap} .dcfl b{font:italic 800 18px/1 'Barlow Condensed','Arial Narrow',sans-serif;color:#fff;letter-spacing:0} .dcfl b i{color:var(--orange)}
.dcfm{flex:1 1 auto;text-align:center;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#ff9956;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dcfa{display:flex;gap:6px;flex:0 0 auto} .dcfa .btn{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.28)} .dcfa .btn:hover{background:rgba(255,255,255,.16)}
.dcard.cancelled{opacity:.8}
@media (max-width:1100px){ .dcstatus{grid-column:span 7} .dctime{grid-column:span 5} .dcqty{grid-column:span 4} .dcwhere{grid-column:span 8} .dcdraw{grid-column:span 6} .dcsays{grid-column:span 6} .dcprog,.dcnote,.dcphoto{grid-column:span 6} }
@media (max-width:760px){ .dcard .dch{grid-template-columns:auto minmax(0,1fr);row-gap:6px;padding:0 12px 10px 0} .dcno,.dcbrand{display:none} .dcloc{grid-column:2} .dcplate{min-width:120px;padding:8px 20px 8px 12px} .dcplate .dcref .rplate{font-size:22px}
  .dcg{grid-template-columns:1fr 1fr;padding:10px} .dcp{grid-column:span 2!important} .dcqty,.dctime{grid-column:span 1!important} .dctd input[type=time]{font-size:18px}
  .dcf{padding-left:16px;flex-wrap:wrap} .dcf::before,.dcf::after{display:none} .dcfm{display:none} .dchl li{grid-template-columns:12px minmax(0,1fr);row-gap:0} .dchl li span{grid-column:2} .dchl li em{grid-column:2} }
@media (prefers-color-scheme:dark){ .dcp{box-shadow:none} .dctd input,.dcnote input{background:var(--tint2,rgba(255,255,255,.04))} }
@media print{ .dcard{break-inside:avoid;box-shadow:none} .dcf,.dcmap{display:none} }
</style></head>"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_FN, NEW_FN, 'card fn')
    t = rep(t, OLD_IN, NEW_IN, 'due in rows')
    t = rep(t, OLD_OUT, NEW_OUT, 'due out rows')
    t = rep(t, OLD_WIRE, NEW_WIRE, 'wire')
    t = rep(t, OLD_END, NEW_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
