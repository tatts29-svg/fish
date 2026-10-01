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
 return vec3(.21,.255,.32)+vec3(1.19,.96,.66)*direct;
}""", "shared preview light")
    r("float slope=1.-max(dot(normalize(normal),normalize(vec3(.45,.80,.40))),0.);",
      "float slope=1.-max(dot(normalize(normal),previewSun781()),0.);", "shadow slope")
    r("vec3 litConcrete=concrete*(ambient+.80*sun*visibility);\n litConcrete+=vec3(.010,.023,.038)*(1.-sun*.7);",
      """vec3 litConcrete=concrete*(ambient+.80*sun*visibility);
 litConcrete+=vec3(.010,.023,.038)*(1.-sun*.7);
 if(uDetail781>.5){
  float casting781=facadeNoise(vec2(vUVH.x*2.8,vY*.55))-.5;
  float streak=facadeNoise(vec2(vUVH.x*22.,vY*.21))-.5;
  litConcrete=concrete*(1.+casting781*.055+streak*.045)*previewSurface781(N,visibility);
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

    r("if(uMode<.5||uMode>11.5){\n float lit=uDay>.5?mix(.60,1.,sunlight(vWorld,vec3(0.,1.,0.))):1.;\n o=vec4(base*lit*a,a);",
      """if(uMode>12.5&&uMode<14.5&&uDetail781>.5){
 /* Mode 14 is the existing static kerb/marking batch. Its nominal broad rubber
    ribbon is not a measured tyre mark; omit that flat hard-edged overlay here.
    Simulation-generated tyre marks remain a separate, unchanged mode 10. */
 if(uMode>13.5&&vCol.a<.17&&max(vCol.r,max(vCol.g,vCol.b))<.020)discard;
 /* Preview road paint: millimetre-scale wear fades to its mean before minification.
    No time term: a held camera stays still and the surface cannot crawl. */
 vec2 wearP=vP*72.;
 float wear=(noise21(wearP)-.5)*surfaceDetail(wearP);
 float rubber=noise21(vP*vec2(4.1,1.7));
 vec3 paint=base*(.86+wear*.12-smoothstep(.67,.84,rubber)*.11);
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
  /* Dry aggregate, with a broad rough highlight rather than a wet mirror. The
     three existing spatial octaves are reused, keeping fill cost bounded. */
  vec3 N=vec3(0.,1.,0.),view=normalize(uEye-vWorld),halfV=normalize(view+previewSun781());
  float visibility=sunlight(vWorld,N);
  float broad=pow(max(dot(N,halfV),0.),18.);
  float grazing=.025+.11*pow(1.-max(dot(N,view),0.),5.);
  float neutral=dot(base,vec3(.2126,.7152,.0722));
  vec3 body=mix(base,vec3(neutral),.82)*.94*(1.+grain*.24+aggregate*.20+grade*.085);
  asphalt=body*(previewSurface781(N,visibility)+vec3(.035,.040,.045));
  asphalt+=vec3(1.05,.83,.57)*broad*grazing*.11*visibility;
  asphalt+=vec3(.0035,.0038,.0041)*stone*visibility;
 }
 /* An opaque road still fades with the same distant atmosphere as the city. */
 o=vec4(asphalt*fg,fg);""", "dry road aggregate")
    r("float direct=max(dot(N,normalize(vec3(.45,.80,.40))),0.);",
      "float direct=max(dot(N,previewSun781()),0.);", "concrete sun alignment")
    r("concrete=mix(concrete,concrete*vec3(.73,.72,.66),foot*.21*vertical);\n o=vec4(concrete*lit*a,a);",
      """concrete=mix(concrete,concrete*vec3(.73,.72,.66),foot*.21*vertical);
 vec3 colour=concrete*lit;
 if(uDetail781>.5){
  float stain=(noise21(vec2(p.x*19.,p.y*.42))-.5)*vertical;
  float lower=1.-smoothstep(.04,.23,vWorld.y);
  concrete*=1.+stain*.11-lower*.055*vertical;
  colour=concrete*previewSurface781(N,sunlight(vWorld,N));
 }
 o=vec4(colour*a,a);""", "concrete surface weathering")

    # Root owns the preview sky. This keeps the existing post-process sky's fallback
    # sun direction consistent if the optional background pass is absent.
    r("uniform vec3 uCamRight; uniform vec3 uCamUp; uniform vec3 uCamForward;",
      "uniform vec3 uCamRight; uniform vec3 uCamUp; uniform vec3 uCamForward; uniform float uDetail781;", "composite uniform")
    r("float angle=max(dot(ray,normalize(vec3(.45,.80,.40))),0.);",
      "float angle=max(dot(ray,normalize(mix(vec3(.45,.80,.40),vec3(-.55,.45,.70),uDetail781))),0.);", "sky sun alignment")

    r("'uShadowTexel','uBTint','uBLift']),", "'uShadowTexel','uBTint','uBLift','uDetail781']),", "mesh uniform registration")
    r("'uDay','uShadow','uLightVP','uShadowOn','uShadowTexel']),", "'uDay','uShadow','uLightVP','uShadowOn','uShadowTexel','uDetail781']),", "flat uniform registration")
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
      "gl.uniform1f(pr.flat.u.uDay,L.day);gl.uniform1f(pr.flat.u.uDetail781,detail781);gl.uniform3fv(pr.flat.u.uEye,cam.eye);", "flat preview binding")
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
