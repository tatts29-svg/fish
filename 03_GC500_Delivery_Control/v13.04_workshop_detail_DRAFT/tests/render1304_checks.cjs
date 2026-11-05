// Author: Andrew Fisher. Final-draw behaviour against the actual browser scene.
module.exports=async function render1304Checks({page,check}){
  const result=await page.evaluate(()=>{
    if(!__workshop.active)__workshop.enter();
    __workshop.service.setPlaying(false);document.getElementById('workshop-bench-open').click();
    const tick=()=>__reviewFrame(performance.now()+101),snapshot=()=>({...__workshopRender.diagnostics,dpr:__cw.renderer.getPixelRatio()});
    for(let i=0;i<18;i++)tick();
    const before=snapshot();for(let i=0;i<15;i++)tick();const paused=snapshot();
    document.getElementById('bench-crank').click();tick();const crank=snapshot();
    document.querySelector('[data-bench-mode="cycle"]').click();document.getElementById('lesson-play').click();
    const starting=snapshot();for(let i=0;i<5;i++)tick();const moving=snapshot();
    document.getElementById('lesson-play').click();tick();const stopped=snapshot();
    document.querySelector('[data-bench-mode="isolate"]').click();document.getElementById('lesson-right').click();tick();const rotated=snapshot();
    return {before,paused,crank,starting,moving,stopped,rotated,oldDraws:rotated.draws};
  });
  // OrbitControls captures an actual browser pointer. A synthetic bare Event
  // has no active pointer id and throws in setPointerCapture before this test
  // can measure input invalidation. Use the same mouse path as a real user.
  await page.locator('#canvas').scrollIntoViewIfNeeded();
  const point=await page.evaluate(()=>{
    const canvas=document.getElementById('canvas'),rect=canvas.getBoundingClientRect();
    for(const x of [.6,.4,.8,.2])for(const y of [.25,.4,.15]){
      const px=rect.left+rect.width*x,py=rect.top+rect.height*y;
      if(document.elementFromPoint(px,py)===canvas)return {x:px,y:py};
    }
    throw Error('No unobstructed canvas hit point for native pointer check');
  });
  await page.mouse.move(point.x,point.y);
  await page.mouse.down();
  try {result.input=await page.evaluate(()=>{__reviewFrame(performance.now()+101);return {...__workshopRender.diagnostics,dpr:__cw.renderer.getPixelRatio()};});}
  finally {await page.mouse.up();}
  result.exit=await page.evaluate(()=>{__workshop.exit();__reviewFrame(performance.now()+101);return {...__workshopRender.diagnostics,dpr:__cw.renderer.getPixelRatio()};});
  check('actual stationary workshop reuses duplicate final draws',result.paused.idle&&result.paused.reused>result.before.reused&&result.paused.draws-result.before.draws<15);
  check('stationary reuse preserves drawing resolution',result.paused.dpr===result.before.dpr);
  check('hand crank wakes the actual paused picture',result.crank.draws>result.paused.draws&&!result.crank.pendingShadow);
  check('animated lesson submits every actual frame',result.moving.draws-result.starting.draws===5&&result.moving.reused===result.starting.reused);
  check('final stopped lesson shadow is current',!result.stopped.pendingShadow&&result.stopped.shadowUpdates>=result.moving.shadowUpdates);
  check('isolated rotation repaints with current shadow',!result.rotated.pendingShadow&&result.rotated.draws>result.stopped.draws);
  check('input invalidation requests an immediate actual draw',result.input.draws>result.oldDraws);
  check('exit restores normal drawing mode',!result.exit.active&&!result.exit.idle&&!result.exit.pendingShadow);
  return result;
};
