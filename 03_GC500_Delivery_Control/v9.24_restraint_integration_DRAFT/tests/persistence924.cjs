// Author: Andrew Fisher. Injected native-save refusal; no network or live record.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../restraint924_src.js'),'utf8');
const c={S:{loads:{}},mayWrite:()=>true,whoAmI:()=> 'Synthetic checker',docIdOf:k=>k,flash:()=>{},render:()=>{}};c.stateLoads=()=>c.S.loads;c.bump=()=>{c.bump.kept=false};vm.createContext(c);
for(const name of ['stamp','safeKey','writeDoc']){const line=src.split('\n').find(x=>x.startsWith('function '+name+'('));assert(line);vm.runInContext(line,c);}
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const data=()=>({kind:'restraint924-unit',unitId:'synthetic',actual:{verified:true}});
ok(c.writeDoc('new',data())===false&&!c.S.loads.new,'native refusal deletes new in-memory record');
const old={kind:'restraint924-unit',unitId:'synthetic',actual:{verified:false},at:'2026-10-08T00:00:00Z'};c.S.loads.existing=old;
ok(c.writeDoc('existing',data())===false&&c.S.loads.existing===old,'native refusal restores exact prior record');
c.bump=()=>{throw Error('Injected storage failure');};ok(c.writeDoc('throw',data())===false&&!c.S.loads.throw,'thrown failure rolls back');
c.mayWrite=()=>false;ok(c.writeDoc('readonly',data())===false&&!c.S.loads.readonly,'read-only refuses all mutations');
c.mayWrite=()=>true;c.bump=()=>{c.bump.kept=true};ok(c.writeDoc('existing',{...data(),unitId:'different'})===false&&c.S.loads.existing===old,'key collision cannot overwrite another identity');
ok(c.writeDoc('existing',data())===true&&c.S.loads.existing.actual.by==='Synthetic checker'&&c.S.loads.existing.actual.at===c.S.loads.existing.at,'kept native record has named matched verification stamp');
const prior=c.S.loads.existing.at;c.writeDoc('existing',data());ok(Date.parse(c.S.loads.existing.at)>Date.parse(prior),'successive edits advance stamp');
ok(c.writeDoc('x'.repeat(180),data())===false,'native truncating document key is refused');
console.log(JSON.stringify({checks,passed:checks,note:'Native save failure injection, no operational records changed.'},null,2));
