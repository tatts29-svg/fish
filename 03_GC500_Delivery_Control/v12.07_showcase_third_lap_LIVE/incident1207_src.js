/* Author: Andrew Fisher. Fictional third-lap trackside scene with a waving person; never an operational incident. */
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
  const milestone=Math.floor(lap/3)*3;
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
// Match the visible concrete, including its bevel and mitered corners. A ring
// offset alone is not the contact surface at bumper height. Run once per variant.
function concreteContact(S,origin,direction,maxDistance){
 const variant=S.corridor794?.variants.find(v=>v.key==='trackConcrete'),active=!!S.corridor794?.active;
 const vertices=variant?(active?variant.vertices:variant.sourceVertices):S.trackConcrete?.v,indices=variant?(active?variant.indices:variant.sourceIndices):S.trackConcrete?.i;
 if(!vertices||!indices)return null;
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 let nearest=maxDistance;
 for(let i=0;i<indices.length;i+=3){const [a,b,c]=[indices[i],indices[i+1],indices[i+2]].map(j=>[vertices[j*9],vertices[j*9+1],vertices[j*9+2]]),e1=sub(b,a),e2=sub(c,a),h=cross(direction,e2),det=dot(e1,h);
  if(Math.abs(det)<1e-12)continue;const inv=1/det,s=sub(origin,a),u=dot(s,h)*inv;if(u<0||u>1)continue;
  const q=cross(s,e1),v=dot(direction,q)*inv;if(v<0||u+v>1)continue;const t=dot(e2,q)*inv;if(t>=0&&t<nearest)nearest=t;
 }
 return nearest<maxDistance?nearest:null;
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
   const f=[wall[0]*Math.cos(.72)+normal[0]*Math.sin(.72),0,wall[1]*Math.cos(.72)+normal[2]*Math.sin(.72)],rt=[-f[2],0,f[0]];
   best={at,side,score,f,rt,normal,scale,boundaryDistance:h.distance,hit:h.point,corridor:!!corridor};
  }
 }
 if(!best)return null;
 const {f,rt,normal:N,scale:s}=best;let reach=-Infinity,front;
 for(const p of model().parts)for(let i=0;i<p.vertices.length;i+=8){const x=p.vertices[i],z=p.vertices[i+2],extent=(f[0]*x+rt[0]*z)*N[0]+(f[2]*x+rt[2]*z)*N[2];if(extent>reach){reach=extent;front=[x,p.vertices[i+1],z];}}
 // The original barrier front is offset OUTWARD by .45 scene units; the
 // corrected measured corridor uses zero offset. Match the visible variant.
 const clearance=.012*s,inset=reach*s+clearance-(corridor?0:.45),pos=best.pos=[best.hit[0]-N[0]*inset,S.tune.deckH,best.hit[1]-N[2]*inset];
 const world=[pos[0]+s*(f[0]*front[0]+rt[0]*front[2]),pos[1]+s*front[1],pos[2]+s*(f[2]*front[0]+rt[2]*front[2])],origin=world.map((v,i)=>v-N[i]*s),contact=concreteContact(S,origin,N,s*2);
 if(contact===null)return null;
 const shift=contact-s-clearance;pos[0]+=N[0]*shift;pos[2]+=N[2]*shift;
 best.frontClearance=clearance;best.contactCorrection=shift;best.roadClearance=best.boundaryDistance-inset+shift-.37*s;
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
let cachedPerson;
function personModel(){if(cachedPerson)return cachedPerson;
 const K=G.plantKit('balanced'),{group,box,rbox,bar}=K;
 const navy=group('trousers and cap','paint',{color:[.025,.045,.075]}),vest=group('high visibility vest','paint',{color:[1,.28,.015]}),skin=group('face and neck','paint',{color:[.62,.35,.20]}),silver=group('reflective vest stripes','alloy',{color:[.8,.85,.87]}),boots=group('boots and eyes','rubber');
 for(const x of [-.075,.075]){box(navy,x-.045,x+.045,.06,.35,-.055,.055);rbox(boots,x,.045,-.022,.052,.04,.085,.22,12,6);}
 rbox(vest,0,.445,0,.145,.115,.08,.18,16,8);box(skin,-.035,.035,.55,.625,-.035,.035);
 rbox(skin,0,.69,-.005,.07,.085,.065,.32,16,8);rbox(navy,0,.764,-.007,.074,.018,.07,.2,12,6);box(navy,-.075,.075,.75,.762,-.095,-.04);
 for(const x of [-.027,.027])box(boots,x-.009,x+.009,.709,.724,-.071,-.066);
 for(const side of [-1,1])bar(silver,[side*.115,.545,-.083],[-side*.105,.36,-.083],.018,.008);
 box(silver,-.143,.143,.385,.407,-.087,-.079);
 for(const side of [-1,1]){const joint=side<0?'left':'right',sleeve=group(joint+' raised sleeve','paint',{color:[1,.28,.015]}),hand=group(joint+' waving hand','paint',{color:[.62,.35,.20]});sleeve.joint=hand.joint=joint;
  bar(sleeve,[0,0,0],[side*.18,.17,0],.055,.055);bar(sleeve,[side*.18,.17,0],[side*.14,.34,0],.047,.047);
  rbox(hand,side*.14,.375,0,.034,.052,.025,.2,12,6);
 }
 const parts=K.parts.map(p=>({...p,vertices:new Float32Array(p.vertices),indices:new Uint32Array(p.indices)}));
 return cachedPerson={parts,stats:{people:1,standingOutside:true,armJoints:2,triangles:parts.reduce((n,p)=>n+p.indices.length/3,0),parts:parts.length,geometryBuiltOnce:true}};
}
// A person stands behind the car along the barrier, not in its cabin or driving line.
function personPose(P){const c=Math.cos(.72),t=[(P.f[0]-P.normal[0]*Math.sin(.72))/c,0,(P.f[2]-P.normal[2]*Math.sin(.72))/c],s=P.scale;
 const pos=P.pos.map((v,i)=>v-t[i]*1.42*s-P.normal[i]*.06*s),B=new Float32Array([t[0]*s,0,t[2]*s,0,0,s,0,0,P.normal[0]*s,0,P.normal[2]*s,0,...pos,1]);return {base:B,left:new Float32Array(B),right:new Float32Array(B)};
}
function armPose(out,B,side,angle){const c=Math.cos(angle),s=Math.sin(angle);for(let i=0;i<4;i++){out[i]=B[i]*c+B[4+i]*s;out[4+i]=-B[i]*s+B[4+i]*c;out[8+i]=B[8+i];out[12+i]=B[12+i]+B[i]*side*.145+B[4+i]*.53;}return out;}
function drawPerson(S,q,r,u){const gl=S.gl,M=r.personPose,t=S.reducedMotion?1.5:S.clock;
 armPose(M.left,M.base,-1,Math.sin(t*4.2)*.28-.12);armPose(M.right,M.base,1,Math.sin(t*4.2+1.4)*.28+.12);
 gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform1f(u.uKind,3);gl.uniform1f(u.uSurface800,2);gl.uniform1f(u.uRough,.65);gl.uniform1f(u.uMetal,0);
 for(const part of r.personParts){gl.uniformMatrix4fv(u.uModel,false,M[part.joint]||M.base);gl.uniform3fv(u.uColor,part.color||[.025,.027,.03]);part.batch.draw();}
 q.personDraws=(q.personDraws||0)+1;q.waveTime=t;
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
vec3 local=aPos;float sz=aSeed.y;if(vSmoke>.5&&vSmoke<1.5){local.y+=age*1.65;local.x-=age*.65;sz*=.80+age*1.2;}
vec3 p=(uModel*vec4(local,1.)).xyz+uRight*(aUV.x-.5)*sz*uScale+uUp*(aUV.y-.5)*sz*uScale*(vSmoke>.5?1.:1.9);
gl_Position=uVP*vec4(p,1.);}`;
const FS=`#version 300 es
precision highp float;in vec2 vUV;in float vSeed;in float vSmoke;in float vAge;uniform float uTime;out vec4 o;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.57+noise(p*2.03+4.3)*.28+noise(p*4.07+1.2)*.15;}
void main(){vec2 q=vUV;float n=fbm(vec2(q.x*4.+vSeed,q.y*4.-uTime*1.15));
if(vSmoke>.5&&vSmoke<1.5){float r=length((q-.5)*2.);float a=(1.-smoothstep(.30,1.,r+n*.16))*sin(vAge*3.14159)*.72;vec3 c=mix(vec3(.018,.021,.024),vec3(.13,.14,.15),n);o=vec4(c*a,a);return;}
if(vSmoke>1.5){float r=length((q-.5)*vec2(2.,2.15));float a=(1.-smoothstep(.46,.99,r+(n-.5)*.26))*.66;float heat=clamp(1.-r+n*.34,0.,1.);vec3 c=mix(vec3(2.5,.12,.004),vec3(4.1,1.9,.16),smoothstep(.22,.82,heat));o=vec4(c*a,a);return;}
float sway=sin(q.y*7.-uTime*2.1+vSeed)*(.035+q.y*.07)+(n-.5)*.20;float edge=abs(q.x-.5+sway)*2.;float width=pow(max(0.,1.-q.y),.72)*.75;
float a=(1.-smoothstep(width-.20,width+.06,edge))*smoothstep(0.,.12,q.y)*(1.-smoothstep(.70,1.,q.y))*.82;
float heat=clamp((1.-edge)*.65+(1.-q.y)*.45+(n-.5)*.35,0.,1.);vec3 c=mix(vec3(2.4,.13,.006),vec3(4.2,2.2,.22),smoothstep(.45,.98,heat));o=vec4(c*a,a);}`;
function program(gl){const p=gl.createProgram(),shaders=[];try{for(const [type,src]of [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,FS]]){const sh=gl.createShader(type);shaders.push(sh);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return {p,u:Object.fromEntries(['uVP','uModel','uRight','uUp','uScale','uTime'].map(n=>[n,gl.getUniformLocation(p,n)]))};}catch(e){gl.deleteProgram(p);throw e;}finally{for(const sh of shaders)gl.deleteShader(sh);}}
function resources(S,q){if(q.resources)return q.resources;const gl=S.gl,r=q.resources={parts:[],personParts:[],personPose:personPose(q.place),atlas:null,fx:null,program:null};
 try{for(const p of model().parts){const b=new G.MeshBatch(gl,[3,3,2],false);r.parts.push({...p,batch:b});b.v=p.vertices;b.i=p.indices;b.nv=p.vertices.length/8;b.upload();b.v=[];b.i=[];}
  for(const p of personModel().parts){const b=new G.MeshBatch(gl,[3,3,2],false);r.personParts.push({...p,batch:b});b.v=p.vertices;b.i=p.indices;b.nv=p.vertices.length/8;b.upload();b.v=[];b.i=[];}
  r.atlas=atlas(gl);r.program=program(gl);r.fx=new G.MeshBatch(gl,[3,2,3],false);
  const sprite=(pos,size,seed,smoke)=>{const o=r.fx.nv;for(const uv of [[0,0],[1,0],[1,1],[0,1]])r.fx.vert(...pos,...uv,seed,size,smoke);r.fx.tri(o,o+1,o+2);r.fx.tri(o,o+2,o+3);};
  // A broad fireball above the roof, flames at both ends and a taller rolling
  // smoke plume. The near-side door sits below the large flames, keeping the logo legible.
  for(let i=0;i<24;i++)sprite([Math.sin(i*2.4)*.68,1.35,Math.cos(i*3.7)*.20],1.08,i+30,1);
  for(let i=0;i<20;i++){const xx=i%2?.76:-.84,z=(i%5-2)*.11;sprite([xx,.46,z],.41+(i%4)*.055,i+1,0);}
  for(let i=0;i<12;i++){const x=-.65+(i%4)/3*1.30,z=q.place.side*.18+(Math.floor(i/4)-1)*.12;sprite([x,1.17+(i%3)*.13,z],1.05+(i%3)*.065,i+61,2);}
  r.fx.upload();r.fx.v=[];r.fx.i=[];return r;
 }catch(e){dispose(S);throw e;}
}
function dispose(S){const r=S?.incident1195?.resources;if(!r)return;const gl=S.gl;
 if(gl&&!S.lost){for(const b of [...r.parts.map(p=>p.batch),...r.personParts.map(p=>p.batch),r.fx].filter(Boolean)){gl.deleteBuffer(b.vb);gl.deleteBuffer(b.ib);gl.deleteVertexArray(b.vao);}if(r.atlas)gl.deleteTexture(r.atlas);if(r.program)gl.deleteProgram(r.program.p);}
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
 drawPerson(S,q,r,u);
 const F=r.program,eye=S.cam.eye,tgt=S.cam.tgt,dx=tgt[0]-eye[0],dz=tgt[2]-eye[2],len=Math.hypot(dx,dz)||1;
 gl.useProgram(F.p);gl.uniformMatrix4fv(F.u.uVP,false,VP);gl.uniformMatrix4fv(F.u.uModel,false,P.matrix);gl.uniform3fv(F.u.uRight,[dz/len,0,-dx/len]);gl.uniform3fv(F.u.uUp,[0,1,0]);gl.uniform1f(F.u.uScale,P.scale);gl.uniform1f(F.u.uTime,S.reducedMotion?1.5:S.clock);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);r.fx.draw();
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,S.carAtlas||null);q.draws=(q.draws||0)+1;
}
G.drawIncident1195=draw;
// Brief broadside view only for the automatic director, as the driven vehicle
// approaches the parked car. Explicit camera choices remain the user's choice.
const cam=G.camStep;G.camStep=function(){const out=cam.apply(this,arguments),S=G.S;if(!S?.sim)return out;const q=state(S);if(!q.active||S.forceShot||S.reducedMotion)return out;
 locate(S,q);if(!q.place)return out;const P=q.place,L=S.CL.L,d=((S.sim.s-P.at+L/2)%L+L)%L-L/2;
 if(d<-P.scale*24||d>P.scale*8)return out;
 const s=P.scale,portrait=S.cv.clientWidth<S.cv.clientHeight,back=portrait?5.9:5.0,look=rPersonCentre(P);S.cam={...S.cam,eye:[look[0]-P.normal[0]*back*s+P.f[0]*.7*s,P.pos[1]+2.15*s,look[2]-P.normal[2]*back*s+P.f[2]*.7*s],tgt:[look[0],P.pos[1]+1.05*s,look[2]],fov:portrait?52:48};S.camRoll=0;S.shotName='incident1195';q.cameraPass=true;return out;
};
function rPersonCentre(P){if(P.personCentre1207)return P.personCentre1207;const B=personPose(P).base;return P.personCentre1207=[mix(P.pos[0],B[12],.24),P.pos[1],mix(P.pos[2],B[14],.24)];}
root.ShowcaseIncident1195=root.ShowcaseIncident1207={version:1207,author:'Andrew Fisher',interval:3,fictional:true,update,placement,model,personModel,dispose,
 state:()=>{const q=G.S?.incident1195;return q?{lap:q.lap,lastLap:q.lastLap,active:q.active,triggers:q.triggers,draws:q.draws||0,resources:!!q.resources,personDraws:q.personDraws||0,waveTime:q.waveTime??null,place:q.place?{at:q.place.at,side:q.place.side,roadClearance:q.place.roadClearance,frontClearance:q.place.frontClearance}:null}:null;}};
})(window);
