// Author: Andrew Fisher. Read-only service; dynamic checks modify memory then restore it.
const fs=require('fs'),assert=require('assert/strict'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const mobile=process.env.MOB==='1',h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:900,dpr:1,hash:'#today'}),p=h.page;try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
 const r=await p.evaluate(()=>{
  const check=[],ok=(name,pass,detail)=>{check.push({name,pass:!!pass,...(detail?{detail}: {})});},snapshot=JSON.stringify(S),cents=OnsiteCharges1006.cents;
  holdAssets(()=>{
   const assets=allAssets(),rows=assets.filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key)).flatMap(a=>chargeLines(a).map(l=>({a,l,p:charge1006(a,l)}))),plan=labourPlan(),m=moneySummary(),t=pl760Ticks(),bill=onsiteComplete979(),pl=pl770Model(),ties=recon888Model().ties;
   ok('Money summary equals included charge plan',m.charge.labour===plan.all.charged);
   ok('P&L branch labour equals included plan',t.total===plan.all.charged);
   ok('Branch included amounts add once',cents(Object.values(t.byBranch).reduce((n,r)=>n+r.amount,0))===t.total);
   ok('All financial reconciliation checks pass',ties.filter(r=>r.group==='P&L').every(r=>r.ok));
   const october=acc761Model('2026-10'),billing=october.revenue.flatMap(r=>r.extra?.sources||[]).filter(s=>s.chargeIncluded1006);ok('October included charge quantity matches P&L',cents(billing.reduce((n,r)=>n+(r.amount||0),0))===cents(t.total-t.fire_ext.amount));ok('October package remains Finance review, not completed work',billing.length>0&&billing.every(r=>r.status==='review'&&r.basis.includes('does not record demob')));
   ok('Onsite package branches add once',cents(bill.byBranch.reduce((n,r)=>n+r.total,0))===bill.known);
   ok('Each arrived applicable line included automatically',rows.every(({p})=>p.rows.filter(r=>OnsiteCharges1006.automatic.has(r.key)).every(r=>r.qty>=p.arrived)));
   ok('Stairs never selected automatically',rows.every(({p})=>p.rows.filter(r=>r.key==='steps').every(r=>r.qty===r.recordedQty&&!r.automatic)));
   ok('No relocated second demob',rows.filter(r=>r.a.relocation).every(r=>!r.p.rows.some(s=>s.key==='demob')));
   ok('No duplicate financial slots',new Set(plan.slots.map(s=>JSON.stringify([s.ref,s.disc,s.item,s.key,s.state]))).size===plan.slots.length);
   const a=assets.find(a=>a.key==='WC72'),l=chargeLines(a).find(l=>l.item==='FWF'),c=charge1006(a,l);
   ok('WC72 repeated number does not multiply charges',c.rows.find(r=>r.key==='install').qty===c.arrived&&c.rows.find(r=>r.key==='demob').qty===c.arrived);
   ok('FWF offers card install/demob only',c.rows.every(r=>['install','demob'].includes(r.key)));
   ok('Physical completion remains separate',!labourTicked(a.key,l.discipline,l.item,'demob')&&c.rows.find(r=>r.key==='demob').qty>0);
   const g=assets.find(a=>a.key==='GN20'),gl=chargeLines(g).find(l=>/350/i.test(l.item)),gp=charge1006(g,gl);
   ok('GN20 includes install and demob exactly once',gp.arrived===1&&gp.rows.filter(r=>['install','demob'].includes(r.key)).length===2&&gp.rows.filter(r=>['install','demob'].includes(r.key)).every(r=>r.rate===166.56&&r.qty===1)&&gp.total===333.12);
   ok('GN20 included demob does not complete physical work',!labourTicked(g.key,gl.discipline,gl.item,'demob'));
   const detail=document.createElement('template');detail.innerHTML=labourCard([g]);const chargeRows=[...detail.content.querySelectorAll('tbody tr')].filter(tr=>tr.children[1]?.textContent==='350kva');
   ok('Detailed labour table shows both GN20 charge lines',chargeRows.filter(tr=>['Install','Demob'].some(k=>tr.children[2]?.textContent.startsWith(k))).length===2&&chargeRows.filter(tr=>['Install','Demob'].some(k=>tr.children[2]?.textContent.startsWith(k))).every(tr=>tr.children[5]?.textContent.includes('166.56')));
   ok('Automatic charges have no physical bulk tick control',!detail.content.querySelector('[data-lab-all$="|install"],[data-lab-all$="|demob"]'));
   const unresolved=rows.filter(r=>r.p.rows.some(x=>x.qty>r.p.arrived&&OnsiteCharges1006.automatic.has(x.key)));
   window.__chargeRead1006={included:m.charge.labour,branches:Object.keys(t.byBranch).length,rows:rows.length,existingManualBeyondReceipts:unresolved.map(r=>r.a.key)};
  });
  ok('Read leaves native state unchanged',snapshot===JSON.stringify(S));
  const a=assetOf('P09'),l=chargeLines(a).find(l=>l.item==='Building 6m'),saved=S.labour,loads=S.loads;
  try{
   S.labour={...S.labour};for(const k of Object.keys(S.labour))if(k.startsWith('P09')&&k.endsWith('|steps'))delete S.labour[k];
   RENDER_MEMO.clear();let q=holdAssets(()=>charge1006(assetOf('P09'),l));ok('Unticking stairs removes actual and forecast',q.rows.find(r=>r.key==='steps').qty===0&&q.rows.find(r=>r.key==='steps').forecastQty===0);
   S.labour[labourKey(a.key,l.discipline,l.item,'steps')]=true;RENDER_MEMO.clear();q=holdAssets(()=>charge1006(assetOf('P09'),l));ok('Manual stairs include one card charge',q.rows.find(r=>r.key==='steps').qty===1&&q.rows.find(r=>r.key==='steps').value===156.15);
   S.loads={...S.loads};const k=Stairs975.key(a.key,l.discipline,l.item,null);S.loads[k]={kind:'stairs975',ref:a.key,disc:l.discipline,item:l.item,unit:'',qty:1,excluded:true};RENDER_MEMO.clear();q=holdAssets(()=>charge1006(assetOf('P09'),l));ok('Existing stairs exclusion wins over manual tick',q.rows.find(r=>r.key==='steps').qty===0);
  }finally{S.labour=saved;S.loads=loads;RENDER_MEMO.clear();}
  ok('Dynamic check restored native state',snapshot===JSON.stringify(S));
  const nativeSupplied=S.supplied,nativeLabour=S.labour;
  try{
   S.supplied={...S.supplied,WC72:{items:[{asked:'FWF',qty_supplied:0}]}};S.labour={...S.labour};for(const k of Object.keys(S.labour))if(k.startsWith('WC72'))delete S.labour[k];RENDER_MEMO.clear();
   let a=assetOf('WC72'),l=chargeLines(a).find(l=>l.item==='FWF'),q=holdAssets(()=>charge1006(a,l));ok('Zero confirmed receipt removes automatic charges',q.arrived===0&&q.rows.every(r=>r.qty===0));
   S.supplied.WC72.items[0].qty_supplied=1;RENDER_MEMO.clear();a=assetOf('WC72');l=chargeLines(a).find(l=>l.item==='FWF');q=holdAssets(()=>charge1006(a,l));const slot=holdAssets(()=>labourPlan().slots.find(s=>s.ref==='WC72'&&s.key==='demob'&&s.state==='charged'));
   ok('Receipt adds install and demob without work ticks',q.rows.every(r=>r.qty===1)&&slot?.qty===1&&!labourTicked('WC72',l.discipline,l.item,'demob'));
   const packageRow=holdAssets(()=>arrivedChargeRows975(a).find(r=>r.item==='FWF'));ok('Updated reference package agrees with shared price',packageRow.total===q.total);
  }finally{S.supplied=nativeSupplied;S.labour=nativeLabour;RENDER_MEMO.clear();}
  ok('Receipt check restored native state',snapshot===JSON.stringify(S));
  const generatorDelivery=S.delivery,generatorLabour=S.labour,generatorSupplied=S.supplied;
  try{
   S.delivery={...S.delivery,GN20:{state:'not on site',done:false,date:'2026-10-13'}};S.labour={...S.labour};for(const k of Object.keys(S.labour))if(k.startsWith('GN20'))delete S.labour[k];S.supplied={...S.supplied,GN20:{items:[{asked:'350kva',qty_supplied:0}]}};RENDER_MEMO.clear();
   const ga=assetOf('GN20'),gl=chargeLines(ga).find(l=>/350/i.test(l.item)),gp=holdAssets(()=>charge1006(ga,gl));
   ok('Undelivered GN20 keeps both legs forecast only',gp.arrived===0&&gp.rows.filter(r=>['install','demob'].includes(r.key)).every(r=>r.qty===0&&r.forecastQty===1&&r.forecastValue===166.56));
  }finally{S.delivery=generatorDelivery;S.labour=generatorLabour;S.supplied=generatorSupplied;RENDER_MEMO.clear();}
  ok('Generator charge practice restored native state',snapshot===JSON.stringify(S));
  const savedEdit=canEdit,savedStairsSave=Stairs975.save,savedSetLabour=setLabour,priorLoads=S.loads,host=document.createElement('div'),calls=[];
  try{
   canEdit=()=>true;Stairs975.save=(...args)=>{calls.push(['exclusion',...args]);return true;};setLabour=(...args)=>{calls.push(['manual',...args]);return true;};
   const a=assetOf('WC09'),l=chargeLines(a).find(l=>l.item==='Pee Panel'),max=Stairs975.pieceQty(a,l,null);ok('Grouped unnumbered stairs support quantity',max>1);
   host.innerHTML=Stairs975.controls(a,l,null);document.body.append(host);const qty=host.querySelector('[data-stairs1006-qty]');ok('Grouped stairs have manual quantity control',!!qty&&Number(qty.max)===max);
   qty.value='2';qty.dispatchEvent(new Event('change',{bubbles:true}));ok('Two stairs on group excludes only remaining pieces',calls.some(c=>c[0]==='exclusion'&&c[5]===max-2)&&calls.some(c=>c[0]==='manual'&&c[5]===true));
   const key=Stairs975.key(a.key,l.discipline,l.item,null);S.loads={...S.loads,[key]:{kind:'stairs975',ref:a.key,disc:l.discipline,item:l.item,unit:'',qty:max-2,excluded:true}};calls.length=0;host.innerHTML=Stairs975.controls(a,l,null);const box=host.querySelector('[data-stairs1006-select]');box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));ok('Selecting group preserves existing partial exclusions',!calls.some(c=>c[0]==='exclusion')&&calls.some(c=>c[0]==='manual'&&c[5]===true));
  }finally{host.remove();canEdit=savedEdit;Stairs975.save=savedStairsSave;setLabour=savedSetLabour;S.loads=priorLoads;RENDER_MEMO.clear();}
  ok('Stairs practice restored native state',snapshot===JSON.stringify(S));return {checks:check,...window.__chargeRead1006};
 });
 for(const c of r.checks)assert(c.pass,c.name+' '+JSON.stringify(c.detail||''));
 await p.evaluate(()=>openAsset('WC72'));await p.waitForTimeout(300);
 const charge=p.locator('[data-charges952="WC72"]');assert.equal(await charge.count(),1);await charge.locator(':scope > details').first().evaluate(e=>e.open=true);
 const install=charge.locator('[data-charge-included1006="install"]'),demob=charge.locator('[data-charge-included1006="demob"]');assert(await install.isChecked());assert(await demob.isChecked());assert(await charge.locator('[data-charge-included1006="Hire"]').first().isChecked());assert(await charge.locator('[data-charge-included1006="Delivery"]').isChecked());assert(await charge.locator('[data-charge-included1006="Pickup"]').isChecked());
 assert((await charge.innerText()).includes('Actual onsite'));
 await charge.scrollIntoViewIfNeeded();await p.screenshot({path:process.env.OUTDIR+'/charges-'+(mobile?'phone':'desktop')+'.png'});
 assert.equal(await charge.evaluate(e=>e.scrollWidth>e.clientWidth+2),false);assert.equal(h.errors.length,0,h.errors.join('\n'));assert.equal(h.counts.blocked,0);
 fs.writeFileSync(process.env.OUTDIR+'/charges-'+(mobile?'phone':'desktop')+'.json',JSON.stringify({author:'Andrew Fisher',pass:true,actualPublic:!process.env.PAGE,mobile,...r,errors:h.errors,writes:h.counts.blocked},null,2));
 console.log(JSON.stringify({pass:true,mobile,checks:r.checks.length+9,included:r.included,rows:r.rows,existingManualBeyondReceipts:r.existingManualBeyondReceipts,errors:h.errors,writes:h.counts.blocked}));
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
