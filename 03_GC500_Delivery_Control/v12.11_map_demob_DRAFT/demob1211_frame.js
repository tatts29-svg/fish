/* Author: Andrew Fisher. Local map-area pickup draft; never writes the shared record. */
function demobFrame1211(){
 'use strict';
 const H=parent.MapDemob1211,A=window.GC500Area1206,C=parent.MapArea1206.core;
 const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const when=d=>new Date(d).toLocaleString('en-AU',{timeZone:'Australia/Brisbane',hour12:false})+' AEST';
 const directions=ll=>'https://www.google.com/maps/dir/?api=1&destination='+ll.lat.toFixed(6)+','+ll.lon.toFixed(6);
 let area=null,panel=null,refs=[],generation=0,ready=null,running=false,opener=null,expanded=false;
 const css=document.createElement('style');css.textContent=`
 #demob1211{position:fixed;inset:12px;z-index:140;background:#fff;color:#172c3b;border:2px solid #ff6a13;border-radius:12px;box-shadow:0 12px 45px #0008;max-width:760px;margin:auto;padding:16px;overflow:auto;overscroll-behavior:contain;font:14px/1.45 Inter,sans-serif;text-align:left}
 #demob1211[hidden]{display:none!important}#demob1211 h2{margin:0;font-size:21px}#demob1211 .dm-head{display:flex;align-items:center;justify-content:space-between;gap:10px}#demob1211 button{min-height:42px;padding:8px 13px;border:1px solid #b6c2ca;border-radius:7px;background:#f3f6f8;color:#132b3b;font:inherit;cursor:pointer}#demob1211 button:disabled{opacity:.55;cursor:default}#demob1211 .dm-primary{background:#e95700;color:white;border-color:#e95700}#demob1211 fieldset{border:1px solid #bac8d0;border-radius:8px;margin:14px 0;padding:12px;min-width:0}#demob1211 legend{font-weight:800;padding:0 5px}#demob1211 label{display:flex;gap:9px;align-items:flex-start;margin:9px 0;cursor:pointer}#demob1211 input[type=checkbox]{width:20px;height:20px;flex-shrink:0;accent-color:#e95700}#demob1211 input[type=number]{width:74px;padding:6px;font:inherit}#demob1211 small{display:block;color:#425c6d}#demob1211 .dm-hold{background:#fff1d6;color:#713f00;padding:9px;border-radius:6px}#demob1211 .dm-actions{display:flex;gap:8px;flex-wrap:wrap}#demob1211 [data-status]{min-height:24px;padding:9px 0;font-weight:600}#demob1211 a{color:#005aad}#demob1211 .dm-preview{width:100%;max-height:260px;object-fit:contain;background:#e6ebee}#demob1211 .dm-icon{font:20px GC500MapUnits1147,sans-serif}#spot1117 .sp-btns{flex-wrap:wrap}
 @media(max-width:600px){#demob1211{inset:5px;padding:12px}#demob1211 .dm-actions button{flex:1 1 120px}}
 `;document.head.appendChild(css);
 function dispose(){if(ready)for(const u of ready.urls||[])URL.revokeObjectURL(u);ready=null;}
 function status(text){if(panel)panel.querySelector('[data-status]').textContent=text;}
 function invalidate(){generation++;dispose();if(panel){panel.querySelector('[data-ready]').replaceChildren();panel.querySelectorAll('[data-share],[data-save],[data-mail]').forEach(b=>b.disabled=true);}}
 function close(){invalidate();if(panel)panel.hidden=true;if(expanded){expanded=false;parent.expFullToggle(false);}opener?.focus();}
 function selected(){return refs.map((r,i)=>({key:r.key,token:r.token,items:r.items.map((it,j)=>({type:it.type,ids:[...panel.querySelectorAll('[data-unit="'+i+':'+j+'"]:checked')].map(b=>it.units[Number(b.value)].id),unidentified:Number(panel.querySelector('[data-qty="'+i+':'+j+'"]')?.value||0)}))})).filter(r=>r.items.some(i=>i.ids.length||i.unidentified));}
 function consent(){if(!panel.querySelector('[data-no-twin]').checked)throw new Error('Tick that no twin-steer truck will be used for this pickup.');}
 function open(s,button){
  close();opener=button;if(!parent.document.body.classList.contains('expfull-on')){parent.expFullToggle(true);expanded=true;}area=s;refs=s.rows.map(row=>{const r=H.reference(row.code);return r?{...r,map:row}:null;}).filter(Boolean);
  if(!panel){panel=document.createElement('section');panel.id='demob1211';panel.role='dialog';panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Demob pickup selection');document.body.appendChild(panel);
   panel.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();close();}if(ev.key==='Tab'){const a=[...panel.querySelectorAll('button:not(:disabled),input,a[href]')].filter(el=>el.offsetParent!==null),first=a[0],last=a.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last?.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first?.focus();}}});
   panel.addEventListener('input',()=>{invalidate();status('Selection changed. Prepare a new pickup pack.');});
  }
  panel.innerHTML='<div class="dm-head"><h2>Demob · 50 m area</h2><button type="button" data-close aria-label="Close Demob">Close</button></div><p>Select the equipment requested for pickup. Any holds below must be cleared before collection. This makes a shareable pack; it does not mark anything collected.</p><small>Items belong to the mapped reference; individual units may not have their own position. '+e(s.pin.ll.lat.toFixed(6)+', '+s.pin.ll.lon.toFixed(6))+'</small>'+
  (refs.length?refs.map((r,i)=>'<fieldset><legend>'+e(r.key)+' <span class="dm-icon">'+r.map.symbols.map(x=>e(x.glyph||'')).join(' ')+'</span></legend>'+(r.departure?.collected?'<p><b>'+e(r.departure.label)+'</b><small>'+e(r.departure.last)+'</small></p>'+parent.Departure1211.historyHtml(r.key):'')+r.hold.map(x=>'<p class="dm-hold">'+e(x)+'</p>').join('')+(!r.items.length?'<p>No known remaining pickup quantity.</p>':'')+r.items.map((it,j)=>'<b>'+e(it.type)+' · '+it.n+' remaining</b>'+it.units.map((u,k)=>'<label><input type="checkbox" data-unit="'+i+':'+j+'" value="'+k+'"><span>'+e(u.number)+' · '+e(u.company)+'</span></label>').join('')+(it.unidentified?'<label><input type="number" min="0" max="'+it.unidentified+'" step="1" value="0" data-qty="'+i+':'+j+'"><span>'+e(it.type)+' without individual asset IDs<small>Up to '+it.unidentified+'; owner/identity must be confirmed at pickup.</small></span></label>':'')).join('')+'<small>'+e(A.doorWords(r.map)||'No door direction recorded')+'</small>'+(r.items.length?'<button type="button" data-record-departure="'+i+'">Record selected items left site…</button>':'')+'</fieldset>').join(''):'<p>No registered pickup equipment in this area. Move the pin to the equipment location.</p>')+
  '<label class="dm-hold"><input type="checkbox" data-no-twin><span>No twin-steer truck will be used. Track, Esplanade and Macintosh Island Park restrictions apply.</span></label><div class="dm-actions"><button type="button" class="dm-primary" data-prepare>Prepare pickup pack</button><button type="button" data-share disabled>Share</button><button type="button" data-mail disabled>Email PDF</button><button type="button" data-save disabled>Save PDF</button></div><div data-status role="status" aria-live="polite"></div><div data-ready></div><small>Author: Andrew Fisher</small>';
  panel.hidden=false;panel.querySelectorAll('[data-record-departure]').forEach(b=>b.onclick=()=>{try{const r=refs[Number(b.dataset.recordDeparture)],p=selected().find(x=>x.key===r.key);if(!p)throw new Error('Select the items that actually left this location.');H.validate([p]);mapFresh([r]);if(!parent.mayWrite('a pick-up'))return;close();parent.Departure1211.open(r.key,p);}catch(err){status(err.message);}});panel.querySelector('[data-close]').onclick=close;panel.querySelector('[data-prepare]').onclick=prepare;panel.querySelector('[data-share]').onclick=()=>send(false);panel.querySelector('[data-mail]').onclick=()=>send(true);panel.querySelector('[data-save]').onclick=()=>save();panel.querySelector('[data-close]').focus();
 }
 function lines(rows){
  const ll=area.pin.ll,out=['GC500 · Demob pickup request','Prepared '+when(new Date()),'50 m x 50 m area · north up','Centre '+ll.lat.toFixed(6)+', '+ll.lon.toFixed(6),'No twin-steer truck will be used (confirmed for this pack).','Selection only. Outstanding holds must be cleared before collection; no pickup is recorded by this pack.'];
  for(const r of rows){const map=refs.find(x=>x.key===r.key).map;out.push('',r.key+' — '+r.name,...r.hold.map(h=>'HOLD: '+h));
   for(const it of r.items){out.push(it.n+' x '+it.type);for(const u of it.units)out.push('Asset '+u.number+' · '+u.company);if(it.unidentified)out.push(it.unidentified+' without individual asset IDs — identity/owner to confirm.');}
   const selectedNumbers=new Set(r.items.flatMap(i=>i.units.map(u=>u.number))),selectedTypes=new Set(r.items.map(i=>i.type));
   const loading=r.loading.filter(l=>selectedNumbers.has(l.asset)||!l.asset&&selectedTypes.has(l.item));
   out.push(A.doorWords(map)||'Plan door position/direction not recorded.');for(const l of loading)out.push('Truck loading · '+(l.asset?l.asset+' · ':'')+l.item+': '+({driver:'door to driver side',passenger:'door to passenger side',na:'door side not applicable'}[l.side]||'door side not recorded'));
  }
  out.push('','Navigation to selected area: '+directions(ll),'Navigation is to the map reference, not an approved truck route. Follow site traffic control.','Macintosh Island Park: enter from Gold Coast Highway into the north-west end of pit lane and follow race direction.','Buildings: on site before 07:00; truck leaves the pickup point before the 07:00–09:00 travel restriction.','Mapped reference positions are registered to the master plan, not surveyed. Individual units without plotted positions are not assigned an exact place inside the square.','Author: Andrew Fisher');return out;
 }
 function selectedSnapshot(rows){return {...area,rows:refs.filter(r=>rows.some(x=>x.key===r.key)).map(r=>r.map)};}
 function mapFresh(rows){const fresh=A.snapshot(area.pin),signature=r=>r?JSON.stringify([r.code,r.points,r.parts,r.loading,r.how]):'';if(rows.some(r=>signature(refs.find(x=>x.key===r.key)?.map)!==signature(fresh?.rows.find(x=>x.code===r.key))))throw new Error('The mapped location or door details changed. Reopen Demob and review the area.');}
 function assertFresh(){consent();mapFresh(H.validate(selected()));if(!ready)throw new Error('Prepare the pickup pack first.');}
 function download(file){const u=URL.createObjectURL(file),a=document.createElement('a');a.href=u;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),60000);}
 function save(){try{assertFresh();download(ready.pdf);status('PDF saved. Attach it to your email or message.');}catch(err){invalidate();status(err.message);}}
 async function send(mail){
  try{assertFresh();const r=ready,files=mail?[r.pdf]:[r.pdf,r.png,r.txt];
   if(navigator.share&&navigator.canShare?.({files})){try{await navigator.share({title:'GC500 Demob pickup pack',text:mail?'Pickup map and details attached.':r.text,files});status('Returned from the share sheet. Delivery is not confirmed here.');return;}catch(err){if(err.name==='AbortError'){status('Sharing cancelled. Nothing was downloaded.');return;}status('File sharing is unavailable. Save the PDF and attach it manually.');return;}}
   if(mail){download(r.pdf);const a=document.createElement('a');a.href='mailto:?subject='+encodeURIComponent('GC500 Demob pickup pack')+'&body='+encodeURIComponent('Please attach the downloaded '+r.pdf.name+'.\n\nGC500 Demob pickup request. Map, selected equipment, recorded doors, outstanding holds and access details are in the PDF.\n'+directions(area.pin.ll)+'\nNo twin-steer truck will be used. Confirm all holds before collection.\nAuthor: Andrew Fisher');a.click();status('PDF downloaded and email draft requested. Attach the PDF before sending.');}
   else{download(r.pdf);download(r.png);download(r.txt);status('Pickup pack downloaded: PDF, map picture and full details. Attach these in your message.');}
  }catch(err){invalidate();status(err.message);}
 }
 async function prepare(){
  if(running)return;invalidate();let rows;
  try{consent();rows=H.validate(selected());mapFresh(rows);}catch(err){status(err.message);return;}
  const serial=generation,s=selectedSnapshot(rows),selection=selected(),text=lines(rows).join('\n');running=true;panel.querySelector('[data-prepare]').disabled=true;status('Preparing sharp map pictures and PDF…');
  try{
   const blob=await A.picture(s);if(serial!==generation)return;
   const pdf=await parent.MapDemobPdf1211.make({blob,rows:rows.map(r=>({...r,map:refs.find(x=>x.key===r.key).map})),text,centre:s.pin.ll});
   if(serial!==generation)return;mapFresh(H.validate(selection));consent();
   const stamp=new Date().toISOString().replace(/[:.]/g,'-'),base='GC500-demob-'+stamp,urls=[URL.createObjectURL(blob),URL.createObjectURL(pdf)];
   ready={text,pdf:new File([pdf],base+'.pdf',{type:'application/pdf'}),png:new File([blob],base+'.png',{type:'image/png'}),txt:new File([text],base+'.txt',{type:'text/plain'}),urls};
   panel.querySelector('[data-ready]').innerHTML='<a href="'+urls[1]+'" target="_blank" rel="noopener">Preview PDF</a><details><summary>Preview selected map</summary><img class="dm-preview" alt="Pickup area, equipment symbols and recorded plan door arrows" src="'+urls[0]+'"></details>';
   panel.querySelectorAll('[data-share],[data-mail],[data-save]').forEach(b=>b.disabled=false);status('Pickup pack ready. '+rows.reduce((n,r)=>n+r.items.reduce((k,i)=>k+i.n,0),0)+' selected items'+(rows.some(r=>r.hold.length)?' · outstanding holds are included.':'.'));
  }catch(err){if(serial===generation)status('Could not prepare the pack: '+String(err.message||err));}
  finally{running=false;if(panel)panel.querySelector('[data-prepare]').disabled=false;}
 }
 function attach(card,s){area=s;let b=card.querySelector('[data-demob1211]');if(!b){b=document.createElement('button');b.type='button';b.dataset.demob1211='';b.textContent='Demob';card.querySelector('.sp-btns').appendChild(b);}b.onclick=()=>open(s,b);}
 window.GC500Demob1211=Object.freeze({version:'v12.11',attach,reset:close,open:s=>open(s,null),get state(){return {open:!!panel&&!panel.hidden,ready:!!ready,running,refs:refs.length,generation};}});
 const b=document.createElement('button');b.type='button';b.className='chip';b.id='coatesfwf1211-native';b.textContent='Coates FWF';b.onclick=()=>{$('q').value='Coates FWF';search();};$('chips').before(b);
}
