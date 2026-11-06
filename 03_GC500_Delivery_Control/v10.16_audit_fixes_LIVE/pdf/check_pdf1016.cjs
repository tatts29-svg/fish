/* Author: Andrew Fisher. GET-only supplier PDF exports, row/QR preservation and page evidence. */
'use strict';
const fs=require('fs'),path=require('path');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#subhire',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(async()=>{
  const original=JSON.stringify(S),m=Supplier996.model(),days=[...new Set(m.remaining.map(r=>r.date))],results=[],checks=[],qr=epQrPdf860,log=[];
  epQrPdf860=function(doc,url,x,y,size){log.push({url,x,y,size,page:doc.internal.getCurrentPageInfo().pageNumber});return qr.apply(this,arguments);};
  try{
   for(const day of ['2026-10-14',...days,'']){
    log.length=0;const rows=(day?m.receipts.filter(r=>r.date===day):m.receipts.filter(r=>r.date===m.asAt)).concat(m.remaining.filter(r=>!day||r.date===day));
    const expectedUrls=rows.map(r=>r.dispatchUrl||r.url||'').filter(Boolean).sort();
    try{
     const file=await Supplier996.pdf('remaining',day),data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.readAsDataURL(file.blob);});
     const expected=rows.map(r=>({ref:Supplier996.displayRef(r),date:r.date,qty:r.actualReceipt1006?r.count:r.remaining,location:epText860(r.location),numbers:r.numbers}));
     const urls=log.map(r=>r.url).sort(),sameQr=JSON.stringify(urls)===JSON.stringify(expectedUrls),qrGeometry=log.every(r=>r.size===18&&r.y>=53&&r.y+18<=269);
     results.push({day:day||'all',rows:rows.length,success:true,pages:file.pages,bytes:file.blob.size,qr:[...log],expected,data});
     checks.push({name:(day||'all')+' every verified QR appears once',pass:sameQr},{name:(day||'all')+' QRs retain readable size and fit page',pass:qrGeometry});
    }catch(e){results.push({day:day||'all',rows:rows.length,success:false,error:e.message});}
   }
  }finally{epQrPdf860=qr;}
  checks.push({name:'all requested exports succeed',pass:results.every(r=>r.success)},{name:'native records unchanged',pass:original===JSON.stringify(S)});
  return {nativeVersion:SYNC.backend.readVersion821(),results,checks};
 });
 for(const r of result.results)if(r.data){fs.writeFileSync(path.join(out,r.day+'.pdf'),Buffer.from(r.data,'base64'));delete r.data;}
 result.checks.push({name:'no errors or operational writes',pass:!h.errors.length&&!h.counts.blocked});
 fs.writeFileSync(path.join(out,'exports.json'),JSON.stringify({author:'Andrew Fisher',...result,errors:h.errors,counts:h.counts},null,2)+'\n');
 console.log(JSON.stringify({checks:result.checks.length,failed:result.checks.filter(c=>!c.pass),exports:result.results.map(r=>({day:r.day,pages:r.pages,success:r.success,error:r.error})),errors:h.errors,counts:h.counts}));
 if(result.checks.some(r=>!r.pass))process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
