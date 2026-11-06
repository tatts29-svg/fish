/* Author: Andrew Fisher. Private CSS-only comparison; no product or record writes. */
'use strict';
const fs=require('fs'),path=require('path');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
(async()=>{
 process.env.INITIAL_HASH='#demob';const h=await openCandidate(),p=h.page;
 try{
  await p.clock.setFixedTime(new Date('2026-10-31T00:30:00Z'));
  await p.evaluate(()=>{DM816.view='everything';DM816.branch='all';renderDemob816();});
  await p.waitForSelector('#pane-demob article.sg1238 .stp1238');
  await p.locator('#pane-demob [data-f1238="gone"]').click();
  const backdrop=process.env.DIAGNOSTIC_STYLE==='backdrop';
  await p.addStyleTag({content:backdrop?'.stp1238>.artwork1270-frame,.stamp1232>.artwork1270-frame{background:#103b2a!important;opacity:.30!important;mix-blend-mode:normal!important}.artwork1270-frame>img.artwork1270-photo{mix-blend-mode:multiply!important}':'.artwork1270-frame{mix-blend-mode:multiply!important;opacity:.30!important}'});
  fs.mkdirSync(process.env.OUT,{recursive:true});
  for(const id of (backdrop?['gen_qas80','distribution_board']:['gen_qas80','light_tower','distribution_board'])){
   const m=await p.evaluate(id=>Singles1238.model().cards.find(c=>c.st.s==='gone'&&Artwork1270.resolveAll(c).includes(id)),id);if(!m)continue;
   const selector=await p.evaluate(c=>'#pane-demob article.sg1238[data-sg1238="'+CSS.escape(c.key)+'"][data-u1238="'+CSS.escape(c.uid)+'"]',m);
   const card=p.locator(selector);await p.evaluate(c=>Singles1238.goCard(c.key,c.uid),m);await card.scrollIntoViewIfNeeded();
   await card.evaluate(n=>{n.style.contentVisibility='visible';n.scrollIntoView({block:'center',inline:'center',behavior:'instant'});});
   await card.locator('img[data-photo1270]').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));
   await card.screenshot({path:path.join(process.env.OUT,'diagnostic-'+(backdrop?'backdrop':'multiply')+'-'+id+'.png'),animations:'disabled'});
  }
  console.log(JSON.stringify({diagnostic:true,errors:h.errors,consoleErrors:h.consoleErrors,writes:h.counts.blocked}));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
