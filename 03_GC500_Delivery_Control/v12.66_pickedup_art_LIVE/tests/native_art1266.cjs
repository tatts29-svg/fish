/* Author: Andrew Fisher. Exact-page, same-record visual preservation check.
 * Every operational HTTP write is denied by the shared harness. Captures stay private.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const populated=docs=>Object.fromEntries(Object.entries(docs).filter(([,v])=>Object.keys(v||{}).length));
const artSelector=process.env.ART_SELECTOR||'.pickedup1266-art';
const supported=(process.env.ART_KINDS||'tower').split(',').map(x=>x.trim()).filter(Boolean);
const matches=c=>supported.includes(c.icon)&&['light tower','light towers','lighting tower','lighting towers','tower light','tower lights'].includes(String(c.item||'').toLowerCase().replace(/[\s-]+/g,' ').trim());
const mobile=process.env.MOB==='1',tag=mobile?'phone':'desktop';
const out=path.resolve(process.env.OUT||'');
const checks=[];
function check(name,condition){checks.push({name,pass:!!condition});assert(condition,name);}
function equal(a,b,name){assert.deepEqual(canonical(a),canonical(b),name);checks.push({name,pass:true});}
const persisted=()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0),inflight:Object.keys(SYNC.inflight||{}).length});
const readModel=()=>holdAssets(()=>JSON.parse(JSON.stringify({
 cards:Singles1238.model().cards.map(c=>({key:c.key,uid:c.uid,cat:c.cat,icon:c.icon,owner:c.owner,item:c.item,what:c.what,label:c.label,no:c.no,tankNo:c.tankNo,rego:c.rego,group:c.group,n:c.n,st:c.st,book:c.book,inside:c.inside,facts:c.facts,half:c.half,part:c.part,unk:c.unk})),
 money:moneySummary(),pl:pl770Model(),finance:fh866Model(),job:cj764Model()
})));
const readDom=selector=>[...document.querySelectorAll('#pane-demob article.sg1238')].map(card=>{
 const clone=card.cloneNode(true);clone.querySelectorAll(selector).forEach(n=>n.remove());
 const attrs=n=>[...n.attributes].map(a=>[a.name,a.value]).filter(([name])=>name!=='style');
 return {id:card.dataset.sg1238+'#'+card.dataset.u1238,state:card.dataset.s1238,text:clone.textContent,stamp:clone.querySelector('.stp1238')?.outerHTML||null,controls:[...clone.querySelectorAll('button,input,select,textarea,a')].map(n=>({tag:n.tagName,text:n.textContent,attrs:attrs(n)}))};
});
async function capture(label,file,fixtures){
 process.env.PAGE=file;process.env.INITIAL_HASH='#demob';
 const h=await openCandidate(),p=h.page;
 try{
  await p.clock.setFixedTime(new Date(process.env.FIXED_TIME||'2026-10-30T20:33:00Z'));
  await p.evaluate(()=>{DM816.view='everything';DM816.branch='all';renderDemob816();});
  await p.waitForSelector('#pane-demob article.sg1238 .stp1238');
  await p.waitForTimeout(400);
  const model=await p.evaluate(readModel),dom=await p.evaluate(readDom,artSelector);
  check(label+': current native model has gone and current cards',model.cards.some(c=>c.st.s==='gone')&&model.cards.some(c=>c.st.s!=='gone'));
  check(label+': complete record matches the pinned snapshot',h.baseline.docsMatch&&h.baseline.queuedDocuments===0&&h.baseline.inflight===0);
  if(!fixtures){
   fixtures=[];
   for(const kind of supported){const c=model.cards.find(c=>c.st.s==='gone'&&c.icon===kind&&matches(c));check('record has native picked-up example for '+kind,!!c);fixtures.push({...c,case:'art-'+kind});}
   const fallback=model.cards.find(c=>c.st.s==='gone'&&!supported.includes(c.icon));check('record has unsupported-art fallback example',!!fallback);fixtures.push({...fallback,case:'fallback'});
   fixtures.push({...model.cards.find(c=>c.st.s!=='gone'),case:'current-card'});
  }
  const artInventory=await p.evaluate(selector=>[...document.querySelectorAll(selector)].map(n=>({id:n.closest('article.sg1238')?.dataset.sg1238+'#'+n.closest('article.sg1238')?.dataset.u1238,stamp:!!n.closest('.stp1238'),tag:n.tagName,src:n.getAttribute('src'),alt:n.getAttribute('alt'),aria:n.getAttribute('aria-hidden'),pointer:getComputedStyle(n).pointerEvents,position:getComputedStyle(n).position,opacity:Number(getComputedStyle(n).opacity),tabIndex:n.tabIndex,interactive:!!n.closest('button,a,input,select,textarea')})),artSelector);
  if(label==='candidate'){
   const expected=model.cards.filter(c=>c.st.s==='gone'&&matches(c)).map(c=>c.key+'#'+c.uid).sort();
   equal(artInventory.map(x=>x.id).sort(),expected,'decorative artwork occurs once on each matching picked-up card only');
   check('each decorative render is self-contained and cannot intercept controls',artInventory.every(x=>x.stamp&&x.tag==='IMG'&&/^data:image\/(?:webp|png|svg\+xml);/i.test(x.src||'')&&x.alt===''&&x.aria==='true'&&x.pointer==='none'&&x.position==='absolute'&&x.opacity>0&&x.opacity<=.25&&x.tabIndex<0&&!x.interactive));
  }else check('baseline has no new artwork',artInventory.length===0);
  const goneFilter=p.locator('#pane-demob [data-f1238="gone"]');
  await goneFilter.scrollIntoViewIfNeeded();await goneFilter.click();
  check(label+': actual picked-up filter retains native state',await p.evaluate(()=>document.querySelector('#pane-demob [data-f1238="gone"]')?.getAttribute('aria-pressed')==='true'&&[...document.querySelectorAll('#pane-demob article.sg1238:not([hidden])')].every(c=>c.dataset.s1238==='gone')));
  await p.locator('#pane-demob [data-f1238="all"]').click();
  check(label+': actual All filter restores all native cards',await p.locator('#pane-demob article.sg1238:not([hidden])').count()===model.cards.length);
  equal(await p.evaluate(readDom,artSelector),dom,label+': native filtering preserves contents and controls');
  check(label+': repeated native draw cannot duplicate artwork',await p.evaluate(selector=>{renderDemob816();return document.querySelectorAll(selector).length;},artSelector)===artInventory.length);
  const views=[];
  for(const fixture of fixtures){
   // Use the real picked-up filter so native neighboring map rows do not stretch
   // the completed-card row while their asynchronous pictures are still loading.
   const filter=p.locator('#pane-demob [data-f1238="'+(fixture.st.s==='gone'?'gone':'all')+'"]');
   await filter.scrollIntoViewIfNeeded();await filter.click();
   const sel=await p.evaluate(f=>'#pane-demob article.sg1238[data-sg1238="'+CSS.escape(f.key)+'"][data-u1238="'+CSS.escape(f.uid)+'"]',fixture);
   const card=p.locator(sel);assert.equal(await card.count(),1);
   const focus=fixture.st.s==='gone'?card.locator('.stp1238'):card;
   await p.evaluate(f=>Singles1238.goCard(f.key,f.uid),fixture);
   await p.waitForTimeout(450);
   let landed=false;
   for(let attempt=0;attempt<8&&!landed;attempt++){
    await focus.evaluate(n=>n.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
    await p.waitForTimeout(180);
    landed=await card.evaluate((card,isGone)=>{
     // Reading the actual children first settles native content-visibility height.
     const end=card.querySelector('.ft1238').getBoundingClientRect(),c=card.getBoundingClientRect(),focus=isGone?card.querySelector('.stp1238'):card;
     const r=focus.getBoundingClientRect(),x=Math.min(innerWidth-10,Math.max(10,r.left+r.width/2)),y=Math.min(innerHeight-45,Math.max(10,r.top+r.height/2));
     const hit=document.elementFromPoint(x,y);
     return c.bottom>=end.bottom-1&&!!hit&&card.contains(hit)&&(!isGone||(r.top>=0&&r.bottom<=innerHeight-30));
    },fixture.st.s==='gone');
   }
   check(label+': '+fixture.case+' lands on settled actual native card',landed);
   if(label==='candidate'&&supported.includes(fixture.icon)&&fixture.st.s==='gone')await card.locator(artSelector).evaluate(async n=>{if(!n.complete)await new Promise((resolve,reject)=>{n.addEventListener('load',resolve,{once:true});n.addEventListener('error',reject,{once:true});});if(n.decode)await n.decode();});
   const geometry=await card.evaluate((card,selector)=>{
    const parent=card.getBoundingClientRect(),relative=n=>{const r=n.getBoundingClientRect();return {x:r.x-parent.x,y:r.y-parent.y,width:r.width,height:r.height};};
    const selectors=['.hd1238','.id1238','.stw1238','.stp1238','.stp1238 > b','.stp1238 > span','.stp1238 > small','.ft1238'];
    const font=n=>{const c=getComputedStyle(n);return {fontFamily:c.fontFamily,fontSize:c.fontSize,fontWeight:c.fontWeight,lineHeight:c.lineHeight,color:c.color,textShadow:c.textShadow};};
    const stamp=card.querySelector('.stp1238'),art=card.querySelector(selector),foreground=stamp?[...stamp.children].filter(n=>!n.matches(selector)):[];
    return {card:{width:parent.width,height:parent.height},parts:selectors.map(selector=>{const n=card.querySelector(selector);return {selector,rect:n?relative(n):null,font:n?font(n):null};}),visible:parent.width>0&&parent.height>0,art:art?{loaded:art.complete&&art.naturalWidth>0,rect:relative(art),opacity:Number(getComputedStyle(art).opacity),pointer:getComputedStyle(art).pointerEvents}:null,foreground:foreground.map(n=>({tag:n.tagName,text:n.textContent,z:getComputedStyle(n).zIndex,position:getComputedStyle(n).position})),scrollWidth:card.scrollWidth,clientWidth:card.clientWidth};
   },artSelector);
   check(label+': '+fixture.case+' native card is visible',geometry.visible);
   if(label==='candidate'&&supported.includes(fixture.icon)&&fixture.st.s==='gone')check(fixture.case+': matching image decodes',!!geometry.art?.loaded);
   if(fixture.case==='fallback'||fixture.case==='current-card')check(label+': '+fixture.case+' keeps original clear treatment',geometry.art===null);
   await p.screenshot({path:path.join(out,tag+'-'+label+'-'+fixture.case+'.png'),animations:'disabled'});
   if(fixture.st.s==='gone')await card.locator('.stp1238').screenshot({path:path.join(out,tag+'-'+label+'-'+fixture.case+'-stamp.png'),animations:'disabled'});
   views.push({id:fixture.key+'#'+fixture.uid,case:fixture.case,geometry});
  }
  const last=await p.evaluate(persisted),snapshot=JSON.parse(fs.readFileSync(process.env.STATE));
  equal(populated(last.docs),populated(snapshot.docs),label+': every persisted document unchanged');
  check(label+': no write queue or inflight operation',last.queued===0&&last.inflight===0);
  check(label+': zero runtime errors',h.errors.length===0);check(label+': zero console errors',h.consoleErrors.length===0);check(label+': zero operational write attempts',h.counts.blocked===0);
  return {pageSha256:hash(file),baseline:h.baseline,model,dom,fixtures,views,artInventory,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts};
 }finally{await h.browser.close();}
}
(async()=>{
 for(const k of ['BASE','CANDIDATE','STATE','OUT','EXPECTED_PAGE_SHA'])assert(process.env[k],k+' is required');
 assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'OUT must be private, outside the repository');
 assert.equal(hash(process.env.BASE),'10e8e8c23468d593a40c7ca7b88abb0ceceba203cffc4f9956933e193f1d0f64','Reviewed predecessor required');
 assert.equal(hash(process.env.CANDIDATE),process.env.EXPECTED_PAGE_SHA,'Candidate identity must match handover');
 fs.mkdirSync(out,{recursive:true});
 const base=await capture('base',process.env.BASE);
 fs.writeFileSync(path.join(out,tag+'-base.json'),JSON.stringify(base,null,2)+'\n');
 const candidate=await capture('candidate',process.env.CANDIDATE,base.fixtures);
 fs.writeFileSync(path.join(out,tag+'-candidate.json'),JSON.stringify(candidate,null,2)+'\n');
 equal(base.model,candidate.model,'complete native card and financial model outputs unchanged');
 equal(base.dom,candidate.dom,'all card text, stamp semantics and native controls preserved');
 for(let i=0;i<base.views.length;i++){
  const a=base.views[i],b=candidate.views[i];equal(a.id,b.id,'same native card '+a.case);equal(a.geometry.parts.map(p=>({selector:p.selector,font:p.font})),b.geometry.parts.map(p=>({selector:p.selector,font:p.font})),'existing fonts and colours preserved '+a.case);
  const rects=x=>[x.card,...x.parts.filter(p=>p.rect).map(p=>p.rect)];const aa=rects(a.geometry),bb=rects(b.geometry);equal(aa.length,bb.length,'native geometry shape '+a.case);
  check('card and existing content dimensions unchanged '+a.case,aa.every((r,j)=>Object.keys(r).every(k=>Math.abs(r[k]-bb[j][k])<=.51)));
  check('no new card horizontal overflow '+a.case,b.geometry.scrollWidth-b.geometry.clientWidth<=Math.max(1,a.geometry.scrollWidth-a.geometry.clientWidth));
 }
 fs.writeFileSync(path.join(out,tag+'-acceptance.json'),JSON.stringify({author:'Andrew Fisher',status:'PASS',tag,baseSha256:base.pageSha256,candidateSha256:candidate.pageSha256,stateSha256:base.baseline.stateSha256,stateVersion:base.baseline.version,checks,cardCount:base.dom.length,artCount:candidate.artInventory.length,fixtureCount:base.views.length,operationalWrites:0},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',tag,checks:checks.length,cards:base.dom.length,art:candidate.artInventory.length,writes:0}));
})().catch(e=>{if(process.env.OUT){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,tag+'-failure.json'),JSON.stringify({error:e.stack,checks},null,2)+'\n');}console.error(e.stack);process.exitCode=1;});
