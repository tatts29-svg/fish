/* Author: Andrew Fisher. Opt-in track detail controls; no service or record access. */
(function(){
'use strict';
const G=window.GC3D;
G.preview781={version:'v7.85',kind:'approved track detail',camera:'chase',enabled:false};
G.enablePreview781=function(on){
 const S=G.S;if(!S)return false;
 G.preview781.enabled=!!on;S.detail781Enabled=!!on;
 if(G.toggleNominalGarages781)G.toggleNominalGarages781(S,!on);
 if(on){G.installTrackDetail781(S);G.installArchitecture781(S);if(G.installVegetation781)G.installVegetation781(S);}
 else{G.disposeTrackDetail781(S);G.disposeArchitecture781(S);if(G.disposeVegetation781)G.disposeVegetation781(S);G.disposeSky781(S);}
 S.needsRender=true;return !!on;
};
G.restartPreview781=function(){
 const S=G.S;if(!S)return;
 const paused=S.paused,view=G.preview781.camera||'chase';
 G.simReset();S.clock=G.GRID+.1;S.sim.go=true;S.sim.v=7/(G.M_PER_PT||6)*(S.tune.tc||1);
 S.sim.s=S.gridS-80/(G.M_PER_PT||6);S.paused=paused;S.calmDrive=true;S.previewLoop781=true;S.previewCam781=null;
 G.pose();G.setView(view);G.camStep(0);S.needsRender=true;
};
const step=G.step;
G.step=function(dt){
 const S=G.S;
 if(S&&S.previewLoop781&&S.sim.s-S.gridS>75/(G.M_PER_PT||6))G.restartPreview781();
 return step(dt);
};
const camStep=G.camStep;
const framedFov=G.framedFov;
G.framedFov=function(degrees,aspect,shot){
 if(G.S&&G.S.previewLoop781)return (aspect<.8?76:degrees)*Math.PI/180;
 return framedFov(degrees,aspect,shot);
};
G.camStep=function(dt){
 camStep(dt);const S=G.S;if(!S||!S.previewLoop781)return;
 const M=G.M_PER_PT||6,p=S.pose.pos,f=S.pose.fwd,r=S.pose.rt;
 const at=(ahead,side,h)=>[p[0]+f[0]*ahead/M+r[0]*side/M,p[1]+h/M,p[2]+f[2]*ahead/M+r[2]*side/M];
 const name=G.preview781.camera||'chase',narrow=S.cv.clientWidth/Math.max(1,S.cv.clientHeight)<.8;
 const desired=name==='onboard'?{eye:at(.2,0,1.45),tgt:at(85,0,1.7),fov:62}:
  name==='hero'?{eye:at(10,7,1.8),tgt:at(-1,0,.65),fov:49}:
  name==='heli'?{eye:at(-20,10,32),tgt:at(32,0,0),fov:55}:
  {eye:at(narrow?-7:-11,narrow?.6:1.2,narrow?1.9:2.9),tgt:at(narrow?12:20,0,1.35),fov:58};
 const prev=S.previewCam781,k=prev&&prev.name===name?1-Math.exp(-Math.max(0,dt)*5):1;
 const c=prev&&k<1?{eye:G.V.lerp(prev.eye,desired.eye,k),tgt:G.V.lerp(prev.tgt,desired.tgt,k),fov:desired.fov}:desired;
 c.name=name;S.previewCam781=c;S.cam=c;S.camRoll=0;S.shotName=name;S.tune.shiftX=0;S.tune.shiftY=0;
};
G.previewReport781=function(){
 const S=G.S;return {author:'Andrew Fisher',version:'v7.85',publication:'approved for release',enabled:!!(S&&S.detail781Enabled),
  scope:'One illustrative pit-straight section; photograph-informed details are not surveyed locations',
  camera:G.preview781.camera,graphics:S?G.graphicsReport():null,track:S&&(S.trackDetail781&&S.trackDetail781.stats||S.detail781Stats)||null,
  architecture:S&&(S.architecture781&&S.architecture781.stats||S.architecture781Stats)||null,
  vegetation:G.vegetationReport781&&S?G.vegetationReport781(S):null};
};
// Track detail is explicitly selected; the saved Showcase appearance remains the default.
function attach(){
 const controls=document.getElementById('showQualityL')||document.getElementById('showBackdrop');
 if(!controls||document.getElementById('detail781Button'))return;
 const b=document.createElement('button');b.id='detail781Button';b.type='button';b.className='shbtn';b.textContent='Track detail';b.setAttribute('aria-pressed','false');
 const detailTitle='Enhanced pit-straight loop · uses the existing car and controls';b.title=detailTitle;
 const viewControl=document.getElementById('showView'),detailViews=new Set(['hero','onboard','chase','heli']);
 let previous=null;
 const resetButton=()=>{G.preview781.enabled=false;b.setAttribute('aria-pressed','false');b.textContent='Track detail';b.title=detailTitle;};
 const restoreViewControl=before=>{
  const saved=before&&before.viewControl;if(!saved||!viewControl)return;
  for(const item of saved.options){item.option.hidden=item.hidden;item.option.disabled=item.disabled;}
  viewControl.value=saved.value;
  if(saved.label==null)viewControl.removeAttribute('aria-label');else viewControl.setAttribute('aria-label',saved.label);
 };
 if(viewControl)viewControl.addEventListener('change',event=>{
  if(!previous||!G.preview781.enabled||!G.S||!G.S.previewLoop781)return;
  // The ordinary View handler persists its choice. A tour camera is temporary,
  // so handle it first and keep the saved Showcase camera preference intact.
  event.stopImmediatePropagation();
  const camera=detailViews.has(viewControl.value)?viewControl.value:'chase';viewControl.value=camera;
  G.preview781.camera=camera;G.setView(camera);G.S.previewCam781=null;G.camStep(0);G.S.needsRender=true;
  if(G.S.paused)G.render();
 },true);
 G.restorePreview781=function(closed){
  if(!previous)return;const before=previous;previous=null;
  restoreViewControl(before);
  if(G.S){G.enablePreview781(false);G.S.previewLoop781=false;G.simReset();G.S.calmDrive=before.calm;G.S.paused=before.paused;G.setView(before.view);}
  if(!closed&&typeof showSetBack==='function')showSetBack(before.back);
  try{if(before.stored==null)localStorage.removeItem('gc500.showback');else localStorage.setItem('gc500.showback',before.stored);}catch(e){}
  resetButton();if(!closed&&G.S&&G.S.paused)G.render();
 };
 b.onclick=()=>{
  if(previous){G.restorePreview781(false);return;}
  let stored=null;try{stored=localStorage.getItem('gc500.showback');}catch(e){}
  previous={stored,back:typeof showBackPref==='function'?showBackPref():'circuit3d',calm:!!(G.S&&G.S.calmDrive),
   paused:typeof SHOW!=='undefined'?!SHOW.playing:!!(G.S&&G.S.paused),view:typeof showViewGet==='function'?showViewGet():'hero'};
  if(typeof showSetBack==='function')showSetBack('circuit3d_day');
  if(!G.S){G.restorePreview781(false);b.textContent='3D unavailable on this device';return;}
  if(viewControl){
   previous.viewControl={value:viewControl.value,label:viewControl.getAttribute('aria-label'),options:Array.from(viewControl.options,option=>({option,hidden:option.hidden,disabled:option.disabled}))};
   for(const option of viewControl.options)if(!detailViews.has(option.value)){option.hidden=true;option.disabled=true;}
   viewControl.value='chase';viewControl.setAttribute('aria-label','Camera — track detail');
  }
  G.enablePreview781(true);b.setAttribute('aria-pressed','true');b.textContent='Leave track detail';
  G.S.previewLoop781=true;G.S.calmDrive=true;G.preview781.camera='chase';G.restartPreview781();
  if(G.S.paused)G.render();
 };
 controls.parentNode.appendChild(b);
 const dialog=document.getElementById('showcase');
 if(dialog)new MutationObserver(()=>{if(dialog.hidden&&previous)G.restorePreview781(true);}).observe(dialog,{attributes:true,attributeFilter:['hidden']});
 const backdrop=document.getElementById('showBackdrop');
 if(backdrop)backdrop.addEventListener('change',()=>{
  // A deliberate backdrop selection replaces the preview and remains the user's new preference.
  if(!previous)return;const before=previous;previous=null;restoreViewControl(before);
  if(G.S){G.enablePreview781(false);G.S.previewLoop781=false;G.S.calmDrive=before.calm;G.simReset();G.S.paused=typeof SHOW!=='undefined'?!SHOW.playing:false;G.setView(before.view);}
  resetButton();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();
