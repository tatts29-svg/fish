/* Author: Andrew Fisher. Current physical identity takes precedence over historical reference matching. */
(function(root){'use strict';const norm=x=>String(x||'').trim().toLowerCase();
function select(ref,item,contracts,current){
 const physical=(current||[]).filter(u=>u.physical&&norm(u.item)===norm(item)),numbers=new Set(physical.filter(u=>norm(u.owner)==='coates').map(u=>String(u.assetNo||'').trim()).filter(Boolean));
 const rows=contracts||[],started=new Set(rows.filter(r=>!r.charge_line&&r.asset_no_is_plant_number&&r.start_date&&norm(r.status_as_written)==='delivered').map(r=>String(r.asset_no||'').trim()));
 return rows.filter(r=>{
  if(r.charge_line)return false;
  const number=String(r.asset_no||'').trim(),serial=!!r.asset_no_is_plant_number&&!!number;
  if(serial&&numbers.size){if(!numbers.has(number))return false;const pending=['pending','del req'].includes(norm(r.status_as_written));return !(pending&&!r.start_date&&started.has(number));}
  if(serial&&!numbers.size)return false;
  const sourceRef=r.match&&(r.match.key||r.match.task_id),namedRef=String(r.description||'').match(/^([A-Z]+[0-9]+)\b/i),exactType=norm(r.register_type)===norm(item),containerAlias=sourceRef===ref&&norm(r.register_type)==='event container'&&norm(item)==='3.0m cont'&&/^container 3\.0m x 2\.4m$/i.test(String(r.description||'').trim());
  return (sourceRef===ref&&exactType)||containerAlias||(!sourceRef&&namedRef&&namedRef[1].toUpperCase()===String(ref).toUpperCase()&&exactType);
 }).map(r=>Object.assign({},r,{register_type:item,match:Object.assign({},r.match,{key:ref})}));
}
const api={select};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ItemIdentity979=api;
})(typeof window!=='undefined'?window:null);
