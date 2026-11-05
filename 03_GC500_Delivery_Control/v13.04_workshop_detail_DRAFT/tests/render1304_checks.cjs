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
    const oldDraws=rotated.draws;document.getElementById('canvas').dispatchEvent(new Event('pointerdown',{bubbles:true}));tick();const input=snapshot();
    __workshop.exit();tick();const exit=snapshot();
    return {before,paused,crank,starting,moving,stopped,rotated,input,exit,oldDraws};
  });
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
