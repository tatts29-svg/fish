/* Author: Andrew Fisher. Native tab caption fit and keyboard regression checks. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {open}=require('../toolchain/harness/open_page');
const PAGE=process.env.PAGE,OUT=process.env.OUT;
assert(PAGE&&OUT&&path.isAbsolute(OUT),'PAGE and private absolute OUT directory required');
assert(!path.resolve(OUT).startsWith(path.resolve(__dirname,'../..')+path.sep),'Evidence must stay outside the repository');
fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const waitPaint=p=>p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
(async()=>{
 const s=await open({pageFile:PAGE,hash:'#docs',W:390,H:844,mobile:true,dpr:2});
 const p=s.page,consoleErrors=[],cases=[];
 p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,200));});
 try{
  await p.waitForFunction(()=>typeof go==='function'&&typeof renderTabs==='function'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
  await p.evaluate(()=>document.fonts.ready);
  for(const tab of ['docs','fencing','prestarts','servicing','vms','questions','about','costs']){
   await p.setViewportSize({width:390,height:844});
   await p.evaluate(tab=>go(tab),tab);
   await waitPaint(p);
   assert.equal(await p.evaluate(()=>state.tab),tab,'native route '+tab);
   for(const width of [360,390,430,640,1440]){
    await p.setViewportSize({width,height:844});
    await p.evaluate(()=>renderTabs());
    await waitPaint(p);
    const item=await p.evaluate(({tab,width})=>{
     const bar=document.getElementById('tabs'),r=bar.getBoundingClientRect(),buttons=[...bar.querySelectorAll('[role="tab"]')];
     const measurements=buttons.map(button=>{
      const caption=button.querySelector('.tw'),b=button.getBoundingClientRect(),c=caption.getBoundingClientRect(),rects=[];
      const walk=document.createTreeWalker(caption,NodeFilter.SHOW_TEXT);
      for(let node=walk.nextNode();node;node=walk.nextNode()){
       const range=document.createRange();range.selectNodeContents(node);
       for(const box of range.getClientRects())if(box.width&&box.height)rects.push({left:box.left,right:box.right,top:box.top,bottom:box.bottom});
      }
      /* Range rectangles include font ascent/descent outside the native 1.05 line-height.
         Comparing that font box to the caption's shorter line box falsely rejects even Today.
         Check horizontal clipping exactly, the occupied line-height span, and the real button bounds. */
      const lineHeight=parseFloat(getComputedStyle(caption).lineHeight),tops=rects.map(t=>t.top);
      const lineSpan=rects.length?Math.max(...tops)-Math.min(...tops)+lineHeight:0;
      const fits=rects.every(t=>t.left>=c.left-.6&&t.right<=c.right+.6&&t.top>=b.top-.6&&t.bottom<=b.bottom+.6)&&lineSpan<=c.height+.6;
      return {tab:button.dataset.tab,selected:button.getAttribute('aria-selected'),name:button.getAttribute('aria-label')||caption.innerText,controls:button.getAttribute('aria-controls'),fits,visibleCaption:caption.innerText,lineHeight,lineSpan,rects,captionBox:{left:c.left,right:c.right,top:c.top,bottom:c.bottom,height:c.height},box:{left:b.left,right:b.right,top:b.top,bottom:b.bottom}};
     });
     const active=measurements.find(x=>x.tab===tab);
     const primary=tabPrimary();
     return {tab,width,bar:{left:r.left,right:r.right,height:r.height,scrollWidth:bar.scrollWidth,clientWidth:bar.clientWidth},measurements,active,
      primaryIntact:primary.every(k=>measurements.some(x=>x.tab===k)),rowFits:width>640||bar.scrollWidth<=bar.clientWidth+1,
      fullName:tab==='costs'?null:(TABS.find(([key])=>key===tab)||[])[1],paneShown:!document.getElementById('pane-'+tab).hidden};
    },{tab,width});
    cases.push(item);
    if(width===390&&['docs','fencing'].includes(tab))await p.screenshot({path:path.join(OUT,'phone-'+tab+'-captions1307.png')});
   }
  }
  await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>go('about'));
  await waitPaint(p);
  await p.focus('#tab-about');await p.keyboard.press('ArrowRight');await waitPaint(p);
  const keyboard=await p.evaluate(()=>({tab:state.tab,focus:document.activeElement?.id,selected:document.querySelector('#tabs [aria-selected="true"]')?.id}));
  const result={author:'Andrew Fisher',cases,keyboard,errors:s.errors,consoleErrors,attemptedRecordWrites:s.counts.blocked};
  fs.writeFileSync(path.join(OUT,'phone-tab-captions1307.json'),JSON.stringify(result,null,2)+'\n');
  const failed=cases.flatMap(x=>x.measurements.filter(m=>!m.fits).map(m=>({tab:x.tab,width:x.width,caption:m.tab})));
  console.log(JSON.stringify({cases:cases.length,clippedCaptions:failed,keyboard,errors:s.errors,consoleErrors,attemptedRecordWrites:s.counts.blocked}));
  for(const item of cases){
   assert(item.primaryIntact,item.tab+' keeps primary tabs at '+item.width);
   assert(item.rowFits,item.tab+' bar stays in viewport at '+item.width);
   assert(item.paneShown,item.tab+' remains visible after resize');
   if(item.tab!=='costs'){
    assert(item.active,item.tab+' active tab remains present');
    assert.equal(item.active.selected,'true',item.tab+' selected state');
    assert.equal(item.active.name,item.fullName,item.tab+' full accessible name');
    assert.equal(item.active.controls,'pane-'+item.tab,item.tab+' panel association');
   }
  }
  assert.deepEqual(failed,[],'all visible tab captions fit without clipping');
  assert.deepEqual(keyboard,{tab:'today',focus:'tab-today',selected:'tab-today'},'native keyboard wrap retains navigation and focus');
  assert.deepEqual(s.errors,[]);assert.deepEqual(consoleErrors,[]);assert.equal(s.counts.blocked,0);
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

