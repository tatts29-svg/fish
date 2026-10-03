/* Author: Andrew Fisher. v8.21: a selected day's installer brief, sent only on an explicit button press. */
const DAILY821 = {days: new Map(), open: null, fonts: DAILY821_FONTS};
function daily821Plain(html) {
 const el=document.createElement('div');el.innerHTML=String(html||'');
 el.querySelectorAll('script,style').forEach(n=>n.remove());
 el.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
 el.querySelectorAll('span,div,p,li,b,strong').forEach(n=>n.append('\n'));
 return el.textContent.replace(/\n{3,}/g,'\n\n').trim();
}
function daily821Contacts(){
 const seen=new Set();return (TEAM.people||[]).filter(p=>p.group==='install').map(p=>({id:p.name,name:p.name,to:sms777Number(p.mobile||'')})).filter(p=>/^\+614\d{8}$/.test(p.to)&&!seen.has(p.to)&&seen.add(p.to));
}
function daily821Date(iso){return /^\d{4}-\d{2}-\d{2}$/.test(iso||'')&&Number.isFinite(Date.parse(iso+'T12:00:00Z'))&&new Date(iso+'T12:00:00Z').toISOString().slice(0,10)===iso;}
function daily821Model(iso){
 if(!daily821Date(iso))throw Error('Choose a valid delivery date.');
 const d=programmeDays().find(d=>d.iso===iso);
 const clean=d?Object.assign({},d,{deliveries:(d.deliveries||[]).filter(r=>r.a&&!r.a._cancelled&&!rowOff(r.a.key)).map(r=>Object.assign({},r,{events:(r.events||[]).filter(e=>e&&e.movement!=='remove')})).filter(r=>r.events.length),removals:[],loads:(d.loads||[]).filter(l=>!l.date||l.date===iso)}):{iso,deliveries:[],removals:[],loads:[]};
 const groups=dpLoads(clean).filter(g=>g.kind==='deliveries');
 return {iso,label:fmtDate(iso),loads:groups.map((g,i)=>({n:i+1,iso,time:g.time||'',carrier:g.carrier||'',basis:dpBasisShort(g),booking:!!g.booking801,timeLabel:g.booking801?'Load Kingston':'Planned load time',rows:g.rows.map(r=>{
  const a=Object.assign({},r.a,{events:r.events}),st=ldState(a),target=dest782(a),order=order782(assetOf(a.key)||a),entry=entry782(a);
  const booking=daily821Plain(bookingNotes801(Object.assign({},g,{rows:[r]}))).replace(new RegExp('^'+a.key+'\\s*'),'');
  const notes=[daily821Plain(dpDeliveryNotes798(Object.assign({},g,{rows:[r]}))),booking,(r.events||[]).map(e=>e.note||'').filter(Boolean).join('\n')].filter(Boolean);
  const meet=typeof meetPoint819==='function'?meetPoint819(a):null;
  const meetWords=meet&&meet.p?[meet.p.name,meet.p.way,typeof mpWhy819==='function'?mpWhy819(meet):''].filter(Boolean).join(' · '):'';
  const safety=typeof EP819!=='undefined'?(EP819.site_rules||[]).slice():[];
  if(meet&&meet.p&&typeof MP819!=='undefined'&&meet.p.id===MP819.park&&typeof EP819!=='undefined')safety.push(...(EP819.park&&EP819.park.rules||[]));
  notes.push(...safety);
  const supplierDates=typeof EP819!=='undefined'?[...new Set((EP819.loads||[]).filter(l=>(l.stops||[]).some(stop=>(stop.drops||[]).some(drop=>drop.ref===a.key||drop.task_ref===a.key||(!drop.ref&&String(drop.name||'').includes('('+a.key+')'))))).map(l=>l.date).filter(date=>date&&date!==iso))]:[];
  const dateWarning=supplierDates.length?'Date needs confirmation: scheduled '+fmtDate(iso)+'; Event Portables supplier plan '+supplierDates.map(fmtDate).join(' / ')+'. Confirm with the site team before dispatch.':'';
  return {iso,key:a.key,item:ldWhat(r),items:dpItems(r).map(x=>({item:x.item,qty:x.qty})),place:ldPlace(a),state:{label:st.word,tone:st.c},navUrl:meet&&meet.p&&typeof mpUrl819==='function'?mpUrl819(meet.p):target?navUrl(target.ll):'',navBasis:meet&&meet.p?'Meet point — '+meet.p.name:target?target.sms:'Location not confirmed',order:order&&order.sms||'',notes:[...new Set(notes)],quantityRecord:daily821Plain(sheet808What(r)),assets:dpNums(a).join(' · '),access:entry&&entry.words||text747WayIn(a),directions:dirs782(a),meetWords,meetName:meet&&meet.p?meet.p.name:'',dateWarning};
 })}))};
}
function daily821Session(iso){
 let s=DAILY821.days.get(iso);if(s)return s;
 s={iso,recipient:'',prepared:null,busy:false,locked:false,rows:[],message:'Choose an installer to text this day’s deliveries. Preview is available before sending.',url:null};
 try{const saved=JSON.parse(sessionStorage.getItem('gc500.daily821.'+iso)||'null');if(saved&&saved.locked){s.recipient=saved.recipient||'';s.locked=true;s.rows=Array.isArray(saved.rows)?saved.rows:[];s.message='A message was submitted in this browser. Check its delivery before preparing another.';}}catch(e){}
 DAILY821.days.set(iso,s);return s;
}
function daily821Save(s){try{const k='gc500.daily821.'+s.iso,v=JSON.stringify({recipient:s.recipient,locked:s.locked,rows:s.rows});sessionStorage.setItem(k,v);return sessionStorage.getItem(k)===v;}catch(e){return false;}}
function daily821Editable(){return capability()==='edit'&&!SYNC.readonly&&SYNC.status==='live'&&SYNC.backend&&typeof SYNC.backend.makeCard==='function'&&typeof SYNC.backend.readVersion821==='function'&&!syncWaiting()&&SYNC.first.size===Object.keys(SYNC_COLLS).length;}
function daily821ResultHtml(rows){const el=document.createElement('div');sms777Results(el,rows);return el.innerHTML;}
function daily821Panel(d){
 const s=daily821Session(d.iso),teams=daily821Contacts(),chosen=teams.find(t=>t.id===s.recipient),isOpen=DAILY821.open===d.iso;
 const disabled=s.busy?' disabled':'';
 return `<section class="daily821-panel" id="daily821-panel-${esc(d.iso)}" data-daily821-panel="${esc(d.iso)}" ${isOpen?'':'hidden'} aria-label="Message daily runs to install teams"><div class="daily821-head"><div><h4>Message daily runs to install teams</h4><p>One link. Only the deliveries for ${esc(fmtDate(d.iso))}.</p></div><button type="button" class="btn ghost" data-daily821-close="${esc(d.iso)}" aria-label="Close daily message panel">×</button></div><div class="daily821-controls"><div><label for="daily821-${esc(d.iso)}">Installer team contact</label><select id="daily821-${esc(d.iso)}" data-daily821-recipient="${esc(d.iso)}"${disabled||s.locked?' disabled':''}><option value="">Choose an installer…</option>${teams.map(p=>`<option value="${esc(p.id)}"${p.id===s.recipient?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div><button type="button" class="btn" data-daily821-preview="${esc(d.iso)}"${disabled||!chosen?' disabled':''}>Preview daily page</button><button type="button" class="btn primary" data-daily821-send="${esc(d.iso)}"${disabled||s.locked||!chosen||(s.prepared&&!s.prepared.configured)||!daily821Editable()?' disabled':''}>Text ${d.iso===todayIso()?"today’s":'this day’s'} deliveries</button></div>${s.blobUrl?`<a class="daily821-page-link" href="${esc(s.blobUrl)}" target="_blank" rel="noopener">Open the prepared daily page ↗</a>`:''}<p class="daily821-status" data-daily821-status role="status" aria-live="polite">${esc(s.message)}</p><div data-daily821-results aria-live="polite">${daily821ResultHtml(s.rows)}</div><div class="daily821-actions">${s.rows.some(r=>r.message_id)?`<button type="button" class="btn" data-daily821-status-refresh="${esc(d.iso)}"${disabled}>Check delivery</button>`:''}${s.locked?`<button type="button" class="btn ghost" data-daily821-again="${esc(d.iso)}"${disabled}>Prepare another message</button>`:''}</div></section>`;
}
function daily821Refresh(s){
 const panel=[...document.querySelectorAll('[data-daily821-panel]')].find(p=>p.dataset.daily821Panel===s.iso);if(!panel)return;
 const focus=document.activeElement,attr=focus&&[...focus.attributes].find(a=>a.name.startsWith('data-daily821-')),value=attr&&attr.value;
 const d=document.createElement('div');d.innerHTML=daily821Panel({iso:s.iso});const next=d.firstElementChild;panel.replaceWith(next);sms777Results(next.querySelector('[data-daily821-results]'),s.rows);
 if(attr){const el=[...next.querySelectorAll('['+attr.name+']')].find(n=>n.getAttribute(attr.name)===value);if(el&&!el.disabled)el.focus({preventScroll:true});}
}
async function daily821Get(url){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
 try{const r=await fetch(url,{headers:{'x-gc500-token':tokenOf()},cache:'no-store',signal:ctrl.signal});let j={};try{j=await r.json();}catch(e){}return {r,j};}finally{clearTimeout(timer);}
}
async function daily821Fresh(){
 if(!daily821Editable())throw Error('Use the edit link with an up-to-date shared record to send.');
 const {r,j}=await daily821Get('/api/version');
 if(!r.ok||j.level!=='edit')throw Error('This link cannot send. Nothing was submitted.');
 if(!Number.isFinite(j.version)||j.version!==SYNC.backend.readVersion821())throw Error('The shared record has changed. Let it finish syncing, then preview again.');
 if(!daily821Editable())throw Error('Wait for the shared record to finish syncing.');
 return j.version;
}
function daily821Stamp(){return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' AEST';}
function daily821Html(model,team,version){return GC500Daily.renderDay(Object.assign({},model,{issued:daily821Stamp(),revision:String(version),expires:addDays(model.iso,1)}),{name:team.name},{fontCss:DAILY821.fonts});}
function daily821LocalPreview(s,html,previewWindow){
 if(s.blobUrl)URL.revokeObjectURL(s.blobUrl);s.blobUrl=URL.createObjectURL(new Blob([html],{type:'text/html'}));
 if(previewWindow&&!previewWindow.closed){previewWindow.location.replace(s.blobUrl);}
}
async function daily821Prepare(s){
 if(s.busy)return;const team=daily821Contacts().find(p=>p.id===s.recipient);if(!team)return;
 const previewWindow=window.open('about:blank','_blank');if(previewWindow)previewWindow.opener=null;
 s.busy=true;s.prepared=null;s.message='Preparing this day’s page…';daily821Refresh(s);
 try{
  const model=daily821Model(s.iso);if(!model.loads.length)throw Error('No delivery loads are recorded for this day. There is nothing to send.');
  const version=SYNC.backend&&SYNC.backend.readVersion821?SYNC.backend.readVersion821():null;
  const html=daily821Html(model,team,version==null?'local':version);
  let configured=false,why='View only — preview available; sending requires the edit link.';
  if(daily821Editable()){await daily821Fresh();const {r,j}=await daily821Get('/api/sms');configured=r.ok&&!!j.configured&&(!j.today||Number(j.today.left)>0);why=configured?'Preview ready. Check the page, then press Text deliveries.':'Texting is unavailable or today’s allowance is used up.';}
  if(team.id!==s.recipient)throw Error('The recipient changed. Preview again.');
  s.prepared={fingerprint:JSON.stringify(model),model,html,version,to:team.to,name:team.name,recipient:team.id,at:Date.now(),configured};
  s.message=why;daily821LocalPreview(s,html,previewWindow);
 }catch(e){if(previewWindow&&!previewWindow.closed)previewWindow.close();s.message=e.message||'The preview could not be prepared.';}finally{s.busy=false;daily821Refresh(s);}
}
function daily821CardUrl(url){try{const u=new URL(url,location.origin);return u.origin===location.origin&&/^\/d\/[A-Za-z0-9_-]+$/.test(u.pathname)&&!u.search&&!u.hash?u.href:'';}catch(e){return '';}}
async function daily821Publish(payload){
 let timer;try{return await Promise.race([SYNC.backend.makeCard(payload),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('The daily page request timed out. No text was sent; a page may still have been created.')),30000);})]);}finally{clearTimeout(timer);}
}
async function daily821Send(s){
 if(s.busy||s.locked)return;
 let p=s.prepared;const team=daily821Contacts().find(x=>x.id===s.recipient);
 s.busy=true;s.message='Checking the current delivery page and texting service…';daily821Refresh(s);let submitting=false;
 try{
  if(!team)throw Error('Choose an installer first.');
  const initialVersion=await daily821Fresh();
  if(!p){const model=daily821Model(s.iso);if(!model.loads.length)throw Error('No delivery loads are recorded for this day. There is nothing to send.');p={fingerprint:JSON.stringify(model),model,html:daily821Html(model,team,initialVersion),version:initialVersion,to:team.to,name:team.name,recipient:team.id,at:Date.now()};}
  if(team.id!==p.recipient||team.to!==p.to)throw Error('The recipient changed. Preview again.');
  if(Date.now()-p.at>120000)throw Error('This preview is over two minutes old. Preview again before sending.');
  const version=await daily821Fresh();
  if(version!==p.version||JSON.stringify(daily821Model(s.iso))!==p.fingerprint)throw Error('The delivery information changed. Preview the current day again.');
  if(s.iso<todayIso())throw Error('This date has passed. Preview it for reference; choose a current or future date to send.');
  const operator=(S.operator||'').trim();if(!operator)throw Error('Enter your name in Recording as before sending.');
  const {r:cap,j:info}=await daily821Get('/api/sms');if(!cap.ok||!info.configured||(info.today&&Number(info.today.left)<1))throw Error('Texting is unavailable or today’s allowance is used up.');
  const keys=[...new Set(p.model.loads.flatMap(l=>l.rows.map(r=>r.key)))];if(keys.length>40)throw Error('This day has more than 40 references. Use the daily install sheets until a larger brief is supported.');
  const payload={load:'installer-day:'+s.iso,run_date:s.iso,expires:addDays(s.iso,1),title:'Daily deliveries · '+fmtDate(s.iso)+' · '+team.name,keys,html:p.html};
  if(new Blob([JSON.stringify(payload)]).size>1900000)throw Error('The daily page is too large to publish. Use the install sheets for this day.');
  const card=await daily821Publish(payload),url=daily821CardUrl(card.url);if(!url)throw Error('The service did not return a valid daily-page link. No text was submitted.');
  s.url=url;
  const latest=await daily821Fresh();if(latest!==p.version||JSON.stringify(daily821Model(s.iso))!==p.fingerprint)throw Error('The record changed while the page was being prepared. No text was submitted; preview again.');
  if(s.recipient!==p.recipient)throw Error('The recipient changed. No text was submitted.');
  const text='Coates GC500 — '+fmtDate(s.iso)+' deliveries for '+team.name+'. '+p.model.loads.length+' loads in order. Open your daily page: '+url+' — issued snapshot; contact the site team if plans change.';
  s.locked=true;s.rows=sms777Submission({},[team.to]);if(!daily821Save(s)){s.locked=false;s.rows=[];throw Error('This browser cannot keep the send receipt. Allow session storage before texting; no text was submitted.');}submitting=true;
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),25000);
  try{
   const r=await fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json','x-gc500-token':tokenOf(),'x-gc500-who':operator},body:JSON.stringify({to:[team.to],text,dry_run:false}),signal:ctrl.signal});
   let j={};try{j=await r.json();}catch(e){}
   s.rows=sms777Submission(j,[team.to]);if([400,401,403,413,429,501].includes(r.status)&&!Array.isArray(j.messages))s.rows.forEach(row=>{row.rejected=true;row.delivery_status='failed';row.submission_status='NOT_SUBMITTED';});
   s.locked=s.rows.some(row=>!row.rejected);
   s.message=s.rows.every(row=>row.accepted)?'Accepted by the messaging service. Delivery is not confirmed.':s.rows.every(row=>row.rejected)?'The text was not accepted. Check the result before trying again.':'The send result is unknown. It may already be accepted; check before sending again.';
  }finally{clearTimeout(timer);}
 }catch(e){s.message=submitting?'The connection ended before the result arrived. The text may have been accepted. Check delivery before sending again.':e.message||'The daily page could not be prepared.';if(!submitting)s.prepared=null;}
 finally{s.busy=false;daily821Save(s);daily821Refresh(s);}
}
async function daily821Status(s){
 if(s.busy)return;const ids=s.rows.filter(r=>r.message_id).map(r=>r.message_id);if(!ids.length)return;
 s.busy=true;s.message='Checking delivery…';daily821Refresh(s);
 try{const {r,j}=await daily821Get('/api/sms/status?ids='+encodeURIComponent(ids.join(',')));
  if(!r.ok)throw Error('Delivery could not be checked. No text was sent again.');
  s.rows=s.rows.map(row=>{const report=(Array.isArray(j.messages)?j.messages:[]).find(x=>x.message_id===row.message_id&&(!x.to||sms777Number(x.to)===row.to));if(!report||row.rejected)return row;const incoming=['delivered','pending','failed','unknown','unsupported'].includes(report.delivery_status)?report.delivery_status:'unknown';const retain=['delivered','failed'].includes(row.delivery_status)&&!['delivered','failed'].includes(incoming);return Object.assign({},row,{delivery_status:retain?row.delivery_status:incoming,provider_status:retain?row.provider_status:report.provider_status,note:retain?'The latest check was incomplete; the earlier confirmed result is retained.':report.note});});
  s.message=s.rows.every(r=>r.delivery_status==='delivered')?'Delivered — confirmed by the phone network.':'Delivery check complete. No text was sent again.';
 }catch(e){s.message=e.message||'Delivery could not be checked.';}finally{s.busy=false;daily821Save(s);daily821Refresh(s);}
}
function daily821Tile(d){return `<button type="button" class="dpt daily821-tile" data-daily821-toggle="${esc(d.iso)}" aria-expanded="${DAILY821.open===d.iso}" aria-controls="daily821-panel-${esc(d.iso)}"><span class="dpt-i">${MMS757_ICON}</span><span class="dpt-w">Message daily runs</span><span class="dpt-s">To install teams</span></button>`;}
function dpDayButtons(d){return dpDayButtonsBefore821(d)+`<button type="button" class="btn daily821-toggle" data-daily821-toggle="${esc(d.iso)}" aria-expanded="${DAILY821.open===d.iso}" aria-controls="daily821-panel-${esc(d.iso)}">Message daily runs<span>to install teams</span></button>`;}
document.addEventListener('change',e=>{const el=e.target.closest&&e.target.closest('[data-daily821-recipient]');if(!el)return;const s=daily821Session(el.dataset.daily821Recipient);if(s.busy||s.locked)return;s.recipient=el.value;s.prepared=null;s.message='Ready to text this installer. Preview the daily page if you want to check it first.';daily821Refresh(s);});
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-daily821-toggle],[data-daily821-close],[data-daily821-preview],[data-daily821-send],[data-daily821-status-refresh],[data-daily821-again]');if(!b)return;
 e.preventDefault();const a=[...b.attributes].find(a=>a.name.startsWith('data-daily821-')),s=daily821Session(a.value);
 if(a.name==='data-daily821-toggle'||a.name==='data-daily821-close'){DAILY821.open=a.name.endsWith('close')||DAILY821.open===s.iso?null:s.iso;daily821Refresh(s);document.querySelectorAll('[data-daily821-toggle]').forEach(el=>el.setAttribute('aria-expanded',String(DAILY821.open===el.dataset.daily821Toggle)));if(DAILY821.open){const p=document.querySelector('[data-daily821-panel="'+s.iso+'"]');p&&p.querySelector('select').focus();}else{const toggle=[...document.querySelectorAll('[data-daily821-toggle]')].find(el=>el.dataset.daily821Toggle===s.iso&&el.getClientRects().length);if(toggle)toggle.focus();}return;}
 if(a.name==='data-daily821-preview')daily821Prepare(s);
 else if(a.name==='data-daily821-send')daily821Send(s);
 else if(a.name==='data-daily821-status-refresh')daily821Status(s);
 else if(a.name==='data-daily821-again'&&!s.busy&&confirm('The earlier message may already have arrived or still arrive. Preparing another can send a duplicate. Continue?')){s.locked=false;s.rows=[];s.prepared=null;s.message='Preview the current day before sending another message.';daily821Save(s);daily821Refresh(s);}
});
