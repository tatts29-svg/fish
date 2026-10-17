"""Author: Andrew Fisher. Bounded water-barrier reinstatement classification and source labels."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / 'toolchain'))
from rep import rep

def apply(html):
    if 'function waterBarrierPlacement1017(' in html:
        raise ValueError('Water barrier v10.17 patch already applied')
    if 'function mapQuantity1010(' not in html or 'function barrierPeak(){' not in html:
        raise ValueError('Expected current map quantities and barrier source model')
    html = rep(html, 'function barrierQty(){', (HERE / 'barriers1017.js').read_text() + '\nfunction barrierQty(){', 'Reinstatement classification', 'v10.17 barriers')
    html = rep(html, 'What the schedule actually puts on the ground is <b>${pk.peak}</b> at once, first reached on',
               'The imported source schedule records a peak of <b>${pk.peak}</b> at once, scheduled for', 'Source peak label', 'v10.17 barriers')
    html = rep(html, 'not counted twice. ` : \'\'}None of the drawing totals',
               'not counted twice. This is the imported source comparison; current edits and confirmed arrivals are shown in the live work and inventory records. ` : \'\'}None of the drawing totals', 'Source peak limitation', 'v10.17 barriers')
    html = rep(html, '<b>The schedule — most on the ground at once</b>',
               '<b>Imported source schedule — peak planned deployment</b>', 'Source card peak label', 'v10.17 barriers')
    html = rep(html, "<td>${oh.peak_first_reached ? 'first reached ' + esc(fmtDate ? fmtDate(oh.peak_first_reached) : oh.peak_first_reached) + ' — ' : ''}counted day by day across ${t.schedule_references ?? '—'} WB references, so a barrier taken away and put back is counted once</td></tr>",
               "<td>${oh.peak_first_reached ? 'source date ' + esc(fmtDate ? fmtDate(oh.peak_first_reached) : oh.peak_first_reached) + ' — ' : ''}counted across ${t.schedule_references ?? '—'} source WB references. Historical source comparison; not a live onsite count.</td></tr>", 'Source card basis', 'v10.17 barriers')
    return html
