/* Author: Andrew Fisher. Keep full card facts; mount decorative weather art near the strip viewport. */
let artStrip1066=null,artObserver1066=null,artFrame1066=0;
const artBound1066=new WeakSet();
function stopArt1066(){
 artObserver1066?.disconnect();artObserver1066=null;artStrip1066=null;
 if(artFrame1066)cancelAnimationFrame(artFrame1066);artFrame1066=0;
}
function fillArt1066(card){
 const slots=card.querySelectorAll('[data-bc1066-sky]');
 for(const slot of slots){
  if(slot.dataset.bc1066Ready==='true')continue;
  slot.innerHTML=WX818.art(slot.dataset.bc1066Sky,false);
  slot.dataset.bc1066Ready='true';
 }
}
function nearbyArt1066(strip){
 if(!strip||document.hidden||!active())return;
 const edge=strip.getBoundingClientRect(),margin=edge.width;
 if(!(edge.width>0&&edge.height>0))return;
 // Read every bound before adding any SVG. The artwork is absolutely positioned.
 const near=[...strip.querySelectorAll('.bc984-day')].filter(card=>{
  const r=card.getBoundingClientRect();
  return r.width>0&&r.height>0&&r.right>=edge.left-margin&&r.left<=edge.right+margin;
 });
 near.forEach(fillArt1066);
}
function artMount1066(pane){
 const strip=pane?.querySelector('.daystrip');
 if(!strip||document.hidden||!active())return;
 if(strip!==artStrip1066){
  artObserver1066?.disconnect();artObserver1066=null;
  if(artFrame1066)cancelAnimationFrame(artFrame1066);artFrame1066=0;
  artStrip1066=strip;
  if(typeof IntersectionObserver==='function'){
   artObserver1066=new IntersectionObserver(entries=>{
    if(strip!==artStrip1066||document.hidden||!active())return;
    entries.filter(x=>x.target.isConnected&&x.isIntersecting&&x.intersectionRect.width>0&&x.intersectionRect.height>0).forEach(x=>fillArt1066(x.target));
   },{root:strip,rootMargin:'0px 800px',threshold:0});
   strip.querySelectorAll('.bc984-day').forEach(card=>artObserver1066.observe(card));
  }
  if(!artBound1066.has(strip)){
   artBound1066.add(strip);
   strip.addEventListener('focusin',event=>{
    if(document.hidden||!active())return;
    const card=event.target.closest('.bc984-day');if(card)fillArt1066(card);
   });
   if(typeof IntersectionObserver!=='function')strip.addEventListener('scroll',()=>{
    if(artFrame1066||document.hidden||!active())return;
    artFrame1066=requestAnimationFrame(()=>{artFrame1066=0;if(strip===artStrip1066)nearbyArt1066(strip);});
   },{passive:true});
  }
 }
 nearbyArt1066(strip);
}
function flushArt1066(){
 document.querySelectorAll('#pane-timeline .bc984-day').forEach(fillArt1066);
}
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden)artMount1066(document.getElementById('pane-timeline'));
});
window.addEventListener('resize',()=>{
 artMount1066(document.getElementById('pane-timeline'));
},{passive:true});
