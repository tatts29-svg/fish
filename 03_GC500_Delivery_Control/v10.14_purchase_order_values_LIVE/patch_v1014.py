"""Author: Andrew Fisher. Show the shared P/O value alongside its reference, preserving the ledgers."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = 'ab5fe3dc666b68b3b9ec27a731ff3edad06ba0fa3db4da3910ecbc11b9184143'
REPLACEMENTS = [
    ('Fencing purchase-order reference', '<td><b class="mono">${esc(o.number)}</b>${o._local', '<td><b class="mono">${poLabel1014(o.number)}</b>${o._local'),
    ('Finance purchase-order reference', '<td><b class="mono">${esc(o.number)}</b><br><span class="w fh866-mute">', '<td><b class="mono">${poLabel1014(o.number)}</b><br><span class="w fh866-mute">'),
    ('Finance cost-stream order references', 'r.pos.map(n => `<span class="mono">${esc(n)}</span>`)', 'r.pos.map(n => `<span class="mono">${poLabel1014(n)}</span>`)'),
    ('Shared purchase-order trace heading', '<h4>P/O ${e(order.number)} · shared order</h4>', '<h4>P/O ${poLabel1014(order.number)} · shared order</h4>'),
    ('Reviewed docket purchase-order badge', '>P/O ${esc(review.po.number)}<small>source summary</small>', '>P/O ${poLabel1014(review.po.number)}<small>source summary</small>'),
    ('Reviewed docket purchase-order details', '<b>P/O ${esc(review.po.number)} — source summary.</b>', '<b>P/O ${poLabel1014(review.po.number)} — source summary.</b>'),
    ('Supplier summary purchase-order heading', '<h4>P/O ${e(g.number)} · supplier summary</h4>', '<h4>P/O ${poLabel1014(g.number)} · supplier summary</h4>'),
    ('Finance unreceipted purchase-order summary cents', "fin745Card('PO value not confirmed receipted', money0(H.notConfirmed), `of ${money0(H.poSum)}", "fin745Card('PO value not confirmed receipted', money(H.notConfirmed), `of ${money(H.poSum)}"),
    ('Finance purchase-order footer cents', '<tr class="acc761-tot"><td colspan="4">Total</td><td class="num"><b>${m0(H.poSum)}</b></td><td></td><td><b>${m0(H.receiptedSum)}</b> receipted</td><td></td></tr>', '<tr class="acc761-tot"><td colspan="4">Total</td><td class="num"><b>${esc(money(H.poSum))}</b></td><td></td><td><b>${esc(money(H.receiptedSum))}</b> receipted</td><td></td></tr>'),
    ('Release footer', "+ ' · v10.13'", "+ ' · v10.14'"),
]

def apply_display(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.13; refuses repeat or wrong-base application')
    anchor = "const PO_SRC = DATA.purchase_orders || {orders: [], supplier: null};"
    html = rep(html, anchor, (HERE / 'po_values1014.js').read_text().rstrip() + '\n' + anchor, 'Shared P/O currency label', 'v10.14')
    for label, old, new in REPLACEMENTS:
        html = rep(html, old, new, label, 'v10.14')
    return html

def apply(html):
    from pricing1014.patch_pricing1014 import apply as apply_pricing
    from attribution1014.patch_attribution1014 import apply as apply_attribution
    return apply_attribution(apply_pricing(apply_display(html)))

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
