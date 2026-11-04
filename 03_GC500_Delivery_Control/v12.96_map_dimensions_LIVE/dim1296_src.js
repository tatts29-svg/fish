/* Author: Andrew Fisher. Read-only sizes from the existing loading specification source. */
(function(W){
 'use strict';
 const norm=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
 const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 const carry={};
 const batch=fn=>typeof W.holdCarry1066==='function'?W.holdCarry1066(carry,fn):W.holdAssets(fn);
 function dimension(info){
  const v=info?.unit&&info.recordCurrent===true&&info.actualVerified===true?info.record?.actual:null;
  const fields=[['lengthMm','L'],['widthMm','W'],['heightMm','H']];
  const known=fields.filter(([key])=>positive(v?.[key]));
  if(known.length){const all=known.length===3;return {basis:'Recorded transport',text:all?fields.map(([key])=>v[key]).join(' × ')+' mm (L × W × H)':known.map(([key,label])=>label+' '+v[key]+' mm').join(' · ')+' · other dimensions to confirm'};}
  const f=info?.facts?.find(f=>f.label==='Contract-listed footprint'||f.label==='Nominal description');
  const values=(f?.values||[]).filter(v=>/\bmm\b/.test(v));
  return values.length?{basis:f.label==='Contract-listed footprint'?'Nominal (contract)':'Nominal',text:values.join(' · ')}:null;
 }
 function project(a,items,safe,L,source){
  const native=L.unitsFor(a)||[];
  return items.map(it=>{
   const groups=new Map(),units=it.units||[],ok=safe&&units.length<=it.n&&units.every(u=>u.id)&&new Set(units.map(u=>u.id)).size===units.length;
   function add(n,u){if(!n)return;const d=dimension(L.info931(a,it.type,u,source)),key=JSON.stringify(d);if(!groups.has(key))groups.set(key,{n:0,...(d||{basis:'',text:'To confirm'})});groups.get(key).n+=n;}
   if(ok){for(const picked of units){const candidates=native.filter(u=>u.physical===true&&!u.slot&&u.id===picked.id&&norm(u.item)===norm(it.type)&&String(u.assetNo||'')===String(picked.number||''));add(1,candidates.length===1?candidates[0]:null);}add(Math.max(0,it.n-units.length),null);}
   else add(it.n||1,null);
   return {type:it.type,groups:[...groups.values()]};
  });
 }
 function read(key,remaining=true){
  const run=()=>{const a=W.assetOf?.(key),L=W.Loading931;if(!a||!L)return [];
   const source=typeof ONHIRE_ROWS!=='undefined'?ONHIRE_ROWS:(typeof DATA!=='undefined'?DATA.rental_on_hire?.rows||[]:[]);
   if(remaining){const r=W.MapDemob1211?.reference(key);if(!r)return [];return project(a,r.items,!r.departure?.issues?.length&&!r.departure?.unknown,L,source);}
   // Historical quantities do not establish which physical unit supplied the measured size.
   // Only explicitly nominal dimensions are used on general/departed reference labels.
   const r=W.Departure1211?.read(key);return project(a,(r?.required||[]).map(it=>({...it,units:[]})),false,L,source);
  };
  try{return batch(()=>W.heldMemo('map-dim1296:'+key+':'+remaining,run));}catch(_){return [];}
 }
 function compact(rows){
  const groups=rows.flatMap(r=>r.groups),known=groups.filter(g=>g.basis),unique=[...new Set(known.map(g=>g.basis+' '+g.text))];
  if(!known.length)return '';
  if(unique.length!==1||known.length!==groups.length)return 'Sizes vary / partly to confirm';
  return unique[0]+' · each';
 }
 W.MapDimensions1296=Object.freeze({dimension,project,read,compact,batch});
})(window);
