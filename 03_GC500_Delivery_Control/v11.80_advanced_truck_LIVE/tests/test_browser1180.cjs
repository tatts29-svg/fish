/* Author: Andrew Fisher. Read-only truck selection, rendering, geometry and lifecycle. */
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
const mobile=process.env.MOB==='1',out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));}
(async()=>{const h=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,gl:true,W:mobile?390:1280,H:mobile?844:800,mobile,dpr:1}),p=h.page;
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.GC3D,null,{timeout:180000});
 const record=await p.evaluate(()=>JSON.stringify(S));
 check('v11.80 company vehicle source present',await p.evaluate(()=>document.body.innerText.includes('v11.80')&&GC3D.fencingBrand1180?.version===1180));
 await p.evaluate(()=>{GC3D.frame=()=>{};localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showvehicle','car');showOpen();showPause();});
 await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending),null,{timeout:180000});
 check('garage visible after paused mount',await p.locator('#seTrig').isVisible());
 await p.locator('#seTrig').click();check('eight vehicle choices',await p.locator('#sePanel .se-item').count()===8);
 await p.locator('#sePanel [data-v="fencing_truck"]').click();await p.locator('#sePanel .se-x').click();
 check('truck selected and retained',await p.evaluate(()=>GC3D.S.vehicle==='fencing_truck'&&showVehicleGet()==='fencing_truck'));
 async function frame(view){
  await p.evaluate(view=>{const G=GC3D,Q=G.S;Q.sim.s=380;Q.sim.lat=0;Q.sim.latV=0;Q.sim.slip=0;Q.sim.air=0;Q.sim.v=0;Q.sim.pitch=0;Q.sim.roll=0;Q.sim.squash=0;Q.clock=30;Q.camBase=null;Q.camYaw=null;Q.camAnchor=null;Q.camDebug=null;if(Q.fw)Q.fw.cam=false;G.pose();Q.shadowOff=true;Q.reflOff=true;Q.bloom=false;Q.o.ss=1;G.setView(view);G.camStep(0);G.render();window.brandFence1180=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();},view);
  await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(brandFence1180,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:180000,polling:200});
  check(view+' render has no graphics error',await p.evaluate(()=>{const gl=GC3D.S.gl;gl.deleteSync(brandFence1180);return gl.getError()===0}));
 }
 await frame('hero');
 const info=await p.evaluate(()=>{const G=GC3D,Q=G.S,t=G.plantModel('fencing_truck',Q.quality?.name),M=G.matMul(Q.visibilityVP918,G.raceCarMatrix()),b=t.bounds,pts=[];for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){const q=[x,y,z,1],v=[0,1,2,3].map(j=>q.reduce((a,n,k)=>a+n*M[k*4+j],0));pts.push({x:v[0]/v[3],y:v[1]/v[3],w:v[3]});}return {stats:t.stats,frames:pts.every(p=>p.w>0&&Math.abs(p.x)<1.01&&Math.abs(p.y)<1.01),parts:Q.raceCarParts.length};});
 check('loaded truck with company logo stays within geometry budget',info.stats.stockLoaded&&info.stats.brandVersion===1180&&info.stats.logoCopies===3&&info.stats.newTextures===0&&info.stats.triangles<20000&&info.parts<45,info);console.log('MODEL',JSON.stringify(info));
 check('whole truck and load fit native camera',info.frames);
 await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-truck.png'),timeout:120000});
 await frame('chase');await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-load.png'),timeout:120000});
 check('Day and scenery retained',await p.evaluate(()=>GC3D.S.look.day===1&&GC3D.S.scenery1179.panels>250&&document.getElementById('showcase').dataset.back==='circuit3d_day'));
 check('truck advances on the existing circuit',await p.evaluate(()=>{const G=GC3D,Q=G.S,s=Q.sim.s;for(let i=0;i<120;i++)G.step(1/60);return Number.isFinite(Q.sim.s)&&Q.sim.s!==s;}));
 await p.evaluate(()=>{showVehicleSet('car_vms');GC3D.syncRaceCarQuality(GC3D.S);});check('existing tow choice retained',await p.evaluate(()=>GC3D.S.vehicle==='car'&&GC3D.S.towVms));
 await p.evaluate(()=>showClose());
 check('Close releases scene and truck cache',await p.evaluate(()=>!GC3D.S&&!GC3D._fencingTrucks1179&&!ShowcaseSmooth1157.state().pending));
 check('shared record untouched',record===await p.evaluate(()=>JSON.stringify(S)));
 check('no page errors or attempted writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'.json'),JSON.stringify(checks,null,2));}
console.log(checks.filter(q=>q.ok).length+'/'+checks.length);process.exit(checks.every(q=>q.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
