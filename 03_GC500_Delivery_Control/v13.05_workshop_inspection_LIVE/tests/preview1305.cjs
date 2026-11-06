// Author: Andrew Fisher. Read-only native visual review of the current candidate.
const {openMachine}=require('./machine_rig.cjs'),fs=require('node:fs');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const m=await openMachine({root:process.env.PREVIEW_ROOT,W:390,H:844,dpr:1,mobile:true});m.page.setDefaultTimeout(120000);try{
 await m.page.waitForFunction(()=>window.__cw?.ready,null,{timeout:180000,polling:500});
 await m.page.locator('#workshop-enter').click();await m.page.locator('#workshop-bench-open').click();
 await m.page.waitForFunction(()=>__workshop.learning.active&&!__workshop.cameraActive,null,{timeout:120000,polling:500});
 await m.page.screenshot({path:out+'/phone-bench.png',timeout:120000});console.log('phone bench captured');
 await m.page.locator('[data-bench-mode="cycle"]').click();await m.page.waitForFunction(()=>!__workshop.cameraActive,null,{timeout:120000,polling:500});
 await m.page.locator('#lesson-angle').focus();await m.page.keyboard.press('ArrowRight');await m.page.screenshot({path:out+'/phone-cycle.png',timeout:120000});console.log('phone cycle captured');
 await m.page.setViewportSize({width:844,height:390});await m.page.waitForTimeout(500);await m.page.screenshot({path:out+'/phone-landscape.png',timeout:120000});console.log('landscape captured');
 console.log(JSON.stringify({errors:m.errors,writes:m.writes,inspection:await m.page.evaluate(()=>__workshop.inspection)}));
}finally{await m.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
