// Author: Andrew Fisher. Independent native reference/item oracle, v8.43.
// Native values belong only in callers' private evidence directories.
'use strict';
const {nativeInputs,oracle840}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const groupQA=require('../v8.41_timeline_fencing_clarity_LIVE/test_group_ownership841.cjs');
const {summaryInputs842,referencePlan842,summaryOracle842}=require('../v8.42_today_plan_clarity_LIVE/test_summary_oracle842.cjs');
const {fencingInputs841,fencingOracle841}=require('../v8.42_today_plan_clarity_LIVE/test_today842.cjs');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),round=n=>Math.round(n*100)/100;
const finite=n=>typeof n==='number'&&Number.isFinite(n),whole=n=>finite(n)&&Number.isInteger(n)&&n>=0;
const identity=t=>JSON.stringify([t.cardId,t.groupId,t.name]);
async function typeInputs843(page,day){
 return {day,work:await nativeInputs(page,day),groups:await groupQA.readNativeGroupInputs841(page,day),plan:await summaryInputs842(page,day),fencing:await fencingInputs841(page,day)};
}
function typeOracle843(input){
 const areas=oracle840(input.work),groups=groupQA.groupOracle841(input.groups,areas),fencing=fencingOracle841(input.fencing),summary=summaryOracle842(input.plan,areas,fencing);
 const conflicts=new Set(areas.flatMap(a=>(a.rows||[]).filter(r=>r.recordedComplete&&!r.complete).map(r=>r.key))),native=new Map(input.groups.rows.map(r=>[r.key,r])),instruments=[];
 for(const cardId of groupQA.ids)for(const group of groups[cardId].groups)for(const type of group.types){
  const physical=group.id!=='Track mat';
  const rows=type.keys.map(key=>{
   const r=native.get(key),matches=l=>(l.item||'Item description unconfirmed')===type.name,lines=r.lines.filter(matches),knownQuantity=physical?round(lines.reduce((n,l)=>n+(whole(l.quantity)?l.quantity:0),0)):null,known=physical&&lines.length>0&&lines.every(l=>whole(l.quantity)),conflict=r.done&&(r.shorts.some(item=>lines.some(l=>l.item===item))||conflicts.has(key));
   const quantity=known?knownQuantity:null,done=physical&&!conflict&&r.done?knownQuantity:physical?0:null,left=quantity==null||done==null?null:Math.max(0,quantity-done),itemShort=r.done&&r.shorts.some(item=>lines.some(l=>l.item===item));
   return {key,quantity,knownQuantity,recordedComplete:r.done,conflict:!!conflict,conflictReason:itemShort?'item-short':r.done&&conflicts.has(key)?'reference-review':null,complete:r.done&&!conflict,done,left,remaining:left,onSite:[...new Set(lines.map(l=>l.item))].reduce((n,item)=>n+(new Map(r.onBy).get(item)||0),0)};
  });
  const review=rows.filter(r=>r.conflict),knownTotal=physical?type.knownQuantity:null,total=type.quantityKnown?knownTotal:null,done=physical?type.knownComplete:null,left=total!=null&&done!=null?round(Math.max(0,total-done)):null,lower=review.length>0;
  const pct=total>0&&done!=null?(lower?Math.floor(done/total*10000)/100:round(done/total*100)):null;
  instruments.push({kind:'asset-type',cardId,groupId:group.id,name:type.name,unit:type.unit,total,knownTotal,scheduleTotal:type.total,done,left,pct,pctKind:pct==null?'unknown':lower?'lower-bound':'confirmed',onSite:type.onSite,reviewQuantity:review.every(r=>finite(r.quantity))?round(review.reduce((n,r)=>n+r.quantity,0)):null,reviewRefs:review.map(r=>r.key),keys:type.keys,rows,plan:referencePlan842(type.keys,input.plan),unknownKeys:rows.filter(r=>r.quantity==null).map(r=>r.key)});
 }
 return {areas,groups,summary,instruments,fencing:summary.fencingRows};
}
function assertTypeModel843(check,label,actual,expected){
 const asset=actual.instruments.filter(t=>t.kind==='asset-type'),fence=actual.instruments.filter(t=>t.kind==='fence-work');
 check(label+' all native asset types have exactly one instrument owner',same(asset.map(identity).sort(),expected.instruments.map(identity).sort())&&new Set(actual.instruments.map(t=>t.id)).size===actual.instruments.length,{expected:expected.instruments.map(identity),actual:asset.map(identity)});
 check(label+' all supported Build fencing types have exactly one instrument',same(fence.map(t=>t.fenceId).sort(),expected.fencing.map(t=>t.id).sort()),{expected:expected.fencing.map(t=>t.id),actual:fence.map(t=>t.fenceId)});
 for(const want of expected.instruments){
  const got=asset.find(t=>identity(t)===identity(want)),keys=['cardId','groupId','name','unit','total','knownTotal','scheduleTotal','done','left','pct','pctKind','onSite','reviewQuantity','reviewRefs','keys'];
  check(label+' '+want.groupId+' / '+want.name+' quantities and qualified percentage reconcile independently',!!got&&keys.every(k=>same(got[k],want[k])),{expected:Object.fromEntries(keys.map(k=>[k,want[k]])),actual:got&&Object.fromEntries(keys.map(k=>[k,got[k]]))});
  check(label+' '+want.groupId+' / '+want.name+' plan compares only its member references',got&&Object.keys(want.plan).every(k=>same(got.plan[k],want.plan[k]))&&/references/.test(got.plan.basis),{expected:want.plan,actual:got?.plan});
  check(label+' '+want.groupId+' / '+want.name+' exact reference quantities reconcile without extra order scope',got&&same(got.rows.map(r=>r.key),want.rows.map(r=>r.key))&&want.rows.every(r=>{const a=got.rows.find(x=>x.key===r.key);return a&&Object.keys(r).every(k=>same(a[k],r[k]));})&&got.unquantifiedRefs===want.unknownKeys.length,{expected:want.rows,actual:got?.rows});
  if(want.pctKind==='lower-bound')check(label+' '+want.groupId+' / '+want.name+' review work stays in Left and lower percentage is floored',got.pct<=got.done/got.total*100&&got.left===got.total-got.done&&same(got.reviewRefs,want.reviewRefs),got);
 }
 for(const want of expected.fencing){const got=fence.find(t=>t.fenceId===want.id);check(label+' '+want.id+' keeps separate Build units and dated comparison',got&&['unit','total','done','left','pct'].every(k=>got[k]===want[k])&&Object.keys(want.plan).every(k=>same(got.plan[k],want.plan[k])),{expected:want,actual:got});}
 check(label+' type coverage guard is ready and complete',actual.health.ready&&actual.coverage.allRepresented,actual.coverage);
}
module.exports={typeInputs843,typeOracle843,assertTypeModel843,identity,same,round};
