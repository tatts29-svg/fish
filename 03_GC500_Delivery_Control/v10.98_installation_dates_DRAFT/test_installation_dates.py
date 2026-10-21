"""Author: Andrew Fisher. Pure guards/date metadata regression checks; no network."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('patch_installation_dates', HERE/'patch_installation_dates.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
source = Path(sys.argv[1]).read_text()
patched = module.patch(source)
milestone = patched[patched.index('function milestoneWhen1098('):patched.index('function badgeHtml(')]
native_done = patched[patched.index('function setDone('):patched.index('/* Which references the second tick') ]
merge = patched[patched.index('function timeline841MergeProof('):patched.index('function timeline841Project(')]
node = r'''
const assert=require('assert'),vm=require('vm');
const source=JSON.parse(require('fs').readFileSync(0,'utf8'));
let calls=[],edit=true,asset={key:'TEST01'},done=false,moved=false,conflict=[],history=[],proof=null;
const ctx={window:{},Date,console,S:{delivery:{TEST01:{done_recorded_at:'audit-now'}}},todayIso:()=> '2026-10-21',assetOf:k=>k==='TEST01'?asset:null,
 movedAway:()=>moved,mayWrite:()=>edit,whoAmI:()=> 'Andrew Fisher via Codex',deliveryOf:()=>({done}),timeline841CompletionConflict:()=>conflict,
 cutoffOf:d=>new Date(d+'T23:59:59.999+10:00').toISOString(),histOf:()=>history,timeline841Proof:()=>proof,timeline841Set:(key,stage,day)=>{calls.push({key,stage,day});return true}};
vm.createContext(ctx);vm.runInContext(source.helpers+'\n'+source.merge,ctx);
for(const day of ['','2026-02-30','2026-13-01','2026-10-22','21-10-2026']){assert.strictEqual(ctx.installationDate1098(day),null);assert.strictEqual(ctx.installationSet1098('TEST01',day).ok,false)}
const meta=ctx.installationDate1098('2026-10-18');assert.strictEqual(meta.effective_date,'2026-10-18');assert.strictEqual(meta.date_only,true);assert.strictEqual(meta.at,'2026-10-17T14:00:00.000Z');assert.ok(Date.parse(meta.recorded_at)>Date.parse(meta.at));
for(const change of [()=>{edit=false},()=>{asset={key:'TEST01',_cancelled:true}},()=>{done=true},()=>{moved=true},()=>{conflict=['short']},()=>{history=[{state:'not on site',at:'2026-10-20T00:00:00Z'}]},()=>{proof={at:'2026-10-20T00:00:00Z'}},()=>{history=[{done:false,at:'2026-10-18T03:00:00Z'}]},()=>{proof={stage:0,at:'2026-10-18T02:00:00Z'}}]){
 calls=[];edit=true;asset={key:'TEST01'};done=false;moved=false;conflict=[];history=[];proof=null;change();assert.strictEqual(ctx.installationSet1098('TEST01','2026-10-18').ok,false);assert.strictEqual(calls.length,0)
}
edit=true;asset={key:'TEST01'};done=false;moved=false;conflict=[];history=[];proof=null;calls=[];
assert.strictEqual(ctx.installationSet1098('TEST01','2026-10-18').ok,true);assert.deepStrictEqual(calls,[{key:'TEST01',stage:4,day:'2026-10-18'},{key:'TEST01',stage:5,day:'2026-10-18'}]);
const p={stage:4,at:meta.at,by:'operator',date_only:true,effective_date:meta.effective_date,recorded_at:meta.recorded_at,history:[]};
const merged=ctx.timeline841MergeProof(p,null);assert.strictEqual(merged.date_only,true);assert.strictEqual(merged.effective_date,p.effective_date);assert.strictEqual(merged.history[0].effective_date,p.effective_date);assert.strictEqual(merged.recorded_at,p.recorded_at);
const cleared=ctx.timeline841MergeProof({stage:0,at:new Date().toISOString(),by:'operator'},merged);assert.strictEqual(cleared.stage,0);assert.strictEqual(cleared.date_only,undefined);assert.strictEqual(cleared.history[0].effective_date,p.effective_date);
ctx.S={delivery:{TEST01:{state:'not on site',history:[{state:'not on site',at:'2026-10-03T00:00:00Z',by:'earlier'}],note:'keep',levelled:true,steps:true}}};ctx.isRef=k=>k==='TEST01';ctx.bump=()=>{};ctx.buzz=()=>{};ctx.flash=()=>{};ctx.deliveryOf=k=>ctx.S.delivery[k];
vm.runInContext(source.native_done,ctx);
const nativeBefore=JSON.stringify(ctx.S.delivery.TEST01.history);assert.strictEqual(ctx.setDone('TEST01',true,'2026-10-18'),true);let rec=ctx.S.delivery.TEST01;
assert.strictEqual(rec.done,true);assert.strictEqual(rec.done_effective_date,'2026-10-18');assert.strictEqual(rec.done_date_only,true);assert.strictEqual(rec.done_at,meta.at);assert.strictEqual(rec.done_history.at(-1).date_only,true);assert.strictEqual(rec.done_history.at(-1).recorded_at,rec.done_recorded_at);assert.ok(Date.parse(rec.set_at)>Date.parse(rec.done_at));assert.strictEqual(rec.note,'keep');assert.strictEqual(rec.levelled,true);assert.strictEqual(rec.steps,true);assert.strictEqual(JSON.stringify(rec.history.slice(0,1)),nativeBefore);
// The ordinary Complete control can still be used; metadata must clear when it records a new exact-time event.
assert.strictEqual(ctx.setDone('TEST01',true),true);rec=ctx.S.delivery.TEST01;assert.strictEqual(rec.done_date_only,undefined);assert.strictEqual(rec.done_effective_date,undefined);assert.strictEqual(rec.done_recorded_at,undefined);assert.ok(Date.parse(rec.done_at)>Date.parse(meta.at));
ctx.dmy=x=>x;ctx.dmyhm=()=> 'timestamp with time';vm.runInContext(source.milestone,ctx);assert.strictEqual(ctx.milestoneWhen1098({last:{date_only:true,effective_date:'2026-10-18'},reachedAt:meta.at}),'2026-10-18 (time not recorded)');assert.strictEqual(ctx.milestoneWhen1098({last:{},reachedAt:meta.at}),'timestamp with time');
console.log('PASS native date validation, read-only/cancelled/conflict/history guards, stage sequence, audit/effective-day separation and proof merge/reset');
'''
subprocess.run(['node','-e',node],input=json.dumps({'helpers':module.HELPERS,'merge':merge,'native_done':native_done,'milestone':milestone}),text=True,check=True)
assert 'WB07' not in Path(HERE/'patch_installation_dates.py').read_text()
try:
    module.patch(patched)
except ValueError:
    pass
else:
    raise AssertionError('Repeated patch must fail')
print('PASS patch is generic and refuses duplicate application')
