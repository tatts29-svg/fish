"""Author: Andrew Fisher. Pickup maps use the active Explorer style and registration."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='91f9006070d1269eb6e9ae807076e9146e7e52e6fbfc68a01d840f5666559a11'
def patch(html):
 if 'function pickupBase1215(' in html:raise ValueError('v12.15 already applied')
 if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Live base changed; rebuild and retest')
 for folder,old,new in [('v12.13_pickup_detail_LIVE','pickup1213_map.js','pickup1215_map.js'),('v12.13_pickup_detail_LIVE','pickup1213_frame.js','pickup1215_frame.js'),('v12.14_pickup_polish_LIVE','pickup1214_pdf.js','pickup1215_pdf.js')]:
  html=rep(html,(HERE.parent/folder/old).read_text().rstrip(),(HERE/new).read_text().rstrip(),new,'pickup map')
 html=rep(html,'picture,pickupTarget1213,pickupPicture1213,words:','picture,pickupTarget1213,pickupPicture1213,pickupView1215,pickupViewKey1215,words:','map view exports','pickup map')
 return rep(html,"+' · v12.14'; /* v8.19 release922","+' · v12.15'; /* v8.19 release922",'version','pickup map')
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('Active Explorer pickup maps applied')
