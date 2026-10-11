/* Author: Andrew Fisher. Today's programme card, responsive width and strip-only centring. */
(function(root){'use strict';
function nearest(days,today){
 const dates=days.map(d=>typeof d==='string'?d:d.iso).filter(Boolean).sort();
 if(dates.includes(today))return today;
 const at=Date.parse(today+'T12:00:00Z');
 return dates.reduce((best,day)=>!best||Math.abs(Date.parse(day+'T12:00:00Z')-at)<=Math.abs(Date.parse(best+'T12:00:00Z')-at)?day:best,null);
}
function reveal(pane){
 // Resize can fire while this head script is loading, before application state exists.
 pane=pane||document.querySelector('#pane-timeline.on,#pane-demob.on');
 if(!pane||pane.hidden||!pane.classList.contains('on'))return;
 const strip=pane.querySelector('.daystrip'),on=strip?.querySelector('.day.on');
 if(!strip||!on||strip.clientWidth<=0||on.offsetWidth<=0)return;
 const cards=[...strip.querySelectorAll('.day')],edge=Math.max(8,(strip.clientWidth-on.offsetWidth)/2);
 // A real today at either endpoint can still sit in the middle; no invented dates.
 strip.style.setProperty('--wx1002-edge-start',on.classList.contains('today')&&cards[0]===on?edge+'px':'8px');
 strip.style.setProperty('--wx1002-edge-end',on.classList.contains('today')&&cards.at(-1)===on?edge+'px':'8px');
 const a=strip.getBoundingClientRect(),b=on.getBoundingClientRect();
 const to=Math.max(0,Math.min(strip.scrollLeft+b.left+b.width/2-a.left-strip.clientWidth/2,strip.scrollWidth-strip.clientWidth));
 // Never scroll or focus the document; preserve manual day selection and its record.
 if(Math.abs(to-strip.scrollLeft)>.5)strip.scrollTo({left:to,behavior:'instant'});
}
function resetRefresh(){
 const nav=root.performance?.getEntriesByType?.('navigation')?.[0];
 if(nav?.type!=='reload')return false;
 if(/^#day\//.test(location.hash)){
  state.day=null;state.tlView='day';
  history.replaceState(history.state,'',location.pathname+location.search+'#timeline');
 }
 if(location.hash==='#demob')DM816.sel=null;
 return true;
}
root.WeatherStrip1002={nearest,reveal,resetRefresh};
root.addEventListener('resize',()=>reveal());
root.addEventListener('pageshow',()=>reveal());
})(window);
