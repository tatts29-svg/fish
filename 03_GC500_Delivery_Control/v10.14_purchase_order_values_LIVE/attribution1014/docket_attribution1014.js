/* Author: Andrew Fisher. Signed docket source correction, scan page 28 received 14 Oct 2026. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DocketAttribution1014=api;})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const same=(a,b)=>canonical(a)===canonical(b),clone=v=>JSON.parse(JSON.stringify(v));
function catalogue(records,current,reviewed){
 if(!current||current.schema!==1||!Array.isArray(current.rows)||!reviewed)return current;
 const id=reviewed.record_id,no=reviewed.docket_no;
 const rows=current.rows.filter(r=>r.record_id===id||r.docket_no===no);
 if(rows.length!==1||!same(rows[0],reviewed))return current;
 const found=(records||[]).filter(d=>d.id===id||String(d.docket_no)===no);
 if(found.length!==1)return current;
 const row=clone(reviewed);
 // Only these two transcribed numbers change. All dates, identity, work, source and task guards survive.
 row.expected.quantities.clean=137.5;row.expected.components.mesh_panel=55;
 if(!same(Object.fromEntries(Object.keys(row.expected).map(k=>[k,found[0][k]])),row.expected))return current;
 row.attribution.actual.clean=137.5;
 row.attribution.credit.clean=Math.min(137.5,row.attribution.allowance.clean);
 return {...current,rows:current.rows.map(r=>r===rows[0]?row:r)};
}
return {catalogue};
});
