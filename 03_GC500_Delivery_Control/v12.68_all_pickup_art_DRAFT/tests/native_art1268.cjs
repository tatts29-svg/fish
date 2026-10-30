/* Author: Andrew Fisher. Exact-page, same-record visual preservation check.
 * Every operational HTTP write is denied by the shared harness. Captures stay private.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const populated=docs=>Object.fromEntries(Object.entries(docs).filter(([,v])=>Object.keys(v||{}).length));
const artSelector='.artwork1268';
const removeArt='.pickedup1266-art,.artwork1268-frame';
const api=require('../artwork1268_src.js');
const kindOf=c=>api.resolve({item:c.item,tankNo:c.tankNo,tank:c.hasTank});
const matches=c=>Boolean(kindOf(c));
const mobile=process.env.MOB==='1',tag=mobile?'phone':'desktop';
const out=path.resolve(process.env.OUT||'');
const checks=[];
function check(name,condition){checks.push({name,pass:!!condition});assert(condition,name);}
function equal(a,b,name){assert.deepEqual(canonical(a),canonical(b),name);checks.push({name,pass:true});}
const persisted=()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0),inflight:Object.keys(SYNC.inflight||{}).length});
const readModel=()=>holdAssets(()=>JSON.parse(JSON.stringify({
 cards:Singles1238.model().cards.map(c=>({key:c.key,uid:c.uid,cat:c.cat,icon:c.icon,owner:c.owner,item:c.item,what:c.what,label:c.label,no:c.no,tankNo:c.tankNo,hasTank:!!c.tank,rego:c.rego,group:c.group,n:c.n,st:c.st,book:c.book,inside:c.inside,facts:c.facts,half:c.half,part:c.part,unk:c.unk})),
 money:moneySummary(),pl:pl770Model(),finance:fh866Model(),job:cj764Model()
})));
const readDom=selector=>[...document.querySelectorAll('#pane-demob article.sg1238')].map(card=>{
 const clone=card.cloneNode(true);clone.querySelectorAll(selector).forEach(n=>n.remove());
 const attrs=n=>[...n.attributes].map(a=>[a.name,a.value]).filter(([name])=>name!=='style');
 return {id:card.dataset.sg1238+'#'+card.dataset.u1238,state:card.dataset.s1238,text:clone.textContent,stamp:clone.querySelector('.stp1238')?.outerHTML||null,controls:[...clone.querySelectorAll('button,input,select,textarea,a')].map(n=>({tag:n.tagName,text:n.textContent,attrs:attrs(n)}))};
});
const readConsumers=()=>holdAssets(()=>{
 const clean=html=>{const box=document.createElement('template');box.innerHTML=html;box.content.querySelectorAll('.pickedup1266-art,.artwork1268-frame').forEach(n=>n.remove());return box.innerHTML;};
 const inspect=html=>{const box=document.createElement('template');box.innerHTML=html;return{clean:clean(html),stamp:box.content.querySelectorAll('.stamp1232').length,kinds:[...box.content.querySelectorAll('[data-artwork1268]')].map(n=>n.dataset.artwork1268),frames:box.content.querySelectorAll('.artwork1268-frame').length};};
 const cards=Singles1238.model().cards,keys=new Set(cards.map(c=>c.key));
 const refs=allAssets().filter(a=>keys.has(a.key)).map(a=>{
  const left=Stamp1232.left(a.key),status=Departure1211.status(a.key),types=[...new Set((status?.events||[]).flatMap(e=>(e.items||[]).map(i=>i.type)).filter(Boolean))];
  const expected=window.Artwork1268?Artwork1268.resolveAll({types}):[];
  return{key:a.key,left,types,expected,
   legacy:inspect(Ready1231.cells({key:a.key})),
   build:inspect(BuildDeparture1248.stamp(a,{departed1248:!!left})),
   units:gcUnits925(a,{loading:false}).map(u=>({item:u.item,id:u.id,model:Subhired1248.unit(a.key,u.id,u.item,u.physical),render:inspect(Subhired1248.unitHtml(a.key,u.id,u.item,u.physical))})),
   quantities:[...new Set(cards.filter(c=>c.key===a.key&&c.group).map(c=>c.item))].map(item=>({item,model:Subhired1248.quantity(a.key,item),render:inspect(Subhired1248.quantityHtml(a.key,item))}))
  };
 });
 return refs;
});
async function dailyChecks(p,label){
 const day=await p.evaluate(()=>{const days=new Map();Singles1238.model().cards.filter(c=>c.st.s==='gone'&&c.st.day).forEach(c=>days.set(c.st.day,(days.get(c.st.day)||0)+1));return [...days].sort((a,b)=>b[1]-a[1]).find(([day])=>document.querySelector('#pane-demob [data-dday816="'+day+'"]'))?.[0];});
 check(label+': native daily picked-up list is available',!!day);
 const button=p.locator('#pane-demob [data-dday816="'+day+'"]').first();await button.scrollIntoViewIfNeeded();await button.click();
 await p.waitForFunction(()=>DM816.view==='list'&&document.querySelector('#pane-demob article.sg1238'));
 const dom=await p.evaluate(readDom,removeArt);
 check(label+': actual daily navigation renders picked-up cards',dom.some(c=>c.state==='gone'));
 if(label==='candidate'){
  const exact=await p.evaluate(()=>[...document.querySelectorAll('#pane-demob article.sg1238')].every(card=>{const native=Singles1238.cardOf(card.dataset.sg1238,card.dataset.u1238);if(!native)return false;const kinds=[...card.querySelectorAll('[data-artwork1268]')].map(n=>n.dataset.artwork1268);return JSON.stringify(kinds)===JSON.stringify(native.st.s==='gone'?Artwork1268.resolveAll(native):[]);}));
  check('daily cards retain exact own-item artwork and current-state rules',exact);
 }
 await p.evaluate(()=>{DM816.view='everything';renderDemob816();});
 return dom;
}
async function consumerChecks(p,label){
 const refs=await p.evaluate(readConsumers);
 check(label+': native legacy and Build departure examples exist',refs.some(r=>r.build.stamp)&&refs.some(r=>r.legacy.stamp));
 check(label+': native supplier-unit departure examples exist',refs.some(r=>r.units.some(u=>u.render.stamp)));
 if(label==='candidate'){
  check('every complete native reference has resolved typed artwork',refs.filter(r=>r.left).every(r=>r.expected.length>0));
  for(const name of ['legacy','build'])check(name+': every actual full departure receives its exact type set',refs.every(r=>r[name].stamp===0||JSON.stringify(r[name].kinds)===JSON.stringify(r.expected)));
  check('supplier-unit artwork follows the individual unit item',refs.every(r=>r.units.every(u=>!u.render.stamp||JSON.stringify(u.render.kinds)===JSON.stringify(api.resolveAll({item:u.item})))));
  check('supplier-quantity artwork follows the individual group item',refs.every(r=>r.quantities.every(u=>!u.render.stamp||JSON.stringify(u.render.kinds)===JSON.stringify(api.resolveAll({item:u.item})))));
  check('partial supplier departures do not gain a completed stamp',refs.every(r=>[...r.units,...r.quantities].every(u=>u.model?.kind!=='partial'||u.render.stamp===0)));
 }
 // Open the actual native drawer, preferring a mixed reference to exercise the
 // shared composite treatment without creating or changing operational records.
 const drawerRef=refs.find(r=>r.left&&new Set(r.types).size>1)||refs.find(r=>r.left);
 check(label+': native departed reference can open its drawer',!!drawerRef);
 await p.evaluate(key=>openAsset(key),drawerRef.key);
 await p.waitForSelector('#drawer .dst1232 .stamp1232');
 const drawer=await p.locator('#drawer .dst1232').evaluate(box=>{const stamp=box.querySelector('.stamp1232'),r=stamp.getBoundingClientRect(),copy=box.cloneNode(true);copy.querySelectorAll('.artwork1268-frame,.pickedup1266-art').forEach(n=>n.remove());return{clean:copy.innerHTML,rect:{width:r.width,height:r.height},text:stamp.textContent,kinds:[...stamp.querySelectorAll('[data-artwork1268]')].map(n=>n.dataset.artwork1268),overflow:box.scrollWidth-box.clientWidth};});
 if(label==='candidate')equal(drawer.kinds,drawerRef.expected,'native reference drawer receives exact explicit departure types');
 await p.locator('#drawer .dst1232').screenshot({path:path.join(out,tag+'-'+label+'-native-drawer-stamp.png'),animations:'disabled'});
 await p.keyboard.press('Escape');
 await p.evaluate(()=>{const dr=document.querySelector('#drawer');if(dr?.classList.contains('on')){if(typeof state.drawerClose==='function')state.drawerClose();}});
 const timing=label==='candidate'?await p.evaluate(key=>{
  const measure=fn=>{const values=[];fn();for(let i=0;i<3;i++){const at=performance.now();fn();values.push(performance.now()-at);}return values;};
  return {referenceInsideHeldDraw:measure(()=>holdAssets(()=>Artwork1268.reference(key))),referenceOutsideHeldDraw:measure(()=>Artwork1268.reference(key)),nativeLeftInsideHeldDraw:measure(()=>holdAssets(()=>Stamp1232.left(key))),nativeLeftOutsideHeldDraw:measure(()=>Stamp1232.left(key))};
 },drawerRef.key):null;
 return{refs,drawer,timing};
}
async function supplemental(p){
 const {positives}=require('./art_mapping.cjs'),manifest=require('./atlas_manifest.cjs');
 const contexts=Object.entries(manifest).flatMap(([atlas,kinds])=>kinds.map((kind,index)=>({kind,atlas,x:(index%3)*50,y:Math.floor(index/3)*100,size:[300,200],ratio:1,...(manifest.crops[kind]||{}),context:positives.find(([,k])=>k===kind)[0]})));
 const visible=await p.evaluate(rows=>{
  const host=document.createElement('div');host.id='artwork1268-preview';host.style.cssText='position:absolute;left:0;top:0;z-index:2147483646;width:'+Math.min(1200,innerWidth)+'px;box-sizing:border-box;background:#071c22;color:white;padding:16px;display:grid;gap:14px;grid-template-columns:repeat('+ (innerWidth<600?2:5) +',minmax(0,1fr))';
  for(const row of rows){const cell=document.createElement('section');cell.dataset.testKind=row.kind;cell.style.cssText='min-width:0;padding:12px 0';const label=document.createElement('div');label.textContent=row.kind;label.style.cssText='font:11px Inter,Arial;text-align:center;margin-bottom:10px';cell.append(label);const wrap=document.createElement('div');wrap.className='stw1238';wrap.innerHTML='<div class="stp1238" role="img">'+Artwork1268.html(typeof row.context==='string'?{item:row.context}:row.context)+'<i class="stc1238">✓</i><b>Picked up</b><span>Preview only</span><small>No operational record</small></div>';cell.append(wrap);host.append(cell);}
  (document.querySelector('#pane-demob .sgv1238')||document.querySelector('#pane-demob')).append(host);
  return [...host.querySelectorAll('[data-test-kind]')].map(cell=>{const n=cell.querySelector('.artwork1268'),s=n&&getComputedStyle(n);return{kind:cell.dataset.testKind,count:cell.querySelectorAll('.artwork1268').length,drawnKind:n?.dataset.artwork1268,background:s?.backgroundImage,size:s?.backgroundSize,position:s?.backgroundPosition,ratio:n?n.getBoundingClientRect().width/n.getBoundingClientRect().height:null,animation:s?.animationName,pointer:s?.pointerEvents,opacity:n?getComputedStyle(n.closest('.artwork1268-frame')||n).opacity:null};});
 },contexts);
 try{
  check('all declared artwork families render one exact matching decorative layer',visible.length===30&&visible.every(x=>x.count===1&&x.kind===x.drawnKind));
  check('every atlas cell uses its declared grid position',visible.every((x,i)=>x.size.split(' ').map(parseFloat).every((n,j)=>Math.abs(n-contexts[i].size[j])<.001)&&x.position.split(' ').map(parseFloat).every((n,j)=>Math.abs(n-[contexts[i].x,contexts[i].y][j])<.001)&&Math.abs(x.ratio-contexts[i].ratio)<.02));
  check('new artwork introduces no animation or interactive surface',visible.every(x=>x.animation==='none'&&x.pointer==='none'&&Number(x.opacity)<=.25));
  const decode=await p.evaluate(async()=>{const sources=[...new Set([...document.querySelectorAll('#artwork1268-preview .artwork1268')].map(n=>getComputedStyle(n).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]))];return Promise.all(sources.map(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve({ok:im.naturalWidth>0,width:im.naturalWidth,height:im.naturalHeight});im.onerror=()=>resolve({ok:false});im.src=src;})));});
  check('all five self-contained atlas images decode',decode.length===5&&decode.every(x=>x.ok&&x.width/x.height===1.5));
  await p.locator('#artwork1268-preview').screenshot({path:path.join(out,tag+'-all-artwork-preview.png'),animations:'disabled'});
  await p.emulateMedia({reducedMotion:'reduce'});
  check('reduced-motion keeps new artwork static',await p.locator('#artwork1268-preview .artwork1268').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).animationName==='none')));
  await p.emulateMedia({media:'print'});
  check('printing omits every decorative render',await p.locator('#artwork1268-preview .artwork1268').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n.closest('.artwork1268-frame')).display==='none')));
  await p.emulateMedia({media:'screen',reducedMotion:'no-preference'});
  const failure=await p.evaluate(()=>{const host=document.querySelector('#artwork1268-preview'),stamp=host.querySelector('.stp1238'),before=stamp.getBoundingClientRect(),text=stamp.textContent;stamp.querySelector('.artwork1268').style.backgroundImage='none';const after=stamp.getBoundingClientRect();return{textSame:stamp.textContent===text,widthSame:before.width===after.width,heightSame:before.height===after.height};});
  check('an absent decorative image retains the complete stamp foreground and dimensions',failure.textSame&&failure.widthSame&&failure.heightSame);
 }finally{await p.emulateMedia({media:'screen',reducedMotion:'no-preference'});await p.evaluate(()=>document.querySelector('#artwork1268-preview')?.remove());}
}
async function capture(label,file,fixtures){
 process.env.PAGE=file;process.env.INITIAL_HASH='#demob';
 const h=await openCandidate(),p=h.page;
 try{
  await p.clock.setFixedTime(new Date(process.env.FIXED_TIME||'2026-10-30T22:45:00Z'));
  await p.evaluate(()=>{DM816.view='everything';DM816.branch='all';renderDemob816();});
  await p.waitForSelector('#pane-demob article.sg1238 .stp1238');
  await p.waitForTimeout(400);
  const model=await p.evaluate(readModel),dom=await p.evaluate(readDom,removeArt);
  check(label+': current native model has gone and current cards',model.cards.some(c=>c.st.s==='gone')&&model.cards.some(c=>c.st.s!=='gone'));
  check(label+': complete record matches the pinned snapshot',h.baseline.docsMatch&&h.baseline.queuedDocuments===0&&h.baseline.inflight===0);
  if(!fixtures){
   fixtures=[];
   for(const kind of [...new Set(model.cards.filter(c=>c.st.s==='gone').map(kindOf))].filter(Boolean)){const c=model.cards.find(c=>c.st.s==='gone'&&kindOf(c)===kind);fixtures.push({...c,case:'art-'+kind});}
   fixtures.push({...model.cards.find(c=>c.st.s!=='gone'),case:'current-card'});
  }
  const artInventory=await p.evaluate(selector=>[...document.querySelectorAll('#pane-demob article.sg1238 '+selector)].map(n=>({id:n.closest('article.sg1238')?.dataset.sg1238+'#'+n.closest('article.sg1238')?.dataset.u1238,stamp:!!n.closest('.stp1238'),tag:n.tagName,kind:n.dataset.artwork1268,background:getComputedStyle(n).backgroundImage,size:getComputedStyle(n).backgroundSize,backgroundPosition:getComputedStyle(n).backgroundPosition,aria:n.closest('[aria-hidden]')?.getAttribute('aria-hidden'),pointer:getComputedStyle(n).pointerEvents,position:getComputedStyle(n).position,opacity:Number(getComputedStyle(n.closest('.artwork1268-frame')||n).opacity),tabIndex:n.tabIndex,interactive:!!n.closest('button,a,input,select,textarea')})),artSelector);
  if(label==='candidate'){
   const expected=model.cards.filter(c=>c.st.s==='gone'&&matches(c)).map(c=>c.key+'#'+c.uid).sort();
   equal(artInventory.map(x=>x.id).sort(),expected,'decorative artwork occurs once on each matching picked-up card only');
   check('every native equipment type resolves to matching artwork',model.cards.every(matches));
   check('each decorative render is self-contained and cannot intercept controls',artInventory.every(x=>x.stamp&&x.background.includes('data:image/webp;base64,')&&x.aria==='true'&&x.pointer==='none'&&x.position==='absolute'&&x.opacity>0&&x.opacity<=.25&&x.tabIndex<0&&!x.interactive));
   equal(artInventory.map(x=>x.kind).sort(),model.cards.filter(c=>c.st.s==='gone').map(kindOf).sort(),'native type distribution matches decorative artwork distribution');
   const loaded=await p.evaluate(async()=>{const urls=[...new Set([...document.querySelectorAll('.artwork1268')].map(n=>getComputedStyle(n).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]).filter(Boolean))];return Promise.all(urls.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({loaded:i.naturalWidth>0,width:i.naturalWidth,height:i.naturalHeight});i.onerror=()=>resolve({loaded:false});i.src=src;})));});
   check('all artwork atlases used by native cards decode',loaded.length>0&&loaded.every(i=>i.loaded&&i.width/i.height===1.5));
  }else check('baseline has no v12.68 artwork',artInventory.length===0);
  const goneFilter=p.locator('#pane-demob [data-f1238="gone"]');
  await goneFilter.scrollIntoViewIfNeeded();await goneFilter.click();
  check(label+': actual picked-up filter retains native state',await p.evaluate(()=>document.querySelector('#pane-demob [data-f1238="gone"]')?.getAttribute('aria-pressed')==='true'&&[...document.querySelectorAll('#pane-demob article.sg1238:not([hidden])')].every(c=>c.dataset.s1238==='gone')));
  await p.locator('#pane-demob [data-f1238="all"]').click();
  check(label+': actual All filter restores all native cards',await p.locator('#pane-demob article.sg1238:not([hidden])').count()===model.cards.length);
  equal(await p.evaluate(readDom,removeArt),dom,label+': native filtering preserves contents and controls');
  check(label+': repeated native draw cannot duplicate artwork',await p.evaluate(selector=>{renderDemob816();return document.querySelectorAll('#pane-demob article.sg1238 '+selector).length;},artSelector)===artInventory.length);
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
   const geometry=await card.evaluate((card,selector)=>{
    const parent=card.getBoundingClientRect(),relative=n=>{const r=n.getBoundingClientRect();return {x:r.x-parent.x,y:r.y-parent.y,width:r.width,height:r.height};};
    const selectors=['.hd1238','.id1238','.stw1238','.stp1238','.stp1238 > b','.stp1238 > span:not(.artwork1268-frame)','.stp1238 > small','.ft1238'];
    const font=n=>{const c=getComputedStyle(n);return {fontFamily:c.fontFamily,fontSize:c.fontSize,fontWeight:c.fontWeight,lineHeight:c.lineHeight,color:c.color,textShadow:c.textShadow};};
    const stamp=card.querySelector('.stp1238'),art=card.querySelector(selector),foreground=stamp?[...stamp.children].filter(n=>!n.matches('.artwork1268-frame')):[];
    return {card:{width:parent.width,height:parent.height},parts:selectors.map(selector=>{const n=card.querySelector(selector);return {selector,rect:n?relative(n):null,font:n?font(n):null};}),visible:parent.width>0&&parent.height>0,art:art?{kind:art.dataset.artwork1268,background:getComputedStyle(art).backgroundImage,rect:relative(art),opacity:Number(getComputedStyle(art).opacity),pointer:getComputedStyle(art).pointerEvents}:null,foreground:foreground.map(n=>({tag:n.tagName,text:n.textContent,z:getComputedStyle(n).zIndex,position:getComputedStyle(n).position})),scrollWidth:card.scrollWidth,clientWidth:card.clientWidth};
   },artSelector);
   check(label+': '+fixture.case+' native card is visible',geometry.visible);
   if(label==='candidate'&&fixture.st.s==='gone')check(fixture.case+': matching artwork retains its exact kind',geometry.art?.kind===kindOf(fixture));
   if(fixture.case==='fallback'||fixture.case==='current-card')check(label+': '+fixture.case+' keeps original clear treatment',geometry.art===null);
   await p.screenshot({path:path.join(out,tag+'-'+label+'-'+fixture.case+'.png'),animations:'disabled'});
   if(fixture.st.s==='gone')await card.locator('.stp1238').screenshot({path:path.join(out,tag+'-'+label+'-'+fixture.case+'-stamp.png'),animations:'disabled'});
   views.push({id:fixture.key+'#'+fixture.uid,case:fixture.case,geometry});
  }
  const daily=await dailyChecks(p,label);
  const consumers=await consumerChecks(p,label);
  if(label==='candidate')await supplemental(p);
  const last=await p.evaluate(persisted),snapshot=JSON.parse(fs.readFileSync(process.env.STATE));
  equal(populated(last.docs),populated(snapshot.docs),label+': every persisted document unchanged');
  check(label+': no write queue or inflight operation',last.queued===0&&last.inflight===0);
  check(label+': zero runtime errors',h.errors.length===0);check(label+': zero console errors',h.consoleErrors.length===0);check(label+': zero operational write attempts',h.counts.blocked===0);
  return {pageSha256:hash(file),baseline:h.baseline,model,dom,fixtures,views,artInventory,daily,consumers,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts};
 }finally{await h.browser.close();}
}
(async()=>{
 for(const k of ['BASE','CANDIDATE','STATE','OUT','EXPECTED_PAGE_SHA'])assert(process.env[k],k+' is required');
 assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'OUT must be private, outside the repository');
 assert(process.env.EXPECTED_BASE_SHA,'EXPECTED_BASE_SHA is required');
 assert.equal(hash(process.env.BASE),process.env.EXPECTED_BASE_SHA,'Reviewed predecessor required');
 assert.equal(hash(process.env.CANDIDATE),process.env.EXPECTED_PAGE_SHA,'Candidate identity must match handover');
 fs.mkdirSync(out,{recursive:true});
 const base=await capture('base',process.env.BASE);
 fs.writeFileSync(path.join(out,tag+'-base.json'),JSON.stringify(base,null,2)+'\n');
 const candidate=await capture('candidate',process.env.CANDIDATE,base.fixtures);
 fs.writeFileSync(path.join(out,tag+'-candidate.json'),JSON.stringify(candidate,null,2)+'\n');
 equal(base.model,candidate.model,'complete native card and financial model outputs unchanged');
 equal(base.dom,candidate.dom,'all card text, stamp semantics and native controls preserved');
 equal(base.daily,candidate.daily,'actual daily-list card text and controls preserved');
 const consumerSignature=c=>c.refs.map(r=>({key:r.key,left:r.left,types:r.types,legacy:r.legacy.clean,build:r.build.clean,units:r.units.map(u=>({item:u.item,id:u.id,model:u.model,render:u.render.clean})),quantities:r.quantities.map(u=>({item:u.item,model:u.model,render:u.render.clean}))}));
 equal(consumerSignature(base.consumers),consumerSignature(candidate.consumers),'legacy, Build and supplier native outputs preserved apart from decoration');
 equal(base.consumers.drawer.clean,candidate.consumers.drawer.clean,'native drawer content and metadata unchanged');
 check('native drawer stamp dimensions unchanged',Object.keys(base.consumers.drawer.rect).every(k=>Math.abs(base.consumers.drawer.rect[k]-candidate.consumers.drawer.rect[k])<=.51));

 for(let i=0;i<base.views.length;i++){
  const a=base.views[i],b=candidate.views[i];equal(a.id,b.id,'same native card '+a.case);equal(a.geometry.parts.map(p=>({selector:p.selector,font:p.font})),b.geometry.parts.map(p=>({selector:p.selector,font:p.font})),'existing fonts and colours preserved '+a.case);
  const rects=x=>[x.card,...x.parts.filter(p=>p.rect).map(p=>p.rect)];const aa=rects(a.geometry),bb=rects(b.geometry);equal(aa.length,bb.length,'native geometry shape '+a.case);
  check('card and existing content dimensions unchanged '+a.case,aa.every((r,j)=>Object.keys(r).every(k=>Math.abs(r[k]-bb[j][k])<=.51)));
  check('no new card horizontal overflow '+a.case,b.geometry.scrollWidth-b.geometry.clientWidth<=Math.max(1,a.geometry.scrollWidth-a.geometry.clientWidth));
 }
 fs.writeFileSync(path.join(out,tag+'-acceptance.json'),JSON.stringify({author:'Andrew Fisher',status:'PASS',tag,baseSha256:base.pageSha256,candidateSha256:candidate.pageSha256,stateSha256:base.baseline.stateSha256,stateVersion:base.baseline.version,checks,cardCount:base.dom.length,artCount:candidate.artInventory.length,fixtureCount:base.views.length,operationalWrites:0},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',tag,checks:checks.length,cards:base.dom.length,art:candidate.artInventory.length,writes:0}));
})().catch(e=>{if(process.env.OUT){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,tag+'-failure.json'),JSON.stringify({error:e.stack,checks},null,2)+'\n');}console.error(e.stack);process.exitCode=1;});
