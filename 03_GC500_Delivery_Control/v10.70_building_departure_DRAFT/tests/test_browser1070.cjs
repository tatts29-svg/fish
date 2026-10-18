/* Author: Andrew Fisher. Native output and print-layout checks, using frozen reads and blocked writes. */
'use strict';
const assert=require('node:assert/strict');
const cached=process.env.GC500_CACHE_ONLY==='1'?require('../../v10.66_speed_smooth_DRAFT/tests/validation/cache_only.cjs'):null;
const transport=require('../../toolchain/harness/curlfetch.js'),nativeFetch=transport.curlFetch;
let arm='baseline';const external={baseline:[],candidate:[]};
transport.curlFetch=async(...args)=>{const current=arm;try{const r=await nativeFetch(...args);if(r.status>=400)external[current].push({url:args[0],method:args[2],status:r.status});return r;}catch(e){external[current].push({url:args[0],method:args[2],error:e.code||e.name});throw e;}};
const common=require('../../v10.66_speed_smooth_DRAFT/tests/validation/common.cjs');
const {launch,ready,settled,mergeReport,assertClean,writePrivate,canonicalRecord,sha,errorsOf}=common;
const diagnostics={};
function collectCleanliness(s,label){const e=errorsOf(s);diagnostics[label]={...e,external:external[label]};assert.equal(e.pageErrors.length,0,label+' genuine page exceptions');assert.equal(e.blocked,0,label+' attempted writes');assert.equal(e.missingFixture.length,0,label+' missing frozen endpoints');assert.ok(e.fixtureVersions.consistent,label+' frozen API coherence');const product=e.consoleErrors.filter(x=>!/^Failed to load resource: (?:the server responded with a status of [45][0-9]{2}|net::ERR_)/.test(x));assert.equal(product.length,0,label+' genuine console errors');if(e.consoleErrors.length)assert.ok(external[label].length,label+' resource errors have captured failed reads');return !e.consoleErrors.length&&!external[label].length;}
async function nativeModels(p){return p.evaluate(()=>{const days=programmeDays();return {record:S,programme:days.map(d=>({iso:d.iso,deliveries:d.deliveries,removals:d.removals,unref:d.unref,loads:dpLoads(d)})),demob:demob816(),daily:days.map(d=>daily821Model(d.iso))};});}
const exact=(a,b)=>JSON.stringify(canonicalRecord(a))===JSON.stringify(canonicalRecord(b));
(async()=>{
 let baseline=null;
 if(process.argv[4]){const before=await launch({pageFile:process.argv[4],mobile:process.env.MOB==='1'});try{await ready(before);await settled(before.page);assert.ok((await mergeReport(before.page)).complete,'predecessor fully hydrated');baseline=await nativeModels(before.page);collectCleanliness(before,'baseline');}finally{await before.browser.close();}}
 arm='candidate';const s=await launch({pageFile:process.argv[2],mobile:process.env.MOB==='1'}),p=s.page;let checks=0;
 const check=(ok,label)=>{assert.ok(ok,label);checks++;console.log('PASS '+label);};
 try{
  await ready(s);await settled(p);check((await mergeReport(p)).complete,'initial native record completely hydrated');
  if(baseline){
   const actual=await nativeModels(p);
   check(exact(actual.record,baseline.record),'exact predecessor/candidate shared record parity');
   check(exact(actual.programme,baseline.programme),'exact native programme, load, quantity, time and door-side model parity');
   check(exact(actual.demob,baseline.demob),'exact native demob quantity and planning-time model parity');
   const copy=x=>JSON.parse(JSON.stringify(x));const before=copy(baseline.daily),after=copy(actual.daily);let noteRows=0;
   for(let i=0;i<before.length;i++)for(let j=0;j<before[i].loads.length;j++)for(let k=0;k<before[i].loads[j].rows.length;k++){
    const a=before[i].loads[j].rows[k],b=after[i]?.loads[j]?.rows[k];assert.ok(b,'same native daily row exists');
    const old=a.notes||[],next=b.notes||[];assert.deepEqual(next.slice(0,old.length),old,'all original daily notes retained in order');
    assert.ok(next.length===old.length||next.length===old.length+1&&/^Buildings:|^Be on site|^For a departure|^No travel|^Week 4 onward/.test(next.at(-1)),'only the settled departure note may be appended');
    delete a.notes;delete b.notes;noteRows++;
   }
   check(exact(before,after),'exact native daily model parity apart from appended departure notes');
   check(noteRows>0,'all native daily note rows checked');
  }
  const result=await p.evaluate(()=>{
   const R=BuildingDeparture1070,checks=[],ok=(v,label)=>checks.push({ok:!!v,label});
   const before=JSON.stringify(S),days=programmeDays(),selected=[],phases=new Set();
   for(const d of days){const loads=dpLoads(d),i=loads.findIndex(g=>R.load(g,d.iso));if(i<0)continue;
    const phase=DATA.weeks.filter(w=>w.start&&w.start<=d.iso).sort((a,b)=>b.start.localeCompare(a.start))[0]?.sheet||'after programme';
    if(phases.has(phase))continue;phases.add(phase);selected.push({d,loads,i});
   }
   ok(selected.length>0,'native programme contains building movements');
   for(const {d,loads,i} of selected){const g=loads[i],h=dpPage(d,g,'drv',i+1,loads.length);ok(h.includes('data-departure1070'),'driver output covers native phase '+selected.indexOf(selected.find(x=>x.d===d)));
    ok(flow891Card(d).includes('data-departure1070'),'native day flow covers selected building phase');
    const r=g.rows.find(R.row);ok(dropPage(r.a,r.events,1,1,d).includes('data-departure1070'),'native drop sheet covers building movement');
    ok(rules782Long(r.a).join('\n').includes('pick-up point before 07:00'),'native full driver details cover pickup rule');
    ok(rules782Html(r.a).includes('data-departure1070'),'native drawer rules cover building');
    const mail=pdf7MailText('drivers',d.iso,i,null,2400);ok(mail&&mail.text.includes('pick-up point before 07:00'),'native email covers selected building');
   }
   const dm=demob816(),matches=[];for(const iso of dm.days){const T=trucks816(iso,'all'),L=T.find(L=>R.stops(L,iso));if(L){matches.push({iso,L});break;}}
   ok(matches.length>0,'native demob contains building collection');
   if(matches.length){const {iso,L}=matches[0],Dy=dm.day[iso],prior={view:DM816.view,branch:DM816.branch};DM816.view='trucks';DM816.branch='all';
    try{const h=dayHtml816(dm,Dy);ok(h.includes('data-departure1070'),'native demob day covers buildings');ok(!R.planningConflict(L)||h.includes(R.review),'native conflicting demob sketch marked for review');}finally{Object.assign(DM816,prior);}
    const h=sheet816(iso,L);ok(h.includes('data-departure1070'),'native demob sheet covers building');ok(!R.planningConflict(L)||h.includes(R.review),'native demob sheet labels conflicting planning clocks');
    ok(new URL(mail816(iso,'all',Dy.list,trucks816(iso,'all'))).searchParams.get('body').includes('pick-up point before 07:00'),'native demob email covers building');
    window.__departure1070Demob={iso,n:L.n};
   }
   ok(JSON.stringify(S)===before,'output generation leaves all shared record values unchanged');
   const biggest=selected.sort((a,b)=>b.loads[b.i].rows.length-a.loads[a.i].rows.length)[0];window.__departure1070Driver=biggest?{iso:biggest.d.iso,i:biggest.i}:null;
   return {checks,phases:selected.length};
  });
  for(const x of result.checks)check(x.ok,x.label);
  await p.evaluate(()=>{try{window.print();}catch(e){if(!/twin-steer/.test(String(e)))throw e;}});
  await p.locator('#ts1053c').check();await p.locator('#ts1053n').fill('Print Validation');await p.locator('[data-ts1053-go]').click();
  check(await p.evaluate(()=>ts1053.armed()&&!document.getElementById('ts1053')),'native compliance gate acknowledged before print capture');
  const driver=await p.evaluate(()=>new Promise(resolve=>{const x=window.__departure1070Driver;if(!x)return resolve({missing:true});dpPrint(x.iso,'drv',{only:x.i,pdf:(r,wrap,done)=>{const out={...r,rule:wrap.innerText.includes('pick-up point before 07:00')};window.__departure1070DriverDone=done;resolve(out);}});}));
  check(!driver.timeout&&!driver.missing,'native driver print completes');check(!driver.over?.length,'native driver A4 sheets fit');check(driver.failed===0,'native driver print images load');check(driver.rule,'building rule survives native driver pagination');
  if(process.argv[3]){await p.evaluate(()=>{document.body.classList.remove('pdf7-make');document.body.classList.add('printing-day');});await p.emulateMedia({media:'print'});await p.locator('#dayprint .dp-page').first().screenshot({path:process.argv[3].replace(/\.json$/,'')+'-driver.png'});await p.emulateMedia({media:'screen'});}
  await p.evaluate(()=>window.__departure1070DriverDone?.());
  // Use native demob rendering while suppressing the operating-system dialog only.
  await p.evaluate(()=>{const x=window.__departure1070Demob;window.__departure1070Print=window.print;window.print=()=>{};printDay816Before826(x.iso,'all','truck',x.n);});
  await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
  const demob=await p.evaluate(()=>{const wrap=document.getElementById('dayprint');return {rule:wrap.innerText.includes('pick-up point before 07:00'),overflow:[...wrap.querySelectorAll('.dp-page')].some(pg=>{const b=pg.getBoundingClientRect();return pg.scrollHeight>pg.clientHeight+2||[...pg.children].some(e=>e.getBoundingClientRect().bottom>b.bottom+2);})};});
  check(demob.rule,'building rule survives native demob print');check(!demob.overflow,'native demob A4 sheet fits');
  if(process.argv[3])await p.locator('#dayprint').screenshot({path:process.argv[3].replace(/\.json$/,'')+'-demob.png'});
  await p.evaluate(()=>{window.print=window.__departure1070Print;dispatchEvent(new Event('afterprint'));});await p.emulateMedia({media:'screen'});
  check(!baseline||exact(await p.evaluate(()=>S),baseline.record),'printing leaves all shared record values unchanged');
  const clean=collectCleanliness(s,'candidate');if(cached)check(cached.missing.length===0,'all media are original cached responses, no fallback');checks++;console.log('PASS no product exceptions, writes or missing frozen endpoints; resource cleanliness recorded separately');
  const out={author:'Andrew Fisher',passed:true,clean,diagnostics,externalIdentityMatch:exact(external.baseline.map(x=>[x.url,x.method,x.status,x.error]).sort(),external.candidate.map(x=>[x.url,x.method,x.status,x.error]).sort()),checks,phases:result.phases,predecessorCompared:!!baseline,mobile:process.env.MOB==='1',driver:{pages:driver.pages,over:driver.over,failedImages:driver.failed},demob,cache:cached?{reads:cached.reads,missing:cached.missing.length,networkFallback:cached.networkFallback}:null};
  if(process.argv[3])writePrivate(process.argv[3],out);console.log(JSON.stringify({passed:out.passed,clean:out.clean,checks:out.checks,phases:out.phases,mobile:out.mobile,externalIdentityMatch:out.externalIdentityMatch}));
 }finally{await s.browser.close();}
})().catch(e=>{if(process.argv[3])writePrivate(process.argv[3],{author:'Andrew Fisher',passed:false,error:e.stack,diagnostics,external,cache:cached});console.error(e.stack);process.exit(1);});
