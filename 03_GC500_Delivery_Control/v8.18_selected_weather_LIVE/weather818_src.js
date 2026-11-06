/* Author: Andrew Fisher. v8.18 — approved weather artwork; only the native selected day can animate. */
const WX818 = (() => {
 const root=document.documentElement, mounted=new Set(), templates=new Map(), bindings=new WeakMap();
 const WAPI_CODES=new Set([1000,1003,1006,1009,1030,1063,1066,1069,1072,1087,1114,1117,1135,1147,1150,1153,1168,1171,1180,1183,1186,1189,1192,1195,1198,1201,1204,1207,1210,1213,1216,1219,1222,1225,1237,1240,1243,1246,1249,1252,1255,1258,1261,1264,1273,1276,1279,1282]);
 const TIMER_MAX_MS=60000;
 let serial=0,timer=null,timerAt=0,suspended=false,printing=false;
 const pane=()=>document.getElementById('pane-timeline');
 const inTimeline=()=>{const p=pane();return !!(p&&state.tab==='timeline'&&p.classList.contains('on')&&!p.hidden);};
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const entry of entries){const day=entry.target,rec=bindings.get(day);if(!rec||!day.isConnected||!rec.plate.isConnected)continue;
   const visible=String(!suspended&&entry.isIntersecting&&entry.intersectionRatio>0);day.dataset.motionVisible=visible;rec.plate.dataset.motionVisible=visible;}
 },{threshold:[0,.01]}):null;

 /* WX818_ART: approved v4 scene generator, with a stable template identifier. */
  function groupPrecipitation(body,kind){
  if(!['rain','pour','storm','sleet'].includes(kind))return body;
  const snow=kind==='sleet',heavy=!snow&&kind!=='rain',svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.innerHTML=body;
  const groups=new Map(),depthCount=[0,0,0],speeds=snow?[8,6,4.8]:heavy?[1.7,1.12,.83]:[3,2.1,1.5];
  svg.querySelectorAll(snow?'.wm-snow':'.wm-rain').forEach(node=>{
   const speed=parseFloat(node.style.getPropertyValue('--speed'))||speeds[1],alpha=node.style.getPropertyValue('--alpha')||'.7';
   let depth=speeds.reduce((best,n,i)=>Math.abs(n-speed)<Math.abs(speeds[best]-speed)?i:best,0);
   if(snow&&(node.localName==='g'||Number(node.getAttribute('r'))>=2.4))depth=2;
   const phase=depthCount[depth]++%3,key=depth+'-'+phase;let group=groups.get(key);
   if(!group){group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class',snow?'wm-snow':heavy?'wm-rain heavy':'wm-rain');group.setAttribute('style',`--speed:${speeds[depth]}s;--phase:${-speeds[depth]*(.15+phase/3)}s;--alpha:1`);groups.set(key,group);}
   node.removeAttribute('class');node.removeAttribute('style');node.setAttribute('opacity',alpha);group.appendChild(node);
  });
  for(const group of groups.values())svg.appendChild(group);
  return svg.innerHTML;
 }
 function scene(kind){
  const id='WX818_TEMPLATE',dark=kind==='storm'||kind==='pour';
  const palette={sun:['#136ba4','#77b2cb','#edc789'],part:['#337b9f','#9fc3d4','#dde2d0'],cloud:['#446e8b','#83a7be','#cad9e1'],rain:['#366587','#789cae','#b9ced7'],pour:['#153e5c','#426f8a','#91afb9'],storm:['#14293e','#385871','#91a9b9'],fog:['#648997','#a1bec6','#dce3dd'],sleet:['#3c7295','#88b1c8','#d4e3e8']}[kind];
  const shape='M5 43C-2 31 8 19 22 20C23 9 35 1 46 5C59-6 79 2 83 16C98 10 112 23 108 36C122 48 106 57 90 53C74 61 59 53 46 55C28 60 10 55 5 43Z';
  const defs=`<defs><linearGradient id="${id}sky" x1=".9" y1="0" x2=".2" y2="1"><stop stop-color="${palette[0]}"/><stop offset=".6" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient><linearGradient id="${id}body" x1=".25" y1="0" x2=".6" y2="1"><stop stop-color="${dark?'#c7d9e6':'#f8fcff'}"/><stop offset=".45" stop-color="${dark?'#7391ab':'#d9e7ef'}"/><stop offset="1" stop-color="${dark?'#294a64':'#799bae'}"/></linearGradient><radialGradient id="${id}volume" cx=".38" cy=".18" r=".8"><stop stop-color="${dark?'#e0e8ed':'#ffffff'}" stop-opacity=".93"/><stop offset=".5" stop-color="${dark?'#c1d2df':'#eef5f8'}" stop-opacity=".43"/><stop offset="1" stop-color="#5d788f" stop-opacity="0"/></radialGradient><radialGradient id="${id}belly" cx=".5" cy="1" rx=".6" r=".7"><stop stop-color="#18364d" stop-opacity=".48"/><stop offset="1" stop-color="#35596e" stop-opacity="0"/></radialGradient><radialGradient id="${id}glow"><stop stop-color="#fff4cf" stop-opacity=".9"/><stop offset=".25" stop-color="#ffdf91" stop-opacity=".55"/><stop offset=".65" stop-color="#ffe0a0" stop-opacity=".12"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient><radialGradient id="${id}disc"><stop stop-color="#fffce7"/><stop offset=".8" stop-color="#fff3be"/><stop offset="1" stop-color="#f9d589" stop-opacity=".75"/></radialGradient><linearGradient id="${id}shaft" x2="0" y2="1"><stop stop-color="#fff5d4" stop-opacity=".8"/><stop offset="1" stop-color="#fff5d4" stop-opacity="0"/></linearGradient><radialGradient id="${id}mist"><stop stop-color="#edf3f2" stop-opacity=".84"/><stop offset=".58" stop-color="#e4edec" stop-opacity=".5"/><stop offset="1" stop-color="#e4edec" stop-opacity="0"/></radialGradient><clipPath id="${id}clip"><path d="${shape}"/></clipPath></defs>`;
  const cloud=(cls,x,y,scale,opacity=1)=>`<g class="${cls}" opacity="${opacity}"><g transform="translate(${x} ${y}) scale(${scale})"><path d="${shape}" fill="url(#${id}body)"/><g clip-path="url(#${id}clip)"><ellipse cx="29" cy="28" rx="27" ry="24" fill="url(#${id}volume)"/><ellipse cx="65" cy="23" rx="32" ry="28" fill="url(#${id}volume)"/><ellipse cx="93" cy="37" rx="30" ry="24" fill="url(#${id}volume)"/><ellipse cx="60" cy="55" rx="62" ry="23" fill="url(#${id}belly)"/></g><path d="M9 29Q14 20 23 23Q25 11 37 9M52 8Q68 1 77 15" fill="none" stroke="#f7fbfd" stroke-width=".8" stroke-linecap="round" opacity=".32"/></g></g>`;
  let out=`<rect width="192" height="250" fill="url(#${id}sky)"/><ellipse cx="153" cy="219" rx="118" ry="45" fill="url(#${id}mist)" opacity=".22"/>`;
  if(kind==='sun'||kind==='part'){
   out+=`<g class="wm-radiance"><circle cx="146" cy="42" r="76" fill="url(#${id}glow)"/><circle cx="146" cy="42" r="16" fill="url(#${id}disc)"/></g><g class="wm-shaft"><path d="M141 42L97 244H135L150 42Z" fill="url(#${id}shaft)"/><path d="M143 42L164 229H190L151 42Z" fill="url(#${id}shaft)"/></g>`;
  }
  if(kind==='sun')out+=cloud('wm-cloud-back',113,122,.75,.24);
  if(kind==='part')out+=cloud('wm-cloud-back',62,9,.9,.42)+cloud('wm-cloud-front',105,59,1.03,.97);
  if(['cloud','rain','pour','storm','sleet'].includes(kind)){
   out+=cloud('wm-cloud-back',62,-15,1.5,dark?.83:.56);
   out+=cloud('wm-cloud-front',86,35,1.25,1);
   if(dark)out+=cloud('wm-cloud-near',141,82,1.1,.78);
  }
  if(['rain','pour','storm'].includes(kind)){
   const count=kind==='rain'?22:42;
   for(let i=0;i<count;i++){
    const depth=i%3,x=(i*37+21)%210,y=73+(i*23)%155,len=depth===0?4:depth===1?8:13,heavy=kind!=='rain',alpha=[.22,.42,.73][depth],speed=heavy?[1.7,1.12,.83][depth]:[3,2.1,1.5][depth];
    out+=`<path class="wm-rain ${heavy?'heavy':''}" style="--phase:${-i*.183}s;--speed:${speed}s;--alpha:${alpha}" d="M${x} ${y}l${heavy?-len*.48:-len*.13} ${len}" fill="none" stroke="${depth===2?'#d8e9f1':'#648ea9'}" stroke-width="${[.45,.65,.95][depth]}" stroke-linecap="round"/>`;
   }
  }
  if(kind==='storm')out+='<g class="wm-bolt"><path d="M157 85l-13 22 9-4-11 29 23-30-10 4 10-21Z" fill="#d3dff0" opacity=".13" transform="translate(-4 -4) scale(1.035)"/><path d="M157 85l-13 22 9-4-11 29 23-30-10 4 10-21Z" fill="#ecf4ff"/><path d="M151 110l-12 5-2 9" fill="none" stroke="#dceafa" stroke-width="1.2"/></g>';
  if(['rain','pour','storm'].includes(kind)){
   for(let i=0;i<(kind==='rain'?7:13);i++){const x=105+(i*23)%90,y=93+(i*27)%118,len=kind==='rain'?12:19;out+=`<path class="wm-rain ${kind==='rain'?'':'heavy'}" style="--phase:${-i*.317}s;--speed:${kind==='rain'?1.65:.94}s;--alpha:.86" d="M${x} ${y}l${kind==='rain'?-2:-9} ${len}" fill="none" stroke="${kind==='rain'?'#315e7b':'#c8e5f4'}" stroke-width="1.05" stroke-linecap="round"/>`;}
  }
  if(kind==='fog'){
   out+=cloud('wm-cloud-back',102,26,1.06,.29);out+=`<path class="wm-fog" style="--phase:-6s" d="M-25 121C22 92 42 110 79 97C117 84 145 111 217 94V152C161 160 115 135 76 151C28 166-9 146-25 160Z" fill="url(#${id}mist)" opacity=".85"/>`;
   for(let i=0;i<5;i++)out+=`<ellipse class="wm-fog" style="--phase:${-i*2.5}s" cx="${90+i*22}" cy="${65+i*28}" rx="${104-i*4}" ry="${14+i*2}" fill="url(#${id}mist)"/>`;
  }
  if(kind==='sleet')for(let i=0;i<31;i++){
   const x=(i*31+27)%210,y=68+(i*29)%165,depth=i%3,r=[.7,1.35,2.4][depth],a=[.35,.6,.85][depth];
   out+=`<circle class="wm-snow" style="--phase:${-i*.37}s;--speed:${[8,6,4.8][depth]}s;--alpha:${a}" cx="${x}" cy="${y}" r="${r}" fill="#f4fbfe" stroke="#86a7ba" stroke-width=".25"/>`;
  }
  if(kind==='sleet')out+=[[119,111],[154,140],[179,96],[172,192]].map(([x,y],i)=>`<g class="wm-snow" style="--phase:${-i*.8}s;--speed:6s;--alpha:.9"><path d="M${x-2.6} ${y}h5.2M${x} ${y-2.6}v5.2M${x-1.9} ${y-1.9}l3.8 3.8M${x-1.9} ${y+1.9}l3.8-3.8" stroke="#56839e" stroke-width="1" stroke-linecap="round"/></g>`).join('');
  if(kind==='sleet')out+=[[118,130],[130,157],[146,181]].map(([x,y],i)=>`<g class="wm-snow" style="--phase:${-i*1.7}s;--speed:6.2s;--alpha:.95"><circle cx="${x}" cy="${y}" r="3.1" fill="#f8fdff" stroke="#547e98" stroke-width=".6"/><path d="M${x-3.8} ${y}h7.6M${x} ${y-3.8}v7.6" stroke="#eaf7ff" stroke-width=".7" stroke-linecap="round"/></g>`).join('');
  return `<svg viewBox="0 0 192 250" preserveAspectRatio="none" focusable="false">${defs}${groupPrecipitation(out,kind)}</svg>`;
 }



 function kindFor(f){
  if(!f||typeof f.code!=='number'||!Number.isInteger(f.code))return null;
  if(f.src==='om')return Object.prototype.hasOwnProperty.call(WX_WMO,f.code)?WX_WMO[f.code][0]:null;
  if(f.src==='wapi'&&WAPI_CODES.has(f.code))return wxKind(f.code,'wapi');
  return null;
 }
 function rowFor(day){
  const iso=day.dataset.day,slot=day.querySelector('.dwx[data-wx]'),plate=slot&&slot.firstElementChild;
  if(!iso||!slot||slot.dataset.wx!==iso||!plate||!plate.classList.contains('f'))return null;
  const f=wxfDay(iso),kind=kindFor(f);
  if(!kind||String(f.date||iso).slice(0,10)!==iso||plate.dataset.s!==wxSig(iso))return null;
  return {date:iso,kind,source:f.src,code:f.code,plate};
 }
 function art(kind,crop){
  if(!templates.has(kind))templates.set(kind,scene(kind));
  const id='wx818-'+(++serial),markup=templates.get(kind).replace(/WX818_TEMPLATE/g,id);
  return crop?markup.replace('viewBox="0 0 192 250"','viewBox="104 90 68 112"'):markup;
 }
 function clearDay(day){
  observer?.unobserve(day);mounted.delete(day);bindings.delete(day);
  day.querySelectorAll('.wm-card-scene,.wx-motion').forEach(el=>el.remove());
  day.querySelectorAll('[data-weather-motion]').forEach(el=>{delete el.dataset.weatherMotion;delete el.dataset.motionVisible;delete el.dataset.weatherActive;});
  delete day.dataset.weatherCard;delete day.dataset.motionVisible;delete day.dataset.weatherActive;
 }
 function selectedDay(){return pane()?.querySelector('.daystrip > .day.on[aria-pressed="true"][data-day]')||null;}
 function sync(){
  const active=inTimeline()?selectedDay():null;
  for(const day of [...mounted]){
   if(!day.isConnected){clearDay(day);continue;}
   const rec=bindings.get(day),on=day===active&&!day.disabled&&!!rec;
   day.dataset.weatherActive=String(on);if(rec?.plate.isConnected)rec.plate.dataset.weatherActive=String(on);
  }
  const reduced=motionOff();root.dataset.weatherReduced=String(reduced);
  root.dataset.weatherPlaying=String(inTimeline()&&!document.hidden&&!suspended&&!printing&&!reduced&&!!active&&mounted.has(active));
 }
 function cancelTimer(){if(timer!==null)clearTimeout(timer);timer=null;timerAt=0;}
 function schedule(){
  cancelTimer();if(!inTimeline()||document.hidden||suspended||printing)return;
  const now=Date.now(),midnight=Date.parse(wxAddDays(todayIso(),1)+'T00:00:00+10:00')+1100;
  let due=Math.min(now+TIMER_MAX_MS,midnight>now?midnight:now+TIMER_MAX_MS);
  for(const source of [WXF,WXO]){const end=Date.parse(source.at)+WXF_STALE_MIN*60000+1;if(Number.isFinite(end)&&end>now)due=Math.min(due,end);}
  timerAt=due;timer=setTimeout(()=>{timer=null;timerAt=0;refresh();},Math.max(1,due-now));
 }
 function reconcile(){
  for(const day of [...mounted])if(!day.isConnected)clearDay(day);
  const p=pane();
  if(p&&inTimeline())p.querySelectorAll('.daystrip > .day[data-day]').forEach(day=>{
   const row=rowFor(day),rec=bindings.get(day);
   if(!row){if(rec||day.dataset.weatherCard)clearDay(day);return;}
   if(rec&&rec.kind===row.kind&&rec.plate===row.plate&&day.querySelectorAll('.wm-card-scene').length===1){rec.source=row.source;rec.code=row.code;return;}
   clearDay(day);day.dataset.weatherCard=row.kind;day.dataset.motionVisible='false';day.dataset.weatherActive='false';
   row.plate.dataset.weatherMotion=row.kind;row.plate.dataset.motionVisible='false';row.plate.dataset.weatherActive='false';
   day.querySelector('.dface').insertAdjacentHTML('afterbegin',`<span class="wm-card-scene" aria-hidden="true">${art(row.kind,false)}</span>`);
   row.plate.insertAdjacentHTML('afterbegin',`<span class="wx-motion" aria-hidden="true">${art(row.kind,true)}</span>`);
   mounted.add(day);bindings.set(day,row);observer?.observe(day);
  });
  sync();schedule();
 }
 function refresh(){
  if(inTimeline()&&!suspended&&!document.hidden&&!printing)wxfPaint();else reconcile();
 }
 function resetVisibility(){for(const day of mounted){day.dataset.motionVisible='false';const rec=bindings.get(day);if(rec?.plate.isConnected)rec.plate.dataset.motionVisible='false';}}
 function stop(){suspended=true;cancelTimer();resetVisibility();observer?.disconnect();sync();}
 function resume(){suspended=false;resetVisibility();refresh();for(const day of mounted)observer?.observe(day);sync();}
 function report(){return {version:'v8.18',inTimeline:inTimeline(),selectedDate:selectedDay()?.dataset.day||null,playing:root.dataset.weatherPlaying==='true',reduced:motionOff(),suspended,printing,observerSupported:!!observer,timerAt,timerDelayMs:timerAt?Math.max(0,timerAt-Date.now()):null,timerMaxMs:TIMER_MAX_MS,templateKinds:[...templates.keys()],mounted:mounted.size,cards:[...mounted].map(day=>{const rec=bindings.get(day);return {date:day.dataset.day,kind:rec?.kind||null,source:rec?.source||null,code:rec?.code??null,selected:day.dataset.weatherActive==='true',visible:day.dataset.motionVisible==='true',connected:day.isConnected};})};}
 document.addEventListener('gc500motionchange',sync);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelTimer();resetVisibility();observer?.disconnect();sync();}else resume();});
 window.addEventListener('pagehide',stop);window.addEventListener('pageshow',resume);
 window.addEventListener('beforeprint',()=>{printing=true;cancelTimer();sync();});
 window.addEventListener('afterprint',()=>{printing=false;refresh();});
 return {reconcile,refresh,stop,report};
})();
