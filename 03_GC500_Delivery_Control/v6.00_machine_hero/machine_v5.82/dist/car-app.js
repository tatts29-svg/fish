import {ENGINE_LAYOUT,ENGINE_FIT,cogPose,cogAxis,cogCouplingWorld,COG_UJ_SETBACK,COG_COUPLING_DEPTH,COCKPIT_EYE,COCKPIT_WHEEL_EYE} from './engine-kinematics.js';
import {CAR_REFERENCES} from './car-references.js';
import {connectionFor} from './part-connections.js';
import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {GTAOPass} from './vendor/addons/postprocessing/GTAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {PARTS,COG_REFERENCES} from './parts.js';
const RIM_PART=PARTS.findIndex(p=>p.name==='Steering wheel rim');let rimDx=0,shiftHand=0;/* the gear knob's resting place in the cabin (car-cockpit.js: the shifter at (.16,.60,−.04) leaning .18, the knob .245 up it) — where the left hand goes for a change */const KNOB={x:.116,y:.841,z:-.04};
import {buildModel,environment} from './model.js';
import {Drive} from './drive.js';
import {partPose} from './poses.js';
import {stageFraction,GEAR} from './gear-math.js';
import {KPIs,pillars,traits} from './content.js';
import {buildCarBody} from './car-body.js';
import {fitCarMechanics,COG_FIT} from './car-fit.js';
import {buildPowertrain} from './car-powertrain.js';
import {makeMaterials,buildStudio,addLivery,COATES_ORANGE} from './car-scene.js';
import {V8Audio,CLIP_IDS} from './v8-audio.js';
import {advanceWheel,resetWheels,WheelService,WHEEL_SERVICE} from './car-motion.js';
import {cogMeaning,COG_MEANING_LABEL,cogSectionAt} from './cog-meanings.js';
import {GARAGE} from './pit-garage.js';
import {COCKPIT} from './car-cockpit.js';
import {buildCrew} from './crew.js';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const materials=makeMaterials(),body=buildCarBody(T,materials),engine=buildPowertrain(T,materials);fitCarMechanics(T,body,engine);const carAssets=[...body.removable,...engine.removable];/* the cockpit's live parts — the display, the switches, the wheel's buttons, the lever (car-cockpit.js, built by the fit) */const cockpit=engine.removable.find(p=>p.id==='cockpit').cockpit;
const extraSpecs=carAssets.map((p,n)=>({id:p.id,ref:CAR_REFERENCES[p.id],name:p.name,index:PARTS.length+n,rotates:false,ratio:0,base:p.home.slice(),open:p.home.map((v,k)=>v+p.pull[k]),category:n<body.removable.length?'Car body & wheels':'V8 & drivetrain',description:carDescription(p),stage:n<body.removable.length?[0,.45]:[.25,1]}));
const specs=[...PARTS,...extraSpecs],drive=new Drive(specs.length,specs.map(p=>p.rotates),specs),audio=new V8Audio();
const extraIndex=new Map(carAssets.map((p,n)=>[p.id,PARTS.length+n]));
/* v5.81 — THE WHEEL SERVICE (car-motion.js WheelService; Andrew Fisher's workshop brief, 24 Sep 2026). `service` is the one state
   machine: ready → isolated → supported → wheelOff → inspect → refit → ready, a step at a time from the dock's Service button or W,
   each refused with its reason when the machine's state does not allow it. The kit (two jack stands and the wheel stand) is the
   garage's, attached when the garage is built. The fastening check at the end of a refit plays the approved wheel-gun clip if one
   is in the pack (v8-audio.js CLIP_IDS) — there is none, so it is silent and the dock says it. */
const service=new WheelService(body.wheels,{onTorque:()=>{if(CLIP_IDS.includes('wheel-gun'))sfx('wheel-gun');serviceNote='Nut torqued — fastening confirmed';}});
let serviceNote='',serviceNoteAt=0;
let crew=null,renderer,scene,camera,controls,cog,ready=false,failed=false,quality='laptop',view='car',selected=0,isolated=false,cutaway=true,slow=false,power=false,tour=-1,camTween=null;
let lastFrame=0,lastRender=0,uiTime=0,frameCount=0,fpsTime=0,fps=0,previousAngle=0,throttle=.25,brake=0,drag=null,toastTimer,resizeObserver;
const parts=[],pickables=[],exhibits=[],pointer=new T.Vector2(),raycaster=new T.Raycaster(),scratch=new T.Vector3(),axis=new T.Vector3(0,0,1),yAxis=new T.Vector3(0,1,0),tempQuat=new T.Quaternion(),selectionBox=new T.Box3();
let highlight,followPart=false,powerLine=null,powerDots=null,assemblyFit=false;
const fixedSupports=[...body.root.children,...engine.root.children].filter(g=>!carAssets.some(p=>p.group===g));
const powerMatrix=new T.Matrix4();
function carDescription(p){return connectionFor(p).role;}
/* In the car the V8 is the motor. The Coates Way machine's own electric motor, its mounting base and its
   reduction gearbox and clutch would stand in the nose where nothing of the sort belongs, so the car and
   engine views keep the plates and their drive line (CG and DR references) and leave the rest to the cog
   view, where the whole 128-part mechanism still works exactly as supplied. A hidden part still answers a
   search and shows itself when selected. */
/* v5.80 — nothing of the mechanism is hidden in the car any more: the motor, planetary set, clutch and mounting are the column's assist unit, on the shaft under the dash (Andrew Fisher, 24 Sep 2026: many parts, each moving the next) */function carHidesCogPart(p){return false;}
/* the parts that ride the column pivot (the mechanism behind the coupling), placed down the steering shaft */const COLUMN_PART=p=>!!p&&/^CW-(MT|BS|GB|CL)-/.test(p.ref||'');let columnPivot=null,columnGroup=null;const COLUMN_DOWN_SHAFT=7.0;   /* model units past the universal joint before the clutch begins: the unit sits under the dash, above the pedal box */
/* Andrew Fisher, 23 Sep 2026: the cog is not on a stand — the cog view hangs the machine on its shaft like the
   car does, without the supplied base plate and pedestal blocks. The base stays in the register and shows itself
   when selected. */

function renderConnections(p){
 const panel=$('part-connections');panel.replaceChildren();
 const a=carAssets.find(a=>a.id===p.id);
 if(!a){/* one of the 128 machine parts: say what it stands for, and say that it is a teaching link */
  const m=cogMeaning(p),label=document.createElement('strong');label.textContent=COG_MEANING_LABEL;panel.append(label);
  const word=document.createElement('button');word.className='cog-link';word.textContent=m.word;word.title=m.kind;
  const ref=COG_REFERENCES.find(r=>r.label===m.word);if(ref)word.onclick=()=>{setView('cog');selectPart(ref.part,{focus:true});};else word.disabled=false;
  panel.append(word);const note=document.createElement('p');note.className='meaning';note.textContent=m.note;panel.append(note);return;}
 const c=connectionFor(a),label=document.createElement('strong');label.textContent='Connected parts';panel.append(label);
 for(const id of c.drives){const i=extraIndex.get(id);if(i===undefined)continue;const b=document.createElement('button');b.textContent=specs[i].name;b.onclick=()=>selectPart(i,{focus:true});panel.append(b);}
 const word=COG_REFERENCES.find(r=>r.label===c.cog);
 if(word){const b=document.createElement('button');b.className='cog-link';b.textContent='Cog link: '+word.label;b.title='Suggested teaching association';b.onclick=()=>{setView('cog');selectPart(word.part,{focus:true});};panel.append(b);}
}

/* one of the approved clips, once; nothing happens when sound is off or the clip has not been shipped yet */
function sfx(id,level=1){try{audio.play(id,level);}catch(e){}}
let lastDriveStatus='';
function toast(s){$('toast').textContent=s;$('toast').classList.add('visible');$('announcement').textContent=s;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
const ringNames=['Centre','Performance pillars','Scorecard & cadence','Seven traits'];
$('rings').innerHTML=ringNames.map((n,i)=>`<button class="ring ${i===0?'selected':''}" data-part="${i}" aria-pressed="${i===0}"><span class="symbol">${['◎','◇','∿','⚙'][i]}</span><span class="name">${n}</span><span class="connection"><i></i><span>Connected</span></span></button>`).join('');
$('rings').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(+b.dataset.part,{focus:true});});
function allVisible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
function partConnected(i){return drive.connected(i);}
function selectPart(i,{focus=false}={}){const changed=selected!==Math.max(0,Math.min(specs.length-1,i));selected=Math.max(0,Math.min(specs.length-1,i));if(changed&&ready)sfx('ui-select',.5);const p=specs[selected];if(selected>=PARTS.length&&view==='engine'&&p.category==='Car body & wheels'&&carAssets[selected-PARTS.length].group.userData.role!=='wheel')setView('car');$('selected-ref').textContent=p.ref;$('selected-name').textContent=p.name;$('selected-description').textContent=p.description;renderConnections(p);$('learn').hidden=selected>3;$('turn').value=0;$('turn-label').textContent='0°';$('pull').value=drive.pullTargets[selected];$('pull-label').textContent=drive.connected(selected)?'Connected':'Withdrawn';document.querySelectorAll('#rings [data-part]').forEach(b=>{const on=+b.dataset.part===selected;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});if(ready){updateVisibility();if(focus)fit('part');}updateUI();}
function setView(next){/* v5.81 — the V8 keeps running across a view change: a dyno run is watched from the seat, from the hall and over the engine without stopping it (the brief's slice, end to end). Only a change that needs the parts back together stops the drive, and reassemble() does that itself. */if(ready&&next!==view&&(next==='cog'||view==='cog')&&(drive.spreadTarget>.01||drive.pullTargets.some(v=>v>0))){drive.reassemble();assemblyFit=true;}if(ready&&next!==view)sfx(next==='cog'?'ui-confirm':'ui-select',.5);view=next;isolated=false;hideExhibit();followPart=false;$('isolate').textContent='Isolate';$('isolate').setAttribute('aria-pressed',false);document.querySelectorAll('[data-view]').forEach(b=>{const on=b.dataset.view===next;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});$('scene-kicker').textContent={car:'01 / CONNECTED PERFORMANCE',engine:'02 / THE POWER WITHIN',cog:'03 / EVERY PART MATTERS'}[next];$('scene-description').textContent=next==='car'?`Coates #26 · ${cutaway?'Cutaway':'Complete body'}`:next==='engine'?'V8, transmission & running gear':'In the driver\'s seat · the Coates Way wheel';$('body-mode').hidden=next==='cog';$('cockpit-tools').hidden=false;/* v5.81 — steer, the gear and the panel readout in every view: the dyno run is driven from the hall too */applyViewCamera();updateVisibility();if(ready)fit(next);}
/* the cockpit is seen through a wider lens than the car — a helmet's field, not a long lens from across the
   garage — and the orbit is allowed to look down at the lever and up at the cage */
function applyViewCamera(){if(!camera)return;const inside=view==='cog';camera.fov=inside?COCKPIT_EYE.fov:LOOK.fov;camera.updateProjectionMatrix();controls.maxPolarAngle=inside?Math.PI*.66:Math.PI*.485;controls.minPolarAngle=inside?Math.PI*.22:.04;controls.minDistance=inside?.08:controls.minDistance;controls.maxDistance=inside?1.1:16;}
let lastFrameStart=0,lastDt=1/60,cogDeploy=0,cogKey=null,cogFill=null,powerPathDeploy=-1;
/* the camera stays in the garage and on the apron in front of it — Andrew Fisher, 23 Sep 2026: looking round
   took the camera out of the pit and lost. Applied after the controls every frame, so an orbit into a wall
   slides along it and a zoom out stops at the door. In the cockpit it stays in the cabin: not through the roof,
   the door glass or the screen. */
function confineCamera(){const G=GARAGE,p=camera.position,t=controls.target,m=.35;
 if(view==='cog'){/* the cabin, both seats' worth of it: the passenger's side is where the exhibit eye stands when the wheel is apart */p.x=Math.max(.02,Math.min(.62,p.x));p.y=Math.max(.80,Math.min(1.12,p.y));p.z=Math.max(-.50,Math.min(.28,p.z));t.x=Math.max(-.60,Math.min(.95,t.x));t.y=Math.max(.40,Math.min(1.15,t.y));t.z=Math.max(-.66,Math.min(.66,t.z));return;}
 p.x=Math.max(G.pitWall+1.6,Math.min(G.back-m,p.x));p.z=Math.max(G.far+m,Math.min(G.near-m,p.z));p.y=Math.max(.12,Math.min(p.x>G.front?G.height-.3:7,p.y));
 t.x=Math.max(G.front-4,Math.min(G.back-m,t.x));t.z=Math.max(G.far+m,Math.min(G.near-m,t.z));t.y=Math.max(0,Math.min(G.height-.5,t.y));}
/* THE WHEEL IN THE DRIVER'S HANDS. The machine is the #26's steering wheel: its plates do not turn with the
   drive — the root is counter-turned by the drive's own angle, so the cog, its bolts, rim and spokes sit still
   as one rigid thing while the V8 runs — and it turns with the person: a drag on the wheel (input) or the Steer
   slider sets `steer`, the wheel's angle, positive clockwise as the driver sees it; the steering shaft, the
   rack, the tie rods and the front wheels follow (updateTransforms), and a small sway of the driver's hands
   plays over it while the V8 runs. STEER_RATIO is a quick race rack: 2.1 turns lock to lock does not exist
   here — ±120° at the wheel is ±18° at the road wheel. Andrew Fisher, 23 Sep 2026: turning the wheel steers.
   Nothing is deployed any more; cogDeploy stays 0 for the harness that used to read it (window.__cw.deploy). */
const STEER_MAX=Math.PI*2/3,STEER_ROAD=18*Math.PI/180;
let steer=0,steerT=0,steerHeld=false;
function steerSway(dt){steerT+=dt;if(steerHeld||!drive.running&&drive.stationary)return 0;const a=Math.min(1,drive.omega/.48);return a*(Math.sin(steerT*2.3)*.028+Math.sin(steerT*.7+1.3)*.018);}
function setSteer(a){steer=Math.max(-STEER_MAX,Math.min(STEER_MAX,a||0));const el=$('steer');if(el&&document.activeElement!==el)el.value=Math.round(steer/STEER_MAX*100);$('steer-value').textContent=Math.round(steer*180/Math.PI)+'°';}
function wheelAngle(){return steer+steerSwayNow;}
let steerSwayNow=0;
/* THE COCKPIT'S SYSTEMS — what the switches and buttons operate (Andrew Fisher: the switches operate systems).
   IGN wakes the display and is needed to start; FUEL is the pump and is needed to start; FAN forces the radiator
   fans on with the V8 off; LIGHTS lights the nose; PIT LIMIT holds the V8 under 40 % throttle; RADIO opens the
   crew channel (sound on); PAGE flips the display; N puts the box in neutral. Water and oil warm with the running
   V8 and cool with it off — the machine's own state, not a car's telemetry. */
const cabin={ign:false,fuel:false,fan:false,lights:false,pit:false,radio:false,page:0,gear:0,water:22,oil:22};
let cockpitLights=null;
function cockpitState(){return {ign:cabin.ign,running:drive.running&&drive.omega>1e-3,starting:drive.starting,rpm:PT.rpm,rpmMax:7500,gear:COCKPIT.gears[cabin.gear],speed:PT.kmhDial,water:cabin.water,oil:cabin.oil,page:cabin.page,pit:cabin.pit,fuel:cabin.fuel,fan:cabin.fan,fanAuto:!cabin.fan,lights:cabin.lights,radio:cabin.radio,targets:KPIs};}
/* v5.81 — ONE POWERTRAIN STATE (Andrew Fisher's workshop brief, 24 Sep 2026: engine rpm, gauges, gears, wheels and
   sound share one state, and revs in neutral do not drive the wheels). Until now the rpm, the dash's km/h, the wheels, the
   dyno rollers, the audio's wheel speed and the prop shaft each scaled `drive.omega` their own way — the rollers at
   a fixed first-gear ratio whatever the lever said, so in neutral the tyres stood still while the rollers turned
   under them, and all four wheels were driven on a rear-wheel dyno. Now `powertrain()` is worked out once a frame
   from the drive, the lever and the clutch, and every reader takes its number from here:
     crank (drive.omega, the inspection speed) → the box at the engaged gear's rate (engine.gearRateOf, the box's own
     geometry) → the prop shaft → the final drive (engine.finalDrive) → the REAR hubs → the rollers at the tyre's
     surface speed; the fronts sit in their chocks. In neutral, or with the clutch in while the V8 catches, the
     path is open and everything past the box holds; the revs still rise and fall. The rpm gauge, the display's
     km/h (a .33 m tyre), the rollers, the audio's wheel speed and the rumble read the same figures. Brake loads the
     whole line (drive.speed, in frame()), not the wheels alone. */
const PT={rpm:0,revs:0,gear:0,ratio:0,path:false,main:0,wheel:0,kmh:0,kmhDial:0,delta:0,wheelDelta:0};
let ptAngle=null;
function gearRatio(g){const r=engine&&engine.gearRateOf?engine.gearRateOf(g):0;return r>0?1/r:0;}
function powertrain(){const w=drive.omega,g=cabin.gear,ratio=gearRatio(g);PT.gear=g;PT.ratio=ratio;PT.revs=w>1e-3?Math.min(1,w/5.064):0;PT.rpm=w>1e-3?850+PT.revs*6650:0;
 PT.path=g>0&&ratio>0&&!drive.starting&&drive.assembled;const fd=engine&&engine.finalDrive||3.9;
 PT.main=PT.path?w/ratio:0;PT.wheel=PT.path?PT.main/fd:0;PT.kmh=PT.wheel*.33*3.6;
 /* v5.82 — what the speedo and the display read: the road speed at the revs the rpm gauge shows (850–7,500 from the
    inspection drive, as PT.rpm maps them), through the same box ratio and final drive to the same .33 m tyre. The
    rollers, the audio and the wheels keep turning at the inspection speed itself (PT.kmh); the dials read the car. */
 PT.kmhDial=PT.path?(PT.rpm/60*Math.PI*2)/ratio/fd*.33*3.6:0;
 const a=drive.angle;PT.delta=ptAngle===null?0:a-ptAngle;ptAngle=a;PT.wheelDelta=PT.path?PT.delta/(ratio*fd):0;}
function rollerSpeed(){return PT.kmh;}
/* what the crew are told each frame (v5.81): whether the V8 runs, its revs (the machine's own), and nothing they could not see */
function crewState(){return {running:drive.running&&drive.omega>1e-3,rpm:PT.rpm};}
/* the harness's fast-forward: the drive, the service and the crew stepped on without rendering (a software renderer takes seconds a frame; the crew's walks take tens of seconds).
   `until`, if given, is asked before every step and stops it at the first step it is true (the tests wait on the crew this way: a moment is caught to the
   step, and the parts and the dock are brought up to date once, at the end, not once a step) */
function advance(sec,step=1/30,until=null){const n=Math.max(1,Math.round(sec/step));let i=0;for(;i<n;i++){if(until&&until())break;drive.speed=(.55+Math.min(throttle,cabin.pit?.4:1)*10)*(1-brake*.8);drive.advance(step);service.update(step);powertrain();if(crew)crew.update(step,crewState());}updateTransforms();updateUI();return {phase:service.phase,moving:service.moving,hold:service.hold,steps:i,met:until?!!until():null};}
function warmEngine(dt){const on=drive.running&&drive.omega>1e-3;const targetW=on?88:22,targetO=on?96:22,k=on?dt/40:dt/120;cabin.water+=(targetW-cabin.water)*Math.min(1,k);cabin.oil+=(targetO-cabin.oil)*Math.min(1,k*.8);}
function setSwitch(id,on){cabin[id.toLowerCase()]=on;cockpit.setSwitch(id,on);sfx('ui-select',.4);if(id==='LIGHTS'&&cockpitLights)cockpitLights.visible=on;updateUI();}
function operate(c){if(!c)return;
 if(c.kind==='switch'){const id=c.id,now=!cabin[id.toLowerCase()];setSwitch(id,now);toast({IGN:now?'Ignition on. The display is awake.':'Ignition off.',FUEL:now?'Fuel pump on.':'Fuel pump off.',FAN:now?'Radiator fans on, whatever the V8 does.':'Fans back to the V8.',LIGHTS:now?'Lights on.':'Lights off.'}[id]);return;}
 if(c.kind==='button'){cockpit.press(c.id);
  if(c.id==='START'){if(!cabin.ign){sfx('ui-denied');toast('Ignition first — the IGN toggle on the panel.');return;}if(!cabin.fuel){sfx('ui-denied');toast('No fuel pressure — the FUEL toggle on the panel.');return;}toggleStart();return;}
  if(c.id==='PIT'){cabin.pit=!cabin.pit;sfx('ui-select',.4);toast(cabin.pit?'Pit limiter on: the V8 is held under 40 % throttle.':'Pit limiter off.');updateUI();return;}
  if(c.id==='RADIO'){cabin.radio=!cabin.radio;sfx('ui-select',.4);if(cabin.radio&&!audio.enabled)$('sound').click();toast(cabin.radio?'Radio open to the crew.':'Radio closed.');return;}
  if(c.id==='PAGE'){cabin.page=(cabin.page+1)%3;sfx('ui-select',.4);toast(['Display: race page.','Display: systems page.','Display: the Coates Way targets — every part matters.'][cabin.page]);return;}
  if(c.id==='NEUTRAL'){shiftTo(0);return;}}
 if(c.kind==='shift'){shiftTo(cabin.gear+c.dir);return;}}
function shiftTo(g){g=Math.max(0,Math.min(COCKPIT.gears.length-1,g));const dir=Math.sign(g-cabin.gear);if(g===cabin.gear){sfx('ui-denied',.5);toast(g?'Top gear already.':'Neutral already.');return;}cabin.gear=g;cockpit.setGear(g,dir);if(engine.setGear)engine.setGear(g);drive.shift();shiftHand=1;sfx('dog-engage',.7);toast(g?`Gear ${COCKPIT.gears[g]}${dir>0?' — pull back for the next':' — push forward for the one below'}.`:'Neutral.');updateUI();}
function applyCogPose(p,dt=0){
 cog.root.position.set(p.x,p.y,p.z||0);cog.root.scale.setScalar(p.scale);
 cog.root.rotation.set(0,p.yaw,p.pitch,'ZYX');
 steerSwayNow=steerSway(dt);const a=wheelAngle();
 /* the plates' own drive angle is undone, then the wheel's angle put on; positive steer is clockwise to the
    driver, which is a negative turn about the plates' facing axis */
 if(engine.frontDrive.setSteer)engine.frontDrive.setSteer(a);
 if(cockpit)cockpit.setWheelAngle(-a);
 cog.root.updateMatrixWorld(true);
 return {x:p.x,y:p.y,z:p.z||0,scale:p.scale,yaw:p.yaw,pitch:p.pitch};
}
function placeCog(dt){
 const w=applyCogPose(cogPose(0),dt),{x,y,z}=w;
 /* the shaft's wheel-end joint: just behind the machine's coupling, along the column */
 const c=cogCouplingWorld(w);
 engine.frontDrive.layShaft({x:(c.x-c.ax.x*COG_UJ_SETBACK-ENGINE_FIT.x)/ENGINE_FIT.scale,y:(c.y-c.ax.y*COG_UJ_SETBACK)/ENGINE_FIT.scale,z:(c.z-c.ax.z*COG_UJ_SETBACK)/ENGINE_FIT.scale});
 /* the column's assist unit lies along the shaft: the pivot at the joint turns the mechanism's axis from the wheel's line onto the shaft's */if(columnPivot&&engine.frontDrive.shaftDir){const d=engine.frontDrive.shaftDir;scratch.set(-d.x,-d.y,-d.z);cog.root.getWorldQuaternion(tempQuat);scratch.applyQuaternion(tempQuat.invert()).normalize();columnPivot.quaternion.setFromUnitVectors(axis.clone().negate(),scratch);}
 /* the cog's own light stands on the driver's side of the wheel, turned down: a 34-unit spot would burn the seats */
 if(cogKey){const ax=cogAxis(w.yaw,w.pitch);const apart=view==='cog'&&drive.spread>.01;/* with the wheel apart the key comes down into the cabin, three-quarters on from the passenger's side, so the separated plates are lit the way the exhibit lit the cog on its axis */if(apart){const k=Math.min(1,drive.spread*2);cogKey.position.set(x+ax.x*(1.25-.45*k),y+.85-.25*k,z+ax.z*(1.25-.45*k)+.40*k);cogKey.target.position.set(x+ax.x*.15*k,y+.05*k,z);cogKey.intensity=3+2.5*k;cogFill.position.set(x+ax.x*.60,y+.12,z+ax.z*.6+.25*k);cogFill.intensity=1.2+.8*k;}else{/* v5.81 — over the passenger's shoulder, not straight behind the driver's head: from the driver's eye the display's glass mirrors the roof behind him, and the key there was a white disc in the middle of the screen */cogKey.position.set(x+ax.x*1.0,y+.55,z+ax.z*1.0+.50);cogKey.target.position.set(x,y,z);cogKey.intensity=3;cogFill.position.set(x+ax.x*.60,y+.12,z+ax.z*.6);cogFill.intensity=1.2;}}
 if(powerLine&&powerPathDeploy<0)rebuildPowerPath(x,y);
 return {x,y,z,scale:w.scale};
}
function updateVisibility(){if(!ready)return;body.root.visible=true;engine.root.visible=true;cog.root.visible=true;if(studioRoot&&studioRoot.userData.fittings)studioRoot.userData.fittings.visible=true;
/* in the driver's seat the driver is you: his model is taken out of the seat, and put back in every other view */
if(cockpit&&cockpit.driver){cockpit.driver.visible=!isolated;/* first person only while the camera is at the driver's eye: across the cabin (the wheel apart) he is a person in his seat, helmet on */if(cockpit.driver.userData.setFirstPerson)cockpit.driver.userData.setFirstPerson(view==='cog'&&camera&&camera.position.distanceTo(scratch.set(COCKPIT_EYE.x,COCKPIT_EYE.y,COCKPIT_EYE.z))<.16);}
for(let i=0;i<parts.length;i++){const p=parts[i];let visible=true;if(i<PARTS.length){visible=!isolated||selected===i;const host=p.mount??i;if(i!==selected&&(carHidesCogPart(p)||host!==i&&carHidesCogPart(specs[host])))visible=false;}else{const car=carAssets[i-PARTS.length],role=car.group.userData.role,side=car.group.userData.side;if(role==='door'&&side==='near')body.setDoorCutaway(cutaway&&view==='car'&&drive.spread<.03&&drive.pulls[i]<.01&&i!==selected&&!isolated);if(isolated)visible=i===selected;else if(view==='engine'&&p.category==='Car body & wheels')visible=role==='wheel';else if(cutaway&&view!=='cog'&&drive.spread<.03&&drive.pulls[i]<.01&&i!==selected){if(role==='bonnet'||role==='front-bumper'||role==='front-fender'&&side==='near')visible=false;if(/airbox|valve-cover|cooling-system|radiator-fan/.test(car.id))visible=false;}}
p.group.visible=visible;}
for(const support of fixedSupports)support.visible=!isolated;if(crew)crew.root.visible=!isolated;
if(isolated){body.root.visible=selected>=PARTS.length&&selected<PARTS.length+body.removable.length;engine.root.visible=selected>=PARTS.length+body.removable.length;cog.root.visible=selected<PARTS.length;}
if(powerLine)powerLine.visible=power&&view!=='cog'&&!isolated;if(powerDots)powerDots.visible=powerLine.visible;}
/* THE COLUMN TURNS WITH THE STEERING, NOT THE ENGINE (v5.80). The drive integrates every cog part from the crank's
   angle, with the mechanism's own ratios (output 1, sun and rotor 4, planets −2, the bearing balls orbiting at
   their cage rates); on the car the same kinematics belong to the wheel. So each part's crank-driven rotation
   is taken back out and the wheel's angle put in at the same ratio — a linear substitution that keeps every
   pull, spread, turn and loose-part offset exactly as the drive holds them. The plates' facing-axis angle for a
   clockwise turn to the driver is −steer (as the root's old compensation had it). */
const steerDrive={angles:[],orbitAngles:[],mountAngles:[],get spread(){return drive.spread;},get pulls(){return drive.pulls;},get pullTargets(){return drive.pullTargets;},get mountPulls(){return drive.mountPulls;},get mountExtents(){return drive.mountExtents;}};
function steerPoses(){const s=-wheelAngle()-drive.angle,A=steerDrive.angles,O=steerDrive.orbitAngles,M=steerDrive.mountAngles;A.length=O.length=M.length=PARTS.length;for(let i=0;i<PARTS.length;i++){A[i]=drive.angles[i]+drive.ratios[i]*s;O[i]=drive.orbitAngles[i]+(drive.orbitPhases[i]===null?0:s);M[i]=drive.mountAngles[i]+(drive.mountRatios[i]||0)*s;}}
function updateTransforms(){if(!cog)return;steerPoses();for(let i=0;i<PARTS.length;i++){const p=parts[i],pose=partPose(i,steerDrive);p.group.position.fromArray(pose.position);p.group.rotation.z=pose.angle;for(const child of p.rotorChildren||[])if(drive.engaged(i))child.rotation.z=-wheelAngle()*(p.cageRatio??.4);if(p.kind==='spring')for(const child of p.group.children)if(child.isMesh)child.scale.z=1+stageFraction(p,drive.spread)*.9;}
/* the buttons on the wheel are bolted to the rim, so they leave the column with it */if(RIM_PART>=0)rimDx=(parts[RIM_PART].group.position.z-PARTS[RIM_PART].base[2])*cog.root.scale.x;if(cockpit&&cockpit.setWheelSpread)cockpit.setWheelSpread(rimDx);
/* THE WHEEL IS WHAT COMES APART IN THE COCKPIT (Andrew Fisher, 24 Sep 2026, with a photograph of the live cog exploded on its axis: the cog taken apart like this, in the steering wheel concept). In the driver's seat the car and the V8 stay whole and the spread takes the wheel apart along the column — rim, spokes, bolts, then the plates in their order, the same separation the live exhibit shows, seen from inside. The car's own panels and the engine's assemblies spread only in the other two views. */const carSpread=view==='cog'?0:drive.spread;const roadYaw=-wheelAngle()/STEER_MAX*STEER_ROAD;for(let n=0;n<carAssets.length;n++){const a=carAssets[n],i=PARTS.length+n,p=parts[i],t=stageFraction(specs[i],carSpread)+drive.pulls[i]/1.6;p.group.position.set(a.home[0]+a.pull[0]*t,a.home[1]+a.pull[1]*t,a.home[2]+a.pull[2]*t);p.group.quaternion.copy(p.homeQuaternion);if(!drive.engaged(i))p.group.quaternion.multiply(tempQuat.setFromAxisAngle(axis,drive.angles[i]));/* the front wheels steer on their kingpins with the wheel: a right turn points them to −z */if(/WHEEL-FRONT/.test(a.id)&&drive.engaged(i))p.group.quaternion.premultiply(tempQuat.setFromAxisAngle(yAxis,roadYaw));}if(engine.setRack)engine.setRack(wheelAngle()/STEER_MAX);
engine.animate(-drive.angle,id=>drive.engaged(extraIndex.get(id)??-1));engine.setThrottle(throttle,id=>drive.engaged(extraIndex.get(id)??-1));engine.setStarter(drive.starting,lastDt);previousAngle=drive.angle;for(const wheel of body.wheels){const i=extraIndex.get(wheel.userData.id);/* v5.81 — only the rear pair is driven, by the powertrain's own step; the fronts sit in the chocks */advanceWheel(wheel,/REAR/.test(wheel.userData.id)?-PT.wheelDelta:0,0,drive.engaged(i));}
scene.updateMatrixWorld(true);if(powerDots&&powerDots.visible){const m=powerMatrix;for(let i=0;i<9;i++){const u=((drive.angle*.12+i/9)%1+1)%1;const point=powerLine.geometry.parameters.path.getPointAt(u);m.makeTranslation(point.x,point.y,point.z);powerDots.setMatrixAt(i,m);}powerDots.instanceMatrix.needsUpdate=true;}}
function visibleBounds(part=-1){const b=new T.Box3();if(part>=0){const p=parts[part];if(p)b.setFromObject(p.group);return b;}for(const p of parts)if(allVisible(p.group))b.union(new T.Box3().setFromObject(p.group));return b;}
/* the cog view is framed on the machine where it is GOING to stand, not where it is part-way through its 1.6 s
   slide out of the nose — otherwise the camera frames the small fitted cog and the deployed machine walks out
   of the picture (found 23 Sep 2026, the day the cog stopped coming out with the cutaway) */
function fit(which=view,bounds=null){if(!ready)return;const isPart=which==='part';if(which==='cog'||isPart&&view==='cog'&&selected<PARTS.length){/* the driver's eye, looking at the display over the wheel — the concept picture's own view; with the wheel apart, the exhibit eye: across the cabin from the passenger's side, three-quarters on to the column, where the stack's depth reads the way the live cog did on its axis */const E=(drive.spreadTarget>.01||drive.spread>.01)?COCKPIT_WHEEL_EYE:COCKPIT_EYE;controls.minDistance=.08;camTween={from:camera.position.clone(),to:new T.Vector3(E.x,E.y,E.z),targetFrom:controls.target.clone(),targetTo:new T.Vector3(E.lookX,E.lookY,E.lookZ),start:null,duration:reduced?0:780};followPart=false;return;}const b=bounds??visibleBounds(isPart?selected:-1);if(b.isEmpty())return;const c=b.getCenter(new T.Vector3()),sz=b.getSize(new T.Vector3());if(which==='car')c.y=Math.max(LOOK.aimY,c.y*.82);const dir=(which==='cog'||isPart&&selected<PARTS.length?new T.Vector3(-1,LOOK.cogViewY,LOOK.cogViewZ):which==='engine'?new T.Vector3(LOOK.engX,LOOK.engY,LOOK.engZ):new T.Vector3(-1,LOOK.camY,LOOK.camZ)).normalize();const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),dir).normalize(),up=new T.Vector3().crossVectors(dir,right),tan=Math.tan(camera.fov*Math.PI/360);let d=0;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const v=new T.Vector3(x,y,z).sub(c),depth=v.dot(dir);d=Math.max(d,Math.abs(v.dot(right))/(tan*camera.aspect)+depth,Math.abs(v.dot(up))/tan+depth);}d=Math.max(.16,d*(innerWidth<800?LOOK.margin*1.11:LOOK.margin)*(which==='engine'?LOOK.engMargin:which==='cog'?LOOK.cogMargin:1));controls.minDistance=Math.max(.06,sz.length()*.04);/* start is stamped by the first rendered frame, on the frame clock: on a slow device the frame timestamp can lag performance.now(), and a tween started against the wrong clock extrapolates the camera off into the distance before it catches up */camTween={from:camera.position.clone(),to:c.clone().addScaledVector(dir,d),targetFrom:controls.target.clone(),targetTo:c.clone(),start:null,duration:reduced?0:780};followPart=isPart;}
function zoom(k){if(!ready)return;camTween=null;camera.position.copy(controls.target.clone().add(camera.position.clone().sub(controls.target).multiplyScalar(k).clampLength(controls.minDistance,16)));controls.update();}
/* every refusal says why, in the toast and in the dock's service line, where it stays until the next step */
function serviceRefuse(reason){sfx('ui-denied');toast(reason);serviceNote=reason;serviceNoteAt=performance.now();updateUI();return {ok:false,phase:service.phase,reason};}
const SERVICE_SAYS={isolated:'Isolated: the V8 is off and the drive locked out. Next — support the car (W).',supported:'On stands: two jack stands under the sill, the wheel stand beside it. Next — wheel off (W).',wheelOff:'Nut off, wheel off the hub: out along its axle, then laid on the wheel stand. The hub, the disc and the caliper stay on the car.',inspect:'Inspect: the hub, the brake disc and the caliper are exposed — the caliper stays still on the upright, the disc on the hub.',refit:'Refit: the wheel goes back along the same path, then the nut is run on and torqued.',ready:'Ready: the stands are away and the drive is unlocked. Start the V8 when you are ready.'};
function serviceStep(){if(!ready)return {ok:false,phase:service.phase,reason:'Not ready'};
 /* the rear wheel selected in the register is the one serviced; otherwise the near rear, which the car view looks at */
 if(service.phase==='ready'){const a=selected>=PARTS.length?carAssets[selected-PARTS.length]:null;if(a&&service.serviceable(a.id))service.choose(a.id);}
 const r=service.step(drive);if(!r.ok)return serviceRefuse(r.reason);
 serviceNote='';sfx(r.phase==='wheelOff'||r.phase==='refit'?'part-separate':'ui-confirm',.6);toast(SERVICE_SAYS[r.phase]||'');
 if((r.phase==='wheelOff'||r.phase==='inspect')&&view!=='cog')fitService();updateUI();return r;}
/* the corner, framed from ahead, outboard and above: the hub, the disc and the caliper on the car, the wheel on its stand beside it and
   the two jack stands under the sill, in the car view's long lens (24°) from four and a half metres. From ahead because the exhaust's
   extraction hose leaves the side pipe just in front of the rear wheel and runs back and out over the stand: a camera behind or
   close in looks through it (the first still of the service did). In the car view or over the V8; from the seat the view is left alone. */
function fitService(){const w=service.wheel;if(!w||!camera)return;const o=w.userData.side==='near'?1:-1,c=w.position;
 camTween={from:camera.position.clone(),to:new T.Vector3(c.x-2.35,1.55,o*4.55),targetFrom:controls.target.clone(),targetTo:new T.Vector3(c.x-.55,.30,o*1.05),start:null,duration:reduced?0:900};followPart=false;}
const SERVICE_WAITS={stands:'the pit technician is setting the stands',gun:'waiting for the wheel mechanic and his gun',grip:'the mechanic takes hold of the wheel',carryOff:'the wheel is carried to the rack',carryOn:'the wheel is carried back to its hub',gunOn:'the gun goes back on the nut'};
function serviceLine(){const p=service.phase,m=service.moving;if(service.hold&&SERVICE_WAITS[service.hold])return `${{wheelOff:'Wheel off',refit:'Refit'}[p]||'Service'} · ${SERVICE_WAITS[service.hold]}`;if(p==='ready'&&service.clearing)return "Ready · waiting for the crew lead's all-clear";if(service.standsWaiting&&p!=='ready')return 'On stands · '+SERVICE_WAITS.stands;const base={ready:'Wheel service: ready',isolated:'Isolated · drive locked out',supported:'On stands · the wheel may come off',wheelOff:m?'Nut off · the wheel is coming off':'Wheel off · hub, disc, caliper exposed',inspect:'Inspecting · hub, brake disc, caliper',refit:m?'Refitting · nut going on':'Refitted · nut torqued — press Ready'}[p];
 return serviceNote&&performance.now()-serviceNoteAt<8000?`${base} — ${serviceNote}`:(p==='refit'&&!m&&service.torqued?'Refitted · nut torqued, fastening confirmed — press Ready':base);}
function stop(){drive.stop();sfx('v8-stop');}
function toggleStart(){if(!ready)return;if(drive.running||!drive.stationary){stop();toast('V8 stopping.');}else if(service.startRefusal()){serviceRefuse(service.startRefusal());return;}else if(drive.start()){/* the crew's start from the dock throws the panel's switches the way a person would */if(!cabin.ign)setSwitch('IGN',true);if(!cabin.fuel)setSwitch('FUEL',true);sfx('v8-start');sfx('starter-pinion',.7);toast('Every part connected. V8 starting.');}else{sfx('ui-denied');toast('Reconnect every component before starting.');$('assembly-notice').hidden=false;}updateUI();}
function reconnect(){const wasSpread=drive.spreadTarget>.01;drive.reassemble();sfx(wasSpread?'layers-reassemble':(/^CW-CL-/.test(specs[selected].ref||'')?'clutch-engage':/dog coupling/i.test(specs[selected].name)?'dog-engage':'part-reconnect'));assemblyFit=true;isolated=false;$('isolate').setAttribute('aria-pressed',false);$('isolate').textContent='Isolate';updateVisibility();fit(view);toast('Reconnecting the parts. The drive will be ready when every connection is seated.');}
function reset(){drive.reset();drive.speed=.55+throttle*10;service.reset(drive);if(crew)crew.reset();serviceNote='';resetWheels(body.wheels);setSteer(0);for(const id of ['IGN','FUEL','FAN','LIGHTS'])if(cabin[id.toLowerCase()])setSwitch(id,false);cabin.pit=cabin.radio=false;cabin.page=0;cabin.gear=0;cabin.water=cabin.oil=22;previousAngle=0;assemblyFit=false;tour=-1;$('tour-panel').hidden=true;$('tour').innerHTML='▷ <span>Guided tour</span>';isolated=false;cutaway=true;slow=false;power=false;$('slow').setAttribute('aria-pressed',false);$('power').setAttribute('aria-pressed',false);$('body-mode').setAttribute('aria-pressed',true);$('body-mode').textContent='Cutaway on';$('brake').value=0;brake=0;$('brake-value').textContent='0%';selectPart(0);setView('car');updateTransforms();updateUI();}
/* a wheel comes off only through the service: the Disconnect button, the pull slider and the arrow keys on a wheel ask it, and it says why not */
function wheelGuard(i){const a=i>=PARTS.length?carAssets[i-PARTS.length]:null;if(!a||a.group.userData.role!=='wheel'||!drive.connected(i))return null;
 if(service.phase==='supported'&&service.wheel&&service.wheel.userData.id===a.id)return serviceStep();
 const r=service.serviceable(a.id)?service.wheelOff(drive,a.id):service.phase==='ready'?{ok:false,reason:'Service mode required'}:{ok:false,reason:'Only the wheel on the stands comes off in this service'};
 return r.ok?r:serviceRefuse(r.reason);}
function wheelGuardFor(id){const i=extraIndex.get(id);if(i===undefined)return serviceRefuse('No such wheel');return wheelGuard(i)||{ok:false,phase:service.phase,reason:'That wheel is not on the car'};}
function disconnect(){if(!ready)return;if(wheelGuard(selected))return;const connected=drive.connected(selected);if(!connected&&drive.spreadTarget>.01){reconnect();return;}drive.requestPull(selected,connected?1.6:0);sfx(connected?(/^CW-CL-/.test(specs[selected].ref||'')?'clutch-release':'part-separate'):(/^CW-CL-/.test(specs[selected].ref||'')?'clutch-engage':'part-reconnect'));toast(connected?`Stopping before ${specs[selected].name} is withdrawn.`:`Reconnecting ${specs[selected].name}.`);updateVisibility();fit('part');updateUI();}
function explode(){if(!ready)return;if(service.phase!=='ready'&&view!=='cog'){serviceRefuse('Finish the wheel service first — Ready (W), or Reset');return;}const opening=drive.spreadTarget<=.01;drive.requestSpread(opening?1:0);sfx(opening?'layers-separate':'layers-reassemble');assemblyFit=true;isolated=false;followPart=false;$('isolate').setAttribute('aria-pressed',false);updateVisibility();toast(view==='cog'?(drive.spreadTarget?'The wheel comes off the column — the rim first, then the plates in their order. Touch a plate for its meaning.':'The wheel goes back together on the column.'):(drive.spreadTarget?'Stopping the drive before the assemblies separate.':'Reassembling the powertrain.'));}
function updateUI(){const connected=specs.reduce((n,p)=>n+(drive.connected(p.index)?1:0),0);$('count').textContent=`${connected} / ${specs.length} connections engaged`;$('connection-progress').max=specs.length;$('connection-progress').value=connected;for(let i=0;i<4;i++){const b=$('rings').children[i],on=drive.connected(i);b.classList.toggle('loose',!on);b.querySelector('.connection span').textContent=on?'Connected':'Disconnected';}$('status').classList.toggle('warning',!drive.assembled);$('status').classList.toggle('off',failed||!ready);$('status').classList.toggle('warning',!drive.assembled);$('status-text').textContent=failed?'3D unavailable':!ready?'Assembling':drive.status==='Ready'?'Drive ready':drive.status==='Disconnected'?'Drive interrupted':drive.status==='Running'?'V8 running':drive.status;$('start-icon').textContent=drive.running||!drive.stationary?'Ⅱ':'▶';$('start-text').textContent=drive.running||!drive.stationary?'Stop V8':'Start V8';$('start').setAttribute('aria-label',$('start-text').textContent);$('engine-rpm').textContent=failed?'—':Math.round(drive.omega*60/(Math.PI*2)).toLocaleString('en-AU');$('gear-readout').textContent=COCKPIT.gears[cabin.gear];$('cabin-readout').textContent=[cabin.ign?'IGN':'',cabin.fuel?'FUEL':'',cabin.fan?'FAN':'',cabin.lights?'LIGHTS':'',cabin.pit?'PIT':''].filter(Boolean).join(' · ')||'all off';if($('service')){$('service-text').textContent=service.nextLabel;$('service').setAttribute('aria-pressed',service.phase!=='ready');$('service').disabled=!ready||service.moving;$('service-phase').textContent=serviceLine();$('start').classList.toggle('locked',!!service.startRefusal());}$('explode').textContent=view==='cog'?(drive.spreadTarget>.01?'Wheel back together':'Take the wheel apart'):(drive.spreadTarget>.01?'Reassemble powertrain':'Explode powertrain');$('explode').setAttribute('aria-pressed',drive.spreadTarget>.01);$('assembly-notice').hidden=drive.assembled||failed;$('assembly-message').textContent=`${specs.length-connected} connection${specs.length-connected===1?'':'s'} open. Reconnect every component to run the V8.`;$('disconnect').textContent=drive.connected(selected)?'Disconnect part ↗':'Reconnect part ↙';if(document.activeElement!==$('pull'))$('pull').value=drive.pullTargets[selected];$('pull-label').textContent=drive.connected(selected)?'Connected':drive.pulls[selected]<.01&&!drive.stationary?'Stopping first':'Withdrawn';if(fps)$('render-stats').textContent=`${fps} fps · ${renderer.domElement.width} × ${renderer.domElement.height}`;if($('register').open&&!words)for(const row of $('results').children)row.querySelector('small').textContent=drive.connected(+row.dataset.result)?'Connected':'Disconnected';}
function showInfo(html){$('info-content').innerHTML=html;$('info').showModal();}
function ringInfo(){const n=selected;if(n===0){showInfo('<h2>Best Service and Value</h2><p>The purpose at the centre of The Coates Way. These benchmarks come from the supplied June 2026 presentation.</p><div class="kpis">'+KPIs.map(k=>`<div><strong>${k[0]}</strong><span>${k[1]}</span></div>`).join('')+'</div>');return;}if(n===2){showInfo('<h2>Scorecard & cadence</h2><p>Balanced Scorecard · Operating Cadence · Disciplined Execution</p><p>Measure progress, agree actions and follow them through. The original ring links the operating model to its regular performance rhythm.</p>');return;}const arr=n===1?pillars:traits;showInfo('<h2>'+specs[n].name+'</h2>'+arr.map(p=>`<h3>${p.name}</h3><p>${p.text}</p><ul>${p.items.map(x=>`<li>${x}</li>`).join('')}</ul><p>${p.kpi}</p>`).join(''));}
let words=false;
function renderRegister(){const q=$('search').value.trim().toLowerCase(),category=$('category').value,rows=words?COG_REFERENCES.map(p=>({ref:p.ref,name:p.label||p.text||p.name,index:p.part??p.partIndex??p.host??0,category:'Cog wording'})):specs;const matches=rows.filter(p=>(!category||p.category===category)&&(!q||[p.ref,p.name,p.category].join(' ').toLowerCase().includes(q)));$('results-count').textContent=`${matches.length} ${words?'wording reference':'physical component'}${matches.length===1?'':'s'}`;$('results').innerHTML=matches.map(p=>`<button class="result-row" data-result="${p.index}"><code>${p.ref}</code><b>${p.name}</b><small>${words?'Original artwork':drive.connected(p.index)?'Connected':'Disconnected'}</small></button>`).join('');}
function openRegister(useWords=false){words=useWords;$('tab-parts').setAttribute('aria-pressed',!words);$('tab-words').setAttribute('aria-pressed',words);$('category').value='';$('category').hidden=words;renderRegister();if(!$('register').open)$('register').showModal();}
$('category').innerHTML='<option value="">All assemblies</option>'+[...new Set(specs.map(p=>p.category))].map(c=>`<option value="${c}">${c}</option>`).join('');
$('register-open').onclick=()=>openRegister();$('tab-parts').onclick=()=>openRegister(false);$('tab-words').onclick=()=>openRegister(true);$('search').oninput=renderRegister;$('category').onchange=renderRegister;$('results').onclick=e=>{const b=e.target.closest('[data-result]');if(!b)return;$('register').close();const i=+b.dataset.result;if(i>=PARTS.length&&view==='cog')setView('car');selectPart(i,{focus:true});};
$('export').onclick=()=>{const lines=[['Reference','Component / exact wording','Assembly','Type','Function','Connected parts','Suggested Coates link (teaching association)'],...specs.map(p=>{const a=carAssets.find(a=>a.id===p.id),c=a?connectionFor(a):null;return[p.ref,p.name,p.category,'Physical removable part',p.description,c?.drives.map(id=>CAR_REFERENCES[id]).join(' · ')||'',a?(c?.cog||''):cogMeaning(p).word];}),...COG_REFERENCES.map(p=>[p.ref,p.label||p.text||p.name,'Coates cog','Wording reference (not extra part)'])];const csv='\uFEFF'+lines.map(r=>r.map(s=>'"'+String(s??'').replaceAll('"','""')+'"').join(',')).join('\r\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'Coates_V8_Parts_Register.csv');};
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;(document.querySelector('dialog[open]')??document.body).append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);}
function onResize(){if(!renderer||!camera)return;const r=$('viewport').getBoundingClientRect();camera.aspect=Math.max(.1,r.width/Math.max(1,r.height));camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);if(composer){composer.setSize(r.width,r.height);composer.setPixelRatio(renderer.getPixelRatio());}}
/* THE LADDER'S PIXELS. Laptop used to render at device pixel ratio 1, which on a phone (ratio 2 to 3) is a
   picture a third the size it could be, stretched — the softness Andrew Fisher saw on the live page. It now
   renders at up to 1.5 and drops to 1 only if the measured rate cannot hold it (frame()). */
let lowDpr=false;
function applyQuality(){if(!renderer)return;const cap=LOOK.dpr>0?LOOK.dpr:{laptop:lowDpr?1:1.5,balanced:1.6,high:2}[quality];renderer.setPixelRatio(Math.min(devicePixelRatio,cap));if(LOOK.ao===2||(LOOK.ao&&quality!=='laptop'))buildComposer();else dropComposer();const reflecting=LOOK.reflect===2||(LOOK.reflect!==0&&quality!=='laptop');if(studioReflector)studioReflector.visible=reflecting;if(studioEpoxy){const m=studioEpoxy.material,s=reflecting?m.userData.overReflector:m.userData.solid;if(s){m.opacity=s.opacity;m.envMapIntensity=s.envMapIntensity;}}onResize();$('quality').textContent='Quality: '+quality[0].toUpperCase()+quality.slice(1);}
function input(){let start=null,grab=null;const pointers=new Set();const canvas=$('canvas');
 const cast=e=>{const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);};
 /* the wheel's centre on screen, and the angle of a pointer about it — a drag round the wheel turns it */
 const wheelCentre=()=>{const p=cogPose(0),v=new T.Vector3(p.x,p.y,p.z).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height,behind:v.z>1};};
 const isWheel=part=>part<PARTS.length&&(specs[part].category==='Coates cog'||/rim|spoke|tooth bolt|quick-release/i.test(specs[part].name||''));
 canvas.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);start=pointers.size===1?{x:e.clientX,y:e.clientY,id:e.pointerId}:null;grab=null;if(pointers.size!==1||!ready)return;cast(e);
  const hit=raycaster.intersectObjects(pickables,false).find(h=>allVisible(h.object));
  if(hit&&isWheel(hit.object.userData.part)&&drive.connected(hit.object.userData.part)){const c=wheelCentre();if(!c.behind){grab={id:e.pointerId,last:Math.atan2(e.clientY-c.y,e.clientX-c.x),from:steer,moved:0};steerHeld=true;controls.enabled=false;try{canvas.setPointerCapture(e.pointerId);}catch{}}}});
 canvas.addEventListener('pointermove',e=>{if(!grab||grab.id!==e.pointerId)return;const c=wheelCentre();const a=Math.atan2(e.clientY-c.y,e.clientX-c.x);let d=a-grab.last;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;grab.last=a;grab.moved+=Math.abs(d);
  /* on screen, y runs down, so a clockwise sweep to the eye is a positive atan2 step; from the seat the wheel faces the camera, so clockwise on screen is clockwise on the wheel; from in front of the car (any outside view looking at its face through the screen) it is the reverse */const facing=camera.position.x>cogPose(0).x?1:-1;setSteer(steer+d*facing);});
 const release=e=>{pointers.delete(e.pointerId);if(grab&&grab.id===e.pointerId){const was=grab;grab=null;steerHeld=false;controls.enabled=true;try{canvas.releasePointerCapture(e.pointerId);}catch{}if(was.moved>.04){start=null;return;}}
  if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>6){start=null;return;}cast(e);
  /* a switch, a button or the lever wins over the part it sits on */
  const ctl=cockpit?raycaster.intersectObjects(cockpit.controls,false).find(h=>allVisible(h.object)):null;
  const hit=raycaster.intersectObjects(pickables,false).find(h=>allVisible(h.object));
  if(ctl&&(!hit||ctl.distance<=hit.distance+.004)){operate(ctl.object.userData.control);start=null;return;}
  /* the garage's exhibits are picked the same way; whichever is nearer wins, and a thing in the garage is never a part of the drive */
  const ex=raycaster.intersectObjects(exhibits,false)[0];if(ex&&(!hit||ex.distance<hit.distance))showExhibit(ex.object.userData.exhibit);else if(hit){hideExhibit();const part=hit.object.userData.part;/* a section of the cog says what it means; the plate is still selected underneath */if(part<4&&hit.uv&&cogSection(part,hit.uv))selectPart(part);else selectPart(part);}start=null;};
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',e=>{release(e);start=null;});
 canvas.addEventListener('keydown',e=>{if(![' ','e','E','r','R','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','0','[',']','n','N','w','W'].includes(e.key))return;e.preventDefault();if(e.key===' ')toggleStart();else if(e.key.toLowerCase()==='e')explode();else if(e.key.toLowerCase()==='r')reconnect();else if(e.key==='0')fit(view);else if(e.key==='+')zoom(.8);else if(e.key==='-')zoom(1.2);else if(e.key===']')shiftTo(cabin.gear+1);else if(e.key==='[')shiftTo(cabin.gear-1);else if(e.key.toLowerCase()==='n')shiftTo(0);else if(e.key==='ArrowUp'||e.key==='ArrowDown'){if(e.key==='ArrowDown'||!wheelGuard(selected))drive.requestPull(selected,drive.pullTargets[selected]+(e.key==='ArrowUp'?.2:-.2));}else if(e.key==='w'||e.key==='W')serviceStep();else if(view==='cog'&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))setSteer(steer+(e.key==='ArrowLeft'?-.1:.1));else if(drive.stationary&&!drive.running)drive.turn(selected,e.key==='ArrowLeft'?.1:-.1);else stop();});}
/* A SECTION OF THE COG SAYS WHAT IT MEANS. Andrew Fisher, 23 Sep 2026: selecting a cog section reveals its
   meaning. The four plates carry the original artwork (its UVs are the PNG's, byte for byte — tests/artwork
   .test.mjs), so a hit's uv is a point on that picture: angle and radius about its centre pick the section —
   the four pillars are the four quadrants of the second plate with their three words each in the inner band,
   the three scorecard words sit at the top, lower left and lower right of the third, and the seven traits are
   the seven equal sectors of the outer plate, a divider at twelve o'clock. What is shown is the record's own
   content for that section (content.js: the pillar or trait text, the KPI targets for the centre) — nothing is
   written here that is not already on the plates or in the supplied presentation. */
function cogSection(part,uv){const sec=cogSectionAt(part,uv);if(!sec)return false;lastSection=sec;
 const pillar=pillars.find(p=>p.name===sec.name),trait=traits.find(t=>t.name===sec.name);
 const body=pillar||trait?`<p>${(pillar||trait).text}</p><ul>${(pillar||trait).items.map(x=>`<li>${x}</li>`).join('')}</ul><p class="exhibit-label">${(pillar||trait).kpi}</p>`:sec.kind==='purpose'?'<p>The purpose at the centre of The Coates Way, with its eight benchmarks from the June 2026 presentation.</p><div class="kpis">'+KPIs.map(k=>`<div><strong>${k[0]}</strong><span>${k[1]}</span></div>`).join('')+'</div>':'<p>Measure progress, agree actions and follow them through — the operating rhythm that links the model to its performance.</p>';
 $('exhibit-name').textContent=sec.word===sec.name?sec.name:`${sec.word} · ${sec.name}`;$('exhibit-what').innerHTML=body;$('exhibit-word').textContent=`On the ${['centre','pillars','scorecard','traits'][sec.plate]} plate of the cog · ${specs[sec.plate].ref}`;$('exhibit-link').textContent='Exact wording from the supplied Coates Way; the text is the presentation\'s own.';$('exhibit').querySelector('.eyebrow').textContent='ON THE WHEEL';$('exhibit').hidden=false;sfx('ui-select',.5);return true;}
let lastSection=null;
function powerCurve(){/* the glow follows the real drive: from the crank nose through the block to the gearbox, prop shaft and diff — the cog steers, it does not turn the crank, and the chain that once let it is off the engine */
const crankY=ENGINE_LAYOUT.crankY*ENGINE_FIT.scale,noseX=ENGINE_LAYOUT.timingX*ENGINE_FIT.scale+ENGINE_FIT.x;
return new T.CatmullRomCurve3([new T.Vector3(noseX-.08,crankY,0),new T.Vector3(-1.02,crankY,0),new T.Vector3(-.27,.30,0),new T.Vector3(1.222,.30,0)],false,'centripetal');}
function rebuildPowerPath(x,y){powerLine.geometry.dispose();powerLine.geometry=new T.TubeGeometry(powerCurve(x,y),70,.012,6);powerPathDeploy=cogDeploy;}
function setupPowerPath(){powerLine=new T.Mesh(new T.TubeGeometry(powerCurve(LOOK.cogX,LOOK.cogY),70,.012,6),new T.MeshBasicMaterial({color:COATES_ORANGE,transparent:true,opacity:.65,depthWrite:false}));powerDots=new T.InstancedMesh(new T.SphereGeometry(.026,8,6),new T.MeshBasicMaterial({color:0xffb17c}),9);scene.add(powerLine,powerDots);}
/* THE LOOK, IN ONE PLACE, AND MEASURABLE. Every number that decides how the picture reads used to be spelled
   into the line that used it, so tuning meant editing six places and judging the result by eye — and the eye
   was never available here, because the browser this was built in has no WebGL. These are the same values,
   named, with a query override (?tune=exposure:1.0,key:5.2) so a headless browser can sweep them and the
   choice can be made on a measured frame instead of a guess. */
const LOOK = {
  exposure: 1.02,      /* was 1.4 — ACES at 1.4 clipped the lit wall to pure white down the right of the frame */
  hemi: 0.55,          /* was 2.1 — a hemisphere this strong fills every shadow and flattens the mechanism */
  key: 5.2, fill: 1.05, rim: 3.6,   /* was 4.5 / 2.4 / 3.2, and the fill was washing out the near flank */
  env: 0.85,           /* was 1.5 */
  shadowMap: 2048,     /* was 1024 — the contact shadow under a 5 m car needs the resolution to read as contact */
  camY: 0.14, camZ: 0.50, margin: 0.97,
  reflect: 1,          /* the reflective dyno deck: 1 follows the quality ladder, 0 never, 2 always (measurement) */
  cogMargin: 1.18,     /* the cog view stands back a little further than the car view: the whole machine, motor and all, with air around it */
  cogViewY: .26, cogViewZ: .78,   /* the cog view: three-quarter from the front-left like Andrew Fisher's machine guide, so the separated plates, the bearing and the motor read as a machine with depth, not a badge */
  engX: -1, engY: .55, engZ: .8, engMargin: 1.06,   /* the V8 powertrain view: a little more from the front and a
                          little further back than before, so the whole drive line — cog, shaft, distribution
                          case, block, gearbox, prop shaft, diff — is in one frame with the cog uncropped */
  fov: 24,             /* A LONGER LENS. At 34 degrees the cog sits off to the side of a wide frame and takes
                          the perspective skew with it — its concentric rings render as ellipses pulled off
                          centre, which is what reads as "not centred" even though it is dead on the motor's
                          axis. A longer lens flattens that: the circles come back round, the car stops
                          barrel-ing at the edges, and the whole shot reads as product photography rather
                          than a snapshot. It is also the lens Andrew Fisher's reference image was shot on. */  /* was .40 / 1.3 / 1.10 — high, far and small in a half-empty frame */
  aimY: 0.42,          /* was a hard .72 — aiming that high pushed the car down into the control dock */
  floor: 0.42,         /* how much light the floor returns; it was bouncing the environment back as glare */
  cog: COG_FIT.scale,  /* the wheel off the column: 1.30 m across the rim. Overridable for a sweep; the default lives in engine-kinematics.js */
  cogX: COG_FIT.x, cogY: COG_FIT.y,  /* proud of the nose, on the centreline; the axis height is the chain arithmetic */
  ao: 1,               /* ambient occlusion on. 0 turns the whole composer off and renders straight again */
  aoRadius: 0.11,      /* METRES, and it matters. The mechanism parts are centimetres inside a five-metre car:
                          a radius tuned to the car muddies the intricate geometry into grey, and one tuned to
                          a bolt does nothing you can see. .11 is the gap between a cam cover and a head. */
  aoScale: 1.15, aoThickness: 0.35,
  /* THE GARAGE AS THE LIGHT. Andrew Fisher, 23 Sep 2026: the car's quality needed lifting too. The paint and
     the alloys were reflecting a generic studio HDR that has nothing to do with the room the car stands in,
     which is why the body read as flat navy under orange lamps. Now the garage itself is rendered once into a
     cubemap from the car's place and becomes the scene environment: the LED panels, the orange band, the
     banners and the wordmark lie in the paint, the chrome and the floor on every rung. garageEnv 0 keeps the
     studio HDR (measurement); envGarage is the intensity used with the garage map. */
  garageEnv: 1, envGarage: 1.25,
  paintRough: 0.20, paintCoat: 1.0, paintCoatRough: 0.12,   /* a race car's clear coat, not a satin one (was .29 / .7 / .2) */
  dpr: 0,              /* a pixel-ratio cap for a sweep; 0 follows the quality ladder */
};
try { const q = new URLSearchParams(location.search).get('tune');
  if (q) q.split(',').forEach(p => { const [k, v] = p.split(':'); if (k in LOOK && isFinite(+v)) LOOK[k] = +v; });
} catch (e) {}
let composer=null,gtao=null,studioReflector=null,studioEpoxy=null,studioRoot=null;
/* THE GARAGE, CAPTURED. Six faces from the car's place at 256 px, the car and its cog hidden, the planar
   reflector hidden (it renders its own camera and would recurse), the fog left on, the studio HDR taken off
   the scene first so only the room's own light lands in the map — then PMREM-filtered into the environment
   the physical materials read. One capture at load; a few hundred milliseconds on a phone, once. If a browser
   cannot render to a half-float cube target it stays on the studio HDR and says so in the console. */
async function garageEnvironment(studio,hide){
  const previous=scene.environment,shown=hide.map(o=>o.visible),reflectorShown=studioReflector?studioReflector.visible:false;
  const restore=()=>{hide.forEach((o,i)=>o.visible=shown[i]);if(studioReflector)studioReflector.visible=reflectorShown;};
  try{
    if(studio.userData.ready)await Promise.race([studio.userData.ready,new Promise(r=>setTimeout(r,2500))]);
    hide.forEach(o=>o.visible=false);if(studioReflector)studioReflector.visible=false;scene.environment=null;
    const target=new T.WebGLCubeRenderTarget(256,{type:T.HalfFloatType,generateMipmaps:false});
    const cube=new T.CubeCamera(.08,80,target);cube.position.set(-.6,1.15,0);scene.add(cube);
    cube.update(renderer,scene);scene.remove(cube);
    const pmrem=new T.PMREMGenerator(renderer),filtered=pmrem.fromCubemap(target.texture);pmrem.dispose();target.dispose();
    restore();scene.environment=filtered.texture;scene.environmentIntensity=LOOK.envGarage;
    if(previous&&previous.dispose)previous.dispose();
    return true;
  }catch(e){console.warn('Garage environment unavailable, keeping the studio lighting:',e.message);restore();scene.environment=previous;return false;}}
/* THE QUALITY LADDER, and what each rung actually switches. Laptop renders straight to the screen at device
   pixel ratio 1 with no post stack and no floor reflection, and caps itself at 30 fps. Balanced and High add
   the GTAO pass (see LOOK above), the reflective dyno deck (car-scene.js) and a higher pixel ratio. The rung
   is picked on load from the device — a software renderer or a small core count starts on Laptop — and the
   page drops itself back to Laptop if the measured rate falls under 24 fps in the first seconds, so a slow
   machine is protected without anybody having to find the button. The button still cycles all three. */
function buildComposer(){if(composer||!LOOK.ao)return;try{
  composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  gtao=new GTAOPass(scene,camera,1,1);
  gtao.output=GTAOPass.OUTPUT.Default;
  gtao.updateGtaoMaterial({radius:LOOK.aoRadius,distanceExponent:1.4,thickness:LOOK.aoThickness,scale:LOOK.aoScale,samples:16,distanceFallOff:1,screenSpaceRadius:false});
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  onResize();
 }catch(e){composer=null;gtao=null;console.warn('Post stack unavailable, rendering straight:',e.message);}}
function dropComposer(){if(!composer)return;try{composer.dispose?.();}catch(e){}composer=null;gtao=null;}
function pickQuality(){try{const gl=renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info'),name=info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'';
  if(/swiftshader|llvmpipe|softpipe|software/i.test(name))return 'laptop';
  const cores=navigator.hardwareConcurrency||4,mobile=/Mobi|Android/i.test(navigator.userAgent);
  return !mobile&&cores>=8?'balanced':'laptop';}catch(e){return 'laptop';}}
let qualityChecked=false;
async function initialise(){try{renderer=new T.WebGLRenderer({canvas:$('canvas'),antialias:true,powerPreference:'default'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=LOOK.exposure;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setPixelRatio(Math.min(devicePixelRatio,1));scene=new T.Scene();scene.background=new T.Color(0x0b1015);scene.fog=new T.Fog(0x0b1015,40,130);/* the hall is 36 m long; the grandstand outside is 36 m from the door */camera=new T.PerspectiveCamera(LOOK.fov,1,.018,160);camera.position.set(-6,2.7,7);controls=new OrbitControls(camera,$('canvas'));controls.enableDamping=true;controls.dampingFactor=.08;controls.target.set(0,.7,0);controls.maxDistance=16;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.04;controls.addEventListener('start',()=>{camTween=null;followPart=false;assemblyFit=false;});
/* A WINDOW ON THE RENDER, so the picture can be measured instead of described. The handover for this package
   says the browser it was built in disables WebGL and that "WebGL appearance and performance remain
   unverified" — every judgement about how it looks was made from a CPU render with simpler lighting. These
   getters let a headless browser read the real draw calls, triangles, frame time and camera, so a change can
   be shown to have worked rather than claimed to have. They expose nothing the page does not already own. */
window.__cw = {get crew(){return crew;}, advance, service:{get phase(){return service.phase;},get moving(){return service.moving;},get wheel(){return service.wheel?service.wheel.userData.id:null;},get startRefusal(){return service.startRefusal();},get line(){return serviceLine();},step:()=>serviceStep(),choose:id=>service.choose(id),wheelOff:id=>wheelGuardFor(id),reset:()=>{service.reset(drive);serviceNote='';updateUI();return service.phase;},get state(){return service;}},get powertrain(){return PT;}, get deploy(){return cogDeploy;}, get shiftHand(){return shiftHand;}, get rimDx(){return rimDx;}, pinDeploy(){}, get tween(){return camTween;}, get steer(){return steer;}, setSteer, get cabin(){return cabin;}, operate, shiftTo, get view(){return view;}, setView, cogSectionAt, get cockpit(){return cockpit;}, get renderer(){return renderer;}, get scene(){return scene;}, get camera(){return camera;},
               get controls(){return controls;}, get drive(){return drive;}, get fps(){return fps;},
               get quality(){return quality;}, get ready(){return ready;}, get pixelRatio(){return renderer?renderer.getPixelRatio():0;}, get environment(){return scene?scene.environment:null;}};
const [loaded,env]=await Promise.all([buildModel(),environment(renderer)]);cog=loaded;scene.environment=env;scene.environmentIntensity=LOOK.env;for(const t of cog.textures)if(t)t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
cog.root.position.set(COG_FIT.x,COG_FIT.y,COG_FIT.z||0);cog.root.rotation.set(0,COG_FIT.fitted.yaw,0,'ZYX');cog.root.scale.setScalar(COG_FIT.scale);cog.root.updateMatrixWorld(true);{const base=cog.parts.find(p=>/^CW-BS-/.test(p.ref));if(base){/* the supplied base is white; Andrew Fisher's machine guide stands it on dark brushed steel, which also stops it bouncing light into the artwork */const steel=m=>{const d=m.clone();d.color.set(0x15191c);d.metalness=.72;d.roughness=.36;d.envMapIntensity=.9;if('clearcoat' in d)d.clearcoat=0;return d;};base.group.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(steel):steel(o.material);});}}parts.push(...cog.parts);pickables.push(...cog.pickables);{columnPivot=new T.Group();columnPivot.name='Column pivot';columnPivot.position.set(0,0,-COG_COUPLING_DEPTH);cog.root.add(columnPivot);columnGroup=new T.Group();columnGroup.name='Column assist unit';columnGroup.position.set(0,0,COG_COUPLING_DEPTH-COLUMN_DOWN_SHAFT);columnPivot.add(columnGroup);for(const p of cog.parts)if(COLUMN_PART(p))columnGroup.add(p.group);}for(let n=0;n<carAssets.length;n++){const a=carAssets[n],index=PARTS.length+n,p={...specs[index],group:a.group,homeQuaternion:a.group.quaternion.clone()};parts.push(p);a.group.traverse(o=>{if(o.isMesh){o.userData.part=index;pickables.push(o);}});}
const studio=buildStudio();studioRoot=studio;service.kit=studio.userData.serviceKit||null;/* v5.81 — THE CREW (crew.js; Andrew Fisher, 24 Sep 2026: animated crews): six people and a forklift in the hall, doing the wheel service's work — the service asks them (its carrier) before each step it cannot take alone */crew=buildCrew({service,wheels:body.wheels});scene.add(crew.root);service.carrier=crew.carrier;exhibits.push(...crew.exhibits);studioReflector=studio.userData.reflector||null;studioEpoxy=studio.userData.epoxy||null;exhibits.push(...(studio.userData.exhibits||[]));scene.add(body.root,engine.root,cog.root,studio);quality=pickQuality();
/* the body's clear coat (LOOK.paint*): the original car's paint materials carry userData.gc500Panel */
body.root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&m.userData&&m.userData.gc500Panel!==undefined){m.roughness=LOOK.paintRough;m.clearcoat=LOOK.paintCoat;m.clearcoatRoughness=LOOK.paintCoatRough;}});try{await addLivery(body);}catch(error){console.warn('Body print unavailable:',error.message);toast('A body label could not load. The car is still available.');}scene.add(new T.HemisphereLight(0xe2edf4,0x605045,LOOK.hemi));const key=new T.DirectionalLight(0xfff0e1,LOOK.key);key.position.set(-3.4,5.2,5.2);key.castShadow=true;key.shadow.mapSize.set(LOOK.shadowMap,LOOK.shadowMap);/* the shadow map is spent on the car, not on 80 m of empty floor: the same 2048 over a quarter of the area
   is four times the resolution where it matters, which is what turns a soft grey smudge into the contact
   shadow that grounds the car in the target image. */
Object.assign(key.shadow.camera,{left:-3.2,right:3.2,top:2.2,bottom:-1.4,near:.5,far:13});key.shadow.normalBias=.008;key.shadow.bias=-.0001;scene.add(key);const fill=new T.DirectionalLight(0xc6deff,LOOK.fill);fill.position.set(4,3,3);scene.add(fill);const rim=new T.DirectionalLight(0xffa36e,LOOK.rim);rim.position.set(2,4,-4);scene.add(rim);
/* THE COG GETS ITS OWN LIGHT. It is the hero of a piece called The Coates Way and it was being lit by
   whatever spilled past the car — which on a face pointing away from the key is not much. A soft spot square
   on its face lifts the orange teeth and makes every word on the artwork readable from across a room, which
   is the whole reason the thing is there. Tight cone, no shadow cast: it is there to light one object, not
   to add another shadow to the floor. */
cogKey=new T.SpotLight(0xfff4e8,34,3.8,Math.PI*.30,.55,1.7);
cogKey.position.set(LOOK.cogX-1.25,LOOK.cogY+.85,1.45);
cogKey.target.position.set(LOOK.cogX,LOOK.cogY,0);
scene.add(cogKey,cogKey.target);
cogFill=new T.PointLight(0xffd7b0,7,2.2,2);
cogFill.position.set(LOOK.cogX-.60,LOOK.cogY-.32,.60);scene.add(cogFill);
/* THE POST STACK. Andrew Fisher's brief asked for SSAO; GTAO is the newer pass in the same family and it is
   what this scene wants — ground-truth ambient occlusion resolves the contact between a cam follower and its
   bucket, where SSAO's kernel smears it. The radius is in world units and is the number that decides whether
   this reads as depth or as dirt, so it is named in LOOK above with the reasoning beside it.

   It is a LADDER, not a switch. The pass is fill-rate bound, so it is built only above the laptop quality
   setting and can be turned off outright with ?tune=ao:0 — a phone running the 30 fps budget renders straight
   to the screen exactly as it did before, and nothing about this stack can cost it a frame. */
if(LOOK.garageEnv)await garageEnvironment(studio,[body.root,engine.root,cog.root]);
applyQuality();
highlight=new T.Box3Helper(selectionBox,0xff6a13);highlight.material.transparent=true;highlight.material.opacity=.6;highlight.visible=false;scene.add(highlight);setupPowerPath();ready=true;failed=false;drive.speed=.55+throttle*10;placeCog(0);updateTransforms();updateVisibility();onResize();applyViewCamera();fit(view);input();cockpitLights=new T.Group();for(const z of [-.55,.55]){const l=new T.SpotLight(0xfff2dc,40,9,Math.PI*.16,.5,1.2);l.position.set(-2.35,.62,z);l.target.position.set(-6,.3,z*1.4);cockpitLights.add(l,l.target);}cockpitLights.visible=false;scene.add(cockpitLights);/* the observer's first notification arrives after the first fit and would refit the camera for nothing; only a real change of size reframes */let fittedSize='';resizeObserver=new ResizeObserver(()=>{onResize();const r=$('viewport').getBoundingClientRect(),key=Math.round(r.width)+'x'+Math.round(r.height);if(key===fittedSize)return;fittedSize=key;if(!drag)fit(followPart?'part':view);});{const r=$('viewport').getBoundingClientRect();fittedSize=Math.round(r.width)+'x'+Math.round(r.height);}resizeObserver.observe($('viewport'));$('loading').hidden=true;enable3D(true);lastFrame=performance.now();renderer.setAnimationLoop(frame);updateUI();$('canvas').addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('The graphics connection was lost. Reload to restore the car.');});}catch(e){console.error('Coates V8 initialisation:',e);fallback(renderer?'The car could not finish loading its local model or artwork. Reload to try again.':undefined);}}
function enable3D(on){for(const id of ['service','start','pull','turn','disconnect','focus','isolate','body-mode','slow','power','explode','reset','zoom-in','zoom-out','home','capture','quality','sound','throttle','brake','steer','gear-up','gear-down','tour','reconnect'])$(id).disabled=!on;document.querySelectorAll('[data-view]').forEach(b=>b.disabled=!on);}
function fallback(message){ready=false;failed=true;drive.stop();renderer?.setAnimationLoop(null);audio.quiet();$('loading').hidden=true;$('canvas').hidden=true;$('fallback').hidden=false;if(message)$('fallback').querySelector('p').textContent=message;enable3D(false);updateUI();}
function frame(now){if(!ready||document.hidden)return;const budget=quality==='laptop'?1000/30:1000/60;if(now-lastRender<budget-.6)return;const dt=Math.max(0,Math.min(.1,(now-lastFrame)/1000));/* the first animation-loop timestamp can sit before performance.now() — a negative step ran the drive backwards for a frame */if(!lastFrameStart)lastFrameStart=now;lastFrame=lastRender=now;drive.speed=(.55+Math.min(throttle,cabin.pit?.4:1)*10)*(1-brake*.8);drive.advance(dt*(slow?.15:1));lastDt=dt;service.update(dt*(slow?.15:1));powertrain();if(crew)crew.update(dt*(slow?.15:1),crewState());placeCog(dt);updateTransforms();updateVisibility();if(cockpit){/* v5.80 — the V8's rumble on its mounts, growing with the revs; the pedals with their throws; the gauges' needles; the shift rod laid to the box */const running=drive.running&&drive.omega>1e-3,revs=running?PT.revs:0,rumble=running?.0008+.0022*revs:0;const rpmNow=running?PT.rpm:0;
 engine.root.position.y=rumble*Math.sin(now*.001*Math.max(8,rpmNow/60*4)*6.283);engine.root.rotation.z=rumble*.25*Math.sin(now*.001*Math.max(8,rpmNow/60*2)*6.283+1);
 cockpit.update(dt,{rumble,rumbleHz:Math.max(8,rpmNow/60*4)});warmEngine(dt);cockpit.setInstruments(cockpitState(),now);if(engine.setFans)engine.setFans(cabin.fan);
 cockpit.setPedals({throttle,brake,clutch:drive.starting?1:0});cockpit.setGauge('rpm',rpmNow/1000);cockpit.setGauge('water',cabin.water);cockpit.setGauge('oil',cabin.oil);cockpit.setGauge('speed',PT.kmhDial);
 if(engine.gearbox&&cockpit.layShiftRod){engine.gearbox.updateMatrixWorld(true);cockpit.layShiftRod(engine.gearbox.localToWorld(scratch.set(.30,.17,0)));}/* the driver's hands go where the rim is, to the knob for a change, and to his thighs when the wheel is off the column */if(shiftHand>0)shiftHand=Math.max(0,shiftHand-dt/1.4);if(cockpit.driver&&cockpit.driver.userData.setWheel)cockpit.driver.userData.setWheel(-wheelAngle(),{apart:drive.spread>.01,shift:shiftHand>.4?1:0,dx:rimDx,dt,knob:KNOB});}if(assemblyFit&&!camTween){fit(view);if(Math.abs(drive.spread-drive.spreadTarget)<.001&&drive.pulls.every((v,i)=>Math.abs(v-drive.pullTargets[i])<.001))assemblyFit=false;}if(camTween){if(camTween.start===null)camTween.start=now;const t=Math.max(0,Math.min(1,(now-camTween.start)/Math.max(1,camTween.duration))),s=t*t*(3-2*t);camera.position.lerpVectors(camTween.from,camTween.to,s);controls.target.lerpVectors(camTween.targetFrom,camTween.targetTo,s);if(t>=1)camTween=null;}else if(followPart){const b=visibleBounds(selected),c=b.getCenter(scratch),delta=c.clone().sub(controls.target);camera.position.add(delta);controls.target.copy(c);}controls.update();confineCamera();highlight.visible=false;/* THE DYNO RUNS OFF THE DRIVE (v5.78, Andrew Fisher: on a dyno test): the rollers at the tyre's surface speed, the fan, the haze, the ring and the console, all from the machine's own numbers */if(studioRoot&&studioRoot.userData.tick)studioRoot.userData.tick(dt,{running:drive.running,winding:!drive.running&&!drive.stationary,open:!drive.assembled,wheelOmega:PT.wheel*(slow?.15:1),rpm:drive.omega*60/(Math.PI*2),status:drive.status});
if(isolated&&allVisible(parts[selected].group)){selectionBox.setFromObject(parts[selected].group);highlight.visible=true;}
const rpm=drive.omega*60/(Math.PI*2);/* the listener is where the camera is: the V8 loses its top end as you pull back from the block, which is
   the last piece of Andrew Fisher's audio brief and the thing that makes a zoom feel like walking away. */
audio.setDistance(camera.position.distanceTo(controls.target));/* the inspection drive turns at 2 to 48 rpm; the sound follows it across a real V8's range, idle to redline */const audioRpm=PT.rpm;audio.update(audioRpm,drive.cut>0?0:throttle,document.hidden);audio.drive({rpm:audioRpm,throttle:drive.cut>0?0:throttle,running:drive.omega>1e-3,view:view==='cog'?'cockpit':view,wheelSpeed:Math.min(1,PT.wheel/1.7),machineRunning:drive.running,hidden:document.hidden});if(drive.status!==lastDriveStatus){if(drive.status==='Ready'&&lastDriveStatus==='Reassembling')sfx('ui-confirm',.6);lastDriveStatus=drive.status;}if(now-uiTime>160){updateUI();uiTime=now;}frameCount++;if(now-fpsTime>1000){fps=Math.round(frameCount*1000/(now-fpsTime));frameCount=0;fpsTime=now;if(!qualityChecked&&now-lastFrameStart>6000){qualityChecked=true;if(quality!=='laptop'&&fps<24){quality='laptop';applyQuality();toast('Quality set to Laptop to keep the frame rate smooth.');}else if(quality==='laptop'&&fps<22&&!lowDpr){lowDpr=true;applyQuality();}}}updateCallout();updateServiceCallouts();(composer?composer.render():renderer.render(scene,camera));}
/* THE CALLOUT. Andrew Fisher's guide frames show a disconnected part named where it sits — "Scorecard & cadence ·
   disconnected" on a leader line to the part. This is that: the selected part, when it is withdrawn or pulled,
   gets a label anchored to its own position on screen, so the words and the thing are never in two places.
   A connected selection gets the same label in orange while the isolate or focus tools are in use. */
const calloutV=new T.Vector3(),calloutBox=new T.Box3();
/* THE INSPECTION CALLOUTS (v5.81): with the wheel off, the three things the brief asks to see — "Expose the hub, brake disc and
   stationary caliper" — each named where it is on the car, on a leader line, like the part callout below */
const SERVICE_POINTS=[['hub',[0,.0,.105],[70,-80]],['disc',[.02,.16,.076],[40,-120]],['caliper',[-.185,.05,.075],[-210,-70]]];
function updateServiceCallouts(){const box=$('service-callouts');if(!box)return;const w=service.wheel,show=ready&&w&&(service.phase==='inspect'||service.phase==='wheelOff'&&!service.moving);
 if(!show){if(!box.hidden)box.hidden=true;return;}box.hidden=false;const o=w.userData.side==='near'?1:-1,r=$('viewport').getBoundingClientRect(),lines=box.querySelectorAll('line');
 SERVICE_POINTS.forEach(([key,[x,y,z],[dx,dy]],k)=>{calloutV.set(x,y,z*o);w.localToWorld(calloutV);calloutV.project(camera);const el=box.querySelector(`[data-k="${key}"]`),line=lines[k];
  if(calloutV.z>1||Math.abs(calloutV.x)>1.05||Math.abs(calloutV.y)>1.05){el.hidden=true;line.setAttribute('visibility','hidden');return;}
  const sx=(calloutV.x+1)/2*r.width,sy=(1-calloutV.y)/2*r.height,lx=Math.max(8,Math.min(r.width-180,sx+dx)),ly=Math.max(60,sy+dy);
  el.hidden=false;el.style.transform=`translate(${lx}px,${ly}px)`;line.setAttribute('visibility','visible');line.setAttribute('x1',lx+8);line.setAttribute('y1',ly+14);line.setAttribute('x2',sx);line.setAttribute('y2',sy);});}
/* IN THE GARAGE. Andrew Fisher, 23 Sep 2026: everything has meaning and is related to something — that is the Coates
   Way. A thing in the garage picked with the pointer opens this card: what it is, and the line of Coates's own
   wording it stands for — a value, a Life Saving Rule, a plate of the cog or one of the six disciplines. It is
   a teaching association, labelled as such, and it never touches the drive: nothing here connects or
   disconnects. */
function showExhibit(e){if(!e)return;$('exhibit').querySelector('.eyebrow').textContent='IN THE GARAGE';$('exhibit-name').textContent=e.name;$('exhibit-what').textContent=e.what;$('exhibit-word').textContent=e.word;$('exhibit-link').textContent=e.link;$('exhibit').hidden=false;sfx('ui-select',.5);}
function hideExhibit(){$('exhibit').hidden=true;}
$('exhibit-close').onclick=hideExhibit;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('exhibit').hidden)hideExhibit();});
function updateCallout(){const label=$('part-label'),svg=$('callout-line');const p=parts[selected];const show=ready&&p&&allVisible(p.group)&&(!drive.connected(selected)||isolated||followPart);
 if(!show){label.hidden=true;svg.hidden=true;return;}
 calloutBox.setFromObject(p.group);if(calloutBox.isEmpty()){label.hidden=true;svg.hidden=true;return;}calloutBox.getCenter(calloutV).project(camera);
 if(calloutV.z>1||Math.abs(calloutV.x)>1.2||Math.abs(calloutV.y)>1.2){label.hidden=true;svg.hidden=true;return;}
 const r=$('viewport').getBoundingClientRect(),x=(calloutV.x+1)/2*r.width,y=(1-calloutV.y)/2*r.height,lx=Math.min(r.width-160,Math.max(160,x-110)),ly=Math.max(70,y-95);
 const state=drive.connected(selected)?'selected':'',text=specs[selected].name+(drive.connected(selected)?'':' · disconnected');
 label.className=state;svg.setAttribute('class',state);label.querySelector('span').textContent=text;label.style.transform=`translate(${lx}px,${ly}px) translate(-50%,-100%)`;label.hidden=false;
 const line=svg.querySelector('line'),dot=svg.querySelector('circle');line.setAttribute('x1',lx);line.setAttribute('y1',ly);line.setAttribute('x2',x);line.setAttribute('y2',y);dot.setAttribute('cx',x);dot.setAttribute('cy',y);svg.hidden=false;}
const tourSteps=[['The Coates Way sets our direction','The Coates Way cog is the steering wheel of this #26 — in the driver\'s hands, on the column, its shaft down to the rack. Explore the car, reveal its powertrain, then inspect every connection.','car',0],['Look inside the V8','Eight piston assemblies turn a crankshaft. The engine, gearbox and running gear are separate, selectable components. The timing belt turns both camshafts. Individual followers, valves and springs move together; each can be withdrawn for inspection.','engine',null],['In the driver\'s seat','The Coates Way cog is the wheel in your hands: drag it and the shaft, the rack and the front wheels follow. Touch a section of it for what that section means. The panel\'s switches wake the display and start the V8; the lever beside you puts a gear in. Your hands are on the rim and turn with it; a gear change takes the left one to the lever. The original four plates keep every word from your supplied cog and still come apart here: Take the wheel apart (E) lifts the rim off the column, then the plates in their order, and the camera steps across the cabin to look at the stack — the cog as the exhibit showed it on its axis, now on the column.','cog',3],['Every part matters','Choose a component and disconnect it. The drive stops before the part withdraws, and cannot restart with an open connection.','cog',3],['Reconnect the system','Reconnect all components and wait for them to seat. When the status reads Drive ready, start the V8 and explore with the throttle and slow-motion controls.','car',0]];
function showTour(){const t=tourSteps[tour];$('tour-panel').hidden=false;$('tour-step').textContent=`0${tour+1} / 05`;$('tour-title').textContent=t[0];$('tour-copy').textContent=t[1];$('tour-next').textContent=tour===4?'Finish tour ✓':'Next →';setView(t[2]);if(t[3]!==null)selectPart(t[3]);if(tour===3){drive.requestPull(3,1.6);}if(tour===4)drive.reassemble();}
$('tour').onclick=()=>{if(tour>=0){tour=-1;$('tour-panel').hidden=true;return;}tour=0;showTour();};$('tour-next').onclick=()=>{if(tour===4){tour=-1;$('tour-panel').hidden=true;}else{tour++;sfx('tour-step',.7);showTour();}};$('tour-close').onclick=()=>{tour=-1;$('tour-panel').hidden=true;};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('start').onclick=toggleStart;$('service').onclick=()=>serviceStep();$('explode').onclick=explode;$('reset').onclick=reset;$('disconnect').onclick=disconnect;$('reconnect').onclick=reconnect;$('focus').onclick=()=>fit('part');$('isolate').onclick=()=>{isolated=!isolated;$('isolate').setAttribute('aria-pressed',isolated);$('isolate').textContent=isolated?'Show all':'Isolate';updateVisibility();fit(isolated?'part':view);};
$('pull').oninput=e=>{if(wheelGuard(selected)){e.target.value=0;return;}drive.requestPull(selected,+e.target.value);followPart=true;updateVisibility();};$('turn').oninput=e=>{if(!drive.stationary||drive.running){drive.stop();e.target.value=drive.turns[selected]*180/Math.PI;toast('Wait for the drive to stop before turning the part.');return;}const target=+e.target.value*Math.PI/180;if(!drive.turn(selected,target-drive.turns[selected])){e.target.value=0;toast('Withdraw this stationary component before turning it.');}$('turn-label').textContent=Math.round(+e.target.value)+'°';};
$('steer').oninput=e=>setSteer(+e.target.value/100*STEER_MAX);$('gear-up').onclick=()=>shiftTo(cabin.gear+1);$('gear-down').onclick=()=>shiftTo(cabin.gear-1);$('throttle').oninput=e=>{const was=throttle;throttle=+e.target.value/100;$('throttle-value').textContent=e.target.value+'%';if(drive.running){if(throttle-was>.2){sfx('butterflies-open',.6);sfx('v8-blip',.8);}else if(was-throttle>.2){sfx('butterflies-close',.6);if(was>.5)sfx('v8-overrun',.8);}}};$('brake').oninput=e=>{brake=+e.target.value/100;$('brake-value').textContent=e.target.value+'%';};$('slow').onclick=()=>{slow=!slow;$('slow').setAttribute('aria-pressed',slow);};$('power').onclick=()=>{power=!power;$('power').setAttribute('aria-pressed',power);updateVisibility();};$('body-mode').onclick=()=>{cutaway=!cutaway;if(view==='car')sfx(cutaway?'panels-off':'panels-on',.8);$('body-mode').setAttribute('aria-pressed',cutaway);$('body-mode').textContent=cutaway?'Cutaway on':'Complete body';$('scene-description').textContent=view==='car'?`Coates #26 · ${cutaway?'Cutaway':'Complete body'}`:'V8, transmission & running gear';updateVisibility();};$('home').onclick=()=>fit(view);$('zoom-in').onclick=()=>zoom(.82);$('zoom-out').onclick=()=>zoom(1.22);$('quality').onclick=()=>{const modes=['laptop','balanced','high'];quality=modes[(modes.indexOf(quality)+1)%3];applyQuality();};
$('sound').onclick=async()=>{try{const on=await audio.toggle();$('sound').textContent=on?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',on);}catch{toast('Sound is unavailable in this browser.');}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Full screen is not available in this browser.');}};
$('inspect-toggle').onclick=()=>{const hide=!$('inspect-content').hidden;$('inspect-content').hidden=hide;$('inspect-toggle').textContent=hide?'+':'−';$('inspect-toggle').setAttribute('aria-expanded',!hide);};
$('original').onclick=()=>showInfo('<h2>The original Coates Way</h2><img src="./assets/cog-reference.png" alt="Unmodified Coates Way source artwork"><p>Original artwork from the June 2026 presentation. Its lettering is preserved in the four moving plates.</p>');$('learn').onclick=ringInfo;
$('help').onclick=()=>showInfo('<h2>Explore the car</h2><p><strong>Orbit:</strong> drag the car or background. Scroll or pinch to zoom. Select any visible part to inspect it.</p><p><strong>Cutaway:</strong> reveals internal components without disconnecting them. The car, V8 and cockpit buttons frame different views; the cockpit puts you in the driver\'s seat.</p><p><strong>In the cockpit:</strong> drag the wheel to steer (or the Steer slider, or ← → on the 3D view); the front wheels follow through the rack. IGN and FUEL on the panel, then START. FAN, LIGHTS, PIT LIMIT and RADIO do what they say. The lever beside you: the knob pulls the next gear, the shaft pushes the one below (] and [ on the keyboard, N for neutral). Touch a section of the cog for its meaning. Your hands are on the rim and turn with it; a gear change takes the left one to the lever. <em>Take the wheel apart</em> (E) lifts the rim off the column and then the plates in their order — the cog as the exhibit showed it, on the column — and the camera steps across the cabin to look; the car and the V8 stay whole. <em>Wheel back together</em> (R) puts it back.</p><p><strong>Wheel service:</strong> <em>Service</em> in the dock (or W) takes a rear wheel off and puts it back, one step at a time — isolate the drive (the V8 stopped and the wheels still), support the car on two stands, the nut off and the wheel out along its axle and onto its stand, inspect the hub, the brake disc and the caliper that stay on the car, refit and torque, then Ready. A step the machine\'s state does not allow is refused and the dock says why; Start is locked out until Ready. The rear wheel selected in the register is the one serviced, otherwise the near one. Reset puts everything back.</p><p><strong>Find a part:</strong> search every physical component or the exact cog wording. Focus and Isolate reveal small hardware.</p><p><strong>Disconnect:</strong> the drive stops before removal. Every component must be reconnected before restarting. Pull and Turn give precise control.</p><p><strong>Throttle and brake:</strong> throttle controls the illustrative V8 speed; brake slows wheel rotation. Slow motion makes the mechanics easier to inspect. Sound is generated locally and starts only when enabled.</p><p><strong>Keyboard on the 3D view:</strong> Space starts/stops; E separates; R reconnects; W the next step of the wheel service; arrows pull or turn; +/− zoom; 0 frames the whole assembly.</p><p><strong>Quality:</strong> Laptop limits rendering resolution and targets a 30 fps cap. Higher settings use more graphics power. The frame counter reports this device’s measured rendering rate.</p><p>This is an operating-model illustration, not factory CAD, a driving simulator or live telemetry. The cog is the steering wheel: its shaft turns the rack, not the crank. The instruments read the machine\'s own state. The engine uses an illustrative overhead-cam layout, not Camaro factory geometry. Suggested business links are teaching associations. The displayed rpm is the slow inspection speed; sound is scaled up. The supplied artwork is 1179 pixels square; 4K capture saves a larger canvas without inventing artwork detail.</p><p><a href="./mechanism.html">Open the original 128-part mechanism →</a></p>');
$('capture').onclick=()=>{if(!ready)return;const oldSize=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;try{renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=3840/2160;camera.updateProjectionMatrix();renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob){download(blob,'Coates_V8_Connected_4K.png');toast('4K image saved.');}else toast('The image could not be saved.');},'image/png');}catch{toast('This device could not create the 4K image.');}finally{renderer.setPixelRatio(ratio);renderer.setSize(oldSize.x,oldSize.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());$('retry').onclick=()=>location.reload();document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();drive.accumulator=0;audio.quiet();});window.addEventListener('pagehide',()=>{audio.quiet();renderer?.setAnimationLoop(null);});window.addEventListener('pageshow',e=>{if(e.persisted&&ready){lastFrame=lastRender=performance.now();drive.accumulator=0;renderer.setAnimationLoop(frame);}});
selectPart(0);enable3D(false);initialise();
