// Author: Andrew Fisher. Read-only visual alternatives and frame checks.
const fs=require('fs'),path=require('path');const {openMachine}=require('./machine_rig');
(async()=>{const out=process.env.OUT;if(!out)throw Error('OUT outside the repository is required');fs.mkdirSync(out,{recursive:true});const m=await openMachine({root:path.join(process.env.SOURCE_ROOT || path.resolve(__dirname,'../../v8.09_coates_way_machine_DRAFT'),'work')}),p=m.page;p.setDefaultTimeout(120000);let report={};try{
await p.waitForFunction(()=>__cw?.ready,null,{timeout:180000});
for(const view of ['cog','car']){await p.evaluate(v=>__cw.setView(v),view);await p.waitForFunction(()=>!__cw.tween,null,{timeout:40000});const pose=JSON.parse(fs.readFileSync(path.join(out,'desk_'+view+'_camera.json'),'utf8'));
await p.evaluate(pose=>{const c=__cw;c.renderer.setAnimationLoop(null);c.cameraStart();c.camera.position.fromArray(pose.position);c.camera.quaternion.fromArray(pose.quaternion);c.controls.target.fromArray(pose.target);c.renderer.setPixelRatio(1);c.camera.updateMatrixWorld(true);c.clearView.update(2);c.renderer.render(c.scene,c.camera);},pose);
if(view==='cog'){await p.screenshot({path:path.join(out,'desk_cog_work_fixed1.png')});}
else{await p.evaluate(()=>{document.getElementById('body-mode').click();__cw.advance(.1);__cw.renderer.render(__cw.scene,__cw.camera);});await p.screenshot({path:path.join(out,'desk_car_complete_work.png')});}
await p.evaluate(()=>__reviewResume());}
report.errors=m.errors;fs.writeFileSync(path.join(out,'desk_extra_report.json'),JSON.stringify(report,null,2));
}finally{await m.close();}})().catch(e=>{console.error(e.message.replace(/https?:\/\/\S+/g,'[URL]'));process.exitCode=1;});
