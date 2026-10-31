/* Author: Andrew Fisher. Save the actual private Inventory export for paper inspection. */
'use strict';const fs=require('fs'),path=require('path');const{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');const h=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844});try{
 await h.page.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
 const result=await h.page.evaluate(async()=>{const before=JSON.stringify(S);INV.disc='*';const file=await inv83Make(()=>{});return {name:file.name,pages:file.pages,size:file.size,orient:file.orient,nativeVersion:SYNC.backend.readVersion821(),unchanged:JSON.stringify(S)===before,bytes:Array.from(new Uint8Array(await file.blob.arrayBuffer()))};});
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'inventory-actual.pdf'),Buffer.from(result.bytes));delete result.bytes;result.author='Andrew Fisher';result.errors=h.errors;result.requests=h.counts;fs.writeFileSync(path.join(out,'pdf-checks.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.unchanged||h.errors.length||h.counts.blocked)process.exitCode=1;
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
