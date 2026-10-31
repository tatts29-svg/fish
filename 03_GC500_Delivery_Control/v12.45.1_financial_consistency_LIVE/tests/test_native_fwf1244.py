"""Author: Andrew Fisher. Differential test of the actual patched native tick function.

Synthetic assets only. No browser, network, production record or generated HTML is
committed. Each candidate must pass the separate frozen-native-record browser gate.
"""
import hashlib, importlib.util, json, os, pathlib, subprocess, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch451',ROOT/'patch_v12451.py');patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)

def ticks(text):
    start=text.index('function pl760Ticks(){')
    return text[start:text.index('/* the By branch table of the P&L:',start)]

class Native(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.base=pathlib.Path(os.environ['BASE']).read_text()
  cls.candidate=patch.patch(cls.base,expected_base_sha=hashlib.sha256(cls.base.encode()).hexdigest())

 def test_native_function(self):
  payload={'before':ticks(self.base),'after':ticks(self.candidate),'module':str(ROOT/'fwf_labour1244.js')}
  script=r'''
const assert=require('node:assert/strict'),vm=require('node:vm');
const data=JSON.parse(require('fs').readFileSync(0,'utf8'));
const api=require(data.module),source=[{rental_contract:'9968955',line:146,branch_code:'KINP',quantity:1,price:12000},{rental_contract:'9994954',line:23,branch_code:'KINP',quantity:1,price:4762.40}];
const a=(key,branch,lines,extra={})=>({key,branch,lines,...extra});
const lab=(item,qty,ticked,extra={})=>({item,labour:{ticked,qty,total:1,...extra}});
const assets=[
 a('SYN-FWF','KINP',[lab('FWF',5,[{key:'install',rate:10.01},{key:'demob',rate:20.02}])]),
 a('SYN-FWF-UNITS','KINP',[lab('FWF',3,[{key:'install',rate:3.337},{key:'demob',rate:3.337}],{perBuilding:true,units:[{unit:'one',ticked:[{key:'install',rate:3.337},{key:'demob',rate:3.337}]},{unit:'rest',ticked:[{key:'install',rate:3.337},{key:'demob',rate:3.337}]}]})]),
 a('SYN-OTHER','STPS',[lab('Other',3,[{key:'install',rate:0.335},{key:'cleaning',rate:0.335},{key:'fire_ext',rate:1.005,n:2,fire914:true}])]),
 a('SYN-UNKNOWN','KINP',[lab('Other',1,[{key:'install',rate:1}],{total:null})]),
 a('SYN-HELD','KINP',[lab('FWF',100,[{key:'install',rate:100}])]),
 a('SYN-CANCELLED','KINP',[lab('FWF',100,[{key:'install',rate:100}])],{_cancelled:true}),
 a('SYN-REST','KINP',[lab('FWF',100,[{key:'install',rate:100}])],{rest_of:'parent'})
];
function freeze(o){for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);}freeze(assets);freeze(source);
function run(text){const context={PL760_GROUP:{install:'install',demob:'install',steps:'install',levelling:'install',cleaning:'cleaning',fire_ext:'fire_ext'},allAssets:()=>assets,assetTotal:a=>a,branchOf:key=>({code:assets.find(a=>a.key===key).branch}),NotChargedHere1152:{has:key=>key==='SYN-HELD'},labourRestN:()=>2,LAB_REST:'rest',VmsInstallation1228:{model:()=>({slots:[{branch:'STPS',value:12.35}]})},ONHIRE_ROWS:source,FwfLabour1244:api};vm.createContext(context);return JSON.parse(JSON.stringify(vm.runInContext(text+'\npl760Ticks()',context)));}
const before=run(data.before),after=run(data.after),delta=after.fwf1244.delta;
assert.equal(after.fwf1244.recorded,170.17,'native bulk and rest-unit FWF amounts rounded by each native charge line');
assert.equal(after.fwf1244.approved,16762.4);
assert.equal(after.total,Math.round((before.total+delta)*100)/100);
assert.equal(after.install.amount,Math.round((before.install.amount+delta)*100)/100);
assert.equal(after.byBranch.KINP.install.amount,Math.round((before.byBranch.KINP.install.amount+delta)*100)/100);
assert.deepEqual(after.byBranch.STPS,before.byBranch.STPS);
for(const kind of ['cleaning','fire_ext','other'])assert.deepEqual(after[kind],before[kind]);
for(const k of ['ticks','unknown'])assert.equal(after[k],before[k]);
assert.equal(after.install.ticks,before.install.ticks);
assert.equal(after.install.unknown,before.install.unknown);
console.log('13 native FWF differential checks PASS');
'''
  completed=subprocess.run(['node','-e',script],input=json.dumps(payload),text=True,capture_output=True)
  self.assertEqual(completed.returncode,0,completed.stdout+completed.stderr)
  print(completed.stdout.strip())

 def test_existing_holds_filter_only_financial_slots(self):
  def plan(text):
   start=text.index('labourPlan=function(){');return text[start:text.index('labourRevenue858=function(){',start)]
  script=r'''
const assert=require('node:assert/strict'),vm=require('node:vm'),data=JSON.parse(require('fs').readFileSync(0,'utf8'));
const physical=[{key:'TEST-HELD',fire:{host:{item:'Building',discipline:'Buildings'},rate:7.13,n:2,amount:14.26,last:{}}},{key:'TEST-ALLOWED',fire:{host:{item:'Building',discipline:'Buildings'},rate:7.13,n:1,amount:7.13,last:{}}}];
const before=JSON.stringify(physical);
function run(text){const context={FinanceRequest996:{assets:()=>physical},movedAway:()=>false,branchOf:()=>({code:'KINP'}),fire914Of:a=>a.fire,chargeLines:()=>[],VmsInstallation1228:{model:()=>({slots:[]})},RENDER_MEMO:new Map(),OnsiteCharges1006:{cents:n=>Math.round(n*100)/100},NotChargedHere1152:{has:key=>key==='TEST-HELD'},FwfLabour1244:require(data.module),pl760Ticks:()=>({fwf1244:{applied:false,delta:0}})};vm.createContext(context);return JSON.parse(JSON.stringify(vm.runInContext(text+'labourPlan()',context)));}
const original=run(data.before),candidate=run(data.after);
assert.equal(original.all.charged,21.39);assert.equal(candidate.all.charged,7.13);
assert.deepEqual(candidate.slots,original.slots.filter(s=>s.ref!=='TEST-HELD'));
assert.equal(candidate.slots[0].key,'fire_ext');assert.equal(candidate.slots[0].branch,'KINP');
assert.equal(JSON.stringify(physical),before,'Physical equipment and fire records unchanged');
console.log('6 native held-reference financial-only checks PASS');
'''
  completed=subprocess.run(['node','-e',script],input=json.dumps({'before':plan(self.base),'after':plan(self.candidate),'module':str(ROOT/'fwf_labour1244.js')}),text=True,capture_output=True)
  self.assertEqual(completed.returncode,0,completed.stdout+completed.stderr)
  print(completed.stdout.strip())

 def test_combined_adjustment_keeps_demob_partial(self):
  start=self.candidate.index('function acc761Labour(){')
  end=self.candidate.index(' const race = (moneySummary().charge || {}).race || null;',start)
  snippet=self.candidate[start:end]+' return {demob,install:groups.install,movedCharged};}'
  script=r'''
const vm=require('node:vm'),assert=require('node:assert/strict'),source=require('fs').readFileSync(0,'utf8');
const group=amount=>({amount,ticks:amount?2:0,unknown:0});
const context={labourPlan:()=>({slots:[{key:'install',state:'charged',value:50},{key:'demob',state:'charged',value:50}]}),pl760Ticks:()=>({install:group(101),cleaning:group(0),fire_ext:group(0),other:group(0),fwf1244:{applied:true,delta:1}})};
vm.createContext(context);const result=vm.runInContext(source+'\nacc761Labour()',context);
assert.equal(result.demob.total,50);assert.equal(result.demob.complete,false);assert.equal(result.movedCharged,0);assert.equal(result.demob.movedSplitUnknown,false);assert.equal(result.demob.approvedCombinedSplitUnknown1244,true);
console.log('5 native unsplit demob checks PASS');
'''
  completed=subprocess.run(['node','-e',script],input=snippet,text=True,capture_output=True)
  self.assertEqual(completed.returncode,0,completed.stdout+completed.stderr)
  print(completed.stdout.strip())

if __name__=='__main__':unittest.main()
