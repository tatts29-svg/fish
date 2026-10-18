/* Author: Andrew Fisher. Read-only area relationships; no geometry, completion or cost allocation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC500FencingTrace837=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const list=x=>Array.isArray(x)?x:[],own=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k),hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const key=r=>JSON.stringify([r.book||'red',String(r.record_id||r.id||''),String(r.docket_no||'')]);
const canonical=x=>x==null?'null':Array.isArray(x)?'['+x.map(canonical).join(',')+']':typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const amount=n=>typeof n==='number'&&Number.isFinite(n)?n:null;
function documentState(proof,sources,files){
 if(!proof||typeof proof!=='object')return 'Source proof is missing';
 const matches=list(sources).filter(s=>s.id===proof.source_id);
 if(matches.length!==1)return 'Source identity needs review';
 const source=matches[0];
 if(!hash(proof.sha256)||source.sha256!==proof.sha256||!Number.isInteger(source.pages)||source.pages<1||!Number.isInteger(proof.page)||proof.page<1||proof.page>source.pages)return 'Source page or fingerprint changed';
 const f=own(files,source.id)?files[source.id]:null;
 if(!f||!hash(f.sha256))return 'Source links unavailable';
 return f.sha256===source.sha256?null:'Linked source file changed';
}
function money(record){
 const book=record.book||'red';
 if(book==='blue')return {supplier:null,revenue:null,supplier_state:'Counts only',revenue_state:'No automatic charge or credit'};
 if(book==='green')return {supplier:amount(record.cost),revenue:null,supplier_state:amount(record.cost)==null?'Rate not recorded':'Supplier labour estimate',revenue_state:'Cost only; no separate customer labour charge'};
 const total=(state,value,line)=>state==='priced'?amount(value):state==='partly priced'&&list(record.lines).some(l=>amount(l[line])!=null)?amount(value):null;
 return {supplier:total(record.paid_state,record.paid_total,'paid'),revenue:total(record.cost_state,record.cost_total,'cost'),supplier_state:record.paid_state||'Rate basis unavailable',revenue_state:record.cost_state||'Rate basis unavailable',supplier_unpriced:list(record.paid_unpriced).slice(),revenue_unpriced:list(record.unpriced).slice()};
}
function commercial(input,context,trace){
 const data=input.commercial,result={groups:[],additional:[]};if(!data||data.schema!==1)return result;
 const all=list(data.groups).flatMap(g=>list(g.allocations)).concat(list(data.additional)),counts=new Map();
 for(const a of all)for(const line of list(a.lines))counts.set(line.line_id,(counts.get(line.line_id)||0)+1);
 function allocation(a){
  let reason=documentState(a.source,input.sources,context.files);
  if(!Number.isSafeInteger(a.amount_cents)||!list(a.lines).length||a.lines.some(l=>!Number.isSafeInteger(l.amount_cents)||counts.get(l.line_id)!==1)||a.lines.reduce((s,l)=>s+l.amount_cents,0)!==a.amount_cents)reason='Supplier charge lines need review';
  if(!a.unallocated&&!list(a.records).length||a.unallocated&&list(a.records).length)reason='Supplier allocation identity needs review';
  for(const ref of list(a.records).concat(list(a.parents))){
   const row=trace.rows.find(r=>r.key===key(ref)),review=(context.reviews||{})[key(ref)];
   if(!row||row.state!=='current'||!review||review.state!=='current')reason='Supplier allocation record needs review';
   if(list(a.records).some(r=>key(r)===key(ref))&&(!review||!review.po||review.po.number!==a.number))reason='Supplier allocation P/O association changed';
  }
  if(a.parent_source)reason=reason||documentState(a.parent_source,input.sources,context.files);
  return {...a,state:reason?'unavailable':'current',reason,amount_cents:reason?null:a.amount_cents,link:!reason&&(context.sourceLinks||{})[a.source.source_id]||null};
 }
 for(const group of list(data.groups)){
  const allocations=list(group.allocations).map(allocation);
  let reason=documentState(group.source,input.sources,context.files);
  if(!Number.isSafeInteger(group.total_cents)||allocations.some(a=>a.state!=='current'||canonical(a.source)!==canonical(group.source)||a.number!==group.number||a.supplier!==group.supplier)||allocations.reduce((s,a)=>s+(a.amount_cents||0),0)!==group.total_cents)reason=reason||'Supplier allocation and residual need review';
  const pos=list(context.purchaseOrders).filter(p=>String(p.number)===group.number),po=pos.length===1?pos[0]:null;
  result.groups.push({...group,allocations,state:reason?'unavailable':'current',reason,total_cents:reason?null:group.total_cents,link:!reason&&(context.sourceLinks||{})[group.source.source_id]||null,native_amount:po?amount(po.amount):null,native_comparison:pos.length>1?'P/O identity is ambiguous':po&&po.supplier_code!==group.supplier?'Recorded supplier differs or is not confirmed':null,native_match:!reason&&po&&po.supplier_code===group.supplier&&amount(po.amount)!=null?Math.round(po.amount*100)===group.total_cents:null});
 }
 result.additional=list(data.additional).map(allocation);return result;
}
function model(input,context){
 const output={schema:1,areas:[],rows:[],relations:[],unmapped:[],orders:[],allocation:'not allocated'};
 if(!input||input.schema!==1||!context)return output;
 const areas=list(input.areas),records=list(context.records),sources=list(input.sources),canon=context.canonical||canonical;
 for(const a of areas){
  let reason=null;
  const gs=list(context.geometry).filter(g=>g.id===a.geometry_id),plans=list(context.sources).filter(s=>s.id===a.source_id);
  if(areas.filter(x=>x.id===a.id).length!==1||gs.length!==1||plans.length!==1)reason='Map identity needs review';
  else if(input.master_sha256!==context.master_sha256||a.master_sha256!==context.master_sha256||a.scope!=='area')reason='Map source or area scope changed';
  else {
   const g=gs[0],p=plans[0],projection=Object.fromEntries(Object.keys(a.expected_geometry||{}).map(k=>[k,g[k]]));
   if(canon(projection)!==canon(a.expected_geometry)||p.sha256!==a.source_sha256||p.revision!==a.source_revision||g.source_sha256!==a.source_sha256||g.source_page!==a.source_page)reason='Map annotation or source revision changed';
   else reason=documentState({source_id:p.document_file,sha256:p.sha256,page:a.source_page},sources,context.files);
  }
  output.areas.push({id:a.id,geometry_id:a.geometry_id,label:a.label,scope:'area',state:reason?'unavailable':'current',reason,basis:a.basis});
 }
 const orders=new Map();
 for(const row of list(input.rows)){
  const k=key(row),matches=records.filter(d=>String(d.id||'')===row.record_id||String(d.docket_no||'')===row.docket_no),duplicates=input.rows.filter(x=>x.record_id===row.record_id||x.docket_no===row.docket_no);
  let reason=null,record=null;
  if(matches.length!==1||duplicates.length!==1)reason='Docket identity is not unique';
  else {record=matches[0];if(key(record)!==k)reason='Docket identity changed';}
  if(!reason){const expected=row.expected||{},current=Object.fromEntries(Object.keys(expected).map(f=>[f,record[f]]));if(!Object.keys(expected).length||canon(expected)!==canon(current))reason='Recorded work changed since the area review';}
  const review=(context.reviews||{})[k]||{state:'none'};
  if(!reason&&['stale','ambiguous'].includes(review.state))reason='Docket source review needs updating';
  if(!reason){for(const proof of list(row.evidence)){reason=documentState(proof,sources,context.files);if(reason)break;}if(!row.evidence||!row.evidence.length)reason='Original source proof is missing';}
  const linked=list(row.area_ids).map(id=>output.areas.find(a=>a.id===id)).filter(Boolean);
  if(!reason&&(linked.length!==list(row.area_ids).length||linked.some(a=>a.state!=='current')))reason='Reviewed area link is unavailable';
  const result={key:k,record_id:row.record_id,docket_no:row.docket_no,book:row.book,state:reason?'unavailable':'current',reason,area_ids:list(row.area_ids).slice(),activity:row.activity,basis:row.basis,location:record&&record.location||row.location_as_written,date:record&&record.date||null,scope:'area',money:reason?null:money(record),review_state:review.state,query:review.state==='current'?review.query:null,po:null,links:list((context.links||{})[k]).filter(x=>!reason||x.kind==='original').map(x=>({...x}))};
  if(!reason&&review.state==='current'&&review.po){
   const no=review.po.number,poss=list(context.purchaseOrders).filter(p=>String(p.number)===no),po=poss.length===1?poss[0]:null,group=(po&&(po.supplier_code||po.supplier_name)||'supplier')+':'+no;
   result.po=group;
   if(!orders.has(group))orders.set(group,{key:group,number:no,association_basis:'source_summary',amount_basis:'native_po_record',supplier:po&&(po.supplier_name||po.supplier_code)||null,amount:po?amount(po.amount):null,invoice_no:po&&po.invoice_no||null,confirmed:!!(po&&po.confirmed),payment:'unknown',record_keys:[],area_ids:[]});
   const order=orders.get(group);order.record_keys.push(k);order.area_ids.push(...result.area_ids);
  }
  output.rows.push(result);
 }
 for(const order of orders.values()){order.record_keys=[...new Set(order.record_keys)];order.area_ids=[...new Set(order.area_ids)];output.orders.push(order);}
 output.relations=list(input.relations).filter(r=>output.rows.some(x=>x.record_id===r.child_record_id&&x.state==='current')&&output.rows.some(x=>x.record_id===r.parent_record_id&&x.state==='current')&&list(r.evidence).length&&r.evidence.every(p=>!documentState(p,sources,context.files))&&['child','parent'].every(which=>{const record=records.find(d=>d.id===r[which+'_record_id']),expected=r['expected_'+which];return record&&expected&&canon(Object.fromEntries(Object.keys(expected).map(f=>[f,record[f]])))===canon(expected);})).map(r=>({...r,evidence:undefined}));
 output.unmapped=list(input.unmapped).map(u=>{const matches=records.filter(r=>key(r)===key(u));return matches.length===1?{...u,key:key(u),location:matches[0].location||'Location not recorded'}:null;}).filter(Boolean);
 output.commercial=commercial(input,context,output);
 return output;
}
function selection(trace,geometryIds){
 const ids=new Set(list(geometryIds)),areas=list(trace&&trace.areas).filter(a=>ids.has(a.geometry_id)),areaIds=new Set(areas.map(a=>a.id));
 const rows=list(trace&&trace.rows).filter(r=>r.area_ids.some(id=>areaIds.has(id))),keys=new Set(rows.map(r=>r.key));
 return {areas,rows:[...new Map(rows.map(r=>[r.key,r])).values()],orders:list(trace&&trace.orders).filter(p=>p.record_keys.some(k=>keys.has(k))),relations:list(trace&&trace.relations).filter(r=>rows.some(x=>x.record_id===r.child_record_id||x.record_id===r.parent_record_id)),commercial:{groups:list(trace&&trace.commercial&&trace.commercial.groups).filter(g=>g.allocations.some(a=>a.records.some(r=>keys.has(key(r))))),additional:list(trace&&trace.commercial&&trace.commercial.additional).filter(a=>a.records.some(r=>keys.has(key(r))))},allocation:'not allocated'};
}
return {key,canonical,documentState,money,commercial,model,selection};
});
