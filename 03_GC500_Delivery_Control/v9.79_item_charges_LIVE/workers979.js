/* Author: Andrew Fisher. Programmed workers for each day; task overrides remain explicit. */
(function(){
'use strict';
const dayBefore979=crew883Day;
crew883Day=function(day){const m=StaffNames910.day(day);return m.rosterDefault979?{count:m.count,names:m.names}:dayBefore979(day);};
const editorBefore979=crew883Editor;
crew883Editor=function(asset,dayValue){
 const day=dayValue||state.day||todayIso(),model=StaffNames910.day(day),html=editorBefore979.apply(this,arguments);
 if(!html)return html;
 const t=document.createElement('template');t.innerHTML=html;
 const editor=t.content.querySelector('.crew883'),body=editor?.querySelector('.crew883-body');if(!body)return html;
 const section=document.createElement('section');section.dataset.workers979Day='';section.className='workers979-day';
 const names=model.roster.map(p=>p.name);
 section.innerHTML='<b>Scheduled workers · '+names.length+'</b>'+(names.length?'<div>'+names.map(esc).join(' · ')+'</div>':'<div>No named shift programmed</div>');
 body.prepend(section);
 const count=editor.querySelector('[data-crew883-count]'),input=editor.querySelector('[data-crew883-names]');
 if(model.rosterDefault979){if(count)count.value=String(model.count);if(input)input.value=model.names.join('\n');}
 const availability=editor.querySelector('[data-staff910-availability]');
 if(availability){availability.open=false;availability.querySelector('summary').textContent='Day availability override · '+(model.count==null?'not set':model.count);}
 const setup=editor.querySelector('.workers911-setup');if(setup)setup.remove();
 const task=editor.querySelector('.workers911-task');
 if(task){
  const override=document.createElement('details');override.dataset.workers979Task='';override.innerHTML='<summary>Task worker override</summary>';task.replaceWith(override);override.append(task);
  if(!(crew883Plan(day,asset.key).people||[]).length){task.querySelector('[data-workers911-placeholder]')?.remove();}
 }
 const summary=editor.querySelector(':scope > summary');if(summary){const assigned=(crew883Plan(day,asset.key).people||[]).length;summary.textContent='Workers · '+names.length+' scheduled'+(assigned?' · '+assigned+' task assigned':'');}
 Workers911.updateOptions(editor);
 return t.innerHTML;
};
})();
