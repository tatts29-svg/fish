/* Author: Andrew Fisher. Known supplier requests belong in requested scope, never in actual completion. */
(function(root){
 'use strict';
 const number=n=>typeof n==='number'&&Number.isFinite(n),date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'');
 function project(areas,model,knownRefs,ratio){
  const area=areas.find(r=>r.id==='toilets');
  if(!area||!area.health?.ready)return areas;
  const seen=new Set((area.rows||[]).map(r=>r.key)),active=new Set(knownRefs||[]),rows=[];
  for(const r of model.rows||[]){
   // The supplier's existing resolver decides whether this source request is
   // already allocated, cancelled or ambiguous. Never guess a native match.
   if(!r.sourceOnly||r.sourceRequest?.id!==r.ref||active.has(r.ref)||seen.has(r.ref)||!number(r.quantity)||!Number.isInteger(r.quantity)||r.quantity<=0)continue;
   seen.add(r.ref);
   const pending=(model.remaining||[]).filter(x=>x.ref===r.ref&&x.item===r.item),dates=pending.map(x=>x.date).filter(date).sort();
   const due=dates[0]||(r.events||[]).map(e=>e.date).filter(date).sort()[0]||null;
   rows.push({key:r.ref,name:r.name||r.ref,label:r.name||r.ref,quantity:r.quantity,knownQuantity:r.quantity,
    complete:false,recordedComplete:false,arrived962:0,reviewQuantity962:0,items962:[],done:0,remaining:r.quantity,
    status:'Requested — no receipt recorded',detail:r.item+' · '+r.supplierBasis,levelled:false,steps:false,
    sourceOnly1016:true,dueDate1016:due});
  }
  if(!rows.length)return areas;
  const count=rows.reduce((sum,r)=>sum+r.quantity,0),total=number(area.total)?area.total+count:null;
  const remaining=total==null||area.shortConflictRefs?null:Math.max(0,total-area.done);
  const updated={...area,rows:(area.rows||[]).concat(rows),totalRefs:area.totalRefs+rows.length,
   knownTotal:number(area.knownTotal)?area.knownTotal+count:area.knownTotal,total,
   remaining,left:remaining,pct:total>0&&!area.shortConflictRefs?ratio(area.done,total):null,
   unrecordedRefs:area.unrecordedRefs+rows.length};
  return Object.assign(areas.map(r=>r===area?updated:r),{health:areas.health});
 }
 const api={project};if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(!root||typeof document==='undefined')return;
 root.SupplierScope1016=api;
 const before=todayWorkMetrics840;
 todayWorkMetrics840=function(){
  const areas=before.apply(this,arguments);
  if(!areas.find(r=>r.id==='toilets')?.health?.ready||!root.Supplier996)return areas;
  return project(areas,root.Supplier996.model(),allAssets().map(a=>a.key),ProgressPercent1012.ratio);
 };
})(typeof window==='undefined'?null:window);
