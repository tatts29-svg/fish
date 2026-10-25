// Author: Andrew Fisher. Public-page smoke check; no page override or live writes.
'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{const s=await open({hash:'#servicing',W:390,H:844,dpr:2,mobile:true});try{
 const p=s.page;
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&typeof report1202==='object',null,{timeout:120000});
 await p.evaluate(()=>go('servicing'));
 await p.waitForFunction(()=>!document.getElementById('pane-servicing').innerText.includes('Loading the current shared record'),null,{timeout:120000});
 const r=await p.evaluate(()=>{
  const R=report1202.model({D:SVC1067_DATA,S:SvcState,C:SvcCrews1173,crewData:SVC1067_CARD.data,events:[],
   now:Date.now(),read:Date.now(),day:'2026-10-25',meta:{load:'servicing-tracker:GC500-2026'}});
  return {footer:document.body.innerText.includes('v12.21'),panel:SVC1067_DATA.tasks.lockup,card:SVC1067_CARD.data.tasks.lockup,
   evidence:R.lockDeclarations.version===1&&R.lockDeclarations.rows.length===0,
   report:report1202.html(R).includes('Door-lock declarations')&&report1202.html(R).includes('No named door-lock declarations recorded'),
   pane:!document.getElementById('pane-servicing').hidden};
 });
 assert(r.footer);assert(r.panel==='Locked (doors locked)'&&r.card===r.panel);assert(r.evidence);assert(r.report);assert(r.pane);
 assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);
 if(process.env.EVIDENCE)await p.screenshot({path:path.join(process.env.EVIDENCE,'live-report-page-phone.png')});
 console.log(JSON.stringify({checks:7,publicPage:true,pageOverride:false,recordWrites:0,errors:0}));
}finally{await s.browser.close();}})().catch(()=>{console.error('Public page smoke check failed');process.exitCode=1;});
