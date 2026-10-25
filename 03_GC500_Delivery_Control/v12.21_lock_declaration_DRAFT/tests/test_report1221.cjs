/* Author: Andrew Fisher. Synthetic A4 pagination and phone layout; no live data or writes. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:1100,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
await page.setContent(fs.readFileSync(path.join(process.env.EVIDENCE,'report-synthetic.html'),'utf8'));await page.evaluate(()=>window.__pg1202);
const result=await page.evaluate(()=>{const entries=[...document.querySelectorAll('.lock1221-entry')],sheets=[...document.querySelectorAll('.sheet')];return {entries:entries.length,pages:sheets.length,clipped:entries.filter(e=>e.getBoundingClientRect().bottom>e.closest('.sheet').querySelector('.foot').getBoundingClientRect().top-5).length,numbered:sheets.every((s,i)=>s.querySelector('.pg').textContent===(i+1)+' of '+sheets.length)};});
assert.equal(result.entries,80);assert.equal(result.clipped,0);assert(result.numbered);assert.equal(errors.length,0);
await page.locator('.sheet').last().screenshot({path:path.join(process.env.EVIDENCE,'report-final-page.png')});
await page.pdf({path:path.join(process.env.EVIDENCE,'report-synthetic.pdf'),preferCSSPageSize:true,printBackground:true});
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
console.log(JSON.stringify({checks:5,...result,errors:0,synthetic:true}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
