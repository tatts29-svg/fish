#!/usr/bin/env python3
"""v7.63 - Accruals for Finance, in Andrew's words. Apply after v7.60, v7.61 and Codex's v7.62.

Keeps Codex's v7.62 model (acc762_* helpers, status planned/review, unknowns kept as unknowns, Brisbane-day stamps, the
unallocated lists, the people-days-hours table, the event people split from accommodation and travel). Changes:
  1. SUPPLIER INVOICES RECORDED. v7.62 dated a purchase order by `o.invoice_date`, a field the record does not carry, so
     every month showed $0.00 beside two confirmed Advanced invoices. A PO's month is the programme week it names (a work
     period on the record); a PO with no week is dated by the Brisbane day its invoice was typed on the page, and says so.
  2. LABOUR TICKS. v7.62 pushed every tick to "needing month allocation" because a tick carries no work date. The
     reference's first_date is the schedule's delivery day - the day the piece went in - and the install labour is the
     act of putting it in (Andrew's per-piece rule). A tick is dated by that day, and the basis says so; only a reference
     with no day in stays unallocated. The entry timestamp is still never used.
  3. TO ACCRUE, AS A PROPOSAL. The fencing row carries incurred - invoices recorded as "to accrue"; the proposal and the
     caveat (match to the ledger first, no automatic accrual, a paid cost never accrued twice) are said once.
  4. THE WORDS. The display layer is rewritten in Andrew's words with the badges Accrue / Finance's call / Check the
     invoice / Payroll / Planned; the WIP question asked as a question; a short basis per row.
    python3 patch_v763.py <page.html>   (needs v7.62: acc762FmtMoney, acc762WorkDate, acc761Model with o.invoice_date)"""
import os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
HERE = Path(__file__).resolve().parent
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function acc763Action(' in t: sys.exit('v7.63 already applied')
for need in ['function acc762FmtMoney(', 'function acc762WorkDate(', 'function acc761Model(month){', 'function acc761Labour(){', 'function acc761Text(X){', 'function acc761Bind(){', "const d = acc762Date(o.invoice_date), record = {"]:
    if need not in t: sys.exit('needs ' + need)

# 1. a purchase order's month: the programme week it names, else the Brisbane day its invoice was typed
t = rep(t, "const d = acc762Date(o.invoice_date), record = {number: o.number, invoice: o.invoice_no, amount: Number(o.amount), invoiceDate: d, period: o.period || o.programme_sheet || '', paidAmount: null, paymentStatus: 'unknown', workMonth: null};",
 "const d = acc763PoDate(o), record = {number: o.number, invoice: o.invoice_no, amount: Number(o.amount), invoiceDate: d, dateBasis: acc763PoDateBasis(o), period: o.period || o.programme_sheet || '', paidAmount: null, paymentStatus: 'unknown', workMonth: d ? d.slice(0, 7) : null};",
 'PO date', p, True)
PO_HELPERS = r"""/* v7.63 - a purchase order's day: the end of the programme week it names (a work period on the record); failing that,
   the Brisbane day its invoice number was typed on the page. Never a UTC slice. */
function acc763PoWeek(o){
 const per = String(o.period || o.programme_sheet || ''); const W = DATA.weeks || []; const n = per.match(/(?:week|wk)\s*(\d)/i);
 if (/demob|decon/i.test(per)) return W.find(x => /demob/i.test(x.phase || '') || /decon/i.test(x.sheet || '')) || null;
 if (/event/i.test(per)) return W.find(x => /event/i.test(x.sheet || '') || /event/i.test(x.phase || '')) || null;
 if (n) return W.find(x => String(x.sheet || '').replace(/\s+/g, ' ').toLowerCase() === 'week ' + n[1]) || null;
 return null;
}
function acc763PoDate(o){ const w = acc763PoWeek(o); if (w && acc762Date(w.end)) return w.end; return acc762StampDate(o.updated_at || o.at) || null; }
function acc763PoDateBasis(o){ const w = acc763PoWeek(o); return w ? `the programme week on the order (${w.sheet}, ending ${fmtDate(w.end)})` : (o.updated_at || o.at) ? 'the Brisbane day the invoice was typed on the page (no programme week on the order)' : 'no date on the order'; }
"""
t = rep(t, "function acc761Model(month){", PO_HELPERS + "function acc761Model(month){", 'PO helpers', p, True)

# 2. a tick is dated by the day its reference went in
t = rep(t, "const d = acc762WorkDate(t), recordedDate = acc762StampDate(t.at), rate = acc762Money(t.rate), amount = rate != null && multiplier != null ? rate * multiplier : null;",
 "const d = acc762WorkDate(t) || acc762Date(a.first_date), recordedDate = acc762StampDate(t.at), rate = acc762Money(t.rate), amount = rate != null && multiplier != null ? rate * multiplier : null;",
 'tick date', p, True)
t = rep(t, "if (!d) return unallocated(out.unallocatedRevenue, stream, br, amount, 'Work is ticked, but no confirmed work date; recording timestamp is not a work date', extra);\n    if (inM(d)) addRev(stream, br, amount, 'Per-piece card rate; explicit work date ' + d + '; customer billing not verified', Object.assign(extra, {status: acc762Status(d, month, asAt), forecastAmount: d > asAt ? amount : 0}));",
 "if (!d) return unallocated(out.unallocatedRevenue, stream, br, amount, 'Ticked, but the reference has no day in on the schedule; the time a tick was entered is not a confirmed work date', extra);\n    if (inM(d)) addRev(stream, br, amount, 'the card’s per-piece rate · dated by the day the reference went in', Object.assign(extra, {status: acc762Status(d, month, asAt), forecastAmount: d > asAt ? amount : 0}));",
 'tick basis', p, True)

# 3. the fencing row: invoices recorded for the month, and incurred less invoiced as the proposal to accrue; the WIP line asked as the question it is
t = rep(t, """ out.wip.push({what: 'Fencing paid; V8s not yet billed — Andrew’s confirmation on 1 Oct 2026', words: 'The paid amount, payment dates and matching invoices have not been established here. Finance must check where the paid cost is allocated and the appropriate work/revenue period. Customer billing delay alone does not establish WIP or justify another cost accrual. Do not accrue a paid or already-booked cost again.', paidAmount: null, paymentStatus: 'user confirmed paid, amount unmatched', confirmedOn: '2026-10-01'});""",
""" /* v7.63 - the fencing: the invoices recorded for the month against the dockets, and incurred less invoiced as the proposal to accrue (a proposal, matched to the ledger by Finance) */
 (() => { const f = out.costs.find(r => /^Fencing — supplier docket/.test(r.stream)); if (!f) return; const inv = acc762Round(out.invoiceRecords.filter(r => r.invoiceDate && r.invoiceDate.slice(0, 7) === month).reduce((s, r) => s + r.amount, 0));
 f.invoiced = inv; f.incurred = f.candidate; f.accrue = f.candidate != null ? acc762Round(Math.max(0, f.candidate - inv)) : null; f.action = f.accrue ? 'accrue' : 'check';
 const open = poAll().filter(o => !(o.confirmed && o.invoice_no && o.amount != null) && acc763PoDate(o) && acc763PoDate(o).slice(0, 7) === month);
 f.evidence = f.basis = f.extra.sources.length + ' dockets dated in ' + fin745MonthLabel(month) + ' at the supplier’s own sheet · invoices recorded for the month: ' + (out.invoiceRecords.filter(r => r.invoiceDate && r.invoiceDate.slice(0, 7) === month).map(r => r.invoice + ' ' + money0(r.amount) + ' (PO ' + r.number + (r.period ? ', ' + r.period : '') + ')').join('; ') || 'none') + (open.length ? ' · ' + open.length + ' PO' + (open.length === 1 ? '' : 's') + ' for the month with no invoice yet (' + open.map(o => o.number).join(', ') + ')' : ''); })();
 out.wip.push({what: 'Fencing — Advanced Temporary Fencing’s invoices recorded ' + money0(out.invoiced) + ' against the fencing charge to the V8s ' + money0(out.revenue.filter(r => /^Fencing Revenue/.test(r.stream)).reduce((s, r) => s + (r.amount || 0), 0)) + ' for ' + fin745MonthLabel(month) + ', none of it billed by the branch yet (Andrew, 1 Oct 2026: the fencing is paid)', words: 'Finance’s call: accrue the fencing revenue for the month (it matches the cost already paid), or hold the paid cost as WIP until the branch bills. Finance confirm the paid amount and where it is posted; the page knows the invoices on the record, not the payments', paidAmount: null, paymentStatus: 'user confirmed paid, amount unmatched', confirmedOn: '2026-10-01'});
""",
 'fencing proposal and WIP question', p, True)
t = rep(t, " out.costDecide = out.costCandidateTotal;", " const acc763Prov = r => !!(r.extra && (r.extra.provisionalAllocation || (r.extra.sources || []).some(s => s.provisionalAllocation)));\n out.costDecide = acc762Round(out.costs.filter(acc763Prov).reduce((s, r) => s + (r.candidate || 0), 0));\n out.costAccrue = acc762Round(out.costs.filter(r => !acc763Prov(r) && r.extra && r.extra.status !== 'forecast' && !/allocation —/.test(r.stream)).reduce((s, r) => s + (r.accrue != null ? r.accrue : (r.candidate || 0)), 0));", 'totals', p, True)

# 4. the display layer, in Andrew's words
a = t.index('function acc762FmtMoney('); z = t.index('function acc761Bind(){')
if not (0 < a < z): sys.exit('ui section not found in order')
t = t[:a] + (HERE / 'acc763_ui.js').read_text(encoding='utf-8').strip() + '\n' + t[z:]
t = rep(t, ".acc761-b-none{background:#e8edf0;color:#52636e}", ".acc761-b-none{background:#e8edf0;color:#52636e}.acc761-b-planned{background:#e9f0f4;color:#3a5a6e}.acc761-ua{border-left:4px solid #9aa3ad}", 'planned badge style', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
