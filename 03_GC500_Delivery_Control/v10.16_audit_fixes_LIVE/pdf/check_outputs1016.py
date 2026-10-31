"""Author: Andrew Fisher. Inspect actual private PDF text, destinations, QR links and boundaries."""
from pathlib import Path
import json,re,sys
import fitz

folder=Path(sys.argv[1]);source=json.loads((folder/'exports.json').read_text());checks=[]
def check(name,value):checks.append({'name':name,'pass':bool(value)})
norm=lambda text:re.sub(r'\s+','',text)
for case in source['results']:
    doc=fitz.open(folder/(case['day']+'.pdf'));texts=[p.get_text() for p in doc]
    check(case['day']+' exact actual PDF page count',len(doc)==case['pages'])
    check(case['day']+' all pages A4 portrait',all(abs(p.rect.width-595.28)<1 and abs(p.rect.height-841.89)<1 for p in doc))
    check(case['day']+' no empty pages',all('FWF -' in t for t in texts))
    destinations=''.join(p.get_text(clip=fitz.Rect(68*72/25.4,53*72/25.4,179*72/25.4,269*72/25.4)) for p in doc)
    refs=''.join(p.get_text(clip=fitz.Rect(18*72/25.4,53*72/25.4,57*72/25.4,269*72/25.4)) for p in doc)
    for row in case['expected']:
        check(case['day']+' preserves destination '+row['ref'],norm(row['location']) in norm(destinations))
        check(case['day']+' stop occurs once '+row['ref'],len(re.findall(r'(?<!\w)'+re.escape(row['ref'])+r'(?!\w)',refs))==1)
        for number in row['numbers']:check(case['day']+' asset printed '+number,number in refs)
    links=[link for page in doc for link in page.get_links() if link.get('uri')]
    check(case['day']+' actual PDF QR links match every expected destination',sorted(link['uri'] for link in links)==sorted(qr['url'] for qr in case['qr']))
    check(case['day']+' actual PDF QR links remain 18mm square',all(abs(link['from'].width-18*72/25.4)<.1 and abs(link['from'].height-18*72/25.4)<.1 for link in links))
    for index,page in enumerate(doc):
        drawings=page.get_drawings()
        for qr in (q for q in case['qr'] if q['page']==index+1):
            bounds=fitz.Rect(qr['x']*72/25.4,qr['y']*72/25.4,(qr['x']+qr['size'])*72/25.4,(qr['y']+qr['size'])*72/25.4)
            check(case['day']+' vector QR present on page '+str(index+1),sum(1 for drawing in drawings if drawing['fill']==(0.0,0.0,0.0) and bounds.contains(drawing['rect']))>100)
    check(case['day']+' all text remains within printable page',all(16<=b[0] and b[2]<=page.rect.width-15 and 15<=b[1] and b[3]<=page.rect.height-15 for page in doc for b in page.get_text('blocks') if b[6]==0))
    if case['day']=='2026-10-15':
        check('continuation day page labels','Day page 1 of 2' in texts[0] and 'Day page 2 of 2' in texts[1] and 'continued' in texts[1])
        check('daily total retained on both pages',all('DAILY TOTAL: 24 items across 2 pages' in text for text in texts))
        for index,page in enumerate(doc):page.get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(folder/('15Oct-page'+str(index+1)+'.png'))
result={'checks':checks,'failures':[c for c in checks if not c['pass']]}
(folder/'pdf-extraction.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'checks':len(checks),'failures':result['failures']}))
if result['failures']:raise SystemExit(1)
