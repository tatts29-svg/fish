"""Author: Andrew Fisher. Round fence stock, crisp 4K finish and truck-only corner stunt."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='ffacee9978f388e43559a02bf62a9ad01d2de0c3bf3b3326eb5c5cd19b279e6b'
def patch(html):
    if 'ShowcaseTruck1192' in html:raise ValueError('v11.92 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Wrong live base for v11.92; rebuild and retest against latest release')
    old=(HERE.parent/'v11.84_4k_truck_LIVE/truck1182_src.js').read_text().replace("author:'Andrew Fisher'","author:'the project manager'")
    html=rep(html,old,(HERE/'truck1192_src.js').read_text(),'round detailed fencing truck','page')
    html=rep(html,'const vehicleSurfaces800={paint:1,plant:2,','const vehicleSurfaces800={truckPaint1192:2,fenceZinc1192:4,paint:1,plant:2,','truck surface types','page')
    html=rep(html,'const materials={paint:',"const materials={truckPaint1192:[[.92,.94,.96],.29,.03,3],fenceZinc1192:[[.50,.53,.56],.38,.68,4],fenceBase1192:[[.75,.115,.016],.62,0,3],paint:",'truck-specific materials','page')
    html=rep(html,'vec4 finishEdges794(vec4 centre){\n if(uDetail781<.5||centre.a<.999)return centre;',
     'uniform float uNative1192;\nvec4 finishEdges794(vec4 centre){\n if(uNative1192>.5||uDetail781<.5||centre.a<.999)return centre;','retain native detail with MSAA','page')
    old="'uNightGamma','uNightKnee','uDetail781']"
    # Separate synchronous and cooperative shader builders, each checked exactly once.
    for start in ['comp:program(gl,POST_VS,COMP_FS,[','programs.comp=(yield* G.programSteps1157(gl,POST_VS,COMP_FS,[']:
        a=html.index(start);b=html.index('\n',a);chunk=html[a:b]
        changed=rep(chunk,old,"'uNightGamma','uNightKnee','uDetail781','uNative1192']",'native finish uniform','shader builder')
        html=rep(html,chunk,changed,'native finish shader builder','page')
    html=rep(html,'gl.uniform2f(P2.comp.u.uPixel,1/w,1/h);','gl.uniform2f(P2.comp.u.uPixel,1/w,1/h);\n gl.uniform1f(P2.comp.u.uNative1192,Q.name===\'crisp\'&&S.rt.samples>=4?1:0);','4K native finish selection','page')
    html=rep(html," /* v6.61 - the trailer's own contact shadow */"," if(G.truckContacts1192)G.truckContacts1192(S,sh,sy);\n /* v6.61 - the trailer's own contact shadow */",'tyre contact patches','page')
    html=rep(html,'gl.depthMask(false);flat(0,null,false);if(S.shade)S.shade.draw();',"""gl.depthMask(false);flat(0,null,false);
 if(S.vehicle==='fencing_truck'){gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2.2,-3.0);}
 if(S.shade)S.shade.draw();
 if(S.vehicle==='fencing_truck')gl.disable(gl.POLYGON_OFFSET_FILL);""",'contact shadow depth stability','page')
    html=rep(html,'\n</body>\n</html>','\n<script>\n'+(HERE/'stunt1192_src.js').read_text()+'\n</script>\n</body>\n</html>','decorative truck stunt','page')
    return rep(html,"+' · v11.91'; /* v8.19 release922","+' · v11.92'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.92 truck clarity and corner stunt applied')
