/* Author: Andrew Fisher. Current source context, escaping and fail-closed proof checks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),prior=fs.readdirSync(path.dirname(root)).find(n=>n.startsWith('v8.37_fencing_map_trace_'));
const core=require(path.join(path.dirname(root),prior,'source/fencing-trace-core837.js'));
const ctx={URL,location:{href:'https://example.test/v/project',origin:'https://example.test'},esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),webLink:u=>{try{return /^https?:$/.test(new URL(u,'https://example.test').protocol);}catch(_){return false;}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'source_context838.js'),'utf8'),ctx);
let passed=0;function test(name,run){run();passed++;process.stdout.write('PASS '+name+'\n');}
const A='a'.repeat(64),B='b'.repeat(64),sources=[{id:'paper.pdf',sha256:A,pages:1},{id:'plan.pdf',sha256:B,pages:2}],record={id:'r1',docket_no:'10001',book:'red',date:'2026-10-01',location:'Compound',quantities:{clean:5},cost_state:'nothing to price',paid_state:'nothing to price'},binding={record_id:'r1',docket_no:'10001',book:'red',expected:{date:record.date,location:record.location,quantities:record.quantities},scope:'area',area_ids:[],activity:'service',basis:'Current compound context; no unloading pin',evidence:[{source_id:'paper.pdf',sha256:A,page:1},{source_id:'plan.pdf',sha256:B,page:2}]},key=core.key(binding),input={schema:1,master_sha256:A,sources,areas:[],rows:[binding],relations:[],unmapped:[{record_id:'r1',docket_no:'10001',book:'red',reason:'No accepted map position'}]},context={records:[record],geometry:[],sources:[],master_sha256:A,files:{'paper.pdf':{sha256:A},'plan.pdf':{sha256:B}},reviews:{[key]:{state:'current',query:{open:false,text:'Source only'},po:null}},links:{[key]:[{kind:'original',label:'Open original',url:'https://example.test/f/paper.pdf'},{kind:'area-context',label:'Open plan · page2',url:'https://example.test/f/plan.pdf#page=2'}]}};
const copy=x=>JSON.parse(JSON.stringify(x)),render=ct=>ctx.fenceTraceContext838(core.model(input,ct).rows[0]);
test('current unmapped source context has safe page link and no pin claim',()=>{const html=render(context);assert.match(html,/Source location context/);assert.match(html,/#page=2/);assert.match(html,/remains unmapped/);assert.doesNotMatch(html,/\$|completed|paid|approved/);});
for(const [name,mutate] of [
 ['changed original hash',c=>c.files['paper.pdf'].sha256='c'.repeat(64)],
 ['changed plan hash',c=>c.files['plan.pdf'].sha256='c'.repeat(64)],
 ['loading registry',c=>c.files=null],
 ['changed quantity',c=>c.records[0].quantities.clean=6],
 ['changed identity',c=>c.records[0].id='different'],
 ['duplicate identity',c=>c.records.push(copy(record))],
 ['stale source review',c=>c.reviews[key].state='stale']])test(name+' withholds source context',()=>{const c=copy(context);mutate(c);assert.equal(render(c),'');});
test('mapped rows do not duplicate source location context',()=>{const row=core.model(input,context).rows[0];row.area_ids=['mapped'];assert.equal(ctx.fenceTraceContext838(row),'');});
test('unsafe foreign and credential URLs rejected',()=>{for(const url of ['javascript:alert(1)','https://foreign.test/f/x','https://name:password@example.test/f/x']){const row=core.model(input,context).rows[0];row.links=[{kind:'area-context',label:'unsafe',url}];assert.equal(ctx.fenceTraceContext838(row),'');}});
test('source wording and labels are escaped',()=>{const row=core.model(input,context).rows[0];row.basis='<script>alert(1)</script>';row.links=[{kind:'area-context',label:'<img onerror=x>',url:'https://example.test/f/plan.pdf#page=2'}];const html=ctx.fenceTraceContext838(row);assert.doesNotMatch(html,/<script>|<img/);assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);});
test('source rendering leaves records and commercial model unchanged',()=>{const a=JSON.stringify({input,context});render(context);assert.equal(JSON.stringify({input,context}),a);const out=core.model(input,context);assert.equal(out.rows[0].money.supplier,null);assert.equal(out.orders.length,0);assert.equal(out.unmapped.length,1);});
process.stdout.write(JSON.stringify({passed,failed:0})+'\n');
