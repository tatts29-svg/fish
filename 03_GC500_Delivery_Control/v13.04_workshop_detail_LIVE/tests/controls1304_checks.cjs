// Author: Andrew Fisher. Called by the root's serialised candidate browser run.
// Uses the existing deterministic review frame; no extra browser or live writes.
module.exports=async function controls1304Checks({page,check,mobile}){
  const frame=()=>page.evaluate(()=>__reviewFrame(performance.now()+100));
  const fits=()=>page.evaluate(()=>{
    const box=__workshop.lift.engineBounds,camera=__cw.camera;
    const viewport=document.getElementById('viewport').getBoundingClientRect(),panel=document.getElementById('workshop-panel').getBoundingClientRect();
    return [box.min.x,box.max.x].every(x=>[box.min.y,box.max.y].every(y=>[box.min.z,box.max.z].every(z=>{
      const p=box.min.clone().set(x,y,z).project(camera);
      return p.x>=-1.01&&p.x<=1.01&&p.y<=1.01&&viewport.top+(1-p.y)*viewport.height/2<=panel.top+2;
    })));
  });
  await page.evaluate(()=>{
    if(!__workshop.active)__workshop.enter();
    __workshop.service.setPlaying(false);__workshop.service.setProgress(.53);__workshop.update(0);
    if(document.getElementById('workshop-inspect').textContent==='Overview')document.getElementById('workshop-inspect').click();
    document.getElementById('workshop-inspect').click();__reviewFrame(performance.now()+100);
  });
  check('actual complete engine fits the inspection view',await fits());
  const viewport=page.viewportSize();
  if(mobile){
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(250);await frame();
    check('engine inspection is retained after orientation change',await page.locator('#workshop-inspect').textContent()==='Overview'&&await fits());
    await page.setViewportSize(viewport);await page.waitForTimeout(250);await frame();
    check('engine inspection is retained on return to portrait',await page.locator('#workshop-inspect').textContent()==='Overview'&&await fits());
  }
  const actions=await page.evaluate(()=>[0,.53,1].map(p=>{
    __workshop.service.setPlaying(false);__workshop.service.setProgress(p);__workshop.update(0);
    const button=document.getElementById('workshop-play'),track=document.getElementById('workshop-progress');
    return {width:button.getBoundingClientRect().width,track:track.getBoundingClientRect().width,label:button.textContent,accessible:button.getAttribute('aria-label'),progress:track.getAttribute('aria-valuetext')};
  }));
  check('service action width stays stable across all states',actions.every(a=>Math.abs(a.width-actions[0].width)<.01));
  check('compact service buttons retain complete accessible action names',actions[0].label==='Start'&&actions[0].accessible==='Start service'&&actions[1].label==='Continue'&&actions[1].accessible==='Continue service'&&actions[2].accessible==='Refit engine');
  check('service range names the current percentage and phase',actions.every(a=>/^\d+ percent · .+/.test(a.progress)));
  if(mobile)check('phone service scrub track remains usable',actions.every(a=>a.track>=85));
  await page.evaluate(()=>{
    document.getElementById('workshop-bench-open').click();
    document.querySelector('[data-bench-mode=isolate]').click();
    const select=document.getElementById('bench-part');select.value='intake-valve-1';select.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('bench-focus').click();__reviewFrame(performance.now()+100);
  });
  const valve=await page.evaluate(()=>{
    const box=__workshop.lessons.bounds,camera=__cw.camera,viewport=document.getElementById('viewport').getBoundingClientRect(),panel=document.getElementById('workshop-panel').getBoundingClientRect();
    const vertices=[box.min.x,box.max.x].flatMap(x=>[box.min.y,box.max.y].flatMap(y=>[box.min.z,box.max.z].map(z=>box.min.clone().set(x,y,z).project(camera))));
    const width=(Math.max(...vertices.map(p=>p.x))-Math.min(...vertices.map(p=>p.x)))/2;
    const height=(Math.max(...vertices.map(p=>p.y))-Math.min(...vertices.map(p=>p.y)))*viewport.height/2/(panel.top-viewport.top);
    return {id:__workshop.lessons.state.selectedPart.id,distance:camera.position.distanceTo(__cw.controls.target),width,height,
      minDistance:__cw.controls.minDistance,near:camera.near,finite:vertices.every(p=>[p.x,p.y,p.z].every(Number.isFinite))};
  });
  check('small original component fills a useful close inspection area',valve.id==='intake-valve-1'&&valve.finite&&valve.distance<1.4&&Math.max(valve.width,valve.height)>.45);
  check('small-part zoom stops outside the near clipping plane',valve.minDistance>=valve.near*3&&valve.minDistance<valve.distance);
  await page.evaluate(()=>{
    document.querySelector('[data-bench-mode=cycle]').click();
    const slider=document.getElementById('lesson-angle');slider.value='450';slider.dispatchEvent(new Event('input',{bubbles:true}));__reviewFrame(performance.now()+100);
  });
  check('cycle slider announces phase and angle',await page.locator('#lesson-angle').getAttribute('aria-valuetext')==='450 degrees · Power');
  const slider=page.locator('#lesson-angle');
  await slider.focus({timeout:120000});
  const before=await slider.evaluate(element=>({value:Number(element.value),step:Number(element.step),max:Number(element.max),
    focused:document.activeElement===element,angle:__workshop.lessons.state.angleDegrees,draws:__workshopRender.diagnostics.draws}));
  check('native cycle slider receives keyboard focus',before.focused&&Number.isFinite(before.step)&&before.step>0&&before.value+before.step<=before.max);
  await page.keyboard.press('ArrowRight');
  const expected=before.value+before.step;
  await page.waitForFunction(value=>Math.abs(__workshop.lessons.state.angleDegrees-value)<.01,
    expected,{timeout:120000,polling:500});
  const input=await slider.evaluate(element=>({value:Number(element.value),angle:__workshop.lessons.state.angleDegrees,draws:__workshopRender.diagnostics.draws}));
  check('native cycle ArrowRight changes the actual lesson angle',input.value===expected&&input.angle>before.angle&&Math.abs(input.angle-expected)<.01);
  await frame();
  const drawn=await page.evaluate(()=>({angle:__workshop.lessons.state.angleDegrees,draws:__workshopRender.diagnostics.draws}));
  check('native cycle keyboard change is drawn',drawn.draws>input.draws&&Math.abs(drawn.angle-expected)<.01);
  const nativeSlider={before,input,drawn};
  await page.evaluate(()=>{__workshop.exit();__reviewFrame(performance.now()+100);});
  return {actions,valve,nativeSlider};
};
