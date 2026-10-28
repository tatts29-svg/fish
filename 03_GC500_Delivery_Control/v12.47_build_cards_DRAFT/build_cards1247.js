/* Author: Andrew Fisher. v12.47 PREVIEW ONLY — additive native Build location previews.
 * No document setters, role changes, new workflow or operational-state inference.
 * Preview gate: visibility is checked at queue entry only. Fast-scroll queue pruning
 * and decoded-image eviction/reentry must be tested before production readiness.
 */
(function(W,D){'use strict';
 const CACHE_LIMIT=16, cache=new Map(), queue=[];
 let observer=null,busy=false,scheduled=false;
 const stats={drawn:0,reused:0,failed:0,active:0,peakActive:0};
 const pane=()=>D.getElementById('pane-timeline');
 const active=()=>{const p=pane();return !!p&&!p.hidden&&typeof state!=='undefined'&&state.tab==='timeline';};
 function loc(key){try{return W.Find1176?.locate({kind:'asset',key});}catch(_){return null;}}
 function valid(L){return !!L&&Number.isFinite(L.lat)&&Number.isFinite(L.lon);}
 function token(L){return [L.kind,L.label,L.tag,L.lat,L.lon,L.how,L.warn,W.Find1176?.release,'wide'].join('|');}
 function show(button,url){
  if(!button.isConnected)return;
  const box=button.querySelector('.b1247-thumb');if(!box)return;
  const image=D.createElement('img');image.alt='Recorded map location for '+button.dataset.build1247Key;image.decoding='async';image.src=url;box.replaceChildren(image);button.dataset.picture1247='ready';
 }
 function noPicture(button,message){
  const box=button.querySelector('.b1247-thumb');box?.remove();button.classList.add('b1247-no-picture');
  const note=button.querySelector('.b1247-map-copy>span');if(note)note.textContent=message||'Open map ↗';button.dataset.picture1247='unavailable';
 }
 function remember(key,value){cache.delete(key);cache.set(key,value);while(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);}
 function compact(pic){return new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';image.onload=()=>{
   try{const c=D.createElement('canvas');c.width=336;c.height=228;const x=c.getContext('2d');
    // The existing picture's lower caption band is repeated as accessible text beside the preview.
    // Preserve the complete geographic picture and its pin; never stretch or crop its footprint.
    const height=Math.min(image.naturalHeight,Math.round(image.naturalWidth*.72));
    c.height=Math.round(c.width*height/image.naturalWidth);x.drawImage(image,0,0,image.naturalWidth,height,0,0,c.width,c.height);
    resolve(c.toDataURL('image/jpeg',.78));c.width=c.height=0;
   }catch(error){reject(error);}
  };image.onerror=()=>reject(new Error('Map preview could not be read'));image.src=pic.dataUrl;
 });}
 async function run(){
  if(busy||!active())return;let job;
  while(queue.length){const next=queue.shift();if(next.button.isConnected&&active()){job=next;break;}}
  if(!job)return;busy=true;stats.active++;stats.peakActive=Math.max(stats.peakActive,stats.active);
  try{const current=loc(job.button.dataset.build1247Key);if(!valid(current)||token(current)!==job.key)return;
   const V=W.Find1176.VIEWS.find(v=>v.key==='wide');if(!V)throw new Error('Native wide view unavailable');
   const pic=await W.Find1176.picture(current,V),url=await compact(pic);remember(job.key,url);stats.drawn++;
   if(job.button.isConnected&&token(loc(job.button.dataset.build1247Key)||{})===job.key)show(job.button,url);
  }catch(_){stats.failed++;if(job.button.isConnected)noPicture(job.button,'Preview unavailable · Open map ↗');}
  finally{stats.active--;busy=false;if(queue.length&&active())setTimeout(run,50);}
 }
 function request(button){
  if(!active()||button.dataset.picture1247!=='waiting')return;
  const L=loc(button.dataset.build1247Key);if(!valid(L)){noPicture(button);return;}
  const key=token(L);if(cache.has(key)){stats.reused++;show(button,cache.get(key));return;}
  // Only embedded site imagery loads automatically. External satellite requests remain native on-demand actions.
  if(!W.Find1176.inAerial(L)){noPicture(button,'Open recorded location ↗');return;}
  button.dataset.picture1247='queued';queue.push({button,key});run();
 }
 function observe(button){
  if(!observer&&W.IntersectionObserver)observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);request(e.target);}}),{root:null,rootMargin:'80px',threshold:0});
  if(observer)observer.observe(button);else button.addEventListener('pointerenter',()=>request(button),{once:true});
 }
 function add(ref){
  if(ref.querySelector(':scope > .b1247-location'))return;
  const key=ref.dataset.tl841Ref,L=loc(key);if(!valid(L))return;
  const button=D.createElement('button');button.type='button';button.className='b1247-location';button.dataset.build1247Key=key;button.dataset.picture1247='waiting';button.setAttribute('aria-label','Open recorded map location for '+key);
  const thumb=D.createElement('span');thumb.className='b1247-thumb';thumb.textContent='Map preview';thumb.setAttribute('aria-hidden','true');
  const text=D.createElement('span');text.className='b1247-map-copy';
  const title=D.createElement('b');title.textContent='Map location · '+key;
  const source=D.createElement('small');source.textContent=L.how||'Recorded location';
  const action=D.createElement('span');action.textContent='Open map ↗';text.append(title,source,action);button.append(thumb,text);
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();const fresh=loc(key);if(!valid(fresh))return;if(typeof W.gate1156Zoom==='function'){state.sheet='__explorer';state.sel=null;go('map');W.gate1156Zoom(fresh.lat,fresh.lon,fresh.id);}else if(typeof showOnMap==='function')showOnMap(key);});
  ref.append(button);observe(button);
 }
 function mount(){
  if(!active())return;const p=pane();
  if(!p.querySelector('.b1247-preview-note')){const note=D.createElement('p');note.className='b1247-preview-note';note.textContent='Build map-strip preview · not live';const first=p.querySelector('.ldlist');if(first)first.before(note);}
  p.querySelectorAll('.ld.tl846.lc991').forEach(card=>{card.querySelectorAll('.lc991-summary .tl841-ref').forEach(add);});
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
 const before=renderTimeline;renderTimeline=function(){observer?.disconnect();queue.length=0;const result=before.apply(this,arguments);schedule();return result;};Object.assign(renderTimeline,before);
 W.BuildCards1247=Object.freeze({mount,stats:()=>({...stats,cached:cache.size,queued:queue.length,cacheLimit:CACHE_LIMIT}),release:'v12.47 PREVIEW — NOT LIVE'});
 schedule();
})(window,document);
