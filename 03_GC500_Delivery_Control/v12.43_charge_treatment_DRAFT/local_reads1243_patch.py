"""Author: Andrew Fisher. Reuse read-only inputs inside one calculation call.

No cache survives the call. Public unit/cost projection copies are unchanged.
Labour units are resolved only if a card line needs the aggregate unit fallback;
the Finance PO map uses the two branch choices that its model already resolved.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


CHANGES = (
    ("function labourTicked(ref, disc, item, line, unit, asset){",
     "function labourTicked(ref, disc, item, line, unit, asset, readUnits1243){",
     'allow one-call lazy unit resolution for aggregate labour checks'),
    ("const a = asset || allAssets().find(x => x.key === ref), us = a ? labourUnits(a, item) : [];",
     "const a = asset || allAssets().find(x => x.key === ref), us = a ? (typeof readUnits1243 === 'function' ? readUnits1243(a) : labourUnits(a, item)) : [];",
     'retain native early returns before reading aggregate units'),
    ("if (!lp) return {state: 'no rate line', lines: [], note: 'this item type is not matched to a line on the card, so the card says nothing about labour on it'};\n const lines = (lp.lines || []).map(L => {",
     "if (!lp) return {state: 'no rate line', lines: [], note: 'this item type is not matched to a line on the card, so the card says nothing about labour on it'};\n let units1243, unitsRead1243 = false; /* localReads1243: only this item calculation owns this read. */\n const readUnits1243 = a => { if (!unitsRead1243) { units1243 = labourUnits(a, item); unitsRead1243 = true; } return units1243; };\n const lines = (lp.lines || []).map(L => {",
     'resolve aggregate labour units lazily once per card-line calculation'),
    ("ticked: labourTicked(ref, disc, item, L.key, unit, asset), by: w.by, at: w.at};",
     "ticked: labourTicked(ref, disc, item, L.key, unit, asset, readUnits1243), by: w.by, at: w.at};",
     'share the local resolver across this item’s card lines'),
    ("""function fh866RevenueBranch(o){
 if (o.revenue_branch) return normBranch(o.revenue_branch);
 const st = o.stream || 'fencing';
 return st === 'fencing' ? pl760FencingBranch() : st === 'toilets' ? pl760ToiletBranch() : null;
}""",
     """function fh866RevenueBranch(o, branches1243){
 if (o.revenue_branch) return normBranch(o.revenue_branch);
 const st = o.stream || 'fencing';
 if (st !== 'fencing' && st !== 'toilets') return null;
 if (branches1243 && Object.prototype.hasOwnProperty.call(branches1243, st)) return branches1243[st];
 return st === 'fencing' ? pl760FencingBranch() : pl760ToiletBranch();
}""",
     'preserve explicit PO branch priority and optional native fallback'),
    ("const FBR = pl760FencingBranch(), TBR = pl760ToiletBranch();\n /* 1. the purchase orders */",
     "const FBR = pl760FencingBranch(), TBR = pl760ToiletBranch(), branches1243 = {fencing: FBR, toilets: TBR}; /* localReads1243: fresh choices for this model call only. */\n /* 1. the purchase orders */",
     'retain the Finance model’s already-resolved branch choices'),
    ("const pos = poAll().map(o => { const rb = fh866RevenueBranch(o), rc = fh866Receipt(o), costed = o.branch || null;",
     "const pos = poAll().map(o => { const rb = fh866RevenueBranch(o, branches1243), rc = fh866Receipt(o), costed = o.branch || null;",
     'avoid repeated cost projections for each PO in the same model call'),
)


def patch(text, path):
    if 'localReads1243:' in text:
        raise ValueError('v12.43 local reads are already applied')
    if 'id="performance1241-script"' not in text:
        raise ValueError('v12.43 local reads require the performance release')
    for old, new, label in CHANGES:
        matches = text.count(old)
        if matches != 1:
            raise ValueError(label + ': expected one exact source match, got ' + str(matches))
        start = text.index(old)
        text = text[:start] + rep(old, old, new, label, path) + text[start + len(old):]
    return text
