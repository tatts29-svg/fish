/* Author: Andrew Fisher. Adversarial checks execute the original and patched progress functions. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),cp=require('child_process');
const P=require('./percentage1012.js');
const baseFile=process.env.BASE||process.argv[2];
if(!baseFile)throw Error('Pass the exact v10.11 HTML as BASE or the first argument.');
const base=fs.readFileSync(baseFile,'utf8');
let checks=0;
function check(ok,label){if(!ok)throw Error(label);checks++;}
function equal(a,b,label){check(JSON.stringify(a)===JSON.stringify(b),label);}
check(crypto.createHash('sha256').update(base).digest('hex')==='a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557','exact reviewed base');
const patch=path.join(__dirname,'patch_percentage1012.py');
const patched=cp.execFileSync('python3',['-c',
 'import importlib.util,sys; from pathlib import Path; s=importlib.util.spec_from_file_location("p",sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(m.apply(Path(sys.argv[2]).read_text()),end="")',patch,baseFile],{encoding:'utf8',maxBuffer:32*1024*1024});
function fn(src,name,start=0){const i=src.indexOf('function '+name+'(',start);if(i<0)throw Error('Missing function '+name);return src.slice(i,src.indexOf('\n}',i)+2);}
function context(src){
 const c={ProgressPercent1012:P,todayIso:()=> '2026-10-14',dsnState:()=>({rows:[]}),DATA:{weeks:[]},FCOL:[],fenceProgrammeDefinitions959:()=>[{id:'clean',unit:'m'},{id:'ccb_event',unit:'m'},{id:'ccb_demarc',unit:'m'}],currentEvidence:()=>({requirement:5}),vmsBasis:()=> 'Provisional schedule scope'};
 vm.createContext(c);
 for(const name of ['todayWorkSummary842','fenceOverall853','progress881Model','applyScope'])vm.runInContext(fn(src,name),c);
 const past=src.indexOf('/* Author: Andrew Fisher. Approved Build cards read shared facts');
 vm.runInContext(fn(src,'model',past)+'\nthis.pastModel=model;',c);
 return c;
}
const before=context(base),after=context(patched);
const ids=['buildings','toilets','fencing','generators','lighting','vms','equipment'];
function summary(){return {health:{ready:true},byId:Object.fromEntries(ids.map(id=>[id,{pct:100,pctKind:'confirmed',total:100,done:100,left:0}])),fencingRows:[]};}
function fenceRows(done=10000,total=10000){return [{id:'clean',unit:'m',total,done},{id:'ccb_event',unit:'m',total:0,done:0},{id:'ccb_demarc',unit:'m',total:0,done:0}];}
function read(c,s,f={health:{ready:true}}){const fencing=c.fenceOverall853('2026-10-14',s,f);return {fencing,model:c.progress881Model('2026-10-14',s,fencing)};}
for(const [d,t,expected] of [[0,100,0],[1,4,25],[99.9,100,99.9],[100,100,100],[101,100,101]])equal(P.ratio(d,t),expected,'raw ratio '+d+'/'+t);
for(const pair of [[null,100],[1,0],[1,null],[-1,100],[Infinity,100],[1,Infinity],['1',10]])equal(P.ratio(...pair),null,'invalid ratio remains unavailable');
for(const n of [99.995,99.999,99.99999999999999]){equal(P.text(n),'99.99','incomplete numerator cannot display 100');check(P.display(n,true)<=n,'lower bound never rounds upwards');}
equal(P.text(99.9),'99.9','99.9 retained');equal(P.text(100),'100','exact 100 retained');equal(P.text(null),'—','unknown display');
equal(P.text(58.58,true),'58.58','binary representation does not lose a full displayed hundredth');
equal(P.display(1.13,true),1.13,'1.13 lower-bound display compensates binary noise');
equal(P.display(P.ratio(113,10000),true),1.13,'derived 113/10000 lower bound retains 1.13');
check(P.ratio(1e16-2,1e16)<100,'IEEE near-complete division remains below 100');
check(P.mean([100,100,100,100,100,100,100-Number.EPSILON*100])<100,'IEEE averaging cannot promote incomplete group');
equal(P.mean([100,100,100,100,100,100,100]),100,'seven exact completed groups');

const short=summary();short.fencingRows=fenceRows(9999.9);
const old=read(before,short),fixed=read(after,short);
check(old.model.allGreen&&old.model.reached===5,'original falsely lights all green with 0.1m left');
check(!fixed.model.allGreen&&fixed.model.reached===4,'corrected last metre prevents green completion');
check(fixed.fencing.pct.min<100&&fixed.fencing.pct.max<100,'equal fencing bounds retain raw incomplete ratio');
equal(P.text(fixed.fencing.pct.min),'99.99','fencing incomplete display');
for(const k of ['total','recorded','credited','left','excess','rows','gates'])equal(fixed.fencing[k],old.fencing[k],'fencing '+k+' unchanged');
const near=summary();near.fencingRows=fenceRows(9999.999);
const n=read(after,near);check(!n.model.allGreen&&P.text(n.fencing.pct.min)==='99.99','raw completion remains false even if rounded left is zero');
const complete=summary();complete.fencingRows=fenceRows();
const completed=read(after,complete);check(completed.model.allGreen&&completed.model.reached===5,'all exact completed source scopes get five green lights');
equal(P.text(completed.model.pct.min),'100','exact completed job index displays 100');

const category=[{id:'buildings',name:'Buildings',total:20000,done:19999,unit:'units',rows:[],knownTotal:20000}];category.health={ready:true};
const categoryBefore=before.todayWorkSummary842('2026-10-14',category,{}, {summaryRows:[]}).byId.buildings;
const categoryAfter=after.todayWorkSummary842('2026-10-14',category,{}, {summaryRows:[]}).byId.buildings;
equal(categoryBefore.pct,100,'original rounds one remaining unit to 100');
check(categoryAfter.pct<100&&P.text(categoryAfter.pct)==='99.99','category and per-type ratio remains incomplete');
for(const k of ['total','done','left','knownTotal','reviewQuantity','reviewRefs','unquantifiedRefs','plan'])equal(categoryAfter[k],categoryBefore[k],'category '+k+' unchanged');
const mismatch=summary();mismatch.fencingRows=fenceRows();mismatch.byId.buildings={pct:100,pctKind:'confirmed',total:2,done:1,left:1};
check(!read(after,mismatch).model.allGreen,'inconsistent supplied percentage cannot replace raw quantity verification');
const narrow=summary();narrow.fencingRows=fenceRows();narrow.byId.buildings={pct:99.99,pctKind:'confirmed',total:10000,done:9999,left:1};
const narrowBefore=read(before,narrow).model,narrowAfter=read(after,narrow).model;
equal(narrowBefore.pct.min.toLocaleString('en-AU',{maximumFractionDigits:2}),'100','original overall display falsely rounds to 100');
check(P.text(narrowAfter.pct.min)==='99.99'&&!narrowAfter.allGreen,'overall display agrees with incomplete status');
const oldPast=before.pastModel({iso:'2026-10-13'},'2026-10-14',()=>narrowBefore);
const newPast=after.pastModel({iso:'2026-10-13'},'2026-10-14',()=>narrowAfter);
equal(oldPast.text,'100','original past-day display rounds to 100');
check(newPast.text==='99.99'&&!newPast.complete,'past-day card shares the same incomplete display');

for(const mode of ['unknown','partial','stale','unquantified']){
 const s=summary();s.fencingRows=fenceRows();
 if(mode==='unknown')s.byId.toilets={pct:null,pctKind:'unknown',total:null,done:3};
 if(mode==='partial')s.byId.toilets={pct:40,pctKind:'lower-bound',reviewQuantity:2,total:5,done:2,left:3};
 if(mode==='stale')s.health.stale=true;
 if(mode==='unquantified')s.fencingRows[0].unquantifiedPlan=true;
 const r=read(after,s).model;
 check(!r.allGreen&&r.reached<5,mode+' cannot claim completion');
 if(mode==='unknown'||mode==='unquantified')check(!r.ready&&r.pct===null,mode+' keeps unavailable index');
 else check(r.provisional,mode+' remains provisional');
 if(mode==='partial')check(r.pct.max===100&&r.pct.min<r.pct.max,'partial range preserved');
}
const vms=summary();vms.fencingRows=fenceRows();vms.byId.vms={total:4,done:2,left:2,pct:50,pctKind:'lower-bound',reviewQuantity:1,issues:[]};
const beforeVms=structuredClone(vms);before.applyScope(beforeVms.byId.vms,{requirement:5});after.applyScope(vms.byId.vms,{requirement:5});
equal(read(before,beforeVms).model.rows.find(r=>r.id==='vms').max,50,'original provisional scope drops upper completion bound');
const vmRow=read(after,vms).model.rows.find(r=>r.id==='vms');
check(vmRow.min===50&&vmRow.max===100&&vmRow.provisional,'VMS provisional warning preserves completion-review range');
check(vms.byId.vms.pctKind==='lower-bound'&&vms.byId.vms.scopeProvisional960,'both independent uncertainties retained');

const ranged=summary();ranged.fencingRows=[{id:'clean',unit:'m',total:5000,done:5000},{id:'ccb_event',unit:'m',total:2500,done:2499.9,classificationPending:true},{id:'ccb_demarc',unit:'m',total:2500,done:2500.1,classificationPending:true}];
const rf=read(after,ranged,{health:{ready:true},classification:{unallocatedMetres:0,confirmedByType:{ccb_event:2499.9,ccb_demarc:2499.9},pendingMetres:.2}});
check(rf.fencing.state==='ready'&&rf.fencing.pct.min<100&&rf.fencing.pct.max===100,'CCB pending allocation retains unequal near-100 bounds');
check(!rf.model.allGreen&&rf.model.provisional,'pending CCB allocation cannot turn green');
const excess=summary();excess.fencingRows=[{id:'clean',unit:'m',total:100,done:101},{id:'ccb_event',unit:'m',total:100,done:99},{id:'ccb_demarc',unit:'m',total:100,done:100}];
const ex=read(after,excess);equal(ex.fencing.credited.min,299,'excess in one type does not cover another shortfall');check(!ex.model.allGreen,'excess does not finish incomplete scope');

for(const name of ['fh866Model','branchFinancial978','acc761Model','moneySummary','pl770Model','cj764Model','rh766Model','pl752Rows','contractFigures','contractRowsByBranch','branchRollup','generatorBranch1004','finance928ContractOwner'])equal(fn(patched,name),fn(base,name),'financial function unchanged: '+name);
for(const id of ['pricing1010-script','financial-scopes1011-script']){
 const read=s=>s.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))?.[1];
 check(!!read(base),'source script exists: '+id);equal(read(patched),read(base),'entire financial script unchanged: '+id);
}
let scripts=0;for(const match of patched.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)){if(!match[1].trim())continue;new vm.Script(match[1]);scripts++;}check(scripts>=103,'all inline scripts still parse');
check(patched.includes("ProgressPercent1012.text(bounded,kind === 'lower-bound')"),'Today display uses safe helper');
check(patched.includes('const fmt=n=>ProgressPercent1012.text(n);'),'Where display uses safe helper');
check(patched.includes('known ? overallRange853(model.pct,\'\',true) :'),'Fencing headline uses percentage formatter');
for(const mode of ['repeat','wrong']){
 const guard=cp.spawnSync('python3',['-c',
  'import importlib.util,sys; s=importlib.util.spec_from_file_location("p",sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); h=sys.stdin.read(); m.apply(h)',patch],
  {input:mode==='repeat'?patched:base.replaceAll('FinancialScopes1011','MissingReviewedScope'),encoding:'utf8',maxBuffer:32*1024*1024});
 check(guard.status!==0&&guard.stderr.includes(mode==='repeat'?'already applied':'Requires the reviewed'),'guard rejects '+mode+' application');
}
console.log(JSON.stringify({author:'Andrew Fisher',result:'PASS',checks,scripts,baseSha:crypto.createHash('sha256').update(base).digest('hex'),moduleSha:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'percentage1012.js'))).digest('hex'),patchSha:crypto.createHash('sha256').update(fs.readFileSync(patch)).digest('hex'),operationalWrites:0}));
