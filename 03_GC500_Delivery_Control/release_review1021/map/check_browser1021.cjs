/* Author: Andrew Fisher. Focused GET-only Gate 6 release verification.
   PAGE=<final candidate> MAP_ROOT=<six-file candidate> OUT=<private directory> MOB=1 node check_browser1021.cjs
   Root owns the browser lock. This script does not publish or write operational records. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{open}=require('../readonly1021.cjs');
const mobile=process.env.MOB==='1',out=process.env.OUT||'/tmp/private-gc500-gate6-release1021-map/browser-'+(mobile?'phone':'desktop');
const source=['v10.20_gate6_compound_LIVE','v10.20_gate6_compound_DRAFT'].map(name=>path.join(__dirname,'../..',name,'gate6_positions_1020.json')).find(file=>fs.existsSync(file));
if(!source)throw Error('Gate 6 reviewed positions not found in LIVE or DRAFT');
const POS=JSON.parse(fs.readFileSync(source,'utf8'));
const refs=Object.keys(POS.refs),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const report={author:'Andrew Fisher',mobile,checks:[],measurements:{}};
if(process.env.PAGE)report.pageSha256=crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});
fs.mkdirSync(out,{recursive:true});let h,standalone;
(async()=>{try{
 h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1});
 const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
 const before=await p.evaluate(()=>({native:JSON.stringify(S),version:SYNC.backend.readVersion821()}));report.nativeVersion=before.version;
 await p.waitForFunction(()=>EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});
 const f=p.frames().find(frame=>/\/explorer\/index\.html(?:\?|$)/.test(frame.url()));if(!f)throw Error('Embedded explorer frame not found');
 await f.evaluate(()=>GC500Explorer.ready);await f.evaluate(()=>GC500Explorer.refresh());
 const facts=await p.evaluate(keys=>Object.fromEntries(keys.map(key=>{
  const a=assetOf(key),m=MASTER_LOC[key],d=dest782(a),c=gc500PlanCard(key);
  return [key,{pt:m.pt,ll:m.ll,shape:MASTER_SHAPES926_DATA.shapes[key],
   destination:{kind:d.kind,approx:d.approx,ll:d.ll,label:d.label,nav:d.nav},
   source:srcWords816(a,d),noDrop:noDrop782(a),card:{revision:c.revision1021,pinned:c.pinned},
   images:dpMasterImgs(a).map(img=>({inline:String(img.src||'').startsWith('data:image/webp'),length:String(img.src||'').length}))}];
 })),refs);
 for(const ref of refs){const value=facts[ref],expected=POS.refs[ref];
  check(ref+' shared pin and full footprint equal the reviewed revision',same(value.pt,expected.new.pt)&&same(value.ll,expected.new.ll)&&same(value.shape,expected.shape));
  check(ref+' destination stays at its revised approximate position',value.destination.kind==='revised'&&value.destination.approx===true&&same([value.destination.ll.lat,value.destination.ll.lon],expected.new.ll)&&value.noDrop===false,value.destination);
  check(ref+' source is revised drawing, without an onsite-pin claim',/Revised Gate 6.*approximate/.test(value.source)&&/14 Oct 2026.*approximate/.test(value.card.revision||'')&&!/Pinned on the ground/i.test(value.card.pinned||''),{source:value.source,card:value.card});
  if(ref!=='GN06')check(ref+' both revised master pictures resolve',value.images.length===2&&value.images.every(img=>img.inline&&img.length>1000),value.images);
 }
 for(const ref of ['WC49','GN06']){
  await p.evaluate(key=>openAsset(key),ref);
  await p.locator('#drawer.on .srcp816').waitFor({state:'visible',timeout:12000});
  const drawer=await p.locator('#drawer .srcp816').innerText();
  check(ref+' rendered drawer labels the position approximate',/Revised Gate 6.*approximate/i.test(drawer)&&!/master plan.*on the unit|surveyed|pinned on the ground/i.test(drawer),drawer);
  if(ref==='GN06'){await p.locator('#drawer .srcp816').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'generator-source.png')});}
  await p.evaluate(()=>state.drawerClose());
 }
 const embedded=await f.evaluate(keys=>({rows:gate6Rows1021(),items:ITEMS.filter(row=>keys.includes(row.code)).map(row=>({ref:row.code,place:row.places[0],source:placeWord(row)})),hasRenderer:typeof drawGate6Revision1021==='function'}),refs);
 check('Embedded overlay reads all five shared revised footprints',embedded.hasRenderer&&embedded.rows.length===5&&embedded.rows.every(row=>same(row.pt,POS.refs[row.ref].new.pt)&&same(row.polygons,POS.refs[row.ref].shape.c.map(unit=>unit.p))));
 check('Embedded search results identify the revised drawing source',embedded.items.length===5&&embedded.items.every(row=>/Revised Gate 6.*approximate/.test(row.source)),embedded.items);
 await f.evaluate(()=>{stopCameraMotion813();setMode('original');GC500Explorer.find('WC49');});
 await f.waitForFunction(()=>selected?.code==='WC49'&&!gotoAnim887&&!interacting,null,{timeout:12000});
 await f.evaluate(()=>{
  stopCameraMotion813();const rows=gate6Rows1021(),points=rows.flatMap(row=>row.polygons.flat());
  const xs=points.map(p=>p[0]*SHEET_W),ys=points.map(p=>p[1]*SHEET_H);
  camera.cx=(Math.min(...xs)+Math.max(...xs))/2;camera.cy=(Math.min(...ys)+Math.max(...ys))/2;
  const viewWidth=Math.max(Math.max(...xs)-Math.min(...xs)+35,(Math.max(...ys)-Math.min(...ys)+42)*sw/sh);
  camera.z=Math.min(MAX_Z,sw/(fitScale*viewWidth));camera.rot=0;changeView(false);
 });
 await f.waitForFunction(()=>vtBusy===0&&vtQueue.size===0,null,{timeout:15000}).catch(()=>{});
 const card=await f.locator('#xcard').innerText();
 check('Selected map card states the revised approximate source',/iEDM Gate 6 layout.*14 Oct 2026.*approximate/.test(card),card);
 await p.screenshot({path:path.join(out,'gate6-wc49-card.png')});
 const refreshed=await f.evaluate(()=>{
  const original=hostPlan,cameraBefore=JSON.stringify(camera),codeBefore=selected?.code;
  hostPlan=function(){const model=original();return {...model,items:model.items.map((row,i)=>i?row:{...row,releaseReview1021:true})};};
  try{GC500Explorer.refresh(true);return {cameraPreserved:JSON.stringify(camera)===cameraBefore,selectionPreserved:selected?.code===codeBefore,selection:selected?.code};}
  finally{hostPlan=original;GC500Explorer.refresh(true);}
 });
 check('Changed read-only refresh preserves camera and selection',refreshed.cameraPreserved&&refreshed.selectionPreserved,refreshed);
 const close=f.locator('#xcard [data-xclose]');if(await close.isVisible())await close.click();
 const rendered=await f.evaluate(()=>{const M=sheetToDevice(dpr*currentView().scale,canvas.width,canvas.height);return {visible:gate6Projected1021(gate6Rows1021(),M,canvas.width,canvas.height).map(row=>row.ref),selected:selected?.code,camera:{...camera}};});
 report.measurements.map=rendered;check('Compound screenshot contains all five revised footprints',refs.every(ref=>rendered.visible.includes(ref)),rendered.visible);
 await p.screenshot({path:path.join(out,'gate6-compound.png')});
 check('Main-page native record stays unchanged',await p.evaluate(native=>JSON.stringify(S)===native,before.native));

 // Standalone 2D has no parent page; it must use its refreshed snapshot. The 3D snapshot is inspected by GET,
 // without starting a billable 3D map session or claiming that a WebGL scene has been visually checked.
 standalone=await p.context().newPage();standalone.on('pageerror',error=>h.errors.push('standalone: '+error.message));
 await standalone.goto('https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html',{waitUntil:'load',timeout:90000});
 await standalone.waitForFunction(()=>window.__ready===true,null,{timeout:90000});
 const snapshots=await standalone.evaluate(async keys=>({
  isStandalone:window.parent===window,
  items:hostPlan().items.filter(row=>keys.includes(row.key)),rows:gate6Rows1021(),
  three:(await (await fetch('../poc3d/units3d.json',{cache:'no-store'})).json()).pins.filter(pin=>keys.includes(pin.k))
 }),refs);
 check('Standalone 2D uses matching revised coordinates and source',snapshots.isStandalone&&snapshots.items.length===5&&snapshots.items.every(row=>same(row.pt,POS.refs[row.key].new.pt)&&/Revised Gate 6.*approximate/.test(row.placedHow||'')));
 check('Standalone overlay keeps the same revised footprint geometry',snapshots.rows.length===5&&snapshots.rows.every(row=>same(row.polygons,POS.refs[row.ref].shape.c.map(unit=>unit.p))));
 check('Standalone 3D source snapshot matches the same five destinations',snapshots.three.length===5&&snapshots.three.every(pin=>same(pin.ll,POS.refs[pin.k].new.ll)));
 check('No operational write attempts',h.counts.blocked===0,h.counts);
 check('No browser JavaScript errors',h.errors.length===0,h.errors);
 }catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
 finally{
  if(report.checks.some(row=>!row.pass))process.exitCode=1;
  if(h){report.counts=h.counts;report.errors=h.errors;await h.browser.close();}
  fs.writeFileSync(path.join(out,'gate6-browser.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({mobile,pageSha256:report.pageSha256,nativeVersion:report.nativeVersion,checks:report.checks.length,failed:report.checks.filter(row=>!row.pass),errors:report.errors,failure:report.failure,out}));
 }
})();
