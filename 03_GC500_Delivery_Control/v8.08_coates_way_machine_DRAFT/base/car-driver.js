/* THE DRIVER. A seated figure built from lofted sections and capsules — proportioned from a 1.78 m man in a
   race seat — in the Coates suit, gloves, boots, a HANS and a helmet with the 26 on it. Andrew's original cabin
   carries the driver's head as a sphere at (.46, .92, −.295); that sphere stays exactly where it is and is
   inside this helmet. Nothing here is a character model from anywhere: every surface is generated, so the
   package carries no downloaded asset. Authored in world metres; the wheel's centre is passed in.

   v5.79d — HIS HANDS ARE ON THE WHEEL AND THEY MOVE IT. Andrew Fisher, 24 Sep 2026, with his concept cockpit
   (the concept driver, hands on the wheel and moving it, was his idea) and the suit
   study: the arms are jointed — shoulder, elbow, wrist — and every frame the gloves are put on the rim where
   the rim now is, the elbows solved from the two arm lengths, so turning the wheel turns the hands with it,
   and a gear change takes the left hand to the knob and back. In the driver's seat the driver is you: the
   helmet is taken off the camera's head and your own arms and legs stay in view. With the wheel taken apart
   the hands rest on the thighs, because there is nothing on the column to hold.

   The livery is the study's: black suit, orange over the shoulders and down the sides, Coates across the
   chest and the back with THE COATES WAY under it, the 26 on the chest, Coates down the forearm and the
   thigh; the helmet black carbon with the orange crown, Coates over the visor and on the chin. */

import {DRIVER_HEAD} from './engine-kinematics.js';

/* v5.81 — {metric:true} gives the loft UVs in METRES along its surface (u the distance across the stations, v the
   distance along each section), so a texture repeated N times a metre has one size all over it: the dash's twill is
   4 mm a tow wherever the moulding curves (car-cockpit.js; tests/engine.test.mjs measures it). The default stays the
   0..uvScale stretch the driver's lofts are drawn for (the suit's livery depends on it). */
export function loftGeometry(T,stations,{caps=true,uvScale=1,metric=false}={}){
 const n=stations[0].length,m=stations.length,pos=[],uv=[],idx=[];
 const d=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]),U=[],V=[];
 if(metric){for(let i=0;i<m;i++){U.push([]);V.push([]);for(let j=0;j<n;j++){U[i][j]=i?U[i-1][j]+d(stations[i][j],stations[i-1][j]):0;V[i][j]=j?V[i][j-1]+d(stations[i][j],stations[i][j-1]):0;}}}
 for(let i=0;i<m;i++)for(let j=0;j<n;j++){const p=stations[i][j];pos.push(p[0],p[1],p[2]);if(metric)uv.push(U[i][j],V[i][j]);else uv.push(i/(m-1)*uvScale,j/(n-1)*uvScale);}
 for(let i=0;i<m-1;i++)for(let j=0;j<n-1;j++){const a=i*n+j,b=a+1,c=a+n,d=c+1;idx.push(a,c,b,b,c,d);}
 if(caps){for(const [row,flip]of[[0,true],[m-1,false]]){const c=[0,0,0];for(let j=0;j<n;j++){const p=stations[row][j];c[0]+=p[0]/n;c[1]+=p[1]/n;c[2]+=p[2]/n;}
  const ci=pos.length/3;pos.push(...c);if(metric){let su=0,sv=0;for(let j=0;j<n;j++){su+=U[row][j]/n;sv+=V[row][j]/n;}uv.push(su,sv);}else uv.push(.5,.5);
  for(let j=0;j<n-1;j++){const a=row*n+j,b=a+1;if(flip)idx.push(ci,b,a);else idx.push(ci,a,b);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
/* an ellipse ring of k points in a plane: centre c, half-axes a (along u) and b (along v) */
export function ring(c,u,v,a,b,k=24,squash=0){const out=[];for(let i=0;i<=k;i++){const t=i/k*Math.PI*2,cs=Math.cos(t),sn=Math.sin(t);
 const s=1-squash*Math.max(0,-sn);   /* squash flattens the back (−v) of the ring */
 out.push([c[0]+u[0]*a*cs+v[0]*b*sn*s,c[1]+u[1]*a*cs+v[1]*b*sn*s,c[2]+u[2]*a*cs+v[2]*b*sn*s]);}return out;}

/* v5.81 — A CAPSULE LOFTED FROM A TO B, shared: the driver's limbs are built with it (in world metres, as before), and the
   crew's figure builder (crew.js buildFigure) builds its limbs with the same call in each bone's own frame. The ring's
   basis is the driver's: u = dir × (world up, or world x for a near-vertical limb), v = u × dir, so a sleeve's printed
   wordmark falls where it always did. Defaults give the driver's geometry exactly (11 stations, 18 sides). */
export function capsuleGeometry(T,a,b,r0,r1,{stations:n=10,sides=18}={}){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A);
 const st=[];const dir=d.clone().normalize();const anyv=Math.abs(dir.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0);
 const u=new T.Vector3().crossVectors(dir,anyv).normalize(),v=new T.Vector3().crossVectors(u,dir).normalize();
 for(let i=0;i<=n;i++){const t=i/n,r=r0+(r1-r0)*t,c=A.clone().addScaledVector(d,t);st.push(ring(c.toArray(),u.toArray(),v.toArray(),r,r,sides));}
 return loftGeometry(T,st);}

export const ORANGE='#ff6a13',BLACK='#121417',WHITE='#f4f5f3',FONT='system-ui, Segoe UI, Arial, sans-serif';
function canvas(w,h){if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function texture(T,c){const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
/* a carbon-fibre weave: a fine twill drawn as alternating light and dark cells */
export function weave(g,w,h,base,lift){g.fillStyle=base;g.fillRect(0,0,w,h);g.fillStyle=lift;for(let y=0;y<h;y+=6)for(let x=0;x<w;x+=6)if(((x/6|0)+(y/6|0))%2===0)g.fillRect(x,y,3,3);}
/* text laid ACROSS the body: the loft's u runs up the spine (canvas x) and its v runs round the body (canvas
   y), so a word that reads across the chest is drawn down the canvas, turned a quarter, its top toward the
   shoulders. dir +1 reads the way somebody facing the driver reads it; −1 the way somebody behind him does. */
function across(g,text,x,y,size,color,dir=1,weight=800,spacing=0){g.save();g.translate(x,y);g.rotate(dir*Math.PI/2);g.fillStyle=color;g.font=`${weight} ${size}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';if(spacing&&'letterSpacing'in g)g.letterSpacing=spacing+'px';g.fillText(text,0,0);g.restore();}

/* v5.81 — the three livery canvases are exported for the crew (crew.js), who wear the team's suit in charcoal: `base` is
   the suit's colour (the driver's black by default, so his canvases are drawn exactly as before), `seams` adds the stitched
   panel lines and the front zip a crew suit is seen close enough to show. */
export function suitTexture(T,{base=BLACK,seams=false,chest=1,backDir=-1,back=1}={}){
 const c=canvas(1024,1024);if(!c)return null;const g=c.getContext('2d'),W=1024,H=1024;
 g.fillStyle=base;g.fillRect(0,0,W,H);
 if(seams){/* the zip down the front (v .25 → canvas y .75H) and the panel stitching across the waist and round the yoke */
  g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,H*.75-3,W*.9,6);g.fillStyle='rgba(255,255,255,.10)';g.fillRect(0,H*.75-1,W*.9,2);
  g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=2;g.setLineDash&&g.setLineDash([7,6]);for(const x of [W*.30,W*.62])for(const y0 of [0])(g.beginPath(),g.moveTo(x,y0),g.lineTo(x,H),g.stroke());g.setLineDash&&g.setLineDash([]);}
 /* the two side panels, orange, tapering from the shoulders (x=W) to the hips (x=0): the body's sides sit at
    v=0 (canvas bottom) and v=.5 (canvas middle) */
 for(const cy of [0,H/2,H]){g.fillStyle=ORANGE;g.beginPath();g.moveTo(W*.18,cy-H*.035);g.lineTo(W,cy-H*.075);g.lineTo(W,cy+H*.075);g.lineTo(W*.18,cy+H*.035);g.closePath();g.fill();
  g.strokeStyle=WHITE;g.lineWidth=3;g.beginPath();g.moveTo(W*.18,cy-H*.035);g.lineTo(W,cy-H*.075);g.moveTo(W*.18,cy+H*.035);g.lineTo(W,cy+H*.075);g.stroke();}
 /* the orange yoke over the shoulders, all the way round */
 g.fillStyle=ORANGE;g.fillRect(W*.93,0,W*.07,H);g.fillStyle=WHITE;g.fillRect(W*.925,0,4,H);
 /* the chest (front centre is v=.25 → canvas y=.75H): Coates, THE COATES WAY under it, the 26 high on the left */
 /* (chest scales the front's words: the crew wear a smaller wordmark over the heart than the driver's, which wraps round a
    standing figure's chest to its sides) */
 across(g,'Coates',W*.70,H*.75,150*chest,ORANGE,1,800,-4);
 across(g,'THE COATES WAY',W*.60,H*.75,34*chest,WHITE,1,700,4);
 across(g,'26',W*.84,H*.86,64*chest,WHITE,1,800);
 across(g,'GC500 · 2026',W*.50,H*.75,22*chest,'#9aa0a6',1,600,3);
 /* the back (v=.75 → canvas y=.25H): Coates, read from behind */
 /* v5.81: on this ring the back reads the right way round with backDir +1 — the crew's suits use it; the driver's back is
    against his seat shell and is left as it was */
 /* (back scales it as chest does the front: at the driver's 150 px the word runs over half the way round a crewman's narrower
    torso, and from behind he read 'oate') */
 across(g,'Coates',W*.72,H*.25,150*back,ORANGE,backDir,800,-4);
 across(g,'26',W*.58,H*.25,80*back,WHITE,backDir,800);
 return texture(T,c);
}
/* a sleeve or a trouser leg: black, orange along its length, Coates on it twice so one reads whichever way the
   loft's seam falls */
/* v5.81 — Andrew Fisher, 23 Sep 2026: the driver and the dashboard looked poor. In the seat the forearms are the
   nearest thing to the lens, and v5.80 printed COATES down each of them in letters a third of the sleeve high, so the
   lower frame was two words. A suit's sleeve carries an orange band and a small wordmark: the canvas's x runs down
   the limb (elbow → wrist, knee → ankle) and its y round it, y .25 on top where the driver sees it. The band sits a
   hand's width before the cuff; the word is 22 mm tall on a 0.25 m round forearm, once on top and once beneath. */
export function limbTexture(T,text,band,{size=22,x=210,cuff=null,base=BLACK}={}){
 const c=canvas(1024,256);if(!c)return null;const g=c.getContext('2d');
 g.fillStyle=base;g.fillRect(0,0,1024,256);
 if(band){g.fillStyle=ORANGE;g.fillRect(0,0,1024,band);g.fillRect(0,256-band,1024,band);}
 if(cuff){g.fillStyle=ORANGE;g.fillRect(cuff[0]*1024,0,(cuff[1]-cuff[0])*1024,256);g.fillStyle=WHITE;g.fillRect(cuff[0]*1024-6,0,3,256);g.fillRect(cuff[1]*1024+3,0,3,256);}
 g.fillStyle=ORANGE;g.font=`800 ${size}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';
 for(const y of [64,192]){g.fillText(text,x,y);}
 return texture(T,c);
}
/* v5.81 — `crown` is the helmet's crown colour (the driver's and the crew's orange by default; the crew lead's is white) and
   `word` the colour of the Coates over the visor */
export function helmetTexture(T,{crown=ORANGE,word=ORANGE,seam=false}={}){
 const c=canvas(1024,512);if(!c)return null;const g=c.getContext('2d');
 weave(g,1024,512,'#15181c','#22262b');
 /* the crown, orange, with the black stripe through it; the sphere's top is the top of the canvas */
 g.fillStyle=crown;g.fillRect(0,0,1024,150);g.fillStyle=BLACK;g.fillRect(0,150,1024,10);
 g.fillStyle=BLACK;g.fillRect(430,0,40,150);g.fillRect(554,0,40,150);
 /* over the visor, front-centre (u=.75): Coates; on the chin (low, u=.75): Coates; the 26 on each side */
 g.fillStyle=word;g.font=`800 92px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('Coates',768,215);if(word!==ORANGE)g.fillStyle=ORANGE;
 g.font=`800 60px ${FONT}`;g.fillText('Coates',768,455);
 g.fillStyle=WHITE;g.font=`800 110px ${FONT}`;g.fillText('26',512,300);/* v5.81 seam: the other side's 26 split exactly at the sphere's seam (0 and 1024), so its halves meet */if(seam){g.fillText('26',0,300);g.fillText('26',1024,300);}else{g.fillText('26',24,300);g.fillText('26',1000,300);}
 g.fillStyle=ORANGE;g.font=`700 34px ${FONT}`;g.fillText('THE COATES WAY',256,420);
 return texture(T,c);
}

export function buildDriver(T,addTo,wheel,materials){
 const {carbonMatte}=materials;
 /* everything the driver is goes in one group, so the cockpit view can take him out of the seat you are in */
 const driver=new T.Group();driver.name='Driver';addTo(driver,'Driver');
 const add=(m,name,parent)=>{m.name=name;m.castShadow=m.receiveShadow=true;(parent||driver).add(m);return m;};
 const suitTex=suitTexture(T);
 const suit=new T.MeshStandardMaterial({color:suitTex?0xffffff:0x121417,map:suitTex||null,roughness:.88,metalness:0});
 const suitPlain=new T.MeshStandardMaterial({color:0x121417,roughness:.88,metalness:0});
 const suitOrange=new T.MeshStandardMaterial({color:0xff6a13,roughness:.88,metalness:0});
 const sleeveTex=limbTexture(T,'Coates',0,{size:24,x:330,cuff:[.72,.80]}),legTex=limbTexture(T,'Coates',20,{size:30,x:520});
 const sleeve=new T.MeshStandardMaterial({color:sleeveTex?0xffffff:0x121417,map:sleeveTex||null,roughness:.88,metalness:0});
 const trouser=new T.MeshStandardMaterial({color:legTex?0xffffff:0x121417,map:legTex||null,roughness:.88,metalness:0});
 const dark=new T.MeshStandardMaterial({color:0x101214,roughness:.85,metalness:0});
 const glove=new T.MeshStandardMaterial({color:0x0c0d0f,roughness:.7,metalness:.05});
 const visor=new T.MeshPhysicalMaterial({color:0x07090c,roughness:.06,metalness:.25,clearcoat:1,clearcoatRoughness:.04});
 const hTex=helmetTexture(T);
 const helmetMat=new T.MeshPhysicalMaterial({color:hTex?0xffffff:0x15181c,map:hTex||null,roughness:.22,metalness:.05,clearcoat:1,clearcoatRoughness:.08});
 /* a capsule lofted from A to B in world metres — as a mesh straight into the driver, or, with `into`, into a
    group standing at A so the limb can be re-posed by moving the group */
 const capsuleGeom=(a,b,r0,r1)=>capsuleGeometry(T,a,b,r0,r1);   /* v5.81: the shared loft (above), same stations and sides as before */
 const capsule=(a,b,r0,r1,mat,name)=>{const m=new T.Mesh(capsuleGeom(a,b,r0,r1),mat);m.material.side=T.DoubleSide;return add(m,name);};
 const sphere=(p,r,mat,name,parent)=>{const m=new T.Mesh(new T.SphereGeometry(r,24,16),mat);m.position.set(...p);return add(m,name,parent);};
 /* a jointed limb segment: a group at A, the capsule inside it running from the origin to B−A */
 const segment=(a,b,r0,r1,mat,name)=>{const g=new T.Group();g.name=name;g.position.set(...a);driver.add(g);
  const local=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];const m=new T.Mesh(capsuleGeom([0,0,0],local,r0,r1),mat);m.material.side=T.DoubleSide;add(m,name,g);
  return {group:g,dir0:new T.Vector3(...local).normalize(),len:Math.hypot(...local)};};

 const HEAD=[.46,.92,-.295],zd=HEAD[2];
 /* ---- the torso: lofted from the hips to the shoulders, reclined in the seat ---- */
 {const st=[];const spine=[[.62,.55],[.60,.62],[.57,.70],[.55,.78],[.53,.84],[.52,.89]];   /* (x, y) up the back, reclining */
  const wid=[.36,.34,.36,.40,.44,.40],dep=[.24,.22,.23,.25,.24,.20];
  spine.forEach((p,i)=>{const c=[p[0],p[1],zd];st.push(ring(c,[0,0,1],[-1,0,0],wid[i]/2,dep[i]/2,28,.25));});
  const torso=new T.Mesh(loftGeometry(T,st,{uvScale:1}),suit);torso.material.side=T.DoubleSide;add(torso,'Driver, torso');}
 const headParts=[];
 /* the shoulders, the neck and the collar */
 [-1,1].forEach(q=>sphere([.53,.865,zd+q*.19],.062,suitOrange,'Driver, shoulder'));
 headParts.push(capsule([.50,.90,zd],[.47,.86,zd],.055,.06,dark,'Driver, neck'));
 /* the HANS: a collar behind the neck, sitting on the shoulders, with its tethers to the helmet */
 {const hans=new T.Mesh(new T.TorusGeometry(.13,.028,10,24,Math.PI),carbonMatte);hans.position.set(.56,.90,zd);hans.rotation.set(Math.PI/2,0,Math.PI/2);headParts.push(add(hans,'HANS device'));
  [-1,1].forEach(q=>headParts.push(capsule([.52,.95,zd+q*.10],[.49,.99,zd+q*.06],.006,.006,dark,'HANS tether')));}

 /* ---- the arms: jointed, to the wheel at a quarter to three, re-posed every frame (setWheel) ---- */
 const arms=[];const W=new T.Vector3(wheel.x,wheel.y,wheel.z);
 [-1,1].forEach(q=>{const sh=[.53,.865,zd+q*.19],el=[.26,.74,zd+q*.26],wr=[wheel.x+.045,wheel.y+.005,wheel.z+q*.172];   /* upper arm 30 cm, forearm 33 to the grip: a man's, nearly straight to a wheel this far away */
  /* v5.79c: the arms at a man's size — 8 cm at the upper arm, 6 at the wrist (Andrew Fisher: the driver looked poor) */
  /* v5.81: and shaped like arms — the forearm tapers from 45 mm at the elbow to 35 at the wrist, the upper arm is the
     fuller limb above it, the elbow a joint as wide as both; the grip is 7 mm further out because the rim is (parts.js
     WHEEL: the cog sits inside it now, and the grips at nine and three are moulded fuller) */
  const upper=segment(sh,el,.052,.046,suitOrange,'Driver, upper arm');
  const elbow=sphere(el,.047,suitPlain,'Driver, elbow');
  const fore=segment(el,wr,.045,.035,sleeve,'Driver, forearm');
  /* the glove, built round the rim at rest and gathered into a group standing at the wrist so it turns with the rim */
  const hand=new T.Group();hand.name='Driver, hand';hand.position.set(...wr);driver.add(hand);
  const at=(m,x,y,z)=>{m.position.set(x-wr[0],y-wr[1],z-wr[2]);return m;};
  const palm=at(new T.Mesh(new T.CapsuleGeometry(.03,.06,6,12),glove),wheel.x+.015,wheel.y,wheel.z+q*.170);palm.rotation.x=Math.PI/2;add(palm,'Driver, glove',hand);
  for(let f=0;f<4;f++){const fg=at(new T.Mesh(new T.CapsuleGeometry(.0095,.045,4,8),glove),wheel.x-.014,wheel.y+.028-f*.019,wheel.z+q*.188);fg.rotation.z=Math.PI/2;fg.rotation.y=q*.3;add(fg,'Driver, finger',hand);}
  const th=at(new T.Mesh(new T.CapsuleGeometry(.010,.04,4,8),glove),wheel.x+.02,wheel.y+.035,wheel.z+q*.152);th.rotation.x=Math.PI/2;add(th,'Driver, thumb',hand);
  const cuff=at(new T.Mesh(new T.CylinderGeometry(.04,.04,.03,20),suitOrange),wheel.x+.075,wheel.y+.003,wheel.z+q*.172);cuff.rotation.z=Math.PI/2;add(cuff,'Driver, glove cuff',hand);
  arms.push({q,sh:new T.Vector3(...sh),upper,elbow,fore,hand,grip0:new T.Vector3(...wr).sub(W),
   rest:new T.Vector3(.33,.665,zd+q*.17),pole:new T.Vector3(sh[0]-.10,sh[1]-.40,sh[2]+q*.28)});
  /* the legs: hip to knee to the pedal, the boot on the pedal */
  const hip=[.60,.57,zd+q*.11],kn=[.12,.63,zd+q*.13],an=[-.34,.50,zd+q*.11];
  capsule(hip,kn,.085,.07,trouser,'Driver, thigh');sphere(kn,.07,suitPlain,'Driver, knee');
  capsule(kn,an,.062,.05,suitPlain,'Driver, shin');
  const boot=new T.Mesh(new T.CapsuleGeometry(.045,.10,6,12),glove);boot.position.set(-.39,.49,zd+q*.11);boot.rotation.z=Math.PI/2+.5;add(boot,'Driver, boot');
  const bootBand=new T.Mesh(new T.CylinderGeometry(.047,.047,.02,16),suitOrange);bootBand.position.set(-.35,.515,zd+q*.11);bootBand.rotation.z=Math.PI/2+.5;add(bootBand,'Driver, boot cuff');});
 /* ---- the helmet, over the original head sphere, and its visor ---- */
/* v6.92 — the helmet is on a head that turns on the neck (DRIVER_HEAD.neck), placed so the eyes inside it (DRIVER_HEAD.eye, the
    `eye` below) are the cockpit camera's eye point; car-app.js puts the camera there every frame and turns it with the head */
 const head=new T.Group();head.name='Driver, head';head.position.set(DRIVER_HEAD.neck.x,DRIVER_HEAD.neck.y,DRIVER_HEAD.neck.z);driver.add(head);
 const H=[DRIVER_HEAD.x-DRIVER_HEAD.neck.x,DRIVER_HEAD.y-DRIVER_HEAD.neck.y,DRIVER_HEAD.z-DRIVER_HEAD.neck.z];
 const eye=new T.Object3D();eye.name='Driver, eyes';eye.position.set(H[0]+DRIVER_HEAD.eye.x,H[1]+DRIVER_HEAD.eye.y,H[2]+DRIVER_HEAD.eye.z);head.add(eye);
 {const helmet=new T.Mesh(new T.SphereGeometry(.122,48,32),helmetMat);helmet.position.set(...H);helmet.rotation.y=Math.PI/2;helmet.scale.set(1,1.06,1);headParts.push(add(helmet,'Helmet',head));
  const v=new T.Mesh(new T.SphereGeometry(.126,48,24,Math.PI*1.70,Math.PI*.60,Math.PI*.34,Math.PI*.24),visor);v.position.set(...H);headParts.push(add(v,'Visor',head));
  const rim=new T.Mesh(new T.TorusGeometry(.117,.006,8,48,Math.PI*.6),dark);rim.position.set(H[0],H[1]+.005,H[2]);rim.rotation.set(0,Math.PI*1.2,0);headParts.push(add(rim,'Visor rim',head));
  const vent=new T.Mesh(new T.BoxGeometry(.05,.012,.09),dark);vent.position.set(H[0]-.06,H[1]+.115,H[2]);headParts.push(add(vent,'Helmet vent',head));
  const chin=new T.Mesh(new T.BoxGeometry(.08,.05,.14),dark);chin.position.set(H[0]-.09,H[1]-.06,H[2]);headParts.push(add(chin,'Helmet chin bar',head));}

 /* ---- posing ---- */
 const X=new T.Vector3(1,0,0),tmpA=new T.Vector3(),tmpB=new T.Vector3(),tmpC=new T.Vector3(),tmpN=new T.Vector3(),tgt=new T.Vector3(),knobP=new T.Vector3(),qTmp=new T.Quaternion();
 const poseSegment=(seg,a,b)=>{seg.group.position.copy(a);tmpA.copy(b).sub(a).normalize();seg.group.quaternion.setFromUnitVectors(seg.dir0,tmpA);};
 /* the elbow from the two arm lengths: on the circle both can reach, leaning toward the pole point */
 const solveElbow=(sh,wr,L1,L2,pole,out)=>{const d=Math.max(Math.abs(L1-L2)+1e-3,Math.min(L1+L2-1e-3,sh.distanceTo(wr)));
  tmpB.copy(wr).sub(sh).normalize();const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));
  tmpN.copy(pole).sub(sh);tmpN.addScaledVector(tmpB,-tmpN.dot(tmpB));if(tmpN.lengthSq()<1e-9)tmpN.set(0,-1,0);tmpN.normalize();
  out.copy(sh).addScaledVector(tmpB,a).addScaledVector(tmpN,h);return d;};
 let restK=0,shiftK=0;
 /* angle: the rim's own rotation about the column (what the cockpit's wheel group is given); apart: the wheel is
    off the column, so the hands rest; shift: 0..1, the left hand on the knob; dx: how far the rim has moved
    along the column; dt: for the blends */
 function setWheel(angle,{apart=false,shift=0,dx=0,dt=1/60,knob=null}={}){
  restK+=((apart?1:0)-restK)*Math.min(1,dt*3.5);shiftK+=(shift-shiftK)*Math.min(1,dt*9);
  for(const arm of arms){
   /* where the glove has to be: the grip point turned with the rim and moved with it, or the thigh, or the knob */
   tmpC.copy(arm.grip0).applyAxisAngle(X,angle).add(W);tmpC.x+=dx;
   const target=tgt.copy(tmpC).lerp(arm.rest,restK);
   const onKnob=arm.q>0&&knob&&restK<.5?shiftK:0;if(onKnob>0)target.lerp(knobP.set(knob.x-.02,knob.y+.03,knob.z),onKnob);
   /* reach: if the rim has gone where the arm cannot follow, the hand slides toward the shoulder along the line */
   const reach=arm.upper.len+arm.fore.len-.004;if(arm.sh.distanceTo(target)>reach)target.sub(arm.sh).setLength(reach).add(arm.sh);
   const el=arm.elbow.position;solveElbow(arm.sh,target,arm.upper.len,arm.fore.len,arm.pole,el);
   poseSegment(arm.upper,arm.sh,el);poseSegment(arm.fore,el,target);
   arm.hand.position.copy(target);
   /* the glove turns with the rim; at rest it lies flat on the thigh, fingers forward; on the knob it cups it */
   qTmp.setFromAxisAngle(X,angle*(1-restK)*(1-onKnob));arm.hand.quaternion.copy(qTmp);
   if(restK>1e-3){qTmp.setFromAxisAngle(new T.Vector3(0,0,1),-arm.q*1.2*restK);arm.hand.quaternion.multiply(qTmp);}
   if(onKnob>1e-3){qTmp.setFromAxisAngle(new T.Vector3(0,0,1),-1.3*onKnob);arm.hand.quaternion.multiply(qTmp);}
  }
 }
 /* in the driver's seat the driver is you: the helmet, the neck and the HANS come off the camera's head */
 function setFirstPerson(on){for(const m of headParts)m.visible=!on;}
 /* v6.92 — THE HEAD MOVES WITH THE CAR AND THE WHEEL. steer is the wheel's share of full lock (−1 … 1, + clockwise): the driver looks
    a little into the turn and leans his head with it; shake is the V8's rumble on its mounts (metres, car-app.js), which the head
    rides a touch more loosely than the shell it is strapped into; t is the clock. The camera is at `eye`, so the view does all of it. */
 function setHead({steer=0,shake=0,t=0}={}){const s=Math.max(-1,Math.min(1,steer));
  head.rotation.set(-s*.07+shake*2.2*Math.sin(t*37.1),-s*.14,shake*1.6*Math.sin(t*29.3+1.1),'YXZ');
  head.position.set(DRIVER_HEAD.neck.x,DRIVER_HEAD.neck.y+shake*1.5*Math.sin(t*43.7),DRIVER_HEAD.neck.z);}
 setWheel(0);
 driver.userData.setWheel=setWheel;driver.userData.setFirstPerson=setFirstPerson;driver.userData.arms=arms;driver.userData.head=head;driver.userData.eye=eye;driver.userData.setHead=setHead;
 return driver;
}
