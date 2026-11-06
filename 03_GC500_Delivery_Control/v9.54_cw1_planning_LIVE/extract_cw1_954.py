"""Author: Andrew Fisher. Exact private-original CW1 transcript; no original upload."""
import hashlib
import json
import sys
from pathlib import Path

SOURCE_SHA = 'd7287c2cb05f69677d954c6daf9bd086666ba54535ecb91e7d8fe6e0847fa661'
CATEGORIES = ['Temporary Fence (m) — Clean', 'Temporary Fence (m) — Braced for Scrim',
              'Temporary Fence (m) — Relocation', 'Temporary Fence (m) — Removal',
              'Vehicle Gates', 'Ped. Gates', 'Crowd Control Barriers (m) — Event',
              'Crowd Control Barriers (m) — Demarcation', 'Crowd Control Barriers (m) — Flat Feet']
# Each row maps the PDF's actual table row to its earlier CON WK1 task identity.
# New rows have stable IDs; no fuzzy join merges adjoining resident-fence extents.
ROW_MAP = {2: [6,7,8,9,10,11,12,13,14], 6: [16,17,18,19,20,21,22,23,25,26],
           8: [29,30,31,32,33,34,35,36,37,39,40,41,'triangle'],
           12: [44,45,46,47,'gate6',51,57,61], 18: [59,60,61,62,63,64]}
MAP_PAGES = {6:[2,3],7:[2,3],8:[2,3],9:[2,4],10:[2],11:[2,4],12:[2,4],13:[2,4],14:[2,5],
 16:[6,7],17:[6,7],18:[6,7],19:[6,7],20:[6,7],21:[6,7],22:[6,7],23:[6,7],25:[6,7],26:[6,7],
 29:[8,9],30:[8,9],31:[8,9],32:[8,9],33:[8,9],34:[8,9],35:[8,9],36:[8,9],37:[8,9],
 39:[8,10],40:[8,10],41:[8,10],'triangle':[8,11],44:[12,13],45:[12,14],46:[12,14],47:[12,14],
 'gate6':[10,12,15],51:[12],57:[12,16],61:[12,17,18],59:[18,19],60:[18,20],62:[18,21,22],63:[18,23],64:[18,23]}

def extract(pdf_path):
    import fitz
    path = Path(pdf_path)
    if hashlib.sha256(path.read_bytes()).hexdigest() != SOURCE_SHA:
        raise ValueError('Unreviewed CW1 PDF; refusing a different source revision')
    pdf = fitz.open(path)
    if len(pdf) != 23 or pdf.metadata.get('author') != 'John Brett':
        raise ValueError('Unexpected CW1 original metadata')
    rows = []
    for page, ids in ROW_MAP.items():
        tables = pdf[page-1].find_tables().tables
        actual = [r for t in tables for r in t.extract() if r[0] == 'C1']
        if len(actual) != len(ids): raise ValueError('Unexpected task count on page '+str(page))
        for key, row in zip(ids, actual):
            if page == 18 and key == 61: continue # Struck-through Friday repeat; task has Thursday page/email.
            values = {c:float(row[i+4]) for i,c in enumerate(CATEGORIES) if row[i+4] not in [None,'']}
            date = '2026-10-' + str({2:12,6:13,8:14,12:15,18:16}[page])
            rows.append({'id':'cw1-'+str(key), 'source_row951':key if isinstance(key,int) else None,
                         'date':date, 'date_as_written954':row[1], 'location':row[2],
                         'description':row[3], 'fields':values, 'source_pages954':MAP_PAGES[key],
                         'note':' '.join((row[13] or '').split()), 'page':page})
    # Text alone loses the two orange strike-throughs; verify the reviewed vector evidence.
    for page,y in [(12,414.72),(18,371.52)]:
        lines=[d for d in pdf[page-1].get_drawings() if d.get('color') and d['color'][0]>.7
               and .1<d['color'][1]<.7 and d['color'][2]<.5 and abs(d['rect'].y0-y)<.1
               and d['rect'].width>900]
        if len(lines)!=1: raise ValueError('Reviewed strike-through evidence changed')
    if pdf[20].get_pixmap().samples != pdf[21].get_pixmap().samples:
        raise ValueError('Cypress duplicate-page evidence changed')
    return {'schema':1,'author':'Andrew Fisher','source_file':path.name,'sha256':SOURCE_SHA,'pages':23,
            'source_author':'John Brett','created_display':'9 Oct 2026 10:27 AEST','revision':'2026-10-09',
            'email':{'author':'John Brett','sent_display':'9 Oct 2026 10:34 AEST',
                     'provenance':'Email text supplied by Andrew Fisher in this chat; no mailbox retrieval claimed.',
                     'highlights':{'2026-10-12':'South Main Beach Parade residents, Ferny Avenue residents, Supply Compound',
                     '2026-10-13':'North Main Beach Parade residents',
                     '2026-10-14':'Remaining residents; Esplanade braced and scrimmed now; Triangle CZ',
                     '2026-10-15':'Cable Street and Pacific under traffic control; Surfers Paradise Light Rail; Gate 6; Pit Building/Paddock removal and relocation',
                     '2026-10-16':'Main Beach Light Rail: Scottie and Wayne; Spit Fuel Compound; Cypress carpark; Esplanade residents fencing and CCB'}},
            'rows':rows,'duplicate_pages':[{'pages':[21,22],'task':'cw1-62','counted_once':True}],
            'visual_strikes':[{'page':12,'task':'cw1-51','meaning':'Crossed out; reason not stated'},
                              {'page':18,'task':'cw1-61','meaning':'Friday copy crossed out; Thursday map and email reschedule once'}],
            'printed_weekly_totals':dict(zip(CATEGORIES,[3168.5,550,74,220,49,20,480,1231,90])),
            'printed_totals_used':False,
            'stockpile_evidence':{'date':'2026-10-14','page':10,'location':'The Esplanade / Gate 6',
              'fields':{CATEGORIES[6]:50},'note':'Stockpile 50 m CCB for Gate 6 queuing and ticket-booth queuing. Detail only; omitted from daily summary. Movement is not additional installed or unique hire stock.',
              'additional_forecast':False}}

if __name__ == '__main__':
    if len(sys.argv)!=3: raise SystemExit('Usage: extract_cw1_954.py original.pdf source954.json')
    Path(sys.argv[2]).write_text(json.dumps(extract(sys.argv[1]),ensure_ascii=False,indent=2)+'\n')
