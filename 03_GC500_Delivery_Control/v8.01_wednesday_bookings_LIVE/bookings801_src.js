/* v8.01 — Wednesday's supplied bookings, with DD order separate from load time.
   Author: Andrew Fisher. Read-only projections; operational allocations and delivery records stay independent. */
function bookingOrder801(n){ return Number.isInteger(n) && n > 0 ? n + ({1:'st',2:'nd',3:'rd'}[n] || 'th') : 'Not supplied'; }
function bookingRows801(a, events){ return (events || (a && a.events) || []).filter(e => e.booking801 && !e.bookingMoved801).map(e => ({a, e, b:e.booking801})); }
function bookingRank801(r){ const ns=(r.events || []).map(e => e.booking801 && e.booking801.departure_order).filter(Number.isInteger); return ns.length ? Math.min(...ns) : 999; }
function bookingSort801(x,y){
 if (x.booking801 || y.booking801) return (x.departure_order == null ? 999 : x.departure_order) - (y.departure_order == null ? 999 : y.departure_order);
 return String(x.load_time_24h || x.time_24h || x.time || '').localeCompare(String(y.load_time_24h || y.time_24h || y.time || ''));
}
function bookingConflict801(a,b){
 const ns=[...new Set((b.loads || []).flatMap(l=>l.asset_numbers || []))];
 if (!ns.length) return '';
 const others=allAssets().filter(x=>x.key!==a.key && (x.asset_numbers || []).some(n=>ns.includes(String(n)))).map(x=>x.key);
 const current=(assetOf(a.key)||a).asset_numbers || [];
 const missing=ns.filter(n=>!current.includes(n));
 if (!others.length && !missing.length) return '';
 return 'Booked asset ' + ns.join(', ') + (b.asset_source ? ' ' + b.asset_source : '') + (others.length ? ' is also allocated to ' + others.join(', ') + '.' : '.') + (missing.length && current.length ? ' Current allocation on ' + a.key + ': ' + current.join(', ') + '.' : '') + ' Check allocation before dispatch; no asset allocation changed by this booking.';
}
function bookingGroups801(d){
 const groups=new Map(), unassigned=[];
 (d.deliveries || []).forEach(r=>bookingRows801(r.a,r.events).forEach(({a,e,b})=>{
  if (!(b.loads || []).length) {
   unassigned.push({kind:'deliveries',rows:[r],time:null,timeRaw:'',carrier:'',basis:'booking-unassigned',booking801:true,departure_order:null,dds:[],truck_id:null}); return;
  }
  b.loads.forEach(l=>{
   let g=groups.get(l.truck_id);
   if(!g){g={kind:'deliveries',rows:[],time:dpT(l.load_time),timeRaw:l.load_time,carrier:l.carrier,basis:'booking',booking801:true,departure_order:b.departure_order,dds:[],truck_id:l.truck_id};groups.set(l.truck_id,g);}
   g.dds.push(l.dd);
   const nums=(l.asset_numbers || []).slice();
   const part=Object.assign({},e,{quantity_display:String(l.quantity),quantity_raw:l.quantity,dd:l.dd,load_time:l.load_time,carrier:l.carrier,_bookingLoad801:l});
   const piece=Object.assign({},a,{asset_numbers:nums,_bookingNumbers801:nums,item_types:[e.item],_bookingSource801:b,events:[part],charge_lines:(a.charge_lines || []).filter(x=>x.item===e.item).map(x=>Object.assign({},x,{quantity:l.quantity}))});
   if(b.loads.length>1){piece._bookingUnassignedAccessories801=(a.accessories || []).length>0;piece.accessories=[];}
   g.rows.push(Object.assign({},r,{a:piece,events:[part]}));
  });
 }));
 return [...groups.values()].sort(bookingSort801).concat(unassigned);
}
function bookingLoads801(d){
 return bookingGroups801(d).filter(g=>g.truck_id).map(g=>({
  booking801:true,n:g.truck_id,date:d.iso,time:g.time,time_24h:g.time,time_as_written:g.timeRaw,
  item:g.rows.map(r=>dpItemsWords(r)).join(' + '),carrier:g.carrier,departure_order:g.departure_order,
  refs:g.rows.map(r=>r.a.key),dd:g.dds.join(' / '),early:g.time < '06:00',
  drop_point:g.rows.map(r=>r.a._bookingSource801.location).join(' + '),
  supplied_by:'Andrew Fisher',source:'Bookings supplied 2 Oct 2026',
 }));
}
function carrierLoads801(){ return programmeDays().flatMap(d=>d.loads || []); }
function programmeDays(){
 const days=programmeDaysBefore801();
 days.forEach(d=>{
  d.deliveries.forEach(r=>{r.events=(r.events || []).map(e=>e.booking801 && e.booking801.date!==d.iso ? Object.assign({},e,{bookingMoved801:true,carrier:null,dd:null,load_time:null,note:[e.note,'Booking supplied for '+fmtDate(e.booking801.date)+'; a booking for this rescheduled day has not been supplied.'].filter(Boolean).join(' · ')}) : e);});
  if(d.deliveries.some(r=>(r.events || []).some(e=>e.booking801 && !e.bookingMoved801)))d.loads=d.loads.concat(bookingLoads801(d));
 });
 return days;
}
function loadOf(l){
 const id=typeof l==='string'?l:loadId(l), record=loadOfBefore801(l);
 if ((S.loads || {})[id] || (COMMITTED.loads || {})[id]) return record;
 const native=typeof l==='string'?(id.includes('#dd-') || id.includes('#wed7-') ? carrierLoads801().find(x=>loadId(x)===id):null):l;
 if(native && native.booking801) return Object.assign({},record,{keys:native.refs.slice(),drop:native.drop_point || '',by:native.supplied_by,where:'supplied booking'});
 return record;
}
function dpLoads(d){
 const booked=bookingGroups801(d);
 if(!booked.length)return dpLoadsBefore801(d);
 const remaining=Object.assign({},d,{deliveries:(d.deliveries || []).map(r=>Object.assign({},r,{events:(r.events || []).filter(e=>!e.booking801)})).filter(r=>r.events.length),loads:(d.loads || []).filter(l=>!l.booking801)});
 return booked.concat(dpLoadsBefore801(remaining));
}
function dpNums(a){ return Array.isArray(a._bookingNumbers801) ? a._bookingNumbers801.slice() : dpNumsBefore801(a); }
function bookingNosLine801(a){ return Array.isArray(a._bookingNumbers801) ? a._bookingNumbers801.map(esc).join(' · ') : assetNosLine(a); }
function dpBasisShort(g){
 if(!g.booking801)return dpBasisShortBefore801(g);
 if(!g.truck_id)return 'No DD, carrier or load time supplied';
 return 'DD departure ' + bookingOrder801(g.departure_order) + ' · DD ' + g.dds.join(' / ') + (g.rows.length>1?' · shared truck':'');
}
function bookingNotes801(g){
 if(!g.booking801)return '';
 const notes=[];
 g.rows.forEach(r=>bookingRows801(r.a,r.events).forEach(({a,b})=>{
  const accessoryNotes=new Set(dpAcc(a).map(x=>x.t.toLowerCase()));
  const rowNote=b.notes && !accessoryNotes.has(b.notes.toLowerCase())?b.notes:null;
  const text=[b.activity,rowNote,a._bookingUnassignedAccessories801?'Accessories are held on the reference; their allocation to these trucks was not supplied.':null,b.asset_text && !/^na$/i.test(b.asset_text) && !/^\d/.test(b.asset_text)?'Asset field: '+b.asset_text:null,b.asset_source,bookingConflict801(a,b)].filter(Boolean).join(' · ');
  if(text)notes.push('<div class="dp-l dp-w"><label>'+esc(a.key)+'</label><div>'+esc(text)+'</div></div>');
 }));
 return notes.length?'<div class="dp-lines">'+notes.join('')+'</div>':'';
}
function dpTruck(g,doc){ return dpTruckBefore801(g,doc)+bookingNotes801(g); }
function bookingBrief801(a){
 const rows=bookingRows801(a); if(!rows.length)return '';
 const body=rows.map(({b})=>{
  const ls=b.loads.length?b.loads:[{dd:'NA',load_time:null,carrier:null,quantity:b.quantity,asset_numbers:[]}];
  return ls.map(l=>`<div class="lbrow"><span class="lbck">${esc(b.item)} · Qty ${esc(l.quantity)}<br>DD departure order</span><b>${esc(bookingOrder801(b.departure_order))}</b></div>
   <div class="cut lbband"><span class="face"><span class="lbcar"><span class="lbck">Carrier, as supplied</span><b>${esc(l.carrier || 'Not supplied')}</b></span><span class="lbtime clear"><span class="lbck">Kingston load time</span><b class="racenum">${esc(l.load_time?dpT(l.load_time):'Not supplied')}</b></span></span></div>
   <div class="lbrow"><span class="lbck">Delivery docket</span><b>${esc(l.dd)}</b></div>
   <div class="lbrow"><span class="lbck">Booked asset</span><b>${esc(l.asset_numbers.length?l.asset_numbers.join(', '):(b.asset_text || 'Not supplied'))}${b.asset_source?' · '+esc(b.asset_source):''}</b></div>`).join('')+
   ([b.activity,b.notes,b.asset_pairing_basis,bookingConflict801(a,b)].filter(Boolean).length?`<div class="lbflag"><div>${[b.activity,b.notes,b.asset_pairing_basis,bookingConflict801(a,b)].filter(Boolean).map(esc).join(' · ')}</div></div>`:'');
 }).join('');
 return `<div class="lbrief"><div class="lbhead"><div><p class="lbk">Supercars · Kingston dispatch</p><h3>Load brief</h3></div><div class="lbwhen"><span>Booking date</span><b>07 Oct 2026</b></div></div>${body}<p class="norate">Leave Kingston in DD order. Load times are recorded separately; no site arrival time supplied. Author: Andrew Fisher.</p></div>`;
}
function loadBrief(a){ return bookingRows801(a).length?bookingBrief801(a):loadBriefBefore801(a); }
function bookingDayWords801(a,events){
 return bookingRows801(a,events).map(({e,b})=>{
  const ls=(e._bookingLoad801?[e._bookingLoad801]:b.loads).map(l=>'DD '+l.dd+' · load '+dpT(l.load_time)+' · '+l.carrier).join('; ');
  return '<b>DD departure '+esc(bookingOrder801(b.departure_order))+'</b> · '+esc(b.item)+' · '+esc(ls || 'DD NA; no carrier or load time supplied')+(b.notes?' · '+esc(b.notes):'')+(b.activity?' · '+esc(b.activity):'')+(bookingConflict801(a,b)?'<br><span class="w">'+esc(bookingConflict801(a,b))+'</span>':'');
 }).join('<br>');
}

function bookingLoadingWords801(a){
 const rows=bookingRows801(a).filter(({e})=>e.movement!=='remove');
 if(!rows.length)return '';
 const words=rows.map(({e,b})=>{
  const ls=e._bookingLoad801?[e._bookingLoad801]:b.loads;
  return b.item+': '+(ls.length?ls.map(l=>'DD '+l.dd+' · departure order '+bookingOrder801(b.departure_order)+' · booked loading time '+dpT(l.load_time)+' · '+l.carrier).join('; '):'DD NA; no departure order, carrier or loading time supplied');
 });
 return 'LOAD: Leave Kingston in DD departure order. Listed times are booked loading times; departure and site arrival times were not supplied. '+words.join('. ')+'.';
}

function dpLoadLine(g){ const line=dpLoadLineBefore801(g); return g.booking801 ? dpBasisShort(g)+' · '+line : line; }
function loadAssets(l){
 const id=typeof l==='string'?l:loadId(l);
 if(id.includes('#dd-') || id.includes('#wed7-')){
  const d=programmeDays().find(x=>x.iso===id.split('#')[0]);
  const g=d && bookingGroups801(d).find(g=>g.truck_id && loadId({date:d.iso,n:g.truck_id})===id);
  const keys=loadOf(l).keys;
  if(g && keys.length===g.rows.length && g.rows.every(r=>keys.includes(r.a.key)))return g.rows.map(r=>r.a);
 }
 return loadAssetsBefore801(l);
}
