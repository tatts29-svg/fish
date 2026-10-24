"""Author: Andrew Fisher. Decorative fifth-lap Onsite trackside scene."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='1ca10ac4c8498f4e07a47aa5de4d4f59ef9c17a218961340fe275480eb90e2a3'
def patch(html):
    if 'ShowcaseIncident1195' in html:raise ValueError('v11.95 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Wrong live base; rebuild and retest on the current release')
    html=rep(html,'if(G.drawRaceCar)G.drawRaceCar(S,VP,fog);','if(G.drawRaceCar)G.drawRaceCar(S,VP,fog);\n if(G.drawIncident1195)G.drawIncident1195(S,VP,fog);','trackside scene render hook','page')
    html=rep(html,'\n</body>\n</html>','\n<script>\n'+(HERE/'incident1195_src.js').read_text()+'\n</script>\n</body>\n</html>','fifth-lap scene module','page')
    return rep(html,"+' · v11.92'; /* v8.19 release922","+' · v11.95'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.95 fifth-lap trackside scene applied')
