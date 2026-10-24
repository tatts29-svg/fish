/* Author: Andrew Fisher. Read-only actual scene, rendering, lap lifecycle and controls. */
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const h=await open({pageFile:process.env.PAGE,gl:true,W:390,H:844,mobile:true,dpr:1}),p=h.page,checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));}
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.ShowcaseIncident1195,null,{timeout:180000});const record=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>{window.incidentRender=GC3D.render;GC3D.render=()=>{};GC3D.frame=()=>{};localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.clarity1182','1');localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showvehicle','fencing_truck');showOpen();showPause();});
 await p.waitForFunction(()=>GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending,null,{timeout:180000});
 const init=await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.shadowOff=true;Q.reflOff=true;Q.bloom=false;Q.o.ss=1;const P=ShowcaseIncident1195.placement(Q);return {place:P?{...P,matrix:Array.from(P.matrix)}:null,stats:ShowcaseIncident1195.model().stats,initial:ShowcaseIncident1195.state()};});
 check('scene has an existing-barrier placement with clear racing line',init.place&&init.place.roadClearance>.5*init.place.scale,init);
 check('nothing is drawn before fifth lap',!init.initial?.active&&!init.initial?.resources);
 const timing=await p.evaluate(()=>{const G=GC3D,Q=G.S,A=ShowcaseIncident1195;Q.clock=30;Q.sim.s=Q.gridS+5*Q.CL.L-.01;A.update(Q);const before=A.state();Q.sim.v=5;G.step(1/60);const after=A.state();for(let i=0;i<30;i++)G.step(1/60);return {before,after,repeats:A.state(),position:Q.sim.s};});
 check('real simulation crossing lap five triggers once',!timing.before.active&&timing.after.active&&timing.after.lap===5&&timing.repeats.triggers===1,timing);
 await p.evaluate(()=>{const G=GC3D,Q=G.S,A=ShowcaseIncident1195;const P=Q.incident1195.place||A.placement(Q);Q.incident1195.place=P;Q.sim.s=P.at+5*Q.CL.L-8*P.scale;Q.sim.lat=0;Q.sim.air=0;Q.sim.pitch=Q.sim.roll=0;Q.forceShot=null;G.pose();G.camStep(0);});
 check('automatic director presents the incident on approach',await p.evaluate(()=>GC3D.S.shotName==='incident1195'));
 async function render(name){await p.evaluate(()=>{const G=GC3D,Q=G.S;G.render=incidentRender;const n=ShowcaseGPU1175.state().submitted;G.render();if(ShowcaseGPU1175.state().submitted!==n+1)throw Error('Frame not submitted');window.incidentFence=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();});await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(incidentFence,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:240000,polling:200});
  const data=await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.gl.deleteSync(incidentFence);G.render=()=>{};return {error:Q.gl.getError(),scene:ShowcaseIncident1195.state(),cam:Q.cam};});check(name+' frame draws the complete incident without GL errors',data.error===0&&data.scene.draws>0&&data.scene.resources,data);await p.screenshot({path:path.join(out,name+'.png'),timeout:180000});}
 await render('phone-incident');await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(100);await p.evaluate(()=>GC3D.camStep(0));await render('desktop-incident');
 await p.evaluate(()=>{GC3D.S.clock+=2.5;});await render('desktop-incident-later');
 check('manual camera is respected',await p.evaluate(()=>{const G=GC3D;G.S.forceShot='detail';G.camStep(0);return G.S.shotName!=='incident1195';}));
 const r=await p.evaluate(()=>{const G=GC3D,Q=G.S,A=ShowcaseIncident1195;Q.sim.s=Q.gridS+6*Q.CL.L;A.update(Q);const cleared=!A.state().active;Q.sim.s=Q.gridS+10*Q.CL.L;A.update(Q);const recur=A.state().active&&A.state().triggers===2;G.simReset();A.update(Q);return {cleared,recur,reset:!A.state().active&&!A.state().resources};});check('next lap clears, tenth lap recurs, restart frees resources',r.cleared&&r.recur&&r.reset,r);
 await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'Options',exact:true}).click();check('phone Options remains usable',await p.locator('#showQuality').isVisible());
 check('truck clarity and stunt module retained',await p.evaluate(()=>!!ShowcaseTruck1192&&GC3D.plantModel('fencing_truck','high').stats.detailVersion===1192));
 await p.evaluate(()=>showClose());check('clean Close',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending));check('shared record unchanged',record===await p.evaluate(()=>JSON.stringify(S)));check('zero page errors and writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));}
console.log(checks.filter(c=>c.ok).length+'/'+checks.length);process.exit(checks.length&&checks.every(c=>c.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
