/* Author: Andrew Fisher. Validate the shared route/deep-link sweep without changing it. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const r=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
assert.equal(Object.keys(r.tabs).length,27);
assert.deepEqual(r.allErrors,[]);assert.deepEqual(r.cons,[]);assert.equal(r.counts.blocked,0);
const aliases={progress:'today',register:'plant',journal:'today',breakdowns:'today',variances:'today',edit:'today',change:'today',add:'today',pricing:'costs',nights:'today',vmsoff:'today',fenceclose:'today'};
for(const [key,row] of Object.entries(r.tabs)){
 assert.deepEqual(row.errors,[],key+' runtime errors');assert.deepEqual(row.console,[],key+' console errors');assert.equal(row.goerr,null,key+' navigation error');
 // Map opens its explorer sheet; Build settles on its selected day after hydration.
 if(key==='map')assert.equal(row.hash,'#sheet/__explorer','native map explorer destination');
 else if(key==='timeline')assert.match(row.hash,/^#(?:timeline|day\/\d{4}-\d{2}-\d{2})$/,'native Build destination');
 else assert.equal(row.hash,'#'+(aliases[key]||key),key+' route destination');
 if(!aliases[key])assert(row.shown&&row.txt>0,key+' pane must be populated and visible');
}
assert.equal(Object.keys(r.hashes).length,7);
const deepPanes={'#timeline':'timeline','#day/2026-09-28':'timeline','#change/2026-09-28':'today','#print/drivers/2026-09-28':'timeline','#sheet/__satellite3d':'map','#plant':'plant','#today':'today'};
for(const [key,row] of Object.entries(r.hashes)){
 assert.deepEqual(row.errors,[],key+' deep-link errors');
 assert.equal(row.hash,key,key+' deep-link hash');assert.equal(row.pane,'pane-'+deepPanes[key],key+' deep-link pane');
 assert.equal(row.bar,key.startsWith('#print/'),key+' print controls');
}
assert.equal(r.back.hash,'#plant');assert.equal(r.back.pane,'pane-plant');
console.log(JSON.stringify({author:'Andrew Fisher',routes:27,deepLinks:7,back:true,runtimeErrors:0,consoleErrors:0,attemptedWrites:0}));

