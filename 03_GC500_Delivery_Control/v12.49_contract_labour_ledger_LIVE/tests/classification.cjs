/* Author: Andrew Fisher. Synthetic prices only; no operational fixtures or network. */
'use strict';
const assert=require('node:assert/strict');
const api=require('../contract_labour1249.js');
const scope=[['9961265',40,'STPS'],['9961976',51,'NVAC'],['9961976',52,'NVAC'],['9961976',58,'NVAC'],['9961976',60,'NVAC'],['9994954',13,'KINP']];
let passed=0;const check=(name,run)=>{run();passed++;};
for(const [contract,line,branch]of scope){
 const row=Object.freeze({rental_contract:contract,line,item:'LABOUR',item_type_code:2,branch_code:branch,sales_analysis_code:branch+'-INS',charge_line:false,subhired:false,quantity:1.5,rate_1:null,start_date:'2000-01-02',description:'Synthetic labour'});
 const charge=Object.freeze({amount:12.34,actual:12.34,remaining:0,forecast:12.34,ledger:'1005',days:3,from:'2000-01-02',to:'2000-01-04',basis:'Synthetic approved price'});
 check(contract+'/'+line+' accepted',()=>assert.equal(api.isInstallation(row),true));
 check(contract+'/'+line+' category only',()=>assert.deepEqual(api.classifyCharge(row,charge),{...charge,ledger:'1047',contractLabour1249:true}));
 check(contract+'/'+line+' source untouched',()=>assert.equal(row.charge_line,false));
 check(contract+'/'+line+' original charge untouched',()=>assert.equal(charge.ledger,'1005'));
 check(contract+'/'+line+' unknown amount stays unknown',()=>assert.deepEqual(api.classifyCharge(row,{amount:null}),{amount:null,ledger:'1047',contractLabour1249:true}));
 check(contract+'/'+line+' valid zero remains zero',()=>assert.equal(api.classifyCharge(row,{amount:0}).amount,0));
 for(const patch of [{rental_contract:'synthetic-other'},{line:999},{item:'GENERATOR'},{item_type_code:1},{branch_code:'OTHER'},{sales_analysis_code:branch+'-HIR'},{subhired:true},{subhired_machine:true}]){
  const other=Object.freeze({...row,...patch});check(contract+'/'+line+' rejects '+JSON.stringify(patch),()=>assert.equal(api.isInstallation(other),false));check('unrelated price object retained',()=>assert.equal(api.classifyCharge(other,charge),charge));
 }
 check('existing correct charge flag is accepted without mutation',()=>assert.equal(api.isInstallation({...row,charge_line:true}),true));
 check('source array not treated as a price',()=>{const x=[];assert.equal(api.classifyCharge(row,x),x);});
}
for(const value of [null,undefined,0,'',{},[]])check('non-source rejected '+String(value),()=>assert.equal(api.isInstallation(value),false));
check('API immutable',()=>assert(Object.isFrozen(api)));
console.log(passed+' synthetic classification assertions PASS');
