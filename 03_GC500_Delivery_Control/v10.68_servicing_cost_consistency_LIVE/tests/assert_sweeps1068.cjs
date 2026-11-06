/* Author: Andrew Fisher. Validate the canonical standing-sweep reports, including intentional route aliases. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const files=process.argv.slice(2);if(files.length!==2)throw Error('Provide the private desktop and phone sweep JSON files.');
const aliases={progress:'#today',map:'#sheet/__explorer',register:'#plant',journal:'#today',breakdowns:'#today',variances:'#today',edit:'#today',add:'#today',pricing:'#costs'};
const hidden=new Set(['register','journal','breakdowns','variances','edit','add']);
const tabs=['today','progress','map','docs','register','plant','demob','fencing','prestarts','coatesway','journal','breakdowns','variances','costs','edit','change','add','pricing','timeline','subhired','nights','vms','questions','about'];
const links={'#timeline':'pane-timeline','#day/2026-09-28':'pane-timeline','#change/2026-09-28':'pane-change','#print/drivers/2026-09-28':'pane-timeline','#sheet/__satellite3d':'pane-map','#plant':'pane-plant','#today':'pane-today'};
for(const file of files){
 const result=JSON.parse(fs.readFileSync(file));assert.deepEqual(Object.keys(result.tabs).sort(),tabs.slice().sort());
 for(const tab of tabs){
  const r=result.tabs[tab];assert.equal(r.shown,!hidden.has(tab),tab+' visibility');
  if(tab==='timeline')assert.match(r.hash,/^#day\/\d{4}-\d{2}-\d{2}$/);
  else if(tab==='change')assert.match(r.hash,/^#change\/\d{4}-\d{2}-\d{2}$/);
  else assert.equal(r.hash,aliases[tab]||'#'+tab,tab+' exact route');
  assert.equal(r.goerr,null);assert.deepEqual(r.errors,[]);assert.deepEqual(r.console,[]);
 }
 assert.deepEqual(Object.keys(result.hashes).sort(),Object.keys(links).sort());
 for(const [hash,pane] of Object.entries(links)){
  const r=result.hashes[hash];assert.equal(r.hash,hash);assert.equal(r.pane,pane);assert.deepEqual(r.errors,[]);
  assert.equal(r.bar,hash.startsWith('#print/'));
 }
 assert.deepEqual(result.back,{hash:'#plant',pane:'pane-plant'});
 assert.deepEqual(result.allErrors,[]);assert.deepEqual(result.cons,[]);assert.equal(result.counts.blocked,0);
}
console.log('PASS desktop and phone: 24 tabs, 7 exact deep links, Back destination, intentional aliases, zero page/console errors and zero blocked writes.');
