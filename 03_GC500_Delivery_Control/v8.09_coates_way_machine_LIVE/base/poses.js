import {PARTS} from './parts.js';
import {stageFraction} from './gear-math.js';

// All hardware anchors are evaluated from the same drive state. A loose component
// retains its mount angle, while attached hardware follows its host's motion.
export function partPose(index,drive,spread=drive.spread,pulls=drive.pulls){
 const p=PARTS[index],t=stageFraction(p,spread),pull=pulls[index]||0;
 if(p.mount!==undefined){
  const host=partPose(p.mount,drive,spread,pulls),a=drive.mountAngles[index],c=Math.cos(a),s=Math.sin(a),o=p.offset,e=p.spreadOffset;
  const fixed=drive.mountPulls[index];
  if(pull>1e-5&&fixed!==null&&pulls===drive.pulls){const blend=drive.pullTargets[index]===0?Math.min(1,pull/Math.max(.001,drive.mountExtents[index])):1;host.position[2]+=(fixed-(pulls[p.mount]||0))*blend;}
  return {position:[host.position[0]+c*o[0]-s*o[1]+e[0]*t,host.position[1]+s*o[0]+c*o[1]+e[1]*t,host.position[2]+o[2]+e[2]*t+pull*(p.back?-1:1)],angle:drive.angles[index]+(p.kind==='bolt'?Math.min(1,t+pull)*Math.PI*6*(p.back?-1:1):0)};
 }
 const v=p.base.slice();if(p.orbitRadius){const a=drive.orbitAngles[index];v[0]+=p.orbitRadius*Math.cos(a);v[1]+=p.orbitRadius*Math.sin(a);}
 return {position:v.map((n,k)=>n+(p.open[k]-n)*t+(k===2?pull:0)),angle:drive.angles[index]};
}
