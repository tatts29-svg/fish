// Author: Andrew Fisher. Read-only frozen-source review.
const fs=require('fs'),path=require('path');
const {openMachine}=require('./machine_rig');
const root=process.env.SOURCE_ROOT || path.resolve(__dirname,'../../v8.09_coates_way_machine_DRAFT');
const out=process.env.OUT;if(!out)throw Error('OUT outside the repository is required');fs.mkdirSync(out,{recursive:true});const tag=process.argv[2]||'base',dev=process.argv[3]||'desk';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const m=await openMachine({root:path.join(root,tag),W:dev==='phone'?390:1440,H:dev==='phone'?844:900,dpr:dev==='phone'?2:1,mobile:dev==='phone'}),p=m.page;
 p.setDefaultTimeout(180000);let report={tag,dev,source:'ba9fff7ec48d3d49d037f461c145b1abd6f2c957',shots:[]};
 try{
 await p.waitForFunction(()=>window.__cw?.ready,null,{timeout:180000});console.log(tag,dev,'ready');
 await wait(3000);
 for(const view of ['car','engine','cog']){
   await p.evaluate(v=>window.__cw.setView(v),view);
   await p.waitForFunction(()=>!window.__cw.tween,null,{timeout:40000});await wait(1400);
   const cameraFile=path.join(out,dev+'_'+view+'_camera.json');
   if(tag==='base')fs.writeFileSync(cameraFile,JSON.stringify(await p.evaluate(()=>({position:__cw.camera.position.toArray(),quaternion:__cw.camera.quaternion.toArray(),target:__cw.controls.target.toArray(),fov:__cw.camera.fov}))));
   const pose=JSON.parse(fs.readFileSync(cameraFile,'utf8'));pose.ratio=dev==='phone'?2:1;
   const state=await p.evaluate(pose=>{const c=__cw;c.renderer.setAnimationLoop(null);c.renderer.setPixelRatio(pose.ratio);c.cameraStart?.();c.camera.position.fromArray(pose.position);c.camera.quaternion.fromArray(pose.quaternion);c.controls.target.fromArray(pose.target);c.camera.fov=pose.fov;c.camera.updateProjectionMatrix();c.camera.updateMatrixWorld(true);c.clearView?.update(2);c.scene.updateMatrixWorld(true);c.renderer.render(c.scene,c.camera);return {view:c.view,quality:c.quality,ratio:c.pixelRatio,canvas:[c.renderer.domElement.width,c.renderer.domElement.height],calls:c.renderer.info.render.calls,triangles:c.renderer.info.render.triangles,cam:c.camera.position.toArray(),driver:c.driverExit||null};},pose);
   await p.screenshot({path:path.join(out,dev+'_'+view+'_'+tag+'.png')});report.shots.push(state);console.log('captured',tag,dev,view);await p.evaluate(()=>window.__reviewResume());
 }
 report.errors=m.errors;fs.writeFileSync(path.join(out,dev+'_'+tag+'_report.json'),JSON.stringify(report,null,2));
 }finally{await m.close();}
})().catch(e=>{console.error(e.message.replace(/https?:\/\/\S+/g,'[URL]'));process.exitCode=1;});
