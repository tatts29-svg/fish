/* Author: Andrew Fisher. Preserve operational data, scene assets and unrelated vehicle behaviour. */
const fs=require('fs'),vm=require('vm');
const base=fs.readFileSync(process.env.BASE,'utf8'),page=fs.readFileSync(process.env.PAGE,'utf8'),checks=[];
function check(name,ok){checks.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name);}
function part(s,a,b){const start=s.indexOf(a);if(start<0)throw Error(a);const end=s.indexOf(b,start);if(end<0)throw Error(b);return s.slice(start,end);}
check('embedded operational data and media unchanged',base.match(/const DATA = (.*);/)[1]===page.match(/const DATA = (.*);/)[1]);
for(const [name,a,b] of [
 ['vehicle selection and dynamics','G.setVehicle=function(kind){','G.compactRaceCarParts1091=function(parts){'],
 ['driving simulation','G.simReset=function(){','G.buildDynamic=function(){'],
]){
 check(name+' preserved',part(base,a,b)===part(page,a,b));
}
const scripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);const A=scripts(base),B=scripts(page);
check('all unrelated inline scripts byte-identical',A.every((s,i)=>[4,5].includes(i)||s===B[i]));
check('only truck stunt module added',B.length===A.length+1&&B[B.length-1].includes('ShowcaseTruck1192'));
for(const marker of ['root.ShowcaseClarity1182','root.ShowcaseStable1175','root.ShowcaseGPU1175','id \'fence_blocks\'']){const i=A.findIndex(s=>s.includes(marker));if(i>=0)check(marker+' preserved',A[i]===B[i]);}
check('v11.85 feet presentation preserved',part(base,'<script id="feet1185-script">','</script>')===part(page,'<script id="feet1185-script">','</script>'));
function camera(html){return vm.runInNewContext('const D2R=Math.PI/180;'+part(html,'function angle(name,S,seed,lockedSide){','function clearOf(')+';angle');}
const ca=camera(base),cb=camera(page),shots=['grid','low','chase','quarter','detail','frontdetail','brake','nose','onboard','wheel','trackside','hero','heli','orbit','top','wide'];
for(const kind of ['car','forklift','boom','scissor','tractor','tow']){const S={vehicle:kind==='tow'?'car':kind,towVms:kind==='tow',pose:{pos:[5,0,7],hd:.4},clock:30,tune:{carS:2,cameraFrame:1.05,vmax:30},sim:{v:15,slip:.1,throttle:.5,brake:0},camYaw:.4};check(kind+' all camera rigs preserved',shots.every(n=>JSON.stringify(ca(n,S,1,1))===JSON.stringify(cb(n,S,1,1))));}
const own={vehicle:'fencing_truck',pose:{pos:[5,0,7],hd:.4},clock:30,tune:{carS:2,cameraFrame:1.05,vmax:30},sim:{v:15,slip:.1,throttle:.5,brake:0},camYaw:.4};check('all truck cameras preserved',shots.every(n=>JSON.stringify(ca(n,own,1,1))===JSON.stringify(cb(n,own,1,1))));
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(checks,null,2));console.log(checks.filter(x=>x.ok).length+'/'+checks.length);process.exit(checks.every(x=>x.ok)?0:1);
