/* Author: Andrew Fisher. Fresh public readback of the authorised fridge/container updates. */
'use strict';
const fs=require('fs'),path=require('path');
const {read,verify}=require('./native_fridges.cjs');
const {open}=require('../toolchain/harness/open_page');
const folder=process.env.GC500_RECORD_EVIDENCE;
if(!folder||!fs.existsSync(path.join(folder,'after-public.json')))throw Error('Completed apply evidence required');
const plan=JSON.parse(fs.readFileSync(path.join(folder,'proposal.json'))),staged=JSON.parse(fs.readFileSync(path.join(folder,'native-proposal.json')));
(async()=>{let h;try{
 h=await open({hash:'#plant',W:390,H:844});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const record=await h.page.evaluate(read),result=verify({...staged,record,after:record.docs},plan);
 result.checks['fresh public without substituted page or writes']=h.errors.length===0&&h.counts.blocked===0&&h.counts.page===0;
 result.version=await h.page.evaluate(()=>SYNC.backend.readVersion821());
 result.pass=Object.values(result.checks).every(Boolean);result.requests=h.counts;result.errors=h.errors;
 fs.writeFileSync(path.join(folder,'fresh-public-verification.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({pass:result.pass,version:result.version,checks:Object.keys(result.checks).length,failed:Object.entries(result.checks).filter(([,v])=>!v).map(([k])=>k)}));
 if(!result.pass)process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
