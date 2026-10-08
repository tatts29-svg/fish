// Author: Andrew Fisher. Native wrapper delegation and repeat-safe drawer fold.
const fs=require('fs'),vm=require('vm'),assert=require('assert');let oldCalls=0,removed=0,inserted=[];
const DATA={infrastructure_review951:JSON.parse(fs.readFileSync(__dirname+'/infrastructure951.json'))};
const db={querySelectorAll:()=>[{remove:()=>removed++}],insertAdjacentHTML:(where,html)=>inserted.push(html)};
const ctx={DATA,openAsset:function(){oldCalls++;return 'native-result';},document:{querySelector:()=>db},esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;')};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/infrastructure951.js','utf8'),ctx);
for(const r of DATA.infrastructure_review951.rows){assert.equal(ctx.openAsset(r.reference,{keep:true}),'native-result');const h=inserted.at(-1);assert(h.startsWith('<details'));assert(!h.includes('<details open'));assert(h.includes(r.reference));assert(h.includes('Source status only'));}
assert(inserted.find(x=>x.includes('GN18')).includes('still needs final location'));
assert(inserted.find(x=>x.includes('P45')).includes('End precedes start'));
const n=inserted.length;ctx.openAsset('P01');assert.equal(inserted.length,n);assert.equal(oldCalls,13);assert.equal(removed,13);assert(!fs.readFileSync(__dirname+'/infrastructure951.js','utf8').includes('bump('));console.log('PASS: 12 folded references, caveats, native delegation, unrelated reference excluded, repeat safe; no native save');

assert.equal(ctx.infrastructure951Date('46307'),'12 Oct 2026');assert.equal(ctx.infrastructure951Date('45942'),'12 Oct 2025');assert(inserted.find(x=>x.includes('P45')).includes('12 Oct 2025'));
