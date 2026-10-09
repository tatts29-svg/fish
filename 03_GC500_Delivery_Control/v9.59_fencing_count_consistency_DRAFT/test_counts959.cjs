// Author: Andrew Fisher. Frozen native record; no network or mutations.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.PAGE,'utf8'),snap=JSON.parse(fs.readFileSync(process.env.SNAPSHOT,'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x)),m=snap.models,log=[];
const files=Object.fromEntries(JSON.parse(fs.readFileSync(process.env.FILES,'utf8')).files.map(f=>[f.id,f]));
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
const records=clone(m.dockets),notes=clone(m.serviceNotes),collections=clone(m.collections);
const context={DATA:clone(snap.DATA),FCOL:clone(m.FCOL),FENCE:clone(snap.DATA.fence),todayIso:()=> '2026-10-09',allDockets:()=>records,serviceNoteRows:()=>notes,collectionRows:()=>collections,
  photoIndex:()=>({state:'ready',files}),todayWorkHealth840:()=>({ready:true,loading:false,stale:false}),fenceAreaDone:name=>{const r=snap.record.fenceDone[name.toLowerCase().trim().replace(/\s+/g,' ')];return {done:!!r?.done,by:r?.by||null,at:r?.at||null,where:r?'local':null}},
  todayWorkMetrics840:()=>({health:{ready:true}}),todayWorkSummary842:()=>({byId:{fencing:{}}}),esc:String,fmtQty:(n,u)=>n+' '+u};
const c=vm.createContext(context);
for(const [a,b] of [
 ['function progSheet(week)','/* what the plan says up'],['function plannedToDay(sheet','/* v5.59'],
 ['function fenceInstallationWeeks847()','/* Author: Andrew Fisher. v8.47 installation work'],
 ['const FENCE_PROGRESS848 =','function todayLinkedFencing848('],
 ['function fenceComponents849(','function fenceGuide849('],
 ['function fenceOverall853(','var TodayWork840 =']]) {
  let part=section(a,b);
  vm.runInContext(part,c);
}
vm.runInContext('globalThis.progressCatalogue=FENCE_PROGRESS848;globalThis.countCatalogue=FENCE_COUNTS959;',c);
const plain=x=>clone(x),check=(name,fn)=>{fn();log.push(name);},find=(a,id)=>a.find(r=>r.id===id);
const before=JSON.stringify({records,notes,collections,DATA:context.DATA});
const f=c.todayFencingSummary848('2026-10-09'),summary=c.todayWorkSummary848('2026-10-09',undefined,undefined,f),o=c.fenceOverall853('2026-10-09',summary,f),parts=c.fenceComponents849('2026-10-09');
check('flat-feet programme metre line is represented with42m',()=>{assert.equal(find(f.summaryRows,'flat_feet').recorded,42);assert(find(f.summaryRows,'flat_feet').planned>0);assert.equal(find(summary.fencingRows,'flat_feet').done,42);assert.equal(find(o.rows,'flat_feet').recorded,42);});
check('flat-feet19pieces are separate from standard barriers and bases',()=>{assert.equal(find(parts.recorded,'flat_feet_ccb').quantity,19);for(const id of ['base','cc_barrier'])assert.equal(find(parts.recorded,id).quantity,find(m.fenceComponents849.recorded,id).quantity);});
check('green-only physical work is typed and counted once',()=>{assert.equal(find(f.summaryRows,'relocation').recorded,370);assert.equal(find(f.summaryRows,'scrim').recorded,1507.5);assert.equal(find(f.summaryRows,'clean').recorded,7655);assert.equal(f.evidence.operations.filter(r=>['24469','24474'].includes(r.number)).length,2);assert(!f.evidence.operations.some(r=>['24471','24472','24473','24466'].includes(r.number)));});
check('S10scrim is already recorded from24472 and must not be added again',()=>{const existing=records.filter(r=>r.source_service_id==='N-AFV-0012');assert.equal(existing.length,1);assert.equal(existing[0].id,'F-AFV-0026');assert.equal(existing[0].quantities.scrim,150);assert.equal(existing[0].related_hire_id,'F031');assert(!c.progressCatalogue.operations.some(r=>r.records.some(ref=>ref.number==='24472')));});
check('shared Fencing overview counts all measured CCB3987m exactly once',()=>assert.equal(c.fenceCcbRecorded959(records),3987));
check('measured unclassified10m has no raw category and is counted once overall',()=>{assert.equal(f.classification.unallocatedMetres,10);assert.equal(f.classification.pendingMetres,10);assert.equal(f.classification.pendingCount,1);assert.equal(find(f.summaryRows,'ccb_unclassified').recorded,10);assert.equal(find(f.summaryRows,'ccb_event').recorded,755);assert.equal(find(f.summaryRows,'ccb_demarc').recorded,3180);assert.equal(o.recorded,13747);assert.equal(o.state,'ready');assert.equal(o.total,m.fenceOverall853.total+find(f.summaryRows,'flat_feet').planned);});
check('as-of dates exclude each later operation and source measurement',()=>{for(const [day,expect] of [['2026-10-05',[]],['2026-10-06',['24469']],['2026-10-07',['24469']],['2026-10-08',['24469']],['2026-10-09',['24469','24474']]]){const r=c.fenceProgressEvidence848(day);assert.deepEqual(plain(r.operations.filter(x=>['24469','24472','24474'].includes(x.number)).map(x=>x.number).sort()),expect.sort());}assert.equal(c.todayFencingSummary848('2026-10-08').classification.unallocatedMetres,0);});
const operations=c.progressCatalogue.operations.filter(r=>['physical-relocation-24469','physical-relocation-24474','physical-scrim-24472'].includes(r.id));
for(const item of operations){
 for(const ref of item.records)for(const key of Object.keys(ref.expected))check(item.id+' rejects changed '+ref.number+' '+key,()=>{const red=clone(records),green=clone(notes),r=(ref.book==='red'?red:green).find(r=>r.id===ref.record_id);r[key]=typeof r[key]==='object'?{changed:1}:String(r[key])+' changed';const x=c.fenceProgressEvidence848('2026-10-09',{records:red,serviceNotes:green});assert(!x.operations.some(r=>r.id===item.id));assert(x.pending.some(r=>r.id===item.id));});
 for(const source of item.source_ids)check(item.id+' rejects missing/changed source '+source,()=>{for(const mode of ['missing','changed']){const ff=clone(files);if(mode==='missing')delete ff[source];else ff[source].sha256='0'.repeat(64);assert(!c.fenceProgressEvidence848('2026-10-09',{files:ff}).operations.some(r=>r.id===item.id));}});
 check(item.id+' rejects added overlapping red work',()=>{const red=clone(records);red.push({...clone(records[0]),id:'new-work',docket_no:'new-work',quantities:{[item.type]:item.quantity}});assert(!c.fenceProgressEvidence848('2026-10-09',{records:red}).operations.some(r=>r.id===item.id));});
 check(item.id+' rejects duplicated physical operation',()=>{const cat=clone(c.progressCatalogue);cat.operations.push({...clone(item),id:item.id+'copy'});assert(!c.fenceProgressEvidence848('2026-10-09',{catalogue:cat}).operations.some(r=>r.id===item.id||r.id===item.id+'copy'));});
}
const target=records.find(r=>r.docket_no==='36595');
for(const key of Object.keys(c.countCatalogue.unclassified[0].records[0].expected))check('36595 rejects changed '+key,()=>{const red=clone(records),r=red.find(r=>r.id===target.id);r[key]=typeof r[key]==='object'?{changed:1}:String(r[key])+' changed';assert.equal(c.fenceMeasuredCcb959(r,{records:red}).quantityKnown,false);});
check('36595 rejects missing source and duplicated identity',()=>{const ff=clone(files);delete ff['36595.jpg'];assert.equal(c.fenceMeasuredCcb959(target,{files:ff}).quantityKnown,false);assert.equal(c.fenceMeasuredCcb959(target,{records:records.concat(clone(target))}).quantityKnown,false);});
check('missing CCB source withholds percentage rather than silently reporting zero',()=>{const original=files['36595.jpg'];delete files['36595.jpg'];const ff=c.todayFencingSummary848('2026-10-09');assert(ff.classification.evidencePending);assert.equal(c.fenceOverall853('2026-10-09',undefined,ff).state,'unconfirmed');files['36595.jpg']=original;});
check('counts stay gross: collections are separate, not subtracted from installations',()=>{for(const r of m.fenceComponents849.recorded)assert.equal(find(parts.recorded,r.id).quantity,r.quantity);for(const r of m.fenceComponents849.collections)assert.equal(find(parts.collections,r.id).quantity,r.quantity);});
check('finite bounded overall percentage and no false completion',()=>{assert(o.pct.min>=0&&o.pct.max<=100&&o.pct.min<=o.pct.max);assert(o.left.min>=0&&o.left.max>=o.left.min);assert.equal(o.allGreen,false);assert(!JSON.stringify({f,summary,o,parts}).includes('NaN'));});
check('all physical readers leave native records and source data untouched',()=>assert.equal(JSON.stringify({records,notes,collections,DATA:context.DATA}),before));
if(process.env.BASE_PAGE)check('actual charging and forecast functions remain identical to v958',()=>{const base=fs.readFileSync(process.env.BASE_PAGE,'utf8');for(const [a,b] of [['function costDocket(d)','function docketProblems(d)'],['function fenceRateFor(key)','/* v5.80'],['function fenceCostFor(key)','/* One reading'],['const FENCE_PROGRAMME958 =','function fenceByArea(dockets)']]){const i=base.indexOf(a),j=base.indexOf(b,i+a.length);assert(i>=0&&j>i,a);assert.equal(section(a,b).replace(/"author":"Andrew Fisher"/g,'"author":"the project manager"'),base.slice(i,j).replace(/"author":"Andrew Fisher"/g,'"author":"the project manager"'),a);}});
check('all inline scripts parse',()=>{for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:log.length,details:log,quantities:{rows:f.summaryRows.map(({id,planned,recorded,pct})=>({id,planned,recorded,pct})),overall:o},stateUnchanged:true},null,2));
