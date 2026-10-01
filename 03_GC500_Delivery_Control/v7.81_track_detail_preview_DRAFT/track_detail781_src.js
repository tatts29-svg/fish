/* Author: Andrew Fisher.
 * v7.81 — one photo-informed track section, opt-in working preview only.
 * The supplied photographs establish visual form, not dimensions or surveyed placement.
 * Offsets below are illustrative metres along the existing grid straight. No records are read or written.
 * Keep the existing car, driving simulation, MP4/weather, gauges and ordinary Showcase unchanged.
 */
(function () {
'use strict';
const G = window.GC3D;
if (!G || G.installTrackDetail781) return;
const SOURCE = 'Photo-informed temporary works; illustrative grid-relative placement, not surveyed';
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
layout(location=3) in vec4 aColour;
uniform mat4 uVP;
out vec3 vWorld; out vec3 vNormal; out vec2 vUV; out vec4 vColour; out float vDepth;
void main(){vec4 p=uVP*vec4(aPosition,1.);gl_Position=p;vDepth=p.w;vWorld=aPosition;vNormal=aNormal;vUV=aUV;vColour=aColour;}`;
const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec2 vUV; in vec4 vColour; in float vDepth;
uniform sampler2D uAtlas; uniform vec3 uEye; uniform vec3 uSun; uniform vec2 uFog; uniform float uDay;
uniform float uDeck; uniform float uMetres;
uniform highp sampler2D uShadow; uniform mat4 uLightVP; uniform float uShadowOn; uniform vec2 uShadowTexel;
out vec4 outColour;
float grain781(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float stone781(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(grain781(i),grain781(i+vec3(1,0,0)),f.x),mix(grain781(i+vec3(0,1,0)),grain781(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(grain781(i+vec3(0,0,1)),grain781(i+vec3(1,0,1)),f.x),mix(grain781(i+vec3(0,1,1)),grain781(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float visibility(vec3 n){
 if(uShadowOn<.5)return 1.;
 vec4 p=uLightVP*vec4(vWorld,1.);vec3 q=p.xyz/max(p.w,.00001)*.5+.5;
 if(any(lessThanEqual(q,vec3(0.)))||any(greaterThanEqual(q,vec3(1.))))return 1.;
 float bias=.00035+.0011*(1.-max(dot(n,normalize(uSun)),0.));float lit=0.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
 vec2 uv=q.xy+vec2(float(x),float(y))*uShadowTexel;
 lit+=(any(lessThanEqual(uv,vec2(0.)))||any(greaterThanEqual(uv,vec2(1.))))?1.:step(q.z-bias,texture(uShadow,uv).r);}
 return lit/9.;
}
void main(){
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 vec3 view=normalize(uEye-vWorld),sun=normalize(uSun);
 vec3 ink=texture(uAtlas,vUV).rgb;vec3 base=pow(max(ink,vec3(.001)),vec3(2.2))*vColour.rgb;
 float rough=clamp(vColour.a,.15,1.),direct=max(dot(n,sun),0.),shadow=visibility(n);
 vec3 skyFill=mix(vec3(.105,.112,.123),vec3(.25,.295,.355),clamp(n.y*.5+.5,0.,1.));
 vec3 daylight=skyFill+vec3(1.16,.995,.78)*direct*shadow;
 /* Stable world-space wear, filtered before minification. Lower-edge dust
    belongs to the barrier, not the sign artwork or a screen-space overlay. */
 float height=(vWorld.y-uDeck)*uMetres;
 vec3 surfacePoint=vWorld*uMetres*6.;
 float detailCoverage=1.-smoothstep(.30,1.,max(length(dFdx(surfacePoint)),length(dFdy(surfacePoint))));
 float grain=(stone781(surfacePoint)-.5)*detailCoverage;
 float substrate=smoothstep(.70,.92,rough);
 float foot=(1.-smoothstep(.04,.32,height))*(1.-abs(n.y))*substrate;
 base*=1.+grain*.085*substrate-foot*.19;
 rough=clamp(rough+grain*.025,.15,1.);
 vec3 halfVector=normalize(view+sun);float spec=pow(max(dot(n,halfVector),0.),mix(130.,10.,rough));
 vec3 light=base*mix(vec3(.20),daylight,clamp(uDay,0.,1.));
 light+=vec3(1.,.80,.59)*spec*(1.-rough)*.16*shadow*mix(.15,1.,uDay);
 float fog=1.-smoothstep(uFog.x,uFog.y,vDepth);
 outColour=vec4(light*fog,fog);
}`;
const add=(a,b,k=1)=>a.map((x,i)=>x+b[i]*k);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const METAL=[.29,.33,.36,.52],DARK=[.10,.12,.135,.64],CONCRETE=[.46,.45,.42,.95],BLACK=[.032,.034,.037,.83],WHITE=[1,1,1,.77];
function shader(gl,type,source){
 const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('Track preview shader: '+error);}
 return s;
}
function program(gl){
 const vs=shader(gl,gl.VERTEX_SHADER,VS),fs=shader(gl,gl.FRAGMENT_SHADER,FS),p=gl.createProgram();
 gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const error=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error('Track preview shader link: '+error);}
 const u={};for(const name of ['uVP','uAtlas','uEye','uSun','uFog','uDay','uDeck','uMetres','uShadow','uLightVP','uShadowOn','uShadowTexel'])u[name]=gl.getUniformLocation(p,name);
 return {p,u};
}
/* One local canvas atlas: browser font rasterisation, mipmaps and anisotropic filtering.
 * No private photograph or sponsor artwork is uploaded or fetched. These are typographic reconstructions.
 */
function geometry(S){
 const M=G.M_PER_PT||6,H=S.tune.deckH,frames=new Map(),edges=new Map(),segments=[];
 const frame=s=>{if(frames.has(s))return frames.get(s);const a=S.CL.at(S.gridS+s/M),b=S.CL.at(S.gridS+(s+.4)/M),t=unit([b[0]-a[0],0,b[1]-a[1]]),f={p:[a[0],H,a[1]],t,n:[-t[2],0,t[0]],half:a[2]*M/2};frames.set(s,f);return f;};
 // Reproduce the existing barrier's exact mitered front line, rather than estimating its offset.
 for(const [loop,sg,height] of [[S.outer,1,.30*M],[S.inner,-1,.22*M]]){
  const P=G.dens?G.dens(loop,2.2):loop;
  const joins=P.map((p,k)=>{const a=P[(k+P.length-1)%P.length],b=P[(k+1)%P.length],before=unit([p[0]-a[0],0,p[1]-a[1]]),after=unit([b[0]-p[0],0,b[1]-p[1]]),n0=[-before[2]*sg,0,before[0]*sg],n1=[-after[2]*sg,0,after[0]*sg],divisor=Math.max(.08,1+n0[0]*n1[0]+n0[2]*n1[2]),n=n0.map((v,i)=>(v+n1[i])/divisor),length=Math.hypot(n[0],n[2]);return length>2.6?n.map(v=>v*2.6/length):n;});
  for(let k=0;k<P.length;k++){const j=(k+1)%P.length;segments.push({a:[P[k][0]+joins[k][0]*.45,P[k][1]+joins[k][2]*.45],b:[P[j][0]+joins[j][0]*.45,P[j][1]+joins[j][2]*.45],height});}
 }
 const edgeInfo=(s,sg)=>{
  const key=s+':'+sg;if(edges.has(key))return edges.get(key);
  const f=frame(s),p=[f.p[0],f.p[2]],n=[f.n[0]*sg,f.n[2]*sg],cross2=(a,b)=>a[0]*b[1]-a[1]*b[0];let hit=Infinity,height=1.32;
  for(const seg of segments){const {a,b}=seg,v=[b[0]-a[0],b[1]-a[1]],q=[a[0]-p[0],a[1]-p[1]],den=cross2(n,v);if(Math.abs(den)<1e-9)continue;const t=cross2(q,v)/den,u=cross2(q,n)/den;if(t>0&&u>=0&&u<=1&&t<hit){hit=t;height=seg.height;}}
  const result={distance:Number.isFinite(hit)?hit*M:f.half+.45*M,height};edges.set(key,result);return result;
 };
 return {M,H,frame,edgeInfo,edge:(s,sg)=>edgeInfo(s,sg).distance};
}
function makeAtlas(gl,geo){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;
 const c=canvas.getContext('2d');if(!c)throw new Error('Track preview canvas is unavailable');
 c.fillStyle='#fff';c.fillRect(0,0,2048,2048);
 const text=(s,x,y,size,colour,weight='700',maxWidth)=>{c.font=weight+' '+size+'px Arial, sans-serif';c.fillStyle=colour;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y,maxWidth);};
 const panels=[];
 // Draw in the physical panel's metre coordinates. The atlas transform is deliberately anisotropic;
 // mapping it back to the actual panel cancels that transform and preserves each glyph's proportions.
 function panel(index,w,h,paint){const x=(index%2)*1024,y=Math.floor(index/2)*512;c.save();c.translate(x,y);c.scale(1024/w,512/h);paint(w,h);c.restore();panels[index]=[(x+1)/2048,(y+1)/2048,(x+1023)/2048,(y+511)/2048];}
 const gantryW=2*(Math.max(geo.edge(45,-1),geo.edge(45,1))+1.05)+.44;
 const bridgeW=2*(Math.max(geo.edge(115,-1),geo.edge(115,1))+2.45)+2.3;
 panel(0,gantryW,1.35,(w,h)=>{c.fillStyle='#101114';c.fillRect(0,0,w,h);const end=3.05;c.fillStyle='#ef5524';c.fillRect(0,0,end,h);c.fillRect(w-end,0,end,h);for(const x of [end/2,w-end/2]){text('WORKS ITS',x,.41,.36,'#101114','800',end-.20);text('ARSE OFF',x,.91,.36,'#101114','800',end-.20);}text('boost mobile',w/2,.71,.94,'#fff','500',w-end*2-.7);});
 panel(1,bridgeW,1.70,(w,h)=>{c.fillStyle='#fbf5e9';c.fillRect(0,0,w,h);c.fillStyle='#d7263e';for(const [x,y,r] of [[.22,.02,.44],[w-.2,h-.04,.48],[w*.47,.02,.27]]){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}text('GOLD COAST',w*.25,.44,.33,'#bc1732');text('500',w*.25,1.04,.85,'#bc1732','800');text('THE FINALS STARTS HERE',w*.75,.65,.40,'#bc1732','800',w*.46);text('23–25 OCT 2026',w*.75,1.21,.38,'#171719','800',w*.46);c.fillStyle='#b99f91';c.fillRect(w/2,0,.018,h);});
 panel(2,4.97,geo.edgeInfo(0,1).height-.075,(w,h)=>{c.fillStyle='#111214';c.fillRect(0,0,w,h);text('KMC',w/2,h*.43,h*.73,'#f8f8f3','900',w*.86);text('W H E E L S',w/2,h*.85,h*.15,'#f8f8f3','700',w*.8);});
 panel(3,4.97,geo.edgeInfo(0,-1).height-.075,(w,h)=>{c.fillStyle='#c4d51c';c.fillRect(0,0,w,h);c.fillStyle='#f3f3dc';c.fillRect(0,0,.9,h);text('bp',.45,h*.34,h*.28,'#43883e','700');c.fillStyle='#51a841';for(let i=0;i<16;i++){c.save();c.translate(.45,h*.67);c.rotate(i*Math.PI/8);c.fillRect(-.04,-h*.20,.08,h*.17);c.restore();}text('ultimate',2.9,h*.55,h*.59,'#163560','700',3.7);});
 panel(4,8,1.4,(w,h)=>{c.fillStyle='#ed6416';c.fillRect(0,0,w,h);text('Coates',w/2,.63,.95,'#fff','700');text('GC500',w/2,1.20,.24,'#1b1b19','700');});
 panel(5,20,1.4,(w,h)=>{c.fillStyle='#bf3e58';c.fillRect(0,0,w,h);text('GOLDCOAST.',w/2,.75,1.04,'#fff','800',w-.8);});
 /* White atlas sample reserved for untextured geometry. */
 c.fillStyle='#fff';c.fillRect(0,2024,24,24);
 const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);
 const ext=gl.getExtension('EXT_texture_filter_anisotropic');if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
 gl.bindTexture(gl.TEXTURE_2D,null);return {texture,panels,white:[12/2048,2036/2048]};
}
function build(S,D){
 const M=G.M_PER_PT||6,H=S.tune.deckH,mesh=D.mesh,atlas=D.atlas;
 const stats=D.stats={author:'Andrew Fisher',source:SOURCE,start_m:-100,end_m:150,gantry_m:45,bridge_m:115,streetlights:0,barrierSkins:0,fixings:0,mountingPlates:0,kerbProfiles:0,kerbSourceRule:'Existing nominal curvature-based footprints; decorative profiles only',triangles:0};
 const {frame,edge,edgeInfo}=D.geometry;
 const at=(s,l,y)=>{const f=frame(s);return [f.p[0]+f.n[0]*l/M,H+y/M,f.p[2]+f.n[2]*l/M];};
 const local=(s,l,y,delta)=>add(at(s,l,y),frame(s).t,(delta||0)/M);
 function face(points,colour=WHITE,rect){
  const normal=unit(cross(sub(points[1],points[0]),sub(points[2],points[0]))),base=mesh.nv;
  const uv=rect?[[rect[0],rect[3]],[rect[2],rect[3]],[rect[2],rect[1]],[rect[0],rect[1]]]:points.map(()=>atlas.white);
  points.forEach((p,i)=>mesh.vert(...p,...normal,...uv[i],...colour));for(let j=1;j<points.length-1;j++)mesh.tri(base,base+j,base+j+1);
 }
 function box(s,l,y,w,d,h,colour){
  const p=[local(s,l-w/2,y,-d/2),local(s,l+w/2,y,-d/2),local(s,l+w/2,y,d/2),local(s,l-w/2,y,d/2),local(s,l-w/2,y+h,-d/2),local(s,l+w/2,y+h,-d/2),local(s,l+w/2,y+h,d/2),local(s,l-w/2,y+h,d/2)];
  for(const ids of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])face(ids.map(i=>p[i]),colour);
 }
 function tube(a,b,r,colour=METAL,sides=8){
  const axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u),A=[],B=[];
  for(let i=0;i<sides;i++){const k=2*Math.PI*i/sides,n=u.map((z,j)=>z*Math.cos(k)+v[j]*Math.sin(k));A.push(add(a,n,r/M));B.push(add(b,n,r/M));}
  for(let i=0;i<sides;i++){const j=(i+1)%sides;face([A[i],A[j],B[j],B[i]],colour);}face(A.slice().reverse(),colour);face(B,colour);
 }
 const rod=(s,l,y,ss,ll,yy,r,c)=>tube(at(s,l,y),at(ss,ll,yy),r,c);
 /* Profile only the already-drawn kerb quads. Copy their exact x/z footprint
    from the original batch; never reclassify an edge or move the racing line.
    The old batch (including grid/edge paint) stays intact for comparison. */
 if(S.kerb&&S.kerbStats){
  const vertices=S.kerb.v,stride=9,quads=S.kerbStats.blocks*2;
  if(quads*4*stride>vertices.length)throw new Error('Kerb source range exceeds the original mesh');
  for(let q=0;q<quads;q++){
   const points=Array.from({length:4},(_,k)=>Array.from(vertices.slice((q*4+k)*stride,(q*4+k)*stride+3)));
   const index=q*4*stride,paint=[vertices[index+3],vertices[index+4],vertices[index+5],.94];
   const span=(a,b,t,height)=>[a[0]+(b[0]-a[0])*t,height,a[2]+(b[2]-a[2])*t];
   const y=points[0][1],lo=y+.003/M,hi=y+.067/M;
   const a=[span(points[0],points[1],0,lo),span(points[0],points[1],.16,hi),span(points[0],points[1],.86,hi),span(points[0],points[1],1,lo)];
   const b=[span(points[3],points[2],0,lo),span(points[3],points[2],.16,hi),span(points[3],points[2],.86,hi),span(points[3],points[2],1,lo)];
   for(let k=0;k<3;k++)face([a[k],b[k],b[k+1],a[k+1]],paint);
   const bottom=p=>[p[0],H+.001/M,p[2]],edgePaint=paint.map((v,k)=>k<3?v*.72:v);
   face([bottom(a[0]),bottom(b[0]),b[0],a[0]],edgePaint);
   face([bottom(b[3]),bottom(a[3]),a[3],b[3]],edgePaint);
   face([bottom(a[0]),a[0],a[1],a[2],a[3],bottom(a[3])],edgePaint);
   face([bottom(b[3]),b[3],b[2],b[1],b[0],bottom(b[0])],edgePaint);
   stats.kerbProfiles++;
  }
 }
 const banner=(s,l0,l1,y0,y1,index,depth=.24)=>{
  const mid=(l0+l1)/2;box(s,mid,y0,l1-l0,depth,y1-y0,DARK);
  /* Face towards the approaching car; back face reverses vertex order so letters are not mirrored. */
  face([local(s,l0,y0,-depth/2-.009),local(s,l1,y0,-depth/2-.009),local(s,l1,y1,-depth/2-.009),local(s,l0,y1,-depth/2-.009)],WHITE,atlas.panels[index]);
  face([local(s,l1,y0,depth/2+.009),local(s,l0,y0,depth/2+.009),local(s,l0,y1,depth/2+.009),local(s,l1,y1,depth/2+.009)],WHITE,atlas.panels[index]);
 };
 /* Slim advertising gantry: no pedestrian deck, trusses or fictional start lamps. */
 {const s=45,half=Math.max(edge(s,-1),edge(s,1))+1.05;
  for(const sg of [-1,1]){
   box(s,sg*half,0,.72,.72,.16,CONCRETE);box(s,sg*half,.16,.39,.39,.035,METAL);stats.mountingPlates++;
   for(const dl of [-.14,.14])for(const ds of [-.14,.14]){rod(s+ds,sg*half+dl,.195,s+ds,sg*half+dl,.24,.018,DARK);stats.fixings++;}
   rod(s,sg*half,.195,s,sg*half,7.15,.105,METAL);box(s,sg*half,5.62,.31,.32,.22,DARK);
   for(const y of [5.72,6.94]){box(s,sg*half,y,.34,.35,.055,METAL);stats.mountingPlates++;}
  }
  rod(s,-half,6.95,s,half,6.95,.065,METAL);banner(s,-half-.22,half+.22,5.75,7.10,0,.22);
 }
 /* Pedestrian bridge: lattice towers, a load-carrying deck, rail-height advertising and two real stair flights. */
 {const s=115,half=Math.max(edge(s,-1),edge(s,1))+2.45,deck=5.85;
  box(s,0,deck,half*2+2.3,2.3,.28,METAL);banner(s-1.23,-half-1.15,half+1.15,deck+.28,deck+1.98,1,.16);
  banner(s+1.23,-half-1.15,half+1.15,deck+.28,deck+1.98,1,.16);
  for(const sg of [-1,1]){
   const centre=sg*half;
   for(const dl of [-1.0,1.0])for(const ds of [-.98,.98]){
    box(s+ds,centre+dl,0,.30,.30,.035,METAL);stats.mountingPlates++;
    rod(s+ds,centre+dl,.035,s+ds,centre+dl,deck+.1,.053,METAL);
   }
   for(let y=0;y<deck-.1;y+=1.46){const top=Math.min(deck,y+1.46);
    for(const ds of [-.98,.98]){rod(s+ds,centre-1,y,s+ds,centre+1,top,.034,METAL);rod(s+ds,centre+1,y,s+ds,centre-1,top,.034,METAL);}
    for(const dl of [-1,1]){rod(s-.98,centre+dl,y,s+.98,centre+dl,top,.034,METAL);rod(s+.98,centre+dl,y,s-.98,centre+dl,top,.034,METAL);}
   }
   /* Stair flights extend along the outside of the circuit, parallel to the barrier. */
   for(let flight=0;flight<2;flight++){
    const lane=centre+sg*(flight?2.30:.85),start=s-6.4,run=5.45,rise=deck/2;
    for(let step=0;step<16;step++){
     const u=step/16,y=flight*rise+(step+1)*rise/16,ss=flight?start+run-u*run:start+u*run;
     box(ss,lane,y,1.15,.37,.045,METAL);
    }
    const a=flight?start+run:start,b=flight?start:start+run;
    for(const dl of [-.58,.58]){
     rod(a,lane+dl,flight*rise+.90,b,lane+dl,(flight+1)*rise+.90,.026,METAL);
     rod(a,lane+dl,flight*rise+.46,b,lane+dl,(flight+1)*rise+.46,.020,METAL);
     for(let k=0;k<=4;k++){const u=k/4;rod(a+(b-a)*u,lane+dl,flight*rise+rise*u,a+(b-a)*u,lane+dl,flight*rise+rise*u+.90,.022,METAL);}
     rod(a,lane+dl,flight*rise,b,lane+dl,(flight+1)*rise,.055,METAL);
    }
   }
   box(s-.70,centre+sg*1.57,deck/2,2.9,1.35,.10,METAL);
   box(s-6.5,centre+sg*2.3,deck,1.4,1.15,.10,METAL);
   /* Elevated return walkway joins upper landing to bridge without a floating stair end. */
   box(s-3.15,centre+sg*2.3,deck,1.35,5.85,.10,METAL);
   for(const ds of [-6.35,-3.5,-.8])rod(s+ds,centre+sg*2.95,0,s+ds,centre+sg*2.95,deck,.047,METAL);
   for(const dl of [1.65,2.95])rod(s-6.3,centre+sg*dl,deck+.95,s-.25,centre+sg*dl,deck+.95,.026,METAL);
   box(s,centre+sg*1.1,deck,2.7,1.25,.10,METAL);
  }
 }
 /* Existing catch fences already provide physical posts, leaning tops and anti-aliased wire.
  * Keep that registered barrier line. The additional photo-informed skins sit 15 mm inside it.
  */
 for(let s=-100;s<150;s+=5){
  for(const sg of [-1,1]){
   const la=sg*(edge(s,sg)-.032),lb=sg*(edge(s+4.97,sg)-.032),ha=edgeInfo(s,sg).height-.045,hb=edgeInfo(s+4.97,sg).height-.045;
   const points=sg<0?[at(s,la,.03),at(s+4.97,lb,.03),at(s+4.97,lb,hb),at(s,la,ha)]:[at(s+4.97,lb,.03),at(s,la,.03),at(s,la,ha),at(s+4.97,lb,hb)];
   const rect=atlas.panels[sg<0?3:2],shade=.93+.045*Math.sin(s*.73+sg*1.7);
   face(points,[shade,shade,shade,.83],rect);
   stats.barrierSkins++;
   /* Slim joint cover and metal fixings; no new collision line or continuous duplicate fence. */
   box(s,la,.03,.038,.050,ha-.03,DARK);
   /* A narrow lower return seats the sign against its existing concrete line.
      The joint feet are visual fixings, not new barriers projecting into the lane. */
   box(s+2.485,(la+lb)*.5,.018,.065,4.94,.045,DARK);
   box(s,la,.08,.075,.15,.14,METAL);stats.mountingPlates++;
   for(const y of [.29,1.1]){rod(s,la-sg*.014,y,s,la-sg*.035,y,.024,METAL);stats.fixings++;}
  }
 }
 /* Coastal double-arm lights; curved arms sampled into tapered-looking metal segments. */
 for(const s of [-72,-18,30,78,138]){
  const half=edge(s,-1)+3.35,base=at(s,-half,0);tube(base,at(s,-half,9.0),.085,METAL,10);
  for(const dir of [-1,1]){
   let prev=at(s,-half,8.35);
   for(let k=1;k<=10;k++){
    const f=k/10,next=at(s+dir*4.3*f,-half,8.35+1.8*(1-Math.exp(-f*4.5)));
    tube(prev,next,.066-.020*f,METAL,6);prev=next;
   }
   box(s+dir*4.3,-half,9.89,.40,1.00,.18,DARK);box(s+dir*4.3,-half,9.87,.32,.82,.028,[.82,.83,.74,.82]);
  }
  stats.streetlights++;
 }
 mesh.upload();stats.triangles=mesh.ni/3;
 stats.bounds={gantryClearance_m:5.75,bridgeDeck_m:5.85,barrierPanel_m:5};
 D.frame=frame;D.at=at;
}
G.installTrackDetail781=function(S){
 S=S||G.S;if(!S||!S.gl||!S.CL||!Number.isFinite(S.gridS))return null;
 if(S.trackDetail781)return S.trackDetail781.stats;
 const gl=S.gl,D={mesh:null,atlas:null,program:null,stats:null};
 try{
  D.geometry=geometry(S);D.mesh=new G.MeshBatch(gl,[3,3,2,4],false);D.atlas=makeAtlas(gl,D.geometry);D.program=program(gl);build(S,D);
  S.trackDetail781=D;S.detail781Enabled=true;S.needsRender=true;
  S.detail781ShadowMeshes=S.detail781ShadowMeshes||[];S.detail781ShadowMeshes.push(D.mesh);
  /* Invalidate the static shadow cache once after geometry installation. */
  if(S.sunShadow)S.sunShadow.source=null;
  return D.stats;
 }catch(error){
  S.trackDetail781=D;G.disposeTrackDetail781(S);throw error;
 }
};
G.drawTrackDetail781=function(S,VP,fog){
 const D=S&&S.detail781Enabled&&S.trackDetail781;if(!D)return;
 const gl=S.gl,P=D.program,u=P.u;
 gl.useProgram(P.p);gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform3fv(u.uEye,S.cam.eye);gl.uniform3fv(u.uSun,G.sunDirection||[.45,.8,.4]);
 gl.uniform1f(u.uDeck,S.tune.deckH);gl.uniform1f(u.uMetres,G.M_PER_PT||6);
 gl.uniform2f(u.uFog,fog[0],fog[1]);gl.uniform1f(u.uDay,S.look&&S.look.day?1:0);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,D.atlas.texture);gl.uniform1i(u.uAtlas,0);
 if(G.bindSunShadow)G.bindSunShadow(S,P,!!(S.look&&S.look.day));
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 D.mesh.draw();gl.bindVertexArray(null);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,null);
};
/* Call inside the existing shadow pass, with its shadow program and uVP already bound. */
G.drawTrackDetailShadow781=function(S){const D=S&&S.detail781Enabled&&S.trackDetail781;if(D)D.mesh.draw();};
G.disposeTrackDetail781=function(S){
 S=S||G.S;const D=S&&S.trackDetail781;if(!D)return;
 const gl=S.gl,m=D.mesh;
 if(m){gl.deleteBuffer(m.vb);gl.deleteBuffer(m.ib);gl.deleteVertexArray(m.vao);}
 if(D.atlas)gl.deleteTexture(D.atlas.texture);if(D.program)gl.deleteProgram(D.program.p);
 if(S.detail781ShadowMeshes)S.detail781ShadowMeshes=S.detail781ShadowMeshes.filter(x=>x!==m);
 S.trackDetail781=null;S.detail781Enabled=false;if(S.sunShadow)S.sunShadow.source=null;
};
G.trackDetailReport781=function(S){S=S||G.S;return S&&S.trackDetail781?Object.assign({enabled:!!S.detail781Enabled},S.trackDetail781.stats):{enabled:false,source:SOURCE};};
})();
