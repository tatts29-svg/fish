/* Author: Andrew Fisher. Copy existing supplier delivery portions; never schedule new work. */
function mapRequestPlan1017(request,model){
 const clean=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' '),id=request&&request.id;
 const row=(model&&model.rows||[]).find(r=>r.ref===id&&r.sourceOnly&&clean(r.item)===clean(request.item));
 if(!row||!Number.isFinite(row.quantity)||!Number.isFinite(row.received))return {plannedDeliveries1017:[],planState1017:'unavailable'};
 const outstanding=Math.max(0,row.quantity-row.received);
 if(!outstanding)return {plannedDeliveries1017:[],planState1017:'none'};
 const portions=(model.remaining||[]).filter(r=>r.ref===id&&clean(r.item)===clean(request.item)&&Number.isFinite(r.remaining)&&r.remaining>0);
 if(!portions.length||portions.reduce((n,r)=>n+r.remaining,0)!==outstanding)return {plannedDeliveries1017:[],planState1017:'unavailable'};
 return {plannedDeliveries1017:portions.map(r=>({date:String(r.date||''),quantity:r.remaining})),planState1017:'planned'};
}
