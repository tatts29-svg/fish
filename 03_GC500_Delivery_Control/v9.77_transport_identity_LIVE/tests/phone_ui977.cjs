// Author: Andrew Fisher. Exact unit-rate display and both transport legs, GET-only.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{const file=process.env.PAGE;assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),process.env.EXPECTED_SHA);const h=await open({pageFile:file,W:390,H:844,mobile:true}),p=h.page,out=[];try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
 const before=await p.evaluate(()=>JSON.stringify(S));
 for(const [ref,item,rate] of [['WC09','FWF','$36.435'],['WC09','Toilet Block 6m','$145.74'],['T0103','VMS','$88.485']]){
  await p.evaluate(r=>openAsset(r),ref);
  const fold=p.locator('[data-charges952] > details').filter({has:p.locator('summary',{hasText:item+' ×'})}).first();
  await fold.evaluate(e=>e.open=true);await fold.scrollIntoViewIfNeeded();
  const text=await fold.innerText();assert(text.includes(rate),'Exact source rate '+rate);assert(text.includes('Delivery')&&text.includes('Pickup'),'Both legs');
  const bounds=await fold.evaluate(e=>{const table=e.querySelector('table'),th=table.querySelectorAll('th')[2];return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,table:table.getBoundingClientRect().width,box:e.getBoundingClientRect().width,qtyHeaderHeight:th.getBoundingClientRect().height};});
  assert(bounds.table<=bounds.box+1&&bounds.scroll<=bounds.viewport+1);assert(bounds.qtyHeaderHeight<40,'Qty header one line');
  if(ref==='T0103')assert(text.includes('Rate / allocation pending')&&!text.includes('$0 additional'));
  await p.screenshot({path:process.env.OUTDIR+'/'+ref+'-'+item.replace(/\W/g,'_')+'.png'});out.push({ref,item,rate,bounds});
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(S)),before);assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);
 const report={author:'Andrew Fisher',pass:true,sha256:process.env.EXPECTED_SHA,items:out,nativeUnchanged:true,pageErrors:h.errors,operationalWrites:h.counts.blocked};fs.writeFileSync(process.env.OUTDIR+'/phone-ui977.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
