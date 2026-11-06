/* Author: Andrew Fisher. Read-only Demob reference and collection evidence projection. */
(function(root){'use strict';
const list=x=>Array.isArray(x)?x:[],text=x=>String(x??'').trim(),validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(text(x))&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
const norm=x=>text(x).toLowerCase().replace(/\s+/g,' '),time=x=>Number.isFinite(Date.parse(x))?Date.parse(x):null;
function dayOf(at){const t=time(at);return t===null?null:new Date(t+36000000).toISOString().slice(0,10);}
function quantities(units){const out=new Map();for(const u of list(units)){const type=text(u.type),n=Number(u.n);if(type&&!u.unknown&&Number.isFinite(n)&&n>0){const id=norm(type),old=out.get(id);out.set(id,{type:old?.type||type,n:n+(old?.n||0)});}}return [...out.values()].sort((a,b)=>norm(a.type).localeCompare(norm(b.type)));}
function fingerprint(units){return JSON.stringify(quantities(units).map(u=>[norm(u.type),u.n]));}
function scope(M){const seen=new Set(),positive=[],unknown=[],zero=[];for(const r of list(M?.refs)){if(!r?.key||seen.has(r.key)||r.a?._cancelled||r.cancelled)continue;seen.add(r.key);if(quantities(r.units).length)positive.push(r);else if(!list(r.units).length||r.units.some(u=>u.unknown))unknown.push(r);else zero.push(r);}return {refs:positive,unknown,zero,total:positive.length};}
function arrival(record,cutoff){const events=list(record?.history).filter(h=>h&&!h.collection996&&h.state==='on site'&&time(h.at)!==null&&dayOf(h.at)<=cutoff);if(record?.state==='on site'&&time(record.set_at)!==null&&dayOf(record.set_at)<=cutoff&&!events.some(h=>h.at===record.set_at))events.push({state:'on site',at:record.set_at});return events.sort((a,b)=>time(a.at)-time(b.at)).at(-1)||null;}
function evidence(r,record,cutoff){
 const required=quantities(r.units),unknown=list(r.units).some(u=>u.unknown),arr=arrival(record,cutoff),events=[],issues=[],seen=new Set(),totals=new Map(),seenNumbers=new Set(),seenUnits=new Set();
 const requiredKey=fingerprint(required),requiredMap=new Map(required.map(u=>[norm(u.type),u.n]));
 if(arr)for(const h of list(record?.history).slice().sort((a,b)=>(time(a?.at)||0)-(time(b?.at)||0))){
  const c=h?.collection996;if(c?.version===1&&c.kind==='collection'&&c.arrivalAt===arr?.at&&c.date<=cutoff&&c.requiredKey!==requiredKey)issues.push('Item quantities changed after a collection record; review the collection scope.');if(!c||c.version!==1||c.kind!=='collection'||!text(c.id)||seen.has(c.id)||!text(h.by)||time(h.at)===null||time(h.at)<=time(arr.at)||!validDate(c.date)||c.date>cutoff||c.date>dayOf(h.at)||c.date<dayOf(arr.at)||c.arrivalAt!==arr.at||c.requiredKey!==requiredKey||!Array.isArray(c.items)||!c.items.length)continue;
  const qty=quantities(c.items);if(qty.length!==c.items.length||c.items.some(u=>u.unknown||!text(u.type)||!Number.isInteger(Number(u.n))||Number(u.n)<=0||list(u.unitIds).length>Number(u.n)||list(u.numbers).length>Number(u.n))||qty.some(u=>!requiredMap.has(norm(u.type))||(totals.get(norm(u.type))||0)+u.n>requiredMap.get(norm(u.type))))continue;
  const ids=c.items.flatMap(u=>list(u.unitIds).map(String));if(new Set(ids).size!==ids.length||ids.some(id=>seenUnits.has(id)))continue;const numbered=c.items.flatMap(u=>list(u.unitIds).length?[]:list(u.numbers).map(String));if(new Set(numbered).size!==numbered.length||numbered.some(n=>seenNumbers.has(n)))continue;for(const n of numbered)seenNumbers.add(n);for(const id of ids)seenUnits.add(id);
  for(const u of qty)totals.set(norm(u.type),(totals.get(norm(u.type))||0)+u.n);seen.add(c.id);events.push({at:h.at,by:h.by,...c,items:qty.map(u=>({...u,numbers:list(c.items.find(x=>norm(x.type)===norm(u.type))?.numbers).map(String),unitIds:list(c.items.find(x=>norm(x.type)===norm(u.type))?.unitIds).map(String),physicalUnits:list(c.items.find(x=>norm(x.type)===norm(u.type))?.physicalUnits)}))});
 }
 const remaining=required.map(u=>({...u,n:Math.max(0,u.n-(totals.get(norm(u.type))||0))}));
 return {key:r.key,required,remaining,events,issues:[...new Set(issues)],arrival:arr,unknown,recorded:events.length>0,complete:!!arr&&!unknown&&required.length>0&&!issues.length&&remaining.every(u=>u.n===0),collected:required.map(u=>({...u,n:totals.get(norm(u.type))||0})),source:'Native delivery history · typed collection quantities'};
}
function create(env){
 function whole(M,date){const s=scope(M),readings=s.refs.map(r=>evidence(r,env.record(r.key),date)),completed=readings.filter(r=>r.complete).length,recorded=readings.some(r=>r.recorded),percent=recorded&&s.total?completed/s.total*100:null;return {...s,date,readings,issues:[...new Set(readings.flatMap(r=>r.issues))],completed,recorded,percent,bound:percent!==null&&completed<s.total,complete:s.total>0&&completed===s.total&&!s.unknown.length,outside:s.refs.filter(r=>!list(M.days).includes(r.iso)),undated:s.refs.filter(r=>!validDate(r.iso))};}
 function day(M,date,today,loads){
  const w=whole(M,date),past=date<today,future=date>today,refs=w.refs.filter(r=>r.iso===date||list(r.portions).some(p=>p.iso===date)),unknown=w.unknown.filter(r=>r.iso===date||list(r.portions).some(p=>p.iso===date)),byKey=new Map(w.readings.map(r=>[r.key,r]));
  // A whole-reference event does not prove which of several planned truck portions carried an item.
  const completeLoad=L=>{const rows=L.toilet?.rows||L.rows||L.stops?.map(x=>({r:x.r,parts:x.parts}))||[];return rows.length>0&&rows.every(x=>{const e=byKey.get(x.r?.key);if(!e)return false;if(list(x.r.portions).length>1||x.part){const candidates=list(x.r.portions).filter(p=>p.iso===(x.iso||date)&&(!p.s||p.s===(L.toilet?.stream||L.stream)));const part=x.pid?list(x.r.portions).find(p=>p.id===x.pid):candidates.length===1?candidates[0]:null;if(!part)return false;const amount=e.events.filter(c=>c.portionId===part.id&&c.portionKey===JSON.stringify([part.id,part.iso,part.n,part.s||''])&&c.date<=date).reduce((n,c)=>n+c.items.reduce((sum,u)=>sum+u.n,0),0);return amount>=Number(part.n);}return e.complete;});};
  const planned=list(loads),completedLoads=planned.filter(completeLoad).length,dayComplete=refs.length>0&&!unknown.length&&refs.every(r=>byKey.get(r.key)?.complete)&&planned.every(completeLoad);
  return {date,past,future,today:date===today,whole:w,refs,unknown,loads:planned.length,completedLoads,complete:past&&dayComplete,percent:past?w.percent:null,recorded:w.readings.filter(r=>r.events.some(c=>c.date===date)).length,staff:env.staff?.(date)||{count:null,names:[],unnamed:0},rule:env.rule?.(date)||null};
 }
 function summary(M){const s=scope(M),n=src=>s.refs.filter(r=>r.src===src).length;return {...M.counts,total:s.total,plan:n('plan'),contract:n('contract'),proposed:n('proposed'),confirmed:n('confirmed')};}
 return {whole,day,summary};
}
root.DemobProgress996={validDate,dayOf,quantities,fingerprint,scope,arrival,evidence,create};
})(typeof window!=='undefined'?window:globalThis);
