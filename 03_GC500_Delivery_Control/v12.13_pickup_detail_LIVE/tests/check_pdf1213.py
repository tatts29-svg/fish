"""Author: Andrew Fisher. Read exported text, links, print geometry and scan rendered navigation QR codes."""
import json,re,sys
from pathlib import Path
import fitz,zxingcpp
from PIL import Image
root=Path(sys.argv[1]);expected=json.loads((root/'expected.json').read_text());doc=fitz.open(root/'pickup.pdf')
text='\n'.join(p.get_text() for p in doc);checks={}
clean=lambda s:str(s).replace('–','-').replace('—','-').replace('×','x').replace('’',"'").replace('‘',"'").replace('→','to').replace('↑','north')
norm=lambda s:' '.join(clean(s).split())
flat=norm(text)
checks['brand_and_identity']=all(s in text for s in ['coates','INDUSTRIAL SOLUTIONS','GC500 / 2026','PICKUP PACK','Author: Andrew Fisher',expected['packRef']])
checks['metadata_author']=doc.metadata['author']=='Andrew Fisher'
checks['prepared_snapshot']=all(expected['packRef'] in p.get_text() for p in doc)
checks['all_selected_equipment']=all(norm(r['key']) in flat and norm(r['name']) in flat and all(norm(str(it['n'])+' x '+it['type']) in flat and all(norm(u['number']) in flat and norm(u['company']) in flat for u in it['units']) for it in r['items']) for r in expected['rows'])
checks['weights_and_dimensions']= 'WEIGHTS & DIMENSIONS' in text and all(all(all(norm(line) in flat for line in spec['lines']) for spec in it.get('specs',[])) for r in expected['rows'] for it in r['items'])
checks['holds_and_doors']=all(all(norm(h) in flat for h in r['hold']) and (not r.get('doors') or norm(r['doors']) in flat) for r in expected['rows'])
checks['loading_and_unidentified']=all(all(norm(l['item']) in flat and (not l.get('asset') or norm(l['asset']) in flat) for l in r.get('pickupLoading',[])) and all(not it['unidentified'] or norm(str(it['unidentified'])+' without individual asset IDs') in flat for it in r['items']) for r in expected['rows'])
checks['access_and_record_boundary']=all(norm(s) in flat for s in ['Roads open: travel in either direction','site traffic control','nearest road','not surveyed','NOT A DEPARTURE RECORD','Record the actual departure separately']) and 'follow race direction' not in text and '07:00-09:00' not in text
checks['local_truck_selection']=('NO TWIN-STEER TRUCKS' in text) if expected.get('noTwin') else ('NO TWIN-STEER' not in text and 'No local restriction selected' in text)
checks['contents_and_ids']=all(all(norm(c['type']) in flat and (not c['asset'] or norm(c['asset']) in flat) for c in r.get('contents',[])) for r in expected['rows'])
checks['photo_captions']=all(all(norm(p['caption']) in flat for p in r.get('pictures',[])) for r in expected['rows'])
checks['every_page_numbered']=all(f'{n+1} OF {len(doc)}' in p.get_text() for n,p in enumerate(doc))
urls={'https://www.google.com/maps/dir/?api=1&destination='+f"{r['target']['ll']['lat']:.6f},{r['target']['ll']['lon']:.6f}"+'&travelmode=driving' for r in expected['rows']}
links=[l.get('uri') for p in doc for l in p.get_links() if l.get('uri')];checks['only_expected_navigation_links']=bool(links) and set(links)==urls
qr_pages=0;decoded=[];outside=[];covered=[]
for n,p in enumerate(doc):
 pix=p.get_pixmap(dpi=150);im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
 got=[r.text for r in zxingcpp.read_barcodes(im)];decoded.extend(got)
 if 'SCAN TO THIS LOCATION' in p.get_text():qr_pages+=1;checks[f'qr_page_{n+1}_scans']=bool(set(got)&urls)
 if n<3:im.save(root/f'page-{n+1}.png')
 for im in p.get_image_info():
  box=fitz.Rect(im['bbox'])
  for drawing in p.get_drawings():
   fill=drawing.get('fill')
   if fill and len(fill)==3 and all(abs(fill[k]-[36/255,38/255,41/255][k])<.005 for k in range(3)) and (drawing['rect']&box).get_area()>1:covered.append(n+1)
 for b in p.get_text('dict')['blocks']:
  for line in b.get('lines',[]):
   for span in line['spans']:
    x0,y0,x1,y1=span['bbox']
    if x0 < 0 or y0 < 0 or x1>p.rect.width+.3 or y1>p.rect.height+.3:outside.append(n+1)
checks['qr_destination_readback']=qr_pages>0 and set(decoded)==urls
checks['no_text_outside_paper']=not outside
checks['map_not_covered_by_heading']=not covered
checks['native_text']=len(text)>600 and bool(doc[0].get_images())
checks['photo_heading_stays_with_images']=all('EQUIPMENT & LOCATION PHOTOS' not in p.get_text() or bool(p.get_images()) or any(x in p.get_text() for x in ['No matching','Photo availability','Photo could not be loaded']) for p in doc)
checks['no_orphan_pages']=all(len(p.get_text().split())>50 for p in doc)
result={'pages':len(doc),'checks':checks,'passed':sum(checks.values()),'total':len(checks),'qr_pages':qr_pages}
(root/'pdf-checks.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));assert all(checks.values())
