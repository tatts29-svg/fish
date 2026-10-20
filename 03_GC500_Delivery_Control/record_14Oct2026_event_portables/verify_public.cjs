/* Author: Andrew Fisher. Fresh actual-public readback; every native write blocked. */
'use strict';
const fs=require('fs'),path=require('path');
const batch=JSON.parse(fs.readFileSync(process.env.GC500_PORTABLES_PLAN,'utf8'));
const {open}=require('../toolchain/harness/open_page');
(async()=>{let h;try{
 h=await open({hash:'#timeline',W:390,H:844});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const result=await h.page.evaluate(batch=>holdAssets(()=>{
  const s=Supplier996.model(),day=programmeDays().find(d=>d.iso===batch.day),loads=dpLoads(day).filter(l=>l._supplier996);
  return JSON.parse(JSON.stringify({author:'Andrew Fisher',at:new Date().toISOString(),version:SYNC.backend.readVersion821(),today:todayIso(),summary:s.summary,
   refs:batch.rows.map(p=>{const a=assetOf(p.ref),d=deliveryOf(p.ref);return {ref:p.ref,numbers:gcModel925(a,{loading:false}).rows.filter(u=>u.physical&&u.item==='FWF').map(u=>({asset:u.assetNo,owner:u.owner})),items:toiletRows962(a,d,chargeLines(a),batch.day),wholeComplete:completeVerified1008(p.ref),charges:arrivedChargeRows975(a)};}),
   receipts:s.receipts.filter(r=>batch.rows.some(p=>p.ref===r.ref)),
   remaining:s.remaining.filter(r=>batch.rows.some(p=>p.ref===r.ref)),
   today:loads.map(l=>({received:!!l._supplier996.actualReceipt1006,units:l._supplier996.units,refs:l.rows.map(r=>r.a.key)}))
  }));
 }),batch);
 const checks=[];function check(name,pass){checks.push({name,pass:!!pass});}
 for(const p of batch.rows){const r=result.refs.find(r=>r.ref===p.ref),fwf=r.items.rows.find(r=>r.item==='FWF');
  check(p.ref+' exact assets and EP ownership',JSON.stringify(r.numbers.map(n=>n.asset).sort())===JSON.stringify(p.numbers.slice().sort())&&r.numbers.every(n=>n.owner==='event-portables'));
  check(p.ref+' received and installed today',fwf.arrived===p.numbers.length&&fwf.done===p.numbers.length&&fwf.receiptDay===batch.day&&fwf.installDay===batch.day);
  check(p.ref+' supplier receipt dated today',result.receipts.filter(r=>r.ref===p.ref&&r.date===batch.day&&r.item==='FWF').reduce((n,r)=>n+r.count,0)===p.numbers.length);
  check(p.ref+' removed from future FWF runs',!result.remaining.some(r=>r.ref===p.ref&&r.item==='FWF'&&r.count>0));
  check(p.ref+' physical status truthful',p.ref==='WC51'?!r.wholeComplete&&r.items.rows.find(x=>x.item==='Accessible Toilet')?.arrived===0:r.wholeComplete);
  const charges=r.charges.find(c=>c.item==='FWF');check(p.ref+' install and demob quantities once',charges?.charges.filter(c=>['install','demob'].includes(c.key)).length===2&&charges.charges.every(c=>c.qty===p.numbers.length));
 }
 check('24 FWF receipts appear in Build today',result.today.filter(l=>l.received).reduce((n,l)=>n+l.units,0)===24);
 check('No more FWF proposed after daily24',result.today.filter(l=>!l.received).reduce((n,l)=>n+l.units,0)===0);
 check('No errors, writes or substituted page',h.errors.length===0&&h.counts.blocked===0&&h.counts.page===0);
 Object.assign(result,{checks,pass:checks.every(c=>c.pass),errors:h.errors,requests:h.counts});
 fs.writeFileSync('/workspace/private-portables14Oct2026/fresh-public-verification.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({pass:result.pass,checks:checks.length,version:result.version,summary:result.summary,failed:checks.filter(c=>!c.pass)}));
 if(!result.pass)process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
