/* Author: Andrew Fisher. Traffic control is a V8s service, not a crew count or charge. */
const TRAFFIC903_STATUS = Object.freeze({unknown:'To confirm',not_required:'Not required',required:'Required',arranged:'Arranged'});
function traffic903Id(day,load){return typeof load==='string'?load:load&&typeof load==='object'?ldId({iso:day},load):'';}
function traffic903Key(day,load){return 'traffic903/'+day+'/'+encodeURIComponent(traffic903Id(day,load));}
function traffic903Valid(day,id,status){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day||typeof id!=='string'||!id.startsWith(day+'|')||!/^\d{4}-\d{2}-\d{2}\|(deliveries|removals)\|.+$/.test(id)||/[\u0000-\u001f\u007f]/.test(id)||!Object.prototype.hasOwnProperty.call(TRAFFIC903_STATUS,status))return false;
 try {return docIdOf(traffic903Key(day,id)).length<180;} catch(e){return false;}
}
function traffic903Plan(day,load){
 const id=traffic903Id(day,load);let key='';try{key=traffic903Key(day,id);}catch(e){}const saved=key&&(S.loads||{})[key];
 const valid=saved&&saved.kind==='traffic903'&&saved.day===day&&saved.loadId===id&&traffic903Valid(day,id,saved.status);
 return {kind:'traffic903',day,loadId:id,status:valid?saved.status:'unknown',by:valid?saved.by||'':'',at:valid?saved.at||'':'',recorded:!!valid,review:!!saved&&!valid};
}
function traffic903Summary(day,load){return 'Traffic control · '+TRAFFIC903_STATUS[traffic903Plan(day,load).status];}
function traffic903Day(day){
 const d=programmeDays().find(x=>x.iso===day),seen=new Set(),loads=[];
 if(d)dpLoads(d).forEach((g,i)=>{const id=ldId(d,g);if(seen.has(id))return;seen.add(id);loads.push(Object.assign({number:i+1,refs:(g.rows||[]).map(r=>r.a.key)},traffic903Plan(day,id)));});
 return {day,loads,total:loads.length,required:loads.filter(x=>x.status==='required').length,arranged:loads.filter(x=>x.status==='arranged').length,unknown:loads.filter(x=>x.status==='unknown').length,notRequired:loads.filter(x=>x.status==='not_required').length};
}
function traffic903Save(day,load,status){
 const id=traffic903Id(day,load);if(!traffic903Valid(day,id,status))return false;
 const d=programmeDays().find(x=>x.iso===day);if(!d||dpLoads(d).filter(g=>ldId(d,g)===id).length!==1)return false;
 const key=traffic903Key(day,id),old=(S.loads||{})[key];
 if(Object.keys(S.loads||{}).some(k=>k!==key&&docIdOf(k)===docIdOf(key))||old&&(old.kind!=='traffic903'||old.day!==day||old.loadId!==id))return false;
 if(!mayWrite('traffic control planning'))return false;const by=whoAmI();if(!by)return false;
 const prior=old&&Date.parse(old.at);S.loads=S.loads||{};
 S.loads[key]={kind:'traffic903',day,loadId:id,status,by,at:new Date(Math.max(Date.now(),Number.isFinite(prior)?prior+1:0)).toISOString()};
 bump();if(bump.kept===false){if(old===undefined)delete S.loads[key];else S.loads[key]=old;render();return false;}flash('Traffic control saved.');return true;
}
function traffic903Editor(day,load){
 const id=traffic903Id(day,load),p=traffic903Plan(day,id),can=capability()==='edit'&&!SYNC.readonly;
 return '<details class="loading872 traffic903" data-traffic903-day="'+esc(day)+'" data-traffic903-load="'+esc(id)+'"><summary>'+esc(traffic903Summary(day,id))+'</summary><div class="traffic903-body"><label>Status <select data-traffic903-status'+(can?'':' disabled')+'>'+Object.entries(TRAFFIC903_STATUS).map(([k,w])=>'<option value="'+k+'"'+(p.status===k?' selected':'')+'>'+esc(w)+'</option>').join('')+'</select></label>'+(can?'<button type="button" class="btn" data-traffic903-save>Save traffic control</button>':'')+(p.review?'<p>Saved service record needs review.</p>':'')+'</div></details>';
}
function traffic903Sheet(day,load){return '<div class="loading872-sheet traffic903-sheet"><b>'+esc(traffic903Summary(day,load))+'</b></div>';}
const timeline841ActionsBefore903=timeline841Actions;
timeline841Actions=function(d,g,n){const h=timeline841ActionsBefore903(d,g,n),extra=traffic903Editor(d.iso,g);return h?h.replace('<button type="button" class="btn" data-tl841-print=',extra+'<button type="button" class="btn" data-tl841-print='):extra;};
const dpPageBefore903=dpPage;
dpPage=function(d,g,doc,i,n){const h=dpPageBefore903(d,g,doc,i,n);return h.replace('<h2>Safety</h2>','<h2>Safety</h2>'+traffic903Sheet(d.iso,g));};
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-traffic903-save]');if(!b)return;e.preventDefault();
 const box=b.closest('[data-traffic903-day]'),day=box.dataset.traffic903Day,id=box.dataset.traffic903Load,status=box.querySelector('[data-traffic903-status]').value;
 if(!traffic903Save(day,id,status)){flash('Traffic control was not saved. Check the selected load and edit access.');return;}
 const next=document.querySelector('[data-traffic903-day="'+CSS.escape(day)+'"][data-traffic903-load="'+CSS.escape(id)+'"]');
 if(next){next.open=true;const focus=next.querySelector('[data-traffic903-status]');if(focus)focus.focus({preventScroll:true});}
});
