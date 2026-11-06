/* Author: Andrew Fisher. Instrument only the native drawing tile callback boundary.
 * This does not write records. Restoration required in finally. No timing claims.
 */
module.exports=async function drawingProbe(page){
 await page.evaluate(()=>{
  window.__drawing45={nativeWire:wireMap,nativeImage:Image,pending:[],hold:false};const P=window.__drawing45;
  const text=wireMap.toString(),hook=' /* the map at rest:';if(!text.includes(hook))throw Error('Native drawing tile boundary changed');
  wireMap=eval('('+text.replace(hook,' window.__drawing45.refresh=tilesNow;window.__drawing45.entries=()=>Array.from(tiles.values());\n'+hook)+')');
  window.Image=function(...args){const image=new P.nativeImage(...args);let saved=null;Object.defineProperty(image,'onload',{configurable:true,get:()=>saved,set:f=>{saved=f;image.addEventListener('load',event=>{const invoke=()=>f.call(image,event);if(P.hold)P.pending.push(invoke);else invoke();},{once:true});}});return image;};
  const master=DATA.sheets.find(s=>s.master);if(!master)throw Error('Native master drawing missing');state.sheet=master.key;state.mapMasterSeen=true;state.wantExp805=false;history.replaceState(null,'','#sheet/'+encodeURIComponent(master.key));go('map');renderMap();
 });
 try{
  await page.waitForFunction(()=>window.__drawing45.refresh&&document.querySelector('#stage .mtiles'));
  await page.evaluate(()=>{state.zoom=8;window.__drawing45.refresh();});
  await page.waitForFunction(()=>window.__drawing45.entries().length>0&&window.__drawing45.entries().every(t=>t.el.classList.contains('on')));
  const before=await page.evaluate(()=>{const P=window.__drawing45;P.old=[...document.querySelectorAll('#stage .mtile.on')];P.hold=true;state.zoom=16;P.refresh();return{old:P.old.length,connected:P.old.filter(n=>n.isConnected).length};});
  await page.waitForFunction(()=>window.__drawing45.pending.length>0);
  const during=await page.evaluate(()=>{const P=window.__drawing45;P.refresh();return{heldCallbacks:P.pending.length,oldConnected:P.old.filter(n=>n.isConnected).length,currentLoaded:document.querySelectorAll('#stage .mtile.on').length};});
  await page.evaluate(()=>{const P=window.__drawing45;P.hold=false;P.pending.splice(0).forEach(f=>f());});
  await page.waitForTimeout(100);
  return{before,during,limits:'Native wireMap exposes its tile refresh only; native Image onload callbacks held to reproduce incomplete replacement. Not a visible-frame or timing claim.'};
 }finally{await page.evaluate(()=>{const P=window.__drawing45;wireMap=P.nativeWire;Image=P.nativeImage;P.hold=false;P.pending.splice(0).forEach(f=>f());});}
};
