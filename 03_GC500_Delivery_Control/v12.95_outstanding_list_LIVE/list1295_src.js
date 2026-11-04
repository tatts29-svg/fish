/* Author: Andrew Fisher. Read-only outstanding details from native remaining units. */
 function details1295(r){
  let ref=null,spec=null,a=null;
  try{ref=parent.MapDemob1211?.reference?.(r.key);a=parent.assetOf?.(r.key);if(ref)spec=parent.MapPickupSpecs1212?.read?.([ref])?.[0];}catch(_){/* Unavailable details remain explicit. */}
  const field=(label,value)=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value||'To confirm')+'</dd></div>';
  let where=null;try{where=a&&parent.whereText?.(a);}catch(_){}
  const location=where?.main?[where.main,where.also].filter(Boolean).join(' · '):'';
  let html='<dl class="onsite-details1295">'+field('Location',location)+(r.partial?field('Location scope','Reference location; individual remaining units not located'):'')+'</dl>';
  const items=ref?.items||[];
  if(!items.length)return html+'<dl class="onsite-details1295">'+field('Asset number','To confirm')+field('Size','To confirm')+field('Weight','To confirm')+'</dl>';
  for(const item of items){
   const units=item.units||[],numbers=units.map(u=>String(u.number||u.assetNo||'').trim()).filter(Boolean);
   // The native pickup pool resolves remaining identities; never use historical reference numbers.
   const identitySafe=!r.review&&!r.unknown&&units.length<=item.n;
   html+='<section class="onsite-item1295"><b>'+esc(item.type)+'</b><dl class="onsite-details1295">'+field('Qty remaining',Number.isFinite(item.n)?String(item.n)+(r.review?' · review':r.unknown?' known · total to confirm':''):'To confirm')+field('Asset number',identitySafe&&numbers.length?numbers.join(', ')+(item.unidentified?' · '+item.unidentified+' to confirm':''):'To confirm')+'</dl>';
   const groups=identitySafe?(spec?.items?.find(x=>x.type===item.type)?.specs||[]):[];
   if(groups.length)for(const group of groups){html+='<small>'+esc(group.labels.join(', '))+'</small><div class="onsite-spec1295">'+group.lines.map(line=>'<small>'+esc(String(line).replace(/\? = not recorded\./g,'').replace(/not recorded/g,'To confirm').replace(/\?/g,'To confirm'))+'</small>').join('')+'</div>';}
   else html+='<dl class="onsite-details1295">'+field('Size','To confirm')+field('Weight','To confirm')+'</dl>';
   html+='</section>';
  }
  return html;
 }
