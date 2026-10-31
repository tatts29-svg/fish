/* Author: Andrew Fisher. Read-only native scene, selection and preservation checks. */
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
const mob=process.env.MOB==='1',out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));}
(async()=>{const h=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,gl:true,W:mob?390:1280,H:mob?844:800,mobile:mob,dpr:1}),p=h.page;
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.ShowcaseStable1175,null,{timeout:180000});const record=await p.evaluate(()=>JSON.stringify(S));
 check('v11.79 and vehicle registered',await p.evaluate(()=>document.body.innerText.includes('v11.79')&&!!GC3D.PLANT.fencing_truck));
 await p.evaluate(()=>{GC3D.frame=()=>{};localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showvehicle','car');showOpen();showPause();});
 await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending)||!!ShowcaseSmooth1157.state().error,null,{timeout:180000});
 check('cooperative scene ready',await p.evaluate(()=>!!GC3D.S&&!ShowcaseSmooth1157.state().error&&!GC3D.S.dressError));
 const initial=await p.evaluate(()=>{const Q=GC3D.S;return {scene:Q.scenery1179,day:Q.look.day,back:document.getElementById('showcase').dataset.back,pines:Q.vegetation781Source.filter(q=>q.conifer1179).length,geometry:Object.fromEntries(['dayTrees','dayTreeTrunks','trackConcrete','trackFencePosts','standMesh','standDecor'].map(k=>[k,Q[k]?.ni]))};});
 check('bounded wall panels and varied labels built',initial.scene.panels>250&&initial.scene.triangles<=initial.scene.triangleBudget&&Object.keys(initial.scene.labelsByName).length>10,initial.scene);
 check('coastal trees and Day retained',initial.pines>0&&initial.day===1&&initial.back==='circuit3d_day',initial);console.log('SCENE',JSON.stringify(initial));
 check('garage available after paused asynchronous load',await p.locator('#seTrig').isVisible());
 await p.locator('#seTrig').click();check('eight garage options visible',await p.locator('#sePanel .se-item').count()===8);
 await p.locator('#sePanel [data-v="fencing_truck"]').click();
 await p.locator('#sePanel .se-x').click();
 check('truck selected and saved locally',await p.evaluate(()=>GC3D.S.vehicle==='fencing_truck'&&showVehicleGet()==='fencing_truck'));
 async function gpuDone(){await p.evaluate(()=>{const gl=GC3D.S.gl;window.fence1179=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();});await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(fence1179,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:180000,polling:200});await p.evaluate(()=>GC3D.S.gl.deleteSync(fence1179));}
 async function ready(){await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending),null,{timeout:180000});}
 async function frame(s,view,file){await p.evaluate(({s,view})=>{const G=GC3D,Q=G.S;Q.sim.s=s;Q.sim.lat=0;Q.sim.latV=0;Q.sim.slip=0;Q.sim.air=0;Q.sim.v=0;Q.sim.pitch=0;Q.sim.roll=0;Q.sim.squash=0;Q.clock=30;Q.camBase=null;Q.camYaw=null;Q.camAnchor=null;Q.camDebug=null;if(Q.fw)Q.fw.cam=false;G.pose();G.setView(view);G.camStep(0);Q.o.ss=.6;Q.shadowOff=true;Q.reflOff=true;Q.bloom=false;G.render();},{s,view});await gpuDone();check('render '+s+' '+view+' GL state',await p.evaluate(()=>GC3D.S.gl.getError()===0));if(file)await p.screenshot({path:path.join(out,(mob?'phone':'desktop')+'-'+file+'.png'),timeout:120000});}
 await frame(380,'hero','truck');const truck=await p.evaluate(()=>({...GC3D.S.raceCarStats,camera:(()=>{const G=GC3D,Q=G.S,M=G.matMul(Q.visibilityVP918,G.raceCarMatrix()),b=G.plantModel('fencing_truck','balanced').bounds,pts=[];for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){const q=[x,y,z,1],v=[0,1,2,3].map(j=>q.reduce((a,n,k)=>a+n*M[k*4+j],0));pts.push({x:v[0]/v[3],y:v[1]/v[3],w:v[3]});}return {active:pts.every(p=>p.w>0&&Number.isFinite(p.x+p.y)),maxX:Math.max(...pts.map(p=>Math.abs(p.x))),maxY:Math.max(...pts.map(p=>Math.abs(p.y))),cam:Q.cam};})(),vehicle:GC3D.S.vehicleKey,lowDay:GC3D.S.look.day,glError:GC3D.S.gl.getError()}));
 check('truck native mesh under budget',truck.triangles<20000&&truck.parts<=45&&truck.vehicle==='fencing_truck',truck);
 check('native truck frame has no GL error',truck.glError===0&&truck.lowDay===1,truck);
 check('follow camera frames truck',truck.camera?.active&&truck.camera.maxX<1.01&&truck.camera.maxY<1.01,truck.camera);
 await p.evaluate(()=>{showVehicleSet('car');document.getElementById('showVehicle').value='car';});
 await frame(260,'chase','coastal');await frame(128,'onboard','straight');
 // Exercise enhanced corridor/label replacement once, using the existing lifecycle.
 await p.evaluate(()=>GC3D.enableFullLap788(true));for(let i=0;i<4;i++){await frame(380,'chase');}const detail=await p.evaluate(()=>({track:!!GC3D.S.trackDetail781,architecture:!!GC3D.S.architecture781,vegetation:!!GC3D.S.vegetation781, corridor:GC3D.corridorReport794(),error:GC3D.S.fullLapFailed788||null}));console.log('DETAIL',JSON.stringify(detail));
 await frame(380,'chase','pit');
 check('enhanced scene has no banner/corridor failure',await p.evaluate(()=>!GC3D.S.fullLapFailed788&&!GC3D.S.corridor794?.failed&&GC3D.S.corridor794?.active),detail);
 await p.evaluate(()=>showSetBack('circuit3d'));await ready();await frame(360,'hero','night');check('Night selection works',await p.evaluate(()=>GC3D.S.look.day===0&&document.getElementById('showcase').dataset.back==='circuit3d'));
 await p.evaluate(()=>{showSetBack('circuit3d_day');showVehicleSet('fencing_truck');});await ready();await frame(370,'hero');
 const clock=await p.evaluate(()=>{const G=GC3D,Q=G.S,s=Q.sim.s;for(let i=0;i<120;i++)G.step(1/60);return {before:s,after:Q.sim.s,finite:Number.isFinite(Q.sim.s)&&Q.sim.s!==s};});check('truck runs along existing circuit',clock.finite,clock);
 await p.evaluate(()=>{showVehicleSet('car_vms');GC3D.syncRaceCarQuality(GC3D.S);});check('existing tow choice still works',await p.evaluate(()=>GC3D.S.vehicle==='car'&&GC3D.S.towVms));
 await p.evaluate(()=>{showVehicleSet('fencing_truck');showClose();showOpen();});await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending),null,{timeout:180000});check('reopen retains fencing truck',await p.evaluate(()=>showVehicleGet()==='fencing_truck'&&GC3D.S.vehicle==='fencing_truck'));
 await p.evaluate(()=>showClose());check('Close releases scene',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending));
 check('shared record untouched',record===await p.evaluate(()=>JSON.stringify(S)));check('no page errors or attempted writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,(mob?'phone':'desktop')+'.json'),JSON.stringify(checks,null,2));}
console.log(checks.filter(x=>x.ok).length+'/'+checks.length);process.exit(checks.every(x=>x.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
