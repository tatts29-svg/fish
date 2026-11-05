// Author: Andrew Fisher. Coates workshop controls on the existing machine.
import {installEngineLiftPreview} from './engine-lift-preview.js';
import {installWorkshopLearning} from './workshop-learning.js';

export function mountWorkshop({T,scene,engine,body,studioRoot,drive,camera,controls,prepare,restore}) {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const lift=installEngineLiftPreview({T,scene,engine,body,studioRoot,drive,reducedMotion:()=>motion.matches});
  const learning=installWorkshopLearning({T,scene,engine,body,lift,drive});
  const css=document.createElement('style');
  css.textContent=`
    #workshop-enter{border-bottom:3px solid #ff6a13;color:#ffa05f}
    #workshop-panel{position:absolute;z-index:25;bottom:42px;left:24px;right:24px;padding:12px 18px;border:1px solid #485359;border-top:2px solid #ff6a13;border-radius:12px;background:rgba(18,28,33,.97);color:#eff5f6;box-shadow:0 14px 40px #0008}
    #workshop-panel[hidden]{display:none}
    .workshop-head,.workshop-actions{display:flex;align-items:center;gap:14px;justify-content:space-between}
    .workshop-head strong{display:block;font-size:18px;margin-top:4px}.workshop-head small{color:#ff9a59;font-size:10px;letter-spacing:1.4px}
    #workshop-exit{min-width:44px;min-height:44px}#workshop-inspect,#workshop-bench-open{min-height:44px;white-space:nowrap}.workshop-head>div{flex:1;min-width:0}.workshop-actions{margin-top:12px;justify-content:flex-start}#workshop-direction,#workshop-reset{min-width:44px;min-height:44px}
    #workshop-play{background:#ff6a13;color:#171e21;min-width:100px;font-weight:700;min-height:44px}
    #workshop-progress{flex:1;min-width:40px;accent-color:#ff6a13;height:34px}#workshop-percent{min-width:34px;font-variant-numeric:tabular-nums}
    #workshop-note{font-size:11px;color:#bac9ce;margin:10px 0 0}.workshop-active .dock,.workshop-active .view-options,.workshop-active .telemetry,.workshop-active .inspector,.workshop-active #assembly-notice,.workshop-active #status{display:none!important}
    .workshop-active .scene-bottom{bottom:12px}.workshop-active .scene-title{max-width:70%}.workshop-active #connection-progress{visibility:hidden}
    .workshop-active .connections,.workshop-active .connection-summary{display:none}.workshop-active .intro h1{font-size:2rem}.workshop-bench{grid-column:1/-1;margin-top:20px;border-top:2px solid #ff6a13;padding-top:16px}.workshop-bench[hidden],.workshop-bench [hidden]{display:none!important}.workshop-bench h2{font-size:20px;margin:0 0 8px}.workshop-bench p{font-size:13px;line-height:1.55;color:#c2cdd2;margin:8px 0}.bench-modes,.bench-actions{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.bench-modes button,.bench-actions button{min-height:44px;border:1px solid #46535b;border-radius:6px;padding:8px 10px}.bench-modes [aria-pressed=true]{border-color:#ff6a13;color:#ffa268;background:#ff6a1318}.workshop-bench label{display:block;font-size:12px;margin-top:14px;color:#cad3d8}.workshop-bench select{width:100%;min-height:44px;margin-top:6px;padding:8px;background:#1c282e;color:#fff;border:1px solid #56646b;border-radius:6px}.workshop-bench button:disabled{opacity:.4}.bench-copy{border-left:2px solid #ff6a13;padding-left:10px}#bench-focus{color:#ffa268}#bench-feedback{min-height:36px}#bench-steps{padding-left:18px;font-size:12px;line-height:1.5;color:#c2cdd2}.workshop-bench small{font-size:11px;color:#93a5ae;line-height:1.5;display:block}.workshop-bench summary{cursor:pointer;font-size:13px;color:#ffab73;padding:10px 0}
    @media(max-width:700px){.masthead{gap:0 6px;padding:10px 10px 0}.brand{gap:8px}.brand .wordmark{width:75px}.brand>.brand-name{font-size:14px;padding-left:8px}.workshop-active .header-actions #tour{display:none}.masthead nav{gap:0;justify-content:space-between;height:44px}.masthead nav button{font-size:11px;padding:8px 5px;white-space:nowrap}#workshop-panel{bottom:32px;left:10px;right:10px;padding:12px}.workshop-head strong{font-size:15px}.workshop-actions{gap:8px}#workshop-enter{padding:8px 6px}.workshop-active .scene-title{display:none}#workshop-note{line-height:1.4}}
  `;
  document.head.append(css);
  const entry=document.createElement('button');entry.id='workshop-enter';entry.textContent='Engine lift';entry.setAttribute('aria-pressed','false');
  document.querySelector('.masthead nav').append(entry);
  const panel=document.createElement('section');panel.id='workshop-panel';panel.hidden=true;panel.setAttribute('aria-label','Engine workshop');
  panel.innerHTML=`<div class="workshop-head"><div><small>COATES #26 · WORKSHOP</small><strong id="workshop-stage" aria-live="polite">Ready to lift</strong></div><button id="workshop-inspect" aria-label="Inspect the engine close up">Inspect</button><button id="workshop-bench-open" aria-label="Open the engine service bench">Bench</button><button id="workshop-exit" aria-label="Exit engine lift">✕</button></div><div class="workshop-actions"><button id="workshop-play">Lift engine</button><label for="workshop-progress" class="sr-only">Lift sequence</label><input id="workshop-progress" type="range" min="0" max="1000" value="0" step="1"><output id="workshop-percent" for="workshop-progress">0%</output><button id="workshop-direction" aria-label="Reverse lift direction" title="Reverse lift direction">⇄</button><button id="workshop-reset" aria-label="Restart lift">↺</button></div><p id="workshop-note">Drag to look around. Move the slider to inspect any stage. Prepared-engine illustration; not a servicing procedure.</p>`;
  document.querySelector('.studio').append(panel);
  const bench=document.createElement('section');bench.className='workshop-bench';bench.id='workshop-bench';bench.hidden=true;
  bench.innerHTML=`<h2>Engine service bench</h2><p id="bench-availability">Lower the engine onto the bench to explore it.</p><div class="bench-modes" aria-label="Bench activity"><button data-bench-mode="inspect" aria-pressed="true">Inspect</button><button data-bench-mode="oil" aria-pressed="false">Oil flow</button><button data-bench-mode="coolant" aria-pressed="false">Coolant</button><button data-bench-mode="fault" aria-pressed="false">Find a fault</button></div><div id="bench-challenges" hidden><label for="bench-challenge">Challenge</label><select id="bench-challenge"></select><button id="bench-start">Start challenge</button></div><label for="bench-part">Component</label><select id="bench-part"></select><div class="bench-copy"><strong id="bench-selected"></strong><p id="bench-detail"></p><p id="bench-connection"></p></div><div class="bench-actions"><button id="bench-focus">View component</button><button id="bench-cutaway" aria-pressed="false">Cutaway off</button><button id="bench-crank">Turn crank 45°</button></div><p id="bench-feedback" role="status" aria-live="polite"></p><div class="bench-actions" id="bench-fault-actions" hidden><button id="bench-repair" disabled>Repair connection</button><button id="bench-restart">Reset challenge</button></div><details id="bench-flow" hidden open><summary id="bench-flow-title">Flow path</summary><p id="bench-flow-detail"></p><ol id="bench-steps"></ol></details><small>Interactive mechanical illustration. No live telemetry or manufacturer service specifications.</small>`;
  document.querySelector('.sidebar .intro').after(bench);
  const el=id=>document.getElementById(id);let disabled=[],lastStage='',lastPercent=-1,lastPlay='';
  const canvasLabel=el('canvas').getAttribute('aria-label');let savedCamera=null,carBounds=null,inspecting=false,componentFocus=false,benchSignature='';const lastLoad=new T.Vector3();
  for(const p of learning.parts){const o=document.createElement('option');o.value=p.id;o.textContent=p.label;el('bench-part').append(o);}
  for(const c of learning.challenges){const o=document.createElement('option');o.value=c.id;o.textContent=c.label;el('bench-challenge').append(o);}
  function syncBench(){
    const s=learning.state,signature=JSON.stringify(s);bench.hidden=!s.active;
    if(signature===benchSignature)return;benchSignature=signature;
    if(!s.active){componentFocus=false;return;}
    el('bench-availability').textContent='Engine supported · turn the mechanism by hand and inspect each connection.';
    bench.querySelectorAll('[data-bench-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.benchMode===s.mode)));
    el('bench-part').value=s.selectedId;el('bench-selected').textContent=s.selected.label;
    el('bench-detail').textContent=s.selected.detail;el('bench-connection').textContent=s.selected.connection;
    el('bench-cutaway').textContent=s.cutaway?'Cutaway on':'Cutaway off';el('bench-cutaway').setAttribute('aria-pressed',String(s.cutaway));
    el('bench-challenges').hidden=s.mode!=='fault';el('bench-fault-actions').hidden=!s.challenge;
    el('bench-repair').disabled=!s.challenge?.canRepair;
    el('bench-feedback').textContent=s.challenge?s.challenge.message:(s.instruction+' · Hand crank '+s.crankDegrees+'°');
    el('bench-flow').hidden=!s.flow;
    if(s.flow){el('bench-flow-title').textContent=s.flow.label;el('bench-flow-detail').textContent=s.flow.detail;el('bench-steps').replaceChildren(...s.flow.steps.map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));}
  }
  function closeBench(){const focused=componentFocus;learning.reset();componentFocus=false;bench.hidden=true;benchSignature='';if(focused&&lift.active)frameWorkshop();}
  function focusComponent(){
    if(!learning.active)return;learning.update(0);componentFocus=true;inspecting=false;
    controls.target.copy(learning.focus);camera.position.copy(controls.target).add(new T.Vector3(-2.0,1.05,2.8));controls.update();shadowDirty=true;
    el('workshop-inspect').textContent='Overview';el('workshop-inspect').setAttribute('aria-label','Show the whole workshop sequence');
    if(innerWidth<700)el('viewport').scrollIntoView({block:'start',behavior:'instant'});
  }
  function frameWorkshop(){
    if(!lift.active)return;
    inspecting=false;componentFocus=false;el('workshop-inspect').textContent='Inspect';el('workshop-inspect').setAttribute('aria-label','Inspect the engine close up');
    const progress=lift.progress,playing=lift.playing,box=carBounds.clone();
    for(const p of [0,.48,.75,1]){lift.setProgress(p);box.union(lift.bounds);}
    lift.setProgress(progress);lift.setPlaying(playing);
    const viewport=el('viewport').getBoundingClientRect(),panelRect=panel.getBoundingClientRect();
    const reserve=Math.max(0,viewport.bottom-panelRect.top)+20,usable=Math.max(.35,1-reserve/viewport.height);
    camera.fov=viewport.width<700?35:28;camera.aspect=viewport.width/viewport.height;
    camera.setViewOffset(viewport.width,viewport.height,0,reserve/2,viewport.width,viewport.height);
    const center=box.getCenter(new T.Vector3()),dir=new T.Vector3(-.68,.30,.81).normalize();
    const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),dir).normalize(),up=new T.Vector3().crossVectors(dir,right);
    const tan=Math.tan(camera.fov*Math.PI/360);let distance=0;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const p=new T.Vector3(x,y,z).sub(center),depth=p.dot(dir);
      distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+depth,Math.abs(p.dot(up))/(tan*usable)+depth);
    }
    controls.maxDistance=Math.max(30,distance*1.2);controls.target.copy(center);camera.position.copy(center).addScaledVector(dir,distance*1.12);controls.update();
    shadowDirty=true;
  }
  const observer=new ResizeObserver(()=>{if(lift.active)requestAnimationFrame(frameWorkshop);});observer.observe(el('viewport'));
  let shadowDirty=true;
  function sync(){
    if(lift.active){for(const [id,text] of [['scene-kicker','04 / IN THE WORKSHOP'],['scene-description','Coates #26 · Engine workshop'],['count','Workshop · engine isolated']])if(el(id).textContent!==text)el(id).textContent=text;}
    const stage=typeof lift.stage==='string'?lift.stage:lift.stage?.label||'Engine lift';
    if(stage!==lastStage){el('workshop-stage').textContent=stage;lastStage=stage;}
    const n=Math.round(lift.progress*100);if(n!==lastPercent){el('workshop-progress').value=Math.round(lift.progress*1000);el('workshop-percent').textContent=n+'%';lastPercent=n;}
    const play=lift.playing?'Pause':lift.progress>=1?'Refit engine':lift.progress<=0?'Lift engine':lift.direction<0?'Continue refit':'Continue lift';if(play!==lastPlay){el('workshop-play').textContent=play;lastPlay=play;}
    el('workshop-direction').setAttribute('aria-label',lift.direction<0?'Change direction to lift':'Change direction to refit');syncBench();
  }
  function enter(){
    if(lift.active)return;
    savedCamera={fov:camera.fov,maxDistance:controls.maxDistance};
    prepare();
    carBounds=new T.Box3().setFromObject(body.root);
    const r=lift.enter();if(r?.ok===false){restore();return r;}
    document.body.classList.add('workshop-active');panel.hidden=false;entry.setAttribute('aria-pressed','true');
    el('canvas').setAttribute('aria-label','Engine workshop. Drag to orbit and pinch or scroll to zoom. Space plays or pauses; Escape exits. Use the lift slider to inspect each stage.');
    document.querySelector('.scene-bottom span').textContent='Drag to orbit · Pinch or scroll to zoom · Scrub to inspect';
    disabled=[];for(const node of document.querySelectorAll('.sidebar button,.sidebar input,.masthead [data-view],#tour,.dock button,.dock input,#home,#help,#original')){if(bench.contains(node))continue;disabled.push([node,node.disabled]);node.disabled=true;}
    frameWorkshop();
    shadowDirty=true;lastStage='';lastPercent=-1;sync();el('workshop-play').focus();return {ok:true};
  }
  function exit(){
    if(!lift.active)return;closeBench();lift.exit();panel.hidden=true;document.body.classList.remove('workshop-active');entry.setAttribute('aria-pressed','false');
    el('canvas').setAttribute('aria-label',canvasLabel);
    camera.clearViewOffset();if(savedCamera){camera.fov=savedCamera.fov;controls.maxDistance=savedCamera.maxDistance;savedCamera=null;camera.updateProjectionMatrix();}
    disabled.forEach(([node,state])=>node.disabled=state);disabled=[];restore();
    entry.focus();
  }
  entry.onclick=()=>lift.active?exit():enter();el('workshop-exit').onclick=exit;
  el('workshop-inspect').onclick=()=>{if(inspecting||componentFocus){frameWorkshop();return;}inspecting=true;lastLoad.fromArray(lift.diagnostics.loadWorld);controls.target.copy(lastLoad).add(new T.Vector3(0,.25,0));camera.position.copy(controls.target).add(new T.Vector3(-3.2,1.5,3.8));controls.update();el('workshop-inspect').textContent='Overview';el('workshop-inspect').setAttribute('aria-label','Show the whole workshop sequence');};
  el('workshop-play').onclick=()=>{if(lift.playing)lift.setPlaying(false);else{closeBench();if(lift.progress>=1)lift.refit();else{if(lift.progress<=0)lift.setDirection(1);lift.setPlaying(true);}}shadowDirty=true;sync();};
  el('workshop-direction').onclick=()=>{closeBench();lift.reverse();shadowDirty=true;sync();};
  el('workshop-reset').onclick=()=>{closeBench();lift.reset();shadowDirty=true;sync();};
  el('workshop-progress').oninput=e=>{closeBench();lift.setPlaying(false);lift.setProgress(Number(e.target.value)/1000);shadowDirty=true;sync();};
  el('workshop-bench-open').onclick=()=>{closeBench();lift.setProgress(1);learning.setMode('inspect');learning.update(0);sync();focusComponent();if(innerWidth<700)bench.scrollIntoView({block:'start',behavior:'instant'});bench.querySelector('[data-bench-mode=inspect]').focus({preventScroll:true});};
  for(const b of bench.querySelectorAll('[data-bench-mode]'))b.onclick=()=>{learning.setMode(b.dataset.benchMode);learning.update(0);shadowDirty=true;sync();if(componentFocus)focusComponent();};
  el('bench-part').onchange=e=>{learning.selectPart(e.target.value);learning.update(0);shadowDirty=true;sync();if(componentFocus)focusComponent();};
  el('bench-focus').onclick=focusComponent;
  el('bench-cutaway').onclick=()=>{learning.setCutaway(!learning.state.cutaway);learning.update(0);shadowDirty=true;sync();};
  el('bench-crank').onclick=()=>{learning.turnCrank(Math.PI/4);learning.update(0);shadowDirty=true;sync();};
  el('bench-start').onclick=()=>{learning.startChallenge(el('bench-challenge').value);learning.update(0);shadowDirty=true;sync();if(componentFocus)focusComponent();};
  el('bench-repair').onclick=()=>{learning.repairChallenge();learning.update(0);shadowDirty=true;sync();};
  el('bench-restart').onclick=()=>{learning.resetChallenge();learning.update(0);shadowDirty=true;sync();};
  const changedMotion=()=>{lift.setReducedMotion(motion.matches);shadowDirty=true;};motion.addEventListener('change',changedMotion);
  const key=e=>{if(!lift.active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit();return;}if(/^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|A)$/.test(e.target.tagName))return;if(e.key===' '){e.preventDefault();e.stopImmediatePropagation();el('workshop-play').click();}};
  window.addEventListener('keydown',key,true);
  return {lift,learning,enter,exit,get shadowDirty(){return shadowDirty;},set shadowDirty(v){shadowDirty=v;},get active(){return lift.active;},update(dt){if(lift.active){lift.update(dt);learning.update(dt);if(inspecting){const next=new T.Vector3().fromArray(lift.diagnostics.loadWorld),delta=next.clone().sub(lastLoad);camera.position.add(delta);controls.target.add(delta);lastLoad.copy(next);}sync();}},dispose(){exit();learning.dispose();observer.disconnect();motion.removeEventListener('change',changedMotion);window.removeEventListener('keydown',key,true);lift.dispose();entry.remove();panel.remove();bench.remove();css.remove();}};
}
