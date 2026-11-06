// Author: Andrew Fisher. Synthetic source-identity, date and non-mutation guards.
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'evidence849_src.js'),'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const record = {id:'synthetic-record',docket_no:'SYN-01',date:'2026-10-01',week:'Build',scope:'programme',usable:true,
    location:'Synthetic area',quantities:{clean:10},components:{mesh_panel:4,base:5},note:'Original synthetic note',cost_total:123};
  const descriptor = {id:'synthetic-original.pdf',sha256:'a'.repeat(64)};
  const fields = ['date','location','quantities','components','note'];
  const item = {id:'synthetic-finding',recordId:record.id,number:record.docket_no,book:'red',
    expected:Object.fromEntries(fields.map(key=>[key,copy(record[key])])),source_ids:[descriptor.id],
    title:'Synthetic source discrepancy',detail:'The source contains a separately reported component count.',papers:[{id:descriptor.id,page:2}],
    scope:'Source finding only',component:'brace',quantity:3,unit:'each',status:'reviewed',countInRecordedTotals:false};
  const catalogue = {schema:1,author:'Andrew Fisher',sources:[descriptor],items:[item]}, records=[record], files={[descriptor.id]:{sha256:descriptor.sha256}};
  const context = vm.createContext({Date,Map,Set,todayIso:()=> '2026-10-05',FENCE_EVIDENCE849:catalogue,allDockets:()=>records,photoIndex:()=>({state:'ready',files})});
  vm.runInContext(source,context);
  return {record,records,item,catalogue,files,context,read:(day='2026-10-05',options)=>{Object.assign(context,{day,options});return vm.runInContext('fenceComponentEvidence849(day,options)',context);}};
}
let passed=0,failed=0;
const check=(name,fn)=>{try{fn();passed++;console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+': '+error.message);}};
const pending=result=>{assert.equal(result.issues.length,0);assert.equal(result.pending.length,1);assert.equal(result.state,'partial');};
check('A uniquely bound reviewed source is returned only as a separate finding',()=>{const f=fixture(),r=f.read();assert.equal(r.state,'ready');assert.equal(r.issues.length,1);assert.equal(r.issues[0].quantity,3);assert.equal(r.pending.length,0);assert.equal('totals' in r,false);assert.equal('recorded' in r,false);});
check('Record renumbering invalidates the paper identity even when the record ID is unchanged',()=>{const f=fixture();f.record.docket_no='SYN-02';pending(f.read());});
check('A changed reviewed record cannot retain an earlier finding',()=>{for(const key of ['date','location','quantities','components','note']){const f=fixture();f.record[key]=key==='quantities'?{clean:11}:key==='components'?{mesh_panel:4,base:6}:key==='date'?'2026-10-02':'Changed';pending(f.read());}});
check('Unreviewed extra or missing expected fields invalidate the snapshot',()=>{const f=fixture();f.item.expected.unreviewed=true;pending(f.read());delete f.item.expected.unreviewed;delete f.item.expected.note;pending(f.read());});
check('Canonical object ordering preserves the same reviewed quantities',()=>{const f=fixture();f.record.components={base:5,mesh_panel:4};assert.equal(f.read().issues.length,1);});
check('Changing only a calculated financial value does not alter physical evidence',()=>{const f=fixture();f.record.cost_total=9876;assert.equal(f.read().issues.length,1);});
check('Duplicate record IDs and missing records cannot select a convenient source',()=>{const f=fixture();f.records.push(copy(f.record));pending(f.read());f.records.length=0;pending(f.read());});
check('Duplicate finding IDs invalidate every duplicate',()=>{const f=fixture();f.catalogue.items.push(copy(f.item));const r=f.read();assert.equal(r.issues.length,0);assert.equal(r.pending.length,2);});
check('Findings must remain in their reviewed source book',()=>{const f=fixture();f.item.book='blue';pending(f.read());});
check('Date replay hides later findings without adding a false problem',()=>{const f=fixture(),r=f.read('2026-09-30');assert.equal(r.issues.length,0);assert.equal(r.pending.length,0);assert.equal(r.state,'ready');});
check('Unusable records cannot support reviewed findings',()=>{const f=fixture();f.record.usable=false;pending(f.read());});
check('Impossible source dates cannot pass a pattern-only date check',()=>{for(const date of ['2026-02-30','2026-13-01','2026-10-00']){const f=fixture();f.record.date=date;f.item.expected.date=date;pending(f.read('2027-01-01'));}});
check('A real leap day is accepted when bound to the source snapshot',()=>{const f=fixture();f.record.date='2024-02-29';f.item.expected.date=f.record.date;assert.equal(f.read().issues.length,1);});
check('Invalid selected dates cannot produce a ready evidence reading',()=>{for(const day of ['not-a-date','2026-02-30']){const r=fixture().read(day);assert.equal(r.issues.length,0);assert.equal(r.state,'unavailable');}});
check('Changed or unavailable file hashes invalidate the finding',()=>{const f=fixture();f.files[f.item.source_ids[0]].sha256='b'.repeat(64);pending(f.read());delete f.files[f.item.source_ids[0]];pending(f.read());pending(f.read(undefined,{catalogue:f.catalogue,records:f.records,files:null}));});
check('Duplicate source descriptors and malformed digests cannot establish identity',()=>{const f=fixture();f.catalogue.sources.push(copy(f.catalogue.sources[0]));pending(f.read());f.catalogue.sources.pop();f.catalogue.sources[0].sha256='not-a-sha';pending(f.read());});
check('Every supporting source must remain available even when only one paper is opened',()=>{const f=fixture();f.catalogue.sources.push({id:'synthetic-summary.pdf',sha256:'b'.repeat(64)});f.item.source_ids.push('synthetic-summary.pdf');pending(f.read());f.files['synthetic-summary.pdf']={sha256:'b'.repeat(64)};assert.equal(f.read().issues.length,1);});
check('Paper pointers require an allowed source and positive whole page',()=>{for(const paper of [{id:'different.pdf',page:2},{id:'synthetic-original.pdf',page:0},{id:'synthetic-original.pdf',page:1.5}]){const f=fixture();f.item.papers=[paper];pending(f.read());}});
check('Missing and duplicated supporting-source references remain pending',()=>{const f=fixture();f.item.source_ids.push(f.item.source_ids[0]);pending(f.read());f.item.source_ids=[];pending(f.read());});
check('Malformed item and paper entries cannot hide an unrelated valid finding by throwing',()=>{const f=fixture();f.catalogue.items.push(null);let r;assert.doesNotThrow(()=>r=f.read());assert.equal(r.issues.length,1);assert.equal(r.pending.length,1);const g=fixture();g.item.papers=[null];assert.doesNotThrow(()=>r=g.read());pending(r);});
check('Unavailable catalogue or records return no accepted quantities',()=>{for(const options of [{catalogue:null,records:[]},{catalogue:{schema:1,items:[],sources:[]},records:null}]){const r=fixture().read(undefined,options);assert.equal(r.state,'unavailable');assert.equal(r.issues.length,0);}});
check('Evidence reads cannot mutate reviewed inputs, native counts, money or existing totals',()=>{
  const f=fixture(),existing={eightWorkTotals:[10,20,30,40,50,60,70,80],financial:{revenue:4321,directCosts:1234}};
  const deepFreeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;};
  const before=JSON.stringify({record:f.record,catalogue:f.catalogue,files:f.files,existing});
  deepFreeze(f.record);deepFreeze(f.catalogue);deepFreeze(f.files);deepFreeze(existing);
  f.context.DATA=existing;assert.equal(f.read().issues.length,1);
  assert.equal(JSON.stringify({record:f.record,catalogue:f.catalogue,files:f.files,existing}),before);
});
console.log(passed+' evidence guard checks passed; '+failed+' failed');
if(failed)process.exitCode=1;
