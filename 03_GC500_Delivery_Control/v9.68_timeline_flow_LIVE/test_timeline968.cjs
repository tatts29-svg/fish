/* Author: Andrew Fisher. Isolated DOM regression; every network request is blocked. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.route('**/*',route=>route.abort());
  await page.setContent('<main id="pane-timeline"></main>');await page.evaluate(()=>{window.renderTimeline=()=>17;window.applyCapability=()=>19;});
  await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'timeline968.js'),'utf8')});
  const result=await page.evaluate(()=>{
   const ok=(x,m)=>{if(!x)throw Error(m);checks.push(m);},checks=[];
   const fixture=(key='load-1')=>'<details open class="loading872 r924 r931" data-r931-load="'+key+'"><summary>Loading information</summary><div class="r924-body"><section class="r931-product" data-r931-product="Generator"><b>GN01 · 1 × Generator</b><p class="hint"><b>SUB-HIRED — PremAir Hire</b></p><p class="hint">0085</p><p class="r931-fact"><span>Recorded actual</span><strong>6000 × 2400 × 2200 mm · 3800 kg</strong><small>Signed equipment sheet</small></p><p class="r931-fact"><span>Delivered rating</span><strong>100 kVA</strong></p><p class="r931-fact"><span>Guide range — 2 listed models</span><strong>Mass 3700–3900 kg</strong><a href="/guide#page=41">Guide p41</a></p><p><b>Loading</b> · Full loading method retained.</p><p class="hint">Method scope retained.</p><details class="r931-history"><summary>Saved transport evidence</summary><p>Recorded note retained.</p></details></section><section class="r931-product" data-r931-product="Unknown"><b>WC01 · 1 × Unknown</b><p><b>Loading</b> · Manufacturer method.</p></section><p class="hint">Guide model figures are reference values.</p></div></details>';
   const pane=document.getElementById('pane-timeline');pane.innerHTML=fixture();TimelineFlow968.apply(pane);
   const panel=pane.querySelector('[data-r931-load]'),more=panel.querySelector('[data-timeline968-more]');
   ok(panel.tagName==='SECTION','Known data is not inside the closed disclosure');
   ok(!more.open,'More info starts closed');
   ok(more.querySelector('summary').textContent==='More info','Short disclosure caption');
   ok(panel.querySelector('.r924-body .r931-fact strong').textContent==='6000 × 2400 × 2200 mm · 3800 kg','Recorded dimensions and mass are unchanged');
   ok(panel.querySelector('.r924-body').textContent.includes('Mass 3700–3900 kg'),'Guide range remains available as data');
   ok(panel.querySelector('.r924-body').textContent.includes('Guide range — 2 listed models'),'Guide range qualification stays visible');
   ok(panel.querySelector('.r924-body').textContent.includes('SUB-HIRED — PremAir Hire'),'Supplier marking stays visible');
   ok(panel.querySelector('.r924-body').textContent.includes('0085'),'Recorded identity remains visible');
   ok(!panel.querySelector('.r924-body').textContent.includes('Full loading method'),'Method does not crowd default data');
   ok(!panel.querySelector('.r924-body').textContent.includes('Signed equipment sheet'),'Source notes are behind More info');
   ok(!panel.querySelector('.r924-body').textContent.includes('100 kVA'),'Other ratings are behind More info');
   for(const text of ['100 kVA','Signed equipment sheet','Guide p41','Full loading method retained.','Method scope retained.','Recorded note retained.','Manufacturer method.','Guide model figures are reference values.'])ok(more.textContent.includes(text),'Detail retained: '+text);
   ok(more.querySelector('a').getAttribute('href')==='/guide#page=41','Source link destination unchanged');
   const unknown=panel.querySelector('.r924-body [data-r931-product="Unknown"]');
   ok(!unknown.querySelector('input,textarea,.r931-fact'),'Unknown dimensions produce no invented value or blank form');
   const html=pane.innerHTML;TimelineFlow968.apply(pane);ok(pane.innerHTML===html,'Reconciliation is idempotent');
   more.open=true;TimelineFlow968.remember(pane);pane.innerHTML=fixture();TimelineFlow968.apply(pane);ok(pane.querySelector('[data-timeline968-more]').open,'Open choice survives replacement');
   pane.querySelector('[data-timeline968-more]').open=false;TimelineFlow968.remember(pane);pane.innerHTML=fixture();TimelineFlow968.apply(pane);ok(!pane.querySelector('[data-timeline968-more]').open,'Closed choice survives replacement');
   pane.querySelector('[data-timeline968-more]').open=true;TimelineFlow968.remember(pane);pane.innerHTML=fixture('other-load');TimelineFlow968.apply(pane);ok(!pane.querySelector('[data-timeline968-more]').open,'A different load has a separate default');
   pane.innerHTML='<div class="daynav"><button data-view="day">One day</button><button data-view="agenda">Every day</button><span style="flex:1"></span><button data-day-step="-1" disabled>Prev</button><button data-day="2026-10-09">Today</button><button data-day-step="1">Next</button></div>';
   const next=pane.querySelector('[data-day-step="1"]');let count=0;next.addEventListener('click',()=>count++);TimelineFlow968.apply(pane);next.click();
   ok(count===1,'Existing day button listener retained');ok(pane.querySelector('[data-day-step="-1"]').disabled,'First-day disabled state retained');
   ok(pane.querySelector('[data-timeline968-days]').children.length===3,'Prev Today Next stay together');ok(pane.querySelectorAll('[data-view]').length===2,'View controls retained');
   const nav=pane.innerHTML;TimelineFlow968.apply(pane);ok(pane.innerHTML===nav,'Day group is idempotent');
   pane.innerHTML=fixture().replace('data-r931-load','data-r931-ref');const reference=pane.innerHTML;TimelineFlow968.apply(pane);ok(pane.innerHTML===reference,'Reference loading display is untouched');
   pane.innerHTML='<details data-r931-load="partial"><summary>Retained</summary><p>Partial content</p></details>';const partial=pane.innerHTML;TimelineFlow968.apply(pane);ok(pane.innerHTML===partial,'Unrecognised loading structure is preserved');
   pane.innerHTML='<div class="timeline908-plans"><details class="loading872"><summary>Door side not set</summary><input type="radio" disabled data-door872-ref="GN01"></details><details class="loading872 crew883"><summary>Workers · Not assigned</summary><button id="retained-handler">Native control</button></details>'+fixture('controls-load')+'</div>';
   const originalInput=pane.querySelector('input'),button=pane.querySelector('#retained-handler');let clicks=0;button.addEventListener('click',()=>clicks++);TimelineFlow968.apply(pane);
   const folded=pane.querySelector('[data-timeline968-controls]');ok(folded.children.length===2,'Optional controls are inside More info');
   ok(folded.closest('[data-timeline968-more]')&&!folded.closest('[data-timeline968-more]').open,'Unknown control prompts are collapsed initially');
   ok(folded.querySelector('input')===originalInput&&originalInput.disabled,'Native field and view-only state retained');button.click();ok(clicks===1,'Native optional-control handler retained');
   folded.firstElementChild.open=true;TimelineFlow968.remember(pane);const oldChoice=folded.firstElementChild.getAttribute('data-timeline968-choice');
   pane.innerHTML='<div class="timeline908-plans"><details class="loading872"><summary>Door side set</summary></details><details class="loading872"><summary>Workers</summary></details>'+fixture('controls-load')+'</div>';TimelineFlow968.apply(pane);
   ok(pane.querySelector('[data-timeline968-controls]').firstElementChild.open,'Nested control disclosure survives replacement');ok(pane.querySelector('[data-timeline968-controls]').firstElementChild.getAttribute('data-timeline968-choice')===oldChoice,'Control choice uses load identity, not changing status text');
   const shell=document.createElement('div');shell.innerHTML='<section class="pane" id="pane-fixture"><p class="rochip view"><i aria-hidden="true"></i><span><b>View only.</b> This link cannot change the record.</span></p></section>';
   TimelineFlow968.capability(shell);const cap=shell.querySelector('.rochip');ok(cap.tagName==='DIV','Capability disclosure has valid container markup');ok(!cap.querySelector('details').open,'Capability explanation starts closed');ok(cap.querySelector('summary').textContent==='View only · More info','Short read-only label stays visible');ok(cap.querySelector('details > div').textContent.includes('This link cannot change the record.'),'Full capability explanation retained');
   const capHtml=shell.innerHTML;TimelineFlow968.capability(shell);ok(shell.innerHTML===capHtml,'Capability projection is idempotent');cap.querySelector('details').open=true;TimelineFlow968.remember(shell);
   shell.innerHTML='<section class="pane" id="pane-fixture"><p class="rochip view"><i></i><span><b>View only.</b> Original explanation.</span></p></section>';TimelineFlow968.capability(shell);ok(shell.querySelector('details').open,'Capability disclosure choice survives redraw');
   return {checks};
  });
  assert.equal(result.checks.length,44);console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
