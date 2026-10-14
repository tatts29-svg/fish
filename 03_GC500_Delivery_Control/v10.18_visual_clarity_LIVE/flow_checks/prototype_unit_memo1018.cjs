/* Author: Andrew Fisher. Per-draw unit-model experiment; no application/source-record changes. */
'use strict';const fs=require('fs'),path=require('path'),crypto=require('crypto');const{open}=require('../map/tests/readonly1018.cjs');
const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});const report={author:'Andrew Fisher',pageSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex')};
(async()=>{let h;try{h=await open({pageFile:process.env.PAGE,W:1440,H:1000});const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
report.result=await p.evaluate(()=>{
 const original=supplierPricing1014,modelOriginal=window.gcModel925,before=JSON.stringify(S),version=SYNC.backend.readVersion821(),runs=[],checks=[];let underlyingCalls=0;
 const source=original.toString(),anchor='branch:pl760FencingBranch()';if(source.split(anchor).length!==2)throw Error('Exact supplier prototype anchor missing');
 const clone=(value,seen=new WeakMap())=>{if(value===null||typeof value!=='object')return value;if(seen.has(value))return seen.get(value);const out=Array.isArray(value)?[]:Object.create(Object.getPrototypeOf(value));seen.set(value,out);for(const key of Object.keys(value))out[key]=clone(value[key],seen);return out;};
 const memo=function(a,options){if(!a||typeof a!=='object')return modelOriginal.apply(this,arguments);const table=heldMemo('prototypeUnitMemo1018',()=>new WeakMap()),key=options?.loading===false?'plain':'loading';let entries=table.get(a);if(!entries){entries={};table.set(a,entries);}if(!Object.hasOwn(entries,key)){underlyingCalls++;entries[key]=modelOriginal.apply(this,arguments);}return clone(entries[key]);};
 const ck=(name,pass)=>checks.push({name,pass:!!pass});
 try{
 window.eval('supplierPricing1014 = ('+source.replace(anchor,"branch:normBranch(PO_SRC.supplier?.branch_code||'')||'STPS'")+');');
 for(const patched of [false,true]){
  window.gcModel925=patched?memo:modelOriginal;RENDER_MEMO.clear();go('about');underlyingCalls=0;const timings=[];
  for(const route of ['costs','timeline']){const start=performance.now();go(route);timings.push({route,milliseconds:Math.round(performance.now()-start),text:document.getElementById('pane-'+state.tab)?.innerText.replace(/\s+/g,' ').trim()});}
  const projections=holdAssets(()=>({money:moneySummary(),pl:pl770Model(),finance:fh866Model(),onsite:onsiteComplete979(),journal:cj764Model(),branch:branchFinancial978(pl752Rows(),moneySummary()),dockets:allDockets(),costs:allCosts(),units:allAssets().map(a=>({ref:a.key,full:gcModel925(a),plain:gcModel925(a,{loading:false})})),supplier:{...supplierPricing1014(),records:[...supplierPricing1014().records]}}));
  runs.push({patched,timings,projections,underlyingCalls});
 }
 const a=holdAssets(()=>assetOf('P33'));underlyingCalls=0;
 holdAssets(()=>{const x=gcModel925(a),y=gcModel925(a);ck('Within one hold reads reuse exactly one underlying model',underlyingCalls===1);ck('Each reader receives a fresh graph',x!==y&&x.rows!==y.rows&&x.rows.every((r,i)=>r!==y.rows[i]));ck('Groups retain their row aliases',x.groups.every(g=>g.units.every(u=>x.rows.includes(u))));const expected=JSON.stringify(y);x.rows[0].label='Prototype mutation';x.groups[0].units.length=0;ck('Consumer mutation cannot pollute the cached graph',JSON.stringify(gcModel925(a))===expected);const variant={...a,_bookingNumbers801:[]};gcModel925(variant);ck('Distinct same-reference booking object is separately calculated',underlyingCalls===2);gcModel925(a,{loading:false});ck('Loading false gets a separate model',underlyingCalls===3);HELD_STALE775=true;gcModel925(a);ck('Native held-stale invalidation recomputes model',underlyingCalls===4);});
 holdAssets(()=>gcModel925(a));ck('A later draw computes fresh even for the same asset object',underlyingCalls===5);
 const count=underlyingCalls;gcModel925(a);gcModel925(a);ck('Outside hold no model is reused',underlyingCalls===count+2);
 }finally{supplierPricing1014=original;window.gcModel925=modelOriginal;RENDER_MEMO.clear();}
 return {runs,checks,modelsEqual:JSON.stringify(runs[0].projections)===JSON.stringify(runs[1].projections),renderedTextsEqual:runs[0].timings.every((r,i)=>r.text===runs[1].timings[i].text),nativeUnchanged:before===JSON.stringify(S)&&version===SYNC.backend.readVersion821(),nativeVersion:version};
});report.errors=h.errors;report.requests=h.counts;if(!report.result.modelsEqual||!report.result.nativeUnchanged||report.result.checks.some(c=>!c.pass)||h.errors.length||h.counts.blocked)process.exitCode=1;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(h)await h.browser.close();fs.writeFileSync(path.join(out,'unit-memo-prototype.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,result:report.result?{...report.result,runs:report.result.runs.map(r=>({patched:r.patched,underlyingCalls:r.underlyingCalls,timings:r.timings.map(({text,...t})=>t)}))}:undefined}));}})();
