/* Author: Andrew Fisher. Public phone read-back of the finished Showcase. */
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const h=await open({gl:true,W:390,H:844,mobile:true,dpr:1}),p=h.page,checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);}
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.GC3D,null,{timeout:180000});const record=await p.evaluate(()=>JSON.stringify(S));
 check('public v11.86 with finishing module',await p.evaluate(()=>document.body.innerText.includes('v11.86')&&ShowcaseFinish1186.version===1186));
 await p.evaluate(()=>{window.liveRender1186=GC3D.render;GC3D.render=()=>{};GC3D.frame=()=>{};localStorage.setItem('gc500.showquality','crisp');localStorage.setItem('gc500.showvehicle','fencing_truck');localStorage.setItem('gc500.showback','circuit3d_day');showOpen();showPause();});
 await p.waitForFunction(()=>GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending,null,{timeout:180000});
 await p.locator('#showView').selectOption('detail');
 check('selected detail label matches camera',await p.evaluate(()=>GC3D.S.forceShot==='detail'&&document.querySelector('#showView option:checked').textContent==='Vehicle detail'));
 await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.sim.s=380;Q.sim.lat=0;Q.sim.latV=0;Q.sim.slip=0;Q.sim.air=0;Q.sim.v=0;Q.sim.pitch=0;Q.sim.roll=0;Q.sim.squash=0;Q.clock=30;Q.camBase=null;Q.camYaw=null;Q.camAnchor=null;Q.camDebug=null;Q.tune.shiftX=0;Q.shadowOff=true;Q.reflOff=true;Q.bloom=false;if(Q.fw)Q.fw.cam=false;G.pose();G.camStep(0);G.render=liveRender1186;const n=ShowcaseGPU1175.state().submitted;G.render();if(ShowcaseGPU1175.state().submitted!==n+1)throw Error('Frame not submitted');window.liveFence1186=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();});
 await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(liveFence1186,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:240000,polling:200});
 const report=await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.gl.deleteSync(liveFence1186);const model=G.plantModel('fencing_truck','high'),M=G.matMul(Q.visibilityVP918,G.raceCarMatrix()),b=model.bounds,pts=[];for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){const q=[x,y,z,1],v=[0,1,2,3].map(j=>q.reduce((a,n,k)=>a+n*M[k*4+j],0));pts.push([v[0]/v[3],v[1]/v[3],v[3]]);}return {framed:pts.every(v=>v[2]>0&&Math.abs(v[0])<.911&&Math.abs(v[1])<.911),graphics:G.graphicsReport(),stats:model.stats,glError:Q.gl.getError()};});
 check('whole loaded truck remains in the public detail frame',report.framed);
 check('native 4K clarity and edge smoothing retained',report.graphics.resolution[0]===2160&&report.graphics.samples===4&&report.graphics.quality==='crisp'&&report.glError===0,report.graphics);
 check('loaded branding retained',report.stats.stockLoaded&&report.stats.brandVersion===1180&&report.stats.loadVersion===1182);
 await p.screenshot({path:path.join(out,'phone-live.png'),timeout:180000});
 await p.getByRole('button',{name:'Options',exact:true}).click();check('phone Options remains usable',await p.locator('#showQuality').isVisible());
 await p.evaluate(()=>showClose());check('clean Close',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending));check('shared record unchanged',record===await p.evaluate(()=>JSON.stringify(S)));check('zero page errors and writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,'live.json'),JSON.stringify(checks,null,2));}
console.log(checks.filter(x=>x.ok).length+'/'+checks.length);process.exit(checks.every(x=>x.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
