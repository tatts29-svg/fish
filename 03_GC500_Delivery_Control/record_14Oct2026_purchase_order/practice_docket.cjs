/* Author: Andrew Fisher. Read-only supplier-pricing and corrected-docket integration practice. */
'use strict';
const fs=require('fs'),path=require('path');
const base=__dirname,out=process.env.GC500_DOCKET_EVIDENCE;
if(!out||!process.env.GC500_PO_SPEC||!process.env.GC500_DOCKET_SPEC||!process.env.PAGE)throw Error('Private specs, candidate PAGE and evidence folder required');
fs.mkdirSync(out,{recursive:true,mode:0o700});
const {open}=require(base+'/readonly_page.cjs'),price=require(base+'/native_pricing.cjs'),docket=require(base+'/native_docket.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#fencing'});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const input={pricing:JSON.parse(fs.readFileSync(process.env.GC500_PO_SPEC)),docket:JSON.parse(fs.readFileSync(process.env.GC500_DOCKET_SPEC)),pricePrepare:price.prepare.toString(),priceApply:price.apply.toString(),prepare:docket.prepare.toString(),apply:docket.apply.toString()};
 const staged=await h.page.evaluate(i=>{
  S.operator='Andrew Fisher via Codex';capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';SYNC.readonly=false;SYNC.level='edit';syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;syncStage();};
  const pricePlan=(0,eval)('('+i.pricePrepare+')')(i.pricing),priceResult=(0,eval)('('+i.priceApply+')')(pricePlan);
  const prepareDocket=(0,eval)('('+i.prepare+')'),guards={},docsBefore=fencePaperCanonical898(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
  const reject=(label,change)=>{const bad=JSON.parse(JSON.stringify(i.docket));change(bad);try{prepareDocket(bad);guards[label]=false;}catch(e){guards[label]=true;}};
  reject('reject extra quantity changes',s=>s.changes.quantities.scrim=1);
  reject('reject extra component changes',s=>s.changes.components.base=s.before.components.base+1);
  reject('reject stale original quantity',s=>s.before.quantities.clean+=1);
  reject('reject changed card rate',s=>s.customer_rate+=0.01);
  reject('reject changed approved PO total',s=>s.po_amount+=0.01);
  reject('reject changed supplier allocation',s=>s.supplier_amount+=0.01);
  reject('reject missing source evidence',s=>delete s.source.sha256);
  reject('reject wrong rounded customer amount',s=>s.revenue_after+=0.01);
  guards['rejected plans do not mutate native records']=docsBefore===fencePaperCanonical898(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
  const plan=prepareDocket(i.docket),result=(0,eval)('('+i.apply+')')(plan);
  return {pricePlan,priceResult,plan,result,guards};
 },input);
 const validation=docket.verify(staged.result,staged.plan);Object.assign(validation.checks,staged.guards);
 validation.checks['no browser errors or operational write attempts']=h.errors.length===0&&h.counts.blocked===0;
 validation.pass=Object.values(validation.checks).every(Boolean);
 fs.writeFileSync(path.join(out,'stage.json'),JSON.stringify(staged,null,2)+'\n',{mode:0o600});
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...validation,requests:h.counts,errors:h.errors},null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({pass:validation.pass,checks:Object.keys(validation.checks).length,failed:Object.entries(validation.checks).filter(([,v])=>!v).map(([k])=>k),delta:validation.delta,requests:h.counts,errors:h.errors}));
 if(!validation.pass)process.exitCode=1;
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
