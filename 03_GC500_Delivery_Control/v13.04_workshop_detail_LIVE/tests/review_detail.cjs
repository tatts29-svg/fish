// Author: Andrew Fisher. Read-only visual comparison; not release acceptance.
const {openMachine}=require('./machine_rig.cjs');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
  const root=process.env.PREVIEW_ROOT,out=process.env.OUT;
  if(!root||!out||fs.existsSync(out))throw Error('Use an explicit source and fresh output directory');
  fs.mkdirSync(out,{recursive:true,mode:0o700});
  const m=await openMachine({root,W:1280,H:960,dpr:1,mobile:false});
  try{
    await m.page.waitForFunction(()=>window.__cw?.ready||window.__reviewFailed,null,{timeout:180000,polling:500});
    await m.page.evaluate(()=>{if(!__cw.ready)throw Error('Machine failed');__cw.renderer.setAnimationLoop(null);__workshop.enter();document.getElementById('workshop-bench-open').click();});
    for(const part of ['intake-valve-1','oil-pan','alternator']){
      await m.page.evaluate(id=>{document.querySelector('[data-bench-mode="isolate"]').click();const select=document.getElementById('bench-part');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('bench-focus').click();},part);
      await m.page.locator('#canvas').scrollIntoViewIfNeeded();
      await m.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{__reviewFrame(performance.now()+101);resolve();}))));
      await m.page.screenshot({path:path.join(out,part+'.png'),timeout:120000});
      console.log('Captured '+part);
    }
    await m.page.evaluate(()=>{__workshop.exit();__reviewFrame(performance.now()+101);});
    await m.page.screenshot({path:path.join(out,'original-car.png'),timeout:120000});
  }finally{await m.close();}
  fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({author:'Andrew Fisher',releaseAcceptance:false,errors:m.errors,recordWrites:m.writes.length},null,2));
  if(m.errors.length||m.writes.length)throw Error('Visual review had an error or attempted a write');
})().catch(error=>{console.error(error);process.exitCode=1;});
