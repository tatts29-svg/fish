/* Author: Andrew Fisher. Native 4K trackside scene, exact frame submission. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const h=await open({pageFile:process.env.PAGE,gl:true,W:1440,H:900,dpr:1}),p=h.page,checks=[];console.log('page loaded');
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);};
try{await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.ShowcaseIncident1195,null,{timeout:180000});const record=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>{window.uhd1195=GC3D.render;GC3D.render=()=>{};GC3D.frame=()=>{};localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showvehicle','fencing_truck');showOpen();showPause();});
 await p.waitForFunction(()=>GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending,null,{timeout:180000});console.log('scene mounted');
 await p.setViewportSize({width:3840,height:2400});
 for(let i=0;i<3;i++){const height=await p.evaluate(()=>GC3D.S.cv.clientHeight);if(height===2160)break;await p.setViewportSize({width:3840,height:p.viewportSize().height+2160-height});}
 await p.evaluate(()=>{const G=GC3D,Q=G.S,A=ShowcaseIncident1195;Q.shadowOff=true;Q.reflOff=true;G.setQuality('crisp');Q.clock=33;A.update(Q);Q.sim.s=Q.gridS+3*Q.CL.L;A.update(Q);const P=A.placement(Q);Q.incident1195.place=P;Q.sim.s=P.at+Q.CL.L*3-8*P.scale;Q.sim.lat=0;Q.sim.air=0;Q.sim.pitch=Q.sim.roll=0;Q.forceShot=null;G.pose();G.camStep(0);G.render=uhd1195;const n=ShowcaseGPU1175.state().submitted;G.render();if(ShowcaseGPU1175.state().submitted!==n+1)throw Error('4K frame not submitted');window.fence1195=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();});
 console.log('native 4K frame submitted');await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(fence1195,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:240000,polling:200});
 const report=await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.gl.deleteSync(fence1195);return {frame:[Q.cv.width,Q.cv.height],target:[Q.rt.w,Q.rt.h],samples:Q.rt.samples,error:Q.gl.getError(),state:ShowcaseIncident1195.state(),stats:ShowcaseIncident1195.model().stats,person:ShowcaseIncident1207.personModel().stats,view:Q.shotName};});
 check('native 3840 by 2160 target and four-sample smoothing',JSON.stringify(report.frame)==='[3840,2160]'&&JSON.stringify(report.target)==='[3840,2160]'&&report.samples===4,report);
 check('third-lap scene renders with two wordmarks and no GL error',report.state.active&&report.state.lap===3&&report.state.draws===1&&report.stats.logoCopies===2&&report.person.people===1&&report.state.personDraws===1&&report.error===0&&report.view==='incident1195');
 const b=await p.locator('canvas.gc3d').boundingBox(),file=path.join(out,'onsite-scene-4k.png');await p.screenshot({path:file,clip:{x:Math.ceil(b.x),y:Math.ceil(b.y),width:3840,height:2160},timeout:180000});const png=fs.readFileSync(file);check('saved preview is genuinely 3840 by 2160',png.readUInt32BE(16)===3840&&png.readUInt32BE(20)===2160);
 await p.evaluate(()=>showClose());check('Close frees the scene and shared record stays unchanged',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending)&&record===await p.evaluate(()=>JSON.stringify(S)));
 check('zero page errors or writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));}console.log(checks.length+'/'+checks.length);
})().catch(e=>{console.error(e);process.exit(1)});
