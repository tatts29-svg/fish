// Author: Andrew Fisher. Actual PO functions, isolated state; no browser or service writes.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const src=fs.readFileSync(process.env.PAGE,'utf8');assert.equal(crypto.createHash('sha256').update(src).digest('hex'),process.env.EXPECTED_SHA);
function context(source){const c={S:{purchaseOrders:{}},flash:()=>{},mayWrite:()=>true,whoAmI:()=> 'Audit',stampIt:()=>{},save:()=>{c.saves++},saves:0,FH866_RECEIPT:{full:'full',part:'part',none:'none',unknown:'unknown'},money:String};c.poOf=n=>c.S.purchaseOrders[n]||null;
 const start=source.indexOf('function poReceiptIssue982('),receipt=source.indexOf('function fh866Receipt('),end=source.indexOf('/* split a total across branches',receipt);
 vm.runInNewContext(source.slice(start>=0?start:receipt,end)+source.slice(source.indexOf('function setPo('),source.indexOf('/* Everything a branch carries',source.indexOf('function setPo('))),c);return c;}
const candidate=context(src);
for(const fields of [{amount:100,receipted:'part',receipted_amount:101},{amount:100,receipted:'part',receipted_amount:-1},{amount:100,receipted:'part',receipted_amount:null},{amount:-1,receipted:'full'}]){
assert.equal(candidate.setPo('99999990',fields),false);assert.equal(candidate.saves,0);assert.equal(Object.keys(candidate.S.purchaseOrders).length,0);assert.equal(candidate.fh866Receipt(fields).amount,null);assert.equal(candidate.fh866Receipt(fields).key,'unknown');}
assert.equal(candidate.setPo('99999990',{amount:100,receipted:'part',receipted_amount:40}),true);assert.equal(candidate.saves,1);assert.equal(candidate.fh866Receipt(candidate.S.purchaseOrders['99999990']).amount,40);
assert.equal(candidate.setPo('99999990',{receipted_amount:101}),false,'Merged PO amount is validated');assert.equal(candidate.saves,1);assert.equal(candidate.S.purchaseOrders['99999990'].receipted_amount,40);
if(process.env.BASE){const old=context(fs.readFileSync(process.env.BASE,'utf8'));assert.equal(old.setPo('99999990',{amount:100,receipted:'part',receipted_amount:101}),true);assert.equal(old.fh866Receipt(old.S.purchaseOrders['99999990']).amount,101);}
const result={author:'Andrew Fisher',sha256:process.env.EXPECTED_SHA,pass:true,invalidInputsRejected:true,invalidSharedReceiptsExcluded:true,validPartialReceiptRetained:true,existingPoValidated:true,baselineBugReproduced:!!process.env.BASE};if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
