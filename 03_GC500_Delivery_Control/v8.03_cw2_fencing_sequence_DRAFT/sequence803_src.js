/* Author: Andrew Fisher. Source-specific immutable events preserve concurrent confirmations and revocations. */
function sequence803Plan(){const w=((DATA.fencing || {}).week_sheets || []).find(w=>w.sheet==='CON WK2');return w && w.plan_update && w.plan_update.revision==='2026-10-02'?w.plan_update:null;}
function sequence803Requirement(rowId,requirementId){const plan=sequence803Plan(),row=plan && plan.rows_by_day.flatMap(d=>d.rows).find(r=>r.id===rowId),requirement=row && (row.requirements || []).find(x=>x.id===requirementId);return requirement?{plan,row,requirement}:null;}
function sequence803Key(x){return 'fencing803:'+x.plan.sha256.slice(0,16)+':'+x.row.id+':'+x.requirement.id;}
function sequence803Parse(value){try{const r=JSON.parse(value);return r && typeof r.confirmed==='boolean' && sequence803Stamp(r) && /^[a-f0-9]{64}$/.test(r.source) && typeof r.requirement==='string'?r:null;}catch(e){return null;}}
function sequence803AnswerParts(key,value){
 const m=/^fencing803:([a-f0-9]{16}):([a-z0-9_-]+):([a-z0-9_-]+)(?::([a-f0-9]{32}))?$/.exec(key),record=sequence803Parse(value);
 if(!m || !record || record.source.slice(0,16)!==m[1])return null;
 const x=sequence803Requirement(m[2],m[3]);if(!x)return null;
 if(m[4] && (!sequence803EventShape({...record,ok:record.confirmed}) || record.id!==m[4]))return null;
 return {x,record,event:!!m[4]};
}
function sequence803OwnAnswer(id,value){return !!sequence803AnswerParts(id,value===undefined?(S.answers || {})[id]:value);}
function sequence803RequirementState(x){
 const prefix='fencing803:',tail=':'+x.row.id+':'+x.requirement.id;
 const entries=sequence803Keys('answers').filter(k=>k.startsWith(prefix) && (k.endsWith(tail) || k.includes(tail+':'))).map(key=>{const shared=sequence803Shared('answers',key),raw=shared.local || shared.ack,parts=sequence803AnswerParts(key,raw),ack=sequence803AnswerParts(key,shared.ack);return {key,shared,raw,parts,ack};});
 const matches=r=>r && r.source===x.plan.sha256 && r.revision===x.plan.revision && r.requirement===x.requirement.text;
 const current=entries.filter(e=>e.parts && e.parts.event && matches(e.parts.record)),pending=entries.some(e=>e.shared.pending),invalid=entries.some(e=>!e.parts);
 const graph=sequence803EventGraph(current.filter(e=>e.ack && e.ack.event && matches(e.ack.record)).map(e=>({...e.ack.record,ok:e.ack.record.confirmed})));
 const all=current.map(e=>e.parts.record).sort((a,b)=>b.at.localeCompare(a.at)),heads=graph.heads;
 const record=heads.find(r=>!r.ok) || heads.slice().sort((a,b)=>b.at.localeCompare(a.at))[0] || all[0] || null;
 const fresh=sequence803Connected();
 return {key:sequence803Key(x),entries,graph,record,current:!!record,pending,shared:{pending},fresh,invalid,confirmed:!!(fresh && !pending && !invalid && graph.confirmed),lastConfirmed:!pending && !invalid && graph.confirmed};
}
function sequence803Record(rowId,requirementId,confirmed){
 if(!mayWrite('the fencing prerequisite confirmation'))return false;
 const x=sequence803Requirement(rowId,requirementId);if(!x)return false;
 let state=sequence803RequirementState(x);
 if(!sequence803Connected() || state.pending || state.invalid || !state.graph.valid){flash('Wait for a current, complete shared record before confirming this instruction.');return false;}
 const who=whoAmI();if(!who)return false;state=sequence803RequirementState(x);
 if(!sequence803Connected() || state.pending || state.invalid || !state.graph.valid){flash('The shared record changed; review it again before continuing.');return false;}
 const record={id:sequence803EventId(),confirmed:confirmed===true,by:who,at:new Date().toISOString(),source:x.plan.sha256,revision:x.plan.revision,requirement:x.requirement.text,supersedes:state.graph.heads.map(e=>e.id)};
 const text=JSON.stringify(record),key=sequence803Key(x)+':'+record.id;
 if(!sequence803EventShape({...record,ok:record.confirmed}) || text.length>600 || text.replace(/\s+/g,' ').trim()!==text){flash('This confirmation is too long to keep intact; nothing was changed.');return false;}
 if(!sequence803Append('answers',key,text))return false;
 flash('Confirmation recorded on this device; waiting for the shared record.');return true;
}
function sequence803HistoryHtml(s){
 if(!s.entries.length)return '';
 return '<details class="pdetail"><summary>Recorded confirmations and revocations</summary>'+s.entries.map(e=>{
  const p=e.parts,r=p && p.record;if(!r)return '<pre>'+esc(String(e.raw))+'</pre>';
  return '<p><b>'+(r.confirmed?'Confirmation':'Revocation')+'</b> recorded by '+esc(r.by)+' · '+esc(fmtStamp(r.at))+'<br>'+esc(r.requirement)+'<br>Source '+esc(r.revision)+' · '+esc(r.source.slice(0,16))+(e.shared.pending?' · saving':'')+(!p.event?' · earlier format; does not satisfy this instruction':'')+'</p>';
 }).join('')+'</details>';
}
function sequence803Label(kind){return kind==='condition'?'Condition reviewed with the crew':kind==='hold'?'Required confirmation received':'Check confirmed';}
function sequence803Status(s,kind){return s.pending?'Saving confirmation':s.invalid || !s.graph.valid?'Hold — review event history':!s.fresh && s.lastConfirmed?'Last known confirmation — reconnect to check':s.confirmed?'Confirmation recorded':s.graph.heads.some(e=>!e.ok)?'Confirmation withdrawn':kind==='hold'?'Hold — confirmation needed':'Not yet confirmed';}
function sequence803TaskChecks(row){
 return (row.requirements || []).map(req=>{
  const x=sequence803Requirement(row.id,req.id);if(!x)return '<li>'+esc(req.text)+'</li>';
  const s=sequence803RequirementState(x),r=s.record,title=req.kind==='hold'?'Before starting':req.kind==='condition'?'Condition':'Check';
  return '<li><b>'+title+': </b>'+esc(req.text)+' <span class="w">(p. '+esc(req.page)+')</span><br><span class="chip '+(s.confirmed?'act':'cand')+'">'+esc(sequence803Status(s,req.kind))+'</span>'+
   (r?'<div>'+(r.confirmed?'Confirmation':'Revocation')+' recorded by '+esc(r.by)+' · '+esc(fmtStamp(r.at))+'</div>':'')+
   '<button type="button" class="btn sm" data-sequence803-row="'+esc(row.id)+'" data-sequence803-req="'+esc(req.id)+'">Review check</button>'+sequence803HistoryHtml(s)+'</li>';
 }).join('');
}

function sequence803Dialog(rowId,requirementId){
 const x=sequence803Requirement(rowId,requirementId);if(!x)return;
 const d=document.createElement('div'),scrim=document.createElement('div');d.className='drawer on';d.style.zIndex=30;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Fencing prerequisite confirmation');scrim.className='scrim on';scrim.style.zIndex=29;
 const close=()=>{clearInterval(timer);d.remove();scrim.remove();bump();};
 const draw=()=>{const s=sequence803RequirementState(x),r=s.record;
  d.innerHTML='<div class="dh"><div><h2>'+esc(x.row.location)+'</h2><div class="sub">'+esc(x.row.description)+' · '+esc(fmtDate(x.row.date))+'</div></div><button class="btn" data-sequence803-close>Close</button></div><div class="db"><p><b>'+esc(x.requirement.text)+'</b></p><p class="norate">'+esc(x.plan.file)+' · revision '+esc(x.plan.revision)+' · p. '+esc(x.requirement.page)+'</p>'+
   (x.requirement.kind==='condition'?'<p class="notice info">Record that this condition has been reviewed with the crew. Follow the timing and alternatives stated above; this does not mean all conditional work has already happened.</p>':'<p class="notice info">Record this only after the stated confirmation or check has been obtained.</p>')+
   sequence803RetryHtml()+'<p><b>'+esc(sequence803Status(s,x.requirement.kind))+'</b></p><div><label class="mms757-tick"><input type="checkbox" data-sequence803-check '+(s.confirmed?'checked ':'')+(canEdit() && sequence803Connected() && !s.pending && !s.invalid && s.graph.valid?'':'disabled')+'><span>'+esc(sequence803Label(x.requirement.kind))+'</span></label></div>'+
   (r?'<p>'+(r.confirmed?'Confirmation':'Revocation')+' recorded by '+esc(r.by)+' · '+esc(fmtStamp(r.at))+(s.pending?' · saving to the shared record':s.confirmed?' · shared record confirmed':' · not confirmed')+'</p>':'')+
   sequence803HistoryHtml(s)+'<p class="norate">A checklist confirmation does not record work as installed, quantities as delivered, or a docket as complete.</p></div>';
  d.querySelector('[data-sequence803-close]').onclick=close;
  d.querySelector('[data-sequence803-check]').onchange=e=>{sequence803Record(rowId,requirementId,e.target.checked);draw();};
 };
 document.body.append(scrim,d);scrim.onclick=close;let last=JSON.stringify(sequence803RequirementState(x))+sequence803Connected();const timer=setInterval(()=>{if(!d.isConnected){clearInterval(timer);return;}const signature=JSON.stringify(sequence803RequirementState(x))+sequence803Connected();if(signature!==last){last=signature;draw();}},1500);draw();
}
document.addEventListener('click',e=>{const b=e.target.closest && e.target.closest('[data-sequence803-row]');if(!b)return;e.preventDefault();sequence803Dialog(b.dataset.sequence803Row,b.dataset.sequence803Req);});
