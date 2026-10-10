/* Author: Andrew Fisher. Replay dated progress only for the cards being viewed. */
(function(root){'use strict';
function create(deps){
 const enrolled=new WeakMap();let scheduled=null,stopped=false,computed=0,painted=0,discarded=0;
 const available=()=>!stopped&&deps.active()&&deps.ready();
 function candidates(){
  if(!available())return [];
  const signature=deps.signature(),today=deps.today();
  return deps.cards().filter(card=>{
   if(!enrolled.has(card))enrolled.set(card,signature);
   return deps.connected(card)&&deps.pending(card)&&deps.day(card)<today&&
    enrolled.get(card)===signature&&(deps.selected(card)||deps.visible(card));
  }).sort((a,b)=>Number(deps.selected(b))-Number(deps.selected(a)));
 }
 function cancel(){if(scheduled!==null){deps.cancel(scheduled);scheduled=null;}}
 function run(){
  scheduled=null;
  const card=candidates()[0];if(!card)return;
  const signature=enrolled.get(card),day=deps.day(card),result=deps.read(day);computed++;
  // A record update, navigation or DOM replacement invalidates a queued result.
  if(available()&&signature===deps.signature()&&deps.connected(card)&&deps.pending(card)&&
   deps.day(card)===day&&day<deps.today()&&(deps.selected(card)||deps.visible(card))){
   deps.paint(card,result);painted++;
  }else discarded++;
  sync();
 }
 function sync(){
  if(!candidates().length){cancel();return;}
  if(scheduled===null)scheduled=deps.schedule(run);
 }
 return {sync,stop(){stopped=true;cancel();},resume(){stopped=false;sync();},
  report:()=>({queued:candidates().length,scheduled:scheduled!==null,computed,painted,discarded,stopped})};
}
if(typeof document==='undefined'){root.BuildProgress986={create};return;}
function active(){const pane=document.getElementById('pane-timeline');return !!(pane&&pane.classList.contains('on')&&!pane.hidden&&!document.hidden&&state.tab==='timeline');}
function paint(card,p){
 const reading=card.querySelector('.bc984-percentage'),area=card.querySelector('.bc984-progress');if(!reading||!area)return;
 const known=p.past&&p.percent!==null&&Number.isFinite(p.percent),aria=card.getAttribute('aria-label')||'';
 reading.classList.toggle('long',!known);
 reading.textContent=known?(p.bound?'≥':'')+p.text:'Not recorded';
 let rail=area.querySelector('.bc984-rail');
 if(known){
  const unit=document.createElement('small');unit.textContent='%';reading.append(unit);
  if(!rail){rail=document.createElement('span');rail.className='bc984-rail';rail.append(document.createElement('i'));area.append(rail);}
  rail.querySelector('i').style.width=p.percent+'%';
 }else rail?.remove();
 const sentence=known?(p.bound?'At least ':'')+p.text+' percent whole-build progress at day close.':'Whole-build progress not recorded.';
 card.setAttribute('aria-label',aria.replace(/(?:Whole-build progress (?:loading|not recorded)|(?:At least )?[\d,.]+ percent whole-build progress at day close)\./,sentence));
 card.dataset.buildProgress=known?'ready':'unavailable';
}
const loader=create({
 active,ready:()=>!!todayWorkHealth840().ready,today:()=>todayIso(),
  signature:()=>todayIso()+'|'+JSON.stringify(todayWorkHealth840())+'|'+(typeof DOCS==='undefined'?'':DOCS.state+'|'+DOCS.at)+'|'+JSON.stringify(S),
 cards:()=>Array.from(document.querySelectorAll('#pane-timeline .bc984-day[data-build-progress]')),
 connected:card=>card.isConnected,pending:card=>card.dataset.buildProgress==='pending',
 day:card=>card.dataset.day,selected:card=>card.classList.contains('on'),visible:card=>card.dataset.bc984Visible==='true',
 schedule:fn=>typeof requestIdleCallback==='function'?{kind:'idle',id:requestIdleCallback(fn,{timeout:300})}:{kind:'frame',id:requestAnimationFrame(fn)},
 cancel:token=>token.kind==='idle'?cancelIdleCallback(token.id):cancelAnimationFrame(token.id),
 read:day=>{root.BuildCards984.begin();return root.PastDay984.model({iso:day},todayIso(),root.BuildCards984.progressForDate);},paint
});
root.BuildProgress986={create,sync:loader.sync,report:loader.report};
document.addEventListener('visibilitychange',loader.sync);
window.addEventListener('pagehide',loader.stop);window.addEventListener('pageshow',loader.resume);
loader.sync();
})(typeof window!=='undefined'?window:globalThis);
