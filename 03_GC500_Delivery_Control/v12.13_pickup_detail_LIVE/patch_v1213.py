"""Author: Andrew Fisher. Driver pickup detail; no operational record changes."""
import hashlib,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='d01878c99c7d8972beb8c6b76e16775d7c53f20551c4c3d41f422404d1616a67'
def patch(html):
 if 'function pickupTarget1213(' in html: raise ValueError('v12.13 already applied')
 if hashlib.sha256(html.encode()).hexdigest()!=BASE: raise ValueError('Live base changed; rebuild and retest')
 def change(a,b,label):
  nonlocal html
  html=rep(html,a,b,label,'pickup pack')
 old=(HERE.parent/'v12.12_pickup_pack_LIVE/pickup1212_pdf.js').read_text()
 change(old,(HERE/'pickup1213_data.js').read_text()+'\n'+(HERE/'pickup1213_pdf.js').read_text(),'pickup data and PDF')
 a=html.index('function demobFrame1211(){');b=html.index('\n\n  demobFrame1211();',a)
 change(html[a:b],(HERE/'pickup1213_frame.js').read_text().rstrip(),'driver pickup flow')
 change(' async function plan(g,s){',' async function plan(g,s,override){','allow upright pickup rendering')
 change('const outM=[[EDGE/50*s.F.mpp,0,EDGE/2-EDGE/50*s.F.mpp*s.F.centre[0]]','const outM=override||[[EDGE/50*s.F.mpp,0,EDGE/2-EDGE/50*s.F.mpp*s.F.centre[0]]','optional plan transform')
 change(' async function picture(s){',(HERE/'pickup1213_map.js').read_text()+'\n async function picture(s){','upright pickup map')
 change("version:'v12.06',update,snapshot,picture,words:","version:'v12.06',update,snapshot,picture,pickupTarget1213,pickupPicture1213,words:",'export bounded map functions')
 change("+' · v12.12'; /* v8.19 release922","+' · v12.13'; /* v8.19 release922",'version')
 return html
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('Pickup detail and navigation applied')
