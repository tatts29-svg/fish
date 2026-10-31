"""Author: Andrew Fisher. Synthetic identity equivalence and native-hold freshness."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest


HELPER = Path(__file__).resolve().parents[1] / 'identity_index1243_patch.py'
SPEC = importlib.util.spec_from_file_location('identity_index1243_patch', HELPER)
PATCH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PATCH)

NODE = r"""
'use strict';
const assert=require('node:assert/strict');
const {oldSource,newSource}=JSON.parse(require('node:fs').readFileSync(0,'utf8'));
let checks=0;
function check(name,fn){fn();checks++;}
function rig(source,initial){
 const e={records:initial,calls:0,scans:0,clock:10000};
 let held=null,stale=false;const memo=new Map();
 // The ordinary native hold discards its memo on exit and rebuilds on save.
 // Record snapshots here also make stale-index regressions visible in tests.
 const build=()=>e.records.map(a=>a&&({...a,numbers:Array.isArray(a.numbers)?a.numbers.slice():a.numbers}));
 function fresh(){if(held&&stale){stale=false;memo.clear();held=build();}}
 e.allAssets=()=>{e.scans++;fresh();return held||e.records;};
 e.assetNumbersOf=a=>{e.calls++;if(a.fail)throw Error('synthetic unreadable number source');return a.numbers;};
 e.heldMemo=(key,read)=>{if(!held)return read();fresh();if(!memo.has(key))memo.set(key,read());return memo.get(key);};
 e.hold=fn=>{if(held){fresh();return fn();}held=build();memo.clear();stale=false;try{return fn();}finally{held=null;memo.clear();stale=false;}};
 e.save=()=>{if(held)stale=true;};
 e.read=new Function('allAssets','assetNumbersOf','heldMemo','Date',source+'\nreturn {query:elsewhere,reference:siteNumbersElsewhere};')(e.allAssets,e.assetNumbersOf,e.heldMemo,{now:()=>e.clock});
 return e;
}
const simple=()=>[
 {key:'A',numbers:['one',' shared ',7,'007',null]},
 {key:'B',numbers:['two',' shared ',7]},
 {key:'A',numbers:['own-duplicate']},
 {key:'C',_cancelled:true,numbers:['cancelled',7]},
 {key:'D',numbers:[]},{key:'E',numbers:null},
 {key:undefined,numbers:['undefined-owner']},{key:NaN,numbers:['nan-owner']}
];
function equivalent(e,refs,numbers){for(const ref of refs){const actual=e.read.query(ref),expected=e.read.reference(ref);for(const n of numbers)assert.equal(actual.has(n),expected.has(n),'ref='+String(ref)+' number='+String(n));}}
check('ordinary output, cancelled rows, exact String conversion and strict owner exclusion',()=>{
 const e=rig(newSource,simple());const refs=['A','B','C','missing',undefined,NaN];
 const ns=['one','two',' shared ','shared','7',7,'007','null',null,'cancelled','own-duplicate','undefined-owner','nan-owner','absent'];
 equivalent(e,refs,ns);e.hold(()=>equivalent(e,refs,ns));
});
check('empty inputs',()=>{const e=rig(newSource,[]);e.hold(()=>assert.equal(e.read.query('A').has('none'),false));});
check('one source traversal shared by all reference queries in a draw',()=>{
 const e=rig(newSource,simple());e.hold(()=>{for(let i=0;i<30;i++)e.read.query('ref'+i).has('one');assert.equal(e.scans,1);assert.equal(e.calls,7);});
});
check('the next draw cannot reuse the previous ownership index',()=>{
 const e=rig(newSource,[{key:'A',numbers:['old']}]);
 e.hold(()=>assert.equal(e.read.query('B').has('old'),true));
 e.records[0].numbers=['new'];e.hold(()=>{assert.equal(e.read.query('B').has('old'),false);assert.equal(e.read.query('B').has('new'),true);});
});
check('reads outside a hold are immediately fresh without a save or timeout',()=>{
 const e=rig(newSource,[{key:'A',numbers:['old']}]);assert.equal(e.read.query('B').has('old'),true);
 e.records[0].numbers=['new'];assert.equal(e.read.query('B').has('old'),false);assert.equal(e.read.query('B').has('new'),true);
});
check('save invalidates number additions and removals during an existing hold',()=>{
 const e=rig(newSource,[{key:'A',numbers:['old']}]);e.hold(()=>{
  assert.equal(e.read.query('B').has('old'),true);e.records[0].numbers=['new'];e.save();
  assert.equal(e.read.query('B').has('old'),false);assert.equal(e.read.query('B').has('new'),true);
 });
});
check('save invalidates cancelled state and owner moves during an existing hold',()=>{
 const e=rig(newSource,[{key:'A',numbers:['one']}]);e.hold(()=>{
  assert.equal(e.read.query('B').has('one'),true);e.records[0]._cancelled=true;e.save();assert.equal(e.read.query('B').has('one'),false);
  e.records[0]._cancelled=false;e.records[0].key='B';e.save();assert.equal(e.read.query('B').has('one'),false);assert.equal(e.read.query('A').has('one'),true);
 });
});
check('nested native holds share reads and honour invalidation',()=>{
 const e=rig(newSource,[{key:'A',numbers:['one']}]);e.hold(()=>{e.read.query('B');e.hold(()=>e.read.query('C'));assert.equal(e.scans,1);
  e.records.push({key:'B',numbers:['two']});e.save();e.hold(()=>assert.equal(e.read.query('A').has('two'),true));assert.equal(e.scans,2);
 });
});
check('query objects do not expose mutable index ownership',()=>{
 const e=rig(newSource,simple());e.hold(()=>{const q=e.read.query('B');assert.equal(Object.isFrozen(q),true);assert.deepEqual(Object.keys(q),['has']);assert.equal(q.add,undefined);assert.equal(q.clear,undefined);assert.throws(()=>{q.has=()=>false;},TypeError);assert.equal(e.read.query('B').has('one'),true);});
});
check('faulting number source retains partial result and skips a fault on the queried owner',()=>{
 const e=rig(newSource,[{key:'A',numbers:['before']},{key:'bad',fail:true},{key:'C',numbers:['after']}]);
 e.hold(()=>{equivalent(e,['A','bad','C','missing'],['before','after']);assert.equal(e.read.query('bad').has('after'),true);assert.equal(e.read.query('missing').has('after'),false);});
});
check('malformed source returns the original partial result',()=>{
 const e=rig(newSource,[{key:'A',numbers:['before']},null,{key:'C',numbers:['after']}]);e.hold(()=>equivalent(e,['A','C','missing'],['before','after']));
});
check('failure during String conversion preserves earlier numbers from that row',()=>{
 const failing={toString(){throw Error('synthetic conversion failure');}};
 const e=rig(newSource,[{key:'A',numbers:['before',failing,'after']},{key:'C',numbers:['last']}]);
 e.hold(()=>equivalent(e,['A','C','missing'],['before','after','last']));
});
check('source failure recovery is visible on the next saved read',()=>{
 const e=rig(newSource,[{key:'A',numbers:['one'],fail:true}]);e.hold(()=>{assert.equal(e.read.query('B').has('one'),false);e.records[0].fail=false;e.save();assert.equal(e.read.query('B').has('one'),true);});
});
check('original four-second cache is a failing staleness control',()=>{
 const e=rig(oldSource,[{key:'A',numbers:['old']}]);assert.equal(e.read.query('B').has('old'),true);e.records[0].numbers=['new'];e.save();
 assert.equal(e.read.query('B').has('old'),true);assert.equal(e.read.query('B').has('new'),false);
 e.clock+=4001;assert.equal(e.read.query('B').has('old'),false);assert.equal(e.read.query('B').has('new'),true);
});
check('deterministic wider reference equivalence',()=>{
 const records=Array.from({length:80},(_,i)=>({key:'R'+(i%37),_cancelled:i%9===0,numbers:[String(i%13),i%7,' N'+(i%6)+' ']}));
 const e=rig(newSource,records);e.hold(()=>equivalent(e,Array.from({length:40},(_,i)=>'R'+i),Array.from({length:20},(_,i)=>String(i)).concat([' N0 ',' N5 ','N0',0])));
});
console.log(JSON.stringify({passed:checks}));
"""

NATIVE_NODE = r"""
'use strict';
const assert=require('node:assert/strict');
const input=JSON.parse(require('node:fs').readFileSync(0,'utf8'));
function rig(source){
 const S={assets:[{key:'A',numbers:['one']}]},DOCS={at:1,state:'ready',files:{}},state={tab:'costs'};
 const DATA={charge_basis:{event_days:['2030-10-25','2030-10-26']},weeks:[{phase:'Demob',start:'2030-10-27',end:'2030-10-28'}],holidays:{holidays:[]}};
 const stats={builds:0,numbers:0,day:'2030-10-26'};
 const build=()=>{stats.builds++;return S.assets.map(a=>({...a,numbers:a.numbers.slice()}));};
 const numbers=a=>{stats.numbers++;return a.numbers;};
 const code=input.native+'\n'+input.config+'\nwindow.EventConfig1013=EventConfig1013;\n'+input.save+'\n'+input.hydration+'\n'+source+'\nreturn {query:elsewhere,carry:holdCarry1066,hold:holdAssets,save,receive:sharedCache975,current:()=>EventConfig1013.current()};';
 const api=new Function('window','S','DOCS','state','DATA','buildAllAssets','assetNumbersOf','todayIso','save775Inner','RENDER_MEMO',code)({},S,DOCS,state,DATA,build,numbers,()=>stats.day,()=>undefined,new Map());
 return {api,S,DOCS,state,DATA,stats};
}
const e=rig(input.next),carry={};let checks=0;
function check(name,fn){fn();checks++;}
check('native unchanged carry deliberately reuses the index',()=>{
 e.api.carry(carry,()=>assert.equal(e.api.query('B').has('one'),true));const builds=e.stats.builds,numbers=e.stats.numbers;
 e.api.carry(carry,()=>assert.equal(e.api.query('B').has('one'),true));assert.equal(e.stats.builds,builds);assert.equal(e.stats.numbers,numbers);
});
check('native save invalidates an existing carry between frames',()=>{
 e.S.assets[0].numbers=['two'];e.api.save();e.api.carry(carry,()=>{assert.equal(e.api.query('B').has('one'),false);assert.equal(e.api.query('B').has('two'),true);});
});
check('native save inside the carried frame refreshes the next query',()=>{
 e.api.carry(carry,()=>{assert.equal(e.api.query('B').has('two'),true);e.S.assets[0].numbers=['three'];e.api.save();assert.equal(e.api.query('B').has('two'),false);assert.equal(e.api.query('B').has('three'),true);});assert.equal(carry.context,null);
});
check('native received record invalidates a remembered frame',()=>{
 e.api.carry(carry,()=>e.api.query('B'));e.S.assets[0].numbers=['four'];e.api.receive();e.api.carry(carry,()=>{assert.equal(e.api.query('B').has('three'),false);assert.equal(e.api.query('B').has('four'),true);});
});
check('native hydration inside a frame refreshes immediately',()=>{
 e.api.carry(carry,()=>{e.S.assets[0]._cancelled=true;e.api.receive();assert.equal(e.api.query('B').has('four'),false);});assert.equal(carry.context,null);
 e.S.assets[0]._cancelled=false;e.api.receive();
});
check('native context rejects carries after day, files or view changes',()=>{
 for(const change of [()=>e.stats.day='2030-10-27',()=>e.DOCS.at++,()=>e.DOCS.files={},()=>e.state.tab='today']){
  e.api.carry(carry,()=>e.api.query('B'));const builds=e.stats.builds;change();e.api.carry(carry,()=>e.api.query('B'));assert.ok(e.stats.builds>builds);
 }
});
check('exact EventConfig change invalidates the native held index in the same frame',()=>{
 e.api.carry(carry,()=>{e.api.query('B');const builds=e.stats.builds;e.DATA.charge_basis.event_days[1]='2030-10-27';e.S.assets[0].numbers=['five'];assert.equal(e.api.query('B').has('four'),false);assert.equal(e.api.query('B').has('five'),true);assert.ok(e.stats.builds>builds);});assert.equal(carry.context,null);
});
check('native lifecycle is a failing staleness control for the old TTL',()=>{
 const old=rig(input.old),c={};old.api.carry(c,()=>assert.equal(old.api.query('B').has('one'),true));old.S.assets[0].numbers=['new'];old.api.save();old.api.carry(c,()=>{assert.equal(old.api.query('B').has('one'),true);assert.equal(old.api.query('B').has('new'),false);});
});
console.log(JSON.stringify({passed:checks}));
"""


class IdentityIndexTests(unittest.TestCase):
    def test_exact_patch_and_refusals(self):
        text = 'prefix\n' + PATCH.OLD + '\nsuffix'
        result = PATCH.patch(text, 'synthetic.html')
        self.assertEqual(result, 'prefix\n' + PATCH.NEW + '\nsuffix')
        for source in (result, text + PATCH.OLD, text.replace('ELSE_AT = 0', 'ELSE_AT = 1'), 'unrelated'):
            with self.assertRaises(ValueError):
                PATCH.patch(source, 'synthetic.html')

    def test_identity_and_freshness(self):
        result = subprocess.run(['node', '-e', NODE], input=json.dumps({'oldSource': PATCH.OLD, 'newSource': PATCH.NEW}), text=True, capture_output=True, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout), {'passed': 15})

    @unittest.skipUnless(os.environ.get('BASE'), 'BASE is required for exact native lifecycle extraction')
    def test_exact_native_hold_carry_save_and_hydration(self):
        page = Path(os.environ['BASE']).read_text()
        start = page.index('let ASSETS_HELD = null;')
        end = page.index('function generatorPlace1004()', start)
        # Stop before the following source-data comment, retaining only native helpers.
        native = page[start:page.rfind('/* Author:', start, end)]
        save_start = page.index('function save(){ REC_EPOCH1066++;')
        save = page[save_start:page.index('\nfunction save775Inner()', save_start)]
        receive_start = page.index('function sharedCache975(){')
        hydration = page[receive_start:page.index('\nfunction syncFold(', receive_start)]
        config_start = page.index('const EventConfig1013 = (() => {')
        config = page[config_start:page.index("if(typeof window!=='undefined')window.EventConfig1013", config_start)]
        result = subprocess.run(['node', '-e', NATIVE_NODE], input=json.dumps({'native': native, 'save': save, 'hydration': hydration, 'config': config, 'old': PATCH.OLD, 'next': PATCH.NEW}), text=True, capture_output=True, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout), {'passed': 8})


if __name__ == '__main__':
    unittest.main()
