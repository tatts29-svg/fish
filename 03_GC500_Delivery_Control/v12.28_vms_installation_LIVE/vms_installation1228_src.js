/* Author: Andrew Fisher. Standalone received boards use the existing installation
 * charge path. This projection never changes a receipt, completion, hire or load. */
(function(root){
'use strict';
const list=x=>Array.isArray(x)?x:[], text=x=>String(x??'').trim(), norm=x=>text(x).toUpperCase();
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
function identities(b){
 const out=[];
 if(text(b.key))out.push('ref:'+norm(b.key));
 if(text(b.co)&&text(b.fleet))out.push('fleet:'+norm(b.co)+'|'+norm(b.fleet));
 if(text(b.contract)&&text(b.line))out.push('contract:'+text(b.contract)+'|'+text(b.line));
 return out;
}
function project(input,chargeProject){
 const boards=list(input?.boards), covered=new Set(list(input?.covered).flatMap(identities)), claims=new Map(), seen=new Set(), rows=[], slots=[], issues=[];
 for(const b of boards)for(const id of identities(b)){if(!claims.has(id))claims.set(id,new Set());claims.get(id).add(text(b.key));}
 for(const b of boards){
  const ref=text(b.key), ids=identities(b);
  if(!ref||seen.has(ref))continue;seen.add(ref);
  // A grouped or ambiguous physical identity remains with its existing scope;
  // a partial group is never made up with inferred standalone charges.
  if(b.delivery||b.excluded||b.unresolved||b.received!==true||ids.some(id=>covered.has(id)))continue;
  if(ids.some(id=>claims.get(id).size!==1)){
   issues.push({ref,item:'VMS',branch:b.branch||'no branch',state:'unpriced',key:'work_scope1228',why:'Physical board identity needs reconciliation before separate installation can be included.'});continue;
  }
  const line=b.installLine&&b.installLine.key==='install'?{...b.installLine}: {key:'install',name:'Install',money:'rate',rate:null};
  // The canonical charge function retains explicit zero rates and per-line cents.
  const p=chargeProject({ordered:1,received:1,lines:[line],recorded:{install:b.recorded===true?1:0},off:{install:b.off?1:0},relocation:false});
  const r=p.rows.find(r=>r.key==='install');if(!r)continue;
  const row={ref,name:b.name||ref,branch:b.branch||'no branch',item:'VMS',disc:b.disc||'Variable message signs',arrived:1,charge:r,standaloneVms1228:true};rows.push(row);
  if(r.qty>0||r.qty===null)slots.push({ref,branch:row.branch,item:row.item,disc:row.disc,line:r.name||'Install',key:'install',unit:null,rate:r.rate,qty:r.qty,value:r.value,state:'charged',by:r.by,at:r.at,chargeInclusion1006:true,recordedQty1006:r.recordedQty,automaticCharge1006:r.automatic,standaloneVms1228:true});
  if(r.qty>0&&!Number.isFinite(r.value))issues.push({ref,item:'VMS',branch:row.branch,state:'unpriced',key:'work_scope1228',why:'Standalone board installation rate needs confirmation.'});
 }
 return {rows,slots,issues,total:cents(slots.reduce((n,s)=>n+(s.value||0),0)),unknown:slots.filter(s=>s.value==null).length};
}
function unticked(ref,disc,item,fleet,labour,stamps,keyOf){
 const rk=keyOf(ref,disc,item,'install'),uk=text(fleet)?keyOf(ref,disc,item,'install',fleet):null;
 const off=k=>!!stamps['labour/'+k]&&!labour[k];
 // Native unit decisions take precedence over an older reference decision.
 return uk&&(stamps['labour/'+uk]||labour[uk])?off(uk):off(rk);
}
function inputs(){
 const raw=vms913Boards(), physical=VmsEquipment1103.model().boards;
 const financial=FinanceRequest996.assets(), covered=[];
 for(const a of financial){
  if(!chargeLines(a).some(l=>l.item==='VMS'))continue;
  covered.push({key:a.key});
  for(const u of gcModel925(a).rows.filter(u=>u.physical&&u.source!=='history'&&u.item==='VMS'))covered.push({co:Units925.owner(u.owner),fleet:u.assetNo});
 }
 const boards=physical.map(b=>{
  const source=raw.find(r=>r.key===b.key), linked=source?vms913OnOf(source):{}, disc='Variable message signs', item='VMS';
  const a={key:b.key,discipline:disc,charge_lines:[{discipline:disc,item,quantity:1}],events:[],accessories:[]};
  const aliases=list(source?.folded), existing=financial.some(a=>a.key===b.key);
  const excluded=existing||rowOff(b.key)||!!movedAway(b.key)||(typeof NotChargedHere1152!=='undefined'&&!!NotChargedHere1152.why(b.key));
  const unresolved=!source||!!linked.bad||list(source.twin).length>0;
  const delivery=b.delivery||linked.on||aliases.find(a=>a.load)?.load||null;
  // Do not run any financial helper for grouped scope; it already has a native row.
  const info=!excluded&&!unresolved&&!delivery&&b.received?labourLinesFor(b.key,disc,item,b.key,b.fleet||undefined,a):null;
  return {...b,co:Units925.owner(b.co),disc,branch:branchOf(b.key)?.code||source?.branch||'no branch',delivery,excluded,unresolved,
   installLine:info?.lines.find(l=>l.key==='install'),
   off:unticked(b.key,disc,item,b.fleet,S.labour||{},S.stamps||{},labourKey),
   recorded:!!info?.lines.find(l=>l.key==='install')?.ticked};
 });
 return {boards,covered};
}
function model(){return heldMemo('vmsInstallation1228',()=>project(inputs(),OnsiteCharges1006.project));}
function coverageItems(){return model().rows.map(r=>({ref:r.ref,item:'VMS installation (hire / transport covered separately)',branch:r.branch,arrived:r.arrived,hire:[],fallbackHire:0,work:[r.charge],standaloneVms1228:true}));}
const api={identities,project,unticked,inputs,model,coverageItems};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.VmsInstallation1228=api;
})(typeof window!=='undefined'?window:null);
