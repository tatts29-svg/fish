/* Author: Andrew Fisher.
 * Existing Special Editions: shaped panels, rounded tyres and mechanical depth.
 * Decorative models only. Selection, driving, hitch and all motion pivots stay fixed.
 */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.plantVisuals800)return;
G.plantVisuals800=true;
const originalKit=G.plantKit,originalDetail=G.plantDetail,originalTrailerDetail=G.trailerDetail;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),
 sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),
 cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
 unit=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
G.plantKit=function(level){
 const K=originalKit(level),high=level==='high',rawBox=K.box;
 // Analytic normals remain continuous across all six panel faces. Broad faces
 // are planar; only the pressed edge turns, rather than inflating the whole panel.
 function rounded(p,c,h,r,fine){
  if(h.some(v=>v<1e-7))return rawBox(p,c[0]-h[0],c[0]+h[0],c[1]-h[1],c[1]+h[1],c[2]-h[2],c[2]+h[2]);
  r=Math.min(r,...h.map(v=>v*.86));
  const core=h.map(v=>v-r),steps=fine?[0,.293,1]:[0,1],
   coords=a=>[-a,...steps.slice(1).map(t=>-a+r*t),...steps.slice().reverse().map(t=>a-r*t)];
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const u=(axis+1)%3,v=(axis+2)%3,us=coords(h[u]),vs=coords(h[v]),base=p.vertices.length/8;
   for(const a of us)for(const b of vs){
    const q=[0,0,0];q[axis]=sign*h[axis];q[u]=a;q[v]=b;
    const near=q.map((n,i)=>clamp(n,-core[i],core[i])),n=unit(sub(q,near));
    p.vertices.push(...near.map((x,i)=>c[i]+x+n[i]*r),...n,(a/h[u]+1)/2,(b/h[v]+1)/2);
   }
   const ix=(i,j)=>base+i*vs.length+j;
   for(let i=0;i+1<us.length;i++)for(let j=0;j+1<vs.length;j++){
    const a=ix(i,j),b=ix(i+1,j),c0=ix(i+1,j+1),d=ix(i,j+1);
    if(sign>0)p.indices.push(a,b,c0,a,c0,d);else p.indices.push(a,c0,b,a,d,c0);
   }
  }
 }
 K.rbox=function(p,x,y,z,a,b,c,e){
  rounded(p,[x,y,z],[a,b,c],Math.min(a,b,c)*clamp((e||.22)*1.3,.20,.68),high);
 };
 K.box=function(p,x0,x1,y0,y1,z0,z1){
  const lo=[Math.min(x0,x1),Math.min(y0,y1),Math.min(z0,z1)],hi=[Math.max(x0,x1),Math.max(y0,y1),Math.max(z0,z1)],
   h=lo.map((v,i)=>(hi[i]-v)/2),c=lo.map((v,i)=>(hi[i]+v)/2);
  // Thin markings, glazing and tiny hardware retain their original flat faces.
  if(Math.min(...h)<.006||p.material==='glass')return rawBox(p,...[lo[0],hi[0],lo[1],hi[1],lo[2],hi[2]]);
  rounded(p,c,h,Math.min(.008,Math.min(...h)*.23),false);
 };
 // Surface of revolution around the existing axle. Ring-profile derivatives
 // produce smooth radial normals, including the curved shoulder and sidewall.
 function lathe(p,x,y,z,profile,n){
  const base=p.vertices.length/8;
  for(let j=0;j<profile.length;j++){
   const [r,d]=profile[j],a=profile[Math.max(0,j-1)],b=profile[Math.min(profile.length-1,j+1)],
    tangent=unit([b[0]-a[0],b[1]-a[1]]),nr=tangent[1],nz=-tangent[0];
   for(let i=0;i<=n;i++){const t=i/n*TAU,ct=Math.cos(t),st=Math.sin(t);
    p.vertices.push(x+r*ct,y+r*st,z+d,nr*ct,nr*st,nz,i/n,j/(profile.length-1));}
  }
  for(let j=0;j+1<profile.length;j++)for(let i=0;i<n;i++){
   const a=base+j*(n+1)+i,b=a+n+1;p.indices.push(a,b+1,b,a,a+1,b+1);
  }
 }
 function ring(p,x,y,z,r,t,n){
  const profile=[];for(let j=0;j<=8;j++){const a=-Math.PI/2+j/8*TAU;profile.push([r+t*Math.cos(a),t*Math.sin(a)]);}
  lathe(p,x,y,z,profile,n);
 }
 K.wheel=function(x,y,z,R,W,opts){
  opts=opts||{};const meta={wheel:{x,y}},n=high?40:28,lugs=opts.lugs!==false,
   tyre=K.group('tyre','rubber',meta),rim=K.group('rim',opts.rim||'plant',meta),
   hub=K.group('hub','plantBlack',meta),metal=K.group('wheel hardware','steel',meta),
   rr=R*(opts.rimR||.56),Rc=lugs?R*.93:R,half=W/2,side=z<0?-1:1;
  lathe(tyre,x,y,z,[
   [rr*.97,-half*.96],[R*.70,-half*1.035],[R*.84,-half*.98],[Rc*.975,-half*.80],
   [Rc,-half*.45],[Rc*1.015,0],[Rc,half*.45],[Rc*.975,half*.80],
   [R*.84,half*.98],[R*.70,half*1.035],[rr*.97,half*.96]
  ],n);
  for(const sd of [-1,1]){
   const d=sd*half*.97,profile=[[rr*.21,d-sd*.027],[rr*.35,d-sd*.024],[rr*.65,d-sd*.017],
    [rr*.84,d-sd*.006],[rr*.98,d],[rr*1.01,d+sd*.006]];
   // Traverse each face so normals and winding point away from the axle.
   if(sd>0)profile.reverse();lathe(rim,x,y,z,profile,n);
   K.disc(hub,[x,y,z+d-sd*.026],0,rr*.24,sd,high?20:12);
   ring(metal,x,y,z+d,rr*.97,R*.015,n);
  }
  const outer=z+side*(half*.97+.001);
  for(let i=0;i<8;i++){
   const t=i/8*TAU,c=Math.cos(t),s=Math.sin(t),r=rr*.70,
    center=[x+c*r,y+s*r,outer-side*.012],u=[-s,c,0],v=[c,s,0],pts=[];
   // Recessed ventilation pockets in the pressed dish; restrained steel studs.
   for(let j=0;j<12;j++){const a=j/12*TAU;pts.push(center.map((q,k)=>q+u[k]*Math.cos(a)*rr*.10+v[k]*Math.sin(a)*rr*.17));}
   const ix=[];for(let j=1;j+1<pts.length;j++)ix.push(0,j,j+1);K.add(hub,pts,ix,null,[0,0,side]);
   if(i<6){const a=i/6*TAU;K.tube(metal,[x+Math.cos(a)*rr*.40,y+Math.sin(a)*rr*.40,outer-side*.015],
    [x+Math.cos(a)*rr*.40,y+Math.sin(a)*rr*.40,outer+side*.003],rr*.049,6);}
  }
  ring(tyre,x,y,outer-side*.001,R*.80,R*.006,n);
  if(lugs){
   const count=opts.nl||18;
   // Tapered chevrons follow the crown and shoulder. Their sloping ends avoid
   // the rectangular blocks protruding from the former cylindrical carcass.
   for(let i=0;i<count;i++)for(const sd of [-1,1]){
    const t=(i+.5)/count*TAU,points=[],angle=R*.15/R;
    for(const rad of [Rc*.994,R*1.003])for(const [along,across]of [[-1,.10],[1,.10],[1,.90],[-1,.90]]){
     const a=t+along*angle*.44+sd*(across-.1)*.20,r=rad-(across>.8?R*.022:0);
     points.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z+sd*half*across]);
    }
    const mid=points[0].map((_,k)=>points.reduce((s,p)=>s+p[k],0)/8);
    for(const ids of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
     const q=ids.map(j=>points[j]);K.add(tyre,q,[0,1,2,0,2,3],null,p=>sub(p,mid));
    }
   }
  }else{
   for(const offset of [-.42,0,.42])ring(tyre,x,y,z+half*offset,R*.998,R*.005,n);
  }
 };
 K.panel800=function(p,x0,x1,y0,y1,z,sd){
  K.box(p,x0,x1,y0,y1,z-sd*.003,z);return p;
 };
 return K;
};
G.plantDetail=function(kind,K){
 if(originalDetail)originalDetail(kind,K);
 const {group,box,tube,bar,quad}=K,black=group('service recesses','plantBlack'),steel=group('service fittings','steel'),
  orange=group('service panels','plant');
 const seam=(a,b,r=.003)=>tube(black,a,b,r,6),pin=(x,y,z,r=.025)=>tube(steel,[x,y,z-.006],[x,y,z+.006],r,12);
 if(kind==='forklift'){
  // Counterweight grille and cast recess, then separate mast rollers and chain
  // runs. They sit on the existing volumes, keeping the open ROPS silhouette.
  for(let i=0;i<7;i++)box(black,-.864,-.853,.34+i*.027,.352+i*.027,-.23,.23);
  for(const sd of [-1,1]){
   const z=.405*sd;seam([-.73,.30,z],[-.73,.56,z]);
   for(const y of [.48,.62,.78,1.13])pin(.69,y,.22*sd,.028);
   tube(steel,[.15,.46,.27*sd],[.57,.56,.24*sd],.017,12);
   for(let i=0;i<4;i++)box(steel,.045+i*.055,.06+i*.055,.342,.35,.315*sd,.41*sd);
  }
  box(black,-.49,-.13,.53,.555,-.26,.26);
  for(const sd of [-1,1])tube(steel,[-.28,.71,.20*sd],[-.12,.70,.20*sd],.009,8);
 }else if(kind==='boom'){
  for(const sd of [-1,1]){
   const z=.369*sd;box(black,-.48,-.03,.665,.722,z,z+sd*.004);
   for(let i=0;i<9;i++)box(orange,-.47+i*.045,-.45+i*.045,.670,.717,z+sd*.005,z+sd*.008);
   for(const [x,y]of [[-.29,.79],[.40,.84],[1.61,.91]])pin(x,y,.125*sd,.032);
   seam([.14,1.034,.074*sd],[1.25,.999,.074*sd],.005);
  }
  tube(black,[-.15,.74,-.02],[.30,.85,-.02],.04,12);
  tube(steel,[.11,.803,-.02],[.36,.87,-.02],.022,12);
  const sw={sway:{p:[1.74,.72,0],roll:.9,pitch:.5}},floor=group('basket deck texture','plantBlack',sw),
   bolts=group('basket hinge fittings','steel',sw);
  for(let i=0;i<7;i++)box(floor,1.78+i*.049,1.787+i*.049,.401,.404,-.31,.31);
  tube(bolts,[1.77,.56,.353],[1.77,.70,.353],.022,10);
 }else if(kind==='scissor'){
  for(const sd of [-1,1]){
   const z=.344*sd;seam([-.29,.255,z],[-.29,.442,z]);seam([.28,.255,z],[.28,.442,z]);
   for(let i=0;i<7;i++)box(black,.31+i*.035,.326+i*.035,.30,.405,z,z+sd*.004);
   for(let i=0;i<4;i++)for(const x of [-.575,0,.575])pin(x,.52+i*.075,.261*sd,.025);
  }
  // Deck strips remain inside the guardrails. Fixed hydraulic fittings do not
  // add a new animation or change the folded transport configuration.
  for(let i=0;i<12;i++)box(black,-.665+i*.112,-.659+i*.112,.861,.864,-.29,.29);
  tube(steel,[-.59,.93,-.323],[-.59,1.34,-.323],.012,8);
 }else if(kind==='tractor'){
  for(const sd of [-1,1]){
   const z=.244*sd;seam([.22,.39,z],[.22,.64,z]);
   for(let i=0;i<7;i++)box(black,.60+i*.028,.612+i*.028,.558,.632,z,z+sd*.004);
   const gz=.287*sd;
   seam([-.318,.655,gz],[.101,.655,gz],.009);seam([-.318,1.015,gz],[.101,1.015,gz],.009);
   tube(steel,[-.16,.81,.307*sd],[-.065,.81,.307*sd],.009,8);
   for(const y of [.34,.43,.52])box(black,-.23,.06,y,y+.012,.31*sd,.395*sd);
  }
  // Visible seat, dashboard and window wiper give the glazed cab real depth.
  K.rbox(black,-.23,.76,0,.04,.115,.15,.35);K.rbox(black,-.14,.66,0,.11,.03,.15,.35);
  box(black,.04,.10,.73,.78,-.235,.235);
  tube(black,[.13,.68,-.16],[.13,.94,-.06],.006,8);
 }
};
G.trailerDetail=function(K,L,halfW){
 if(originalTrailerDetail)originalTrailerDetail(K,L,halfW);
 const {group,box,tube,bar}=K,steel=group('trailer running gear','steel'),black=group('trailer mechanical trim','plantBlack');
 tube(steel,[0,.19,-halfW],[0,.19,halfW],.027,12);
 for(const sd of [-1,1]){
  for(let j=0;j<3;j++)bar(black,[-.25,.24+j*.008,halfW*.79*sd],[.25,.24+j*.008,halfW*.79*sd],.023,.007);
  tube(steel,[-.18,.20,halfW*.80*sd],[.07,.31,halfW*.80*sd],.012,10);
  box(black,-.125,.125,.18,.245,halfW*.88*sd,halfW*.94*sd);
 }
 K.rbox(steel,L-.025,.274,0,.064,.029,.043,.4);
 tube(black,[L-.10,.301,0],[L+.011,.315,0],.014,10);
 // A latch at the coupling and tyre hardware are shared by both old trailers;
 // the VMS face, portaloo door and occupant retain their separate moving parts.
};
function consolidate(model,kind){
 if(model.stats.visual800)return model;
 const groups=new Map(),names=[];let collapsed=0;
 for(const part of model.parts){
  const meta={};for(const key of ['material','color','wheel','sway','vmsFace','door','arm','tex'])if(part[key]!==undefined)meta[key]=part[key];
  const key=JSON.stringify(meta);let g=groups.get(key);
  if(!g){g={name:part.name,...meta,vertices:[],indices:[]};groups.set(key,g);}
  const base=g.vertices.length/8;for(const v of part.vertices)g.vertices.push(v);
  for(let i=0;i<part.indices.length;i+=3){
   const ids=[part.indices[i],part.indices[i+1],part.indices[i+2]],
    pos=ids.map(j=>Array.from(part.vertices.slice(j*8,j*8+3)));
   // The retained operator/beacon kit can collapse a pole after Float32
   // conversion. Remove zero-area faces and sub-micron collapsed edges; keep
   // all live surface vertices and the operator's original shape.
   if(Math.hypot(...cross(sub(pos[1],pos[0]),sub(pos[2],pos[0])))<1e-12||
    Math.min(...[0,1,2].map(j=>Math.hypot(...sub(pos[j],pos[(j+1)%3]))))<1e-7){collapsed++;continue;}
   g.indices.push(...ids.map(j=>base+j));
  }
  names.push(part.name);
 }
 const before=model.parts.length;
 model.parts=Array.from(groups.values()).map(p=>({...p,vertices:new Float32Array(p.vertices),indices:new Uint32Array(p.indices)}));
 model.stats={...model.stats,triangles:model.parts.reduce((s,p)=>s+p.indices.length/3,0),
  parts:model.parts.length,visual800:true,kind:'refined existing '+kind,
  originalPartNames:names,partsBeforeMerge:before,unchangedMotionMetadata:true,newTextures:0,
  geometryBuiltOnce:true,analyticPanelNormals:true,shapedTyres:true,pressedRims:true,
  collapsedLegacyPoleTrianglesRemoved:collapsed};
 return model;
}
for(const [name,cacheName]of [['plantModel','_plantModels'],['vmsModel','_vmsModels'],['looModel','_looModels']]){
 const original=G[name];G[cacheName]={};
 G[name]=function(){return consolidate(original.apply(this,arguments),name==='plantModel'?arguments[0]:name==='vmsModel'?'VMS trailer':'portaloo trailer');};
}
})();
