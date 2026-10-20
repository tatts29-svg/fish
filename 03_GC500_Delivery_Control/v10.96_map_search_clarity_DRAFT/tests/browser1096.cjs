/* Author: Andrew Fisher. Read-only dashboard map regression; private evidence stays outside Git. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const out=process.env.OUT,mobile=process.env.MOB==='1',wide=process.env.WIDE==='1';
assert(out&&!path.resolve(out).startsWith(path.resolve(__dirname,'../../..')+'/'),'Private OUT required');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const h=await open({pageFile:process.env.PAGE,hash:'#map',W:mobile?390:wide?3840:1440,H:mobile?844:wide?2160:1000,dpr:mobile?2:1,mobile,gl:true});
 let checks=0;const check=(ok,why)=>{assert(ok,why);checks++;};
 try{
  const p=h.page;await p.waitForFunction(()=>EXP.frame?.contentWindow?.MapExplorer1096&&SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
  const f=await(await p.$('#expFrame')).contentFrame();
  const before=await p.evaluate(()=>({s:JSON.stringify(S),money:JSON.stringify(pl770Model()),svc:document.getElementById('svc1067-script').textContent}));
  const info=await f.evaluate(()=>{
   const native=GC500Explorer.refresh;let calls=0;GC500Explorer.refresh=function(){calls++;return native.apply(this,arguments);};
   const times=[];for(let i=0;i<6;i++)for(const q of ['generator','building','toilet','P45','VMS','water barrier']){document.getElementById('q').value=q;const at=performance.now();search();times.push(performance.now()-at);}
   GC500Explorer.refresh=native;times.sort((a,b)=>a-b);
   return {calls,median:times[Math.floor(times.length/2)],p95:times[Math.floor(times.length*.95)],sceneReady,items:ITEMS.length,stats:MapExplorer1096.stats};
  });
  check(info.calls===0,'Typing never triggers full host refresh');
  check(info.p95<100,'Search responds within 100ms in this browser');
  const identifiers=await p.evaluate(()=>holdAssets(()=>{
   const model=gc500PlanItems();
   return [...model.items,...model.unplaced,...model.placed].filter(row=>row.search1096?.identifiers.length).map(row=>({ref:row.key,ids:row.search1096.identifiers,regos:row.search1096.regos}));
  }));
  const lookup=await f.evaluate(rows=>{
   const failures=[],checked=[];
   for(const row of rows)for(const id of row.ids){
    document.getElementById('q').value=id;search();
    const codes=[...document.querySelectorAll('#results button[data-map1096] b')].map(n=>MapSearch1096.compact(n.textContent));
    if(!codes.includes(MapSearch1096.compact(row.ref)))failures.push({ref:row.ref});
    checked.push(true);
   }return {checks:checked.length,failures};
  },identifiers);
  fs.writeFileSync(out+'/identifier-checks.json',JSON.stringify(lookup));
  check(lookup.checks>20&&lookup.failures.length===0,'Every current projected asset/rego maps back to its correct reference');
  const target=await f.evaluate(()=>ITEMS.find(i=>i.reg?.asset_numbers&&i.places.length&&i.cat?.host==='trade').code);
  await f.evaluate(()=>panel813(true));
  await f.locator('#q').fill(target);await f.locator('#q').press('ArrowDown');await f.locator('#q').press('Enter');
  const jumped=await f.evaluate(code=>({selected:selected?.code,gliding:gotoAnim887,expected:ITEMS.find(i=>i.code===code).places[0],camera:{...camera}}),target);
  check(jumped.selected===target&&jumped.gliding===0,'Keyboard selection goes directly to selected map location');
  check(await f.evaluate(()=>{const bb=selected.places[0],g=geoRect(bb);return Math.abs(camera.cx-(g[0]+g[2])/2)<.01&&Math.abs(camera.cy-(g[1]+g[3])/2)<.01;}),'Selection camera uses the native mapped destination');
  await f.evaluate(()=>panel813(true));await f.locator('#q').fill('NOTAREALASSET999999XYZ');
  check(await f.locator('#results button[data-map1096]').count()===0,'Unknown identifiers never navigate to a guessed match');
  const noPosition=await f.evaluate(()=>ITEMS.find(i=>!i.places.length)?.code||null);
  if(noPosition){
   const camera=await f.evaluate(()=>JSON.stringify(camera));
   await f.locator('#q').fill(noPosition);await f.locator('#q').press('Enter');
   check(await f.evaluate(()=>JSON.stringify(camera))===camera,'Unplaced result retains camera instead of inventing location');
   check(await f.locator('#toast').textContent().then(t=>/no.*(?:position|place)|does not label/.test(t)),'Unplaced result explains missing position');
  }
  await f.evaluate(code=>{MapExplorer1096.immediate(()=>selectCode(code,0,true));},target);
  const kept=await f.evaluate(()=>({camera:JSON.stringify(camera),code:selected.code}));
  await f.evaluate(()=>GC500Explorer.refresh());await p.evaluate(()=>syncFooter());
  check(await f.evaluate(kept=>JSON.stringify(camera)===kept.camera&&selected.code===kept.code,kept),'Refresh preserves selected location and zoom');
  check(await p.evaluate(()=>MS1026.screenBurst(1))===false,'Today celebration does not start over Map Explorer');
  const zooms=[];
  for(const zoom of [8,32,160,640]){
   const start=Date.now();await f.evaluate(z=>GC500Explorer.zoom(z),zoom);
   await f.waitForFunction(z=>Math.abs(camera.z-z)<.001,zoom,{timeout:10000});
   let sharp=true;try{await f.waitForFunction(z=>{const frame=__frames.at(-1);return frame&&Math.abs(frame.z-z)<.001&&!frame.vtMiss;},zoom,{timeout:20000});}catch(_){sharp=false;}
   zooms.push({zoom,sharp,ms:Date.now()-start});
   check(sharp,'Native drawing sharp at '+zoom*100+'% zoom');
   check(await f.evaluate(()=>canvas.width*canvas.height<=16e6&&canvas.width>=sw),'Canvas remains bounded and at least CSS resolution');
  }
  const cachedAt=Date.now(),lastFrame=await f.evaluate(()=>__frames.at(-1).t);await f.evaluate(()=>{GC500Explorer.zoom(160);GC500Explorer.zoom(640);});
  await f.waitForFunction(n=>{const x=__frames.at(-1);return x&&x.t>n&&Math.abs(x.z-640)<.001&&!x.vtMiss;},lastFrame,{timeout:10000});
  const cachedMaxMs=Date.now()-cachedAt;
  await f.evaluate(()=>GC500Explorer.zoom(8));await p.waitForTimeout(400);
  const frameBefore=await f.evaluate(()=>GC500Shape1060.state.paints);
  await p.evaluate(()=>go('today'));await p.waitForTimeout(300);
  const hiddenStart=await f.evaluate(()=>GC500Shape1060.state.paints);await p.waitForTimeout(500);
  check(await f.evaluate(()=>GC500Shape1060.state.paints)===hiddenStart,'Hidden maps stop painting');
  await p.evaluate(()=>go('map'));await p.waitForTimeout(400);
  check(await f.evaluate(()=>GC500Shape1060.state.paints)>=frameBefore,'Return reuses map normally');
  await p.waitForFunction(()=>!document.querySelector('canvas.ms1026-screen'),null,{timeout:2500});
  check(await p.locator('canvas.ms1026-screen').count()===0,'Leaving Today stops its screen animation');
  await p.emulateMedia({reducedMotion:'reduce'});
  check(await f.evaluate(()=>mapMotionOff1018()),'Reduced motion respected');
  await f.evaluate(()=>panel813(true));await f.locator('#q').fill('generator');
  // Let the real imagery finish before the visual capture; never hide a missing tile for a screenshot.
  await f.waitForFunction(()=>{const x=__frames.at(-1);return x&&!x.vtMiss&&!x.satMiss&&!x.satBlank;},null,{timeout:30000});
  await p.screenshot({path:out+'/search.png'});
  await f.locator('#q').press('Escape');await p.screenshot({path:out+'/map.png'});
  const after=await p.evaluate(()=>({s:JSON.stringify(S),money:JSON.stringify(pl770Model()),svc:document.getElementById('svc1067-script').textContent}));
  check(before.s===after.s,'Operational record unchanged');
  check(before.money===after.money,'Financial model unchanged');
  check(before.svc===after.svc,'Servicing tracker unchanged');
  check(h.errors.length===0,'No browser application errors');
  check(h.counts.blocked===0,'No operational write attempted');
  fs.writeFileSync(out+'/results.json',JSON.stringify({pass:true,checks,mobile,wide,search:info,identifierQueries:lookup.checks,zooms,cachedMaxMs,errors:h.errors,counts:h.counts},null,2));
  console.log(JSON.stringify({pass:true,checks,mobile,wide,search:info,identifierQueries:lookup.checks,zooms,cachedMaxMs}));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
