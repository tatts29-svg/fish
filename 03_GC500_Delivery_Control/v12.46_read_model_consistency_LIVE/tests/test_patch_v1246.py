"""Author: Andrew Fisher. Patch boundaries and actual native functions, synthetic records."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('patch46', ROOT / 'patch_v1246.py')
patch46 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch46)

class Patch(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = Path(os.environ['BASE']).read_text()
        cls.version = os.environ['BASE_VERSION']
        cls.sha = hashlib.sha256(cls.base.encode()).hexdigest()
        cls.candidate = patch46.patch(cls.base, expected_base_sha=cls.sha, expected_base_version=cls.version)

    def test_boundaries(self):
        with self.assertRaises(ValueError):
            patch46.patch(self.base)
        with self.assertRaises(ValueError):
            patch46.patch(self.base, expected_base_sha='0' * 64, expected_base_version=self.version)
        with self.assertRaises(ValueError):
            patch46.patch(self.base + ' ', expected_base_sha=self.sha, expected_base_version=self.version)
        with self.assertRaises(ValueError):
            patch46.patch(self.base, expected_base_sha=self.sha, expected_base_version='12.42.24')
        with self.assertRaises(ValueError):
            patch46.patch(self.base, expected_base_sha=self.sha, expected_base_version='12.45.999')
        with self.assertRaises(ValueError):
            patch46.patch(self.candidate, expected_base_sha=hashlib.sha256(self.candidate.encode()).hexdigest(), expected_base_version='12.45')
        self.assertIn("+' · v12.46';", self.candidate)
        restored = self.candidate.replace((ROOT / 'read_model1246.js').read_text() + '\n' + patch46.REPLACEMENT, patch46.UNIT).replace("+' · v12.46';", "+' · v" + self.version + "';")
        self.assertEqual(restored, self.base, 'only bounded association helper, unit reader and footer change')

    def test_actual_native_functions(self):
        def native(text):
            start = text.index(' function unit(key,id,day,item){')
            end = text.index(' function all(){', start)
            return text[start:end]

        data = {'before': native(self.base), 'after': native(self.candidate), 'module': str(ROOT / 'read_model1246.js')}
        script = r'''
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(0,'utf8')),api=require(data.module);
const row={id:'new-key',ref:'SYN-A',owner:'coates',assetNo:'123',item:'VMS',physical:true,slot:false,source:'native',nativeId:'native:synthetic'};
const other={...row,id:'other-key',assetNo:'1234',nativeId:'native:other'};
const event={id:'synthetic-event',items:[{type:'VMS',n:1,unitIds:['old-key'],physicalUnits:[{id:'old-key',owner:'coates',number:'123',item:'VMS'}]}]};
const reading={recorded:true,issues:[],required:[{type:'VMS',n:2}],remaining:[{type:'VMS',n:1}],events:[event],complete:false};
let checks=0;const same=(a,b,label)=>{assert.strictEqual(a,b,label);checks++;};
function run(source,input=reading,rows=[row,other],fault=false){
 let reads=0;const memo=new Map(),ctx={normal:s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' '),list:x=>Array.isArray(x)?x:[],read:()=>input,ReadModel1246:api,
 assetOf:key=>key==='SYN-A'?{key}:null,gcUnits925:()=>{reads++;if(fault)throw Error('synthetic unavailable');return rows;},heldMemo:(k,f)=>{if(!memo.has(k))memo.set(k,f());return memo.get(k);}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,reads:()=>reads};
}
same(run(data.before).ctx.unit('SYN-A','new-key',undefined,'VMS'),null,'unmodified native reader reproduces missed canonical ID');
const changed=run(data.after);
same(changed.ctx.unit('SYN-A','new-key',undefined,'VMS'),event,'patched native reader finds exact typed evidence');
same(changed.ctx.unit('SYN-A','other-key',undefined,'VMS'),null,'uncollected exact-number neighbour stays');
const model={rows:[row,other],groups:[{label:'unchanged'}]},snapshot=JSON.stringify(model);
const projected=changed.ctx.remainingModel({key:'SYN-A'},model);
same(projected.rows.length,1,'remaining model removes only the confirmed physical row');
same(projected.rows[0],other,'remaining model keeps the other row object');
same(projected.groups,model.groups,'unrelated model fields retained');
same(JSON.stringify(model),snapshot,'native model not mutated');
same(changed.reads(),1,'existing per-render memo reuses physical identities');
const legacy=run(data.after);
same(legacy.ctx.unit('SYN-A','old-key',undefined,'VMS'),event,'legacy direct ID still resolves original event');
same(legacy.reads(),0,'legacy direct ID does not add an identity scan');
same(run(data.after,{...reading,issues:['review required']}).ctx.unit('SYN-A','new-key',undefined,'VMS'),null,'evidence issue still blocks native reader');
same(run(data.after,reading,[]).ctx.unit('SYN-A','new-key',undefined,'VMS'),null,'removed canonical row does not infer departure');
same(run(data.after,reading,[{...row,assetNo:'replacement'}]).ctx.unit('SYN-A','new-key',undefined,'VMS'),null,'replacement identity is not removed');
same(run(data.after,reading,[row,{...row,id:'duplicate'}]).ctx.unit('SYN-A','new-key',undefined,'VMS'),null,'duplicate native identity stays unresolved');
same(run(data.after,reading,[row],true).ctx.unit('SYN-A','new-key',undefined,'VMS'),null,'identity read failure cannot break the native view');
const typed={...reading,remaining:[{type:'VMS',n:0}]};
same(run(data.after,typed,[]).ctx.unit('SYN-A','unidentified',undefined,'VMS'),event,'existing complete-type rule retained');
const complete={...reading,complete:true};
same(run(data.after,complete,[]).ctx.unit('SYN-A','unidentified',undefined,'Unknown'),event,'existing complete-reference rule retained');
const empty={...reading,events:[]};
const noEvidence=run(data.after,empty);
same(noEvidence.ctx.unit('SYN-A','new-key',undefined,'VMS'),null,'no event means no departure');
same(noEvidence.reads(),0,'no event means no new identity scan');
console.log(checks+' actual native read-model checks PASS');
'''
        result = subprocess.run(['node', '-e', script], input=json.dumps(data), text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        print(result.stdout.strip())

if __name__ == '__main__':
    unittest.main()
