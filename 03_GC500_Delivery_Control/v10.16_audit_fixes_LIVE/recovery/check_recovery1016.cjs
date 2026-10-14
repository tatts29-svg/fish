/* Author: Andrew Fisher. Real shared-record recovery with API failures injected before GET-only transport. */
'use strict';
const fs=require('fs'),path=require('path'),base=path.resolve(__dirname,'../..');
const cf=require(base+'/toolchain/harness/curlfetch'),original=cf.curlFetch;
let offline=false,filesOffline=false;const requests=[];
cf.curlFetch=async function(url,headers,method,body){
 if(method!=='GET')throw Error('Recovery test refuses non-GET');const pathname=new URL(url).pathname;
 const simulated=(offline&&pathname.startsWith('/api/'))||(filesOffline&&pathname==='/api/files');
 if(['/api/files','/api/state','/api/version'].includes(pathname))requests.push({path:pathname,simulated,at:Date.now()});
 if(simulated)return{status:503,headers:{'content-type':'application/json'},body:Buffer.from('{"error":"Simulated unavailable source"}')};
 return original(url,headers,method,body);
};
const {open}=require(base+'/record_14Oct2026_purchase_order/readonly_page.cjs');
const folder=process.env.OUT_DIR;if(!folder)throw Error('Private OUT_DIR required');fs.mkdirSync(folder,{recursive:true});
const snap=p=>p.evaluate(()=>holdAssets(()=>{
 const reviews=fenceProgrammeReviews958(allDockets()),forecast=cj764Fencing(),P=pl770Model(),drawer=document.querySelector('#drawer'),body=drawer?.querySelector('.body');
 return {status:SYNC.status,version:SYNC.backend.readVersion821(),docs:{state:DOCS.state,busy:DOCS.busy,error:DOCS.error,count:Object.keys(DOCS.files||{}).length},refresh:Refresh904.report(),gauge:document.querySelector('#where885 .w885-reading')?.innerText,progressReady:progress881Model(todayIso()).ready,reviewStates:reviews.map(x=>x.state),forecast,P:{revJob:P.revJob,directJob:P.directJob},drawer:{ref:state.sel,on:!!drawer?.classList.contains('on'),top:drawer?.scrollTop,bodyTop:body?.scrollTop,folds:[...drawer?.querySelectorAll('details[open]')||[]].map(x=>x.dataset.sfold||x.querySelector('summary')?.textContent)}};
}));
const settled=async p=>p.waitForFunction(()=>SYNC.status==='live'&&Refresh904.report().state==='ready'&&photoIndex().state==='ready',null,{timeout:90000});
(async()=>{let h;const out={author:'Andrew Fisher',checks:{},samples:{}};const check=(name,ok)=>out.checks[name]=!!ok;try{
 h=await open({pageFile:process.env.PAGE,hash:'#today',W:390,H:844,mobile:true});await settled(h.page);out.samples.online=await snap(h.page);
 offline=true;await h.page.reload({waitUntil:'load',timeout:180000});await h.page.waitForTimeout(14000);out.samples.offline=await snap(h.page);
 check('offline initial registry failure remains visibly unavailable',out.samples.offline.docs.state==='failed'&&!out.samples.offline.progressReady&&out.samples.offline.status==='unreachable');
 offline=false;await h.page.locator('[data-refresh904-retry]').click();await settled(h.page);await h.page.waitForTimeout(1000);out.samples.explicit=await snap(h.page);
 check('explicit Retry restores file evidence and progress',out.samples.explicit.progressReady&&out.samples.explicit.docs.state==='ready');
 check('explicit recovery preserves record version',out.samples.explicit.version===out.samples.online.version);
 check('explicit recovery returns exact reviewed forecast and P&L',JSON.stringify(out.samples.explicit.forecast)===JSON.stringify(out.samples.online.forecast)&&JSON.stringify(out.samples.explicit.P)===JSON.stringify(out.samples.online.P));
 await h.page.evaluate(()=>{openAsset('WC09');const d=document.querySelector('#drawer');d.scrollTop=320;const b=d.querySelector('.body');if(b)b.scrollTop=320;const f=d.querySelector('details');if(f)f.open=true;document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));});await h.page.waitForTimeout(100);out.samples.drawerBefore=await snap(h.page);
 await h.page.waitForTimeout(15500);filesOffline=true;const fileStart=requests.filter(x=>x.path==='/api/files').length;await h.page.evaluate(()=>docsRefresh(true));await h.page.waitForTimeout(12000);out.samples.sourceFailed=await snap(h.page);
 const sourceAttempts=requests.filter(x=>x.path==='/api/files').length-fileStart;check('continued file failure is throttled rather than flooded',sourceAttempts<=2&&sourceAttempts>=1);
 check('failed file evidence cannot mark reviews as matched',out.samples.sourceFailed.docs.state==='failed'&&out.samples.sourceFailed.reviewStates.every(x=>x==='review'));
 filesOffline=false;await settled(h.page);await h.page.waitForTimeout(1000);out.samples.sameVersion=await snap(h.page);
 check('same-version automatic poll restores failed source',out.samples.sameVersion.version===out.samples.online.version&&out.samples.sameVersion.docs.state==='ready'&&out.samples.sameVersion.progressReady);
 check('automatic source recovery restores exact financial models',JSON.stringify(out.samples.sameVersion.forecast)===JSON.stringify(out.samples.online.forecast)&&JSON.stringify(out.samples.sameVersion.P)===JSON.stringify(out.samples.online.P));
 check('automatic source recovery preserves open reference and position',JSON.stringify(out.samples.sameVersion.drawer)===JSON.stringify(out.samples.drawerBefore.drawer));
 await h.page.screenshot({path:path.join(folder,'recovered-open-drawer.png')});
 offline=true;await h.page.reload({waitUntil:'load',timeout:180000});await h.page.waitForTimeout(14000);offline=false;await settled(h.page);await h.page.waitForTimeout(1000);out.samples.auto=await snap(h.page);
 check('automatic connection recovery works without Retry',out.samples.auto.docs.state==='ready'&&out.samples.auto.progressReady&&out.samples.auto.version===out.samples.online.version);
 check('automatic connection recovery restores exact forecast and P&L',JSON.stringify(out.samples.auto.forecast)===JSON.stringify(out.samples.online.forecast)&&JSON.stringify(out.samples.auto.P)===JSON.stringify(out.samples.online.P));
 out.requests=requests;out.errors=h.errors;out.counts=h.counts;check('no browser errors or operational writes',!h.errors.length&&!h.counts.blocked);
 out.pass=Object.values(out.checks).every(Boolean);fs.writeFileSync(path.join(folder,'recovery.json'),JSON.stringify(out,null,2));console.log(JSON.stringify({pass:out.pass,checks:out.checks,counts:h.counts,errors:h.errors}));if(!out.pass)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
