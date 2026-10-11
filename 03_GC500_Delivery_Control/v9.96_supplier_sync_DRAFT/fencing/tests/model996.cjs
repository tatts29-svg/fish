// Author: Andrew Fisher. Source-bound fencing activity and unchanged financial model.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {babelParse}=require(path.join(path.dirname(require.resolve('playwright')),'lib/transform/babelBundle.js'));
const root=path.resolve(__dirname,'../../..'),out=process.env.AUDIT_DIR||'/workspace/private-gc500-fencing996';
const base=fs.readFileSync(process.env.BASE||path.join(root,'build/GC500_v9.94-final/GC500_Delivery_Control_hosted.html'),'utf8');
const page=fs.readFileSync(process.env.PAGE||path.join(out,'candidate.html'),'utf8');
const snapshot=JSON.parse(fs.readFileSync(path.join(out,'native-snapshot.json')));
const checks=[],clone=x=>JSON.parse(JSON.stringify(x));
function check(name,fn){fn();checks.push({name,pass:true});}
function extract(html){const f={},constants={};for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 if(m[1].includes('application/json'))continue;
 const code=m[2],prefix='(function(){\n',ast=babelParse(prefix+code+'\n})','fence.js',false);
 for(const node of ast.program.body[0].expression.body.body){
  if(node.type==='FunctionDeclaration')f[node.id.name]=code.slice(node.start-prefix.length,node.end-prefix.length);
  if(node.type==='VariableDeclaration')for(const d of node.declarations)if(d.id.type==='Identifier'&&['DATA','FENCE_PROGRESS848','FENCE_PROGRAMME958','FENCE_REVIEW836','FENCE_TRACE837','FENCE_EVIDENCE849'].includes(d.id.name))constants[d.id.name]=JSON.parse(code.slice(d.init.start-prefix.length,d.init.end-prefix.length));
 }
 }return {f,constants};}
const old=extract(base),now=extract(page),catalogue=now.constants.FENCE_PROGRESS848;
for(const name of ['costDocket','allDockets','fenceByWeek','fenceByArea','fenceDerived','greenBookTotals','cj764Fencing','fenceComponents849','fenceProgrammeReviews958','recordHireAgreement','recordServiceScrim898'])
 check(name+' remains byte-identical',()=>assert.equal(now.f[name],old.f[name]));
check('DATA changes only the gate review expectation',()=>{const expected=clone(old.constants.DATA);expected.fence_ccb_review847.rows.find(r=>r.docket_no==='36560').expected.quantities.ped_gates=1;assert.deepEqual(now.constants.DATA,expected);});
check('FCOL rates unchanged',()=>assert.equal(page.match(/^const FCOL = (.*)$/m)?.[0],base.match(/^const FCOL = (.*)$/m)?.[0]));
check('source trace changes only gate expectation',()=>{const expected=clone(old.constants.FENCE_TRACE837);expected.rows.find(r=>r.docket_no==='36560').expected.quantities.ped_gates=1;assert.deepEqual(now.constants.FENCE_TRACE837,expected);});
check('obsolete gate discrepancy removed; other evidence retained',()=>{const expected=clone(old.constants.FENCE_EVIDENCE849);expected.items=expected.items.filter(i=>i.id!=='ped-gate-gap-36560');assert.deepEqual(now.constants.FENCE_EVIDENCE849,expected);});
check('reconciled source question closes against corrected fingerprint',()=>{const before=clone(old.constants.FENCE_REVIEW836),after=clone(now.constants.FENCE_REVIEW836);const r=after.rows.find(r=>r.docket_no==='36560');assert.equal(r.query.open,false);assert.equal(r.expected.quantities.ped_gates,1);after.rows[after.rows.indexOf(r)]=before.rows.find(r=>r.docket_no==='36560');assert.deepEqual(after,before);});
check('existing programme review catalogue unchanged',()=>assert.deepEqual(now.constants.FENCE_PROGRAMME958,old.constants.FENCE_PROGRAMME958));
function fixture(overrides={}){
 const records=clone(snapshot.dockets),notes=clone(snapshot.serviceNotes),collections=clone(snapshot.collections);
 const files=Object.fromEntries(catalogue.sources.map(s=>[s.id,{sha256:s.sha256}]));
 const c={DATA:{weeks:snapshot.weeks},todayIso:()=>snapshot.day,
  fenceInstallationWeeks847:()=>snapshot.weeks.filter(w=>['Build','Event'].includes(w.phase)),
  progSheetOf:week=>{const a=catalogue.plan_allowances.find(a=>a.week===week);return a?.expected_plan;},
  fenceAreaDone:name=>catalogue.plan_allowances.find(a=>a.completion?.name===name)?.completion.expected,
  FENCE_PROGRESS848:catalogue};vm.createContext(c);
 vm.runInContext(now.f.fenceInstallationDocketState848+'\n'+now.f.fenceProgressEvidence848,c);
 return {c,input:{records,serviceNotes:notes,collections,files,...overrides}};
}
const activity=env=>clone(env.c.fenceProgressEvidence848(snapshot.day,env.input));
const relevant=r=>r.operations.filter(o=>o.type==='scrim_existing');
check('24473 adds one150m activity on8October',()=>{const e=fixture(),r=clone(e.c.fenceProgressEvidence848('2026-10-08',e.input));assert.equal(relevant(r).length,1);assert.equal(relevant(r)[0].quantity,150);assert.equal(relevant(r)[0].number,'24473');});
check('24473 absent before work date',()=>{const e=fixture();assert.equal(relevant(clone(e.c.fenceProgressEvidence848('2026-10-07',e.input))).length,0);});
for(const [name,change] of [
 ['changed note',e=>e.input.serviceNotes.find(n=>n.note_no==='24473').note+=' changed'],
 ['changed metres',e=>e.input.serviceNotes.find(n=>n.note_no==='24473').metres=151],
 ['source missing',e=>delete e.input.files['24473.jpg']],
 ['source checksum changed',e=>e.input.files['24473.jpg'].sha256='0'.repeat(64)],
 ['duplicate service note',e=>e.input.serviceNotes.push(clone(e.input.serviceNotes.find(n=>n.note_no==='24473')))],
 ['explicit source already priced',e=>e.input.records.push({id:'new',docket_no:null,date:'2026-10-08',location:'Different location',quantities:{scrim:150},source_service_id:'N-AFV-0013'})],
 ['same day same site scrim',e=>e.input.records.push({id:'new',docket_no:'99999',date:'2026-10-08',location:'PIT-LANE',quantities:{scrim:150}})]
])check(name+' holds activity',()=>{const e=fixture();change(e);const r=activity(e);assert.equal(relevant(r).length,0);assert(r.pending.some(p=>p.type==='scrim_existing'));});
check('unrelated new scrim does not freeze activity',()=>{const e=fixture();e.input.records.push({id:'new',docket_no:'99999',date:'2026-10-08',location:'Unrelated area',quantities:{scrim:500}});assert.equal(relevant(activity(e)).length,1);});
check('36589 correction preserves activity',()=>{const e=fixture();Object.assign(e.input.records.find(d=>d.docket_no==='36589').components,{base:12,clamp:12});assert.equal(relevant(activity(e)).length,1);});
check('old physical operations unchanged',()=>{const e=fixture(),r=activity(e);assert.deepEqual(r.operations.filter(o=>o.type!=='scrim_existing'),snapshot.today.evidence.operations);});
check('no new financial quantity column',()=>{assert(!now.f.costDocket.includes('scrim_existing'));assert(!now.f.fenceByWeek.includes('scrim_existing'));});
fs.writeFileSync(path.join(out,'model-result.json'),JSON.stringify({author:'Andrew Fisher',pass:true,checks},null,2));console.log(JSON.stringify({pass:true,checks:checks.length}));
