#!/usr/bin/env python3
"""Author: Andrew Fisher. Refine the existing full circuit without a separate scene."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(t,p):
    if 'G.fullLap788=' in t: raise SystemExit('v7.88 already applied')
    for marker in ['TRACK_DETAIL_OFF786','G.preview781=','const WAYIN784 = ']:
        if marker not in t: raise SystemExit('v7.88 requires the reviewed v7.86-or-later live base')
    def r(a,b,label):
        nonlocal t
        t=rep(t,a,b,label,p)
    # Replace only the executable extension modules. The original renderer's
    # simulation, registered geometry and complete camera implementation stay.
    start=t.index('/* Author: Andrew Fisher. Detailed foliage, with the original placement retained. */')
    end=t.index('</script>',start)
    sky=(HERE/'sky788_src.js').read_text()
    modules='\n'.join((HERE/name).read_text() for name in ['vegetation788_src.js','track_detail788_src.js','architecture788_src.js'])+'\n'+sky+'\n'+(HERE/'full_lap788_src.js').read_text()
    r(t[start:end],modules+'\n','Full-circuit detail modules')
    # The previous study hid existing features. The full-lap upgrade preserves
    # the original stands, people, start structure and every source building.
    r(' if(!S.detail781Enabled){\n /* start gantry: five red lamps, one at a time, then out */',' /* start gantry: five red lamps, one at a time, then out */','Retain the existing start gantry')
    r(' }\n /* aviation lights on the tallest towers */',' /* aviation lights on the tallest towers */','Retain gantry lighting scope')
    r('if(!S.detail781Enabled&&S.gantry){const m=S.sim||{},t=clock;','if(S.gantry){const m=S.sim||{},t=clock;','Retain existing start lamps')
    for old in ['if(S.standDecor&&S.standDecor.ni)','if(S.standMesh&&S.standMesh.ni)','if(S.standEdge)S.standEdge.draw();','if(S.crowdMesh&&S.crowdMesh.ni)','if(S.people&&S.people.n&&tg>0)','if(S.crowd&&(L.lines.dynAdd==null?1:L.lines.dynAdd)>0)']:
        r(old.replace('if(','if(!S.detail781Enabled&&',1),old,'Retain original stands and crowds')
    r('if(S.kerb){flat(detail781?14:0,L.mat.kerb);S.kerb.draw();}',
      'if(S.kerb){flat(detail781?14:0,L.mat.kerb);const paint788=S.detail781Enabled&&S.trackDetail781&&S.trackDetail781.paint;(paint788||S.kerb).draw();}',
      'Keep source road paint beside metre-scale physical kerbs')
    # Avoid coincident balcony layers. Original shells always remain visible;
    # source city detail is restored by the offline comparison control.
    r('if(S.cityDetail)S.cityDetail.draw();','if(S.cityDetail&&!(S.detail781Enabled&&S.architecture781))S.cityDetail.draw();','Single facade shadow layer')
    r('if(S.cityDetail){flat(5,L.day?null:', 'if(S.cityDetail&&!(S.detail781Enabled&&S.architecture781)){flat(5,L.day?null:', 'Single facade visible layer')
    # Road grain and binder detail are already world-space across the whole road.
    # Remove the study's two assumed repair patches and straight-only joins.
    a=t.index('  vec2 road=previewRoadPoint781(vP);') if '  vec2 road=previewRoadPoint781(vP);' in t else t.index(' vec2 road=previewRoadPoint781(vP);')
    b=t.index(' float neutral=dot(base,vec3(.2126,.7152,.0722));',a)
    r(t[a:b],' float laneAge=0.,repairMask781=0.,joint=0.;\n','Retain road surface without assumed local repairs')
    # Reuse the shadow target while it follows the car. Snap the projection in
    # light space so its texel grid stays stable; update only after 60+ metres.
    a=t.index('G.updateSunShadow=function(S){');b=t.index('G.bindSunShadow=function',a)
    shadow=t[a:b]
    shadow=shadow.replace('focus781=detail781?(S.detail781Focus||(S.CL?S.CL.at(S.gridS):[0,0])):[0,0];', '''focus781=[0,0];
 if(detail781){
  const p=S.pose?S.pose.pos:[S.CL.at(S.gridS)[0],0,S.CL.at(S.gridS)[1]],sun=G.sunDirection;
  if(R&&R.detail781&&Math.hypot(p[0]-R.focusX781,p[2]-R.focusZ781)<12){focus781[0]=R.focusX781;focus781[1]=R.focusZ781;}
  else{
   const right=G.V.norm(G.V.cross([0,1,0],sun)),up=G.V.cross(sun,right),step=144/size*32;
   const x=Math.round((p[0]*right[0]+p[2]*right[2])/step)*step,y=Math.round((p[0]*up[0]+p[2]*up[2])/step)*step;
   const den=right[0]*up[2]-right[2]*up[0];focus781[0]=(x*up[2]-y*right[2])/den;focus781[1]=(right[0]*y-up[0]*x)/den;
  }
 }''')
    alloc_a=shadow.index(' if(R){gl.deleteTexture(R.tex);gl.deleteFramebuffer(R.fb);}')
    alloc_b=shadow.index(' /* Focus the static sunlight map',alloc_a)
    shadow=shadow[:alloc_a]+''' const reuse=R&&R.size===size;
 if(!reuse){if(R){gl.deleteTexture(R.tex);gl.deleteFramebuffer(R.fb);}R={size,tex:gl.createTexture(),fb:gl.createFramebuffer()};}
 Object.assign(R,{source:S.bMesh,trees,detail781,focusX781:focus781[0],focusZ781:focus781[1],extra781:S.detail781ShadowMeshes,arch781:S.architecture781&&S.architecture781.mesh});S.sunShadow=R;
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,R.tex);
 if(!reuse){
  gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 }
 gl.bindFramebuffer(gl.FRAMEBUFFER,R.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,R.tex,0);
 gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);R.ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
'''+shadow[alloc_b:]
    shadow=shadow.replace('const span=detail781?48:235','const span=detail781?72:235')
    shadow=shadow.replace(' let R=S.sunShadow;', ' let R=S.sunShadow;\n if(S.shadowOff){if(R)R.ok=false;return R;}')
    shadow=shadow.replace(' if(R&&R.source===S.bMesh', ' if(R&&R.ok&&R.source===S.bMesh')
    if 'focus781=detail781?' in shadow:raise SystemExit('Shadow focus replacement did not match')
    r(t[a:b],shadow,'Stable reusable full-lap shadow target')
    return t

if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(apply(p.read_text(),str(p)));print('v7.88 full-lap detail applied; existing drive and cameras retained')
