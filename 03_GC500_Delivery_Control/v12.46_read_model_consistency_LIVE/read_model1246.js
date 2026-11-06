/* Author: Andrew Fisher. Read-only association of unique typed unit evidence.
 * Opaque row IDs are never parsed; original records and events are returned intact.
 */
(function(root){
'use strict';
const list=value=>Array.isArray(value)?value:[];
const text=value=>typeof value==='string'?value.trim():'';
const normal=value=>text(value).toLowerCase().replace(/\s+/g,' ');
function unit(reading,ref,id,item,rows){
 if(!reading||list(reading.issues).length||!text(ref)||!text(id)||!normal(item))return null;
 if(!list(reading.required).some(row=>row&&normal(row.type)===normal(item)))return null;
 const current=list(rows).filter(row=>row&&row.physical===true&&text(row.ref)===ref);
 const candidates=current.filter(row=>row.id===id);
 if(candidates.length!==1)return null;
 const target=candidates[0],owner=normal(target.owner),number=text(target.assetNo),kind=normal(target.item);
 // Only native numbered units can recover an association after a canonical-ID
 // change. Product/count rows and anonymous slots are not serialized identities.
 if(target.source!=='native'||!text(target.nativeId)||target.slot||!owner||owner==='unknown'||!number||kind!==normal(item))return null;
 // A duplicated number or conflicting owner/type on this reference is unresolved.
 // The same number elsewhere is outside this reference's evidence scope.
 if(current.filter(row=>text(row.assetNo)===number).length!==1)return null;
 const matches=[];
 for(const event of list(reading.events))for(const line of list(event&&event.items)){
  const physical=list(line&&line.physicalUnits);
  for(const identity of physical){
   if(!identity||text(identity.number)!==number)continue;
   // A number alone cannot establish identity, nor resolve contradictory evidence.
   if(normal(identity.owner)!==owner||normal(identity.item)!==kind||normal(line.type)!==kind)return null;
   if(!text(identity.id)||!list(line.unitIds).includes(identity.id)||!Number.isSafeInteger(line.n)||line.n<1||line.n!==physical.length)return null;
   matches.push(event);
  }
 }
 // Repeated evidence, even twice in one event, must be reviewed instead of guessed.
 return matches.length===1?matches[0]:null;
}
const api=Object.freeze({unit});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.ReadModel1246=api;
})(typeof window==='undefined'?null:window);
