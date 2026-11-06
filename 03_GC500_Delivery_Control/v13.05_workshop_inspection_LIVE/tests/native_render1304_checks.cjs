// Author: Andrew Fisher. Actual idle/input checks on a fresh, uninterrupted loop.
// Call immediately after readiness, before the machine suite pauses for review poses.
module.exports=async function render1304Checks({page,check}){
  const result={};
  const snapshot=()=>page.evaluate(()=>({...__workshopRender.diagnostics,dpr:__cw.renderer.getPixelRatio(),
    crankAngle:__workshop.learning.state.crankAngle,rotation:__workshop.lessons.state.rotation,shadowDirty:__workshop.shadowDirty}));
  const native=async(label,p)=>{let timer;try{return await Promise.race([p,new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error(label+' exceeded the 120s native action budget')),120000);
  })]);}finally{clearTimeout(timer);}};
  await page.locator('#workshop-enter').click({timeout:120000});
  await page.locator('#workshop-bench-open').click({timeout:120000});
  await page.waitForFunction(()=>__workshopRender.diagnostics.idle,null,{timeout:120000,polling:100});
  result.idle=await snapshot();
  check('normal animation loop reaches paused workshop idle',result.idle.idle&&result.idle.draws>0);
  await page.locator('#canvas').scrollIntoViewIfNeeded({timeout:120000});
  const point=await page.evaluate(()=>{
    const canvas=document.getElementById('canvas'),rect=canvas.getBoundingClientRect();
    const left=Math.max(0,rect.left),right=Math.min(innerWidth,rect.right);
    const top=Math.max(0,rect.top),bottom=Math.min(innerHeight,rect.bottom);
    for(const x of [.6,.4,.8,.2])for(const y of [.08,.16,.26,.4,.6,.8,.92]){
      const px=left+(right-left)*x,py=top+(bottom-top)*y;
      if(document.elementFromPoint(px,py)===canvas)return {x:px,y:py};
    }
    throw Error('No unobstructed visible canvas hit point for native pointer check');
  });
  await native('canvas pointer move',page.mouse.move(point.x,point.y));
  result.beforeInput=await snapshot();
  await native('canvas pointer down',page.mouse.down());
  try{
    result.afterPointer=await snapshot();
    await page.waitForFunction(after=>__workshopRender.diagnostics.draws>after.draws,
      result.afterPointer,{timeout:120000,polling:100});
    result.input=await snapshot();
  }finally{await native('canvas pointer up',page.mouse.up());}
  check('native input invalidation is followed by an actual draw',
    result.afterPointer.invalidations>result.beforeInput.invalidations&&result.input.draws>result.afterPointer.draws);
  result.beforeCrank=await snapshot();
  await page.locator('#bench-crank').click({timeout:120000});
  result.afterCrank=await snapshot();
  await page.waitForFunction(({before,after})=>__workshopRender.diagnostics.draws>after.draws&&
    __workshopRender.diagnostics.shadowUpdates>before.shadowUpdates&&!__workshopRender.diagnostics.pendingShadow&&!__workshop.shadowDirty,
    {before:result.beforeCrank,after:result.afterCrank},{timeout:120000,polling:100});
  result.crank=await snapshot();
  check('native crank draws the new pose and shadow',result.crank.draws>result.afterCrank.draws&&
    result.crank.shadowUpdates>result.beforeCrank.shadowUpdates&&!result.crank.pendingShadow&&!result.crank.shadowDirty&&
    Math.abs(result.crank.crankAngle-result.beforeCrank.crankAngle-Math.PI/4)<1e-9);
  await page.locator('[data-bench-mode="isolate"]').click({timeout:120000});
  result.beforeRotation=await snapshot();
  await page.locator('#lesson-right').click({timeout:120000});
  result.afterRotation=await snapshot();
  await page.waitForFunction(({before,after})=>__workshopRender.diagnostics.draws>after.draws&&
    __workshopRender.diagnostics.shadowUpdates>before.shadowUpdates&&!__workshopRender.diagnostics.pendingShadow&&!__workshop.shadowDirty,
    {before:result.beforeRotation,after:result.afterRotation},{timeout:120000,polling:100});
  result.rotation=await snapshot();
  check('native rotation draws the new pose and shadow',result.rotation.draws>result.afterRotation.draws&&
    result.rotation.shadowUpdates>result.beforeRotation.shadowUpdates&&!result.rotation.pendingShadow&&!result.rotation.shadowDirty&&
    Math.abs(result.rotation.rotation-result.beforeRotation.rotation-Math.PI/4)<1e-9);
  await page.locator('#workshop-exit').click({timeout:120000});
  await page.waitForFunction(()=>!__workshopRender.diagnostics.active&&!__workshopRender.diagnostics.idle,
    null,{timeout:120000,polling:100});
  result.exit=await snapshot();
  check('native exit restores normal drawing mode',!result.exit.active&&!result.exit.idle&&!result.exit.pendingShadow);
  return result;
};
