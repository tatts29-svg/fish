"""Author: Andrew Fisher. Differential local-read checks against native source.

BASE names the reviewed HTML. Synthetic records only; no browser or network.
"""
import importlib.util
import json
import os
from pathlib import Path
import subprocess


patch_file = Path(__file__).resolve().parent.parent / 'local_reads1243_patch.py'
spec = importlib.util.spec_from_file_location('local_reads1243_patch', patch_file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
base = Path(os.environ['BASE']).read_text()
patched = module.patch(base, 'synthetic-local-reads.html')
checks = []
for old, new, label in module.CHANGES:
    for invalid, reason in ((base.replace(old, '', 1), 'missing'), (base + old, 'duplicate')):
        try:
            module.patch(invalid, 'synthetic-local-reads.html')
        except ValueError:
            checks.append(reason + ' exact target refuses: ' + label)
        else:
            raise AssertionError(reason + ': ' + label)
for invalid, reason in ((patched, 'Repeated patch'),
                        (base.replace('id="performance1241-script"', 'id="other-script"', 1), 'Missing performance release')):
    try:
        module.patch(invalid, 'synthetic-local-reads.html')
    except ValueError:
        checks.append(reason + ' refuses')
    else:
        raise AssertionError(reason)
restored = patched
for old, new, label in reversed(module.CHANGES):
    restored = restored.replace(new, old)
assert restored == base
checks.append('Only the seven exact local-read targets change')


def between(text, start, end):
    return start + text.split(start, 1)[1].split(end, 1)[0]


def fragments(text):
    tick = between(text, 'function labourTicked(', '/* how many of a reference')
    lines = between(text, 'function labourLinesFor914base(', '/* The labour money on one charge line.')
    branch = between(text, 'function fh866RevenueBranch(', 'function poReceiptIssue982(')
    prefix = between(text, 'function fh866Model(){', 'const poSum =')
    return {'labour': tick + '\n' + lines, 'branch': branch,
            'model': prefix + 'return {pos, FBR, TBR};\n}'}


program = r"""
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=JSON.parse(fs.readFileSync(0,'utf8')),checks=[];
const plain=v=>JSON.parse(JSON.stringify(v));
function check(name,run){run();checks.push(name);}
function labour(code,setting={}){
 const cfg={units:['unit-a','unit-b'],ticks:{},by:{},stamps:{},moved:false,fire:0,hasAsset:true,rate:true,...setting};
 const counts={units:0,assets:0,who:0},asset={key:'REF'};
 const cardLines=cfg.lines||['install','cleaning','demob'].map((key,i)=>({key,name:key,heading:key,rate:10+i,money:'rate',year:2026,of_this_year:true}));
 const key=(ref,disc,item,line,unit)=>[ref,disc,item,line,unit||''].join('|');
 const s={cfg,counts,asset,S:{labour:cfg.ticks,by:cfg.by,stamps:cfg.stamps},
  movedAway:()=>cfg.moved,fire914Qty:()=>cfg.fire,labourKey:key,
  allAssets(){counts.assets++;return cfg.hasAsset?[asset]:[];},
  labourUnits(a,item){counts.units++;assert.equal(a,asset);assert.equal(item,'FWF');if(cfg.unitError)throw new Error(cfg.unitError);return cfg.units;},
  labourWho(ref,disc,item,line,unit){counts.who++;if(cfg.whoError)throw new Error(cfg.whoError);const k=key(ref,disc,item,line,unit);return {by:s.S.by[k]||null,at:s.S.stamps[k]||null};},
  cardRate:()=>cfg.rate?{labour_per_piece:{state:'priced',note:'synthetic',lines:cardLines,agreed_from:'source',spread:null}}:null,
  gn20Install746:(ref,disc,item,lp)=>lp};
 vm.createContext(s);vm.runInContext(code,s);s.run=(unit,explicitAsset=true)=>s.labourLinesFor914base('REF','Toilets','FWF','REF',unit,explicitAsset?asset:undefined);
 return s;
}
const key=(line,unit)=>['REF','Toilets','FWF',line,unit||''].join('|');
const cases=[
 ['no aggregate ticks',{},undefined],
 ['partial aggregate unit ticks',{ticks:{[key('install','unit-a')]:true,[key('demob','unit-a')]:true,[key('demob','unit-b')]:true}},undefined],
 ['reference-level ticks',{ticks:Object.fromEntries(['install','cleaning','demob'].map(k=>[key(k),true]))},undefined],
 ['per-unit ticks with legacy fallback',{ticks:{[key('install','unit-a')]:true,[key('cleaning')]:true}},'unit-a'],
 ['moved reference',{moved:true},undefined],
 ['added extinguisher suppresses ordinary tick',{fire:1,lines:[{key:'fire_ext',name:'fire_ext',rate:12,money:'rate'}]},undefined],
 ['empty unit list',{units:[]},undefined],
 ['no matching asset',{hasAsset:false},undefined,false],
 ['no card rate',{rate:false},undefined],
 ['empty card',{lines:[]},undefined],
 ['withheld card lines remain represented',{lines:[{key:'install',name:'install',rate:3,money:'rate'},{key:'steps',name:'steps',rate:0,money:'included'},{key:'cleaning',name:'cleaning',rate:null,money:'absent'}]},undefined]
];
for(const [name,cfg,unit,explicit]of cases)check('Native labour result preserved: '+name,()=>{
 const a=labour(source.before.labour,plain(cfg)),b=labour(source.after.labour,plain(cfg));
 assert.deepEqual(plain(b.run(unit,explicit!==false)),plain(a.run(unit,explicit!==false)));
 if(['reference-level ticks','per-unit ticks with legacy fallback','moved reference','added extinguisher suppresses ordinary tick','no matching asset','no card rate','empty card'].includes(name))assert.equal(b.counts.units,0);
});
check('Aggregate card checks resolve units once, not once per card line',()=>{
 const a=labour(source.before.labour),b=labour(source.after.labour);a.run();b.run();assert.equal(a.counts.units,3);assert.equal(b.counts.units,1);
});
check('Default/absent optional resolver paths retain native public labourTicked result',()=>{
 const a=labour(source.before.labour),b=labour(source.after.labour);
 for(const resolver of [undefined,null,false,{}])assert.equal(b.labourTicked('REF','Toilets','FWF','install',undefined,b.asset,resolver),a.labourTicked('REF','Toilets','FWF','install',undefined,a.asset));
 assert.equal(b.counts.units,4);
});
check('Lazy resolution failures retain native error type/message and timing',()=>{
 for(const cfg of [{unitError:'unit-source unavailable'},{whoError:'stamp-source unavailable'}]){
  const a=labour(source.before.labour,cfg),b=labour(source.after.labour,cfg),capture=s=>{try{s.run();return null;}catch(e){return {name:e.name,message:e.message};}};
  assert.deepEqual(capture(b),capture(a));assert.equal(b.counts.units,a.counts.units);assert.equal(b.counts.who,a.counts.who);
 }
});
check('Each later call sees ticks, attribution and unit-source changes immediately',()=>{
 const a=labour(source.before.labour),b=labour(source.after.labour);
 const compare=()=>assert.deepEqual(plain(b.run()),plain(a.run()));compare();
 for(const s of[a,b]){s.S.labour[key('install','unit-a')]=true;s.S.labour[key('install','unit-b')]=true;s.S.by[key('install')]='Recorder';s.S.stamps[key('install')]='current';}
 compare();for(const s of[a,b])s.cfg.units=['unit-a','unit-b','unit-c'];compare();
 for(const s of[a,b]){s.S.labour[key('install','unit-c')]=true;delete s.S.labour[key('install','unit-a')];}compare();
});
check('Mutating one returned labour result cannot contaminate the next result',()=>{
 const s=labour(source.after.labour),one=s.run();one.lines[0].ticked=true;one.lines[0].name='changed';one.withheld.push('changed');
 const two=s.run();assert.equal(two.lines[0].ticked,false);assert.equal(two.lines[0].name,'install');assert.equal(two.withheld.length,0);
});
function branches(code){
 const cfg={fencing:'BR-A',toilets:'BR-B',pos:[]},counts={fencing:0,toilets:0,norm:0};
 const s={cfg,counts,todayIso:()=> '2026-01-01',cj764Model:()=>({}),labourPlan:()=>({}),pl752Rows:()=>[],moneySummary:()=>({}),
  normBranch(v){counts.norm++;return String(v).trim().toUpperCase();},
  pl760FencingBranch(){counts.fencing++;if(cfg.error)throw new Error(cfg.error);return cfg.fencing;},
  pl760ToiletBranch(){counts.toilets++;return cfg.toilets;},poAll:()=>cfg.pos,
  fh866Receipt:()=>({key:'none',amount:0})};
 vm.createContext(s);vm.runInContext(code,s);return s;
}
check('Native default branch rules and explicit override priority remain exact',()=>{
 const a=branches(source.before.branch),b=branches(source.after.branch);
 for(const o of [{},{stream:''},{stream:'fencing'},{stream:'toilets'},{stream:'other'},{stream:'Fencing'},{stream:'other',revenue_branch:' manual '},{stream:'fencing',revenue_branch:''}]){
  for(const fallback of [undefined,null,{},Object.create({fencing:'inherited'})])assert.equal(b.fh866RevenueBranch(o,fallback),a.fh866RevenueBranch(o));
 }
});
check('Provided current branch choices retain null/empty values and avoid recalculation',()=>{
 const a=branches(source.before.branch),b=branches(source.after.branch);
 for(const value of ['BR-Z',null,''])for(const stream of ['fencing','toilets']){
  a.cfg[stream]=value;b.cfg[stream]=value;assert.equal(b.fh866RevenueBranch({stream},{[stream]:value}),a.fh866RevenueBranch({stream}));
 }
 assert.equal(b.counts.fencing,0);assert.equal(b.counts.toilets,0);
});
check('Explicit or unknown branches do not inspect fallback choices',()=>{
 const b=branches(source.after.branch),fallback=new Proxy({},{get(){throw new Error('unneeded fallback');},getOwnPropertyDescriptor(){throw new Error('unneeded fallback');}});
 assert.equal(b.fh866RevenueBranch({revenue_branch:' exact ',stream:'fencing'},fallback),'EXACT');
 assert.equal(b.fh866RevenueBranch({stream:'other'},fallback),null);assert.equal(b.counts.fencing,0);
});
check('Standalone branch resolution failures remain native',()=>{
 const a=branches(source.before.branch),b=branches(source.after.branch);a.cfg.error=b.cfg.error='branch unavailable';
 for(const s of[a,b])assert.throws(()=>s.fh866RevenueBranch({stream:'fencing'}),/branch unavailable/);
 for(const s of[a,b])assert.throws(()=>s.fh866RevenueBranch(null),/Cannot read properties of null/);
});
check('Finance PO projection matches original while resolving each fallback once',()=>{
 const a=branches(source.before.branch+source.before.model),b=branches(source.after.branch+source.after.model);
 const pos=[{stream:'fencing',branch:'BR-A'},{stream:'fencing'},{stream:'toilets'},{stream:'other'},{stream:'fencing',revenue_branch:' manual '}];
 a.cfg.pos=plain(pos);b.cfg.pos=plain(pos);assert.deepEqual(plain(b.fh866Model()),plain(a.fh866Model()));
 assert.equal(a.counts.fencing,3);assert.equal(b.counts.fencing,1);assert.equal(a.counts.toilets,2);assert.equal(b.counts.toilets,1);
});
check('Later Finance calls see changed fallback and explicit PO branches without a save',()=>{
 const a=branches(source.before.branch+source.before.model),b=branches(source.after.branch+source.after.model);
 for(const s of[a,b])s.cfg.pos=[{stream:'fencing'},{stream:'toilets'}];
 assert.deepEqual(plain(b.fh866Model()),plain(a.fh866Model()));
 for(const s of[a,b]){s.cfg.fencing='NEW-A';s.cfg.toilets='NEW-B';s.cfg.pos[1].revenue_branch=' own ';}
 assert.deepEqual(plain(b.fh866Model()),plain(a.fh866Model()));
});
process.stdout.write(JSON.stringify(checks));
"""
result = subprocess.run(['node', '-e', program], input=json.dumps({'before': fragments(base), 'after': fragments(patched)}),
                        capture_output=True, text=True)
assert result.returncode == 0, result.stderr
checks.extend(json.loads(result.stdout))
print(json.dumps({'author': 'Andrew Fisher', 'suite': 'local_reads1243 native differential controls',
                  'passed': len(checks), 'failed': 0, 'checks': checks}))
