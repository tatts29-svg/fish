// Author: Andrew Fisher. Read-only audit model capture. OUT must be private, outside this checkout.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {open}=require('../toolchain/harness/open_page');
const repo=path.resolve(__dirname,'../..'),out=path.resolve(process.env.OUT||'');
assert(process.env.OUT&&!out.startsWith(repo+path.sep),'OUT must be private and outside the checkout');
(async()=>{
  const s=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000});
  try{
    await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&document.querySelector('#pl770[data-pl1194]'),null,{timeout:180000});
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
        dataKeys:()=>Object.keys(DATA),stateKeys:()=>Object.keys(S)};
      holdAssets(()=>{for(const [key,fn]of Object.entries(models)){try{result.models[key]=JSON.parse(JSON.stringify(fn()));}catch(e){result.failures[key]=String(e);}}});
      const names=['pl770Model','moneySummary_','cj764Model','pl752Rows','labourWholeJob865','labourAllowance858','labourRevenue858','transport888ViewBuild','transport953Build','transport888DemobPlan','ourCosts','branchFinancial978','scopeBranchAllocation978','supplierService1068','supplierCostQuotes1068','acc761Labour','contractCharge','finance928ContractOwner','generatorBranch1004'];
      for(const name of names){try{result.functions[name]=eval(name).toString();}catch(e){result.failures[name]=String(e);}}
      return result;
    });
    const encoded=JSON.stringify(data,null,2),secret=process.env.GC500_EDIT_TOKEN;
    assert(!secret||!encoded.includes(secret),'private capture unexpectedly contains a credential');
    fs.writeFileSync(out,encoded,{mode:0o600});
    console.log(JSON.stringify({captured_models:Object.keys(data.models).length,failures:Object.keys(data.failures),errors:s.errors.length,blocked:s.counts.blocked}));
    assert.equal(Object.keys(data.failures).length,0,'capture incomplete');assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);
  }finally{await s.browser.close();}
})().catch(e=>{console.error('AUDIT FAILED:',String(e.message).slice(0,180));process.exitCode=1;});
