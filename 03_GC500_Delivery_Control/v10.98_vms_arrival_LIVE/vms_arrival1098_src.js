/* Author: Andrew Fisher. Read-only board arrival projection; native writes remain in VMS1024. */
(function(root){
'use strict';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const dayOf=iso=>{const t=Date.parse(iso);return Number.isFinite(t)?new Date(t+10*60*60*1000).toISOString().slice(0,10):'';};
const validDay=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return false;const t=Date.parse(s+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s;};
function evidence(record,day){
 const events=record?.events1098|| (record?.arrival1098?[{...record.arrival1098,inPlace:record.inPlace}]:[]);
 const a=events.filter(a=>a&&validDay(a.effective_date)&&Number.isFinite(Date.parse(a.recorded_at))&&a.by&&a.effective_date<=day&&[null,'on site','off site','not confirmed'].includes(a.state)).sort((a,b)=>b.effective_date.localeCompare(a.effective_date)||b.recorded_at.localeCompare(a.recorded_at))[0];
 if(!a)return null;
 const on=a.state===null?null:a.state==='on site';
 return {on,installed:a.inPlace===true,inPlace:a.inPlace,effectiveDate:a.effective_date,recordedAt:a.recorded_at,by:a.by,state:a.state};
}
function prepare(patch,who,now,old){
 const p=Object.assign({},patch);
 if(own(p,'events1098'))return null;
 if(own(p,'inPlace')&&typeof p.inPlace!=='boolean')return null;
 if(own(p,'arrival1098')){
  const a=p.arrival1098;
  if(!a||!validDay(a.effective_date)||a.effective_date>dayOf(now)||!['on site','off site','not confirmed'].includes(a.state)||!Number.isFinite(Date.parse(a.recorded_at))||a.by!==who||Math.abs(Date.parse(a.recorded_at)-Date.parse(now))>60000)return null;
  if(p.inPlace===true&&a.state!=='on site')return null;
  p.arrival1098={state:a.state,effective_date:a.effective_date,recorded_at:a.recorded_at,by:who};
 }else if(p.inPlace===true){
  p.arrival1098={state:'on site',effective_date:dayOf(now),recorded_at:now,by:who};
 }
 if(own(p,'arrival1098')||own(p,'inPlace')){
  const history=(old?.events1098||(old?.arrival1098?[{...old.arrival1098,inPlace:old.inPlace}]:[])).map(e=>({...e}));
  const current=evidence(old,dayOf(now));
  const a=p.arrival1098;
  history.push({state:a?a.state:current?.state??null,effective_date:a?a.effective_date:dayOf(now),recorded_at:a?a.recorded_at:now,by:who,inPlace:own(p,'inPlace')?p.inPlace:old?.inPlace===true});
  p.events1098=history;
 }
 if(own(p,'lat')||own(p,'lon'))if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||p.lat< -29||p.lat> -27||p.lon<153||p.lon>154)return null;
 return p;
}
/* Input rows are physical register boards. A plan with repeated positions still counts a board once. */
function project(input,day,soon){
 const rows=[...new Map(input.map(r=>[r.key,r])).values()];
 const c={total:rows.length,on:0,done:0,installed:0,due:0,overdue:0,norecord:0,next:0,nextNotOn:0,toCome:[],boards:[]};
 for(const r of rows){
  const e=evidence(r.record,day),here=e&&e.on!==null?e.on:!!r.on,finished=here&&!!r.done,installed=here&&(e?.inPlace===false?false:finished||!!(e&&e.installed));
  c.on+=+here;c.done+=+finished;c.installed+=+installed;
  const due=r.delivery?['complete','on site','overdue','no record'].includes(r.phase):r.due&&r.due<=day;
  if(e&&here||due)c.due++;
  if((!e||!here)&&r.phase==='overdue')c.overdue++;
  if((!e||!here)&&(r.phase==='no record'||!r.delivery&&r.due&&r.due<=day))c.norecord++;
  if(r.phase==='next'||!r.delivery&&r.due&&r.due>day&&r.due<=soon){c.next++;if(!here)c.nextNotOn++;}
  if(!here){
   c.toCome.push({key:r.key,name:r.name,due:r.due||null,contract:r.contract,line:r.line,on:r.delivery||null});
  }
  c.boards.push({...r,beforeNativeOn:!!r.on,on:here,done:finished,installed,evidence:e});
 }
 c.left=Math.max(0,c.total-c.done);c.toCome.sort((a,b)=>String(a.name).localeCompare(String(b.name)));return c;
}
function recordFor(key){
 const matches=(root.VMS1024?.boards()||[]).filter(p=>(p.board||p.default_board)===key).map(p=>root.VMS1024.rec(p.pos)).filter(r=>r&&(r.arrival1098||r.events1098?.length));
 if(!matches.length)return null;
 return {events1098:matches.flatMap(r=>r.events1098||(r.arrival1098?[{...r.arrival1098,inPlace:r.inPlace}]:[]))};
}
function count(day,rows){
 day=day||todayIso();const bs=typeof vms913Boards==='function'?vms913Boards():[];if(!bs.length)return null;
 const groups=new Map();for(const b of bs){const t=vms913OnOf(b).on||'';groups.set(t,(groups.get(t)||[]).concat(b));}
 const input=[];
 groups.forEach((list,t)=>{
  const a=t?assetOf(t):null,st=a&&!a._cancelled?assetStatusAsOf(a,day):null,d=st?.d||{},here=!!(st&&d.recorded&&(d.state==='on site'||d.done));
  const row=(rows||[]).find(r=>r&&r.key===t),finished=!here?0:row?(row.complete?list.length:Math.min(list.length,Number(row.done)||0)):(d.done?list.length:0);
  list.forEach((b,i)=>input.push({key:b.key,name:b.name,contract:b.contract,line:b.line,delivery:t||null,due:st?.in||(/^\d{4}-\d{2}-\d{2}/.test(b.start||'')?String(b.start).slice(0,10):null),phase:st?.inPhase||null,on:here,done:i<finished,record:recordFor(b.key)}));
 });
 return project(input,day,addDays(day,PROG_NEXT_DAYS));
}
function inventoryProjection(I,c){
 if(!c||!c.boards.some(b=>b.evidence))return I;const row=(I.list||[]).find(r=>String(r.item)==='VMS');if(!row)return I;
 row.asked=c.total;row.remaining1017=Math.max(0,c.total-c.on);row.installed1098=c.installed;
 for(const r of c.boards.filter(b=>b.evidence)){
  const delta=+r.on-+r.beforeNativeOn;if(!delta)continue;
  row.on+=delta;row.received1017=(row.received1017||0)+delta;
  const b=vms913Boards().find(b=>b.key===r.key),v=b&&vms913Of(b);if(!v){row.nonum+=delta;continue;}
  if(v.co==='Coates'){if(v.fleet)row.coates+=delta;else row.nonum+=delta;}
  else if(v.co){row.sub[v.co]=(row.sub[v.co]||0)+delta;if(!row.sub[v.co])delete row.sub[v.co];}else row.nonum+=delta;
 }
 row.boardOnly1098=c.boards.filter(b=>b.on&&!b.delivery).map(b=>({key:b.key,name:b.name,contract:b.contract,line:b.line,installed:b.installed}));
 const cos={};for(const r of I.list){for(const [co,n]of Object.entries(r.sub||{}))(cos[co]||(cos[co]={at:0,spare:0})).at+=n;for(const[co,n]of Object.entries(r.spareSub||{}))(cos[co]||(cos[co]={at:0,spare:0})).spare+=n;}I.cos=cos;
 return I;
}
const api={dayOf,evidence,prepare,project,recordFor,count,inventoryProjection};root.VMSArrival1098=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const inventoryBefore=inventory;inventory=function(){return inventoryProjection(inventoryBefore.apply(this,arguments),count(todayIso()));};
})(typeof window==='undefined'?globalThis:window);
