/* Author: Andrew Fisher. Read-only actual-card review. Operational HTTP writes are blocked by the shared harness. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const out=path.resolve(process.env.OUT||'.'),tag=process.env.MOB==='1'?'phone':'desktop';
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const art='.pickedup1266-art,.artwork1268-frame,.artwork1270-frame';
const checks=[];
function check(name,value){checks.push({name,pass:!!value});assert(value,name);}
function equal(name,a,b){assert.deepEqual(a,b,name);checks.push({name,pass:true});}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readModels=()=>holdAssets(()=>JSON.parse(JSON.stringify({
 cards:Singles1238.model().cards.map(c=>({key:c.key,uid:c.uid,cat:c.cat,icon:c.icon,owner:c.owner,branch:c.branch,item:c.item,what:c.what,label:c.label,no:c.no,tankNo:c.tankNo,hasTank:!!c.tank,rego:c.rego,group:c.group,n:c.n,st:c.st,book:c.book,inside:c.inside,facts:c.facts,half:c.half,part:c.part,unk:c.unk})),
 money:moneySummary(),pl:pl770Model(),finance:fh866Model(),job:cj764Model()
})));
const readDom=selector=>[...document.querySelectorAll('#pane-demob article.sg1238')].map(card=>{
 const clone=card.cloneNode(true);clone.querySelectorAll(selector).forEach(n=>n.remove());
 const attrs=n=>[...n.attributes].map(a=>[a.name,a.value]).filter(([name])=>name!=='style');
 return {id:card.dataset.sg1238+'#'+card.dataset.u1238,state:card.dataset.s1238,text:clone.textContent,stamp:clone.querySelector('.stp1238')?.outerHTML||null,controls:[...clone.querySelectorAll('button,input,select,textarea,a')].map(n=>({tag:n.tagName,text:n.textContent,attrs:attrs(n)}))};
});
const readDocs=()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0),inflight:Object.keys(SYNC.inflight||{}).length});
const readConsumers=selector=>holdAssets(()=>{
 const clean=html=>{const box=document.createElement('template');box.innerHTML=html;box.content.querySelectorAll(selector).forEach(n=>n.remove());return box.innerHTML;};
 const pics=html=>{const box=document.createElement('template');box.innerHTML=html;return [...box.content.querySelectorAll('[data-photo1270]')].map(n=>n.dataset.photo1270);};
 const inspect=html=>({clean:clean(html),pics:pics(html)});
 const cards=Singles1238.model().cards,keys=new Set(cards.map(c=>c.key));
 return allAssets().filter(a=>keys.has(a.key)).map(a=>{
  const left=Stamp1232.left(a.key),context=Artwork1268.reference(a.key);
  return {key:a.key,left,expected:window.Artwork1270?Artwork1270.resolveAll(context):null,
   legacy:inspect(Ready1231.cells({key:a.key})),build:inspect(BuildDeparture1248.stamp(a,{departed1248:!!left})),
   units:gcUnits925(a,{loading:false}).map(u=>({item:u.item,id:u.id,model:Subhired1248.unit(a.key,u.id,u.item,u.physical),render:inspect(Subhired1248.unitHtml(a.key,u.id,u.item,u.physical))})),
   quantities:[...new Set(cards.filter(c=>c.key===a.key&&c.group).map(c=>c.item))].map(item=>({item,model:Subhired1248.quantity(a.key,item),render:inspect(Subhired1248.quantityHtml(a.key,item))}))
  };
 });
});
function consumerSignature(refs){return refs.map(r=>({key:r.key,left:r.left,legacy:r.legacy.clean,build:r.build.clean,units:r.units.map(u=>({item:u.item,id:u.id,model:u.model,clean:u.render.clean})),quantities:r.quantities.map(u=>({item:u.item,model:u.model,clean:u.render.clean}))}));}
async function daily(p){
 const day=await p.evaluate(()=>[...document.querySelectorAll('#pane-demob [data-dday816]')].map(n=>n.dataset.dday816).find(day=>Singles1238.model().cards.some(c=>c.st.s==='gone'&&c.st.day===day)));
 check('native daily picked-up navigation exists',!!day);
 await p.locator('#pane-demob [data-dday816="'+day+'"]').first().click();
 await p.waitForFunction(()=>DM816.view==='list'&&document.querySelector('#pane-demob article.sg1238'));
 const dom=await p.evaluate(readDom,art);
 await p.evaluate(()=>{DM816.view='everything';DM816.branch='all';renderDemob816();});
 return dom;
}
async function capture(label,file){
 process.env.PAGE=file;process.env.INITIAL_HASH='#demob';
 const h=await openCandidate(),p=h.page;
 try{
  await p.clock.setFixedTime(new Date(process.env.FIXED_TIME||'2026-10-31T00:30:00Z'));
  await p.evaluate(()=>{DM816.view='everything';DM816.branch='all';renderDemob816();});
  await p.waitForSelector('#pane-demob article.sg1238 .stp1238');
  check(label+': pinned record loaded without pending writes',h.baseline.docsMatch&&!h.baseline.inflight&&!h.baseline.queuedDocuments);
  const models=await p.evaluate(readModels),dom=await p.evaluate(readDom,art),docsBefore=await p.evaluate(readDocs);
  const consumers=await p.evaluate(readConsumers,art);
  const dailyDom=await daily(p);
  equal(label+': daily navigation preserves everything-card content',await p.evaluate(readDom,art),dom);
  await p.locator('#pane-demob [data-f1238="gone"]').click();
  check(label+': picked-up filter selects only departed native cards',await p.evaluate(()=>document.querySelector('#pane-demob [data-f1238="gone"]')?.getAttribute('aria-pressed')==='true'&&[...document.querySelectorAll('#pane-demob article.sg1238:not([hidden])')].every(c=>c.dataset.s1238==='gone')));
  await p.locator('#pane-demob [data-f1238="all"]').click();
  equal(label+': filter round trip leaves text and controls unchanged',await p.evaluate(readDom,art),dom);
  const examples=[];let inventory=[];let mappings=[];
  if(label==='candidate'){
   check('new helper present with shared compatibility alias',await p.evaluate(()=>!!window.Artwork1270&&Artwork1268===Artwork1270));
   mappings=await p.evaluate(()=>Singles1238.model().cards.map(c=>({key:c.key,uid:c.uid,item:c.item,owner:c.owner,state:c.st.s,description:Artwork1270.describe(c),ids:Artwork1270.resolveAll(c)})));
   inventory=await p.evaluate(()=>[...document.querySelectorAll('#pane-demob article.sg1238')].map(card=>({key:card.dataset.sg1238,uid:card.dataset.u1238,ids:[...card.querySelectorAll('[data-photo1270]')].map(n=>n.dataset.photo1270),frames:card.querySelectorAll('.artwork1270-frame').length,old:card.querySelectorAll('.artwork1268-frame,.pickedup1266-art').length})));
   const ordered=rows=>rows.sort((a,b)=>(a.key+'#'+a.uid).localeCompare(b.key+'#'+b.uid));
   equal('every actual card receives only its own proposed photo IDs',ordered(inventory.map(x=>({key:x.key,uid:x.uid,ids:x.ids}))),ordered(mappings.map(x=>({key:x.key,uid:x.uid,ids:x.state==='gone'?x.ids:[]}))));
   check('rejected art is absent from the candidate',inventory.every(x=>x.old===0));
   check('only one decorative frame per matching card',inventory.every(x=>x.frames===(x.ids.length?1:0)));
   check('supplier cards never receive Coates catalogue images',mappings.filter(c=>c.owner!=='coates').every(c=>!c.ids.length));
   for(const r of consumers){
    for(const caller of ['legacy','build']){
     if(r[caller].pics.length)equal(caller+' uses complete reference source set '+r.key,r[caller].pics,r.expected);
    }
   }
   const seen=new Set();
   for(const m of mappings){
    if(m.state!=='gone'||!m.ids.length)continue;
    const sig=m.ids.join('|');if(seen.has(sig))continue;seen.add(sig);
    const selector=await p.evaluate(c=>'#pane-demob article.sg1238[data-sg1238="'+CSS.escape(c.key)+'"][data-u1238="'+CSS.escape(c.uid)+'"]',m);
    const card=p.locator(selector);
    await p.locator('#pane-demob [data-f1238="gone"]').click();
    await p.evaluate(c=>Singles1238.goCard(c.key,c.uid),m);
    await card.scrollIntoViewIfNeeded();
    await card.evaluate(n=>{n.style.contentVisibility='visible';n.scrollIntoView({block:'center',inline:'center',behavior:'instant'});});
    await card.locator('img[data-photo1270]').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>img.decode()));});
    const geometry=await card.evaluate(n=>{const s=n.querySelector('.stp1238'),frame=n.querySelector('.artwork1270-frame'),cs=getComputedStyle(frame),r=s.getBoundingClientRect();return{width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,stampWidth:r.width,stampHeight:r.height,overflow:n.scrollWidth-n.clientWidth,opacity:Number(cs.opacity),pointer:cs.pointerEvents,hidden:frame.getAttribute('aria-hidden'),text:s.textContent,decoded:[...frame.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)};});
    check('actual preview source decodes and preserves stamp accessibility '+sig,geometry.decoded&&geometry.hidden==='true'&&geometry.pointer==='none'&&geometry.opacity>0&&geometry.opacity<=.35&&geometry.overflow<=1);
    const filename=tag+'-card-'+String(examples.length+1).padStart(2,'0')+'.png';
    await card.screenshot({path:path.join(out,filename),animations:'disabled',timeout:60000});
    examples.push({...m,file:filename,geometry});
   }
   await p.locator('#pane-demob [data-f1238="all"]').click();
   // Verify every photo-failure leaves the foreground stamp intact; no record changes.
   const failed=await p.evaluate(()=>{const frame=document.querySelector('.artwork1270-frame'),stamp=frame.closest('.stp1238,.stamp1232'),text=stamp.textContent,r=stamp.getBoundingClientRect();frame.querySelectorAll('img').forEach(img=>img.style.visibility='hidden');const a=stamp.getBoundingClientRect();return{textSame:stamp.textContent===text,sizeSame:Math.abs(r.width-a.width)<.51&&Math.abs(r.height-a.height)<.51};});
   check('missing image retains stamp wording and dimensions',failed.textSame&&failed.sizeSame);
   await p.evaluate(()=>renderDemob816());
   equal('rerender preserves original content after image failure',await p.evaluate(readDom,art),dom);
  }
  const docsAfter=await p.evaluate(readDocs);
  equal(label+': all native documents remain unchanged',docsBefore,docsAfter);
  equal(label+': complete financial and card models remain unchanged',models,await p.evaluate(readModels));
  check(label+': no operational writes attempted',h.counts.blocked===0);
  check(label+': no runtime errors',h.errors.length===0);
  check(label+': no console errors',h.consoleErrors.length===0);
  return {pageSha256:hash(file),stateSha256:hash(process.env.STATE),baseline:h.baseline,models,dom,dailyDom,consumers,mappings,inventory,examples,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts};
 }finally{await h.browser.close();}
}
function gallery(examples,mappings){
 const cards=examples.map((e,i)=>'<article><h2>'+String(i+1).padStart(2,'0')+' · '+esc(e.item)+'</h2><p>'+e.description.sources.map(s=>esc(s.label||s.id)+(s.note?' — '+esc(s.note):'')).join('<br>')+'</p><img src="data:image/png;base64,'+fs.readFileSync(path.join(out,e.file)).toString('base64')+'" alt="Existing '+esc(e.item)+' card with proposed faded reference picture"><small>Actual existing card, unchanged record · '+esc(e.ids.join(', '))+'</small></article>').join('');
 const gaps=new Map();mappings.filter(m=>!m.ids.length).forEach(m=>gaps.set(m.owner+'|'+m.item+'|'+m.description.reason,m));
 const gapsHtml=[...gaps.values()].map(m=>'<li>'+esc(m.item)+' ('+esc(m.owner)+'): '+esc(m.description.reason||'No supported reference match')+'</li>').join('');
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coates GC500 · Original picture card preview</title><style>body{margin:0;background:#0a1f28;color:#edf4f5;font:16px system-ui;padding:24px}header{max-width:1100px;margin:0 auto 24px;border-top:4px solid #ee731b}h1{font-size:27px}p{color:#bed0d4;line-height:1.5}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:24px;max-width:1400px;margin:auto}article{background:#142e38;border:1px solid #38515c;border-radius:16px;padding:18px}article h2{font-size:19px;margin-top:0}article p{min-height:70px;font-size:14px}article img{display:block;width:100%;height:auto;max-width:460px;margin:auto}small{display:block;color:#a7bdc6;margin-top:15px;font-size:12px}footer{max-width:1100px;margin:30px auto;line-height:1.6}li{margin:7px 0}</style><header><h1>Coates GC500 · Original picture card preview</h1><p>Author: Andrew Fisher</p><p>Review only. These are the existing cards with recovered reference pictures faded behind their original picked-up stamps. Catalogue photographs represent the named product families; they are not photographs of the individual assets. Current card details, status, dates and controls are unchanged. No replacement has been published.</p></header><main>'+cards+'</main><footer><h2>Still without a supported picture</h2><p>These keep their original clear stamp in the draft. A different product or supplier is never guessed.</p><ul>'+gapsHtml+'</ul></footer></html>';
}
(async()=>{
 for(const key of ['BASE','PAGE','STATE','OUT'])assert(process.env[key],key+' is required');
 assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'Keep screenshots and record evidence outside the repository');
 const candidateFile=process.env.PAGE;fs.mkdirSync(out,{recursive:true});
 const base=await capture('base',process.env.BASE);
 fs.writeFileSync(path.join(out,tag+'-baseline.json'),JSON.stringify(base,null,2));
 const candidate=await capture('candidate',candidateFile);
 fs.writeFileSync(path.join(out,tag+'-candidate.json'),JSON.stringify(candidate,null,2));
 equal('all card content, labels, stamp text and controls unchanged',base.dom,candidate.dom);
 equal('all native card and financial outputs unchanged',base.models,candidate.models);
 equal('native daily lists unchanged apart from decoration',base.dailyDom,candidate.dailyDom);
 equal('legacy, Build and supplier stamp callers preserve native outputs',consumerSignature(base.consumers),consumerSignature(candidate.consumers));
 fs.writeFileSync(path.join(out,tag+'-review.html'),gallery(candidate.examples,candidate.mappings));
 const result={author:'Andrew Fisher',status:'PASS',tag,baseSha256:base.pageSha256,candidateSha256:candidate.pageSha256,stateSha256:candidate.stateSha256,checks,examples:candidate.examples.length,operationalWrites:0};
 fs.writeFileSync(path.join(out,tag+'-acceptance.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({status:'PASS',tag,checks:checks.length,examples:candidate.examples.length,writes:0}));
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,tag+'-failure.json'),JSON.stringify({error:e.stack,checks},null,2));console.error(e.stack);process.exitCode=1;});
