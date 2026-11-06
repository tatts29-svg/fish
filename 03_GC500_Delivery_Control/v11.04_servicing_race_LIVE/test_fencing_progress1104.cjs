/* Author: Andrew Fisher. Synthetic installed-fencing and shared-index regressions. */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const basePath=process.env.BASE_PAGE||path.join(__dirname,'../build/GC500_v11.03/GC500_Delivery_Control_hosted.html');
const original=fs.readFileSync(basePath,'utf8'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-fence1104-'));
const patchedPath=path.join(tmp,'candidate.html');
const python="import importlib.util,pathlib,sys; s=importlib.util.spec_from_file_location('patch',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);pathlib.Path(sys.argv[3]).write_text(m.patch(pathlib.Path(sys.argv[2]).read_text()))";
cp.execFileSync('python3',['-c',python,path.join(__dirname,'patch_fencing_progress_v1104.py'),basePath,patchedPath]);
const patched=fs.readFileSync(patchedPath,'utf8');
let checks=0;function check(name,test){test();checks++;console.log('PASS '+name);}
const section=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return text.slice(a,b);};
const begin='function fenceOverall853(asOf, suppliedSummary, suppliedFencing) {',end='\nvar TodayWork840 =';
const source=section(patched,begin,end),old=section(original,begin,end);
const helper=fs.readFileSync(path.join(__dirname,'fencingProgress1104_src.js'),'utf8');
const percent=section(patched,'/* Author: Andrew Fisher. Raw progress decisions, separately rounded display. */','/* Author: Andrew Fisher. Completion scope');
const index=section(patched,'function progress881Model(','/* Author: Andrew Fisher. v8.85');
const plain=value=>JSON.parse(JSON.stringify(value));
function run(input){
 const summary=structuredClone(input.summary),fencing=structuredClone(input.fencing);
 const c={module:{exports:{}},todayIso:()=> '2030-01-01',todayFencingSummary848:()=>fencing,todayWorkSummary848:()=>summary};c.window=c;
 vm.createContext(c);vm.runInContext(percent,c);vm.runInContext(helper,c);vm.runInContext(source,c);vm.runInContext(index,c);
 const before=JSON.stringify({summary,fencing}),overall=c.fenceOverall853('2030-01-01',summary,fencing),reading=c.progress881Model('2030-01-01',summary,overall);
 assert.equal(JSON.stringify({summary,fencing}),before,'projection must never change source records');
 return {overall:plain(overall),index:plain(reading)};
}
const row=(id,total,done,extra={})=>({id,label:id,unit:'m',total,done,evidencePending:false,unquantifiedPlan:false,classificationPending:false,sourceProvisional:false,...extra});
const sourceRow=(id,planned,recorded,extra={})=>({id,unit:'m',planned,recorded,evidencePending:false,unquantifiedPlan:false,classificationPending:false,sourceProvisional:false,...extra});
function fixture(){return {
 summary:{health:{ready:true},byId:Object.fromEntries(['buildings','toilets','generators','lighting','vms','equipment'].map(id=>[id,{total:10,done:10,pct:100,pctKind:'confirmed'}])),fencingRows:[row('clean',100,50),row('scrim',20,60),row('ccb_event',20,15),row('ccb_demarc',10,15),row('flat_feet',10,5),row('relocation',null,null,{evidencePending:true}),row('removal',null,null,{unquantifiedPlan:true,totalRange:{min:10,max:null}})]},
 fencing:{health:{ready:true},summaryRows:[sourceRow('clean',80,50),sourceRow('scrim',20,60)],classification:{unallocatedMetres:0,evidencePending:false}}
};}
check('patch is isolated to helper, scope, basis and obsolete override',()=>{
 assert.equal(patched.split(helper).length-1,1);assert.ok(!patched.includes('const O0 = W.fenceOverall853;'));
 let normalized=source.replace('  const ids = FencingProgress1104.installedTypes;\n  const installedRows1104 = FencingProgress1104.rows(summary, fencing);',"  const ids = [...new Set(fenceProgrammeDefinitions959([]).filter(row => row.unit === 'm').map(row => row.id))];")
  .replace('  const rows = ids.map(id => installedRows1104.filter(row => row.id === id));','  const rows = ids.map(id => (summary.fencingRows || []).filter(row => row.id === id));');
 const basis=text=>text.match(/    basis:'([^']*)'/)[1];normalized=normalized.replace(basis(normalized),basis(old));assert.equal(normalized,old,'all native allocation/evidence/completion calculations preserved');
 assert.equal(patched.match(/v11\.03/g)?.length,original.match(/v11\.03/g)?.length,'component patch does not change release/footer');
});
check('second application is rejected',()=>assert.throws(()=>cp.execFileSync('python3',['-c',python,path.join(__dirname,'patch_fencing_progress_v1104.py'),patchedPath,path.join(tmp,'twice.html')],{stdio:'pipe'})));
check('phone range layout is scoped and leaves desktop and print rules unchanged',()=>{const css=fs.readFileSync(path.join(__dirname,'fencingProgress1104.css'),'utf8');assert.ok(css.includes('@media screen and (max-width:600px)'));assert.ok(css.includes('white-space:nowrap'));assert.ok(css.includes('grid-template-columns:minmax(0,1fr) !important'));assert.ok([...css.matchAll(/([^{}]+)\{/g)].filter(m=>!m[1].includes('@media')).every(m=>m[1].includes('#tw840-card-fencing')));assert.equal(patched.split('<style id="fencing-progress1104">').length-1,1);});
check('excluded unresolved movement does not veto installed scope',()=>{const {overall:o,index:i}=run(fixture());assert.equal(o.state,'ready');assert.equal(o.total,140);assert.equal(o.credited.min,80);assert.equal(o.credited.max,80);assert.equal(i.ready,true);});
check('temporary fence includes clean and braced plans but counts installed work once',()=>{const f=fixture();f.summary.fencingRows.find(r=>r.id==='clean').total=999;const o=run(f).overall;assert.equal(o.rows.find(r=>r.id==='clean').total,100);assert.equal(o.rows.find(r=>r.id==='clean').recorded,50);assert.equal(o.recorded,85);});
check('scrim fitting progress does not become extra installed fence',()=>{const f=fixture();f.fencing.summaryRows.find(r=>r.id==='scrim').recorded=null;const o=run(f).overall;assert.equal(o.state,'ready');assert.equal(o.total,140);assert.equal(o.recorded,85);});
check('per-type surplus cannot cover another installation shortfall',()=>{const f=fixture();f.fencing.summaryRows[0].recorded=1000;const o=run(f).overall;assert.equal(o.credited.min,130);assert.equal(o.left.min,10);assert.ok(o.pct.min<100);});
for(const [name,delta]of Object.entries({missingPlan:{planned:null},badUnit:{unit:'each'},negativePlan:{planned:-1},infinitePlan:{planned:Infinity},notNumericPlan:{planned:NaN},pendingEvidence:{evidencePending:true},minimum:{unquantifiedPlan:true,totalRange:{min:80,max:null}},hiddenRange:{totalRange:{min:80,max:100}},loading:{loading:true},missing:{missing:true}})){
 for(const id of ['clean','scrim'])check(id+' '+name+' blocks retained denominator',()=>{const f=fixture();Object.assign(f.fencing.summaryRows.find(r=>r.id===id),delta);const {overall:o,index:i}=run(f);assert.equal(o.state,'unconfirmed');assert.equal(o.pct,null);assert.equal(i.ready,false);});
}
for(const delta of [{recorded:null},{recorded:-1},{recorded:NaN},{recordedRange:{min:30,max:50}},{doneRange:{min:30,max:50}},{classificationPending:true}])check('unconfirmed temporary-fence numerator remains unavailable',()=>{const f=fixture();Object.assign(f.fencing.summaryRows[0],delta);assert.equal(run(f).overall.state,'unconfirmed');});
check('missing or duplicate raw plan rows cannot silently shrink scope',()=>{for(const rows of [[],[sourceRow('clean',80,50)],[sourceRow('clean',80,50),sourceRow('clean',80,50),sourceRow('scrim',20,60)],[sourceRow('clean',80,50),sourceRow('scrim',20,60),sourceRow('scrim',20,60)]]){const f=fixture();f.fencing.summaryRows=rows;assert.equal(run(f).overall.state,'unconfirmed');}});
for(const delta of [{evidencePending:true},{unquantifiedPlan:true},{totalRange:{min:10,max:null}},{doneRange:{min:2,max:5}},{unit:'each'},{total:null},{total:-1},{done:-1}])check('invalid included CCB type cannot be discarded from installed scope',()=>{const f=fixture();Object.assign(f.summary.fencingRows.find(r=>r.id==='flat_feet'),delta);assert.equal(run(f).overall.state,'unconfirmed');});
check('missing or duplicate included type blocks whole installed denominator',()=>{for(const duplicate of [false,true]){const f=fixture(),r=f.summary.fencingRows.find(r=>r.id==='flat_feet');f.summary.fencingRows=duplicate?f.summary.fencingRows.concat({...r}):f.summary.fencingRows.filter(row=>row.id!=='flat_feet');assert.equal(run(f).overall.state,'unconfirmed');}});
function pendingFixture(){const f=fixture();Object.assign(f.summary.fencingRows.find(r=>r.id==='ccb_event'),{classificationPending:true,doneRange:{min:10,max:25}});Object.assign(f.summary.fencingRows.find(r=>r.id==='ccb_demarc'),{classificationPending:true,doneRange:{min:5,max:20}});Object.assign(f.fencing.classification,{confirmedByType:{ccb_event:10,ccb_demarc:5},pendingMetres:15});return f;}
check('shared pending CCB quantity contributes once and retains the full range',()=>{const {overall:o,index:i}=run(pendingFixture());assert.equal(o.state,'ready');assert.deepEqual(o.credited,{min:75,max:85});assert.deepEqual(o.left,{min:55,max:65});assert.equal(o.classificationPending,true);assert.equal(o.provisional,true);assert.ok(o.pct.min<o.pct.max);assert.ok(i.pct.min<i.pct.max);assert.equal(o.scopeComplete1012,false);assert.equal(i.allGreen,false);});
check('bad shared CCB reconciliation and source evidence stay blocked',()=>{for(const delta of [{pendingMetres:16},{evidencePending:true},{confirmedByType:{ccb_event:-1,ccb_demarc:5}},{unallocatedMetres:2}]){const f=pendingFixture();Object.assign(f.fencing.classification,delta);assert.equal(run(f).overall.state,'unconfirmed');}});
check('source provisional qualification follows retained clean and braced plans',()=>{for(const id of ['clean','scrim']){const f=fixture();f.fencing.summaryRows.find(r=>r.id===id).sourceProvisional=true;const {overall:o,index:i}=run(f);assert.equal(o.state,'ready');assert.equal(o.provisional,true);assert.equal(i.provisional,true);assert.equal(i.allGreen,false);}});
check('an existing retained summary qualification is never dropped',()=>{const f=fixture();f.summary.fencingRows.find(r=>r.id==='clean').sourceProvisional=true;const {overall:o,index:i}=run(f);assert.equal(o.state,'ready');assert.equal(o.provisional,true);assert.equal(i.provisional,true);assert.equal(i.allGreen,false);});
check('excluded source qualifier does not leak into installed scope',()=>{const f=fixture();f.summary.fencingRows.find(r=>r.id==='relocation').sourceProvisional=true;assert.equal(run(f).overall.provisional,false);});
check('excluded service review cannot veto installation or add another metre',()=>{const f=fixture();f.summary.fencingRows.push(row('scrim_existing',null,null,{evidencePending:true}));const o=run(f).overall;assert.equal(o.state,'ready');assert.equal(o.total,140);assert.equal(o.recorded,85);});
check('seven-category headline uses the same qualified fencing bounds',()=>{const f=pendingFixture();f.summary.byId.equipment={total:3,done:2,pct:200/3,pctKind:'confirmed'};const {overall:o,index:i}=run(f);for(const bound of ['min','max']){assert.ok(Math.abs(i.pct[bound]-(500+200/3+o.pct[bound])/7)<1e-9);}assert.equal(i.rows.find(r=>r.id==='fencing').min,o.pct.min);});
check('100 percent is derived from current retained quantities without physical handover claim',()=>{const f=fixture();f.fencing.summaryRows[0].recorded=100;for(const r of f.summary.fencingRows)if(['ccb_event','ccb_demarc','flat_feet'].includes(r.id))r.done=r.total;const {overall:o,index:i}=run(f);assert.equal(o.state,'ready');assert.equal(o.pct.min,100);assert.equal(o.scopeComplete1012,true);assert.equal(o.allGreen,false);assert.equal(i.allGreen,true);});
check('unready and stale shared records retain native eligibility rules',()=>{const f=fixture();f.fencing.health={ready:false,loading:true};assert.equal(run(f).overall.state,'loading');f.fencing.health={ready:false,loading:false};assert.equal(run(f).overall.state,'unavailable');});
fs.rmSync(tmp,{recursive:true,force:true});console.log(checks+' installed fencing checks passed.');
