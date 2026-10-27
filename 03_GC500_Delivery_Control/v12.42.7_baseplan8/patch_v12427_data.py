"""v12.42.7 - Baseplan SuperCars (8), 27 Oct 2026, onto the page's contract lines. Author: Andrew Fisher.

Andrew, 27 Oct 2026: "Have you added all new contracts in..and removed cancelled", then "Work on 4".
The v10.26 reader (baseplan1026.apply) refreshes the lines (8) still has, adds the lines it adds and sends the lines it
no longer has to the source history. Held out as before: 9990776 (fencing, charged from Advanced's dockets) and 9968726
(superseded TV). Removed: the cancelled sheets 9973079 and 9994996. Decisions kept: the card governs where v10.29 held
the keyed rate; 9961976/17 (GN24 80 kVA) never came (v11.19). The site record stays authoritative for what stands where.
The workbook stays private: BASEPLAN8_XLSX names it, and its sha256 must match.
"""
import copy, datetime, hashlib, json, os, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'v10.26_milestone_banner_LIVE'))
import baseplan1026 as B

BP_SHA = '13f57669'  # prefix checked; the full hash is written to the page
HELD_OUT = {
    '9990776': "Fencing. The page charges fencing from Advanced's measured dockets at the 2026 street card (Andrew, 19 Sep 2026); this contract books the same scope.",
    '9968726': 'TV compound, superseded by 9992300-MEAD (v10.26).',
    '9973079': 'Cancelled (Baseplan (8) sheet "9973079-Cancelled"; Andrew, 27 Oct 2026: "i have canelled a couple").',
    '9994996': 'Cancelled (Baseplan (8) sheet "9994996 Cancelled"; Andrew, 27 Oct 2026).',
    '9994248': 'Not delivered on Baseplan (8) or our record (fence and barrier Pending, chairs Del Req on docket 26139948, delivery Quoted). Andrew, 28 Oct 2026: "has this been delivered this is probaly seperate" - held out until he confirms it came.',
}
QTY_AS_DATE = []
NEVER = {('9961976', 17): 'GN24 80 kVA 1276412 never came to site (Andrew, 22 Oct 2026; v11.19)',
         ('9994954', 19): 'Pee panels: already charged on WC09 from the card, 6 at $672.17 (Andrew, 28 Oct 2026: "Pee panels may of been on the toilet contract")',
         ('9994954', 20): 'Pee panel labour: with the pee panels already charged on WC09 (Andrew, 28 Oct 2026)',
         ('9992300', 12): 'EQ0003 boom 1286482: v11.05 (financialAssociation1105) adds and pins this line itself; importing it again conflicts'}


def read8(path):
    import openpyxl
    wb = openpyxl.load_workbook(Path(path), data_only=True, read_only=True)
    NEW, TABS = {}, {}
    for ws in wb.worksheets:
        title = ws.title.strip()
        if title == 'Delivery Dockets': continue
        m = re.fullmatch(r'(?:Hre Contract-)?(\d{7,8})\s*(?:-|\s)\s*([A-Za-z]+)', title)
        assert m, 'unexpected sheet ' + title
        con, br = m.group(1), m.group(2)
        if con in HELD_OUT: continue
        assert br in ('KINP', 'NVAC', 'STPS', 'MEAD'), title
        TABS[con] = (br, con + '-' + br)
        rows = list(ws.iter_rows(values_only=True)); H = list(rows[0])
        assert len(H) == 70 and H[1] == 'Status' and H[3] == 'Item' and H[-1] == 'Warehouse', 'columns ' + title
        H[0] = 'Line'
        for r in rows[1:]:
            if isinstance(r[0], bool) or not isinstance(r[0], (int, float)): continue
            d = dict(zip(H, r)); k = (con, int(d['Line']))
            if isinstance(d.get('Quantity'), datetime.datetime):  # 9992300: quantities formatted as dates (1900-01-01 = 1)
                d['Quantity'] = (d['Quantity'] - datetime.datetime(1899, 12, 31)).days; QTY_AS_DATE.append(f'{con}/{k[1]}={d["Quantity"]}')
            assert k not in NEW; NEW[k] = d
    wb.close()
    for k in NEVER: NEW.pop(k, None)
    return NEW, TABS


def main():
    page = Path(sys.argv[1]); html = page.read_text(encoding='utf-8')
    if 'baseplan_review12427' in html: sys.exit('refuses a repeat')
    xlsx = os.environ['BASEPLAN8_XLSX']; full = hashlib.sha256(Path(xlsx).read_bytes()).hexdigest()
    assert full.startswith(BP_SHA), 'wrong workbook'
    at = html.index('const DATA = ') + len('const DATA = ')
    D, n = json.JSONDecoder().raw_decode(html[at:])
    assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == html[at:at + n]
    before = copy.deepcopy(D); R = D['rental_on_hire']
    oldrows = {(str(r['rental_contract']), int(r['line'])): copy.deepcopy(r) for r in R['rows']}
    NEW, TABS = read8(xlsx)
    log = B.apply(D, NEW, TABS, {}, rejoin_record=False)
    # the card governs where v10.29 held the keyed rate: keep the page's rate, note what the export keys now
    kept = []
    for r in R['rows']:
        k = (str(r['rental_contract']), int(r['line'])); o = oldrows.get(k)
        if o and o.get('rate_held1029'):
            if r.get('rate_1') != o.get('rate_1'):
                r['rate_1_keyed1029'] = r.get('rate_1'); r['rate_1'] = o.get('rate_1'); kept.append(f'{k[0]}/{k[1]}')
    removed = [x for x in log['removed']]
    hist = R.get('source_history949') or {'rows': []}
    gone = [copy.deepcopy(oldrows[(x['line'].split('/')[0], int(x['line'].split('/')[1]))]) for x in removed]
    for g in gone:
        why = HELD_OUT.get(str(g['rental_contract']))
        g['removed_12427'] = why or 'not on Baseplan (8), 27 Oct 2026'
    hist['rows'] = list(hist.get('rows') or []) + gone
    hist.setdefault('held_out1026', {}).update(HELD_OUT)
    R['source_history949'] = hist
    R['contracts'] = [c for c in R['contracts'] if str(c['rental_contract']) not in HELD_OUT]
    active = {f"{r['rental_contract']}/{r['line']}" for r in R['rows']}
    for v in R['assignments'].values(): v['lines'] = [k for k in v.get('lines', []) if k in active]
    R.update({'record_id': 'baseplan-contracts-2026-10-27', 'workbook': 'Baseplan_SuperCars_2026-10-27.xlsx', 'supplied_by': 'Andrew Fisher', 'supplied_on': '2026-10-27',
              'source': 'Baseplan SuperCars (8) — supplied by Andrew Fisher, 27 Oct 2026 (21 contract sheets, two marked Cancelled, and the Delivery Dockets sheet). Contract information; recorded site allocations remain authoritative.',
              'source_sha256': full, 'contracts_count1026': len(TABS)})
    D['baseplan_review12427'] = {'schema': 1, 'author': 'Andrew Fisher', 'reviewed': '2026-10-27', 'sha256': full, 'contract_tabs': len(TABS), 'lines': len(NEW),
                                 'added': log['added'], 'removed_to_history': removed, 'changed_lines': log['changed'], 'rejoined_by_filled_number': log['rejoined'],
                                 'held': log['held'], 'repeated_numbers': log['flags'], 'plant_line_copies': log['plant_line_copies'], 'held_out_why': HELD_OUT,
                                 'never': {f'{a}/{b}': w for (a, b), w in NEVER.items()}, 'card_rate_kept': kept, 'quantity_written_as_date': QTY_AS_DATE,
                                 'rule': 'Contract information as exported; the site record stays authoritative for what stands where. A line the export no longer has is kept in the source history, out of the active totals.'}
    keep = {'rental_on_hire', 'plant_lines', 'assets', 'baseplan_review12427'}
    assert {k: v for k, v in D.items() if k not in keep} == {k: v for k, v in before.items() if k not in keep}, 'data outside the plan changed'
    assert D['assets'] == before['assets'], 'assets changed'
    html = html[:at] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + html[at + n:]
    FOOT = ("+' · v12.42.6'; /* v8.19 release922", "+' · v12.42.7'; /* v8.19 release922")
    assert html.count(FOOT[0]) == 1; html = html.replace(*FOOT)
    page.write_text(html, encoding='utf-8')
    (HERE / 'data_log_12427.json').write_text(json.dumps(D['baseplan_review12427'], indent=1, ensure_ascii=False) + '\n')
    print('patch_v12427_data applied:', {k: len(v) for k, v in D['baseplan_review12427'].items() if isinstance(v, list)})


if __name__ == '__main__':
    main()
