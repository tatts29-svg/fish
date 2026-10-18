// Author: Andrew Fisher. Readiness never confuses connection status with a complete painted record.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../refresh904_src.js'),'utf8');
function fixture(hosted=true) {
 const attr={}, main={}, texts={heading:{},detail:{}}, events={}; let timeout, redraws=0, resizes=0;
 const panel={querySelector:s=>s.includes('heading')?texts.heading:texts.detail};
 const root={setAttribute:(k,v)=>attr[k]=v,removeAttribute:k=>delete attr[k],getAttribute:k=>attr[k]};
 const document={documentElement:root,getElementById:()=>panel,querySelector:s=>s==='.app > main'?{setAttribute:(k,v)=>main[k]=v}:s.includes('retry')?{addEventListener:(k,v)=>events[k]=v}:texts.detail};
 const context={document,window:{dispatchEvent:()=>resizes++},Event:class{},DATA:{edition:hosted?'hosted':'file'},location:{pathname:hosted?'/v/synthetic':'/local.html',reload:()=>{}},SYNC:{on:true,status:'connecting',first:new Set()},SYNC_COLLS:{delivery:{},descs:{}},setTimeout:f=>{timeout=f;return 1;},clearTimeout:()=>{},syncRedraw:()=>redraws++,Promise};
 vm.createContext(context);vm.runInContext(source,context);
 return {context,attr,main,texts,events,controller:context.window.GC500Refresh904,timeout:()=>timeout(),redraws:()=>redraws,resizes:()=>resizes};
}
const a=fixture(); assert.equal(a.controller.report().state,'loading');assert.equal(a.main['aria-busy'],'true');
a.context.SYNC.status='live';a.context.SYNC.first.add('delivery');a.controller.update();assert.equal(a.redraws(),0);
a.timeout();assert.equal(a.controller.report().state,'saved');assert.equal(a.main['aria-busy'],'false');assert.match(a.texts.heading.textContent,/not confirmed/);
a.context.SYNC.first.add('descs');a.controller.update();a.controller.update();assert.equal(a.redraws(),1);assert.equal(a.controller.report().settled,false);
a.controller.drawn();assert.equal(a.controller.report().state,'ready');assert.equal(a.controller.report().settled,true);assert.equal(a.resizes(),1);
a.context.SYNC.status='unreachable';a.controller.update();a.timeout();assert.equal(a.controller.report().state,'ready');assert.equal(a.redraws(),1);
const b=fixture();b.context.SYNC.status='revoked';b.controller.update();assert.equal(b.controller.report().state,'saved');
const c=fixture(false);assert.equal(c.controller.report().settled,true);assert.equal(c.controller.report().state,undefined);assert.equal(c.redraws(),0);
console.log('PASS: partial snapshot, 12-second fallback, unchanged snapshot, one reveal, later outage and file edition lifecycle.');
