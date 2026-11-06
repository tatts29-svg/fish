// Author: Andrew Fisher. Real input on an uninterrupted animation loop.
// Run before manual pose timing. Starts and exits the workshop; no production mutation.
module.exports = async function nativeInspection1305({page, check, mobile = false}) {
  const result = {layouts:{}};
  const action = async (label, promise) => {
    let timer;
    try { return await Promise.race([promise,new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(Error(label+' exceeded the120s native action budget')),120000);
    })]); } finally { clearTimeout(timer); }
  };
  const click = selector => page.locator(selector).click({timeout:120000});
  const waitCamera = () => page.waitForFunction(() => !__workshop.inspection.cameraMoving,
    null,{timeout:120000,polling:100});
  const lightSnapshot = () => page.evaluate(() => ({
    lights:__cw.scene.children.filter(light=>light.isDirectionalLight).map(light=>({
      uuid:light.uuid,intensity:light.intensity,color:light.color.toArray(),
      position:light.position.toArray(),shadow:light.castShadow,map:light.shadow.mapSize.toArray()
    })),exposure:__cw.renderer.toneMappingExposure
  }));
  async function visibleSceneWith(selector,label) {
    await page.locator(selector).scrollIntoViewIfNeeded({timeout:120000});
    const layout=await page.evaluate(selector=>{
      const canvas=document.getElementById('canvas'),control=document.querySelector(selector);
      const c=canvas.getBoundingClientRect(),b=control.getBoundingClientRect();
      const left=Math.max(0,c.left),right=Math.min(innerWidth,c.right),top=Math.max(0,c.top),bottom=Math.min(innerHeight,c.bottom);
      return {compact:__workshop.inspection.compact,canvas:{x:c.x,y:c.y,width:c.width,height:c.height},
        visibleWidth:right-left,visibleHeight:bottom-top,
        canvasHit:document.elementFromPoint((left+right)/2,(top+bottom)/2)===canvas,
        control:{x:b.x,y:b.y,width:b.width,height:b.height},
        controlVisible:b.left>=-1&&b.right<=innerWidth+1&&b.top>=-1&&b.bottom<=innerHeight+1};
    },selector);
    result.layouts[label]=layout;
    if(mobile)check(label+' controls keep the phone model visible',layout.compact && layout.visibleWidth>=160
      && layout.visibleHeight>=120 && layout.canvasHit && layout.controlVisible);
  }
  check('inspection native suite starts outside the workshop',await page.evaluate(()=>!__workshop.active));
  result.originalLighting=await lightSnapshot();
  await click('#workshop-enter');
  await page.waitForFunction(()=>__workshop.active&&__cw.drive.locked,null,{timeout:120000,polling:100});
  await waitCamera();
  result.cameraBefore=await page.evaluate(()=>__cw.camera.position.toArray());
  await page.evaluate(()=>{
    window.__inspection1305CameraStart=null;
    document.getElementById('workshop-inspect').addEventListener('click',()=>queueMicrotask(()=>{
      window.__inspection1305CameraStart={moving:__workshop.inspection.cameraMoving,position:__cw.camera.position.toArray()};
    }),{once:true});
  });
  await click('#workshop-inspect');
  result.cameraStarted=await page.evaluate(()=>window.__inspection1305CameraStart);
  check('manual Inspect starts an actual camera transition',result.cameraStarted?.moving===true);
  await waitCamera();
  result.cameraAfter=await page.evaluate(()=>__cw.camera.position.toArray());
  check('manual inspection camera settles at a new finite view',result.cameraAfter.every(Number.isFinite)
    && result.cameraAfter.some((value,index)=>Math.abs(value-result.cameraBefore[index])>.001));
  await page.waitForFunction(()=>__workshopLighting.active&&!__workshopLighting.transitioning,null,{timeout:120000,polling:100});
  result.inspectionLighting=await lightSnapshot();
  result.lightingDiagnostics=await page.evaluate(()=>__workshopLighting.diagnostics);
  const original=result.originalLighting,gain=result.lightingDiagnostics.gains;
  check('inspection lighting reuses original lights and quality settings',result.inspectionLighting.lights.length===3
    && original.lights.length===3 && result.inspectionLighting.exposure===original.exposure
    && result.inspectionLighting.lights.every((light,index)=>{
      const before=original.lights[index],expectedGain=gain[['key','fill','rim'][index]];
      return light.uuid===before.uuid && Math.abs(light.intensity-before.intensity*expectedGain)<1e-10
        && JSON.stringify({...light,intensity:0})===JSON.stringify({...before,intensity:0});
    }));
  await click('#workshop-bench-open');
  await page.waitForFunction(()=>__workshop.learning.active&&__workshop.service.benchReady,null,{timeout:120000,polling:100});
  await waitCamera();
  await visibleSceneWith('#bench-crank','Bench');

  // Native dropdown establishes a useful close view. Selecting the crankshaft
  // directly afterwards is explicit fixture setup only: it leaves that camera in
  // place, so the subsequent real tap must change the selection to the visible part.
  await page.locator('#bench-part').selectOption('alternator',{timeout:120000});
  await waitCamera();
  await page.locator('#canvas').scrollIntoViewIfNeeded({timeout:120000});
  result.tapFixture=await page.evaluate(()=>{
    const camera=__cw.camera.position.toArray();
    const setup=__workshop.learning.selectPart('crankshaft');
    return {setup:setup.ok,selected:__workshop.learning.state.selectedId,camera};
  });
  check('tap fixture leaves a different selection under the native close view',result.tapFixture.setup
    && result.tapFixture.selected==='crankshaft');
  result.pickTarget=await page.evaluate(()=>{
    const canvas=document.getElementById('canvas'),r=canvas.getBoundingClientRect(),camera=__cw.camera;
    const V=camera.position.constructor,part=__workshop.learning.pickParts.find(p=>p.id==='alternator');
    const points=[],current=__workshop.learning.state.selectedId;
    part?.group.updateWorldMatrix(true,true);
    part?.group.traverse(object=>{
      if(points.length>=48||!object.isMesh||!object.geometry)return;
      for(let node=object;node;node=node.parent)if(!node.visible)return;
      const geometry=object.geometry;
      if(!geometry.boundingBox)geometry.computeBoundingBox();
      const box=geometry.boundingBox;if(!box)return;
      const local=box.getCenter(new V());points.push(local.clone().applyMatrix4(object.matrixWorld));
      // Off-centre samples help hollow housings without a full-screen scene scan.
      for(const t of [.3,.7])points.push(new V().lerpVectors(box.min,box.max,t).applyMatrix4(object.matrixWorld));
    });
    let attempts=0;
    const attempt=(x,y)=>{
      if(x<8||y<8||x>innerWidth-8||y>innerHeight-8||document.elementFromPoint(x,y)!==canvas)return null;
      attempts++;const hit=__workshopPicker.pickAt(x,y);
      return hit&&hit.id!==current?{x,y,id:hit.id,before:current,attempts}:null;
    };
    for(const world of points){
      const point=world.clone().project(camera);if(point.z<-1||point.z>1)continue;
      const hit=attempt(r.left+(point.x+1)*r.width/2,r.top+(1-point.y)*r.height/2);if(hit)return hit;
    }
    // Bounded fallback around the framed component, at most25 extra read-only rays.
    for(const x of [.5,.4,.6,.3,.7])for(const y of [.5,.4,.6,.3,.7]){
      const hit=attempt(r.left+r.width*x,r.top+r.height*y);if(hit)return hit;
    }
    return {missing:true,attempts};
  });
  check('visible registered component has a real canvas tap target',!!result.pickTarget.id);
  const target=result.pickTarget;
  if(mobile)await action('component touch tap',page.touchscreen.tap(target.x,target.y));
  else await action('component mouse click',page.mouse.click(target.x,target.y));
  await page.waitForFunction(id=>__workshop.learning.state.selectedId===id,target.id,{timeout:120000,polling:100});
  check('native tap selects the actual registered component',await page.evaluate(id=>
    __workshop.learning.state.selectedId===id&&__workshop.inspection.partId===id,target.id));
  await waitCamera();
  result.highlight=await page.evaluate(()=>{
    const h=__cw.scene.getObjectByName('Inspected original component');
    return {type:h?.type,line:!!h?.isLineSegments,visible:h?.visible,depthTest:h?.material?.depthTest,
      depthWrite:h?.material?.depthWrite,vertices:h?.geometry?.getAttribute('position')?.count||0,
      diagnostics:__workshop.learning.diagnostics.highlight};
  });
  check('selection follows depth-tested component geometry',result.highlight.line&&result.highlight.type!=='Box3Helper'
    && result.highlight.visible&&result.highlight.depthTest===true&&result.highlight.depthWrite===false
    && result.highlight.vertices>0&&result.highlight.diagnostics.segments>0);
  const dragPoint=await page.evaluate(()=>{
    const canvas=document.getElementById('canvas'),r=canvas.getBoundingClientRect();
    for(const x of [.5,.4,.6])for(const y of [.5,.3,.7]){
      const px=r.left+r.width*x,py=r.top+r.height*y;
      if(px>40&&py>40&&px<innerWidth-40&&py<innerHeight-40&&document.elementFromPoint(px,py)===canvas)return {x:px,y:py};
    }
    throw Error('No unobstructed native orbit point');
  });
  const beforeDrag=await page.evaluate(()=>({id:__workshop.learning.state.selectedId,selections:__workshopPicker.diagnostics.selections}));
  await action('orbit pointer move',page.mouse.move(dragPoint.x,dragPoint.y));
  await action('orbit pointer down',page.mouse.down());
  try{
    await action('orbit move away',page.mouse.move(dragPoint.x+28,dragPoint.y+14,{steps:4}));
    await action('orbit move back',page.mouse.move(dragPoint.x,dragPoint.y,{steps:4}));
  }finally{await action('orbit pointer up',page.mouse.up());}
  result.afterDrag=await page.evaluate(()=>({id:__workshop.learning.state.selectedId,selections:__workshopPicker.diagnostics.selections}));
  check('native orbit drag never selects another component',result.afterDrag.id===beforeDrag.id&&result.afterDrag.selections===beforeDrag.selections);
  await click('[data-bench-mode="cycle"]');
  await page.waitForFunction(()=>__workshop.lessons.state.active&&__workshop.lessons.state.kind==='cycle',null,{timeout:120000,polling:100});
  await waitCamera();
  await visibleSceneWith('#lesson-angle','Cycle');
  await click('#workshop-exit');
  await page.waitForFunction(()=>!__workshop.active&&!__cw.drive.locked,null,{timeout:120000,polling:100});
  result.restoredLighting=await lightSnapshot();
  check('native exit restores original lights and exposure exactly',JSON.stringify(result.restoredLighting)===JSON.stringify(original)
    &&await page.evaluate(()=>!__workshopLighting.active&&!__workshopLighting.transitioning));
  check('inspection suite restores the original machine controls',await page.locator('.dock').isVisible()
    &&await page.evaluate(()=>!__workshop.learning.active&&!__workshop.lessons.state.active&&!__workshop.inspection.compact));
  return result;
};
