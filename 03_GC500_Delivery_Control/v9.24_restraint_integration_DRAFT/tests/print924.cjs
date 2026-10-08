// Author: Andrew Fisher. Read-only native driver-print pipeline and A4 PDF evidence.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page'));
const out=process.env.OUT924||'/workspace/private-restraint924-print';fs.mkdirSync(out,{recursive:true});
(async()=>{const s=await open({pageFile:process.env.PAGE,hash:'#today',W:1000,H:1200});try{const p=s.page;
await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&Object.keys(SYNC_COLLS).every(k=>SYNC.first.has(k))&&window.Restraint924,null,{timeout:180000});
await p.evaluate(()=>{const pairs=programmeDays().flatMap(d=>dpLoads(d).map((g,i)=>({d,g,i,n:Restraint924.loadStates(g).states.length})).filter(x=>x.g.kind==='deliveries')).sort((a,b)=>b.n-a.n),pick=pairs[0];window.__r924PrintSelection={day:pick.d.iso,loadIndex:pick.i,units:pick.n};dpPrint(pick.d.iso,'drv',{only:pick.i,pdf:(result,wrap,done)=>{window.__r924NativePrint={result};window.__r924PrintDone=done;document.body.classList.remove('pdf7-make');document.body.classList.add('printing-day');}});});
await p.waitForFunction(()=>window.__r924NativePrint,null,{timeout:60000});await p.emulateMedia({media:'print'});
const result=await p.evaluate(()=>({selection:__r924PrintSelection,native:__r924NativePrint.result,pages:[...document.querySelectorAll('#dayprint .r924-paper')].map(el=>({height:Math.round(el.clientHeight),content:Math.round(el.scrollHeight),overflow:el.scrollHeight>el.clientHeight+2,footerInside:el.querySelector('.dp-ft').getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom+2}))}));
assert(!result.native.timeout,'native print pipeline completed');assert(!result.native.over.length,'native print pipeline accepts A4 layout');assert(result.pages.length&&result.pages.every(x=>!x.overflow&&x.footerInside),'supplements and footers fit A4');
await p.pdf({path:path.join(out,'native-driver.pdf'),printBackground:true,preferCSSPageSize:true});
result.errors=s.errors;result.requests=s.counts;assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);fs.writeFileSync(path.join(out,'native-print.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
await p.evaluate(()=>{if(window.__r924PrintDone)__r924PrintDone();document.body.classList.remove('printing-day');});
}finally{await s.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
