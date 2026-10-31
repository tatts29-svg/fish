'use strict';
const fs=require('fs');const {open}=require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000}),p=h.page;
try{await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const c=x=>Math.round(x*100)/100;const lines={};for(const x of ONHIRE_ROWS){let ch={};try{ch=contractCharge(x)}catch(e){ch={err:1}};let tr=null;try{tr=typeof contractTreatment747==='function'&&contractTreatment747(x)?contractTreatment747(x).kind:null}catch(e){}
lines[x.rental_contract+'/'+x.line]={d:String(x.description||'').slice(0,46),st:x.status_as_written,q:x.quantity,r:x.rate_1,from:x.start_date,to:x.demob_date,br:generatorBranch1004(x),amt:typeof ch.amount==='number'?c(ch.amount):null,tr,sub:!!x.subhired,cl:!!x.charge_line,fam:x.family,m:(x.match||{}).key||(x.match||{}).task_id||null}}
const m=moneySummary();const b={};pl752Rows().forEach(x=>b[x.code]=c(x.total));let rev=null;try{rev=pl770Model().rev.map(r=>[r.code,r.line,c(+r.job||0)])}catch(e){rev=String(e)}
return {charge:c(m.charge.total),cost:c(m.cost.known),branches:b,rev,lines}});
r.errors=h.errors.length;fs.writeFileSync(process.env.OUT,JSON.stringify(r));console.log('ok',r.charge,r.errors)}catch(e){console.log('ERR',e.message)}await h.browser.close();})();
