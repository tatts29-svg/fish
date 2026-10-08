/* Author: Andrew Fisher. Reveal the selected day when its strip has real dimensions. */
(function(){
'use strict';
function reveal(pane){
 pane=pane||document.getElementById('pane-timeline');
 if(state.tab!=='timeline'||!pane||pane.hidden||!pane.classList.contains('on'))return;
 const strip=pane.querySelector('.daystrip'),on=strip&&strip.querySelector('.day.on');
 // A hidden refresh gate gives both the strip and its selected day zero width.
 if(!strip||!on||strip.clientWidth<=0||on.offsetWidth<=0)return;
 const left=on.offsetLeft-strip.offsetLeft;
 const seen=left>=strip.scrollLeft&&left+on.offsetWidth<=strip.scrollLeft+strip.clientWidth;
 if(seen)return;
 const to=Math.max(0,Math.min(left-Math.max(0,(strip.clientWidth-on.offsetWidth)/2),strip.scrollWidth-strip.clientWidth));
 // Keep the original instant strip-only movement; never scroll or focus the page.
 try{strip.scrollTo({left:to,behavior:'auto'});}catch(e){strip.scrollLeft=to;}
}
window.addEventListener('resize',()=>reveal());
window.addEventListener('pageshow',()=>reveal());
window.TimelineStrip937={reveal};
})();
