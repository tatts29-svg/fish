"""Author: Andrew Fisher. Showcase scenery and the decorative fencing truck."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='862c9a63880169e2cfdb0f293b9fd662e2643c6c792a824f2ffc4bc454618b01'
def patch(html):
    if 'G.fencingTruck1177' in html:raise ValueError('v11.77 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Wrong live base for v11.77')
    html=rep(html,'G.dressCircuit=function(S,k){',"Object.assign(DRESS_FONT,{X:['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],Y:['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..']});\n"+(HERE/'scenery1177_src.js').read_text()+'\nG.dressCircuit=function(S,k){','static scenery helpers','page')
    start=html.index('G.dressCircuit=function(S,k){');begin=html.index('/* 2. banners on the catch fence',start);end=html.index('/* 3. braking boards',begin)
    html=rep(html,html[begin:end],'G.sceneryBanners1177(S,{loops,sampleLoop,panel,text,H,M,stats});\n ','nominal banners sync','page')
    start=html.index('G.dressCircuitSteps1157=function*(S,k){');begin=html.index('(yield* G.eachSteps1157(loops,',start);end=html.index('(yield* G.eachSteps1157(corners,',begin)
    html=rep(html,html[begin:end],'yield* G.sceneryBannersSteps1177(S,{loops,sampleLoop,panel,text,H,M,stats});\n ','nominal banners cooperative','page')
    html=rep(html,'centre=[target.p[0]+n[0]*(.58/M*.62-.012),target.p[1]+n[1]*(.58/M*.62-.012)],','centre=[target.p[0]+n[0]*(r.wallFace1177?-.012/M:.58/M*.62-.012),target.p[1]+n[1]*(r.wallFace1177?-.012/M:.58/M*.62-.012)],','retain wall-face setback in corridor','page')
    html=rep(html,'G.setVehicle=function(kind){',(HERE/'truck1177_src.js').read_text()+'\nG.setVehicle=function(kind){','fencing carrier','page')
    html=rep(html,"['tractor', 'Paddock Basher', 'Tractor']];","['tractor', 'Paddock Basher', 'Tractor'], ['fencing_truck', 'Advanced Fencing', 'Fencing truck']];",'garage option','page')
    html=rep(html,'<option value="tractor">Tractor</option></select></label>','<option value="tractor">Tractor</option><option value="fencing_truck">Advanced Fencing truck</option></select></label>','vehicle selector','page')
    for name in ['G.setStands=function(stands){','G.setStandsSteps1157=function*(stands){']:
        start=html.index(name);end=html.index('S.stands.push',start);block=html[start:end]
        changed=block.replace('RAIL=[1,.62,.30,.75]','RAIL=[.58,.63,.67,.9]').replace('ROOF=[.16,.18,.21,1]','ROOF=[.60,.64,.65,1]').replace('TIER=[.45,.55,.68,.30]','TIER=[.035,.32,.64,.85]').replace('ORANGE=[1,.42,.08,1]','ORANGE=[.035,.32,.64,1]')
        if changed==block:raise ValueError('Missing stand palette')
        html=rep(html,block,changed,'grandstand finish '+name,'page')
    needle=' }else{\n /* Unequal branch crowns break up the foliage outline.'
    pine=" }else if(decorative&&mid&&x< -65&&shapeHash(x,z,3)<.64){\n vegetationTree781.conifer1177=true;\n branch([x,y0,z],[x,y0+h*.94,z],r*.055,r*.015,7);\n G.sceneryPine1177(dayTR,vegetationTree781);\n }else{\n /* Unequal branch crowns break up the foliage outline."
    if html.count(needle)!=2:raise ValueError('Tree constructor twins changed')
    # Distinguish twins by their containing loadPack implementation.
    for label,head in [('sync','G.loadPack=function('),('cooperative','G.loadPackSteps1157=function*(')]:
        start=html.index(head);pos=html.index(needle,start);before=html[start:pos+len(needle)];after=before[:-len(needle)]+pine
        html=rep(html,before,after,'tiered roadside crowns '+label,'page')
    html=rep(html,"conifer:!q.palm&&q.mid&&q.h/Math.max(q.r,.001)>1.65&&hash(q.x,q.z,731)<.32", "conifer:!!q.conifer1177||(!q.palm&&q.mid&&q.h/Math.max(q.r,.001)>1.65&&hash(q.x,q.z,731)<.32)",'retain crown in enhanced detail','page')
    html=rep(html,'sync.call(root,!SHOW.playing||SHOW.reduced||motionOff());\n show3dNote();','sync.call(root,!SHOW.playing||SHOW.reduced||motionOff());\n showViewSync();\n show3dNote();','show vehicle controls after asynchronous mount','page')
    return rep(html,"+' · v11.76'; /* v8.19 release922","+' · v11.77'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.77 Showcase scenery and fencing truck applied')
