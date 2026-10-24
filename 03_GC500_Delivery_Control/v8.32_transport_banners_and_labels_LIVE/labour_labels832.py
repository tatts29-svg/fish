"""Clarify the current card's labour source without repricing. Author: Andrew Fisher."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "toolchain"))
from rep import rep


SOURCE_HELPER = r'''/* v8.32: identify the supplied card; retain its original labour heading. */
function labourSource832(L){
 const year = RM && RM.card_year;
 const label = year ? String(year) + ' card' : 'Card figure';
 const source = (CARD_WORD ? CARD_WORD + ' rate card' : 'Rate card') + (year ? ' ' + year : '');
 const heading = L.heading || (L.year ? 'Labour ' + L.year : 'Labour');
 const detail = source + ' · source column: ' + heading + (L.money_note ? ' · ' + L.money_note : '');
 return `<span class="chip cand" data-labour-source832 title="${esc(detail)}">${esc(label)}</span>`;
}
'''

OLD_BADGE = '''${L.year_note ? ` <span class="chip cand" title="${esc(L.year_note)}">${esc(String(L.year))} rate</span>` : ''}'''
NEW_BADGE = '''${L.year_note ? ' ' + labourSource832(L) : ''}'''
OLD_NOTE = '''The labour columns are headed <b>2025</b> on the 2026 card (and 2024 on traffic management), and they are shown as that year's rates, never as 2026.</p>'''
NEW_NOTE = '''These figures come from the supplied <b>2026 ${esc(CARD_WORD)} rate card</b>. The card retains older year headings on its labour columns; each card label shows the original heading. For a single labour figure, the existing calculation allocates half to install and half to demob.</p>'''

REPLACEMENTS = (
    ("function labourCard(assets){", SOURCE_HELPER + "function labourCard(assets){", "current labour card source helper"),
    (OLD_BADGE, NEW_BADGE, "current card badge with original heading"),
    (OLD_NOTE, NEW_NOTE, "labour source and split explanation"),
    ("const of = t.refs.reduce((n, {a}) => n + (labourUnits(a, t.item).length || 1), 0);",
     "const of = t.refs.reduce((n, {a}) => n + (labourUnits(a, t.item).length || 1), 0);\n const itemQuantity832 = t.refs.reduce((n, {l}) => { const q = qtyOf(l); return n == null || q == null ? null : n + q; }, 0);",
     "distinguish physical units from grouped tick entries"),
    ("${of} ${of === 1 ? 'building' : 'buildings'} on ${t.refs.length}",
     "${of} ${itemQuantity832 === of ? (of === 1 ? 'unit' : 'units') : (of === 1 ? 'entry' : 'entries')} on ${t.refs.length}", "labour table equipment wording"),
    ("partly done — some buildings ticked, some not", "partly done — some units ticked, some not", "partly ticked equipment wording"),
    ("(m.perBuilding ? ' — one charge a building' : '')", "(m.perBuilding ? ' — one charge per unit' : '')", "drawer labour equipment wording"),
    ("(units.length === 1 ? ' building' : ' buildings')", "((q2 != null ? q2 : units.length) === 1 ? ' unit' : ' units')", "drawer equipment count wording"),
)


def apply_labour_labels(text):
    """Apply guarded wording-only changes; caller owns the base and release guards."""
    if "function labourSource832(" in text:
        raise ValueError("v8.32 labour labels already applied")
    for old, new, purpose in REPLACEMENTS:
        text = rep(text, old, new, purpose, "labour_labels832", True)
    return text
