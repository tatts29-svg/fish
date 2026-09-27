/* v7.24/v7.25 - WHERE WE ARE AS ONE INSTRUMENT PANEL. The project manager, 28 Sep 2026: "make it look like a race car dash that
 animates, 4K ultra crystal clear. Animate it really good", with the instrument-panel handover of the same morning.

 One charcoal housing: the delivery gauge on the left (Due by this day / Whole job), Fencing and Calculated revenue
 stacked on the right, the shared-record state along the bottom edge. It replaces the delivery block and the four white
 cards that repeated it. Nothing they said is lost - it moves into three drawers: View delivery details, View fencing
 breakdown, View charges.

 Every figure is read from the same functions the rest of the page uses (completionAsOf, fenceMetres, moneySummary) -
 no second totals calculator. The numbers are exact from the first frame; only the needle and arc travel.

 Words, per the handover: the 29 is a gap in the RECORD, shown only in the delivery drawer and never as a red headline;
 the 5 extra are split into "not due yet or undated" and "more than asked for", not all called early; fencing is
 "recorded fence work" (clean and scrim are added as work, not deduplicated length); revenue is "calculated", ex GST,
 with its missing rates said - never profit, invoiced or cash.

 Motion: on arrival the housing rises in, the zones follow left to right, and the needle and arc sweep up together.
 The mode switch slides its indicator, cross-fades the words as one group and moves the needle from wherever it is
 at that moment - a second click mid-sweep turns it around, it never jumps or queues. A redraw from a sync does not
 replay the entry; a figure that genuinely changed glows once. Reduced motion shows the final state at once. Nothing
 loops: the only animation frames run while something is moving. */
const WIP = {v: null, raf: 0, swapT: 0, open: null, at: null, last: null};
const WIP_A0 = -120, WIP_SW = 240, WIP_CX = 200, WIP_CY = 178, WIP_R = 164;
function wipCalm(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off'; } catch (e) { return false; } }
function wipModel(asOf){
 const X = dsnState(asOf), C = completionAsOf(asOf, X), P = X.P, F = fenceMetres(P), M = moneySummary(asOf), dm = fmtDay(asOf).dm;
 const due = C.plan > 0, whole = C.all > 0;
 const mode = {
  due: {has: due, v: due ? Math.max(0, Math.min(100, C.pace || 0)) : 0, pc: due ? pc1(C.pace) : '—', k1: 'DELIVERY', k2: 'AGAINST PLAN',
   fr: due ? `${fmtNum(C.onDue)} of ${fmtNum(C.plan)} due units recorded` : 'Nothing is due by this day', fa: due ? fmtNum(C.onDue) : '', fb: due ? fmtNum(C.plan) : '', ft: due ? 'due units recorded' : 'Nothing is due by this day', dt: 'Due by ' + dm},
  all: {has: whole, v: whole ? Math.max(0, Math.min(100, C.pct || 0)) : 0, pc: whole ? pc1(C.pct) : '—', k1: 'DELIVERY', k2: 'WHOLE JOB',
   fr: whole ? `${fmtNum(C.on)} of ${fmtNum(C.all)} units recorded` : 'The schedule carries no units', fa: whole ? fmtNum(C.on) : '', fb: whole ? fmtNum(C.all) : '', ft: whole ? 'units recorded' : 'The schedule carries no units', dt: 'Whole job · as at ' + dm + (C.refsNoQty ? ' · provisional' : '')}};
 /* the extra recorded units, split honestly: rows not due yet (or with no date), and more than asked for on rows already due */
 let notDue = 0, surplus = 0; (X.rows || []).forEach(r => { if (r.reloc) return; if (r.due) surplus += Math.max(0, (r.unitsOn || 0) - (r.asked || 0)); else notDue += r.unitsOn || 0; });
 return {asOf, dm, C, P, F, M, X, mode, notDue, surplus};
}
function wipFr(M){ return M.fa ? `<tspan class="wgb">${esc(M.fa)}</tspan> of <tspan class="wgb">${esc(M.fb)}</tspan> ${esc(M.ft)}` : esc(M.ft); }
function wipArc(pct){ const p = d => [WIP_CX + Math.sin(d * Math.PI / 180) * WIP_R, WIP_CY - Math.cos(d * Math.PI / 180) * WIP_R];
 const a = p(WIP_A0), b = p(WIP_A0 + WIP_SW * pct / 100);
 return `M ${a[0].toFixed(2)} ${a[1].toFixed(2)} A ${WIP_R} ${WIP_R} 0 ${WIP_SW * pct / 100 > 180 ? 1 : 0} 1 ${b[0].toFixed(2)} ${b[1].toFixed(2)}`; }
function wipGauge(m, k, v0){
 const M = m.mode[k], pt = (d, r) => [WIP_CX + Math.sin(d * Math.PI / 180) * r, WIP_CY - Math.cos(d * Math.PI / 180) * r];
 let ticks = '';
 for (let i = 0; i <= 50; i++) { const d = WIP_A0 + i * WIP_SW / 50, maj = i % 5 === 0, a = pt(d, 150), b = pt(d, maj ? 137 : 143.5);
  ticks += `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}" class="${maj ? 'wtk maj' : 'wtk'}"/>`; }
 /* 25, 50 and 75 inside the scale; 0 and 100 just under the arc's two ends, clear of the reading */
 const labels = [25, 50, 75].map(n => { const q = pt(WIP_A0 + n * WIP_SW / 100, 123); return `<text x="${q[0].toFixed(1)}" y="${(q[1] + 4).toFixed(1)}" class="wtl">${n}</text>`; }).join('')
  + [0, 100].map(n => { const q = pt(WIP_A0 + n * WIP_SW / 100, WIP_R); return `<text x="${(q[0] + (n ? 14 : -14)).toFixed(1)}" y="${(q[1] + 8).toFixed(1)}" class="wtl" text-anchor="${n ? 'start' : 'end'}" style="text-anchor:${n ? 'start' : 'end'}">${n}</text>`; }).join('');
 const v = Math.max(0, Math.min(100, v0)), full = wipArc(100);
 return `<div class="wg"><svg viewBox="0 0 400 332" role="img" aria-labelledby="wgt" preserveAspectRatio="xMidYMid meet">
 <title id="wgt">${esc(M.k2 === 'WHOLE JOB' ? 'Whole job' : 'Delivery against plan')}: ${esc(M.pc)}${M.has ? ' per cent' : ''}, ${esc(M.fr)}, ${esc(M.dt)}</title>
 <defs><linearGradient id="wgfg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ff5f0a"/><stop offset=".6" stop-color="#ff7a1a"/><stop offset="1" stop-color="#ffa24d"/></linearGradient>
 <radialGradient id="wgface" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#1f2729"/><stop offset=".8" stop-color="#161c1e"/><stop offset="1" stop-color="#121719"/></radialGradient>
 <linearGradient id="wgringG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>
 <linearGradient id="wgglassG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <radialGradient id="wgpiv" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#3a4447"/><stop offset=".55" stop-color="#171d1f"/><stop offset="1" stop-color="#0c1011"/></radialGradient></defs>
 <circle cx="${WIP_CX}" cy="${WIP_CY}" r="${WIP_R + 14}" class="wgface"/>
 <circle cx="${WIP_CX}" cy="${WIP_CY}" r="${WIP_R + 14}" class="wgedge"/>
 <circle cx="${WIP_CX}" cy="${WIP_CY}" r="${WIP_R + 13}" class="wgring"/>
 <path d="M${WIP_CX - 150} ${WIP_CY - 40} A ${WIP_R + 12} ${WIP_R + 12} 0 0 1 ${WIP_CX + 118} ${WIP_CY - 116} Q ${WIP_CX - 10} ${WIP_CY - 110} ${WIP_CX - 150} ${WIP_CY - 40} Z" class="wgglass"/>
 <path d="${full}" class="wgtrack"/>
 <path d="${full}" class="wgglow" pathLength="100" stroke-dasharray="${v.toFixed(3)} 100"/>
 <path d="${full}" class="wgfill" pathLength="100" stroke-dasharray="${v.toFixed(3)} 100"/>
 <g class="wgticks">${ticks}</g><g>${labels}</g>
 <g class="wgtx${M.has ? '' : ' none'}">
  <text x="200" y="104" class="wgk">${esc(M.k1)}</text><text x="200" y="124" class="wgk">${esc(M.k2)}</text>
  <text x="200" y="252" class="wgpc"><tspan class="wgpcn">${esc(M.pc)}</tspan>${M.has ? '<tspan class="wgpcu" dx="3">%</tspan>' : ''}</text>
  <line x1="112" y1="268" x2="288" y2="268" class="wgrule"/>
  <text x="200" y="291" class="wgfr">${wipFr(M)}</text>
  <text x="200" y="314" class="wgdt">${esc(M.dt)}</text></g>
 <g class="wgneedle" transform="rotate(${(WIP_A0 + v * WIP_SW / 100).toFixed(3)} ${WIP_CX} ${WIP_CY})">
  <path d="M198.1 ${WIP_CY + 16} L199.5 ${WIP_CY - 147} L200.5 ${WIP_CY - 147} L201.9 ${WIP_CY + 16} Z" class="wgn"/>
  <path d="M199.7 ${WIP_CY - 8} L199.9 ${WIP_CY - 145} L200.1 ${WIP_CY - 145} L200.3 ${WIP_CY - 8} Z" class="wgn2"/></g>
 <circle cx="${WIP_CX}" cy="${WIP_CY}" r="11" class="wgpiv"/><circle cx="${WIP_CX}" cy="${WIP_CY}" r="4.2" class="wgpin"/>
 <path d="M${WIP_CX - 6.5} ${WIP_CY - 5.5} A 8.5 8.5 0 0 1 ${WIP_CX + 3} ${WIP_CY - 8.2}" class="wgshine"/>
 </svg></div>`;
}
const WIP_ICO = {
 fence: '<svg viewBox="0 0 72 60" aria-hidden="true"><path d="M8 8h56v36H8z"/><path d="M15 8v36M22 8v36M29 8v36M36 8v36M43 8v36M50 8v36M57 8v36M8 15h56M8 22h56M8 29h56M8 36h56" class="fine"/><path d="M6 8h4M62 8h4M9 44v6M63 44v6M3 53l6-3 6 3zM57 53l6-3 6 3z"/></svg>',
 cash: '<svg viewBox="0 0 60 64" aria-hidden="true"><path d="M12 5h36a3 3 0 0 1 3 3v49l-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4V8a3 3 0 0 1 3-3z"/><path d="M36 20c-1.4-2-3.6-3-6-3-3.4 0-6 1.8-6 4.4 0 6 12 3.2 12 9.2 0 2.8-2.7 4.6-6 4.6-2.7 0-5-1.2-6.4-3.2M30 14v3.2M30 35.2v3.2"/><path d="M20 45h20M23 50h14" class="fine"/></svg>',
 arrow: '<svg viewBox="0 0 20 12" aria-hidden="true" class="wa"><path d="M1 6h16M12 1.5 17 6l-5 4.5"/></svg>'};
function wipPanel(asOf){
 let m; try { m = wipModel(asOf); } catch (e) { return completionBlock(asOf, null, {head: true}); }
 const k = state.gscope === 'all' ? 'all' : 'due', M = m.mode[k], prev = GI_SEEN.get('wwa'), entry = prev === undefined, calm = wipCalm();
 /* where the needle is drawn in the first frame: nought on arrival, where it visibly is if a redraw lands mid-sweep, else home */
 if (entry) { cancelAnimationFrame(WIP.raf); WIP.v = 0; }
 const v0 = calm ? M.v : entry ? 0 : (WIP.v != null ? WIP.v : M.v);
 const cur = {fence: m.F.done, rev: m.M.charge.total, pc: M.pc + M.fr};
 const chg = !entry && WIP.last ? Object.keys(cur).filter(x => WIP.last[x] !== cur[x]) : [];
 WIP.last = cur; WIP.model = m;
 const unk = m.M.charge.contracts_unknown || 0;
 const off = allAssets().filter(a => a._cancelled), stillOn = off.filter(a => machinesOnHire(a.key, asOf).length);
 const st = (() => { try { return recordState(syncWaiting()); } catch (e) { return null; } })();
 const btn = (key, label) => `<button type="button" class="wact" data-wdr="${key}" aria-expanded="${WIP.open === key}" aria-controls="wdr-${key}">${label}${WIP_ICO.arrow}</button>`;
 return `<section class="wip${entry && !calm ? ' enter' : ''}" aria-label="Where we are - instrument panel" data-mode="${k}">
 <svg class="wshell" aria-hidden="true" focusable="false"></svg>
 <div class="wgrid">
  <div class="wz wz1">
   <div class="wtog" role="group" aria-label="What the gauge reads" data-mode="${k}"><i aria-hidden="true"></i>
    <button type="button" data-wscope="due" aria-pressed="${k === 'due'}" class="${k === 'due' ? 'on' : ''}" data-ro>Due by this day</button>
    <button type="button" data-wscope="all" aria-pressed="${k === 'all'}" class="${k === 'all' ? 'on' : ''}" data-ro>Whole job</button></div>
   <div class="wgwrap${chg.includes('pc') ? ' chg' : ''}">${wipGauge(m, k, v0)}</div>
   <p class="vh" aria-live="polite" id="wgsay">${esc(M.k2 === 'WHOLE JOB' ? 'Whole job' : 'Delivery against plan')}: ${esc(M.pc)}${M.has ? ' per cent' : ''}. ${esc(M.fr)}. ${esc(M.dt)}.</p>
   <div class="wacts">${btn('del', 'View delivery details')}</div>
  </div>
  <div class="wdiv" aria-hidden="true"></div>
  <div class="wright">
   <div class="wmod wz wz2"><span class="wico">${WIP_ICO.fence}</span><div>
    <p class="wk">Fencing records</p><p class="wn${chg.includes('fence') ? ' chg' : ''}">${esc(fmtNum(m.F.done))}<small> m</small></p>
    <p class="ws">Recorded fence work · to ${esc(m.dm)}</p>${btn('fen', 'View fencing breakdown')}</div></div>
   <div class="wmod wz wz3"><span class="wico">${WIP_ICO.cash}</span><div>
    <p class="wk">Calculated revenue</p><p class="wn${chg.includes('rev') ? ' chg' : ''}">${m.M.charge.total ? esc(money0(m.M.charge.total)) : '—'}<small> ex GST</small></p>
    <p class="ws">${unk ? `Rate coverage incomplete · ${esc(fmtNum(unk))} hire line${unk === 1 ? '' : 's'} with no rate` : 'Every hire line has a rate'}</p>
    ${stillOn.length ? `<p class="wwarn">${esc(stillOn.map(a => a.key).join(', '))} called off, still on hire</p>` : ''}${btn('rev', 'View charges')}</div></div>
  </div>
 </div>
 <div class="wdrs">${wipDrawer('del', m)}${wipDrawer('fen', m)}${wipDrawer('rev', m, off, stillOn)}</div>
 <div class="wfoot"><span class="wled ${st ? esc(st.k) : ''}" aria-hidden="true"></span><span id="wipStat">${st ? esc(st.word + ' · ' + st.sub) : 'Record state unknown'}</span></div>
 </section>`;
}
function wipDrawer(key, m, off, stillOn){
 const open = WIP.open === key, C = m.C, P = m.P;
 let body = '';
 if (key === 'del') {
  const rows = m.X.rows || [], on = rows.filter(r => r.on), onPerson = on.filter(r => !r.byRental).length;
  const numbers = rows.reduce((s, r) => s + (r.nums || []).filter(x => !isMiscRow(x)).length, 0), subs = rows.reduce((s, r) => s + (r.subs || []).length, 0);
  const all = m.X.all || [], refs = all.filter(a => !isPlantLine(a) && !a._added).length, lines = all.filter(isPlantLine).length, trades = new Set(all.map(a => a.discipline)).size;
  body = `<div class="wdg"><div><h4>Due by ${esc(m.dm)}</h4>
   ${C.plan ? (C.shortfall ? `<p><b>${esc(fmtNum(C.shortfall))}</b> of the ${esc(fmtNum(C.plan))} units due by ${esc(m.dm)} aren’t recorded on site yet. That’s a gap in the record, not proof they’re late - anything due today can still arrive today.</p>
    <ul><li>Recorded as not on site, past their day: <b>${esc(fmtNum(P.all.overdue || 0))}</b> reference${P.all.overdue === 1 ? '' : 's'}</li>
    <li>Due, with no delivery record yet: <b>${esc(fmtNum(P.all.norecord || 0))}</b> reference${P.all.norecord === 1 ? '' : 's'}${(P.all.norecord_keys || []).length ? ' - ' + keyBtns(P.all.norecord_keys) : ''}</li></ul>`
    : `<p>Everything due by ${esc(m.dm)} is recorded on site.</p>`) : '<p>Nothing is due on site by this day.</p>'}
   ${C.onEarly ? `<p><b>${esc(fmtNum(C.onEarly))}</b> more unit${C.onEarly === 1 ? ' is' : 's are'} recorded beyond the due rows: ${esc(fmtNum(m.notDue))} not due yet or with no date, ${esc(fmtNum(m.surplus))} more than asked for on rows already due. They don’t make up the gap.</p>` : ''}</div>
   <div><h4>The whole job</h4><p><b>${esc(fmtNum(C.all))}</b> units across ${trades} trades on ${all.length} references - ${refs} drawn on the sheets and ${lines} plant lines with no drawing reference (VMS boards, forklifts, track mat). It counts equipment deliveries, not overall completion.${C.refsNoQty ? ` ${esc(fmtNum(C.refsNoQty))} reference${C.refsNoQty === 1 ? '' : 's'} with no quantity count as one each until confirmed.` : ''}</p>
   <p>On site comes from ${numbers} asset number${numbers === 1 ? '' : 's'} on hire in the rental system${subs ? `, ${subs} subhired machine${subs === 1 ? '' : 's'}` : ''}${onPerson ? ` and ${onPerson} line${onPerson === 1 ? '' : 's'} set by a person on site` : ''}. A light a person sets overrides the rental system.</p></div></div>
   <p class="wgo"><button type="button" class="wact" data-wgo="detail">Open the trade-by-trade detail${WIP_ICO.arrow}</button></p>`;
 } else if (key === 'fen') {
  const ft = fenceTypes(P);
  body = `<div class="tblwrap"><table class="wtb"><thead><tr><th>Line</th><th class="num">Recorded</th><th class="num">Planned by ${esc(m.dm)}</th><th class="num">Whole programme</th></tr></thead><tbody>${
   ft.map(t => `<tr><td>${esc(rsGapName(t))}</td><td class="num"><b>${esc(fmtQty(t.done, t.unit))}</b></td><td class="num">${t.planned == null ? '—' : esc(fmtQty(t.planned, t.unit))}</td><td class="num">${esc(fmtQty(t.total, t.unit))}</td></tr>`).join('')}</tbody></table></div>
   <p>The headline is clean plus braced-for-scrim fence, as recorded on the dockets: ${esc(fmtNum((ft.find(t => /clean/i.test(t.name)) || {}).done || 0))} m clean and ${esc(fmtNum((ft.find(t => /scrim/i.test(t.name)) || {}).done || 0))} m scrim. It is work recorded, not unique fence length - a scrim upgrade on a fence already standing isn’t new length. A short line is a gap in the record until the dockets say otherwise.</p>
   <p class="wgo"><button type="button" class="wact" data-wgo="fencing">Open the Fencing tab${WIP_ICO.arrow}</button></p>`;
 } else {
  const ch = m.M.charge, parts = [['Hire contracts, by the rate (incl. subhire and delivery lines)', ch.contracts], ['Fencing dockets, at the 2026 card', ch.fencing], ['Event labour scope' + (ch.race && ch.race.provisional ? ' (provisional)' : ''), ch.race ? ch.race.amount : 0], ['Labour ticked per piece', ch.labour], ['Other charge lines', ch.other]];
  const sum = parts.reduce((s, p) => s + (p[1] || 0), 0), rest = Math.round((ch.total - sum) * 100) / 100;
  if (Math.abs(rest) >= 0.01) parts.push(['Not itemised here', rest]);
  body = `<div class="tblwrap"><table class="wtb"><tbody>${parts.filter(p => p[1]).map(p => `<tr><td>${esc(p[0])}</td><td class="num">${esc(money0(p[1]))}</td></tr>`).join('')}
   <tr class="tot"><td><b>Calculated revenue, ex GST</b></td><td class="num"><b>${esc(money0(ch.total))}</b></td></tr></tbody></table></div>
   <p>Worked out from the record: planned and recorded charges together. It isn’t profit, and it isn’t invoiced or paid.${(m.M.missing_short || []).length ? ` Still missing: ${esc(m.M.missing_short.join('; '))}.` : ''}${(m.M.caveats_short || []).length ? ` Caveats: ${esc(m.M.caveats_short.join('; '))}.` : ''}</p>
   ${off && off.length ? `<p>${off.length} cancelled reference${off.length === 1 ? '' : 's'} (${esc(off.map(a => a.key).join(', '))}) ${off.length === 1 ? 'is' : 'are'} off the schedule and not charged.${stillOn.length ? ` <b>${esc(stillOn.map(a => a.key).join(', '))} ${stillOn.length === 1 ? 'is' : 'are'} still on hire in the rental system</b> - called off isn’t off hire.` : ''}</p>` : ''}
   <p class="wgo"><button type="button" class="wact" data-wgo="costs">Open Costs &amp; charges${WIP_ICO.arrow}</button></p>`;
 }
 return `<div class="wdr${open ? ' open' : ''}" id="wdr-${key}" role="region" aria-label="${key === 'del' ? 'Delivery details' : key === 'fen' ? 'Fencing breakdown' : 'Charges'}"><div class="wdri"><div class="wdrc">${body}</div></div></div>`;
}
/* v7.25 - THE HOUSING, SHAPED LIKE A DASH. The project manager, 28 Sep 2026: "make it look like a dashboard mate, like the
 shape and all". Not a rounded box: a moulded fascia - a cowl rising over the top on sloped shoulders, sides that flare out
 towards the bottom, a dark bezel round a separate instrument face, and an orange edge that catches the light along the
 top and fades down the sides. Drawn in real pixels at the panel's own size (redrawn only when that size changes), so
 every edge is exact on a phone and on a 4K screen. */
const WSH = {px: 8, bt: 20, pb: 18};
function wipOutline(w, h, d, o){
 const {px, bt} = WSH, f = o.f, Hs = Math.max(1, h - 2 * d);
 const L = px + d, R = px + w - d, T = bt + d, B = bt + h - d, tL = L + f, tR = R - f;
 const rt = Math.max(4, o.rt - d * .55), rb = Math.max(6, o.rb - d * .7), n = v => v.toFixed(2);
 const kt = f * rt / Hs, kb = f * rb / Hs;
 let top = `M${n(tL + rt)} ${n(T)}`;
 if (o.brow) { const b0 = px + w * o.b0, b1 = px + w * o.b1, s = o.s, Tb = d + 2;
  top += ` L${n(b0 - s)} ${n(T)} C${n(b0 - s * .42)} ${n(T)} ${n(b0 - s * .38)} ${n(Tb)} ${n(b0 + 4)} ${n(Tb)} L${n(b1 - 4)} ${n(Tb)} C${n(b1 + s * .38)} ${n(Tb)} ${n(b1 + s * .42)} ${n(T)} ${n(b1 + s)} ${n(T)}`; }
 return top + ` L${n(tR - rt)} ${n(T)} Q${n(tR)} ${n(T)} ${n(tR + kt)} ${n(T + rt)} L${n(R - kb)} ${n(B - rb)} Q${n(R)} ${n(B)} ${n(R - rb)} ${n(B)}`
  + ` L${n(L + rb)} ${n(B)} Q${n(L)} ${n(B)} ${n(L + kb)} ${n(B - rb)} L${n(tL - kt)} ${n(T + rt)} Q${n(tL)} ${n(T)} ${n(tL + rt)} ${n(T)} Z`;
}
function wipShell(root){
 const svg = root.querySelector('svg.wshell'); if (!svg) return;
 const w = root.offsetWidth, h = root.offsetHeight; if (!w || !h) return;
 const key = w + 'x' + h; if (svg.dataset.k === key) return; svg.dataset.k = key;
 const narrow = w < 640, W = w + 2 * WSH.px, H = h + WSH.bt + WSH.pb;
 const o = {f: narrow ? 5 : Math.min(18, w * .013), rt: narrow ? 18 : 26, rb: narrow ? 26 : 40, brow: true, b0: narrow ? .2 : .27, b1: narrow ? .8 : .73, s: narrow ? 30 : 58};
 const face = Object.assign({}, o, {brow: false}), fi = narrow ? 8 : 13;
 svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
 svg.innerHTML = `<defs>
  <linearGradient id="wshG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262f32"/><stop offset=".3" stop-color="#181e20"/><stop offset="1" stop-color="#0d1113"/></linearGradient>
  <linearGradient id="wfaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2426"/><stop offset=".55" stop-color="#171d1f"/><stop offset="1" stop-color="#121719"/></linearGradient>
  <linearGradient id="wrimG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>
  <linearGradient id="worG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8d33"/><stop offset=".35" stop-color="#ff7a1a" stop-opacity=".85"/><stop offset=".75" stop-color="#ff7a1a" stop-opacity=".18"/><stop offset="1" stop-color="#ff7a1a" stop-opacity=".08"/></linearGradient>
  <linearGradient id="wsheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <path d="${wipOutline(w, h, 0, o)}" class="wsh-body"/>
  <path d="${wipOutline(w, h, .6, o)}" class="wsh-rim"/>
  <path d="${wipOutline(w, h, 5, o)}" class="wsh-orglow"/>
  <path d="${wipOutline(w, h, 5, o)}" class="wsh-or"/>
  <path d="${wipOutline(w, h, fi, face)}" class="wsh-face"/>
  <path d="${wipOutline(w, h, fi + 1.2, face)}" class="wsh-lip"/>
  <rect x="${(WSH.px + w * o.b0).toFixed(1)}" y="${(WSH.bt + fi + 1.5).toFixed(1)}" width="${(w * (o.b1 - o.b0)).toFixed(1)}" height="1" class="wsh-sheen"/>`;
}
function wipDraw(root, v){
 const d = Math.max(0, Math.min(100, v)), f = root.querySelector('.wgfill'), g = root.querySelector('.wgglow'), n = root.querySelector('.wgneedle');
 const da = d.toFixed(3) + ' 100';
 if (f) f.setAttribute('stroke-dasharray', da); if (g) g.setAttribute('stroke-dasharray', da);
 if (n) n.setAttribute('transform', `rotate(${(WIP_A0 + d * WIP_SW / 100).toFixed(3)} ${WIP_CX} ${WIP_CY})`);
 WIP.v = d;
}
function wipTo(root, to, ms, delay){
 cancelAnimationFrame(WIP.raf);
 const from = WIP.v == null ? 0 : WIP.v;
 if (wipCalm() || !ms || Math.abs(to - from) < 0.01) { wipDraw(root, to); root.classList.remove('moving'); return; }
 const t0 = performance.now() + (delay || 0), span = Math.min(1, 0.45 + Math.abs(to - from) / 100);  /* a short hop is quicker than a full sweep */
 const dur = ms * span; root.classList.add('moving');
 const step = now => { if (!root.isConnected) return;
  const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = k < 1 ? 1 - Math.pow(1 - k, 3.2) : 1;
  wipDraw(root, from + (to - from) * e);
  if (k < 1) WIP.raf = requestAnimationFrame(step); else root.classList.remove('moving'); };
 WIP.raf = requestAnimationFrame(step);
}
function wipWire(pane){
 const root = pane.querySelector('section.wip'); if (!root || !WIP.model) return;
 const m = WIP.model, k0 = root.dataset.mode, entry = root.classList.contains('enter');
 wipShell(root);
 if (WIP.ro) WIP.ro.disconnect();
 if (typeof ResizeObserver === 'function') { WIP.ro = new ResizeObserver(() => wipShell(root)); WIP.ro.observe(root); }
 GI_SEEN.set('wwa', m.mode[k0].v);
 wipTo(root, m.mode[k0].v, entry ? 780 : 620, entry ? 170 : 0);
 const tog = root.querySelector('.wtog'), say = root.querySelector('#wgsay');
 root.querySelectorAll('[data-wscope]').forEach(b => b.onclick = e => {
  e.preventDefault(); e.stopPropagation();
  const k = b.dataset.wscope; if (root.dataset.mode === k) return;
  root.dataset.mode = k; tog.dataset.mode = k; state.gscope = k;
  tog.querySelectorAll('[data-wscope]').forEach(x => { const on = x.dataset.wscope === k; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  tog.classList.remove('sheen'); void tog.offsetWidth; tog.classList.add('sheen');
  const M = m.mode[k], tx = root.querySelector('.wgtx');
  clearTimeout(WIP.swapT);
  const fill = () => { const q = s => tx.querySelector(s), t = tx.querySelectorAll('.wgk');
   t[0].textContent = M.k1; t[1].textContent = M.k2; q('.wgpcn').textContent = M.pc;
   const u = q('.wgpcu'); if (u) u.style.display = M.has ? '' : 'none';
   q('.wgfr').innerHTML = wipFr(M); q('.wgdt').textContent = M.dt; tx.classList.toggle('none', !M.has);
   const ti = root.querySelector('svg title'); if (ti) ti.textContent = (k === 'all' ? 'Whole job' : 'Delivery against plan') + ': ' + M.pc + (M.has ? ' per cent' : '') + ', ' + M.fr + ', ' + M.dt;
   if (say) say.textContent = (k === 'all' ? 'Whole job' : 'Delivery against plan') + ': ' + M.pc + (M.has ? ' per cent' : '') + '. ' + M.fr + '. ' + M.dt + '.';
   tx.classList.remove('out'); };
  if (wipCalm()) fill(); else { tx.classList.add('out'); WIP.swapT = setTimeout(fill, 130); }
  GI_SEEN.set('wwa', M.v);
  wipTo(root, M.v, 600, 0);
 });
 root.querySelectorAll('[data-wdr]').forEach(b => b.onclick = e => {
  e.preventDefault(); const key = b.dataset.wdr, was = WIP.open === key; WIP.open = was ? null : key;
  root.querySelectorAll('[data-wdr]').forEach(x => x.setAttribute('aria-expanded', WIP.open === x.dataset.wdr));
  root.querySelectorAll('.wdr').forEach(d => d.classList.toggle('open', d.id === 'wdr-' + WIP.open));
  if (WIP.open) { const d = root.querySelector('#wdr-' + WIP.open); if (d) setTimeout(() => { const r = d.getBoundingClientRect(); if (r.bottom > innerHeight) d.scrollIntoView({behavior: wipCalm() ? 'auto' : 'smooth', block: 'nearest'}); }, 240); }
 });
 root.querySelectorAll('[data-wgo]').forEach(b => b.onclick = e => { e.preventDefault(); const g = b.dataset.wgo;
  if (g === 'detail') { const d = pane.querySelector('details.pdetail'); if (d) { d.open = true; d.scrollIntoView({behavior: wipCalm() ? 'auto' : 'smooth', block: 'start'}); } return; }
  go(g); });
 WIP.at = (typeof SYNC !== 'undefined' && SYNC.at) || WIP.at;
}
/* the bottom edge follows the shared record: its words each time the footer changes, and one brief brightening of the lamp when the service confirms again */
if (typeof syncFooter === 'function') { const syncFooter0 = syncFooter;
 syncFooter = function(){ const r = syncFooter0.apply(this, arguments);
  try { const el = document.getElementById('wipStat'); if (el) { const st = recordState(syncWaiting()); el.textContent = st.word + ' · ' + st.sub;
   const led = el.previousElementSibling; if (led) { led.className = 'wled ' + st.k;
    if (SYNC.at && SYNC.at !== WIP.at) { WIP.at = SYNC.at; if (!wipCalm()) { led.classList.remove('ping'); void led.offsetWidth; led.classList.add('ping'); } } } } } catch (e) {}
  return r; }; }
