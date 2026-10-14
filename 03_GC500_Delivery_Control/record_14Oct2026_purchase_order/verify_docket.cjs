/* Author: Andrew Fisher. Fresh read-only corrected docket and financial readback. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {read,verify}=require('./native_docket.cjs');
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
 result.version=await h.page.evaluate(()=>SYNC.backend.readVersion821());
 result.pass=Object.values(result.checks).every(Boolean);result.requests=h.counts;result.errors=h.errors;
 fs.writeFileSync(path.join(folder,process.env.PAGE?'candidate-verification.json':'fresh-public-verification.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({pass:result.pass,version:result.version,checks:Object.keys(result.checks).length,failed:Object.entries(result.checks).filter(([,v])=>!v).map(([k])=>k)}));
 if(!result.pass)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
