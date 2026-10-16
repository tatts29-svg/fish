"""Author: Andrew Fisher. v10.47 - fencing completion read with common sense, schedule against dockets (Andrew, 16 Oct
2026: "Please ensure we audit the numbers for fencing. You should know by the schedule what's been done already, and by
dockets we've done. Common sense. We need the completion percentage accurate").

Three things made the fencing percentages wrong:
1. Clean fence read 131%. Our dockets put every installed fence on the clean line and add scrim on the same metres when
   it is scrimmed (that is how it is charged), while the schedule counts a fence once, either clean or braced for scrim.
   So the scrimmed metres were in the clean count, and braced fences IEDM asked not to scrim were too. Compared like
   for like - fence installed (the clean line, 10,805 m) against the schedule's clean + braced-for-scrim - it is
   10,805 of 12,617 m. Scrim fitted stays its own line (1,577.5 of
   4,394.5 m), measured on that same fence, never added to the metres again.
2. Vehicle gates read 0%. The dockets record gates as wheels: one wheel per gate panel, which is how Advanced bill a
   vehicle gate (wheels and their billed gate counts agree on every docket that has both), and the schedule's gates are
   openings of two panels (36618: 2 gates, 4 wheels; 36622: 3 gates, 6 wheels). 204 wheels on the programme dockets is
   102 of 135 gates. Pedestrian gates are their own line on the dockets and stay as they are.
3. The headline added every activity: scrim on top of the fence, and relocations and removals (movements of fence
   already counted). It now measures installation: fence, crowd-control barriers (event, demarcation, flat feet) against
   the schedule's totals. Relocations, removals and scrim stay on their own rows.

The model, record, charges and costs do not change. Footer v10.46 -> v10.47.

    python3 patch_v1047.py path/to/page.html   (on the live v10.46 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

ANCHOR = "/* v10.44 - names-everywhere-1044: whatever routine drew it, an agent name never stays on the page. */"
NEW = r'''/* v10.47 - fence-completion-1047: schedule against dockets, like for like (Andrew, 16 Oct 2026). */
(function(W){
 const num = v => typeof v === 'number' && Number.isFinite(v), r2 = v => Math.round(v * 100) / 100;
 const wheels = () => { try { return (allDockets() || []).filter(d => d.scope === 'programme').reduce((n, d) => n + (Number((d.components || {}).wheels) || 0), 0); } catch (e) { return null; } };
 const fixRows = rows => {
  if (!Array.isArray(rows) || rows.some(r => r && r.fence1047)) return rows;
  const by = id => rows.find(r => r && r.id === id), clean = by('clean'), scrim = by('scrim'), vg = by('v_gates');
  if (clean && scrim && num(clean.total) && num(scrim.total) && num(clean.done)) {
   const total = r2(clean.total + scrim.total), done = clean.done, left = r2(Math.max(0, total - done));
   const pc = clean.plan || {}, ps = scrim.plan || {}, planned = num(pc.planned) && num(ps.planned) ? r2(pc.planned + ps.planned) : null;
   const delta = planned != null ? r2(done - planned) : null;
   Object.assign(clean, {label: 'Temporary fence (clean + braced)', total, done, recorded: done, left, remaining: left, pct: total ? done / total * 100 : null,
    totalRange: null, doneRange: null, recordedRange: null, leftRange: null, pctRange: null, extraWorkRecorded: 0,
    note: 'Fence installed against the schedule\'s clean + braced-for-scrim metres. Every installed fence is on the clean line of its docket; scrim is fitted on the same metres and shown on its own row.',
    plan: Object.assign({}, pc, {planned, delta, behind: delta != null ? Math.max(0, -delta) : pc.behind, early: delta != null ? Math.max(0, delta) : pc.early,
     status: delta == null ? pc.status : delta < 0 ? 'behind' : delta > 0 ? 'ahead' : 'on-plan',
     label: delta == null ? pc.label : delta ? Math.abs(delta).toLocaleString('en-AU') + ' m ' + (delta < 0 ? 'not yet docketed against' : 'docketed above') + ' the schedule to date' : 'Docketed metres match the schedule to date'}), fence1047: true});
   Object.assign(scrim, {label: 'Scrim fitted (on the fence above)', note: 'Shade cloth fitted on fence already counted above; not added to the metres again. Braced fences IEDM asked not to scrim count as fence, not scrim.', fence1047: true});
  }
  const w = wheels();
  if (vg && num(vg.total) && w != null) {
   const done = Math.min(vg.total, Math.floor(w / 2)), left = Math.max(0, vg.total - done);
   Object.assign(vg, {label: 'Vehicle gates (from docket wheels, 2 per gate)', done, recorded: done, left, remaining: left, pct: vg.total ? done / vg.total * 100 : null,
    totalRange: null, doneRange: null, recordedRange: null, leftRange: null, pctRange: null,
    note: w + ' wheels on the programme dockets - one wheel per gate panel, as Advanced bill a vehicle gate - at two panels to a scheduled gate opening.',
    plan: Object.assign({}, vg.plan || {}, {label: done + ' of ' + vg.total + ' gates from ' + w + ' docket wheels'}), wheels1047: w, fence1047: true});
  }
  return rows;
 };
 const S0 = W.todayWorkSummary848;
 if (typeof S0 === 'function' && !S0.fence1047) {
  const f = function(){ const s = S0.apply(this, arguments); try { if (s && s.fencingRows) fixRows(s.fencingRows); } catch (e) {} return s; };
  f.fence1047 = true; W.todayWorkSummary848 = f; try { todayWorkSummary848 = f; } catch (e) {}
 }
 const O0 = W.fenceOverall853;
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
})(window);
''' + ANCHOR

REPLACEMENTS = [
    ('fence completion like for like', ANCHOR, NEW),
    ('Release footer', "+ ' · v10.46'", "+ ' · v10.47'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'fence-completion-1047' in html: sys.exit('patch_v1047 refuses a repeat')
    if "+ ' · v10.46'" not in html: sys.exit('patch_v1047: not the v10.46 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1047 applied: fence completion like for like (fence vs clean+braced, gates from wheels, headline = installation); footer v10.46 -> v10.47')


if __name__ == '__main__':
    main()
