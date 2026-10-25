// Author: Andrew Fisher. GET-only financial snapshot; all output must stay private.
// Run with PAGE and OUT outside Git; SCREENSHOTS=1 optionally saves private views.
// Use the shared browser flock externally so captures never overlap the sweeps.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../../..'),tc=path.resolve(__dirname,'../../toolchain');
const curl=require(tc+'/harness/curlfetch');
const fetchGet=curl.curlFetch,nonGet=[];
curl.curlFetch=async function(url,headers,method='GET',body){
  if(method!=='GET'){nonGet.push({method,path:new URL(url).pathname});throw new Error('GET-only capture rejected non-GET request');}
  return fetchGet(url,headers,'GET',body);
};
const {open}=require(tc+'/harness/open_page');
const out=path.resolve(process.env.OUT||''),pageFile=path.resolve(process.env.PAGE||'');
assert(process.env.OUT&&out!==repo&&!out.startsWith(repo+path.sep),'OUT must be private and outside the repository');
assert(process.env.PAGE&&fs.existsSync(pageFile),'PAGE required');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>crypto.createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(stable(x))).digest('hex');
(async()=>{
  const mobile=process.env.MOB==='1',s=await open({pageFile,hash:'#costs',mobile,W:mobile?390:1440,H:mobile?844:1000});
  try{
    await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&typeof ChargeAssurance1224!=='undefined',null,{timeout:180000});
    const data=await s.page.evaluate(()=>{
      const result={version:SYNC.backend.readVersion821(),at:new Date().toISOString(),footer:document.getElementById('footL').textContent,models:{},failures:{}};
      const models={pnl:()=>pl770Model(),money:()=>moneySummary(),closeout:()=>cj764Model(),branches:()=>pl752Rows(),branchFinancial:()=>branchFinancial978(pl752Rows(),moneySummary()),
        labour:()=>labourWholeJob865(),labourAllowance:()=>labourAllowance858(),ourCosts:()=>ourCosts(),costLines:()=>allCosts(),
        transport:()=>transport888View(),transportPlan:()=>transport953Build(),demobTransport:()=>transport888DemobPlan(),
        eventScope:()=>scopeFigures(),scopeBranch:()=>scopeBranchAllocation978(),supplierService:()=>supplierService1068(),supplierHire:()=>supplierHire1094Model(),
        financeRows:()=>fin745Rows(todayIso()),rehire:()=>rh766Model(),service:()=>servicing748(),labourTicks:()=>pl760Ticks(),buildingTransport:()=>buildingTransportModel831(),
        scopes:()=>financeScopes1013(),contractRows:()=>ONHIRE_ROWS.map(r=>({...r,computed_charge:contractCharge(r),computed_owner:finance928ContractOwner(r),computed_branch:generatorBranch1004(r)})),
        references:()=>allAssets().map(a=>({key:a.key,discipline:a.discipline,item:a.item,description:a.description,branch:branchOf(a.key),delivery:deliveryOf(a.key),rental:rentalOf(a.key)})),
        assurance:()=>ChargeAssurance1224.model(),reconciliation:()=>recon888Model(),contractFigures:()=>contractFigures(ONHIRE_ROWS),onsiteComplete:()=>onsiteComplete979(),
        pricingHolds:()=>pricingReviewHolds1010(),workPricing:()=>workPricing1007(),labourRevenue:()=>labourRevenue858(),labourSlots:()=>labourPlan().slots,
        vmsFinancial:()=>FinanceRequest996.assets().filter(a=>a.discipline==='Variable message signs').map(a=>({ref:a.key,branch:branchOf(a.key),lines:chargeLines(a).map(l=>({line:l,charge:charge1006(a,l)}))})),
        financeAssets:()=>FinanceRequest996.assets().map(a=>({key:a.key,discipline:a.discipline,branch:branchOf(a.key),lines:chargeLines(a)})),
        vmsEquipment:()=>VmsEquipment1103.model(),legacyFinance:()=>legacyFinance978(),
        vmsInstallation:()=>typeof VmsInstallation1228==='undefined'?null:VmsInstallation1228.model(),
        operationalVms:()=>({boards:S.vmsboard,delivery:S.delivery,labour:S.labour,stamps:S.stamps,units:S.units,assetNumbers:S.assetNumbers}),
        branchRollup:()=>branchRollup(todayIso())};
      holdAssets(()=>{for(const [key,fn]of Object.entries(models)){try{result.models[key]=JSON.parse(JSON.stringify(fn()));}catch(e){result.failures[key]=String(e);}}});
      result.state=JSON.parse(JSON.stringify(S));
      return result;
    });
    if(process.env.SCREENSHOTS==='1'){
      const prefix=out.replace(/\.json$/,'');
      data.screenshots=[];
      for(const [name,selector] of [['charge-summary','#charge1224'],['installation','tr']]){
        const locator=name==='installation'?s.page.locator(selector).filter({hasText:/Labour.*Install|Installation.*1047/}).first():s.page.locator(selector);
        if(await locator.count()){
          await locator.evaluate(el=>{for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
          await locator.scrollIntoViewIfNeeded();
          const target=prefix+'-'+name+'.png';
          await s.page.screenshot({path:target});data.screenshots.push(target);
        }
      }
    }
    data.state_sha256=digest(data.state);delete data.state;
    data.source_sha256=digest(fs.readFileSync(pageFile));
    data.browser={errors:s.errors,counts:s.counts,nonGet};
    const encoded=JSON.stringify(data,null,2),secret=process.env.GC500_EDIT_TOKEN;
    assert(!secret||!encoded.includes(secret),'Credential unexpectedly present');
    fs.writeFileSync(out,encoded,{mode:0o600});
    console.log(JSON.stringify({models:Object.keys(data.models).length,failedModels:Object.keys(data.failures).length,pageErrors:s.errors.length,blockedWrites:s.counts.blocked,nonGetAttempts:nonGet.length}));
    assert.equal(Object.keys(data.failures).length,0,'Capture model failure');assert.equal(s.errors.length,0,'Page error');assert.equal(s.counts.blocked,0,'Record write attempted');assert.equal(nonGet.length,0,'Non-GET request attempted');
  }finally{await s.browser.close();}
})().catch(e=>{console.error('CAPTURE FAILED: '+String(e.message).slice(0,240));process.exitCode=1;});
