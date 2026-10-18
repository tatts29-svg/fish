/* Author: Andrew Fisher. Synthetic supplier coverage; no private rates in this test. */
'use strict';
const assert=require('assert/strict');
const S=require('../source949.js');
const row={rental_contract:'1234567',line:2,quantity:2,branch_code:'AAA',start_date:'2026-10-08',expected_term_date:'2026-10-18'};
const e={supplierCode:'TEST1',supplierName:'Example Supplier',salesAnalysisCode:'BBB-SUB',costRate:5};
const c={how:'per day',days:10},actual={id:'invoice',side:'ours',usable:true,amount:20,supplier:'TEST1',contract:'1234567'};
const run=(costs=[],r=row,ch=c)=>S.calculate(r,e,ch,costs);let n=0;
function eq(a,b){assert.deepEqual(a,b);n++;}
eq(run().estimate,100);eq(run().costBranch,'BBB');eq(run().revenueBranch,'AAA');
eq(run([{...actual,contract_line:2}]).estimate,0);eq(run([actual]).estimate,0);
eq(run([{...actual,contract_line:3}]).estimate,100);eq(run([{...actual,contract:'7654321'}]).estimate,100);
eq(run([{...actual,supplier:'Someone Else'}]).estimate,100);eq(run([{...actual,side:'customer'}]).estimate,100);
eq(run([{...actual,usable:false}]).estimate,100);eq(run([{...actual,amount:null}]).estimate,100);
eq(run([{...actual,period_from:'2026-10-08',period_to:'2026-10-11'}]).estimate,70);
eq(run([{...actual,period_from:'2026-10-08',period_to:'2026-10-11'},{...actual,id:'invoice2',period_from:'2026-10-10',period_to:'2026-10-13'}]).estimate,50);
eq(run([{...actual,period_from:'2026-10-01',period_to:'2026-10-07'}]).estimate,100);
eq(run([{...actual,period_from:'2026-10-01',period_to:'2026-10-30'}]).estimate,0);
eq(run([],row,{how:'whole event'}).estimate,10);
eq(run([{...actual,period_from:'2026-10-23',period_to:'2026-10-26'}],row,{how:'whole event'}).estimate,0);
const partial=run([{...actual,period_from:'2026-10-24',period_to:'2026-10-25'}],row,{how:'whole event'});eq(partial.held,true);eq(partial.estimate,0);
eq(run([],row,{how:'no dates'}),null);eq(run([],row,{how:'per day',days:10,treatment:'cancelled'}),null);
eq(run([{id:'native-expense',side:'ours',kind:'misc',category:'Misc and other expenses',date:'2026-10-09',supplier:'TEST1',description:'Rehire — contract 1234567 line 2',note:'period 2026-10-08 to 2026-10-11',amount:20,recorded_by:'Andrew Fisher',usable:true}]).estimate,70);
const before=JSON.stringify({row,e,c,actual});run([actual]);eq(JSON.stringify({row,e,c,actual}),before);
console.log(JSON.stringify({author:'Andrew Fisher',checks:n,passed:true}));
