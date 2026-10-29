/* Author: Andrew Fisher. Explicit map overlays; recorded locations remain unchanged. */
function mapClarityFrame1257(){
 'use strict';
 if(window.GC500MapClarity1257)return;
 let showLeft=false,offItems=[],offRows=[],recordedRows=[],rowSignature='';
 const ownDoc=parent.document;
 const planVisible=()=>mode!=='satellite'&&!document.body.classList.contains('in3d')&&!document.body.classList.contains('fencing-map');
 const validBox=box=>Array.isArray(box)&&box.length===4&&box.every(Number.isFinite)&&box[2]>=box[0]&&box[3]>=box[1];
 function onSheet(box){
  if(!validBox(box))return false;
  const x=(box[0]+box[2])/2,y=(box[1]+box[3])/2;
  return x>=0&&y>=0&&x<=SHEET_W&&y<=SHEET_H;
 }
 const codeOf=it=>String(it?.reg?.sourceRequest1017?it.reg.sourceKey1017:it?.code||'');
 const key=document.createElement('div');key.id='map1257-key';key.className='pill';key.hidden=true;key.setAttribute('role','note');
 key.textContent='Green ring = has left site · dashed = part left · red = needs review';
 document.querySelector('.hud').appendChild(key);
 const css=document.createElement('style');css.id='map1257-frame-style';css.textContent='#map1257-key{font-size:11px;line-height:1.4;white-space:normal;max-width:min(560px,calc(100vw - 24px));box-sizing:border-box;color:#edf6fa;background:#111c22f2;border-color:#49616c}#map1257-key[hidden],body.in3d #map1257-key,body.fencing-map #map1257-key{display:none!important}@media(max-width:900px){#map1257-key{max-width:calc(100vw - 112px);font-size:10px}}';document.head.appendChild(css);
 function controls(){
  const bar=ownDoc.getElementById('map1147-controls');if(!bar)return;
  let label=bar.querySelector('.map1257-left');
  if(!label){label=ownDoc.createElement('label');label.className='map1257-left';const check=ownDoc.createElement('input');check.type='checkbox';check.id='map1257-left';check.setAttribute('data-ro','');check.addEventListener('change',()=>setShowLeft(check.checked));label.append(check,ownDoc.createTextNode('Show what has left'));bar.appendChild(label);}
  const check=label.querySelector('input');check.checked=showLeft;
  let list=bar.querySelector('#map1257-offsheet');if(!list){list=ownDoc.createElement('div');list.id='map1257-offsheet';list.setAttribute('role','note');bar.appendChild(list);}
  const words=recordedRows.length?'Pinned off the drawing: '+recordedRows.map(r=>r.code).join(', ')+'. Positions kept unchanged; review them in Questions.':'';
  if(list.textContent!==words)list.textContent=words;list.hidden=!words;
  key.hidden=!showLeft;
 }
 function refresh(){
  offItems=ITEMS.filter(it=>Array.isArray(it.places)&&it.places.some(b=>!onSheet(b)));
  const byCode=new Map();for(const it of offItems){const code=codeOf(it);if(!code)continue;const row=byCode.get(code)||{code,places:[]};for(const b of it.places)if(validBox(b)&&!onSheet(b))row.places.push(b.slice());if(row.places.length)byCode.set(code,row);}
  offRows=[...byCode.values()].sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
  recordedRows=parent.MapClarity1257.offSheet().map(r=>({code:r.key}));
  const next=JSON.stringify(recordedRows);if(next!==rowSignature){rowSignature=next;controls();}
 }
 function setShowLeft(on){showLeft=on===true;controls();requestPaint();return showLeft;}
 // Only the rendering/hit-test stack sees the clipped view. Native coordinates,
 // item identity, searches, satellite-only views and all record readers retain it.
 function withPlanPlaces(fn,self,args){
  if(!planVisible())return fn.apply(self,args);
  const changed=[],items=new Set(offItems.concat(marks.map(m=>m.it),selected?[selected]:[]));
  try{for(const it of items){if(!Array.isArray(it?.places))continue;const original=it.places,visible=original.filter(onSheet);if(visible.length!==original.length){changed.push([it,original]);it.places=visible;}}return fn.apply(self,args);}
  finally{for(const [it,places]of changed)it.places=places;}
 }
 const build=buildItems;buildItems=function(){const result=build.apply(this,arguments);refresh();return result;};
 const draw=drawMarks;drawMarks=function(){return withPlanPlaces(draw,this,arguments);};
 const itemHit=itemAt887;itemAt887=function(){return withPlanPlaces(itemHit,this,arguments);};
 const markHit=markAt;markAt=function(){return withPlanPlaces(markHit,this,arguments);};
 const choose=selectCode;selectCode=function(code){const it=ITEMS.find(x=>x.code===norm(code));if(planVisible()&&it?.places.length&&it.places.every(b=>!onSheet(b))){toast('This location is outside the drawing.');return false;}return choose.apply(this,arguments);};
 let categoryFit=false;const category=showCategory;showCategory=function(){const before=categoryFit;categoryFit=true;try{return category.apply(this,arguments);}finally{categoryFit=before;}};
 const goto=gotoRect;gotoRect=function(rect,label){if(categoryFit&&planVisible()){const boxes=marks.flatMap(m=>m.it.places.filter(onSheet).map(b=>geoRect(b)));if(!boxes.length)return;rect=[Math.min(...boxes.map(b=>b[0]))-40,Math.min(...boxes.map(b=>b[1]))-40,Math.max(...boxes.map(b=>b[2]))+40,Math.max(...boxes.map(b=>b[3]))+40];}return goto.call(this,rect,label);};
 window.GC500MapClarity1257=Object.freeze({onSheet,setShowLeft,controls,refresh,offSheet:()=>recordedRows.map(r=>({...r})),projectedOffSheet:()=>offRows.map(r=>({code:r.code,places:r.places.map(b=>b.slice())})),bounds:Object.freeze({width:SHEET_W,height:SHEET_H}),get state(){return{showLeft,planVisible:planVisible(),offSheet:recordedRows.map(r=>r.code)};}});
 refresh();controls();requestPaint();
}
