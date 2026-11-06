// Author: Andrew Fisher. Fresh public readback; every operational write is blocked.
'use strict';
const fs=require('fs'),path=require('path');
const {open}=require('../record_14Oct2026_purchase_order/readonly_page.cjs');
const {read,verify}=require('./native_scope.cjs');
(async()=>{let h;try{
 const dir=process.env.GC500_WC09_RECORD;if(!dir)throw Error('Private applied record directory required');
 const proposal=JSON.parse(fs.readFileSync(path.join(dir,'proposal.json'),'utf8'));
 const applied=JSON.parse(fs.readFileSync(path.join(dir,'result.json'),'utf8'));
 if(applied.practice||!applied.pass)throw Error('Applied record proof required');
 h=await open({hash:'#today',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const record=await h.page.evaluate(read);
 const result=verify({record,after:record.docs},proposal);
 result.checks['fresh expected native version']=record.version===applied.afterVersion;
 await h.page.evaluate(()=>openAsset('WC09'));
 await h.page.screenshot({path:path.join(dir,'public-phone.png')});
 const drawer=await h.page.locator('#drawer').innerText();
 result.checks['drawer shows ten planned']=drawer.includes('10 planned');
 result.checks['fresh public without substitution or writes']=!h.errors.length&&!h.counts.blocked&&!h.counts.page;
 result.pass=Object.values(result.checks).every(Boolean);
 fs.writeFileSync(path.join(dir,'fresh-public.json'),JSON.stringify({author:'Andrew Fisher',...result,record,drawer,errors:h.errors,requests:h.counts},null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({pass:result.pass,checks:Object.keys(result.checks).length,failed:Object.entries(result.checks).filter(([,v])=>!v).map(([k])=>k),version:record.version,requests:h.counts}));
 if(!result.pass)process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
