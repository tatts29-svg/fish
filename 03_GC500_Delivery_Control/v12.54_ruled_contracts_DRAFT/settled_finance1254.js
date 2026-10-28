/* Author: Andrew Fisher. Approved customer zero; supplier costs and source fields stay intact. */
(function(root){
  'use strict';
  const key='service|Sewer Connect Units Clean & Restock';
  const cents=value=>Math.round(value*100)/100;
  function treatment(row){
    if(!row||row.rental_contract!=='9968955'||row.line!==143||row.branch_code!=='KINP'||row.subhired)return null;
    return {kind:'approved_zero',label:'No customer charge',ref:null,approved_by:'the project manager',approved_on:'2026-10-29',
      basis:'No customer charge on the approved contract line; source quantity and source Price are retained.'};
  }
  function line(value){
    if(!value||value.key!==key)return value;
    if(value.approvedZero1254)return value;
    return Object.assign({},value,{approvedZero1254:true,source_rate1254:value.rate,source_amount1254:value.amount,
      rate:0,amount:0,per_night1040:0,
      description:value.card_line+' · no customer charge on the approved contract line'});
  }
  function project(model){
    if(!model||!Array.isArray(model.lines)||!model.lines.some(value=>value&&value.key===key))return model;
    const lines=model.lines.map(line),card=(model.card_lines||[]).map(line);
    return Object.assign({},model,{lines,card_lines:card,
      total:cents(lines.reduce((sum,value)=>sum+value.amount,0)),
      card_total:cents(card.reduce((sum,value)=>sum+value.amount,0))});
  }
  const api=Object.freeze({treatment,line,project});
  if(root)root.RuledContracts1254=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
