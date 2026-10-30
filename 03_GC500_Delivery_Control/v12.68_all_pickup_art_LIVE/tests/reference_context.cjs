/* Author: Andrew Fisher. Whole-reference artwork reads explicit completed departure types only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../artwork1268_src.js'),'utf8');
function context(status){const root={Departure1211:{status:()=>status}};vm.runInNewContext(source,{window:root});return root.Artwork1268;}
let checks=0;const check=(actual,want)=>{assert.deepEqual(JSON.parse(JSON.stringify(actual)),want);checks++;};
for(const status of [null,{complete:false,events:[{items:[{type:'FWF'}]}]},{complete:true,issues:['example review'],events:[{items:[{type:'FWF'}]}]},{complete:true,events:[]},{complete:true,events:[{items:[{type:''}]}]},{complete:true,events:[{items:[{type:'FWF'},{n:1}]}]}])check(context(status).reference('EXAMPLE'),null);
const complete={complete:true,issues:[],events:[{items:[{type:'FWF'},{type:'Pee Panel'}]},{items:[{type:'FWF'}]}]};
const api=context(complete),before=JSON.stringify(complete);check(api.reference('EXAMPLE'),{types:['FWF','Pee Panel']});check(api.resolveAll(api.reference('EXAMPLE')),['portable-toilet','urinal']);assert.equal(JSON.stringify(complete),before);checks++;
const unknown=context({complete:true,events:[{items:[{type:'Unspecified item'}]}]});check(unknown.resolveAll(unknown.reference('EXAMPLE')),[]);
const throwing={Departure1211:{status:()=>{throw Error('unavailable');}}};vm.runInNewContext(source,{window:throwing});check(throwing.Artwork1268.reference('EXAMPLE'),null);
console.log(JSON.stringify({author:'Andrew Fisher',status:'PASS',checks}));
