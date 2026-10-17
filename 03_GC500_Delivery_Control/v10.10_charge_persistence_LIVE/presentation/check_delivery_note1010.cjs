/* Author: Andrew Fisher. One delivery-note presentation in each mode; no operational writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page'));
if(!process.env.PAGE)throw new Error('Set PAGE to the isolated delivery-note candidate');
const out=process.env.OUT||'/workspace/private-gc5001010-delivery-note-check';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',checks:[],errors:[],blocked:0};
const check=(name,ok,detail)=>{report.checks.push({name,ok,...(detail===undefined?{}:{detail})});assert(ok,name+': '+JSON.stringify(detail));};
const source=fs.readFileSync(process.env.PAGE,'utf8');
let scripts=0;for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
 if(/\bsrc\s*=|\btype\s*=\s*["'](?:application\/json|importmap|module)/i.test(match[1]))continue;
 new vm.Script(match[2],{filename:'delivery-note-source-'+(++scripts)});
}
check('all inline scripts parse',scripts>90,scripts);
const start=source.indexOf('if (d.note || ed) {\n            const deliveryNoteEditor1010'),end=source.indexOf('const nb = all(\'note\');',start);
assert(start>=0&&end>start);const block=source.slice(start,end);
for(const [name,note,ed,field,expected] of [
 ['editor existing note','Recorded note',true,true,[0,1]],
 ['viewer existing note','Recorded note',false,true,[1,1]],
 ['editor no field fallback','Recorded note',true,false,[1,0]],
 ['editor empty note','',true,true,[0,1]],
 ['viewer empty note','',false,true,[0,0]],
]){
 const nodes=[],ctx={d:{note},ed,dnote:field?{field:true}:null,hist:{appendChild:n=>nodes.push(n)},document:{createElement:tag=>({tag,children:[],appendChild(n){this.children.push(n);}})}};
 vm.runInNewContext(block,ctx);
 check(name+' keeps correct readable/editor structure',nodes.filter(n=>n.className==='note816 vo816').length===expected[0]&&nodes.filter(n=>n.className==='form editonly').length===expected[1]);
}
(async()=>{
 for(const mobile of [true,false]){
  const viewport=mobile?'phone':'desktop',h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
  try{
   const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
   const sourceInfo=await p.evaluate(async()=>{const r=await fetch('/v/Coates-GC500-2026/?note-source=1010',{cache:'no-store'});const bytes=await r.arrayBuffer();return {ok:r.ok,sha:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')};});
   check(viewport+' exact candidate',sourceInfo.ok&&sourceInfo.sha===process.env.EXPECTED_SHA,sourceInfo.sha);
   const version=await p.evaluate(()=>SYNC.backend.readVersion821());let mode='view';
   await p.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,level:mode})}));
   await p.evaluate(()=>{
    window.__note1010Writes=[];SYNC.db.doc=path=>({set:body=>{__note1010Writes.push(path);return new Promise(()=>{});},delete:()=>{__note1010Writes.push(path);return new Promise(()=>{});}});
    window.__note1010Source=deliveryOf('P33').note||'';
    window.__note1010Text=__note1010Source||'Delivery note display fixture';
    const previous=deliveryOf;deliveryOf=function(key){const record=previous.apply(this,arguments);return key==='P33'?{...record,note:__note1010Text}:record;};
   });
   for(mode of ['view','edit']){
    await p.evaluate(mode=>{capability=()=>mode;canEdit=()=>mode==='edit';SYNC.readonly=mode!=='edit';SYNC.level=mode;mayWrite=()=>false;go('timeline');openAsset('P33');document.querySelector('#drawer [data-f816="history"]').open=true;applyCapability();},mode);
    const facts=()=>{
     const box=document.querySelector('#drawer [data-f816="history"]'),visible=n=>!!n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden';
     return {labels:[...box.querySelectorAll('.sect,label')].filter(n=>n.textContent.trim()==='Delivery note'&&visible(n)).length,
      notes:[...box.querySelectorAll('.vo816,input[data-dnote]')].filter(n=>visible(n)&&(n.matches('input')?n.value:n.textContent)===__note1010Text).length,
      prose:box.querySelectorAll('.vo816').length,field:[...box.querySelectorAll('input[data-dnote]')].filter(visible).length,
      fieldRef:box.querySelector('input[data-dnote]')?.dataset.dnote,open:box.open,writes:__note1010Writes.length};
    };
    let f=await p.evaluate(facts);
    check(viewport+' '+mode+' one visible note and label',f.notes===1&&f.labels===1,f);
    check(viewport+' '+mode+' correct control',mode==='edit'?f.prose===0&&f.field===1&&f.fieldRef==='P33':f.prose===1&&f.field===0,f);
    await p.evaluate(()=>Idle1006.refreshDrawer());f=await p.evaluate(facts);
    check(viewport+' '+mode+' redraw keeps single note and open history',f.notes===1&&f.labels===1&&f.open,f);
    const target=p.locator('#drawer [data-f816="history"] '+(mode==='edit'?'input[data-dnote]':'.vo816'));await target.scrollIntoViewIfNeeded();
    await p.screenshot({path:path.join(out,viewport+'-'+mode+'-delivery-note.png')});
   }
   check(viewport+' no native save requested',await p.evaluate(()=>__note1010Writes.length===0));
   report.errors.push(...h.errors);report.blocked+=h.counts.blocked;
  }finally{await h.browser.close();}
 }
 check('zero page errors',report.errors.length===0,report.errors);check('zero operational requests',report.blocked===0,report.blocked);
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:report.checks.length,scripts,out}));
})().catch(e=>{report.failure=String(e);fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
