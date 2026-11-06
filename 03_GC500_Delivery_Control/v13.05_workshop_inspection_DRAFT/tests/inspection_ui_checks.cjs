// Author: Andrew Fisher. Run on the uninterrupted native loop before pose review.
module.exports=async function inspectionUIChecks({page,check,mobile}){
  const settle=()=>page.waitForFunction(()=>__workshop.active&&!__workshop.cameraActive,null,{timeout:120000,polling:100});
  const geometry=()=>page.evaluate(()=>{
    const r=id=>{const b=document.getElementById(id).getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
    const v=r('viewport'),p=r('workshop-panel'),sceneVisible=v.y>=-1&&v.bottom<=innerHeight+1&&v.width>=150&&v.height>=150;
    return {viewport:v,panel:p,sceneVisible,compact:__workshop.inspection.compact,canSelect:__workshop.inspection.canSelect,
      scrollY,documentWidth:document.documentElement.scrollWidth,windowWidth:innerWidth,
      trayParent:document.getElementById('workshop-bench').parentNode.id,
      separated:v.bottom<=p.y+2||v.right<=p.x+2,
      trayScroll:document.getElementById('bench-controls').scrollTop};
  });
  await page.locator('#workshop-enter').click({timeout:120000});
  await page.waitForFunction(()=>__workshop.active&&__workshop.service.active);
  await page.locator('#workshop-bench-open').click({timeout:120000});await settle();
  let layout=await geometry();
  check('bench opens supported engine with selection enabled',await page.evaluate(()=>__workshop.service.benchReady&&__workshop.learning.active&&__workshop.inspection.canSelect));
  await page.locator('#bench-controls').focus({timeout:120000});await page.keyboard.press('Space');
  check('Space in bench controls does not start the hidden refit action',await page.evaluate(()=>__workshop.service.progress===1&&!__workshop.service.playing&&__workshop.learning.active&&document.activeElement.id==='bench-controls'));
  if(mobile){
    check('phone bench controls share the scene panel',layout.compact&&layout.trayParent==='workshop-panel');
    check('phone bench reserves visible model space beside controls',layout.sceneVisible&&layout.separated);
    check('phone inspection does not overflow page width',layout.documentWidth<=layout.windowWidth+1);
    const touchPolicy=await page.evaluate(()=>({tray:getComputedStyle(document.getElementById('bench-controls')).touchAction,modes:getComputedStyle(document.querySelector('.bench-modes')).touchAction}));
    check('phone mode strip permits horizontal touch scrolling',touchPolicy.tray==='auto'&&touchPolicy.modes==='pan-x');
    await page.locator('[data-bench-mode="fault"]').scrollIntoViewIfNeeded({timeout:120000});
    const modeScroll=await page.locator('.bench-modes').evaluate(element=>({left:element.scrollLeft,width:element.clientWidth,content:element.scrollWidth,last:element.lastElementChild.getBoundingClientRect().right,edge:element.getBoundingClientRect().right}));
    check('last phone bench mode can scroll fully into the tray',modeScroll.content>modeScroll.width&&modeScroll.left>0&&modeScroll.last<=modeScroll.edge+1);
    await page.locator('[data-bench-mode="inspect"]').scrollIntoViewIfNeeded({timeout:120000});
  }else check('desktop bench keeps its sidebar location',!layout.compact&&layout.trayParent!=='workshop-panel');
  await page.locator('#bench-part').selectOption('alternator');await settle();
  check('component selector reaches the registered alternator',await page.evaluate(()=>__workshop.learning.state.selectedId==='alternator'&&__workshop.inspection.partId==='alternator'));
  await page.locator('#bench-crank').click({timeout:120000});
  check('compact hand crank changes actual engine angle',await page.evaluate(()=>Math.abs(__workshop.learning.state.crankDegrees-45)<.01));
  await page.locator('[data-bench-mode="cycle"]').click({timeout:120000});await settle();
  check('cycle retains its fixed component and rejects picking',await page.evaluate(()=>__workshop.lessons.state.kind==='cycle'&&!__workshop.inspection.canSelect&&!__workshop.selectComponent('alternator').ok));
  const startScroll=await page.evaluate(()=>scrollY);
  await page.locator('#lesson-angle').focus({timeout:120000});
  const before=await page.locator('#lesson-angle').inputValue();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(value=>Math.abs(__workshop.lessons.state.angleDegrees-value)<.01,Number(before)+1,{timeout:120000,polling:100});
  check('cycle keyboard input still drives the actual lesson',await page.locator('#lesson-angle').inputValue()===String(Number(before)+1));
  if(mobile){
    layout=await geometry();check('scrolling to cycle controls keeps the model on screen',layout.sceneVisible&&Math.abs(layout.scrollY-startScroll)<2);
    const focusStyle=await page.locator('#lesson-angle').evaluate(element=>({offset:getComputedStyle(element).outlineOffset,width:getComputedStyle(element).outlineWidth,height:element.getBoundingClientRect().height}));
    check('slider focus stays clear of its label with a full touch target',focusStyle.offset==='-2px'&&parseFloat(focusStyle.width)>=2&&focusStyle.height>=44);
  }
  const saved=page.viewportSize();
  if(mobile){
    for(const size of [{width:320,height:700},{width:844,height:390}]){
      await page.setViewportSize(size);await page.waitForTimeout(200);await settle();
      await page.locator('#lesson-angle').focus({timeout:120000});layout=await geometry();
      check(`inspection scene and tray fit ${size.width} by ${size.height}`,layout.compact&&layout.sceneVisible&&layout.separated&&layout.documentWidth<=layout.windowWidth+1);
      const target=await page.locator('#lesson-angle').boundingBox();check(`cycle slider retains a 44 px touch target at ${size.width}`,target.height>=44);
    }
    await page.setViewportSize(saved);await page.waitForTimeout(200);await settle();
  }
  await page.locator('[data-bench-mode="isolate"]').click({timeout:120000});await settle();
  await page.locator('#bench-part').selectOption('intake-valve-1');await settle();
  check('isolated component selection remains available',await page.evaluate(()=>__workshop.inspection.canSelect&&__workshop.lessons.state.selectedPart.id==='intake-valve-1'));
  await page.locator('#lesson-right').click({timeout:120000});
  check('rotation controls retain the actual isolated part',await page.evaluate(()=>Math.abs(__workshop.lessons.state.rotationDegrees-45)<.01));
  if(mobile){layout=await geometry();check('rotation controls leave selected component viewport visible',layout.sceneVisible&&layout.separated);}
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#bench-part').selectOption('alternator');
  check('reduced motion settles manual inspection without flight',await page.evaluate(()=>!__workshop.cameraActive&&__workshop.learning.state.selectedId==='alternator'));
  await page.emulateMedia({reducedMotion:'no-preference'});
  check('workshop Home remains enabled',await page.locator('#home').isEnabled());
  await page.locator('#home').click({timeout:120000});await settle();
  check('native Home returns to workshop overview without changing service position',await page.evaluate(()=>__workshop.active&&!__workshop.learning.active&&__workshop.service.progress===1&&!__workshop.inspection.compact));
  await page.locator('#workshop-bench-open').click({timeout:120000});await settle();
  await page.locator('#workshop-bench-open').click({timeout:120000});await settle();
  check('Lift returns from the bench without changing service position',await page.evaluate(()=>!__workshop.learning.active&&!__workshop.lessons.state.active&&__workshop.service.progress===1&&!__workshop.inspection.compact));
  check('Lift restores the actual refit control',await page.locator('#workshop-play').isVisible()&&await page.locator('#workshop-play').getAttribute('aria-label')==='Refit engine');
  await page.locator('#workshop-play').click({timeout:120000});
  await page.waitForFunction(()=>__workshop.service.direction===-1&&__workshop.service.playing&&__workshop.service.progress<1,null,{timeout:120000,polling:100});
  check('native refit starts reverse service motion',await page.evaluate(()=>__workshop.service.direction===-1&&__workshop.service.playing&&__workshop.service.progress<1));
  await page.locator('#workshop-play').click({timeout:120000});
  check('native refit can be paused before exit',await page.evaluate(()=>!__workshop.service.playing&&__workshop.service.direction===-1));
  await page.locator('#workshop-exit').click({timeout:120000});
  await page.waitForFunction(()=>!__workshop.active&&!__cw.drive.locked);
  check('exit restores layout and cancels inspection flight',await page.evaluate(()=>!document.body.classList.contains('workshop-bench-mobile')&&!document.body.classList.contains('workshop-bench-landscape')&&!__workshop.cameraActive&&document.getElementById('workshop-bench').parentNode.classList.contains('sidebar')));
  return {layout};
};
