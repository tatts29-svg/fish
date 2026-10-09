/* Author: Andrew Fisher. A film owns its playback intent and pending requests. */
function createCogMedia835(video, allowed, onState){
 let wanted = true, disposed = false, previousEligible = false;
 let generation = 0, pending = 0, blocked = false, state = 'paused';
 const eligible = () => !disposed && wanted && !!allowed();
 const change = value => { if (state !== value) { state = value; if (onState) onState(value); } };
 const stop = () => { generation++; pending = 0; video.pause(); change('paused'); };
 const sync = () => {
  const can = eligible();
  if (!can) { previousEligible = false; stop(); return; }
  if (!previousEligible) blocked = false;
  previousEligible = true;
  if (blocked || pending) return;
  if (!video.paused) { change('playing'); return; }
  const request = ++generation; pending = request; change('loading');
  let result;
  try { result = video.play(); }
  catch (error) { result = Promise.reject(error); }
  Promise.resolve(result).then(() => {
   if (request !== generation) { if (!eligible()) video.pause(); return; }
   pending = 0;
   if (!eligible()) { stop(); return; }
   change(video.paused ? 'paused' : 'playing');
  }).catch(() => {
   if (request !== generation) return;
   pending = 0;
   if (!eligible()) { stop(); return; }
   blocked = true; video.pause(); change('unavailable');
  });
 };
 const playing = () => { if (!eligible()) { stop(); return; } change('playing'); };
 const paused = () => {
  if (!blocked && state === 'playing' && !pending && eligible()) wanted = false;
  if (!blocked) change('paused');
 };
 const ended = () => { wanted = false; sync(); };
 const failed = () => {
  generation++; pending = 0; blocked = true; video.pause();
  change(eligible() ? 'unavailable' : 'paused');
 };
 const listeners = [['playing', playing], ['pause', paused], ['ended', ended], ['error', failed]];
 listeners.forEach(([event, fn]) => video.addEventListener(event, fn));
 return {
  sync,
  play(){ if (disposed) return; wanted = true; blocked = false; sync(); },
  pause(){ wanted = false; sync(); },
  dispose(){ if (disposed) return; disposed = true; listeners.forEach(([event, fn]) => video.removeEventListener(event, fn)); stop(); },
  status: () => state,
  desired: () => wanted
 };
}

/* Browser integration */
const COG_FILM835 = {inline:null, dialog:null, previewPaused:false};
function cogFilmSources835(hero, full){
 const out=[];
 const add=(src,type)=>{if(typeof src==='string'&&src)out.push({src,type});};
 if(full && typeof hero.full_mp4==='string' && hero.full_mp4) add(hero.full_mp4,'video/mp4');
 else {add(hero.mp4,'video/mp4');add(hero.webm,'video/webm');}
 return out;
}
function cogFilmVideo835(hero, full){
 const poster=typeof(hero.poster||hero.src)==='string'?(hero.poster||hero.src):'';
 const label=typeof hero.is==='string'?hero.is:'The Coates Way steering-wheel film';
 return `<video class="cwloop" muted loop playsinline preload="none" poster="${esc(poster)}" aria-label="${esc(label)}">${cogFilmSources835(hero,full).map(s=>`<source src="${esc(s.src)}" type="${s.type}">`).join('')}</video>`;
}
function cogFilmHero835(hero){
 const w=Number(hero.width),h=Number(hero.height),ratio=Number.isFinite(w)&&w>0&&Number.isFinite(h)&&h>0?w+'/'+h:'16/9';
 const poster=typeof(hero.poster||hero.src)==='string'?(hero.poster||hero.src):'';
 const available=cogFilmSources835(hero,false).length>0;
 return `<div class="cwhero opens" id="cwHero" style="aspect-ratio:${ratio}">
 ${poster?`<img class="cwFilmPoster" src="${esc(poster)}" alt="${esc(hero.is||'The Coates Way cog steering wheel')}">`:''}
 ${available?cogFilmVideo835(hero,false):''}
 <button type="button" class="cwFilmOpen" id="cwFilmOpen" aria-label="Watch The Coates Way steering-wheel film"${available?'':' disabled'}><span class="cwherotag"><i></i>${available?'THE COATES WAY · WATCH THE FILM':'THE COATES WAY'}</span></button>
 ${available?'<button type="button" class="btn cwFilmPreview" id="cwFilmPreview">Pause preview</button>':''}
 </div>${typeof hero.caption==='string'&&hero.caption?`<p class="norate">${esc(hero.caption)}</p>`:''}`;
}
function cogFilmReleaseVideo835(video){
 video.pause(); video.removeAttribute('src');
 video.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));
 try {video.load();} catch(error){}
}
function cogFilmUnmount835(){
 const entry=COG_FILM835.inline;if(!entry)return;
 COG_FILM835.inline=null;entry.events.abort();
 if(entry.observer)entry.observer.disconnect();
 if(entry.contextObserver)entry.contextObserver.disconnect();
 entry.player.dispose();cogFilmReleaseVideo835(entry.video);
}
function cogFilmMount835(){
 const pic=$('#cwHero'),video=pic&&pic.querySelector('video'),open=$('#cwFilmOpen');
 if(open)open.onclick=()=>cogFilmOpen835(open);
 if(!video)return;
 if(COG_FILM835.inline&&COG_FILM835.inline.video===video){COG_FILM835.inline.check();return;}
 cogFilmUnmount835();
 /* A page restored from the browser cache keeps the node whose sources were
 released on pagehide. Rehydrate only the reviewed preview references. */
 if(!video.querySelector('source[src]')){
  const hero=DATA.machine&&DATA.machine.hero;
  if(hero)video.innerHTML=cogFilmSources835(hero,false).map(s=>`<source src="${esc(s.src)}" type="${s.type}">`).join('');
 }
 const events=new AbortController(),toggle=$('#cwFilmPreview');
 const entry={video,events,observer:null,contextObserver:null,player:null,ratio:0,printing:false,check:null};
 COG_FILM835.inline=entry;
 video.muted=true;video.loop=true;video.playsInline=true;
 const allowed=()=>COG_FILM835.inline===entry&&pic.isConnected&&state.tab==='coatesway'&&!document.hidden&&!entry.printing&&!motionOff()&&!COG_FILM835.dialog&&!pic.closest('[inert],[hidden]')&&entry.ratio>=.15;
 const paint=()=>{
  if(entry.player)COG_FILM835.previewPaused=!entry.player.desired();
  video.hidden=motionOff();
  if(toggle){toggle.hidden=motionOff();toggle.textContent=entry.player&&entry.player.status()==='unavailable'?'Retry preview':COG_FILM835.previewPaused?'Play preview':'Pause preview';toggle.setAttribute('aria-pressed',String(!COG_FILM835.previewPaused));}
 };
 entry.player=createCogMedia835(video,allowed,paint);
 if(COG_FILM835.previewPaused)entry.player.pause();
 const geometry=()=>{
  const r=pic.getBoundingClientRect(),main=$('main'),m=main?main.getBoundingClientRect():{top:0,left:0,bottom:innerHeight,right:innerWidth};
  const width=Math.max(0,Math.min(r.right,m.right,innerWidth)-Math.max(r.left,m.left,0));
  const height=Math.max(0,Math.min(r.bottom,m.bottom,innerHeight)-Math.max(r.top,m.top,0));
  entry.ratio=r.width>0&&r.height>0?width*height/(r.width*r.height):0;
 };
 entry.check=()=>{if(!entry.observer)geometry();paint();entry.player.sync();};
 if('IntersectionObserver' in window){entry.observer=new IntersectionObserver(es=>{const e=es.find(e=>e.target===pic);if(e){entry.ratio=e.isIntersecting?e.intersectionRatio:0;entry.check();}},{root:$('main'),threshold:[0,.15]});entry.observer.observe(pic);}
 else {const main=$('main');if(main)main.addEventListener('scroll',entry.check,{passive:true,signal:events.signal});window.addEventListener('resize',entry.check,{signal:events.signal});}
 /* The interactive car and other overlays make the page inert without moving
    its hero. Recheck those ancestors even when intersection stays unchanged. */
 if('MutationObserver' in window){entry.contextObserver=new MutationObserver(entry.check);for(let el=pic;el;el=el.parentElement)entry.contextObserver.observe(el,{attributes:true,attributeFilter:['inert','hidden']});}
 for(const event of ['visibilitychange','gc500motionchange'])document.addEventListener(event,entry.check,{signal:events.signal});
 window.addEventListener('beforeprint',()=>{entry.printing=true;entry.check();},{signal:events.signal});
 window.addEventListener('afterprint',()=>{entry.printing=false;entry.check();},{signal:events.signal});
 window.addEventListener('pagehide',()=>{cogFilmClose835(false);cogFilmUnmount835();},{signal:events.signal});
 if(toggle)toggle.onclick=()=>{
  if(entry.player.status()==='unavailable'){COG_FILM835.previewPaused=false;video.load();entry.player.play();}
  else {if(entry.player.desired())entry.player.pause();else entry.player.play();}
  paint();
 };
 entry.check();
}
function cogFilmClose835(restoreFocus=true){
 const entry=COG_FILM835.dialog;if(!entry)return;
 COG_FILM835.dialog=null;entry.events.abort();if(entry.player)entry.player.dispose();
 const fullscreen=document.fullscreenElement;
 if(fullscreen&&(fullscreen===entry.panel||entry.panel.contains(fullscreen))&&document.exitFullscreen){try{const p=document.exitFullscreen();if(p&&p.catch)p.catch(()=>{});}catch(error){}}
 cogFilmReleaseVideo835(entry.video);
 if(typeof entry.panel.close==='function'&&entry.panel.open)entry.panel.close();
 entry.panel.remove();entry.inert.forEach(el=>el.removeAttribute('inert'));
 if(restoreFocus&&state.tab==='coatesway'){
  const target=entry.ret&&entry.ret.isConnected?entry.ret:$('#cwFilmOpen');
  if(target&&target.focus)try{target.focus({preventScroll:true});}catch(error){}
 }
 if(COG_FILM835.inline)COG_FILM835.inline.check();
}
function cogFilmOpen835(opener){
 if(COG_FILM835.dialog)return;
 const hero=DATA.machine&&DATA.machine.hero;if(!hero||!cogFilmSources835(hero,true).length)return;
 const panel=document.createElement('dialog');panel.className='cwFilmDialog';panel.setAttribute('aria-labelledby','cwFilmTitle835');
 panel.innerHTML=`<div class="cwFilmSurface"><header class="cwFilmBar"><h2 id="cwFilmTitle835">The Coates Way · steering wheel</h2><button type="button" class="btn" data-cwfilm-close>Close</button></header><div class="cwFilmStage">${cogFilmVideo835(hero,true)}</div><div class="cwFilmControls"><button type="button" class="btn" data-cwfilm-play>Pause</button><button type="button" class="btn" data-cwfilm-restart>Restart</button><button type="button" class="btn" data-cwfilm-fullscreen>Full screen</button><span role="status" aria-live="polite" data-cwfilm-status>Loading film…</span></div></div>`;
 const events=new AbortController(),video=panel.querySelector('video'),surface=panel.querySelector('.cwFilmSurface'),ret=opener||document.activeElement;
 const entry={panel,surface,video,ret,events,inert:[],player:null,printing:false};COG_FILM835.dialog=entry;
 if(COG_FILM835.inline)COG_FILM835.inline.check();
 document.body.appendChild(panel);
 let modal=false;
 if(typeof panel.showModal==='function')try{panel.showModal();modal=true;}catch(error){}
 if(!modal){panel.classList.add('cwFilmFallback');panel.setAttribute('open','');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');entry.inert=[...document.body.children].filter(el=>el!==panel&&el.tagName!=='SCRIPT'&&!el.hasAttribute('inert'));entry.inert.forEach(el=>el.setAttribute('inert',''));}
 video.muted=true;video.loop=true;video.playsInline=true;
 const play=panel.querySelector('[data-cwfilm-play]'),status=panel.querySelector('[data-cwfilm-status]');
 const paint=value=>{play.textContent=value==='unavailable'?'Retry':value==='playing'||value==='loading'?'Pause':'Play';status.textContent=value==='unavailable'?'The film could not play. Try again.':value==='loading'?'Loading film…':value==='playing'?'Playing':'Paused';};
 entry.player=createCogMedia835(video,()=>COG_FILM835.dialog===entry&&panel.isConnected&&state.tab==='coatesway'&&!document.hidden&&!entry.printing,paint);
 play.onclick=()=>{if(entry.player.desired()&&entry.player.status()!=='unavailable')entry.player.pause();else{if(video.error)video.load();entry.player.play();}};
 panel.querySelector('[data-cwfilm-restart]').onclick=()=>{try{video.currentTime=0;}catch(error){}if(video.error)video.load();entry.player.play();};
 panel.querySelector('[data-cwfilm-close]').onclick=()=>cogFilmClose835();
 const full=panel.querySelector('[data-cwfilm-fullscreen]');
 if(typeof surface.requestFullscreen!=='function')full.hidden=true;
 else full.onclick=()=>{try{const p=document.fullscreenElement===surface?document.exitFullscreen():surface.requestFullscreen();if(p&&p.catch)p.catch(()=>{status.textContent='Full screen is unavailable. The film can still play here.';});}catch(error){status.textContent='Full screen is unavailable. The film can still play here.';}};
 document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement===surface?'Exit full screen':'Full screen';},{signal:events.signal});
 panel.addEventListener('cancel',event=>{event.preventDefault();if(document.fullscreenElement!==surface)cogFilmClose835();},{signal:events.signal});
 panel.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.fullscreenElement!==surface){event.preventDefault();cogFilmClose835();return;}
  if(event.key==='Tab'){const items=[...panel.querySelectorAll('button')].filter(el=>!el.hidden&&!el.disabled),first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 },{signal:events.signal});
 document.addEventListener('visibilitychange',()=>entry.player.sync(),{signal:events.signal});
 window.addEventListener('beforeprint',()=>{entry.printing=true;entry.player.sync();},{signal:events.signal});
 window.addEventListener('afterprint',()=>{entry.printing=false;entry.player.sync();},{signal:events.signal});
 window.addEventListener('pagehide',()=>cogFilmClose835(false),{signal:events.signal});
 try{if(!routing){const st=history.state&&typeof history.state.gc==='number'?history.state:{gc:0};history.pushState({gc:st.gc+1,cogFilm835:1},'',location.href);NAV.cur=location.hash;NAV.curGc=st.gc+1;navBackShow();}}catch(error){}
 panel.querySelector('[data-cwfilm-close]').focus({preventScroll:true});entry.player.play();
}
function cogFilmLeave835(){cogFilmClose835(false);cogFilmUnmount835();}
window.addEventListener('pageshow',()=>{if(state.tab==='coatesway')cogFilmMount835();});
