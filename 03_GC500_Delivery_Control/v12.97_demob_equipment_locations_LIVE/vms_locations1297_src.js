/* Author: Andrew Fisher. Unique physical VMS identity to its canonical map position.
 * Pure capture adapter. Multiple positions stay unresolved rather than choosing
 * by card label, array order or an assumed move/storage programme.
 */
(function(root){
'use strict';
const list=x=>Array.isArray(x)?x:[],text=x=>typeof x==='string'?x.trim():'',normal=x=>text(x).toLowerCase().replace(/\s+/g,' ');
const finite=Number.isFinite,point=p=>p&&finite(p.lat)&&finite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
function read(key,physical,model,ownerOf){
 const rows=list(physical).filter(u=>u&&u.physical===true&&(!u.ref||u.ref===key)),out=Object.create(null);
 const owner=value=>{try{return typeof ownerOf==='function'?normal(ownerOf(value)):'';}catch(_){return '';}};
 for(const u of rows){
  const id=text(u.id),number=text(u.assetNo),co=normal(u.owner),item=text(u.item);
  if(!id||!number||!co||co==='unknown'||!/^vms$/i.test(item)||rows.filter(x=>x.id===id).length!==1||rows.filter(x=>text(x.assetNo)===number).length!==1)continue;
  const matches=list(model?.boards).filter(b=>b&&text(b.fleet)===number&&owner(b.co)===co);
  if(matches.length!==1)continue;
  const board=matches[0],positions=list(board.positions);
  if(!text(board.key)||board.canonicalIdentityConflict1103||positions.length!==1)continue;
  const p=positions[0];
  if(!point(p)||!text(p.pos)||!['saved-reference','board-key','fleet-identity'].includes(p.association1103))continue;
  const label='VMS '+text(p.pos),how=text(p.how)||'Canonical board plan position';
  out[id]=Object.freeze({identity:Object.freeze({id,number,owner:co,item}),scope:'board',location:Object.freeze({
   kind:'vms',label,tag:label,lat:p.lat,lon:p.lon,what:'VMS board',
   how:how+' · board record position; storage moves are not inferred',warn:''
  })});
 }
 return Object.freeze(out);
}
const api=Object.freeze({read});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.VmsPickupLocations1297=api;
})(typeof window==='undefined'?null:window);
