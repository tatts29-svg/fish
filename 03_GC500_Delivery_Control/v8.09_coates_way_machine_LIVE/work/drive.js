// Fixed-step illustrative drive. Output is the master; the planetary input runs at 4×.
const H=1/120;
const diff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const approach=(a,b,s)=>a<b?Math.min(b,a+s):Math.max(b,a-s);
export class Drive {
 constructor(count,rotates,specs=[]){this.count=count;this.rotates=rotates||Array.from({length:count},(_,i)=>[0,1,2,3,4,6,7,10,13,17,19,20,21,22].includes(i));this.ratios=this.rotates.map((r,i)=>specs[i]?.ratio??(r?1:0));this.phases=this.rotates.map((_,i)=>specs[i]?.phase||0);this.orbitPhases=this.rotates.map((_,i)=>specs[i]?.orbitalPhase??null);this.mounts=specs.map(p=>p.mount);this.mountRatios=specs.map(p=>p.mountRatio??(p.mount!==undefined?specs[p.mount].ratio:0));this.mountPhases=specs.map(p=>p.mount!==undefined?(specs[p.mount].phase||0):0);this.reset();}
 reset(){this.angle=0;this.omega=0;this.running=false;this.starting=false;this.cut=0;this.locked=false;this.speed=1;this.spread=0;this.spreadTarget=0;this.pulls=Array(this.count).fill(0);this.pullTargets=Array(this.count).fill(0);this.angles=this.phases.slice();this.orbitAngles=this.orbitPhases.map(p=>p??0);this.mountAngles=this.mountPhases.slice();this.mountPulls=Array(this.count).fill(null);this.mountExtents=Array(this.count).fill(0);this.accumulator=0;this.steps=0;}
 hostOffset(i){const j=this.mounts[i];return j===undefined||this.pullTargets[i]>0||this.spreadTarget>0?0:diff(this.angles[j],this.ratios[j]*this.angle+this.phases[j]);}
 home(i){return this.ratios[i]*this.angle+this.phases[i]+this.hostOffset(i);}
 orbitHome(i){return this.angle+(this.orbitPhases[i]??0);}
 mountHome(i){return (this.mountRatios[i]||0)*this.angle+(this.mountPhases[i]||0)+this.hostOffset(i);}
 get turns(){return this.angles.map((a,i)=>diff(a,this.home(i)));}
 get stationary(){return this.omega<1e-8;}
 engaged(i){return i>=0&&i<this.count&&this.spread<1e-5&&this.pulls[i]<1e-5&&Math.abs(diff(this.angles[i],this.home(i)))<1e-5&&(this.orbitPhases[i]===null||Math.abs(diff(this.orbitAngles[i],this.orbitHome(i)))<1e-5)&&(this.mounts[i]===undefined||(this.engaged(this.mounts[i])&&Math.abs(diff(this.mountAngles[i],this.mountHome(i)))<1e-5));}
 connected(i){return this.engaged(i)&&this.spreadTarget<1e-5&&this.pullTargets[i]<1e-5;}
 get assembled(){return this.spreadTarget===0&&this.spread<1e-5&&this.pullTargets.every((x,i)=>x===0&&this.engaged(i));}
 /* v5.81 — STARTING IS THE START, NOT EVERY ACCELERATION. `status` used to read 'Starting' whenever the drive was
    below its target, so opening the throttle mid-run threw the starter pinion back in and put STARTING on the
    dash. Now `starting` is set by start() and cleared the moment the drive first reaches idle (.26 rad/s — the
    target at a closed throttle); after that it is Running however the throttle moves. The clutch pedal and the
    starter pinion read this flag, and the driveline is open while it is set: a car started in gear does not lurch
    on the rollers until the engine has caught. */
 /* v5.81 — `locked` is the lock-out a wheel service puts on the drive (car-motion.js WheelService, from Isolate to Ready):
    nothing starts it, whatever button or key asks, and a drive that is somehow running stops (step) — no drive is ever
    allowed with a wheel detached (Andrew Fisher's workshop brief, 24 Sep 2026). reset() lifts it. */
 start(){if(this.locked||!this.assembled||!this.stationary)return false;this.running=true;this.starting=true;return true;}
 stop(){this.running=false;this.starting=false;this.cut=0;}
 /* a gear change: the throttle is cut for a quarter of a second while the dog ring goes across — the revs dip and
    the sound with them (car-app.js shiftTo → drive.shift()). Nothing else changes: the gear itself is the cockpit's. */
 shift(){if(this.running&&!this.starting)this.cut=.25;}
 requestSpread(value){this.stop();this.spreadTarget=Math.max(0,Math.min(1,value));if(this.spreadTarget===0)this.pullTargets.fill(0);}
 requestPull(i,value){if(i<0||i>=this.count)return;this.stop();this.pullTargets[i]=Math.max(0,Math.min(5,value));}
 reassemble(){this.stop();this.spreadTarget=0;this.pullTargets.fill(0);}
 propagate(delta,engaged){this.angle+=delta;for(let i=0;i<this.count;i++)if(engaged[i]){this.angles[i]+=delta*this.ratios[i];if(this.orbitPhases[i]!==null)this.orbitAngles[i]+=delta;if(this.mounts[i]!==undefined)this.mountAngles[i]+=delta*this.mountRatios[i];}}
 turn(i,radians){if(i<0||i>=this.count||!this.stationary||this.running)return false;if(this.engaged(i)){if(!this.ratios[i])return false;this.propagate(radians/this.ratios[i],this.angles.map((_,j)=>this.engaged(j)));}else{this.angles[i]+=radians;if(this.spread<1e-5)for(let j=0;j<this.count;j++)if(this.mounts[j]===i&&this.pulls[j]<1e-5){this.angles[j]+=radians;this.mountAngles[j]+=radians;}}return true;}
 step(dt){
  if(this.running&&(this.locked||!this.assembled))this.stop();let target=this.running?.48*this.speed:0;const previous=this.omega;if(this.cut>0){this.cut=Math.max(0,this.cut-dt);target*=.78;}this.omega=approach(this.omega,target,(this.cut>0?2.4:this.running?.7:1.3)*dt);if(this.starting&&this.omega>=.26)this.starting=false;
  this.propagate((previous+this.omega)*.5*dt,this.angles.map((_,i)=>this.engaged(i)));
  if(this.stationary){this.spread=approach(this.spread,this.spreadTarget,.25*dt);for(let i=0;i<this.count;i++){
   const returning=this.spreadTarget===0&&this.pullTargets[i]===0,error=diff(this.home(i),this.angles[i]),orbitError=this.orbitPhases[i]===null?0:diff(this.orbitHome(i),this.orbitAngles[i]),mountError=this.mounts[i]===undefined?0:diff(this.mountHome(i),this.mountAngles[i]);
   if(returning){this.angles[i]+=Math.max(-1.8*dt,Math.min(1.8*dt,error));this.orbitAngles[i]+=Math.max(-1.8*dt,Math.min(1.8*dt,orbitError));if(this.mounts[i]!==undefined)this.mountAngles[i]+=Math.max(-1.8*dt,Math.min(1.8*dt,mountError));}
   if(this.mounts[i]!==undefined&&this.pullTargets[i]>0&&this.mountPulls[i]===null)this.mountPulls[i]=this.pulls[this.mounts[i]];
   const floor=returning&&Math.max(Math.abs(error),Math.abs(orbitError),Math.abs(mountError))>.001?.025:0;this.pulls[i]=approach(this.pulls[i],Math.max(this.pullTargets[i],floor),2.1*dt);
   if(this.pullTargets[i]>0)this.mountExtents[i]=Math.max(this.mountExtents[i],this.pulls[i]);
   if(this.pulls[i]===0&&this.pullTargets[i]===0){this.mountPulls[i]=null;this.mountExtents[i]=0;}
  }}this.steps++;
 }
 advance(dt){this.accumulator+=Math.max(0,Math.min(.1,dt));const steps=Math.floor((this.accumulator+1e-10)/H);for(let i=0;i<steps;i++)this.step(H);this.accumulator=Math.max(0,this.accumulator-steps*H);}
 get status(){if(this.running)return this.starting?'Starting':'Running';if(!this.stationary)return'Stopping';if(this.assembled)return'Ready';if(this.spread>this.spreadTarget+1e-5||this.pulls.some((p,i)=>p>this.pullTargets[i]+1e-5))return'Reassembling';if(this.spread<this.spreadTarget-1e-5||this.pulls.some((p,i)=>p<this.pullTargets[i]-1e-5))return'Separating';return'Disconnected';}
}
