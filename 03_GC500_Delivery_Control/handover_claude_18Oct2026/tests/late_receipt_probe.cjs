/* Author: Andrew Fisher. Focused baseline/candidate proof for the restored native receipt transition. */
'use strict';
const assert=require('node:assert/strict'),C=require('../../v10.66_speed_smooth_DRAFT/tests/validation/common.cjs');
const {prepareLateReceiptFixture}=require('./late_receipt_fixture.cjs');
const [baseline,candidate,outFile]=process.argv.slice(2);
(async()=>{
 const out={author:'Andrew Fisher',method:'native-late-receipt-transition-v1',fixtureVersions:null,arms:[]};
 for(const [name,pageFile] of [['baseline',baseline],['candidate',candidate]]){
  console.log('START '+name);const s=await C.launch({pageFile,hash:'#timeline'}),p=s.page;let count=0;
  const check=(value,label)=>{assert.ok(value,name+': '+label);count++;};
  try{
   await C.ready(s);await C.settled(p,1500);
   if(!(await C.mergeReport(p)).complete){await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);}
   check((await C.mergeReport(p)).complete,'record hydrated');
   await p.evaluate(()=>{go('timeline');const card=document.querySelector('#pane-timeline .day[data-day="2026-10-14"]');if(!card)throw new Error('Target Build card missing');card.click();card.scrollIntoView({block:'nearest',inline:'center'});BuildProgress986.sync();});
   await p.waitForTimeout(1500);
   const original=await p.evaluate(()=>JSON.stringify(S));
   const stale=await p.evaluate(()=>{
    syncStop('focused isolated test');capability=()=> 'edit';mayWrite=()=>true;SYNC.readonly=false;S.operator='Andrew Fisher';
    const card=document.querySelector('#pane-timeline .day[data-day="2026-10-14"]'),text=card?.innerText.replace(/\s+/g,' ')||'';
    return {receivedAlready:/REFERENCES RECEIVED \/ SCHEDULED 14 \/ 14/.test(text),furnitureAlready:/4 Furniture 2 large fridges · 2 chairs/.test(text),already:['P26','P28','P34'].map(k=>arrivedOn1059.set(k,'2026-10-14')).every(x=>x.ok&&x.already)};
   });
   console.log(JSON.stringify({name,stale}));
   check(stale.receivedAlready&&stale.furnitureAlready&&stale.already,'published record already satisfies the old test postcondition');
   const prepared=await p.evaluate(prepareLateReceiptFixture);await p.waitForTimeout(500);
   const transition=await p.evaluate(async()=>{
    const card=()=>document.querySelector('#pane-timeline .day[data-day="2026-10-14"]')?.innerText.replace(/\s+/g,' ')||'';
    const before=card(),results=['P26','P28','P34'].map(k=>arrivedOn1059.set(k,'2026-10-14','isolated test receipt'));
    const entry=S.delivery.P26.history.find(h=>h.date_only===true&&h.effective_date==='2026-10-14');
    const again=arrivedOn1059.set('P26','2026-10-14');RENDER_MEMO.clear();Idle1006.redraw();await new Promise(r=>setTimeout(r,1500));
    return {beforeReceived:/REFERENCES RECEIVED \/ SCHEDULED 11 \/ 14/.test(before),beforeFurniture:!/Furniture/.test(before),afterReceived:/REFERENCES RECEIVED \/ SCHEDULED 14 \/ 14/.test(card()),afterFurniture:/4 Furniture 2 large fridges · 2 chairs/.test(card()),newEntries:results.every(x=>x.ok&&!x.already),entryShape:!!entry&&entry.date_only===true&&entry.at==='2026-10-13T14:00:00.000Z'&&entry.effective_date==='2026-10-14'&&!!entry.recorded_at&&entry.by==='Andrew Fisher',idempotent:again.ok&&again.already};
   });
   for(const [key,value] of Object.entries(transition))check(value,key);
   check(s.errors.length===0,'no browser errors');
   out.fixtureVersions=C.errorsOf(s).fixtureVersions;
   out.arms.push({name,pageSha256:C.sha(C.fs.readFileSync(pageFile)),recordSha256:C.sha(JSON.stringify(C.canonicalRecord(JSON.parse(original)))),prepared,transition,checks:count,blockedWrites:s.counts.blocked,pass:true});
   console.log('PASS '+name+' '+count+'/'+count);
  }finally{await s.browser.close();}
 }
 out.pass=true;C.writePrivate(outFile,out);console.log(JSON.stringify({pass:true,arms:out.arms.map(x=>({name:x.name,checks:x.checks,pageSha256:x.pageSha256}))}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
