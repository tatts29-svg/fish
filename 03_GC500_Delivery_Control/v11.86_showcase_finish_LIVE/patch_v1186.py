"""Author: Andrew Fisher. Finish loaded-truck framing and ground contact."""
import hashlib, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='4da2a95c57d1027a58a039fb252536b23d1095233b79f596d8fafc2dd2e9f583'
def patch(html):
    if 'ShowcaseFinish1186' in html:raise ValueError('Showcase finishing patch already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Wrong live base for v11.86')
    old=(HERE.parent/'v11.84_4k_truck_LIVE/camera1182_src.js').read_text()
    html=rep(html,old,(HERE/'camera1186_src.js').read_text(),'loaded truck detail and low cameras','page')
    html=rep(html,"['hero','Car follow'],['auto','Auto — car cameras']","['hero','Vehicle follow'],['auto','Auto — vehicle cameras']",'vehicle view labels','page')
    html=rep(html,"['detail','Car detail']","['detail','Vehicle detail']",'vehicle detail label','page')
    html=rep(html,'const sy=H+.002,f=P.fwd,r2=P.rt,LX=1.34*Sx,LZ=.57*Sx,N2=32;',"""const truckBounds1186=S.vehicle==='fencing_truck'?G.plantModel('fencing_truck','balanced').bounds:null;
 const mid1186=truckBounds1186?(truckBounds1186.min[0]+truckBounds1186.max[0])/2:-.12;
 const sy=H+.002,f=P.fwd,r2=P.rt,LX=(truckBounds1186?(truckBounds1186.max[0]-truckBounds1186.min[0])/2+.08:1.34)*Sx,LZ=(truckBounds1186?Math.max(Math.abs(truckBounds1186.min[2]),Math.abs(truckBounds1186.max[2]))+.06:.57)*Sx,N2=32;""",'loaded truck ground footprint','page')
    html=rep(html,'const shadowX=P.pos[0]-f[0]*.12*Sx-.45/.80*m.air*.55,shadowZ=P.pos[2]-f[2]*.12*Sx-.40/.80*m.air*.55;','const shadowX=P.pos[0]+f[0]*mid1186*Sx-.45/.80*m.air*.55,shadowZ=P.pos[2]+f[2]*mid1186*Sx-.40/.80*m.air*.55;','loaded truck shadow centre','page')
    html=rep(html,'\n</body>\n</html>','\n<script>\n'+(HERE/'framing1186_src.js').read_text()+'\n</script>\n</body>\n</html>','loaded truck responsive framing','page')
    return rep(html,"+' · v11.85'; /* v8.19 release922","+' · v11.86'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.86 loaded-truck Showcase finish applied')
