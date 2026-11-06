/* Author: Andrew Fisher. Read-only startup, cached record and connection recovery audit. */
'use strict';
const fs=require('fs'),path=require('path');
const cf=require('../../toolchain/harness/curlfetch');
const original=cf.curlFetch;let unavailable=false;
cf.curlFetch=async function(url,headers,method,body){
 if(method!=='GET')throw Error('Audit refuses non-GET');
 if(unavailable&&new URL(url).pathname.startsWith('/api/'))return {status:503,headers:{'content-type':'application/json'},body:Buffer.from('{"error":"Audit simulated connection unavailable"}')};
 return original(url,headers,method,body);
};
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const folder=process.env.OUT_DIR;if(!folder)throw Error('Private OUT_DIR required');
fs.mkdirSync(folder,{recursive:true});
const sample=async p=>p.evaluate(()=>({
 route:location.hash,tab:typeof state!=='undefined'?state.tab:null,
 refresh:typeof Refresh904!=='undefined'?Refresh904.report():null,
 status:typeof SYNC!=='undefined'?SYNC.status:null,
 first:typeof SYNC!=='undefined'?SYNC.first.size:null,
 banner:document.querySelector('#refresh904')?.innerText,
 bannerVisible:!!document.querySelector('#refresh904')?.getClientRects().length,
 visiblePane:document.querySelector('main .pane:not([hidden])')?.id,
 storageKeys:Object.keys(localStorage).length,
 marker:document.documentElement.getAttribute('data-refresh904'),
 mainText:document.querySelector('main .pane:not([hidden])')?.innerText.slice(0,500),
 version:typeof SYNC!=='undefined'&&SYNC.backend?.readVersion821?SYNC.backend.readVersion821():null
}));
(async()=>{let h,fresh;const result={author:'Andrew Fisher',checks:{}};try{
 const start=Date.now();h=await open({pageFile:process.env.PAGE,hash:'#today',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&Refresh904.report().state==='ready',null,{timeout:180000});
 result.online=await sample(h.page);result.onlineElapsedMs=Date.now()-start;
 result.checks['cold hash opens Today after shared record ready']=result.online.tab==='today'&&result.online.refresh.settled;
 result.static=await h.page.evaluate(()=>({favicon:document.querySelector('link[rel=icon]')?.href?.startsWith('data:image/svg+xml,'),loadingPanel:!!document.querySelector('#refresh904'),noscript:!!document.querySelector('noscript'),linkPreview:!!document.querySelector('meta[property="og:title"]')}));
 unavailable=true;
 await h.page.reload({waitUntil:'load',timeout:180000});await h.page.waitForTimeout(14000);
 result.cachedOffline=await sample(h.page);await h.page.screenshot({path:path.join(folder,'cached-offline.png')});
 result.checks['cached unavailable record is labelled stale']=result.cachedOffline.refresh.state==='saved'&&result.cachedOffline.status!=='live';
 unavailable=false;await h.page.locator('[data-refresh904-retry]').click();
 await h.page.waitForFunction(()=>SYNC.status==='live'&&Refresh904.report().state==='ready',null,{timeout:120000});result.recovered=await sample(h.page);
 result.checks['Retry recovers shared record and selected route']=result.recovered.tab==='today'&&result.recovered.refresh.settled;
 unavailable=true;fresh=await open({pageFile:process.env.PAGE,hash:'#today',W:390,H:844,mobile:true});await fresh.page.waitForTimeout(14000);
 result.firstVisitOffline=await sample(fresh.page);await fresh.page.screenshot({path:path.join(folder,'first-visit-offline.png')});
 result.checks['first visit with unavailable service presents recovery control']=await fresh.page.locator('[data-refresh904-retry]').isVisible();
 result.errors=[...h.errors,...fresh.errors];result.requests={warm:h.counts,fresh:fresh.counts};result.checks['no unexpected browser errors or operational writes']=!result.errors.length&&!h.counts.blocked&&!fresh.counts.blocked;
 result.pass=Object.values(result.checks).every(Boolean);fs.writeFileSync(path.join(folder,'recovery.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pass:result.pass,checks:result.checks,onlineElapsedMs:result.onlineElapsedMs,states:[result.online.refresh,result.cachedOffline.refresh,result.recovered.refresh,result.firstVisitOffline.refresh]}));
}finally{if(h)await h.browser.close();if(fresh)await fresh.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
