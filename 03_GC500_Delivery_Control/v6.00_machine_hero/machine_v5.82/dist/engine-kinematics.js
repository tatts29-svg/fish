// Illustrative four-stroke engine dimensions and coupled motion, in metres.
// The mechanical rig is built in its own units and then fitted into the five-metre car at this
// scale and offset (see car-fit.js). World = local * scale + x.
export const ENGINE_FIT=Object.freeze({scale:.74,x:-.24});
/* THE COG IS NOT ON THE ENGINE ANY MORE. Andrew Fisher, 23 Sep 2026: the cog becomes the steering wheel, because it
   operates everything — so the cog comes off the engine. The front distribution drive of 22 Sep
   (a duplex chain in a case on the front of the block, two 30-tooth sprockets, tensioner and guide — built so a
   nose-mounted cog and the crank shared one angle) is gone with it; the crank nose carries the timing belt and
   the serpentine pulley, as a V8 does. FRONT_DRIVE keeps only the line the case's front face stood on, because
   the accessory drive was laid out from it (engine-accessories.js). Rig units. */
export const FRONT_DRIVE=Object.freeze({x:-1.92,caseDepth:.075});
/* THE STEERING PINION (v5.79): where the cog's telescoping shaft ends — the rack-and-pinion behind the front
   axle, driver's side, rig units (car-powertrain.js builds the rack there). */
export const STEER_PINION=Object.freeze({x:-.90,y:.75,z:-.85});   /* outboard of the exhaust, the one line from the wheel that clears the bay (measured, tests/engine.test.mjs) */
export const ENGINE_LAYOUT=Object.freeze({engineX:-1.05,crankY:.435,timingX:-1.755,camDistance:.570});
/* WHERE THE COG IS — ONE PLACE, world metres. Andrew Fisher, 23 Sep 2026: redesign it so the
   cog becomes the steering wheel, still able to come apart — the steering wheel still has to be the cog, unchanged —
   and, later the same day, the cockpit in the garage pit, with the cog as the steering wheel because it operates
   everything.
   The cog is the #26's steering wheel. It sits on the column in the driver's hands — the right-hand seat of the
   original cockpit, exactly on the original cabin's own small wheel ring (measured off that mesh: centre
   (−0.18, 0.787, −0.307), Ø 0.19 — it stays, inside the column hub, because the original surfaces are never
   altered); its face points straight back to the driver, upright, as the concept picture has it; the whole
   assembly is 0.43 m across the rim (WHEEL.rimR in parts.js at this scale), the cog itself 0.29 m across its
   teeth. The machine's column — its shaft, coupling and collar — runs forward and down from the hub to the
   steering shaft and the rack (front-drive.js, car-powertrain.js); the motor, gearbox, clutch and base it was
   supplied with are not in the car (car-app.js carHidesCogPart). It comes apart where it is: the plates pull
   off the column toward the driver, in the cockpit, in the garage. The earlier states — fitted in the nose and
   deployed ahead of it (22 Sep), then lifted off the quick-release and grown to 1.3 m in a wheel view (23 Sep,
   morning) — are recorded in the changelog and are gone: nothing comes off the car to be looked at. */
export const COG_CAR=Object.freeze({fitted:Object.freeze({x:-.10,y:.787,z:-.307,scale:.036,yaw:Math.PI/2,pitch:0})});   /* v5.79b: 8 cm back toward the driver, off the original ring — the column hub (car-cockpit.js) covers the ring */
/* THE DRIVER'S EYE, for the cockpit view: a helmet's eye line in the original seat (the head sphere is at
   (.46, .92, −.295)), looking at the display over the wheel. The view is what the concept picture shows. */
/* v5.80 — the eye 8 cm forward of where it was, ahead of the original cabin's head (a sphere at (.46,.92,−.295), inside the helmet), so looking down at the pedals and the column never puts the back of that head in the frame */
/* v5.81 — five centimetres back (x .34 → .39) and a 62° lens (was 68°). Andrew Fisher, 23 Sep 2026: the driver and
   the dashboard looked poor — from .34 at 68° the forearms ran from the bottom corners to the rim and filled the lower
   frame; from .39 at 62° they are the lower edge of the picture and the dash, the panel and the wheel are the picture.
   The eye is still in front of the original head sphere's back and the display's centre still clears the rim's top
   (tests/engine.test.mjs measures the sightline) */
export const COCKPIT_EYE=Object.freeze({x:.39,y:1.02,z:-.30,lookX:-.30,lookY:.84,lookZ:-.29,fov:62});   /* v5.82: the eye looks 6 cm lower, so the whole wheel sits above the dock (Andrew Fisher: the cog wheel was hard to see for what was in the way) */
/* the wheel exhibit: where the camera stands when the wheel is taken apart in the cockpit — across the cabin on the passenger's side, three-quarters on to the column, so the separated stack has depth (Andrew Fisher, 24 Sep 2026: the cog taken apart like this, in the steering wheel concept) */
export const COCKPIT_WHEEL_EYE=Object.freeze({x:.42,y:1.02,z:-.01,lookX:.03,lookY:.80,lookZ:-.30,fov:62});   /* v5.81: the same 62° lens as the seat */
/* the direction the plates face for a yaw and a pitch — local +z after Ry(yaw) then Rz(pitch) (Euler 'ZYX') */
export function cogAxis(yaw,pitch){return {x:Math.sin(yaw)*Math.cos(pitch),y:Math.sin(yaw)*Math.sin(pitch),z:Math.cos(yaw)};}
/* one pose, whatever t a caller passes — the argument is kept so the callers of the old two-state path need not change */
export function cogPose(){return COG_CAR.fitted;}
/* The machine's flexible coupling (CW-DR-007) ends 2.09 model units behind the plates' origin; the shaft's
   universal joint sits just behind that. Behind is along the machine's own −z, which in the car is forward
   and down the column, so the coupling is found from the pose's axis, never from x alone. */
export const COG_COUPLING_DEPTH=2.09,COG_UJ_SETBACK=.04;
export function cogCouplingWorld(pose){const ax=cogAxis(pose.yaw??-Math.PI/2,pose.pitch??0),d=COG_COUPLING_DEPTH*pose.scale;
 return {x:pose.x-ax.x*d,y:pose.y-ax.y*d,z:(pose.z||0)-ax.z*d,ax};}
export const CAM_BASE=.026,CAM_LIFT=.014,CAM_SAMPLES=96;
const TAU=Math.PI*2;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function camProfileRadius(a){const t=Math.abs(wrap(a)),width=Math.PI/3;return CAM_BASE+(t<width?CAM_LIFT*Math.cos(t/width*Math.PI/2)**2:0);}
export function camLobePhase(n,kind,side,crankPhase){
 const tdc=side*Math.PI/4-crankPhase+(n%4<2?0:TAU);
 const peak=tdc+(kind==='intake'?2.5:1.5)*Math.PI;
 return side*Math.PI/4+Math.PI-peak/2;
}
// Support of the SAME polygon as the visible lobe against the flat tappet.
// This avoids a cam/follower gap from using radial distance as flat contact.
export function valveLift(angle,n,kind,side,crankPhase){
 const phase=camLobePhase(n,kind,side,crankPhase),beta=side*Math.PI/4+Math.PI;
 let extent=CAM_BASE;
 for(let k=0;k<CAM_SAMPLES;k++){
  const a=k/CAM_SAMPLES*TAU;
  extent=Math.max(extent,camProfileRadius(a-phase)*Math.cos(a+angle/2-beta));
 }
 return extent-CAM_BASE;
}
