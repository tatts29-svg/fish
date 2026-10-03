// Illustrative standard 20° spur gearing. KHK gear-system and involute references are in README.
export const GEAR={sun:24,planet:24,ring:72,module:1.68/36,pressure:20*Math.PI/180,orbit:1.12,ratio:4};
const inv=a=>Math.tan(a)-a;
export function toothOutline(teeth,module=GEAR.module,internal=false){
 const pitch=teeth*module/2,base=pitch*Math.cos(GEAR.pressure),tip=pitch+(internal?-1:1)*module,root=pitch+(internal?1.25:-1.25)*module;
 const involute=r=>inv(Math.acos(Math.min(1,base/r))),atPitch=involute(pitch),half=r=>Math.PI/(2*teeth)+(internal?-1:1)*(atPitch-involute(Math.max(base,r)))-.001;
 const points=[],put=(r,a)=>points.push([r*Math.cos(a),r*Math.sin(a)]),step=2*Math.PI/teeth;
 for(let n=0;n<teeth;n++){
  const c=n*step,start=internal?root:Math.max(root,base),end=tip;
  put(root,c-half(start));if(!internal&&root<base)put(base,c-half(base));
  for(let k=0;k<=7;k++){const r=start+(end-start)*k/7;put(r,c-half(r));}
  for(let k=1;k<=4;k++)put(tip,c-half(tip)+2*half(tip)*k/4);
  for(let k=6;k>=0;k--){const r=start+(end-start)*k/7;put(r,c+half(r));}
  put(root,c+half(start));
  for(let k=1;k<=4;k++)put(root,c+half(start)+(step-2*half(start))*k/4);
 }
 return points;
}
export function stageFraction(part,spread){const [start,end]=part.stage||[0,1];const t=Math.max(0,Math.min(1,(spread-start)/(end-start)));return t*t*(3-2*t);}
