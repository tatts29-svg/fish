/* Author: Andrew Fisher. Verify supplier export using public GET-only data. */
'use strict';
const fs=require('fs');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#subhire',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(async()=>{
  const original=JSON.stringify(S),m=Supplier996.model(),days=[...new Set(m.remaining.map(r=>r.date))],results=[];
  for(const day of ['2026-10-14',...days]){
   const rows=m.receipts.filter(r=>r.date===day).concat(m.remaining.filter(r=>r.date===day));
   try{const file=await Supplier996.pdf('remaining',day);results.push({day,rows:rows.length,minRowHeight:19.6,minimumRequired:rows.length*19.6,success:!!file,fileName:file?.file?.name||file?.name,pages:file?.pages,bytes:file?.blob?.size});}
   catch(e){results.push({day,rows:rows.length,minRowHeight:19.6,minimumRequired:rows.length*19.6,success:false,error:e.message});}
  }
  try{const file=await Supplier996.pdf('remaining','');results.push({day:'all',success:!!file,pages:file?.pages});}catch(e){results.push({day:'all',success:false,error:e.message});}
  return {nativeVersion:SYNC.backend.readVersion821(),results,unchanged:original===JSON.stringify(S)};
 });
 fs.writeFileSync(process.env.OUT,JSON.stringify({author:'Andrew Fisher',...result,errors:h.errors,counts:h.counts},null,2)+'\n');console.log(JSON.stringify({...result,errors:h.errors,counts:h.counts}));
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
