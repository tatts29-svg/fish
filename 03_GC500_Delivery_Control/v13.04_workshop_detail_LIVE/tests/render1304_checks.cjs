// DIAGNOSTIC ONLY — not imported by release acceptance.
// This artificial synchronous batch passed six scheduling assertions, then its
// manual-to-native transition stalled in headless Chromium. It is retained for
// diagnosis, not represented as a passing release test. Native acceptance uses
// native_render1304_checks.cjs before any manual review frame.
// Author: Andrew Fisher. Final-draw behaviour against the actual browser scene.
module.exports=async function render1304Checks({page,check}){
  const result=await page.evaluate(()=>{
    if(!__workshop.active)__workshop.enter();
    __workshop.service.setPlaying(false);document.getElementById('workshop-bench-open').click();
    let tickNow=performance.now();
    const tick=()=>__reviewFrame(tickNow+=101),snapshot=()=>({...__workshopRender.diagnostics,dpr:__cw.renderer.getPixelRatio()});
    for(let i=0;i<18;i++)tick();
    const before=snapshot();for(let i=0;i<15;i++)tick();const paused=snapshot();
    document.getElementById('bench-crank').click();tick();const crank=snapshot();
    document.querySelector('[data-bench-mode="cycle"]').click();document.getElementById('lesson-play').click();
    const starting=snapshot();for(let i=0;i<5;i++)tick();const moving=snapshot();
    document.getElementById('lesson-play').click();tick();const stopped=snapshot();
    document.querySelector('[data-bench-mode="isolate"]').click();document.getElementById('lesson-right').click();tick();const rotated=snapshot();
    return {before,paused,crank,starting,moving,stopped,rotated,oldDraws:rotated.draws};
  });
  check('actual stationary workshop reuses duplicate final draws',result.paused.idle&&result.paused.reused>result.before.reused&&result.paused.draws-result.before.draws<15);
  check('stationary reuse preserves drawing resolution',result.paused.dpr===result.before.dpr);
  check('hand crank wakes the actual paused picture',result.crank.draws>result.paused.draws&&!result.crank.pendingShadow);
  check('animated lesson submits every actual frame',result.moving.draws-result.starting.draws===5&&result.moving.reused===result.starting.reused);
  check('final stopped lesson shadow is current',!result.stopped.pendingShadow&&result.stopped.shadowUpdates>=result.moving.shadowUpdates);
  check('isolated rotation repaints with current shadow',!result.rotated.pendingShadow&&result.rotated.draws>result.stopped.draws);
  // OrbitControls captures an actual browser pointer. A synthetic bare Event
  // has no active pointer id and throws in setPointerCapture before this test
  // can measure input invalidation. Use the same mouse path as a real user.
  // Exact scheduling assertions above use manual logical time. Restore the
  // normal clock/animation loop before testing genuine browser interaction.
  await page.evaluate(()=>__reviewResume());
  await page.locator('#canvas').scrollIntoViewIfNeeded({timeout:120000});
  const point=await page.evaluate(()=>{
    const canvas=document.getElementById('canvas'),rect=canvas.getBoundingClientRect();
    for(const x of [.6,.4,.8,.2])for(const y of [.25,.4,.15]){
      const px=rect.left+rect.width*x,py=rect.top+rect.height*y;
      if(document.elementFromPoint(px,py)===canvas)return {x:px,y:py};
    }
    throw Error('No unobstructed canvas hit point for native pointer check');
  });
  await page.mouse.move(point.x,point.y);
  result.beforeInput=await page.evaluate(()=>({...__workshopRender.diagnostics}));
  await page.mouse.down();
  try {
    result.afterPointer=await page.evaluate(()=>({...__workshopRender.diagnostics}));
    await page.waitForFunction(after=>__workshopRender.diagnostics.draws>after.draws,
      result.afterPointer,{timeout:120000,polling:100});
    result.input=await page.evaluate(()=>({...__workshopRender.diagnostics,dpr:__cw.renderer.getPixelRatio()}));
  } finally {await page.mouse.up();}
  await page.evaluate(()=>__workshop.exit());
  await page.waitForFunction(()=>!__workshopRender.diagnostics.active&&!__workshopRender.diagnostics.idle,
    null,{timeout:120000,polling:100});
  result.exit=await page.evaluate(()=>({...__workshopRender.diagnostics,dpr:__cw.renderer.getPixelRatio()}));
  check('native input invalidation is followed by an actual draw',
    result.afterPointer.invalidations>result.beforeInput.invalidations&&result.input.draws>result.afterPointer.draws);
  check('exit restores normal drawing mode',!result.exit.active&&!result.exit.idle&&!result.exit.pendingShadow);
  return result;
};
