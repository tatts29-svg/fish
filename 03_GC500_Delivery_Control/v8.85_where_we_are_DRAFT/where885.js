/* Author: Andrew Fisher. v8.85 Where we are: the whole job above the group cards, in the same housing, with five large race lights.
 * Presentation only. It reads the same records as the group cards, and the programme panel moves in with its own controls.
 * Mounted inside the Today redraw, before scroll and focus are restored, so a record refresh never jumps the page. */
const Where885=(()=>{
 'use strict';
 const COUNT=1.6;
 const FLAG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22V3M5 4H19L16.5 8.5L19 13H5"/><path d="M9.7 4V13M14.3 4V13M5 8.5H17.5" stroke-opacity=".55"/></svg>';
 const BASIS='Whole job is the average of the seven group readings below, each counting equally (one seventh each): Buildings, Toilets, Fencing, Generators, Lighting, VMS boards and Equipment. The equipment groups use confirmed completion; Fencing uses recorded Build + Event programme metres. Metres and unit counts are never added together. When any group shows a minimum (≥), the whole job is a minimum too. One red light for each 20% reached; all five turn green only at a confirmed 100%. This is a progress reading, not a handover or financial sign-off.';
 let observer=null,frame=0,introTimer=0,paused=false,playedKey='',visible=false,uid=0;
 const number=n=>typeof n==='number'&&Number.isFinite(n);
 const fmt=n=>number(n)?n.toLocaleString('en-AU',{maximumFractionDigits:2}):'—';
 const atLeast=n=>Math.floor((n+1e-9)*100)/100;
 const still=()=>typeof motionOff==='function'?!!motionOff():matchMedia('(prefers-reduced-motion: reduce)').matches;
 const hero=()=>document.getElementById('where885');
 function reading(min,max){
  if(!number(min))return {text:'—',bound:false,value:null};
  const bound=number(max)&&max-min>.005,value=bound?atLeast(min):min;
  return {text:fmt(value),bound,value};
 }
 function inView(node){
  const r=node.getBoundingClientRect(),m=node.closest('main')?.getBoundingClientRect()||{top:0,bottom:innerHeight};
  return r.width>0&&r.height>0&&r.bottom>Math.max(0,m.top)&&r.top<Math.min(innerHeight,m.bottom);
 }
 /* Each lamp lights as the count passes its 20% step: the count eases out, so the step times follow the same curve. */
 function lampDelay(i,value){const share=Math.min(1,(i+1)*20/Math.max(value,1e-6));return COUNT*(1-Math.cbrt(1-share));}
 function lights(m,whole){
  const lit=m.ready?m.reached:0,green=!!m.allGreen,label=m.ready?(whole.bound?'At least ':'')+whole.text+'% whole-job progress. '+(green?'All five lights green: finished.':lit+' of 5 milestone lights reached.'):'Whole-job progress unavailable.';
  return '<div class="w885-lights race-lights" role="img" aria-label="'+esc(label)+'">'+Array.from({length:5},(_,i)=>{
   const on=i<lit;let lamp=timeline841Lamp(on,i,green);
   if(on){
    const id='w885-sweep-'+(++uid),dots=(lamp.match(/<g class="tl841-dots">([\s\S]*?)<\/g>/)||['',''])[1];
    lamp=lamp.replace('style="','style="--race-phase:'+i*.25+'s;').replace('</defs>','<clipPath id="'+id+'" clipPathUnits="userSpaceOnUse"><rect class="race-sweep-window" x="-14" y="7" width="11" height="42"/></clipPath></defs>').replace('</svg>','<g class="race-sweep-dots" clip-path="url(#'+id+')">'+dots+'</g></svg>');
   }
   return '<span class="tl841-unit'+(on?' reached':'')+'" style="--w885-on:'+(on?lampDelay(i,whole.value||0).toFixed(3):'0')+'s">'+lamp+'<small>'+(i+1)*20+'%</small></span>';
  }).join('')+'</div>';
 }
 function groups(m){
  return '<div class="w885-groups">'+m.rows.map((r,i)=>{
   const x=reading(r.min,r.max),w=number(r.min)?Math.max(0,Math.min(100,r.min)):0,done=x.value===100&&!x.bound;
   return '<button type="button" class="w885-group" id="w885-jump-'+esc(r.id)+'" data-w885-jump="'+esc(r.id)+'" data-complete="'+done+'" style="--w885-g:'+i+'" aria-label="'+esc(r.name+': '+(x.value==null?'reading unavailable':(x.bound?'at least ':'')+x.text+'% complete')+'. Go to the '+r.name+' card.')+'"><span class="w885-gname">'+esc(r.name)+'</span><b>'+(x.bound?'<i>≥</i>':'')+x.text+(x.value==null?'':'<small>%</small>')+'</b><span class="w885-bar" aria-hidden="true"><span style="--w:'+w+'%"></span></span></button>';
  }).join('')+'</div>';
 }
 function markup(m,phase){
  const whole=m.ready?reading(m.pct.min,m.pct.max):reading(null),today=typeof todayIso==='function'?todayIso():m.day;
  const soft=m.ready?m.rows.filter(r=>r.provisional).map(r=>r.name):[];
  const caption=!m.ready?'Waiting for every group’s reading':(whole.bound?'At least · ':'')+'seven groups counted equally';
  const notes=[m.day!==today?'As of '+fmtDate(m.day):'',soft.length?'Provisional: '+soft.join(', '):''].filter(Boolean);
  return '<div class="w885-head"><div class="w885-name">'+FLAG+'<h2 id="w885-title">Where we are</h2></div><div class="w885-meta">'+(phase?'<span class="w885-phase" title="'+esc(phase.title)+'"><i aria-hidden="true"></i>'+esc(phase.text)+'</span>':'')+'<span class="w885-day">'+esc(fmtDate(m.day))+'</span></div><button type="button" class="w885-motion" id="w885-motion" data-w885-motion aria-pressed="false"><span class="w885-motion-icon" aria-hidden="true"></span><span class="w885-motion-text">Pause</span></button></div>'
   +'<div class="w885-body"><div class="w885-gauge">'+lights(m,whole)+'<h3 class="w885-title">Whole job</h3><p class="w885-reading"><span class="w885-sr">'+esc(m.ready?(whole.bound?'At least ':'')+whole.text+' percent':'Unavailable')+'</span><span aria-hidden="true">'+(whole.bound?'<span class="w885-bound">≥</span>':'')+'<span data-w885-pct data-text="'+esc(whole.text)+'" data-value="'+(number(whole.value)?whole.value:'')+'">'+whole.text+'</span>'+(m.ready?'<small>%</small>':'')+'</span></p><p class="w885-caption">'+esc(caption)+'</p>'+notes.map(n=>'<p class="w885-note">'+esc(n)+'</p>').join('')+'</div><div class="w885-programme"></div></div>'
   +groups(m)+'<details class="w885-basis"><summary>How the whole-job figure is worked out</summary><p>'+esc(BASIS)+'</p></details>';
 }
 function settle(el){
  cancelAnimationFrame(frame);frame=0;clearTimeout(introTimer);introTimer=0;
  const t=el?.querySelector('[data-w885-pct]');if(t)t.textContent=t.dataset.text;
  el?.classList.remove('w885-intro');
 }
 function play(el){
  if(!el?.isConnected)return;
  playedKey=el.dataset.key;
  if(still()||paused){settle(el);sync();return;}
  const t=el.querySelector('[data-w885-pct]'),final=Number(t?.dataset.value);
  el.classList.remove('w885-intro');void el.offsetWidth;el.classList.add('w885-intro');
  cancelAnimationFrame(frame);frame=0;
  if(t&&t.dataset.value!==''&&number(final)){
   const places=(t.dataset.text.split('.')[1]||'').length,fixed=n=>n.toLocaleString('en-AU',{minimumFractionDigits:places,maximumFractionDigits:places});
   const start=performance.now();t.textContent=fixed(0);
   const tick=now=>{
    if(!t.isConnected){frame=0;return;}
    const k=Math.min(1,(now-start)/(COUNT*1000)),stop=k>=1||still()||paused;
    t.textContent=stop?t.dataset.text:fixed(final*(1-Math.pow(1-k,3)));frame=stop?0:requestAnimationFrame(tick);
   };
   frame=requestAnimationFrame(tick);
  }
  clearTimeout(introTimer);introTimer=setTimeout(()=>{introTimer=0;el.classList.remove('w885-intro');sync();},(COUNT+1)*1000);
  sync();
 }
 function sync(){
  const el=hero();if(!el)return;
  const motion=!still(),run=motion&&!paused&&visible&&!document.hidden&&state.tab==='today'&&!el.classList.contains('w885-intro');
  el.classList.toggle('w885-running',run);
  const b=el.querySelector('[data-w885-motion]');
  if(b){b.disabled=!motion;b.setAttribute('aria-pressed',String(paused&&motion));b.dataset.state=!motion?'off':paused?'paused':'playing';b.querySelector('.w885-motion-text').textContent=!motion?'Motion off':paused?'Play':'Pause';b.setAttribute('aria-label',!motion?'Animation is off for this page':paused?'Play the Where we are animation':'Pause the Where we are animation');}
 }
 function seen(entries){
  for(const e of entries)visible=e.isIntersecting;
  const el=hero();if(visible&&el&&el.dataset.key!==playedKey&&!still()&&!paused)play(el);
  sync();
 }
 function stop(){observer?.disconnect();observer=null;cancelAnimationFrame(frame);frame=0;clearTimeout(introTimer);introTimer=0;}
 function mount(){
  stop();
  const pane=document.getElementById('pane-today'),board=document.getElementById('gc500-work-board840');
  if(!pane||!board||typeof progress881Model!=='function')return;
  hero()?.remove();
  const day=todayWorkDay841(),m=progress881Model(day),prog=pane.querySelector(':scope > .today-work-programme840');
  const chip=prog?.querySelector('.pphase'),phase=chip?{text:chip.textContent.trim(),title:chip.getAttribute('title')||''}:null;
  const el=document.createElement('section');
  el.id='where885';el.className='w885';el.setAttribute('aria-labelledby','w885-title');
  el.dataset.ready=String(!!m.ready);el.dataset.complete=String(!!m.allGreen);
  el.dataset.key=day+'|'+(m.ready?m.pct.min+'|'+m.pct.max+'|'+m.reached:'unavailable');
  el.innerHTML=markup(m,phase);
  board.before(el);
  if(prog)el.querySelector('.w885-programme').append(prog);else el.querySelector('.w885-programme').remove();
  // The page enhances the programme panel after each redraw; doing it now keeps its height steady while scroll is restored.
  window.TodayMotion820?.refresh?.();
  const gauge=el.querySelector('.w885-gauge');visible=inView(gauge);
  if(el.dataset.key===playedKey||still())settle(el);else if(visible&&!paused)play(el);
  observer=new IntersectionObserver(seen,{threshold:[0]});observer.observe(gauge);
  sync();
 }
 document.addEventListener('click',e=>{
  const t=e.target instanceof Element?e.target:null;if(!t||!t.closest('#where885'))return;
  const jump=t.closest('[data-w885-jump]');
  if(jump){e.preventDefault();document.querySelector('#gc500-work-board840 [data-tw840-jump="'+CSS.escape(jump.dataset.w885Jump)+'"]')?.click();return;}
  if(t.closest('[data-w885-motion]')){paused=!paused;const el=hero();if(paused)settle(el);else if(el&&visible)play(el);sync();}
 });
 document.addEventListener('visibilitychange',sync);
 document.addEventListener('gc500motionchange',()=>{if(still())settle(hero());sync();});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>{if(still())settle(hero());sync();});
 window.addEventListener('beforeprint',()=>settle(hero()));
 window.addEventListener('pagehide',stop);
 const held=renderToday_held;
 renderToday_held=function(...args){const result=held.apply(this,args);try{mount();}catch(err){console.error('Where we are card',err);}return result;};
 return {mount,report:()=>{const el=hero(),m=el&&typeof progress881Model==='function'?progress881Model(todayWorkDay841()):null;return {version:'v8.85',mounted:!!el,above:!!el&&el.nextElementSibling?.id==='gc500-work-board840',programme:!!el?.querySelector('.w885-programme .today-work-programme840'),ready:m?.ready,pct:m?.pct,reached:m?.reached,shown:el?.querySelector('[data-w885-pct]')?.textContent,lit:el?el.querySelectorAll('.w885-lights .tl841-lamp.is-on').length:0,intro:!!el?.classList.contains('w885-intro'),running:!!el?.classList.contains('w885-running'),paused,visible,frame:!!frame};}};
})();
