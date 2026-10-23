"""Author: Andrew Fisher. v11.63 - builds data_v1163.json (the crowd-control review rows and the evidence operations the patch
writes into the page) from snapshots_23Oct2026.json, the page's own reading of the current record taken on the live v11.62
page by tests/probe_gen.cjs (GET only). Every expected snapshot is the record exactly as it stands; a later change to any of
these records makes its row stale again by the page's own check, so nothing here can outlive the record it was read from.

    python3 make_data.py
"""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
S = json.loads((HERE / 'snapshots_23Oct2026.json').read_text(encoding='utf-8'))
PROG = 'GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'
RULE = "Our dockets and what has been invoiced are the truth (the project manager's rule, 22 Oct 2026)."
STALE = {'36560', '36568', '36603', '36611'}
REFRESH = (" Refreshed 23 Oct 2026: the record now also carries the braced-for-scrim metres Advanced's construction-week sheet bills on"
           " this paper (record correction of 23 Oct 2026); the crowd-control metres and their category are unchanged.")
BASIS = {
 '36623': "Docket 36623 stands as recorded: CC barrier 100 m (40 barriers) is Demarcation in the paper's own words ('S15, C.2 - Hoarding Fence + Demarcation'); programme EVENT WEEK row 10 (19 Oct): Demarcation CCB - Admiralty Dr to S13 Grandstand, 99 m.",
 '36627': "Docket 36627 stands as recorded, split: of the four spots on the paper, PB2 / cnr Pacific & Breaker St 50 m, The Hill & Merchandise BS08-BS09 62.5 m and S01-S05 Corporate 12.5 m are crowd control (Event 125 m); the bird's nest on Macintosh Island 7.5 m is an exclusion around a hazard (Demarcation 7.5 m, as the fallen tree on 36760).",
 '36629': "Docket 36629 stands as recorded, split on the programme's request for the Gate 1 entry (EVENT WEEK rows 13-16, 19 Oct): Demarcation CCB PB03 to S23 Grandstand 131 m and PB03 to Median Strip 51 m (Demarcation 182.5 m, to the barrier); Gate 1 Queueing 110 m and Gate 1 Entry, Volunteer Sign-on & Ticket Box 98 m (Event; the balance of the paper, 237.5 m).",
 '36634': "Docket 36634 stands as recorded: CC barrier 12.5 m (5 barriers) at the S07 viewing mound is Demarcation, as the viewing mound's CCB of 22 Sep (36542, 60 m) is on the record (record correction of 23 Oct 2026).",
 '36635': "Docket 36635 stands as recorded: CC barrier 37.5 m (15 barriers), Esplanade north to the Triangle, is Event: the programme's own line for it (EVENT WEEK row 55, 22 Oct) carries its metres in the Event column and the Esplanade's CCB of 16 Oct (36619) is Event on the record (record correction of 23 Oct 2026). The 35 m of flat feet is its own line.",
 '36636': "Docket 36636 stands as recorded: CC barrier 205 m (82 barriers), Higman St and Rhapsody, is Demarcation: programme EVENT WEEK rows 21-23 (20 Oct) are the residents' demarcation runs (Demarcation CCB - Higman St (West), CCB - Higman St garden beds, Demarcation CCB - Rhapsody).",
 '36637': "Docket 36637 stands as recorded: CC barrier 25 m (10 barriers) at the Macintosh Island foot bridge is Event, crowd control on the spectator route; no programme row asks for demarcation there.",
 '36643': "Docket 36643 stands as recorded: CC barrier 20 m (8 barriers) at Club 500 is Event, crowd control at the Club 500 stage (programme EVENT WEEK row 54, 22 Oct, Perimeter Fence - Club 500 Stage).",
 '36645': "Docket 36645 stands as recorded: CC barrier 12.5 m (5 barriers) at the inlet on Breaker St is Demarcation: programme EVENT WEEK row 72 (22 Oct), Demarcation CCB - T12 Runoff to Inlet, 25 m.",
 '36647': "Docket 36647 stands as recorded: CC barrier 47.5 m (19 barriers) is more of the Club 500 creek protection, Event as its first run is on the record (36591, 9 Oct, 105 m, Event from the operational plan).",
 '36751': "Docket 36751 stands as recorded: CC barrier 315 m (126 barriers) on Ocean Ave is Event: programme EVENT WEEK rows 60-61 (22 Oct), CCB - Ocean Ave, 300 m Event.",
 '36755': "Docket 36755 stands as recorded: CC barrier 45 m (18 barriers) at the helipad is Event, crowd control at the helipad; no programme row asks for demarcation there.",
 '36760': "Docket 36760 stands as recorded: CC barrier 10 m (4 barriers) around a fallen tree on Macintosh Island is Demarcation, an exclusion around a hazard.",
 '36764': "Docket 36764 stands as recorded: CC barrier 15 m (6 barriers) at the Monster Energy compound on The Hill is Event, crowd control at the compound.",
}
TAIL = " Advanced's sheet decides its supplier line when it comes; a change to the docket makes this review stale until it is read again."
old_rows = {r['docket_no']: r for r in json.loads((HERE / 'existing_review_rows.json').read_text(encoding='utf-8'))}
rows, sources = [], []
for no, v in S['ccb'].items():
    exp = v['expected']; q = exp['quantities']
    if no in STALE:
        r = json.loads(json.dumps(old_rows[no])); r['expected'] = exp; r['decision']['basis'] = r['decision']['basis'].rstrip() + REFRESH
        rows.append(r); continue
    types = [k for k in ('ccb_event', 'ccb_demarc') if (q.get(k) or 0) > 0]
    dec = {'state': 'confirmed', 'basis': RULE + ' ' + BASIS[no] + TAIL}
    if len(types) == 1: dec['type'] = types[0]
    else: dec['type'] = 'split'; dec['split'] = {k: q[k] for k in ('ccb_event', 'ccb_demarc')}
    photo = no + '.jpg'
    rows.append({'record_id': v['id'], 'docket_no': no, 'expected': exp, 'source_ids': [photo, PROG], 'decision': dec})
    sources.append({'id': photo, 'sha256': S['photos'][photo], 'title': 'Signed hire agreement ' + no})
# evidence: the 24481 overlap refreshed; the relocations and removals on the papers added
def green_op(no, metres, basis):
    return {'id': 'physical-relocation-' + no, 'type': 'relocation', 'quantity': metres, 'unit': 'm', 'source_ids': [no + '.jpg'],
            'source_refs': [{'id': no + '.jpg', 'page': 1}], 'records': [{'book': 'green', 'record_id': S['green'][no]['id'], 'number': no, 'expected': S['green'][no]}],
            'red_overlap': S['overlap']['relocation'], 'basis': basis}
def blue_op(no, basis_extra=''):
    b = S['blue'][no]; panels = b['collected']['mesh_panel']; metres = panels * 2.5
    return {'id': 'physical-removal-' + no, 'type': 'removal', 'quantity': metres, 'unit': 'm', 'source_ids': [no + '.jpg'],
            'source_refs': [{'id': no + '.jpg', 'page': 1}], 'records': [{'book': 'blue', 'record_id': b['id'], 'number': no, 'expected': b}],
            'red_overlap': S['overlap']['removal'],
            'basis': f"{panels} mesh panel{'s' if panels != 1 else ''} collected; {panels} x settled 2.5 m = {metres:g} m, as collections 28551-28553 and Advanced's week 4 sheet count removal. Collected counts only; no charge or credit from the form.{basis_extra}"}
ops = [
 green_op('24482', 22.5, "Signed service note 24482 records 'Relocate 22.5 m temp fence' at the Admiralty Dr intersection, 19 Oct 2026. The 70 m of crowd-control barriers moved on the same note is not fence and is not added, as 24471's barrier move is not. Existing fence moved; no new mesh length."),
 green_op('24483', 17.5, "Signed service note 24483 records 'Relocate 17.5 m temporary fence' at the S04 back of house / corporate entry, 20 Oct 2026. Existing fence moved; no new mesh length."),
 green_op('24484', 80, "Signed service note 24484 records 'Relocated panels from Helen Park C.Z to B.O.H. Braced & Scrim, 80 m', 20 Oct 2026. Existing fence moved; its scrim is on hire agreement 36629; no new mesh length."),
 green_op('24490', 27.5, "Signed service note 24490 records 'Relocate 27.5 m temp fence' at the TV compound, 22 Oct 2026 (the labour hire agreement 36758 points to). Existing fence moved; no new mesh length."),
]
for no in ['28554', '28556', '28557', '28558', '28559', '28560', '28566', '28567', '28569', '28571', '28572', '28575', '28577', '28578']:
    extra = ''
    if no in ('28577', '28578'): extra = ' The crowd-control barriers collected on the same form are not fence and are not added.'
    ops.append(blue_op(no, extra))
refresh24481 = {'id': 'physical-scrim_existing-24481', 'red_overlap': S['overlap']['scrim24481'],
  'basis_add': " Refreshed 23 Oct 2026: hire agreement 36614, the paper this note names, now carries 85 m braced for scrim, the metres Advanced's week 1 sheet bills on it (record correction of 23 Oct 2026); that is counted once, under Scrim fitted. This activity line keeps the note's 120 m as activity only and adds nothing to any programme figure."}
ev_sources = [{'id': o['source_ids'][0], 'sha256': S['photos'][o['source_ids'][0]], 'title': ('Signed service note ' if o['type'] == 'relocation' else 'Collection form ') + o['records'][0]['number']} for o in ops]
for x in ev_sources + sources: assert x['sha256'] and len(x['sha256']) == 64, x
out = {'schema': 1, 'author': 'Andrew Fisher', 'read_on': '2026-10-23', 'ccb': {'rows': rows, 'sources': sources},
       'evidence': {'refresh': [refresh24481], 'operations': ops, 'sources': ev_sources}}
(HERE / 'data_v1163.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('rows', len(rows), 'ccb sources', len(sources), 'ops', len(ops), 'reloc m', sum(o['quantity'] for o in ops if o['type'] == 'relocation'), 'removal m', sum(o['quantity'] for o in ops if o['type'] == 'removal'))
