// Author: Andrew Fisher. Coates workshop controls on the existing machine.
import {installEngineLiftPreview} from './engine-lift-preview.js?v=13.03';
import {installWorkshopLearning} from './workshop-learning.js?v=13.05';
import {installWorkshopCamera} from './workshop-camera.js?v=13.05';
import {installWorkshopService} from './workshop-service.js?v=13.04';
import {installWorkshopMechanic} from './workshop-mechanic.js?v=13.04';
import {installWorkshopLessons} from './workshop-lessons.js?v=13.04';
import {installWorkshopShowcase} from './workshop-showcase.js?v=13.04';

// Fit the actual inspected part, from a valve to the complete engine. A fixed
// metre-scale camera floor left small parts too small to inspect on the phone.
export function workshopCameraFit({T,box,direction,fov,aspect,usable=1,margin=1.12,near=.018}) {
  if(!box||box.isEmpty()||!Number.isFinite(aspect)||aspect<=0)return null;
  const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),dir=direction.clone().normalize();
  const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),dir).normalize(),up=new T.Vector3().crossVectors(dir,right);
  const tan=Math.tan(fov*Math.PI/360);let distance=Math.max(.06,near*4);
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
    const p=new T.Vector3(x,y,z).sub(center),depth=p.dot(dir);
    distance=Math.max(distance,Math.abs(p.dot(right))/(tan*aspect)+depth,Math.abs(p.dot(up))/(tan*Math.max(.1,usable))+depth);
  }
  distance*=margin;
  return {center,position:center.clone().addScaledVector(dir,distance),distance,
    minDistance:Math.min(distance*.85,Math.max(near*3,size.length()*.04)),maxDistance:Math.max(30,distance*1.2)};
}

export function mountWorkshop({T,scene,engine,body,studioRoot,drive,camera,controls,crew,crewPolish,prepare,restore,cancelCamera=()=>{}}) {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const lift=installEngineLiftPreview({T,scene,engine,body,studioRoot,drive,reducedMotion:()=>motion.matches});
  const mechanic=installWorkshopMechanic({T,scene,crew,crewPolish,engine,body,studioRoot});
  const service=installWorkshopService({T,scene,engine,body,studioRoot,lift,mechanic});
  const learning=installWorkshopLearning({T,scene,engine,body,lift,drive});
  const lessons=installWorkshopLessons({T,scene,engine,body,lift,learning,reducedMotion:()=>motion.matches});
  const showcase=installWorkshopShowcase({T,camera,controls,service,lift,learning,lessons,reducedMotion:()=>motion.matches});
  const css=document.createElement('style');
  css.textContent=`
    #workshop-enter{border-bottom:3px solid #ff6a13;color:#ffa05f}
    #workshop-panel{position:absolute;z-index:25;bottom:42px;left:24px;right:24px;padding:12px 18px;border:1px solid #485359;border-top:2px solid #ff6a13;border-radius:12px;background:rgba(18,28,33,.97);color:#eff5f6;box-shadow:0 14px 40px #0008}
    #workshop-panel[hidden]{display:none}
    .workshop-head,.workshop-actions{display:flex;align-items:center;gap:14px;justify-content:space-between}
    .workshop-head strong{display:block;font-size:18px;margin-top:4px}.workshop-head small{color:#ff9a59;font-size:10px;letter-spacing:1.4px}
    #workshop-exit{min-width:44px;min-height:44px}#workshop-inspect,#workshop-bench-open{min-height:44px;white-space:nowrap}.workshop-head>div{flex:1;min-width:0}.workshop-actions{margin-top:12px;justify-content:flex-start}#workshop-direction,#workshop-reset{min-width:44px;min-height:44px}
    #workshop-play{background:#ff6a13;color:#171e21;flex:0 0 112px;min-width:112px;padding:8px 6px;font-weight:700;min-height:44px;white-space:nowrap}
    #workshop-progress{flex:1;min-width:40px;accent-color:#ff6a13;height:44px}#workshop-percent{min-width:34px;font-variant-numeric:tabular-nums}
    #workshop-note{font-size:11px;color:#bac9ce;margin:10px 0 0}.workshop-active .dock,.workshop-active .view-options,.workshop-active .telemetry,.workshop-active .inspector,.workshop-active #assembly-notice,.workshop-active #status{display:none!important}
    .workshop-active .scene-bottom{bottom:12px}.workshop-active .scene-title{max-width:70%}.workshop-active #connection-progress{visibility:hidden}
    .workshop-active .connections,.workshop-active .connection-summary{display:none}.workshop-active .intro h1{font-size:2rem}.workshop-bench{grid-column:1/-1;margin-top:20px;border-top:2px solid #ff6a13;padding-top:16px}.workshop-bench[hidden],.workshop-bench [hidden]{display:none!important}.workshop-bench h2{font-size:20px;margin:0 0 8px}.workshop-bench p{font-size:13px;line-height:1.55;color:#c2cdd2;margin:8px 0}.bench-modes,.bench-actions{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.bench-modes button,.bench-actions button{min-height:44px;border:1px solid #46535b;border-radius:6px;padding:8px 10px}.bench-modes [aria-pressed=true]{border-color:#ff6a13;color:#ffa268;background:#ff6a1318}.workshop-bench label{display:block;font-size:12px;margin-top:14px;color:#cad3d8}.workshop-bench select{width:100%;min-height:44px;margin-top:6px;padding:8px;background:#1c282e;color:#fff;border:1px solid #56646b;border-radius:6px}.workshop-bench button:disabled{opacity:.4}.bench-copy{border-left:2px solid #ff6a13;padding-left:10px}#bench-focus{color:#ffa268}#bench-feedback{min-height:36px}#bench-steps{padding-left:18px;font-size:12px;line-height:1.5;color:#c2cdd2}.workshop-bench small{font-size:11px;color:#93a5ae;line-height:1.5;display:block}.workshop-bench summary{cursor:pointer;font-size:13px;color:#ffab73;padding:10px 0}
    .workshop-foot{display:flex;align-items:center;gap:12px;margin-top:6px}.workshop-foot #workshop-note{flex:1;margin:0}#workshop-tour{min-height:44px;white-space:nowrap;border:1px solid #ff6a1366;color:#ffa268}.lesson-controls{padding:10px 0;border-top:1px solid #ffffff21}.lesson-controls input[type=range]{width:100%;min-height:36px}.cycle-phases{display:grid;grid-template-columns:1fr 1fr;gap:5px}.cycle-phases button{min-height:44px;font-size:12px;border:1px solid #46535b}.cycle-phases [aria-pressed=true]{background:#ff6a1322;border-color:#ff6a13;color:#ffa268}#lesson-instruction{border-left:2px solid #ff6a13;padding-left:10px}
    #bench-controls{min-width:0}.workshop-bench button{min-height:44px}.bench-explanation{margin-top:8px;border-top:1px solid #ffffff21}.bench-explanation>summary{min-height:44px;display:flex;align-items:center;gap:8px;list-style:none}.bench-explanation>summary::before{content:'+';color:#ff9a59;font-size:18px}.bench-explanation[open]>summary::before{content:'−'}.bench-explanation[open]>summary{border-bottom:1px solid #ffffff14}.bench-explanation .bench-copy{margin-top:10px}.bench-primary-actions{align-items:stretch}.workshop-bench-mobile .experience{height:100dvh;min-height:0;grid-template-rows:auto minmax(0,1fr) auto}.workshop-bench-mobile main{display:block;min-height:0}.workshop-bench-mobile .sidebar{display:none}.workshop-bench-mobile .studio{height:100%;min-height:0;max-height:none}.workshop-bench-mobile #viewport{bottom:calc(var(--bench-tray-height,280px) + 18px);right:0}.workshop-bench-mobile #workshop-panel{bottom:8px;left:8px;right:8px;height:var(--bench-tray-height,280px);padding:8px;display:flex;flex-direction:column;overflow:hidden}.workshop-bench-mobile #workshop-panel>.workshop-actions,.workshop-bench-mobile #workshop-panel>.workshop-foot{display:none}.workshop-bench-mobile .workshop-head{flex:none;gap:4px}.workshop-bench-mobile .workshop-head strong{font-size:13px;min-height:0;line-height:1.25;margin-top:2px}.workshop-bench-mobile .workshop-head small{font-size:9px;letter-spacing:.8px}.workshop-bench-mobile #workshop-inspect{font-size:12px;padding:6px}.workshop-bench-mobile #workshop-bench-open{font-size:12px;padding:6px}.workshop-bench-mobile #workshop-exit{flex:0 0 44px}.workshop-bench-mobile #workshop-bench{display:flex;flex:1;min-height:0;min-width:0;margin:6px 0 0;padding:0;border:0;overflow:hidden}.workshop-bench-mobile #bench-controls{width:100%;overflow-y:auto;overscroll-behavior:contain;touch-action:auto;scrollbar-width:thin;scrollbar-color:#59666e transparent;padding:0 3px 4px}.workshop-bench-mobile #workshop-bench h2{display:none}.workshop-bench-mobile .bench-modes{margin:0 0 6px;flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain;touch-action:pan-x;scrollbar-width:thin;gap:4px;padding-bottom:2px}.workshop-bench-mobile .bench-modes button{flex:none;font-size:12px;padding:7px 10px}.workshop-bench-mobile label[for=bench-part]{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);margin:0}.workshop-bench-mobile #bench-part{margin:0;min-height:44px;padding:7px 9px;font-size:13px}.workshop-bench-mobile .bench-primary-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin:6px 0}.workshop-bench-mobile .bench-primary-actions button{padding:6px 4px;min-width:0;font-size:11px;line-height:1.2;min-height:44px}.workshop-bench-mobile .lesson-controls{padding:6px 0}.workshop-bench-mobile .lesson-controls input[type=range]{min-height:44px;margin:0}.workshop-bench-mobile .lesson-controls input[type=range]:focus-visible{outline-offset:-2px}.workshop-bench-mobile .cycle-phases{grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin-top:5px}.workshop-bench-mobile .cycle-phases button{font-size:10px;padding:5px 2px;overflow-wrap:anywhere}.workshop-bench-mobile .lesson-controls label{margin-top:6px}.workshop-bench-mobile #lesson-play{min-height:44px;border:1px solid #46535b}.workshop-bench-mobile .scene-bottom{display:none}.workshop-bench-mobile .camera-tools{top:12px;right:12px}.workshop-bench-mobile footer{padding:4px 10px;gap:0;line-height:1.2}.workshop-bench-mobile footer button{min-height:40px}.workshop-bench-landscape #workshop-panel{left:auto;top:8px;bottom:8px;right:8px;width:var(--bench-tray-width,290px);height:auto}.workshop-bench-landscape #viewport{bottom:0;right:calc(var(--bench-tray-width,290px) + 18px)}.workshop-bench-landscape .camera-tools{right:calc(var(--bench-tray-width,290px) + 28px)}
    @media(max-width:700px){.masthead{gap:0 6px;padding:10px 10px 0}.brand{gap:8px}.brand .wordmark{width:75px}.brand>.brand-name{font-size:14px;padding-left:8px}.workshop-active .header-actions #tour{display:none}.masthead nav{gap:0;justify-content:space-between;height:44px}.masthead nav button{font-size:11px;padding:8px 5px;white-space:nowrap}#workshop-panel{bottom:32px;left:10px;right:10px;padding:12px}.workshop-head strong{font-size:15px;line-height:1.2;min-height:3.6em}.workshop-actions{gap:6px}#workshop-play{flex-basis:88px;min-width:88px;font-size:13px}#workshop-enter{padding:8px 6px}.workshop-active .scene-title{display:none}#workshop-note{line-height:1.4}}
  `;
  document.head.append(css);
  const entry=document.createElement('button');entry.id='workshop-enter';entry.textContent='Engine lift';entry.setAttribute('aria-pressed','false');
  document.querySelector('.masthead nav').append(entry);
  const panel=document.createElement('section');panel.id='workshop-panel';panel.hidden=true;panel.setAttribute('aria-label','Engine workshop');
  panel.innerHTML=`<div class="workshop-head"><div><small>COATES #26 · WORKSHOP</small><strong id="workshop-stage" aria-live="polite">Ready to lift</strong></div><button id="workshop-inspect" aria-label="Inspect the engine close up">Inspect</button><button id="workshop-bench-open" aria-label="Open the engine service bench">Bench</button><button id="workshop-exit" aria-label="Exit engine lift">✕</button></div><div class="workshop-actions"><button id="workshop-play">Lift engine</button><label for="workshop-progress" class="sr-only">Lift sequence</label><input id="workshop-progress" type="range" min="0" max="1000" value="0" step="1"><output id="workshop-percent" for="workshop-progress">0%</output><button id="workshop-direction" aria-label="Reverse lift direction" title="Reverse lift direction">⇄</button><button id="workshop-reset" aria-label="Restart lift">↺</button></div><div class="workshop-foot"><p id="workshop-note">Orbit or zoom. Scrub to inspect each stage. Interactive mechanical illustration.</p><button id="workshop-tour" aria-pressed="false">▶ Showcase</button></div>`;
  document.querySelector('.studio').append(panel);
  const bench=document.createElement('section');bench.className='workshop-bench';bench.id='workshop-bench';bench.hidden=true;
  bench.innerHTML=`<h2>Engine service bench</h2><p id="bench-availability">Lower the engine onto the bench to explore it.</p><div class="bench-modes" aria-label="Bench activity"><button data-bench-mode="inspect" aria-pressed="true">Inspect</button><button data-bench-mode="oil" aria-pressed="false">Oil flow</button><button data-bench-mode="coolant" aria-pressed="false">Coolant</button><button data-bench-mode="cycle" aria-pressed="false">Four strokes</button><button data-bench-mode="isolate" aria-pressed="false">Isolate part</button><button data-bench-mode="fault" aria-pressed="false">Find a fault</button></div><div id="bench-challenges" hidden><label for="bench-challenge">Challenge</label><select id="bench-challenge"></select><button id="bench-start">Start challenge</button></div><label for="bench-part">Component</label><select id="bench-part"></select><div class="bench-copy"><strong id="bench-selected"></strong><p id="bench-detail"></p><p id="bench-connection"></p></div><div class="bench-actions"><button id="bench-focus">View component</button><button id="bench-cutaway" aria-pressed="false">Cutaway off</button><button id="bench-crank">Turn crank 45°</button></div><div id="lesson-cycle" class="lesson-controls" hidden><strong id="lesson-phase">Four-stroke cycle</strong><div class="cycle-phases"><button data-cycle-phase="0">Intake</button><button data-cycle-phase="180">Compression</button><button data-cycle-phase="360">Power</button><button data-cycle-phase="540">Exhaust</button></div><label for="lesson-angle">Cycle position <output id="lesson-angle-value">0°</output></label><input id="lesson-angle" type="range" min="0" max="720" step="1" value="0"><button id="lesson-play">Play cycle</button><p id="lesson-valves"></p></div><div id="lesson-isolate" class="lesson-controls" hidden><label for="lesson-rotation">Rotate isolated component <output id="lesson-rotation-value">0°</output></label><input id="lesson-rotation" type="range" min="-180" max="180" step="1" value="0"><div class="bench-actions"><button id="lesson-left" aria-label="Rotate component left 45 degrees">↶ 45°</button><button id="lesson-right" aria-label="Rotate component right 45 degrees">45° ↷</button></div></div><p id="lesson-instruction" hidden></p><p id="bench-feedback" role="status" aria-live="polite"></p><div class="bench-actions" id="bench-fault-actions" hidden><button id="bench-repair" disabled>Repair connection</button><button id="bench-restart">Reset challenge</button></div><details id="bench-flow" hidden open><summary id="bench-flow-title">Flow path</summary><p id="bench-flow-detail"></p><ol id="bench-steps"></ol></details><small>Interactive mechanical illustration. No live telemetry or manufacturer service specifications.</small>`;
  const sidebarIntro=document.querySelector('.sidebar .intro');
  const benchControls=document.createElement('div');benchControls.id='bench-controls';benchControls.tabIndex=0;benchControls.setAttribute('role','region');benchControls.setAttribute('aria-label','Engine inspection controls');
  const explanation=document.createElement('details');explanation.id='bench-details';explanation.className='bench-explanation';
  const summary=document.createElement('summary');summary.textContent='Details and connections';explanation.append(summary);explanation.open=true;
  const explanatory=new Set(['bench-availability','bench-selected','bench-detail','bench-connection','lesson-valves','lesson-instruction','bench-feedback','bench-flow']);
  for(const child of [...bench.children]){
    if(child.classList.contains('bench-copy')||child.tagName==='SMALL'||explanatory.has(child.id))explanation.append(child);else benchControls.append(child);
  }
  benchControls.querySelector('.bench-actions').classList.add('bench-primary-actions');
  benchControls.append(explanation);bench.append(benchControls);sidebarIntro.after(bench);
  const compactMedia=matchMedia('(max-width:800px), (max-width:1000px) and (max-height:520px)');
  let compactBench=false;
  const el=id=>document.getElementById(id);
  const text=(id,value)=>{const node=el(id),s=String(value??'');if(node.textContent!==s)node.textContent=s;};
  const attribute=(id,name,value)=>{const node=el(id),s=String(value??'');if(node.getAttribute(name)!==s)node.setAttribute(name,s);};
  let disabled=[],savedCamera=null,carBounds=null,inspecting=false,componentFocus=false,benchSignature='',shadowDirty=true;
  const canvasLabel=el('canvas').getAttribute('aria-label'),lastLoad=new T.Vector3(),currentLoad=new T.Vector3(),loadDelta=new T.Vector3();
  const cameraMotion=installWorkshopCamera({T,camera,controls,element:el('canvas'),reducedMotion:()=>motion.matches,onChange:()=>{shadowDirty=true;}});
  function placeBench(){
    const compact=service.active&&learning.active&&compactMedia.matches;
    if(compact!==compactBench)explanation.open=!compact||learning.state.mode==='fault';
    compactBench=compact;document.body.classList.toggle('workshop-bench-mobile',compact);
    const landscape=compact&&innerWidth>innerHeight&&innerHeight<540;
    document.body.classList.toggle('workshop-bench-landscape',landscape);
    if(compact&&bench.parentNode!==panel)panel.append(bench);else if(!compact&&bench.parentNode===panel)sidebarIntro.after(bench);
    if(compact){
      const studio=document.querySelector('.studio'),height=studio.getBoundingClientRect().height;
      const tray=Math.max(128,Math.min(310,Math.floor(height*.46))),width=Math.max(220,Math.min(310,Math.floor(innerWidth*.38)));
      for(const [name,value] of [['--bench-tray-height',tray+'px'],['--bench-tray-width',width+'px']])if(studio.style.getPropertyValue(name)!==value)studio.style.setProperty(name,value);
    }
  }
  function reserveBelow(viewport){
    const rect=panel.getBoundingClientRect();
    return rect.left<viewport.right&&rect.right>viewport.left?Math.max(0,viewport.bottom-Math.max(viewport.top,rect.top))+20:20;
  }
  function revealScene(){if(compactBench)document.querySelector('.experience').scrollIntoView({block:'start',behavior:'instant'});}

  for(const p of learning.parts){const o=document.createElement('option');o.value=p.id;o.textContent=p.label;el('bench-part').append(o);}
  for(const c of learning.challenges){const o=document.createElement('option');o.value=c.id;o.textContent=c.label;el('bench-challenge').append(o);}
  function syncBench(){
    const s=learning.state,l=lessons.state,angle=Math.round(l.angleDegrees||0),rotation=Math.round((((l.rotation||0)*180/Math.PI+180)%360+360)%360-180);
    bench.hidden=!s.active;placeBench();learning.refreshHighlight?.();
    const signature=JSON.stringify([s.active,s.mode,s.selectedId,s.cutaway,s.crankDegrees,s.challenge,s.flow,l.active,l.kind,l.phase,angle,l.valves,l.playing,rotation]);
    if(signature===benchSignature)return;benchSignature=signature;
    if(!s.active){componentFocus=false;return;}
    const kind=l.active?l.kind:s.mode;
    text('bench-availability','Engine supported · rigging clear · inspect the connections and mechanism.');
    bench.querySelectorAll('[data-bench-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.benchMode===kind)));
    el('bench-part').value=s.selectedId;el('bench-part').disabled=kind==='cycle';text('bench-selected',s.selected.label);
    text('bench-detail',s.selected.detail);text('bench-connection',kind==='isolate'&&l.selectedPart ? l.selectedPart.reference+' · '+s.selected.connection+(l.selectedPart.connectedParts.length?' · Connected to '+l.selectedPart.connectedParts.map(p=>p.reference+' '+p.label).join(', '):'') : s.selected.connection);
    text('bench-cutaway',s.cutaway?'Cutaway on':'Cutaway off');el('bench-cutaway').setAttribute('aria-pressed',String(s.cutaway));el('bench-cutaway').disabled=l.active;
    el('bench-challenges').hidden=kind!=='fault';el('bench-fault-actions').hidden=!s.challenge||l.active;
    el('bench-repair').disabled=!s.challenge?.canRepair;
    text('bench-feedback',s.challenge?s.challenge.message:s.instruction+' · Hand crank '+s.crankDegrees+'°');
    el('bench-feedback').hidden=l.active;
    el('bench-flow').hidden=!s.flow||l.active;
    if(s.flow){text('bench-flow-title',s.flow.label);text('bench-flow-detail',s.flow.detail);el('bench-steps').replaceChildren(...s.flow.steps.map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));}
    el('lesson-cycle').hidden=kind!=='cycle';el('lesson-isolate').hidden=kind!=='isolate';el('lesson-instruction').hidden=!l.active;
    text('lesson-instruction',l.instruction);
    if(kind==='cycle'){
      text('lesson-phase',l.phase?.label||'Four-stroke cycle');text('lesson-angle-value',angle+'°');el('lesson-angle').value=angle;
      attribute('lesson-angle','aria-valuetext',angle+' degrees · '+(l.phase?.label||'Four-stroke cycle'));
      text('lesson-play',l.playing?'Pause cycle':'Play cycle');text('lesson-valves','Intake '+l.valves.intake+' · Exhaust '+l.valves.exhaust);
      bench.querySelectorAll('[data-cycle-phase]').forEach(b=>b.setAttribute('aria-pressed',String(Math.floor(angle%720/180)===Number(b.dataset.cyclePhase)/180)));
    }
    if(kind==='isolate'){el('lesson-rotation').value=rotation;text('lesson-rotation-value',rotation+'°');attribute('lesson-rotation','aria-valuetext',rotation+' degrees');}
  }
  function stopTour(keepBench=false){
    if(!showcase.active)return;const saved=keepBench&&learning.active?{base:learning.state,lesson:lessons.state}:null;
    showcase.stop();inspecting=false;componentFocus=false;shadowDirty=true;
    if(saved&&service.benchReady){
      learning.setMode(saved.base.mode);learning.selectPart(saved.base.selectedId);learning.setCutaway(saved.base.cutaway);
      learning.turnCrank(saved.base.crankAngle-learning.state.crankAngle);
      if(saved.lesson.active){lessons.setMode(saved.lesson.kind);if(saved.lesson.kind==='cycle')lessons.setCycleAngle(saved.lesson.angleDegrees*Math.PI/180);lessons.setRotation(saved.lesson.rotation);lessons.setPlaying(false);}
      learning.update(0);lessons.update(0);benchSignature='';
    }
  }
  function closeBench(reframe=true){
    cameraMotion.cancel();const focused=componentFocus;lessons.reset();learning.reset();componentFocus=false;bench.hidden=true;benchSignature='';placeBench();
    if(reframe&&focused&&service.active)frameWorkshop();
  }
  let projectionKey='';
  function projection(){
    placeBench();const viewport=el('viewport').getBoundingClientRect();
    const reserve=reserveBelow(viewport),usable=Math.max(.35,1-reserve/viewport.height);
    projectionKey=[viewport.width,viewport.height,reserve].map(n=>Math.round(n*10)).join(':');
    camera.fov=viewport.width<700?35:28;camera.aspect=viewport.width/viewport.height;
    camera.setViewOffset(viewport.width,viewport.height,0,reserve/2,viewport.width,viewport.height);camera.updateProjectionMatrix();return usable;
  }
  function fitBounds(box,direction,margin=1.12,instant=false){
    cancelCamera();const usable=projection(),fit=workshopCameraFit({T,box,direction,fov:camera.fov,aspect:camera.aspect,usable,margin,near:camera.near});
    if(!fit)return;
    fit.bounds=box;cameraMotion.moveTo(fit,{instant});shadowDirty=true;
  }
  function inspectEngine(instant=false){
    const bounds=lift.engineBounds;if(bounds.isEmpty())return;
    inspecting=true;componentFocus=false;
    fitBounds(bounds,new T.Vector3(-.68,.30,.81),1.18,instant);
    lastLoad.fromArray(lift.diagnostics.loadWorld);
    text('workshop-inspect','Overview');el('workshop-inspect').setAttribute('aria-label','Show the whole workshop sequence');
  }
  function focusComponent(scroll=true,instant=false){
    if(!learning.active)return;learning.update(0);lessons.update(0);componentFocus=true;inspecting=false;
    let bounds=lessons.state.active?lessons.bounds:null;
    if(!bounds||bounds.isEmpty()){
      const selected=engine.removable.find(part=>part.id===learning.state.selectedId)?.group;
      bounds=selected?new T.Box3().setFromObject(selected):new T.Box3().setFromCenterAndSize(learning.focus,new T.Vector3(.6,.6,.6));
    }
    fitBounds(bounds,lessons.state.kind==='cycle'?new T.Vector3(.25,.20,1):new T.Vector3(-.53,.28,.80),1.2,instant);
    text('workshop-inspect','Overview');el('workshop-inspect').setAttribute('aria-label','Show the whole workshop sequence');
    if(scroll)revealScene();
  }
  function frameWorkshop(instant=false){
    if(!service.active||!carBounds)return;
    inspecting=false;componentFocus=false;text('workshop-inspect','Inspect');el('workshop-inspect').setAttribute('aria-label','Inspect the engine close up');
    const progress=service.progress,playing=service.playing,box=carBounds.clone();
    for(const p of [0,.30,.5304,.66,.78,1]){service.setProgress(p);box.union(lift.bounds);}
    service.setProgress(progress);service.setPlaying(playing);learning.update(0);lessons.update(0);
    fitBounds(box,new T.Vector3(-.68,.30,.81),1.12,instant);
  }
  function refreshFraming(){
    if(!service.active)return;
    placeBench();const viewport=el('viewport').getBoundingClientRect();
    const key=[viewport.width,viewport.height,reserveBelow(viewport)].map(n=>Math.round(n*10)).join(':');
    if(key===projectionKey)return;
    cancelCamera();cameraMotion.cancel();if(showcase.active){projection();const running=showcase.playing;showcase.seek(showcase.progress);if(running)showcase.resume();}
    else if(componentFocus)focusComponent(false,true);else if(inspecting)inspectEngine(true);else frameWorkshop(true);
  }
  const observer=new ResizeObserver(refreshFraming);observer.observe(el('viewport'));observer.observe(panel);
  function sync(){
    if(service.active){text('scene-kicker','04 / IN THE WORKSHOP');text('scene-description','Coates #26 · Engine workshop');text('count','Workshop · engine isolated');}
    const touring=showcase.active,phase=typeof service.stage==='string'?service.stage:service.stage?.label||'Engine service';
    const compact={
      'Mechanic disconnects modelled hoses and fasteners':'Disconnect engine connections',
      'Reconnect modelled hoses and fasteners':'Reconnect engine connections',
      'Attach the lifting rigging':'Attach lifting gear',
      'Remove the unloaded rigging':'Remove lifting gear',
      'Lift the engine onto its supports':'Lift engine to the bench',
      'Refit the engine in the bay':'Refit the engine',
      'Unhook the supported engine and clear the rig':'Release lifting gear',
      'Reattach the rigging on the supported engine':'Reconnect lifting gear',
      'Engine supported, rig clear — service bench':'Engine ready for service',
      'Engine refitted and modelled connections restored':'Engine refitted'
    };
    text('workshop-stage',compactBench?'Engine service bench':touring?showcase.label:compact[phase]||phase);
    text('workshop-bench-open',learning.active?'Lift':'Bench');attribute('workshop-bench-open','aria-label',learning.active?'Return to lift controls':'Open the engine service bench');
    const progress=touring?showcase.progress:service.progress;
    el('workshop-progress').value=Math.round(progress*1000);text('workshop-percent',Math.round(progress*100)+'%');
    attribute('workshop-progress','aria-label',touring?'Workshop showcase position':'Service sequence position');
    attribute('workshop-progress','aria-valuetext',Math.round(progress*100)+' percent · '+(touring?showcase.label:compact[phase]||phase));
    const action=touring?(showcase.playing?'Pause tour':'Resume tour'):service.playing?'Pause service':service.progress>=1?'Refit engine':service.progress<=0?'Start service':service.direction<0?'Continue refit':'Continue service';
    text('workshop-play',touring?action:service.playing?'Pause':service.progress>=1?'Refit engine':service.progress<=0?'Start':'Continue');
    attribute('workshop-play','aria-label',action);attribute('workshop-play','title',action);
    el('workshop-direction').hidden=touring;el('workshop-reset').setAttribute('aria-label',touring?'Restart workshop showcase':'Restart service sequence');
    el('workshop-direction').setAttribute('aria-label',service.direction<0?'Change direction to removal':'Change direction to refit');
    text('workshop-tour',touring?'Exit tour':'▶ Showcase');el('workshop-tour').setAttribute('aria-pressed',String(touring));
    text('workshop-note',touring?showcase.detail:'Orbit or zoom. Scrub to inspect each stage. Interactive mechanical illustration.');syncBench();
  }
  function enter(){
    if(service.active)return {ok:true};
    savedCamera={fov:camera.fov,minDistance:controls.minDistance,maxDistance:controls.maxDistance};prepare();carBounds=new T.Box3().setFromObject(body.root);
    const r=service.enter();if(r?.ok===false){restore();return r;}
    document.body.classList.add('workshop-active');panel.hidden=false;entry.setAttribute('aria-pressed','true');
    el('canvas').setAttribute('aria-label','Engine workshop. Drag to orbit; pinch or scroll to zoom. Space plays or pauses; Escape exits. Scrub the service sequence or choose Bench and Showcase.');
    document.querySelector('.scene-bottom span').textContent='Drag to orbit · Pinch or scroll to zoom · Scrub to inspect';
    disabled=[];for(const node of document.querySelectorAll('.sidebar button,.sidebar input,.masthead [data-view],#tour,.dock button,.dock input,#help,#original')){if(bench.contains(node))continue;disabled.push([node,node.disabled]);node.disabled=true;}
    frameWorkshop(true);shadowDirty=true;sync();el('workshop-play').focus();return {ok:true};
  }
  function exit(){
    if(!service.active)return;cameraMotion.cancel();stopTour();closeBench(false);service.exit();panel.hidden=true;document.body.classList.remove('workshop-active');placeBench();entry.setAttribute('aria-pressed','false');
    el('canvas').setAttribute('aria-label',canvasLabel);camera.clearViewOffset();
    if(savedCamera){camera.fov=savedCamera.fov;controls.minDistance=savedCamera.minDistance;controls.maxDistance=savedCamera.maxDistance;savedCamera=null;camera.updateProjectionMatrix();}
    disabled.forEach(([node,state])=>node.disabled=state);disabled=[];restore();entry.focus();
  }
  function overview(){
    if(!service.active)return {ok:false};stopTour();closeBench(false);frameWorkshop();sync();return {ok:true};
  }
  entry.onclick=()=>service.active?exit():enter();el('workshop-exit').onclick=exit;
  el('workshop-inspect').onclick=()=>{
    stopTour();if(inspecting||componentFocus){overview();return;}inspectEngine();
  };
  el('workshop-play').onclick=()=>{
    if(showcase.active){showcase.playing?showcase.pause():showcase.resume();sync();return;}
    if(service.playing)service.setPlaying(false);else{closeBench();if(service.progress>=1)service.refit();else{if(service.progress<=0)service.setDirection(1);service.setPlaying(true);}}
    shadowDirty=true;sync();
  };
  el('workshop-direction').onclick=()=>{stopTour();closeBench();service.reverse();shadowDirty=true;sync();};
  el('workshop-reset').onclick=()=>{if(showcase.active){showcase.seek(0);sync();return;}closeBench();service.reset();shadowDirty=true;sync();};
  el('workshop-progress').oninput=e=>{
    if(showcase.active){showcase.seek(Number(e.target.value)/1000);shadowDirty=true;sync();return;}
    closeBench();service.setPlaying(false);service.setProgress(Number(e.target.value)/1000);shadowDirty=true;sync();
  };
  el('workshop-tour').onclick=()=>{cancelCamera();cameraMotion.cancel();if(showcase.active){stopTour();frameWorkshop();}else{closeBench(false);inspecting=componentFocus=false;showcase.start();}shadowDirty=true;sync();};
  el('workshop-bench-open').onclick=()=>{
    if(learning.active){overview();return;}
    stopTour();closeBench(false);service.setProgress(1);learning.setMode('inspect');learning.update(0);sync();focusComponent();
    revealScene();bench.querySelector('[data-bench-mode=inspect]').focus({preventScroll:true});
  };
  for(const b of bench.querySelectorAll('[data-bench-mode]'))b.onclick=()=>{
    stopTour();if(!service.benchReady)return;const mode=b.dataset.benchMode;lessons.reset();
    if(mode==='cycle'||mode==='isolate'){
      if(mode==='cycle')learning.resetChallenge();learning.setMode('inspect');const result=lessons.setMode(mode);
      if(result?.ok===false){text('bench-feedback',result.reason);return;}
    }else learning.setMode(mode);
    explanation.open=!compactBench||mode==='fault';learning.update(0);lessons.update(0);shadowDirty=true;sync();if(componentFocus||lessons.state.active)focusComponent();
  };
  function canSelectComponent(){return service.benchReady&&learning.active&&!showcase.active&&!(lessons.state.active&&lessons.state.kind==='cycle');}
  function selectComponent(id){
    if(!canSelectComponent())return {ok:false,reason:'Choose an inspectable component on the supported engine.'};
    const result=learning.selectPart(id);if(result?.ok===false)return result;
    learning.update(0);lessons.update(0);shadowDirty=true;sync();focusComponent();return {ok:true};
  }
  el('bench-part').onchange=e=>{stopTour(true);selectComponent(e.target.value);};
  el('bench-focus').onclick=()=>{stopTour(true);focusComponent();};
  el('bench-cutaway').onclick=()=>{stopTour(true);learning.setCutaway(!learning.state.cutaway);learning.update(0);shadowDirty=true;sync();};
  el('bench-crank').onclick=()=>{stopTour(true);lessons.setPlaying(false);learning.turnCrank(Math.PI/4);learning.update(0);lessons.update(0);shadowDirty=true;sync();};
  el('bench-start').onclick=()=>{stopTour(true);lessons.reset();learning.startChallenge(el('bench-challenge').value);learning.update(0);shadowDirty=true;sync();if(componentFocus)focusComponent();};
  el('bench-repair').onclick=()=>{stopTour(true);learning.repairChallenge();learning.update(0);shadowDirty=true;sync();};
  el('bench-restart').onclick=()=>{stopTour(true);learning.resetChallenge();learning.update(0);shadowDirty=true;sync();};
  function setCycle(degrees){stopTour(true);lessons.setPlaying(false);lessons.setCycleAngle(degrees*Math.PI/180);lessons.update(0);shadowDirty=true;sync();}
  for(const b of bench.querySelectorAll('[data-cycle-phase]'))b.onclick=()=>setCycle(Number(b.dataset.cyclePhase));
  el('lesson-angle').oninput=e=>setCycle(Number(e.target.value));
  el('lesson-play').onclick=()=>{stopTour(true);lessons.setPlaying(!lessons.state.playing);sync();};
  el('lesson-rotation').oninput=e=>{stopTour(true);lessons.setRotation(Number(e.target.value)*Math.PI/180);lessons.update(0);shadowDirty=true;sync();};
  el('lesson-left').onclick=()=>{stopTour(true);lessons.rotate(-Math.PI/4);lessons.update(0);shadowDirty=true;sync();};
  el('lesson-right').onclick=()=>{stopTour(true);lessons.rotate(Math.PI/4);lessons.update(0);shadowDirty=true;sync();};
  const changedMotion=()=>{lift.setReducedMotion(motion.matches);if(motion.matches)refreshFraming();shadowDirty=true;};motion.addEventListener('change',changedMotion);
  const compactChange=()=>{placeBench();refreshFraming();};compactMedia.addEventListener('change',compactChange);
  const key=e=>{
    if(!service.active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit();return;}
    if(bench.contains(e.target)||/^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|A)$/.test(e.target.tagName))return;
    if(e.key===' '){e.preventDefault();e.stopImmediatePropagation();el('workshop-play').click();}
  };window.addEventListener('keydown',key,true);
  return {lift,service,mechanic,learning,lessons,showcase,enter,exit,overview,cameraMotion,selectComponent,
    get cameraActive(){return cameraMotion.active;},
    get inspection(){return {active:service.active&&(inspecting||componentFocus||learning.active),engine:inspecting,component:componentFocus,partId:learning.active?learning.state.selectedId:null,canSelect:canSelectComponent(),cameraMoving:cameraMotion.active,compact:compactBench};},
    get motionKey(){const l=lessons.state;return [service.progress,l.angleDegrees,l.rotation,showcase.progress].join('|');},
    get shadowDirty(){return shadowDirty;},set shadowDirty(v){shadowDirty=v;},get active(){return service.active;},
    update(dt){if(service.active){
      refreshFraming();service.update(dt);learning.update(dt);lessons.update(dt);showcase.update(dt);
      if(inspecting&&!showcase.active){currentLoad.fromArray(lift.diagnostics.loadWorld);loadDelta.copy(currentLoad).sub(lastLoad);camera.position.add(loadDelta);controls.target.add(loadDelta);cameraMotion.translate(loadDelta);lastLoad.copy(currentLoad);}
      cameraMotion.update(dt);sync();
    }},
    dispose(){exit();cameraMotion.dispose();compactMedia.removeEventListener('change',compactChange);showcase.dispose();lessons.dispose();learning.dispose();service.dispose?.();mechanic.dispose();lift.dispose();observer.disconnect();motion.removeEventListener('change',changedMotion);window.removeEventListener('keydown',key,true);entry.remove();panel.remove();bench.remove();css.remove();}
  };
}
