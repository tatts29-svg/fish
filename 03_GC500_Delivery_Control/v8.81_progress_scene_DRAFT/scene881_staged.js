/* Author: Andrew Fisher. Presentation-only scene; pending Today ownership handover. */
const ProgressScene881=(()=>{
 let paused=false,printing=false,frame=0,observer=null,weatherTimer=0;
 let hero=null,lastModel=null,showcaseOpen=false,seen=new Map();
 const fmt=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-AU',{maximumFractionDigits:2}):'—';
 const range=r=>r&&Number.isFinite(r.min)&&Number.isFinite(r.max)?fmt(r.min)+(Math.abs(r.max-r.min)>.005?'–'+fmt(r.max):''):'—';
 const off=()=>printing||paused||document.hidden||typeof motionOff==='function'&&motionOff()||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const modal=()=>document.getElementById('drawer')?.classList.contains('on')||!!document.querySelector('dialog[open]');
 function weather(day){
  const f=wxfDay(day),allowed=new Set([1000,1003,1006,1009,1030,1063,1066,1069,1072,1087,1114,1117,1135,1147,1150,1153,1168,1171,1180,1183,1186,1189,1192,1195,1198,1201,1204,1207,1210,1213,1216,1219,1222,1225,1237,1240,1243,1246,1249,1252,1255,1258,1261,1264,1273,1276,1279,1282]);
  const valid=f&&f.date===day&&Number.isInteger(f.code)&&(f.src==='om'?Object.prototype.hasOwnProperty.call(WX_WMO,f.code):f.src==='wapi'&&allowed.has(f.code));
  if(!valid)return {kind:'unknown',text:'Weather unavailable for this day',detail:''};
  return {kind:wxKind(f.code,f.src),text:f.text||({sun:'Sunny',part:'Partly cloudy',cloud:'Cloudy',fog:'Fog',rain:'Rain',pour:'Heavy rain',storm:'Thunderstorms',sleet:'Wintry precipitation'}[wxKind(f.code,f.src)]),detail:[typeof f.min_c==='number'&&typeof f.max_c==='number'?fmt(f.min_c)+'–'+fmt(f.max_c)+' °C':'',typeof f.rain_pc==='number'?fmt(f.rain_pc)+'% rain chance':'',typeof f.wind_kph==='number'?'Wind '+fmt(f.wind_kph)+' km/h':'',wxSrcTag(f)].filter(Boolean).join(' · ')};
 }
 function weatherArt(kind){
  const rain=['rain','pour','storm'].includes(kind),count=kind==='rain'?52:84;
  return '<div class="scene881-sun"></div><div class="scene881-clouds"></div><div class="scene881-mist"></div>'+(rain?'<div class="scene881-rain">'+Array.from({length:count},(_,i)=>'<i style="--x:'+((i*37)%101)+'%;--delay:'+(-i*.173)+'s;--speed:'+(kind==='rain'?1.5+(i%3)*.35:.85+(i%3)*.23)+'s;--alpha:'+(0.13+(i%3)*.055)+'"></i>').join('')+'</div>':'')+(kind==='storm'?'<svg class="scene881-bolt" viewBox="0 0 200 400" aria-hidden="true"><path d="M130 4L44 173L98 158L60 276L150 118L103 132L161 4" fill="#e9f8ff"/></svg>':'')+(kind==='sleet'?'<div class="scene881-snow">'+Array.from({length:40},(_,i)=>'<i style="--x:'+((i*29)%101)+'%;--delay:'+(-i*.37)+'s"></i>').join('')+'</div>':'');
 }
 function lamps(model){return '<div class="scene881-lights race-lights" role="img" aria-label="'+esc(model.ready?range(model.pct)+' percent progress index. '+(model.allGreen?'All five lights green.':'Reached milestones red.'):'Overall progress index unavailable')+'">'+Array.from({length:5},(_,i)=>'<span class="tl841-unit'+(i<model.reached?' reached':'')+'">'+timeline841Lamp(i<model.reached,i,model.allGreen)+'<small>'+(i+1)*20+'%</small></span>').join('')+'</div>';}
 function markup(model){
  return '<section id="progress-hero881" class="scene881-hero" data-weather="unknown" aria-labelledby="progress-title881"><div class="scene881-atlas" aria-hidden="true"></div><div class="scene881-weather" aria-hidden="true"></div><div class="scene881-content"><div class="scene881-topline"><span>'+esc(fmtDate(model.day))+'</span><button type="button" class="scene881-pause" data-scene881-pause aria-pressed="false">Pause animation</button></div><h2 id="progress-title881">WHERE WE ARE</h2><p class="scene881-subtitle">Overall work progress</p>'+lamps(model)+'<div class="scene881-percent"><strong data-scene881-percent>'+range(model.pct)+'</strong>'+(model.ready?'<small>%</small>':'')+'</div><p class="scene881-index">Seven-group progress index'+(model.provisional?' · provisional':'')+'</p><div class="scene881-group-strip">'+model.rows.map(r=>'<button type="button" data-tw840-jump="'+esc(r.id)+'"><span>'+esc(r.name)+'</span><b>'+range(r)+'<small>'+(r.min==null?'':'%')+'</small></b></button>').join('')+'</div><div class="scene881-weather-label"><strong data-scene881-weather></strong><span data-scene881-weather-detail></span></div><details class="scene881-basis"><summary>View progress basis</summary><p>'+esc(model.basis)+'</p><p>Equipment scene is a rendered illustration. Progress and weather come from the selected day’s records.</p></details></div></section>';
 }
 function active(node){
  if(off()||modal()||!node?.isConnected||state.tab!=='today')return false;
  const r=node.getBoundingClientRect(),main=node.closest('main')?.getBoundingClientRect();
  return r.width>0&&r.height>0&&r.bottom>Math.max(0,main?.top||0)&&r.top<Math.min(innerHeight,main?.bottom||innerHeight);
 }
 function sync(){
  document.querySelectorAll('#progress-hero881,.tw840-card.scene881-card').forEach(n=>n.classList.toggle('scene881-playing',active(n)&&(!n.classList.contains('scene881-card')||n.querySelector('.tw848-group')?.open)));
  const b=hero?.querySelector('[data-scene881-pause]');if(b){b.disabled=printing||typeof motionOff==='function'&&motionOff()||matchMedia('(prefers-reduced-motion: reduce)').matches;b.textContent=b.disabled?'Animation off':paused?'Play animation':'Pause animation';b.setAttribute('aria-pressed',String(paused));}
  if(off()&&frame){cancelAnimationFrame(frame);frame=0;}
 }
 function animateNumbers(root,model){
  if(off())return;
  const nodes=[...root.querySelectorAll('.tw840-reading > span:not(.tw842-bound),[data-scene881-percent]')];
  const items=nodes.map(n=>{const text=n.textContent.trim(),m=text.match(/^(\d+(?:\.\d+)?)$/),k=n.closest('[data-tw840-area]')?.dataset.tw840Area||'overall';if(!m||seen.get(k)===text)return null;seen.set(k,text);return {n,text,value:Number(m[1]),start:performance.now()};}).filter(Boolean);
  if(!items.length)return;
  if(frame)cancelAnimationFrame(frame);
  const tick=now=>{let more=false;items.forEach(x=>{if(!x.n.isConnected)return;const t=off()?1:Math.min(1,(now-x.start)/1250);x.n.textContent=t===1?x.text:fmt(x.value*(1-Math.pow(1-t,3)));more ||=t<1;});frame=more?requestAnimationFrame(tick):0;};frame=requestAnimationFrame(tick);
 }
 function refreshWeather(){
  clearTimeout(weatherTimer);if(!hero?.isConnected||state.tab!=='today')return;
  const w=weather(lastModel.day);if(hero.dataset.weather!==w.kind){hero.dataset.weather=w.kind;hero.querySelector('.scene881-weather').innerHTML=weatherArt(w.kind);}
  hero.querySelector('[data-scene881-weather]').textContent=w.text;hero.querySelector('[data-scene881-weather-detail]').textContent=w.detail;
  sync();if(!document.hidden&&!printing)weatherTimer=setTimeout(refreshWeather,30000);
 }
 function mount(){
  const p=document.getElementById('pane-today');if(!p||state.tab!=='today')return;
  cancelAnimationFrame(frame);frame=0;observer?.disconnect();clearTimeout(weatherTimer);
  lastModel=progress881Model(todayWorkDay841());
  const band=p.querySelector(':scope > .dsnband');
  if(band){let parking=p.querySelector(':scope > .scene881-showcase');if(!parking){parking=document.createElement('details');parking.className='scene881-showcase';parking.innerHTML='<summary>Event showcase</summary>';parking.open=showcaseOpen;p.append(parking);parking.addEventListener('toggle',()=>{showcaseOpen=parking.open;if(!parking.open)parking.querySelectorAll('video').forEach(v=>v.pause());});}parking.append(band);band.querySelectorAll('video').forEach(v=>v.pause());}
  p.querySelector('#progress-hero881')?.remove();const head=p.querySelector(':scope > .acts793');const el=document.createElement('div');el.innerHTML=markup(lastModel);hero=el.firstElementChild;if(head)head.after(hero);else p.prepend(hero);
  p.querySelectorAll('.tw840-card').forEach(n=>{n.classList.add('scene881-card');const label=n.querySelector('.tw848-toggle-title');if(label){label.classList.add('scene881-collapsed-name');}const header=n.querySelector('.tw840-top');if(header){header.querySelector('.tw840-name')?.remove();const toggle=n.querySelector('.tw848-group-toggle');if(toggle&&header.firstElementChild)toggle.append(header.firstElementChild);header.remove();}
   const summary=n.querySelector('.tw846-summary');if(summary){const backdrop=document.createElement('div');backdrop.className='scene881-atlas';backdrop.setAttribute('aria-hidden','true');summary.prepend(backdrop);}
  });
  observer=new IntersectionObserver(sync,{threshold:[0,.01]});observer.observe(hero);p.querySelectorAll('.scene881-card').forEach(n=>observer.observe(n));
  refreshWeather();animateNumbers(p,lastModel);sync();
 }
 const scroll=()=>sync();document.addEventListener('scroll',scroll,true);document.addEventListener('gc500motionchange',sync);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(weatherTimer);else refreshWeather();sync();});
 document.addEventListener('click',e=>{if(e.target.closest('[data-scene881-pause]')){paused=!paused;sync();}});
 document.addEventListener('toggle',e=>{if(e.target.matches?.('.tw848-group'))sync();},true);
 window.addEventListener('beforeprint',()=>{printing=true;sync();clearTimeout(weatherTimer);});window.addEventListener('afterprint',()=>{printing=false;refreshWeather();});window.addEventListener('pagehide',()=>{observer?.disconnect();clearTimeout(weatherTimer);cancelAnimationFrame(frame);});window.addEventListener('pageshow',()=>{if(hero?.isConnected)mount();});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',sync);
 return {mount,weather,refreshWeather,report:()=>({version:'v8.81',ready:lastModel?.ready,provisional:lastModel?.provisional,pct:lastModel?.pct,weather:hero?.dataset.weather,playing:hero?.classList.contains('scene881-playing'),paused,printing,frame,weatherTimer:!!weatherTimer,groups:document.querySelectorAll('.scene881-card').length}),sync};
})();
