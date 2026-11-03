/* Author: Andrew Fisher. Read-only integration for the Still on site map view.
 * Run under /tmp/gc500-browser.lock with PAGE and private OUT outside Git.
 * The harness aborts operational writes. Fixtures replace presentation readers
 * temporarily; they never create or edit a delivery, board or collection record.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
assert(process.env.OUT,'OUT is required');
assert(process.env.PAGE||process.env.LIVE==='1','PAGE or LIVE=1 required');
assert(!(process.env.PAGE&&process.env.LIVE==='1'),'Live verification must read the served page');
const out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
assert(!out.startsWith(repo+path.sep),'Detailed evidence and screenshots must stay private');
fs.mkdirSync(out,{recursive:true});
process.env.GC500_CACHE=process.env.GC500_CACHE||fs.mkdtempSync(path.join(out,'fetch-'));
const {open}=require('../../toolchain/harness/open_page');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const safe=e=>String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key]').slice(0,350);
const result={author:'Andrew Fisher',suite:'onsite1290',checkedAt:new Date().toISOString(),passed:false,checks:[],errors:[],consoleErrors:[],recordWrites:0};
let session,child;
const check=(name,condition,detail)=>{result.checks.push({name,passed:!!condition,...(detail===undefined?{}:{detail})});assert(condition,name);};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
const waitPaint=async()=>child.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const state=()=>child.evaluate(()=>GC500StillOnSite1290.state);

async function focus(code,mode='original',rotation=0,pixels=160){
 return child.evaluate(({code,mode,rotation,pixels})=>{
  GC500Explorer.setMode(mode);stopCameraMotion813();
  const it=ITEMS.find(it=>it.code===code),s=parent.gc500MapShapes1060().refs[code];
  if(!it||!s)return {available:false};
  const pts=s.comps.flatMap(c=>c.poly.map(p=>toGeo(p[0]*SHEET_W,p[1]*SHEET_H)));
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  camera.cx=(Math.max(...xs)+Math.min(...xs))/2;camera.cy=(Math.max(...ys)+Math.min(...ys))/2;camera.rot=rotation;
  camera.z=Math.max(MIN_Z,Math.min(MAX_Z,pixels/(span*fitScale)));
  panel813(false);document.getElementById('xcard')?.classList.remove('show');requestPaint();
  return {available:true,shape:!!GC500Shape1060.projected1288(code)};
 },{code,mode,rotation,pixels});
}

// Observe canvas work itself: a diagnostic flag alone cannot prove a visible
// orange footprint, retained source doors, or suppression of green departure tags.
async function capture(code){
 return child.evaluate(async code=>{
  const projected=GC500Shape1060.projected1288(code),source=parent.gc500MapShapes1060().refs[code];
  if(!projected||!source)return {available:false};
  const calls=[],undo=[];
  for(const cv of [document.getElementById('shape1060'),document.getElementById('offsite1225')].filter(Boolean)){
   const g=cv.getContext('2d');let commands=[];
   const point=(x,y)=>{const m=g.getTransform();return [m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f];};
   for(const name of ['beginPath','moveTo','lineTo','bezierCurveTo','closePath','stroke','fill']){
    const old=g[name];undo.push(()=>g[name]=old);g[name]=function(...a){
     if(name==='beginPath')commands=[];
     else if(name==='moveTo'||name==='lineTo')commands.push([name==='moveTo'?'M':'L',...point(...a)]);
     else if(name==='bezierCurveTo')commands.push(['C',...point(a[0],a[1]),...point(a[2],a[3]),...point(a[4],a[5])]);
     else if(name==='closePath')commands.push(['Z']);
     else calls.push({canvas:cv.id,op:name,path:commands.map(p=>p.slice()),style:String(name==='stroke'?g.strokeStyle:g.fillStyle),dash:g.getLineDash(),alpha:g.globalAlpha});
     return old.apply(this,a);
    };
   }
  }
  try{drawMarks(currentView());await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}finally{undo.reverse().forEach(f=>f());}
  const now=GC500Shape1060.projected1288(code),same=(a,b)=>a.length===b.length&&a.every((v,i)=>v.length===b[i].length&&v.every((n,j)=>j===0?n===b[i][j]:Math.abs(n-b[i][j])<.7));
  const line=ps=>ps.map((p,i)=>[i?'L':'M',p.x*dpr,p.y*dpr]);
  const polygon=ps=>line(ps).concat([['Z']]);
  const orange=s=>/^#(?:ff6a13|ff7a1a|ff821f|ff8a3d|ff8b38|ff9a52|ffb172|e95700|f97316)$/i.test(s)||/^rgba?\(255,\s*(?:106|122|130|138|139|154|177),/.test(s);
  let polygons=0,orangePolygons=0,doors=0,paintedDoors=0;
  for(const part of now.parts){
   polygons++;const poly=polygon(part.points);if(calls.some(c=>c.op==='stroke'&&same(c.path,poly)&&orange(c.style)))orangePolygons++;
   for(const door of part.doors)for(const type of ['arcs','leaves','landing'])for(const ps of door[type]){
    if(ps.length<2)continue;doors++;const p=type==='arcs'&&ps.length===4?[['M',ps[0].x*dpr,ps[0].y*dpr],['C',...ps.slice(1).flatMap(p=>[p.x*dpr,p.y*dpr])]]:line(ps);
    if(calls.some(c=>c.op==='stroke'&&same(c.path,p)))paintedDoors++;
   }
  }
  return {available:true,code,polygons,orangePolygons,doors,paintedDoors,sourceMatch:now.parts.length===source.comps.length&&now.parts.every((p,i)=>JSON.stringify(p.sourcePoly)===JSON.stringify(source.comps[i].poly)),sourceHasNoUnitMap:parent.MasterShapes926.shape(code)?.units.length===0,departureMarkers:GC500Departure1211.markers1288,strokes:[...new Set(calls.filter(c=>c.op==='stroke').map(c=>c.style))],shapeFailed:GC500Shape1060.state.failed};
 },code);
}

async function shot(name){await session.page.waitForTimeout(200);await child.locator('#stage').screenshot({path:path.join(out,name+'-map.png'),timeout:15000});await session.page.screenshot({path:path.join(out,name+'-page.png'),timeout:15000});}

(async()=>{
 try{
  const bytes=process.env.PAGE?fs.readFileSync(process.env.PAGE):(await curlFetch('https://gc500-production.up.railway.app/v/Coates-GC500-2026?onsite1290='+Date.now(),{'Cache-Control':'no-store'},'GET')).body;
  result.dashboardSha256=crypto.createHash('sha256').update(bytes).digest('hex');
  if(process.env.EXPECTED_SHA)assert.equal(result.dashboardSha256,process.env.EXPECTED_SHA,'Wrong candidate bytes');
  session=await open({pageFile:process.env.PAGE,hash:'#map',W:1153,H:1280,dpr:1,mobile:true,gl:true,init:"localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');"});
  const p=session.page;p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(safe(m.text()));});
  await p.waitForFunction(()=>typeof go==='function'&&!!document.getElementById('expFrame'),null,{timeout:30000});await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>{const w=document.getElementById('expFrame')?.contentWindow;return w?.__ready&&w.GC500StillOnSite1290&&w.GC500Shape1060?.projected1288;},null,{timeout:45000});
  child=p.frames().find(f=>new URL(f.url()).pathname.endsWith('/explorer/index.html'));assert(child,'Explorer iframe missing');
  await child.waitForFunction(()=>MapUnits1147.state.ready&&GC500Shape1060.state.available&&GC500StillOnSite1290.state.ready,null,{timeout:30000});
  await child.evaluate(()=>GC500StillOnSite1290.setActive(false));
  result.native=await child.evaluate(()=>{
   const all=parent.Departure1211.all(),rows=all.filter(r=>r.arrival&&!r.complete&&(r.remaining>0||r.unknown||r.issues?.length));
   const boards=parent.VmsEquipment1103.model().boards;
   return {keys:rows.map(r=>r.key),rows,all:all.map(r=>({key:r.key,arrival:r.arrival,complete:r.complete})),boards:boards.map(b=>({key:b.key,delivery:b.delivery,on:b.on,received:b.received,departure:!!b.departure1211,positions:b.positions.map(x=>x.pos)})),state:GC500StillOnSite1290.state};
  });
  result.normalSelection=await child.evaluate(()=>{
   const cat=ITEMS.find(it=>it.cat?.host==='trade'&&it.places?.length)?.cat.id;
   const chip=[...document.querySelectorAll('#chips [data-cat]')].find(b=>b.dataset.cat===cat);if(chip)chip.click();
   GC500Search1210.search('buildings');stopCameraMotion813();panel813(false);
   return {category:document.querySelector('#chips [data-cat][aria-pressed=true]')?.dataset.cat||null,marks:marks.map(m=>({code:m.it.code,c:m.c}))};
  });
  check('Restoration starts from actual nonempty search results',result.normalSelection.marks.length>0);
  const button=child.locator('#still-onsite1290');check('One-press control is visible',await button.isVisible());
  await button.tap();await waitPaint();await p.waitForTimeout(250);
  result.active=await state();check('One real tap enables Still on site',result.active.active&&await button.getAttribute('aria-pressed')==='true');
  const activeKeys=new Set(result.active.refs.map(r=>r.key));
  check('Every authoritative remaining or review reference is included',result.native.keys.every(k=>activeKeys.has(k)));
  check('Native fully collected and not-arrived refs are excluded',result.active.refs.filter(r=>result.native.all.some(x=>x.key===r.key)).every(r=>result.native.keys.includes(r.key)));
  check('Reference count is not a fabricated unit count',result.active.references===new Set(result.active.refs.map(r=>r.key)).size);
  result.nativeVms=result.native.boards.filter(b=>b.on&&!b.departure).map(b=>({key:b.key,covered:activeKeys.has(b.key)||activeKeys.has(b.delivery)}));
  check('On-site physical VMS boards are represented',result.nativeVms.every(b=>b.covered));
  const chosen=await child.evaluate(()=>GC500StillOnSite1290.state.refs.find(r=>r.mapped&&GC500Shape1060.projected1288(r.code)&&parent.gc500MapShapes1060().refs[r.code]?.comps.some(c=>c.doors.length))?.code||GC500StillOnSite1290.state.refs.find(r=>r.mapped&&GC500Shape1060.projected1288(r.code))?.code);
  check('An authoritative remaining reference has supplied geometry',!!chosen);
  result.paints=[];
  for(const [mode,rotation]of [['original',0],['hybrid',37],['satellite',90]]){
   await focus(chosen,mode,rotation,180);await waitPaint();const r=await capture(chosen);result.paints.push({mode,...r});
   check(mode+': remaining equipment is painted orange using the source footprint',r.sourceMatch&&r.orangePolygons===r.polygons&&r.polygons>0);
   check(mode+': existing source doors remain visible',r.doors===r.paintedDoors);
   check(mode+': departed green markers are suppressed',r.departureMarkers.every(m=>m.kind==='onsite'||m.kind==='review'));
  }
  await shot('still-onsite-tablet');
  result.fallback=await child.evaluate(async()=>{
   const r=GC500StillOnSite1290.state.refs.find(r=>r.mapped&&r.codes.some(code=>!GC500Shape1060.projected1288(code)&&ITEMS.find(it=>it.code===code)?.location1210?.kind!=='vms'));
   if(!r)return {available:false};
   const code=r.codes.find(code=>!GC500Shape1060.projected1288(code)&&ITEMS.find(it=>it.code===code)?.location1210?.kind!=='vms'),it=ITEMS.find(x=>x.code===code),b=it.places[0],p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2);
   GC500Explorer.setMode('original');stopCameraMotion813();camera.cx=p.x;camera.cy=p.y;camera.rot=0;camera.z=Math.min(MAX_Z,4/fitScale);panel813(false);requestPaint();
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const markers=GC500Departure1211.markers1288.filter(m=>m.code===code),tag=markers[0]?.tag[0];
   return {available:true,code,markers,hit:!!tag&&markAt(tag.x+tag.w/2,tag.y+tag.h/2)?.it?.code===code,tap:tag?{x:tag.x+tag.w/2,y:tag.y+tag.h/2}:null};
  });
  if(result.fallback.available){
   check('Unknown outline is an honest selectable reference tag',result.fallback.hit&&result.fallback.markers.length===1&&result.fallback.markers.every(m=>!m.shape&&m.reason&&['onsite','review'].includes(m.kind)));
   await child.locator('#stage').tap({position:result.fallback.tap});await p.waitForTimeout(120);
   check('Touching the remaining reference tag selects the intended equipment',await child.evaluate(code=>selected?.code===code,result.fallback.code));
  }
  // Reader fixtures cover omissions that today's live record may not contain.
  const fixture=await child.evaluate(()=>{
   const rows=parent.Departure1211.all(),items=ITEMS.filter(it=>it.cat?.host==='trade'&&it.places.length&&parent.gc500MapShapes1060().refs[it.code]);
   const found=[],seen=new Set();for(const it of items){const key=it.reg?.sourceRequest1017?it.reg.sourceKey1017:it.code;if(seen.has(key))continue;seen.add(key);found.push({key,code:it.code});if(found.length===6)break;}
   return found;
  });assert(fixture.length===6,'Need six distinct real map references for reader fixtures');
  await p.evaluate(({fixtures})=>{
   window.__onsite1290OriginalReaders={departure:window.Departure1211,vms:window.VmsEquipment1103};
   const base=key=>({key,arrival:true,collected:0,remaining:1,complete:false,unknown:false,issues:[],items:[{type:'equipment',n:1}],label:'Still to leave',last:'No collection recorded'});
   window.__onsite1290Rows=[{...base(fixtures[0].key),remaining:4,items:[{type:'equipment',n:4}]},{...base(fixtures[1].key),collected:3,remaining:2,items:[{type:'equipment',n:2}]},{...base(fixtures[2].key),collected:1,remaining:0,complete:true},{...base(fixtures[3].key),arrival:false},{...base(fixtures[4].key),remaining:0,unknown:true},{...base(fixtures[5].key),remaining:0,issues:['Presentation fixture: collection scope needs review']},{...base('UNLOCATED_FIXTURE1290'),remaining:7}];
   window.Departure1211={...window.Departure1211,all:()=>window.__onsite1290Rows.map(r=>({...r}))};
   window.VmsEquipment1103={...window.VmsEquipment1103,model:()=>({boards:[]})};
  },{fixtures:fixture});
  try{
   await child.evaluate(()=>GC500StillOnSite1290.refresh());await waitPaint();result.fixture=await state();
   const byKey=new Map(result.fixture.refs.map(r=>[r.key,r]));
   check('Never-collected confirmed arrival remains included',byKey.has(fixture[0].key));
   check('Part-collected reference retains its known remaining count',byKey.get(fixture[1].key)?.remaining===2);
   check('Fully collected and not-arrived reader fixtures are excluded',!byKey.has(fixture[2].key)&&!byKey.has(fixture[3].key));
   check('Unknown quantity stays visible and explicitly unknown',byKey.get(fixture[4].key)?.unknown===true);
   check('Zero remaining with review issues stays visible for review',byKey.get(fixture[5].key)?.review===true);
   check('Unlocated equipment remains in the result list',byKey.has('UNLOCATED_FIXTURE1290')&&byKey.get('UNLOCATED_FIXTURE1290').mapped===false&&result.fixture.unmapped>0);
   await focus(fixture[1].code,'original',23,210);await waitPaint();result.partial=await capture(fixture[1].code);
   check('Partial count does not invent individual shape allocation',result.partial.sourceMatch&&result.partial.orangePolygons===result.partial.polygons);
   const cameraBefore=await child.evaluate(()=>({...camera}));
   await p.evaluate(()=>{window.__onsite1290Rows[0]={...window.__onsite1290Rows[0],remaining:0,collected:4,complete:true};});
   await child.evaluate(()=>complete897Pull());await waitPaint();
   result.refreshed=await state();check('Refresh reads the latest model and removes newly departed reference',!result.refreshed.refs.some(r=>r.key===fixture[0].key));
   const cameraAfter=await child.evaluate(()=>({...camera}));
   check('Background model refresh does not refit the user camera',['cx','cy','z','rot'].every(k=>Math.abs(cameraBefore[k]-cameraAfter[k])<1e-6));
   await child.locator('#still-onsite-list1290').tap();await p.waitForTimeout(120);
   result.list=await child.evaluate(()=>({text:document.body.innerText,unknownVisible:[...document.querySelectorAll('*')].some(e=>e.children.length===0&&e.textContent.includes('UNLOCATED_FIXTURE1290')&&e.getBoundingClientRect().height>0)}));
   check('List makes unlocated remaining references accessible',result.list.unknownVisible);
   check('Uncertain quantities have a clear review/confirmation label',/quantity to confirm|review/i.test(result.list.text));
   await child.locator('#still-onsite-panel1290 [data-close]').tap();
   await p.evaluate(()=>{window.__onsite1290Health=window.gc500MapStatus1009;window.gc500MapStatus1009=()=>({available:false,states:[]});});
   try{
    await child.evaluate(()=>GC500StillOnSite1290.refresh());await waitPaint();const unavailable=await state();
    check('Unavailable shared model never claims a known empty result',!unavailable.ready&&unavailable.refs.length===0);
    await child.locator('#still-onsite-list1290').tap();
    check('Unavailable state is explained in the accessible list',/not available|checking/i.test(await child.locator('#still-onsite-panel1290').innerText()));
    await child.locator('#still-onsite-panel1290 [data-close]').tap();
   }finally{await p.evaluate(()=>{window.gc500MapStatus1009=window.__onsite1290Health;delete window.__onsite1290Health;});}
  }finally{
   await p.evaluate(()=>{window.Departure1211=window.__onsite1290OriginalReaders.departure;window.VmsEquipment1103=window.__onsite1290OriginalReaders.vms;delete window.__onsite1290OriginalReaders;delete window.__onsite1290Rows;});
   await child.evaluate(()=>GC500StillOnSite1290.refresh());await waitPaint();
  }
  await child.evaluate(()=>GC500StillOnSite1290.setActive(false));await waitPaint();
  result.off=await state();check('Toggle off restores the ordinary map mode',!result.off.active&&await button.getAttribute('aria-pressed')==='false');
  result.selectionRestored=await child.evaluate(()=>({category:document.querySelector('#chips [data-cat][aria-pressed=true]')?.dataset.cat||null,marks:marks.map(m=>({code:m.it.code,c:m.c}))}));
  check('Toggle off restores the previous category and search marks',JSON.stringify(result.selectionRestored)===JSON.stringify(result.normalSelection));
  const gone=await child.evaluate(()=>ITEMS.find(it=>mapStatus1009(it)?.offsite1225&&GC500Shape1060.projected1288(it.code))?.code);
  if(gone){await focus(gone,'original',0,180);await waitPaint();result.restored=await capture(gone);check('Turning off restores departed equipment markers',result.restored.departureMarkers.some(m=>m.code===gone));}
  // A stale selected item must not leak into the filtered 3D view. Check actual
  // pin/model visibility and source geometry, not just the control's state.
  await child.evaluate(()=>GC500Explorer.mode3d(true));
  await child.waitForFunction(()=>document.getElementById('model3d')?.contentWindow?.GC500_3D?.state?.ready&&GC500StillOnSite1290.state.three?.hooked,null,{timeout:90000});
  const third=p.frames().find(f=>new URL(f.url()).pathname.endsWith('/poc3d/index.html'));assert(third,'3D iframe missing');
  result.threeBefore=await third.evaluate(()=>({pins:window.__pendingPins.map(p=>({k:p.k,ll:p.ll,c:p.c,n:p.n})),state:GC500EquipmentView1027.state}));
  const priorGone=result.threeBefore.pins.some(p=>p.k===gone)?gone:result.threeBefore.pins.find(p=>!result.active.refs.some(r=>r.codes.includes(p.k)))?.k;
  if(priorGone)await third.evaluate(code=>GC500_3D.ring(code),priorGone);
  result.geometryBefore=await child.evaluate(code=>GC500EquipmentBridge1027.snapshot([code]),chosen);
  await button.tap();await waitPaint();await p.waitForTimeout(2200);
  result.threeActive=await third.evaluate(()=>({pins:window.__pendingPins.map(p=>({k:p.k,ll:p.ll,c:p.c,n:p.n})),visible:window.__pinProbe().map(p=>p.k),active:GC500EquipmentView1027.state.active,models:GC500EquipmentView1027.state.models.filter(m=>GC500EquipmentView1027.samplingVisible(m.ref))}));
  const activeNow=await state(),norm=s=>String(s).toUpperCase().replace(/\s+/g,''),allowed=new Set(activeNow.refs.flatMap(r=>r.codes.map(norm))),expected3d=result.threeBefore.pins.filter(p=>allowed.has(norm(p.k))).map(p=>p.k).sort();
  check('3D pins are exactly the mapped remaining set',JSON.stringify(result.threeActive.pins.map(p=>p.k).sort())===JSON.stringify(expected3d));
  check('3D visible pins and models exclude unrelated or departed references',result.threeActive.visible.every(k=>allowed.has(norm(k)))&&result.threeActive.models.every(m=>allowed.has(norm(m.ref))));
  check('Prior excluded 3D selection does not bypass the filter',!result.threeActive.active||allowed.has(norm(result.threeActive.active)));
  check('3D remaining pin colour and count labels are explicit',result.threeActive.pins.every(p=>['#ff821f','#ffaaa3'].includes(p.c)&&/to collect|review|confirm/i.test(p.n)));
  result.geometryActive=await child.evaluate(code=>GC500EquipmentBridge1027.snapshot([code]),chosen);
  const gb=result.geometryBefore.items?.find(r=>norm(r.ref)===norm(chosen)),ga=result.geometryActive.items?.find(r=>norm(r.ref)===norm(chosen));
  if(gb&&ga)check('3D filter preserves source quantity, components and completion meaning',gb.quantity===ga.quantity&&JSON.stringify(gb.components)===JSON.stringify(ga.components)&&gb.complete===ga.complete&&gb.completionLabel===ga.completionLabel);
  await button.tap();await waitPaint();await p.waitForTimeout(150);
  result.threeRestored=await third.evaluate(()=>window.__pendingPins.map(p=>({k:p.k,ll:p.ll,c:p.c,n:p.n})));
  check('Turning the filter off restores the original 3D pins, positions and colours',JSON.stringify(result.threeRestored)===JSON.stringify(result.threeBefore.pins));
  await child.evaluate(()=>{GC500Explorer.mode3d(false);GC500Explorer.setMode('original');});
  await button.tap();await waitPaint();
  const departedVms=await child.evaluate(()=>ITEMS.find(it=>it.location1210?.kind==='vms'&&mapStatus1009(it)?.offsite1225&&!GC500StillOnSite1290.row(it))?.code);
  if(departedVms){
   await child.evaluate(code=>{selectCode(code,0,true);requestPaint();},departedVms);await waitPaint();
   result.departedVms=await child.evaluate(code=>({code,symbols:[...document.querySelectorAll('#vmsicons1211 button')].filter(b=>b.offsetWidth&&b.offsetHeight).map(b=>b.textContent),markers:GC500Departure1211.markers1288.filter(m=>m.code===code)}),departedVms);
   check('A selected departed VMS cannot reintroduce its marker',!result.departedVms.symbols.some(t=>norm(t).includes(norm(departedVms)))&&!result.departedVms.markers.length);
  }
  await child.evaluate(()=>GC500StillOnSite1290.setActive(false));await waitPaint();
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(250);await button.tap();await waitPaint();
  result.phone=await child.evaluate(()=>{const b=document.getElementById('still-onsite1290').getBoundingClientRect();return {button:{x:b.x,y:b.y,w:b.width,h:b.height},viewport:{w:innerWidth,h:innerHeight},bodyWidth:document.body.scrollWidth,documentWidth:document.documentElement.scrollWidth};});
  check('Phone control remains reachable with no horizontal page overflow',result.phone.button.w>=40&&result.phone.button.h>=40&&result.phone.button.x>=0&&result.phone.button.x+result.phone.button.w<=result.phone.viewport.w+1&&result.phone.bodyWidth<=result.phone.viewport.w+1&&result.phone.documentWidth<=result.phone.viewport.w+1);
  await shot('still-onsite-phone');
  result.errors=session.errors.map(safe);result.recordWrites=session.counts.blocked;
  check('No page or console errors',!result.errors.length&&!result.consoleErrors.length);check('No attempted operational record writes',!result.recordWrites);
  result.passed=true;
 }catch(e){result.failure=safe(e);}
 finally{if(session){result.errors=session.errors.map(safe);result.recordWrites=session.counts.blocked;await session.browser.close();}save();}
 console.log(JSON.stringify({passed:result.passed,sha256:result.dashboardSha256,checks:result.checks.length,errors:result.errors.length,consoleErrors:result.consoleErrors.length,recordWrites:result.recordWrites,failure:result.failure}));
 if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(safe(e));process.exitCode=1;});
