"""Author: Andrew Fisher. Advanced Temporary Fencing model livery only."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='52fe0d1a8266bbd91c32bcce7e2f5e86ee05cfed869527ecf44484c3fe623b6d'
def patch(html):
    if 'G.fencingBrand1180' in html:raise ValueError('v11.80 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Wrong live base for v11.80')
    old=(HERE.parent/'v11.79_showcase_scenery_LIVE/truck1179_src.js').read_text().replace("author:'Andrew Fisher'","author:'the project manager'")
    html=rep(html,old,(HERE/'truck1180_src.js').read_text(),'Advanced company livery','page')
    html=rep(html,'<option value="fencing_truck">Advanced Fencing truck</option>','<option value="fencing_truck">Advanced Temporary Fencing truck</option>','vehicle name','page')
    return rep(html,"+' · v11.79'; /* v8.19 release922","+' · v11.80'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.80 Advanced Temporary Fencing livery applied')
