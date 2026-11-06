/* Author: Andrew Fisher. Read-only real-page presentation verification; native writes blocked by harness. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),{open}=require(path.join(root,'toolchain/harness/open_page.js'));
const pageFile=process.env.PAGE,out=process.env.OUT||'/workspace/private-information1013-browser',baseline=process.env.BASELINE==='1';
const hash=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');
if(process.env.EXPECTED_SHA&&hash!==process.env.EXPECTED_SHA)throw Error('Unexpected source bytes');
(async()=>{fs.mkdirSync(out,{recursive:true});const h=await open({pageFile,hash:'#today',mobile:true,W:430,H:932,dpr:2});try{
 const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
 const checks=[],check=(name,pass,actual)=>checks.push({name,pass:!!pass,...(actual===undefined?{}:{actual})});
 const observations=await p.evaluate(()=>{
  const version=SYNC.backend.readVersion821(),before=JSON.stringify(S),ref=assetOf('WC51'),d=deliveryOf('WC51'),partial=toiletPresentation962(ref,d,todayIso());
  const receipt=deliveryOf('T0266'),at=receipt.set_at,record=JSON.parse(JSON.stringify(S.delivery.T0266)),evidence=(record.history||[]).find(h=>h.date_only===true&&h.at===at)||record,stamp=fmtStamp(at,receipt),time=timeOfStamp(at,receipt);
  const facts={version,partial,chip:lightChip(ref,{full:true}),view:deliveryView(ref),receipt:{at,date_only:evidence.date_only,effective_date:evidence.effective_date,stamp,time},noMutation:JSON.stringify(S)===before};
  return facts;
 });
 check('Read-only projections do not change the native record',observations.noMutation);
 check('WC51 current item scope remains six received and one outstanding',observations.partial?.quantity===7&&observations.partial?.arrived===6&&observations.partial?.done===6,observations.partial);
 check(baseline?'Original partial red chip reproduced':'Partial receipt chip is amber and names scope',baseline?/tl red/.test(observations.chip):/tl amber/.test(observations.chip)&&/6/.test(observations.chip),observations.chip);
 check('T0266 date-only source evidence is intact',observations.receipt.date_only===true&&observations.receipt.effective_date==='2026-10-13',observations.receipt);
 check(baseline?'Original fake midnight reproduced':'Date-only receipt has no invented midnight',baseline?/00:00/.test(observations.receipt.stamp):/time not recorded/i.test(observations.receipt.stamp)&&!/00:00/.test(observations.receipt.stamp),observations.receipt);
 await p.evaluate(()=>{go('plant');openAsset('WC51');});await p.waitForTimeout(350);
 const drawer=await p.evaluate(()=>{const d=document.querySelector('#drawer'),summary=d.querySelector('.sum816'),checks=d.querySelector('.cmp816');return {summary:summary?.innerText,checks:checks?.innerHTML,signal:checks?.querySelector('.signalhead')?.outerHTML||null};});
 check('Partial drawer shows current received/installed summary',/6/.test(drawer.summary||'')&&/7/.test(drawer.summary||''),drawer.summary);
 if(!baseline)check('Partial drawer does not date its item scope by the old whole-reference red light',!(/since 03 Oct|recorded 03 Oct/i.test(drawer.summary||'')),drawer.summary);
 await p.locator('#drawer .sum816').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'wc51-partial-phone.png')});
 await p.locator('#drawer .cmp816').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'wc51-checks-phone.png')});
 if(!baseline){const fold=p.locator('#drawer [data-sfold="drawer|whole-checks|WC51"]');check('Earlier whole-reference controls start closed',await fold.count()===1&&await fold.evaluate(d=>!d.open));await fold.locator('summary').click();check('Native light and completion controls remain accessible when expanded',await fold.locator('[data-light="WC51"][data-s="not on site"]').isVisible()&&await fold.locator('[data-done="WC51"]').isVisible());await p.evaluate(()=>openAsset('WC51'));await p.waitForTimeout(120);check('Whole-reference More info remains open after redraw',await p.locator('#drawer [data-sfold="drawer|whole-checks|WC51"]').evaluate(d=>d.open));await p.locator('#drawer [data-sfold="drawer|whole-checks|WC51"] > summary').click();}
 await p.evaluate(()=>openAsset('T0266'));await p.waitForTimeout(250);await p.locator('#drawer .sum816').scrollIntoViewIfNeeded();
 const receivedSummary=await p.locator('#drawer .sum816').innerText();check(baseline?'Original drawer midnight is visible':'Container drawer shows only known arrival date',baseline?/00:00/.test(receivedSummary):/13 Oct/.test(receivedSummary)&&/time not recorded/i.test(receivedSummary),receivedSummary);
 await p.screenshot({path:path.join(out,'t0266-date-phone.png')});
 await p.evaluate(()=>{const c=document.getElementById('dclose');if(c)c.click();go('pricing');});await p.waitForTimeout(300);
 const pricing=await p.evaluate(()=>{const pane=document.getElementById('pane-pricing'),card=[...pane.querySelectorAll('.card')].find(x=>x.querySelector('h3')?.textContent==='Pricing checks');return {visible:card?.innerText,closed:card?!!card.querySelector('details:not([open])'):false,history:card?.querySelector('details')?.textContent,oldVisible:!card&&pane.innerText.includes('What is still missing before a total means anything')};});
 if(baseline)check('Original current-looking obsolete setup list reproduced',pricing.oldVisible);
 else{check('Current generated pricing checks are visible',!!pricing.visible&&/rate-card/.test(pricing.visible),pricing.visible);check('Earlier source questions remain closed under More info',pricing.closed&&/Historical source notes/.test(pricing.history||''));const card=p.locator('#pane-pricing .card').filter({has:p.locator('h3',{hasText:'Pricing checks'})});await card.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'pricing-checks-phone.png')});}
 await p.evaluate(()=>go('coatesway'));await p.waitForTimeout(250);
 if(!baseline){const coates=await p.evaluate(()=>{const pane=document.getElementById('pane-coatesway');return {text:pane.innerText,closed:[...pane.querySelectorAll('details:not([open])')].map(x=>x.textContent)};});check('Dated fencing confirmation is distinguished from live figures',coates.text.includes('Last confirmation: 12 Oct 2026 · on track'));check('Company target guidance retained in More info',coates.closed.some(t=>t.includes('Company targets are shown separately')));}
 const result={author:'Andrew Fisher',baseline,sourceSha256:hash,observations,drawer,checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass),errors:h.errors,network:h.counts};
 fs.writeFileSync(path.join(out,'information1013.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({out,baseline,sourceSha256:hash,passed:result.passed,failed:result.failed,errors:h.errors,network:h.counts}));if(result.failed.length||h.errors.length||h.counts.blocked)process.exitCode=1;
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
