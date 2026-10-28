/* Author: Andrew Fisher. Classify reviewed contract labour without changing its price or source. */
(function(root){
  'use strict';
  const scope=Object.freeze({
    '9961265|40':'STPS',
    '9961976|51':'NVAC',
    '9961976|52':'NVAC',
    '9961976|58':'NVAC',
    '9961976|60':'NVAC',
    '9994954|13':'KINP'
  });
  function isInstallation(row){
    if(!row||typeof row!=='object'||row.subhired||row.subhired_machine)return false;
    const branch=scope[String(row.rental_contract)+'|'+String(row.line)];
    return !!branch&&row.item==='LABOUR'&&row.item_type_code===2&&row.branch_code===branch&&row.sales_analysis_code===branch+'-INS';
  }
  function classifyCharge(row,charge){
    if(!isInstallation(row)||!charge||typeof charge!=='object'||Array.isArray(charge))return charge;
    return Object.assign({},charge,{ledger:'1047',contractLabour1249:true});
  }
  const api=Object.freeze({isInstallation,classifyCharge});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ContractLabour1249=api;
})(typeof window==='undefined'?globalThis:window);

/* Keep the existing native pricing chain and mark only its reviewed labour result. */
if(typeof window!=='undefined'&&typeof contractCharge==='function'){
  const previousContractCharge1249=contractCharge;
  contractCharge=function(row){return ContractLabour1249.classifyCharge(row,previousContractCharge1249.apply(this,arguments));};
}
