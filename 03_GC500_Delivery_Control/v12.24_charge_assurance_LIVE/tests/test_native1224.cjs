// Author: Andrew Fisher. Read-only audit model capture. OUT must be private, outside this checkout.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const repo=path.resolve(__dirname,'../../..'),out=path.resolve(process.env.OUT||'');
assert(process.env.OUT&&!out.startsWith(repo+path.sep),'OUT must be private and outside the checkout');
(async()=>{
  const mobile=process.env.MOB==='1',s=await open({pageFile:process.env.PAGE,hash:'#costs',mobile,W:mobile?390:1440,H:mobile?844:1000});
  let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
  try{
    await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&document.querySelector('#charge1224')&&ChargeAssurance1224.model().sourceAvailable,null,{timeout:180000});
    await s.page.evaluate(()=>go('costs'));
    await s.page.locator('#charge1224').waitFor({state:'visible'});
    const data=await s.page.evaluate(()=>{
      const result={version:SYNC.version,at:new Date().toISOString(),footer:document.getElementById('footL').textContent,models:{},functions:{},failures:{}};
      const models={pnl:()=>pl770Model(),money:()=>moneySummary(),closeout:()=>cj764Model(),branches:()=>pl752Rows(),branchFinancial:()=>branchFinancial978(pl752Rows(),moneySummary()),
        labour:()=>labourWholeJob865(),labourAllowance:()=>labourAllowance858(),ourCosts:()=>ourCosts(),costLines:()=>allCosts(),
        transport:()=>transport888View(),transportPlan:()=>transport953Build(),demobTransport:()=>transport888DemobPlan(),
        eventScope:()=>scopeFigures(),scopeBranch:()=>scopeBranchAllocation978(),supplierService:()=>supplierService1068(),supplierHire:()=>supplierHire1094Model(),
        financeRows:()=>fin745Rows(todayIso()),rehire:()=>rh766Model(),service:()=>servicing748(),labourTicks:()=>pl760Ticks(),buildingTransport:()=>buildingTransportModel831(),
        scopes:()=>financeScopes1013(),contractRows:()=>ONHIRE_ROWS.map(r=>({...r,computed_charge:contractCharge(r),computed_owner:finance928ContractOwner(r),computed_branch:generatorBranch1004(r)})),
        references:()=>allAssets().map(a=>({key:a.key,discipline:a.discipline,item:a.item,description:a.description,branch:branchOf(a.key),delivery:deliveryOf(a.key),rental:rentalOf(a.key)})),
        transportGapBasis:()=>{const t=transport953Build(),all=t.rows.concat(t.planned);return all.filter(r=>r.forecast&&['held','nonload'].includes(r.forecast.kind)).map(r=>({id:r.id,ref:r.key,task:r.task,item:r.item,leg:r.leg,qty:r.qty,forecast:r.forecast,lines:r.a?assetTotal(r.a).lines:[],demand:r.a?transport956NativeDemand(r,all.filter(x=>x.key===r.key&&transport953Leg(x)===transport953Leg(r))):null}));},
        assurance:()=>ChargeAssurance1224.model(), reconciliation:()=>recon888Model(), contractFigures:()=>contractFigures(ONHIRE_ROWS), sourceCharges:()=>ONHIRE_ROWS.filter(r=>r.sourceAddition1224).map(r=>({contract:r.rental_contract,line:r.line,category:contractChargeCategory1224(r),stream:contractChargeStream1224(r),charge:contractCharge(r),source:r.sourceAddition1224})), onsiteComplete:()=>onsiteComplete979(), pricingHolds:()=>pricingReviewHolds1010(), workPricing:()=>workPricing1007(), labourRevenue:()=>labourRevenue858(), dataKeys:()=>Object.keys(DATA),stateKeys:()=>Object.keys(S)};
      holdAssets(()=>{for(const [key,fn]of Object.entries(models)){try{result.models[key]=JSON.parse(JSON.stringify(fn()));}catch(e){result.failures[key]=String(e);}}});
      result.fwf=holdAssets(()=>{
        const pick=r=>({key:r.key,name:r.name,rate:r.rate,qty:r.qty,recordedQty:r.recordedQty,value:r.value,forecastQty:r.forecastQty,forecastValue:r.forecastValue,automatic:r.automatic,takenOff1052:r.takenOff1052});
        const a=FinanceRequest996.assets().find(a=>a.key==='PG01'),l=a&&chargeLines(a).find(l=>l.item==='FWF'),p=l?charge1006(a,l):null;
        const slots=labourPlan().slots.filter(s=>s.item==='FWF'&&['install','demob'].includes(s.key));
        return {pg01:p?{arrived:p.arrived,ordered:p.ordered,total:p.total,rows:p.rows.filter(r=>['install','demob'].includes(r.key)).map(pick)}:null,
          allFWF:['install','demob'].map(key=>{const xs=slots.filter(s=>s.key===key);return {key,rates:[...new Set(xs.map(s=>s.rate))],slots:xs.length,refs:new Set(xs.map(s=>s.ref)).size,quantity:xs.reduce((n,s)=>n+(s.qty||0),0),charged:OnsiteCharges1006.cents(xs.filter(s=>s.state==='charged'&&s.value!=null).reduce((n,s)=>n+s.value,0)),forecast:OnsiteCharges1006.cents(xs.filter(s=>s.state!=='charged'&&s.value!=null).reduce((n,s)=>n+s.value,0)),unpriced:xs.filter(s=>s.value==null).length};})};
      });
      const names=['pl770Model','moneySummary_','cj764Model','pl752Rows','labourWholeJob865','labourAllowance858','labourRevenue858','transport888ViewBuild','transport953Build','transport888DemobPlan','ourCosts','branchFinancial978','scopeBranchAllocation978','supplierService1068','supplierCostQuotes1068','acc761Labour','contractCharge','finance928ContractOwner','generatorBranch1004'];
      for(const name of names){try{result.functions[name]=eval(name).toString();}catch(e){result.failures[name]=String(e);}}
      return result;
    });

    const cc=require('../charge_checks1224_src.js'),a=data.models.assurance;
    check('all exact-cent checks pass',()=>{assert.equal(a.state,'pass');assert(a.checks.length>=10);assert(a.checks.every(c=>c.variance===0));});
    check('missing sources never become bill readiness',()=>{assert.equal(a.sourceAvailable,true);assert(a.issues.length>0);});
    check('excluded references do not reappear as charge reviews',()=>{const refs=new Set((data.models.money.excluded1152?.refs||[]).map(r=>r.ref));assert(a.issues.every(r=>!refs.has(r.ref)));});
    check('fencing demob is separate from priced job-end total',()=>{assert.equal(a.priced,a.job-a.fence);assert.equal(a.remainingOther,a.priced-a.actual);});
    check('difference model retains current cents',()=>assert.equal(cc.cents(data.models.pnl.diff.now),cc.cents(data.models.money.difference)));
    check('FWF install and demob remain separate current-job charge lines',()=>{assert(data.fwf.pg01);assert.deepEqual(data.fwf.pg01.rows.map(r=>r.key).sort(),['demob','install']);assert(data.fwf.pg01.rows.every(r=>Number.isFinite(r.rate)&&r.rate>0));assert.deepEqual(data.fwf.allFWF.map(r=>r.key).sort(),['demob','install']);});
    if(process.env.BASE_MODELS){
      const base=JSON.parse(fs.readFileSync(process.env.BASE_MODELS,'utf8')).models;
      const now=data.models.closeout.revenue,was=base.closeout.revenue;
      const excluded=new Set((now.sourceHire996.excluded||[]).map(r=>r.ref));
      const sourceDelta=was.sourceHire996.rows.filter(r=>excluded.has(r.ref)).reduce((n,r)=>n+cc.cents(r.amount),0);
      const ids=new Set(now.generators1004.rows.filter(r=>r.treatment).flatMap(r=>r.contractIds||[]));
      const generatorDelta=was.generators1004.rows.filter(r=>(r.contractIds||[]).some(id=>ids.has(id))).reduce((n,r)=>n+cc.cents(r.forecast),0);
      const key=r=>String(r.rental_contract)+'|'+Number(r.line),rateChanges=new Map([['9968862|63',10],['9968862|73',1]]);
      const rateDelta=Array.from(rateChanges.values()).reduce((n,v)=>n+v,0);
      const added=data.models.contractRows.filter(r=>r.sourceAddition1224),expected=new Map([['9994996|1',770000],['9994996|2',1790000],['9992300|13',100000],['9961265|41',720000],['9968862|136',50000]]);
      const sourceAdded=added.reduce((n,r)=>n+cc.cents(r.computed_charge.amount),0),identityAdded=cc.cents(data.models.money.charge.labour)-cc.cents(base.money.charge.labour);
      check('existing source exclusions and generator decisions are exercised',()=>{assert(excluded.size>0);assert(ids.size>0);assert(sourceDelta>0);assert(generatorDelta>0);});
      check('only confirmed source prices and the bounded identity restore are added',()=>{assert.equal(added.length,expected.size);for(const r of added){assert(expected.has(key(r)));assert.equal(cc.cents(r.computed_charge.amount),expected.get(key(r)));assert.equal(r.delivered,false);assert.equal(r.match.key,null);}assert.equal(identityAdded,16656);});
      check('only bounded reconciliations change job-end Revenue',()=>assert.equal(cc.cents(data.models.pnl.revJob)-cc.cents(base.pnl.revJob),sourceAdded+identityAdded-sourceDelta-generatorDelta-rateDelta));
      check('recorded customer charges match the exact verified source bridge',()=>assert.equal(a.actual-cc.cents(base.money.charge.total),sourceAdded+identityAdded-rateDelta));
      check('Direct costs and overhead preserved',()=>{for(const k of ['direct','directJob','over','overJob','costNow','costJob'])assert.equal(cc.cents(base.pnl[k]),cc.cents(data.models.pnl[k]),k);});
      check('all existing contract source fields and unrelated charges are preserved individually',()=>{assert.equal(base.contractRows.length+expected.size,data.models.contractRows.length);for(let i=0;i<base.contractRows.length;i++){const was=base.contractRows[i],now=data.models.contractRows.find(r=>key(r)===key(was));assert(now,'existing source key '+key(was));assert.equal(cc.cents(was.computed_charge.amount)-cc.cents(now.computed_charge.amount),rateChanges.get(key(was))||0,'contract row '+i);const source=r=>{const {computed_charge,...rest}=r;return rest;};assert.deepEqual(source(was),source(now),'source row '+i);}});
      check('source categories stay separate and the existing installation tie reconciles',()=>{const m=data.models.money.charge,p=data.models.pnl;assert.equal(cc.cents(m.contractInstallation1224),770000);assert.equal(cc.cents(m.contractServices1224),50000);const misc=p.rev.filter(r=>r.key==='contract_services1224');assert.equal(misc.length,1);assert.equal(misc[0].code,'—');assert.equal(cc.cents(misc[0].now),50000);const tie=data.models.reconciliation.ties.find(t=>/Labour we charge/.test(t.what));assert(tie&&tie.ok);});
    }
    const card=s.page.locator('#charge1224');
    const contractSummary=s.page.locator('#pl752 .pl-ln').filter({hasText:'Charges priced on contracts'});
    check('contract summary distinguishes mixed source services from hire',()=>{});
    assert.equal(await contractSummary.count(),1);
    const workings=s.page.locator('#pl752 [data-work1220]').first();
    assert.equal(await workings.getAttribute('aria-expanded'),'false');
    await workings.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'center'});});
    await workings.click();
    const sourceWords=await contractSummary.innerText();
    assert(sourceWords.includes('Installation'));
    assert(sourceWords.includes('ledger allocation pending'));
    assert(!sourceWords.includes('Hire on the contracts, by the rate'));
    if(process.env.EVIDENCE){
      fs.mkdirSync(process.env.EVIDENCE,{recursive:true});
      await contractSummary.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
      await contractSummary.screenshot({path:path.join(process.env.EVIDENCE,'contract-summary-'+(mobile?'phone':'desktop')+'.png')});
    }
    await workings.click();
    assert.equal(await workings.getAttribute('aria-expanded'),'false');
    check('rehire forecast caption does not attribute other source forecasts to fencing',()=>{});
    const rehireWords=await s.page.evaluate(()=>rh766Card());
    assert(rehireWords.includes('remaining rehire forecast'));
    assert(!rehireWords.includes('still to come (the fencing programme)'));
    await card.scrollIntoViewIfNeeded();await s.page.waitForTimeout(500);
    check('one assurance card',()=>assert.equal(data.models.assurance.state,'pass'));
    assert.equal(await card.count(),1);
    const view=await card.evaluate(el=>({text:el.innerText,width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,details:[...el.querySelectorAll('details')].every(d=>!d.open)}));
    check('figures-first readable initial presentation',()=>{assert(view.details);assert(view.text.includes('excluding fencing demob'));assert(view.text.includes('source review required'));assert(!view.text.includes('undefined'));assert(!view.text.includes('NaN'));assert(view.scroll<=view.client+1);});
    if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await card.screenshot({path:path.join(process.env.EVIDENCE,'charge-checks-'+(mobile?'phone':'desktop')+'.png')});if(mobile){await card.evaluate(el=>{const main=el.closest('main');main.scrollTop+=el.getBoundingClientRect().top-main.getBoundingClientRect().top-12;});await s.page.waitForTimeout(500);const framed=await card.evaluate(el=>({title:el.querySelector('h3').getBoundingClientRect().top,main:el.closest('main').getBoundingClientRect().top}));check('phone card title is below the fixed navigation',()=>assert(framed.title>=framed.main));await s.page.screenshot({path:path.join(process.env.EVIDENCE,'charge-checks-phone-top.png')});}}
    await card.locator('[data-charge1224-detail="checks"] summary').click();
    await s.page.waitForTimeout(120);
    await s.page.evaluate(()=>renderCosts());
    check('workings remain open after a fresh draw',()=>{});
    assert.equal(await s.page.locator('[data-charge1224-detail="checks"]').evaluate(e=>e.open),true);
    await s.page.locator('[data-charge1224-detail="issues"] summary').click();
    const button=s.page.locator('[data-charge1224-ref]').first(),ref=await button.getAttribute('data-charge1224-ref');
    await button.click();await s.page.waitForTimeout(250);
    assert.equal(await s.page.locator('#drawer').getAttribute('aria-hidden'),'false');
    check('review reference opens its existing evidence drawer',()=>assert(ref));
    await s.page.evaluate(()=>openAsset('P41'));await s.page.waitForTimeout(250);
    const correction=s.page.locator('#drawer .contract-card1224').first();
    check('corrected charge visibly explains the retained source rate',()=>{});
    assert(await correction.count()>0);assert((await correction.innerText()).includes('charge reconciled to the published card full hire'));
    check('contract details retain the existing viewer restriction',()=>{});
    assert.equal(await correction.isVisible(),false);
    // Simulate only the editor presentation; capability and write guards remain read-only.
    await s.page.evaluate(()=>document.body.classList.remove('viewonly'));
    await correction.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'center'});});
    assert(await correction.isVisible(),'reconciliation must be visible in opened contract details');
    if(process.env.EVIDENCE){await s.page.screenshot({path:path.join(process.env.EVIDENCE,'source-rate-'+(mobile?'phone':'desktop')+'.png')});}
    await s.page.evaluate(()=>document.body.classList.add('viewonly'));
    check('no page errors or record-write attempts',()=>{assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);});
    data.testResult={checks,mobile,errors:s.errors,blocked:s.counts.blocked};

    const encoded=JSON.stringify(data,null,2),secret=process.env.GC500_EDIT_TOKEN;
    assert(!secret||!encoded.includes(secret),'private capture unexpectedly contains a credential');
    fs.writeFileSync(out,encoded,{mode:0o600});
    console.log(JSON.stringify({captured_models:Object.keys(data.models).length,failures:Object.keys(data.failures),errors:s.errors.length,blocked:s.counts.blocked}));
    assert.equal(Object.keys(data.failures).length,0,'capture incomplete');assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);
  }finally{await s.browser.close();}
})().catch(e=>{console.error('AUDIT FAILED:',String(e.message).slice(0,180));process.exitCode=1;});
