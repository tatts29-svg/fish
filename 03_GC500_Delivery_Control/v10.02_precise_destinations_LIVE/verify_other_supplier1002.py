#!/usr/bin/env python3
"""Read-only landscape supplier PDF layout audit. Author: Andrew Fisher."""
import json, os, sys
from pathlib import Path
import fitz
from verify_destinations1002 import pdf_normalise

root=Path(os.environ.get('INPUT',sys.argv[1] if len(sys.argv)>1 else '/workspace/private-gc500-dest1002/other-supplier-pdfs'))
snapshot=json.loads((root/'rows-private.json').read_text())
exports=json.loads((root/'export-result.json').read_text())
checks=[];mm=72/25.4;cols=[8,46,73,145,234,259,289];fonts={};ink_evidence=[]
def check(name,ok,detail=None):
 checks.append({'name':name,'pass':bool(ok),**({'detail':detail} if not ok else {})})
 if not ok:print('FAIL:',name,detail,flush=True)

def glyph_ink_span(span):
 # Base14 Helvetica's ascender/descender envelope is 1.374 em, not painted ink.
 # At the existing 1.15-em leading those envelopes overlap on readable lines.
 # Measure each actual glyph using the same Base14 face and recorded PDF origin.
 font=fonts.setdefault(span['font'],fitz.Font(fontname=span['font']))
 ink=None
 for char in span['chars']:
  if char['c'].isspace():continue
  g=font.glyph_bbox(ord(char['c']));x,y=char['origin'];size=span['size']
  box=fitz.Rect(x+g.x0*size,y-g.y1*size,x+g.x1*size,y-g.y0*size)
  ink=box if ink is None else ink|box
 return ink

for exported in exports['files']:
 kind=exported['kind'];expected=snapshot[kind];row_index=0;doc=fitz.open(root/exported['name']);page_rows=[]
 check(kind+' exported page count',len(doc)==exported['pages'],len(doc))
 check(kind+' author metadata',doc.metadata.get('author')=='Andrew Fisher',doc.metadata.get('author'))
 for pi,page in enumerate(doc):
  name=kind+' page '+str(pi+1)
  check(name+' landscape A4',abs(page.rect.width-297*mm)<1 and abs(page.rect.height-210*mm)<1,list(page.rect))
  spans=[s for b in page.get_text('dict')['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans'] if s['text'].strip()]
  outside=[{'text':s['text'],'bbox':s['bbox']} for s in spans if not page.rect.contains(fitz.Rect(s['bbox']))]
  check(name+' text inside page',not outside,outside)
  raw_spans=[s for b in page.get_text('rawdict')['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans'] if any(not c['c'].isspace() for c in s['chars'])]
  ink=[{'text':''.join(c['c'] for c in s['chars']),'box':glyph_ink_span(s),'envelope':fitz.Rect(s['bbox']),'baseline':s['origin'][1]} for s in raw_spans]
  overlaps=[];metric_only=[]
  for i,a in enumerate(ink):
   for b in ink[i+1:]:
    box=a['box']&b['box'];envelope=a['envelope']&b['envelope']
    if box.width>0.7 and box.height>0.7:overlaps.append([a['text'],b['text'],list(box)])
    elif envelope.width>0.7 and envelope.height>0.7:
     top,bottom=(a,b) if a['baseline']<=b['baseline'] else (b,a)
     metric_only.append({'text':[top['text'],bottom['text']],'baseline_advance_pt':bottom['baseline']-top['baseline'],'font_envelope_overlap_pt':envelope.height,'painted_ink_gap_pt':bottom['box'].y0-top['box'].y1})
  check(name+' no painted glyph overlaps',not overlaps,overlaps)
  ink_evidence.append({'page':name,'font_metric_only_overlap_count':len(metric_only),'examples':metric_only[:3]})
  rows={}
  for d in page.get_drawings():
   r=d['rect']
   if abs(r.x0-8*mm)<0.2 and abs(r.width-38*mm)<0.2 and r.y0>=50.8*mm and r.height>=25.8*mm:rows[tuple(round(v,2) for v in r)]=r
  rows=sorted(rows.values(),key=lambda r:r.y0);page_rows.append(len(rows))
  check(name+' table ends before footer',not rows or rows[-1].y1<=185.2*mm,[r.y1/mm for r in rows])
  for row in rows:
   wanted=expected[row_index] if row_index<len(expected) else {};ref=wanted.get('ref','EXTRA');label=name+' '+ref
   row_index+=1
   dest=page.get_text('text',clip=fitz.Rect(145*mm,row.y0,234*mm,row.y1))
   check(label+' full destination fits its cell',bool(wanted.get('location')) and pdf_normalise(wanted['location']) in pdf_normalise(dest),{'expected':wanted.get('location'),'actual':dest})
   escaped=[]
   for sp in spans:
    r=fitz.Rect(sp['bbox']);cy=(r.y0+r.y1)/2
    if not row.y0<=cy<=row.y1:continue
    limits=next(((a*mm,b*mm) for a,b in zip(cols,cols[1:]) if a*mm-0.1<=r.x0<b*mm),None)
    if limits is None or r.x1>limits[1]+0.2 or r.x0<limits[0]-0.2 or r.y0<row.y0-0.2 or r.y1>row.y1+0.2:escaped.append({'text':sp['text'],'bbox':sp['bbox']})
   check(label+' no text escapes row or column',not escaped,escaped)
 check(kind+' every native row exported once',row_index==len(expected),{'expected':len(expected),'actual':row_index})
 # Save the densest page for an optional visual check without rendering every page.
 if page_rows:
  best=max(range(len(page_rows)),key=page_rows.__getitem__);doc[best].get_pixmap(matrix=fitz.Matrix(1.4,1.4),alpha=False).save(root/(kind+'-densest.png'))
 doc.close()

failed=[c for c in checks if not c['pass']]
report={'author':'Andrew Fisher','pass':not failed,'check_count':len(checks),'failure_count':len(failed),'recordVersion':snapshot['version'],'overlap_method':'Per-character Base14 glyph ink bounds at actual PDF origins; conservative original span boxes retained for page/row/column containment.','ink_evidence':ink_evidence,'checks':checks}
(root/'layout-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:report[k] for k in ['pass','check_count','failure_count','recordVersion']}))
sys.exit(1 if failed else 0)
