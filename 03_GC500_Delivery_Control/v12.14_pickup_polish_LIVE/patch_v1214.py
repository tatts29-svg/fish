"""Author: Andrew Fisher. Pickup PDF print polish; record and navigation unchanged."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='8b524dbcb293d487c04465734d03df5182a74ef75a8214c03559bf674a2066cf'
def patch(html):
 if "version:'v12.14',make,reference" in html: raise ValueError('v12.14 already applied')
 if hashlib.sha256(html.encode()).hexdigest()!=BASE: raise ValueError('Live base changed; rebuild and retest')
 html=rep(html,(HERE.parent/'v12.13_pickup_detail_LIVE/pickup1213_pdf.js').read_text(),(HERE/'pickup1214_pdf.js').read_text(),'PDF presentation','pickup pack')
 return rep(html,"+' · v12.13'; /* v8.19 release922","+' · v12.14'; /* v8.19 release922",'version','pickup pack')
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('Pickup PDF print polish applied')
