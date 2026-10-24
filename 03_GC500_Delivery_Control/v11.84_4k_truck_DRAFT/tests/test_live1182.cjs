/* Author: Andrew Fisher. Public release UI and native 4K-clarity phone read-back. */
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const h=await open({gl:true,W:390,H:844,mobile:true,dpr:1}),p=h.page,checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));}
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.GC3D,null,{timeout:180000});const before=await p.evaluate(()=>JSON.stringify(S));
 check('public v11.84 with truck load and clarity code',await p.evaluate(()=>document.body.innerText.includes('v11.84')&&GC3D.fencingLoad1182?.version===1182&&ShowcaseClarity1182.version===1182));
 await p.evaluate(()=>{GC3D.frame=()=>{};localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showquality','crisp');localStorage.setItem('gc500.showvehicle','fencing_truck');showOpen();showPause();});
 await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending),null,{timeout:180000});
 await p.evaluate(()=>{showVehicleSet('fencing_truck');const G=GC3D,Q=G.S;G.syncRaceCarQuality(Q);Q.sim.s=380;Q.sim.lat=0;Q.sim.v=0;Q.sim.air=0;Q.sim.pitch=0;Q.sim.roll=0;Q.sim.squash=0;Q.clock=30;Q.camBase=null;Q.camYaw=null;Q.camDebug=null;if(Q.fw)Q.fw.cam=false;G.pose();G.setView('hero');G.camStep(0);G.render();window.liveFence1182=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();});
 await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(liveFence1182,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:240000,polling:200});
 const report=await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.gl.deleteSync(liveFence1182);return {graphics:G.graphicsReport(),stats:G.plantModel('fencing_truck',Q.quality.name).stats,vehicle:Q.vehicle,day:Q.look.day,error:Q.gl.getError()};});
 check('public loaded branded truck',report.vehicle==='fencing_truck'&&report.stats.loadVersion===1182&&report.stats.brandVersion===1180&&report.stats.stockLoaded,report.stats);
 check('native public clarity resolution and independent edge smoothing',report.graphics.quality==='crisp'&&report.graphics.resolution[0]===2160&&report.graphics.samples===4&&report.graphics.bloom===false&&report.day===1&&report.error===0,report.graphics);
 await p.screenshot({path:path.join(out,'phone-live.png'),timeout:180000});
 await p.getByRole('button',{name:'Options',exact:true}).click();check('clarity option accessible on phone',await p.locator('#showQuality').isVisible()&&await p.locator('#showQuality').inputValue()==='crisp');
 await p.evaluate(()=>showClose());check('clean Close',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending));check('shared record unchanged',before===await p.evaluate(()=>JSON.stringify(S)));check('zero page errors and attempted writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,'live.json'),JSON.stringify(checks,null,2));}
console.log(checks.filter(c=>c.ok).length+'/'+checks.length);process.exit(checks.every(c=>c.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
