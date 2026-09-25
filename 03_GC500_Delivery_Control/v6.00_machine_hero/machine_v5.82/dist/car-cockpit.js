/* THE INSIDE OF THE CAR — v3. Andrew Fisher, 23 Sep 2026, on the first still from the seat: that is not what a steering wheel looks
   like, and the inside of the car needs its dashboards built. Then, with his concept picture: a physical 3D interior
   (carbon dash, roll cage, window net, wiring, proper depth); the cog steering wheel fitted naturally inside the
   suede rim, with usable buttons; clear race instruments above the wheel (gear, revs, shift lights, temperatures);
   a sequential gearstick beside the driver, as Gen3 shifts; and interactive controls — the wheel steers, the switches
   operate systems, a cog section shows its meaning — with the cockpit in the garage pit.

   So this is the cockpit of the Coates #26 as a Supercar cockpit is: a carbon dash lofted UNDER the windscreen
   (the glass is measured — see COCKPIT.glass — and the deck keeps 30 mm below it everywhere, which the v2 dash
   did not), the driver's display in a pod above the column, a switch panel on the console turned to the driver
   with toggles that flip and buttons that press, four buttons on the wheel that turn with it, the sequential
   lever on the tunnel that moves when a gear goes in, the wiring looms with their connectors and ties, round
   cage tubes over the original's thin ones, a bucket seat with a six-point harness, the pedal box in front of
   the firewall, the mirror, the fire bottle and the window net. The instruments are drawn from the machine's
   own state every frame (setInstruments): engine off means a dark screen; there is no invented telemetry.

   WHAT IT IS BUILT AROUND, AND NEVER ALTERS. Andrew's original cabin (car-body.js, 'Original GC500 cockpit and
   cage') stays exactly as he drew it — tests/gc500-source.test.mjs counts every vertex: a wedge of a dash on the
   passenger side (its top .836 at x −.45 rising to .956 at x −.20), a floor plate, a seat of two boxes, a sphere
   for the driver's head, cage tubes as thin boxes, and the small wheel ring the cog sits over. Everything here is
   placed so those are inside the new shell: the head is inside the helmet, the ring inside the column hub, the
   wedge under the deck. Nothing is hidden and nothing is cut.

   Everything is authored in WORLD METRES (the car is five metres long, its nose at x −2.5, the driver on the
   right, z negative, facing −x — so his right hand is −z) inside a group that undoes the rig's .74 scale and −.24
   offset, so a dimension written here is the dimension on the car. The wheel's centre is COG_CAR.fitted.

   v5.81 — THE MAKEOVER. Andrew Fisher, 23 Sep 2026, of the v5.80 still: the driver and the dashboard looked poor, and the
   Coates Way steering wheel had to look outstanding — the makeover approved, knowing it would change things;
   and on 24 Sep, approval for all of it, pushed as far as it would go. The parts stayed where they were; their skins
   were wrong. So, in this file: the dash, the console, the pods and the seat shells are a 2×2 carbon twill whose tow
   is 4 mm on the car (cockpit-surfaces.js, UVs in metres) under a half clear coat; the switch panel is black
   anodised aluminium with a brushed grain and a screen-printed label sheet drawn at the size the lens needs, with an
   engraved COATES #26 plate; the display sits in a bezel behind a dark glass that reflects the garage; the wheel's
   four buttons have machined bezels and printed labels and sit on a carbon faceplate between the cog and the rim
   (the rim itself, suede with moulded grips, is the cog model's — service-parts.js); the knob, the pedals and the
   quick-release are machined aluminium; the cage is padded where the driver's shoulder and helmet are; the window
   net is a woven net in the door; the harness is webbing with a camlock and adjusters; the fire bottle has its head
   and gauge; and a warm fill light sits under the roof, so from the seat the dash reads as carbon and not as a
   black slab. Every name the tests and the app look for is kept (tests/engine.test.mjs). */
import {COG_CAR,ENGINE_FIT} from './engine-kinematics.js';
import {buildDriver,loftGeometry,ring} from './car-driver.js';
import {carbonTwill,suede,brushed,webbing,metricUV,scaleUV,canvasTexture,TWILL} from './cockpit-surfaces.js';
import {WHEEL} from './parts.js';

/* the wheel's buttons sit in four of the cog's seven valleys, on the faceplate between the teeth and the rim: RADIO at
   ten o'clock and PIT at two, where the thumbs are; N at seven and PAGE at five. Angles are the cog's own (0 at three
   o'clock, the driver's right; the teeth at 13.5° + k·360°/7, so the valleys are half a pitch on); the wheel group's
   y is up and its z is the cog's −x. */
const CS=COG_CAR.fitted.scale,BUTTON_R=3.64*CS,valley=k=>WHEEL.firstTooth+(k+.5)*Math.PI*2/WHEEL.teeth;
const wheelButton=(id,k,color)=>{const a=valley(k);return {id,angle:+(a*180/Math.PI).toFixed(1),y:BUTTON_R*Math.sin(a),z:-BUTTON_R*Math.cos(a),color};};
export const COCKPIT={
 /* the windscreen's inner surface, measured off the original body by raycast (23 Sep 2026): at z 0 it climbs
    from .800 at x −.60 to 1.089 at x −.10, and it is a curved screen — lower by .175 z² toward the pillars */
 glass:(x,z)=>.800+.578*(x+.6)-.175*z*z,
 deckUnderGlass:.03,        /* the deck keeps this much under the glass, everywhere */
 dashFaceDriver:-.24,       /* the dash's rear face on the driver's side: the column comes out of it */
 dashFacePassenger:-.17,    /* the passenger shelf's face, which encloses the original wedge's rear edge (x −.174) */
 kneeY:.72,                 /* the bottom of the dash face */
 hubR:.128,hubX:[-.215,-.135],   /* the column hub: it encloses the original wheel ring whole (x −.186…−.174, out to r .122 about the axis) */
 display:{w:.24,h:.075,x:-.15,y:.96,z:-.34,tilt:.3},   /* the pod on the column top, just behind the spoke plate, as a race dash is mounted: its bezel clears the curved screen by 7 mm at the worst corner (tests/engine.test.mjs) and from the eye (1.05) the screen's centre clears the rim's marker (.954) by 14 mm */
 doorZ:.655,seatZ:[-.53,.01],
 eye:{x:.42,y:1.05,z:-.30},
 wheelButtons:[wheelButton('RADIO',2,'#ff6a13'),wheelButton('PIT',0,'#ff6a13'),wheelButton('PAGE',5,'#ff6a13'),wheelButton('N',4,'#2a2f34')],
 switches:['IGN','FUEL','FAN','LIGHTS'],buttons:[['START','#2ec46a'],['PIT LIMIT','#3a7bff'],['RADIO','#ffb020']],
 gears:['N','1','2','3','4','5','6'],
 /* v5.81 — the printed things, in pixels per metre of the part, chosen from the stills: at the hero's 1935 px frame the
    switch panel is about 850 px across its 0.30 m (2,800 px/m) and a wheel label about 90 px across its 26 mm
    (3,500 px/m); each is drawn at least half as fine again, so a texel is never bigger than a screen pixel there */
 print:{panel:5200,wheelLabel:9800,display:5330,plate:5500},
};

const FONT='system-ui, Segoe UI, Arial, sans-serif';

/* THE DRIVER'S DISPLAY. Drawn from the machine's own state: ignition off is a dark screen; on, it shows the gear
   the lever has put in, the drive's rpm on a bar with the shift lights above it, the roller speed the dyno deck
   sees, and the water and oil the machine warms as it runs. Three pages, the PAGE button on the wheel flips them:
   the race page, the systems page, and (Andrew Fisher's concept video, 23 Sep 2026: the dash reading "Every part
   matters · Performance targets · Scorecard & cadence") the Coates Way page — the eight targets from the supplied
   June 2026 presentation, the record's own words (content.js KPIs), passed in as st.targets. No lap time, no
   track, no figure that is not the machine's or the presentation's.
   v5.81 — laid out on the screen's own shape (0.24 × 0.075 m, 3.2 : 1; the v5.80 canvas was 2.67 : 1 and every
   figure on it was drawn a fifth too wide) and at any resolution: the drawing is in a 1280 × 400 frame scaled to
   the canvas it is given. The layout is the concept's: revs and water on the left, the gear in the middle, speed
   and oil on the right, the shift lights across the top, the state along the foot. */
export function drawDisplay(g,w,h,st){
 st=st||{};const W=1280,H=400;g.save();g.scale(w/W,h/H);
 const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0b1015');bg.addColorStop(1,'#020304');g.fillStyle=bg;g.fillRect(0,0,W,H);
 g.strokeStyle='#1a222b';g.lineWidth=4;g.strokeRect(6,6,W-12,H-12);
 const text=(s,x,y,size,col,align='left',weight=700)=>{g.fillStyle=col;g.font=`${weight} ${size}px ${FONT}`;g.textAlign=align;g.textBaseline='middle';g.fillText(s,x,y);};
 if(!st.ign){text('IGNITION OFF',W/2,H/2-28,70,'#1f272f','center');text('COATES · 26 · GC500',W/2,H/2+48,38,'#ff6a13','center');g.restore();return;}
 const rpm=Math.max(0,st.rpm||0),max=st.rpmMax||7500,f=Math.min(1,rpm/max);
 /* shift lights: twelve, green to amber to red to blue, lit in turn from 55 % up; the last two flash at the limit */
 const leds=['#2ec46a','#2ec46a','#2ec46a','#2ec46a','#ffb020','#ffb020','#ffb020','#e5342a','#e5342a','#e5342a','#3a7bff','#3a7bff'];
 for(let i=0;i<12;i++){const lit=st.running&&f>.55+i*.038,flash=i>=10&&st.pit,x=298+i*62,y=40;
  g.fillStyle='#12171c';g.beginPath();g.arc(x,y,17,0,Math.PI*2);g.fill();
  g.globalAlpha=lit||flash?1:.15;if(lit||flash){g.shadowColor=leds[i];g.shadowBlur=22;}g.fillStyle=leds[i];g.beginPath();g.arc(x,y,13,0,Math.PI*2);g.fill();g.shadowBlur=0;g.globalAlpha=1;}
 /* WHAT THE DRIVER CAN SEE OF IT (v5.81, measured from COCKPIT_EYE over the real rim, tests/engine.test.mjs): the rim's
    top crosses the lower middle of the screen — the bottom quarter is hidden across the middle 44 % of its width and
    the bottom eighth across the middle 70 %; the pod cannot rise (5 mm under the glass) or come nearer (the wheel's
    faceplate turns 4 mm in front of it). So everything the driver reads — the gear, revs, speed, water and oil — is
    above y 300 of 400 and the state line along the foot is the only thing the rim may cover. */
 if(st.page===2){
  text('EVERY PART MATTERS',40,98,46,'#ff6a13');text('PERFORMANCE TARGETS · THE COATES WAY, JUNE 2026',40,138,26,'#9aa3a8','left',600);
  (st.targets||[]).slice(0,8).forEach((k,i)=>{const x=40+(i%2)*620,y=178+Math.floor(i/2)*36;text(String(k[0]),x+120,y,32,'#f3f4f2','right');text(String(k[1]),x+136,y,22,'#c9ced0','left',600);});
  g.fillStyle='#2ec46a';g.beginPath();g.arc(52,H-30,10,0,Math.PI*2);g.fill();text('SCORECARD & CADENCE',72,H-30,24,'#c9ced0');text('PAGE 3 / 3',W-40,H-30,24,'#ff6a13','right');g.restore();return;}
 if(st.page===1){
  text('SYSTEMS',40,98,32,'#9aa3a8');
  const rows=[['WATER',st.water!=null?Math.round(st.water)+' °C':'—'],['OIL',st.oil!=null?Math.round(st.oil)+' °C':'—'],['FUEL PUMP',st.fuel?'ON':'OFF'],['FAN',st.fan?'ON':st.fanAuto?'AUTO':'OFF'],['LIGHTS',st.lights?'ON':'OFF'],['PIT LIMIT',st.pit?'ON':'OFF'],['RADIO',st.radio?'OPEN':'—'],['GEAR',st.gear||'N']];
  rows.forEach((r,i)=>{const x=40+(i%4)*300,y=146+Math.floor(i/4)*84;text(r[0],x,y,26,'#6f7b82','left',600);text(r[1],x,y+38,44,'#e8ebe9');});
  text('PAGE 2 / 3 · PAGE on the wheel',W-40,H-30,26,'#ff6a13','right');g.restore();return;}
 /* the race page: revs over water on the left, the gear in the middle, the rollers' speed over oil on the right, the
    state along the foot */
 g.strokeStyle='#18202a';g.lineWidth=3;g.beginPath();g.moveTo(440,72);g.lineTo(440,292);g.moveTo(840,72);g.lineTo(840,292);g.moveTo(40,198);g.lineTo(420,198);g.moveTo(860,198);g.lineTo(1240,198);g.moveTo(40,318);g.lineTo(1240,318);g.stroke();
 text('RPM',40,90,26,'#9aa3a8');text(Math.round(rpm).toLocaleString('en-AU'),40,140,72,'#f3f4f2');
 g.fillStyle='#161b20';g.fillRect(40,176,380,11);g.fillStyle=f>.9?'#e5342a':f>.7?'#ffb020':'#2ec46a';g.fillRect(40,176,380*f,11);
 text('WATER',40,224,26,'#9aa3a8');text(st.water!=null?Math.round(st.water)+'°C':'—',40,266,54,'#e8ebe9');
 const gear=st.gear||'N';text(gear,640,172,236,gear==='N'?'#2ec46a':st.running?'#f3f4f2':'#7d868c','center',800);
 text('KM/H',1240,90,26,'#9aa3a8','right');text(st.speed!=null?String(Math.round(st.speed)):'0',1240,140,72,'#f3f4f2','right');
 text('OIL',1240,224,26,'#9aa3a8','right');text(st.oil!=null?Math.round(st.oil)+'°C':'—',1240,266,54,'#e8ebe9','right');
 text(st.fuel?'FUEL PUMP ON':'FUEL OFF',40,356,26,st.fuel?'#c9ced0':'#6f7b82','left',600);if(st.pit)text('PIT LIMIT',300,356,26,'#3a7bff','left',700);
 text(st.starting?'STARTING':st.running?'V8 RUNNING · IN THE GARAGE':'V8 OFF · IN THE GARAGE',W-40,356,26,'#ff6a13','right');
 g.restore();
}
/* v5.81 — THE SWITCH PANEL'S LABEL SHEET, screen-printed on the anodised plate: drawn on a clear canvas, so the metal
   shows between the words and the print is lit like the plate it is on. Positions are the panel's own, in metres
   (z across, y up), turned into the canvas here: a label under each toggle and each button, ON above the toggles, the
   keyline round the groups. */
function drawPanelSheet(g,w,h,pw,ph,toggles,buttons){
 const X=z=>(pw/2-z)/pw*w,Y=y=>(ph/2-y)/ph*h,S=v=>v/pw*w;
 g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
 g.strokeStyle='rgba(205,212,216,.55)';g.lineWidth=S(.0007);
 const box=(z0,z1,y0,y1)=>{const r=S(.004);g.beginPath();g.roundRect(X(z0),Y(y1),X(z1)-X(z0),Y(y0)-Y(y1),r);g.stroke();};
 box(pw/2-.006,-pw/2+.006,-.012,.052);box(pw/2-.006,-pw/2+.006,-.084,-.018);
 g.fillStyle='#ff6a13';g.fillRect(X(pw/2-.006),Y(.0735),X(-pw/2+.006)-X(pw/2-.006),S(.0014));
 for(const [id,z,y] of toggles){g.fillStyle='#e9edef';g.font=`800 ${Math.round(S(.0072))}px ${FONT}`;g.fillText(id==='IGN'?'IGNITION':id,X(z),Y(y-.024));
  g.fillStyle='#aab3b8';g.font=`700 ${Math.round(S(.0042))}px ${FONT}`;g.fillText(id==='IGN'?'ON ↻':'ON',X(z),Y(y+.021));}
 for(const [id,z,y] of buttons){g.fillStyle='#e9edef';g.font=`800 ${Math.round(S(.0062))}px ${FONT}`;g.fillText(id,X(z),Y(y-.025));}
}
/* the engraved plate: brushed aluminium, the letters cut in and filled dark, the lower lip of each stroke catching the light */
/* v5.82 — THE RADIO'S CHANNEL WINDOW: an LCD strip on the head unit. Dark until the ignition is on; then the crew
   channel and the car's number, and TX in orange while the channel is open. */
export function drawRadio(g,w,h,st){
 st=st||{};const W=600,H=200;g.save();g.scale(w/W,h/H);
 g.fillStyle=st.ign?'#0f2a14':'#07090a';g.fillRect(0,0,W,H);g.strokeStyle='#1c2a1e';g.lineWidth=6;g.strokeRect(3,3,W-6,H-6);
 if(st.ign){const t=(s,x,y,size,col,align='left',weight=800)=>{g.fillStyle=col;g.font=`${weight} ${size}px ${FONT}`;g.textAlign=align;g.textBaseline='middle';g.fillText(s,x,y);};
  t('CREW',30,66,54,'#b7ffc4');t('CH 1',30,146,54,'#b7ffc4');t('26',W-30,66,54,'#b7ffc4','right');
  if(st.open){g.shadowColor='#ff6a13';g.shadowBlur=18;t('TX',W-30,146,54,'#ff6a13','right');g.shadowBlur=0;}else t('PTT',W-30,146,40,'#4f7a58','right',700);}
 g.restore();
}
function drawEngraved(g,w,h,textStr){
 g.fillStyle='#b9c0c4';g.fillRect(0,0,w,h);
 for(let y=0;y<h;y++){const v=175+Math.round(30*Math.sin(y*12.9898)*Math.sin(y*78.233));g.fillStyle=`rgba(${v},${v+4},${v+7},.55)`;g.fillRect(0,y,w,1);}
 g.strokeStyle='#8a9297';g.lineWidth=Math.max(2,h*.05);g.strokeRect(g.lineWidth/2,g.lineWidth/2,w-g.lineWidth,h-g.lineWidth);
 g.font=`800 ${Math.round(h*.62)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';if('letterSpacing' in g)g.letterSpacing=Math.round(h*.08)+'px';
 g.fillStyle='rgba(255,255,255,.75)';g.fillText(textStr,w/2,h/2+h*.035);
 g.fillStyle='#23272b';g.fillText(textStr,w/2,h/2);
}

export function buildCockpit(T,cabinGroup,mats){
 const {scale:s,x:dx}=ENGINE_FIT;
 const interior=new T.Group();interior.name='Cockpit interior';interior.scale.setScalar(1/s);interior.position.set(-dx/s,0,0);
 cabinGroup.add(interior);
 const W=COG_CAR.fitted,wheelX=W.x,wheelY=W.y,wheelZ=W.z;
 /* ---- THE SKINS (v5.81, cockpit-surfaces.js) ---- */
 const tw=carbonTwill(T);for(const t of [tw.map,tw.normalMap,tw.anisotropyMap])t.repeat.set(tw.perMetre,tw.perMetre);
 /* a clear-coated 2×2 twill: the resin a half coat of gloss over the weave, the tows' own sheen running along them */
 const carbon=new T.MeshPhysicalMaterial({color:0xffffff,map:tw.map,normalMap:tw.normalMap,normalScale:new T.Vector2(.45,.45),roughness:.4,metalness:.05,clearcoat:.5,clearcoatRoughness:.3,anisotropy:.22,anisotropyMap:tw.anisotropyMap});
 carbon.userData.twill=true;
 /* the same weave, matte: the column shroud, the door cards and the tunnel, which a team leaves unpolished */
 const carbonMatte=new T.MeshPhysicalMaterial({color:0xd8d8d8,map:tw.map,normalMap:tw.normalMap,normalScale:new T.Vector2(.4,.4),roughness:.62,metalness:.05,clearcoat:0});carbonMatte.userData.twill=true;
 const nap=suede(T,17);for(const t of [nap.map,nap.bumpMap])t.repeat.set(50,50);   /* 20 mm of nap a tile on UVs in metres */
 const grain=brushed(T,5);for(const t of [grain.roughnessMap,grain.bumpMap])t.repeat.set(13,13);   /* a 77 mm tile: the brushing's lines about 0.3 mm apart */
 const turned=brushed(T,9);   /* on a lathe's UVs (0..1 round and along the part) the same lines are the turning marks */
 const web=webbing(T);for(const t of [web.map,web.normalMap])t.repeat.set(62.5,62.5);   /* 16 mm of belt a tile */
 const black=new T.MeshStandardMaterial({color:0x0d0f11,roughness:.55,metalness:.3});
 const tube=new T.MeshStandardMaterial({color:0x22262a,roughness:.42,metalness:.55});
 const alloy=new T.MeshStandardMaterial({color:0x9aa3a8,roughness:.36,metalness:.85});
 /* machined aluminium: bright, fully metallic, the tool's marks in the roughness */
 const machined=new T.MeshPhysicalMaterial({color:0xc2c8cb,metalness:1,roughness:.34,roughnessMap:turned.roughnessMap,clearcoat:0});   /* satin, not chrome: a turned finish scatters the highlight along its marks */
 /* black anodised aluminium, brushed across: the switch panel and the display's bezel */
 const anodised=new T.MeshPhysicalMaterial({color:0x15171a,metalness:.6,roughness:.45,roughnessMap:grain.roughnessMap,bumpMap:grain.bumpMap,bumpScale:.4,clearcoat:.25,clearcoatRoughness:.35});anodised.userData.twill=true;
 const loomMat=new T.MeshStandardMaterial({color:0x111315,roughness:.9,metalness:.05});
 const loomOrange=new T.MeshStandardMaterial({color:0xd8560f,roughness:.85,metalness:.05});
 const seatCloth=new T.MeshPhysicalMaterial({color:0x0e0e10,map:nap.map,bumpMap:nap.bumpMap,bumpScale:1.2,roughness:.95,metalness:0,sheen:.5,sheenColor:new T.Color(0x303036),sheenRoughness:.7});seatCloth.userData.twill=true;
 const padding=new T.MeshPhysicalMaterial({color:0x121214,map:nap.map,bumpMap:nap.bumpMap,bumpScale:1.6,roughness:.92,metalness:0,sheen:.3,sheenColor:new T.Color(0x2a2a30)});
 const strap=new T.MeshStandardMaterial({color:0xff6a13,map:web.map,normalMap:web.normalMap,normalScale:new T.Vector2(.6,.6),roughness:.82,metalness:0});strap.userData.twill=true;
 const orange=mats&&mats.orange?mats.orange:new T.MeshStandardMaterial({color:0xff6a13,roughness:.3,metalness:.2});
 const red=new T.MeshStandardMaterial({color:0xb3121a,roughness:.32,metalness:.25});
 const bottleRed=new T.MeshPhysicalMaterial({color:0xb0141c,roughness:.3,metalness:.1,clearcoat:.8,clearcoatRoughness:.12});
 const mirror=new T.MeshStandardMaterial({color:0xd8dde0,roughness:.08,metalness:1});
 const all=[],controls=[];const cap=w=>w[0].toUpperCase()+w.slice(1);
 /* a part whose material is sized in metres gets UVs in metres (a box's faces projected on their own axes) */
 const metric=(mesh)=>{const m=mesh.material;if(m&&m.userData&&m.userData.twill&&mesh.geometry&&mesh.geometry.type==='BoxGeometry')metricUV(mesh.geometry);return mesh;};
 const add=(mesh,name)=>{mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;metric(mesh);interior.add(mesh);all.push(mesh);return mesh;};
 const control=(mesh,c)=>{mesh.userData.control=c;controls.push(mesh);return mesh;};
 const box=(w,h,d,x,y,z,mat,name,rot)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(rot)m.rotation.set(...rot);return add(m,name);};
 const cyl=(r0,r1,len,x,y,z,mat,name,rot,segs=24)=>{const m=new T.Mesh(new T.CylinderGeometry(r0,r1,len,segs),mat);m.position.set(x,y,z);if(rot)m.rotation.set(...rot);return add(m,name);};
 /* merge geometries of one material into one mesh (the additions of v5.81 are batched this way: a draw each, not dozens) */
 const merged=(geos,mat,name,parent=interior)=>{const out=new T.BufferGeometry(),keys=['position','normal','uv'];let count=0;const idx=[];
  const flat=geos.map(g=>g.index?g.toNonIndexed():g);for(const k of keys){const arrays=flat.map(g=>g.attributes[k]);const size=k==='uv'?2:3;const data=new Float32Array(arrays.reduce((n,a)=>n+a.count*size,0));let at=0;for(const a of arrays){data.set(a.array.subarray(0,a.count*size),at);at+=a.count*size;}out.setAttribute(k,new T.BufferAttribute(data,size));}
  out.computeBoundingBox();out.computeBoundingSphere();const m=new T.Mesh(out,mat);m.name=name;m.castShadow=m.receiveShadow=true;parent.add(m);all.push(m);return m;};
 const place=(g,x,y,z,rot)=>{const o=new T.Object3D();o.position.set(x,y,z);if(rot)o.rotation.set(...rot);o.updateMatrix();return g.applyMatrix4(o.matrix);};
 /* a tube between two points, radius r */
 const bar=(a,b,r,mat,name,parent)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length();
  const m=new T.Mesh(new T.CylinderGeometry(r,r,L,14),mat);m.position.copy(A).addScaledVector(d,.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());if(parent){m.name=name;m.castShadow=m.receiveShadow=true;parent.add(m);all.push(m);return m;}return add(m,name);};
 /* the same, as a geometry in interior metres, for merging */
 const barGeo=(a,b,r,segs=16)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length();const g=new T.CylinderGeometry(r,r,L,segs);
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());g.applyQuaternion(q);const c=A.clone().addScaledVector(d,.5);g.translate(c.x,c.y,c.z);return g;};
 /* a loom: a tube along a smooth curve through the points, with tie rings every so often and a connector at the end */
 const loom=(pts,r,name,{ties=0,connector=null,mat=loomMat}={})=>{const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'centripetal',.6);
  const m=new T.Mesh(new T.TubeGeometry(curve,Math.max(8,pts.length*8),r,10,false),mat);add(m,name);
  for(let i=1;i<=ties;i++){const t=i/(ties+1),p=curve.getPointAt(t),tan=curve.getTangentAt(t);const ring=new T.Mesh(new T.TorusGeometry(r+.002,.0025,6,12),black);ring.position.copy(p);ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),tan);add(ring,name+' tie');}
  if(connector){const p=curve.getPointAt(1),tan=curve.getTangentAt(1);const c=new T.Mesh(new T.BoxGeometry(connector[0],connector[1],connector[2]),black);c.position.copy(p).addScaledVector(tan,connector[0]/2);c.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),tan);add(c,name+' connector');}
  return m;};
 const dz=COCKPIT.doorZ,glass=COCKPIT.glass;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

 /* ---- 1. THE DASH: one sculpted carbon moulding, lofted across the car from 41 sections, every one of them
    under the glass. The deck follows the screen's rake 30 mm below it, from the cowl at the screen's base to a
    rounded rear lip, then the face drops to the knee line; the face stands 7 cm further from the driver on his
    side (the column comes out of it) than on the passenger shelf, and the deck simply follows the curved
    screen down toward the pillars, because the screen itself does. v5.81: its UVs are metres along the moulding,
    so the twill is the same 4 mm tow over the deck, the lip and the face. ---- */
 const profile=(z)=>{
  const side=smooth((z+.31)/.06);                        /* 0 on the driver's side (z < −.31), 1 on the passenger side */
  const face=COCKPIT.dashFaceDriver+(COCKPIT.dashFacePassenger-COCKPIT.dashFaceDriver)*side;
  const top=x=>Math.min(.995,glass(x,z)-COCKPIT.deckUnderGlass);
  const lipX=face+.02;                                    /* the rounded rear lip sits just ahead of the face */
  /* the cowl meets the glass: the first two stations sit on the screen itself, so there is no slot along the
     screen's base to see the engine bay through (the v3a render showed the radiator fan through it) */
  const pts=[[-.60,glass(-.60,z)-.003],[-.57,glass(-.57,z)-.008],[-.53,top(-.53)],[-.50,top(-.50)],[-.45,top(-.45)],[-.40,top(-.40)],[-.35,top(-.35)],[-.30,top(-.30)],[lipX-.03,top(lipX-.03)],[lipX,top(lipX)-.004],[face+.004,top(lipX)-.02],[face,top(lipX)-.05],[face,.80],[face-.01,COCKPIT.kneeY+.02],[face-.04,COCKPIT.kneeY],[-.60,COCKPIT.kneeY]];
  return pts.map(([x,y])=>[x,y,z]);};
 {const stations=[];const z0=-dz+.02,z1=dz-.03,N=40;for(let i=0;i<=N;i++)stations.push(profile(z0+(z1-z0)*i/N));
  const g=loftGeometry(T,stations,{metric:true});const dashMesh=new T.Mesh(g,carbon);add(dashMesh,'Dash');dashMesh.material.side=T.DoubleSide;}
 /* the cowl lip along the screen's base, the orange keyline down the driver's face */
 box(.03,.02,1.10,-.585,glass(-.6,0)-.012,0,black,'Cowl lip');
 box(.006,.006,.30,COCKPIT.dashFaceDriver+.004,.745,-.485,orange,'Dash keyline, orange');

 /* ---- 2. THE DRIVER'S DISPLAY, in a pod above the column, leaning back to the eye. The pod's top is 30 mm
    under the glass and the eye sees the screen over the rim's twelve o'clock marker (measured: the sightline
    from the eye to the screen's centre passes 11 mm above the rim). v5.81: a carbon housing, a black anodised
    bezel with four screws, the screen drawn at 5,300 px a metre, and a dark glass in front of it that shows the
    garage's lights across it — the one surface in the cabin that should reflect. ---- */
 let displayTex=null;
 {const D=COCKPIT.display;
  const pod=new T.Group();pod.position.set(D.x,D.y,D.z);pod.rotation.z=D.tilt;interior.add(pod);
  const put=(m,name)=>{m.name=name;m.castShadow=m.receiveShadow=true;pod.add(m);all.push(m);return m;};
  /* the bezel: a frame round the screen, the same outside size as the v5.80 block, so the glass clearance holds */
  {const ow=D.w+.02,oh=D.h+.012,iw=D.w+.002,ih=D.h+.002,r=.006;const sh=new T.Shape();sh.moveTo(-ow/2+r,-oh/2);sh.lineTo(ow/2-r,-oh/2);sh.quadraticCurveTo(ow/2,-oh/2,ow/2,-oh/2+r);sh.lineTo(ow/2,oh/2-r);sh.quadraticCurveTo(ow/2,oh/2,ow/2-r,oh/2);sh.lineTo(-ow/2+r,oh/2);sh.quadraticCurveTo(-ow/2,oh/2,-ow/2,oh/2-r);sh.lineTo(-ow/2,-oh/2+r);sh.quadraticCurveTo(-ow/2,-oh/2,-ow/2+r,-oh/2);
   const hole=new T.Path();hole.moveTo(-iw/2,-ih/2);hole.lineTo(-iw/2,ih/2);hole.lineTo(iw/2,ih/2);hole.lineTo(iw/2,-ih/2);hole.closePath();sh.holes.push(hole);
   const g=new T.ExtrudeGeometry(sh,{depth:.010,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:2,curveSegments:6});g.rotateY(Math.PI/2);g.translate(-.004,0,0);
   put(new T.Mesh(g,anodised),'Display bezel');
   /* the carbon housing behind it, and the four screws in the bezel's corners */
   const housing=new T.Mesh(new T.BoxGeometry(.030,oh-.004,ow-.006),carbon);housing.position.set(-.021,0,0);put(housing,'Display pod housing');metricUV(housing.geometry);
   const screws=[];for(const [yy,zz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const sc=new T.CylinderGeometry(.0022,.0022,.0016,12);sc.rotateZ(Math.PI/2);sc.translate(.0075,yy*(oh/2-.0035),zz*(ow/2-.006));screws.push(sc);}
   merged(screws,machined,'Display bezel screws',pod);}
  const drawn=canvasTexture(T,Math.round(D.w*COCKPIT.print.display),Math.round(D.h*COCKPIT.print.display),(g,w,h)=>drawDisplay(g,w,h,{ign:false}));displayTex=drawn;
  if(drawn){drawn.texture.generateMipmaps=true;drawn.texture.minFilter=T.LinearMipmapLinearFilter;}
  const screen=new T.Mesh(new T.PlaneGeometry(D.w,D.h),drawn?new T.MeshBasicMaterial({map:drawn.texture,toneMapped:false}):new T.MeshStandardMaterial({color:0x0a0c10,emissive:0x101418}));
  screen.position.set(.0035,0,0);screen.rotation.set(0,Math.PI/2,0);put(screen,'Driver display');
  const frame=new T.Mesh(new T.PlaneGeometry(D.w+.02,D.h+.02),black);frame.position.set(.003,0,0);frame.rotation.set(0,Math.PI/2,0);put(frame,'Display surround');
  /* the glass: black and very smooth, drawn over the screen with the blend of a real cover glass — the screen behind
     dimmed a little (its alpha), the reflection of the garage added at full strength (one, one-minus-alpha). A plain
     transparent material would scale the reflection by its opacity and lose it; transmission would render the scene
     a second time for one pane. */
  const glassMat=new T.MeshPhysicalMaterial({color:0x000000,roughness:.05,metalness:0,specularIntensity:.3,transparent:true,opacity:.22,depthWrite:false,envMapIntensity:3.3,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor});glassMat.userData.cabinEnv=true;   /* the glass keeps the garage's full reflection: it is the one surface meant to show it. Its reflectance is a third of plain glass's and the environment's weight three times — the hall's reflection as strong as clear glass would show it, a lamp's pinpoint a third: a race display's glass is anti-glare, and at .05 roughness a spot lamp behind the driver burnt a white disc into the middle of the screen */
  const pane=new T.Mesh(new T.PlaneGeometry(D.w+.004,D.h+.004),glassMat);pane.position.set(.0052,0,0);pane.rotation.set(0,Math.PI/2,0);pane.renderOrder=2;put(pane,'Display glass');pane.castShadow=false;
  /* the pod's stalk down to the column shroud, and its cable */
  cyl(.012,.016,.05,D.x-.02,D.y-.055,D.z,black,'Display stalk',[0,0,.2],12);}

 /* ---- 3. THE CENTRE CONSOLE, turned 20° to the driver, carrying the switch panel: four toggles that flip and
    three buttons that press (car-app.js listens for userData.control). v5.81: the plate is black anodised
    aluminium with a brushed grain; the words are a printed sheet on it (drawPanelSheet) at 5,200 px a metre; the
    toggles stand in machined bases with a guard each side; COATES #26 is engraved on a plate across the top. ---- */
 const switchLevers=new Map(),buttonCaps=new Map();let radioTex=null,radioLed=null,ignLamp=null;const radioState={ign:false,open:false};   /* v5.82 */
 {const cx=-.155,cy=.80,cz=.06,ang=.45;   /* on the tunnel's top by the driver's left knee; +.45 turns the panel's face toward the driver's side (−z) so it is in the eye's field */
  const consoleG=new T.Group();consoleG.position.set(cx,cy,cz);consoleG.rotation.y=ang;interior.add(consoleG);
  const cbody=new T.Mesh(new T.ExtrudeGeometry((()=>{const sh=new T.Shape();sh.moveTo(-.02,-.17);sh.lineTo(.09,-.17);sh.lineTo(.09,.10);sh.lineTo(.03,.13);sh.lineTo(-.02,.13);sh.closePath();return sh;})(),{depth:.34,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:3}),carbon);
  cbody.geometry.translate(0,0,-.17);cbody.name='Console';cbody.castShadow=cbody.receiveShadow=true;consoleG.add(cbody);all.push(cbody);   /* an extrusion's UVs are its own coordinates, metres here: the twill is 4 mm on it as it is on the dash */
  const pw=.30,ph=.16;
  const plate=new T.Mesh(new T.BoxGeometry(.012,ph,pw),anodised);metricUV(plate.geometry);plate.position.set(.096,.0,0);plate.name='Switch panel plate';plate.castShadow=plate.receiveShadow=true;consoleG.add(plate);all.push(plate);
  const toggles=COCKPIT.switches.map((id,i)=>[id,pw/2-.0375-i*.075,.022]),buttons=COCKPIT.buttons.map(([id],i)=>[id,pw/2-.062-i*.094,-.045]);
  const sw=pw-.004,sh=ph-.004;
  const tex=canvasTexture(T,Math.round(sw*COCKPIT.print.panel),Math.round(sh*COCKPIT.print.panel),(g,w,h)=>drawPanelSheet(g,w,h,sw,sh,toggles,buttons));
  if(tex){tex.texture.generateMipmaps=true;tex.texture.minFilter=T.LinearMipmapLinearFilter;const face=new T.Mesh(new T.PlaneGeometry(sw,sh),new T.MeshStandardMaterial({map:tex.texture,transparent:true,alphaTest:.02,roughness:.5,metalness:0,emissive:0xffffff,emissiveMap:tex.texture,emissiveIntensity:.06,polygonOffset:true,polygonOffsetFactor:-1}));face.position.set(.1025,0,0);face.rotation.y=Math.PI/2;face.name='Switch panel';consoleG.add(face);all.push(face);}
  else{const face=new T.Mesh(new T.PlaneGeometry(sw,sh),new T.MeshStandardMaterial({color:0x15171a,transparent:true,opacity:0}));face.position.set(.1025,0,0);face.rotation.y=Math.PI/2;face.name='Switch panel';consoleG.add(face);all.push(face);}
  /* the engraved plate, across the top of the panel on two screws */
  {const pwid=.14,phig=.016;const pl=canvasTexture(T,Math.round(pwid*COCKPIT.print.plate),Math.round(phig*COCKPIT.print.plate),(g,w,h)=>drawEngraved(g,w,h,'COATES #26'));
   const mat=pl?new T.MeshStandardMaterial({map:pl.texture,bumpMap:pl.texture,bumpScale:1.5,metalness:.85,roughness:.34}):machined;
   /* one plane, one draw: at 1.6 mm thick the plate's edges are not worth the five draws a box's faces cost */
   const m=new T.Mesh(new T.PlaneGeometry(pwid,phig),mat);m.rotation.y=Math.PI/2;m.position.set(.1036,.061,0);m.name='Engraved plate, COATES #26';m.castShadow=m.receiveShadow=true;consoleG.add(m);all.push(m);
   const scr=[];for(const zz of [pwid/2+.006,-pwid/2-.006]){const sc=new T.CylinderGeometry(.0024,.0024,.0016,12);sc.rotateZ(Math.PI/2);sc.translate(.1034,.061,zz);scr.push(sc);}
   merged(scr,machined,'Engraved plate screws',consoleG);}
  const put=(m,name)=>{m.name=name;m.castShadow=true;consoleG.add(m);all.push(m);return m;};
  const guards=[],trim=[];   /* v5.82: the machined trim that never moves (escutcheon, lamp bezel, radio bezel and knob) is one draw, merged after the radio */
  COCKPIT.switches.forEach((id,i)=>{const z=pw/2-.0375-i*.075,y=.022;
   if(id==='IGN'){/* v5.80 — the ignition is a rotary key switch: a barrel in the panel and a key that turns a quarter (setSwitch) */
    const barrel=put(new T.Mesh(new T.CylinderGeometry(.011,.011,.014,24),machined),'Ignition barrel');barrel.position.set(.108,y,z);barrel.rotation.z=Math.PI/2;
    const pivot=new T.Group();pivot.position.set(.116,y,z);consoleG.add(pivot);pivot.userData.rotary=true;   /* v5.82: the key is built standing up (+y) at OFF, its head over the panel and not past its edge, and turns a quarter toward the passenger side to ON */
    const key=new T.Mesh(new T.BoxGeometry(.004,.028,.007),black);key.position.set(.003,.010,0);key.name='Ignition key';key.castShadow=true;pivot.add(key);all.push(key);
    /* v5.82 — the key's head: an orange tag with the car's number, a split ring through its eye, and the escutcheon the barrel sits in; the lamp above the barrel lights with the ignition */
    const head=new T.Mesh(new T.BoxGeometry(.0035,.028,.021),orange);head.position.set(.003,.038,0);head.name='Ignition key head';head.castShadow=true;pivot.add(head);all.push(head);control(head,{kind:'switch',id});
    const ring=new T.Mesh(new T.TorusGeometry(.0055,.0013,6,16),machined);ring.position.set(.003,.056,0);ring.rotation.y=Math.PI/2;pivot.add(ring);all.push(ring);ring.name='Ignition key ring';
    const tag=canvasTexture(T,160,224,(g,w,h)=>{g.fillStyle='#ff6a13';g.fillRect(0,0,w,h);g.fillStyle='#121417';g.font=`800 ${Math.round(h*.42)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('26',w/2,h*.46);g.font=`800 ${Math.round(h*.11)}px ${FONT}`;g.fillText('COATES',w/2,h*.80);});
    if(tag){const face=new T.Mesh(new T.PlaneGeometry(.020,.027),new T.MeshStandardMaterial({map:tag.texture,roughness:.4,metalness:.1}));face.position.set(.0049,.038,0);face.rotation.y=Math.PI/2;face.name='Ignition key tag';pivot.add(face);all.push(face);control(face,{kind:'switch',id});}
    {const eg=new T.TorusGeometry(.0135,.0025,8,32);eg.rotateY(Math.PI/2);eg.translate(.1045,y,z);trim.push(eg);}
    ignLamp=put(new T.Mesh(new T.CylinderGeometry(.0038,.0038,.004,16),new T.MeshStandardMaterial({color:0x2a0a05,emissive:0xff3b1f,emissiveIntensity:0})),'Ignition lamp');ignLamp.position.set(.104,y,z+.026);ignLamp.rotation.z=Math.PI/2;
    {const lg=new T.TorusGeometry(.0045,.0012,6,16);lg.rotateY(Math.PI/2);lg.translate(.1045,y,z+.026);trim.push(lg);}
    switchLevers.set(id,pivot);control(key,{kind:'switch',id});const pad=new T.Mesh(new T.BoxGeometry(.006,.045,.06),new T.MeshBasicMaterial({visible:false}));pad.position.set(.104,y,z);pad.name='Switch pad '+id;consoleG.add(pad);control(pad,{kind:'switch',id});return;}
   const base=put(new T.Mesh(new T.CylinderGeometry(.0085,.0085,.006,24),machined),'Switch base '+id);base.position.set(.106,y,z);base.rotation.z=Math.PI/2;
   /* the two guard posts either side of the toggle, so a knee cannot flip it — merged below */
   for(const side of [-1,1]){const gp=new T.BoxGeometry(.010,.020,.0035);gp.translate(.107,y,z+side*.0125);guards.push(gp);}
   const pivot=new T.Group();pivot.position.set(.108,y,z);consoleG.add(pivot);
   const lever=new T.Mesh(new T.CylinderGeometry(.0025,.0032,.024,12),machined);lever.position.set(.012,0,0);lever.rotation.z=-Math.PI/2;lever.name='Switch lever '+id;lever.castShadow=true;pivot.add(lever);all.push(lever);
   const tip=new T.Mesh(new T.SphereGeometry(.004,12,10),red);tip.position.set(.024,0,0);pivot.add(tip);
   pivot.rotation.z=-.5;switchLevers.set(id,pivot);
   /* the toggle and a generous hit pad behind it, so a finger on a phone finds it */
   control(lever,{kind:'switch',id});const pad=new T.Mesh(new T.BoxGeometry(.006,.045,.06),new T.MeshBasicMaterial({visible:false}));pad.position.set(.104,y,z);pad.name='Switch pad '+id;consoleG.add(pad);control(pad,{kind:'switch',id});});
  merged(guards,anodised,'Switch guards',consoleG);
  COCKPIT.buttons.forEach(([id,colour],i)=>{const z=pw/2-.062-i*.094,y=-.045;
   const guard=put(new T.Mesh(new T.CylinderGeometry(.015,.015,.008,32),machined),'Button guard '+id);guard.position.set(.107,y,z);guard.rotation.z=Math.PI/2;
   const cap=put(new T.Mesh(new T.CylinderGeometry(.011,.011,.010,24),new T.MeshPhysicalMaterial({color:colour,roughness:.3,metalness:.05,clearcoat:.6,clearcoatRoughness:.2,emissive:colour,emissiveIntensity:.25})),'Button '+id);cap.position.set(.113,y,z);cap.rotation.z=Math.PI/2;
   const cid=id==='PIT LIMIT'?'PIT':id;if(!buttonCaps.has(cid))buttonCaps.set(cid,[]);buttonCaps.get(cid).push({cap,home:.113});control(cap,{kind:'button',id:cid});});
  /* v5.82 — THE RADIO: a crew radio head unit on the console's face under the switch panel — a machined bezel, the
     channel window (drawRadio) that wakes with the ignition, a PTT key that opens the channel (the same RADIO the
     panel button and the wheel pod operate, so all three agree), a volume knob, a speaker grille and the LED that
     shows the channel open. The whole unit is a hit target: a finger anywhere on it keys the radio. */
  {const rx=.096,ry=-.125,rz=0;
   const unit=put(new T.Mesh(new T.BoxGeometry(.016,.056,.18),black),'Radio unit');unit.position.set(rx,ry,rz);unit.receiveShadow=true;control(unit,{kind:'button',id:'RADIO'});
   {const bg=new T.BoxGeometry(.004,.062,.186);bg.translate(rx-.005,ry,rz);trim.push(bg);}
   radioTex=canvasTexture(T,Math.round(.09*COCKPIT.print.panel),Math.round(.03*COCKPIT.print.panel),(g,w,h)=>drawRadio(g,w,h,radioState));
   if(radioTex){const win=new T.Mesh(new T.PlaneGeometry(.09,.03),new T.MeshBasicMaterial({map:radioTex.texture,toneMapped:false}));win.position.set(rx+.0082,ry+.008,rz+.030);win.rotation.y=Math.PI/2;win.name='Radio channel window';consoleG.add(win);all.push(win);control(win,{kind:'button',id:'RADIO'});}
   const ptt=put(new T.Mesh(new T.CylinderGeometry(.009,.009,.008,24),new T.MeshPhysicalMaterial({color:0xffb020,roughness:.3,metalness:.05,clearcoat:.6,clearcoatRoughness:.2,emissive:0xffb020,emissiveIntensity:.25})),'Radio PTT');ptt.position.set(rx+.012,ry-.014,rz+.064);ptt.rotation.z=Math.PI/2;
   if(!buttonCaps.has('RADIO'))buttonCaps.set('RADIO',[]);buttonCaps.get('RADIO').push({cap:ptt,home:rx+.012});control(ptt,{kind:'button',id:'RADIO'});
   {const kg=new T.CylinderGeometry(.007,.0075,.010,20);kg.rotateZ(Math.PI/2);kg.translate(rx+.013,ry+.008,rz-.068);trim.push(kg);}
   const mark=new T.Mesh(new T.BoxGeometry(.002,.0012,.006),orange);mark.position.set(rx+.0185,ry+.008,rz-.068);mark.name='Radio volume mark';consoleG.add(mark);all.push(mark);
   radioLed=put(new T.Mesh(new T.SphereGeometry(.0035,12,10),new T.MeshStandardMaterial({color:0x3a1208,emissive:0xff3b1f,emissiveIntensity:0})),'Radio LED');radioLed.position.set(rx+.009,ry-.016,rz+.036);
   const holes=[];for(let i=0;i<19;i++){const a=i*2.399,rr=.0042*Math.sqrt(i);const hg=new T.CylinderGeometry(.0013,.0013,.002,8);hg.rotateZ(Math.PI/2);hg.translate(rx+.0085,ry-.010+Math.sin(a)*rr,rz-.032+Math.cos(a)*rr);holes.push(hg);}
   merged(holes,new T.MeshStandardMaterial({color:0x000000,roughness:1}),'Radio speaker grille',consoleG);
   /* the printed strip along the unit's foot */
   const lab=canvasTexture(T,Math.round(.12*COCKPIT.print.panel),Math.round(.008*COCKPIT.print.panel),(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#e9edef';g.font=`800 ${Math.round(h*.78)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('RADIO · CREW CHANNEL · PTT',w/2,h/2);});
   if(lab){const m=new T.Mesh(new T.PlaneGeometry(.12,.008),new T.MeshStandardMaterial({map:lab.texture,transparent:true,alphaTest:.02,roughness:.5,metalness:0,emissive:0xffffff,emissiveMap:lab.texture,emissiveIntensity:.06}));m.position.set(rx+.0082,ry-.0235,rz-.02);m.rotation.y=Math.PI/2;m.name='Radio label';consoleG.add(m);all.push(m);}
   merged(trim,machined,'Console trim, machined',consoleG);}}

 /* ---- 4. THE COLUMN: shroud from the dash face, the hub that carries the quick-release, the paddles ---- */
 {const [h0,h1]=COCKPIT.hubX;
  const shroud=cyl(.085,.070,Math.max(.012,h0-COCKPIT.dashFaceDriver+.03),(h0+COCKPIT.dashFaceDriver)/2+.012,wheelY-.006,wheelZ,carbonMatte,'Column shroud',[0,0,Math.PI/2]);
  scaleUV(shroud.geometry,Math.PI*2*.078,Math.max(.012,h0-COCKPIT.dashFaceDriver+.03));   /* round and along, in metres */
  cyl(COCKPIT.hubR,COCKPIT.hubR,h1-h0,(h0+h1)/2,wheelY,wheelZ,black,'Column hub',[0,0,Math.PI/2],40);
  cyl(COCKPIT.hubR+.006,COCKPIT.hubR+.006,.012,h1-.004,wheelY,wheelZ,machined,'Hub ring',[0,0,Math.PI/2],48);
  for(let k=0;k<6;k++){const a=k*Math.PI/3;cyl(.006,.006,.008,h1+.002,wheelY+Math.cos(a)*(COCKPIT.hubR-.02),wheelZ+Math.sin(a)*(COCKPIT.hubR-.02),machined,'Hub bolt '+(k+1),[0,0,Math.PI/2],12);}
  [-1,1].forEach(q=>{const p=box(.008,.045,.13,wheelX-.045,wheelY-.02,wheelZ+q*.16,carbon,q<0?'Paddle, right':'Paddle, left');p.rotation.y=q*.35;});}

 /* ---- 5. THE BUTTONS ON THE WHEEL: four pods inside the rim, turning with it (setWheelAngle). v5.81: they sit on a
    carbon faceplate that fills the ring between the cog's valleys and the rim — the dark ring round the cog in
    Andrew's concept — each in a valley between two teeth, clear of the plates' artwork; a machined bezel round
    each button; the label printed under it at 9,800 px a metre. ---- */
 const wheelGroup=new T.Group();wheelGroup.position.set(wheelX,wheelY,wheelZ);interior.add(wheelGroup);
 {/* the faceplate: from just inside the teeth's roots (3.25, behind the plate) out to under the rim's inner edge, D-shaped like it */
  const Ro=(WHEEL.rimR-WHEEL.tube+.03)*CS,Ri=3.25*CS,flat=(WHEEL.flat+WHEEL.tube-.03)*CS;
  const outline=(R,f)=>{const pts=[];for(let i=0;i<120;i++){const a=i/120*Math.PI*2;let y=R*Math.sin(a);if(f!==null&&y<f)y=f;pts.push(new T.Vector2(R*Math.cos(a),y));}return pts;};   /* drawn in (−z, y): turned a quarter about y below, the shape's x lands on the wheel's −z, as the cog's does */
  const shp=new T.Shape(outline(Ro,flat));shp.holes.push(new T.Path(outline(Ri,null).reverse()));
  const fg=new T.ExtrudeGeometry(shp,{depth:.004,bevelEnabled:false,curveSegments:1});fg.rotateY(Math.PI/2);fg.translate(-.0255,0,0);
  const face=new T.Mesh(fg,carbon);face.name='Wheel faceplate';face.castShadow=face.receiveShadow=true;wheelGroup.add(face);all.push(face);}
 const bezels=[],labelTexW=Math.round(.024*COCKPIT.print.wheelLabel),labelTexH=Math.round(.0083*COCKPIT.print.wheelLabel);
 for(const b of COCKPIT.wheelButtons){
  /* the pod: a rounded block 26 × 34 mm standing on the faceplate, its face level with the cog's (x +.020) */
  const r=.005,pwid=.026,phig=.034,sh=new T.Shape();sh.moveTo(-pwid/2+r,-phig/2);sh.lineTo(pwid/2-r,-phig/2);sh.quadraticCurveTo(pwid/2,-phig/2,pwid/2,-phig/2+r);sh.lineTo(pwid/2,phig/2-r);sh.quadraticCurveTo(pwid/2,phig/2,pwid/2-r,phig/2);sh.lineTo(-pwid/2+r,phig/2);sh.quadraticCurveTo(-pwid/2,phig/2,-pwid/2,phig/2-r);sh.lineTo(-pwid/2,-phig/2+r);sh.quadraticCurveTo(-pwid/2,-phig/2,-pwid/2+r,-phig/2);
  const pg=new T.ExtrudeGeometry(sh,{depth:.040,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:2,curveSegments:5});pg.rotateY(Math.PI/2);pg.translate(-.0215,0,0);
  const pod=new T.Mesh(pg,carbon);pod.position.set(0,b.y,b.z);
  /* stood upright on the wheel, whatever valley it is in: the label reads level with the wheel straight */
  pod.name='Wheel pod '+b.id;pod.castShadow=true;wheelGroup.add(pod);all.push(pod);
  const cap=new T.Mesh(new T.CylinderGeometry(.0085,.0085,.006,24),new T.MeshPhysicalMaterial({color:b.color,roughness:.28,metalness:.05,clearcoat:.7,clearcoatRoughness:.15,emissive:b.color,emissiveIntensity:b.color==='#ff6a13'?.3:0}));cap.position.set(.0225,b.y+.005,b.z);cap.rotation.z=Math.PI/2;cap.name='Wheel button '+b.id;wheelGroup.add(cap);all.push(cap);
  {const bz=new T.TorusGeometry(.0102,.0019,10,32);bz.rotateY(Math.PI/2);bz.translate(.0205,b.y+.005,b.z);bezels.push(bz);}
  const cid=b.id==='N'?'NEUTRAL':b.id;if(!buttonCaps.has(cid))buttonCaps.set(cid,[]);buttonCaps.get(cid).push({cap,home:.0225});control(cap,{kind:'button',id:cid});control(pod,{kind:'button',id:cid});
  const label=canvasTexture(T,labelTexW,labelTexH,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#f3f4f2';g.font=`800 ${Math.round(h*.78)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';if('letterSpacing' in g)g.letterSpacing=Math.round(h*.06)+'px';g.fillText(b.id,w/2,h*.54);});
  const face=new T.Mesh(new T.PlaneGeometry(.024,.0083),label?new T.MeshStandardMaterial({map:label.texture,transparent:true,alphaTest:.05,roughness:.6,metalness:0,emissive:0xffffff,emissiveMap:label.texture,emissiveIntensity:.35,polygonOffset:true,polygonOffsetFactor:-1}):new T.MeshStandardMaterial({color:0xf3f4f2,transparent:true,opacity:0}));
  if(label){label.texture.generateMipmaps=true;label.texture.minFilter=T.LinearMipmapLinearFilter;}
  face.position.set(.0204,b.y-.0105,b.z);face.rotation.y=Math.PI/2;face.name='Wheel pod label '+b.id;wheelGroup.add(face);all.push(face);}
 merged(bezels,machined,'Wheel button bezels',wheelGroup);

 /* ---- 10. THE GAUGES (v5.80): three analogue dials on the dash beside the display — tacho, water, oil — a face
    drawn at build, a needle that sweeps with the machine's own state (setInstruments), a bezel each. v5.81: the
    faces at 384 px, the bezels machined, the pod carbon. ---- */
 const gauges={};
 {const G=[{id:'rpm',lab:'RPM ×1000',min:0,max:8,step:1,red:7},{id:'water',lab:'WATER °C',min:40,max:120,step:20,red:105},{id:'oil',lab:'OIL °C',min:40,max:140,step:20,red:125},{id:'speed',lab:'KM/H',min:0,max:300,step:50,red:null}];   /* v5.82 — the speedo: 0–300, no red band; car-app.js feeds it the road speed at the dial's revs in the lever's gear */
  const pod=new T.Group();pod.position.set(-.165,.925,-.084);   /* v5.82: four gauges, the pod 7.5 cm longer toward the passenger side, its driver's end where it was */pod.rotation.z=.30;interior.add(pod);   /* on the dash top, left of the display, leaning back to the eye like it */
  const put=(m,name)=>{m.name=name;m.castShadow=m.receiveShadow=true;metric(m);pod.add(m);all.push(m);return m;};
  put(new T.Mesh(new T.BoxGeometry(.03,.078,.30),carbonMatte),'Gauge pod');   /* matte: its face looks straight back past the driver at the hall's lit end, and a clear coat mirrored it (v5.81 stills) */
  G.forEach((g,i)=>{const z=.108-i*.072;
   const face=canvasTexture(T,384,384,(ctx,w,h)=>{ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,w,h);const cx=w/2,cy=h/2,R=w*.44,k=w/256;
    const ang=t=>(-135+270*t)*Math.PI/180;const N=Math.round((g.max-g.min)/g.step);
    if(g.red!=null){ctx.strokeStyle='#e8322a';ctx.lineWidth=9*k;ctx.beginPath();ctx.arc(cx,cy,R-4*k,ang((g.red-g.min)/(g.max-g.min))-Math.PI/2,ang(1)-Math.PI/2);ctx.stroke();}
    ctx.strokeStyle='#f3f4f2';ctx.lineWidth=3*k;for(let q=0;q<=N;q++){const t=q/N,a=ang(t)-Math.PI/2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(R-18*k),cy+Math.sin(a)*(R-18*k));ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.stroke();
     ctx.fillStyle='#f3f4f2';ctx.font=`700 ${Math.round(26*k)}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(g.min+q*g.step),cx+Math.cos(a)*(R-38*k),cy+Math.sin(a)*(R-38*k));}
    for(let q=0;q<N*2;q++){const a=ang(q/(N*2))-Math.PI/2;ctx.lineWidth=1.5*k;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(R-10*k),cy+Math.sin(a)*(R-10*k));ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.stroke();}
    ctx.fillStyle='#ff6a13';ctx.font=`700 ${Math.round(20*k)}px ${FONT}`;ctx.fillText(g.lab,cx,cy+R*.55);ctx.fillStyle='#9aa0a6';ctx.font=`600 ${Math.round(14*k)}px ${FONT}`;ctx.fillText('COATES · 26',cx,cy+R*.78);});
   const body=put(new T.Mesh(new T.CylinderGeometry(.031,.031,.010,40),black),cap(g.id)+' gauge body');body.position.set(.012,0,z);body.rotation.z=Math.PI/2;
   if(face){const f=put(new T.Mesh(new T.CircleGeometry(.0285,40),new T.MeshBasicMaterial({map:face.texture,toneMapped:false})),cap(g.id)+' gauge face');f.position.set(.0175,0,z);f.rotation.y=Math.PI/2;}
   const needle=new T.Group();needle.position.set(.019,0,z);pod.add(needle);
   const nm=new T.Mesh(new T.BoxGeometry(.0015,.026,.0022),orange);nm.position.set(0,.010,0);nm.name=cap(g.id)+' gauge needle';needle.add(nm);all.push(nm);
   const hub=new T.Mesh(new T.CylinderGeometry(.003,.003,.003,12),machined);hub.rotation.z=Math.PI/2;needle.add(hub);
   const bezel=put(new T.Mesh(new T.TorusGeometry(.0305,.0028,10,48),machined),cap(g.id)+' gauge bezel');bezel.position.set(.019,0,z);bezel.rotation.y=Math.PI/2;
   gauges[g.id]={needle,min:g.min,max:g.max,at:0};});}
 /* a needle's sweep: 0 at seven o'clock, full at five, clockwise to the eye looking into the face (+x toward it) */
 function setGauge(id,value){const g=gauges[id];if(!g)return;const t=Math.max(0,Math.min(1,(value-g.min)/(g.max-g.min)));g.at+=(t-g.at)*.35;g.needle.rotation.x=-(-135+270*g.at)*Math.PI/180;}

 /* ---- 6. THE CAGE: round tubes where a Supercar's are — the A-pillars along the screen's edges, the header
    under the roof's front, the roof rails, the main hoop behind the seats with its harness bar, the door
    intrusion bars in both doors and the dash bar. All inside the roof and the glass (measured). The original's
    thin cage boxes stay where they are, inside these. ---- */
 const RAIL_Y=1.09,HOOP_TOP=1.14;   /* the roof's inner skin is 1.13 at the rails (z ±.5) and 1.19 on the crown over the seats; the tubes run 2–5 cm under it */
 [-1,1].forEach(q=>{const z=q*(dz-.03);
  bar([-.30,.58,z],[.90,.98,z],.019,tube,'Door bar, front-low to rear-high');
  bar([-.30,.92,z],[.90,.55,z],.019,tube,'Door bar, front-high to rear-low');
  bar([-.30,.55,z],[-.30,.92,z],.019,tube,'Door bar, A-post');
  bar([-.34,.86,q*.56],[-.02,1.055,q*.50],.02,tube,'A-pillar tube');                 /* up the screen's edge, under the glass, to the header */
  bar([-.02,1.055,q*.50],[.95,RAIL_Y,q*.50],.02,tube,'Roof rail');
  bar([.95,RAIL_Y,q*.50],[.95,.42,q*.55],.02,tube,'Main hoop leg');
  bar([-.02,1.055,q*.50],[-.02,1.10,q*.12],.02,tube,'Screen header bar');              /* the header climbs to the screen's crown */
  bar([.95,RAIL_Y,q*.50],[.95,HOOP_TOP,0],.02,tube,'Main hoop, top');
  box(.018,.36,1.26,.32,.63,q*dz,carbonMatte,q<0?'Door card, driver':'Door card, passenger');});   /* up to the window sill, not into the window */
 bar([-.02,1.10,-.12],[-.02,1.10,.12],.02,tube,'Screen header bar, crown');
 bar([.95,.99,-.50],[.95,.99,.50],.02,tube,'Harness bar');
 bar([.95,RAIL_Y,-.50],[.95,.50,.50],.018,tube,'Main hoop diagonal');
 /* a matte lining under the roof's crown, so the cabin reads as a cabin and not as the outside of the roof */
 box(1.0,.008,.94,.45,1.122,0,black,'Roof lining');
 bar([-.36,.84,-dz+.02],[-.36,.84,dz-.02],.019,tube,'Dash bar');
 /* the gussets where the tubes meet */
 [-1,1].forEach(q=>{box(.05,.05,.02,-.02,1.055,q*.50,tube,'Gusset, header');box(.05,.05,.02,.95,RAIL_Y,q*.50,tube,'Gusset, hoop');});
 /* v5.81 — THE PADDING: SFI foam sleeves where the driver's body meets the cage — the two door bars beside his hip and
    shoulder, the driver's roof rail over his helmet, the main hoop leg behind his shoulder — one merged draw */
 {const z=-(dz-.03),P=[];const along=(a,b,t0,t1,r)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b);P.push(barGeo(A.clone().lerp(B,t0).toArray(),A.clone().lerp(B,t1).toArray(),r,18));};
  along([-.30,.58,z],[.90,.98,z],.30,.92,.034);along([-.30,.92,z],[.90,.55,z],.08,.62,.034);
  along([-.02,1.055,-.50],[.95,RAIL_Y,-.50],.25,.95,.034);along([.95,RAIL_Y,-.50],[.95,.42,-.55],.08,.62,.034);
  for(const g of P){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.21,uv.getY(i)*.6);}
  merged(P,padding,'Cage padding');}

 /* ---- 7. THE WIRING: the looms a race car carries in plain sight — the panel loom down the console to the
    tunnel and back to the seat, the dash loom under the dash bar with the display's cable into it, the door
    loom along the sill, each with its ties and a connector at the end ---- */
 loom([[-.235,.72,.15],[-.22,.64,.12],[-.15,.61,.09],[-.02,.60,.08],[.20,.59,.07],[.45,.56,.05]],.009,'Panel loom',{ties:4,connector:[.03,.018,.018]});
 loom([[-.40,.81,-.58],[-.41,.80,-.30],[-.41,.79,0],[-.41,.80,.30],[-.40,.81,.58]],.011,'Dash loom',{ties:5,connector:[.04,.024,.024]});
 loom([[-.21,.92,-.34],[-.30,.86,-.34],[-.39,.80,-.32]],.006,'Display cable',{ties:1});
 loom([[-.34,.82,.16],[-.30,.79,.16],[-.24,.76,.15]],.006,'Panel feed',{ties:1,mat:loomOrange});
 loom([[-.30,.47,-.60],[.10,.46,-.61],[.50,.46,-.61],[.90,.47,-.60]],.008,'Door loom',{ties:3,connector:[.03,.02,.02]});
 /* the battery isolator and the fuse block on the tunnel, where the panel loom lands */
 box(.06,.03,.05,.44,.62,.05,black,'Fuse block');cyl(.014,.014,.02,.30,.615,.06,red,'Battery isolator',[0,0,0],12);

 /* ---- 8. THE SEAT, THE HEAD RESTRAINT AND THE SIX-POINT HARNESS (the original's two boxes are inside). v5.81:
    the shells carbon, the pads suede, the belts woven webbing, the adjusters and the camlock machined. ---- */
 {const [z0,z1]=COCKPIT.seatZ,zc=(z0+z1)/2,w=z1-z0;
  box(.04,.60,w,.95,.78,zc,carbon,'Seat shell, back');
  box(.30,.05,w,.52,.475,zc,carbon,'Seat shell, base');
  box(.18,.16,w,.87,1.0,zc,seatCloth,'Head restraint');
  [z0,z1].forEach((z,i)=>{box(.20,.30,.03,.86,.93,z+(i?-.015:.015),seatCloth,'Head restraint wing');
   box(.42,.14,.05,.55,.57,z+(i?-.025:.025),seatCloth,'Base bolster');
   box(.20,.36,.04,.82,.75,z+(i?-.02:.02),seatCloth,'Back bolster');});
  const ribbon=(a,b,wid,name)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length();
   const m=new T.Mesh(new T.BoxGeometry(L,.004,wid),strap);m.position.copy(A).addScaledVector(d,.5);
   m.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),d.normalize());return add(m,name);};
  var driver=buildDriver(T,(g,name)=>{g.name=name;interior.add(g);},{x:wheelX,y:wheelY,z:wheelZ},{carbonMatte});
  [zc-.075,zc+.075].forEach((z,i)=>{ribbon([.93,.99,z],[.80,.96,z],.075,'Shoulder strap '+(i+1)+' over the top');ribbon([.80,.96,z],[.50,.88,z],.075,'Shoulder strap '+(i+1));ribbon([.50,.88,z],[.45,.70,z+(i?-.03:.03)],.07,'Shoulder strap '+(i+1)+' down the chest');ribbon([.45,.70,z+(i?-.03:.03)],[.50,.63,zc+(i?-.01:.01)],.06,'Shoulder strap '+(i+1)+' to the buckle');});
  ribbon([.44,.53,z0-.01],[.50,.63,zc-.02],.075,'Lap strap, right');ribbon([.44,.53,z1+.01],[.50,.63,zc+.02],.075,'Lap strap, left');
  ribbon([.44,.50,zc-.05],[.50,.62,zc],.05,'Crotch strap');ribbon([.44,.50,zc+.05],[.50,.62,zc],.05,'Crotch strap');
  /* the camlock: a machined disc with a raised centre and its lever, the belts' tongues into it */
  {const disc=new T.CylinderGeometry(.040,.042,.012,40),boss=new T.CylinderGeometry(.022,.026,.012,32),lever=new T.BoxGeometry(.012,.006,.05);boss.translate(0,.011,0);lever.translate(0,.019,.012);
   const g=[disc,boss,lever];const buckle=merged(g,machined,'Harness buckle');buckle.position.set(.495,.64,zc);buckle.rotation.set(0,0,.9);}
  /* the adjusters: a machined slide on each shoulder belt over the chest and each lap belt — one draw */
  {const A=[];for(const [x,y,z,rz] of [[.47,.79,zc-.075+.015,-1.3],[.47,.79,zc+.075-.015,-1.3],[.47,.58,z0+.03,-.9],[.47,.58,z1-.03,-.9]]){const g=new T.BoxGeometry(.012,.030,.085);const o=new T.Object3D();o.position.set(x,y,z);o.rotation.set(0,0,rz);o.updateMatrix();g.applyMatrix4(o.matrix);A.push(g);}
   merged(A,machined,'Harness adjusters');}}

 /* ---- 9. THE TUNNEL, THE SEQUENTIAL LEVER, THE HANDBRAKE. The lever is a Gen3-style sequential: pull back for
    the next gear up, push forward for the one below (setGear rocks it and it springs back to centre); the
    knob and the shaft are separate hits, so a finger says which. v5.81: the knob is a machined aluminium cylinder
    with its grip grooves, turned on a lathe, where the v5.80 one was a carbon ball. ---- */
 box(.72,.18,.26,-.02,.51,0,carbonMatte,'Tunnel');
 const shifter=new T.Group();shifter.position.set(.16,.60,-.04);shifter.rotation.z=.22;interior.add(shifter);
 let leverRock=0;
 {const boot=new T.Mesh(new T.CylinderGeometry(.02,.045,.06,20),seatCloth);boot.position.set(0,.03,0);boot.name='Lever boot';shifter.add(boot);all.push(boot);scaleUV(boot.geometry,.2,.06);
  const shaft=new T.Mesh(new T.CylinderGeometry(.010,.012,.19,16),machined);shaft.position.set(0,.135,0);shaft.name='Gear lever';shaft.castShadow=true;shifter.add(shaft);all.push(shaft);control(shaft,{kind:'shift',dir:-1});
  /* the knob's profile: a flat top with a chamfer, a straight body with four grooves, the neck into the collar */
  const prof=[[0,.040],[.012,.040],[.0165,.037],[.0175,.033]];for(let k=0;k<4;k++){const y=.028-k*.012;prof.push([.0175,y],[.0158,y-.003],[.0158,y-.005],[.0175,y-.008]);}prof.push([.0175,-.022],[.0150,-.030],[.0120,-.034],[0,-.034]);prof.reverse();   /* bottom to top, the way LatheGeometry faces outward */
  const knob=new T.Mesh(new T.LatheGeometry(prof.map(([r,y])=>new T.Vector2(r,y)),40),machined);knob.position.set(0,.245,0);knob.name='Gear knob';knob.castShadow=true;shifter.add(knob);all.push(knob);control(knob,{kind:'shift',dir:1});
  const collar=new T.Mesh(new T.CylinderGeometry(.013,.013,.02,24),orange);collar.position.set(0,.205,0);collar.name='Knob collar';shifter.add(collar);all.push(collar);
  /* v5.80 — the lever's base arm below its pivot, and the push-pull rod from it forward to the box's shift tower (layShiftRod lays it to the tower each frame; a shift moves it) */
  const baseArm=new T.Mesh(new T.CylinderGeometry(.007,.007,.05,10),machined);baseArm.position.set(0,-.02,0);baseArm.name='Lever base arm';shifter.add(baseArm);all.push(baseArm);
  const label=canvasTexture(T,512,146,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#ff6a13';g.font=`800 ${Math.round(h*.46)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('◄ UP · DOWN ►',w/2,h/2);});
  if(label){const face=new T.Mesh(new T.PlaneGeometry(.07,.02),new T.MeshStandardMaterial({map:label.texture,transparent:true,alphaTest:.05,roughness:.6,emissive:0xff6a13,emissiveMap:label.texture,emissiveIntensity:.25}));face.position.set(.18,.6125,-.04);face.rotation.set(-Math.PI/2,0,0);face.rotateZ(Math.PI/2);add(face,'Shift plate');}}
 box(.16,.024,.04,.16,.60,-.04,anodised,'Lever gate');
 cyl(.012,.010,.22,.34,.66,-.06,black,'Handbrake',[0,0,.6],12);
 cyl(.02,.02,.05,.26,.75,-.06,machined,'Handbrake grip',[0,0,.6],16);

 /* ---- 10. THE PEDAL BOX, in front of the firewall (x −.39), not through it ---- */
 /* ---- 9. THE PEDAL BOX (v5.80). Andrew Fisher, 24 Sep 2026: everything moves and moves the next thing.
    Three floor-hinged pedals on their arms with real throws — the throttle pressed by the throttle, the brake
    by the brake, the clutch by the starter (setPedals) — each with its return spring; the brake's and the
    clutch's master cylinders ahead of them on the box's front wall with their pushrods and lines; the
    throttle's cable up from its arm to the firewall, the far end of the same cable the engine's throttle
    lever pulls (engine-accessories.js). v5.81: the arms and pads machined aluminium, a black grip insert on each. ---- */
 const pedals={};
 {const bx=-.33,by=.42,bz=wheelZ;
  box(.12,.016,.30,bx,by,bz,black,'Pedal box floor plate');box(.014,.13,.30,bx-.06,by+.065,bz,black,'Pedal box front wall');
  [['clutch',.095],['brake',0],['throttle',-.095]].forEach(([id,oz])=>{
   const pivot=new T.Group();pivot.position.set(bx+.03,by+.012,bz+oz);interior.add(pivot);pedals[id]={pivot,press:0};
   const put=(m,name)=>{m.name=name;m.castShadow=m.receiveShadow=true;pivot.add(m);all.push(m);return m;};
   put(new T.Mesh(new T.CylinderGeometry(.008,.008,.04,16),machined),cap(id)+' pedal pivot pin').rotation.x=Math.PI/2;
   const arm=put(new T.Mesh(new T.BoxGeometry(.012,.16,.022),machined),cap(id)+' pedal arm');arm.position.set(0,.08,0);
   const pad=put(new T.Mesh(new T.BoxGeometry(.012,.055,id==='throttle'?.04:.06),machined),cap(id)+' pedal');pad.position.set(-.004,.15,0);pad.rotation.z=.22;
   const grip=put(new T.Mesh(new T.BoxGeometry(.003,.042,id==='throttle'?.028:.046),black),cap(id)+' pedal face');grip.position.set(-.011,.15,0);grip.rotation.z=.22;
   const spring=put(new T.Mesh(new T.CylinderGeometry(.007,.007,.045,10),alloy),cap(id)+' pedal return spring');spring.position.set(-.03,.06,0);spring.rotation.z=Math.PI/2;pedals[id].spring=spring;
   if(id!=='throttle'){cyl(.014,.014,.08,bx-.10,by+.10,bz+oz,alloy,cap(id)+' master cylinder',[0,0,Math.PI/2],14);cyl(.005,.005,.05,bx-.045,by+.10,bz+oz,black,cap(id)+' master cylinder pushrod',[0,0,Math.PI/2],10);
    cyl(.012,.012,.03,bx-.14,by+.115,bz+oz,alloy,cap(id)+' fluid reservoir',[0,0,0],12);}});
  loom([[bx-.145,by+.10,bz],[bx-.20,by+.12,bz-.02],[bx-.27,by+.18,bz-.04],[bx-.31,by+.26,bz-.05]],.003,'Brake line to the front calipers',{mat:alloy});
  loom([[bx-.145,by+.10,bz+.095],[bx-.20,by+.11,bz+.12],[bx-.27,by+.17,bz+.14],[bx-.31,by+.25,bz+.15]],.003,'Clutch line to the slave cylinder',{mat:alloy});
  loom([[bx+.02,by+.17,bz-.095],[bx-.06,by+.22,bz-.11],[bx-.16,by+.27,bz-.10],[bx-.27,by+.30,bz-.06],[bx-.31,by+.32,bz-.02]],.004,'Throttle cable to the firewall',{ties:2});}
 function setPedals(v){for(const id of ['throttle','brake','clutch']){const p=pedals[id];if(!p)continue;const t=Math.max(0,Math.min(1,(v&&v[id])||0));p.press=t;p.pivot.rotation.z=t*.40;p.spring.scale.y=1-t*.35;p.spring.position.x=-.03+t*.008;}}

 box(.20,.01,.34,-.22,.43,wheelZ,black,'Heel plate');

 /* ---- 11. THE MIRROR, THE FIRE BOTTLE, THE WINDOW NET. v5.81: the mirror a convex glass (a flat one magnifies a
    small patch of the garage's reflection until its pixels show); the bottle with its valve head, pull ring, gauge
    and label; the net woven, in the driver's window, in its orange border straps. ---- */
 let mirrorHousing=null;
  {const m=box(.02,.05,.28,0,1.10,-.02,carbonMatte,'Mirror housing');m.rotation.set(0,0,-.35);mirrorHousing=m;
  const fg=new T.SphereGeometry(1.2,24,6,Math.PI/2-.118,.236,Math.PI/2-.0175,.035);fg.translate(0,0,-1.2);fg.rotateY(Math.PI/2);   /* a patch of a 1.2 m sphere, convex to the driver */
  const f=new T.Mesh(fg,mirror);f.position.set(.011,0,0);m.add(f);f.name='Mirror face';}
 cyl(.06,.06,.32,.45,.50,.42,bottleRed,'Fire bottle',[0,0,Math.PI/2],32);
 [.36,.54].forEach((x,i)=>cyl(.064,.064,.02,x,.50,.42,machined,'Bottle band '+(i+1),[0,0,Math.PI/2],32));
 {const head=[];const neck=new T.CylinderGeometry(.022,.028,.03,20);neck.rotateZ(Math.PI/2);neck.translate(.625,.50,.42);head.push(neck);
  const valve=new T.BoxGeometry(.04,.035,.035);valve.translate(.655,.50,.42);head.push(valve);
  const pull=new T.TorusGeometry(.016,.0035,8,20);pull.rotateY(Math.PI/2);pull.translate(.655,.545,.42);head.push(pull);
  const outlet=new T.CylinderGeometry(.006,.006,.05,10);outlet.translate(.655,.475,.42);head.push(outlet);
  merged(head,machined,'Fire bottle valve head');
  const gaugeTex=canvasTexture(T,128,128,(g,w,h)=>{g.fillStyle='#f4f5f3';g.beginPath();g.arc(w/2,h/2,w*.48,0,Math.PI*2);g.fill();g.strokeStyle='#e5342a';g.lineWidth=w*.08;g.beginPath();g.arc(w/2,h/2,w*.36,Math.PI*.75,Math.PI*1.25);g.stroke();g.strokeStyle='#2ec46a';g.beginPath();g.arc(w/2,h/2,w*.36,Math.PI*1.25,Math.PI*1.75);g.stroke();g.strokeStyle='#111';g.lineWidth=w*.04;g.beginPath();g.moveTo(w/2,h/2);g.lineTo(w/2+w*.28,h/2-w*.18);g.stroke();});
  const gf=new T.Mesh(new T.CircleGeometry(.012,24),gaugeTex?new T.MeshStandardMaterial({map:gaugeTex.texture,roughness:.3}):black);gf.position.set(.655,.5185,.42);gf.rotation.x=-Math.PI/2;add(gf,'Fire bottle gauge');
  const labelTex=canvasTexture(T,1024,256,(g,w,h)=>{g.fillStyle='#b0141c';g.fillRect(0,0,w,h);g.fillStyle='#f4f5f3';g.fillRect(0,h*.18,w,h*.64);g.fillStyle='#111';g.font=`800 ${Math.round(h*.24)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('FIRE SUPPRESSION',w/2,h*.40);g.font=`700 ${Math.round(h*.15)}px ${FONT}`;g.fillText('CHECK GAUGE BEFORE EVERY RUN',w/2,h*.64);},{repeat:true});
  const lg=new T.CylinderGeometry(.0605,.0605,.14,40,1,true);if(labelTex)labelTex.texture.repeat.set(2,1);const lm=new T.Mesh(lg,labelTex?new T.MeshStandardMaterial({map:labelTex.texture,roughness:.4}):bottleRed);lm.position.set(.45,.50,.42);lm.rotation.set(0,0,Math.PI/2);add(lm,'Fire bottle label');}
 /* the net: tilted to the door glass (which leans in 26° — measured: z −.715 at y .84, −.645 at y 1.0), 20–40 mm
    inside it and outboard of the door bars, from the A-post to behind the driver's shoulder; the weave is a clear
    canvas with 12 mm cords at 45 mm, the border and the tie-downs are the orange straps */
 {const net=new T.Group();net.position.set(.37,.92,-.667);net.rotation.x=Math.atan2(.07,.16);interior.add(net);
  const NW=.74,NH=.17;
  const weave=canvasTexture(T,1024,236,(g,w,h)=>{g.clearRect(0,0,w,h);const px=w/NW,cell=.045*px,cord=.012*px;g.strokeStyle='#15171a';g.lineWidth=cord;g.lineCap='round';
   for(let x=-h;x<w+h;x+=cell){g.beginPath();g.moveTo(x,0);g.lineTo(x+h,h);g.stroke();g.beginPath();g.moveTo(x,h);g.lineTo(x+h,0);g.stroke();}});
  const netMat=weave?new T.MeshStandardMaterial({map:weave.texture,alphaTest:.45,transparent:false,side:T.DoubleSide,roughness:.9,metalness:0}):new T.MeshStandardMaterial({color:0x15171a,transparent:true,opacity:.35,side:T.DoubleSide});
  const plane=new T.Mesh(new T.PlaneGeometry(NW,NH),netMat);plane.name='Window net';plane.castShadow=true;net.add(plane);all.push(plane);
  const st=(w,h,x,y,name='Window net strap')=>{const m=new T.Mesh(new T.BoxGeometry(w,h,.004),strap);m.position.set(x,y,0);m.name=name;m.castShadow=true;metricUV(m.geometry);net.add(m);all.push(m);return m;};
  st(NW,.022,0,NH/2);st(NW,.022,0,-NH/2);st(.022,NH+.022,-NW/2,0);st(.022,NH+.022,NW/2,0);
  for(const x of [-.18,0,.18])st(.014,NH,x,0);
  st(.03,.07,-NW/2+.05,NH/2+.04);st(.03,.07,NW/2-.05,NH/2+.04);}

 /* ---- 12. THE CABIN'S OWN LIGHT (v5.81). A dash seen from the seat is lit by the day through the glass; in the
    garage the #26's cabin gets only what spills in past the pillars, which is why every still from the seat read the
    moulding as a black slab. A warm, soft point under the roof lining between the seats, ahead of the driver's head,
    at the brightness of the cog's own fill: it lights the deck, the panel and the wheel from where a work lamp
    would hang, casts no shadow and reaches nothing past the door. It hangs over the tunnel on the passenger's side
    of the driver's head, not ahead of it: from the eye, the display glass mirrors the roof just ahead of the driver,
    and a lamp there put a white spot in the middle of the screen (the first first-person still, 24 Sep). ---- */
 const cabinLight=new T.PointLight(0xffe4c4,1.6,1.9,1.5);cabinLight.name='Cabin fill light';cabinLight.position.set(.25,1.06,.12);cabinLight.castShadow=false;interior.add(cabinLight);

 /* ---- 13. THE CABIN'S SHADE ON THE REFLECTIONS (v5.81). The scene's environment is the garage captured from the car's
    place with the car taken away (car-app.js garageEnvironment), so every surface in here reflected the hall's white
    ceiling as if the #26 had no roof: the v5.81 carbon's first still read as light grey basket-weave. Inside the cabin
    most of what a surface sees is the cabin itself, dark, with the glass letting the hall in; so every material in the
    interior — the driver's too — takes CABIN_ENV of the environment's light, once. The display glass keeps all of it. ---- */
 const CABIN_ENV=.4;interior.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material))if(m&&'envMapIntensity' in m&&!m.userData.cabinEnv){m.envMapIntensity*=CABIN_ENV;m.userData.cabinEnv=true;}});
 interior.updateMatrixWorld(true);

 /* ---- the live parts: the display, the toggles, the buttons and the lever ---- */
 let lastDrawn=0,lastKey='';
 function setInstruments(st,now){
  /* v5.82 — the radio's window and LED follow the ignition and the channel */
  if(radioTex&&(!!st.ign!==radioState.ign||!!st.radio!==radioState.open)){radioState.ign=!!st.ign;radioState.open=!!st.radio;const c=radioTex.canvas;drawRadio(c.getContext('2d'),c.width,c.height,radioState);radioTex.texture.needsUpdate=true;if(radioLed)radioLed.material.emissiveIntensity=radioState.open?2.4:0;}
  if(!displayTex)return;now=now||0;
  const key=JSON.stringify([st.ign,st.running,st.starting,Math.round((st.rpm||0)/25),st.gear,Math.round(st.speed||0),Math.round(st.water||0),Math.round(st.oil||0),st.page,st.pit,st.fuel,st.fan,st.lights,st.radio]);
  if(key===lastKey||(now-lastDrawn<90&&lastKey))return;lastKey=key;lastDrawn=now;
  const c=displayTex.canvas;drawDisplay(c.getContext('2d'),c.width,c.height,st);displayTex.texture.needsUpdate=true;
 }
 function setWheelAngle(a){wheelGroup.rotation.x=a;}
 /* the pods leave the column with the rim they are bolted to (car-app.js spreads the wheel along the column in the cockpit) */
 function setWheelSpread(dx){wheelGroup.position.x=wheelX+(dx||0);}
 function setSwitch(id,on){const p=switchLevers.get(id);if(!p)return;if(p.userData.rotary)p.rotation.x=on?-1.35:0;else p.rotation.z=on?.5:-.5;if(id==='IGN'&&ignLamp)ignLamp.material.emissiveIntensity=on?2.6:0;}
 const pressed=new Map();
 function press(id){if(!buttonCaps.has(id))return;pressed.set(id,.18);}
 function setGear(g,dir){leverRock=dir>0?.24:dir<0?-.24:0;}
 /* the shift rod: a tube from the lever's base arm to the gearbox's shift tower, laid every frame so it follows the lever's rock */
 const shiftRod=new T.Mesh(new T.CylinderGeometry(.0055,.0055,1,10),alloy);shiftRod.name='Shift rod to the box';shiftRod.castShadow=true;interior.add(shiftRod);all.push(shiftRod);
 const rodEnd=new T.Mesh(new T.SphereGeometry(.009,10,8),black);rodEnd.name='Shift rod rose joint';interior.add(rodEnd);all.push(rodEnd);
 let rodTarget=null;const rodA=new T.Vector3(),rodD=new T.Vector3();
 function layShiftRod(target){if(target)rodTarget=(rodTarget||new T.Vector3()).copy(target);if(!rodTarget){shiftRod.visible=rodEnd.visible=false;return;}shiftRod.visible=rodEnd.visible=true;
  shifter.updateMatrixWorld(true);rodA.set(0,-.045,0);shifter.localToWorld(rodA);interior.worldToLocal(rodA);rodD.copy(rodTarget);interior.worldToLocal(rodD);rodD.sub(rodA);const L=rodD.length();
  shiftRod.position.copy(rodA).addScaledVector(rodD,.5);shiftRod.scale.set(1,L,1);shiftRod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),rodD.normalize());rodEnd.position.copy(rodA);}
 let rumbleT=0;
 function update(dt,st){
  for(const [id,left] of pressed){const t=Math.max(0,left-dt);pressed.set(id,t);for(const b of buttonCaps.get(id))b.cap.position.x=b.home-(t>0?.004:0);if(t<=0)pressed.delete(id);}
  if(Math.abs(leverRock)>1e-4){shifter.rotation.z=.18+leverRock;leverRock*=Math.max(0,1-dt*6);if(Math.abs(leverRock)<1e-3)leverRock=0;}else shifter.rotation.z=.18;
  /* the V8's rumble reaches the lever and the mirror: a shiver that grows with the revs (car-app passes the amplitude) */
  const r=(st&&st.rumble)||0;rumbleT+=dt*((st&&st.rumbleHz)||30);const sh=r*Math.sin(rumbleT*6.283),sh2=r*Math.sin(rumbleT*6.283*1.37+1);
  shifter.position.x=.16+sh*.6;shifter.position.z=-.04+sh2*.4;if(mirrorHousing){mirrorHousing.rotation.z=-.35+sh2*.35;}
  layShiftRod();
 }
 return {group:interior,meshes:all,materials:{carbon,carbonMatte,seatCloth,strap,machined,anodised,padding},driver,controls,setInstruments,setWheelAngle,setWheelSpread,setSwitch,press,setGear,update,wheelGroup,setPedals,setGauge,layShiftRod,pedals,gauges,cabinLight};
}
