/* Author: Andrew Fisher. Native, item-scoped arrival and installation; private input plan. */
'use strict';
const fs=require('fs');
const batch=JSON.parse(fs.readFileSync(process.env.GC500_PORTABLES_PLAN,'utf8'));
if(batch.author!=='Andrew Fisher'||batch.day!=='2026-10-14'||!batch.rows.length)throw Error('Review the authorised plan');
const source=`const batch=${JSON.stringify(batch)};
const clone=x=>JSON.parse(JSON.stringify(x));
function capture(){return holdAssets(()=>{const supplier=Supplier996.model();const day=programmeDays().find(d=>d.iso===batch.day);return clone({
 today:todayIso(),docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
 refs:batch.rows.map(p=>{const a=assetOf(p.ref),d=deliveryOf(p.ref);return {ref:p.ref,asset:a,delivery:d,units:gcModel925(a,{loading:false}).rows,lines:chargeLines(a).map(l=>({item:l.item,discipline:l.discipline,quantity:qtyOf(l)})),items:toiletRows962(a,d,chargeLines(a),batch.day),charges:arrivedChargeRows975(a)};}),
 supplier:{summary:supplier.summary,rows:supplier.rows.filter(r=>batch.rows.some(p=>p.ref===r.ref)),receipts:supplier.receipts.filter(r=>batch.rows.some(p=>p.ref===r.ref)),remaining:supplier.remaining.filter(r=>batch.rows.some(p=>p.ref===r.ref))},
 daily:day?dpLoads(day).filter(l=>l._supplier996):[]
 });});}
function validateBefore(record){
 if(record.today!==batch.day)throw Error('Current AEST day differs from authorised receipt day');
 const seen=new Set();
 for(const p of batch.rows){
  if(!/^WC[0-9]+$/.test(p.ref)||!p.numbers.length)throw Error('Invalid reference plan');
  const a=assetOf(p.ref),m=gcModel925(a,{loading:false}),lines=chargeLines(a),l=lines.find(l=>l.item==='FWF');
  if(!a||a._cancelled||movedAway(p.ref)||!l||qtyOf(l)!==p.numbers.length)throw Error('Current scope differs: '+p.ref);
  if(m.rows.some(u=>u.physical&&u.item==='FWF'))throw Error('Reference already has physical FWF records: '+p.ref);
  for(const n of p.numbers){if(!/^\\d{4}$/.test(n)||seen.has(n))throw Error('Duplicate or malformed plan number');seen.add(n);}
 }
 for(const a of allAssets()){if(a._cancelled||movedAway(a.key))continue;for(const u of gcModel925(a,{loading:false}).rows){if(u.active!==false&&u.source!=='history'&&seen.has(u.assetNo))throw Error('Asset number already recorded: '+a.key+'/'+u.assetNo);}}
}
`;
const prepare=new Function('return function(){'+source+'const record=capture();validateBefore(record);return {before:record.docs,expected:record,batch};}')();
const apply=new Function('return function(plan){'+source+`
 const before=capture();validateBefore(before);
 if(fencePaperCanonical898(before.docs)!==fencePaperCanonical898(plan.before))throw Error('Native record changed before action');
 const actions=[];
 for(const p of batch.rows){
  const a=assetOf(p.ref),lines=chargeLines(a),single=lines.every(l=>l.item==='FWF');
  for(const no of p.numbers){const r=unit925Save(p.ref,{item:'FWF',owner:'event-portables',assetNo:no,label:'FWF',branch:'',note:'Arrival and installation confirmed by Andrew Fisher, 14 Oct 2026.',sourceKey:''},'','null','');if(!r.ok||r.kept===false)throw Error(r.reason);actions.push({ref:p.ref,asset:no,key:r.key});}
  if(setSupplied(p.ref,'FWF',{supplied:'FWF',qty_supplied:p.numbers.length})===false)throw Error('Receipt failed');
  if(!setLabour(p.ref,'Toilets & amenities','FWF','install',true))throw Error('Item installation failed');
  if(single){if(!setDate(p.ref,batch.day,'in')||!setDone(p.ref,true))throw Error('Reference completion failed');}
 }
 const after=capture();
 return {before:before.docs,after:after.docs,record:after,actions,queue:clone(SYNC.queue)};
}`)();
function verify(staged,plan){
 const checks={day:staged.record.today===batch.day};
 const canon=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
 for(const p of batch.rows){
  const r=staged.record.refs.find(r=>r.ref===p.ref),old=plan.expected.refs.find(r=>r.ref===p.ref),units=r.units.filter(u=>u.physical&&u.item==='FWF');
  checks[p.ref+' unique EP identities']=units.length===p.numbers.length&&units.every(u=>u.owner==='event-portables')&&canon(units.map(u=>u.assetNo).sort())===canon(p.numbers.slice().sort());
  const item=r.items.rows.find(x=>x.item==='FWF');
  checks[p.ref+' received and installed']=item.arrived===p.numbers.length&&item.done===p.numbers.length&&item.complete&&item.receiptDay===batch.day&&item.installDay===batch.day;
  checks[p.ref+' dated supplier receipt']=staged.record.supplier.receipts.filter(x=>x.ref===p.ref&&x.item==='FWF'&&x.date===batch.day).reduce((n,x)=>n+x.count,0)===p.numbers.length;
  checks[p.ref+' not remaining']=!staged.record.supplier.remaining.some(x=>x.ref===p.ref&&x.item==='FWF'&&x.count>0);
  if(r.lines.every(l=>l.item==='FWF'))checks[p.ref+' complete light']=r.delivery.state==='on site'&&r.delivery.done===true;
  else{
   checks[p.ref+' other items untouched']=canon(r.items.rows.filter(x=>x.item!=='FWF'))===canon(old.items.rows.filter(x=>x.item!=='FWF'));
   checks[p.ref+' whole status untouched']=canon(r.delivery)===canon(old.delivery);
  }
 }
 const allowed=new Set(['loads','delivery','supplied','labour','stamps','by']);
 const refs=new Set(batch.rows.map(p=>p.ref)), actionKeys=new Set(staged.actions.map(a=>a.key));
 for(const coll of new Set([...Object.keys(staged.before),...Object.keys(staged.after)])){
  if(canon(staged.before[coll]||{})!==canon(staged.after[coll]||{}))checks['allowed collection '+coll]=allowed.has(coll);
  for(const id of new Set([...Object.keys(staged.before[coll]||{}),...Object.keys(staged.after[coll]||{})])){
   const old=staged.before[coll]?.[id],body=staged.after[coll]?.[id];if(canon(old)===canon(body))continue;
   const k=body?._k||old?._k||id;
   const targeted=coll==='loads'?!!body&&actionKeys.has(k)&&refs.has(body.ref)&&body.owner==='event-portables'&&body.item==='FWF':
    ['delivery','supplied'].includes(coll)?refs.has(k):
    coll==='labour'?[...refs].some(r=>k===r+'|Toilets & amenities|FWF|install'):
    ['stamps','by'].includes(coll)?[...actionKeys].some(key=>k==='loads/'+key)||[...refs].some(r=>k==='supplied/'+r+'/FWF'||k==='labour/'+r+'|Toilets & amenities|FWF|install'):false;
   checks['targeted '+coll+'/'+id]=targeted;
  }
 }
 const n=batch.rows.reduce((n,p)=>n+p.numbers.length,0),old=plan.expected.supplier.summary,now=staged.record.supplier.summary;
 checks['supplier delta exactly authorised']=now.received-old.received===n&&now.identified-old.identified===n&&now.fwf.received-old.fwf.received===n&&old.remaining-now.remaining===n&&now.quantityOnly===old.quantityOnly;
 const actual=staged.record.daily.filter(l=>l._supplier996?.actualReceipt1006).reduce((n,l)=>n+Number(l._supplier996.units||0),0),planned=staged.record.daily.filter(l=>!l._supplier996?.actualReceipt1006).reduce((n,l)=>n+Number(l._supplier996.units||0),0);
 checks['today cap includes recorded receipts']=actual>=n&&actual+planned<=24;
 for(const r of staged.record.refs){const p=batch.rows.find(p=>p.ref===r.ref),item=r.charges.find(c=>c.item==='FWF');checks[r.ref+' applicable automatic work once']=!!item&&item.arrived===p.numbers.length&&item.charges.every(c=>c.qty<=p.numbers.length)&&item.charges.filter(c=>c.key==='install'||c.key==='demob').length===2;}
 checks['no rate changes']=!['rates','finance745','pos','fencing','rental','branch'].some(c=>canon(staged.before[c]||{})!==canon(staged.after[c]||{}));
 return {author:'Andrew Fisher',pass:Object.values(checks).every(Boolean),checks,units:batch.rows.reduce((n,p)=>n+p.numbers.length,0)};
}
module.exports={prepare,apply,verify};
