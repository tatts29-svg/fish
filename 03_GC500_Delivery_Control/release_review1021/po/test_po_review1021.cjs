/* Author: Andrew Fisher. Pure review-state and native-setter regressions; no service access. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const scope = {console}; vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'po_review1021.js'), 'utf8'), scope);
const {poReviewBasis1021:basis, poReviewCurrent1021:current, poReviewPatch1021:patch} = scope;
let checks = 0; const check = (name, fn) => { fn(); checks++; console.log('PASS ' + name); };
const order = {number:'4647517', amount:26695, period:'Week 1', programme_sheet:'CW1', invoice_no:'receipt-1', supplier_code:'ATF', supplier_name:'Advanced', branch:'KINP', stream:'fencing', revenue_branch:'KINP', confirmed:true, what:'fencing', note:'reviewed scope', supplier_pricing:{b:2,a:1}};
const review = {by:'Andrew Fisher',at:'2026-10-15T00:00:00.000Z'};
const reviewed = {...order,...patch(order,{checked:review})};
check('new check is bound to the saved order',()=>{assert.equal(current(reviewed),true); assert.equal(reviewed.checked.basis,basis(order)); assert.equal(review.basis,undefined);});
check('same values and reordered supplier fields preserve check',()=>assert.equal(patch(reviewed,{amount:'26695.00', supplier_pricing:{a:1,b:2}}).checked,undefined));
check('receipt-only update preserves check',()=>assert.equal(patch(reviewed,{receipted:true,receipted_amount:26695}).checked,undefined));
for(const [key,value] of Object.entries({amount:26696,period:'Week 2',programme_sheet:'CW2',invoice_no:'receipt-2',supplier_code:'OTHER',supplier_name:'Other',branch:'NOIS',stream:'other',revenue_branch:'NOIS',confirmed:false,what:'different scope',note:'changed scope',supplier_pricing:{a:1,b:3}})) {
 check('changing '+key+' invalidates check',()=>assert.equal(patch(reviewed,{[key]:value}).checked,null));
}
check('shared change bypassing setter cannot show old check',()=>assert.equal(current({...reviewed,amount:30000}),false));
check('legacy checks remain visible until a material edit',()=>{const old={...order,checked:review};assert.equal(current(old),true);assert.equal(patch(old,{amount:30000}).checked,null);});
check('explicit recheck binds the revised order',()=>{const changed={...reviewed,amount:30000};const next={...changed,...patch(changed,{checked:review})};assert.equal(current(next),true);assert.notEqual(next.checked.basis,reviewed.checked.basis);});
check('failed/empty check stays empty',()=>{assert.equal(current(null),false);assert.equal(current({...order,checked:{}}),false);assert.equal(patch(reviewed,{checked:null}).checked,null);});
check('empty and zero amounts stay distinct',()=>assert.notEqual(basis({...order,amount:null}),basis({...order,amount:0})));
check('review helpers do not mutate prior record or caller patch',()=>{const before=JSON.stringify(reviewed),p={amount:30000};patch(reviewed,p);assert.equal(JSON.stringify(reviewed),before);assert.deepEqual(p,{amount:30000});});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
