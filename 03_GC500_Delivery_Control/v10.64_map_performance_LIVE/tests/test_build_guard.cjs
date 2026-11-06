/* Author: Andrew Fisher. The shape layer accepts exactly the two reviewed builds during deployment. */
'use strict';
const fs=require('fs'), vm=require('vm'), assert=require('node:assert/strict');
const page=fs.readFileSync(process.argv[2],'utf8');
const constants=page.match(/const EXPLORER_BUILD = [^\n]+\n const EXPLORER_BUILD_1064 = [^\n]+/)[0];
const at=page.indexOf(' function mount(frame){',page.indexOf(constants));
const end=page.indexOf('\n W.gc500ShapeLayer1060',at);
const code=constants+'\n'+page.slice(at,end)+';({mount,old:EXPLORER_BUILD,next:EXPLORER_BUILD_1064})';
const api=vm.runInNewContext(code,{URL,location:{href:'https://gc500-production.up.railway.app/v/Coates-GC500-2026',origin:'https://gc500-production.up.railway.app'}});
function frame(scripts,url='https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html'){
 return {contentDocument:{head:{},readyState:'complete',URL:url,querySelectorAll:()=>scripts.split('|').map(src=>({getAttribute:()=>src})),getElementById:()=>({})},contentWindow:{drawMarks(){},GC500Shape1060:{}}};
}
assert(api.mount(frame(api.old)));assert(api.mount(frame(api.next)));let checks=2;
for(const source of [api.old,api.next])for(let i=0;i<6;i++){
 const parts=source.split('|');parts[i]=parts[i].replace(/\?v=.*/, '?v=000000000000');
 assert.equal(api.mount(frame(parts.join('|'))),false);checks++;
}
assert.equal(api.mount(frame(api.next+'|extra.js')),false);checks++;
assert.equal(api.mount(frame(api.next,'https://example.com/explorer/index.html')),false);checks++;
assert.equal(api.mount(frame(api.next,'https://gc500-production.up.railway.app/not-explorer.html')),false);checks++;
console.log(`PASS ${checks} exact build/origin/path guard checks`);
