// Author: Andrew Fisher. GET-only paper geometry, continuation and actual PDF checks.
const fs=require('fs'),path=require('path'),{open}=require('../toolchain/harness/open_page');
(async()=>{let s;try{
 const mobile=!!process.env.MOB,day=process.env.DAY||'2026-10-12',out=process.env.EVIDENCE_DIR;
 if(!out)throw Error('EVIDENCE_DIR must be a private folder outside Git');fs.mkdirSync(out,{recursive:true});
 s=await open({pageFile:process.env.PAGE,W:mobile?390:1440,H:mobile?844:1000,mobile});const p=s.page;
 await p.context().route('**/*',r=>r.request().method()==='GET'?r.fallback():r.abort());
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await p.evaluate(()=>{window.print=()=>{throw Error('Native printing is prohibited in this test');};});
 const checks=[],ok=(name,pass)=>checks.push({name,pass:!!pass});
 for(const kind of ['install','drivers']) {
  const result=await p.evaluate(async({day,kind})=>{
   const d=programmeDays().find(x=>x.iso===day),loads=dpLoads(d),doc=kind==='install'?'ins':'drv';
   const expected=loads.map((g,i)=>{const w=document.createElement('div');w.innerHTML=dpPage(d,g,doc,i+1,loads.length);return {load:String(i+1),refs:g.rows.map(r=>r.a.key),pictures:w.querySelectorAll('.dp-fig').length,text:[...w.querySelectorAll('.dp-sec > *')].map(x=>x.textContent.replace(/\s+/g,' ').trim())};});
   const before=JSON.stringify(S);const L=await pdf7Layout(kind,day,null);window.__test899=L;
   const pages=[...L.wrap.querySelectorAll('.dp-page')].map(pg=>{const b=pg.getBoundingClientRect(),children=[...pg.children].filter(e=>getComputedStyle(e).position!=='absolute').map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}));return {load:pg.dataset.load,sign:pg.classList.contains('pl782'),continuation:pg.dataset.continuation899==='1',sheet:pg.dataset.sheet899,text:pg.textContent.replace(/\s+/g,' ').trim(),page:[b.width,b.height],fit:pg.scrollHeight<=pg.clientHeight+1,bounds:children.every(e=>e.top>=b.top-1&&e.bottom<=b.bottom+1),overlap:children.some((r,i)=>i>0&&r.top<children[i-1].bottom-1),photos:[...pg.querySelectorAll('.dp-win')].map(e=>({w:e.getBoundingClientRect().width*25.4/96,h:e.getBoundingClientRect().height*25.4/96,failed:!!e.dataset.failed,loaded:!e.querySelector('img')||!!e.querySelector('img').naturalWidth})),loadingFonts:[...pg.querySelectorAll('.loading872-sheet')].map(e=>parseFloat(getComputedStyle(e).fontSize)*.75)};});
   return {expected,pages,verdict:L.r,stateUnchanged:before===JSON.stringify(S)};
  },{day,kind});
  fs.writeFileSync(path.join(out,kind+'-geometry.json'),JSON.stringify(result,null,2));
  ok(kind+': every sheet fits A4 with no overlap or clipping',result.pages.every(x=>x.fit&&x.bounds&&!x.overlap));
  ok(kind+': every photograph has at least 36 mm height and 40 mm width',result.pages.every(x=>x.photos.every(y=>y.h>=35.7&&y.w>=40)));
  ok(kind+': loading text remains at least 8 pt',result.pages.every(x=>x.loadingFonts.every(n=>n>=7.99)));
  ok(kind+': no missing image or preparation warning',!result.verdict.timeout&&!result.verdict.failed&&!result.verdict.over?.length&&result.pages.every(x=>x.photos.every(y=>!y.failed&&y.loaded)));
  ok(kind+': every supplied picture and reference retained',result.expected.every(e=>{const pages=result.pages.filter(p=>p.load===e.load&&!p.sign),text=pages.map(p=>p.text).join(' ');return pages.reduce((n,p)=>n+p.photos.length,0)===e.pictures&&e.refs.every(r=>text.includes(r));}));
  ok(kind+': record unchanged during layout',result.stateUnchanged);
  ok(kind+': distinct loads stay in source order',JSON.stringify([...new Set(result.pages.map(p=>p.load))])===JSON.stringify(result.expected.map(e=>e.load))&&(!process.env.ASSERT_LOADS||result.expected.length===Number(process.env.ASSERT_LOADS)));
  // Section headings may repeat, but every original word sequence between headings must remain.
  ok(kind+': all original section content retained',result.expected.every(e=>{const text=result.pages.filter(p=>p.load===e.load&&!p.sign).map(p=>p.text).join(' ');return e.text.every(t=>t.split(/(?=Loading ·|Oversize transport|Crew ·|Unloading ·)/).every(part=>text.includes(part.trim())));}));
  await p.evaluate(()=>{document.body.classList.remove('pdf7-make');document.body.classList.add('printing-day');const w=document.getElementById('dayprint');w.style.position='relative';w.style.zIndex='10000';});
  const count=await p.locator('#dayprint .dp-page').count();
  for(let i=0;i<count;i++)await p.locator('#dayprint .dp-page').nth(i).screenshot({path:path.join(out,kind+'-sheet-'+String(i+1).padStart(2,'0')+'.png')});
  await p.evaluate(()=>{const L=window.__test899;L.done();L.wrap.replaceChildren();L.wrap.removeAttribute('style');delete window.__test899;});
  if(!mobile){
   const files=await p.evaluate(async({day,kind})=>{
    const before=JSON.stringify(S),saved=drvValid782;let calls=0;drvValid782=()=>++calls===1; // Only pass the PDF entry gate; do not fabricate a manual-check signature.
    try{const r=await pdf7Make(kind,day,null,{say(){}},PDF7.job);return {unchanged:before===JSON.stringify(S),files:await Promise.all(r.files.map(async f=>({name:f.name,role:f.role,li:f.li,pages:f.pages,label:f.label,bytes:Array.from(new Uint8Array(await f.blob.arrayBuffer()))}))),pick:r.pick};}finally{drvValid782=saved;}
   },{day,kind});
   for(const f of files.files)fs.writeFileSync(path.join(out,f.name),Buffer.from(f.bytes));
   ok(kind+': real PDF maker keeps each continuation/sign with its load',files.files.filter(f=>f.role==='load').every(f=>f.pages===result.pages.filter(p=>Number(p.load)===f.li+1).length));
   ok(kind+': real PDF maker keeps the combined file page count',files.files.find(f=>f.role==='all')?.pages===result.pages.length);
   ok(kind+': PDF generation does not change the shared record',files.unchanged);
   fs.writeFileSync(path.join(out,kind+'-files.json'),JSON.stringify(files.files.map(({bytes,...f})=>f),null,2));
  }
 }
 const crowded=await p.evaluate(async day=>{
  const d=programmeDays().find(x=>x.iso===day),g=dpLoads(d)[0],wrap=document.getElementById('dayprint');wrap.classList.add('dpwrap');document.body.classList.add('pdf7-make');wrap.style.setProperty('--dpz','1');wrap.innerHTML=dpPage(d,g,'ins',1,1);
  const section=wrap.querySelector('.dp-sec'),tokens=[];for(let i=0;i<18;i++){const box=document.createElement('div');box.className='loading872-sheet';const token='Synthetic instruction '+i+' retained';tokens.push(token);box.innerHTML='<b>'+token+'</b><div>Confirm truck side, lifting method and route before loading.</div>';section.append(box);}
  const pics=wrap.querySelector('.dp-pics'),fig=pics.firstElementChild;for(let i=0;i<18;i++)pics.append(fig.cloneNode(true));const photoCount=pics.children.length;
  await document.fonts.ready;dpFit(wrap);const pages=[...wrap.querySelectorAll('.dp-page')],text=pages.map(p=>p.textContent).join(' '),ret={pages:pages.length,fit:pages.every(dpFits899),tokens:tokens.every(t=>text.includes(t)),labels:pages.every((p,i)=>p.querySelector('.dp-pages899')?.textContent.includes('Sheet '+(i+1)+' of '+pages.length)),photos:wrap.querySelectorAll('.dp-win').length===photoCount&&[...wrap.querySelectorAll('.dp-win')].every(e=>e.getBoundingClientRect().height>=36*96/25.4-1)};
  const bad=document.createElement('div');bad.className='loading872-sheet';bad.style.height='400mm';bad.textContent='Synthetic indivisible oversized instruction';pages[0].querySelector('.dp-sec').append(bad);dpFit(wrap);ret.oversizedBlocked=wrap.__over.length>0&&!dpPrintReady899(wrap);
  wrap.replaceChildren();wrap.classList.remove('dpwrap');document.body.classList.remove('pdf7-make');return ret;
 },day);
 ok('overcrowded synthetic sheet continues without losing instructions/photos',crowded.pages>1&&crowded.fit&&crowded.tokens&&crowded.labels&&crowded.photos);
 ok('indivisible oversized instruction blocks native printing',crowded.oversizedBlocked);
 ok('no browser errors',!s.errors.length);ok('no attempted operational network writes',s.counts.blocked===0);
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,crowded,errors:s.errors},null,2));checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
