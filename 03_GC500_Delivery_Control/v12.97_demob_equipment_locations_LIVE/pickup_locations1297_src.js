/* Author: Andrew Fisher. Immutable map positions saved with native pickup records.
 * Pure adapter: no record writes, clocks, DOM, geolocation or driver/load decisions.
 */
(function(root){
'use strict';
const list=x=>Array.isArray(x)?x:[],plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'?x.trim():'',normal=x=>text(x).toLowerCase().replace(/\s+/g,' ');
const short=(x,n=240)=>text(x).slice(0,n);
function validTime(x){
 if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(x)||!Number.isFinite(Date.parse(x)))return false;
 return Number(x.slice(11,13))<24&&Number(x.slice(14,16))<60&&Number(x.slice(17,19))<60&&new Date(x.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)===x.slice(0,10);
}
const map=()=>Object.create(null),own=(o,k)=>plain(o)&&Object.prototype.hasOwnProperty.call(o,k)?o[k]:null;
const time=x=>validTime(x)?new Date(x).toISOString():null;
const point=x=>plain(x)&&typeof x.lat==='number'&&typeof x.lon==='number'&&Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&Math.abs(x.lat)<=90&&Math.abs(x.lon)<=180;
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
function identity(x){
 if(!plain(x))return null;
 const id=text(x.id),number=text(x.number||x.assetNo),owner=normal(x.owner),item=text(x.item);
 return id&&id.length<=160&&number&&number.length<=100&&owner&&owner.length<=100&&owner!=='unknown'&&item&&item.length<=160?{id,number,owner,item}:null;
}
const same=(a,b,ids=true)=>!!a&&!!b&&(!ids||a.id===b.id)&&a.number===b.number&&a.owner===b.owner&&normal(a.item)===normal(b.item);
function location(raw,scope='reference'){
 if(!point(raw))return null;
 const kind=short(raw.kind,40),tag=short(raw.tag,160),how=short(raw.source||raw.how),warn=short(raw.warn);
 // A reporting/entry point is never the equipment's position, even when it has GPS.
 if(raw.report===true||raw.areaOnly==='report'||/^(report|entry|reporting)$/.test(kind)||/report here|driver reports|no drop.off (?:is )?(?:set|yet)|no drop.off yet/i.test([tag,how,warn].join(' ')))return null;
 const approximate=!!(raw.approx||raw.approximate||warn)||/^(area|placed|unverified|revised)$/.test(kind);
 const scopeValue=['reference','unit','board'].includes(scope)?scope:'reference';
 const confidence=approximate?'approximate':/master|plan|drawing/i.test(how)||kind==='master'?'plan':scopeValue==='unit'?'unit-recorded':scopeValue==='board'?'board-recorded':'reference';
 const result={lat:raw.lat,lon:raw.lon,kind:kind||'asset',scope:scopeValue,confidence,approximate,
  label:short(raw.label,160),tag,what:short(raw.what),how:how||'Recorded map position',warn,
  source:how||'Recorded map position'};
 if(typeof raw.acc==='number'&&Number.isFinite(raw.acc)&&raw.acc>=0)result.accuracyM=raw.acc;
 else if(typeof raw.accuracyM==='number'&&Number.isFinite(raw.accuracyM)&&raw.accuracyM>=0)result.accuracyM=raw.accuracyM;
 const at=time(raw.at);if(at)result.positionAt=at;
 else if(time(raw.positionAt))result.positionAt=time(raw.positionAt);
 return freeze(result);
}
function physicalRows(key,rows){return list(rows).filter(u=>u&&u.physical===true&&(!u.ref||u.ref===key));}
function uniqueIdentity(key,u,rows){
 const value=identity(u),current=physicalRows(key,rows),matching=current.filter(x=>x.id===u.id);
 if(!value||matching.length!==1||!same(identity(matching[0]),value)||current.filter(x=>text(x.assetNo||x.number)===value.number).length!==1)return null;
 return value;
}
function referenceLocation(raw){return raw&&['unit','board'].includes(raw.scope)?null:location(raw,'reference');}
function unitLocation(key,u,C,rows){
 const who=uniqueIdentity(key,u,rows);if(!who)return null;
 let chosen=null;
 const supplied=own(C.unitLocations,who.id);
 if(supplied&&same(identity(supplied.identity),who))chosen=location(supplied.location,supplied.scope==='board'?'board':'unit');
 // A reference's newest pin is not evidence for a different unit. Match explicit
 // ref + unit fields, never infer a physical identity from an opaque row ID.
 const cutoff=time(C.capturedAt),fixes=Object.values(plain(C.fixes)?C.fixes:{}).filter(f=>point(f)&&text(f.ref)===key&&text(f.unit)===who.number&&text(f.by)&&validTime(f.at)&&(!cutoff||Date.parse(f.at)<=Date.parse(cutoff)));
 if(!chosen&&fixes.length===1){const f=fixes[0];chosen=location({...f,kind:'unit-pin',label:key,tag:key,how:'Recorded unit GPS pin',what:who.item},'unit');}
 return chosen?{identity:who,location:chosen}:null;
}
function current(key,unit,context){
 const C=context||{},row=unit&&unitLocation(text(key),unit,C,physicalRows(text(key),C.units));
 return row?freeze({...row.location,unitId:row.identity.id}):referenceLocation(C.location);
}
function capture(key,context){
 key=text(key);const C=context||{},capturedAt=time(C.capturedAt),arrivalAt=time(C.arrivalAt);
 if(!key||key.length>160||!capturedAt||!arrivalAt||capturedAt<arrivalAt)return null;
 const rows=physicalRows(key,C.units),units=map(),reference=referenceLocation(C.location);
 for(const u of rows){
  const row=unitLocation(key,u,C,rows);if(row)units[row.identity.id]=row;
 }
 return freeze({version:1,key,capturedAt,arrivalAt,reference,units});
}
function checked(raw){
 if(!plain(raw)||raw.version!==1||!text(raw.key)||text(raw.key).length>160||!time(raw.capturedAt)||!time(raw.arrivalAt)||time(raw.capturedAt)<time(raw.arrivalAt)||!plain(raw.units))return null;
 const units=map();
 for(const [id,row]of Object.entries(raw.units)){
  const who=identity(row&&row.identity),p=row&&location(row.location,row.location?.scope);
  if(who&&who.id===id&&p&&p.scope!=='reference')units[id]={identity:who,location:p};
 }
 return freeze({version:1,key:text(raw.key),capturedAt:time(raw.capturedAt),arrivalAt:time(raw.arrivalAt),reference:referenceLocation(raw.reference),units});
}
function selectedIdentity(item,id){
 const rows=list(item.physicalUnits).filter(x=>x&&x.id===id),who=rows.length===1?identity(rows[0]):null;
 return who&&normal(who.item)===normal(item.type)?who:null;
}
function select(raw,items){
 const saved=checked(raw);if(!saved)return null;
 const lines=list(items).filter(x=>x&&Number.isSafeInteger(x.n)&&x.n>0&&text(x.type));
 if(!lines.length)return null;
 const ids=lines.flatMap(x=>list(x.unitIds).map(text)),units=map();
 for(const line of lines)for(const id of list(line.unitIds)){
  if(ids.filter(x=>x===id).length!==1)continue;
  const who=selectedIdentity(line,id),row=own(saved.units,id);
  if(who&&row&&same(who,row.identity))units[id]=row;
 }
 // Numberless/group collections retain only the explicitly qualified reference.
 if(!saved.reference&&!Object.keys(units).length)return null;
 return freeze({...saved,units});
}
// capturedAt is the save clock, not a changed location. Use this for the native
// form's stale-record token so reopening/validating does not invalidate itself.
function signature(raw){const v=checked(raw);return v?JSON.stringify([v.key,v.arrivalAt,v.reference,Object.keys(v.units).sort().map(k=>[k,v.units[k]])]):'';}
function currentEntry(raw,id,departed=true){
 const scoped=raw&&['unit','board'].includes(raw.scope),p=scoped&&raw.unitId!==id?null:location(raw,scoped?raw.scope:'reference');
 return {unitId:id||null,location:p,historical:false,capturedAt:null,eventId:null,
  departureAt:null,departureDate:null,
  label:p?'Current recorded/plan location':'Equipment position not recorded',
  note:!departed?'':p?'No map position was saved with this pickup. This is the current recorded/plan location.':'No equipment position is recorded; a reporting point is not a pickup location.'};
}
function historicalEntry(event,key,arrivalAt,who){
 const saved=checked(event&&event.pickupLocations1297);
 if(!saved||saved.key!==key||saved.arrivalAt!==time(arrivalAt)||time(event.arrivalAt)!==saved.arrivalAt)return null;
 const stored=who&&own(saved.units,who.id),matched=stored&&same(stored.identity,who)?stored.location:null,p=matched||saved.reference;
 if(stored&&!same(stored.identity,who))return null;
 if(!p)return null;
 return {unitId:who?.id||null,location:p,historical:true,capturedAt:saved.capturedAt,eventId:text(event.id)||null,
  departureAt:time(event.departedAt1211),departureDate:/^\d{4}-\d{2}-\d{2}$/.test(event.date||'')?event.date:null,
  label:'Map position saved with pickup record',
  note:(p.scope==='reference'?'Reference location; the individual unit position was not recorded. ':'')+'Saved with the record; the actual departure time is recorded separately.'};
}
function eligibleEvents(reading){
 if(!reading||list(reading.issues).length||!validTime(reading.arrival?.at))return [];
 return list(reading.events).filter(e=>e&&time(e.arrivalAt)===time(reading.arrival.at)&&text(e.id));
}
function matchUnit(key,u,reading,rows){
 const who=uniqueIdentity(key,u,rows);if(!who)return null;
 const currentRow=physicalRows(key,rows).find(r=>r.id===u.id),recover=currentRow.source==='native'&&text(currentRow.nativeId)&&!currentRow.slot,matches=[];
 for(const event of eligibleEvents(reading))for(const line of list(event.items)){
  const physical=list(line&&line.physicalUnits),ids=list(line&&line.unitIds),n=line&&line.n;
  for(const raw of physical){
   const old=identity(raw);if(!old)continue;
   if(old.id!==who.id&&(!recover||old.number!==who.number))continue;
   // Same ID/number with a contradictory type or owner must not fall through to
   // somebody else's coordinates or to a second apparently matching event.
   if(!same(who,old,false)||normal(line.type)!==normal(who.item)||!Number.isSafeInteger(n)||n<1||physical.length>n||!ids.includes(old.id)||ids.filter(x=>x===old.id).length!==1)return null;
   matches.push({event,identity:old,current:who});
  }
 }
 return matches.length===1?matches[0]:null;
}
function stampMatches(card,matches){
 const at=card?.gone?.at||card?.st?.at,day=card?.gone?.day||card?.st?.day;
 const events=matches.map(x=>x?.event).filter(Boolean);
 if(!events.length||events.length!==matches.length)return false;
 if(validTime(at)){const actual=events.map(e=>time(e.departedAt1211));return actual.every(Boolean)&&actual.sort().at(-1)===time(at);}
 if(day)return events.map(e=>e.date).filter(Boolean).sort().at(-1)===day;
 return true;
}
function resolve(card,currentLocation,context){
 const c=card||{},C=context||{},key=text(c.key),reading=C.reading,rows=physicalRows(key,C.rows),gone=!!c.gone||c.st?.s==='gone';
 const currentFor=u=>current(key,u,{location:currentLocation,units:rows,fixes:C.fixes,unitLocations:C.unitLocations,capturedAt:C.capturedAt});
 const active=currentEntry(currentFor(c.u),c.u?.id,gone);
 if(!gone&&!c.half&&!c.part)return freeze({...active,locations:[active],hasHistory:false});
 const entries=[];
 if(c.group){
  // Group history can show several collection points without assigning any of
  // those points to an unidentified individual unit.
  const wanted=normal(c.item),events=eligibleEvents(reading).filter(e=>list(e.items).some(i=>!wanted||normal(i.type)===wanted));
  for(const event of events){const entry=historicalEntry(event,key,reading.arrival.at,null);if(entry)entries.push(entry);}
  if(!gone)entries.unshift(active);
 }else if(c.u){
  const members=[c.u].concat(c.tank?[c.tank]:[]),matches=members.map(u=>matchUnit(key,u,reading,rows));
  const matchingStamp=!gone||stampMatches(c,matches);
  members.forEach((u,i)=>{
   const match=matches[i],entry=matchingStamp&&match&&historicalEntry(match.event,key,reading.arrival.at,match.identity);
   entries.push(entry?{...entry,unitId:u.id}:currentEntry(currentFor(u),u.id,gone||!!match));
  });
  // A paired tank/block still on site leads the map; each departed member retains
  // its own history in locations rather than borrowing the other member's pin.
  if(!gone&&c.half){const remain=c.half==='block'?c.tank?.id:c.u.id;entries.sort((a,b)=>Number(b.unitId===remain)-Number(a.unitId===remain));}
 }
 if(!entries.length)entries.push(active);
 const first=entries[0];return freeze({...first,locations:entries,hasHistory:entries.some(e=>e.historical)});
}
const api=Object.freeze({version:'v12.97',location,current,capture,select,signature,resolve});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.PickupLocations1297=api;
})(typeof window==='undefined'?null:window);
