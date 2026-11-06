"""Author: Andrew Fisher. v11.58 - invoices are matched to dockets as the dockets come in.

Andrew, 23 Oct 2026: "We match invoices up with dockets as we get dockets. So any not matched means we dont have a invoice for
it yet". The Purchase orders card (Fencing tab) stops putting the week's revenue against a supplier order and says the invoice
state instead: matched to the cent, or not matched yet with the dockets so far and their estimate at the supplier's sheet rates.
The card's note carries the rule; the P&L's Rehire line says how many orders are invoiced and matched. invoices1158.js holds the
two helpers. Footer -> v11.58 (built on Codex's v11.57 Showcase repair, live 23 Oct). No record change.

    python3 patch_v1158.py page.html      (in place, on the live v11.57 page)
"""
import hashlib, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.58 requires the live page ' + BASE_SHA256)
    cur = re.search(r"\+' · v11\.(\d+)'; /\* v8\.19 release922", text)
    if not cur: raise ValueError('v11.58: the footer is not where v8.19 put it')
    text = rep(text, cur.group(0), "+' · v11.58'; /* v8.19 release922", 'release footer', 'page')
    # the per-order cell: the invoice state, not the week's revenue
    text = rep(text, """<td class="num">${wk ? `${wk.dockets}<br><span class="w" style="font-size:11px;color:var(--mute)">${esc(money0(wk.cost) || '—')} revenue</span>` : '—'}</td>""",
               """<td class="num">${wk ? wk.dockets : '—'}<br><span class="w inv1158 inv1158-${esc(invoiceState1158(o, ws).state)}" style="font-size:11px;color:var(--mute)">${esc(invoiceState1158(o, ws).words)}</span></td>""", 'order cell', 'page')
    text = rep(text, """${confirmed} of ${pos.length} pairings confirmed · ${invoiced} with a receipt ID</span>""",
               """${confirmed} of ${pos.length} pairings confirmed · ${invoiced} with a receipt ID · ${invoiceCounts1158(pos).matched} invoice${invoiceCounts1158(pos).matched === 1 ? '' : 's'} matched to the cent · ${invoiceCounts1158(pos).awaiting} not matched yet</span>""", 'card header', 'page')
    text = rep(text, """<th class="num">Dockets that week</th>""", """<th class="num">Dockets that week · invoice</th>""", 'column head', 'page')
    text = rep(text, """A purchase order is a Coates commercial reference; nothing here says what an order is worth until a person types it. The week's dockets are priced at the
 2026 card and shown beside the order — what Coates charges the V8s for that week's fencing.""",
               """A purchase order is a Coates commercial reference; nothing here says what an order is worth until a person types it. Invoices are matched to dockets as the dockets come in: an order with its supplier sheet on the record reads matched to the cent; an order without one reads not matched yet, with the dockets so far and what they come to at the supplier’s sheet rates — the figure the invoice is matched against when it arrives. Not matched means the invoice is not here yet, nothing more (the project manager, 23 Oct 2026).""", 'card note', 'page')
    # the P&L's Rehire line: how much of the fencing cost is invoiced and matched
    text = rep(text, """'Advanced’s gear on the dockets at their own sheet ' + money0(fenceGear)""",
               """'Advanced’s gear on the dockets at their own sheet ' + money0(fenceGear) + ((m => m.length ? ' (' + m.length + ' order' + (m.length === 1 ? '' : 's') + ' invoiced and matched to the cent, ' + money0(m.reduce((s, x) => s + x.total, 0)) + '; the other dockets await their invoice, counted at the sheet rates)' : '')(supplierPricing1014().orders.filter(x => x.valid && x.difference === 0)))""", 'P&L rehire basis', 'page')
    block = (HERE / 'invoices1158.js').read_text(encoding='utf-8').strip()
    text = rep(text, '<script id="steady1143-script">', '<script id="invoices1158-script">\n' + block + '\n</script>\n<script id="steady1143-script">', 'invoices block before steady1143', 'page')
    for needle, n in [("+' · v11.58'; /* v8.19 release922", 1), ('id="invoices1158-script"', 1), ('invoiceState1158(o, ws)', 3), ('invoiceCounts1158(pos)', 4), ('function invoiceState1158', 1), ('invoiced and matched to the cent', 1), ("${esc(money0(wk.cost) || '—')} revenue</span>", 0)]:
        if text.count(needle) != n: raise ValueError('v11.58 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1158 applied: invoices matched to dockets as they come; footer v11.56 -> v11.58')
