/* Author: Andrew Fisher. Actual read-only map adapter, geometry and departure checks.
 * PAGE supplies the exact local dashboard; omit PAGE with LIVE=1 for public UI.
 * Run serially under /tmp/gc500-browser.lock. OUT must be private, outside Git.
 * This check intentionally fails on v12.85: both adapters are absent.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
assert(process.env.OUT,'OUT is required');
const out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
assert(!out.startsWith(repo+path.sep),'Evidence must remain outside Git');
fs.mkdirSync(out,{recursive:true});
process.env.GC500_CACHE=process.env.GC500_CACHE||fs.mkdtempSync(path.join(out,'fetch-'));
assert(process.env.PAGE||process.env.LIVE==='1','PAGE or LIVE=1 required');
assert(!(process.env.PAGE&&process.env.LIVE==='1'),'Live verification cannot override the public dashboard');
const {open}=require('../../toolchain/harness/open_page');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const PUBLIC='https://gc500-production.up.railway.app/v/Coates-GC500-2026';
const expectedScripts='explorer.js?v=641db3a7b324|explorer-merge.js?v=c62854961e0d|fencing-map-core.js?v=0c26c3b7777f|fencing-map-explorer.js?v=e3a4bef6c17d|explorer-fix864.js?v=d7041320fc3f|explorer-fix887.js?v=6996471a6a0f';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=e=>String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key]').slice(0,300);
const result={author:'Andrew Fisher',suite:'map1286',checkedAt:new Date().toISOString(),passed:false,source:process.env.LIVE==='1'?'fresh public page and live map files':'exact local dashboard and live map files',errors:[],consoleErrors:[],recordWrites:0};
let s;
(async()=>{
 try{
  const bytes=process.env.PAGE?fs.readFileSync(process.env.PAGE):(await curlFetch(PUBLIC+'?map1286='+Date.now(),{'Cache-Control':'no-store'},'GET')).body;
  result.dashboardSha256=sha(bytes);
  if(process.env.EXPECTED_SHA)assert.equal(result.dashboardSha256,process.env.EXPECTED_SHA,'Wrong parent dashboard');
  s=await open({pageFile:process.env.PAGE,hash:'#map',W:390,H:844,dpr:2,mobile:true,gl:true,init:"localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');"});
  const p=s.page;p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(safe(m.text()));});
  await p.waitForFunction(()=>typeof go==='function'&&!!document.getElementById('expFrame'),null,{timeout:30000});
  await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>{const w=document.getElementById('expFrame')?.contentWindow;return w?.__ready&&w.document.readyState==='complete';},null,{timeout:45000});
  await p.waitForTimeout(1200);
  const child=p.frames().find(f=>new URL(f.url()).pathname.endsWith('/explorer/index.html'));assert(child,'Explorer iframe missing');
  result.mounts=await child.evaluate(()=>({shape:!!window.GC500Shape1060,units:!!window.MapUnits1147,spot:!!window.GC500Spot1117,departure:!!window.GC500Departure1211,search:!!window.GC500Search1210,area:!!window.GC500Area1206,demob:!!window.GC500Demob1211,scripts:[...document.querySelectorAll('script[src]')].map(x=>x.getAttribute('src')).join('|')}));
  assert.equal(result.mounts.scripts,expectedScripts,'Unexpected live map script identity');
  assert(result.mounts.shape,'Equipment shapes/doors adapter did not mount');
  assert(result.mounts.units,'Equipment symbol adapter did not mount');
  assert(result.mounts.spot,'Map location adapter did not mount');
  assert(result.mounts.departure,'Collection/departure adapter did not mount');
  assert(result.mounts.search&&result.mounts.area&&result.mounts.demob,'A dependent map tool did not mount');
  await child.waitForFunction(()=>MapUnits1147.state.ready&&GC500Shape1060.state.available,null,{timeout:15000});
  await p.waitForFunction(()=>window.gc500MapStatus1009?.().available&&window.Departure1211?.mapStates,null,{timeout:30000});
  result.departure=await child.evaluate(()=>{
   GC500MapCompletion1009.pull();
   const rows=parent.Departure1211.mapStates(),byKey=new Map(rows.map(r=>[norm(r.key),r]));
   let checked=0,mismatches=0,complete=0,partial=0,review=0;
   for(const it of ITEMS){const key=norm(it.reg?.sourceRequest1017?it.reg.sourceKey1017:it.code),d=byKey.get(key);if(!d?.collected)continue;
    const actual=mapStatus1009(it),expected=d.issues.length?'review':d.complete?'moved':'partial';checked++;
    if(expected==='moved')complete++;else if(expected==='partial')partial++;else review++;
    if(!actual||actual.state!==expected||actual.label!==d.label||actual.offsite1225!==true)mismatches++;
   }
   return {checked,mismatches,complete,partial,review};
  });
  assert(result.departure.checked>0,'No recorded departure available for the integration check');
  assert.equal(result.departure.mismatches,0,'Map departure display differs from the native collection model');
  // Exercise the presentation bridge with synthetic rows only. Native records,
  // native completion functions and collection records are never mutated.
  result.statusBridge=await child.evaluate(()=>{
   const host=parent,original=host.gc500MapStatus1009,fixture='MAP1286TEST',it={code:fixture,cat:{host:'trade'}};
   const checked=[];
   try{
    for(const state of ['complete','incomplete','partial','review','unknown','cancelled','moved']){
     host.gc500MapStatus1009=()=>({available:true,states:[{key:fixture,state,label:'Presentation fixture',quantity:null}]});
     complete897Pull();checked.push(mapStatus1009(it)?.state===state);
    }
    host.gc500MapStatus1009=()=>({available:false,states:[]});complete897Pull();checked.push(mapStatus1009(it)?.state==='unknown');
   }finally{host.gc500MapStatus1009=original;complete897Pull();}
   return {cases:checked.length,passed:checked.every(Boolean),nativeReadRestored:host.gc500MapStatus1009===original};
  });
  assert(result.statusBridge.passed&&result.statusBridge.nativeReadRestored,'Status bridge failed or native reader was not restored');
  // A source-family switch fits the map and clears selection by design. Select
  // the door-bearing reference after that switch, as the actual UI requires.
  await child.evaluate(()=>GC500Explorer.setMode('satellite'));
  result.geometry=await child.evaluate(()=>{
   const shapes=parent.gc500MapShapes1060(),departed=new Set(parent.Departure1211.mapStates().filter(r=>r.collected).map(r=>norm(r.key)));
   const candidates=ITEMS.filter(it=>{const s=shapes.refs[it.code];return it.cat?.host==='trade'&&it.places?.length===1&&!it.placedHow?.startsWith('Andrew’s pin')&&s&&!s.shared&&s.comps.some(c=>c.doors.some(d=>d.arcs.length||d.leaves.length));}).sort((a,b)=>Number(departed.has(a.code))-Number(departed.has(b.code)));
   const chosen=candidates.find(it=>GC500Shape1060.at(it.code));if(!chosen)return {available:false};
   selectCode(chosen.code,0,true);const s=shapes.refs[chosen.code];
   return {available:true,components:s.comps.length,recordedDoors:s.comps.reduce((n,c)=>n+c.doors.length,0),recordedSwingLines:s.comps.reduce((n,c)=>n+c.doors.reduce((k,d)=>k+d.arcs.length+d.leaves.length,0),0)};
  });
  assert(result.geometry.available&&result.geometry.recordedDoors>0&&result.geometry.recordedSwingLines>0,'No traced equipment with recorded door swings selected');
  await child.locator('#xcard [data-xclose]').click();
  await child.waitForFunction(()=>{const f=window.__frames?.at(-1);return f?.mode==='satellite'&&f.ready&&!f.satBlank&&!f.satMiss;},null,{timeout:30000});
  await child.waitForFunction(()=>GC500Shape1060.state.drawn>0&&GC500Shape1060.state.paints>0,null,{timeout:10000});
  await p.waitForTimeout(900);
  result.geometry.render=await child.evaluate(()=>{
   const cv=document.getElementById('shape1060'),pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let ink=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])ink++;
   return {...GC500Shape1060.state,visibleInkPixels:ink,canvasWidth:cv.width,canvasHeight:cv.height,selectedHasShape:!!GC500Shape1060.at(selected?.code)};
  });
  assert(result.geometry.render.selectedHasShape&&result.geometry.render.visibleInkPixels>20,'Selected traced equipment did not paint');
  assert.equal(result.geometry.render.failed,0,'Equipment shape renderer reported an error');
  await p.screenshot({path:path.join(out,'equipment-door-phone.png'),timeout:15000});
  await child.locator('#stage').screenshot({path:path.join(out,'equipment-door-map.png'),timeout:15000});
  result.modeChecks=await child.evaluate(()=>{
   const modes=[];for(const mode of ['hybrid','satellite','original']){GC500Explorer.setMode(mode);GC500MapCompletion1009.pull();modes.push({mode,shapes:!!GC500Shape1060,departures:!!GC500Departure1211,units:!!MapUnits1147});}return modes;
  });
  assert(result.modeChecks.every(x=>x.shapes&&x.departures&&x.units),'Mode switch lost an adapter');
  // Open the unchanged native photographic 3D scene and focus one existing
  // equipment record. This exercises retained geometry; no fixture models,
  // coordinates, door state, records or photographic source are supplied.
  await child.evaluate(()=>GC500Explorer.mode3d(true));
  await p.waitForFunction(()=>{const w=document.getElementById('expFrame')?.contentWindow?.document.getElementById('model3d')?.contentWindow;return w?.GC500_3D?.state.ready&&w.GC500EquipmentView1027?.state.enabled;},null,{timeout:60000});
  const scene=p.frames().find(f=>new URL(f.url()).pathname.endsWith('/poc3d/index.html'));assert(scene,'Retained 3D iframe missing');
  result.threeD=await scene.evaluate(()=>{
   const api=GC500EquipmentView1027,cat=parent.GC500EquipmentBridge1027.catalogue();
   const row=cat.find(r=>r.location&&PINS.some(p=>p.k===r.ref));
   return {ready:GC500_3D.state.ready,equipmentEnabled:api.state.enabled,nativeCatalogue:cat.length>0,focused:!!row&&GC500_3D.find(row.ref),googlePhotographicSource:!!tileset&&performance.getEntriesByType('resource').some(r=>r.name.startsWith('https://tile.googleapis.com/v1/3dtiles/root.json'))};
  });
  assert(Object.values(result.threeD).every(Boolean),'Retained 3D scene, native equipment or photographic source unavailable');
  await scene.waitForFunction(()=>{
   const api=GC500EquipmentView1027;api.refresh();
   const row=api.state.models.find(m=>m.ref===api.state.active&&m.ready&&!m.failed&&api.samplingVisible(m.ref));
   const model=row&&api.exclude().find(m=>m.id?._gc?.k===row.ref&&m.ready&&m.show);
   if(!model||!model.boundingSphere)return false;
   const camera=viewer.camera,volume=camera.frustum.computeCullingVolume(camera.positionWC,camera.directionWC,camera.upWC);
   return volume.computeVisibility(model.boundingSphere)!==Cesium.Intersect.OUTSIDE;
  },null,{timeout:45000});
  result.threeD.nativeModelReadyAndVisible=true;
  result.threeD.failedModels=await scene.evaluate(()=>GC500EquipmentView1027.state.models.filter(m=>m.failed).length);
  assert.equal(result.threeD.failedModels,0,'Existing 3D equipment model failed');
  await child.evaluate(()=>GC500Explorer.mode3d(false));
  const identity=await p.evaluate(()=>{window.__map1286Frame=document.getElementById('expFrame').contentWindow;go('today');return true;});
  assert(identity);await p.waitForTimeout(200);await p.evaluate(()=>go('map'));await p.waitForTimeout(600);
  result.returnChecks=await p.evaluate(()=>{const w=document.getElementById('expFrame').contentWindow;return {sameFrame:w===window.__map1286Frame,shapes:!!w.GC500Shape1060,departure:!!w.GC500Departure1211};});
  assert(Object.values(result.returnChecks).every(Boolean),'Return to map lost the frame or adapters');
  result.errors=s.errors.map(safe);result.recordWrites=s.counts.blocked;
  assert.equal(result.errors.length,0,'Page runtime errors');assert.equal(result.consoleErrors.length,0,'Console errors');assert.equal(result.recordWrites,0,'Attempted operational write');
  result.passed=true;
 }catch(e){result.failure=safe(e);}
 finally{
  if(s){result.errors=s.errors.map(safe);result.recordWrites=s.counts.blocked;await s.browser.close();}
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
 }
 console.log(JSON.stringify({passed:result.passed,sha256:result.dashboardSha256,mounts:result.mounts,departureChecks:result.departure?.checked,statusCases:result.statusBridge?.cases,doorGeometry:result.geometry?.available,threeD:result.threeD,errors:result.errors.length,consoleErrors:result.consoleErrors.length,recordWrites:result.recordWrites,failure:result.failure}));
 if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(safe(e));process.exitCode=1;});
