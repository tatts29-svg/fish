/* Author: Andrew Fisher. Read-only live-data test; mutations stay in a detached cloned record. */
const fs=require('fs'),assert=require('assert'),path=require('path');const {open}=require('../../toolchain/harness/open_page');
(async()=>{const s=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844});try{await s.page.waitForFunction(()=>typeof assetOf==='function'&&typeof S!=='undefined'&&S.delivery&&Object.keys(S.delivery).length>20,{timeout:90000});
const result=await s.page.evaluate(async()=>{
 const original=S,cloned=JSON.parse(JSON.stringify(S)),events=[];S=cloned;
 const backup={mayWrite,whoAmI,save,bump,stampIt,flash};mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher';save=()=>events.push('save-capture');bump=()=>events.push('bump-capture');stampIt=(c,k,who)=>{S.stamps=S.stamps||{};S.by=S.by||{};S.stamps[c+'/'+k]=new Date().toISOString();S.by[c+'/'+k]=who;events.push('stamp:'+c);};flash=()=>{};
 try{
 const a=assetOf('WC09'),l=chargeLines(a).find(l=>l.item==='Toilet Block 6m'),us=labourUnits(a,l.item),before=JSON.stringify({labour:S.labour,delivery:S.delivery,photos:S.dropPhotos});
 if(us.length!==2)throw new Error('WC09 numbered blocks scope not exactly two');
 const ok=Stairs975.save(a.key,l.discipline,l.item,us[0],1),doc=Stairs975.record(a.key,l.discipline,l.item,us[0]),qty=Stairs975.quantity(a,l),sibling=Stairs975.excluded(a.key,l.discipline,l.item,us[1]);
 const docs=toDocs('loads');const nativePayload=fromDocs('loads',docs);S.loads=JSON.parse(JSON.stringify(nativePayload));const reloaded=Stairs975.quantity(a,l),restored=Stairs975.save(a.key,l.discipline,l.item,us[0],0),afterqty=Stairs975.quantity(a,l),history=Stairs975.record(a.key,l.discipline,l.item,us[0]).history.length;
 return {ok,qty,sibling,reloaded,restored,afterqty,history,doc,units:us,unchanged:before===JSON.stringify({labour:S.labour,delivery:S.delivery,photos:S.dropPhotos}),events};
 }finally{Object.assign(window,backup);S=original;}
});assert(result.ok&&result.qty===1&&!result.sibling&&result.reloaded===1&&result.restored&&result.afterqty===0&&result.history===2&&result.unchanged);assert(!s.counts.blocked,'No operational requests attempted');assert(!s.errors.length,JSON.stringify(s.errors));
console.log(JSON.stringify({author:'Andrew Fisher',passed:true,result,operationalWrites:0,errors:s.errors,counts:s.counts},null,2));}finally{await s.browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
