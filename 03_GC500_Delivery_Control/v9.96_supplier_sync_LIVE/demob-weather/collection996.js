/* Author: Andrew Fisher. Explicit collection quantities in the existing native delivery history. */
(function(root){'use strict';
const PARTIAL_ENABLED=false; // Enable only after every current-stock view shares typed subtraction.
const P=root.DemobProgress996,e=x=>esc(String(x??'')),normal=x=>String(x??'').trim().toLowerCase().replace(/\s+/g,' ');
function reference(key){return demob816().refs.find(r=>r.key===key)||null;}
function read(key,date=todayIso()){const r=reference(key);return r?P.evidence(r,P.record(key),date):null;}
function snapshot(key){
 const r=reference(key);if(!r)return null;const record=P.record(key),reading=P.evidence(r,record,todayIso());
 const physical=gcUnits925(r.a,{loading:false}).filter(u=>u.physical&&u.assetNo&&u.id),used=new Set(reading.events.flatMap(c=>c.items.flatMap(u=>u.unitIds||[])));
 const identities=Object.fromEntries(physical.map(u=>[u.id,{id:u.id,number:String(u.assetNo),owner:u.owner,item:u.item}]));
 const pools=Object.fromEntries(reading.required.map(u=>[normal(u.type),[...new Set(physical.filter(p=>normal(p.item)===normal(u.type)).map(p=>p.id))].filter(id=>!used.has(id))]));
 return {key,r,record,reading,pools,identities,token:JSON.stringify([r.units,record,pools,identities])};
}
function validate(key,request){
 const s=snapshot(key),bad=message=>({ok:false,message});if(!s||!request)return bad('This reference is no longer available.');
 if(request.token!==s.token)return bad('The quantities or record changed. Close and reopen collection.');
 if(s.reading.issues.length)return bad('Collection scope changed. Review the earlier recorded quantities before adding another collection.');
 if(!s.reading.arrival||s.record.state!=='on site'||!s.record.recorded)return bad('A dated on-site arrival is required before recording collection.');
 if(!P.validDate(request.date)||request.date>todayIso()||request.date<P.dayOf(s.reading.arrival.at))return bad('Use the actual collection date, between arrival and today.');
 if(!request.id||s.record.history.some(h=>h.collection996?.id===request.id))return bad('This collection is already recorded.');
 const items=Array.isArray(request.items)?request.items:[],seen=new Set(),selected=[];if(!items.length)return bad('Enter at least one collected quantity.');
 for(const item of items){const id=normal(item.type),remaining=s.reading.remaining.find(u=>normal(u.type)===id),n=Number(item.n),ids=[...new Set((item.unitIds||[]).map(String))];
  if(seen.has(id)||!remaining||!Number.isInteger(n)||n<=0||n>remaining.n)return bad('Collected quantities must be whole numbers within the remaining quantity.');
  seen.add(id);const pool=s.pools[id]||[];if(ids.length>n||ids.some(x=>!pool.includes(x))||n-ids.length>Math.max(0,remaining.n-pool.length))return bad('Select the asset numbers collected; unnumbered quantities are limited to the unidentified remainder.');
  selected.push({type:remaining.type,n,unitIds:ids,numbers:ids.map(id=>s.identities[id].number),physicalUnits:ids.map(id=>s.identities[id])});
 }
 let portion=null;if(request.portionId){portion=(s.r.portions||[]).find(p=>p.id===request.portionId);if(!portion)return bad('The selected truck portion changed. Reopen collection.');const allowed=new Set(s.r.units.filter(u=>u.evt).map(u=>normal(u.type)));if(selected.some(u=>!allowed.has(normal(u.type))))return bad('This truck portion is for portable toilet items only.');const prior=s.reading.events.filter(c=>c.portionId===portion.id).reduce((n,c)=>n+c.items.reduce((v,u)=>v+u.n,0),0);if(prior+selected.reduce((n,u)=>n+u.n,0)>portion.n)return bad('The selected quantity exceeds this truck portion.');}
 const complete=!s.reading.unknown&&s.reading.remaining.every(u=>(selected.find(x=>normal(x.type)===normal(u.type))?.n||0)===u.n);
 if(!PARTIAL_ENABLED&&!complete)return bad('Record the full remaining reference only. Partial collection is not enabled.');
 const c={version:1,kind:'collection',id:request.id,date:request.date,programmeDate:portion?.iso||s.r.iso||null,portionId:portion?.id||null,portionKey:portion?JSON.stringify([portion.id,portion.iso,portion.n,portion.s||'']):null,arrivalAt:s.reading.arrival.at,requiredKey:P.fingerprint(s.r.units),scope:'reference',items:selected,source:'collect816',complete};
 return {ok:true,value:c,complete,snapshot:s};
}
function partial(key,c,who){
 const current=deliveryOf(key),now=new Date().toISOString();S.delivery=S.delivery||{};const d=S.delivery[key]||(S.delivery[key]={});
 d.history=(d.history||[]).concat([{state:current.state,at:now,by:who,collection996:c}]).slice(-400);
 // The native on-site light, installation fields and pump-out evidence remain unchanged for a partial pickup.
 bump();buzz(30);return bump.kept!==false;
}
function open(key){
 if(!mayWrite('a pick-up')||!emptyGate816(key,'in transit',true))return false;
 const s=snapshot(key);if(!s?.reading.arrival||s.record.state!=='on site'){flash('Record a dated on-site arrival before collection.');return false;}
 const remaining=s.reading.remaining.filter(u=>u.n>0);if(!remaining.length){flash(s.reading.unknown?'Confirm the remaining item quantities before collection.':'All known quantities already have a collection record.');return false;}
 document.getElementById('collection996')?.remove();const prior=document.activeElement,box=document.createElement('section');box.id='collection996';box.className='mkpick collection996';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','collection996-title');
 const id=typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);let saving=false;
 box.innerHTML='<div class="mkpick-h"><b id="collection996-title">Collect '+e(key)+'</b><button type="button" class="close" aria-label="Close collection" data-collection996-close>×</button></div><form class="uform"><label>Actual collection date<input type="date" name="collection-date" required min="'+P.dayOf(s.reading.arrival.at)+'" max="'+todayIso()+'" value="'+todayIso()+'"></label><p class="w">Planned pick-up: '+e(s.r.iso?fmtDate(s.r.iso):'Undated')+'</p>'+(PARTIAL_ENABLED&&(s.r.portions||[]).length?'<label>Truck portion<select name="collection-portion"><option value="">Reference collection · portion not identified</option>'+s.r.portions.filter(p=>p.id&&!p.unplanned).map(p=>'<option value="'+e(p.id)+'">'+e(fmtDate(p.iso)+' · '+p.n+' units · '+(p.s==='sub'?'Sub-hired':'Coates'))+'</option>').join('')+'</select></label>':'')+remaining.map((u,i)=>'<fieldset data-collection996-type="'+e(u.type)+'"><legend>'+e(u.type)+'</legend><label>Collected · '+u.n+' remaining<input type="number" inputmode="numeric" min="0" max="'+u.n+'" step="1" value="'+(PARTIAL_ENABLED?0:u.n)+'"'+(PARTIAL_ENABLED?'':' readonly')+' name="quantity-'+i+'"></label>'+((s.pools[normal(u.type)]||[]).length?'<div class="collection996-numbers">'+s.pools[normal(u.type)].map(n=>'<label><input type="checkbox" value="'+e(n)+'"'+(PARTIAL_ENABLED?'':' checked disabled')+'> '+e(s.identities[n].number+' · '+Units925.company(s.identities[n].owner))+'</label>').join('')+'</div>':'<span class="w">Quantity only · no asset numbers recorded</span>')+'</fieldset>').join('')+(s.reading.unknown?'<p class="w">Other item quantities are unknown. This reference stays on site until its complete scope is recorded.</p>':'')+'<p role="status" data-collection996-result></p><div class="acts816"><button type="button" class="btn" data-collection996-close>Cancel</button><button type="submit" class="btn primary">Collect all remaining items</button></div></form>';
 const close=()=>{box.remove();if(prior?.isConnected)prior.focus({preventScroll:true});};box.querySelectorAll('[data-collection996-close]').forEach(b=>b.onclick=close);
 box.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}if(event.key==='Tab'){const all=[...box.querySelectorAll('button,input,select,textarea,a[href]')].filter(n=>!n.disabled),first=all[0],last=all.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 box.querySelector('form').onsubmit=event=>{event.preventDefault();if(saving)return;const items=[...box.querySelectorAll('fieldset')].map(f=>({type:f.dataset.collection996Type,n:Number(f.querySelector('input[type=number]').value),unitIds:[...f.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value)})).filter(u=>u.n>0),request={token:s.token,id,date:box.querySelector('[name=collection-date]').value,programmeDate:s.r.iso,portionId:box.querySelector('[name=collection-portion]')?.value||null,items};
 const check=validate(key,request);if(!check.ok){box.querySelector('[data-collection996-result]').textContent=check.message;return;}
 saving=true;const button=box.querySelector('button[type=submit]');button.disabled=true;
 const kept=setLight(key,'in transit',request);if(kept&&bump.kept!==false){close();flash('Collection recorded for '+key+'.');}else{box.querySelector('[data-collection996-result]').textContent='Collection was not saved. Check the shared record before retrying.';button.disabled=false;saving=false;}
 };
 document.body.appendChild(box);box.querySelector('[name=collection-date]').focus({preventScroll:true});return true;
}
root.DemobCollection996={partialEnabled:PARTIAL_ENABLED,read,snapshot,validate,partial,open};
})(window);
