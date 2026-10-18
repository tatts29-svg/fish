/* Author: Andrew Fisher. Native output and print-layout checks, using frozen reads and blocked writes. */
'use strict';
const assert=require('node:assert/strict');
const common=require('../../v10.66_speed_smooth_DRAFT/tests/validation/common.cjs');
const {launch,ready,settled,mergeReport,assertClean,writePrivate}=common;
(async()=>{
 const s=await launch({pageFile:process.argv[2],mobile:process.env.MOB==='1'}),p=s.page;let checks=0;
 const check=(ok,label)=>{assert.ok(ok,label);checks++;console.log('PASS '+label);};
 try{
  await ready(s);await settled(p);check((await mergeReport(p)).complete,'initial native record completely hydrated');
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
  const driver=await p.evaluate(()=>new Promise(resolve=>{const x=window.__departure1070Driver;if(!x)return resolve({missing:true});dpPrint(x.iso,'drv',{only:x.i,pdf:(r,wrap,done)=>{const out={...r,rule:wrap.innerText.includes('pick-up point before 07:00')};done();resolve(out);}});}));
  check(!driver.timeout&&!driver.missing,'native driver print completes');check(!driver.over?.length,'native driver A4 sheets fit');check(driver.failed===0,'native driver print images load');check(driver.rule,'building rule survives native driver pagination');
  // Use native demob rendering while suppressing the operating-system dialog only.
  await p.evaluate(()=>{const x=window.__departure1070Demob;window.__departure1070Print=window.print;window.print=()=>{};printDay816Before826(x.iso,'all','truck',x.n);});
  await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
  const demob=await p.evaluate(()=>{const wrap=document.getElementById('dayprint');return {rule:wrap.innerText.includes('pick-up point before 07:00'),overflow:[...wrap.querySelectorAll('.dp-page')].some(pg=>{const b=pg.getBoundingClientRect();return pg.scrollHeight>pg.clientHeight+2||[...pg.children].some(e=>e.getBoundingClientRect().bottom>b.bottom+2);})};});
  check(demob.rule,'building rule survives native demob print');check(!demob.overflow,'native demob A4 sheet fits');
  await p.evaluate(()=>{window.print=window.__departure1070Print;dispatchEvent(new Event('afterprint'));});await p.emulateMedia({media:'screen'});
  assertClean(s);checks++;console.log('PASS no browser exceptions, writes or missing frozen endpoints');
  const out={author:'Andrew Fisher',passed:true,checks,phases:result.phases,mobile:process.env.MOB==='1',driver:{pages:driver.pages,over:driver.over,failedImages:driver.failed},demob};
  if(process.argv[3])writePrivate(process.argv[3],out);console.log(JSON.stringify(out));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
