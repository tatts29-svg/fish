/* Author: Andrew Fisher. v9.66 source-row references and destinations are different facts.
 * Read-only relationships. Stable item keys, receipts, installation, pins and charges never move.
 * The schedule's T references already identify records; a missing drawing callout is not a missing record.
 */
const Reference966 = (() => {
 const text=v=>String(v==null?'':v).trim(), list=v=>Array.isArray(v)?v:[], norm=v=>text(v).toLowerCase().replace(/\s+/g,' ');
 const noDestination=/^(?:relocate|spare|fridge(?: lge)?|portable aircon|office\s*\d|lunchroom\s*\d|event container from|collect event weekend accred)/i;
 function namedPlace(value,item){const v=text(value);return v&&!noDestination.test(v)&&norm(v)!==norm(item)&&!/^generator$|^toilets?$|^(?:\/?\d*:?\s*)?light towers?$/i.test(v)?v:'';}
 function boardReferences(a){
  if(typeof vms913BoardsOn!=='function')return [];
  const boards=vms913BoardsOn(a)||[], native=typeof unitsOf==='function'?unitsOf(a.key):[];
  return boards.map(b=>{
   const named=/^VMS(\d{1,2})$/.exec(text(b.vms)), no=named?Number(named[1]):null;
   if(no>=1&&no<=24)return {ref:'VMS'+String(no).padStart(2,'0'),source:'VMS001-26003-01 · issued plan',basis:'Current board assignment and numbered plan entry',exactPosition:false};
   const matches=list(native).filter(u=>text(u.asset_no)===text(b.asset)&&u.sheet==='D025-26003-02'&&/^0[1-8]$/.test(text(u.callout)));
   return matches.length===1?{ref:'VMS'+matches[0].callout,source:matches[0].sheet,basis:'Recorded asset-to-callout association',exactPosition:false}:null;
  }).filter(Boolean);
 }
 function context(){return {boardRefs:boardReferences,assets:allAssets(),rows:DATA.unreferenced||[],closed:DATA.plant_lines?.closed_by_demob_row||{},added:S.added||[],given:S.givenRefs||{},off:rowOff,destination:a=>dest782(a),where:a=>whereText(a)};}
 function resolve(row,ctx){
  const c=ctx||context(), id=text(row?.task_id), assets=list(c.assets), byKey=new Map(assets.map(a=>[a.key,a]));
  const added=list(c.added).filter(a=>a.source_row===id&&byKey.has(a.key)), given=c.given?.[id]?.ref;
  const direct=given&&byKey.get(given)||byKey.get(id), paired=Object.entries(c.closed||{}).filter(([,v])=>v===id).map(([k])=>k);
  let a=null,relation='source-task',reason='This task retains its schedule reference.';
  if(added.length===1){a=byKey.get(added[0].key);relation='assigned';reason='The saved reference names this source row.';}
  else if(added.length>1){relation='conflict';reason='More than one saved item claims this source row.';}
  else if(direct){a=direct;relation='item';reason='The schedule row already has an item record.';}
  else if(paired.length===1){
   const parent=paired[0], aliases=list(c.added).filter(x=>x.source_row===parent&&byKey.has(x.key));
   a=aliases.length===1?byKey.get(aliases[0].key):byKey.get(c.given?.[parent]?.ref||parent);
   if(a&&(list(a.events).some(e=>e.task_id===id&&e.movement==='remove')||aliases.length===1&&list(byKey.get(parent)?.events).some(e=>e.task_id===id&&e.movement==='remove'))){relation='paired-demob';reason='This removal is already linked to the delivered item.';}
   else {a=null;reason='The proposed removal link does not match the current item events.';}
  }
  const w=a&&c.where?c.where(a):null,d=a&&c.destination?c.destination(a):null;
  const point=d&&['master','confirmed','pinned'].includes(d.kind)&&Number.isFinite(d.ll?.lat)&&Number.isFinite(d.ll?.lon)?d:null;
  const place=namedPlace(w?.main,row.item)||namedPlace(row.location,row.item)||list(a?.locations).map(v=>{let t=text(v);if(a?.key&&t.toUpperCase().startsWith(a.key.toUpperCase()))t=t.slice(a.key.length).replace(/^\s*[-–—:·]\s*/, '').trim();return namedPlace(t,row.item);}).find(Boolean)||'';
  const special=id==='T0243'&&row.item==='Toilet Block 6m'&&/^WC-TV\s*\(sewer connect\)$/i.test(text(row.location))?'WC-TV':'';
  const boards=a&&c.boardRefs?list(c.boardRefs(a)):[], boardPlace=boards.length?boards.map(b=>b.ref).join(' · '):'';
  const location=place||(point?'Recorded '+(point.kind==='master'?'master-plan position':'site position'):'')||boardPlace;
  const required=relation==='conflict'?reason:location?'':/passes/i.test(row.product||'')?'Collection point for the accreditation task is not stated.':row.phase==='Demob'?'The removal row does not identify its original item.':/^spare$/i.test(text(row.location))?'The spare is identified; its storage location is not recorded.':'The source does not name a destination for this item.';
  return {id,key:id,ref:a?.key||id,recordRef:a?.key||null,title:row.item||row.product||id,item:row.item||row.product||'',quantity:row.quantity_display,relation,linked:!!a,displayRef:special||a?.key||id,location,locationState:point?'position-recorded':place?'named-place':boards.length?'drawing-reference':'not-recorded',boardReferences:boards,exactPosition:!!point,required,why:required||reason,source:row.source_range||row.sheet||'Schedule row '+id,date:row.date||null,sourceRow:row};
 }
 function rows(ctx){if(!ctx&&typeof heldMemo==='function')return heldMemo('reference966-rows',()=>rows(context()));const c=ctx||context();return list(c.rows).filter(r=>!c.off||!c.off(r.task_id)).map(r=>resolve(r,c));}
 function locations(ctx){
  const c=ctx||context(), source=rows(c), linked=new Set(source.filter(r=>r.linked).map(r=>r.recordRef));
  return source.concat(list(c.assets).filter(a=>!a._cancelled&&!a._movedTo&&!linked.has(a.key)).map(a=>resolve({task_id:a.key,item:list(a.item_types)[0]||a.product||a.name,location:null,source_range:list(a.events).map(e=>e.source_range).find(Boolean)||'Existing item record '+a.key},c)));
 }
 function unresolvedLocations(ctx){return locations(ctx).filter(r=>r.required).map(({sourceRow,...r})=>r);}
 function sourceLinksForDay(iso,ctx){return rows(ctx).filter(r=>r.linked&&r.date===iso);}
 function pendingRows(ctx){return rows(ctx).filter(r=>!r.linked).map(r=>r.sourceRow);}
 return {context,boardReferences,resolve,row:resolve,rows,locations,unresolvedLocations,sourceLinksForDay,pendingRows,namedPlace};
})();
if(typeof window!=='undefined')window.Reference966=Reference966;
if(typeof module!=='undefined'&&module.exports)module.exports=Reference966;
function referenceSourceLinks966(d,full){
 const rows=Reference966.sourceLinksForDay(d.iso), off=typeof offRowsOn==='function'?offRowsOn(d.iso):[];
 const history=off.length?ldFoldIf(full,'reference-off966','Moved schedule rows',off.length,'<ul>'+off.map(r=>'<li><b>'+esc(r.task_id)+'</b> · '+esc(r.item||r.product||'')+' · '+esc(rowOffWords(r.task_id))+(full?' <button type="button" class="btn" data-rowback="'+esc(r.task_id)+'">Put it back</button>':'')+'</li>').join('')+'</ul>'):'';
 if(!rows.length)return history;
 return history+ldFoldIf(full,'reference-sources966','Linked schedule rows',rows.length,'<div class="tblwrap daywrap"><table class="daytbl"><thead><tr><th>Schedule row</th><th>Item record</th><th>Destination</th><th>Link</th></tr></thead><tbody>'+rows.map(r=>'<tr><td data-label="Schedule row"><b>'+esc(r.id)+'</b><br><span class="w">'+esc(r.source)+'</span></td><td data-label="Item record"><button type="button" class="linkish" data-k="'+esc(r.recordRef)+'" data-open="'+esc(r.recordRef)+'">'+esc(r.displayRef)+'</button><br>'+esc(r.title)+'</td><td data-label="Destination">'+esc(r.location||r.required)+'</td><td data-label="Link">'+esc(r.relation==='paired-demob'?'Removal of the same item':'Linked to existing item')+'</td></tr>').join('')+'</tbody></table></div>');
}
function referenceTasks966(d,full){
 const rows=d.unref.map(r=>Reference966.resolve(r));if(!rows.length)return '';
 return '<div class="tblwrap daywrap"><table class="daytbl unreftbl"><thead><tr><th>Reference</th><th>Scheduled work</th><th>Qty</th><th>Destination / link</th><th>Source</th></tr></thead><tbody>'+rows.map(r=>'<tr class="unref"><td data-label="Reference"><b>'+esc(r.id)+'</b></td><td data-label="Scheduled work">'+esc(r.title)+(r.sourceRow.subhired950?'<br><b class="chip">SUB-HIRED</b>':'')+'</td><td data-label="Qty">'+esc(r.quantity==='blank'?'Not stated':r.quantity||'Not stated')+'</td><td data-label="Destination / link">'+esc(r.location||r.required)+'</td><td data-label="Source">'+esc(r.source)+(r.sourceRow.notes?'<br>'+esc(r.sourceRow.notes):'')+'</td></tr>').join('')+'</tbody></table></div><p class="norate">Each task retains its schedule reference. Planned work is not proof of arrival or installation.</p>';
}

function referenceBadge966(a){const d=typeof dest782==='function'?dest782(a):null,label=d&&['master','confirmed','pinned'].includes(d.kind)?(d.kind==='master'?'Master plan':'Site position'):'Schedule reference';return '<span class="chip ref">'+esc(label)+'</span>';}
