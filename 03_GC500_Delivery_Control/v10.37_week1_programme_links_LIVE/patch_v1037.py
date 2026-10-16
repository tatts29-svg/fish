"""Author: Andrew Fisher. Week 1's signed agreements matched to the 2026 fencing programme, v10.37 (Andrew, 16 Oct 2026:
"You should be able to match with schedule and maps, or close to, to understand this more, like you have been doing").
The same reviewed-link catalogue v9.58 built for week 2 (a link needs the one exact current docket, its photographed
paper's hash, the verified programme file and one unchanged programme row; anything moved withholds the link) now
carries ten of the sixteen week-1 agreements against their CON WK1 rows, and the CCB review catalogue (v8.47) carries
36611 confirmed as Event on programme row 46 and 36613 pending. The six agreements the programme has no row for
(36601 Commodore Park, 36602 Cove Optus, 36613 Porsche C2 CCB, 36614 S08 BOH, 36615 Gate 5 compound, 36616 Triangle
C2) are named in the README, not guessed. Footer v10.36 -> v10.37.

    python3 patch_v1037.py path/to/page.html
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

REC = HERE.parent / 'record_16Oct2026_hire_agreements_36601_36616'
PROGRAMME_ID = 'GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'
EXPECTED_FIELDS = ['id', 'docket_no', 'date', 'week', 'location', 'quantities', 'components', 'note', 'source']

# docket -> (primary CON WK1 row, the other rows the paper's notes name, basis)
LINKS = {
    '36603': (16, [17, 18, 19, 21, 22, 23, 25, 26], "The paper's notes name the runs row by row: Residents Amira to Norfolk (row 16), Demarcation Cable St to Breaker St (17), Ocean Isles to Amari (18, residents and demarcation), Residents Amani to SLS Tower (19), Demarcation T11 DL and T11 Runoff (21; the flat-feet T11 DL is 36604), Residents and Demarcation Norfolk to Decks (22, 23), Residents Bougainvillea to Sunbird West (25), Demarcation Ocean Resort to Sunbird West (26). Programme allowance across those rows 553 m clean, 767 m demarcation CCB, 6 pedestrian gates; the paper's signed actuals are 537.5 m, 672.5 m and 4. Linked to row 16 as the first run named; the others are in this basis."),
    '36604': (20, [], "Breaker St, T11 DL: the programme's one flat-feet row, 90 m of CCB Flat Feet on 13 Oct; the paper's signed actual is 93 m, 42 pieces."),
    '36605': (36, [], "Aloha Lane to Cronin St (Crest): the programme's row 36, Residents Fence Aloha Lane & Crest & Fishermans Walk (Cronin), 150 m clean with 2 pedestrian gates, dated 14 Oct; the paper is 95 m on 13 Oct. 36606 (Fishermans Walk, 10 m) is the Breaker St end, row 32."),
    '36606': (32, [], "Fishermans Walk: row 32, Residents Fence Fishermans Walk - Breaker Street, 10 m clean with 1 pedestrian gate, 14 Oct; the paper is 10 m on 13 Oct, no gate."),
    '36607': (34, [], "Main Beach Tower: row 34, Residents Fence Main Beach Tower, 38 m clean with 1 pedestrian gate, 14 Oct; the paper is 47.5 m, no gate."),
    '36608': (13, [12, 11], "Ferny Ave to Narrow Neck Court: row 13, Residents Fence Pacific Point to Narrowneck, 70 m clean, with row 12 Equinox 19 m (89 m against the paper's 117.5 m); the paper's demarcation CCB 192.5 m, written as 'Demarcation - S05 to Ferny Ave', has only row 11 (Demarcation CCB Ferny Avenue East, 60 m) on the programme, so most of that run is beyond the programme's rows."),
    '36609': (40, [41, 39], "Esplanade south of Meriton, Porsche Lounge C2: rows 40 and 41, Perimeter Fence Support Categories on The Esplanade, 135 + 180 = 315 m clean, with row 39, Exclusion Zone Porsche Lounge CZ, 35 m (350 m against the paper's 420 m, not scrimmed as John IEDM asked)."),
    '36610': (35, [29, 31, 33, 30], "G8 and surround: the paper's notes name Contessa West (row 29, 70 m), Axis to Malibu (row 35, 123 m with 1 pedestrian gate; row 30 Axis 48 m beside it), Aloha Lane - Breaker St (row 31, 36 m) and Demarcation Aloha Lane to T12 Runoff (row 33, 139 m CCB). Programme 229-277 m clean and 139 m demarcation CCB against the paper's 367.5 m and 200 m with 2 gates. Linked to row 35 as the largest run named."),
    '36611': (45, [47, 46], "Surfers Paradise Light Rail: rows 45 and 47, Perimeter Fence Hi Surf West 70 m and SPLRS 100 m clean (170 m against the paper's 165 m), and row 46, CCB Hi Surf West to Ocean Ave, 115 m CCB Event, which is why the paper's 130 m of CC barrier is recorded as Event."),
    '36612': (44, [], "Pacific Ave to Cable St: row 44, Residents Fence Cable St & Pacific St, 300 m clean with 10 vehicle and 2 pedestrian gates, 15 Oct; the paper is 315 m with 3 pedestrian gates."),
}
UNMATCHED = {'36601': 'Commodore Park ticket entry', '36602': 'Cove - Optus', '36613': 'Porsche C2 (CCB)', '36614': 'S08 BOH', '36615': 'Gate 5 Compound', '36616': 'Triangle C2'}


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if "+ ' · v10.36'" not in html: sys.exit('patch_v1037: not the v10.36 line - wrong base')
    if 'week1-links-1037' in html: sys.exit('patch_v1037 refuses a repeat')
    start = html.index('const DATA = ') + len('const DATA = ')
    data, n = json.JSONDecoder().raw_decode(html[start:]); end = start + n
    if json.dumps(data, ensure_ascii=False, separators=(',', ':')) != html[start:end]: sys.exit('patch_v1037: DATA does not round-trip')
    # the records as this folder's apply reports hold them (36611 after its correction)
    recs = {}
    for rp in sorted(REC.glob('report_*.json')):
        r = json.loads(rp.read_text(encoding='utf-8'))
        for k, v in (r.get('docs', {}).get('after') or {}).items():
            if k.startswith('fenceDockets/') and v: recs[str(v['docket_no'])] = v
    photos = {}
    for up in REC.glob('photo_upload_*.json'):
        for x in json.loads(up.read_text(encoding='utf-8'))['uploaded']: photos[x['name']] = x['sha256']
    ws = [w for w in data['fencing']['week_sheets'] if w['sheet'] == 'CON WK1']
    if len(ws) != 1: sys.exit('patch_v1037: CON WK1 sheet missing or duplicated')
    prow = {r['source_row']: r for r in ws[0]['programme_rows951']}
    m = re.search(r'const FENCE_PROGRAMME958 = (\{.*?\});\n', html, re.S)
    if not m: sys.exit('patch_v1037: FENCE_PROGRAMME958 not found')
    cat = json.loads(m.group(1))
    have = {r['docket_no'] for r in cat['rows']}
    sources = {s['id']: s for s in cat['sources']}
    if PROGRAMME_ID not in sources: sys.exit('patch_v1037: the reviewed programme source is not in the catalogue')
    for no, (row, others, basis) in LINKS.items():
        if no in have: sys.exit('patch_v1037: ' + no + ' already linked')
        d = recs.get(no); 
        if not d: sys.exit('patch_v1037: no record snapshot for ' + no)
        if (no + '.jpg') not in photos: sys.exit('patch_v1037: no photo hash for ' + no)
        if row not in prow: sys.exit('patch_v1037: programme row ' + str(row) + ' missing')
        for o in others:
            if o not in prow: sys.exit('patch_v1037: programme row ' + str(o) + ' missing')
        sources[no + '.jpg'] = {'id': no + '.jpg', 'sha256': photos[no + '.jpg'], 'title': 'Signed hire agreement ' + no}
        expected = {k: d[k] for k in EXPECTED_FIELDS}; expected['programme_sheet'] = 'CON WK1'  # allDockets() derives the programme sheet from the work week; the consumer requires it in the snapshot
        task = prow[row]
        cells = sorted({e['cell'] for e in (task.get('quantity_evidence') or {}).values()} | {'C%d' % row, 'D%d' % row})
        cat['rows'].append({'record_id': d['id'], 'docket_no': no, 'expected': expected, 'source_ids': [PROGRAMME_ID, no + '.jpg'],
                            'programme': {'sheet': 'CON WK1', 'row': row, 'cells': cells, 'expected': task},
                            'also_rows': [{'row': o, 'description': prow[o]['description'], 'quantities': prow[o]['quantities']} for o in others],
                            'basis': basis + ' Signed actual quantities and dates remain authoritative; this link does not confirm the whole area is finished.'})
    cat['sources'] = list(sources.values())
    cat['week1_links_1037'] = {'reviewed_on': '2026-10-16', 'author': 'Andrew Fisher', 'unmatched': UNMATCHED,
                               'basis': 'Ten of the sixteen agreements of 12-15 Oct 2026 name a CON WK1 task; the six without a programme row are listed and not guessed. The CW1 installation-plan pages are not yet traced on the map, so these links are to the programme, not to a map area.'}
    new_const = 'const FENCE_PROGRAMME958 = ' + json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + '; /* week1-links-1037 */\n'
    html = html[:m.start()] + new_const + html[m.end():]
    # CCB review: 36611 confirmed Event on row 46; 36613 pending
    rev = data['fence_ccb_review847']
    d11, d13 = recs['36611'], recs['36613']
    if 'ccb_event' not in d11['quantities']: sys.exit('patch_v1037: 36611 must be corrected on the record (ccb_event) before this patch is built')
    for no in ('36611', '36613'):
        if any(r.get('docket_no') == no for r in rev['rows']): sys.exit('patch_v1037: review row for ' + no + ' already there')
    rev['sources'].append({'id': PROGRAMME_ID, 'sha256': sources[PROGRAMME_ID]['sha256'], 'title': 'Reviewed 2026 fencing programme'})
    for no, d in (('36611', d11), ('36613', d13)): rev['sources'].append({'id': no + '.jpg', 'sha256': photos[no + '.jpg'], 'title': 'Signed hire agreement ' + no})
    exp = lambda d: {k: d[k] for k in ('date', 'location', 'quantities', 'components', 'note')}
    rev['rows'].append({'record_id': d11['id'], 'docket_no': '36611', 'expected': exp(d11), 'source_ids': [PROGRAMME_ID, '36611.jpg'],
                        'decision': {'state': 'confirmed', 'type': 'ccb_event', 'basis': "Programme CON WK1 row 46, 'CCB - Hi Surf (West) to Ocean Ave', 15 Oct 2026, is 115 m of CCB Event at the Surfers Paradise Light Rail Station; rows 45 and 47 are its fence. The paper says only CC Barrier 130 m; the signed 130 m is kept and booked to Event."}})
    rev['rows'].append({'record_id': d13['id'], 'docket_no': '36613', 'expected': exp(d13), 'source_ids': [PROGRAMME_ID, '36613.jpg'],
                        'decision': {'state': 'pending', 'type': 'ccb_demarc', 'basis': "Porsche C2, 70 m / 28 barriers, 15 Oct 2026. The paper says only CC Barrier. The programme's nearest rows are 38 (Demarcation CCB S18 Grandstand to The Esplanade, 117 m, 14 Oct) and 63 (CCB Pacific Plaza to The Triangle, 285 m Event, 16 Oct); neither names the Porsche Lounge, so the demarcation booking stands pending the project manager's call."}})
    html = html[:start] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + html[end:]
    html = rep(html, "+ ' · v10.36'", "+ ' · v10.37'", 'Release footer', str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1037 applied: %d week-1 agreements linked to CON WK1 rows, 36611 confirmed Event and 36613 pending in the CCB review; footer v10.36 -> v10.37' % len(LINKS))


if __name__ == '__main__':
    main()
