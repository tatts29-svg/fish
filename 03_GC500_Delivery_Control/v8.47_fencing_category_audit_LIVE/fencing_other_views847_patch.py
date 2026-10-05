"""Author: Andrew Fisher. Exact legacy display-boundary CCB qualifications."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

def apply(text):
    changes = [
        ('const y = qYesterday(td), ft = fenceTypes(progressAsOf(y)), G = rsFenceGaps(ft);',
         'const y = qYesterday(td), ft = fenceCcbDisplayTypes847(progressAsOf(y)), G = rsFenceGaps(ft);', 'Question shortfall classification'),
        ('fenceGapsOf(fenceTypes(P)).forEach(g => out.push({',
         'fenceGapsOf(fenceCcbDisplayTypes847(P)).forEach(g => out.push({', 'Operations shortfall classification'),
        ('const F = fenceMetres(P), ft = fenceTypes(P), fd = fenceDerived(), gaps = fenceGapsOf(ft);',
         'const F = fenceMetres(P), ft = fenceCcbDisplayTypes847(P), fd = fenceDerived(), gaps = fenceGapsOf(ft);', 'Native group comparison classification'),
        ('const ft = fenceTypes(P);\n body = `<div class="tblwrap"><table class="wtb">',
         'const ft = fenceCcbDisplayTypes847(P);\n body = `<p>${esc(fenceCcbDisplayWords847(P))}</p><div class="tblwrap"><table class="wtb">', 'Native fencing drawer classification'),
        ('const F = fenceMetres(P), ft = fenceTypes(P);\n const hire = X.hire0, transport = X.transport0, fd = fenceDerived();',
         'const F = fenceMetres(P), ft = fenceCcbDisplayTypes847(P);\n const hire = X.hire0, transport = X.transport0, fd = fenceDerived();', 'Draft summary classification'),
        ("const g = fenceGapsOf(fenceTypes(P)); return g.length ? ' · behind by type: '",
         "const g = fenceGapsOf(fenceCcbDisplayTypes847(P)); return g.length ? ' · behind by type: '", 'Draft shortfall classification'),
        ("${P.areas ? ` · docket areas ticked complete ${P.areasDone} of ${P.areas}` : ''}`);",
         "${P.areas ? ` · docket areas ticked complete ${P.areasDone} of ${P.areas}` : ''}${fenceCcbDisplayWords847(P) ? ' · ' + fenceCcbDisplayWords847(P) : ''}`);", 'Draft CCB qualifier'),
        ("${fmtNum(t.done)}/${fmtNum(t.planned || 0)}/${fmtNum(t.total)} ${t.unit}",
         "${fmtNum(t.done)}/${t.planned == null ? 'unconfirmed' : fmtNum(t.planned)}/${fmtNum(t.total)} ${t.unit}", 'Draft unknown planned comparison'),
        ('const fenceOk = P.fenceLines.every(l => !l.behind);',
         'const fenceDisplay847 = fenceCcbDisplayLines847(P), fencePending847 = fenceDisplay847.some(l => l.ccbPending);\n const fenceOk = fenceDisplay847.every(l => !l.behind);', 'Fallback programme certainty'),
        ("P.fenceLines.length ? (fenceOk ? 'ok' : 'crit') : 'ref'", "P.fenceLines.length ? (fencePending847 ? (fenceOk ? 'act' : 'crit') : fenceOk ? 'ok' : 'crit') : 'ref'", 'Fallback programme colour'),
        ("P.fenceLines.length ? (fenceOk ? 'on track' : 'behind') : 'nothing planned yet'", "P.fenceLines.length ? (fencePending847 ? (fenceOk ? 'CCB categories need review' : 'behind · CCB categories need review') : fenceOk ? 'on track' : 'behind') : 'nothing planned yet'", 'Fallback programme verdict'),
        ("<tbody>${P.fenceLines.map(l => `<tr class=\"${l.behind ? 'stop' : l.planned != null && l.done >= l.planned ? 'done' : ''}\">",
         "<tbody>${fenceDisplay847.map(l => `<tr class=\"${l.ccbPending ? '' : l.behind ? 'stop' : l.planned != null && l.done >= l.planned ? 'done' : ''}\">", 'Fallback programme row colour'),
        ("${esc(String(l.name || '').replace(/^[a-z]/, c => c.toUpperCase()))}</b>${l.unit ?", "${esc(String(l.name || '').replace(/^[a-z]/, c => c.toUpperCase()))}</b>${l.ccbPending ? ' <span class=\"chip act\">Category needs review</span>' : ''}${l.unit ?", 'Fallback programme row qualifier'),
        ('<td class="num">${l.behind ? `<b style="color:var(--red)">${esc(fmtQty(l.behind, l.unit))}</b>` : l.planned == null ? \'—\' : \'<span class="chip ok">none</span>\'}</td>',
         '<td class="num">${l.ccbPending ? \'<span class="todo">unconfirmed</span>\' : l.behind ? `<b style="color:var(--red)">${esc(fmtQty(l.behind, l.unit))}</b>` : l.planned == null ? \'—\' : \'<span class="chip ok">none</span>\'}</td>', 'Fallback unknown shortfall')
    ]
    for old, new, label in changes:
        text = rep(text, old, new, label, 'v8.47')
    return text
