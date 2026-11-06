"""Author: Andrew Fisher. v10.45 - the Fencing tab shows where Advanced's bill and the signed docket disagree on scrim
(Andrew, 16 Oct 2026: "Please start auditing and fixing").

The fencing audit of 16 Oct recomputed every docket at the 2026 card (all 112 agree to the cent) and then set Advanced's
own priced lines (approved supplier pricing, P/O 4647519) beside the signed dockets. Advanced bill "Braced for scrim" at
$24.40 a metre in place of clean fence at $10.00; we charge clean fence at the card plus scrim at the card on the
scrimmed metres. On seven dockets the scrim metres differ: three where Advanced billed scrim the docket says was not
scrimmed (36581, 36583, 36587), one where Advanced billed scrim the docket does not mention (36574), and three where the
docket records more scrim than Advanced billed (36575, 36579, 36588). A difference fully explained by vehicle-gate panels
(Advanced count gates separately, about 2.5 m each) is not listed. Nothing is listed for the CCB category calls; they
already have their own review.

Each item goes into "What needs reconciling" with both money readings: what Advanced's bill is over clean fence, and what
the V8s charge would be if braced fence is charged as scrim. Worked out live from the record, so it updates as dockets
are corrected. No charge, cost or record changes. Footer v10.44 -> v10.45.

    python3 patch_v1045.py path/to/page.html   (on the live v10.44 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARK = '/* v10.45 - scrim-bill-1045 */'
ANCHOR = "/* v10.44 - names-everywhere-1044: whatever routine drew it, an agent name never stays on the page. */"
NEW = "/* v10.45 - scrim-bill-1045: where Advanced's bill and the signed docket disagree on scrim metres - listed for review, nothing changed. */" + r'''
function scrimBill1045(){
 const r2 = n => Math.round(n * 100) / 100, m = n => '$' + r2(n).toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
 const num = v => Number.isFinite(Number(v)) ? Number(v) : 0, len = v => r2(v).toLocaleString('en-AU') + ' m';
 const card = (fenceRateFor('scrim') || {}).value, supScrim = (fenceCostFor('scrim') || {}).value, supClean = (fenceCostFor('clean') || {}).value;
 const out = [];
 (typeof allDockets === 'function' ? allDockets() : []).forEach(d => {
  const sl = d.supplier_lines || []; if (!sl.length) return;
  const sup = r2(sl.filter(l => l.column === 'scrim').reduce((a, l) => a + num(l.qty), 0));
  const gates = sl.filter(l => l.column === 'v_gates').reduce((a, l) => a + num(l.qty), 0);
  const ours = r2(num((d.quantities || {}).scrim)); const diff = r2(sup - ours);
  if (Math.abs(diff) < 0.01 || Math.abs(Math.abs(diff) - gates * 2.5) < 0.01) return;
  const note = String(d.note || ''), notScrim = /not scrimm?ed/i.test(note) ? ' The docket says: "' + (note.match(/[^.]*not scrimm?ed[^.]*/i) || [''])[0].trim() + '."' : '';
  const gateWords = gates ? ' Advanced count ' + gates + ' vehicle gate' + (gates === 1 ? '' : 's') + ' separately (about ' + len(gates * 2.5) + ' of panels).' : '';
  let detail;
  if (diff > 0) detail = 'Advanced billed ' + len(sup) + ' as braced for scrim; the signed docket records ' + (ours ? len(ours) + ' of scrim' : 'no scrim') + '.' + notScrim + gateWords +
   (supScrim != null && supClean != null ? ' If those ' + len(diff) + ' were not scrimmed, Advanced\'s bill is ' + m(diff * (supScrim - supClean)) + ' more than clean fence.' : '') +
   (card != null ? ' If braced fence is charged as scrim, the V8s charge is ' + m(diff * card) + ' short.' : '');
  else detail = 'The signed docket records ' + len(ours) + ' of scrim, charged to the V8s at the card; Advanced billed ' + (sup ? len(sup) : 'no scrim') + '.' + gateWords +
   ' Our charge is backed by the docket.' + (supScrim != null && supClean != null ? ' Advanced may still bill up to ' + m(-diff * (supScrim - supClean)) + ' for the other ' + len(-diff) + '.' : '');
  out.push({id: 'scrim-bill-' + d.docket_no, title: 'Scrim on ' + d.docket_no + ' (' + (d.location || '') + '): docket ' + len(ours) + ', Advanced billed ' + len(sup),
   detail, recordId: d.id, book: 'red', papers: [], scope: 'charge', status: 'cross-source-difference', scrim1045: {docket: ours, billed: sup, diff, gates}});
 });
 return out;
}
(function(W){ const base = W.fenceComponentEvidence849; if (typeof base !== 'function' || base.scrim1045) return;
 const f = function(){ const a = base.apply(this, arguments) || {issues: [], pending: []}; let add = [];
  try { add = scrimBill1045(); } catch (e) { add = []; }
  const have = new Set((a.issues || []).map(i => i.id)); return Object.assign({}, a, {issues: (a.issues || []).concat(add.filter(i => !have.has(i.id)))}); };
 f.scrim1045 = true; W.fenceComponentEvidence849 = f; try { fenceComponentEvidence849 = f; } catch (e) {} })(window);
''' + ANCHOR

REPLACEMENTS = [
    ('scrim bill check in What needs reconciling', ANCHOR, NEW),
    ('Release footer', "+ ' · v10.44'", "+ ' · v10.45'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'scrim-bill-1045' in html: sys.exit('patch_v1045 refuses a repeat')
    if "+ ' · v10.44'" not in html: sys.exit('patch_v1045: not the v10.44 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1045 applied: scrim differences between Advanced\'s bill and the signed dockets listed in What needs reconciling; footer v10.44 -> v10.45')


if __name__ == '__main__':
    main()
