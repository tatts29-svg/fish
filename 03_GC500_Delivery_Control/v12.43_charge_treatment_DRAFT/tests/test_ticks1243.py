"""Author: Andrew Fisher. Tick aggregate equivalence and exact native freshness."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest


HELPER = Path(__file__).resolve().parents[1] / 'ticks1243_patch.py'
SPEC = importlib.util.spec_from_file_location('ticks1243_patch', HELPER)
PATCH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PATCH)

NODE = r"""
'use strict';
const assert=require('node:assert/strict'),input=JSON.parse(require('node:fs').readFileSync(0,'utf8'));
let checks=0;
function check(name,fn){fn();checks++;}
function fixture(){return {
 assets:[
  {key:'A',branch:'BR-A',rest:2,total:{lines:[
   {item:'ordinary',labour:{qty:3,total:1,ticked:[{key:'install',rate:10.005},{key:'cleaning',rate:2.005},{key:'other-source',rate:1.5,chargeQty975:2}]}},
   {item:'multi',labour:{perBuilding:true,total:1,ticked:[{key:'install',rate:7.115},{key:'fire_ext',fire914:true,rate:4.2,n:2}],units:[{unit:'unit-one',ticked:[{key:'install',rate:7.115}]},{unit:'rest',ticked:[{key:'install',rate:7.115}]}]}}
  ]}},
  {key:'B',total:{lines:[{item:'unknown',labour:{qty:1,total:null,ticked:[{key:'demob',rate:5}]}}]}},
  {key:'C',branch:'BR-C',total:{lines:[{item:'fire',labour:{qty:1,total:1,ticked:[{key:'fire_ext',fire914:true,rate:null,n:1}]}}]}},
  {key:'D',branch:'ignored',_cancelled:true,total:{lines:[{labour:{qty:99,total:1,ticked:[{key:'install',rate:999}]}}]}},
  {key:'E',branch:'ignored',rest_of:'A',total:{lines:[{labour:{qty:99,total:1,ticked:[{key:'install',rate:999}]}}]}},
  {key:'F',branch:'empty',total:{lines:[{item:'unticked'},{labour:{total:1,ticked:[]}}]}}
 ],vms:[{branch:'BR-V',value:12.5},{branch:'BR-V',value:null}]
};}
function rig(source){
 const S=fixture(),DOCS={at:1,state:'ready',files:{}},state={tab:'costs'};
 const DATA={charge_basis:{event_days:['2030-10-25','2030-10-26']},weeks:[{phase:'Demob',start:'2030-10-27',end:'2030-10-28'}],holidays:{holidays:[]}};
 const stats={builds:0,totals:0,vms:0,day:'2030-10-26'};
 const build=()=>{stats.builds++;return structuredClone(S.assets);};
 const assetTotal=a=>{stats.totals++;if(a.fail)throw Error('synthetic asset failure');return structuredClone(a.total);};
 const branchOf=key=>{const a=S.assets.find(a=>a.key===key);return a&&a.branch?{code:a.branch}:null;};
 const vms={model(){stats.vms++;return {slots:structuredClone(S.vms)};}};
 const constants="const PL760_GROUP={install:'install',steps:'install',levelling:'install',demob:'install',cleaning:'cleaning',fire_ext:'fire_ext'},LAB_REST='rest';";
 const code=input.native+'\n'+input.config+'\nwindow.EventConfig1013=EventConfig1013;\n'+input.save+'\n'+input.hydration+'\n'+constants+'\n'+source+'\nreturn {ticks:pl760Ticks,carry:holdCarry1066,hold:holdAssets,save,receive:sharedCache975};';
 const api=new Function('window','S','DOCS','state','DATA','buildAllAssets','assetTotal','branchOf','labourRestN','VmsInstallation1228','todayIso','save775Inner','RENDER_MEMO',code)({},S,DOCS,state,DATA,build,assetTotal,branchOf,a=>a.rest||0,vms,()=>stats.day,()=>undefined,new Map());
 return {api,S,DOCS,state,DATA,stats};
}
function pair(){return [rig(input.old),rig(input.next)];}
function bothHold(pair,fn){return pair[0].api.hold(()=>pair[1].api.hold(fn));}
function equal(pair){const a=pair[0].api.ticks(),b=pair[1].api.ticks();assert.deepEqual(b,a);return b;}

check('actual aggregate preserves units, overrides, cents, unknowns and branch groups',()=>{
 const p=pair();const before=p.map(e=>structuredClone(e.S));const value=equal(p);
 assert.equal(value.ticks,10);assert.equal(value.unknown,3);assert.equal(value.byBranch.ignored,undefined);assert.equal(value.byBranch.empty,undefined);
 assert.equal(value.byBranch['no branch'].install.unknown,1);assert.equal(value.byBranch['BR-C'].fire_ext.unknown,1);assert.equal(value.byBranch['BR-V'].install.unknown,1);
 p.forEach((e,i)=>assert.deepEqual(e.S,before[i]));bothHold(p,()=>equal(p));
});
check('outside a native hold every invocation remains uncached and immediately fresh',()=>{
 const p=pair();equal(p);const counts=p.map(e=>e.stats.totals);equal(p);p.forEach((e,i)=>assert.equal(e.stats.totals,counts[i]*2));
 p.forEach(e=>e.S.assets[0].total.lines[0].labour.qty=4);equal(p);
});
check('existing hold computes once while original computes every call',()=>{
 const p=pair();bothHold(p,()=>{equal(p);const counts=p.map(e=>e.stats.totals);equal(p);assert.equal(p[0].stats.totals,counts[0]*2);assert.equal(p[1].stats.totals,counts[1]);});
});
check('every public result owns all mutable nested groups',()=>{
 const e=rig(input.next);e.api.hold(()=>{const a=e.api.ticks(),b=e.api.ticks(),expected=structuredClone(b);assert.notEqual(a,b);assert.notEqual(a.byBranch,b.byBranch);
  for(const k of ['install','cleaning','fire_ext','other']){assert.notEqual(a[k],b[k]);a[k].amount=987;a[k].unknown=987;}
  for(const branch of Object.keys(a.byBranch)){assert.notEqual(a.byBranch[branch],b.byBranch[branch]);a.byBranch[branch].amount=987;for(const k of ['install','cleaning','fire_ext','other']){assert.notEqual(a.byBranch[branch][k],b.byBranch[branch][k]);a.byBranch[branch][k].ticks=987;}}
  a.byBranch.added={};a.total=987;assert.deepEqual(b,expected);assert.deepEqual(e.api.ticks(),expected);
 });
});
check('save inside a hold refreshes numbers and newly appearing branches',()=>{
 const p=pair();bothHold(p,()=>{equal(p);p.forEach(e=>{e.S.assets[0].branch='NEW';e.S.assets[0].total.lines[0].labour.qty=4;e.api.save();});const v=equal(p);assert.ok(v.byBranch.NEW);assert.equal(v.byBranch['BR-A'],undefined);});
});
check('hydration inside a hold refreshes cancellations and VMS slots',()=>{
 const p=pair();bothHold(p,()=>{equal(p);p.forEach(e=>{e.S.assets[0]._cancelled=true;e.S.vms.push({branch:'NEW-VMS',value:7.25});e.api.receive();});const v=equal(p);assert.equal(v.byBranch['BR-A'],undefined);assert.equal(v.byBranch['NEW-VMS'].amount,7.25);});
});
check('unchanged native carry intentionally reuses the aggregate',()=>{
 const e=rig(input.next),carry={};const a=e.api.carry(carry,()=>e.api.ticks()),count=e.stats.totals;
 const b=e.api.carry(carry,()=>e.api.ticks());assert.deepEqual(b,a);assert.notEqual(a,b);assert.equal(e.stats.totals,count);
});
check('save and hydration between native carried frames invalidate the aggregate',()=>{
 const p=pair(),c=[{},{}];p.forEach((e,i)=>e.api.carry(c[i],()=>e.api.ticks()));
 for(const action of ['save','receive']){p.forEach(e=>{e.S.vms.push({branch:'NEW-'+action,value:2.5});e.api[action]();});const values=p.map((e,i)=>e.api.carry(c[i],()=>e.api.ticks()));assert.deepEqual(values[1],values[0]);assert.equal(values[1].byBranch['NEW-'+action].amount,2.5);}
});
check('day, registry and view changes invalidate native carried reads',()=>{
 const e=rig(input.next),carry={};for(const change of [()=>e.stats.day='2030-10-27',()=>e.DOCS.at++,()=>e.DOCS.files={},()=>e.state.tab='today']){
  e.api.carry(carry,()=>e.api.ticks());const count=e.stats.totals;change();e.api.carry(carry,()=>e.api.ticks());assert.ok(e.stats.totals>count);
 }
});
check('direct event configuration edits invalidate a same-hold aggregate',()=>{
 const p=pair();bothHold(p,()=>{equal(p);p.forEach(e=>{e.DATA.charge_basis.event_days[1]='2030-10-27';e.S.vms.push({branch:'CONFIG',value:3});});assert.equal(equal(p).byBranch.CONFIG.amount,3);});
});
check('non-finite numeric results are copied without JSON coercion',()=>{
 const p=pair();p.forEach(e=>e.S.vms.push({branch:'NONFINITE',value:NaN}));bothHold(p,()=>{const v=equal(p);assert.ok(Number.isNaN(v.total));assert.ok(Number.isNaN(v.byBranch.NONFINITE.amount));});
});
check('calculation exceptions are not cached',()=>{
 const e=rig(input.next);e.api.hold(()=>{e.S.assets[0].fail=true;e.api.save();assert.throws(()=>e.api.ticks(),/synthetic asset failure/);e.S.assets[0].fail=false;e.api.save();assert.equal(e.api.ticks().ticks,10);});
});
check('empty records still return fully shaped independent results',()=>{
 const p=pair();p.forEach(e=>{e.S.assets=[];e.S.vms=[];});bothHold(p,()=>{const v=equal(p);assert.equal(v.total,0);assert.equal(v.ticks,0);assert.equal(v.unknown,0);assert.deepEqual(v.byBranch,{});assert.notEqual(p[1].api.ticks().install,v.install);});
});
console.log(JSON.stringify({passed:checks}));
"""


class TickAggregateTests(unittest.TestCase):
    def test_exact_patch_and_refusals(self):
        text = 'prefix\n' + PATCH.OLD + '\nsuffix'
        result = PATCH.patch(text, 'synthetic.html')
        self.assertEqual(result, 'prefix\n' + PATCH.NEW + '\nsuffix')
        for source in (result, text + PATCH.OLD, text.replace('const mk =', 'const changed ='), 'unrelated'):
            with self.assertRaises(ValueError):
                PATCH.patch(source, 'synthetic.html')

    @unittest.skipUnless(os.environ.get('BASE'), 'BASE is required for exact native lifecycle extraction')
    def test_exact_native_aggregate_and_lifecycle(self):
        page = Path(os.environ['BASE']).read_text()
        self.assertEqual(page.count(PATCH.OLD), 1, 'baseline aggregate source must match exactly')
        start = page.index('let ASSETS_HELD = null;')
        end = page.index('function generatorPlace1004()', start)
        native = page[start:page.rfind('/* Author:', start, end)]
        save_start = page.index('function save(){ REC_EPOCH1066++;')
        save = page[save_start:page.index('\nfunction save775Inner()', save_start)]
        receive_start = page.index('function sharedCache975(){')
        hydration = page[receive_start:page.index('\nfunction syncFold(', receive_start)]
        config_start = page.index('const EventConfig1013 = (() => {')
        config = page[config_start:page.index("if(typeof window!=='undefined')window.EventConfig1013", config_start)]
        result = subprocess.run(['node', '-e', NODE], input=json.dumps({'native': native, 'save': save, 'hydration': hydration, 'config': config, 'old': PATCH.OLD, 'next': PATCH.NEW}), text=True, capture_output=True, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout), {'passed': 13})


if __name__ == '__main__':
    unittest.main()
