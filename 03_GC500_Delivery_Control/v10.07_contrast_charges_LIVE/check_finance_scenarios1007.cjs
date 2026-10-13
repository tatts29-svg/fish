/* Author: Andrew Fisher. Independent pure-model and actual integration-wrapper scenarios. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const Finance=require('./finance1007');
const html=fs.readFileSync(process.env.PAGE,'utf8'),start=html.indexOf('function peeHireForecast979()'),end=html.indexOf('\nconst cardBefore979',start),source={hire:672.1677},checks=[];
assert.ok(start>=0&&end>start,'integration wrapper located');
const check=(name,pass)=>{checks.push({name,pass:!!pass});};
for(const [arrived,actual,remaining]of [[0,0,4033.01],[1,672.17,3360.84],[2,1344.34,2688.67],[3,2016.50,2016.51],[5,3360.84,672.17],[6,4033.01,0]]){
 const context={heldMemo:(_key,fn)=>fn(),assetOf:()=>({key:'WC09'}),chargeLines:()=>[{item:'Pee Panel',quantity:6}],qtyOf:l=>l.quantity,receivedChargeQty1006:()=>arrived,PeeHire979:{forecast:(items,contracts)=>Finance.pee(items,contracts,source)},ONHIRE_ROWS:[]};
 vm.createContext(context);vm.runInContext(html.slice(start,end),context);const r=context.peeHireForecast979();
 check(arrived+' received: existing complete hire retained',r.amount===4033.01);
 check(arrived+' received: actual and remaining independently expected',r.actualAmount===actual&&r.remainingAmount===remaining);
 check(arrived+' received: one amount partitioned once',Math.round((r.actualAmount+r.remainingAmount)*100)/100===r.amount);
}
for(const [label,asset,lines,contracts]of [
 ['reference absent',null,[],[]],['cancelled',{key:'WC09',_cancelled:true},[{item:'Pee Panel',quantity:6}],[]],
 ['rest location',{key:'WC09',rest_of:'WC09'},[{item:'Pee Panel',quantity:6}],[]],
 ['item removed',{key:'WC09'},[{item:'FWF',quantity:6}],[]],
 ['contract now covers panels',{key:'WC09'},[{item:'Pee Panel',quantity:6}],[{description:'Pee Panel',quantity:6,charge_line:false}]],
 ['changed scope needs review',{key:'WC09'},[{item:'Pee Panel',quantity:5}],[]]]){
 const context={heldMemo:(_key,fn)=>fn(),assetOf:()=>asset,chargeLines:()=>lines,qtyOf:l=>l.quantity,receivedChargeQty1006:()=>6,PeeHire979:{forecast:(items,cs)=>Finance.pee(items,cs,source)},ONHIRE_ROWS:contracts};
 vm.createContext(context);vm.runInContext(html.slice(start,end),context);const r=context.peeHireForecast979();
 check(label+': safe numeric zero in every financial view',r.amount===0&&r.actualAmount===0&&r.remainingAmount===0);
 check(label+': subsequent amount arithmetic cannot become NaN',Number.isFinite(1200+r.actualAmount)&&Number.isFinite(1200+r.remainingAmount));
}
const base={ref:'CHECK',received:1,branch:'KINP',card:{state:'no rate line',labour_per_piece:{lines:[]}}};
for(const item of ['FWF Trailer','3.0m Cont','Event Container','TL2']){
 const gap=Finance.workGap({...base,item});
 check(item+': unpriced scope explicit, no fabricated price',gap?.state==='unpriced'&&gap.rate===null&&gap.value===null);
 check(item+': pending equipment not called arrived gap',Finance.workGap({...base,item,received:0})===null);
 check(item+': own use does not gain client charge',Finance.workGap({...base,item,ownUse:true})===null);
 for(const [kind,rate]of [['rate',50],['zero',0],['included',null]])
  check(item+': '+kind+' source suppresses missing-mapping warning',Finance.workGap({...base,item,card:{labour_per_piece:{lines:[{key:'install',money:kind,rate}]}}})===null);
}
check('Ordinary FWF zero level/clean cells do not create new charges',Finance.workGap({...base,item:'FWF'})===null);
check('Forklift N/A labour does not create new installation',Finance.workGap({...base,item:'Forklift 5T'})===null);
const result={author:'Andrew Fisher',checks,failures:checks.filter(r=>!r.pass)};
fs.writeFileSync(path.join(__dirname,'evidence','finance-independent-scenarios.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,failures:result.failures}));if(result.failures.length)process.exitCode=1;
