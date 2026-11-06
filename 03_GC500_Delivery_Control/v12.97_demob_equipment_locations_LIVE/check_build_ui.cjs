/* Author: Andrew Fisher. Read-only Build source-layout, weather and details checks.
 * PAGE is a complete candidate; OUT must remain in the private review directory.
 * The shared harness blocks record writes. No operational controls are submitted.
 */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
const {open}=require('../toolchain/harness/open_page');

const nativeMountIdentity=()=>{
 const pane=document.getElementById('pane-timeline'),cards=[...pane.querySelectorAll('.ld.tl846.lc991')];
 const weather=[...pane.querySelectorAll('.bc984-day')].map(n=>n.outerHTML);
 cards.forEach(c=>c.querySelectorAll('.b1247-location').forEach(n=>n.remove()));
 const before=cards.map(c=>c.outerHTML),stateBefore=JSON.stringify(S);
 BuildCards1247.mount();
 const after=cards.map(c=>{const copy=c.cloneNode(true);copy.querySelectorAll('.b1247-location').forEach(n=>n.remove());return copy.outerHTML;});
 return {cards:cards.length,native:JSON.stringify(before)===JSON.stringify(after),
  weather:JSON.stringify(weather)===JSON.stringify([...pane.querySelectorAll('.bc984-day')].map(n=>n.outerHTML)),
  records:JSON.stringify(S)===stateBefore};
};

(async()=>{
 assert((process.env.PAGE||process.env.LIVE==='1')&&process.env.OUT,'PAGE or LIVE=1, and private OUT, are required');
 const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});
 const mobile=process.env.MOBILE!=='0',W=mobile?390:1440,H=mobile?844:1000;
 const s=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,hash:'#today',W,H,mobile,dpr:1});
 try{
  const p=s.page;
  await p.waitForFunction(()=>window.BuildShapes1297?.prepare&&window.BuildCards1247&&window.DemobShapes1297);
  const fixture=await p.evaluate(()=>{
   const check=(v,m)=>{if(!v)throw Error(m)},before=JSON.stringify(S),candidates=[];
   const source=gc500MapShapes1060(),normalise=k=>String(k).toUpperCase().replace(/[\s\-_.]+/g,' ').trim();
   for(const day of calendarDays().filter(d=>d.iso<'2026-10-23'))for(const row of day.deliveries||[]){
    const key=row.a?.key;if(!key)continue;
    const canonical=Find1176.locate({kind:'asset',key}),L=BuildShapes1297.prepare(key,canonical),m=L?.demob1297;
    if(m?.kind!=='reference'||!m.parts.length||!Find1176.inAerial(L)||!BuildShapes1297.drawingId(key,L))continue;
    check(L!==canonical&&L.build1297,'Build preparation must clone the canonical location');
    check(L.lat===canonical.lat&&L.lon===canonical.lon,'Build changed the canonical coordinate');
    check(!m.complete&&!m.partial&&!m.review&&!m.label,'Build inferred a Demob status');
    check(m.scope==='reference'&&m.qualification.includes('individual unit position not recorded'),'Reference ambiguity lost its qualification');
    const original=source.refs[normalise(key)]?.comps||[];
    check(m.parts.every(part=>original.some(c=>JSON.stringify(c.poly)===JSON.stringify(part.poly))),'Build outline is not exact source geometry');
    candidates.push({day:day.iso,key,parts:m.parts.length});
   }
   candidates.sort((a,b)=>b.parts-a.parts);
   check(candidates.length,'No scheduled Build reference with a source outline is available');
   const chosen=candidates[0],raw=Find1176.locate({kind:'asset',key:chosen.key});
   check(BuildShapes1297.prepare(chosen.key,{...raw,how:'Driver reports here; no drop-off position'}).demob1297.kind==='unlocated','Report fallback became equipment location');
   check(JSON.stringify(S)===before,'Pure Build preparation changed native records');
   // Observe the real renderer without substituting its output or modifying its inputs.
   const shape=window.DemobShapes1297,compose=window.composeMaps1261,picture=window.Find1176.picture,zoom=window.gate1156Zoom;
   const probe={paint:[],views:[],composed:[],zoom:null};window.__buildCheck1297=probe;
   window.DemobShapes1297={...shape,paint(...args){const result=shape.paint(...args),m=args[1];if(m.uid==='build-reference')probe.paint.push({key:m.key,signature:shape.signature(m),kind:result.kind,painted:result.painted,parts:m.parts.length});return result;}};
   window.Find1176.picture=function(L,V){if(L.build1297)probe.views.push({key:L.demob1297.key,view:V.key,signature:shape.signature(L.demob1297)});return picture.apply(this,arguments);};
   window.composeMaps1261=async function(L,key){const value=await compose.apply(this,arguments);if(value&&L.build1297)probe.composed.push({key,signature:shape.signature(L.demob1297)});return value;};
   if(typeof zoom==='function')window.gate1156Zoom=function(lat,lon,id){probe.zoom={lat,lon,id};return zoom.apply(this,arguments);};
   probe.restore=()=>{window.DemobShapes1297=shape;window.composeMaps1261=compose;window.Find1176.picture=picture;if(zoom)window.gate1156Zoom=zoom;delete window.__buildCheck1297;};
   state.day=chosen.day;state.tlView='day';go('timeline');return chosen;
  });
  const buttonSelector='#pane-timeline .b1247-location[data-build1247-key='+JSON.stringify(fixture.key)+']';
  const button=p.locator(buttonSelector).first(),card=button.locator('xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," lc991 ")][1]');
  await button.waitFor();
  const closed=await p.evaluate(nativeMountIdentity);
  assert(closed.cards&&closed.native&&closed.weather&&closed.records,'Build mount altered native card/weather/record state');
  await button.scrollIntoViewIfNeeded();
  await p.waitForFunction(sel=>{const b=document.querySelector(sel),im=b?.querySelector('.b1247-thumb img');return b?.dataset.picture1247==='ready'&&im?.complete&&im.naturalWidth===1020&&im.naturalHeight===242;},buttonSelector,{timeout:60000});
  const rendered=await p.evaluate(key=>{
   const probe=window.__buildCheck1297,L=BuildShapes1297.prepare(key,Find1176.locate({kind:'asset',key})),signature=BuildShapes1297.signature(L);
   const paint=probe.paint.filter(v=>v.key===key&&v.signature===signature),views=probe.views.filter(v=>v.key===key&&v.signature===signature);
   return {panels:paint.length,allOutlined:paint.every(v=>v.painted&&v.kind==='reference'),
    close:views.some(v=>v.view==='close'),wide:views.some(v=>v.view==='wide'),
    composed:probe.composed.some(v=>v.key===key&&v.signature===signature),qualified:document.querySelector('[data-build1247-key='+JSON.stringify(key)+'] .b1247-map-copy>small')?.textContent.includes('individual unit position not recorded'),
    weather:document.querySelectorAll('#pane-timeline .bc984-day .bc984-weather-reading').length};
  },fixture.key);
  assert(rendered.panels>=3&&rendered.allOutlined&&rendered.close&&rendered.wide&&rendered.composed,'The three Build panels did not paint the same exact reference layout');
  assert(rendered.qualified,'Build map omitted the reference-position qualification');assert(rendered.weather>0,'Build weather cards missing');
  assert(await card.evaluate(n=>n.scrollWidth<=n.clientWidth+1),'Build card exceeds the viewport');
  await card.screenshot({path:out+'/build-map-card.png'});
  await p.locator('#pane-timeline .bc984-day.on').first().screenshot({path:out+'/build-weather-card.png'});

  const toggle=card.locator('.lc991-toggle').first();
  if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
  await card.locator('.lc991-detail').waitFor({state:'visible'});
  const expanded=await p.evaluate(nativeMountIdentity);
  assert(expanded.native&&expanded.weather&&expanded.records,'Expanded mount altered native controls, weather or records');
  const record=card.locator('.lc991-record').first();assert.equal(await record.count(),1,'Native photos, notes and delivery record missing');
  if(!await record.evaluate(n=>n.open))await record.locator(':scope > summary').click();
  assert(await record.evaluate(n=>n.open&&!!n.querySelector('.ldb')),'Native record did not expand');
  await card.screenshot({path:out+'/build-expanded-card.png'});

  await button.scrollIntoViewIfNeeded();await button.click();
  await p.waitForFunction(()=>state.tab==='map'&&document.getElementById('pane-map')?.getClientRects().length);
  assert(await p.evaluate(key=>{
   const L=Find1176.locate({kind:'asset',key}),z=window.__buildCheck1297.zoom;
   return !!z&&z.lat===L.lat&&z.lon===L.lon&&z.id===L.id;
  },fixture.key),'Build map action changed its canonical navigation target');
  // Native gate1156Zoom selects the satellite mode. Use the existing view-only
  // selector to open Site plan & equipment before checking its full-screen UI.
  const mapMode=p.locator('#pane-map .map1188-pick select');
  await mapMode.waitFor();await mapMode.selectOption('plan');
  await p.waitForFunction(()=>document.getElementById('pane-map')?.dataset.map1188==='plan'&&document.getElementById('expwrap')?.getClientRects().length);
  const full=p.locator('#expFull');assert.equal(await full.count(),1,'Native Explorer full-screen control missing');
  await full.click();
  await p.waitForFunction(()=>document.getElementById('expcard')?.classList.contains('expfull')&&document.getElementById('expFull')?.getAttribute('aria-pressed')==='true');
  assert(await p.locator('#expcard').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'Full-screen map exceeds the viewport');
  await p.screenshot({path:out+'/build-map-full-screen.png'});
  await full.click();await p.waitForFunction(()=>!document.getElementById('expcard')?.classList.contains('expfull'));
  await p.evaluate(()=>go('timeline'));await button.waitFor();await button.scrollIntoViewIfNeeded();
  await p.waitForFunction(sel=>{const im=document.querySelector(sel+' .b1247-thumb img');return im?.complete&&im.naturalWidth===1020;},buttonSelector,{timeout:60000});
  assert(await p.evaluate(day=>state.day===day&&!!document.querySelector('#pane-timeline .bc984-day.on .bc984-weather-reading'),fixture.day),'Map return lost the selected Build day or weather');
  const final=await p.evaluate(()=>({stats:BuildCards1247.stats(),inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}));
  assert(final.stats.cached<=16&&final.stats.attached<=16&&final.stats.peakActive<=1,'Build map lifecycle budgets changed');
  assert.equal(final.inflight,0,'Native writes are in flight');assert.equal(final.queued,0,'Native writes are queued');
  assert.equal(s.errors.length,0,JSON.stringify(s.errors));assert.equal(s.counts.blocked,0,'The page attempted a record write');
  await p.evaluate(()=>window.__buildCheck1297.restore());
  fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,viewport:mobile?'phone':'desktop',nativeCards:closed.cards,threeSourceLayoutPanels:true,referenceQualified:true,weatherPreserved:true,detailsPreserved:true,canonicalMapTarget:true,nativeFullScreen:true,returnPreserved:true,boundedLifecycle:true,errors:0,writes:0},null,2));
  console.log('PASS Build source layouts in three panels, reference qualification, weather/details, native full-screen, zero writes/errors');
 }catch(e){await s.page.screenshot({path:out+'/failure.png'});fs.writeFileSync(out+'/errors.json',JSON.stringify({errors:s.errors,counts:s.counts}));throw e;}
 finally{await s.browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
