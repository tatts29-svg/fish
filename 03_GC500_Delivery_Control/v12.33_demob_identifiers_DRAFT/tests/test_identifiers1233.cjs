// Author: Andrew Fisher. Exercise the actual Demob renderer and equipment predicate.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const base=fs.readFileSync(process.env.BASE,'utf8');
const patch=path.resolve(__dirname,'../patch_v1233.py');
const fragments=JSON.parse(execFileSync('python3',['-c',
 'import ast,json,sys; t=ast.parse(open(sys.argv[1]).read()); print(json.dumps({n.targets[0].id:ast.literal_eval(n.value) for n in t.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ("OLD","NEW")}))',patch],{encoding:'utf8'}));
const label=base.match(/  const LABEL = l =>[^\n]+/)[0];
const predicate=base.match(/const UNNUMBERED_RX = [^\n]+\nfunction unnumbered\(a\)[^\n]+/)[0];
let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}
function renderer(code,a,products,options={}){
 const context={a,products,chargeLines:x=>x.lines||[],assetOf:()=>a,
  W:{Loading931:{referenceProducts931:()=>{if(options.providerThrows)throw Error('unavailable');return products;}}},
  e1231:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.createContext(context);vm.runInContext(predicate+'\n'+label+'\n'+code,context);
 if(options.classifierThrows)vm.runInContext('unnumbered=()=>{throw Error("unavailable")}',context);
 if(options.noClassifier)vm.runInContext('unnumbered=undefined',context);
 return {specs:JSON.parse(vm.runInContext('JSON.stringify(specs({key:a.key,a}))',context)),html:vm.runInContext('specHtml({key:a.key,a})',context)};
}
const product=(item,ids=[],facts=[])=>({item,units:ids.map(assetNo=>({assetNo})),facts});
const facts=[{label:'Recorded actual',values:['6 m × 3 m']},{label:'Description rating',values:['60 kVA']},{label:'Guide reference model',values:['Model A'],pages:[1]}];
const bulk={key:'BULK',discipline:'Water-filled barriers',lines:[{item:'TL2'}]};
const ordinary={key:'ASSET',discipline:'Generators',lines:[{item:'60kva'}]};
const compare=(a,p,options)=>{const old=renderer(fragments.OLD,a,p,options),now=renderer(fragments.NEW,a,p,options);assert.deepEqual(now.specs.nos,old.specs.nos);assert.deepEqual(now.specs.facts,old.specs.facts);return {old,now};};

check('Water-filled barrier product code is retained with the correct label',()=>{const {now}=compare(bulk,[product('TL2',['ARMORZONMASHTL2'])]);assert(now.html.includes('Recorded code <b>ARMORZONMASHTL2</b>'));assert(!now.html.includes('Asset no.'));});
check('Bulk scope without identifiers reports Not numbered, not a missing asset',()=>{const {now}=compare(bulk,[product('TL2')]);assert(now.html.includes('Not numbered'));assert(now.html.includes('Size not on record'));assert(!now.html.includes('Asset no.'));});
check('Known dimensions retain their source wording without a missing-size warning',()=>{const {old,now}=compare(bulk,[product('TL2',[],facts)]);assert(now.html.includes('Not numbered'));assert(!now.html.includes('Size not on record'));assert.equal(now.html.match(/<div class="fx1231">.*?<\/div>/)[0],old.html.match(/<div class="fx1231">.*?<\/div>/)[0]);});
for(const item of ['Trakmat','Track mat','Ground protection'])check(item+' follows the existing unnumbered equipment rule',()=>{const a={key:'MAT',discipline:'Ground protection',lines:[{item}]};const {now}=compare(a,[product(item,['CODE-1'],facts)]);assert(now.html.includes('Recorded code <b>CODE-1'));assert(!now.html.includes('Asset no.'));});
for(const [item,ids] of [['60kva',['1277089']],['VMS',['V14221','M1234']],['FWF',['EP0141','A-19']],['Building 6m',[]]])check('Ordinary '+item+' output stays byte-identical',()=>{const a={key:'ORDINARY',discipline:item==='VMS'?'VMS':item,lines:[{item}]};const {old,now}=compare(a,[product(item,ids,facts)]);assert.equal(now.html,old.html);});
check('Ordinary empty output stays byte-identical',()=>{const {old,now}=compare(ordinary,[]);assert.equal(now.html,old.html);});
check('Mixed TL2 and VMS preserve genuine alphanumeric asset numbers',()=>{const a={key:'MIX',discipline:'Water-filled barriers',lines:[{item:'TL2'},{item:'VMS'}]};const {now}=compare(a,[product('TL2',['ARMORZONMASHTL2']),product('VMS',['V14221'])]);assert(now.html.includes('Recorded code <b>ARMORZONMASHTL2'));assert(now.html.includes('Asset no. <b>V14221'));assert.deepEqual(now.specs.assetNos,['V14221']);assert.deepEqual(now.specs.codes,['ARMORZONMASHTL2']);});
check('Mixed machine and mat keep identifiers in their own display buckets',()=>{const a={key:'MIX',discipline:'Plant',lines:[{item:'Trakmat'},{item:'60kva'}]};const {now}=compare(a,[product('Trakmat',['MAT-CODE']),product('60kva',['1277089'])]);assert.deepEqual(now.specs.assetNos,['1277089']);assert.deepEqual(now.specs.codes,['MAT-CODE']);});
check('An unspecified mixed product keeps its ordinary identifier label',()=>{const a={key:'MIX',discipline:'Water-filled barriers',lines:[{item:'TL2'}]};const {now}=compare(a,[product('TL2',['ARMORZONMASHTL2']),product('',['V14221'])]);assert(now.html.includes('Asset no. <b>V14221'));assert.deepEqual(now.specs.assetNos,['V14221']);});
check('Multiple groups of the same bulk product remain bulk',()=>{const {now}=compare(bulk,[product('TL2',['ONE']),product('TL2',['TWO'])]);assert.deepEqual(now.specs.codes,['ONE','TWO']);assert.equal(now.specs.notNumbered,true);});
check('Existing identifier deduplication and overflow are preserved',()=>{const ids=Array.from({length:8},(_,i)=>'CODE-'+i);const {now}=compare(bulk,[product('TL2',ids.concat(ids),facts.concat(facts))]);assert.equal(now.specs.nos.length,8);assert.equal(now.specs.facts.length,3);assert(now.html.includes('+2 more'));assert(now.html.includes('CODE-5'));assert(!now.html.includes('CODE-6'));});
check('Recorded identifiers remain escaped as text',()=>{const {now}=compare(bulk,[product('TL2',['A<&"\'B'])]);assert(now.html.includes('A&lt;&amp;&quot;&#39;B'));assert(!now.html.includes('<script'));});
check('Existing non-identifiers remain excluded without changing source rows',()=>{const p=[product('TL2',['MISCITEM','SUB-123','ARMORZONMASHTL2'])],before=JSON.stringify(p);const {now}=compare(bulk,p);assert.deepEqual(now.specs.nos,['ARMORZONMASHTL2']);assert.equal(JSON.stringify(p),before);});
check('A failing classifier preserves all provider identifiers and facts',()=>{const {old,now}=compare(bulk,[product('TL2',['ARMORZONMASHTL2'],facts)],{classifierThrows:true});assert.equal(now.html,old.html);});
check('An unavailable classifier preserves ordinary output',()=>{const {old,now}=compare(bulk,[product('TL2',['ARMORZONMASHTL2'],facts)],{noClassifier:true});assert.equal(now.html,old.html);});
check('Unavailable provider still reports a recognised bulk type as Not numbered',()=>{const now=renderer(fragments.NEW,bulk,[],{providerThrows:true});assert(now.html.includes('Not numbered'));assert(!now.html.includes('Asset no.'));});
check('Unavailable provider preserves the existing ordinary fallback',()=>{const {old,now}=compare(ordinary,[],{providerThrows:true});assert.equal(now.html,old.html);});
if(process.env.PAGE){const page=fs.readFileSync(process.env.PAGE,'utf8');check('Final candidate contains the exact reviewed renderer',()=>assert(page.includes(fragments.NEW)));}
console.log('PASS '+count+' identifier renderer checks');
