#!/usr/bin/env python3
"""v7.03 - THE P&L'S OWN WORDS (DRAFT).

The project manager, 27 Sep 2026: the money words on the page should be the words Coates' own P&L uses (IS P&L, Jul 2026,
summary and detailed account list), and only where the page's data genuinely supports them. Never a figure or a
category there is no data for.

Decided the same day:
 - Advanced Temporary Fencing is two P&L lines: their fencing gear is Rehire (2126 Re Hire Contract Costs); their
   crew's labour is Installation - External Contractors (2142).
 - Toilets hired in from another company are Rehire cost (2126) - never COGS, never cross-hire.
 - The headline is "Revenue · Direct costs - known so far · Difference so far". Never "Gross Margin": R&M, our own
   transport and the staff costs are not captured. The honest "not a margin yet" wording stays.
 - Purchase orders stay "Purchase orders" (they are not on the P&L).

What changes - words only, plus one split the record already knows:
 - "We charge the V8s" is Revenue; "Coates pays" is Direct costs (known so far); the difference stays the difference.
 - The dockets price every column at Advanced's own sheet, so what Coates pays Advanced splits by column: the fence,
   gate and barrier columns are Rehire (their gear), the Labour and team-leader columns are Installation - external
   contractors, and the green book (their crew's hours at their Labour rate) is Installation - external contractors
   too. The two parts add back to the dockets' paid figure to the cent; if a column were ever neither, the split is
   not claimed and the figure is labelled as both together.
 - Revenue is split only where the contract line says what it is: a SUB- line is Rehire Revenue, a delivery or pickup
   line is Transport Revenue. The rest of the contracts, the fencing (hire and installation in one card rate) and the
   event labour scope stay "Revenue".
 - Rehire Recovery % is NOT added: no stream holds rehire revenue and rehire cost for the same items (see report).
No total, no stream, no category and no rounding changes.

Build on v7.00.   python3 patch_v703.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import re  # noqa: E402
from patch_v669 import rep  # noqa: E402


def rep_keep(text, old, new, what, path, need=True):
    """rep(), with the whitespace its first-line pattern swallows in front of the match put back, so an anchor
    that starts mid-sentence keeps the space before it."""
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    lead = ms[0].group(0)[:len(ms[0].group(0)) - len(ms[0].group(0).lstrip(' \t'))] if len(ms) == 1 else ''
    return rep(text, old, lead + new, what, path, need)

JS = r"""/* v7.03 - THE P&L'S OWN WORDS (see patch_v703.py). Advanced Temporary Fencing is two lines on Coates' P&L: their
 fencing gear is Rehire (2126 Re Hire Contract Costs) and their crew's labour is Installation - External Contractors
 (2142). The dockets already price each column at their own sheet, so the paid figure splits by column, and the green
 book is their crew's hours. Nothing here changes a total: the two parts add back to the dockets' paid figure to the
 cent, and a column that is neither gear nor labour means the split is not claimed. */
const FENCE_GEAR_COLS = ['clean', 'scrim', 'v_gates', 'ped_gates', 'ccb_event', 'ccb_demarc'];
const FENCE_LABOUR_COLS = ['labour', 'team_leader', 'relocation', 'removal'];
const PL_REHIRE = 'P&L: 2126 Re Hire Contract Costs', PL_INSTALL = 'P&L: 2142 Installation – External Contractors';
const PL_CARTAGE = 'P&L: Cartage – 2120 Recoverable or 2140 Not Recovered (the record does not say which)';
function fencePaidSplit(){
 const mk = 'fencePaidSplit'; if (RENDER_MEMO.has(mk)) return RENDER_MEMO.get(mk);
 const r2 = n => Math.round(n * 100) / 100;
 let gear = 0, lab = 0, other = 0; const otherCols = new Set(), labCols = new Map();
 allDockets().filter(d => d.usable).forEach(d => (d.lines || []).forEach(l => { if (l.paid == null) return;
  if (FENCE_GEAR_COLS.includes(l.column)) gear += l.paid;
  else if (FENCE_LABOUR_COLS.includes(l.column)) { lab += l.paid; const x = labCols.get(l.name) || {qty: 0, unit: l.unit}; x.qty += l.qty || 0; labCols.set(l.name, x); }
  else { other += l.paid; otherCols.add(l.name); } }));
 const fd = fenceDerived(), G = greenBookTotals();
 gear = r2(gear); lab = r2(lab); other = r2(other);
 const greenPriced = !!(G.notes && G.rate != null), green = greenPriced ? G.amount : 0;
 const v = {clean: !other && r2(gear + lab) === fd.cost, paid: fd.cost, gear, docket_labour: lab,
  docket_labour_words: [...labCols].map(([n, x]) => `${hoursTxt(x.qty)}${x.unit === 'hr' ? ' h' : ''} ${n}`).join(', '),
  green, green_priced: greenPriced, green_notes: G.notes, green_hours: G.hours, green_rate: G.rate,
  installation: r2(lab + green), other, other_cols: [...otherCols]};
 RENDER_MEMO.set(mk, v); return v;
}
/* the Fencing tab's card: what Coates pays Advanced, under the two P&L lines it is */
function fencePlCard(){
 const SP = fencePaidSplit(); if (!SP.paid && !SP.green) return '';
 const m = v => esc(money(v)), rt = SP.green_rate != null ? money(SP.green_rate) : null;
 const inst = [SP.docket_labour ? `${esc(SP.docket_labour_words)} on the dockets, ${m(SP.docket_labour)}` : '',
  SP.green_notes ? `${esc(hoursTxt(SP.green_hours))} h on ${SP.green_notes} green-book note${SP.green_notes === 1 ? '' : 's'}${SP.green_priced ? ` × ${esc(rt)} = ${m(SP.green)}` : ' — no Labour rate yet, so not in dollars'}` : ''].filter(Boolean).join(' + ');
 const rows = SP.clean
  ? `<div class="ln"><span class="lb" title="${esc(PL_REHIRE)}">Rehire — their fencing gear<small>their own sheet's rate on the dockets' fence, gates and barrier · ${esc(PL_REHIRE)}</small></span><span class="amt">${m(SP.gear)}</span></div>
 <div class="ln"><span class="lb" title="${esc(PL_INSTALL)}">Installation — external contractors<small>their crew: ${inst || 'nothing recorded yet'} · ${esc(PL_INSTALL)}</small></span><span class="amt">${m(SP.installation)}</span></div>`
  : `<div class="ln"><span class="lb" title="${esc(PL_REHIRE)} · ${esc(PL_INSTALL)}">Paid to Advanced on the dockets · Rehire + Installation (external contractors)<small>not split: ${esc(SP.other_cols.join(', ') || 'a column')} is neither gear nor labour on the record</small></span><span class="amt">${m(SP.paid)}</span></div>
 ${SP.green_notes ? `<div class="ln"><span class="lb" title="${esc(PL_INSTALL)}">Installation — external contractors · the green book<small>${esc(hoursTxt(SP.green_hours))} h on ${SP.green_notes} note${SP.green_notes === 1 ? '' : 's'}${SP.green_priced ? ` × ${esc(rt)}` : ' — no Labour rate yet'} · ${esc(PL_INSTALL)}</small></span><span class="amt">${SP.green_priced ? m(SP.green) : '<span class="todo">no rate</span>'}</span></div>` : ''}`;
 return `<div class="card" id="fencePl"><h3>Paid to ${esc((DATA.fence_contractor || {}).name || 'the fencing contractor')}, by P&amp;L line <span class="chip">direct costs · known so far</span></h3>
 <div class="ledger"><div class="side">${rows}
 <div class="ln total"><span class="lb">Paid to Advanced — known so far</span><span class="amt">${m(Math.round((SP.paid + SP.green) * 100) / 100)}</span></div></div></div>
 <p class="hint" style="margin:8px 0 0">Revenue is not split the same way: the 2026 card charges fence hire and its installation in one rate a metre (the card writes fencing labour as Included), so the fencing revenue stays one figure. The purchase orders below are the orders to Advanced; they are not a P&amp;L line and nothing is added from them.</p></div>`;
}
"""

CSS = """
/* v7.03 - the Fencing tab's P&L card: one column of ledger rows */
#fencePl .ledger{grid-template-columns:minmax(0,1fr)}
#fencePl h3 .chip{font-weight:600}
.frs .pltag{display:block;font-size:10.5px;color:var(--mute);margin-top:2px;white-space:normal}
"""

# visible labels: (old, new, what) - each old must occur exactly once
EDITS = [
 # ---------------- Today: the Costs & charges card
 ("<div class=\"hubbig\"><b>${esc(money0(M.charge.total))}</b> we charge the V8s, ex GST</div>",
  "<div class=\"hubbig\"><b>${esc(money0(M.charge.total))}</b> revenue — charged to the V8s, ex GST</div>", 'today revenue'),
 ("<li><span class=\"w\">Coates pays — known so far</span><span class=\"tm\">${esc(money0(M.cost.known))}</span></li>",
  "<li><span class=\"w\">Direct costs — known so far</span><span class=\"tm\">${esc(money0(M.cost.known))}</span></li>", 'today costs'),
 ("<span style=\"color:var(--mute)\">· Coates pays ${esc(money0(s.cost0))}</span>",
  "<span style=\"color:var(--mute)\">· direct costs ${esc(money0(s.cost0))}</span>", 'today stream'),

 # ---------------- Fencing tab: green book, purchase orders, KPIs, notice, rates table, docket tables
 ("<b>What Coates pays Advanced</b> — ${esc(hoursTxt(T.hours))} h at their Labour rate",
  "<b title=\"${esc(PL_INSTALL)}\">Installation — external contractors</b>, what Coates pays Advanced for their crew — ${esc(hoursTxt(T.hours))} h at their Labour rate", 'green book words'),
 ("<th class=\"num\">Cost to Coates</th><th>Recorded by</th>",
  "<th class=\"num\" title=\"${esc(PL_INSTALL)}\">Direct cost</th><th>Recorded by</th>", 'green book column'),
 ("(labour, what we pay Advanced) and the blue book",
  "(labour — Installation, external contractors) and the blue book", 'books sub'),
 ("${esc(money0(wk.cost) || '—')} derived</span>` : '—'}</td>",
  "${esc(money0(wk.cost) || '—')} revenue</span>` : '—'}</td>", 'po week revenue'),
 ("The order's own value and invoice number, typed here, are what Coates pays ${esc(sup.name || 'the fencing contractor')} (a fencing purchase order is what Coates pays Advanced); they stay on the order and are not on the Costs tab, where every figure is a charge.</p>",
  "The order's own value and invoice number, typed here, are what Coates pays ${esc(sup.name || 'the fencing contractor')} on that order — their gear (Rehire) and their crew (Installation — external contractors) together. A purchase order is not a P&amp;L line: it stays on the order and nothing is added from it on the Costs &amp; charges tab, which counts Advanced from their own sheet on the dockets and the green book.</p>", 'po note'),
 ("${kpi(money(cost) || '$0.00', 'charged at the 2026 card', false)}",
  "${kpi(money(cost) || '$0.00', 'revenue at the 2026 card', false)}", 'fence kpi revenue'),
 ("${kpi(money(fdAll.cost) || '$0.00', 'paid to the crew, their own sheet', false)}",
  "${kpi(money(fdAll.cost) || '$0.00', 'paid to Advanced on the dockets · Rehire + Installation (external contractors)', false)}", 'fence kpi paid'),
 ("The money on a docket is quantity × the card's 2026 rate, nothing more —",
  "The revenue on a docket is quantity × the card's 2026 rate, nothing more —", 'fence notice revenue'),
 ("bill Coates on their own sheet, never added to the charge.",
  "bill Coates on their own sheet — a direct cost, never added to the revenue; the card above splits it by P&amp;L line.", 'fence notice paid'),
 ("<h3>Rates — what we charge, what we pay</h3>",
  "<h3>Rates — revenue and direct cost</h3>", 'rates heading'),
 ("return `<b>Charged</b> at the <b>2026",
  "return `<b>Revenue</b> is charged at the <b>2026", 'rates sub revenue'),
 ("<b>Paid</b> is what ${esc((DATA.fence_contractor || {}).name || 'the fencing crew')} bill Coates, off",
  "<b>Direct cost</b> is what ${esc((DATA.fence_contractor || {}).name || 'the fencing crew')} bill Coates — Rehire for the fence, gate and barrier lines, Installation — external contractors for Labour and team leader — off", 'rates sub cost'),
 ("The two are never added together and a margin is only worked out where both are known.",
  "The two are never added together and a difference is only worked out where both are known.", 'rates sub difference'),
 ("<th class=\"num\">Charged</th><th class=\"num\">Paid</th><th class=\"num\">Margin</th>",
  "<th class=\"num\">Revenue</th><th class=\"num\">Direct cost</th><th class=\"num\" title=\"revenue less direct cost, per unit — not a margin\">Difference</th>", 'rates columns'),
 (": '<span class=\"norate\">not costed</span>'}",
  ": '<span class=\"norate\">not costed</span>'}${FENCE_GEAR_COLS.includes(c.key) ? `<span class=\"pltag\" title=\"${esc(PL_REHIRE)}\">Rehire</span>` : FENCE_LABOUR_COLS.includes(c.key) ? `<span class=\"pltag\" title=\"${esc(PL_INSTALL)}\">Installation — external contractors</span>` : ''}", 'rates pl tag'),
 ("  <div class=\"notice warn\"><b>What the money means</b>",
  "  ${fencePlCard()}\n  <div class=\"notice warn\"><b>What the money means</b>", 'fence pl card'),

 # ---------------- The Coates Way (presented to the CMG): Financials
 ("rows: [['Fencing charged, 2026 card',", "rows: [['Fencing revenue, 2026 card',", 'cw fencing'),
 ("${M.missing.length} cost or charge item${", "${M.missing.length} cost or revenue item${", 'cw commercial'),

 # ---------------- the money model's own words (streams, what is missing, the categories)
 ("{key: 'fencing', name: 'Fencing', who: 'Advanced Temporary Fencing — charged at the 2026 card, paid at their own sheet'},",
  "{key: 'fencing', name: 'Fencing', who: 'Advanced Temporary Fencing — revenue at the 2026 card, hire and installation in one rate · direct costs at their own sheet: Rehire (their gear) and Installation — external contractors (their crew)'},", 'stream fencing'),
 ("{key: 'toilets', name: 'Toilets and servicing', who: 'Event Portables rehire — charged at our rates, paid to Event Portables'},",
  "{key: 'toilets', name: 'Toilets and servicing', who: 'Event Portables rehire — revenue at our rates · Rehire cost, paid to Event Portables'},", 'stream toilets'),
 ("{key: 'transport', name: 'Delivery and transport', who: 'charged on the contracts; paid to the carriers'},",
  "{key: 'transport', name: 'Delivery and transport', who: 'Transport Revenue: the delivery and pickup lines on the contracts · Transport (cartage): paid to the carriers'},", 'stream transport'),
 ("who: 'charged: the Coates Event Labour Scope · paid: the tracker — nights, meals, expenses; wages in hours'},",
  "who: 'revenue: the Coates Event Labour Scope · costs: the tracker — nights, meals, expenses (their P&L line is not confirmed); wages in hours'},", 'stream crew'),
 ("if (s.subhired) s.notes.push(`${pl(s.subhired, 'subhired line')} — what Coates pays for ${s.subhired === 1 ? 'it' : 'them'} is not on the record`); });",
  "if (s.subhired) s.notes.push(`${pl(s.subhired, 'subhired line')} — ${s.subhired === 1 ? 'its' : 'their'} rehire cost is not on the record`); });", 'stream subhire'),
 ("const f = S.get('fencing'); f.notes.unshift(`${pl(X.fd.dockets, 'docket')}${X.cost.fencing_labour ? ` · green-book labour ${hoursTxt(X.cost.fencing_labour.hours)} h` : ''}`);",
  "const f = S.get('fencing'); const SP = fencePaidSplit();   /* v7.03 - Advanced by P&L line */\n"
  " f.notes.unshift(`${pl(X.fd.dockets, 'docket')}${SP.clean ? ` · Rehire ${money0(SP.gear)} (their gear) · Installation — external contractors ${money0(SP.installation)} (their crew)` : X.fd.cost ? ` · paid to Advanced ${money0(X.fd.cost)}, Rehire and Installation together — not split` : ''}${X.cost.fencing_labour ? ` · green-book labour ${hoursTxt(X.cost.fencing_labour.hours)} h` : ''}`);", 'stream fencing note'),
 ("if (!X.rqApproved && X.rq != null) tl.notes.unshift(`Event Portables quoted ${money0(X.rq)} — unsigned, so not counted`);",
  "if (!X.rqApproved && X.rq != null) tl.notes.unshift(`Rehire cost: Event Portables quoted ${money0(X.rq)} — unsigned, so not counted`);", 'stream toilets quoted'),
 ("if (X.rqApproved) tl.notes.unshift(`Event Portables ${money0(X.rq)}, approved — the final total may change`);",
  "if (X.rqApproved) tl.notes.unshift(`Rehire cost: Event Portables ${money0(X.rq)}, approved — the final total may change`);", 'stream toilets approved'),
 ("tr.notes.push(X.schedT.counted || X.OT.lines ? `cost: the schedule's TPORT COST figures",
  "tr.notes.push(X.schedT.counted || X.OT.lines ? `Transport (cartage): the schedule's TPORT COST figures", 'stream transport cost'),
 (": 'cost: no transport figure yet');", ": 'Transport (cartage): no figure yet');", 'stream transport none'),
 ("if (X.charge.card_transport) tr.notes.push(`charged: the delivery lines on the contracts;",
  "if (X.charge.card_transport) tr.notes.push(`Transport Revenue: the delivery and pickup lines on the contracts;", 'stream transport revenue'),
 ("if (X.charge.race.scope) cr.notes.push(`charged: the event labour scope —",
  "if (X.charge.race.scope) cr.notes.push(`revenue: the event labour scope —", 'stream crew revenue'),
 ("if (SF) miss('what Coates pays for the people on the event labour scope who are not on the tracker",
  "if (SF) miss('the cost of the people on the event labour scope who are not on the tracker", 'missing event staff'),
 ("if (C.subhire.lines) miss(`what Coates pays for the ${C.subhire.lines} subhired line${C.subhire.lines === 1 ? '' : 's'} on the contracts — not on the record`, 'subhire buys not on the record');",
  "if (C.subhire.lines) miss(`the rehire cost of the ${C.subhire.lines} subhired line${C.subhire.lines === 1 ? '' : 's'} on the contracts — not on the record`, 'subhire rehire cost not on the record');", 'missing subhire'),
 ("if (X.rqApproved) put('rehire', X.rq, `Event Portables, four quotes approved —",
  "if (X.rqApproved) put('rehire', X.rq, `Event Portables toilets, rehire cost (${PL_REHIRE}), four quotes approved —", 'cat rehire'),
 ("put('rehire', null, `${X.C.subhire.lines} subhired contract line${X.C.subhire.lines === 1 ? '' : 's'} — what Coates pays for them is not on the record`);",
  "put('rehire', null, `${X.C.subhire.lines} subhired contract line${X.C.subhire.lines === 1 ? '' : 's'} — their rehire cost is not on the record`);", 'cat subhire'),
 ("if (X.fd.cost) put('fencing', X.fd.cost, `Advanced, paid at their own sheet — ${money(X.fd.cost)}`);",
  "const SP = fencePaidSplit();   /* v7.03 - the same figure, said by P&L line where the dockets split it */\n"
  " if (X.fd.cost) put('fencing', X.fd.cost, `Advanced's dockets, at their own sheet — ${money(X.fd.cost)}: ${SP.clean ? `Rehire (their gear) ${money(SP.gear)}${SP.docket_labour ? ` + Installation — external contractors (${SP.docket_labour_words}) ${money(SP.docket_labour)}` : ''}` : 'Rehire and Installation — external contractors together, not split'}`);", 'cat fencing'),
 ("put('fencing', X.cost.fencing_labour.amount, `the green book, Advanced's labour and truck hours —",
  "put('fencing', X.cost.fencing_labour.amount, `Installation — external contractors: the green book, Advanced's labour and truck hours —", 'cat green book'),
 ("if (X.OT.lines || X.schedT.counted) put('other', tr, `transport Coates pays — ${money(tr)}:",
  "if (X.OT.lines || X.schedT.counted) put('other', tr, `Transport (cartage) — ${money(tr)}:", 'cat transport'),
 ("else put('other', null, 'transport Coates pays — no figure yet');",
  "else put('other', null, 'Transport (cartage) — no figure yet');", 'cat transport none'),

 # ---------------- Costs & charges: the categories card
 ("<div class=\"paytot\"><span>Coates pays — known, across the eight</span>",
  "<div class=\"paytot\"><span>Direct costs — known so far, across the eight</span>", 'cat total'),
 ("<span class=\"w\">${hrs ? `and ${esc(fmtNum(hrs))} h of wages on the tracker with no rate, so not in dollars` : ''}</span></div>",
  "<span class=\"w\">${hrs ? `and ${esc(fmtNum(hrs))} h of wages on the tracker with no rate, so not in dollars` : ''}</span></div>\n"
  " <p class=\"hint\" style=\"margin:8px 0 0\">The eight are management's own categories, as written — not the lines of Coates' P&amp;L. On the P&amp;L, Advanced's gear is Rehire (2126) and their crew's labour is Installation — external contractors (2142), both under temporary fencing here; the Event Portables toilets are Rehire (2126); the transport is Cartage, under other event-related expenses here.</p>", 'cat note'),

 # ---------------- Costs & charges: the summary card (the three figures, the streams, the ledger)
 ("<p class=\"hint moneydef\">A <b>charge</b> is what Coates bills the V8s — everything on hire is a charge. A <b>cost</b> is what Coates pays. The two are never added together.</p>",
  "<p class=\"hint moneydef\"><b>Revenue</b> is what Coates charges the V8s — everything on hire is revenue. A <b>direct cost</b> is what Coates pays for the job, named by its Coates P&amp;L line where the record shows which line it is. The two are never added together.</p>", 'moneydef'),
 ("<div class=\"kpi\"><div class=\"v\">${m0(c.total)}</div><div class=\"l\">We charge the V8s</div></div>",
  "<div class=\"kpi\"><div class=\"v\">${m0(c.total)}</div><div class=\"l\">Revenue</div></div>", 'kpi revenue'),
 ("<div class=\"kpi\"><div class=\"v\">${m0(k.known)}</div><div class=\"l\">Coates pays — known so far</div></div>",
  "<div class=\"kpi\"><div class=\"v\">${m0(k.known)}</div><div class=\"l\">Direct costs — known so far</div></div>", 'kpi costs'),
 ("<th>Stream</th><th class=\"num\">We charge</th><th class=\"num\">Coates pays</th><th class=\"num\">Difference</th>",
  "<th>Stream</th><th class=\"num\">Revenue</th><th class=\"num\">Direct costs</th><th class=\"num\">Difference</th>", 'stream headers'),
 ("<td class=\"num\" data-l=\"We charge\">${s.charge_known ? m0(s.charge0)",
  "<td class=\"num\" data-l=\"Revenue\">${s.charge_known ? m0(s.charge0)", 'stream cell revenue'),
 ("<td class=\"num\" data-l=\"Coates pays\">${s.cost_known ? m0(s.cost0)",
  "<td class=\"num\" data-l=\"Direct costs\">${s.cost_known ? m0(s.cost0)", 'stream cell costs'),
 ("title=\"no cost is set against this stream yet — its wages and transport are counted in their own streams\">",
  "title=\"no direct cost is set against this stream yet — its wages and transport are counted in their own streams\">", 'stream cell title'),
 ("<small>before costs</small></span>`}</td>", "<small>before direct costs</small></span>`}</td>", 'stream before costs'),
 ("<tr class=\"total\"><td><b>Total</b></td><td class=\"num\" data-l=\"We charge\"><b>${m0(c.total)}</b></td><td class=\"num\" data-l=\"Coates pays\"><b>${m0(k.known)}</b></td>",
  "<tr class=\"total\"><td><b>Total</b></td><td class=\"num\" data-l=\"Revenue\"><b>${m0(c.total)}</b></td><td class=\"num\" data-l=\"Direct costs\"><b>${m0(k.known)}</b></td>", 'stream total'),
 ("Dollars rounded so every column adds to its total and every row across; what Coates pays under the eight categories, below, is to the cent.",
  "Dollars rounded so every column adds to its total and every row across; the direct costs under the eight categories, below, are to the cent.", 'roundnote'),
 ("<b>${esc(money0(c.total))} charged against ${esc(money0(k.known))} of known cost — difference so far ${sd(M.difference0)}.</b>",
  "<b>${esc(money0(c.total))} revenue against ${esc(money0(k.known))} of direct costs known so far — difference so far ${sd(M.difference0)}.</b>", 'verdict'),
 ("<div class=\"side\"><h4>We charge the V8s <small>Coates → the V8s</small></h4>",
  "<div class=\"side\"><h4>Revenue <small>charged to the V8s</small></h4>", 'ledger left head'),
 ("${ln('On the contracts, by the rate', m0(c.contracts), `${c.contracts_lines} of ${c.contracts_all} lines${c.contracts_unknown ? ` · ${c.contracts_unknown} no rate` : ''}${c.contracts_differs ? ` · ${c.contracts_differs} to settle` : ''}`)}",
  "${ln('On the contracts, by the rate', m0(c.contracts), `${c.contracts_lines} of ${c.contracts_all} lines${c.contracts_unknown ? ` · ${c.contracts_unknown} no rate` : ''}${c.contracts_differs ? ` · ${c.contracts_differs} to settle` : ''}${c.subhire ? ` · of which Rehire Revenue ${esc(money0(c.subhire))} (the SUB lines)` : ''}${c.delivery ? ` · Transport Revenue ${esc(money0(c.delivery))} (delivery and pickup lines)` : ''}${c.subhire || c.delivery ? ' · the rest is hire, not split between Hire and Rehire Revenue on the record' : ''}`)}", 'ledger contracts'),
 ("${ln('Fencing — dockets at the 2026 card', c.fencing ? m0(c.fencing) : '<span class=\"todo\">—</span>', pl(c.fencing_dockets, 'docket'))}",
  "${ln('Fencing — dockets at the 2026 card', c.fencing ? m0(c.fencing) : '<span class=\"todo\">—</span>', pl(c.fencing_dockets, 'docket') + ' · hire and installation in one card rate, not split')}", 'ledger fencing revenue'),
 ("${ln('We charge the V8s', m0(c.total), '', 'total')}", "${ln('Revenue', m0(c.total), '', 'total')}", 'ledger left total'),
 ("<div class=\"side\"><h4>Coates pays <small>our own costs — kept apart</small></h4>",
  "<div class=\"side\"><h4>Direct costs — known so far <small>what Coates pays · kept apart</small></h4>", 'ledger right head'),
 ("${ln('Transport', k.transport.schedule.counted || k.transport.ours_lines ? m0(k.transport.amount)",
  "${ln(`<span title=\"${esc(PL_CARTAGE)}\">Transport (cartage)</span>`, k.transport.schedule.counted || k.transport.ours_lines ? m0(k.transport.amount)", 'ledger transport'),
 ("${ln('Misc and other expenses', k.misc ? m0(k.misc.amount) : '<span class=\"todo\">—</span>', k.misc ? `${pl(k.misc.lines, 'line')}${k.misc.awaiting ? ` · ${k.misc.awaiting} awaiting` : ''}` : '')}",
  "${ln('Misc and other expenses', k.misc ? m0(k.misc.amount) : '<span class=\"todo\">—</span>', k.misc ? `${pl(k.misc.lines, 'line')}${k.misc.awaiting ? ` · ${k.misc.awaiting} awaiting` : ''}` : '')}\n"
  " ${k.accommodation || k.meals || k.misc ? '<p class=\"hint\" style=\"margin:2px 0 4px;font-size:11px;color:var(--mute)\">Accommodation, meals and other expenses are in the known figure; which Coates P&amp;L line carries them is not confirmed.</p>' : ''}", 'ledger crew note'),
 ("${ln('Fencing — paid to the contractor', k.fencing_paid ? m0(k.fencing_paid) : '<span class=\"todo\">—</span>', \"the crew's own sheet\")}\n"
  " ${k.fencing_labour ? ln('Fencing labour — the green book', k.fencing_labour.rate != null ? m0(k.fencing_labour.amount) : '<span class=\"todo\">no rate</span>', `${esc(hoursTxt(k.fencing_labour.hours))} h on ${pl(k.fencing_labour.notes, 'service note')}${k.fencing_labour.rate != null ? ` × ${esc(money(k.fencing_labour.rate))}` : ''} · what we pay Advanced`) : ''}",
  "${(() => { const SP = fencePaidSplit(); const gb = k.fencing_labour ? `${esc(hoursTxt(k.fencing_labour.hours))} h on ${pl(k.fencing_labour.notes, 'service note')}${k.fencing_labour.rate != null ? ` × ${esc(money(k.fencing_labour.rate))}` : ' — no Labour rate yet'}` : '';   /* v7.03 - Advanced by P&L line */\n"
  " if (SP.clean) return ln(`<span title=\"${esc(PL_REHIRE)}\">Rehire — Advanced's fencing gear</span>`, k.fencing_paid ? m0(SP.gear) : '<span class=\"todo\">—</span>', `their own sheet's rate on the dockets' fence, gates and barrier · ${esc(PL_REHIRE)}`)\n"
  " + ln(`<span title=\"${esc(PL_INSTALL)}\">Installation — external contractors</span>`, SP.docket_labour || (k.fencing_labour && k.fencing_labour.rate != null) ? m0(SP.installation) : '<span class=\"todo\">—</span>', `Advanced's crew: ${[SP.docket_labour ? `${esc(SP.docket_labour_words)} on the dockets ${esc(money(SP.docket_labour))}` : '', gb ? `the green book, ${gb}${k.fencing_labour.rate != null ? ` = ${esc(money(k.fencing_labour.amount))}` : ''}` : ''].filter(Boolean).join(' + ') || 'nothing recorded yet'} · ${esc(PL_INSTALL)}`);\n"
  " return ln(`<span title=\"${esc(PL_REHIRE)} · ${esc(PL_INSTALL)}\">Paid to Advanced · Rehire + Installation (external contractors)</span>`, k.fencing_paid ? m0(k.fencing_paid) : '<span class=\"todo\">—</span>', \"the dockets at their own sheet — gear and labour together, not split\")\n"
  " + (k.fencing_labour ? ln(`<span title=\"${esc(PL_INSTALL)}\">Installation — external contractors · the green book</span>`, k.fencing_labour.rate != null ? m0(k.fencing_labour.amount) : '<span class=\"todo\">no rate</span>', gb) : ''); })()}", 'ledger fencing split'),
 ("${k.rehire_approved ? ln('Rehire toilets — approved', m0(k.rehire), `${esc(DATA.rehire_quotes.supplier.name)} · <b>provisional, the final total may change</b>`) : ''}",
  "${k.rehire_approved ? ln(`<span title=\"${esc(PL_REHIRE)}\">Rehire cost — toilets, approved</span>`, m0(k.rehire), `${esc(DATA.rehire_quotes.supplier.name)} · ${esc(PL_REHIRE)} · <b>provisional, the final total may change</b>`) : ''}", 'ledger rehire'),
 ("${ln('Coates pays — known', m0(k.known), '', 'total')}", "${ln('Direct costs — known so far', m0(k.known), '', 'total')}", 'ledger right total'),
 ("${k.rehire_quoted != null && !k.rehire_approved ? ln('Rehire toilets — quoted, unsigned',",
  "${k.rehire_quoted != null && !k.rehire_approved ? ln('Rehire cost — toilets, quoted, unsigned',", 'ledger rehire quoted'),
 ("${k.subhire_lines ? ln('Subhire buys', '<span class=\"todo\">not on the record</span>',",
  "${k.subhire_lines ? ln('Rehire cost — subhired contract lines', '<span class=\"todo\">not on the record</span>',", 'ledger subhire'),
 ("${c.subhire ? ` · including subhired ${esc(money0(c.subhire))}` : ''}${c.delivery ? ` · delivery ${esc(money0(c.delivery))}` : ''}.",
  "${c.subhire ? ` · including subhired ${esc(money0(c.subhire))} (Rehire Revenue)` : ''}${c.delivery ? ` · delivery ${esc(money0(c.delivery))} (Transport Revenue)` : ''}.", 'hint by branch'),
 ("— what Coates pays for those loads, so it is counted${",
  "— what Coates pays the carriers for those loads, Transport (cartage), so it is counted${", 'hint transport'),
 ("<p class=\"hint\">The cost side is the labour, accommodation, meals and expense tracker",
  "<p class=\"hint\">The direct-cost side is the labour, accommodation, meals and expense tracker", 'hint cost side'),
 ("what fencing is paid at the crew's sheet${k.fencing_labour ?",
  "what Advanced are paid at their own sheet on the dockets (their gear Rehire, their Labour lines Installation — external contractors)${k.fencing_labour ?", 'hint fencing'),

 # ---------------- Costs & charges: the tab's header, section heads and footnote
 ("<div class=\"hubhead\"><div><h2>Costs &amp; charges — what we charge the V8s, and what Coates pays</h2>",
  "<div class=\"hubhead\"><div><h2>Costs &amp; charges — revenue and direct costs</h2>", 'costs h2'),
 ("· a charge is what Coates bills the V8s, everything on hire among it; a cost is what Coates pays · AUD ex GST",
  "· revenue is what Coates charges the V8s, everything on hire among it; a direct cost is what Coates pays for the job · AUD ex GST", 'costs sub'),
 ("<h3 class=\"sec\" style=\"margin-top:6px\">What Coates pays <span>by the eight categories",
  "<h3 class=\"sec\" style=\"margin-top:6px\">Direct costs — known so far <span>by the eight categories", 'costs sec costs'),
 ("<h3 class=\"sec\" style=\"margin-top:6px\">What we charge the V8s <span>by branch",
  "<h3 class=\"sec\" style=\"margin-top:6px\">Revenue — charged to the V8s <span>by branch", 'costs sec revenue'),
 ("Every line in that table is a charge — what Coates bills the V8s — and names its category",
  "Every line in that table is revenue — what Coates charges the V8s — and names its category", 'costs foot 1'),
 ("What Coates pays is above it, under the eight cost categories.",
  "The direct costs are above it, under the eight categories.", 'costs foot 2'),
 ("Print gives the money summary, what Coates pays by the eight categories, the branches",
  "Print gives the money summary, the direct costs by the eight categories, the branches", 'costs foot 3'),
 ("The event labour scope is the job's and on no branch. Our transport, at the right, is a cost to Coates — never a charge.",
  "The event labour scope is the job's and on no branch. Our transport, at the right, is a direct cost, Transport (cartage) — never revenue.", 'branch hint'),
 ("title=\"the contracts by the rate and the charge lines by kind, added — what this branch charges the V8s\">Charged<br>",
  "title=\"the contracts by the rate and the charge lines by kind, added — the revenue this branch charges the V8s\">Revenue<br>", 'branch col revenue'),
 ("title=\"what transport costs Coates on this branch — the lines people record under Transport — our costs; a cost, never a charge\">Our transport<br><span class=\"w\" style=\"font-weight:400;font-size:10.5px\">cost to us</span>",
  "title=\"what transport costs Coates on this branch — the lines people record under Transport — Transport (cartage), a direct cost, never revenue\">Our transport<br><span class=\"w\" style=\"font-weight:400;font-size:10.5px\">direct cost</span>", 'branch col transport'),
 ("<h3>Transport — our costs <span class=\"chip ref\">${X.list.length}</span> <span class=\"chip crit\" title=\"the other side of the ledger — what transport costs Coates, never what is charged\">cost to us · never a charge</span></h3>",
  "<h3>Transport (cartage) — our direct costs <span class=\"chip ref\">${X.list.length}</span> <span class=\"chip crit\" title=\"the other side of the ledger — what transport costs Coates, never revenue · ${esc(PL_CARTAGE)}\">direct cost · never revenue</span></h3>", 'our transport card'),

 # ---------------- the email summary (Costs & charges → Email the summary)
 ("'A charge is what Coates bills the V8s (all hire is a charge); a cost is what Coates pays. The two are never added together.', '',",
  "'Revenue is what Coates charges the V8s (all hire is revenue); a direct cost is what Coates pays. Never added together.', '',", 'email def'),
 ("`WE CHARGE THE V8s ${money0(M.charge.total)} · COATES PAYS (known) ${money0(M.cost.known)} · DIFFERENCE SO FAR ${sd(M.difference0)} — not a margin yet`,",
  "`REVENUE ${money0(M.charge.total)} · DIRECT COSTS (known so far) ${money0(M.cost.known)} · DIFFERENCE SO FAR ${sd(M.difference0)} — not a margin yet`,", 'email headline'),
 ("'BY STREAM (we charge · Coates pays · difference):'];", "'BY STREAM (revenue · direct costs · difference):'];", 'email streams'),
 ("if (s.key === 'crew' && M.cost.labour) bits.push('wages not in it — hours only');",
  "if (s.key === 'crew' && M.cost.labour) bits.push('wages not in it — hours only');\n"
  " if (s.key === 'fencing') { const SP = fencePaidSplit(); if (SP.clean && s.cost_known) bits.push(`Rehire ${money0(SP.gear)} + Installation, external contractors ${money0(SP.installation)}`); }   /* v7.03 */", 'email fencing split'),
 ("lines.push('', 'COATES PAYS BY CATEGORY (to the cent): ' +", "lines.push('', 'DIRECT COSTS BY CATEGORY (to the cent): ' +", 'email categories'),
 ("return mailto(`GC500 · are we making money — ${money0(M.charge.total)} charged, ${money0(M.cost.known)} known cost, as at ${fmtDate(M.as_at)}`,",
  "return mailto(`GC500 · are we making money — ${money0(M.charge.total)} revenue, ${money0(M.cost.known)} direct costs known so far, as at ${fmtDate(M.as_at)}`,", 'email subject'),

 # ---------------- Where we are
 ("return fig('We charge the V8s', `${MS.charge.total ? esc(money0(MS.charge.total)) : '—'}`,",
  "return fig('Revenue', `${MS.charge.total ? esc(money0(MS.charge.total)) : '—'}`,", 'progress fig'),
 ("the same figure as the Costs &amp; charges tab, where what Coates pays is set against it (${esc(money0(MS.cost.known))} known so far).",
  "the same figure as the Costs &amp; charges tab, where the direct costs known so far (${esc(money0(MS.cost.known))}) are set against it.", 'progress fig desc'),
 ("<div class=\"money\"><span>Dockets — charged at the 2026 card</span>",
  "<div class=\"money\"><span>Dockets — revenue at the 2026 card</span>", 'plate fencing revenue'),
 ("<div class=\"money\"><span>Dockets — paid to the crew, their own sheet</span>",
  "<div class=\"money\"><span title=\"${esc(PL_REHIRE)} · ${esc(PL_INSTALL)}\">Dockets — paid to Advanced · Rehire + Installation (external contractors)</span>", 'plate fencing paid'),
 ("${esc(money0(MS.charge.total))} is what we charge the V8s${recon === headline",
  "${esc(money0(MS.charge.total))} is the revenue charged to the V8s${recon === headline", 'plate all branches'),
 ("${sub.lines ? `<span title=\"already in the figure above — the subhired lines among them\">of which subhired <small>",
  "${sub.lines ? `<span title=\"already in the figure above — the subhired lines among them\">of which subhired — Rehire Revenue <small>", 'plate subhire'),
 ("${tr.lines ? `<span title=\"already in the figure above — the transport and delivery charge lines among them\">of which transport &amp; delivery <small>",
  "${tr.lines ? `<span title=\"already in the figure above — the transport and delivery charge lines among them\">of which transport &amp; delivery — Transport Revenue <small>", 'plate transport'),
 ("return `<span class=\"hd\">Our costs</span><b class=\"hd\">what it costs Coates</b>\n"
  " <span>Transport <small>",
  "return `<span class=\"hd\">Our direct costs</span><b class=\"hd\">what it costs Coates</b>\n"
  " <span title=\"${esc(PL_CARTAGE)}\">Transport (cartage) <small>", 'plate ours'),
 ("<h3 class=\"sec\">Money <span>what we charge the V8s · what Coates pays · the difference — a charge is what Coates bills, a cost is what Coates pays</span></h3>",
  "<h3 class=\"sec\">Money <span>revenue · direct costs known so far · the difference — revenue is what Coates charges the V8s, a direct cost is what Coates pays for the job</span></h3>", 'money sec'),
 ("<div class=\"mcard\"><h4>What we charge, by stream</h4>", "<div class=\"mcard\"><h4>Revenue, by stream</h4>", 'money bars'),
 ("<span class=\"big\">We charge the V8s <small>ex GST</small></span>", "<span class=\"big\">Revenue <small>ex GST</small></span>", 'money bars total'),
 ("Ex GST and damage waiver. Every figure is what Coates bills the V8s:",
  "Ex GST and damage waiver. Every figure is revenue — what Coates charges the V8s:", 'money bars note'),
 (" <span>We charge the V8s</span><b>${esc(money0(M.charge.total) || '—')}</b>\n"
  " <span>Coates pays — known so far</span><b>${esc(money0(M.cost.known) || '—')}</b>",
  " <span>Revenue</span><b>${esc(money0(M.charge.total) || '—')}</b>\n"
  " <span>Direct costs — known so far</span><b>${esc(money0(M.cost.known) || '—')}</b>", 'money ledger'),
 ("<p class=\"mnote\">Each stream: what we charge · what Coates pays · the difference.",
  "<p class=\"mnote\">Each stream: revenue · direct costs · the difference.", 'money streams note'),
 ("${s.cost_known ? esc(sd(s.difference0)) : 'before costs'}</i></b>`).join('')}</div>",
  "${s.cost_known ? esc(sd(s.difference0)) : 'before direct costs'}</i></b>`).join('')}</div>", 'money streams before'),

 # ---------------- the weekly progress email
 ("lines.push('', `MONEY (ex GST): we charge the V8s ${money0(MS.charge.total) || '—'} (contracts",
  "lines.push('', `MONEY (ex GST): revenue ${money0(MS.charge.total) || '—'} (contracts", 'progress email revenue'),
 ("· Coates pays ${money0(MS.cost.known) || '—'} known · difference ${sd(MS.difference0)} so far — not a margin yet,",
  "· direct costs ${money0(MS.cost.known) || '—'} known so far · difference ${sd(MS.difference0)} so far — not a margin yet,", 'progress email costs'),
 ("lines.push(`BY BRANCH, charged: ` +", "lines.push(`BY BRANCH, revenue: ` +", 'progress email branch'),

 # ---------------- Pricing
 ("<h3>Event labour — what we charge the V8s for people over the event</h3>",
  "<h3>Event labour — revenue: what we charge the V8s for people over the event</h3>", 'pricing scope'),
 ("The staff here are what is charged; who works them, and what Coates pays for anyone not on the tracker, is not on this card.",
  "The staff here are what is charged — revenue; who works them, and the direct cost of anyone not on the tracker, is not on this card.", 'pricing scope hint'),
 ("<span class=\"chip crit\">cost to Coates · not a customer charge</span>",
  "<span class=\"chip crit\" title=\"${esc(PL_REHIRE)}\">rehire cost · not revenue</span>", 'pricing rehire chip'),
 ("as the pricing for the rehire toilets. They are what Coates <b>pays</b>; the customer side stays the 2026 card.",
  "as the pricing for the rehire toilets. They are Coates' <b>rehire cost</b> (${esc(PL_REHIRE)}); the revenue side stays the 2026 card.", 'pricing rehire words'),
 ("Cost to Coates on the same lines: ${transportCost ?",
  "Transport (cartage) cost to Coates on the same lines, from the sheet: ${transportCost ?", 'pricing transport cost'),
]

# the four docket tables' revenue column, the same header each time
DOCKET_OLD = ("<th class=\"num\" title=\"what Coates charges the V8s at the 2026 card, ex GST — what Coates pays is on the rates table and the purchase orders\">Client charge <small>ex GST</small></th>")
DOCKET_NEW = ("<th class=\"num\" title=\"charged to the V8s at the 2026 card, ex GST — hire and installation in one card rate. What Coates pays Advanced is on the rates table and the green book; the purchase orders are the orders to them\">Revenue <small>ex GST</small></th>")


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'fencePaidSplit' in t: sys.exit('v7.03 already applied')
    if 'function fenceDerived(){' not in t or 'function marginCard(){' not in t: sys.exit('not a GC500 page with the money model')
    t = rep(t, "function costCategoryCard(expect){", JS + "function costCategoryCard(expect){", 'code', path, need)
    for old, new, what in EDITS:
        t = rep_keep(t, old, new, what, path, need)
    n = t.count(DOCKET_OLD)
    if n != 4: sys.exit('docket revenue header: expected 4, found %d' % n)
    t = t.replace(DOCKET_OLD, DOCKET_NEW)
    k = t.find('</style>'); t = t[:k] + CSS + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
