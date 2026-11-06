/* Author: Andrew Fisher. Synthetic display arithmetic; no operational rates or records. */
'use strict';
const assert=require('node:assert/strict'),R=require('../rate941.js');
let checks=0;const ok=(value,message)=>{assert(value,message);checks++;};
const line=(rate,qty,days,total=rate*qty*days)=>({rate,qty,days,total});
let l=Object.freeze(line(10.25,2,3)),r=R.rate(l);
ok(r.text==='$10.25'&&r.digits===2&&r.matched&&!r.note,'Ordinary cents keep ordinary currency display');
r=R.rate(line(18.7654,3,2));ok(r.text==='$18.765'&&r.digits===3&&r.matched,'Use the first precision that supports the subtotal');
ok(R.formula(line(18.7654,3,2)).includes('subtotal rounded to cents'),'Extra precision explains subtotal rounding');
r=R.rate(line(12.34567,17,11));ok(r.digits>3&&r.matched,'Larger multiplier can require more precision');
for(const value of [1.005,-1.005]){r=R.rate(line(value,1,3));ok(!r.matched&&r.note.includes('original calculation'),'Binary half-cent ties must not promise false decimal equality');}
r=R.rate(line(1/3,1e9,3));ok(!r.matched&&r.note.includes('original calculation'),'Bounded precision must have an explicit fallback');
for(const value of [0,-0]){r=R.rate(line(value,3,2));ok(r.matched&&r.digits===2,'Zero is a known amount');}
r=R.rate(line(27.123456,0,7));ok(r.matched&&r.digits===2,'Zero quantity needs no artificial precision');
r=R.rate(line(-18.7654,3,2));ok(r.matched&&r.text==='-$18.765','Negative credits use the same precision rule');
r=R.rate(line(.000001,2e6,3));ok(r.matched&&r.digits===6,'Very small rates retain meaningful digits');
r=R.rate(line(10,2,3,70));ok(!r.matched&&r.note==='subtotal shown separately','A different subtotal must never be explained by invented rounding');
for(const bad of [null,undefined,'',true,'12',NaN,Infinity,-Infinity]){
 r=R.rate(line(bad,1,3));ok(!r.matched&&r.text==='Rate not recorded','Invalid or untyped rates stay unknown');
}
for(const field of ['qty','days','total']){
 for(const bad of [null,undefined,'',false,'3',NaN,Infinity]){
  const input={...line(18.7654,1,3),[field]:bad};r=R.rate(input);ok(!r.matched&&r.note==='rate shown rounded','Incomplete formula cannot imply a reconciled subtotal');
 }
}
r=R.rate(line(Number.MAX_VALUE,2,3));ok(!r.matched,'Overflow remains unverified');
r=R.rate(line(Number.MAX_SAFE_INTEGER+1,1,1));ok(!r.matched&&r.note==='subtotal shown separately','Unsafe integer magnitude is not certified');
ok(R.formula(line(10,1,1))==='1 day × $10.00 × 1','Singular day wording');
ok(R.formula(line(10,1,2))==='2 days × $10.00 × 1','Plural day wording');
ok(R.formula({...line(10,1,2),qty:null})==='2 days × $10.00','Unknown quantity is never manufactured');
ok(R.formula({...line(10,1,2),days:null})==='Daily rate $10.00','Unknown days are never manufactured');
ok(R.formula({rate:'<script>',days:1,qty:1})==='Rate not recorded','Untrusted rate text cannot become formula markup');
ok(JSON.stringify(l)===JSON.stringify(line(10.25,2,3)),'Formatting leaves source input untouched');
console.log(JSON.stringify({author:'Andrew Fisher',passed:true,syntheticChecks:checks}));
