"""Author: Andrew Fisher. Native alignment observer, synthetic records and DOM.

BASE is the reviewed HTML. No browser, network, private fixtures or writes.
The original exact module is the visible-output and financial-selection oracle.
"""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess


path = Path(__file__).resolve().parent.parent / 'startup_alignment1243_patch.py'
spec = importlib.util.spec_from_file_location('startup_alignment1243_patch', path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
base = Path(os.environ['BASE']).read_text()
after = mod.patch(base, 'synthetic-alignment.html')
checks = []


def refuse(text, label):
    try:
        mod.patch(text, 'synthetic-alignment.html')
    except ValueError:
        checks.append(label)
    else:
        raise AssertionError(label)


refuse(after, 'Repeated patch refuses')
for old in [mod.COSTS_OLD, mod.RUN_OLD]:
    refuse(base.replace(old, '', 1), 'Missing target refuses')
    refuse(base + old, 'Duplicate target refuses')
refuse(base.replace('id="performance1241-script"', 'id="other-script"', 1),
       'Missing required performance release refuses')
assert after.replace(mod.COSTS_NEW, mod.COSTS_OLD).replace(mod.RUN_NEW, mod.RUN_OLD) == base
checks.append('Only the two visibility guards change')


def source(text):
    return re.search(r'<script id="align1055-script">([\s\S]*?)</script>', text).group(1)


go = base.split('function go776Held(tab){', 1)[1].split('/* ------------------------------------------------------------------ today', 1)[0]
assert go.index("p.classList.toggle('on', on)") < go.index('try { render(); }')
assert "$('#pane-costs').innerHTML = paneHeadingHtml('costs')" in base
subviews = base.split('function financeSubView857() {', 1)[1].split('function financeOperational857()', 1)[0]
assert subviews.count('costs.innerHTML=') == 4
checks.append('Native navigation activates Costs before rendering; summary and every subview replace children')

program = r"""
const assert=require('node:assert/strict'), vm=require('node:vm'), fs=require('node:fs');
const source=JSON.parse(fs.readFileSync(0,'utf8')), checks=[];
const plain=x=>JSON.parse(JSON.stringify(x));
function check(name,fn){fn();checks.push(name);}
function fixture(code,{active=false,drawerOpen=false,ready='complete',existing=false}={}){
 const frames=[], listeners={}, observers=[], stats={all:0,models:0,holds:0,inserts:0,drawerInserts:0};
 const assets=[{key:'B1',discipline:'Portable buildings'},{key:'B2',discipline:'Other'}];
 const units=[{physical:true,active:true,item:'office',owner:'coates',assetNo:'SITE-A'}];
 const contracts=[{asset_no:'BP-A',asset_no_is_plant_number:true,match:{to:'asset',key:'B1'},register_type:'office',status_as_written:'delivered',rental_contract:'SYNTHETIC',line:'1',rate_1:1}];
 const out={costs:[],drawer:[]};
 const notify=target=>observers.filter(x=>x.target===target).forEach(x=>x.callback([{type:'childList',target}]));
 const classes=new Set(active?['on']:[]),drawerClasses=new Set(drawerOpen?['on']:[]);
 let marker=existing,drawerMarker=false;
 const costs={classList:{contains:k=>classes.has(k)},querySelector:q=>q==='#align1055'&&marker?{}:null,
  insertAdjacentHTML(pos,html){stats.inserts++;out.costs.push([pos,html]);marker=true;notify(costs);},
  set innerHTML(html){marker=false;out.costs=[];notify(costs);}};
 const cmp={querySelector:q=>q==='[data-light]'?{dataset:{light:'B1'}}:null,
  insertAdjacentHTML(pos,html){stats.drawerInserts++;out.drawer.push([pos,html]);drawerMarker=true;notify(drawer);}};
 const drawer={classList:{contains:k=>drawerClasses.has(k)},querySelector(q){if(q==='.cmp816')return cmp;if(q.startsWith('.align1055['))return drawerMarker?{}:null;return null;},querySelectorAll(){return[];}};
 const document={readyState:ready,getElementById:id=>id==='pane-costs'?costs:id==='drawer'?drawer:null,
  addEventListener:(k,fn)=>listeners[k]=fn,createElement:()=>({}),head:{appendChild(){}}};
 const W={document,ItemIdentity979:{select(){return[];}}};
 const sandbox={window:W,document,console,Set,Map,Intl,ONHIRE_ROWS:contracts,
  MutationObserver:class{constructor(callback){this.callback=callback;}observe(target,options){observers.push({target,options,callback:this.callback});}},
  requestAnimationFrame:fn=>frames.push(fn),holdAssets:fn=>{stats.holds++;return fn();},
  allAssets:()=>{stats.all++;return assets;},assetOf:k=>assets.find(a=>a.key===k),assetNumbersOf:a=>a.key==='B1'?['SITE-A']:[],
  heldMemo:(key,fn)=>fn(),gcModel925:a=>{stats.models++;return{rows:units};},chargeLines:()=>[{item:'office'}]};
 vm.createContext(sandbox);vm.runInContext(code,sandbox);
 function flush(){let n=0;while(frames.length){if(++n>20)throw Error('observer loop');frames.shift()();}}
 return {stats,out,frames,observers,costs,classes,drawer,drawerClasses,W,contracts,units,assets,notify,flush,
  load(){listeners.DOMContentLoaded();},open(){classes.add('on');costs.innerHTML='synthetic native Costs render';flush();},
  refresh(){costs.innerHTML='synthetic native refreshed Costs render';flush();}};
}
check('Original hidden-startup negative control performs the needless full scan',()=>{
 const x=fixture(source.before);x.flush();assert.equal(x.stats.models,1);assert.equal(x.stats.inserts,1);
});
check('Hidden startup avoids full scan, hold and DOM insertion',()=>{
 const x=fixture(source.after);x.flush();assert.equal(x.stats.all,0);assert.equal(x.stats.models,0);assert.equal(x.stats.holds,0);assert.equal(x.stats.inserts,0);
});
check('First Costs opening after hidden startup shows exact original report',()=>{
 const a=fixture(source.before),b=fixture(source.after);a.flush();b.flush();a.open();b.open();assert.deepEqual(b.out.costs,a.out.costs);assert.equal(b.stats.models,1);assert.equal(b.stats.inserts,1);
});
check('Direct Costs opening shows exact original report from DCL',()=>{
 const a=fixture(source.before,{active:true,ready:'loading'}),b=fixture(source.after,{active:true,ready:'loading'});assert.equal(b.frames.length,0);a.load();b.load();a.flush();b.flush();assert.deepEqual(b.out.costs,a.out.costs);assert.equal(b.stats.models,1);
});
check('Repeated observer callbacks coalesce and the inserted report does not recurse',()=>{
 const x=fixture(source.after,{active:true});x.notify(x.costs);x.notify(x.costs);assert.equal(x.frames.length,1);x.flush();assert.equal(x.stats.models,1);assert.equal(x.stats.inserts,1);
});
check('Leaving before queued frame avoids a hidden scan; reopening resolves it',()=>{
 const x=fixture(source.after,{active:true});x.classes.delete('on');x.flush();assert.equal(x.stats.models,0);x.open();assert.equal(x.stats.models,1);assert.equal(x.stats.inserts,1);
});
check('Active Costs refresh uses current source and matches original',()=>{
 const a=fixture(source.before,{active:true}),b=fixture(source.after,{active:true});a.flush();b.flush();
 for(const x of [a,b]){x.contracts.push({...x.contracts[0],line:'2',asset_no:'BP-B'});x.units.push({...x.units[0],assetNo:'SITE-B'});x.refresh();}
 assert.deepEqual(b.out.costs,a.out.costs);assert.match(b.out.costs[0][1],/BP-B/);assert.equal(b.stats.models,2);
});
check('Existing retained report is not scanned or inserted again on class-only reveal',()=>{
 const x=fixture(source.after,{existing:true});x.flush();x.classes.add('on');x.flush();assert.equal(x.stats.models,0);assert.equal(x.stats.inserts,0);
});
check('Open drawer retains exact per-reference report without scanning hidden Costs',()=>{
 const a=fixture(source.before,{drawerOpen:true}),b=fixture(source.after,{drawerOpen:true});a.flush();b.flush();assert.deepEqual(b.out.drawer,a.out.drawer);assert.equal(b.stats.drawerInserts,1);assert.equal(b.stats.inserts,0);assert.equal(b.stats.models,1);
});
check('Explicit scan remains eager while Costs is hidden',()=>{
 const a=fixture(source.before),b=fixture(source.after);const A=a.W.align1055.scan(),B=b.W.align1055.scan();assert.deepEqual(plain([...B]),plain([...A]));assert.equal(b.stats.models,1);assert.equal(B.size,1);
});
check('Financial identity selection and return contents are unchanged before any scan',()=>{
 const a=fixture(source.before),b=fixture(source.after);const A=a.W.ItemIdentity979.select('B1','office',a.contracts,a.units),B=b.W.ItemIdentity979.select('B1','office',b.contracts,b.units);assert.deepEqual(plain(B),plain(A));assert.equal(B[0].asset_no,'BP-A');assert.equal(B[0].siteNumber1055,'SITE-A');assert.deepEqual(plain(b.contracts),plain(a.contracts));
});
check('Closing drawer and hidden Costs performs no follow-up work',()=>{
 const x=fixture(source.after,{drawerOpen:true});x.flush();const before={...x.stats};x.drawerClasses.delete('on');x.notify(x.drawer);x.flush();assert.deepEqual(x.stats,before);
});
process.stdout.write(JSON.stringify(checks));
"""
result = subprocess.run(['node', '-e', program], input=json.dumps({'before': source(base), 'after': source(after)}),
                        text=True, capture_output=True, check=True)
checks.extend(json.loads(result.stdout))
for item in checks:
    print('PASS', item)
print(f'{len(checks)}/{len(checks)} passed')
