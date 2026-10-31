/* Author: Andrew Fisher. Actual mobile source-quantity labels; no record writes. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const manifest=require('../contract_quantity1250.json');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 assert(process.env.PAGE&&process.env.PAGE_SHA&&process.env.STATE&&process.env.OUT&&process.env.FIXED_TIME&&process.env.MOB==='1','Exact candidate, snapshot, private output and mobile context required');
 const output=path.resolve(process.env.OUT);assert(!output.startsWith(path.resolve(__dirname,'../../..')+path.sep),'Evidence stays outside git');fs.mkdirSync(output,{recursive:true});
 assert.equal(sha(fs.readFileSync(process.env.PAGE)),process.env.PAGE_SHA);
 const instant=new Date(process.env.FIXED_TIME);assert(Number.isFinite(instant.getTime()));
 const s=await openCandidate();
 try{
  await s.page.clock.setFixedTime(instant);
  const before=await s.page.evaluate(()=>holdAssets(()=>{RENDER_MEMO.clear();HELD_MEMO.clear();return{docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),ledger:pl770Model(),scope:scopeFigures()};}));
  const card=s.page.locator('#card748');assert.equal(await card.count(),1,'Actual street-card source view exists');
  // Open only existing native disclosure controls. Do not unhide or restyle the retired source table.
  while(await card.locator('xpath=ancestor::details[not(@open)]').count())
   await card.locator('xpath=ancestor::details[not(@open)]').first().locator(':scope > summary').click();
  await card.locator('details.fold748:not([open]) > summary').click();
  const labels=[];
  for(const rule of manifest.rows){
   const row=card.locator('tbody > tr').filter({has:s.page.locator('td:first-child').filter({hasText:new RegExp('^'+rule.contract+' · '+rule.line+'$')})});
   assert.equal(await row.count(),1,'One actual contract row '+rule.contract+'/'+rule.line);
   const what=row.locator('td').nth(1);await what.scrollIntoViewIfNeeded();
   // Pan the existing table; a cell's box alone does not prove that its text is
   // visible because the native sticky first column can cover quantity digits.
   const shown=await what.evaluate((node,quantity)=>{
    const token=String(quantity),walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),parts=[];
    let part,content='';while((part=walker.nextNode())){parts.push({node:part,start:content.length});content+=part.textContent;}
    const start=content.lastIndexOf(token),end=start+token.length;
    if(start<0||content.slice(end).trim())throw Error('Final quantity token not found');
    const range=document.createRange(),first=parts.find(p=>start>=p.start&&start<p.start+p.node.textContent.length),last=parts.find(p=>end>p.start&&end<=p.start+p.node.textContent.length);
    range.setStart(first.node,start-first.start);range.setEnd(last.node,end-last.start);
    const sticky=node.parentElement.cells[0];
    let scroller=node.parentElement;
    while(scroller&&!(scroller.scrollWidth>scroller.clientWidth+1&&/auto|scroll/.test(getComputedStyle(scroller).overflowX)))scroller=scroller.parentElement;
    if(!scroller)throw Error('Existing horizontal table scroller not found');
    // Native scroll positions only; no app state, CSS, dimensions or DOM edits.
    for(let i=0;i<4;i++){
     const rect=range.getBoundingClientRect(),clip=scroller.getBoundingClientRect(),fixed=sticky.getBoundingClientRect();
     const left=Math.max(0,clip.left,fixed.right)+8,right=Math.min(innerWidth,clip.right)-8;
     if(rect.left>=left&&rect.right<=right)break;
     scroller.scrollLeft+=rect.left-left;
    }
    const initial=range.getBoundingClientRect();window.scrollBy(0,initial.top+initial.height/2-innerHeight/2);
    const rect=range.getBoundingClientRect(),fixed=sticky.getBoundingClientRect(),clip=scroller.getBoundingClientRect();
    const points=[0.05,0.5,0.95].map(t=>({x:rect.left+rect.width*t,y:rect.top+rect.height/2}));
    const hits=points.map(p=>{const hit=document.elementFromPoint(p.x,p.y);return{...p,unobscured:hit===node||node.contains(hit),hit:hit?hit.tagName+'.'+hit.className:null};});
    return{text:node.innerText,token:range.toString(),quantityBox:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom},stickyRight:fixed.right,clipLeft:clip.left,clipRight:clip.right,scrollLeft:scroller.scrollLeft,width:innerWidth,height:innerHeight,hits};
   },rule.quantity);
   assert(shown.text.endsWith(' × '+rule.quantity),'Actual source quantity has full precision');
   assert.equal(shown.token,String(rule.quantity),'Range selects the complete quantity digits');
   assert(shown.quantityBox.left>=Math.max(0,shown.clipLeft,shown.stickyRight)&&shown.quantityBox.right<=Math.min(shown.width,shown.clipRight)&&shown.quantityBox.top>=0&&shown.quantityBox.bottom<=shown.height,'Complete quantity digits fit the unobscured phone table viewport');
   assert(shown.hits.every(hit=>hit.unobscured),'No sticky column or other element covers the quantity digits');
   labels.push({contract:rule.contract,line:rule.line,...shown});
   await s.page.screenshot({path:path.join(output,'quantity-'+rule.contract+'-'+rule.line+'-phone.png'),fullPage:false});
  }
  const footer=s.page.locator('#footL');await footer.scrollIntoViewIfNeeded();
  const footerText=await footer.innerText();assert(/\bv12\.50\b/.test(footerText),'Actual footer DOM reads v12.50; the phone footer is ellipsized');
  await s.page.screenshot({path:path.join(output,'quantity-footer-phone.png'),fullPage:false});
  const after=await s.page.evaluate(()=>holdAssets(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),ledger:pl770Model(),scope:scopeFigures(),queue:{inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}})));
  assert.equal(after.docs,before.docs);assert.deepEqual(after.ledger,before.ledger);assert.deepEqual(after.scope,before.scope);assert.deepEqual(after.queue,{inflight:0,queued:0});assert.deepEqual([s.errors,s.consoleErrors,s.counts.blocked],[[],[],0]);
  const result={author:'Andrew Fisher',baseline:s.baseline,fixedTime:instant.toISOString(),labels,footer:footerText,footerProof:'DOM version only; existing phone footer is ellipsized',documentsUnchanged:true,ledgerUnchanged:true,scopeUnchanged:true,pageErrors:s.errors,consoleErrors:s.consoleErrors,writeAttempts:s.counts.blocked,status:'PASS'};
  fs.writeFileSync(path.join(output,'phone-precision.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS six unobscured mobile quantity tokens, footer DOM version and unchanged native record/ledger/scope');
 }finally{await s.browser.close();}
})().catch(e=>{console.error('FAIL '+e.stack);process.exitCode=1;});
