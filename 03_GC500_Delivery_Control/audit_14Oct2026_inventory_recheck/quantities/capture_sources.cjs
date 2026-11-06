/* Author: Andrew Fisher. Private source snapshot; actual public page, GET only. */
'use strict';
const fs=require('node:fs');const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({hash:'#today'});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{const before=JSON.stringify(S);const out={author:'Andrew Fisher',captured:new Date().toISOString(),nativeVersion:SYNC.backend.readVersion821(),native:S,assets:allAssets(),onhire:ONHIRE_ROWS,data:DATA,demob:demob816(),chargeLines:Object.fromEntries(allAssets().map(a=>[a.key,chargeLines(a)]))};out.nativeUnchanged=before===JSON.stringify(S);return out;}));
 result.errors=h.errors;result.requests=h.counts;if(!process.env.OUT)throw Error('Private OUT required');fs.writeFileSync(process.env.OUT,JSON.stringify(result));console.log(JSON.stringify({nativeVersion:result.nativeVersion,assets:result.assets.length,contracts:result.onhire.length,nativeUnchanged:result.nativeUnchanged,errors:h.errors,requests:h.counts}));
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
