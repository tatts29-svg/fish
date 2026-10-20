/* Author: Andrew Fisher. Finite compositor feedback; no map redraw loop or target animation replacement. */
let tapTimer1018=0,tapAnimation1018=null;
function clearFeedback1018(){
 clearTimeout(tapTimer1018);tapTimer1018=0;if(tapAnimation1018)tapAnimation1018.cancel();tapAnimation1018=null;
 const el=$('mapTap1018');if(el)el.hidden=true;
}
document.addEventListener('click',e=>{
 const target=e.target.closest&&e.target.closest('button,[role="button"]');if(!target||target.disabled||!shown887())return;
 const r=target.getBoundingClientRect();if(!r.width||!r.height)return;
 clearFeedback1018();let el=$('mapTap1018');if(!el){el=document.createElement('div');el.id='mapTap1018';el.setAttribute('aria-hidden','true');document.body.appendChild(el)}
 Object.assign(el.style,{left:(r.left-2)+'px',top:(r.top-2)+'px',width:(r.width+4)+'px',height:(r.height+4)+'px',borderRadius:getComputedStyle(target).borderRadius});el.hidden=false;
 if(!mapMotionOff1018()&&el.animate)tapAnimation1018=el.animate([{opacity:.95},{opacity:.3,offset:.55},{opacity:0}],{duration:420,easing:'ease-out',fill:'forwards'});
 tapTimer1018=setTimeout(clearFeedback1018,mapMotionOff1018()?220:450);
},true);
window.addEventListener('resize',clearFeedback1018);window.addEventListener('scroll',clearFeedback1018,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPulse();clearFeedback1018()}});
