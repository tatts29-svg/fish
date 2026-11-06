#!/usr/bin/env python3
"""v7.39 - fencing purchase orders: Receipt ID No. and a description. Andrew Fisher, 29 Sep 2026: "Fencing has another
purchase order, P/O 4658850, description INV 93920 - partial Collection, Receipt Id No 4922343, total $195. I'm using the
Receipt Id No - can we change the invoice no to receipt id no please in this area, as I have been using the Receipt Id
with everything in this section."
 - The purchase-order card's Invoice column reads Receipt ID No. (the same stored field, so every number already typed
   stays where it is); the summary, the save message, the card's note and the branch plate say receipt ID.
 - Each order has a Description box (the order's note, already in the record's model and checks).
 - A new order's period starts blank. Save keeps the receipt ID, description and value without a period; Confirm needs one.
    python3 patch_v739.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'data-po-note=' in t: sys.exit('v7.39 already applied')
if 'function unnumbered(' not in t: sys.exit('needs v7.38')
t = rep(t, """<td><input data-po-inv="${esc(o.number)}" value="${esc(o.invoice_no || '')}" placeholder="invoice no." aria-label="invoice number for PO ${esc(o.number)}" style="max-width:130px">""",
 """<td><input data-po-inv="${esc(o.number)}" value="${esc(o.invoice_no || '')}" placeholder="receipt ID no." inputmode="numeric" aria-label="receipt ID number for PO ${esc(o.number)}" style="max-width:130px">""", 'receipt box', p, True)
t = rep(t, """ <td class="num"><input data-po-amt="${esc(o.number)}" type="number\"""",
 """ <td><input data-po-note="${esc(o.number)}" value="${esc(o.note || '')}" maxlength="120" placeholder="description" aria-label="description for PO ${esc(o.number)}" style="min-width:170px;max-width:240px"></td>
 <td class="num"><input data-po-amt="${esc(o.number)}" type="number\"""", 'description box', p, True)
t = rep(t, "<th>PO</th><th>Period</th><th>Schedule week</th><th class=\"num\">Dockets that week</th><th>Invoice</th><th class=\"num\">Value</th><th></th>",
 "<th>PO</th><th>Period</th><th>Schedule week</th><th class=\"num\">Dockets that week</th><th>Receipt ID No.</th><th>Description</th><th class=\"num\">Value</th><th></th>", 'header', p, True)
t = rep(t, "${confirmed} of ${pos.length} pairings confirmed · ${invoiced} with an invoice</span>", "${confirmed} of ${pos.length} pairings confirmed · ${invoiced} with a receipt ID</span>", 'summary', p, True)
t = rep(t, "The order's own value and invoice number, typed here,", "The order's own value and receipt ID number, typed here,", 'note text', p, True)
# a new order's period starts blank, and the button says what it will do
t = rep(t, """<select data-po-period="${esc(o.number)}" aria-label="period for PO ${esc(o.number)}">${periods.map(""",
 """<select data-po-period="${esc(o.number)}" aria-label="period for PO ${esc(o.number)}">${o.period ? '' : '<option value="" selected>- pick the period -</option>'}${periods.map(""", 'period blank', p, True)
t = rep(t, """<button class="btn" data-po-save="${esc(o.number)}">${o.confirmed ? 'Save' : 'Confirm'}</button>""",
 """<button class="btn" data-po-save="${esc(o.number)}">${o.confirmed || !o.period ? 'Save' : 'Confirm'}</button>""", 'button word', p, True)
# the save: the description too; without a period the details are kept and the pairing stays unconfirmed
t = rep(t, " const period = val(`[data-po-period=\"${no}\"]`), inv = val(`[data-po-inv=\"${no}\"]`), amt = val(`[data-po-amt=\"${no}\"]`);",
 " const period = val(`[data-po-period=\"${no}\"]`), inv = val(`[data-po-inv=\"${no}\"]`), amt = val(`[data-po-amt=\"${no}\"]`), note = val(`[data-po-note=\"${no}\"]`);", 'save read', p, True)
t = rep(t, " if (setPo(no, {period, programme_sheet: sheet ? sheet.programme_sheet : (o.programme_sheet || null), invoice_no: inv || null, amount: amt === '' ? null : Number(amt), confirmed: true,",
 " if (setPo(no, {period: period || null, programme_sheet: sheet ? sheet.programme_sheet : (period ? (o.programme_sheet || null) : null), invoice_no: inv || null, amount: amt === '' ? null : Number(amt), note: note || null, confirmed: !!period,", 'save write', p, True)
t = rep(t, "flash(`PO ${no} saved — ${period}${inv ? ', invoice ' + inv : ''}.`);",
 "flash(period ? `PO ${no} confirmed — ${period}${inv ? ', receipt ID ' + inv : ''}${note ? ' · ' + note : ''}.` : `PO ${no} saved${inv ? ' — receipt ID ' + inv : ''}${note ? ' · ' + note : ''}. Pick its period and press Confirm when you know it.`);", 'save said', p, True)
t = rep(t, "<span>Purchase orders</span><b>${g.pos.length} <small>· ${g.invoiced} invoiced</small></b>", "<span>Purchase orders</span><b>${g.pos.length} <small>· ${g.invoiced} with a receipt ID</small></b>", 'plate', p, True)
# the description box looks like the others, and is locked on the view link like them
t = rep(t, "body.viewonly [data-po-inv], body.viewonly [data-po-amt], body.viewonly [data-po-period]{", "body.viewonly [data-po-inv], body.viewonly [data-po-amt], body.viewonly [data-po-period], body.viewonly [data-po-note]{", 'css lock', p, True)
t = rep(t, "[data-po-period],[data-po-inv],[data-po-amt]{min-height:34px;", "[data-po-period],[data-po-inv],[data-po-amt],[data-po-note]{min-height:34px;", 'css look', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
