/* Author: Andrew Fisher. Uses the existing staff renderer and sync-footer refresh. */
const staffAttempts1008=new Map();
function staffStatus1008(day){
 const attempt=staffAttempts1008.get(day);if(!attempt)return {state:'none',text:''};
 const key=attempt.key||api.key(day),id=docIdOf(key),record=S.loads&&S.loads[key];
 return StaffSave1008.status(attempt,{current:record&&JSON.stringify({...record,_k:key}),on:SYNC.on,readonly:SYNC.readonly,connection:SYNC.status,last:SYNC.last?.loads?.[id],inflight:!!SYNC.inflight?.['loads/'+id],queued:Object.hasOwn(SYNC.queue?.loads||{},id)});
}
function staffFeedback1008(){
 document.querySelectorAll('[data-staff988-day]').forEach(box=>{
  const attempt=staffAttempts1008.get(box.dataset.staff988Day);if(!attempt)return;
  const result=box.querySelector('[data-staff988-result]');if(!result)return;
  const status=staffStatus1008(box.dataset.staff988Day);
  if(result.textContent!==status.text)result.textContent=status.text;
  result.dataset.save1008=status.state;
 });
}
document.addEventListener('input',event=>{
 const input=event.target.closest?.('[data-staff988-edit] input,[data-staff988-edit] textarea');if(!input)return;
 const day=input.closest('[data-staff988-day]')?.dataset.staff988Day;if(!day)return;
 staffAttempts1008.set(day,{dirty:true});staffFeedback1008();
});
