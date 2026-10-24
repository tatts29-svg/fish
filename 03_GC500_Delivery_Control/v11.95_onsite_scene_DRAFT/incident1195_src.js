/* Author: Andrew Fisher. Fictional fifth-lap trackside scene; never an operational incident. */
(function(root){
'use strict';
const G=root.GC3D;if(!G||root.ShowcaseIncident1195)return;
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const state=S=>S.incident1195||(S.incident1195={sim:S.sim,lastLap:Math.floor(Math.max(0,S.sim.s-S.gridS)/S.CL.L),lap:0,active:false,triggers:0,resources:null});
function update(S){
 if(!S?.sim||!S.CL?.L)return;
 let q=state(S);if(q.sim!==S.sim){dispose(S);delete S.incident1195;q=state(S);}
 const lap=Math.floor(Math.max(0,S.sim.s-S.gridS)/S.CL.L);
 if(lap<q.lastLap){q.active=false;q.lap=0;}
 if(lap>q.lastLap){
  const milestone=Math.floor(lap/5)*5;
  if(milestone>q.lastLap&&milestone>0&&lap===milestone&&!S.calmDrive){q.lap=milestone;q.active=true;q.triggers++;}
  else q.active=false;
 }
 q.lastLap=lap;
 if(S.calmDrive)q.active=false;
 return q;
}
const step=G.step;G.step=function(){const r=step.apply(this,arguments);update(G.S);return r;};
// Intersect the circuit's existing barrier rings, not an invented road width.
function rayRing(p,n,ring){let best=Infinity,hit=null;
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],d=[b[0]-a[0],b[1]-a[1]],v=[a[0]-p[0],a[1]-p[1]],cross=n[0]*d[1]-n[1]*d[0];
  if(Math.abs(cross)<1e-8)continue;const t=(v[0]*d[1]-v[1]*d[0])/cross,u=(v[0]*n[1]-v[1]*n[0])/cross;
  if(t>0&&u>=0&&u<=1&&t<best){best=t;hit={distance:t,point:[p[0]+n[0]*t,p[1]+n[1]*t],tangent:d.map(x=>x/Math.hypot(...d))};}}
 return hit;
}
function placement(S){
 const scale=S.tune.carS,L=S.CL.L,corridor=S.corridor794?.active?S.corridor794:null,outer=corridor?corridor.outer:S.outer,inner=corridor?corridor.inner:S.inner;let best=null;
 // A visible trackside position with room beside the racing line. This is
 // scenery only; neither the circuit nor any source boundary is changed.
 for(let k=0;k<25;k++){const at=S.gridS+L*(.10+k*.008),p=S.CL.at(at),t=S.CL.tangent(at),a=Math.atan2(t[1],t[0]);
  if(Math.abs(S.kAt(at))*scale>.06)continue;
  for(const side of [-1,1]){const n=[-Math.sin(a)*side,Math.cos(a)*side],hits=[rayRing(p,n,outer),rayRing(p,n,inner)].filter(Boolean).sort((x,y)=>x.distance-y.distance),h=hits[0];
   if(!h||h.distance<scale*1.65||h.distance>scale*8)continue;
   const score=Math.abs(h.distance/scale-2.8)+k*.025;if(best&&best.score<=score)continue;
   let wall=h.tangent;if(wall[0]*t[0]+wall[1]*t[1]<0)wall=wall.map(v=>-v);
   let normal=[-wall[1],0,wall[0]];if(normal[0]*n[0]+normal[2]*n[1]<0)normal=normal.map(v=>-v);
   const f=[wall[0]*Math.cos(.42)+normal[0]*Math.sin(.42),0,wall[1]*Math.cos(.42)+normal[2]*Math.sin(.42)],rt=[-f[2],0,f[0]];
   best={at,side,score,f,rt,normal,scale,boundaryDistance:h.distance,hit:h.point,corridor:!!corridor};
  }
 }
 if(!best)return null;
 const {f,rt,normal:N,scale:s}=best;let reach=-Infinity;
 for(const p of model().parts)for(let i=0;i<p.vertices.length;i+=8){const x=p.vertices[i],z=p.vertices[i+2];reach=Math.max(reach,(f[0]*x+rt[0]*z)*N[0]+(f[2]*x+rt[2]*z)*N[2]);}
 const clearance=.012*s,inset=reach*s+clearance+(corridor?0:.45),pos=best.pos=[best.hit[0]-N[0]*inset,S.tune.deckH,best.hit[1]-N[2]*inset];
 best.frontClearance=clearance;best.roadClearance=best.boundaryDistance-inset-.37*s;
 best.matrix=new Float32Array([f[0]*s,0,f[2]*s,0,0,s,0,0,rt[0]*s,0,rt[2]*s,0,...pos,1]);return best;
}
let cachedModel;
function model(){if(cachedModel)return cachedModel;
 const K=G.plantKit('balanced'),{group,box,rbox,quad,tube,bar,wheel}=K;
 const white=group('white sedan body','paint',{color:[.88,.90,.92]}),orange=group('orange rear quarters and wing','paint',{color:[.94,.18,.015]}),black=group('trim and empty cockpit','interior',{color:[.018,.022,.027]}),glass=group('dark windows','glass'),alloy=group('wheel details','alloy'),lamp=group('headlamps','lampWhite');
 // Four-door touring sedan silhouette. The empty car is parked, with a
 // shortened nose and folded bonnet against the existing barrier.
 rbox(white,-.04,.245,0,.91,.075,.345,.22,40,16);
 rbox(black,-.02,.125,0,.95,.04,.32,.28,24,12);
 box(white,-.46,.47,.105,.24,-.351,.351);
 rbox(white,-.13,.46,0,.40,.025,.277,.25,28,12);
 const A=[.44,.32],B=[.22,.47],C=[-.50,.47],D=[-.69,.32];
 for(const sd of [-1,1]){
  const pts=[A,B,C,D].map(([x,y])=>[x,y,sd*(y>.4?.275:.337)]);
  quad(glass,...pts,[0,.2,sd]);
  for(let i=0;i<4;i++)bar(white,pts[i],pts[(i+1)%4],.018,.018);
  bar(white,[-.10,.32,sd*.34],[-.12,.47,sd*.275],.025,.018);
  for(const x of [-.40,.24])box(black,x-.035,x+.035,.291,.30,sd*.354-.004,sd*.354+.004);
  tube(black,[.30,.35,sd*.32],[.29,.36,sd*.43],.012,8);rbox(white,.29,.36,sd*.43,.055,.024,.025,.3,16,8);
  quad(orange,[-.92,.17,sd*.35],[-.53,.14,sd*.355],[-.37,.315,sd*.35],[-.85,.315,sd*.35],[0,0,sd]);
  for(const x of [-.64,.62])wheel(x,.142,sd*.345,.142,.10,{n:32,lugs:false,rim:'alloy',rimR:.70});
 }
 quad(glass,[.445,.32,-.33],[.445,.32,.33],[.22,.47,.275],[.22,.47,-.275],[1,1,0]);
 quad(glass,[-.69,.32,.33],[-.69,.32,-.33],[-.50,.47,-.275],[-.50,.47,.275],[-1,1,0]);
 box(black,-.48,.18,.31,.325,-.26,.26); // empty interior; no occupant
 for(const z of [-.22,.22])bar(black,[-.85,.31,z],[-.89,.47,z],.018,.018);
 rbox(orange,-.89,.48,0,.09,.015,.43,.2,20,8);
 for(const z of [-.43,.43])box(orange,-.98,-.80,.44,.53,z-.012,z+.012);
 // Folded front bonnet, split bumper and dark grille recess.
 quad(white,[.43,.32,-.30],[.82,.36,-.27],[.79,.40,.27],[.43,.32,.30],[0,1,0]);
 rbox(black,.87,.23,0,.045,.045,.26,.2,16,8);
 for(const sd of [-1,1]){rbox(lamp,.865,.29,sd*.25,.025,.022,.066,.3,16,8);bar(white,[.82,.12,sd*.33],[.94,.17,sd*.08],.035,.025);}
 // Crisp authored door lettering, on both sides; no reference photo embedded.
 for(const sd of [-1,1]){const p=group('Onsite Rental Group '+sd,'decal',{color:[.015,.018,.022]});const x0=-.48,x1=.49,y0=.164,y1=.302,z=sd*.359;
  const X=u=>mix(x0,x1,sd>0?u:1-u);K.add(p,[[X(0),y1,z],[X(1),y1,z],[X(1),y0,z],[X(0),y0,z]],[0,1,2,0,2,3],[[0,0],[1,0],[1,1],[0,1]],[0,0,sd]);}
 const parts=G.compactRaceCarParts1091(K.parts.map(p=>({...p,wheel:undefined,vertices:new Float32Array(p.vertices),indices:new Uint32Array(p.indices)})));
 const result=G.finishModel(parts,'balanced','fictional Onsite trackside sedan');
 return cachedModel={...result,stats:{triangles:parts.reduce((n,p)=>n+p.indices.length/3,0),parts:parts.length,logoCopies:2,occupants:0,geometryBuiltOnce:true}};
}
function atlas(gl){const c=document.createElement('canvas');c.width=2048;c.height=384;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='alphabetic';x.font='italic 900 300px Arial, sans-serif';x.fillText('Onsite',1024,275,1980);x.font='64px Arial, sans-serif';x.fillText('Rental Group',1270,362,900);
 const rgba=x.getImageData(0,0,c.width,c.height).data,mask=new Uint8Array(c.width*c.height);for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4+3];
 const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,c.width,c.height,0,gl.RED,gl.UNSIGNED_BYTE,mask);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;
}
const VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;layout(location=1) in vec2 aUV;layout(location=2) in vec3 aSeed;
uniform mat4 uVP;uniform mat4 uModel;uniform vec3 uRight;uniform vec3 uUp;uniform float uScale;uniform float uTime;
out vec2 vUV;out float vSeed;out float vSmoke;out float vAge;
void main(){vUV=aUV;vSeed=aSeed.x;vSmoke=aSeed.z;float age=fract(uTime*.16+aSeed.x*.173);vAge=age;
vec3 local=aPos;float sz=aSeed.y;if(vSmoke>.5){local.y+=age*2.7;local.x-=age*.65;sz*=.65+age*1.2;}
vec3 p=(uModel*vec4(local,1.)).xyz+uRight*(aUV.x-.5)*sz*uScale+uUp*(aUV.y-.5)*sz*uScale*(vSmoke>.5?1.:1.9);
gl_Position=uVP*vec4(p,1.);}`;
const FS=`#version 300 es
precision highp float;in vec2 vUV;in float vSeed;in float vSmoke;in float vAge;uniform float uTime;out vec4 o;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.57+noise(p*2.03+4.3)*.28+noise(p*4.07+1.2)*.15;}
void main(){vec2 q=vUV;float n=fbm(vec2(q.x*4.+vSeed,q.y*4.-uTime*1.15));
if(vSmoke>.5){float r=length((q-.5)*2.);float a=(1.-smoothstep(.35,1.,r+n*.16))*sin(vAge*3.14159)*.23;vec3 c=mix(vec3(.065,.07,.075),vec3(.23,.24,.25),n);o=vec4(c*a,a);return;}
float sway=sin(q.y*7.-uTime*2.1+vSeed)*(.035+q.y*.07)+(n-.5)*.20;float edge=abs(q.x-.5+sway)*2.;float width=pow(max(0.,1.-q.y),.72)*.75;
float a=(1.-smoothstep(width-.20,width+.06,edge))*smoothstep(0.,.12,q.y)*(1.-smoothstep(.70,1.,q.y))*.82;
float heat=clamp((1.-edge)*.65+(1.-q.y)*.45+(n-.5)*.35,0.,1.);vec3 c=mix(vec3(2.4,.13,.006),vec3(4.2,2.2,.22),smoothstep(.45,.98,heat));o=vec4(c*a,a);}`;
function program(gl){const p=gl.createProgram(),shaders=[];try{for(const [type,src]of [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,FS]]){const sh=gl.createShader(type);shaders.push(sh);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return {p,u:Object.fromEntries(['uVP','uModel','uRight','uUp','uScale','uTime'].map(n=>[n,gl.getUniformLocation(p,n)]))};}catch(e){gl.deleteProgram(p);throw e;}finally{for(const sh of shaders)gl.deleteShader(sh);}}
function resources(S,q){if(q.resources)return q.resources;const gl=S.gl,r=q.resources={parts:[],atlas:null,fx:null,program:null};
 try{for(const p of model().parts){const b=new G.MeshBatch(gl,[3,3,2],false);r.parts.push({...p,batch:b});b.v=p.vertices;b.i=p.indices;b.nv=p.vertices.length/8;b.upload();b.v=[];b.i=[];}
  r.atlas=atlas(gl);r.program=program(gl);r.fx=new G.MeshBatch(gl,[3,2,3],false);
  const sprite=(pos,size,seed,smoke)=>{const o=r.fx.nv;for(const uv of [[0,0],[1,0],[1,1],[0,1]])r.fx.vert(...pos,...uv,seed,size,smoke);r.fx.tri(o,o+1,o+2);r.fx.tri(o,o+2,o+3);};
  // Smoke above the roof. Fire across the far sill, bonnet and rear; the
  // near-side door remains readable without an opaque screen over the car.
  for(let i=0;i<18;i++)sprite([Math.sin(i*2.4)*.48,.75,Math.cos(i*3.7)*.16],.78,i+30,1);
  for(let i=0;i<24;i++){const x=-.9+(i%8)/7*1.75,z=i<16?q.place.side*.22:Math.sign(i%2-.5)*.26;
   const xx=i>=16?(i%2?.76:-.84):x,y=Math.abs(xx)<.5?.62:.40;sprite([xx,y,z],.31+(i%4)*.043,i+1,0);}
  r.fx.upload();r.fx.v=[];r.fx.i=[];return r;
 }catch(e){dispose(S);throw e;}
}
function dispose(S){const r=S?.incident1195?.resources;if(!r)return;const gl=S.gl;
 if(gl&&!S.lost){for(const b of [...r.parts.map(p=>p.batch),r.fx].filter(Boolean)){gl.deleteBuffer(b.vb);gl.deleteBuffer(b.ib);gl.deleteVertexArray(b.vao);}if(r.atlas)gl.deleteTexture(r.atlas);if(r.program)gl.deleteProgram(r.program.p);}
 S.incident1195.resources=null;
}
function attach(S){if(S.incidentUnmount1195||!S.unmount)return;const old=S.unmount;S.incidentUnmount1195=true;S.unmount=function(){dispose(S);return old.apply(this,arguments);};}
function locate(S,q){if(q.place&&q.place.corridor!==!!S.corridor794?.active){dispose(S);q.place=null;}return q.place=q.place||placement(S);}
function draw(S,VP,fog){attach(S);const q=state(S);if(!q.active)return;locate(S,q);if(!q.place)return;
 const P=q.place,dist=Math.hypot(S.cam.eye[0]-P.pos[0],S.cam.eye[2]-P.pos[2]);if(dist>P.scale*100)return;
 const gl=S.gl,r=resources(S,q),{p,u}=S.raceProgram;gl.useProgram(p);if(G.bindRaceReflections)G.bindRaceReflections(S,gl,u);
 gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniformMatrix4fv(u.uModel,false,P.matrix);gl.uniform3fv(u.uEye,S.cam.eye);gl.uniform2f(u.uFog,...fog);gl.uniform1f(u.uDay,S.look.day);gl.uniform1f(u.uDetail781,S.detail781Enabled&&S.look.day?1:0);gl.uniform1f(u.uBrake,0);gl.uniform1f(u.uPanel,0);gl.uniform1f(u.uOpacity,1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,r.atlas);gl.uniform1i(u.uAtlas,0);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
 for(const layer of [0,1,2])for(const part of r.parts){const type=part.material,which=type==='decal'?2:type==='glass'?1:0;if(which!==layer)continue;
  const transparent=which>0;gl.depthMask(!transparent);if(transparent){gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);}else gl.disable(gl.BLEND);
  let color=part.color||[.03,.035,.04],rough=.5,metal=0,kind=3,surface=0;
  if(type==='paint'){rough=.29;surface=2;}if(type==='alloy'){color=[.5,.53,.55];rough=.28;metal=.75;surface=4;}if(type==='rubber'){color=[.018,.021,.024];surface=3;rough=.88;}if(type==='glass'){surface=6;rough=.16;}if(type==='lampWhite')kind=6;if(type==='decal')kind=8;
  gl.uniform3fv(u.uColor,color);gl.uniform1f(u.uRough,rough);gl.uniform1f(u.uMetal,metal);gl.uniform1f(u.uKind,kind);gl.uniform1f(u.uSurface800,surface);part.batch.draw();
 }
 const F=r.program,eye=S.cam.eye,tgt=S.cam.tgt,dx=tgt[0]-eye[0],dz=tgt[2]-eye[2],len=Math.hypot(dx,dz)||1;
 gl.useProgram(F.p);gl.uniformMatrix4fv(F.u.uVP,false,VP);gl.uniformMatrix4fv(F.u.uModel,false,P.matrix);gl.uniform3fv(F.u.uRight,[dz/len,0,-dx/len]);gl.uniform3fv(F.u.uUp,[0,1,0]);gl.uniform1f(F.u.uScale,P.scale);gl.uniform1f(F.u.uTime,S.reducedMotion?1.5:S.clock);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);r.fx.draw();
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,S.carAtlas||null);q.draws=(q.draws||0)+1;
}
G.drawIncident1195=draw;
// Brief broadside view only for the automatic director, as the driven vehicle
// approaches the parked car. Explicit camera choices remain the user's choice.
const cam=G.camStep;G.camStep=function(){const out=cam.apply(this,arguments),S=G.S;if(!S?.sim)return out;const q=state(S);if(!q.active||S.forceShot||S.reducedMotion)return out;
 locate(S,q);if(!q.place)return out;const P=q.place,L=S.CL.L,d=((S.sim.s-P.at+L/2)%L+L)%L-L/2;
 if(d<-P.scale*18||d>P.scale*4)return out;
 const s=P.scale,back=S.cv.clientWidth<S.cv.clientHeight?4.7:3.7;S.cam={...S.cam,eye:[P.pos[0]-P.normal[0]*back*s+P.f[0]*1.2*s,P.pos[1]+1.5*s,P.pos[2]-P.normal[2]*back*s+P.f[2]*1.2*s],tgt:[P.pos[0],P.pos[1]+.55*s,P.pos[2]],fov:48};S.camRoll=0;S.shotName='incident1195';q.cameraPass=true;return out;
};
root.ShowcaseIncident1195={version:1195,author:'Andrew Fisher',interval:5,fictional:true,update,placement,model,dispose,
 state:()=>{const q=G.S?.incident1195;return q?{lap:q.lap,lastLap:q.lastLap,active:q.active,triggers:q.triggers,draws:q.draws||0,resources:!!q.resources,place:q.place?{at:q.place.at,side:q.place.side,roadClearance:q.place.roadClearance,frontClearance:q.place.frontClearance}:null}:null;}};
})(window);
