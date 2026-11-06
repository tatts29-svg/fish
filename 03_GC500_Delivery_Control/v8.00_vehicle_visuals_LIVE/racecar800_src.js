/* Author: Andrew Fisher. v8.00 — surfaced race coupe.
 * Coherent curved panels, mechanical wheel depth, recessed lights and closed aero
 * sections within the established model envelope. Driving and wheel pivots stay
 * unchanged. Original authored geometry; no imported mesh or game assets.
 * Local axes: x forward, y up, z right. */
(function(){
'use strict';
const G=window.GC3D,TAU=Math.PI*2;
G.raceCarVisual800={version:'v8.00',source:'Original authored race coupe',physicsChanged:false};
G.raceCarModel=function(quality){
 // Both tiers retain every visible mechanical assembly. Surface subdivision is
 // bounded; detail comes from profiles and normals rather than redundant faces.
 const level=quality==='balanced'?'balanced':'high';
 const cache=G._raceCarModels||(G._raceCarModels={});
 if(cache[level])return cache[level];
 const segments=n=>n<=12?n:Math.max(8,Math.ceil(n*(level==='high'?.72:.42)/4)*4);
 const parts=[],groups={};
 const mix=(a,b,t)=>a+(b-a)*t,clamp=(a,l,h)=>Math.max(l,Math.min(h,a));
 const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};
 function group(name,material,wheel){
 if(groups[name])return groups[name];
 const p={name,material,vertices:[],indices:[]};if(wheel)p.wheel=wheel;groups[name]=p;parts.push(p);return p;
 }
 function add(p,positions,indices,uvs,expected){
 const ns=positions.map(()=>[0,0,0]),clean=[];
 for(let i=0;i<indices.length;i+=3){
 let a=indices[i],b=indices[i+1],c=indices[i+2],n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));
 if(Math.hypot(...n)<1e-13)continue;
 const center=positions[a].map((v,k)=>(v+positions[b][k]+positions[c][k])/3);
 if(expected&&dot(n,typeof expected==='function'?expected(center):expected)<0){indices[i+1]=c;indices[i+2]=b;n=n.map(x=>-x);}
 clean.push(indices[i],indices[i+1],indices[i+2]);
 for(const j of [a,b,c])for(let k=0;k<3;k++)ns[j][k]+=n[k];
 }
 const base=p.vertices.length/8;
 positions.forEach((q,i)=>{const fallback=expected?(typeof expected==='function'?expected(q):expected):[0,1,0],n=norm(Math.hypot(...ns[i])>1e-15?ns[i]:fallback);p.vertices.push(...q,...n,...(uvs&&uvs[i]||[0,0]));});
 for(const j of clean)p.indices.push(base+j);
 }
 function patch(p,fn,nu,nv,expected){
 nu=segments(nu);nv=segments(nv);
 const vs=[],uv=[],ix=[];
 for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){vs.push(fn(i/nu,j/nv));uv.push([i/nu,j/nv]);}
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;ix.push(a,b,b+1,a,b+1,a+1);}
 // A curved sheet has one orientation. Reversing individual triangles against
 // a fixed world axis produced opposing C-pillar normals in the prior model.
 // Choose winding once, then retain it across the complete parameter surface.
 const tangent=(u,v)=>{const e=.00001,ua=Math.max(0,u-e),ub=Math.min(1,u+e),va=Math.max(0,v-e),vb=Math.min(1,v+e);
  return cross(sub(fn(ub,v),fn(ua,v)),sub(fn(u,vb),fn(u,va)));};
 let orientation=1;
 for(const [u,v]of [[.5,.5],[.37,.43],[.61,.23]]){const n=tangent(u,v);if(Math.hypot(...n)>1e-15){const out=typeof expected==='function'?expected(fn(u,v)):expected;if(out&&dot(n,out)<0)orientation=-1;break;}}
 if(orientation<0)for(let i=0;i<ix.length;i+=3){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t;}
 const first=p.vertices.length;
 add(p,vs,ix,uv,null);
 // Surface derivatives keep highlights smooth at the edge of neighbouring
 // samples. Singular fan centres retain the area-weighted fallback normal.
 for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){
  const n=tangent(i/nu,j/nv),length=Math.hypot(...n);if(length<1e-15)continue;
  const k=first+(i*(nv+1)+j)*8+3;for(let q=0;q<3;q++)p.vertices[k+q]=n[q]/length*orientation;
 }
 }
 function quad(p,a,b,c,d,out){add(p,[a,b,c,d],[0,1,2,0,2,3],[[0,0],[1,0],[1,1],[0,1]],out);}
 function box(p,x0,x1,y0,y1,z0,z1){
 quad(p,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);
 quad(p,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]);
 quad(p,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0]);
 quad(p,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0]);
 quad(p,[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],[-1,0,0]);
 quad(p,[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[1,0,0]);
 }
 function tube(p,a,b,r,n=10){
 const axis=norm(sub(b,a)),side=norm(cross(axis,Math.abs(axis[1])<.85?[0,1,0]:[1,0,0])),up=cross(axis,side);
 patch(p,(t,u)=>{const angle=u*TAU;return a.map((v,k)=>mix(v,b[k],t)+r*(side[k]*Math.cos(angle)+up[k]*Math.sin(angle)));},1,n,q=>{const v=sub(q,a),t=dot(v,axis);return v.map((w,k)=>w-axis[k]*t);});
 }
 function poly(p,points,out){const ix=[];for(let i=1;i<points.length-1;i++)ix.push(0,i,i+1);add(p,points,ix,null,out);}
 function extrude(p,points,delta,out){
 poly(p,points,out);const rear=points.map(q=>q.map((v,k)=>v+delta[k]));poly(p,rear,out.map(v=>-v));
 const center=points.reduce((a,q)=>a.map((v,k)=>v+q[k]/points.length),[0,0,0]);
 for(let i=0;i<points.length;i++){const j=(i+1)%points.length,edgecenter=points[i].map((v,k)=>(v+points[j][k])/2-center[k]);quad(p,points[i],points[j],rear[j],rear[i],edgecenter);}
 }
 function ring(p,x,y,z,r0,r1,side,n=96){
 patch(p,(a,b)=>{const t=a*TAU,r=mix(r0,r1,b);return [x+Math.cos(t)*r,y+Math.sin(t)*r,z];},n,1,[0,0,side]);
 }
 function ellipse(p,c,r,n=32,ny=12){patch(p,(a,b)=>{const th=a*TAU,ph=b*Math.PI;return[c[0]+r[0]*Math.cos(th)*Math.sin(ph),c[1]+r[1]*Math.cos(ph),c[2]+r[2]*Math.sin(th)*Math.sin(ph)];},n,ny,q=>q.map((v,i)=>(v-c[i])/(r[i]*r[i])));}
 const body=group('sculpted-body','paint'),frame=group('roof-and-pillars','paint'),black=group('panel-gaps-and-insets','interior'),carbon=group('aero-carbon','carbon'),glass=group('curved-window-glass','glass'),metal=group('fixed-machined-detail','alloy'),grille=group('honeycomb-grilles','grille'),white=group('led-running-lights','lampWhite'),red=group('rear-light-guides','lampRed'),cockpit=group('cockpit-and-cage','interior'),wingEnds=group('wing-endplates','paint');
 const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 const gauss=(x,c,w)=>Math.exp(-Math.pow((x-c)/w,2));
 function width(x){return.378+.038*gauss(x,.58,.255)+.045*gauss(x,-.53,.29)-.012*smooth((x-.82)/.235)-.025*smooth((-x-.85)/.18);}
 function belt(x){return.329+.024*gauss(x,.58,.28)+.036*gauss(x,-.53,.29)-.041*smooth((x-.83)/.225)-.010*smooth((-x-.87)/.16);}
 function archBottom(x){let y=.066;for(const axle of [.58,-.53]){const d=Math.abs(x-axle),r=.164;if(d<r)y=Math.max(y,.145+Math.sqrt(r*r-d*d));}return y;}
 function sideZ(x,y){const t=clamp((y-.066)/(belt(x)-.086),0,1);return width(x)-.025*Math.pow(1-t,2)-.012*gauss(t,.47,.26)+.004*gauss(t,.78,.11);}
 const frontX=(y,z)=>1.055-.085*Math.pow(Math.abs(z)/.39,3.2)-.018*smooth((y-.22)/.085)+.004*Math.sin((y-.075)/.22*Math.PI);
 const rearHalf=y=>sideZ(-1.025,y);
 const rearX=(y,z)=>-1.038+.085*(1-Math.sqrt(Math.max(0,1-Math.pow(Math.min(1,Math.abs(z)/rearHalf(y)),2))))+.029*smooth((.13-y)/.07)+.007*smooth((y-.30)/.045);
 const skinX=(x,y,z)=>x+smooth((x-.80)/.255)*(frontX(y,z)-1.055)+smooth((-x-.84)/.185)*(rearX(y,z)+1.025);
 function crownY(x,z){const a=Math.abs(z)/(width(x)-.045);const u=clamp((x-.26)/.795,0,1);const center=.343-.048*smooth(u)+.008*Math.sin(u*Math.PI);return mix(center,belt(x)+.008,Math.pow(a,2.5))+.013*gauss(a,.61,.11)*Math.sin(u*Math.PI);}
 function roofY(x,z){return.478+.035*(1-Math.pow(z/.258,2))+.006*Math.sin(clamp((x+.442)/.4,0,1)*Math.PI);}
 G.raceCarSideZ=function(worldX,y){let x=worldX;for(let i=0;i<6;i++)x+=worldX-skinX(x,y,sideZ(x,y));return sideZ(x,y);};
 G.raceCarSurfaceY=function(worldX,z){let x=worldX;if(x>=.26){for(let i=0;i<6;i++)x+=worldX-skinX(x,crownY(x,z),z);return crownY(x,z);}if(x>=-.442&&x<=-.042)return roofY(x,z);for(let i=0;i<6;i++)x+=worldX-skinX(x,belt(x)+.008+.006*(1-Math.pow(z/(width(x)-.045),2)),z);return belt(x)+.008+.006*(1-Math.pow(z/(width(x)-.045),2));};
 G.raceCarWindowInfo={frontBase:[.268,.332,.324],frontTop:[-.049,.482,.255],rearTop:[-.438,.479,.257],rearBase:[-.753,.351,.331],sideRearBase:[-.714,.351,.336]};
 /* Sculpted quarters wrap continuously into a rounded shoulder. Arch openings
 are cut into the skin, rather than painted over a rectangular side slab. */
 for(const side of [-1,1]){
 const breaks=[-1.025,-.694,-.366,.416,.744,1.055];
 for(let s=0;s<breaks.length-1;s++)patch(body,(u,v)=>{const x=mix(breaks[s],breaks[s+1],u),axle=s===1?-.53:s===3?.58:null,
  lower=axle===null?.066:.145+Math.sqrt(Math.max(0,.164*.164-(x-axle)*(x-axle))),y=mix(lower,belt(x)-.027,v);
  const z=side*sideZ(x,y);return[skinX(x,y,z),y,z];},Math.ceil((breaks[s+1]-breaks[s])*185),13,[0,0,side]);
 patch(body,(u,v)=>{const x=mix(-1.025,1.055,u),a=v*Math.PI/2;const y=belt(x)-.027+.035*Math.cos(a),z=side*(width(x)-.045+.045*Math.sin(a));return[skinX(x,y,z),y,z];},240,18,[0,.5,side]);
 for(const x of [.58,-.53]){
 patch(body,(u,v)=>{const t=u*Math.PI,r=.164+v*.009,px=x+Math.cos(t)*r,y=.145+Math.sin(t)*r;return[px,y,side*(sideZ(px,y)+.003*Math.sin(v*Math.PI))];},100,6,[0,.1,side]);
 patch(black,(u,v)=>{const t=u*Math.PI,r=.164;return[x+Math.cos(t)*r,.145+Math.sin(t)*r,side*mix(sideZ(x+Math.cos(t)*r,.145+Math.sin(t)*r),.294,v)];},80,4,q=>[-(q[0]-x),-(q[1]-.145),0]);
 }
 /* Aero sill has a curved tapered section, not a freestanding box. */
 patch(carbon,(u,v)=>{const x=mix(-.368,.417,u),a=v*Math.PI/2;return[x,.044+.025*Math.cos(a),side*(sideZ(x,.07)+.033*Math.sin(a)*Math.sin(u*Math.PI))];},50,8,[0,.2,side]);
 const seam=[[-.419,.346],[-.390,.172],[-.334,.095],[.280,.095],[.315,.173],[.245,.332]];
 for(let k=0;k<seam.length-1;k++){const a=seam[k],b=seam[k+1];for(let j=0;j<5;j++){const q=t=>{const x=mix(a[0],b[0],t),y=mix(a[1],b[1],t);return[x,y,side*(sideZ(x,y)+.0008)];};tube(black,q(j/5),q((j+1)/5),.00085,6);}}
 ellipse(black,[-.263,.306,side*(sideZ(-.263,.306)+.001)],[.037,.0045,.0035],24,8);
 }
 /* Bonnet edge and shoulder now share their exact seam; rounded fender bulges
 are visible in silhouette as well as in the highlight. */
 patch(body,(u,v)=>{const x=mix(.26,1.055,u),z=mix(-1,1,v)*(width(x)-.045);const y=crownY(x,z);return[skinX(x,y,z),y,z];},76,54,[0,1,0]);
 patch(body,(u,v)=>{const x=mix(-1.025,-.752,u),w=2*v-1;const y=belt(x)+.008+.006*(1-w*w),z=w*(width(x)-.045);return[skinX(x,y,z),y,z];},42,44,[0,1,0]);
 /* Extractors follow the curved bonnet; thin louvres sit inside a real recess. */
 for(const side of [-1,1]){
 patch(black,(u,v)=>{const x=mix(.38,.58,u),z=side*mix(.078,.147,v);return[x,crownY(x,z)+.0005,z];},14,8,[0,1,0]);
 for(let k=0;k<7;k++){const x=.391+k*.027;patch(carbon,(u,v)=>{const px=x+u*.008,z=side*mix(.083,.141,v);return[px,crownY(px,z)+.0015+.002*Math.sin(u*Math.PI),z];},2,8,[0,1,0]);}
 for(const x of [.75,.30])patch(metal,(u,v)=>{const a=u*TAU,r=mix(.004,.007,v),px=x+Math.cos(a)*r,z=side*.246+Math.sin(a)*r;return[px,crownY(px,z)+.001,z];},24,1,[0,1,0]);
 }
 /* Fastback greenhouse: a low domed roof, swept curved laminated glass, broad
 flush painted A/C pillars. There are no roll-cage tubes around the exterior. */
 patch(frame,(u,v)=>{const w=2*v-1,x=mix(-.442+.007*Math.pow(w,4),-.042-.014*Math.pow(w,4),u),z=w*.258;return[x,roofY(x,z),z];},44,52,[0,1,0]);
 const wind=(u,v)=>{const w=2*v-1,x=mix(.268,-.042-.014*Math.pow(w,4),u),half=mix(.324,.258,u);return[x+.017*(1-w*w)*Math.sin(u*Math.PI),mix(.332,.478,u)+(.010+.025*u)*(1-w*w),w*half];};
 const rearwind=(u,v)=>{const w=2*v-1;return[mix(-.442+.007*Math.pow(w,4),-.753,u),mix(.478,.351,u)+(.035-.025*u)*(1-w*w),w*mix(.258,.331,u)];};
 patch(glass,wind,40,52,[1,1,0]);patch(glass,rearwind,38,50,[-1,1,0]);
 for(const side of [-1,1]){
 const A=[.268,.332,side*.324],B=[-.056,.478,side*.258],C=[-.435,.478,side*.258],D=[-.714,.351,side*.336];
 const sideglass=(u,v)=>{const a=A.map((q,k)=>mix(q,D[k],u)),b=B.map((q,k)=>mix(q,C[k],u));return a.map((q,k)=>mix(q,b[k],v)+(k===2?side*.005*Math.sin(v*Math.PI)*Math.sin(u*Math.PI):0)+(k===1?.004*Math.sin(u*Math.PI)*Math.sin(v*Math.PI):0));};
 patch(glass,sideglass,46,22,[0,.1,side]);
 /* Broad thin strips merge with the roof and shell, so the glass appears
 recessed into sheet metal instead of supported by exposed scaffold. */
 patch(frame,(u,v)=>{const p=wind(u,side>0?1:0);return[p[0]+mix(-.004,.007,v)+.003,p[1]+.003,p[2]+side*(.0008+v*.016)];},44,8,[0,.3,side]);
 patch(frame,(u,v)=>{const x=mix(B[0],C[0],u);return[x,roofY(x,side*(.258+v*.012))+.003,side*(.258+v*.012)];},44,6,[0,1,side]);
 patch(frame,(u,v)=>{const a=C.map((q,k)=>mix(q,D[k],u)),b=[mix(-.476,-.80,u),mix(.463,.350,u),side*mix(.286,.370,u)];return a.map((q,k)=>mix(q,b[k],v));},36,14,[0,.5,side]);
 patch(frame,(u,v)=>{const x=mix(-.80,.268,u),bottom=[x,belt(x)+.008,side*(width(x)-.045)],top=D.map((q,k)=>mix(q,A[k],u));return bottom.map((q,k)=>mix(q,top[k],v));},64,12,[0,.5,side]);
 patch(black,(u,v)=>{const lower=[-.365,.346,side*.330],upper=[-.282,.483,side*.266];return lower.map((q,k)=>mix(q,upper[k],u)+(k===0?(v-.5)*.007:0));},20,2,[0,0,side]);
 tube(carbon,[.136,.346,side*.338],[.116,.359,side*.414],.005,10);
 ellipse(carbon,[.115,.363,side*.433],[.047,.019,.031],36,16);
 ellipse(glass,[.078,.363,side*.434],[.003,.013,.023],28,12);
 }
 /* Wiper rides on the glass. */
 tube(carbon,[.20,.361,-.225],[.079,.413,.135],.0016,8);
 /* Wrapped front fascia. A curved shell leads into two slim lamps and a narrow
 upper grille, above the broad, swept trapezoidal main intake. */
 const F=(y,z,depth=0)=>[frontX(y,z)+depth,y,z];
 function curveLoop(points,steps=5){const out=[];for(let i=0;i<points.length;i++){const p=points[(i+points.length-1)%points.length],q=points[i],r=points[(i+1)%points.length],a=q.map((x,k)=>mix(x,p[k],.12)),b=q.map((x,k)=>mix(x,r[k],.12));for(let j=0;j<steps;j++){const t=j/steps;out.push(a.map((x,k)=>(1-t)*(1-t)*x+2*(1-t)*t*q[k]+t*t*b[k]));}}return out;}
 function faceLoop(p,loop,depth,out=[1,0,0]){
 const center=loop.reduce((a,q)=>[a[0]+q[0]/loop.length,a[1]+q[1]/loop.length],[0,0]);
 for(let k=0;k<loop.length;k++){const a=loop[k],b=loop[(k+1)%loop.length];patch(p,(u,v)=>{const y=mix(center[0],mix(a[0],b[0],v),u),z=mix(center[1],mix(a[1],b[1],v),u);return F(y,z,depth);},8,3,out);}
 }
 function faceRim(p,outer,inner,d0,d1){for(let i=0;i<outer.length;i++){const j=(i+1)%outer.length;quad(p,F(...outer[i],d0),F(...outer[j],d0),F(...inner[j],d1),F(...inner[i],d1),[1,0,0]);}}
 /* Nose cap joins the actual bonnet edge, with several rows preserving the
 rounded leading lip rather than a full-height vertical board. */
 patch(body,(u,v)=>{const z=(2*v-1)*.343,y=mix(.276,crownY(1.055,z),u);return[mix(frontX(.276,z),skinX(1.055,crownY(1.055,z),z),u),y,z];},12,70,[1,.6,0]);
 patch(body,(u,v)=>{const y=mix(.062,.273,u),half=mix(.354,.351,u),z=(2*v-1)*half;return F(y,z,-.061);},30,86,[1,0,0]);
 patch(black,(u,v)=>{const z=mix(-.245,.245,v),y=mix(.248,.276,u)+.006*(1-Math.pow(z/.245,2));return F(y,z,-.007);},6,60,[1,0,0]);
 for(const y of [.253,.264])patch(grille,(u,v)=>{const z=mix(-.244,.244,v);return F(y+.002*u,z,-.002);},1,60,[1,0,0]);
 for(const side of [-1,1]){
 const lamp=curveLoop([[.277,side*.234],[.288,side*.343],[.279,side*.366],[.252,side*.352],[.247,side*.265]],5);
 faceLoop(black,lamp,.0005);faceLoop(glass,lamp,.002);
 const led=[[.279,side*.246],[.280,side*.341],[.274,side*.360],[.258,side*.346],[.256,side*.281]];
 for(let k=0;k<led.length-1;k++)for(let j=0;j<5;j++){const a=led[k],b=led[k+1],q=t=>F(mix(a[0],b[0],t),mix(a[1],b[1],t),.004);tube(white,q(j/5),q((j+1)/5),.0016,8);}
 // Projectors sit in black cups behind a separate curved lens; the emitter is
 // a small part of the assembly rather than a white dot painted on the nose.
 for(const z of [.283,.317]){
  ellipse(black,F(.267,side*z,.003),[.004,.007,.011],24,12);
  ellipse(metal,F(.267,side*z,.005),[.003,.0056,.009],24,12);
  ellipse(glass,F(.267,side*z,.007),[.0026,.0048,.0078],24,12);
  ellipse(white,F(.267,side*z,.008),[.001,.0024,.0044],20,10);
 }
 /* Swept outer bumper wraps around the body, enclosing deep triangular ducts. */
 patch(body,(u,v)=>{const y=mix(.064,.247,u),z=side*mix(.342-.006*Math.sin(u*Math.PI),.370-.010*smooth((y-.17)/.085),v);return F(y,z);},40,10,[1,0,side]);
 const outer=curveLoop([[.240,side*.270],[.240,side*.355],[.093,side*.364],[.076,side*.280],[.127,side*.259]],5);
 const inner=outer.map(q=>[.16+(q[0]-.16)*.78,side*.31+(q[1]-side*.31)*.79]);
 faceRim(body,outer,inner,.002,-.010);faceLoop(black,inner,-.024);
 for(let k=0;k<4;k++){const y=.111+k*.027;patch(carbon,(u,v)=>F(y+u*.004,side*mix(.289,.346,v),-.011),1,10,[1,0,0]);}
 /* Sharp but thin bumper blade under the headlight. */
 patch(carbon,(u,v)=>{const z=side*mix(.259,.365,v),y=.239+.004*u+.009*v;return F(y,z,.006*Math.sin(u*Math.PI));},3,20,[1,0,0]);
 }
 const mouthOuter=curveLoop([[.236,-.243],[.236,.243],[.191,.265],[.089,.223],[.089,-.223],[.191,-.265]],8);
 const mouthInner=mouthOuter.map(q=>[.16+(q[0]-.16)*.88,q[1]*.955]);
 faceRim(body,mouthOuter,mouthInner,.006,-.003);faceLoop(black,mouthInner,-.027);
 /* The bridges join the separate ducts into one continuous bumper skin. */
 for(const side of [-1,1]){
 patch(body,(u,v)=>{const y=mix(.066,.267,u),edge=sideZ(1.055,y),z=side*mix(edge,Math.max(edge+.008,.370-.010*smooth((y-.17)/.085)),v);return F(y,z);},34,8,[1,0,side]);
 }
 const insideMouth=(y,z)=>{let yes=false;for(let i=0,j=mouthInner.length-1;i<mouthInner.length;j=i++){const a=mouthInner[i],b=mouthInner[j];if((a[0]>y)!=(b[0]>y)&&z<(b[1]-a[1])*(y-a[0])/(b[0]-a[0])+a[1])yes=!yes;}return yes;};
 /* Honeycomb is actually recessed, so intake cavities read as volume. */
 for(let row=0;row<12;row++)for(let col=0;col<29;col++){
 const z=(col-14)*.017+(row%2)*.0085,y=.091+row*.012;if(!insideMouth(y-.008,z-.010)||!insideMouth(y+.008,z+.010)||!insideMouth(y-.008,z+.010)||!insideMouth(y+.008,z-.010))continue;
 for(let k=0;k<3;k++){const a=k*TAU/6,b=(k+1)*TAU/6;tube(grille,F(y+Math.sin(a)*.0075,z+Math.cos(a)*.0095,-.021),F(y+Math.sin(b)*.0075,z+Math.cos(b)*.0095,-.021),.0007,5);}
 }
 /* Small geometric bowtie outline, centered on the narrow grille bridge. */
 const bowtie=[[.009,-.016],[.009,.016],[.004,.016],[.004,.036],[-.004,.033],[-.004,.016],[-.009,.016],[-.009,-.016],[-.004,-.016],[-.004,-.036],[.004,-.033],[.004,-.016]];
 for(let i=0;i<bowtie.length;i++){const a=bowtie[i],b=bowtie[(i+1)%bowtie.length];tube(metal,F(.269+a[0],a[1],.006),F(.269+b[0],b[1],.006),.0008,8);}
 /* Lower nose flows into a thin swept splitter with rounded plan corners. */
 patch(body,(u,v)=>{const z=(2*v-1)*(.360+.010*(1-u)),y=.053+u*.039;return F(y,z,.002*Math.sin(u*Math.PI));},12,100,[1,.2,0]);
 patch(carbon,(u,v)=>{const half=.343+.046*Math.sin(u*Math.PI/2),z=(2*v-1)*half,x=mix(.901,1.083-.078*Math.pow(Math.abs(z)/.389,3),u);return[x,.045+.0025*Math.sin(u*Math.PI),z];},24,80,[0,1,0]);
 patch(carbon,(u,v)=>{const z=(2*v-1)*.389;return[1.083-.078*Math.pow(Math.abs(z)/.389,3),.045-u*.005,z];},1,80,[1,0,0]);
 /* Rear bumper is a rounded horizontal shell with inset wraparound lamps,
 a broad central registration recess and a visibly separate diffuser. */
 const R=(y,z,d=0)=>[rearX(y,z)-d,y,z];
 G.raceCarRearPoint=(y,z,offset=0)=>R(y,z,offset);
 for(let i=0;i<bowtie.length;i++){const a=bowtie[i],b=bowtie[(i+1)%bowtie.length];tube(metal,R(.267+a[0],a[1],.004),R(.267+b[0],b[1],.004),.0008,8);}
 patch(body,(u,v)=>{const z=(2*v-1)*.324,y=mix(.336,belt(-1.025)+.008+.006*(1-Math.pow(z/(width(-1.025)-.045),2)),u);return R(y,z);},6,64,[-1,.5,0]);
 patch(body,(u,v)=>{const y=mix(.126,.336,u),z=rearHalf(y)*Math.sin((v-.5)*Math.PI);return R(y,z);},34,100,[-1,0,0]);
 patch(body,(u,v)=>{const y=mix(.066,.126,u),z=rearHalf(y)*Math.sin((v-.5)*Math.PI);return R(y,z);},18,100,[-1,-.2,0]);
 patch(black,(u,v)=>{const z=(2*v-1)*.350,y=mix(.225,.301,u);return R(y,z,.001);},12,90,[-1,0,0]);
 for(const side of [-1,1])for(const mid of [.139,.279]){
 const loop=curveLoop([[.285,side*(mid-.056)],[.285,side*(mid+.052)],[.273,side*(mid+.061)],[.242,side*(mid+.047)],[.239,side*(mid-.050)],[.249,side*(mid-.058)]],6);
 poly(black,loop.map(q=>R(...q,.003)),[-1,0,0]);
 const lens=loop.map(q=>[.262+(q[0]-.262)*.83,side*mid+(q[1]-side*mid)*.87]);
 poly(red,lens.map(q=>R(...q,.004)),[-1,0,0]);
 for(let k=0;k<loop.length;k++)tube(red,R(...loop[k],.004),R(...loop[(k+1)%loop.length],.004),.0013,8);
 for(const y of [.255,.269])patch(black,(u,v)=>R(y+.0012*u,side*(mid+mix(-.040,.040,v)),.005),1,12,[-1,0,0]);
 }
 patch(black,(u,v)=>{const z=(2*v-1)*.155,y=mix(.158,.209,u);return R(y,z,.001);},8,36,[-1,0,0]);
 const diffuserRear=z=>-1.045+.075*Math.pow(Math.abs(z)/.333,4);
 patch(carbon,(u,v)=>{const z=(2*v-1)*mix(.333,.316,u),x=mix(diffuserRear(z),-.857,u),y=mix(.085,.033,u);return[x,y,z];},26,64,[-.2,-1,0]);
 for(let k=0;k<7;k++){const z=(k-3)*.101,x=diffuserRear(z);extrude(carbon,[[x,.097,z],[-.86,.05,z],[-.88,.024,z],[x-.002,.042,z]],[0,0,.003], [0,0,-1]);}
 for(const side of [-1,1]){
 extrude(carbon,[[-1.000,.347,side*.218],[-.914,.347,side*.218],[-.937,.482,side*.227],[-.971,.482,side*.227]],[0,0,-side*.006],[0,0,side]);
 /* Rear spoiler is a thin aerofoil; end plates taper at their corners. */
 const end=[[-1.086,.522,side*.431],[-1.076,.531,side*.431],[-.879,.523,side*.431],[-.869,.515,side*.431],[-.861,.486,side*.431],[-.870,.478,side*.431],[-1.069,.475,side*.431],[-1.078,.483,side*.431]];extrude(wingEnds,end,[0,0,side*.004],[0,0,side]);
 }
 patch(carbon,(u,v)=>{const x=mix(-1.083,-.865,u),z=mix(-.431,.431,v);return[x,.492+.012*Math.sin(u*Math.PI)+.005*u,z];},26,50,[0,1,0]);
 patch(carbon,(u,v)=>{const x=mix(-1.083,-.865,u),z=mix(-.431,.431,v);return[x,.492+.003*Math.sin(u*Math.PI)+.005*u,z];},26,50,[0,-1,0]);
 // Close the aerofoil edges and add a narrow Gurney lip. It catches a continuous
 // highlight in the rear view instead of reading as two disconnected sheets.
 for(const side of [-1,1])patch(carbon,(u,v)=>{const x=mix(-1.083,-.865,u);return[x,.492+mix(.003,.012,v)*Math.sin(u*Math.PI)+.005*u,side*.431];},26,1,[0,0,side]);
 patch(carbon,(u,v)=>[-1.083,.492+u*.009,mix(-.423,.423,v)],1,50,[-1,0,0]);
 /* Detailed slicks and separate rotating wheel assemblies. Their pivots are
 explicit, allowing the renderer to rotate wheels without moving calipers. */
 for(const axle of [.58,-.53])for(const side of [-1,1]){
 const z=side*.360,id=(axle>0?'front':'rear')+(side>0?'-right':'-left'),wheel={x:axle,y:.145,z,side};
 const tyre=group(id+'-slick','rubber',wheel),rim=group(id+'-wheel','alloy',wheel),spokes=group(id+'-spokes','alloy',wheel),disc=group(id+'-brake-disc','alloy',wheel),rimdark=group(id+'-wheel-recess','carbon',wheel);
 const profile=[[.101,-.047],[.119,-.048],[.133,-.044],[.141,-.035],[.145,-.021],[.145,.021],[.141,.035],[.133,.044],[.119,.048],[.101,.047]];
 const section=v=>{const f=v*(profile.length-1),k=Math.min(profile.length-2,Math.floor(f)),t=f-k,
  a=profile[Math.max(0,k-1)],b=profile[k],c=profile[k+1],d=profile[Math.min(profile.length-1,k+2)],
  at=j=>.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t*t+(-a[j]+3*b[j]-3*c[j]+d[j])*t*t*t);
  return[Math.min(.145,at(0)),clamp(at(1),-.048,.048)];};
 patch(tyre,(u,v)=>{const [r,dz]=section(v),a=u*TAU;return[axle+Math.cos(a)*r,.145+Math.sin(a)*r,z+dz];},144,24,q=>{const dz=q[2]-z;return[(q[0]-axle),q[1]-.145,Math.abs(dz)>.025?dz*3:0];});
 const outer=z+side*.046;
 ring(rim,axle,.145,outer,.099,.106,side,112);
 ring(rimdark,axle,.145,outer-side*.008,.092,.100,side,112);
 ring(rimdark,axle,.145,outer-side*.062,.018,.100,side,96);
 ring(disc,axle,.145,outer-side*.013,.031,.087,side,96);
 ring(rim,axle,.145,outer+.001*side,.014,.024,side,48);
 for(const rad of [.101,.105])patch(rim,(u,v)=>{const a=u*TAU;return[axle+Math.cos(a)*rad,.145+Math.sin(a)*rad,outer-side*(.004+v*.076)];},96,1,q=>[q[0]-axle,q[1]-.145,0]);
 // Rounded forged rim lip, a recessed barrel and a real disc edge separate the
 // tyre, wheel and brake silhouettes without another draw or material.
 patch(rim,(u,v)=>{const a=u*TAU,b=v*TAU,r=.1025+.003*Math.cos(b);return[axle+Math.cos(a)*r,.145+Math.sin(a)*r,outer+side*.0028*Math.sin(b)];},112,8,q=>{const d=Math.hypot(q[0]-axle,q[1]-.145),r=d-.1025;return[(q[0]-axle)*r/d,(q[1]-.145)*r/d,(q[2]-outer)];});
 patch(disc,(u,v)=>{const a=u*TAU;return[axle+Math.cos(a)*.087,.145+Math.sin(a)*.087,outer-side*(.013+v*.006)];},96,1,q=>[q[0]-axle,q[1]-.145,0]);
 for(let k=0;k<10;k++){
 const angle=k*TAU/10;
 const point=(r,t,d)=>[axle+Math.cos(t)*r,.145+Math.sin(t)*r,outer+side*d];
 // A closed swept spoke is lofted through the dish, not triangulated as a
 // non-planar polygon fan. Broad shoulders catch the metal highlight in motion.
 const spoke=(u,v,back=0)=>{const half=mix(.125,.043,u),t=angle+(2*v-1)*half+.012*Math.sin(u*Math.PI),d=.005*(1-u)-.010*Math.sin(u*Math.PI)+.0015*Math.sin(v*Math.PI)-back;return point(mix(.023,.101,u),t,d);};
 patch(spokes,(u,v)=>spoke(u,v),8,2,[0,0,side]);
 patch(spokes,(u,v)=>spoke(u,v,.007),8,2,[0,0,-side]);
 for(const edge of [0,1])patch(spokes,(u,v)=>spoke(u,edge,v*.007),8,1,q=>{
  const a=angle+(edge?1:-1)*mix(.125,.043,(Math.hypot(q[0]-axle,q[1]-.145)-.023)/.078);return[(edge?-1:1)*Math.sin(a),(edge?1:-1)*Math.cos(a),0];});
 for(const u of [0,1])patch(spokes,(v,t)=>spoke(u,v,t*.007),2,1,[Math.cos(angle)*(u?1:-1),Math.sin(angle)*(u?1:-1),0]);
 }
 /* Disc ventilation slots and hub hardware stay crisp in a wheel close-up. */
 for(let k=0;k<32;k++){
 const a=k*TAU/32;
 tube(rimdark,[axle+Math.cos(a)*.055,.145+Math.sin(a)*.055,outer-side*.0125],[axle+Math.cos(a+.1)*.082,.145+Math.sin(a+.1)*.082,outer-side*.0125],.0011,5);
 }
 for(let k=0;k<6;k++){const a=k*TAU/6,c=[axle+Math.cos(a)*.016,.145+Math.sin(a)*.016],points=[];
  for(let j=0;j<6;j++){const t=j*TAU/6;points.push([c[0]+Math.cos(t)*.0027,c[1]+Math.sin(t)*.0027,outer+side*.003]);}
  extrude(rim,points,[0,0,side*.002],[0,0,side]);
 }
 ellipse(rimdark,[axle,.145,outer+side*.005],[.010,.010,.004],20);
 box(metal,axle+.060,axle+.079,.128,.193,Math.min(outer-side*.02,outer-side*.006),Math.max(outer-side*.02,outer-side*.006));
 /* Sidewall moulding rings have geometry, without fictitious tyre branding. */
 ring(tyre,axle,.145,outer+side*.001,.124,.125,side,112);
 }
 /* A scaled cage and seat remain inside the cabin, below the roof shell. */
 box(cockpit,-.62,.21,.15,.184,-.28,.28);
 for(const side of [-1,1]){
 tube(metal,[-.44,.192,side*.26],[-.38,.478,side*.239],.0045,10);
 tube(metal,[-.38,.478,side*.239],[-.09,.478,side*.239],.0045,10);
 tube(metal,[-.09,.478,side*.239],[.19,.322,side*.280],.0045,10);
 tube(metal,[-.43,.23,side*.274],[.14,.321,side*.281],.004,10);
 tube(metal,[-.43,.322,side*.274],[.14,.214,side*.281],.004,10);
 }
 tube(metal,[-.41,.443,-.24],[-.41,.22,.24],.0045,10);
 tube(metal,[-.41,.443,.24],[-.41,.22,-.24],.0045,10);
 box(cockpit,-.39,-.15,.19,.23,-.05,.205);
 extrude(cockpit,[[-.41,.215,.012],[-.37,.391,.035],[-.29,.397,.046],[-.30,.226,.190]],[0,0,.027],[0,0,1]);
 ellipse(cockpit,[-.20,.399,.127],[.045,.052,.042],32,16);
 const wheelCenter=[.078,.329,.133];
 patch(carbon,(u,v)=>{const a=u*TAU,b=v*TAU,r=.038+.0025*Math.cos(b);return[wheelCenter[0]+.0025*Math.sin(b),wheelCenter[1]+Math.cos(a)*r,wheelCenter[2]+Math.sin(a)*r];},64,8,[1,0,0]);
 tube(carbon,[-.27,.518,0],[-.295,.583,0],.0012,8);
 /* Validate once, rather than hiding malformed geometry in the draw loop. */
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let triangles=0,vertices=0;
 for(const p of parts){
 for(let i=0;i<p.vertices.length;i+=8){for(let k=0;k<8;k++)if(!Number.isFinite(p.vertices[i+k]))throw Error('Non-finite solid car vertex: '+p.name);for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],p.vertices[i+k]);bounds.max[k]=Math.max(bounds.max[k],p.vertices[i+k]);}}
 const count=p.vertices.length/8;for(const i of p.indices)if(i<0||i>=count||!Number.isInteger(i))throw Error('Bad solid car index: '+p.name);
 triangles+=p.indices.length/3;vertices+=count;
 // The static model is reused on remount. Keep one compact CPU copy, not
 // boxed Number arrays plus a second full copy in each MeshBatch.
 p.vertices=new Float32Array(p.vertices);p.indices=new Uint32Array(p.indices);
 }
 const model={parts,bounds,stats:{triangles,vertices,parts:parts.length,quality:level,kind:'original parametric race coupe',
  visual800:{version:'v8.00',coherentSurfaceWinding:true,derivativeSurfaceNormals:true,
   projectorAssemblies:4,segmentedRearLenses:4,loftedForgedSpokes:40,roundedWheelCarcasses:4,
   closedWingSection:true,originalEnvelope:true,originalWheelPivots:true,perFrameGeometryWork:0}}};
 cache[level]=model;
 if(level==='high')G._raceCarModel=model; // retained for older diagnostics
 return model;
};
})();
