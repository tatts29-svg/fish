/* Author: Andrew Fisher. Original-photo and contract-planned destination links. */
const Source974=(()=>{
 const arr=x=>Array.isArray(x)?x:[],txt=x=>String(x==null?'':x).trim();
 const photoIds={office:'drop_T0021_u960639_2_20260918-103849_d5e59ca718bd7b18.jpg',pair:'drop_T0022_1_20260918-103409_a57eced29fa6ea7f.jpg'};
 const rules={T0128:{date:'2026-10-16',range:"'Week 1'!A32:H32",boards:['VMS11','VMS12'],lines:[15,16]},T0158:{date:'2026-10-19',range:"'Event Week'!A28:H28",boards:['VMS13','VMS14','VMS15','VMS16','VMS17','VMS18','VMS19','VMS20','VMS23'],lines:[18,19,21,22,23,24,25,26,30]}};
 function office(a,c){
  if(!a||a.key!=='T0021'||a._cancelled||a._movedTo||a._locationMoved||a.relocation||a.rest_of)return null;
  c=c||Reference973.context();const s=c.state||{},near=arr(c.assets).find(x=>x.key==='T0022');
  if(near&&(near._cancelled||near._movedTo||near._locationMoved||near.relocation||arr(near.asset_numbers).map(txt).join('|')!=='960634'))return null;
  if(txt(s.locations&&s.locations.T0021)||arr(a.asset_numbers).map(txt).join('|')!=='960639')return null;
  for(const records of [s.fixes,s.places]){if(records&&Object.keys(records).some(k=>k==='T0021'||k.indexOf('T0021/')===0)){for(const k of Object.keys(records)){if(k!=='T0021'&&k.indexOf('T0021/')!==0)continue;const r=records[k],f=r&&(r.v||r);if(f&&Number.isFinite(f.lat)&&Number.isFinite(f.lon))return null;}}}
  for(const fn of [c.pin,c.place]){try{const p=fn&&fn(a),f=p&&(p.fix||p.place||p);if(f&&Number.isFinite(f.lat)&&Number.isFinite(f.lon))return null;}catch(e){}}
  const own=arr(s.dropPhotos&&s.dropPhotos.T0021&&s.dropPhotos.T0021.photos),pair=arr(s.dropPhotos&&s.dropPhotos.T0022&&s.dropPhotos.T0022.photos);
  if(!own.some(p=>p.id===photoIds.office&&txt(p.unit)==='960639'&&!p.removed)||!pair.some(p=>p.id===photoIds.pair&&!p.removed))return null;
  return {label:'Coates compound · beside lunchroom T0022',kind:'named-place',exactPosition:false,relatedReferences:['T0022'],source:{kind:'item-photo-relation',photos:[photoIds.office,photoIds.pair],relatedAsset:'960634',limit:'Original photographs show both buildings together. No office coordinate is inferred from the lunchroom pin.'},basis:'Item-specific original photos show office 960639 beside lunchroom T0022.'};
 }
 function planned(row,base,c,d){
  const rule=row&&rules[row.task_id];if(!rule||!base||base.relation==='conflict'||base.exactPosition||base.locationState==='named-place'||arr(base.boardReferences).length)return null;
  if(row.source_range!==rule.range||row.date!==rule.date||row.product!=='VMS'||row.item!=='VMS'||txt(row.quantity_display)!==String(rule.boards.length)||txt(row.location))return null;
  c=c||{};if(c.given&&c.given[row.task_id]||arr(c.added).some(a=>a.source_row===row.task_id))return null;
  const a=arr(c.assets).find(a=>a.key===base.recordRef);if(a&&(a._cancelled||a._movedTo||a._locationMoved||a.relocation))return null;
  const hire=d&&d.rental_on_hire;if(!hire||hire.source_sha256!=='eb4a224fadbe1350d031adf8a1b12760d3dd748a2f0643119ea103d1df9b5b21')return null;
  const rows=arr(hire.rows).filter(r=>r.rental_contract==='9961265'&&r.branch_code==='STPS'&&r.family==='vms'&&r.booked_delivery_date===rule.date&&!r.charge_line);
  if(rows.length!==rule.boards.length)return null;
  const checks=rule.boards.every((board,i)=>rows.some(r=>r.line===rule.lines[i]&&r.quantity===1&&new RegExp('^'+board+'\\b','i').test(txt(r.description))));if(!checks)return null;
  return Object.assign({},base,{location:'Contract-planned destinations · '+rule.boards.join(', '),locationState:'contract-planned-group',required:'',why:'Current contract board descriptions, booked date and quantity match this schedule batch. This is a planned destination group; no received status or physical truck assignment is inferred.',plannedBoardReferences:rule.boards.slice(),exactPosition:false,sourceEvidence973:Object.assign({},base.sourceEvidence973,{kind:'contract-planned-group',contract:'9961265-STPS',contractLines:rule.lines.slice(),contractSource:hire.source_sha256,plannedBoards:rule.boards.slice(),limit:'Contract-planned group only; later saved board allocations and destinations take precedence.'})});
 }
 const oldPlace=Reference973.sourcePlace,oldDest=Reference973.destination,oldSuppress=Reference973.suppressNavigation,oldProject=Reference973.projectRow;
 Reference973.sourcePlace=(a,c)=>office(a,c)||oldPlace(a,c);
 Reference973.destination=(a,b,c)=>{const p=office(a,c);return p?Object.assign({},b,{text:p.label,known:true,quoted:false,quote:'',reads_as:null,confidence:'source-photo-area',fallback:p.label,source:'Original item photos · T0021 / T0022',exactPosition:false,sourceReference973:p}):oldDest(a,b,c);};
 Reference973.suppressNavigation=(a,c)=>!!office(a,c)||oldSuppress(a,c);
 Reference973.projectRow=(row,b,c)=>{const out=oldProject(row,b,c),ctx=c||(typeof Reference966!=='undefined'?Reference966.context():{}),d=typeof DATA==='undefined'?{}:DATA,p=planned(row,out,ctx,d);if(p)return p;const a=arr(ctx.assets).find(a=>a.key===out.recordRef),place=office(a,{state:ctx.state||(typeof S==='undefined'?{}:S),assets:ctx.assets,pin:ctx.pin,place:ctx.place});return place&&!out.exactPosition?Object.assign({},out,{location:place.label,locationState:'named-place',required:'',relatedReferences:['T0022'],exactPosition:false,sourceEvidence974:place.source}):out;};
 return {office,planned,rules,photoIds};
})();
if(typeof window!=='undefined')window.Source974=Source974;
