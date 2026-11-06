/* Author: Andrew Fisher. Lay out unaltered private actual-card screenshots for review. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out=path.resolve(process.env.OUT||'.');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{
 const run=JSON.parse(fs.readFileSync(path.join(out,'phone-candidate.json')));
 const wanted=[['gen_qas80','Generator','QAS80 catalogue reference; the existing size-band mapping is for review.'],['light_tower','Light tower','Recovered Coates catalogue photograph.'],['buildings_3p6','Building','Recovered 3.6 m building reference.'],['distribution_board','Distribution board','Andrew’s supplied D-board photograph.']];
 const cards=wanted.map(([id,title,note])=>{
  const e=run.examples.find(e=>e.ids.length===1&&e.ids[0]===id);assert(e,'Missing actual preview for '+id);
  const src='data:image/png;base64,'+fs.readFileSync(path.join(out,e.file)).toString('base64');
  return '<article><h2>'+esc(title)+'</h2><p>'+esc(note)+'</p><img src="'+src+'" alt="'+esc(e.item)+' actual card with proposed reference picture"></article>';
 }).join('');
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><title>Coates GC500 · picked-up picture preview</title><style>*{box-sizing:border-box}body{margin:0;background:#0a1f28;color:#ecf4f4;font:16px Arial,sans-serif;padding:28px}header{border-top:5px solid #ed731b;margin-bottom:24px}h1{font-size:27px;margin:20px 0 10px}header p{margin:8px 0;color:#b9cdd2;line-height:1.5}main{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}article{min-width:0;padding:16px;background:#132c36;border:1px solid #36505c;border-radius:16px}h2{margin:0 0 8px;font-size:20px}article p{min-height:40px;margin:0 0 16px;color:#bfd0d5;font-size:14px;line-height:1.4}img{display:block;width:100%;height:auto}footer{margin-top:24px;font-size:13px;line-height:1.5;color:#b9cdd2}</style><header><h1>Coates GC500 · picked-up picture preview</h1><p>Existing cards, proposed reference pictures · not published</p><p>The original dark cards, stamps and recorded details are preserved. Source photographs are lightly faded behind the stamp; this is a placement review.</p></header><main>'+cards+'</main><footer>Author: Andrew Fisher<br>Actual native-card screenshots, shown whole and unaltered. Product reference photographs do not establish individual asset identity.</footer></html>';
 const htmlPath=path.join(out,'final-review-summary.html');fs.writeFileSync(htmlPath,html);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{const p=await browser.newPage({viewport:{width:1040,height:900},deviceScaleFactor:1});await p.goto('file://'+htmlPath);await p.locator('img').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));await p.screenshot({path:path.join(out,'final-review-summary.png'),fullPage:true});}finally{await browser.close();}
 console.log('Private final-review-summary.png created from four complete existing card screenshots.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
