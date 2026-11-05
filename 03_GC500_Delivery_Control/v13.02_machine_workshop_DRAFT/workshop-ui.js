// Author: Andrew Fisher. Review-only workshop controls on the existing machine.
import {installEngineLiftPreview} from './engine-lift-preview.js';

export function mountWorkshop({T,scene,engine,body,studioRoot,drive,camera,controls,prepare,restore}) {
  const lift=installEngineLiftPreview({T,scene,engine,body,studioRoot,drive});
  const css=document.createElement('style');
  css.textContent=`
    #workshop-enter{border-bottom:3px solid #ff6a13;color:#ffa05f}
    #workshop-panel{position:absolute;z-index:25;bottom:42px;left:24px;right:24px;padding:12px 18px;border:1px solid #485359;border-top:2px solid #ff6a13;border-radius:12px;background:rgba(18,28,33,.97);color:#eff5f6;box-shadow:0 14px 40px #0008}
    #workshop-panel[hidden]{display:none}
    .workshop-head,.workshop-actions{display:flex;align-items:center;gap:14px;justify-content:space-between}
    .workshop-head strong{display:block;font-size:18px;margin-top:4px}.workshop-head small{color:#ff9a59;font-size:10px;letter-spacing:1.4px}
    #workshop-exit{min-width:44px;min-height:44px}#workshop-inspect{min-height:44px;white-space:nowrap}.workshop-head>div{flex:1}.workshop-actions{margin-top:12px;justify-content:flex-start}
    #workshop-play{background:#ff6a13;color:#171e21;min-width:100px;font-weight:700;min-height:44px}
    #workshop-progress{flex:1;min-width:40px;accent-color:#ff6a13;height:34px}#workshop-percent{min-width:34px;font-variant-numeric:tabular-nums}
    #workshop-note{font-size:11px;color:#bac9ce;margin:10px 0 0}.workshop-active .dock,.workshop-active .view-options,.workshop-active .telemetry,.workshop-active .inspector,.workshop-active #assembly-notice,.workshop-active #status{display:none!important}
    .workshop-active .scene-bottom{bottom:12px}.workshop-active .scene-title{max-width:70%}.workshop-active #connection-progress{visibility:hidden}
    @media(max-width:700px){.masthead{gap:0 6px;padding:10px 10px 0}.brand{gap:8px}.brand .wordmark{width:75px}.brand>.brand-name{font-size:14px;padding-left:8px}.header-actions #tour{display:none}.masthead nav{gap:0;justify-content:space-between;height:44px}.masthead nav button{font-size:11px;padding:8px 5px;white-space:nowrap}#workshop-panel{bottom:32px;left:10px;right:10px;padding:12px}.workshop-head strong{font-size:15px}.workshop-actions{gap:8px}#workshop-enter{padding:8px 6px}.workshop-active .scene-title{display:none}#workshop-note{line-height:1.4}}
  `;
  document.head.append(css);
  const entry=document.createElement('button');entry.id='workshop-enter';entry.textContent='Engine lift';entry.setAttribute('aria-pressed','false');
  document.querySelector('.masthead nav').append(entry);
  const panel=document.createElement('section');panel.id='workshop-panel';panel.hidden=true;panel.setAttribute('aria-label','Engine lift preview');
  panel.innerHTML=`<div class="workshop-head"><div><small>WORKSHOP PREVIEW · COATES #26</small><strong id="workshop-stage" aria-live="polite">Ready to lift</strong></div><button id="workshop-inspect" aria-label="Inspect the engine close up">Inspect</button><button id="workshop-exit" aria-label="Exit engine lift">✕</button></div><div class="workshop-actions"><button id="workshop-play">Play lift</button><label for="workshop-progress" class="sr-only">Lift sequence</label><input id="workshop-progress" type="range" min="0" max="1000" value="0" step="1"><output id="workshop-percent" for="workshop-progress">0%</output><button id="workshop-reset" aria-label="Restart lift">↺</button></div><p id="workshop-note">Drag to look around. Move the slider to inspect any stage. Illustrative prepared-engine sequence; not a servicing procedure.</p>`;
  document.querySelector('.studio').append(panel);
  const el=id=>document.getElementById(id);let disabled=[],lastStage='',lastPercent=-1,lastPlay='';
  const canvasLabel=el('canvas').getAttribute('aria-label');let savedCamera=null,carBounds=null,inspecting=false;const lastLoad=new T.Vector3();
  function frameWorkshop(){
    if(!lift.active)return;
    inspecting=false;el('workshop-inspect').textContent='Inspect';el('workshop-inspect').setAttribute('aria-label','Inspect the engine close up');
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
    if(lift.active){for(const [id,text] of [['scene-kicker','04 / IN THE WORKSHOP'],['scene-description','Coates #26 · Engine removal'],['count','Workshop preview · prepared engine']])if(el(id).textContent!==text)el(id).textContent=text;}
    const stage=typeof lift.stage==='string'?lift.stage:lift.stage?.label||'Engine lift';
    if(stage!==lastStage){el('workshop-stage').textContent=stage;lastStage=stage;}
    const n=Math.round(lift.progress*100);if(n!==lastPercent){el('workshop-progress').value=Math.round(lift.progress*1000);el('workshop-percent').textContent=n+'%';lastPercent=n;}
    const play=lift.playing?'Pause':lift.progress>=1?'Replay':lift.progress>0?'Resume lift':'Play lift';if(play!==lastPlay){el('workshop-play').textContent=play;lastPlay=play;}
  }
  function enter(){
    if(lift.active)return;
    savedCamera={fov:camera.fov,maxDistance:controls.maxDistance};
    prepare();
    carBounds=new T.Box3().setFromObject(body.root);
    const r=lift.enter();if(r?.ok===false){restore();return r;}
    document.body.classList.add('workshop-active');panel.hidden=false;entry.setAttribute('aria-pressed','true');
    el('canvas').setAttribute('aria-label','Engine lift preview. Drag to orbit and pinch or scroll to zoom. Space plays or pauses; Escape exits. Use the lift slider to inspect each stage.');
    document.querySelector('.scene-bottom span').textContent='Drag to orbit · Pinch or scroll to zoom · Scrub to inspect';
    disabled=[];for(const node of document.querySelectorAll('.sidebar button,.sidebar input,.masthead [data-view],#tour,.dock button,.dock input,#home,#help,#original')){disabled.push([node,node.disabled]);node.disabled=true;}
    frameWorkshop();
    shadowDirty=true;lastStage='';lastPercent=-1;sync();el('workshop-play').focus();return {ok:true};
  }
  function exit(){
    if(!lift.active)return;lift.exit();panel.hidden=true;document.body.classList.remove('workshop-active');entry.setAttribute('aria-pressed','false');
    el('canvas').setAttribute('aria-label',canvasLabel);
    camera.clearViewOffset();if(savedCamera){camera.fov=savedCamera.fov;controls.maxDistance=savedCamera.maxDistance;savedCamera=null;camera.updateProjectionMatrix();}
    disabled.forEach(([node,state])=>node.disabled=state);disabled=[];restore();
    entry.focus();
  }
  entry.onclick=()=>lift.active?exit():enter();el('workshop-exit').onclick=exit;
  el('workshop-inspect').onclick=()=>{if(inspecting){frameWorkshop();return;}inspecting=true;lastLoad.fromArray(lift.diagnostics.loadWorld);controls.target.copy(lastLoad).add(new T.Vector3(0,.25,0));camera.position.copy(controls.target).add(new T.Vector3(-3.2,1.5,3.8));controls.update();el('workshop-inspect').textContent='Overview';el('workshop-inspect').setAttribute('aria-label','Show the whole workshop sequence');};
  el('workshop-play').onclick=()=>{if(lift.progress>=1)lift.reset();lift.setPlaying(!lift.playing);sync();};
  el('workshop-reset').onclick=()=>{lift.reset();shadowDirty=true;sync();};
  el('workshop-progress').oninput=e=>{lift.setPlaying(false);lift.setProgress(Number(e.target.value)/1000);shadowDirty=true;sync();};
  const key=e=>{if(!lift.active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit();return;}if(e.target.tagName==='BUTTON'||e.target.tagName==='INPUT')return;if(e.key===' '){e.preventDefault();e.stopImmediatePropagation();el('workshop-play').click();}};
  window.addEventListener('keydown',key,true);
  return {lift,enter,exit,get shadowDirty(){return shadowDirty;},set shadowDirty(v){shadowDirty=v;},get active(){return lift.active;},update(dt){if(lift.active){lift.update(dt);if(inspecting){const next=new T.Vector3().fromArray(lift.diagnostics.loadWorld),delta=next.clone().sub(lastLoad);camera.position.add(delta);controls.target.add(delta);lastLoad.copy(next);}sync();}},dispose(){exit();observer.disconnect();window.removeEventListener('keydown',key,true);lift.dispose();entry.remove();panel.remove();css.remove();}};
}
