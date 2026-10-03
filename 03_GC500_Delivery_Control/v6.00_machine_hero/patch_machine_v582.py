#!/usr/bin/env python3
"""The Coates Way machine v5.82 — the cockpit's radio, ignition and speedo (Andrew Fisher, 25 Sep 2026: 'the inside
needs to be more interactive. a radio. a ignition switch. the speedo meter'). Applied once to print/machine/dist."""
import os, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'handover_machine/print/machine/dist')

def rep(path, old, new, count=1):
    p = os.path.join(D, path); s = open(p, encoding='utf-8').read()
    n = s.count(old)
    if n != count: sys.exit(f'{path}: expected {count} of {old[:70]!r}, found {n}')
    open(p, 'w', encoding='utf-8').write(s.replace(old, new)); print('ok', path, old[:50].replace('\n', ' '))

# ---- 1. THE SPEEDO: a fourth gauge in the pod, km/h at the revs the rpm gauge shows, in the gear the lever is in ----
rep('car-cockpit.js',
    "{id:'oil',lab:'OIL °C',min:40,max:140,step:20,red:125}];",
    "{id:'oil',lab:'OIL °C',min:40,max:140,step:20,red:125},{id:'speed',lab:'KM/H',min:0,max:300,step:50,red:null}];   /* v5.82 — the speedo: 0–300, no red band; car-app.js feeds it the road speed at the dial's revs in the lever's gear */")
rep('car-cockpit.js',
    "const pod=new T.Group();pod.position.set(-.165,.925,-.12);",
    "const pod=new T.Group();pod.position.set(-.165,.925,-.084);   /* v5.82: four gauges, the pod 7.5 cm longer toward the passenger side, its driver's end where it was */")
rep('car-cockpit.js',
    "put(new T.Mesh(new T.BoxGeometry(.03,.078,.225),carbonMatte),'Gauge pod');",
    "put(new T.Mesh(new T.BoxGeometry(.03,.078,.30),carbonMatte),'Gauge pod');")
rep('car-cockpit.js',
    "G.forEach((g,i)=>{const z=.072-i*.072;",
    "G.forEach((g,i)=>{const z=.108-i*.072;")
rep('car-cockpit.js',
    "ctx.strokeStyle='#e8322a';ctx.lineWidth=9*k;ctx.beginPath();ctx.arc(cx,cy,R-4*k,ang((g.red-g.min)/(g.max-g.min))-Math.PI/2,ang(1)-Math.PI/2);ctx.stroke();",
    "if(g.red!=null){ctx.strokeStyle='#e8322a';ctx.lineWidth=9*k;ctx.beginPath();ctx.arc(cx,cy,R-4*k,ang((g.red-g.min)/(g.max-g.min))-Math.PI/2,ang(1)-Math.PI/2);ctx.stroke();}")
rep('car-app.js',
    "const PT={rpm:0,revs:0,gear:0,ratio:0,path:false,main:0,wheel:0,kmh:0,delta:0,wheelDelta:0};",
    "const PT={rpm:0,revs:0,gear:0,ratio:0,path:false,main:0,wheel:0,kmh:0,kmhDial:0,delta:0,wheelDelta:0};")
rep('car-app.js',
    " PT.main=PT.path?w/ratio:0;PT.wheel=PT.path?PT.main/fd:0;PT.kmh=PT.wheel*.33*3.6;",
    " PT.main=PT.path?w/ratio:0;PT.wheel=PT.path?PT.main/fd:0;PT.kmh=PT.wheel*.33*3.6;\n"
    " /* v5.82 — what the speedo and the display read: the road speed at the revs the rpm gauge shows (850–7,500 from the\n"
    "    inspection drive, as PT.rpm maps them), through the same box ratio and final drive to the same .33 m tyre. The\n"
    "    rollers, the audio and the wheels keep turning at the inspection speed itself (PT.kmh); the dials read the car. */\n"
    " PT.kmhDial=PT.path?(PT.rpm/60*Math.PI*2)/ratio/fd*.33*3.6:0;")
rep('car-app.js',
    "gear:COCKPIT.gears[cabin.gear],speed:PT.kmh,",
    "gear:COCKPIT.gears[cabin.gear],speed:PT.kmhDial,")
rep('car-app.js',
    "cockpit.setGauge('oil',cabin.oil);",
    "cockpit.setGauge('oil',cabin.oil);cockpit.setGauge('speed',PT.kmhDial);")
rep('car-cockpit.js',
    "text('KM/H · ROLLERS',1240,90,26,'#9aa3a8','right');",
    "text('KM/H',1240,90,26,'#9aa3a8','right');")

# ---- 2. THE RADIO: a crew radio head unit under the switch panel, the PTT the same RADIO the panel and the wheel pod operate ----
rep('car-cockpit.js',
    "function drawEngraved(g,w,h,textStr){",
    """/* v5.82 — THE RADIO'S CHANNEL WINDOW: an LCD strip on the head unit. Dark until the ignition is on; then the crew
   channel and the car's number, and TX in orange while the channel is open. */
export function drawRadio(g,w,h,st){
 st=st||{};const W=600,H=200;g.save();g.scale(w/W,h/H);
 g.fillStyle=st.ign?'#0f2a14':'#07090a';g.fillRect(0,0,W,H);g.strokeStyle='#1c2a1e';g.lineWidth=6;g.strokeRect(3,3,W-6,H-6);
 if(st.ign){const t=(s,x,y,size,col,align='left',weight=800)=>{g.fillStyle=col;g.font=`${weight} ${size}px ${FONT}`;g.textAlign=align;g.textBaseline='middle';g.fillText(s,x,y);};
  t('CREW',30,66,54,'#b7ffc4');t('CH 1',30,146,54,'#b7ffc4');t('26',W-30,66,54,'#b7ffc4','right');
  if(st.open){g.shadowColor='#ff6a13';g.shadowBlur=18;t('TX',W-30,146,54,'#ff6a13','right');g.shadowBlur=0;}else t('PTT',W-30,146,40,'#4f7a58','right',700);}
 g.restore();
}
function drawEngraved(g,w,h,textStr){""")
rep('car-cockpit.js',
    "   const cid=id==='PIT LIMIT'?'PIT':id;if(!buttonCaps.has(cid))buttonCaps.set(cid,[]);buttonCaps.get(cid).push({cap,home:.113});control(cap,{kind:'button',id:cid});});}",
    """   const cid=id==='PIT LIMIT'?'PIT':id;if(!buttonCaps.has(cid))buttonCaps.set(cid,[]);buttonCaps.get(cid).push({cap,home:.113});control(cap,{kind:'button',id:cid});});
  /* v5.82 — THE RADIO: a crew radio head unit on the console's face under the switch panel — a machined bezel, the
     channel window (drawRadio) that wakes with the ignition, a PTT key that opens the channel (the same RADIO the
     panel button and the wheel pod operate, so all three agree), a volume knob, a speaker grille and the LED that
     shows the channel open. The whole unit is a hit target: a finger anywhere on it keys the radio. */
  {const rx=.096,ry=-.125,rz=0;
   const unit=put(new T.Mesh(new T.BoxGeometry(.016,.056,.18),black),'Radio unit');unit.position.set(rx,ry,rz);unit.receiveShadow=true;control(unit,{kind:'button',id:'RADIO'});
   const bez=put(new T.Mesh(new T.BoxGeometry(.004,.062,.186),machined),'Radio bezel');bez.position.set(rx-.005,ry,rz);
   radioTex=canvasTexture(T,Math.round(.09*COCKPIT.print.panel),Math.round(.03*COCKPIT.print.panel),(g,w,h)=>drawRadio(g,w,h,radioState));
   if(radioTex){const win=new T.Mesh(new T.PlaneGeometry(.09,.03),new T.MeshBasicMaterial({map:radioTex.texture,toneMapped:false}));win.position.set(rx+.0082,ry+.008,rz+.030);win.rotation.y=Math.PI/2;win.name='Radio channel window';consoleG.add(win);all.push(win);control(win,{kind:'button',id:'RADIO'});}
   const ptt=put(new T.Mesh(new T.CylinderGeometry(.009,.009,.008,24),new T.MeshPhysicalMaterial({color:0xffb020,roughness:.3,metalness:.05,clearcoat:.6,clearcoatRoughness:.2,emissive:0xffb020,emissiveIntensity:.25})),'Radio PTT');ptt.position.set(rx+.012,ry-.014,rz+.064);ptt.rotation.z=Math.PI/2;
   if(!buttonCaps.has('RADIO'))buttonCaps.set('RADIO',[]);buttonCaps.get('RADIO').push({cap:ptt,home:rx+.012});control(ptt,{kind:'button',id:'RADIO'});
   const knob=put(new T.Mesh(new T.CylinderGeometry(.007,.0075,.010,20),machined),'Radio volume knob');knob.position.set(rx+.013,ry+.008,rz-.068);knob.rotation.z=Math.PI/2;
   const mark=new T.Mesh(new T.BoxGeometry(.002,.0012,.006),orange);mark.position.set(rx+.0185,ry+.008,rz-.068);mark.name='Radio volume mark';consoleG.add(mark);all.push(mark);
   radioLed=put(new T.Mesh(new T.SphereGeometry(.0035,12,10),new T.MeshStandardMaterial({color:0x3a1208,emissive:0xff3b1f,emissiveIntensity:0})),'Radio LED');radioLed.position.set(rx+.009,ry-.016,rz+.036);
   const holes=[];for(let i=0;i<19;i++){const a=i*2.399,rr=.0042*Math.sqrt(i);const hg=new T.CylinderGeometry(.0013,.0013,.002,8);hg.rotateZ(Math.PI/2);hg.translate(rx+.0085,ry-.010+Math.sin(a)*rr,rz-.032+Math.cos(a)*rr);holes.push(hg);}
   merged(holes,new T.MeshStandardMaterial({color:0x000000,roughness:1}),'Radio speaker grille',consoleG);
   /* the printed strip along the unit's foot */
   const lab=canvasTexture(T,Math.round(.12*COCKPIT.print.panel),Math.round(.008*COCKPIT.print.panel),(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#e9edef';g.font=`800 ${Math.round(h*.78)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('RADIO · CREW CHANNEL · PTT',w/2,h/2);});
   if(lab){const m=new T.Mesh(new T.PlaneGeometry(.12,.008),new T.MeshStandardMaterial({map:lab.texture,transparent:true,alphaTest:.02,roughness:.5,metalness:0,emissive:0xffffff,emissiveMap:lab.texture,emissiveIntensity:.06}));m.position.set(rx+.0082,ry-.0235,rz-.02);m.rotation.y=Math.PI/2;m.name='Radio label';consoleG.add(m);all.push(m);}}}""")
rep('car-cockpit.js',
    " const switchLevers=new Map(),buttonCaps=new Map();",
    " const switchLevers=new Map(),buttonCaps=new Map();let radioTex=null,radioLed=null,ignLamp=null;const radioState={ign:false,open:false};   /* v5.82 */")
rep('car-cockpit.js',
    " function setInstruments(st,now){\n  if(!displayTex)return;now=now||0;",
    """ function setInstruments(st,now){
  /* v5.82 — the radio's window and LED follow the ignition and the channel */
  if(radioTex&&(!!st.ign!==radioState.ign||!!st.radio!==radioState.open)){radioState.ign=!!st.ign;radioState.open=!!st.radio;const c=radioTex.canvas;drawRadio(c.getContext('2d'),c.width,c.height,radioState);radioTex.texture.needsUpdate=true;if(radioLed)radioLed.material.emissiveIntensity=radioState.open?2.4:0;}
  if(!displayTex)return;now=now||0;""")

# ---- 3. THE IGNITION: a key with a head you can see, a machined escutcheon, and the IGN lamp that lights with it ----
rep('car-cockpit.js',
    "    const ring=new T.Mesh(new T.TorusGeometry(.0065,.0015,6,14),orange);ring.position.set(.003,0,.030);pivot.add(ring);all.push(ring);ring.name='Ignition key ring';",
    """    /* v5.82 — the key's head: an orange tag with the car's number, a split ring through its eye, and the escutcheon the barrel sits in; the lamp above the barrel lights with the ignition */
    const head=new T.Mesh(new T.BoxGeometry(.0035,.021,.028),orange);head.position.set(.003,0,.038);head.name='Ignition key head';head.castShadow=true;pivot.add(head);all.push(head);control(head,{kind:'switch',id});
    const ring=new T.Mesh(new T.TorusGeometry(.0055,.0013,6,16),machined);ring.position.set(.003,0,.056);ring.rotation.y=Math.PI/2;pivot.add(ring);all.push(ring);ring.name='Ignition key ring';
    const tag=canvasTexture(T,160,224,(g,w,h)=>{g.fillStyle='#ff6a13';g.fillRect(0,0,w,h);g.fillStyle='#121417';g.font=`800 ${Math.round(h*.42)}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('26',w/2,h*.46);g.font=`800 ${Math.round(h*.11)}px ${FONT}`;g.fillText('COATES',w/2,h*.80);});
    if(tag){const face=new T.Mesh(new T.PlaneGeometry(.020,.027),new T.MeshStandardMaterial({map:tag.texture,roughness:.4,metalness:.1}));face.position.set(.0049,0,.038);face.rotation.y=Math.PI/2;face.rotation.z=-Math.PI/2;face.name='Ignition key tag';pivot.add(face);all.push(face);control(face,{kind:'switch',id});}
    const esc=put(new T.Mesh(new T.TorusGeometry(.0135,.0025,8,32),machined),'Ignition escutcheon');esc.position.set(.1045,y,z);esc.rotation.y=Math.PI/2;
    ignLamp=put(new T.Mesh(new T.CylinderGeometry(.0038,.0038,.004,16),new T.MeshStandardMaterial({color:0x2a0a05,emissive:0xff3b1f,emissiveIntensity:0})),'Ignition lamp');ignLamp.position.set(.104,y+.034,z);ignLamp.rotation.z=Math.PI/2;
    const lampRing=put(new T.Mesh(new T.TorusGeometry(.0045,.0012,6,16),machined),'Ignition lamp bezel');lampRing.position.set(.1045,y+.034,z);lampRing.rotation.y=Math.PI/2;""")
rep('car-cockpit.js',
    " function setSwitch(id,on){const p=switchLevers.get(id);if(!p)return;if(p.userData.rotary)p.rotation.x=on?-1.35:0;else p.rotation.z=on?.5:-.5;}",
    " function setSwitch(id,on){const p=switchLevers.get(id);if(!p)return;if(p.userData.rotary)p.rotation.x=on?-1.35:0;else p.rotation.z=on?.5:-.5;if(id==='IGN'&&ignLamp)ignLamp.material.emissiveIntensity=on?2.6:0;}")
print('machine v5.82 cockpit patch applied')
