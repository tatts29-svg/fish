"""Author: Andrew Fisher. Restore qualified installed-fencing headline eligibility."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def patch(text):
    if 'installedScope1104' in text:
        raise ValueError('installed fencing progress is already patched')

    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, 'page')

    anchor = 'function fenceOverall853(asOf, suppliedSummary, suppliedFencing) {'
    change(anchor, (HERE / 'fencingProgress1104_src.js').read_text() + '\n' + anchor,
           'pure installed fencing source projection')
    change("  const ids = [...new Set(fenceProgrammeDefinitions959([]).filter(row => row.unit === 'm').map(row => row.id))];",
           "  const ids = FencingProgress1104.installedTypes;\n  const installedRows1104 = FencingProgress1104.rows(summary, fencing);",
           'installed metre scope keeps the original evidence and allocation validator')
    change("  const rows = ids.map(id => (summary.fencingRows || []).filter(row => row.id === id));",
           "  const rows = ids.map(id => installedRows1104.filter(row => row.id === id));",
           'validate each installed type exactly once')
    old_basis = 'Build + Event programme work metres. Each activity counts up to its own current programme total. Extra work cannot cover another activity’s shortfall. This measures work recorded, not unique standing fence length or whole-job physical completion. Demob, gate counts, components, hours and reinstatement without a programme total are separate.'
    new_basis = 'Fencing installed against the Build + Event schedule: temporary fence (clean + braced for scrim), crowd-control barriers (event, demarcation, flat feet). Each type counts up to its own schedule total; extra work cannot cover another type’s shortfall. Shared pending CCB allocation is counted once and keeps its range. Scrim fitted, relocations, removals, gate counts, components and hours stay separate. This records programme work, not physical handover or financial completion.'
    change(old_basis, new_basis, 'installed fencing basis retains qualifications')

    # Retain the existing detail-row presentation; remove only the late numeric
    # override which bypassed validation, collapsed ranges and kept stale state.
    old = ''' const O0 = W.fenceOverall853;
 if (typeof O0 === 'function' && !O0.fence1047) {
  const g = function(){ const o = O0.apply(this, arguments);
   try { if (o && Array.isArray(o.rows) && o.rows.length && o.state !== 'loading' && o.state !== 'unavailable') {
    const keep = ['clean', 'ccb_event', 'ccb_demarc', 'flat_feet'], rows = o.rows.filter(r => keep.includes(r.id) && num(r.total) && num(r.recorded));
    if (rows.length === keep.length) {
     const total = r2(rows.reduce((n, r) => n + r.total, 0)), credited = r2(rows.reduce((n, r) => n + Math.min(r.recorded, r.total), 0)), left = r2(total - credited), pct = total ? credited / total * 100 : null;
     Object.assign(o, {total, recorded: r2(rows.reduce((n, r) => n + r.recorded, 0)), credited: {min: credited, max: credited}, left: {min: left, max: left}, pct: {min: pct, max: pct},
      lampPct: o.lampPct && typeof o.lampPct === 'object' ? {min: pct, max: pct} : pct, fence1047: true,
      basis: 'Fencing installed against the schedule: temporary fence (clean + braced for scrim), crowd-control barriers (event, demarcation, flat feet). Each counts up to its own schedule total. Scrim, relocations and removals are shown on their own rows and not added to the installed metres.'});
    } } } catch (e) {}
   return o; };
  g.fence1047 = true; W.fenceOverall853 = g; try { fenceOverall853 = g; } catch (e) {}
 }
'''
    change(old, ' /* v11.04: fenceOverall853 validates the installed scope directly. */\n',
           'remove stale-state installed headline override')
    change('</head>\n<body>', '<style id="fencing-progress1104">\n' +
           (HERE / 'fencingProgress1104.css').read_text() + '\n</style>\n</head>\n<body>',
           'phone layout preserves complete numeric range endpoints')
    return text
