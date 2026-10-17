/* Author: Andrew Fisher. CPU proof for the real Detail / Front detail rigs.
 * node camera800_checks.cjs --base CAMERA_INPUT_HTML --page CAMERA_OUTPUT_HTML
 * [--fixtures PRIVATE_FOCUS_JSON] [--output REPORT_JSON]
 * No GPU/browser; exact cached model vertices, actual circuit and 120Hz held poses.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const args=process.argv.slice(2),opt=(n,d)=>{const i=args.indexOf(n);return i<0?d:args[i+1];},root=path.resolve(__dirname,'..');
const baseFile=opt('--base',path.join(root,'../build/GC500_v8.00/GC500_Delivery_Control_hosted.html')),pageFile=opt('--page','/workspace/private-v800-vehicle-review/camera800_candidate.html');
const base=fs.readFileSync(baseFile,'utf8'),html=fs.readFileSync(pageFile,'utf8'),source=fs.readFileSync(path.join(root,'camera800_src.js'),'utf8'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const checks=[],rows=[],ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)console.error(name,detail||'');};
const take=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);};
function assignment(s,name){
 const start=s.indexOf(name);assert(start>=0,name);let p=s.indexOf('{',start),depth=0,quote=null,comment=null;
 for(;p<s.length;p++){
  const c=s[p],n=s[p+1];
  if(comment==='line'){if(c==='\n')comment=null;continue;}
  if(comment==='block'){if(c==='*'&&n==='/'){comment=null;p++;}continue;}
  if(quote){if(c==='\\'){p++;continue;}if(c===quote)quote=null;continue;}
  if(c==='/'&&n==='/'){comment='line';p++;continue;}if(c==='/'&&n==='*'){comment='block';p++;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='{')depth++;if(c==='}'&&--depth===0)return s.slice(start,p+1)+';';
 }
 throw Error('Unclosed '+name);
}
function moduleAt(s,marker){const p=s.lastIndexOf('(function(){',s.indexOf(marker)),q=s.indexOf('\n})();',p);assert(p>=0&&q>p,marker);return s.slice(p,q+6);}
const data=JSON.parse(html.match(/const DATA\s*=\s*(.*);/)[1]);
const modelSource=take(html,'G.PLANT=','G.syncRaceCarQuality=function');
const camera=moduleAt(html,'G.VIEWS=');
const engine=take(html,'G.packPts=(pk','\n')+'\n'+take(html,'G.rng = function(seed)','\n')+'\n'+take(html,'const area=G.area=','/* ear clipping')+take(html,'G.M_PER_PT =','/* Day Race')+take(html,'G.units=function(T)','/* What the scene')+take(html,'G.simReset=function()','/* everything that is rebuilt');
const geometry=take(html,' /* key plan → world:',' /* ----- static batches ----- */');
const vectorSource=assignment(html,'G.V =')+assignment(html,'G.matMul =')+assignment(html,'G.raceCarMatrix=function');
const actualFixtures=opt('--fixtures',null),fixtures=actualFixtures?JSON.parse(fs.readFileSync(actualFixtures,'utf8')):null;
if(fixtures)assert(fixtures.views.filter(v=>v.cameraFixture).every(v=>v.cameraFixture.drawMatrices&&v.cameraFixture.drawMatrices.every(q=>Object.hasOwn(q,'wheel'))),'Held-pose fixtures must contain unambiguous per-part motion metadata');
function rig(vehicle,asp){
 const G={camStep(){},carModel:()=>({}),render(){},setQuality(){},init(){},frame(){},carS:1},S={car:{},quality:{name:'balanced'},o:{ss:1},cv:{clientWidth:1000*asp,clientHeight:1000,style:{}},look:{day:true},detail781Enabled:true};G.S=S;
 const ctx=vm.createContext({G,S,data,window:{GC3D:G,innerWidth:1000*asp,innerHeight:1000},document:{hidden:false},console,Float32Array,Uint32Array,Math,Number});
 vm.runInContext(vectorSource+'\nconst V=G.V;'+engine,ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'racecar800_src.js'),'utf8'),ctx);
 const rects=html.match(/const rects=\{coates:[^\n]+/)[0],ds=html.indexOf('G.raceCarDecals=function(){'),de=html.indexOf('\n})();',ds);
 vm.runInContext('(function(){const G=window.GC3D,W=1024,H=512;'+rects+'\n'+html.slice(ds,de)+'\n})();',ctx);
 vm.runInContext(modelSource,ctx);
 vm.runInContext('const HW=.395;S.tune=G.defaultTune();S.tune.tc=1;G.units(S.tune);const o={ring:data.circuit.ring,roadWidth:data.circuit.roadWidth,pit:data.surrounds.pit.map(r=>G.packPts(data.surrounds,r,1))};'+geometry+'\nG.setVehicle('+JSON.stringify(vehicle)+');G.simReset();',ctx);
 for(let i=0;i<1440;i++){G.step(1/120);if(S.towVms)G.trailerStep(S);G.swayStep(S);}
 if(fixtures){const view=fixtures.views.find(v=>v.vehicleKey===vehicle||v.id==='desktop-'+vehicle.replace('_','-')+'-day'||v.cameraFixture?.vehicleKey===vehicle),f=view?.cameraFixture;assert(f,'Missing private held-pose fixture '+vehicle);const CL=S.CL;Object.assign(S,JSON.parse(JSON.stringify(f)));S.CL=Object.assign(CL,f.CL);S.clock=f.clock===undefined?view.before.clock:f.clock;S.corridor794=f.corridor&&Object.assign({active:true},f.corridor);S.cv={clientWidth:1000*asp,clientHeight:1000,style:{}};S.quality={name:'balanced'};if(f.worldBuildings){S.architecture781Source=f.worldBuildings.map(b=>({p:b.P,h:b.h}));S.toWorld=p=>p;}S.fixture800=f;}
 S.paused=true;S.sim.smoke=[];S.heightAt=()=>0;
 // Use the source's actual corrected boundary band without a GL installation.
 if(!S.corridor794){const C=S.CL.p,N=S.CL.n||C.length,loops=[1,-1].map(side=>C.map((p,i)=>{const a=C[(i+N-1)%N],b=C[(i+1)%N],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);return[p[0]-side*dz/len*p[2]/2,p[1]+side*dx/len*p[2]/2];}));S.corridor794={active:true,outer:loops[0],inner:loops[1]};}
 vm.runInContext(camera,ctx);G.render=()=>{};vm.runInContext(fs.readFileSync(path.join(root,'../v7.94_showcase_lap_cameras_LIVE/camera794_src.js'),'utf8'),ctx);vm.runInContext(source,ctx);return{G,S,ctx};
}
const names=['car','car_vms','car_loo','forklift','boom','scissor','tractor'],aspects=[.55,.75,16/9,2.5];
ck('candidate embeds exact camera extension',html.includes(source));
for(const name of ['G.step=function','G.pose=function','G.setVehicle=function','G.trailerStep=function','G.swayStep=function','G.looStep=function','G.raceCarMatrix=function'])ck('protected '+name,assignment(base,name)===assignment(html,name));
ck('existing seven-choice selection is unchanged',take(base,'const SE_LIST =','function showViewGet')===take(html,'const SE_LIST =','function showViewGet'));
for(const vehicle of names)for(const view of ['detail','frontdetail'])for(const asp of aspects){
 const {G,S}=rig(vehicle,asp),motion=JSON.stringify({sim:S.sim,pose:S.pose,trailer:S.trailer,sway:S.sway,loo:S.loo});
 G.setView(view);G.camStep(0);for(let i=0;i<60;i++)G.camStep(1/60);
 const report=G.vehicleCameraReport800(),B=G.vehicleCamera800.bounds(S),q=G.vehicleCamera800.project(S,S.cam,B.points);
 const row={vehicle,view,aspect:asp,maxX:Math.max(...q.map(p=>Math.abs(p.x))),maxY:Math.max(...q.map(p=>Math.abs(p.y))),minDepth:Math.min(...q.map(p=>p.z)),clear:report.clear,points:B.points.length,eye:S.cam.eye,target:S.cam.tgt,fov:S.cam.fov};rows.push(row);
 ck(vehicle+' '+view+' '+asp+' complete animated conservative bounds visible',q.length>0&&q.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.z>.035&&Math.abs(p.x)<.94&&Math.abs(p.y)<.94),row);
 ck(vehicle+' '+view+' '+asp+' fence sight lines clear',report.clear,row);
 ck(vehicle+' '+view+' '+asp+' fitting does not advance simulation/attachments',motion===JSON.stringify({sim:S.sim,pose:S.pose,trailer:S.trailer,sway:S.sway,loo:S.loo}));
 if(S.fixture800&&S.fixture800.drawMatrices){
  const C=G.vehicleCamera800,level='balanced',models=[['car',S.vehicle==='car'?G.raceCarModel(level):G.plantModel(S.vehicle,level)]];
  if(S.vehicle==='car')models.push(['car',{parts:G.raceCarDecals()}]);if(S.towVms)models.push(['trailer',S.towKind==='loo'?G.looModel(level):G.vmsModel(level)]);
  const actual=[];let missing=0,reusedMotionGroups=0;
  const motion=p=>JSON.stringify([p.wheel||null,p.sway||null,p.door||null,p.arm||null]);
  for(const [role,model]of models)for(const part of model.parts){let found=S.fixture800.drawMatrices.find(q=>q.role===role&&q.name===part.name&&q.material===part.material&&motion(q)===motion(part));
   // New fixed fittings and invisible speed-blurred spokes can share an actual
   // captured draw matrix with another part having exactly the same motion tags.
   if(!found){found=S.fixture800.drawMatrices.find(q=>q.role===role&&motion(q)===motion(part));if(found)reusedMotionGroups++;}
   if(!found){missing++;continue;}for(let i=0;i<part.vertices.length;i+=8)actual.push(C.world(found.matrix,part.vertices.slice(i,i+3)));}
  const projected=C.project(S,S.cam,actual);
  ck(vehicle+' '+view+' '+asp+' exact source vertices with independently captured renderer matrices fit',missing===0&&projected.length>0&&projected.every(p=>p.z>.035&&Math.abs(p.x)<.94&&Math.abs(p.y)<.94),{vertices:projected.length,missingParts:missing,reusedIdenticalMotionGroups:reusedMotionGroups});
 }
}
// A held transition is integrated for the same elapsed wall time at three rates.
for(const vehicle of ['car_vms','scissor']){
 const endpoints=[];
 for(const hz of [30,60,120]){const {G,S}=rig(vehicle,16/9);G.setView('detail');G.camStep(0);S.camBase.eye[1]+=.6;for(let i=0;i<hz;i++)G.camStep(1/hz);endpoints.push({hz,eye:S.cam.eye,tgt:S.cam.tgt});}
 const delta=Math.max(...endpoints.flatMap(e=>e.eye.map((v,k)=>Math.abs(v-endpoints[2].eye[k])).concat(e.tgt.map((v,k)=>Math.abs(v-endpoints[2].tgt[k])))));
 ck(vehicle+' equal-time camera settles consistently at30/60/120Hz',delta<.03,{delta,endpoints});
}
{
 const {G,S}=rig('car_loo',16/9);G.setView('detail');G.camStep(0);if(!S.loo)G.looStep(S);S.loo.ph='open';S.loo.a=1.8;S.loo.arm=.5;G.camStep(0);
 ck('explicit portaloo detail stays on the full combination while its door opens',S.shotName==='detail'&&G.vehicleCameraReport800().maxX<.94&&G.vehicleCameraReport800().maxY<.94);
 const before=G.vehicleCamera800.bounds(S);S.tune.carS*=1.1;const after=G.vehicleCamera800.bounds(S);ck('paused scale change invalidates cached world bounds',before!==after&&after.hi.some((v,i)=>Math.abs(v-before.hi[i])>1e-4));
 S.exportSize=[900,1600];G.render();ck('export aspect refits the active detail camera',Math.abs(G.vehicleCameraReport800().aspect-900/1600)<1e-12&&G.vehicleCameraReport800().maxX<.94&&G.vehicleCameraReport800().maxY<.94);
 delete S.exportSize;S.cv.clientWidth=2400;G.render();ck('paused viewport resize refits the active detail camera',G.vehicleCameraReport800().aspect===2.4&&G.vehicleCameraReport800().maxX<.94&&G.vehicleCameraReport800().maxY<.94);
}
{
 const {G,S}=rig('car',16/9);G.setView('top');G.camStep(0);ck('794 overview is active before detail selection',!!S.camera794.active);G.setView('detail');G.camStep(0);ck('794 overview delegates to actual selected detail without lens mismatch',!S.camera794.active&&G.vehicleCameraReport800().active&&G.vehicleCameraReport800().maxX<.94&&G.vehicleCameraReport800().maxY<.94);
 const B=G.vehicleCamera800.bounds(S),p=S.cam.eye,c=.12;S.architecture781Source=[{p:[[p[0]-c,p[2]-c],[p[0]+c,p[2]-c],[p[0]+c,p[2]+c],[p[0]-c,p[2]+c]],h:3}];S.toWorld=p=>p;
 ck('source building footprint overrides an empty legacy height field',G.vehicleCamera800.height(S,p)===3);
 G.camStep(0);ck('camera raises above or avoids a source building without cropping',G.vehicleCameraReport800().clear&&G.vehicleCameraReport800().maxX<.94&&G.vehicleCameraReport800().maxY<.94);
 S.architecture781Source=[{p:[[-100,-100],[100,-100],[100,100],[-100,100]],h:100}];const failed=G.vehicleCamera800.fit(S,'detail',S.cam,B,true);ck('unresolvable source obstruction reports false instead of claiming clearance',failed.clear800===false);
}
const timing=[];
for(const vehicle of ['car','car_vms','scissor']){const {G,S}=rig(vehicle,16/9);G.setView('detail');G.camStep(0);const start=performance.now();for(let i=0;i<120;i++){S.clock+=1/120;S.sim.wheel+=.04;S.pose=Object.assign({},S.pose);G.camStep(1/120);}timing.push({vehicle,iterations:120,meanMilliseconds:(performance.now()-start)/120});}
const report={author:'Andrew Fisher',scope:'Selected-vehicle actual UI camera CPU checks',sourceSha256:sha(source),baseSha256:sha(base),pageSha256:sha(html),actualPoseFixtures:actualFixtures?sha(fs.readFileSync(actualFixtures)):null,heldPoseSeconds:fixtures?'per accepted captured pose':12,aspects,vehicleViews:rows.length,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,limitations:['CPU proof; final real Detail and Front detail desktop/phone screenshots still required.','CPU timing is a diagnostic on this host, not a browser/phone frame-rate benchmark.','Building height sampling uses supplied source-world footprints where available and a synthetic obstruction fixture otherwise.'],timing,checks,rows};
fs.writeFileSync(opt('--output',path.join(__dirname,'camera800_checks.json')),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,vehicleViews:rows.length,failures:checks.filter(x=>!x.pass).map(x=>x.name)},null,2));process.exitCode=report.failed?1:0;
