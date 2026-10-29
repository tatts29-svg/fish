/* Author: Andrew Fisher. v12.56 - the collection rings (one per reference that has left site) are off until asked for.
   Andrew, 29 Oct 2026, on the satellite map covered in green rings: "this looks like a mess. What do these mean". The
   Map tools bar gains one choice, "Show what has left"; while it is on, a key on the map says what the rings mean.
   Nothing recorded changes; the rings, the departed icons and every reader stay as built (v12.29, v12.42.25). */
function mapLeftFrame1256(){
 'use strict';
 if(window.GC500MapLeft1256)return;
 let showLeft=false;
 const ownDoc=parent.document;
 const key=document.createElement('div');key.id='map1256-key';key.className='pill';key.hidden=true;key.setAttribute('role','note');
 key.textContent='Green ring = has left site · dashed = part left · red = needs review';
 const hud=document.querySelector('.hud');if(hud)hud.appendChild(key);
 const css=document.createElement('style');css.id='map1256-frame-style';
 css.textContent='#map1256-key{font-size:11px;line-height:1.4;white-space:normal;max-width:min(560px,calc(100vw - 24px));box-sizing:border-box;color:#edf6fa;background:#111c22f2;border-color:#49616c}#map1256-key[hidden],body.in3d #map1256-key,body.fencing-map #map1256-key{display:none!important}@media(max-width:900px){#map1256-key{max-width:calc(100vw - 112px);font-size:10px}}';
 document.head.appendChild(css);
 function controls(){
  const bar=ownDoc.getElementById('map1147-controls');if(!bar)return;
  let label=bar.querySelector('.map1256-left');
  if(!label){
   label=ownDoc.createElement('label');label.className='map1256-left';
   const check=ownDoc.createElement('input');check.type='checkbox';check.id='map1256-left';check.setAttribute('data-ro','');
   check.addEventListener('change',()=>setShowLeft(check.checked));
   label.append(check,ownDoc.createTextNode('Show what has left'));bar.appendChild(label);
  }
  label.querySelector('input').checked=showLeft;
  key.hidden=!showLeft;
 }
 function setShowLeft(on){showLeft=on===true;controls();requestPaint();return showLeft;}
 window.GC500MapLeft1256=Object.freeze({setShowLeft,controls,get state(){return {showLeft};}});
 controls();requestPaint();
}
