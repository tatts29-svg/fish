/* Author: Andrew Fisher. v12.47 PREVIEW ONLY — additive native Build location previews.
 * No document setters, role changes, new workflow or operational-state inference.
 */
(function(W,D){'use strict';
 let observer=null,observerRoot=null,observed=new Set(),watched=null,mutation=null,scheduled=false,refreshScheduled=false;
 const pane=()=>D.getElementById('pane-timeline');
 const active=()=>{const p=pane();return !!p&&p.isConnected&&!p.hidden&&!D.hidden&&D.visibilityState!=='hidden'&&typeof state!=='undefined'&&state.tab==='timeline';};
 function loc(key){try{return W.Find1176?.locate({kind:'asset',key});}catch(_){return null;}}
 function valid(L){return !!L&&Number.isFinite(L.lat)&&Number.isFinite(L.lon);}
 function token(L){return [L.kind,L.label,L.tag,L.lat,L.lon,L.how,L.warn,W.Find1176?.release,'wide'].join('|');}
 function scroller(){let node=pane()?.parentElement;while(node&&node!==D.body){if(/auto|scroll/.test(getComputedStyle(node).overflowY))return node;node=node.parentElement;}return null;}
 function inView(button){
  if(!button.isConnected||button.hidden||button.closest('[hidden]'))return false;
  const b=button.getBoundingClientRect(),r=observerRoot?.getBoundingClientRect();
  const left=Math.max(0,r?.left||0),top=Math.max(0,r?.top||0),right=Math.min(W.innerWidth,r?.right??W.innerWidth),bottom=Math.min(W.innerHeight,r?.bottom??W.innerHeight);
  return b.width>0&&b.height>0&&b.right>left&&b.left<right&&b.bottom>top&&b.top<bottom;
 }
 function thumb(button){
  let box=button.querySelector('.b1247-thumb');if(!box){box=D.createElement('span');box.className='b1247-thumb';box.setAttribute('aria-hidden','true');button.prepend(box);}return box;
 }
 function clear(button){
  const box=button.querySelector('.b1247-thumb');if(box){box.querySelectorAll('img').forEach(image=>{image.removeAttribute('src');image.remove();});if(box.textContent!=='Map preview')box.textContent='Map preview';}
  button.dataset.picture1247='waiting';
 }
 function waiting(button){button.classList.remove('b1247-no-picture');const box=thumb(button);if(!box.querySelector('img'))box.textContent='Map preview';const note=button.querySelector('.b1247-map-copy>span');if(note)note.textContent='Open map ↗';button.dataset.picture1247='queued';}
 function show(button,url){
  if(!button.isConnected)return;waiting(button);const box=thumb(button),image=D.createElement('img');
  image.alt='Recorded map location for '+button.dataset.build1247Key;image.decoding='async';image.src=url;box.replaceChildren(image);button.dataset.picture1247='ready';
 }
 function noPicture(button,message){
  clear(button);button.querySelector('.b1247-thumb')?.remove();button.classList.add('b1247-no-picture');
  const note=button.querySelector('.b1247-map-copy>span');if(note)note.textContent=message||'Open map ↗';button.dataset.picture1247='unavailable';
 }
 function compact(pic,isCurrent){if(!isCurrent())return Promise.resolve(null);return new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';let canvas=null;
  const cleanup=()=>{image.onload=image.onerror=null;image.removeAttribute('src');if(canvas)canvas.width=canvas.height=0;};
  image.onload=()=>{try{
   if(!isCurrent()){resolve(null);return;}
   canvas=D.createElement('canvas');canvas.width=336;const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');
   // Keep the full native geographic footprint; its lower caption is repeated beside the preview.
   const height=Math.min(image.naturalHeight,Math.round(image.naturalWidth*.72));canvas.height=Math.round(canvas.width*height/image.naturalWidth);
   context.drawImage(image,0,0,image.naturalWidth,height,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.78));
  }catch(error){reject(error);}finally{cleanup();}};
  image.onerror=()=>{cleanup();reject(new Error('Map preview could not be read'));};image.src=pic.dataUrl;
 });}
 const lifecycle=W.createBuildPreviewLifecycle1247({active,connected:button=>button.isConnected&&pane()?.contains(button),inView,cacheLimit:16,imageLimit:16,
  describe(button){const L=loc(button.dataset.build1247Key);if(!valid(L)){const source=button.querySelector('.b1247-map-copy>small');if(source)source.textContent='No coordinate on the record';return {eligible:false,reason:'Location not recorded'};}
   const source=button.querySelector('.b1247-map-copy>small');if(source&&source.textContent!==(L.how||'Recorded location'))source.textContent=L.how||'Recorded location';
   return {key:token(L),L,eligible:!!W.Find1176.inAerial(L),reason:'Open recorded location ↗'};
  },
  async draw(description,isCurrent){const view=W.Find1176.VIEWS.find(v=>v.key==='wide');if(!view)throw new Error('Native wide view unavailable');const picture=await W.Find1176.picture(description.L,view);if(!isCurrent())return null;return compact(picture,isCurrent);},
  present:show,clear,waiting,unavailable:noPicture
 });
 function refresh(){if(!observer)lifecycle.visibility([...observed].map(button=>[button,inView(button)]));else lifecycle.refresh();}
 function scheduleRefresh(){if(refreshScheduled)return;refreshScheduled=true;requestAnimationFrame(()=>{refreshScheduled=false;refresh();});}
 function arm(buttons){
  const root=scroller();
  if(observer&&root!==observerRoot){observer.disconnect();observer=null;lifecycle.visibility([...observed].map(button=>[button,false]));observed.clear();}
  observerRoot=root;
  if(!observer&&W.IntersectionObserver){const current=new IntersectionObserver(entries=>{if(observer!==current)return;lifecycle.visibility(entries.filter(e=>observed.has(e.target)).map(e=>[e.target,e.isIntersecting]));},{root,rootMargin:'0px',threshold:0});observer=current;}
  const found=new Set(buttons);for(const old of observed)if(!found.has(old))observer?.unobserve(old);
  const fresh=buttons.filter(button=>!observed.has(button));observed=found;lifecycle.track(buttons);
  if(observer)fresh.forEach(button=>observer.observe(button));else refresh();
 }
 function add(ref){
  if(ref.querySelector(':scope > .b1247-location'))return;
  const key=ref.dataset.tl841Ref,L=loc(key);if(!valid(L))return;
  const button=D.createElement('button');button.type='button';button.className='b1247-location';button.dataset.build1247Key=key;button.dataset.picture1247='waiting';button.setAttribute('aria-label','Open recorded map location for '+key);
  const box=thumb(button);box.textContent='Map preview';
  const text=D.createElement('span');text.className='b1247-map-copy';
  const title=D.createElement('b');title.textContent='Map location · '+key;
  const source=D.createElement('small');source.textContent=L.how||'Recorded location';
  const action=D.createElement('span');action.textContent='Open map ↗';text.append(title,source,action);button.append(text);
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();const fresh=loc(key);if(!valid(fresh))return;if(typeof W.gate1156Zoom==='function'){state.sheet='__explorer';state.sel=null;go('map');W.gate1156Zoom(fresh.lat,fresh.lon,fresh.id);}else if(typeof showOnMap==='function')showOnMap(key);});
  ref.append(button);
 }
 function watch(p){
  if(watched===p)return;mutation?.disconnect();watched=p;if(!p||!W.MutationObserver)return;
  const carries=node=>node.nodeType===1&&(node.matches('.ld.tl846,.tl841-ref,.b1247-location')||!!node.querySelector('.b1247-location'));
  mutation=new MutationObserver(entries=>{if(entries.some(e=>e.type==='attributes'?(e.target===p||e.attributeName==='hidden'):[...e.addedNodes,...e.removedNodes].some(carries)))schedule();});
  mutation.observe(p,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
 }
 function mount(){
  const p=pane();watch(p);if(!active()){lifecycle.refresh();return;}
  if(!p.querySelector('.b1247-preview-note')){const note=D.createElement('p');note.className='b1247-preview-note';note.textContent='Build map-strip preview · not live';const first=p.querySelector('.ldlist');if(first)first.before(note);}
  p.querySelectorAll('.ld.tl846.lc991').forEach(card=>{card.querySelectorAll('.lc991-summary .tl841-ref').forEach(add);});arm([...p.querySelectorAll('.b1247-location')]);
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
 const before=renderTimeline;renderTimeline=function(){observer?.disconnect();observer=null;observed.clear();lifecycle.track([]);const result=before.apply(this,arguments);schedule();return result;};Object.assign(renderTimeline,before);
 D.addEventListener('visibilitychange',()=>{if(D.hidden||D.visibilityState==='hidden')lifecycle.refresh();else scheduleRefresh();});D.addEventListener('scroll',()=>{if(active()||lifecycle.stats().attached)scheduleRefresh();},true);W.addEventListener('resize',scheduleRefresh,{passive:true});
 W.BuildCards1247=Object.freeze({mount,refresh,stats:lifecycle.stats,release:'v12.47 PREVIEW — NOT LIVE'});
 schedule();
})(window,document);
