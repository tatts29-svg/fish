/* Author: Andrew Fisher. Five-stage Timeline display over the native delivery record.
   Planned pins, gate/meet points and rental dates never prove placement or installation.
   Native Complete remains the final checked work outcome used by Today and Equipment. */
function timeline841MergeProof(a,b){
 const valid=p=>p&&[0,3,4].includes(p.stage)&&typeof p.at==='string'&&Number.isFinite(Date.parse(p.at))&&typeof p.by==='string'&&p.by.trim();
 const normal=p=>valid(p)?Object.assign({},p,{at:new Date(p.at).toISOString()},p.recorded_at&&Number.isFinite(Date.parse(p.recorded_at))?{recorded_at:new Date(p.recorded_at).toISOString()}:{}):null;
 const A=normal(a),B=normal(b);if(!A&&!B)return null;
 const winner=!A?B:!B?A:A.at!==B.at?(A.at>B.at?A:B):A.stage!==B.stage?(A.stage<B.stage?A:B):(JSON.stringify(A)<JSON.stringify(B)?A:B);
 const events=new Map();[A,B].filter(Boolean).forEach(p=>(Array.isArray(p.history)?p.history:[]).concat([p]).forEach(raw=>{const h=normal(raw);if(h){const event={stage:h.stage,at:h.at,by:h.by};if(h.recorded_at)event.recorded_at=h.recorded_at;events.set(JSON.stringify(event),event);}}));
 return Object.assign({stage:winner.stage,at:winner.at,by:winner.by,history:[...events.values()].sort((x,y)=>x.at.localeCompare(y.at)||x.stage-y.stage||x.by.localeCompare(y.by)||String(x.recorded_at||'').localeCompare(String(y.recorded_at||''))).slice(-400)},winner.recorded_at?{recorded_at:winner.recorded_at}:{});
}
function timeline841Project(input){
 const a=input.asset||{},d=input.delivery||{},p=timeline841MergeProof(input.proof,null);
 let stage=0,label='No delivery record',tone='none',arrived=false,why='No delivery status has been recorded.';
 if(a._cancelled)return {stage,label:'Cancelled',tone:'cx',arrived:false,why:'Cancelled references do not advance.',blocked:true};
 if(d.moved)return {stage,label:'Moved record',tone:'none',arrived:false,why:'The record belongs to another reference.',blocked:true};
 if(d.done&&input.conflict&&input.conflict.length){const previous=timeline841Project({asset:a,delivery:Object.assign({},d,{done:false}),proof:p});return Object.assign(previous,{label:'Review required · Complete recorded',tone:'amber',why:'A Complete tick is recorded, but delivery quantities remain short: '+input.conflict.join(', ')+'. Resolve the short delivery before calling the whole reference finished.',conflict:true});}
 if(d.done){stage=5;label='Finished';tone='green';arrived=true;why='Recorded complete: in position, set up and checked.';}
 else if(d.recorded&&d.where==='rental'){label='On hire · delivery unconfirmed';why='Rental dates are not confirmation at the final location.';}
 else if(d.recorded&&d.state==='not on site'){stage=1;label='Off site';tone='red';why='Recorded not on site.';}
 else if(d.recorded&&d.state==='in transit'){stage=2;label='In transit';tone='amber';why='Recorded in transit.';}
 else if(d.recorded&&d.state==='on site'){
  stage=2;label='On site · placement unconfirmed';tone='green';arrived=true;why='On site is recorded; final placement is not yet confirmed.';
  if(p&&p.stage>=3&&(!d.set_at||Date.parse(p.at)>=Date.parse(d.set_at))){stage=p.stage;label=stage===4?'Installed':'At location';why=(stage===4?'Installed, awaiting the final Complete check.':'Confirmed at the final work location.')+' '+p.by+' · '+(p.recorded_at||p.at);}
 }
 return {stage,label,tone,arrived,why,blocked:false};
}
function timeline841Proof(key){return timeline841MergeProof(((S.delivery||{})[key]||{}).timeline841,((CROW.get(key)||{}).delivery||{}).timeline841);}
function timeline841CompletionConflict(a){
 const asset=assetOf(a.key)||a,groups={Access:'Forklifts & access',VMS:'VMS boards',Trakmat:'Track mat',WFB:'Water-filled barriers',Toilet:'Toilets & amenities','Portable Building':'Portable buildings',Generator:'Generators','Light Tower':'Lighting towers'};
 const group=groups[asset.product]||asset.product||(asset.discipline==='Access & plant'?'Forklifts & access':asset.discipline),types={'Portable buildings':/building|ticket\s*box|\bcont(?:ainer)?\b/i,'Toilets & amenities':/toilet|\bfwf\b|pan\s*block|pee\s*panel/i,Generators:/generator|\d\s*kva\b|\bkva\b/i,'Lighting towers':/light(?:ing)?\s*tower/i,'Forklifts & access':/forklift|telehandler|scissor|boom\s*lift|cherry\s*picker|\bewp\b|access\s*platform/i};
 const accepts=types[group];if(!accepts)return [];
 const part=/\b(?:tynes?|tines?|attachments?|forks)\b|^(?:stairs?|steps?|fridge|chairs?|tables?|desks?|cables?)\b/i;
 const names=new Set(chargeLines(asset).map(l=>String(l.item||'')).filter(item=>item.trim()&&!part.test(item)&&accepts.test(item)&&!(group==='Toilets & amenities'&&/tank/i.test(item))));
 return (shortOf(asset)||[]).filter(s=>names.has(s.item)).map(s=>s.item);
}
function timeline841State(a){const d=deliveryOf(a.key),p=timeline841Proof(a.key),v=timeline841Project({asset:a,delivery:d,proof:p,conflict:d.done?timeline841CompletionConflict(a):[]});if(p&&typeof fmtStamp==='function')v.why=v.why.replace(p.recorded_at||p.at,fmtStamp(p.recorded_at||p.at));return Object.assign(v,{c:v.tone,word:v.label,said:v.why,hire:false});}
function timeline841WriteProof(key,stage,by){
 const d=S.delivery[key]||(S.delivery[key]={}),old=timeline841Proof(key),native=deliveryOf(key),at=new Date(Math.max(Date.now(),old?Date.parse(old.at)+1:0,Number.isFinite(Date.parse(native.set_at))?Date.parse(native.set_at):0)).toISOString();
 d.timeline841=timeline841MergeProof({stage,at,by,recorded_at:new Date().toISOString(),history:(old&&old.history)||[]},old);return d.timeline841;
}
/* Called from the native setter before its existing bump/save, so the reset and light are one record. */
function timeline841Invalidate(key,state,by){if(state!=='on site'&&timeline841Proof(key))timeline841WriteProof(key,0,by);}
function timeline841Set(key,stage){
 const a=assetOf(key);if(!a||a._cancelled||movedAway(key)||![0,1,2,3,4,5].includes(stage))return false;
 if(!mayWrite('the delivery progress'))return false;const who=whoAmI();if(!who)return false;
 if(stage===0){timeline841WriteProof(key,0,who);bump();flash(key+' placement and installation confirmation cleared; the native light and Complete check are unchanged.');return true;}
 if(stage===1||stage===2)return setLight(key,stage===1?'not on site':'in transit');
 if(stage===5){if(timeline841CompletionConflict(a).length){flash('Resolve the short delivery before calling the whole reference finished. The native Complete tick is unchanged.');return false;}return setDone(key,true);}
 if(deliveryOf(key).done){flash('This reference is already finished. Use its native Complete control to correct the record first.');return false;}
 const current=deliveryOf(key);if(!(current.recorded&&current.state==='on site'&&current.where!=='rental')&&!setLight(key,'on site'))return false;
 timeline841WriteProof(key,stage,who);bump();flash(key+(stage===4?' installed; final Complete check still open.':' confirmed at its final location.'));return true;
}
let TIMELINE841_UID=0;
function timeline841Lamp(on,index,finished){
 const id='tl841-'+(++TIMELINE841_UID);let dots='';for(let y=14;y<=42;y+=7)for(let x=14;x<=42;x+=7)if((x-28)**2+(y-28)**2<=18**2)dots+='<circle cx="'+x+'" cy="'+y+'" r="2.05"/>';
 return '<span class="tl841-lamp'+(on?' is-on':'')+(finished?' is-finished':'')+'" style="--tl841-delay:'+index*.16+'s"><i class="tl841-halo" aria-hidden="true"></i><svg viewBox="0 0 56 56" aria-hidden="true" focusable="false"><defs><linearGradient id="'+id+'"><stop stop-color="#68747b"/><stop offset=".48" stop-color="#202b31"/><stop offset="1" stop-color="#060c10"/></linearGradient></defs><circle cx="28" cy="28" r="27" fill="url(#'+id+')"/><circle cx="28" cy="28" r="23" fill="#050b0d" stroke="#869397" stroke-opacity=".35"/><circle cx="28" cy="28" r="20" class="tl841-tint"/><g class="tl841-dots">'+dots+'</g><path d="M12 19a19 19 0 0 1 31-3" fill="none" stroke="#d4e1e4" stroke-opacity=".22" stroke-width="1.5"/></svg></span>';
}
function timeline841Lights(v){const labels=[v.arrived?'On Site':'Off Site','Transit','Location','Installed','Finished'];return '<span class="tl841-gantry" data-tl841-stage="'+v.stage+'" role="img" aria-label="'+esc(v.label+'. '+v.why)+'">'+labels.map((label,i)=>'<span class="tl841-unit'+(i<v.stage?' reached':'')+'">'+timeline841Lamp(i<v.stage,i,v.stage===5)+'<small>'+label+'</small></span>').join('')+'</span>';}
function timeline841Ref(r){const v=timeline841State(r.a);return '<span class="ld-ref tl841-ref" data-tl841-ref="'+esc(r.a.key)+'" title="'+esc(v.why)+'"><span class="ld-c"><b>'+esc(r.a.key)+'</b><span class="tl841-status '+v.tone+(v.stage===5?' finished':'')+'">'+esc(v.label)+'</span>'+ldTicks(r.a)+'</span><span class="ld-w">'+esc(ldWhat(r))+'</span>'+timeline841Lights(v)+'</span>';}
function timeline841Actions(d,g,n){if(g.kind!=='deliveries')return '';return '<div class="tl841-actions" role="group" aria-label="Load '+n+' progress and run sheet">'+g.rows.map(r=>'<button type="button" class="btn" data-tl841-open="'+esc(r.a.key)+'">'+esc(r.a.key)+' · Progress</button>').join('')+'<button type="button" class="btn" data-tl841-print="'+esc(d.iso)+'" data-tl841-only="'+(n-1)+'">Print Run Sheet · Load '+n+'</button></div>';}
function timeline841DayButton(d){return (d.deliveries||[]).length?'<button type="button" class="btn" data-tl841-print="'+esc(d.iso)+'">Print day’s run sheets<span>'+(capability()==='edit'&&!SYNC.readonly?'Printed inbound loads move to Transit':'View only · records unchanged')+'</span></button>':'';}
function timeline841Pick(loads,o){
 if(o&&o.only!=null){const i=typeof o.only==='string'&&/^\d+$/.test(o.only)?+o.only:o.only;return Number.isInteger(i)&&loads[i]&&(!o.timeline841||loads[i].kind==='deliveries')?[i]:[];}
 if(!o||!o.timeline841)return null;
 return loads.map((g,i)=>g.kind==='deliveries'?i:-1).filter(i=>i>=0);
}
function timeline841PrintRefs(loads,pick){
 if(!Array.isArray(pick)||pick.some(i=>!Number.isInteger(i)||!loads[i]))return [];
 return [...new Set(pick.filter(i=>loads[i].kind==='deliveries').flatMap(i=>(loads[i].rows||[]).filter(r=>r.a&&!r.a._cancelled).map(r=>r.a.key)).filter(Boolean))];
}
function timeline841Printed(iso,doc,loads,pick,o,print,valid){
 const refs=doc==='drv'&&!(o&&o.pdf)?timeline841PrintRefs(loads,pick):[];
 if(valid&&!valid())return [];
 print(); // A thrown/cancelled preparation is not a print request. Browser cancellation after this cannot be observed.
 if(valid&&!valid())return [];
 if(!refs.length)return [];
 if(capability()!=='edit'||SYNC.readonly){flash('Run sheet print requested. View only — delivery records are unchanged.');return [];}
 const changed=[];
 refs.forEach(key=>{const a=assetOf(key);if(!a)return;const d=deliveryOf(key),v=timeline841State(a);if(v.blocked||d.done||(d.recorded&&d.state==='on site'&&d.where!=='rental')||v.stage>=2)return;
  if(setLight(key,'in transit')){const rec=S.delivery[key],last=rec.history&&rec.history[rec.history.length-1];if(last){last.because='Run sheet print requested';last.print_day=iso;}changed.push(key);}
 });
 if(changed.length){bump();flash('Print requested · '+changed.join(', ')+' set in transit.');}return changed;
}
let TIMELINE841_PRINT=0;
function timeline841PrintStart(){TIMELINE841_PRINT++;const w=document.getElementById('dayprint');if(w){w.__timeline841print=null;delete w.dataset.timeline841Print;}return TIMELINE841_PRINT;}
function timeline841PrintCurrent(token,wrap){return token===TIMELINE841_PRINT&&(!wrap||(document.getElementById('dayprint')===wrap&&wrap.dataset.timeline841Print===String(token)));}
function timeline841Print(iso,only){
 const d=programmeDays().find(x=>x.iso===iso);if(!d)return;
 const loads=dpLoads(d),o={timeline841:true};if(only!=null)o.only=only;
 const pick=timeline841Pick(loads,o);if(!pick.length){flash('No inbound loads selected.');return;}
 drvCheck782(iso,only==null?null:only,()=>dpPrint(iso,'drv',o));
}
let TIMELINE841_DIALOG=null,TIMELINE841_RETURN=null,TIMELINE841_SCROLL=0;
function timeline841Dialog(key){
 const a=assetOf(key);if(!a)return;timeline841Close(false);
 TIMELINE841_RETURN=key;const main=document.querySelector('main');TIMELINE841_SCROLL=main?main.scrollTop:0;
 const v=timeline841State(a),proof=timeline841Proof(key),edit=capability()==='edit'&&!SYNC.readonly;
 const dlg=document.createElement('dialog');dlg.id='timeline841-dialog';dlg.setAttribute('aria-labelledby','timeline841-heading');
 dlg.innerHTML='<div class="tl841-dialog-head"><div><p>Delivery progress</p><h2 id="timeline841-heading">'+esc(key)+'</h2></div><button class="btn" data-tl841-close aria-label="Close delivery progress">Close</button></div><p class="tl841-dialog-status">'+esc(v.label)+'</p>'+timeline841Lights(v)+'<p>'+esc(v.why)+'</p><p class="tl841-explain">Location confirms the final work position. Installed confirms the set-up. Finished uses the shared Complete check.</p>'+(edit&&!v.blocked?'<div class="tl841-stage-buttons">'+[[1,'Off site'],[2,'Transit'],[3,'Confirm location'],[4,'Confirm installed'],[5,'Finish · set up and checked']].map(([stage,label])=>'<button type="button" class="btn" data-tl841-set="'+stage+'" data-tl841-key="'+esc(key)+'"'+(v.stage===5&&stage>=3?' disabled':'')+'>'+label+'</button>').join('')+'</div>':'<p>View only · use the edit link to record progress.</p>')+'<p class="tl841-paused">Decorative motion pauses while these details are open.</p>';
 if(edit&&!v.blocked&&proof&&proof.stage>0)dlg.insertAdjacentHTML('beforeend','<button type="button" class="btn" data-tl841-set="0" data-tl841-key="'+esc(key)+'">Clear placement / installation confirmation</button>');
 if(proof)dlg.insertAdjacentHTML('beforeend','<details class="tl841-history"><summary>Placement and installation history</summary><ol>'+proof.history.slice().reverse().map(h=>'<li>'+esc(h.stage===4?'Installed':h.stage===3?'At location':'Confirmation cleared')+' · '+esc(h.by)+' · '+esc(typeof fmtStamp==='function'?fmtStamp(h.recorded_at||h.at):(h.recorded_at||h.at))+'</li>').join('')+'</ol></details>');
 document.body.appendChild(dlg);TIMELINE841_DIALOG=dlg;dlg.addEventListener('cancel',e=>{e.preventDefault();timeline841Close();});dlg.showModal();dlg.querySelector('[data-tl841-close]').focus();timeline841Motion();
}
function timeline841Close(restore=true){const dlg=TIMELINE841_DIALOG;if(!dlg)return;TIMELINE841_DIALOG=null;dlg.close();dlg.remove();if(restore){const b=[...document.querySelectorAll('[data-tl841-open]')].find(n=>n.dataset.tl841Open===TIMELINE841_RETURN);if(b)b.focus({preventScroll:true});const main=document.querySelector('main');if(main)main.scrollTop=TIMELINE841_SCROLL;}timeline841Motion();}
let TIMELINE841_FRAME=0,TIMELINE841_OBSERVER=null;
function timeline841ModalOpen(){return [...document.querySelectorAll('dialog[open],[aria-modal="true"]')].some(e=>{if(e.hidden||e.closest('[hidden],[aria-hidden="true"]'))return false;const style=getComputedStyle(e);if(style.display==='none'||style.visibility==='hidden')return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(e.getAttribute('aria-hidden')==='false'||r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight);});}
function timeline841Motion(){
 TIMELINE841_FRAME=0;const pane=document.querySelector('#pane-timeline'),main=document.querySelector('main'),mr=main&&main.getBoundingClientRect();
 const modal=timeline841ModalOpen();
 const allow=!!pane&&pane.classList.contains('on')&&!document.hidden&&!motionOff()&&!modal;
 document.querySelectorAll('.tl841-gantry').forEach(e=>{const r=e.getBoundingClientRect();e.classList.toggle('tl841-live',allow&&!!e.closest('#pane-timeline')&&r.width>0&&r.bottom>(mr?mr.top:0)&&r.top<Math.min(innerHeight,mr?mr.bottom:innerHeight));});
}
function timeline841Schedule(){if(!TIMELINE841_FRAME)TIMELINE841_FRAME=requestAnimationFrame(timeline841Motion);}
function timeline841Mount(){
 if(!TIMELINE841_OBSERVER){TIMELINE841_OBSERVER=new IntersectionObserver(timeline841Schedule);document.addEventListener('scroll',timeline841Schedule,true);window.addEventListener('resize',timeline841Schedule);document.addEventListener('visibilitychange',timeline841Schedule);new MutationObserver(timeline841Schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});if(window.matchMedia)matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',timeline841Schedule);
  const modalNode=n=>n.nodeType===1&&(n.matches('dialog,[aria-modal="true"]')||n.querySelector('dialog,[aria-modal="true"]'));
  new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'?(r.target.matches('dialog,[aria-modal="true"],#pane-timeline')):[...r.addedNodes,...r.removedNodes].some(modalNode)))timeline841Schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-hidden','open','class']});
 }
 TIMELINE841_OBSERVER.disconnect();document.querySelectorAll('#pane-timeline .tl841-gantry').forEach(e=>TIMELINE841_OBSERVER.observe(e));timeline841Schedule();
}
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-tl841-open],[data-tl841-close],[data-tl841-set],[data-tl841-print]');if(!b)return;e.preventDefault();e.stopPropagation();
 if(b.hasAttribute('data-tl841-open'))timeline841Dialog(b.dataset.tl841Open);
 else if(b.hasAttribute('data-tl841-close'))timeline841Close();
 else if(b.hasAttribute('data-tl841-set')){const key=b.dataset.tl841Key,scroll=TIMELINE841_SCROLL;if(timeline841Set(key,+b.dataset.tl841Set)){timeline841Close(false);render();const main=document.querySelector('main');if(main)main.scrollTop=scroll;timeline841Dialog(key);TIMELINE841_SCROLL=scroll;}}
 else timeline841Print(b.dataset.tl841Print,b.hasAttribute('data-tl841-only')?+b.dataset.tl841Only:null);
});
window.Timeline841={project:timeline841Project,mergeProof:timeline841MergeProof,printRefs:timeline841PrintRefs,pick:timeline841Pick,report:()=>({version:'8.41',dialog:!!TIMELINE841_DIALOG,rows:[...document.querySelectorAll('#pane-timeline .tl841-ref')].map(e=>({key:e.dataset.tl841Ref,stage:+e.querySelector('.tl841-gantry').dataset.tl841Stage,running:e.querySelector('.tl841-gantry').classList.contains('tl841-live')}))})};
