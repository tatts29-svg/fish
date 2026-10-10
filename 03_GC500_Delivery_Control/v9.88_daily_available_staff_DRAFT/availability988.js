/* Author: Andrew Fisher. Daily availability is independent of legacy job allocations. */
(function(root){'use strict';
const key=day=>'staff988/'+day+'/availability';
const normal=x=>String(x??'').trim().replace(/\s+/g,' '),nameKey=x=>normal(x).toLocaleLowerCase('en-AU');
const valid=day=>/^\d{4}-\d{2}-\d{2}$/.test(String(day))&&Number.isFinite(Date.parse(day+'T00:00:00Z'))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;
const countOK=n=>Number.isInteger(n)&&n>=0&&n<=50;
function namesOf(rows){const seen=new Set();return rows.map(x=>normal(typeof x==='string'?x:x?.name)).filter(n=>n&&!seen.has(nameKey(n))&&seen.add(nameKey(n)));}
function create(env){
 function day(iso){
  if(!valid(iso))return {day:iso,valid:false,ready:false,count:null,names:[],unnamed:0,roster:[],source:'invalid',token:''};
  const ready=!env.ready||env.ready(),saved=env.get(iso),legacy=env.legacy?.(iso),rows=env.roster(iso)||[],roster=namesOf(rows);
  const token=JSON.stringify({day:iso,saved:saved??null,legacy:legacy??null,roster:rows,ready});
  let count=null,names=[],source='unrecorded';
  const record=saved?.mode==='roster'?null:saved??legacy;
  if(record){
   count=countOK(record.count)?record.count:null;names=namesOf(Array.isArray(record.names)?record.names:[]);source=saved?'day-availability':'saved-day';
   // Fill an old unnamed remainder only when the exact-day roster has one unambiguous matching set.
   if(!saved&&count!==null&&names.length<count){const remaining=roster.filter(n=>!names.some(x=>nameKey(x)===nameKey(n)));if(remaining.length===count-names.length)names=names.concat(remaining);}
   if(count!==null&&names.length>count)count=null;
  }else if(roster.length&&roster.length<=50){count=roster.length;names=roster.slice();source='programmed-roster';}
  return {day:iso,valid:true,ready,count:ready?count:null,names:ready?names:[],unnamed:ready&&count!==null?Math.max(0,count-names.length):0,roster,source:ready?source:'loading',token};
 }
 function validate(m,value,token){
  if(!m.valid)return 'Choose a valid day.';
  if(!m.ready)return 'Staff records are still loading.';
  if(token!==m.token)return 'The day’s staff changed. Reload availability before saving.';
  if(!value||!countOK(value.count))return 'Available staff must be a whole number from 0 to 50.';
  if(!Array.isArray(value.names)||value.names.some(n=>typeof n!=='string'||n.length>100||/[\r\n]/.test(n)))return 'Enter one name of up to 100 characters per person.';
  const names=value.names.map(normal).filter(Boolean);
  if(new Set(names.map(nameKey)).size!==names.length)return 'Each staff member can be selected once.';
  if(names.length>value.count)return 'The number available cannot be lower than the selected names.';
  return '';
 }
 function save(iso,value,token){const m=day(iso),reason=validate(m,value,token);if(reason)return {kept:false,reason};const kept=env.write(iso,{count:value.count,names:value.names.map(normal).filter(Boolean)})===true;return {kept,reason:kept?'':'Availability was not saved.'};}
 function saveRoster(iso,token){const m=day(iso),v={count:m.roster.length,names:m.roster},reason=validate(m,v,token);if(reason)return {kept:false,reason};if(!m.roster.length)return {kept:false,reason:'No named staff are programmed for this day.'};const kept=env.write(iso,{...v,mode:'roster'})===true;return {kept,reason:kept?'':'Availability was not saved.'};}
 return {day,save,saveRoster,validate};
}
const api={key,create,normal,nameKey,valid};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.DailyStaff988=api;
})(typeof window!=='undefined'?window:globalThis);
