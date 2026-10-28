/* Author: Andrew Fisher. Share the existing approved FWF charge adjustment.
 * Financial projection only: no physical tick, quantity, rate or record is edited.
 * The source approves install and demob together; no split between them is inferred.
 */
(function(root){
'use strict';
const ids=['9968955|146','9994954|23'];
const approvedCents=1676240; // Existing v12.42.16 approval, unchanged.
const cents=v=>Math.round(Number(v)*100),money=v=>v/100;
function adjustment(rows,recordedByBranch){
  const observed=Object.entries(recordedByBranch||{}).filter(([,amount])=>amount!==0);
  const recordedCents=observed.reduce((n,[,amount])=>n+cents(amount),0);
  if(!recordedCents)return {applied:false,delta:0};
  const sources=ids.map(id=>{
    const matches=(rows||[]).filter(r=>String(r.rental_contract)+'|'+String(r.line)===id);
    if(matches.length!==1)throw Error('FWF approved source must occur once: '+id);
    const r=matches[0];
    if(typeof r.quantity!=='number'||!Number.isFinite(r.quantity)||typeof r.price!=='number'||!Number.isFinite(r.price))throw Error('FWF approved source amount unavailable: '+id);
    return {id,branch:r.branch_code,amountCents:cents(r.quantity*r.price)};
  });
  const branches=[...new Set(sources.map(s=>s.branch))];
  if(branches.length!==1||!branches[0]||branches[0]==='no branch')throw Error('FWF approved branch allocation needs review');
  const branch=branches[0];
  if(observed.some(([code])=>code!==branch))throw Error('FWF current and approved branches differ; allocation needs review');
  const targetCents=sources.reduce((n,s)=>n+s.amountCents,0);
  if(targetCents!==approvedCents)throw Error('FWF source no longer matches the existing approved charge');
  return {applied:true,branch,source:ids.slice(),recorded:money(recordedCents),approved:money(targetCents),delta:money(targetCents-recordedCents),basis:'Existing Baseplan FWF install and demob charge; combined amount only'};
}
function ticks(input,recordedByBranch,rows){
  if(input.fwf1244)return input;
  const a=adjustment(rows,recordedByBranch),out={...input,fwf1244:a};
  if(!a.applied)return out;
  const delta=cents(a.delta),b=input.byBranch[a.branch];
  if(!b)throw Error('FWF recorded branch missing from labour ticks');
  out.total=money(cents(input.total)+delta);
  out.install={...input.install,amount:money(cents(input.install.amount)+delta)};
  out.byBranch={...input.byBranch,[a.branch]:{...b,amount:money(cents(b.amount)+delta),install:{...b.install,amount:money(cents(b.install.amount)+delta)}}};
  return out;
}
function plan(input,a){
  if(input.fwf1244||!a?.applied)return input;
  const out={...input,fwf1244:a};
  if(!a.delta)return out;
  const delta=cents(a.delta),branch=input.byBranch.get(a.branch);
  if(!branch)throw Error('FWF recorded branch missing from labour plan');
  out.all={...input.all,charged:money(cents(input.all.charged)+delta)};
  out.byBranch=new Map(input.byBranch);
  out.byBranch.set(a.branch,{...branch,charged:money(cents(branch.charged)+delta)});
  out.byLine=new Map(input.byLine);
  out.byLine.set('FWF install and demob · approved combined adjustment',{charged:a.delta,expected:0,tocome:0,later:0,n:{charged:0,expected:0,tocome:0,later:0},unpriced:0,fwf1244:a});
  return out;
}
function revenue(sums,missing,tickModel){
  const a=tickModel.fwf1244,delta=a?.applied?cents(a.delta):0;
  const priced=money(Object.values(sums).reduce((n,v)=>n+cents(v),0)+delta);
  const recorded=tickModel.install.amount,job=Math.max(priced,recorded);
  return {sums,priced,recorded,job,remaining:money(cents(job)-cents(recorded)),missing:[...new Set(missing)],fwf1244:a};
}
const api={adjustment,ticks,plan,revenue};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.FwfLabour1244=api;
})(typeof window!=='undefined'?window:null);
