/* Author: Andrew Fisher. Full-circuit orientation and compact camera controls. */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.showcase794)return;
let map=null,mapCL=null,mapProject=null,lastPaint=-Infinity;
const byId=id=>document.getElementById(id);
/* Keep an explicitly selected camera. First-time viewers get the complete-lap director. */
showViewGet=function(){
 try{const v=localStorage.getItem(VIEW_KEY);return v&&G.VIEWS.some(x=>x[0]===v)?v:'tour';}
 catch(e){return 'tour';}
};
function install(){
 const show=byId('showcase'),stage=show&&show.querySelector('.shstage');if(!stage)return;
 const select=byId('showView');
 if(select&&!select.querySelector('option[value="tour"]')){
  if(!select.options.length)showViewFill();
  else{const option=document.createElement('option');option.value='tour';option.textContent='Circuit tour';select.prepend(option);}
  select.value=showViewGet();
 }
 const auto=select&&select.querySelector('option[value="auto"]');if(auto)auto.textContent='Auto — circuit cameras';
 if(!map){
  map=document.createElement('aside');map.id='showLap794';map.className='shlap794';map.hidden=true;
  map.setAttribute('aria-label','Circuit lap progress');
  map.innerHTML='<svg viewBox="0 0 144 96" aria-hidden="true"><path class="shlapRoute794"/><path class="shlapDone794"/><circle class="shlapStart794" r="2.5"/><circle class="shlapCar794" r="4"/></svg><b>Full circuit</b><span class="shlapDistance794"></span><span class="shlapProgress794" role="progressbar" aria-label="Lap completed" aria-valuemin="0" aria-valuemax="100"></span>';
  stage.appendChild(map);
 }
 const group=show.querySelector('.shctlg');
 if(group&&!byId('showOptions794')){
  const button=document.createElement('button');button.type='button';button.id='showOptions794';button.className='shbtn';button.textContent='Options';button.setAttribute('aria-expanded','false');
  button.onclick=()=>{const on=show.classList.toggle('camera-options794');button.setAttribute('aria-expanded',String(on));};
  group.appendChild(button);
  for(const id of ['showSound','showBroadcast','showEngineL','showPaceL','showQualityL','showCarFocus']){const node=byId(id);if(node)node.classList.add('shMore794');}
  const backdrop=byId('showBackdrop'),loop=byId('showLoop');
  for(const node of [backdrop,loop])if(node&&node.parentElement)node.parentElement.classList.add('shMore794');
 }
}
function buildMap(S){
 const points=[];for(let i=0;i<=240;i++){const p=S.CL.at(S.gridS+S.CL.L*i/240);points.push([p[0],p[1]]);}
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const scale=Math.min(128/Math.max(1,maxX-minX),80/Math.max(1,maxZ-minZ));
 mapProject=p=>[72+(p[0]-(minX+maxX)/2)*scale,48+(p[1]-(minZ+maxZ)/2)*scale];
 const path=points.map((p,i)=>{const q=mapProject(p);return(i?'L':'M')+q[0].toFixed(2)+' '+q[1].toFixed(2);}).join(' ')+' Z';
 const route=map.querySelector('.shlapRoute794'),done=map.querySelector('.shlapDone794');route.setAttribute('d',path);done.setAttribute('d',path);done.setAttribute('pathLength','1');
 const start=mapProject(points[0]),dot=map.querySelector('.shlapStart794');dot.setAttribute('cx',start[0]);dot.setAttribute('cy',start[1]);mapCL=S.CL;
}
function paint(force){
 const now=performance.now();if(!force&&now-lastPaint<180)return;lastPaint=now;
 install();if(!map)return;
 const S=G.S,show=byId('showcase'),active=!!(S&&SHOW.open&&show&&show.classList.contains('car-focus')&&showRenderer()==='3d');
 map.hidden=!active;if(!active)return;
 if(S.capEl&&!S.compactCredit794){
  S.capEl.title=S.credit||'';S.credit=S.creditShort='Circuit: iEDM key plan · © OpenStreetMap contributors (ODbL) · illustrative view';
  S.capEl.textContent=S.credit;S.compactCredit794=true;
 }
 if(mapCL!==S.CL)buildMap(S);
 const report=G.playback794&&G.playback794.report();
 const M=G.M_PER_PT||6,L=S.CL.L*M;
 const metres=report?report.distanceM:Math.max(0,(S.sim.s-S.gridS)*M);
 const looping=report&&(report.loop||(typeof BC!=='undefined'&&BC.on))&&report.laps>=1;
 const progress=looping?report.lapProgress:report?report.progress:Math.min(1,metres/L),percent=Math.min(100,Math.floor(progress*100));
 const point=mapProject(S.CL.at(S.sim.s)),dot=map.querySelector('.shlapCar794');dot.setAttribute('cx',point[0]);dot.setAttribute('cy',point[1]);
 map.querySelector('.shlapDone794').style.strokeDasharray=progress+' 1';
 map.querySelector('b').textContent=report&&report.finished?'Lap complete':looping?'Lap '+(Math.floor(report.laps)+1):'Full circuit';
 map.querySelector('.shlapDistance794').textContent=((looping?progress*L:Math.min(metres,L))/1000).toFixed(2)+' / '+(L/1000).toFixed(2)+' km';
 const bar=map.querySelector('.shlapProgress794');bar.setAttribute('aria-valuenow',String(percent));bar.style.setProperty('--lap',percent+'%');
}
const controls=showDriveControls;
showDriveControls=function(){const result=controls.apply(this,arguments);paint(true);return result;};
const sync=showSyncControls;
showSyncControls=function(){const result=sync.apply(this,arguments);paint(true);return result;};
const close=showClose;
showClose=function(){const result=close.apply(this,arguments);if(map)map.hidden=true;return result;};
const frame=G.frame;
G.frame=function(){const result=frame.apply(this,arguments);paint(false);return result;};
G.showcase794={version:'v7.94',paint};
install();
})();
