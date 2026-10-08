/* Author: Andrew Fisher. Visible task worker selection, using the existing day slots and guarded Crew saves. */
const Workers911 = (() => {
  'use strict';
  const key = value => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-AU');
  const rosterDrafts = new Set();
  const draftKey = (editor,names) => JSON.stringify([editor.dataset.crew883Day,editor.dataset.crew883Ref,editor.dataset.staff910DayToken,names]);
  function availableSlot(model, names, name) {
    const matching = names.findIndex(value => key(value) === key(name));
    if (matching >= 0) return matching + 1;
    if (!Number.isInteger(model.count) || model.count < 1) return null;
    for (let i = 0; i < model.count; i++) {
      const slot = model.slots.find(s => s.slot === i + 1);
      if (!key(names[i]) && !(slot && slot.refs.length)) return i + 1;
    }
    return null;
  }
  function readNames(editor) {
    const input = editor.querySelector('[data-crew883-names]');
    return input && input.value ? input.value.split('\n') : [];
  }
  function note(editor, words) {
    const node = editor.querySelector('[data-staff910-message]');
    if (node) node.textContent = words;
  }
  function options(model, names, selected) {
    const slots = model.slots.slice();
    if (Number.isInteger(selected) && !slots.some(s => s.slot === selected)) slots.push({slot:selected,name:'',outsideCount:true});
    const saved = slots.map(s => {
      const name = names[s.slot-1] || s.name || 'Person ' + s.slot + ' · name to confirm';
      return '<option value="'+s.slot+'"'+(selected===s.slot?' selected':'')+'>'+esc(name+(s.outsideCount?' · outside saved availability':''))+'</option>';
    }).join('');
    const choices = model.roster.filter(person => !names.some(name => key(name) === person.key)).map(person => {
      const slot = availableSlot(model,names,person.name);
      return '<option value="'+esc('roster:'+person.name)+'"'+(slot===null?' disabled':'')+'>'+esc(person.name)+(slot===null?' · set day names first':'')+'</option>';
    }).join('');
    return '<option value=""'+(selected===null?' selected':'')+'>Select worker</option>'+saved+(choices?'<optgroup label="Working this day">'+choices+'</optgroup>':'');
  }
  function updateOptions(editor) {
    const model = StaffNames910.day(editor.dataset.crew883Day), names = readNames(editor);
    editor.querySelectorAll('[data-crew883-slot]').forEach(select => {
      const chosen = /^\d+$/.test(select.value)?Number(select.value):null;
      select.innerHTML = options(model,names,chosen);
    });
  }
  function enhance(html, asset, dayValue) {
    if (!html) {
      const d=dayValue||state.day||todayIso();
      if (!asset || !StaffNames910._test.validDay(d)) return html;
      const model=StaffNames910.day(d);
      return '<details class="loading872 crew883 workers911-readonly"><summary>Workers · Not assigned</summary><div class="crew883-body"><p>'+esc(fmtDate(d))+'</p><label>Workers for this day<select disabled><option>Select worker</option>'+model.roster.map(p=>'<option>'+esc(p.name)+'</option>').join('')+'</select></label><p>Open the edit link to assign workers.</p></div></details>';
    }
    const template=document.createElement('template');template.innerHTML=html;
    const editor=template.content.querySelector('.crew883[data-staff910]');if(!editor)return html;
    editor.dataset.workers911='';
    const d=editor.dataset.crew883Day,ref=editor.dataset.crew883Ref,model=StaffNames910.day(d),plan=crew883Plan(d,ref),can=capability()==='edit'&&!SYNC.readonly;
    const assigned=(plan.people||[]).map(p=>p.slot?(model.names[p.slot-1]||'Person '+p.slot):'Unassigned');
    editor.querySelector(':scope > summary').textContent='Workers · '+(assigned.length?assigned.join(', '):can?'Assign workers':'Not assigned');
    const order=editor.querySelector('[data-crew883-order]');if(order)order.closest('label').hidden=true;
    const body=editor.querySelector('.crew883-body'),people=editor.querySelector('[data-crew883-people]');
    if(people){
      const group=document.createElement('section');group.className='workers911-task';group.setAttribute('aria-label','Workers for this task');
      group.innerHTML='<b>Workers for this task</b>';
      group.append(people);
      if(can&&!people.children.length)people.innerHTML=crew883PersonHtml(d,{slot:null,roles:[]},0,true);
      for(const attr of ['data-crew883-add','data-crew883-save']){const button=editor.querySelector('['+attr+']');if(button){button.textContent=attr==='data-crew883-add'?'Add worker':'Save workers';group.append(button);}}
      const hint=document.createElement('p');hint.className='workers911-hint';hint.textContent=can?'Select a worker and their roles, then save. One row is one person.':'Worker assignments are shown here. Open the edit link to change them.';group.append(hint);
      body.prepend(group);
    }
    const availability=editor.querySelector('[data-staff910-availability]');
    if(availability){
      availability.querySelector('summary').textContent='Day worker names · '+(model.count===null?'availability not set':model.count+' available');
      if(can&&model.canUseRoster){
        const setup=document.createElement('div');setup.className='workers911-setup';setup.innerHTML='<p>Day availability is not set. Use the '+model.roster.length+' people forecast for this date.</p>';
        const use=availability.querySelector('[data-staff910-use-roster]');
        if(use){use.textContent='Use today’s forecast';setup.append(use);}
        editor.querySelector('.workers911-task').prepend(setup);
      }else if(can&&model.count===null){availability.open=true;editor.querySelector('.workers911-task').prepend(availability);}
    }
    updateOptions(editor);
    return template.innerHTML;
  }
  function matches(d,ref){return [...document.querySelectorAll('.crew883[data-workers911]')].filter(e=>e.dataset.crew883Day===d&&e.dataset.crew883Ref===ref);}
  function current(d,ref,occurrence){return matches(d,ref)[occurrence];}
  if(typeof document!=='undefined'&&typeof StaffNames910!=='undefined'){
    const before=crew883Editor;crew883Editor=function(...args){return enhance(before.apply(this,args),...args);};
    const personBefore=crew883PersonHtml;crew883PersonHtml=function(d,p,i,can){
      const template=document.createElement('template');template.innerHTML=personBefore(d,p,i,can);const select=template.content.querySelector('[data-crew883-slot]');
      if(select)select.innerHTML=options(StaffNames910.day(d),StaffNames910.day(d).names,p.slot);
      if(p.slot===null&&!p.roles.length)template.content.querySelector('[data-crew883-person]')?.setAttribute('data-workers911-placeholder','');
      return template.innerHTML;
    };
    document.addEventListener('toggle',event=>{const editor=event.target;if(editor.matches&&editor.matches('.crew883[data-workers911]')&&editor.open)updateOptions(editor);},true);
    window.addEventListener('change',event=>{
      const select=event.target,editor=select.closest&&select.closest('.crew883[data-workers911]');
      if(!editor||!select.matches('[data-crew883-slot]')||!select.value.startsWith('roster:'))return;
      event.preventDefault();event.stopImmediatePropagation();
      if(capability()!=='edit'||SYNC.readonly){updateOptions(editor);return;}
      const model=StaffNames910.day(editor.dataset.crew883Day),name=select.value.slice(7),person=model.roster.find(p=>p.name===name),names=readNames(editor),slot=person&&availableSlot(model,names,name);
      if(editor.dataset.staff910DayToken!==model.mappingToken||!slot){updateOptions(editor);note(editor,'Day names changed or no free person number is available. Review day worker names first.');return;}
      while(names.length<slot)names.push('');names[slot-1]=name;
      editor.querySelector('[data-crew883-names]').value=names.join('\n');
      editor.dataset.staff911RosterDraft='true';
      rosterDrafts.add(draftKey(editor,names));
      const chosen=document.createElement('option');chosen.value=String(slot);chosen.textContent=name;select.append(chosen);select.value=String(slot);
      updateOptions(editor);
      editor.querySelector('[data-crew883-count]').dispatchEvent(new Event('change',{bubbles:true}));
      note(editor,'Ready to assign '+name+'. Save workers to keep the day name and this task assignment.');
    },true);
    window.addEventListener('click',event=>{
      const add=event.target.closest&&event.target.closest('[data-crew883-add]');if(add){const box=add.closest('.crew883[data-workers911]');if(box)setTimeout(()=>{if(box.isConnected)updateOptions(box);},0);}
      const use=event.target.closest&&event.target.closest('[data-staff910-use-roster]');
      if(use&&use.closest('.workers911-setup')){
        event.preventDefault();event.stopImmediatePropagation();if(!mayWrite('crew planning'))return;
        const box=use.closest('.crew883[data-workers911]');
        const d=box.dataset.crew883Day,ref=box.dataset.crew883Ref,occurrence=matches(d,ref).indexOf(box),model=StaffNames910.day(d);
        if(!model.canUseRoster||model.mappingToken!==box.dataset.staff910DayToken){note(box,'Day availability changed. Reload the saved plan before using the forecast.');return;}
        const result=StaffNames910.saveDay(d,{count:model.roster.length,names:model.roster.map(p=>p.name)},box.dataset.staff910DayToken,box),next=current(d,ref,occurrence)||box;next.open=true;
        note(next,result.kept?'Forecast names saved. Select workers for this task.':result.reason);next.querySelector('[data-crew883-slot]')?.focus({preventScroll:true});return;
      }
      const button=event.target.closest&&event.target.closest('[data-crew883-save]'),editor=button&&button.closest('.crew883[data-workers911]');
      if(!editor)return;
      for(const row of editor.querySelectorAll('[data-workers911-placeholder]'))if(!row.querySelector('[data-crew883-slot]').value&&!row.querySelector('[data-crew883-role]:checked'))row.remove();
      // A task timer runs after native document listeners; a microtask can run between capture listeners.
      setTimeout(()=>{const list=editor.querySelector('[data-crew883-people]');if(editor.isConnected&&list&&!list.children.length&&capability()==='edit'&&!SYNC.readonly){list.innerHTML=crew883PersonHtml(editor.dataset.crew883Day,{slot:null,roles:[]},0,true);updateOptions(editor);}},0);
      const d=editor.dataset.crew883Day,ref=editor.dataset.crew883Ref,occurrence=matches(d,ref).indexOf(editor),model=StaffNames910.day(d),values=StaffNames910.captureTask(editor),names=readNames(editor),dayValues={count:model.count,names};
      const staged=JSON.stringify(names)!==JSON.stringify(model.names);
      const selectedStaged=values.people.some(p=>p.slot&&key(names[p.slot-1])!==key(model.names[p.slot-1]));
      if(!staged||!selectedStaged&&editor.dataset.staff911RosterDraft!=='true')return;
      event.preventDefault();event.stopImmediatePropagation();if(!mayWrite('crew planning'))return;
      if(!rosterDrafts.has(draftKey(editor,names))){note(editor,'Save day worker names before assigning these workers.');return;}
      const countValue=editor.querySelector('[data-crew883-count]').value;
      const changedCount=(countValue===''?null:Number(countValue))!==model.count;
      const reason=(changedCount?'Save day availability before assigning these workers.':'')||StaffNames910._test.validateDayValues(model,dayValues,editor.dataset.staff910DayToken)||StaffNames910._test.validatePlanValues({...model,names},values,crew883Plan(d,ref),editor.dataset.staff910DayToken,editor.dataset.staff910PlanToken);
      if(reason){note(editor,reason);return;}
      const saved=StaffNames910.saveDay(d,dayValues,editor.dataset.staff910DayToken,editor);let next=current(d,ref,occurrence)||editor;
      if(!saved.kept){note(next,saved.reason);return;}
      const result=StaffNames910.savePlan(d,ref,values,StaffNames910.mappingToken(d),StaffNames910.planToken(d,ref),next);next=current(d,ref,occurrence)||next;next.open=true;
      note(next,result.kept?'Workers saved.':'Day names were saved; the task assignment still needs saving. '+(result.reason||''));
      if(result.kept)delete next.dataset.staff911RosterDraft;
      next.querySelector('[data-crew883-save]')?.focus({preventScroll:true});
    },true);
  }
  return {availableSlot,enhance,updateOptions};
})();
if(typeof window!=='undefined')window.Workers911=Workers911;
if(typeof module!=='undefined'&&module.exports)module.exports=Workers911;
