"""Author: Andrew Fisher. Verify portrait daily exports against the live-model QR manifest."""
import sys,os,json,re,hashlib,unicodedata
from pathlib import Path
from datetime import datetime
sys.path.insert(0,'/workspace/private-gc500-water-barriers-12Oct/python-deps')
import fitz,zxingcpp
from PIL import Image

ROOT=Path(os.environ.get('INPUT',sys.argv[1] if len(sys.argv)>1 else '/workspace/private-gc500-unit1006/runs-check'))
OUT=ROOT/'pdf-checks';OUT.mkdir(exist_ok=True)
snapshot=json.loads((ROOT/'model.json').read_text())
model=snapshot['M']; dates=sorted(set(r['date'] for r in model['remaining']) | {model['asAt']})
source={d:[r for r in model['receipts'] if r['date']==d]+[r for r in model['remaining'] if r['date']==d] for d in dates}
days={d:[{'ref':r['ref'],'qty':r['count'] if r.get('actualReceipt1006') else r['remaining'],'url':r.get('dispatchUrl') or r.get('url',''),'basis':r.get('dispatchBasis') or r.get('locationBasis','')} for r in rows] for d,rows in source.items()}
manifest={'recordVersion':snapshot['version'],'days':days};expected={d:sum(r['qty'] for r in rows) for d,rows in days.items()}
assert expected=={'2026-10-13':24,'2026-10-14':24,'2026-10-15':24,'2026-10-16':24,'2026-10-17':3}
files=sorted((ROOT/'pdf').glob('*.pdf'))
combined=[p for p in files if 'All_dates_' in p.name];assert len(combined)==1
daily={d:next(p for p in files if p.name.endswith(d+'.pdf') and 'All_dates_' not in p.name) for d in days}
assert len(files)==6
mm=72/25.4;checks=[];failures=[];qr_results=[];page_results=[]
def check(name,condition,detail=None):
    checks.append({'name':name,'pass':bool(condition),**({'detail':detail} if not condition else {})})
    if not condition:failures.append({'name':name,'detail':detail});print('FAIL:',name,detail,flush=True)
def plain(s):
    s=str(s).replace('–','-').replace('—','-').replace('‘',"'").replace('’',"'").replace('“','"').replace('”','"').replace('×','x')
    return ''.join(c for c in unicodedata.normalize('NFKD',s) if not unicodedata.combining(c))
def compact(s):return re.sub(r'\s+','',plain(s))
def spans(page):
    return [span for b in page.get_text('dict')['blocks'] if 'lines' in b for l in b['lines'] for span in l['spans'] if span['text'].strip()]
def rectkey(r):return tuple(round(v,2) for v in r)

for pdf,is_combined in [(combined[0],True)]+[(daily[d],False) for d in days]:
    doc=fitz.open(pdf);wanted=list(days) if is_combined else [next(d for d,p in daily.items() if p==pdf)]
    check(pdf.name+' page count',len(doc)==len(wanted),len(doc))
    check(pdf.name+' author',doc.metadata.get('author')=='Andrew Fisher',doc.metadata)
    for pi,d in enumerate(wanted):
        page=doc[pi];prefix=pdf.name+f' page {pi+1} '+d;rows=days[d]
        check(prefix+' A4 portrait',abs(page.rect.width-210*mm)<1 and abs(page.rect.height-297*mm)<1,list(page.rect))
        text=page.get_text();date=datetime.fromisoformat(d).strftime('%a %d %b %Y').replace(' 0',' ')
        check(prefix+' selected date',date in text,date)
        check(prefix+' total',f'TOTAL: {expected[d]} items' in text and 'received |' in text and 'remaining | 24 per day' in text)
        check(prefix+' author footer','Author: Andrew Fisher' in text)
        spans_all=spans(page)
        outside=[{'text':s['text'],'bbox':s['bbox']} for s in spans_all if not(page.rect.x0<=s['bbox'][0]<s['bbox'][2]<=page.rect.width and page.rect.y0<=s['bbox'][1]<s['bbox'][3]<=page.rect.height)]
        check(prefix+' text within page',not outside,outside)
        overlaps=[]
        for i,a in enumerate(spans_all):
            ar=fitz.Rect(a['bbox'])
            for b in spans_all[i+1:]:
                br=fitz.Rect(b['bbox']);inter=ar&br
                if inter.width>0.7 and inter.height>0.7:overlaps.append([a['text'],b['text'],list(inter)])
        check(prefix+' text does not overlap',not overlaps,overlaps)
        # The first table column contains one stroked rectangle per stop.
        bounds={}
        for drawing in page.get_drawings():
            r=drawing['rect']
            if abs(r.x0-8*mm)<0.2 and abs(r.width-10*mm)<0.2 and r.y0>=52.8*mm and r.height>=19*mm:
                bounds[rectkey(r)]=r
        row_rects=sorted(bounds.values(),key=lambda r:r.y0)
        check(prefix+' row count',len(row_rects)==len(rows),[len(row_rects),len(rows)])
        if len(row_rects)!=len(rows):continue
        links=sorted([l for l in page.get_links() if l.get('uri')],key=lambda l:l['from'].y0)
        check(prefix+' clickable QR count',len(links)==sum(bool(r['url']) for r in rows),len(links))
        for index,(r,bounds) in enumerate(zip(rows,row_rects)):
            ref=r['ref'];name=prefix+' '+ref;cy=(bounds.y0+bounds.y1)/2
            native=[x for x in source[d] if x['date']==d and x['ref']==ref]
            assert len(native)==1,(d,ref,len(native))
            native=native[0];display=native.get('sourceRequest',{}).get('name') or ref
            cell=lambda x0,x1:fitz.Rect(x0*mm,bounds.y0,x1*mm,bounds.y1)
            stop=page.get_text('text',clip=cell(8,18)).strip();ref_text=page.get_text('text',clip=cell(18,57));qty=page.get_text('text',clip=cell(57,68)).strip();dest=page.get_text('text',clip=cell(68,179))
            check(name+' stop sequence',stop==str(index+1),stop)
            check(name+' reference and item',compact(display) in compact(ref_text) and compact(native['item']) in compact(ref_text),ref_text)
            check(name+' quantity',qty==str(r['qty']),qty)
            check(name+' received versus remaining status',('Received' if native.get('actualReceipt1006') else 'Remaining') in ref_text,ref_text)
            check(name+' destination',compact(native['location']) in compact(dest),dest)
            if re.search('meet point|approximate|not recorded|unconfirmed|area only',r['basis'],re.I):
                check(name+' location precision visible',compact(r['basis']) in compact(dest),dest)
            # Each text span must fit the source column and its physical row, not merely the page.
            clipped=[]
            for sp in spans_all:
                box=fitz.Rect(sp['bbox']);sy=(box.y0+box.y1)/2
                if bounds.y0<=sy<=bounds.y1 and box.x0<179*mm:
                    columns=[(8,18),(18,57),(57,68),(68,179)]
                    limits=next(((x0*mm,x1*mm) for x0,x1 in columns if x0*mm-0.1<=box.x0<x1*mm),None)
                    if limits is None or box.x0<limits[0]-0.2 or box.x1>limits[1]+0.2 or box.y0<bounds.y0-0.2 or box.y1>bounds.y1+0.2:clipped.append({'text':sp['text'],'bbox':sp['bbox']})
            check(name+' text fits row and column',not clipped,clipped)
            matches=[l for l in links if bounds.y0<=l['from'].y0 and l['from'].y1<=bounds.y1]
            check(name+' QR paired to row',len(matches)==(1 if r['url'] else 0),len(matches))
            if not r['url']:continue
            if len(matches)!=1:continue
            link=matches[0];qrrect=link['from'];check(name+' URL annotation',link['uri']==r['url'],link['uri'])
            check(name+' QR is 18 mm and inside map column',abs(qrrect.width/mm-18)<0.1 and abs(qrrect.height/mm-18)<0.1 and qrrect.x0>=179*mm and qrrect.x1<=202*mm,list(qrrect))
            clip=qrrect+(-1*mm,-1*mm,1*mm,1*mm);pix=page.get_pixmap(matrix=fitz.Matrix(200/72,200/72),clip=clip,alpha=False);image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);decoded=zxingcpp.read_barcodes(image)
            ok=len(decoded)==1 and decoded[0].text==r['url'];check(name+' QR decodes exact URL at 200 dpi',ok,[x.text for x in decoded])
            qr_results.append({'file':pdf.name,'page':pi+1,'date':d,'ref':ref,'decoded_exact':ok,'url':r['url']})
            if not ok:image.save(OUT/f'FAILED-{d}-{ref}.png')
        check(prefix+' last row clears fixed footer',row_rects[-1].y1+8*mm<279*mm,float(row_rects[-1].y1/mm))
        page_results.append({'file':pdf.name,'page':pi+1,'date':d,'rows':len(rows),'quantity':expected[d],'qr_codes':len(links),'last_row_bottom_mm':row_rects[-1].y1/mm})
        if is_combined and d in ['2026-10-14','2026-10-15','2026-10-16']:
            page.get_pixmap(matrix=fitz.Matrix(1.8,1.8),alpha=False).save(OUT/f'preview-{d}.png')
    doc.close()

result={'author':'Andrew Fisher','input':str(ROOT),'pass':not failures,'check_count':len(checks),'failed':len(failures),'checks':checks,'failures':failures,'pages':page_results,'qr_results':qr_results,'pdf_count':len(files),'qr_decoded_count':sum(r['decoded_exact'] for r in qr_results),'record_version':manifest['recordVersion'],'files':[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
(ROOT/'pdf-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:result[k] for k in ['pass','check_count','failed','pdf_count','qr_decoded_count','record_version']})+f' previews={OUT}',flush=True)
if failures:sys.exit(1)
