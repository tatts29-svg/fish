#!/usr/bin/env python3
"""Author: Andrew Fisher. One overall reading and clear category plates; operational records stay intact."""
import argparse,hashlib,json,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def canonical(value):
 if isinstance(value,list):return '['+','.join(canonical(x) for x in value)+']'
 if isinstance(value,dict):return '{'+','.join(json.dumps(k,ensure_ascii=False)+':'+canonical(value[k]) for k in sorted(value))+'}'
 return json.dumps(value,ensure_ascii=False)

def patch(text,preview=False):
 for need in ('scene896-script','today902-style','where885-script','const Scene896 =','function progress881Model(', 'function deliveryCard(', 'function dayRows(', 'function dayCards(', 'function crew883Editor('):
  if text.count(need)!=1:raise ValueError('v9.07 requires one intact '+need)
 if 'today907-style' in text or 'const TodayPlates907 =' in text:raise ValueError('v9.07 already applied')
 marks=re.findall(r' · v9\.0[4-6]\b',text)
 if len(marks)!=1:raise ValueError('Expected one v9.04, v9.05 or v9.06 footer')
 text=rep(text,marks[0],' · v9.07','release footer','page.html')
 manifest=None
 if not (HERE/'plates907.json').exists() and not preview:raise ValueError('Eight final image descriptors are required; use --preview-existing-art only for a provisional preview')
 if (HERE/'plates907.json').exists():
  desc=json.loads((HERE/'plates907.json').read_text());cells=desc['cells']
  if {c['id'] for c in cells}!={'buildings','toilets','fencing','generators','lighting','vms','equipment','yard'} or len(cells)!=8:raise ValueError('Expected seven category images and one overall yard image')
  m=re.search(r'const DATA = (\{.*?\});\n',text);data=json.loads(m[1])
  if json.dumps(data,ensure_ascii=False,separators=(',',':'))!=m[1]:raise ValueError('DATA does not round-trip')
  scene=text[text.index('const Scene896 ='):];am=re.search(r'const ATLAS = (\{[^\n]+\});',scene);atlas=json.loads(am[1]);old_atlas=am[0]
  for c in cells:
   if c['type']!='image/webp' or c['scope']!='view' or c['file']!=c['sha256']+'.webp':raise ValueError('Invalid category descriptor')
   b=(HERE/'assets'/c['file']).read_bytes()
   if len(b)!=c['bytes'] or hashlib.sha256(b).hexdigest()!=c['sha256']:raise ValueError('Image bytes do not match descriptor')
   entry={k:c[k] for k in ('file','sha256','type','bytes','scope')}
   if data['media'].get(c['sha256'],entry)!=entry:raise ValueError('Conflicting image entry')
   data['media'][c['sha256']]=entry;atlas[c['id']]=c['sha256']
  assets=sorted(({k:c[k] for k in ('bytes','file','scope','sha256','type')} for c in data['media'].values()),key=lambda c:c['file'])
  body={'schema':'gc500-media-v1','assets':assets};manifest=dict(body,sha256=hashlib.sha256(canonical(body).encode()).hexdigest());data['hostedMedia']['manifest']=manifest['sha256']
  text=text[:m.start(1)]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+text[m.end(1):]
  text=rep(text,old_atlas,'const ATLAS = '+json.dumps(atlas,separators=(',',':'))+';','category scene images','page.html')
 text=rep(text,'background-image:linear-gradient(#0b1419a6,#0b1419a6),url(','background-image:linear-gradient(var(--p907-shade,#0b1419a6),var(--p907-shade,#0b1419a6)),url(','category image shading','page.html')
 css=(HERE/'plates907.css').read_text()+'\n'+(HERE/'time907.css').read_text()
 js=(HERE/'plates907.js').read_text()+'\n'+(HERE/'time907.js').read_text()
 if '</style' in css or '</script' in js:raise ValueError('Unexpected closing tag')
 end=text.index('</head>');anchor=text[end-160:end+7];text=rep(text,anchor,anchor[:-7]+'<style id="today907-style">\n'+css+'\n</style>\n</head>','Today plate styling','page.html')
 head,tag,tail=text.rpartition('</body>')
 if not tag or '<script' in tail:raise ValueError('No final body anchor')
 text=head+'<script id="today907-script">\n'+js+'\n</script>\n'+tag+tail
 return text,manifest

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('base',type=Path);p.add_argument('output',type=Path,nargs='?');p.add_argument('--preview-existing-art',action='store_true');args=p.parse_args();s,m=patch(args.base.read_text(),args.preview_existing_art);out=args.output or args.base;out.write_text(s)
 if m:(out.parent/'media_manifest_v907.json').write_text(json.dumps(m,ensure_ascii=False,separators=(',',':')))
 print('v9.07 prepared; '+('eight verified equipment scenes' if m else 'PREVIEW using existing category images')+'; half-hour planning choices; no operational record changes.')
