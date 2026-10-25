"""Author: Andrew Fisher. Retain every photo; check print margins, numbering and caption size."""
import json,sys
from pathlib import Path
import fitz
root=Path(sys.argv[1]);e=json.loads((root/'expected.json').read_text());doc=fitz.open(root/'pickup.pdf')
photos=[p for r in e['rows'] for p in r.get('pictures',[]) if not p.get('unavailable')]
maps=len(e['rows'])+(len(e['rows'])>1)
info=[im for page in doc for im in page.get_image_info()]
text='\n'.join(p.get_text() for p in doc)
checks={'every_photo_embedded':len(info)==maps+len(photos),
 'photo_numbers':all('PHOTO '+str(i+1).zfill(2) in text for r in e['rows'] for i,p in enumerate([p for p in r.get('pictures',[]) if not p.get('unavailable')])),
 'images_inside_content':all(im['bbox'][0]>=39 and im['bbox'][1]>=28 and im['bbox'][2]<=557 and im['bbox'][3]<757 for im in info),
 'photo_captions_readable':all(span['size']>=8.9 for page in doc for b in page.get_text('dict')['blocks'] for line in b.get('lines',[]) for span in line['spans'] if 'PHOTO ' in span['text'])}
if len(e['rows'])==1 and len(photos)==5:checks['five_photos_in_at_most_four_pages']=len(doc)<=4
result={'pages':len(doc),'photos':len(photos),'checks':checks,'passed':sum(checks.values()),'total':len(checks)}
(root/'print-checks.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));assert all(checks.values())
