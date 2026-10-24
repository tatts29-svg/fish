/* Author: Andrew Fisher. Execute the actual page's evidence guards on private inputs.
   node test_native_evidence.cjs page.html private-bundle.json private-fixture.json
   No browser, network, operational writes or source details are printed. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const [pageFile,bundleFile,fixtureFile]=process.argv.slice(2);
if(!fixtureFile)throw Error('Expected page, private bundle and private fixture paths');
const page=fs.readFileSync(pageFile,'utf8'),bundle=JSON.parse(fs.readFileSync(bundleFile)),fixture=JSON.parse(fs.readFileSync(fixtureFile));
function native(name){const prefix='function '+name+'(';assert.equal(page.split(prefix).length,2,'one native function');const start=page.indexOf(prefix),end=page.indexOf('\n}',start);assert(end>start);return page.slice(start,end+2);}
const box={DATA:{weeks:fixture.weeks}};vm.createContext(box);
vm.runInContext(['fenceInstallationWeeks847','fenceInstallationDocketState848','fenceProgressEvidence848'].map(native).join('\n'),box);
const extra=bundle.progress_after.operations.slice(bundle.progress_before.operations.length);
const input={catalogue:{...bundle.progress_after,operations:extra,plan_allowances:[]},records:fixture.records,serviceNotes:fixture.green,files:fixture.files};
const clone=x=>JSON.parse(JSON.stringify(x));
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
const snapshot=JSON.stringify(input),run=x=>box.fenceProgressEvidence848('2026-10-18',x);
check('all reviewed additions are accepted with exact source and record signatures',()=>{const r=run(input);assert.equal(r.state,'ready');assert.equal(r.operations.length,4);assert.equal(r.pending.length,0);});
check('native evidence read never mutates its input',()=>assert.equal(JSON.stringify(input),snapshot));
check('reported quantities and types are exactly the reviewed additions',()=>assert.deepEqual(JSON.parse(JSON.stringify(run(input).operations.map(o=>[o.id,o.type,o.quantity,o.unit]))),extra.map(o=>[o.id,o.type,o.quantity,o.unit])));
check('an unavailable source blocks its affected activity',()=>{const x=clone(input);delete x.files[extra[0].source_ids[0]];const r=run(x);assert.equal(r.state,'review-needed');assert(r.pending.some(p=>p.id===extra[0].id));});
check('a changed record blocks its affected activity',()=>{const x=clone(input);x.serviceNotes.find(r=>r.id===extra[0].records[0].record_id).note+=' changed';const r=run(x);assert(r.pending.some(p=>p.id===extra[0].id));});
check('a new matching priced overlap blocks a possible double count',()=>{const x=clone(input),op=extra.find(o=>o.type==='scrim_existing'),ref=op.records[0].expected;x.records.push({id:'synthetic-overlap',date:ref.date,location:ref.location,quantities:{scrim:1}});const r=run(x);assert(r.pending.some(p=>p.id===op.id));});
check('future activities are excluded before their actual recorded day',()=>{const r=box.fenceProgressEvidence848('2026-01-01',input);assert.equal(r.operations.length,0);});
console.log(JSON.stringify({author:'Andrew Fisher',passed:checks,total:checks}));
