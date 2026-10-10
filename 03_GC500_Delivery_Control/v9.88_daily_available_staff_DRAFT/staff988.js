/* Author: Andrew Fisher. One shared availability record for each day. */
(function(root){'use strict';
const api=root.DailyStaff988;
const native=api.create({
 get:day=>(S.loads||{})[api.key(day)],legacy:day=>(S.loads||{})[crew883Key(day)],
 roster:day=>StaffNames910.roster(day),ready:()=>todayWorkHealth840().ready,
 write(day,value){
  if(!mayWrite('daily staff availability'))return false;
  const by=whoAmI();if(!by)return false;
  const key=api.key(day),old=(S.loads||{})[key],previous=Date.parse(old?.at);
  S.loads=S.loads||{};S.loads[key]={...value,kind:'staff988',day,ref:'',by,at:new Date(Math.max(Date.now(),Number.isFinite(previous)?previous+1:0)).toISOString()};
  bump();if(bump.kept===false)return false;flash('Day availability saved.');return true;
 }
});
Object.assign(api,native);
const e=x=>esc(String(x??'')),unique=names=>[...new Map(names.map(n=>[api.nameKey(n),n])).values()];
function html(day){
 const m=api.day(day);if(!m.valid)return '';
 const can=capability()==='edit'&&!SYNC.readonly&&day>=todayIso(),total=m.count===null?'Not recorded':m.count+' available';
 const names=m.names.map(n=>'<li>'+e(n)+'</li>').join('')+(m.unnamed?'<li class="staff988-unnamed">'+m.unnamed+' unnamed</li>':'');
 const choices=unique(m.names.concat(m.roster));
 const edit=can&&m.ready?'<details data-staff988-edit><summary>Edit availability</summary><div class="staff988-choices">'+choices.map(n=>'<label><input type="checkbox" data-staff988-choice value="'+e(n)+'"'+(m.names.some(x=>api.nameKey(x)===api.nameKey(n))?' checked':'')+'> <span>'+e(n)+'</span></label>').join('')+'</div><label class="staff988-extra">Additional unnamed staff <input type="number" min="0" max="50" inputmode="numeric" data-staff988-extra value="'+m.unnamed+'"></label><details class="staff988-other"><summary>Add another name</summary><label>One name per line<textarea data-staff988-other rows="2"></textarea></label></details><div class="staff988-actions"><button type="button" class="btn" data-staff988-save>Save availability</button>'+(m.roster.length?'<button type="button" class="btn" data-staff988-roster>Use programmed roster</button>':'')+'</div><p role="status" data-staff988-result></p></details>':'';
 return '<section class="card nosfold staff988" data-staff988-day="'+e(day)+'" data-staff988-token="'+e(m.token)+'"><div class="staff988-heading"><div><h3>Available staff</h3><span>'+e(fmtDate(day))+'</span></div><strong>'+e(m.ready?total:'Loading…')+'</strong></div>'+(names?'<ul class="staff988-names">'+names+'</ul>':m.ready?'<p class="staff988-empty">'+(m.count===0?'No staff available.':m.count===null?'No availability recorded.':'Names not recorded.')+'</p>':'')+edit+'</section>';
}
api.html=html;
// Keep recorded unloading windows/order and original worker-slot mappings intact.
crew883Editor=function(){return '';};
crew883Checks=function(model){return model;};
crew883Sheet=function(a){const text=crew883Transport(a);return text==='Transport requirements to confirm'?'':'<div class="loading872-sheet"><b>'+e(text)+'</b><div>Confirm loaded vehicle dimensions, mass, restraints and route conditions.</div></div>';};
crew883Day=function(day){const m=api.day(day);return {count:m.count,names:m.names};};
const flags=tr888Flags;tr888Flags=function(){return flags.apply(this,arguments).filter(f=>f.k!=='crew');};
const panels=dayPanels;dayPanels=function(d){return html(d.iso)+panels.apply(this,arguments);};
function mount(pane,day,before){
 if(!pane||!api.valid(day))return;
 const existing=pane.querySelector('[data-staff988-day]');
 // Keep a user’s open draft. The saved token rejects a concurrent record/roster change.
 if(existing?.dataset.staff988Day===day&&existing.querySelector('[data-staff988-edit][open]'))return;
 const content=html(day);if(existing){if(existing.outerHTML!==content)existing.outerHTML=content;return;}
 if(before)before.insertAdjacentHTML('beforebegin',content);else pane.insertAdjacentHTML('beforeend',content);
}
function mountToday(){const pane=document.getElementById('pane-today');mount(pane,todayIso(),pane?.querySelector('.grid')||pane?.querySelector('.hubcard')||pane?.querySelector('.card'));}
function mountDemob(){const pane=document.getElementById('pane-demob'),day=demobSel816(demob816());mount(pane,day,pane?.querySelector('.dmday816'));}
function draft(pane){
 const box=document.querySelector(pane+' [data-staff988-day]');if(!box?.querySelector('[data-staff988-edit][open]'))return null;
 const copy=box.cloneNode(true),inputs=[...box.querySelectorAll('input,textarea')];
 copy.querySelectorAll('input,textarea').forEach((input,i)=>{if(input.type==='checkbox')input.toggleAttribute('checked',inputs[i].checked);else if(input.tagName==='TEXTAREA')input.textContent=inputs[i].value;else input.setAttribute('value',inputs[i].value);});
 return {day:box.dataset.staff988Day,html:copy.outerHTML};
}
function restore(pane,saved){const box=document.querySelector(pane+' [data-staff988-day]');if(saved&&box?.dataset.staff988Day===saved.day)box.outerHTML=saved.html;}
const today=renderToday;renderToday=function(){const saved=draft('#pane-today'),r=today.apply(this,arguments);mountToday();restore('#pane-today',saved);return r;};
const demob=renderDemob816;renderDemob816=function(){const saved=draft('#pane-demob'),r=demob.apply(this,arguments);mountDemob();restore('#pane-demob',saved);return r;};
const build=renderTimeline;renderTimeline=function(){const saved=draft('#pane-timeline'),r=build.apply(this,arguments);restore('#pane-timeline',saved);return r;};
function refresh(){
 if(state.tab==='today')mountToday();
 if(state.tab==='demob')mountDemob();
 if(state.tab==='timeline'){
  const pane=document.getElementById('pane-timeline'),day=pane?.querySelector('.bc984-day.on')?.dataset.day||state.day;
  mount(pane,day,pane?.querySelector('.flow891'));
 }
}
const footer=syncFooter;syncFooter=function(){const r=footer.apply(this,arguments);refresh();return r;};
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-staff988-save],[data-staff988-roster]');if(!button)return;
 event.preventDefault();const box=button.closest('[data-staff988-day]'),day=box.dataset.staff988Day;
 if(day<todayIso()){box.querySelector('[data-staff988-result]').textContent='This is a closed day record.';return;}
 let result;
 if(button.hasAttribute('data-staff988-roster'))result=api.saveRoster(day,box.dataset.staff988Token);
 else{
  const names=[...box.querySelectorAll('[data-staff988-choice]:checked')].map(x=>x.value).concat(box.querySelector('[data-staff988-other]').value.split('\n').map(api.normal).filter(Boolean));
  const value=box.querySelector('[data-staff988-extra]').value,extra=value.trim()===''?NaN:Number(value);
  result=api.save(day,{count:names.length+extra,names},box.dataset.staff988Token);
 }
 if(result.kept){const current=document.querySelector('#pane-'+(state.tab==='timeline'?'timeline':state.tab)+' [data-staff988-day="'+day+'"]');if(current){current.outerHTML=html(day);const next=document.querySelector('#pane-'+state.tab+' [data-staff988-day="'+day+'"] summary');next?.focus({preventScroll:true});}}
 else{const current=document.querySelector('#pane-'+state.tab+' [data-staff988-day="'+day+'"]')||box,target=current.querySelector('[data-staff988-result]');target.textContent=result.reason;if(/changed|not saved/.test(result.reason)){let reload=current.querySelector('[data-staff988-reload]');if(!reload){reload=document.createElement('button');reload.type='button';reload.className='btn';reload.dataset.staff988Reload='';reload.textContent='Reload availability';target.after(reload);}}}
});
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-staff988-reload]');if(!button)return;const box=button.closest('[data-staff988-day]');box.outerHTML=html(box.dataset.staff988Day);});
api.refresh=refresh;
refresh();
})(window);
