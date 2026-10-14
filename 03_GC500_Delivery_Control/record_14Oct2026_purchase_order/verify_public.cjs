/* Author: Andrew Fisher. Fresh read-only P/O and financial readback. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {read,verify}=require('./native_purchase_order.cjs');
const {open}=require('./readonly_page.cjs');
const folder=process.env.GC500_RECORD_EVIDENCE;
if(!folder||!fs.existsSync(path.join(folder,'after-public.json')))throw Error('Completed apply evidence required');
const plan=JSON.parse(fs.readFileSync(path.join(folder,'proposal.json'))),staged=JSON.parse(fs.readFileSync(path.join(folder,'native-proposal.json')));
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#fencing',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const record=await h.page.evaluate(read,plan.spec),result=verify({...staged,record,after:record.docs},plan);
 result.checks['read-only browser']=h.errors.length===0&&h.counts.blocked===0;
 if(!process.env.PAGE)result.checks['actual public page']=h.counts.page===0;
 if(process.env.EXPECT_LABEL){
  const expected=plan.spec.number+' · $'+plan.spec.amount.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
  const labels=await h.page.evaluate(no=>{
   const inspect=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content;};
   const f=inspect(poCard(fenceByWeek(allDockets()))),finance=inspect(fh866Html());
   return {label:poLabel1014(no),fencing:f.querySelector('[data-po-amt="'+no+'"]').closest('tr').cells[0].textContent,finance:finance.querySelector('[data-fh866-row="'+no+'"]').cells[0].textContent};
  },plan.spec.number);
  result.checks['current reference includes currency']=labels.label===expected;
  result.checks['Fencing displays approved dollars']=labels.fencing.includes(expected);
  result.checks['Finance displays identical dollars']=labels.finance.includes(expected);
  const input=h.page.locator('[data-po-amt="'+plan.spec.number+'"]');
  await input.evaluate(el=>{for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});
  await input.locator('xpath=ancestor::tr').scrollIntoViewIfNeeded();
  await input.evaluate(el=>{for(let n=el;n;n=n.parentElement)if(n.scrollWidth>n.clientWidth)n.scrollLeft=0;});
  await h.page.screenshot({path:path.join(folder,process.env.PAGE?'candidate-phone.png':'public-phone.png')});
 }
 result.version=await h.page.evaluate(()=>SYNC.backend.readVersion821());
 result.pass=Object.values(result.checks).every(Boolean);result.requests=h.counts;result.errors=h.errors;
 fs.writeFileSync(path.join(folder,process.env.PAGE?'candidate-verification.json':'fresh-public-verification.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({pass:result.pass,version:result.version,checks:Object.keys(result.checks).length,failed:Object.entries(result.checks).filter(([,v])=>!v).map(([k])=>k)}));
 if(!result.pass)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
