"""Author: Andrew Fisher. P/O values shown as currency, a recorded "checked" state on each order, people shown without an
agent suffix on the purchase-order and pre-start rows. Applies only to the exact live v10.18 page."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d'
SOURCE = HERE / 'po_prestart1019.js'
# The v10.14 author comment sits on the line above poLabel1014; the source goes in above both so that comment stays with
# its own function.
INSERT_BEFORE = """/* Author: Andrew Fisher. P/O labels read the current shared order; no copied amounts or ledger changes. */
function poLabel1014(number) {"""

REPLACEMENTS = [
    ('poAll keeps the checked state',
     "['supplier_code', 'supplier_name', 'branch', 'period', 'programme_sheet', 'invoice_no', 'amount', 'note', 'by', 'at', 'updated_at', 'updated_by', 'stream', 'revenue_branch', 'receipted','receipted_amount', 'what', 'supplier_pricing']",
     "['supplier_code', 'supplier_name', 'branch', 'period', 'programme_sheet', 'invoice_no', 'amount', 'note', 'by', 'at', 'updated_at', 'updated_by', 'stream', 'revenue_branch', 'receipted','receipted_amount', 'what', 'supplier_pricing', 'checked']"),
    # ${poSupplierBlock1014(o.number)} alone appears twice (Fencing card and Finance handover); the "added here" chip that
    # follows it is only on the Fencing card, so the anchor carries it.
    # The checked line and, until it is recorded, the Mark checked button both live in the P/O cell: on a phone that cell
    # stays in view, and a second button in the actions column would push the value field under it at full scroll.
    ('Fencing P/O row shows the recorded checked state or the Mark checked button',
     """${poSupplierBlock1014(o.number)}${o._local && !o._src ? '<br><span class="chip act">added here</span>' : ''}""",
     """${poSupplierBlock1014(o.number)}${poCheckedBlock1019(o)}${poCheckButton1019(o)}${o._local && !o._src ? '<br><span class="chip act">added here</span>' : ''}"""),
    ('Fencing P/O confirmed-by line without an agent suffix',
     "confirmed by ${esc(o.updated_by || o.by || 'a person')}",
     "confirmed by ${esc(personWords1019(o.updated_by || o.by || 'a person'))}"),
    ('Fencing P/O value field shows currency',
     """<td class="num"><input data-po-amt="${esc(o.number)}" type="number" min="0" step="0.01" inputmode="decimal" value="${o.amount != null ? esc(o.amount) : ''}" placeholder="PO value" aria-label="value of PO ${esc(o.number)}" style="max-width:110px"></td>""",
     # Stays 110px wide: on a 390px phone that is what the Value column has at full scroll beside the sticky P/O column,
     # and "$28,246.50" fits in it (the browser test measures that).
     """<td class="num"><input data-po-amt="${esc(o.number)}" type="text" inputmode="decimal" value="${o.amount != null ? esc(money(Number(o.amount)) || o.amount) : ''}" placeholder="PO value" aria-label="value of PO ${esc(o.number)}" style="max-width:110px"></td>"""),
    ('Fencing P/O Save reads the typed currency',
     'amt = val(`[data-po-amt="${no}"]`)',
     'amt = poParseMoney1019(val(`[data-po-amt="${no}"]`))'),
    ('Fencing P/O Mark checked handler',
     "const add = pane.querySelector('#poAdd');",
     "pane.querySelectorAll('[data-po-check1019]').forEach(b => b.onclick = () => { const no = b.dataset.poCheck1019; const who = whoAmI(); if (!who) return; if (setPo(no, {checked: {by: who, at: new Date().toISOString()}})) { bump(); flash('PO ' + no + ' marked as checked.'); } });\n const add = pane.querySelector('#poAdd');"),
    ('Pre-start row without an agent suffix',
     "p.by ? ' · ' + esc(p.by) : ''",
     "p.by ? ' · ' + esc(personWords1019(p.by)) : ''"),
    ('Release footer', "+ ' · v10.18'", "+ ' · v10.19'"),
]


def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.18; refuses a repeat or a wrong base')
    html = rep(html, INSERT_BEFORE, SOURCE.read_text().rstrip() + '\n' + INSERT_BEFORE, 'P/O value, checked state and person words source', 'v10.19')
    for label, old, new in REPLACEMENTS:
        html = rep(html, old, new, label, 'v10.19')
    return html


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
