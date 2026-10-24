/* Author: Andrew Fisher. Final-candidate UHD truck frame; read-only browser. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const h=await open({pageFile:process.env.PAGE,gl:true,W:3840,H:2400,dpr:1}),p=h.page;const checks=[];
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);};
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.GC3D,null,{timeout:180000});
 const record=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>{window.uhdRender1192=GC3D.render;GC3D.render=()=>{};GC3D.frame=()=>{};localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showquality','crisp');localStorage.setItem('gc500.showvehicle','fencing_truck');showOpen();showPause();});
 await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending),null,{timeout:180000});
 for(let i=0;i<3;i++){const height=await p.evaluate(()=>GC3D.S.cv.clientHeight);if(height===2160)break;await p.setViewportSize({width:3840,height:p.viewportSize().height+2160-height});}
 await p.evaluate(()=>{const G=GC3D,Q=G.S;showVehicleSet('fencing_truck');G.syncRaceCarQuality(Q);Q.sim.s=380;Q.sim.lat=0;Q.sim.v=0;Q.sim.air=0;Q.sim.pitch=0;Q.sim.roll=0;Q.sim.truckStunt1192={angle:.48,lead:.48,target:.48};Q.sim.squash=0;Q.clock=30;Q.camBase=null;Q.camYaw=null;Q.camDebug=null;if(Q.fw)Q.fw.cam=false;Q.reflOff=true;Q.shadowOff=true;G.pose();G.setView('hero');Q.forceShot='quarter';G.camStep(0);G.render=uhdRender1192;const n=ShowcaseGPU1175.state().submitted;G.render();if(ShowcaseGPU1175.state().submitted!==n+1)throw Error('UHD pose frame not submitted');window.uhdFence1182=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();});
 await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(uhdFence1182,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:240000,polling:200});
 const info=await p.evaluate(()=>{const Q=GC3D.S;Q.gl.deleteSync(uhdFence1182);return {buffer:[Q.cv.width,Q.cv.height],target:[Q.rt.w,Q.rt.h],samples:Q.rt.samples,view:Q.shotName,vehicle:Q.vehicle,error:Q.gl.getError(),bank:ShowcaseTruck1192.state()?.angle,grounded:Q.truckContact1192?.grounded,stats:GC3D.plantModel('fencing_truck',Q.quality.name).stats};});
 check('real UHD framebuffer, render target and four-sample smoothing',JSON.stringify(info.buffer)==='[3840,2160]'&&JSON.stringify(info.target)==='[3840,2160]'&&info.samples===4,info);
 check('loaded truck in actual quarter camera with no GL error',info.view==='quarter'&&info.vehicle==='fencing_truck'&&info.stats.loadVersion===1182&&info.stats.detailVersion===1192&&info.error===0&&info.bank===.48&&info.grounded===2);
 const b=await p.locator('canvas.gc3d').boundingBox();const file=path.join(out,'advanced-truck-4k.png');await p.screenshot({path:file,clip:{x:Math.ceil(b.x),y:Math.ceil(b.y),width:3840,height:2160},timeout:180000});
 const png=fs.readFileSync(file);check('saved image is exactly 3840 by 2160',png.readUInt32BE(16)===3840&&png.readUInt32BE(20)===2160);
 await p.evaluate(()=>showClose());check('clean close and shared record unchanged',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending)&&record===await p.evaluate(()=>JSON.stringify(S)));
 check('no page errors or attempted writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,'uhd1192.json'),JSON.stringify(checks,null,2));}
console.log(checks.length+'/'+checks.length);
})().catch(e=>{console.error(e);process.exit(1)});
