"""Author: Andrew Fisher. v12.31 - the Demob tab: ready for collection, the pick-up date and time, picked up and when.

Andrew, 26 Oct 2026, with trucks on site: "we have trucks in now so we need to know what is ready or not ready"; "its important we
have a pickup date and time. we can have a not ready for collection ready for collection and a picked up and time and date it was
picked up"; "lets utilise the current demob tab... as things are changed or leave this info can be added to the demob cards"; "we
need to have a Coates and a sub hired Section in the demob"; "3 lights red not ready for collection another light for ready for
collection and then another for Picked up", "should green be last its complete"; "remember we need asset no. description . sizes
dimensions weights"; "remember the day cards change as per what we have .. also have a picked up time and date"; "need this to be tidy".

On the Demob tab's pick-up list:
  - two sections, Coates (our fleet) and Sub-hired (by supplier), each with a banner, its counts and a progress bar; the owner is
    read from the reference's own units (gcUnits925); one table per section with the areas as separator rows;
  - three lights in traffic-light order, one lit: red not ready for collection, amber ready for collection, green picked up
    (complete); on the edit link each light is its own button. Beside them who set it and when, the reason for Not ready, and for
    Picked up the date and time it left (the departure record);
  - under the description, the unit asset numbers and the size, weight and rating the page holds (Loading931), each saying where it
    comes from; nothing worked out, nothing made up;
  - the pick-up: the Demob plan's day (each portion's day when split) and the load's planned stop time (trucks816); a supplier
    pick-up shows site hours (07:00-17:00, their own transport); the day's chip says how firm it is;
  - a tally with a filter, and "Picked up this day" with the times.
The day cards read, as per what we have, Picked up (what left that day by the departure record, with the last time), Ready for
collection and Not ready of the day's references still on site.
Ready and Not ready are a new tick on the shared delivery record (who, when and why), merged on its own clock the way Emptied is
(mergeRecords, deliveryEmpty); a tick from before the unit last arrived on site counts for nothing. A toilet or waste tank is Ready
only once it is emptied: the Emptied rule and its gate are unchanged, and the light records Emptied first, in the person's name,
only when they confirm it was pumped out. Picked up is the existing departure form (DemobCollection996), which records the date and
time. Nothing else changes: the plan, the loads, the emptied gate, charges, QR codes and the servicing tracker are untouched. Every
edit must find its text exactly once on the verified v12.29 page. Footer -> v12.31.
    python3 patch_v1231.py page.html      (in place, on the live v12.29 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'a4d611111a0ab0dd89f7effa753a52502fae661d39afc3bded2d98beeddc4276'
FOOT_OLD, FOOT_NEW = "+' · v12.29'; /* v8.19 release922", "+' · v12.31'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

EMPTIED_MERGE = "if (ew816) Object.assign(m, ew816);"
READY_MERGE = EMPTIED_MERGE + """
 /* v12.31 - ready for collection merges on its own clock, as emptied does: value, who, when and why together; the same moment with two answers keeps not ready */
 const ra1231 = typeof a.ready1231 === 'boolean' ? {ready1231: a.ready1231, ready1231_by: a.ready1231_by, ready1231_at: a.ready1231_at, ready1231_why: a.ready1231_why || ''} : null, rb1231 = typeof b.ready1231 === 'boolean' ? {ready1231: b.ready1231, ready1231_by: b.ready1231_by, ready1231_at: b.ready1231_at, ready1231_why: b.ready1231_why || ''} : null;
 let rw1231 = !ra1231 ? rb1231 : !rb1231 ? ra1231 : String(rb1231.ready1231_at || '') !== String(ra1231.ready1231_at || '') ? (String(rb1231.ready1231_at || '') > String(ra1231.ready1231_at || '') ? rb1231 : ra1231) : (J(rb1231) > J(ra1231) ? rb1231 : ra1231);
 if (ra1231 && rb1231 && ra1231.ready1231 !== rb1231.ready1231 && String(ra1231.ready1231_at || '') === String(rb1231.ready1231_at || '')) rw1231 = ra1231.ready1231 === false ? ra1231 : rb1231;
 if (rw1231) Object.assign(m, rw1231);"""
EH_OLD = "const EH816 = hist(a.emptied_history, b.emptied_history, h => h.emptied + '|' + h.at); if (EH816.length) m.emptied_history = EH816; /* v8.16 */"
EH_NEW = EH_OLD + "\n const RH1231 = hist(a.ready1231_history, b.ready1231_history, h => h.ready + '|' + h.at); if (RH1231.length) m.ready1231_history = RH1231; /* v12.31 */"
CARD_OLD = "rows:d.future?[{label:'Known refs',value:d.refs.length},{label:'Work areas',value:new Set(d.refs.map(r=>r.zone)).size}]:[{label:'Refs with collections',value:d.recorded||'Not recorded'},{label:'Planned known refs',value:d.refs.length}],issues:[]};"
CARD_NEW = "rows:(typeof Ready1231==='object'&&Ready1231.dayRows(d.date,d.refs,d.future))||(d.future?[{label:'Known refs',value:d.refs.length},{label:'Work areas',value:new Set(d.refs.map(r=>r.zone)).size}]:[{label:'Refs with collections',value:d.recorded||'Not recorded'},{label:'Planned known refs',value:d.refs.length}]),issues:[]};"

EDITS = [
 ('the pick-up list header', "const TH816 = '<thead><tr><th>GC500 ID</th><th>What</th><th>Branch</th><th>Date from</th><th>Actions</th></tr></thead>';",
  "const TH816 = '<thead><tr><th>GC500 ID</th><th>What</th><th>Branch</th><th>Pick-up</th><th>Status</th><th>Actions</th></tr></thead>';"),
 ('the pick-up and status cells', '<td data-label="Date from">${srcChip816(r.src)} ${notReady816(r)}</td>',
  """${typeof Ready1231 === 'object' ? Ready1231.cells(r) : '<td data-label="Pick-up">' + srcChip816(r.src) + '</td><td data-label="Status">' + notReady816(r) + '</td>'}"""),
 ('the buttons', """<td data-label="Actions"><details class="menu816"${open ? ' open' : ''} data-menu816="${esc(r.key)}">""",
  """<td data-label="Actions">${typeof Ready1231 === 'object' ? Ready1231.actions(r) : ''}<details class="menu816"${open ? ' open' : ''} data-menu816="${esc(r.key)}">"""),
 ('the tick merges', EMPTIED_MERGE, READY_MERGE),
 ('its history merges', EH_OLD, EH_NEW),
 ('a record holding only the tick is kept', "typeof d.emptied !== 'boolean' && !d.date_off_at", "typeof d.emptied !== 'boolean' && typeof d.ready1231 !== 'boolean' && !d.date_off_at"),
 ('the day cards count it', CARD_OLD, CARD_NEW),
]


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.29; rebuild and retest')
    if 'ready1231-script' in text: raise ValueError('v12.31 is already on the page')
    for label, old, new in EDITS:
        if text.count(old) != 1: raise ValueError(f'{label}: expected text found {text.count(old)} times, not once')
        text = text.replace(old, new)
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + (HERE / 'ready1231_src.js').read_text(encoding='utf-8').rstrip() + '\n' + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.29 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print(f'patch_v1231 applied: {len(EDITS)} edits + ready1231; the Demob tab shows the pick-up date and time and ready for collection, not ready or picked up; footer v12.29 -> v12.31')
