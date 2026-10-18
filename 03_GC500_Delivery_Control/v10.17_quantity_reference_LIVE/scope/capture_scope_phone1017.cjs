/* Author: Andrew Fisher. Phone preview of an in-memory planned quantity change; never publishes. */
'use strict';const fs=require('node:fs');const{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#today',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const before=await h.page.evaluate(()=>{
  window.__scopePhone1017={native:JSON.stringify(S),save,bump,mayWrite,whoAmI,version:SYNC.backend.readVersion821()};
  save=()=>{sharedCache975();return true};bump=()=>{save();return true};mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';
  if(!setQty('WC09','6'))throw Error('Native planned quantity practice failed');
  openAsset('WC09');return {version:SYNC.backend.readVersion821(),items:toiletRows962(assetOf('WC09'),deliveryOf('WC09'),chargeLines(assetOf('WC09')),todayIso())};
 });
 await h.page.screenshot({path:process.env.OUT+'.png'});
 const after=await h.page.evaluate(()=>{
  const old=window.__scopePhone1017,body=document.querySelector('#drawer')?.innerText||'';
  for(const k of Object.keys(S))delete S[k];Object.assign(S,JSON.parse(old.native));save=old.save;bump=old.bump;mayWrite=old.mayWrite;whoAmI=old.whoAmI;sharedCache975();delete window.__scopePhone1017;
  return {drawerText:body,nativeRestored:JSON.stringify(S)===old.native,versionUnchanged:SYNC.backend.readVersion821()===old.version};
 });
 fs.writeFileSync(process.env.OUT+'.json',JSON.stringify({author:'Andrew Fisher',practiceOnly:true,before,after,errors:h.errors,requests:h.counts},null,2));
 console.log(JSON.stringify({nativeRestored:after.nativeRestored,versionUnchanged:after.versionUnchanged,errors:h.errors,requests:h.counts,screenshot:process.env.OUT+'.png'}));
 if(!after.nativeRestored||!after.versionUnchanged||h.errors.length||h.counts.blocked)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
