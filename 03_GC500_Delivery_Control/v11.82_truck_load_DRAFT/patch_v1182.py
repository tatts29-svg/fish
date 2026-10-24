"""Author: Andrew Fisher. Refine the truck load and preserve UHD Showcase clarity."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='6ca9da442988bbe4c9e86aa7d43200f9aa2517102bda1f59fa5a8b3a2c28a2e0'
def patch(html):
    if 'G.fencingLoad1182' in html:raise ValueError('v11.82 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Wrong live base for v11.82')
    old=(HERE.parent/'v11.80_advanced_truck_LIVE/truck1180_src.js').read_text().replace("author:'Andrew Fisher'","author:'the project manager'")
    html=rep(html,old,(HERE/'truck1182_src.js').read_text(),'loaded truck geometry','page')
    needle=" /* v6.61 - towing the VMS: higher and wider, so the car is never hidden behind the board and the trailer is in the frame */"
    html=rep(html,needle,(HERE/'camera1182_src.js').read_text()+needle,'loaded truck framing','page')
    html=rep(html,"if(S.rt){S.rt.quality=Q.name;if(S.bloom!==false)G.addMSAA(gl,S.rt,Q.samples);}","if(S.rt){S.rt.quality=Q.name;if(S.bloom!==false||Q.name==='crisp')G.addMSAA(gl,S.rt,Q.samples);}",'clarity anti-alias independent of glow','page')
    html=rep(html,"G.stepDown=function(){\n const S=G.S;if(!S)return null;\n const Q=S.quality||{};", "G.stepDown=function(){\n const S=G.S;if(!S)return null;\n const Q=S.quality||{};\n if(Q.name==='crisp'){S.reflOff=true;S.shadowOff=true;S.bloom=false;S.o.ss=1;S.needsRender=true;S.qualityStep='4K clarity retained';return S.qualityStep;}",'retain crisp resolution under load','page')
    oldget="try { const q = localStorage.getItem('gc500.showquality'); return ['balanced','high','ultra'].includes(q) ? q : 'auto'; } catch (e) { return 'auto'; }"
    newget="""try {
  let q=localStorage.getItem('gc500.showquality');
  if(!localStorage.getItem('gc500.clarity1182')){
   if(!q||q==='auto'){q='crisp';localStorage.setItem('gc500.showquality',q);}
   localStorage.setItem('gc500.clarity1182','1');
  }
  return ['balanced','high','ultra','crisp','auto'].includes(q)?q:'crisp';
 } catch(e){return 'crisp';}"""
    html=rep(html,oldget,newget,'clarity default and explicit choices','page')
    html=rep(html,'<option value="auto">Auto</option><option value="balanced">Balanced</option><option value="high">High</option><option value="ultra">Ultra</option>', '<option value="crisp">4K clarity</option><option value="auto">Auto</option><option value="balanced">Balanced</option><option value="high">High</option><option value="ultra">Ultra</option>','clarity choice','page')
    html=rep(html,'\n</body>\n</html>','\n<script>\n'+(HERE/'clarity1182_src.js').read_text()+'\n</script>\n</body>\n</html>','clarity engine','page')
    return rep(html,"+' · v11.81'; /* v8.19 release922","+' · v11.82'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.82 full truck load applied')
