// Author: Andrew Fisher. Read-only real-page capture and export checks; fixture state is restored synchronously.
const {open}=require('../toolchain/harness/open_page');
(async()=>{let session;try{
 const mobile=!!process.env.MOB;
 session=await open({pageFile:process.env.PAGE,W:mobile?390:1440,H:mobile?844:1000,mobile});
 const p=session.page;
 await p.waitForFunction(()=>typeof recordCollection==='function'&&typeof recordServiceScrim898==='function'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const checks=await p.evaluate(()=>{
  const out=[],ok=(name,pass)=>out.push({name,pass:!!pass}),before=JSON.stringify(S),saved={S,bump,whoAmI,mayWrite,capability,readonly:SYNC.readonly,level:SYNC.level,flash,tab:state.tab,q:state.q,fenceDay:state.fenceDay,fenceWeek:state.fenceWeek,view:{...FENCE_PRIVATE_VIEW},paper:{...PAPER},dl:SYNC.dl,first:SYNC.first};
  const unfold=selector=>{for(let e=document.querySelector(selector);e;e=e.parentElement)if(e.tagName==='DETAILS')e.open=true;};
  let download=null;
  try{
   S=Object.assign(blank(),{operator:'Fixture reviewer'});bump=()=>{};whoAmI=()=>S.operator;mayWrite=()=>true;capability=()=>'edit';SYNC.readonly=false;SYNC.level='edit';flash=()=>{};
   const day=todayIso(),number='989898';
   PAPER.open='blue';go('fencing');unfold('#cnSave');
   const save=document.querySelector('#cnSave');
   ok('native collection form is visible and its save button enabled',save&&save.checkVisibility()&&!save.disabled);
   for(const [id,value] of Object.entries({cnNo:number,cnDate:day,cnWhere:'Synthetic collection test',cn_mesh_panel:'3',cn_base:'4',cn_clamp:'2'}))document.getElementById(id).value=value;
   save.onclick();
   const c=S.fenceCollections[0];
   ok('native collection created with numeric counts',c&&c.collected.base===4);
   PAPER.open=null;go('fencing');
   const row=document.querySelector('[data-fp-id="'+c.id+'"]');
   ok('saved collection is immediately visible in blue book',FENCE_PRIVATE_VIEW.book==='blue'&&!!row&&row.getClientRects().length>0&&row.textContent.includes(number));
   ok('collection has native attachment and set-aside controls',!!row?.querySelector('[data-dkp]')&&!!row?.querySelector('[data-cndel]'));
   ok('collection does not show financial totals',row&&!row.querySelector('.fp-money')?.textContent.includes('$'));
   PAPER.open='blue';renderFencing();unfold('#cnSave');
   ok('collection form exposes actual native save button and fields',document.querySelector('#cnSave')?.checkVisibility()&&!!document.querySelector('[data-cnc="base"]'));
   PAPER.open='red';renderFencing();unfold('#haComponentsOnly');
   ok('red form exposes visible components-only choice',document.querySelector('#haComponentsOnly')?.checkVisibility());
   const d=recordHireAgreement({docket_no:'989899',date:day,location:'Synthetic component test',components_only:true,quantities:{},components:{base:4,clamp:2,brace:2}});
   FENCE_PRIVATE_VIEW.book='red';PAPER.open=null;renderFencing();
   const dr=document.querySelector('[data-fp-id="'+d.id+'"]');
   ok('components-only row shows counts and unknown charge quantity',dr&&/charge quantity unconfirmed/.test(dr.textContent)&&!dr.querySelector('.fp-money')?.textContent.includes('$'));
   ok('components-only entry adds no derived P&L charge',!docketCostLines().some(x=>x.docket===d.id));
   SYNC.dl={save(payload){download=payload;return{then(){}};}};SYNC.first=new Set([...saved.first,'fenceCollections']);
   document.querySelector('#exportBtn').onclick();
   const exported=download?JSON.parse(download.data):null;
   ok('real Export button payload includes nested and envelope collection rows',exported&&exported.records.fenceCollections.some(r=>r.id===c.id)&&exported.fence_collections.some(r=>r.id===c.id));
   download=null;SYNC.first=new Set();document.querySelector('#exportBtn').onclick();
   ok('hosted Export waits for first collection snapshot',!SYNC.backend||download===null);
  }finally{
   S=saved.S;bump=saved.bump;whoAmI=saved.whoAmI;mayWrite=saved.mayWrite;capability=saved.capability;SYNC.readonly=saved.readonly;SYNC.level=saved.level;flash=saved.flash;SYNC.dl=saved.dl;SYNC.first=saved.first;
   Object.assign(state,{q:saved.q,fenceDay:saved.fenceDay,fenceWeek:saved.fenceWeek});Object.assign(FENCE_PRIVATE_VIEW,saved.view);Object.assign(PAPER,saved.paper);go(saved.tab);
  }
  ok('shared record and original readers restored',JSON.stringify(S)===before&&bump===saved.bump&&whoAmI===saved.whoAmI&&mayWrite===saved.mayWrite);
  return out;
 });
 if(process.env.EVIDENCE_DIR){
  await p.evaluate(()=>{window.__capture898View={tab:state.tab,open:PAPER.open,folds:{...FENCE_PRIVATE_VIEW.folds},mayWrite,capability,readonly:SYNC.readonly,level:SYNC.level};mayWrite=()=>true;capability=()=>'edit';SYNC.readonly=false;SYNC.level='edit';PAPER.open=null;go('fencing');});
  try{
   const fold=p.locator('details.fp-fold').filter({has:p.locator('summary').filter({hasText:'Record a signed paper'})});
   if(await fold.getAttribute('open')===null)await fold.locator(':scope > summary').click();
   await p.waitForFunction(()=>FENCE_PRIVATE_VIEW.folds['Record a signed paper']===true);
   await p.locator('[data-paper="blue"]').click();
   await p.waitForFunction(()=>document.querySelector('#cnNo')?.checkVisibility());
   await p.evaluate(()=>renderFencing());
   await p.waitForFunction(()=>document.querySelector('#cnNo')?.checkVisibility());
   checks.push({name:'user-opened collection form stays visible after native redraw',pass:true});
   await p.locator('#cnNo').scrollIntoViewIfNeeded();
   await p.screenshot({path:require('path').join(process.env.EVIDENCE_DIR,(mobile?'phone':'laptop')+'-collection-form.png')});
  }
  finally{await p.evaluate(()=>{const old=window.__capture898View;mayWrite=old.mayWrite;capability=old.capability;SYNC.readonly=old.readonly;SYNC.level=old.level;PAPER.open=old.open;FENCE_PRIVATE_VIEW.folds=old.folds;go(old.tab);delete window.__capture898View;});}
 }
 checks.push({name:'no browser errors',pass:session.errors.length===0},{name:'no attempted network writes',pass:session.counts.blocked===0});
 checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(`${mobile?'phone':'laptop'}: ${checks.filter(c=>c.pass).length}/${checks.length}`);
 if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{if(session)await session.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
