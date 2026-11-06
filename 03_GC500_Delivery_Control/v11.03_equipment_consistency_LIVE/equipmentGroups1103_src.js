/* Author: Andrew Fisher. Equipment presentation groups; business classifications remain unchanged. */
(function(root){
'use strict';
const ACCESS='Forklifts & access';
const words={Access:ACCESS,VMS:'VMS boards',Trakmat:'Track mat',WFB:'Water-filled barriers',Toilet:'Toilets & amenities','Portable Building':'Portable buildings',Generator:'Generators','Light Tower':'Lighting towers'};
const aliases={'Access & plant':ACCESS,'Variable message signs':'VMS boards','Ground protection':'Track mat'};
const text=v=>String(v==null?'':v).trim();
const normal=v=>text(v).toLowerCase().replace(/[–—_-]/g,' ').replace(/([a-z])(?=\d)/g,'$1 ').replace(/\s+/g,' ').replace(/^(?:coates|supply)\s*[: -]?\s*/,'');
const accessory=/\b(?:fork(?:lift)?\s+extensions?|forklift\s+(?:forks?|t[yi]nes?|rotators?|attachments?)|t[yi]ne\s+rotators?|fork\s+rotators?|slippers|attachments?|harness(?:es)?|chargers?|batter(?:y|ies))\b/;
const machine=/\b(?:fork\s?lift|telehandler|scissor(?:\s+lift)?|(?:knuckle\s?boom|straight\s?boom|articulat(?:ed|ing)\s+boom)(?:\s+lift)?|boom\s+lift|cherry\s+picker|ewp|access\s+platform)\b/;
function isAccessory(value){return accessory.test(normal(value));}
function isMachine(value){
 const raw=normal(value),head=raw.split(/\s+with\s+/)[0];
 return !!head&&machine.test(head)&&!accessory.test(head);
}
function group(a){
 if(!a)return 'Uncategorised';
 const product=text(a.product),disc=text(a.discipline),base=words[product]||product||aliases[disc]||disc||'Uncategorised';
 if(product||!['','Other','Added in this page','Uncategorised'].includes(disc))return base;
 const items=(a.item_types||[]).map(text).filter(Boolean);
 // Use explicit equipment descriptions only. Names, locations, asset numbers and
 // paperwork never establish a category. A mixed unrelated order stays as recorded.
 return items.some(isMachine)&&items.every(item=>isMachine(item)||isAccessory(item))?ACCESS:base;
}
function scoped(options){const o=options||{};return o.tab==='plant'&&o.group===ACCESS;}
function refs(assets,options){
 const o=options||{};
 return new Set((assets||[]).filter(a=>group(a)===ACCESS&&(!o.matches||o.matches(a))&&(!o.light||o.light(a))).map(a=>a.key));
}
function inventoryView(I,options){
 const o=options||{};if(!scoped(o))return I;
 const allowed=refs(o.assets,o),byType=new Map(),spares=(I.spares||[]).filter(s=>{
  const parts=text(s.type).split('|'),item=parts.slice(1).join('|');
  return group({discipline:parts[0],item_types:[item]})===ACCESS&&(!o.spareMatches||o.spareMatches(s));
 });
 for(const s of spares){if(!byType.has(s.type))byType.set(s.type,[]);byType.get(s.type).push(s);}
 const list=[],issues=(I.quantityIssues1012||[]).filter(x=>allowed.has(x.ref)).slice();
 for(const original of I.list||[]){
  const selected=Object.entries(original.refs||{}).filter(([key,r])=>{
   if(!allowed.has(key))return false;
   if(['asked','on','coates','nonum','received1017','remaining1017'].every(field=>Number.isFinite(r[field])&&r[field]>=0))return true;
   if(!issues.some(x=>x.ref===key&&x.item===original.item))issues.push({ref:key,item:original.item||'Item description needed'});
   return false;
  }),parked=byType.get(original.type)||[];
  if(!selected.length&&!parked.length)continue;
  const row={...original,refs:Object.fromEntries(selected),asked:0,on:0,coates:0,sub:{},nonum:0,received1017:0,remaining1017:0,spareC:0,spareSub:{},spares:parked.length};
  for(const [,r] of selected){
   for(const field of ['asked','on','coates','nonum','received1017','remaining1017'])row[field]+=r[field];
   for(const [company,n] of Object.entries(r.cos||{}))row.sub[company]=(row.sub[company]||0)+n;
  }
  for(const s of parked){if(s.co==='Coates')row.spareC++;else row.spareSub[s.co]=(row.spareSub[s.co]||0)+1;}
  list.push(row);
 }
 const cos={};for(const r of list){for(const [co,n] of Object.entries(r.sub))(cos[co]||(cos[co]={at:0,spare:0})).at+=n;for(const [co,n] of Object.entries(r.spareSub))(cos[co]||(cos[co]={at:0,spare:0})).spare+=n;}
 const spareIds=new Set(spares.map(s=>s.id));
 return {...I,list,spares,cos,twice:(I.twice||[]).filter(x=>spareIds.has(x.s?.id)),offOn:(I.offOn||[]).filter(x=>allowed.has(x.a?.key)),
  quantityIssues1012:issues,supplierRemaining1017:I.supplierRemaining1017?.filter(x=>allowed.has(x.ref)),
  equipmentGroupScope1103:{group:ACCESS,refs:[...allowed]}};
}
function nativeOptions(){
 const s=typeof state==='undefined'?{}:state,q=text(s.q).toLowerCase();
 return {tab:s.tab,group:s.plantGroup,assets:typeof allAssets==='function'?allAssets():[],
  matches:a=>!q||matches(a,q),light:a=>typeof lightMatches!=='function'||lightMatches(a),
  spareMatches:s=>!q||q.split(/\s+/).every(t=>[s.type,s.co,s.no,s.note,ACCESS].map(text).join(' ').toLowerCase().includes(t))};
}
function nativeInventory(I){return inventoryView(I,nativeOptions());}
function outstanding(I,disc,noFallback){
 const rows=Inventory1017.outstanding(I,disc,noFallback),scope=I.equipmentGroupScope1103;
 return scope?rows.filter(r=>scope.refs.includes(r.key||r.a?.key)):rows;
}
function caption(I,fallback){return I?.equipmentGroupScope1103?.group||fallback;}
const API={ACCESS,group,isMachine,isAccessory,scoped,refs,inventoryView,nativeInventory,outstanding,caption};
root.EquipmentGroups1103=Object.freeze(API);
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window==='undefined'?globalThis:window);
