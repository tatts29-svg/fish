/* Author: Andrew Fisher. Read-only transition from a retained quantity record to complete unit identities. */
function quantitySubhireIdentified1094(ref,item,quantity,units,owner){
 if(ref!=='WC09'||item!=='Pee Panel'||owner!=='event-portables'||!Number.isInteger(quantity)||quantity<=0)return false;
 const text=v=>String(v==null?'':v).trim();
 const rows=(units||[]).filter(u=>u.item===item&&u.source!=='history'&&(u.physical||u.id||u.assetNo));
 if(rows.length!==quantity||rows.some(u=>u.physical!==true||u.ref!==ref||u.owner!==owner||u.active===false||!text(u.id)||!text(u.assetNo)))return false;
 return new Set(rows.map(u=>text(u.id))).size===quantity&&new Set(rows.map(u=>text(u.assetNo).toUpperCase())).size===quantity;
}
