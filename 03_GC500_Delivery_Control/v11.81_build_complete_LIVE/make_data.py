"""Author: Andrew Fisher. v11.81 - builds data_v1181.json (two crowd-control review rows and one evidence operation the patch
writes into the page) from snapshots_24Oct2026.json, the page's own reading of the current record taken on live v11.79 by
tests/probe_gen.cjs (GET only). Same mechanism and rules as v11.63's make_data.py: every expected snapshot is the record exactly
as it stands, so a later change to any of these records makes its row stale again by the page's own check.

    python3 make_data.py
"""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
S = json.loads((HERE / 'snapshots_24Oct2026.json').read_text(encoding='utf-8'))
PROG = 'GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'
RULE = ("Our dockets and what has been invoiced are the truth (the project manager's rule, 22 Oct 2026); the build is complete at the"
        " numbers we hold (his ruling of 24 Oct 2026: \"we work off number we have for completion of build\").")
BASIS = {
 '36766': "Docket 36766 stands as recorded: CC barrier 10 m (4 barriers) at the Smoking Zone, Breaker St, 23 Oct 2026, is Event. The paper"
          " does not name the category; smoking zones have been Event since the project manager accepted it on 2 Oct (programme CON WK3"
          " smoking rows and EVENT WEEK row 11 are Event), he was told Event would be recorded unless he said otherwise, and he has not.",
 '36768': "Docket 36768 stands as recorded: CC barrier 50 m (20 barriers) at Club 500 back of house, 23 Oct 2026, is Event. The paper"
          " does not name the category and no programme row asks for it; the Club 500 crowd control on the programme (creek protection,"
          " CON WK2 row 14) and on the record (36643, 36647) is Event, he was told Event would be recorded unless he said otherwise, and he has not.",
}
TAIL = " Advanced's sheet decides its supplier line when it comes; a change to the docket makes this review stale until it is read again."
rows, sources = [], []
for no, v in S['ccb'].items():
    exp = v['expected']; q = exp['quantities']
    types = [k for k in ('ccb_event', 'ccb_demarc') if (q.get(k) or 0) > 0]
    assert types == ['ccb_event'], (no, q)
    photo = no + '.jpg'
    rows.append({'record_id': v['id'], 'docket_no': no, 'expected': exp, 'source_ids': [photo, PROG],
                 'decision': {'state': 'confirmed', 'type': 'ccb_event', 'basis': RULE + ' ' + BASIS[no] + TAIL}})
    sources.append({'id': photo, 'sha256': S['photos'][photo], 'title': 'Signed hire agreement ' + no})
g = S['green']['24492']
assert g['metres'] == 30 and g['usable'] is True, g
ops = [{'id': 'physical-relocation-24492', 'type': 'relocation', 'quantity': 30, 'unit': 'm', 'source_ids': ['24492.jpg'],
        'source_refs': [{'id': '24492.jpg', 'page': 1}], 'records': [{'book': 'green', 'record_id': g['id'], 'number': '24492', 'expected': g}],
        'red_overlap': S['overlap']['relocation'],
        'basis': "Signed service note 24492 records 'Relocated 30 m.' at the Transporter Compound (The Spit), 22 Oct 2026, the day after hire"
                 " agreement 36757 put 70 m of fence there. Existing fence moved; no new mesh length; the half hour stays counted once on the note."}]
ev_sources = [{'id': '24492.jpg', 'sha256': S['photos']['24492.jpg'], 'title': 'Signed service note 24492'}]
for x in ev_sources + sources: assert x['sha256'] and len(x['sha256']) == 64, x
out = {'schema': 1, 'author': 'Andrew Fisher', 'read_on': '2026-10-24', 'ccb': {'rows': rows, 'sources': sources},
       'evidence': {'operations': ops, 'sources': ev_sources}}
(HERE / 'data_v1181.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('rows', len(rows), 'ccb sources', len(sources), 'ops', len(ops), 'reloc m', sum(o['quantity'] for o in ops))
