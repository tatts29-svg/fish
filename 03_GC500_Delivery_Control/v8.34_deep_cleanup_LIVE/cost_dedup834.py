"""Author: Andrew Fisher. Guard the future cartage fallback by source-task identity.

Component only: apply_patch(text) changes the job-end cost model, not source/native
records, current money, customer charges, quantities or per-leg Revenue forecasts.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

START = 'function cj764Model776Held(){'
END = 'function cj764Card(){'
MARKER = 'transportTasks834'

OLD_INIT = ' const live = allAssets().filter(a => !a._cancelled && !a.rest_of); let cardCost = 0, cardRefs = 0, loadsNoFig = 0, loadsNoFigNoCard = 0;'
OLD_LIVE = ' live.forEach(a => { if (ourRefs.has(a.key)) return; const ev = (a.events || []).filter(e => e.carrier || e.dd || e.transport_cost); if (!ev.length) return; const noFig = ev.filter(e => !(e.transport_cost && (e.transport_cost.amount != null || e.transport_cost.internal))); if (!noFig.length) return; const T = assetTotal(a); const cc = (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0); if (cc) { cardCost += cc; cardRefs++; loadsNoFig += noFig.length; } else loadsNoFigNoCard += noFig.length; });'
OLD_RAW = ' [(((DATA.plant_lines || {}).fencing_rows_not_plant) || []), (DATA.unreferenced || [])].forEach(rs => rs.forEach(r => { const tc = r.transport_cost; if (!(tc && (tc.amount != null || tc.internal))) loadsNoFigNoCard++; }));'
NEW_INIT_BASE = " const live = allAssets().filter(a => !a._cancelled && !a.rest_of); let cardCost = 0, cardRefs = 0, loadsNoFig = 0, loadsNoFigNoCard = 0;\n const transportTasks834 = new Set();\n const transportTask834 = r => String(r && r.task_id || '').trim().toUpperCase();"
NEW_LIVE = ' live.forEach(a => { if (ourRefs.has(a.key)) return; const ev = (a.events || []).filter(e => e.carrier || e.dd || e.transport_cost); if (!ev.length) return; const noFig = ev.filter(e => !(e.transport_cost && (e.transport_cost.amount != null || e.transport_cost.internal))); if (!noFig.length) return; noFig.forEach(e => { const id = transportTask834(e); if (id) transportTasks834.add(id); }); const T = assetTotal(a); const cc = (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0); if (cc) { cardCost += cc; cardRefs++; loadsNoFig += noFig.length; } else loadsNoFigNoCard += noFig.length; });'
NEW_RAW_BASE = ' [(((DATA.plant_lines || {}).fencing_rows_not_plant) || []), (DATA.unreferenced || [])].forEach(rs => rs.forEach(r => { const id = transportTask834(r); if ((id && transportTasks834.has(id)) || (id && rowOff(id))) return; const tc = r.transport_cost; if (!(tc && (tc.amount != null || tc.internal))) loadsNoFigNoCard++; }));'

# Passes with no equipment item and no stated quantity are a duty, not evidence
# of an equipment carrier load. Keep them visible as unresolved; never turn an
# unknown quantity into zero or match the word "Collect".
NEW_INIT = NEW_INIT_BASE.replace("const live = allAssets().filter", "const transportAssets834 = allAssets(); const live = transportAssets834.filter") + "\n let nonLoadTasks834 = 0;\n const nonEquipmentTask834 = r => r.discipline === 'Passes' && !r.item && (r.quantity_display == null || /^\\s*(?:blank)?\\s*$/i.test(String(r.quantity_display)));"
NEW_RAW = NEW_RAW_BASE.replace('const tc = r.transport_cost;', 'if (id) transportTasks834.add(id); const tc = r.transport_cost;').replace('loadsNoFigNoCard++;', "{ if (nonEquipmentTask834(r)) { nonLoadTasks834++; return; } loadsNoFigNoCard++; }")
OLD_GAP = " gap(`${fmtNum(loadsNoFig + loadsNoFigNoCard)} loads with no transport figure yet`, 'September deliveries on 28 Sep and every October and November load', 'Andrew — the carriers’ figures on the schedule');"
NEW_GAP = OLD_GAP + "\n if (nonLoadTasks834) gap(`${fmtNum(nonLoadTasks834)} non-equipment schedule task${nonLoadTasks834 === 1 ? '' : 's'} with no transport basis`, 'Accreditation duties with no equipment item or stated quantity are held out of the average carrier-load estimate; the source tasks remain on the schedule and any travel cost remains unknown.', 'Andrew — confirm any separate travel cost');"

OLD_OWN = " let ourRefs = new Set(); try { ourRefs = new Set(ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null && x.ref).map(x => x.ref)); } catch (e) {}"
NEW_OWN = OLD_OWN + "\n transportAssets834.forEach(a => { (a.events || []).forEach(e => { const tc = e.transport_cost; if (!(a._cancelled || ourRefs.has(a.key) || (tc && (tc.amount != null || tc.internal)))) return; const id = transportTask834(e); if (id) transportTasks834.add(id); }); });"

def apply_patch(text, path='candidate'):
    """Apply the bounded model patch; fail closed on drift or a repeated patch."""
    if MARKER in text or text.count(START) != 1 or text.count(END) != 1:
        raise ValueError('Wrong cost-model boundary or patch already applied')
    a, b = text.index(START), text.index(END)
    if b <= a:
        raise ValueError('Wrong cost-model order')
    body = text[a:b]
    for old, new, label in [(OLD_INIT, NEW_INIT, 'Task identity set'),
                            (OLD_OWN, NEW_OWN, 'Keep paid, covered and cancelled tasks out of fallback'),
                            (OLD_LIVE, NEW_LIVE, 'Record already forecast source tasks'),
                            (OLD_RAW, NEW_RAW, 'Skip repeated or cancelled fallback tasks'),
                            (OLD_GAP, NEW_GAP, 'Explain unresolved non-equipment tasks')]:
        body = rep(body, old, new, label, path)
    return text[:a] + body + text[b:]
