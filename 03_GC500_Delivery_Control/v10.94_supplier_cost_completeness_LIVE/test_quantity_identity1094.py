#!/usr/bin/env python3
"""Author: Andrew Fisher. Exercise quantity-to-identity coverage and preserve discrepancy guards."""
import json
import re
import subprocess
import sys
from pathlib import Path

from quantity_identity1094 import apply

source = Path(sys.argv[1]).read_text()
patched = apply(source)
try:
    apply(patched)
    raise AssertionError('Repeated application must fail')
except ValueError:
    pass
for missing in ("function quantitySubhire964Key(ref,item){", " const quantityOnly=ref==='WC09'&&same(item,'Pee Panel');"):
    try:
        apply(source.replace(missing, '', 1))
        raise AssertionError('Missing predecessor anchor must fail')
    except ValueError:
        pass

start = patched.index('function quantitySubhireIdentified1094(')
end = patched.index('function quantitySubhire964Set(', start)
script = patched[start:end]
inventory = re.search(r'<script id="inventory960-script">([\s\S]*?)</script>', patched).group(1)
test = r"""
const assert=require('node:assert/strict'),vm=require('node:vm');
const c={};vm.createContext(c);vm.runInContext(INPUT.script+'\n'+INPUT.inventory,c);
const clone=x=>JSON.parse(JSON.stringify(x));
const qty={kind:'quantity-subhire964',schema:1,ref:'WC09',item:'Pee Panel',owner:'event-portables',quantity:6,quantityOnly:true,by:'Test operator',at:'2026-10-09T07:39:59Z'};
const key=c.quantitySubhire964Key('WC09','Pee Panel');
const units=Array.from({length:6},(_,i)=>({item:'Pee Panel',ref:'WC09',owner:'event-portables',assetNo:'TEST'+(i+1),id:'test-unit-'+i,physical:true,source:'record',active:true}));
const base={loads:{[key]:qty},day:'2026-10-20',asset:{key:'WC09'},lines:[{item:'Pee Panel',quantity:6}],progress:{quantity:6,arrived:6,done:6},units:[]};
const read=(rows,options={})=>c.quantitySubhire964Read('WC09','Pee Panel',{...base,...options,units:rows});
let n=0;const ok=(condition,message)=>{assert.ok(condition,message);n++;};
ok(read([]).valid,'existing quantity ownership remains valid');
const identified=read(units);
ok(!identified.valid&&identified.row===null&&!identified.reason&&identified.supersededByIndividualIdentities===true,'complete identities suppress only historical quantity projection');
ok(JSON.stringify(base.loads[key])===JSON.stringify(qty),'source ownership history unchanged');
for(const mutate of [
 x=>x.slice(0,5),x=>x.concat({...x[0],id:'extra',assetNo:'EXTRA'}),
 x=>{x[1].id=x[0].id;return x;},
 x=>{x[1].assetNo=x[0].assetNo.toLowerCase();return x;},
 x=>{x[0].assetNo='';return x;},x=>{x[0].id='';return x;},
 x=>{x[0].owner='coates';return x;},x=>{x[0].owner='unknown';return x;},
 x=>{x[0].ref='OTHER';return x;},x=>{x[0].physical=false;return x;},
 x=>{x[0].active=false;return x;},x=>{x[0].item='Other item';return x;}
]){
 const result=read(mutate(clone(units)));
 ok(!result.valid&&result.reason.includes('overlap')&&!result.supersededByIndividualIdentities,'partial or conflicting identities retain guard');
}
ok(read(units.map(x=>({...x,source:'history'}))).valid,'historic identities do not supersede current quantity');
ok(read(units,{progress:{quantity:6,arrived:5,done:6}}).reason.includes('reconciliation'),'receipt disagreement still blocks transition');
ok(read(units,{lines:[{item:'Pee Panel',quantity:5}]}).reason.includes('differs'),'quantity disagreement still blocks transition');
ok(!c.quantitySubhireIdentified1094('OTHER','Pee Panel',6,units,'event-portables'),'other references excluded');
ok(!c.quantitySubhireIdentified1094('WC09','Other',6,units,'event-portables'),'other item types excluded');
c.S={loads:base.loads}; c.assetOf=()=>base.asset;c.chargeLines=()=>base.lines;c.todayIso=()=>base.day;
c.deliveryAsOf=()=>({});c.toiletItem962=()=>base.progress;
let current=[];c.gcModel925=()=>({rows:current});
ok(c.quantitySubhire964List().rows.length===1&&c.quantitySubhire964List().issues.length===0,'quantity list before identities');
current=units;
ok(c.quantitySubhire964List().rows.length===0&&c.quantitySubhire964List().issues.length===0,'quantity list retires complete identities without warning');
current=units.slice(0,5);
ok(c.quantitySubhire964List().rows.length===0&&c.quantitySubhire964List().issues.length===1,'partial identities remain actionable');
const inventory=()=>({list:[{item:'Pee Panel',on:6,coates:0,nonum:0,unnum:true,sub:{'Event Portables':6},refs:{WC09:{key:'WC09',on:6,coates:0,sub:6,cos:{'Event Portables':6},nonum:0}}}]});
const model=rows=>({rows,groups:[{item:'Pee Panel',quantity:6},{item:'FWF',quantity:3}]});
const project=rows=>{current=rows;return c.Inventory960.reconcileInventory(inventory(),()=>model(rows),()=> 'Event Portables').list[0]};
let row=project([]);
ok(row.unnum&&row.refs.WC09.quantityOnly960&&row.on===6&&row.sub['Event Portables']===6,'quantity-only inventory before identity');
row=project(units);
ok(!row.unnum&&!row.refs.WC09.quantityOnly960&&row.on===6&&row.sub['Event Portables']===6&&row.nonum===0,'identified inventory preserves quantity and supplier without quantity-only label');
ok(!c.Inventory960.allocation(model(units), 'Other item', 6,()=> 'Event Portables','OTHER')?.quantityOnly,'other item scope unaffected');
console.log(JSON.stringify({assertions:n,passed:true,scope:'read-only full identity coverage and discrepancy guards'}));
"""
result = subprocess.run(['node', '-e', 'const INPUT='+json.dumps({'script': script, 'inventory': inventory})+';\n'+test],
                        text=True, capture_output=True)
print(result.stdout, end='')
if result.returncode:
    print(result.stderr, file=sys.stderr)
    raise SystemExit(result.returncode)
