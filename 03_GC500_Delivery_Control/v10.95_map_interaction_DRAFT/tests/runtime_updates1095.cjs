/* Author: Andrew Fisher. Disposable browser-only source deltas; no save or remote write is invoked. */
'use strict';
const assert=require('node:assert/strict');
module.exports=async function runtimeUpdates(page,frame){
 const checks=[];
 const check=(name,value)=>{assert(value,name);checks.push(name);};
 const onDrawing=await frame.evaluate(()=>ITEMS.filter(i=>i.places.length).map(i=>i.code));
 const target=await page.evaluate(keys=>holdAssets(()=>
  allAssets().find(a=>keys.includes(a.key)&&!a._cancelled&&andrewPin1084(a)&&
   window.gc500MapStatus1009([a.key]).states[0]?.quantity?.items.some(i=>Number.isFinite(i.quantity)))?.key
 ),onDrawing);
 check('an eligible approved reference with typed quantity is available',!!target);
 await frame.evaluate(code=>GC500Explorer.find(code),target);
 await frame.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:15000});
 await frame.evaluate(()=>{GC500Explorer.zoom(160);camera.rot=37;changeView(false);});
 await page.waitForTimeout(250);
 const before=await frame.evaluate(()=>{const card=document.getElementById('xcard'),details=card?.querySelector('details');if(details)details.open=true;if(card)card.scrollTop=32;return {camera:JSON.stringify(camera),selected:selected?.code,places:JSON.stringify(selected?.places),details:details?.open??null,scroll:card?.scrollTop??null};});
 let delta,after;
 try{
  delta=await page.evaluate(code=>{
   const a=assetOf(code),p=andrewPin1084(a);if(!p||!S.places[p.key])throw Error('Approved source must exist in native places');
   window.__mapUpdate1095={key:p.key,source:S.places[p.key],status:window.gc500MapStatus1009};
   const from=window.gc500MapStatus1009([code]).states.find(r=>r.key===code),at=from.quantity.items.findIndex(i=>Number.isFinite(i.quantity));
   const quantity=from.quantity.items[at].quantity+1;
   S.places[p.key]={...S.places[p.key],lat:S.places[p.key].lat+0.000001};
   window.gc500MapStatus1009=function(keys){const snap=__mapUpdate1095.status(keys);return {...snap,states:snap.states.map(row=>row.key!==code?row:{...row,quantity:{...row.quantity,items:row.quantity.items.map((item,index)=>index===at?{...item,quantity}:item)}})};};
   sharedCache975();const start=performance.now();const refreshed=expRefresh();return {at,quantity,refreshed,start,host:gc500PlanItems().placed.find(r=>r.key===code)};
  },target);
  await frame.waitForFunction(({code,at,quantity})=>selected?.code===code&&mapStatus1009(selected)?.quantity1010.items[at]?.quantity===quantity,{code:target,...delta},{timeout:5000,polling:50});
  await frame.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  after=await frame.evaluate(()=>{const card=document.getElementById('xcard');return {camera:JSON.stringify(camera),selected:selected?.code,places:JSON.stringify(selected?.places),selectedCurrent:selected===ITEMS.find(r=>r.code===selected?.code),host:HOST.placed?.find(r=>r.key===selected?.code),shape:GC500Shape1060.at(selected?.code),details:card?.querySelector('details')?.open??null,scroll:card?.scrollTop??null};});
  const afterSource=await page.evaluate(code=>({place:S.places[window.__mapUpdate1095.key],host:gc500PlanItems().placed.find(r=>r.key===code)}),target);
  if(process.env.OUT)require('node:fs').writeFileSync(require('node:path').join(process.env.OUT,'runtime-refresh-private.json'),JSON.stringify({before,after,delta,afterSource}));
  check('explicit refresh propagates changed host quantity into existing iframe',delta.refreshed===true);
  check('existing iframe uses changed approved pin coordinates',JSON.parse(before.places).length>0&&JSON.parse(after.places).length>0&&before.places!==after.places);
  check('refresh retains exact camera at 16000 percent and rotated view',before.camera===after.camera);
  check('refresh retains selected reference',before.selected===after.selected);
  check('refresh retains open card sections and reading position',before.details===after.details&&before.scroll===after.scroll);
  check('approved pin has no historical footprint',after.shape===null);
  delta.repaintMs=await page.evaluate(start=>performance.now()-start,delta.start);
 }finally{
  const restored=await page.evaluate(()=>{const x=window.__mapUpdate1095;if(!x)return false;S.places[x.key]=x.source;window.gc500MapStatus1009=x.status;delete window.__mapUpdate1095;sharedCache975();expRefresh();return S.places[x.key]===x.source&&window.gc500MapStatus1009===x.status;});
  check('synthetic pin and quantity getter restored exactly',restored);
 }
 // Put an approved synthetic pin within centimetres of a traced master shape.
 // Exact native state is restored in finally; persistence is never called.
 const tiny=await page.evaluate(()=>holdAssets(()=>allAssets().find(a=>!a._cancelled&&!andrewPin1084(a)&&masterUnit(a.key)?.ll&&window.gc500MapShapes1060()?.refs[a.key]&&!window.gc500MapShapes1060().refs[a.key].shared)?.key));
 check('a master-only reference is available for tiny-move regression',!!tiny);
 let tinyResult;
 try{
  await page.evaluate(code=>{const a=assetOf(code),ll=masterUnit(code).ll;window.__mapTiny1095={key:code,had:Object.prototype.hasOwnProperty.call(S.places,code),source:S.places[code]};S.places[code]={lat:ll[0]+0.00000001,lon:ll[1],by:'Andrew Fisher',how:"Andrew Fisher’s provided pin",at:'2099-01-01T00:00:00Z'};sharedCache975();expRefresh();},tiny);
  await frame.evaluate(code=>GC500Explorer.find(code),tiny);await frame.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:15000});
  tinyResult=await frame.evaluate(()=>{const b=selected.places[0],q=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2);camera={...camera,cx:q.x,cy:q.y,z:160,rot:37};changeView(false);drawMarks(currentView());const c=applyM(sheetToDevice(currentView().scale,sw,sh),q.x,q.y);return {shape:GC500Shape1060.at(selected.code),hit:(markAt(c.x,c.y)||itemAt887(c.x,c.y))?.it?.code===selected.code,centreError:Math.hypot(c.x-sw/2,c.y-sh/2),zoom:camera.z};});
  check('tiny approved move suppresses stale footprint at deep rotated zoom',tinyResult.shape===null);
  check('selected approved marker remains a precise hit target',tinyResult.hit&&tinyResult.centreError<1e-7&&tinyResult.zoom===160);
 }finally{
  const restored=await page.evaluate(()=>{const x=window.__mapTiny1095;if(!x)return false;if(x.had)S.places[x.key]=x.source;else delete S.places[x.key];delete window.__mapTiny1095;sharedCache975();expRefresh();return Object.prototype.hasOwnProperty.call(S.places,x.key)===x.had&&S.places[x.key]===x.source;});
  check('tiny-move source restored exactly',restored);
 }
 return {author:'Andrew Fisher',checks,refreshRepaintMs:delta?.repaintMs,tinyResult,scope:'Disposable in-memory host source deltas, restored; no save or remote write. Cross-device network latency is not measured by this test.'};
};
