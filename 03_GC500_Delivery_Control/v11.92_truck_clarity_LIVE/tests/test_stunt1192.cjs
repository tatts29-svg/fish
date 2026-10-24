/* Author: Andrew Fisher. Corner direction, tyre contact, easing and isolation. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),checks=[];
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);};
let curvature=.05,calls=0;const neutral=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const G={S:{vehicle:'fencing_truck',kAt:()=>curvature,pose:{pos:[0,0,0],fwd:[1,0,0],rt:[0,0,1]},tune:{carS:2,vmax:25,deckH:0},sim:{s:0,v:15,go:true,air:0,pitch:.02,roll:.02}},
 kAt:()=>curvature,step:()=>{calls++;return 'kept';},raceCarMatrix:()=>neutral};
const root={GC3D:G};vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../stunt1192_src.js'),'utf8'),{window:root,Float32Array});
let prev=0,maxDelta=0;for(let i=0;i<240;i++){G.step(1/60);const a=root.ShowcaseTruck1192.state().angle;maxDelta=Math.max(maxDelta,Math.abs(a-prev));prev=a;}
check('positive bend lifts inside side with a bounded smooth lean',prev>.46&&prev<=.48&&maxDelta<.025,{angle:prev,maxDelta});
const before={...G.S.sim};G.step(0);check('zero timestep does not advance stunt',root.ShowcaseTruck1192.state().angle===prev);
function support(){const M=G.raceCarMatrix(),feet=[];for(const x of [-1.65,1])for(const z of [-.43,.43]){
 let min=Infinity;for(const [r,d]of [[.11,-.072],[.18,-.072],[.202,-.055],[.205,-.025],[.205,.025],[.202,.055],[.18,.072],[.11,.072]])for(let i=0;i<720;i++){
 const t=i/720*2*Math.PI,q=[x+r*Math.cos(t),.205+r*Math.sin(t),z+d];min=Math.min(min,M[1]*q[0]+M[5]*q[1]+M[9]*q[2]+M[13]);}
 feet.push({x,z,y:min});}return feet;}
for(const sign of [1,-1]){curvature=sign*.05;for(let i=0;i<300;i++)G.step(1/60);const feet=support(),outer=feet.filter(p=>p.z*sign<0),inner=feet.filter(p=>p.z*sign>0);
 check((sign>0?'right':'left')+' corner keeps exactly two tyres grounded',outer.every(p=>Math.abs(p.y)<.00002)&&inner.every(p=>p.y>.7),feet);
 const verts=[],shade={vert:(...p)=>{verts.push(p);return verts.length-1;},tri:()=>{}};G.truckContacts1192(G.S,shade,.002);
 check('contact patches follow only grounded tyres '+sign,G.S.truckContact1192.grounded===2&&verts.filter(v=>v[6]>.7).length===2);
 check('finite banked transform '+sign,Array.from(G.raceCarMatrix()).every(Number.isFinite));}
curvature=0;for(let i=0;i<360;i++)G.step(1/60);check('settles on straight',Math.abs(root.ShowcaseTruck1192.state().angle)<.00001);
for(const mode of ['stopped','calm','reduced-motion','airborne']){curvature=.05;G.S.sim.truckStunt1192={angle:.48,lead:.48,target:.48};
 G.S.sim.v=mode==='stopped'?0:15;G.S.calmDrive=mode==='calm';G.S.reducedMotion=mode==='reduced-motion';G.S.sim.air=mode==='airborne'?.1:0;
 for(let i=0;i<360;i++)G.step(1/60);check(mode+' settles without stunt',Math.abs(root.ShowcaseTruck1192.state().angle)<.00001);}
G.S.vehicle='car';check('existing non-truck matrix returned unchanged',G.raceCarMatrix()===neutral);check('existing simulation still called and result preserved',G.step(1/60)==='kept'&&calls>1000);check('switching vehicle clears stunt state',!G.S.sim.truckStunt1192);
check('driving quantities untouched',G.S.sim.s===before.s&&G.S.sim.pitch===before.pitch&&G.S.sim.roll===before.roll);
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(checks,null,2));
