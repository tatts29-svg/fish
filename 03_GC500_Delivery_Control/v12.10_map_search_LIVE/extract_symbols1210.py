"""Author: Andrew Fisher. Reproduce symbol anchors from the already published drawing.

The input is the existing drawing-scene.bin (gzip JSON), never a private attachment.
Only reviewed legend colours and complete component counts are admitted. The output
contains drawing coordinates, not operational asset numbers or completion records.
"""
import collections,gzip,hashlib,json,math,re,sys
from pathlib import Path
PALETTE={'firstaid':('#8add6e',{111,112}),'information':('#00bfff',{73}),'police':('#8080ff',{78}),'photographer':('#ffdf7f',{90}),'broadcast':('#ffb3ff',{84}),'emergency':('#00b800',{1}),'marshal':('#00ff00',{180,189,190,380}),'yellowflag':('#f4ee51',{116})}
def extract(raw):
 s=json.loads(gzip.decompress(raw));styles={}
 for i,st in enumerate(s['s']):
  m=re.search(r'(?:^| )fill="(#[\da-f]+)"',st[0])
  if m:styles[i]=m[1]
 out={}
 for name,(colour,counts) in PALETTE.items():
  a=[(i,r[:4]) for i,r in enumerate(s['r']) if styles.get(r[5])==colour and r[2]-r[0]<40 and r[3]-r[1]<40];parent=list(range(len(a)));bins=collections.defaultdict(list)
  def find(i):
   while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
   return i
  for k,(i,b) in enumerate(a):
   cells=[(x,y) for x in range(math.floor((b[0]-.65)/8),math.floor((b[2]+.65)/8)+1) for y in range(math.floor((b[1]-.65)/8),math.floor((b[3]+.65)/8)+1)]
   for j in set(j for c in cells for j in bins[c]):
    q=a[j][1]
    if max(b[0],q[0])<=min(b[2],q[2])+.65 and max(b[1],q[1])<=min(b[3],q[3])+.65:parent[find(k)]=find(j)
   for c in cells:bins[c].append(k)
  groups=collections.defaultdict(list)
  for k,x in enumerate(a):groups[find(k)].append(x)
  vals=[]
  components=[]
  for xs in groups.values():
   if name=='marshal' and len(xs)==380:components.extend([xs[:190],xs[190:]])
   else:components.append(xs)
  for xs in components:
   if len(xs) not in counts:continue
   bb=[min(x[1][0] for x in xs),min(x[1][1] for x in xs),max(x[1][2] for x in xs),max(x[1][3] for x in xs)]
   # The lower document strip is the legend/title, not the site. Registration is
   # checked again in the frame against the current main/inset georeferences.
   if bb[1]>=1466:continue
   if min(bb[2]-bb[0],bb[3]-bb[1])<4:continue
   label=''
   if name=='marshal':
    inside=[l[0].strip() for l in s['labels'] if bb[0]<=(l[1]+l[3])/2<=bb[2] and bb[1]<=(l[2]+l[4])/2<=bb[3]]
    if 'MP' not in inside:continue  # S/F, F/L and BFR use the same green; they are not marshal posts.
    number=next((v for v in inside if re.fullmatch(r'\d{1,2}\.\d',v)),None)
    label='MP'+(' '+number if number else '')
   vals.append({'box':bb,'records':[x[0] for x in xs],**({'label':label} if label else {})})
  out[name]=sorted(vals,key=lambda x:(x['box'][0],x['box'][1]))
 out['hydrant']=[{'box':l[1:],'label':'FH','records':[]} for l in s['labels'] if l[0].strip()=='FH' and l[2]<1466]
 return {'author':'Andrew Fisher','scene_sha256':hashlib.sha256(raw).hexdigest(),'drawing_sha256':s['meta']['sha256'],'frame_sha256':s['meta'].get('frame_sha256'),'dimensions':[s['w'],s['h']],'symbols':out}
if __name__=='__main__':
 result=extract(Path(sys.argv[1]).read_bytes());
 for values in result['symbols'].values():
  for v in values:v.pop('records',None)
 Path(sys.argv[2]).write_text(json.dumps(result,separators=(',',':'))+'\n');print({k:len(v) for k,v in result['symbols'].items()})
