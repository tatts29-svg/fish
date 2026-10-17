/* Author: Andrew Fisher. Integrated progress formulas and real display; GET-only harness. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
const pageFile=process.env.PAGE;if(!pageFile)throw Error('PAGE must name the exact integrated candidate.');
const hash=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');
if(process.env.EXPECTED_SHA&&hash!==process.env.EXPECTED_SHA)throw Error('Candidate hash mismatch');
const out=process.env.OUT||'/workspace/private-percentage1012-browser';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const mobile=process.env.MOB==='1',h=await open({pageFile,hash:'#today',mobile,W:mobile?390:1440,H:900});
 try{
  const p=h.page;await p.emulateMedia({reducedMotion:'reduce'});
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&!!document.querySelector('#where885'),null,{timeout:120000});
  const report=await p.evaluate(()=>holdAssets(()=>{
   const checks=[],check=(name,pass,actual)=>checks.push({name,pass:!!pass,...(actual===undefined?{}:{actual})});
   const day=todayIso(),before=JSON.stringify(S),version=SYNC.backend.readVersion821(),read=progress881Model;
   const pane=document.querySelector('#pane-today'),programme=pane.querySelector('.today-work-programme840');
   function mount(){if(programme)pane.append(programme);Where885.mount();}
   const ids=['buildings','toilets','fencing','generators','lighting','vms','equipment'];
   const types=[...new Set(fenceProgrammeDefinitions959([]).filter(r=>r.unit==='m').map(r=>r.id))];
   function summary(done=10000){return {asOf:day,health:{ready:true},byId:Object.fromEntries(ids.map(id=>[id,{pct:100,pctKind:'confirmed',total:100,done:100,left:0}])),fencingRows:types.map(id=>({id,unit:'m',total:id==='clean'?10000:0,done:id==='clean'?done:0}))};}
   function model(s){const f=fenceOverall853(day,s,{health:{ready:true}});return {f,m:read(day,s,f)};}
   function paint(m){
    progress881Model=()=>m;
    try{mount();const el=document.querySelector('#where885');return {text:el.querySelector('[data-w885-pct]')?.dataset.text,complete:el.dataset.complete,lights:el.querySelectorAll('.w885-lights .tl841-lamp.is-on').length,aria:el.querySelector('.w885-lights')?.getAttribute('aria-label'),fenceText:el.querySelector('#w885-jump-fencing b')?.textContent,vmsText:el.querySelector('#w885-jump-vms b')?.textContent};}
    finally{progress881Model=read;}
   }
   try{
    check('Integrated precise percentage helper loaded',typeof ProgressPercent1012.ratio==='function');
    for(const [label,done] of [['99.9',9990],['99.999',9999.9],['rounded-zero-left',9999.999]]){
     const {f,m}=model(summary(done)),ui=paint(m);
     check(label+' raw fencing completion remains false',!f.scopeComplete1012&&f.pct.min<100&&f.pct.max<100,{raw:f.pct,left:f.left});
     check(label+' overall cannot turn green',!m.allGreen&&m.reached===4);
     check(label+' real Where card does not display completed 100',ui.text!=='100'&&ui.complete==='false'&&ui.lights===4,ui);
     check(label+' real category chip does not round up to 100',!/^100%$/.test(ui.fenceText),ui.fenceText);
    }
    const exact=model(summary()),exactUi=paint(exact.m);
    check('Exact completed source quantities give five green lamps',exact.m.allGreen&&exact.m.reached===5&&exactUi.complete==='true'&&exactUi.text==='100'&&exactUi.lights===5,exactUi);
    const single=summary();single.byId.buildings={pct:99.99,pctKind:'confirmed',total:10000,done:9999,left:1};
    const near=model(single).m,nearUi=paint(near);
    check('Near100 arithmetic remains below100',near.pct.min<100&&!near.allGreen,near.pct);
    check('Near100 real overall display shows99.99',nearUi.text==='99.99'&&nearUi.complete==='false',nearUi);
    const historic=PastDay984.model({iso:'2026-10-13'},'2026-10-14',()=>near);
    check('Past-day card shares the same99.99 reading',historic.text==='99.99'&&!historic.complete,historic);
    const area=[{id:'buildings',name:'Buildings',total:20000,done:19999,unit:'units',rows:[],knownTotal:20000}];area.health={ready:true};
    const row=todayWorkSummary848(day,area,{}, {summaryRows:[]}).byId.buildings;
    check('Category denominator and Done/Left retained',row.total===20000&&row.done===19999&&row.left===1);
    check('Category raw ratio and displayed rounding cannot finish one remaining unit',row.pct<100&&ProgressPercent1012.text(row.pct)==='99.99',row.pct);
    const partial=summary();partial.byId.vms={total:4,done:2,left:2,pct:50,pctKind:'lower-bound',reviewQuantity:1,issues:[]};
    Scope960.applyScope(partial.byId.vms,{requirement:5});const pm=model(partial).m,vms=pm.rows.find(r=>r.id==='vms'),pui=paint(pm);
    check('Provisional VMS scope keeps separate lower-bound uncertainty',partial.byId.vms.scopeProvisional960&&partial.byId.vms.pctKind==='lower-bound'&&vms.min===50&&vms.max===100&&pm.provisional&&!pm.allGreen,{min:vms.min,max:vms.max,provisional:pm.provisional});
    check('Real VMS chip retains minimum symbol',/≥/.test(pui.vmsText),pui.vmsText);
    const tiny=summary();tiny.fencingRows=types.map(id=>({id,unit:'m',total:id==='clean'?5000:['ccb_event','ccb_demarc'].includes(id)?2500:0,done:id==='clean'?5000:id==='ccb_event'?2499.9:id==='ccb_demarc'?2500.1:0,...(['ccb_event','ccb_demarc'].includes(id)?{classificationPending:true}:{})}));
    const tinyFence=fenceOverall853(day,tiny,{health:{ready:true},classification:{unallocatedMetres:0,confirmedByType:{ccb_event:2499.9,ccb_demarc:2499.9},pendingMetres:.2}}),tinyModel=read(day,tiny,tinyFence),tinyUi=paint(tinyModel);
    check('Sub-0.005 completion range stays real and cannot complete',tinyModel.pct.max>tinyModel.pct.min&&tinyModel.pct.max-tinyModel.pct.min<.005&&!tinyModel.allGreen);
    check('Real fencing chip retains the tiny-range minimum marker',/≥/.test(tinyUi.fenceText),tinyUi.fenceText);
    check('Past-day tiny range retains its minimum marker',PastDay984.model({iso:'2026-10-13'},'2026-10-14',()=>tinyModel).bound);
    for(const kind of ['unknown','stale']){const s=summary();if(kind==='unknown')s.byId.toilets={total:null,done:1,pct:null,pctKind:'unknown'};else s.health.stale=true;const r=model(s).m,u=paint(r);check(kind+' prevents completed UI',!r.allGreen&&u.complete==='false'&&u.lights<5,u);if(kind==='unknown')check('Unknown group keeps overall unavailable',!r.ready&&r.pct===null&&u.text==='—');}
   }finally{progress881Model=read;mount();}
   check('All fixtures leave the shared record exactly unchanged',JSON.stringify(S)===before);
   check('Original model function restored',progress881Model===read);
   check('Existing programme panel preserved',!programme||programme.isConnected&&programme.closest('#where885'));
   return {author:'Andrew Fisher',version,checks,operationalWrites:0};
  }));
  report.sourceSha256=hash;report.viewport=mobile?'phone':'desktop';report.browserErrors=h.errors;report.network=h.counts;report.passed=report.checks.filter(r=>r.pass).length;report.failed=report.checks.filter(r=>!r.pass);
  fs.writeFileSync(path.join(out,'percentage-'+report.viewport+'.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({sourceSha256:hash,viewport:report.viewport,passed:report.passed,failed:report.failed,errors:h.errors,network:h.counts},null,2));
  if(report.failed.length||h.errors.length||h.counts.blocked)process.exitCode=1;
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
