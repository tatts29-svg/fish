/* Author: Andrew Fisher. Read-only shared drawer quantity checks; run under gc500-browser.lock. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const tools=path.resolve(__dirname,'../../../toolchain/harness');
const fetcher=require(tools+'/curlfetch'),nativeFetch=fetcher.curlFetch;
let mapFixtures=0,publicSha;
fetcher.curlFetch=async function(url,headers,method,body){
 const u=new URL(url);
 if(method==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession'){
  mapFixtures++;return {status:200,headers:{'content-type':'application/json'},body:Buffer.from(JSON.stringify({session:'local-readonly-fixture',expiry:String(Math.floor(Date.now()/1000)+600),tileWidth:256,tileHeight:256,imageFormat:'png'}))};
 }
 assert.equal(method,'GET','Remote writes are prohibited');
 if(u.origin==='https://tile.googleapis.com'&&u.pathname.startsWith('/v1/2dtiles/'))return {status:200,headers:{'content-type':'image/png'},body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPt8AAAAASUVORK5CYII=','base64')};
 const r=await nativeFetch(url,headers,method,body);
 if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))publicSha=crypto.createHash('sha256').update(r.body).digest('hex');
 return r;
};
const {open}=require(tools+'/open_page');
const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1';
const out=process.env.OUTDIR||'/workspace/private-quantities998-browser/'+(mobile?'phone':'desktop');
fs.mkdirSync(out,{recursive:true});
const checks=[],failures=[];
function check(name,pass,detail){checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)failures.push(name);}
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
async function inspect(p,ref){
 await p.locator('#drawer.on [data-unit925-description]').waitFor({state:'visible'});
 // Visibility begins during the native 200 ms translateX entrance. Measure the settled
 // drawer without stopping its animation or relaxing the real overflow assertion.
 await p.waitForFunction(()=>{
  const drawer=document.querySelector('#drawer.on');
  return drawer&&getComputedStyle(drawer).transform==='none'&&drawer.getAnimations().filter(a=>a.transitionProperty==='transform').every(a=>a.playState==='finished');
 },null,{timeout:10000,polling:'raf'});
 return p.evaluate(ref=>{
  const a=assetOf(ref),model=gcModel925(a),panel=document.querySelector('#drawer [data-units925]'),select=panel.querySelector('[data-unit925-description]');
  const selected=model.groups.find(g=>g.item===select.value),known=q=>typeof q==='number'&&Number.isFinite(q)&&q>=0;
  const options=[...select.options].map((o,i)=>({value:o.value,label:o.textContent,expectedValue:model.groups[i]?.item,expected:known(model.groups[i]?.quantity)?model.groups[i].quantity+' × '+model.groups[i].item:model.groups[i]?.item}));
  const cards=[...panel.querySelectorAll('[data-unit925-id]')].map(card=>{const u=model.rows.find(u=>u.id===card.dataset.unit925Id);return {id:card.dataset.unit925Id,owner:u?.owner,physical:!!u?.physical,title:card.querySelector('h4')?.textContent,item:u?.item||'Description to confirm'};});
  const quantityCard=panel.querySelector('[data-item965-key]');
  const r=panel.getBoundingClientRect();
  return {ref:panel.dataset.units925,selected:select.value,options,cards,hasSelection:!!selected,selectionLabel:select.closest('label').firstChild.textContent,
   duplicatedPlan:[...panel.querySelectorAll(':scope > p.units925-note')].some(n=>/\b\d+(?:\.\d+)? planned\b/.test(n.textContent)),
   quantityCard:quantityCard?{title:quantityCard.querySelector('h4')?.textContent,text:quantityCard.textContent,expected:selected.quantity+' × '+selected.item}:null,
   close:!!document.querySelector('#drawer #dclose'),back:!!document.querySelector('#drawer [data-nav934-back]'),
   geometry:{left:r.left,right:r.right,width:r.width,scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth,viewportWidth:innerWidth,drawerTransform:getComputedStyle(document.querySelector('#drawer')).transform},
   overflow:panel.scrollWidth>panel.clientWidth+2||r.left< -1||r.right>innerWidth+2};
 },ref);
}
function checkDrawer(label,snapshot){
 check(label+' uses exact native description values',snapshot.options.length>0&&snapshot.options.every(o=>o.value===o.expectedValue),snapshot.options);
 check(label+' shows each known count beside its description',snapshot.options.every(o=>o.label===o.expected),snapshot.options);
 check(label+' distinguishes planned scope and avoids repeating its count',snapshot.selectionLabel.includes('planned quantity')&&!snapshot.duplicatedPlan);
 check(label+' keeps a valid selected description',snapshot.hasSelection);
 check(label+' identified cards show one physical item',snapshot.cards.every(c=>c.title===(c.physical?'1 × ':'')+c.item),snapshot.cards);
 if(snapshot.quantityCard)check(label+' quantity-only heading has count once',snapshot.quantityCard.title===snapshot.quantityCard.expected&&!/Quantity \d/.test(snapshot.quantityCard.text),snapshot.quantityCard);
 check(label+' retains Back and Close',snapshot.back&&snapshot.close);
 check(label+' fits the viewport',!snapshot.overflow,snapshot.geometry);
}
(async()=>{
 let s,evidence={author:'Andrew Fisher',mobile,publicMode,checks,failures,recordWrites:0};
 try{
  assert(publicMode?!process.env.PAGE:!!process.env.PAGE,'Set PAGE for candidate, or PUBLIC=1 without PAGE');
  s=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#subhired',W:mobile?390:1440,H:mobile?844:960,dpr:mobile?2:1,mobile});
  const p=s.page;
  await p.waitForFunction(min=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready'&&document.documentElement.dataset.refresh904==='ready'&&Number(SYNC.backend?.readVersion821?.())>=min,Number(process.env.MIN_VERSION||0),{timeout:150000});
  const initial=await p.evaluate(()=>({record:JSON.stringify(S),version:SYNC.backend?.readVersion821?.(),readonly:SYNC.readonly}));
  check('Hydrated view-only shared state',initial.readonly===true);
  if(process.env.MIN_VERSION)check('Current shared record version',Number(initial.version)>=Number(process.env.MIN_VERSION),initial.version);
  evidence.recordBefore=digest(initial.record);evidence.recordVersionBefore=initial.version;
  evidence.htmlSha256=publicMode?publicSha:digest(fs.readFileSync(process.env.PAGE));
  if(process.env.EXPECTED_SHA)check('Exact tested HTML hash',evidence.htmlSha256===process.env.EXPECTED_SHA,evidence.htmlSha256);
  const suppliers=await p.evaluate(()=>{
   const all=allAssets().filter(a=>!a._cancelled&&!a.relocation&&!movedAway(a.key));
   const find=owner=>{for(const a of all){const model=gcModel925(a,{loading:false});const u=model.rows.find(u=>u.physical&&u.owner===owner&&model.groups.some(g=>g.item===u.item));if(u)return{ref:a.key,item:u.item,owner};}return null;};
   return {coates:find('coates'),premAir:find('prem-air-hire')};
  });
  check('Current Coates and PremAir unit fixtures exist',!!suppliers.coates&&!!suppliers.premAir,suppliers);
  // Exercise the real supplier inventory button, including its item-selection handler.
  await p.evaluate(()=>{go('subhired');renderSubhired932();});
  const opener=p.locator('[data-supplier996] [data-unit925-open="WC09"][data-unit925-item="FWF"]').first();
  await opener.click();let shot=await inspect(p,'WC09');checkDrawer('Event Portables inventory opener',shot);
  check('Supplier opener selects its item',shot.ref==='WC09'&&shot.selected==='FWF');
  await p.locator('#drawer [data-unit925-description]').selectOption('Pee Panel');
  shot=await inspect(p,'WC09');checkDrawer('Quantity-only pee panels',shot);
  check('Description switch keeps quantity-only photo controls',await p.locator('#drawer [data-item965-key] [data-item965-view]').count()===1);
  await p.locator('#drawer [data-units925]').scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(out,'quantity-only-'+(mobile?'phone':'desktop')+'.png')});
  await p.locator('#drawer [data-nav934-back]').click();
  await p.waitForFunction(()=>!document.querySelector('#drawer').classList.contains('on'));
  const routes=[{route:'today',ref:'WC61',item:'FWF'}, {route:'timeline',ref:'WC69',item:'FWF'}, {route:'plant',...suppliers.coates}, {route:'demob',ref:'WC09',item:'FWF'}, {route:'map',...suppliers.premAir}].filter(r=>r.ref);
  for(const r of routes){
   await p.evaluate(({route,ref})=>{go(route);openAsset(ref);},r);
   await p.locator('#drawer.on [data-unit925-description]').waitFor({state:'visible'});
   await p.locator('#drawer [data-unit925-description]').selectOption(r.item);
   shot=await inspect(p,r.ref);checkDrawer(r.route+' / '+r.ref,shot);
   check(r.route+' opens the requested native reference',shot.ref===r.ref);
   if(r.route==='timeline'){
    await p.locator('#drawer [data-units925]').scrollIntoViewIfNeeded();
    await p.screenshot({path:path.join(out,'wc69-'+(mobile?'phone':'desktop')+'.png')});
   }
   await p.locator('#drawer #dclose').click();
   await p.waitForFunction(()=>!document.querySelector('#drawer').classList.contains('on'));
  }
  const unknown=await p.evaluate(()=>[null,undefined,'',NaN,Infinity,-1].map(q=>Description998.label('Unconfirmed',q)));
  check('Unknown quantity is never guessed',unknown.every(s=>s==='Unconfirmed'),unknown);
  if(process.env.EXPECT_CORRECTED==='1'){
   const counts=await p.evaluate(()=>['WC61','WC69'].map(ref=>{const a=assetOf(ref);return{ref,receipt:toiletItem962(a,'FWF',deliveryAsOf(ref,todayIso()),todayIso()),supplier:Supplier996.model().rows.find(r=>r.ref===ref&&r.item==='FWF')};}));
   evidence.corrected=counts;
   const linked=await p.evaluate(()=>{const m=Supplier996.model(),loads=programmeDays().filter(d=>d.iso>=todayIso()).flatMap(d=>dpLoads(d).filter(l=>l._supplier996));return {summary:m.summary,inbound:loads.reduce((n,l)=>n+l._supplier996.units,0),demob:Supplier996.demobLoads().reduce((n,l)=>n+l.units,0),wc61:m.remaining.filter(r=>r.ref==='WC61').length,wc69:m.remaining.filter(r=>r.ref==='WC69').reduce((n,r)=>n+r.remaining,0)};});
   check('Supplier outstanding and daily deliveries reconcile',linked.summary.remaining===99&&linked.inbound===99,linked);
   check('On-site inventory and demob reconcile',linked.summary.onSite===97&&linked.demob===97,linked);
   check('Completed WC61 removed and WC69 keeps six remaining',linked.wc61===0&&linked.wc69===6,linked);

   for(const c of counts){const q=c.ref==='WC61'?8:12,n=c.ref==='WC61'?8:6;check(c.ref+' installation matches current confirmation',c.receipt.quantity===q&&c.receipt.arrived===n&&c.receipt.done===n&&c.supplier.received===n&&c.supplier.installed===n&&c.supplier.remaining===q-n,c);}
  }
  const final=await p.evaluate(()=>({record:JSON.stringify(S),version:SYNC.backend?.readVersion821?.()}));
  evidence.recordAfter=digest(final.record);evidence.recordVersionAfter=final.version;
  check('Read-only navigation did not change the native record',initial.record===final.record);
  check('No page errors',s.errors.length===0,s.errors);check('No attempted operational writes',s.counts.blocked===0,s.counts);
  evidence.counts=s.counts;evidence.errors=s.errors;evidence.mapSessionFixtures=mapFixtures;
  evidence.scope='Shared drawer route entrypoints and supplier inventory button; map imagery uses explicit read-only fixtures.';
 }catch(error){evidence.failure=error.stack;failures.push(error.message);throw error;}
 finally{fs.writeFileSync(path.join(out,'browser998.json'),JSON.stringify(evidence,null,2)+'\n');if(s)await s.browser.close();}
 console.log(JSON.stringify({passed:failures.length===0,checks:checks.length,failures,out}));
 if(failures.length)throw new Error(failures.join('; '));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
