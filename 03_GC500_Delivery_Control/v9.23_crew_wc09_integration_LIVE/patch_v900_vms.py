#!/usr/bin/env python3
# Author: Andrew Fisher. v9.00 part D (publishes in v9.05) - the iEDM VMS plan VMS001-26003-01, in words only.
#
# The project manager sent the iEDM VMS plan VMS001-26003-01 (17 pages, a PowerPoint export of 2 Sep 2026) at about
# 11:00 AEST on 8 Oct 2026: "please see attached update of vms boards". It was reconciled board by board against D025 Rev 02,
# the schedule rows and the record, and the reconciliation was checked by three independent reviews (their refutations win
# where they disagree with it). He has not yet said whether the plan replaces D025 Rev 02, so this part changes WORDS ONLY:
# no position, no count, no money, no record write.
#
# What changes:
#  1. DATA.docs.docs: the plan is listed beside D025 (Documents, Drawings, "As issued - project 26003") as
#     "VMS001-26003-01 · 2026 Gold Coast 500 VMS Plan (iEDM) · 17 pages · received 8 Oct 2026". It is a catalogue entry with
#     no file, the way the page already shows a document the service does not hold (the red "not uploaded" light, as for the
#     A3 map plates): no href, no file, no checksum. Its note says it is received, under review and not hosted, and why (its
#     photographs show the trailers' phone numbers and its file details a personal name). DATA.docs.counts.map follows.
#  2. DATA.sheets D025: seven markers gain a `note` (the existing marker field the sheet's tooltip already shows) with the
#     plan's cross-reference: 2A, 5A, 7A, 04A, 15, 18, and 1O, which also gains `face` "10" (D025 itself types 1O). The
#     sheet gains a `note` listing once the boards only the plan has (21, 22, 23, 24), in the plan's printed words. Three
#     small code changes show them: the sheet note under the map, the marker note in the card a tap opens (a phone has no
#     tooltip), and a marker's face, not its stored label, at the head of its tooltip and card where it has one. Labels, tags,
#     fx/fy/ax/ay, MASTER_LOC, VMS_TIPS and the master plan's VMS layer are untouched.
#  3. Today, VMS boards card: one line beside the v8.75 source note - "Schedule 24 · iEDM plan VMS001-26003-01: 24 boards +
#     4 moves · BOQ 23 · the project manager's 1 Oct answer: 22" - with the schedule total and the BOQ figure read where the
#     v8.75 note reads them (a wrap of todayGroupDetails841, as v8.75 and v8.94 do). On v9.04 that note still lives in the VMS
#     card's "View details" fold (ul.tw841-group-notes); v9.02's widescreen Today is screen styling and did not move it.
#  4. DATA.open_items: R30 "VMS plan VMS001-26003-01 vs D025 Rev 02 — to confirm" with the four open points and source-caption conflicts; R16 and R23
#     gain one sentence each. The Questions page asks an open item the 1 Oct review table (QHIST) does not carry as an open
#     question (a wrap of questionsList_753) - on this base that is R30 alone.
#
# The base is read, not assumed: every replacement must match exactly once, the D025 markers and open items must be as found,
# and the patch refuses to run twice (vmsPlan905) or on a page older than v9.04 (GC500Refresh904). The footer is not touched.
#   toolchain/build.sh v905_vms v9.00_crew_vms_counts_DRAFT/patch_v900_vms.py
import copy, json, os, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')
MARK = 'vmsPlan905'
if MARK in s: sys.exit('v9.00 part D (the VMS plan) is already applied - stopping')
assert 'GC500Refresh904' in s, 'the base must be v9.04 or later (no GC500Refresh904) - stopping'

PLAN = 'VMS001-26003-01'
PLAN_FILE = 'VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf'   # the attachment's own file name; the catalogue key, nothing hosted
DOC = {
    'id': PLAN_FILE, 'kind': 'map', 'group': 'issued',
    'title': 'VMS001-26003-01 · 2026 Gold Coast 500 VMS Plan (iEDM) · 17 pages · received 8 Oct 2026',
    'name': PLAN_FILE, 'ext': 'pdf', 'project_no': '26003', 'year': 2026,
    'note': ('Received from the project manager on 8 Oct 2026, about 11:00 AEST: "please see attached update of vms boards". '
             'A PowerPoint export of 2 Sep 2026; no title block or revision box is printed on it. '
             'Under review: whether it replaces D025 Rev 02 is still to be confirmed (open item R30), so no position, count or '
             'charge on this page has moved for it; its cross-references are in words on the D025 sheet. '
             'Not hosted: no file is uploaded, because its photographs show the trailers\' phone numbers and its file details '
             'carry a personal name. It is listed by name only.')}

# the plan's own words for the four boards D025 does not have (pages 7 and 17), as both independent transcriptions read them
ONLY_IN_PLAN = [
    ('21', 'STAGHORN AVE / SURFERS PARADISE BOULAVARD INTERSECTION (EAST BOUND)'),
    ('22', 'SOUTH OF SUNDALE BRIDGE (NORTHBOUND TRAFFIC) IN THE TRAFFIC SWITCH LANE AT TEDDER AVE INTERSECTION'),
    ('23', 'GC HIGHWAY (NORTH OF SUNDALE BRIDGE) ON THE EASTERN SIDE OF THE ROAD FOR SOUTHBOUND TRAFFIC'),
    ('24', 'THE ESPLANADE BEFORE STAGHORN AVE INTERSECTION (NORTH BOUND)')]
SHEET_NOTE = ('In the iEDM plan, not on D025: ' + '; '.join(f'{n} "{w}"' for n, w in ONLY_IN_PLAN) + '. '
              'The plan\'s words as printed; no marker is drawn for them (iEDM VMS plan VMS001-26003-01, under review as R30).')
# the cross-reference each D025 marker carries (the plan's numbering beside D025's)
NOTES = {'2A': 'plan 02a', '5A': 'plan 05a', '7A': 'plan 07a',
         '04A': 'plan: 03a (the plan moves 03 to this spot; it has no 04a)',
         '15': 'plan 15* — installed at the conclusion of track activity, stored T2 runoff',
         '18': 'plan 18* — Roadtek to remove/install Fri/Sat/Sun',
         '1O': 'D025 itself types 1O'}
FACES = {'1O': '10'}

R16_ADD = ('The iEDM VMS plan VMS001-26003-01, received 8 Oct 2026, shows 24 boards plus 4 moves; whether that replaces the '
           'project manager\'s 1 Oct answer of 22 is open under R30.')
R23_ADD = ('The iEDM VMS plan VMS001-26003-01 (exported 2 Sep 2026, the day D025 Rev 02 was plotted) was received on 8 Oct 2026 '
           'and differs from D025 on several boards; which of the two governs is open under R30.')
R30 = {'id': 'R30', 'title': 'VMS plan VMS001-26003-01 vs D025 Rev 02 — to confirm',
       'finding': ('The iEDM VMS plan VMS001-26003-01 (17 pages, a PowerPoint export of 2 Sep 2026) was received from the project '
                   'manager on 8 Oct 2026. He has not yet said whether it replaces D025 Rev 02, so the page changes words only: no '
                   'position, count or charge has moved for it. Open points: (1) which drawing governs, the plan or D025 Rev 02; '
                   '(2) 03a vs 04A: the plan moves board 03 to the highway outside Gate 1 and has no 04a, where D025 moves board 04 '
                   'there as 04A; (3) 4 or 5 moves on 19 Oct: the plan moves four boards (02, 03, 05, 07), the schedule\'s T0159 '
                   'says five; (4) boards 21–24 are in the plan and not on D025. Two source-caption conflicts also need confirmation: '
                   'page 17 labels board 21 Staghorn Avenue, but its map/photo depicts Ocean Avenue; page 15 labels board 17* '
                   'storage T10, but its map depicts T11. Page 15 assigns board 18* removal/installation to Roadtek; do not '
                   'count it as Coates event crew work without a confirmed reassignment. Confirmed by the project manager on 8 Oct: '
                   'T0103 carries VMS09 and VMS10; asset 1211404 is VMS09, moved from T0001. The VMS register carries those '
                   'answers and any later record changes. The branch still needs to check that contract line 1 was off-hired '
                   'or transferred; the same board also appears on line 12.'),
       'priority': 'The project manager\'s answer on each point. Until then D025 Rev 02 stays the drawing the page works to.',
       'status': 'Open'}
ADDED_WORDS = [DOC['title'], DOC['note'], SHEET_NOTE, R16_ADD, R23_ADD, R30['title'], R30['finding'], R30['priority'], *NOTES.values(), *FACES.values()]
for w in ADDED_WORDS:   # no money, no phone number, no email in anything this part adds
    assert '$' not in w and '@' not in w and not re.search(r'\b0\d(?:[ -]?\d){8}\b|\b13\d{4}\b|\b1[38]00(?:[ -]?\d){6}\b', w), w
    assert 'Andrew Fisher' not in w, w

# ---- DATA: one line, round-trips exactly
i = s.find('const DATA = '); assert i >= 0 and s.count('const DATA = ') == 1, 'const DATA = must appear once'
j = s.find('\n', i); line = s[i:j]; assert line.endswith(';'), 'the DATA line must end with ;'
D = json.loads(line[len('const DATA = '):-1]); ORIG = copy.deepcopy(D)
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA must round-trip exactly - stopping'

# 1. Documents
docs = D['docs']['docs']
assert not any(PLAN in json.dumps(d, ensure_ascii=False) for d in docs), 'the plan is already listed - stopping'
d25 = [k for k, d in enumerate(docs) if d.get('id') == 'D025-26003-02-VMS.pdf']
assert len(d25) == 1 and docs[d25[0]].get('group') == 'issued' and docs[d25[0]].get('kind') == 'map', 'D025 must be listed once, as issued'
counts = D['docs'].get('counts') or {}
maps_before = sum(1 for d in docs if d.get('kind') == 'map')
docs.insert(d25[0] + 1, DOC)
if counts.get('map') == maps_before: counts['map'] = maps_before + 1   # the catalogue count follows when it was in step

# 2. D025: marker notes, the 1O face, the sheet note
sh = [x for x in D['sheets'] if x.get('key') == 'D025']
assert len(sh) == 1 and sh[0].get('sheet_id') == 'D025-26003-02', 'one D025 sheet'
sh = sh[0]
assert 'note' not in sh, 'D025 already carries a sheet note - stopping'
labels = [m.get('label') for m in sh['markers']]
assert len(sh['markers']) == 27 and len(set(labels)) == 27, 'D025 must carry its 27 markers, each label once'
for lab in NOTES:
    m = [x for x in sh['markers'] if x.get('label') == lab]
    assert len(m) == 1 and m[0].get('kind') == 'vms' and m[0].get('marker_kind') == 'label', f'D025 marker {lab} not as found'
    assert 'note' not in m[0] and 'face' not in m[0] and 'layer' not in m[0], f'D025 marker {lab} already carries words'
    m[0]['note'] = NOTES[lab]
    if lab in FACES: m[0]['face'] = FACES[lab]
assert [x for x in sh['markers'] if x['label'] == '1O'][0].get('off_plan') == 'Off-site reference note', '1O must be D025\'s off-site note'
for lab, _ in ONLY_IN_PLAN: assert lab not in labels, f'{lab} is on D025 after all - stopping'
sh['note'] = SHEET_NOTE

# 4. open items
OI = D['open_items']; ids = [o['id'] for o in OI]
assert ids == [f'R{n:02d}' for n in range(1, 30)] + [f'TX0{n}' for n in range(1, 6)], 'open items not as found: ' + ','.join(ids)
for o, add in ((OI[15], R16_ADD), (OI[22], R23_ADD)):
    assert o['id'] in ('R16', 'R23') and PLAN not in o['finding'] and o['finding'].endswith('.'), o['id'] + ' not as found'
    o['finding'] = o['finding'] + ' ' + add
assert OI[15]['title'] == 'VMS supply must be separated from relocation' and OI[22]['title'].startswith('2026 (project 26003) drawings received')
assert all(set(o) == set(R30) for o in OI), 'every open item carries the same keys as R30'
OI.append(R30)   # R30: the next free number in the R series (TX is the carrier list's own series)

# nothing else in DATA moves: every other key, every other sheet, every other document and open item, every marker's position
for k in D:
    if k not in ('docs', 'sheets', 'open_items'): assert D[k] == ORIG[k], 'DATA.' + k + ' changed - stopping'
assert set(D) == set(ORIG)
assert {k: v for k, v in D['docs'].items() if k not in ('docs', 'counts')} == {k: v for k, v in ORIG['docs'].items() if k not in ('docs', 'counts')}
assert [d for d in D['docs']['docs'] if d is not DOC] == ORIG['docs']['docs'], 'only the plan is added to Documents'
for a, b in zip(D['sheets'], ORIG['sheets']):
    if a.get('key') != 'D025': assert a == b, 'sheet ' + str(a.get('key')) + ' changed'
    else:
        assert {k: v for k, v in a.items() if k not in ('markers', 'note')} == {k: v for k, v in b.items() if k != 'markers'}
        for ma, mb in zip(a['markers'], b['markers']):
            assert {k: v for k, v in ma.items() if k not in ('note', 'face')} == mb, 'a D025 marker moved: ' + mb['label']
assert len(D['sheets']) == len(ORIG['sheets'])
assert OI[:-1] == [dict(o, finding=o['finding'] + (' ' + R16_ADD if o['id'] == 'R16' else ' ' + R23_ADD if o['id'] == 'R23' else '')) for o in ORIG['open_items']]
s = s[:i] + 'const DATA = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]

# ---- the D025 sheet note under the map, before the map hint (renderMap_held)
s = rep(s, """<p class="maphint"><b>${esc(sh.subtitle)}</b> —drag to pan""",
        """${sh.note ? `<p class="maphint" data-sheet-note905>${esc(sh.note)}</p>` : ''}
 <p class="maphint"><b>${esc(sh.subtitle)}</b> —drag to pan""", 'the sheet note under the map', str(p))
# ---- a marker that carries a face of its own (D025's 1O reads 10) heads its tooltip and accessible name with it; layer markers
# on the master plan keep their label (their face is a short code)
s = rep(s, """ : m.note ? m.label + ' — ' + m.note
 : (m.label || '');""", """ : m.note ? (m.layer ? m.label : m.face || m.label) + ' — ' + m.note
 : (m.label || '');""", 'the marker tooltip', str(p))
s = rep(s, """ : m.note ? m.label + ' — ' + m.note
 : 'callout ' + (m.label || 'unlabelled') + ', no schedule row linked');""", """ : m.note ? (m.layer ? m.label : m.face || m.label) + ' — ' + m.note
 : 'callout ' + (m.label || 'unlabelled') + ', no schedule row linked');""", 'the marker accessible name', str(p))
# ---- the card a tap on an unclaimed callout opens: its face and its note (a phone has no tooltip). The stored label still
# goes to the record form and the add-an-asset prefill, unchanged.
s = rep(s, """function emptyCallout(sh, labels){
 const label = labels[0] || '', where = 'callout ' + label + ' on ' + sh.sheet_id;""", """function emptyCallout(sh, labels){
 const label = labels[0] || '', where = 'callout ' + label + ' on ' + sh.sheet_id;
 const mk905 = ((sh && sh.markers) || []).find(x => x.marker_kind !== 'note' && x.label === label) || {}, shown905 = mk905.face && !mk905.layer ? 'callout ' + mk905.face + ' on ' + sh.sheet_id : where; /* v9.05 - the callout's own words, from the drawing data */""",
        'the callout card: its marker', str(p))
s = rep(s, """d.setAttribute('aria-label', 'Nothing recorded at ' + where);""", """d.setAttribute('aria-label', 'Nothing recorded at ' + shown905);""",
        'the callout card: its name', str(p))
s = rep(s, """d.innerHTML = `<div class="mkpick-h"><b>${esc(where)}</b> — no schedule row names this place<button class="close" aria-label="Close" title="Close">&times;</button></div>""",
        """d.innerHTML = `<div class="mkpick-h"><b>${esc(shown905)}</b> — no schedule row names this place<button class="close" aria-label="Close" title="Close">&times;</button></div>
 ${mk905.note ? `<p class="norate" data-callout-note905 style="margin:0 6px 8px">${esc(mk905.note)}</p>` : ''}""",
        'the callout card: its note', str(p))

# ---- the Today line and the Questions item: wraps, after every script that defines or wraps what they wrap
assert s.count('const handling875Groups=todayGroupDetails841;') == 1, 'the v8.75 VMS note (todayGroupDetails841 wrap) must be there'
assert len(re.findall(r'\bfunction todayGroupDetails841\(', s)) == 1 and len(re.findall(r'\bfunction questionsList_753\(', s)) == 1
assert len(re.findall(r'\bconst QHIST = \[', s)) == 1 and len(re.findall(r"\bconst QH_OPEN = 'open'", s)) == 1
JS = r"""<script>
/* Author: Andrew Fisher. v9.05 (v9.00 part D) - the iEDM VMS plan VMS001-26003-01, received 8 Oct 2026, in words only.
   The project manager has not said whether it replaces D025 Rev 02, so nothing here moves a position, a count or a charge.
   The words are in DATA (the Documents entry, the D025 sheet and seven of its markers, open items R16, R23 and R30); this
   script shows two of them where people read them:
   - Today, the VMS boards card: one line beside the v8.75 source note, with the schedule total and the BOQ figure read where
     that note reads them;
   - Questions: an open item in DATA.open_items that the 1 Oct review table (QHIST) does not carry is asked as an open
     question (on v9.04 that is R30 alone). */
(function vmsPlan905(){
 const PLAN = 'VMS001-26003-01';
 if (typeof todayGroupDetails841 === 'function') {
  const groups0 = todayGroupDetails841;
  todayGroupDetails841 = function (...args){ /* v9.05 wrap: todayGroupDetails841 */
   const r = groups0.apply(this, args);
   try {
    const v = r && r.vms, review = DATA.schedule_review875 || {};
    if (v && v.health && v.health.ready && Array.isArray(v.notes) && Array.isArray(v.groups)) {
     const total = v.groups.reduce((n, g) => n + ((g && g.summary && g.summary.total) || 0), 0);
     const line = 'Schedule ' + total + ' · iEDM plan ' + PLAN + ': 24 boards + 4 moves · BOQ ' + (review.vms_boq == null ? '—' : review.vms_boq)
      + ' · the project manager\'s 1 Oct answer: 22';
     if (!v.notes.includes(line)) v.notes.push(line);
    }
   } catch (err) { console.error('VMS plan', err); }
   return r;
  };
 }
 if (typeof questionsList_753 === 'function' && typeof QHIST !== 'undefined' && typeof QH_OPEN !== 'undefined') {
  const list0 = questionsList_753;
  questionsList_753 = function (...args){ /* v9.05 wrap: questionsList_753 */
   const Q = list0.apply(this, args);
   try {
    const reviewed = new Set(QHIST.map(h => h[0]));
    (DATA.open_items || []).forEach(o => {
     if (!o || !o.id || reviewed.has(o.id) || !/^open\b/i.test(String(o.status || '')) || Q.some(q => q.id === 'oi-' + o.id)) return;
     Q.push({group: 'Schedule & plant', id: 'oi-' + o.id, q: o.id + ' - ' + (o.title || ''), why: o.finding || '', need: o.priority || '', go: 'docs', st: QH_OPEN});
    });
   } catch (err) { Q.fails = (Q.fails || []).concat('open items added since the review'); }
   return Q;
  };
 }
})();
</script>
"""
k = s.rfind('</body>'); assert k > 0, 'no </body>'
s = s[:k] + JS + s[k:]
assert s.count(MARK) == 1
p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + s.encode('utf-8'))
print(f'v9.00 part D (VMS plan): Documents +1 ({PLAN}), D025 {len(NOTES)} marker notes + 1 face + the sheet note, open items R30 + R16/R23 '
      f'one sentence each, Today one line, Questions R30 · {len(raw):,} -> {len(s.encode("utf-8")) + (3 if bom else 0):,} bytes')
