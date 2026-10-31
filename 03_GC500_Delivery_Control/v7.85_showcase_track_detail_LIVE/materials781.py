"""Author: Andrew Fisher. Opt-in track preview materials; no record or default-look changes."""


def apply(text, rep, path):
    if "previewSurface781" in text:
        raise SystemExit("v7.81 materials already applied")

    def r(old, new, label):
        nonlocal text
        text = rep(text, old, new, "v7.81 " + label, path)

    # Shared by the active city's and track's shaders. The branch is zero unless
    # the working preview is explicitly enabled; all original expressions remain.
    r("uniform highp sampler2D uShadow; uniform mat4 uLightVP; uniform float uShadowOn; uniform vec2 uShadowTexel;",
      """uniform highp sampler2D uShadow; uniform mat4 uLightVP; uniform float uShadowOn; uniform vec2 uShadowTexel;
uniform float uDetail781;
vec3 previewSun781(){return normalize(mix(vec3(.45,.80,.40),vec3(-.55,.45,.70),uDetail781));}
vec3 previewSurface781(vec3 normal,float visibility){
 float direct=max(dot(normal,previewSun781()),0.)*visibility;
 /* Sky fill follows surface orientation; downward faces retain warm ground bounce.
    This gives cap edges, barrier feet and shaded facades a common light response. */
 vec3 fill=mix(vec3(.105,.112,.123),vec3(.25,.295,.355),clamp(normal.y*.5+.5,0.,1.));
 return fill+vec3(1.16,.995,.78)*direct;
}""", "shared preview light")
    r("float slope=1.-max(dot(normalize(normal),normalize(vec3(.45,.80,.40))),0.);",
      "float slope=1.-max(dot(normalize(normal),previewSun781()),0.);", "shadow slope")
    r("float bias=.00032+.0011*slope;\n float lit=0.;",
      """float bias=.00032+.0011*slope;
 if(uDetail781>.5){
  /* The NEAREST depth map needs interpolation of comparison results, not
     interpolation of depth. Preserve the 3x3 filter footprint while removing
     its discrete n/9 brightness bands across kerbs and the adjacent road. */
  vec2 pixel=q.xy/uShadowTexel-.5,cell=floor(pixel),f=fract(pixel);
  float lit781=0.;
  for(int y=-1;y<=2;y++)for(int x=-1;x<=2;x++){
   vec2 uv=(cell+vec2(float(x),float(y))+.5)*uShadowTexel;
   float wx=x==-1?1.-f.x:(x==2?f.x:1.),wy=y==-1?1.-f.y:(y==2?f.y:1.);
   float sampleLit=(uv.x<=0.||uv.x>=1.||uv.y<=0.||uv.y>=1.)?1.:step(q.z-bias,texture(uShadow,uv).r);
   lit781+=sampleLit*wx*wy;
  }
  return lit781/9.;
 }
 float lit=0.;""", "continuous preview shadow filtering")
    r("vec3 litConcrete=concrete*(ambient+.80*sun*visibility);\n litConcrete+=vec3(.010,.023,.038)*(1.-sun*.7);",
      """vec3 litConcrete=concrete*(ambient+.80*sun*visibility);
 litConcrete+=vec3(.010,.023,.038)*(1.-sun*.7);
 if(uDetail781>.5){
  vec2 castingP781=vec2(vUVH.x*2.8,vY*.55),streakP781=vec2(vUVH.x*22.,vY*.21);
  float casting781=(facadeNoise(castingP781)-.5)*(1.-smoothstep(.3,1.,max(fwidth(castingP781.x),fwidth(castingP781.y))));
  float streak=(facadeNoise(streakP781)-.5)*(1.-smoothstep(.3,1.,max(fwidth(streakP781.x),fwidth(streakP781.y))));
  litConcrete=concrete*(1.+casting781*.10+streak*.065)*previewSurface781(N,visibility);
 }""", "coastal concrete light")
    r("col=mix(litConcrete,roof*(.37+.73*sun*visibility),top)*foot;",
      "col=mix(litConcrete,roof*(uDetail781>.5?previewSurface781(N,visibility):vec3(.37+.73*sun*visibility)),top)*foot;", "roof light")
    r("vec3 sky=facadeReflection(R);\n float room=hash(c+vec2(seed*79.,seed*31.));",
      """vec3 sky=facadeReflection(R);
 if(uDetail781>.5){
  float warm=pow(max(dot(R,previewSun781()),0.),4.);
  sky=sky*vec3(.92,.98,1.05)+vec3(.29,.16,.045)*warm;
 }
 float room=hash(c+vec2(seed*79.,seed*31.));""", "warm facade reflection")
    r("col=mix(col,vec3(.67,.76,.80),haze*.22);",
      "col=mix(col,uDetail781>.5?vec3(.62,.66,.67):vec3(.67,.76,.80),haze*.22);", "depth atmosphere")

    r("float surfaceDetail(vec2 p){return 1.-smoothstep(.22,.85,max(fwidth(p.x),fwidth(p.y)));}",
      """float surfaceDetail(vec2 p){return 1.-smoothstep(.22,.85,max(fwidth(p.x),fwidth(p.y)));}
uniform vec4 uSurfaceFrame781;
/* Only local surface dressing uses this frame; the road and its source vertices
   remain untouched. Coordinates are metres along the existing grid straight. */
vec2 previewRoadPoint781(vec2 world){
 vec2 q=(world-uSurfaceFrame781.xy)*5.937552372855356,f=uSurfaceFrame781.zw;
 return vec2(dot(q,vec2(-f.y,f.x)),dot(q,f));
}
float previewRepair781(vec2 p,vec2 halfSize){
 vec2 q=abs(p)-halfSize;
 float d=length(max(q,vec2(0.)))+min(max(q.x,q.y),0.);
 float aa=max(fwidth(d),.014);
 vec2 coverage=min(vec2(1.),halfSize*2./max(fwidth(p),vec2(.0001)));
 return (1.-smoothstep(-aa,aa,d))*coverage.x*coverage.y;
}""", "stable road material frame")

    r("if(uMode<.5||uMode>11.5){\n float lit=uDay>.5?mix(.60,1.,sunlight(vWorld,vec3(0.,1.,0.))):1.;\n o=vec4(base*lit*a,a);",
      """if(uMode>12.5&&uMode<14.5&&uDetail781>.5){
 /* Mode 14 is the existing static kerb/marking batch. Its nominal broad rubber
    ribbon is not a measured tyre mark; omit that flat hard-edged overlay here.
    Simulation-generated tyre marks remain a separate, unchanged mode 10. */
 if(uMode>13.5&&vCol.a<.17&&max(vCol.r,max(vCol.g,vCol.b))<.020)discard;
 /* Preview road paint: millimetre-scale wear fades to its mean before minification.
    No time term: a held camera stays still and the surface cannot crawl. */
 vec2 wearP=vP*72.,rubberP=vP*vec2(4.1,1.7);
 float wear=(noise21(wearP)-.5)*surfaceDetail(wearP);
 float rubber=mix(.5,noise21(rubberP),surfaceDetail(rubberP));
 vec3 paint=base*(.89+wear*.16-smoothstep(.67,.84,rubber)*.13);
 float visibility=sunlight(vWorld,vec3(0.,1.,0.));
 o=vec4(paint*previewSurface781(vec3(0.,1.,0.),visibility)*a,a);
 }else if(uMode<.5||uMode>11.5){
 float lit=uDay>.5?mix(.60,1.,sunlight(vWorld,vec3(0.,1.,0.))):1.;
 vec3 colour=base*lit;
 if(uDetail781>.5&&uShadowOn>.5){
  vec3 raw=cross(dFdx(vWorld),dFdy(vWorld));
  vec3 N=raw/max(length(raw),.000001);if(dot(N,uEye-vWorld)<0.)N=-N;
  colour=base*previewSurface781(N,sunlight(vWorld,N));
 }
 o=vec4(colour*a,a);""", "preview surface and paint shading")
    r("vec3 view=normalize(uEye-vWorld),R=reflect(-view,N),sun=normalize(vec3(.45,.80,.40));",
      "vec3 view=normalize(uEye-vWorld),R=reflect(-view,N),sun=previewSun781();", "water sun alignment")
    r("/* An opaque road still fades with the same distant atmosphere as the city. */\n o=vec4(asphalt*fg,fg);",
      """if(uDetail781>.5){
  /* Fine stones, centimetre aggregate and worn binder have distinct scales.
     Filter every octave before minification; no time/screen-space noise, normal
     perturbation or sharp glints that can turn dry road into glitter in motion. */
  vec3 N=vec3(0.,1.,0.),view=normalize(uEye-vWorld),halfV=normalize(view+previewSun781());
  float visibility=sunlight(vWorld,N);
  vec2 binderP=vP*23.,settleP=vP*6.8;
  float binder=(noise21(binderP)-.5)*surfaceDetail(binderP);
  float settle=(noise21(settleP)-.5)*surfaceDetail(settleP);
  float dryGrade=grade*surfaceDetail(vP*1.7);
  vec2 road=previewRoadPoint781(vP);
  float section=(1.-smoothstep(108.,145.,abs(road.y)))*(1.-smoothstep(13.,17.,abs(road.x)));
  /* Restrained, illustrative paving joints and repairs follow this same street.
     They are surface colour only, never a changed road edge or invented kerb. */
  float jointWander=(noise21(vec2(road.y*.18,3.7))-.5)*.036;
  float jointDistance=min(abs(road.x+3.35+jointWander),abs(road.x-3.10+jointWander));
  float jointAA=max(fwidth(jointDistance),.012);
  float joint=(1.-smoothstep(.018-jointAA,.018+jointAA,jointDistance))*min(1.,.036/max(fwidth(road.x),.0001))*section;
  float repairMask781=previewRepair781(road-vec2(-6.1,-65.),vec2(.62,1.55));
  repairMask781=max(repairMask781,previewRepair781(road-vec2(5.8,22.),vec2(.78,2.15)))*section;
  float laneAge=(smoothstep(-3.50,-3.18,road.x)-smoothstep(3.0,3.25,road.x))*section;
  float neutral=dot(base,vec3(.2126,.7152,.0722));
  vec3 body=mix(base,vec3(neutral),.90)*vec3(.90,.92,.945);
  body*=1.+grain*.38+aggregate*.36+binder*.22+settle*.16+dryGrade*.10-laneAge*.024;
  body*=1.-repairMask781*.115-joint*.15;
  float roughness=clamp(.84+binder*.12+dryGrade*.055+repairMask781*.045,.76,.94);
  float broad=pow(max(dot(N,halfV),0.),mix(24.,9.,roughness));
  float grazing=.025+.085*pow(1.-max(dot(N,view),0.),5.);
  asphalt=body*previewSurface781(N,visibility);
  asphalt+=vec3(1.02,.89,.73)*broad*grazing*.095*visibility;
  asphalt+=vec3(.0030,.0032,.0034)*stone*visibility;
 }
 /* An opaque road still fades with the same distant atmosphere as the city. */
 o=vec4(asphalt*fg,fg);""", "dry road aggregate")
    r("float direct=max(dot(N,normalize(vec3(.45,.80,.40))),0.);",
      "float direct=max(dot(N,previewSun781()),0.);", "concrete sun alignment")
    r("concrete=mix(concrete,concrete*vec3(.73,.72,.66),foot*.21*vertical);\n o=vec4(concrete*lit*a,a);",
      """concrete=mix(concrete,concrete*vec3(.73,.72,.66),foot*.21*vertical);
 vec3 colour=concrete*lit;
 if(uDetail781>.5){
  vec2 stainP=vec2(p.x*19.,p.y*.42),pourP=p*vec2(2.4,5.7);
  float stain=(noise21(stainP)-.5)*surfaceDetail(stainP)*vertical;
  float pour=(noise21(pourP)-.5)*surfaceDetail(pourP);
  float lower=1.-smoothstep(.055,.24,vWorld.y);
  /* Keep orange/white paint identities while breaking up the cast substrate. */
  float chalk=smoothstep(.57,.80,noise21(p*8.3))*surfaceDetail(p*8.3);
  concrete=base*(1.+casting*surfaceDetail(p*3.4)*.13+grit*.19+weather*surfaceDetail(vec2(p.x*13.,p.y*.7))*.13-pores*.20);
  concrete*=1.+pour*.105+stain*.15-lower*.14*vertical;
  concrete=mix(concrete,concrete*vec3(1.045,1.033,1.01),chalk*.42);
  colour=concrete*previewSurface781(N,sunlight(vWorld,N));
 }
 o=vec4(colour*a,a);""", "concrete surface weathering")

    r("float coverage=1.-(1.-wire.x)*(1.-wire.y);a*=coverage;\n if(a<.006)discard;\n o=vec4(base*mix(.35,1.,uDay)*a,a);",
      """float coverage=1.-(1.-wire.x)*(1.-wire.y);a*=coverage;
 vec3 wireColour781=base*mix(.35,1.,uDay);
 if(uDetail781>.5){
  /* The registered catch fence already supplies its geometry and filtered wire
     coverage. Light that surface with the same key and sky as the track, rather
     than painting uniformly bright wire over the shaded surroundings. Derive
     the normal before the coverage discard so thin wires keep valid gradients. */
  vec3 raw781=cross(dFdx(vWorld),dFdy(vWorld));
  float scale781=max(max(abs(raw781.x),max(abs(raw781.y),abs(raw781.z))),.000000000001);
  vec3 scaled781=raw781/scale781;float length781=length(scaled781);
  vec3 normal781=length781>.00001?scaled781/max(length781,.00001):vec3(0.,1.,0.);
  if(dot(normal781,uEye-vWorld)<0.)normal781=-normal781;
  vec3 light781=previewSurface781(normal781,1.);
  /* Dull galvanised wire has broad reflected light, not needle highlights.
     Coverage above still converges to the physical wire area at distance. No
     time noise, new shadow samples or draw calls are introduced. */
  wireColour781=base*(vec3(.08)+light781*.68);
 }
 if(a<.006)discard;
 o=vec4(wireColour781*a,a);""", "orientation-lit catch fence")

    # Root owns the preview sky. This keeps the existing post-process sky's fallback
    # sun direction consistent if the optional background pass is absent.
    r("uniform vec3 uCamRight; uniform vec3 uCamUp; uniform vec3 uCamForward;",
      "uniform vec3 uCamRight; uniform vec3 uCamUp; uniform vec3 uCamForward; uniform float uDetail781;", "composite uniform")
    r("float angle=max(dot(ray,normalize(vec3(.45,.80,.40))),0.);",
      "float angle=max(dot(ray,normalize(mix(vec3(.45,.80,.40),vec3(-.55,.45,.70),uDetail781))),0.);", "sky sun alignment")

    r("'uShadowTexel','uBTint','uBLift']),", "'uShadowTexel','uBTint','uBLift','uDetail781']),", "mesh uniform registration")
    r("'uDay','uShadow','uLightVP','uShadowOn','uShadowTexel']),", "'uDay','uShadow','uLightVP','uShadowOn','uShadowTexel','uDetail781','uSurfaceFrame781']),", "flat uniform registration")
    r("'uNightGain','uNightGamma','uNightKnee'])", "'uNightGain','uNightGamma','uNightKnee','uDetail781'])", "composite uniform registration")
    r("G.sunDirection=G.V.norm([.45,.8,.4]);", """G.sunDirection=G.V.norm([.45,.8,.4]);
G.detail781Sun=G.V.norm([-.55,.45,.70]);
G.default781Sun=G.sunDirection;""", "preview sun constant")
    r("if(R&&R.source===S.bMesh&&R.trees===trees&&R.size===size)return R;",
      """const detail781=!!(S.detail781Enabled&&S.look&&S.look.day),focus781=detail781?(S.detail781Focus||(S.CL?S.CL.at(S.gridS):[0,0])):[0,0];
 if(R&&R.source===S.bMesh&&R.trees===trees&&R.size===size&&R.detail781===detail781&&R.focusX781===focus781[0]&&R.focusZ781===focus781[1]&&R.extra781===S.detail781ShadowMeshes&&R.arch781===(S.architecture781&&S.architecture781.mesh))return R;""", "shadow cache key")
    r("R=S.sunShadow={size,source:S.bMesh,trees,ok:false,tex:gl.createTexture(),fb:gl.createFramebuffer()};",
      "R=S.sunShadow={size,source:S.bMesh,trees,detail781,focusX781:focus781[0],focusZ781:focus781[1],extra781:S.detail781ShadowMeshes,arch781:S.architecture781&&S.architecture781.mesh,ok:false,tex:gl.createTexture(),fb:gl.createFramebuffer()};", "shadow cache data")
    r("const span=235,near=1,far=1500,O=new Float32Array([1/span,0,0,0,0,1/span,0,0,0,0,-2/(far-near),0,0,0,-(far+near)/(far-near),1]);\n const sun=G.sunDirection;R.vp=G.matMul(O,G.lookAt(G.V.mul(sun,700),[0,0,0],[0,1,0]));",
      """const span=detail781?48:235,near=1,far=1500,O=new Float32Array([1/span,0,0,0,0,1/span,0,0,0,0,-2/(far-near),0,0,0,-(far+near)/(far-near),1]);
 const sun=G.sunDirection,focus=detail781?[focus781[0],0,focus781[1]]:[0,0,0];
 R.vp=G.matMul(O,G.lookAt(G.V.add(G.V.mul(sun,700),focus),focus,[0,1,0]));""", "focused preview shadows")
    r("if(S.trackConcrete){S.trackConcrete.draw();S.trackFencePosts.draw();}else if(S.barrier)S.barrier.draw();\n gl.disable(gl.POLYGON_OFFSET_FILL);",
      """if(S.trackConcrete){S.trackConcrete.draw();S.trackFencePosts.draw();}else if(S.barrier)S.barrier.draw();
 if(detail781)for(const batch of S.detail781ShadowMeshes||[])if(batch&&batch.draw)batch.draw();
 gl.disable(gl.POLYGON_OFFSET_FILL);""", "preview furniture shadow casters")
    r("const Q=S.quality||G.QUALITY.high;\n const max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);",
      """const Q=S.quality||G.QUALITY.high;
 const detail781=S.detail781Enabled&&L.day?1:0;
 G.sunDirection=detail781?G.detail781Sun:G.default781Sun;
 const max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);""", "render preview switch")
    r("gl.uniform3fv(pr.mesh.u.uEye,cam.eye);G.bindSunShadow(S,pr.mesh,!!L.day);",
      "gl.uniform3fv(pr.mesh.u.uEye,cam.eye);gl.uniform1f(pr.mesh.u.uDetail781,detail781);G.bindSunShadow(S,pr.mesh,!!L.day);", "mesh preview binding")
    r("gl.uniform1f(pr.flat.u.uDay,L.day);gl.uniform3fv(pr.flat.u.uEye,cam.eye);",
      """gl.uniform1f(pr.flat.u.uDay,L.day);gl.uniform1f(pr.flat.u.uDetail781,detail781);gl.uniform3fv(pr.flat.u.uEye,cam.eye);
 if(detail781){
  /* Cache by the registered centreline, not camera or clock: held and moving
     frames sample precisely the same surface and rendering stays reproducible. */
  if(!S.surfaceFrame781||S.surfaceFrame781.source!==S.CL||S.surfaceFrame781.grid!==S.gridS){
   const a=S.CL.at(S.gridS),b=S.CL.at(S.gridS+.2),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
   S.surfaceFrame781={source:S.CL,grid:S.gridS,value:new Float32Array([a[0],a[1],dx/len,dz/len])};
  }
  gl.uniform4fv(pr.flat.u.uSurfaceFrame781,S.surfaceFrame781.value);
 }""", "flat preview binding")
    r("if(S.kerb){flat(0,L.mat.kerb);S.kerb.draw();}",
      "if(S.kerb){flat(detail781?14:0,L.mat.kerb);S.kerb.draw();}", "static road marking preview")
    r("gl.uniform1f(P2.comp.u.uK,L.bloom);gl.uniform1f(P2.comp.u.uDay,L.day);",
      "gl.uniform1f(P2.comp.u.uK,L.bloom);gl.uniform1f(P2.comp.u.uDay,L.day);gl.uniform1f(P2.comp.u.uDetail781,detail781);", "composite preview binding")

    # Match the surfaced car's key and reflection colour to the surrounding track.
    # No body mesh, logo, racing number, livery, geometry or animation is changed.
    r("uniform vec3 uEye;uniform vec3 uColor;uniform float uRough;", "uniform float uDetail781;uniform vec3 uEye;uniform vec3 uColor;uniform float uRough;", "car preview uniform")
    r("vec3 N=normalize(vNormal),V=normalize(uEye-vWorld),L=normalize(vec3(.45,.8,.4));if(dot(N,V)<0.)N=-N;",
      "vec3 N=normalize(vNormal),V=normalize(uEye-vWorld),L=normalize(mix(vec3(.45,.8,.4),vec3(-.55,.45,.70),uDetail781));if(dot(N,V)<0.)N=-N;", "car key direction")
    r("vec3 col=base*(1.-metal)*(skyFill+nl*.82*mix(.25,1.,uDay));",
      """vec3 col=base*(1.-metal)*(skyFill+nl*.82*mix(.25,1.,uDay));
 if(uDetail781>.5){
  col=base*(1.-metal)*(vec3(.24,.285,.35)+vec3(1.06,.85,.60)*nl*.82);
  float skyWarm=pow(max(dot(reflect(-V,N),L),0.),4.);
  reflected=reflected*vec3(.94,.99,1.05)+vec3(.20,.11,.025)*skyWarm;
 }""", "car warm key cool fill")
    r("'uFog','uAtlas',...(G.raceReflectionUniformNames||[])])", "'uFog','uAtlas','uDetail781',...(G.raceReflectionUniformNames||[])])", "car uniform registration")
    r("gl.uniform1f(u.uDay,S.look.day);gl.uniform1f(u.uBrake,brake);",
      "gl.uniform1f(u.uDay,S.look.day);gl.uniform1f(u.uDetail781,S.detail781Enabled&&S.look.day?1:0);gl.uniform1f(u.uBrake,brake);", "car preview binding")
    return text
