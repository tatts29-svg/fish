/* Author: Andrew Fisher. Private frozen native-report preview checks; all writes denied. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const DAYS=['2026-10-23','2026-10-24','2026-10-25'];
const read=()=>holdAssets(()=>JSON.parse(JSON.stringify({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),money:moneySummary(),figures:contractFigures(ONHIRE_ROWS),branches:pl752Rows()})));
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE&&process.env.TRACKER_DIR&&process.env.OUT,'Explicit exact pages and private snapshots/output required');
 const base=process.env.BASE,candidate=process.env.PAGE,out=path.resolve(process.env.OUT),tracker=path.resolve(process.env.TRACKER_DIR),root=path.resolve(__dirname,'../../..');assert(!out.startsWith(root+path.sep),'Keep all actual screenshots and evidence private');fs.mkdirSync(out,{recursive:true});
 assert.equal(sha(fs.readFileSync(base)),'7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404');
 const listing=JSON.parse(fs.readFileSync(path.join(tracker,'tracker-list.json'))),pages=JSON.parse(fs.readFileSync(path.join(tracker,'tracker-pages.json'))),snapshot=JSON.parse(fs.readFileSync(path.join(tracker,'tracker-snapshot.json')));
 const expected=listing.trackers.filter(t=>t.load==='servicing-tracker:GC500-2026');assert.equal(expected.length,1);const result={author:'Andrew Fisher',previewOnly:true,baseSha:sha(fs.readFileSync(base)),candidateSha:sha(fs.readFileSync(candidate)),trackerSnapshotSha:sha(fs.readFileSync(path.join(tracker,'tracker-snapshot.json'))),sessions:{}};
 for(const [name,pageFile,mobile] of [['baseline',base,false],['desktop',candidate,false],['phone',candidate,true]]){
  process.env.PAGE=pageFile;process.env.MOB=mobile?'1':'0';process.env.INITIAL_HASH='#servicing';
  const s=await openCandidate();try{
   await s.page.clock.setFixedTime(new Date('2026-10-28T18:10:00.000Z'));
   const viewBefore=await s.page.locator('#pane-servicing').innerText();assert(viewBefore.includes('edit link'),'Native public access notice must remain');
   if(name!=='baseline'){assert.equal(await s.page.locator('#svc1252').count(),0);await s.page.screenshot({path:path.join(out,name+'-public-notice.png')});}
   assert.equal(await s.page.evaluate(()=>svcNight1202()),null,'Public getter must not expose the tracker');
   const before=await s.page.evaluate(read);s.setFixtureLevel('edit');
   await s.page.evaluate(({listing,pages})=>{
    window.__svc1252Reads=0;window.__svc1252Ticks=pages;window.__svc1252Listing=listing;
    SYNC.backend.ticks=async q=>{window.__svc1252Reads++;if(!q||!q.token)return JSON.parse(JSON.stringify(window.__svc1252Listing));const p=window.__svc1252Ticks.find(p=>p.seq>Number(q.since||0)||!p.more)||window.__svc1252Ticks[window.__svc1252Ticks.length-1];return JSON.parse(JSON.stringify(p));};
    window.capability=()=> 'edit';window.mayWrite=()=>true;SYNC.readonly=false;SYNC.claims='edit';SYNC.level='edit';
    renderServicing1084();
   },{listing,pages});
   if(name==='baseline'){
    await s.page.waitForFunction(()=>document.querySelector('[data-svc-tracker] option[value="0"]'),null,{timeout:30000});
    const i=listing.trackers.filter(t=>typeof t.load==='string'&&t.load.startsWith('servicing-tracker:')).findIndex(t=>t.load==='servicing-tracker:GC500-2026');
    await s.page.locator('[data-svc-tracker]').selectOption(String(i));
    await s.page.waitForFunction(()=>typeof svcNight1202==='function'&&svcNight1202(),null,{timeout:30000});
   }else await s.page.waitForFunction(()=>ServicingPreview1252.models().length===3,null,{timeout:30000});
   const getter=await s.page.evaluate(()=>{const x=svcNight1202();if(!x)throw Error('Shared report getter has no verified snapshot');if(!Number.isFinite(x.now)||x.now<x.read)throw Error('Shared report clock invalid');return JSON.parse(JSON.stringify({D:x.D,events:x.events,read:x.read,day:x.day,picked:x.picked,meta:x.meta}));});
   const reports=await s.page.evaluate(days=>{
    const snap=typeof ServicingPreview1252==='object'?null:svcNight1202();
    const models=typeof ServicingPreview1252==='object'?ServicingPreview1252.models():days.map(day=>report1202.model({D:snap.D,S:SvcState,C:SvcCrews1173,crewData:SVC1067_CARD.data,events:snap.events,now:Date.parse(window.__svc1252Ticks[0].now),read:Date.parse(window.__svc1252Ticks[0].now),day,meta:snap.meta}));
    return models.map(R=>({model:JSON.parse(JSON.stringify(R)),html:report1202.html(R,{author:DATA.brand.author,noBar:true}),printHtml:report1202.html(R,{author:DATA.brand.author})}));
   },DAYS);
   if(name==='baseline'){
    const nativePrints=[];
    for(const day of DAYS){
     const popupPromise=s.page.waitForEvent('popup');await s.page.evaluate(day=>{const button=document.querySelector('[data-svc-day="'+day+'"]');if(!button)throw Error('Native night selector absent');button.click();report1202.open();},day);
     const popup=await popupPromise;await popup.waitForFunction(()=>document.querySelector('.sheet')&&window.__pg1202);await popup.evaluate(()=>window.__pg1202);
     nativePrints.push({day,pages:await popup.locator('.sheet').count(),title:await popup.title(),text:await popup.locator('body').innerText()});await popup.close();
    }
    result.sessions.baseline={reports,nativePrints,getter,before,after:await s.page.evaluate(read),baseline:s.baseline};
   }
   else{
    assert.deepEqual(reports,result.sessions.baseline.reports,'Every native report model and exact screen/print HTML must match');
    assert.deepEqual(getter,result.sessions.baseline.getter,'Legacy getter preserves native verified data, clock source, metadata and automatic night');
    const cards=s.page.locator('#svc1252 > .svc1252-night');assert.equal(await cards.count(),3);
    assert.deepEqual(await cards.evaluateAll(ns=>ns.map(n=>n.dataset.night1252)),DAYS);
    const initiallyLoaded=await s.page.locator('#svc1252 iframe').count();assert.equal(initiallyLoaded,0,'Collapsed night cards must not initialize report frames');
    const captures=[];
    for(let i=0;i<3;i++){
     const card=cards.nth(i);await card.evaluate(n=>{n.open=true;n.scrollIntoView({block:'start'});});
     await s.page.waitForFunction(day=>{const f=document.querySelector('[data-night1252="'+day+'"] iframe');return f&&f.contentDocument.documentElement.hasAttribute('data-pages')&&f.offsetHeight>500;},DAYS[i],{timeout:30000});
     const f=s.page.frameLocator('[data-night1252="'+DAYS[i]+'"] iframe');
     const dimensions=await card.evaluate(n=>{const f=n.querySelector('iframe'),d=f.contentDocument,ss=[...d.querySelectorAll('.sheet')];return {width:n.getBoundingClientRect().width,frameHeight:f.getBoundingClientRect().height,pages:ss.length,pageAttr:d.documentElement.dataset.pages,insideBottom:Math.max(...ss.map(x=>x.getBoundingClientRect().bottom)),overflow:d.documentElement.scrollWidth>f.clientWidth+2};});
     assert(!dimensions.overflow,'Native report must fit phone viewport');assert(dimensions.frameHeight>=dimensions.insideBottom,'All pages visible without clipping');assert(Number(dimensions.pageAttr)>=2);
     await card.screenshot({path:path.join(out,name+'-'+DAYS[i]+'-card.png')});
     const popupPromise=s.page.waitForEvent('popup');await card.locator('button').click();const popup=await popupPromise;await popup.waitForFunction(()=>document.querySelector('.sheet')&&window.__pg1202);await popup.evaluate(()=>window.__pg1202);assert.equal(await popup.locator('.bar button').first().innerText(),'Print or save as PDF');
     const printable=await popup.evaluate(()=>({title:document.title,sheets:document.querySelectorAll('.sheet').length,text:document.body.innerText}));assert(printable.title.includes(DAYS[i].slice(-2)));assert.equal(printable.sheets,result.sessions.baseline.nativePrints[i].pages,'Native printed pagination preserved');await popup.close();
     const selected=await s.page.evaluate(()=>({day:svcNight1202().day,picked:svcNight1202().picked}));assert.deepEqual(selected,{day:DAYS[i],picked:true},'Native shared entry point follows the chosen preview night');
     const legacyPromise=s.page.waitForEvent('popup');await s.page.evaluate(()=>report1202.open());const legacy=await legacyPromise;await legacy.waitForFunction(()=>document.querySelector('.sheet')&&window.__pg1202);await legacy.evaluate(()=>window.__pg1202);
     const legacyPrint=await legacy.evaluate(()=>({title:document.title,sheets:document.querySelectorAll('.sheet').length,text:document.body.innerText}));assert.deepEqual(legacyPrint,printable,'Unmodified legacy open renders the same complete native report and pagination');await legacy.close();
     captures.push({day:DAYS[i],...dimensions,printSheets:printable.sheets,legacyPrintExact:true});
    }
    await cards.evaluateAll(ns=>ns.forEach(n=>n.open=false));await s.page.evaluate(()=>{document.querySelector('#main')?.scrollTo(0,0);document.querySelector('main')?.scrollTo(0,0);window.scrollTo(0,0);});await s.page.screenshot({path:path.join(out,name+'-overview.png')});
    const after=await s.page.evaluate(read);assert.deepEqual(after,before,'Documents and monetary models remain exact');
    const reads=await s.page.evaluate(()=>window.__svc1252Reads);await s.page.evaluate(()=>{for(let i=0;i<30;i++){ServicingPreview1252.wake();renderServicing1084();}});await s.page.waitForTimeout(1000);assert.equal(await s.page.evaluate(()=>window.__svc1252Reads),reads,'Repeated wakes must not repeatedly fetch or loop');
    // Open several nights, choosing Friday last. A background refresh/render of Sunday must not change that choice.
    for(const i of [2,1,0]){await cards.nth(i).evaluate(n=>n.open=true);await s.page.waitForFunction(day=>svcNight1202().day===day,DAYS[i]);}
    const priorRead=getter.read;await s.page.clock.setFixedTime(new Date('2026-10-28T18:11:00.000Z'));
    // Expiry is a local metadata fixture to force a fresh report render; no events or service records are changed.
    await s.page.evaluate(at=>{window.__svc1252Ticks.forEach(p=>{p.now=new Date(at).toISOString();p.expired=true;});ServicingPreview1252.wake();},priorRead+60000);
    await s.page.waitForFunction(at=>svcNight1202()&&svcNight1202().read===at,priorRead+60000);
    await cards.nth(2).evaluate(n=>n.scrollIntoView({block:'start'}));await s.page.waitForFunction(()=>document.querySelector('[data-night1252="2026-10-25"] iframe'));
    const refreshed=await s.page.evaluate(()=>({night:svcNight1202().day,picked:svcNight1202().picked,read:svcNight1202().read,models:ServicingPreview1252.models().map(r=>r.read)}));assert.equal(refreshed.night,DAYS[0],'Observer-driven loading must preserve the explicitly chosen night');assert.equal(refreshed.picked,true);assert(refreshed.models.every(v=>v===priorRead+60000),'Getter and all preview reports share the refreshed authorized read');
    s.setFixtureLevel('view');await s.page.evaluate(()=>{window.capability=()=> 'view';window.mayWrite=()=>false;SYNC.readonly=true;SYNC.claims='view';SYNC.level='view';applyCapability();renderServicing1084();});assert.equal(await s.page.locator('#svc1252').count(),0,'Losing edit capability removes private report DOM synchronously');assert.equal(await s.page.locator('#pane-servicing.svc1252-active').count(),0);assert((await s.page.locator('#pane-servicing').innerText()).includes('edit link'));
    assert.equal(await s.page.evaluate(()=>svcNight1202()),null,'Capability loss synchronously clears shared report data');
    const deniedOpen=await s.page.evaluate(()=>{const old=window.open;let calls=0;window.open=()=>{calls++;return null;};try{report1202.open();return calls;}finally{window.open=old;}});assert.equal(deniedOpen,0,'Legacy open cannot publish a stale report after capability loss');
    // Deliberately revoke access while an opened report is still paginating.
    s.setFixtureLevel('edit');await s.page.evaluate(()=>{window.capability=()=> 'edit';window.mayWrite=()=>true;SYNC.readonly=false;SYNC.claims='edit';SYNC.level='edit';applyCapability();renderServicing1084();});
    await s.page.waitForFunction(()=>ServicingPreview1252.models().length===3);
    await s.page.evaluate(()=>{const c=document.querySelector('[data-night1252]');c.open=true;c.dispatchEvent(new Event('toggle'));const f=c.querySelector('iframe');if(!f)throw Error('Pending frame missing');window.__pending1252=!!f.contentWindow.__pg1202;window.capability=()=> 'view';window.mayWrite=()=>false;SYNC.readonly=true;SYNC.claims='view';SYNC.level='view';applyCapability();});
    s.setFixtureLevel('view');assert.equal(await s.page.evaluate(()=>window.__pending1252),true);assert.equal(await s.page.locator('#svc1252').count(),0);await s.page.waitForTimeout(1200);
    result.sessions[name]={captures,initiallyLoaded,getter,refreshed,before,after,baseline:s.baseline,readCalls:reads,legacyGetterAndOpenPreserved:true,accessBoundaryPreserved:true};
   }
   Object.assign(result.sessions[name],{pageErrors:s.errors,consoleErrors:s.consoleErrors,writeAttempts:s.counts.blocked});assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  }finally{await s.browser.close();fs.writeFileSync(path.join(out,'preview-checks.json'),JSON.stringify(result,null,2)+'\n');}
 }
 result.status='PASS';fs.writeFileSync(path.join(out,'preview-checks.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS native reports, print routes, data, lazy frames and access boundary');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
