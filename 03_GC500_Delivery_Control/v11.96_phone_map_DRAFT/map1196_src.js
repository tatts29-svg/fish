/* Author: Andrew Fisher. Restore the existing explorer's full-screen control. */
(function(W){
'use strict';
document.addEventListener('click',function(e){
 const b=e.target.closest('[data-map1196-tools]');if(!b)return;
 const c=b.closest('#expcard');if(!c)return;
 const on=c.classList.toggle('map1196-open');b.setAttribute('aria-expanded',String(on));b.textContent=on?'Hide map tools':'Map tools';
 W.expSize();
});
// Closing the full-screen map returns focus to the control that opened it.
const full=W.expFullToggle;W.expFullToggle=function(){const r=full.apply(this,arguments),b=document.getElementById('expFull');if(b)b.focus({preventScroll:true});return r;};
W.MapViewport1196={version:1196,author:'Andrew Fisher'};
})(window);
