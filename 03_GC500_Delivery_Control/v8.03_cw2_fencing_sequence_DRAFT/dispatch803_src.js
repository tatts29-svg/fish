/* Author: Andrew Fisher. Recorded checks and departures use the existing shared loads collection. */
const DISPATCH803_CHECKS = [
 {id:'cargo',label:'Cargo, quantities, DD and asset numbers checked against this truck'},
 {id:'pretransit',label:'Applicable pre-transit checklist completed for this load'},
 {id:'instructions',label:'Driver has the drop-off, way in and DD departure order'}
];
function sequence803Shared(collection,key){
 const id=docIdOf(key), local=(S[collection] || {})[key];
 let body=null; try{body=JSON.parse((SYNC.last[collection] || {})[id] || 'null');}catch(e){}
 const ack=body && (SYNC_COLLS[collection].kind==='value'?body.v:Object.fromEntries(Object.entries(body).filter(([k])=>k!=='_k')));
 const queued=Object.prototype.hasOwnProperty.call(SYNC.queue[collection] || {},id) || Object.prototype.hasOwnProperty.call(SYNC.inflight,collection+'/'+id);
 return {local,ack,pending:queued || (local!==undefined && JSON.stringify(local)!==JSON.stringify(ack))};
}
function sequence803Connected(){ const age=Date.now()-SYNC.at;return SYNC.on && SYNC.status==='live' && Number.isFinite(SYNC.at) && SYNC.at>0 && age>=0 && age<=15000 && SYNC.first.has('loads') && SYNC.first.has('answers') && !SYNC.unkept; }
function sequence803Stamp(r){return !!(r && typeof r.by==='string' && r.by.trim() && typeof r.at==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(r.at) && Number.isFinite(Date.parse(r.at)) && new Date(r.at).toISOString()===(r.at.length===20?r.at.slice(0,-1)+'.000Z':r.at));}
function dispatch803Checked(r){return !!(r && r.ok===true && sequence803Stamp(r));}
function dispatch803Context(){
 const key='dispatch803Context';if(RENDER_MEMO.has(key))return RENDER_MEMO.get(key);
 const loads=[],groups=new Map();programmeDays().forEach(d=>{const ls=(d.loads || []).filter(l=>l.booking801);if(!ls.length)return;loads.push(...ls);bookingGroups801(d).filter(g=>g.truck_id).forEach(g=>groups.set(loadId({date:d.iso,n:g.truck_id}),g));});
 const out={loads,groups};RENDER_MEMO.set(key,out);return out;
}
function dispatch803Load(id){ return dispatch803Context().loads.find(l=>loadId(l)===id) || null; }
function dispatch803Group(l){ return dispatch803Context().groups.get(loadId(l)); }
function dispatch803Signature(l){ const g=dispatch803Group(l),pair=loadOf(l);return JSON.stringify({date:l.date,truck:l.n,rank:l.departure_order,dd:l.dd,carrier:l.carrier,refs:l.refs,pairing:{keys:pair.keys,drop:pair.drop},cargo:g && g.rows.map(r=>({key:r.a.key,items:dpItems(r),numbers:dpNums(r.a),destination:navTargetFor(r.a),entry:entryOf(r.a.key)}))}); }
/* Immutable events: a delayed write cannot replace another operator's later check or departure. */
function sequence803EventId(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function sequence803EventShape(e){return !!(e && /^[a-f0-9]{32}$/.test(e.id) && typeof e.ok==='boolean' && sequence803Stamp(e) && Array.isArray(e.supersedes) && e.supersedes.length<=128 && new Set(e.supersedes).size===e.supersedes.length && e.supersedes.every(x=>/^[a-f0-9]{32}$/.test(x) && x!==e.id));}
function sequence803EventGraph(events){
 const map=new Map(),errors=[];events.forEach(e=>{if(!sequence803EventShape(e)||map.has(e.id))errors.push('Invalid or duplicated event.');else map.set(e.id,e);});
 const visiting=new Set(),visited=new Set();
 function visit(id){if(visiting.has(id)){errors.push('Circular event history.');return;}if(visited.has(id))return;const e=map.get(id);if(!e){errors.push('Event history is incomplete.');return;}visiting.add(id);e.supersedes.forEach(visit);visiting.delete(id);visited.add(id);}
 map.forEach((e,id)=>visit(id));const superseded=new Set(events.flatMap(e=>e && Array.isArray(e.supersedes)?e.supersedes:[])),heads=[...map.values()].filter(e=>!superseded.has(e.id));
 return {valid:!errors.length,errors,heads,confirmed:!errors.length && heads.length>0 && heads.every(e=>e.ok===true)};
}
function sequence803Keys(collection){
 const keys=new Set(Object.keys(S[collection] || {}));Object.values(SYNC.last[collection] || {}).forEach(text=>{try{const d=JSON.parse(text);if(d && typeof d._k==='string')keys.add(d._k);}catch(e){}});return [...keys];
}
function sequence803Append(collection,key,value){
 if(!mayWrite('the checklist record'))return false;const who=whoAmI();if(!who)return false;
 if(Object.prototype.hasOwnProperty.call(S[collection] || {},key) || sequence803Shared(collection,key).ack!=null){flash('This event already exists; nothing was replaced.');return false;}
 if(docIdOf(key).length>=180 || JSON.stringify(value).length>128000){flash('This record is too large to keep intact; nothing was recorded.');return false;}
 const stamp=collection+'/'+key,oldStamp=(S.stamps || {})[stamp],oldBy=(S.by || {})[stamp];let kept=false;
 if(collection==='answers')kept=setQAnswer(key,value)===true && S.answers[key]===value;
 else{S[collection]=S[collection] || {};S[collection][key]=value;stampIt(collection,key,who);kept=save()===true;}
 if(kept)return true;
 delete (S[collection] || {})[key];if(oldStamp===undefined)delete S.stamps[stamp];else S.stamps[stamp]=oldStamp;if(oldBy===undefined)delete S.by[stamp];else S.by[stamp]=oldBy;
 RENDER_MEMO.clear();flash('The check was not kept. Retry saving local changes when this device has space.');return false;
}
function sequence803RetrySave(){if(!mayWrite('retry saving local changes'))return false;const ok=save()===true;flash(ok?'Local changes kept; wait for the shared record before confirming checks.':'This device still cannot save. No confirmation was added.');return ok;}
function sequence803RetryHtml(){return SYNC.unkept?'<p class="notice warn">This device could not keep its changes. The failed check was restored to its previous state.</p><button class="btn" data-sequence803-retry>Retry saving local changes</button>':'';}
document.addEventListener('click',e=>{const b=e.target.closest && e.target.closest('[data-sequence803-retry]');if(b){e.preventDefault();sequence803RetrySave();}});
function dispatch803EventKey(id,kind,eventId){return 'dispatch803:'+id+':'+kind+':'+eventId;}
function dispatch803OwnEvent(key,body){
 const m=/^dispatch803:([^:]+):(cargo|pretransit|instructions|depart):([a-f0-9]{32})$/.exec(key),e=body && body.dispatch803Event;
 return !!(m && sequence803EventShape(e) && e.truck===m[1] && e.kind===m[2] && e.id===m[3] && typeof e.source==='string' && e.source.length>0 && (e.kind!=='depart' || e.ok===true) && Object.keys(body).every(k=>['dispatch803Event','by','at'].includes(k)));
}
function dispatch803Events(id){
 return sequence803Keys('loads').filter(k=>k.startsWith('dispatch803:'+id+':')).map(key=>{const shared=sequence803Shared('loads',key),body=shared.local || shared.ack;return {key,shared,body,event:body && body.dispatch803Event,valid:dispatch803OwnEvent(key,body),ack:dispatch803OwnEvent(key,shared.ack)?shared.ack.dispatch803Event:null};});
}
function dispatch803Evidence(l){
 const signature=dispatch803Signature(l),events=dispatch803Events(loadId(l)),pending=events.some(e=>e.shared.pending),invalid=events.some(e=>!e.valid),graphs={},checks={};
 [...DISPATCH803_CHECKS.map(c=>c.id),'depart'].forEach(kind=>{const values=events.filter(e=>e.ack && e.ack.source===signature && e.ack.kind===kind).map(e=>e.ack),g=sequence803EventGraph(values);graphs[kind]=g;
  if(kind!=='depart' && g.heads.length){const head=(g.heads.find(e=>!e.ok) || g.heads.slice().sort((a,b)=>b.at.localeCompare(a.at))[0]);checks[kind]={...head,ok:g.confirmed && !pending && !invalid};}
 });
 const currentDepartures=events.filter(e=>e.valid && e.event.kind==='depart' && e.event.source===signature).map(e=>e.event).sort((a,b)=>a.at.localeCompare(b.at));
 const earlierDepartures=events.filter(e=>e.valid && e.event.kind==='depart' && e.event.source!==signature).map(e=>e.event);
 return {signature,events,pending,invalid,graphs,checks,departure:currentDepartures[0] || null,earlierDepartures,departed:!pending && !invalid && graphs.depart.confirmed};
}
function dispatch803State(id){
 const l=dispatch803Load(id);if(!l)return {phase:'Hold',reasons:['This booking is no longer on the current day.'],load:null};
 const ev=dispatch803Evidence(l),g=dispatch803Group(l),reasons=[],legacy=((S.loads || {})[id] || sequence803Shared('loads',id).ack || {}).dispatch803 || null;
 if(!sequence803Connected())reasons.push('Wait for a current shared record: the connection must be live and checked within the last 15 seconds.');
 if(ev.pending)reasons.push('This load has checks waiting for the shared record.');
 if(ev.invalid || Object.values(ev.graphs).some(x=>!x.valid))reasons.push('The recorded event history is incomplete or invalid; review it before departure.');
 if(l.departure_order==null)reasons.push('DD departure order has not been supplied.');
 if(JSON.stringify(loadOf(l).keys.slice().sort())!==JSON.stringify(l.refs.slice().sort()))reasons.push('The recorded pairing differs from this DD booking; confirm the booking before departure.');
 DISPATCH803_CHECKS.filter(c=>!dispatch803Checked(ev.checks[c.id])).forEach(c=>reasons.push(c.label+'.'));
 if(legacy && legacy.departure)reasons.push('An earlier-format departure is retained below; ask the site lead to review it before another departure.');
 if(ev.earlierDepartures.length)reasons.push('A departure is recorded against an earlier booking or direction; review the changed booking.');
 const directions=g?g.rows.map(r=>({key:r.a.key,...dirs782(r.a)})):[];directions.filter(x=>!x.ok).forEach(x=>reasons.push(x.key+': '+x.missing.join('; ')+'.'));
 if(g)g.rows.forEach(r=>{const conflict=bookingConflict801(r.a,r.a._bookingSource801);if(conflict)reasons.push(conflict);});
 const waiting=dispatch803Context().loads.filter(x=>x.date===l.date && x.departure_order!=null && l.departure_order!=null && x.departure_order<l.departure_order).filter(x=>!dispatch803Evidence(x).departed);
 if(waiting.length)reasons.push('Earlier DD departures still need a shared departure record: '+waiting.map(x=>x.dd).join(', ')+'.');
 let phase=reasons.length?'Hold':'Ready';if(ev.departure)phase=ev.departed?'Departed':'Departure saving';else if(ev.earlierDepartures.length)phase='Departure recorded; booking changed';
 const history=ev.events.filter(x=>x.valid).map(x=>({...x.event,action:x.event.kind==='depart'?'depart':'check',field:x.event.kind,pending:x.shared.pending})).sort((a,b)=>a.at.localeCompare(b.at));
 return {phase,reasons,load:l,group:g,record:{history,departure:ev.departure},current:true,checks:ev.checks,directions,shared:{pending:ev.pending},signature:ev.signature,evidence:ev,legacy};
}
function dispatch803Record(id,action,field,value){
 if(!mayWrite('the departure check'))return false;
 if(action!=='check' && action!=='depart')return false;const kind=action==='depart'?'depart':field;if(kind!=='depart' && !DISPATCH803_CHECKS.some(c=>c.id===kind))return false;
 let state=dispatch803State(id);if(!state.load)return false;
 if(!sequence803Connected() || state.shared.pending){flash('Wait for the current shared record and finish saving before recording this check.');return false;}
 if(state.record.departure || state.evidence.earlierDepartures.length || (state.legacy && state.legacy.departure)){flash('A departure is already recorded; keep its history and ask the site lead to review any correction.');return false;}
 if(action==='depart' && state.phase!=='Ready'){flash('Hold this truck: '+state.reasons.join(' '));return false;}
 const who=whoAmI();if(!who)return false;state=dispatch803State(id);
 if(!sequence803Connected() || state.shared.pending || !state.evidence.graphs[kind].valid || state.evidence.invalid || (action==='depart' && state.phase!=='Ready')){flash('The shared record changed or its history is incomplete; review it before continuing.');return false;}
 const event={id:sequence803EventId(),truck:id,kind,source:state.signature,ok:action==='depart'?true:value===true,by:who,at:new Date().toISOString(),supersedes:state.evidence.graphs[kind].heads.map(e=>e.id)};
 const key=dispatch803EventKey(id,kind,event.id);if(!sequence803EventShape(event)){flash('Too many unresolved events; ask the site lead to review the history.');return false;}if(!sequence803Append('loads',key,{dispatch803Event:event,by:who,at:event.at}))return false;
 flash(action==='depart'?'Departure recorded on this device; waiting for the shared record.':'Check recorded; waiting for the shared record.');return true;
}

function dispatch803Reminders(g){
 const docs=dpDocById('pretransit'),link=docs?dpDocView(docs):null;
 const isAccommodation=dpAccom(g),isTank=g.rows.some(r=>/toilet|tank|ablution/i.test(dpItemsWords(r)));
 return (link && (isAccommodation || isTank)?'<p><a href="'+esc(link.url)+'" target="_blank" rel="noopener">Read the full pre-transit instruction — TRAN-WI-R1.2, 10 pages</a></p>':'')+
 '<p class="norate">Confirm the full checklist applicable to this equipment. These reminders do not replace it.</p>'+
 (isAccommodation?'<ul class="hublist compact"><li>Check chassis, skids, panels, roof, doors, windows and internal fittings; secure furniture and disconnect and secure services.</li><li>Fit transit bracing/sheeting and secure air conditioners where required. Check lifting and tie-down points and rated restraints.</li><li>Follow the roof-securing requirements, including the completed-service sticker check and additional roof restraints where required.</li></ul>':'')+
 (isTank?'<p class="norate">Toilets/tanks: liquids removed, filler/inspection/pump-out fittings capped and secure. Do not transport with stored liquid — pre-transit instruction, p. 8.</p>':'')+
 '<p class="norate">Before unloading: the driver completes the required JSEA. Take 5 before each new task or changed conditions. This departure check does not record unloading or installation as complete.</p>';
}
function dispatch803Dialog(id){
 const initial=dispatch803State(id);if(!initial.load)return;
 const d=document.createElement('div'),scrim=document.createElement('div');d.className='drawer on';d.style.zIndex=30;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Departure checks');scrim.className='scrim on';scrim.style.zIndex=29;
 const close=()=>{clearInterval(timer);d.remove();scrim.remove();bump();};
 const draw=()=>{
  const s=dispatch803State(id),l=s.load;if(!l){close();return;}
  d.innerHTML='<div class="dh"><div><h2>DD departure '+esc(bookingOrder801(l.departure_order))+'</h2><div class="sub">DD '+esc(l.dd)+' · '+esc(l.carrier)+' · '+esc(fmtDate(l.date))+'</div></div><button class="btn" data-dispatch803-close>Close</button></div><div class="db">'+
   '<p><b>'+esc(l.item)+'</b><br>'+esc(l.refs.join(' + '))+' · Booked loading time '+esc(l.time)+'</p><p class="norate">Leave Kingston in DD order. The loading time does not record departure or arrival.</p>'+
   '<div class="notice '+(s.phase==='Ready'?'info':'warn')+'"><b>'+esc(s.phase)+'</b>'+(s.record && s.record.departure?'<p>Departure recorded by '+esc(s.record.departure.by || 'operator missing')+' · '+esc(s.record.departure.at ? fmtStamp(s.record.departure.at) : 'time missing')+'</p>':'')+(s.reasons.length?'<ul>'+s.reasons.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'</div>'+
   sequence803RetryHtml()+'<div>'+DISPATCH803_CHECKS.map(c=>{const v=s.checks[c.id];return '<div><label class="mms757-tick"><input type="checkbox" data-dispatch803-check="'+c.id+'" '+(dispatch803Checked(v)?'checked ':'')+(!canEdit() || !sequence803Connected() || s.shared.pending || (s.record && s.record.departure)?'disabled ':'')+'><span>'+esc(c.label)+'</span></label>'+(v?'<div class="hint">'+(v.ok===true?'Confirmation':v.ok===false?'Revocation':'Unverified check')+' recorded by '+esc(v.by)+' · '+esc(fmtStamp(v.at))+(s.shared.pending?' · saving':'')+'</div>':'')+'</div>';}).join('')+'</div>'+
   '<p class="norate">Drop-off and way in: '+s.directions.map(x=>esc(x.key)+': '+(x.report?'report to '+esc(x.report)+'; site directs the drop-off':x.ok?'set':'missing')).join(' · ')+'. These checks are separate from the reference’s on-site and installation ticks.</p>'+dispatch803Reminders(s.group)+
   (s.record && s.record.history && s.record.history.length?'<details class="pdetail"><summary>Recorded checks</summary><ul class="hublist compact">'+s.record.history.map(x=>'<li>'+esc(x.action==='depart'?'Departure':(x.ok?'Confirmed: ':'Revoked: ')+(DISPATCH803_CHECKS.find(c=>c.id===x.field)||{label:x.field}).label)+' — '+esc(x.by)+' · '+esc(fmtStamp(x.at))+'</li>').join('')+'</ul></details>':'')+
   (s.legacy?'<details class="pdetail"><summary>Earlier-format record retained for review</summary><pre>'+esc(JSON.stringify(s.legacy,null,2))+'</pre></details>':'')+
   (s.evidence.events.some(x=>!x.valid)?'<details class="pdetail"><summary>Unverified event records</summary>'+s.evidence.events.filter(x=>!x.valid).map(x=>'<pre>'+esc(JSON.stringify(x.body,null,2))+'</pre>').join('')+'</details>':'')+
   '</div><div class="df"><button class="btn primary" data-dispatch803-depart '+(canEdit() && s.phase==='Ready'?'':'disabled')+'>Record departure now</button></div>';
  d.querySelector('[data-dispatch803-close]').onclick=close;
  d.querySelectorAll('[data-dispatch803-check]').forEach(i=>i.onchange=()=>{dispatch803Record(id,'check',i.dataset.dispatch803Check,i.checked);draw();});
  d.querySelector('[data-dispatch803-depart]').onclick=()=>{dispatch803Record(id,'depart');draw();};
 };
 document.body.append(scrim,d);scrim.onclick=close;let last=JSON.stringify(dispatch803State(id));const timer=setInterval(()=>{if(!d.isConnected){clearInterval(timer);return;}const signature=JSON.stringify(dispatch803State(id));if(signature!==last){last=signature;draw();}},1500);draw();
}
function pitBoard(l,i){
 const html=pitBoardBefore803(l,i);if(!l.booking801)return html;
 const s=dispatch803State(loadId(l));return html.replace('<div class="pbacts">','<div class="pbacts"><button type="button" class="btn ghost" data-dispatch803="'+esc(loadId(l))+'">Departure checks · '+esc(s.phase)+'</button>');
}
document.addEventListener('click',e=>{const b=e.target.closest && e.target.closest('[data-dispatch803]');if(!b)return;e.preventDefault();dispatch803Dialog(b.dataset.dispatch803);});
