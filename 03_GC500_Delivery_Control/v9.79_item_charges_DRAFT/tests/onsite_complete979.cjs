/* Author: Andrew Fisher. Partial arrivals, duplicate coverage, future work and unknown prices. */
const assert=require('assert'),{project}=require('../onsite_complete979');
const item=(changes={})=>({ref:'WC1',item:'FWF',branch:'KINP',arrived:2,hire:[{id:'a',amount:100,quantity:4}],work:[{name:'Demob',value:40}],...changes});
let x=project([item()],[{ref:'WC1',item:'FWF',leg:'delivery',quantity:4,state:'estimate',additional:80},{ref:'WC1',item:'FWF',leg:'pickup',state:'held'}]);assert.equal(x.known,130);assert.equal(x.total,null);assert.equal(x.holds.length,1);
x=project([item({arrived:3,hire:[{id:'a',quantity:5,amount:100},{id:'b',quantity:5,amount:100}],work:[]})],[]);assert.equal(x.total,60);
x=project([item({arrived:6,hire:[{id:'a',quantity:5,amount:100}],work:[]})],[]);assert.equal(x.total,null);assert.equal(x.known,100);
assert.equal(project([item({arrived:0,fallbackHire:200})],[]).total,0);
x=project([item({work:[]}),item({ref:'WC2',arrived:1,hire:[{id:'b',quantity:1,amount:25}],work:[]})],[{ref:'WC1',item:'FWF',quantity:2,state:'covered',coverage:[{id:'charge1',amount:300,quantity:2}]},{ref:'WC2',item:'FWF',quantity:1,state:'covered',coverage:[{id:'charge1',amount:300,quantity:1}]}]);assert.equal(x.known,375);assert.equal(x.byBranch[0].total,x.known);
console.log('8 onsite scope and source allocation assertions passed');
const rounded=project([{ref:'R',item:'X',branch:'KINP',arrived:1,hire:[{id:'r',amount:340.25,quantity:3}],work:[{value:0.006}]}],[]).rows[0];assert.equal(rounded.total,Math.round((rounded.hire+rounded.work+rounded.transport)*100)/100);
