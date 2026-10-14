/* Author: Andrew Fisher. Read-only source relationships, 9 Oct 2026.
 * A named area is not a surveyed position; a load is not a numbered board assignment.
 * Native locations, pins, placements and saved row associations take precedence.
 */
const Reference973 = (() => {
 const text=v=>String(v==null?'':v).trim(), list=v=>Array.isArray(v)?v:[];
 const norm=v=>text(v).toLowerCase().replace(/\s+/g,' ');
 const sheet='D024-26003-02';
 const gensSource=Object.freeze({file:'D024-26003-02-GENS_LTS.pdf',sha256:'ce483e4f905d422a9927579e2fc7e42295069de8bde20338e7a9aedfd2993960',page:1,section:'Off-map destination panel'});
 const placeRules=Object.freeze({
  GN25:{label:'Seaway Carpark',callout:'025',tag:'genset:025',kind:/generator/i,generic:/^(?:GN25\s*[-–—:]?\s*)?generator$/i},
  LT05:{label:'Seaway Car Park Transporter Compound',callout:'05',tag:'tower:05',kind:/light.*tower/i,generic:/^LT05\/06:\s*Light Towers$/i},
  LT06:{label:'Seaway Car Park Transporter Compound',callout:'06',tag:'tower:06',kind:/light.*tower/i,generic:/^LT05\/06:\s*Light Towers$/i}
 });
 function context(){return {state:typeof S==='undefined'?{}:S,pin:a=>typeof bestPinFor==='function'?bestPinFor(a):null,place:a=>typeof bestPlaceFor==='function'?bestPlaceFor(a):null};}
 function currentPosition(a,c){
  try {const p=c.pin&&c.pin(a),f=p&&(p.fix||p);if(f&&Number.isFinite(f.lat)&&Number.isFinite(f.lon))return true;}catch(e){}
  try {const p=c.place&&c.place(a),f=p&&(p.place||p);if(f&&Number.isFinite(f.lat)&&Number.isFinite(f.lon))return true;}catch(e){}
  return false;
 }
 function sourcePlace(a,ctx){
  const rule=a&&placeRules[a.key];if(!rule||a._cancelled||a._movedTo||a._locationMoved||a.relocation||a.rest_of)return null;
  const c=ctx||context(),s=c.state||{};
  if(text(s.locations&&s.locations[a.key])||currentPosition(a,c))return null;
  const desc=[a.product,a.discipline].concat(list(a.item_types)).join(' ');
  if(!rule.kind.test(desc))return null;
  const links=list(a.drawing_links).filter(l=>l.sheet===sheet&&text(l.label)===rule.callout&&l.tag_id===rule.tag&&(l.year||2026)===2026);
  if(links.length!==1)return null;
  const places=list(a.locations).map(text).filter(Boolean);
  if(!places.length||places.some(v=>!rule.generic.test(v)&&norm(v)!==norm(rule.label)))return null;
  return {label:rule.label,kind:'named-place',exactPosition:false,source:gensSource,callout:rule.callout,basis:'Written destination beside the numbered callout; no ground coordinate supplied.'};
 }
 function destination(a,base,ctx){
  const place=sourcePlace(a,ctx);if(!place)return base;
  return Object.assign({},base,{text:place.label,known:true,quoted:false,quote:'',reads_as:null,confidence:'source-named-place',fallback:place.label,source:sheet+' · '+place.callout,exactPosition:false,sourceReference973:place});
 }
 function suppressNavigation(a,ctx){return !!sourcePlace(a,ctx);}
 function hasNativeAssociation(id,c){return !!(c.given&&c.given[id]||list(c.added).some(a=>a.source_row===id));}
 function sourceRow(row,id,range,product,item,qty){return row&&row.task_id===id&&row.source_range===range&&norm(row.product)===norm(product)&&(item==null||norm(row.item)===norm(item))&&text(row.quantity_display)===String(qty);}
 const demobRules=Object.freeze({
  T0222:{parent:'T0021',asset:'960639',source:"'Demob Week 3'!A5:H5",opening:"'Week 5'!A19:N19",notes:'office',title:'Coates office 4.8 × 3 m'},
  T0223:{parent:'T0022',asset:'960634',source:"'Demob Week 3'!A6:H6",opening:"'Week 5'!A20:N20",notes:'luchroom',title:'Coates lunchroom 4.8 × 3 m'}
 });
 function demob(row,base,c){
  const rule=demobRules[row.task_id];if(!rule||base.linked||base.relation==='conflict'||hasNativeAssociation(row.task_id,c))return null;
  if(!sourceRow(row,row.task_id,rule.source,'Portable Building','Building 6m',1)||row.phase!=='Demob'||norm(row.notes)!==rule.notes||text(row.location))return null;
  const a=list(c.assets).find(a=>a.key===rule.parent);
  if(!a||a._cancelled||a._movedTo||a.relocation||a.rest_of||list(a.asset_numbers).map(text).join('|')!==rule.asset)return null;
  const opening=list(c.rows).find(r=>r.task_id===rule.parent&&r.source_range===rule.opening);
  if(!opening||!list(a.events).some(e=>e.task_id===rule.parent&&e.sheet==='Week 5'&&e.item==='Building 4.8m'))return null;
  const words=[a.product,a.name].concat(list(a.item_types)).join(' ');
  if(!/4\.8/.test(words))return null;
  const w=c.where?c.where(a):null,d=c.destination?c.destination(a):null;
  const point=d&&['master','confirmed','pinned'].includes(d.kind)&&Number.isFinite(d.ll&&d.ll.lat)&&Number.isFinite(d.ll&&d.ll.lon);
  const place=typeof Reference966!=='undefined'?Reference966.namedPlace(w&&w.main,row.item):'';
  return Object.assign({},base,{ref:a.key,recordRef:a.key,displayRef:a.key,linked:true,relation:'paired-demob',title:rule.title,item:rule.title,location:place||(point?'Recorded site position':'Same item as '+a.key),locationState:point?'position-recorded':place?'named-place':'linked-item',exactPosition:!!point,required:'',why:'The original office/lunchroom identity is recorded; the removal row’s 6 m description is an acknowledged source error.',relatedReferences:[a.key],originalAsset:rule.asset,sourceEvidence973:{kind:'original-item-link',schedule:rule.source,opening:rule.opening,contract:'9968929-KINP',contractLine:row.task_id==='T0222'?1:3,sourceSize:'Building 6m',verifiedSize:'4.8 × 3 m',dateDiscrepancy:'Schedule pickup 12 Nov; Baseplan Booked Pickup Date 13 Nov. Neither date changed by this association.'}});
 }
 function area(row,base,c){
  if(base.linked||base.relation==='conflict'||hasNativeAssociation(row.task_id,c))return null;
  if(sourceRow(row,'T0234',"'Event Week'!A2:H2",'Passes',null,'blank')&&norm(row.location)==='collect event weekend accred')return Object.assign({},base,{location:'Accreditation Centre · Helen Park',locationState:'named-area',exactPosition:false,required:'',why:'The supplied schedule and master identify the accreditation centre area. No particular counter or building is assigned.',relatedReferences:['P53','P54'],sourceEvidence973:{kind:'named-area',file:'D001-26003-03-MASTER.pdf',page:1,schedule:["'Week 3'!E14","'Week 2'!E18"],infrastructure:"'Base information (4)'!A84:A85",limit:'Area association only; P53 is not added to Coates equipment.'}});
  const fridge=sourceRow(row,'T0273',"'Event Week'!A45:I45",'Furniture','Fridge',1)&&norm(row.location)==='fridge';
  const air=sourceRow(row,'T0274',"'Event Week'!A46:I46",'Furniture','Air Con',2)&&norm(row.location)==='portable aircon';
  if((fridge||air)&&norm(row.customer)==='wau'&&list(row.customers).length===1&&norm(row.customers[0])==='wau')return Object.assign({},base,{location:'WAU team area',locationState:'named-area',exactPosition:false,required:'',why:'WAU is the scheduled customer and the supplied plans identify its team area. No exact building or physical unit is assigned.',relatedReferences:['P13'],sourceEvidence973:{kind:'named-area',file:'D001-26003-03-MASTER.pdf',page:1,schedule:row.source_range,infrastructure:"'Base information (4)'!A40",limit:'P13 is a related team-office reference; the item is not asserted to be inside P13.'}});
  return null;
 }
 const vmsRules=Object.freeze({T0128:["'Week 1'!A32:H32",2],T0158:["'Event Week'!A28:H28",9],T0159:["'Event Week'!A29:H29",5],T0169:["'Event Week'!A40:H40",2],T0170:["'Event Week'!A41:H41",1]});
 function vms(row,base,c){
  const rule=vmsRules[row.task_id];if(!rule||base.relation==='conflict'||!sourceRow(row,row.task_id,rule[0],'VMS','VMS',rule[1]))return null;
  const current=list(base.boardReferences),allocated=current.length>=rule[1];
  if(allocated||base.exactPosition||base.locationState==='named-place'||hasNativeAssociation(row.task_id,c))return null;
  const a=list(c.assets).find(a=>a.key===base.recordRef);
  if(a&&(a._locationMoved||a._movedTo||a._cancelled))return null;
  if(text(row.location)&&norm(row.location)!=='relocate')return null;
  const count=current.length,required=(count?'Remaining VMS board numbers':'VMS board numbers')+' assigned to this '+(row.task_id==='T0159'?'relocation':'load')+' are not recorded.';
  const discrepancy=row.task_id==='T0159'?'Five moves are scheduled; VMS001 describes four relocation positions. D025 identifies 04A where VMS001 identifies 03a. The batch allocation and fifth move are unresolved.':'';
  return Object.assign({},base,{location:count?base.location:'Numbered plan destinations · load allocation not recorded',locationState:'plan-covered-allocation-open',required,why:discrepancy||'The supplied plans show numbered VMS destinations; the source load does not identify its assigned boards.',sourceEvidence973:{kind:'plan-covered-allocation-open',file:'VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf',sha256:'9ef1527d1fd9c6c7ea70dd3db3ced96784b0c1b32eba0df2aa3fb5ecd61be382',pages:row.task_id==='T0159'?[9,10]:[1,17],relatedDrawing:'D025-26003-02-VMS.pdf',sourceRange:row.source_range,discrepancy}});
 }
 function projectRow(row,base,ctx){
  const c=ctx||(typeof Reference966!=='undefined'?Reference966.context():{});
  return demob(row,base,c)||area(row,base,c)||vms(row,base,c)||base;
 }
 function officeLink(id,ctx){
  if(!demobRules[id]||typeof Reference966==='undefined')return null;
  const c=ctx||Reference966.context(),row=list(c.rows).find(r=>r.task_id===id);if(!row)return null;
  const resolved=Reference966.resolve(row,c);
  const projected=resolved.relation==='paired-demob'?resolved:demob(row,resolved,c);
  return projected&&projected.relation==='paired-demob'?projected.recordRef:null;
 }
 function sourceLink(row){
  const e=row&&row.sourceEvidence973;if(!e)return '';
  if(e.file==='VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf'&&typeof Documents973!=='undefined')return Documents973.href()||'';
  return '';
 }
 return {sourcePlace,destination,suppressNavigation,projectRow,officeLink,sourceLink,context,gensSource};
})();
if(typeof window!=='undefined')window.Reference973=Reference973;
if(typeof module!=='undefined'&&module.exports)module.exports=Reference973;
