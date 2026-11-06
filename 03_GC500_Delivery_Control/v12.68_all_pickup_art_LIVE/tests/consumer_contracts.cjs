/* Author: Andrew Fisher. Stamp callers forward explicit item context without changing status or wording. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;const eq=(actual,want,name)=>{assert.deepEqual(JSON.parse(JSON.stringify(actual)),JSON.parse(JSON.stringify(want)),name);checks++;};
function subSource(html){const m=html.match(/<script id="subhired1248-script">([\s\S]*?)<\/script>/);assert(m);const box={module:{exports:{}}};vm.runInNewContext(m[1],box);return box.module.exports;}
function buildSource(html,contexts){const m=html.match(/var BuildDeparture1248 = ([\s\S]*?)\n\nfunction timeline841State/);assert(m);const root={Stamp1232:{left:()=>({at:'2026-10-28T02:00:00Z',date:'2026-10-28',by:'Example operator'}),html:(meta,context)=>{contexts.push({meta,context});return '<native-stamp></native-stamp>';}},Artwork1268:{reference:()=>({types:['Portable Toilet']})}};const box={window:root};vm.runInNewContext('var BuildDeparture1248 = '+m[1],box);return box.BuildDeparture1248;}
function run(base,candidate){
 const before=subSource(base),after=subSource(candidate);
 const event={departedAt1211:'2026-10-28T02:00:00Z',date:'2026-10-28',by:'Example operator',items:[{type:'Portable Toilet',n:2}]};
 const scenarios=[
  {name:'complete identified unit',method:'unitHtml',args:['EXAMPLE','EXAMPLE-UNIT','Portable Toilet',true],remaining:0,taken:2,expectStamp:true},
  {name:'unidentified unit',method:'unitHtml',args:['EXAMPLE','EXAMPLE-UNIT','Portable Toilet',false],remaining:0,taken:2,expectStamp:false},
  {name:'complete quantity',method:'quantityHtml',args:['EXAMPLE','Portable Toilet'],remaining:0,taken:2,expectStamp:true},
  {name:'partial quantity',method:'quantityHtml',args:['EXAMPLE','Portable Toilet'],remaining:1,taken:2,expectStamp:false},
  {name:'unconfirmed quantity',method:'quantityHtml',args:['EXAMPLE','Portable Toilet'],remaining:0,taken:2,unknown:true,expectStamp:false},
  {name:'record issue',method:'quantityHtml',args:['EXAMPLE','Portable Toilet'],remaining:0,taken:2,issues:['example issue'],expectStamp:false},
  {name:'type mismatch',method:'quantityHtml',args:['EXAMPLE','Accessible Toilet'],remaining:0,taken:2,expectStamp:false}
 ];
 for(const row of scenarios){
  const calls=[[],[]],outputs=[];
  for(const [index,source] of [before,after].entries()){
   const status={issues:row.issues||[],collected:row.taken,unknown:!!row.unknown,label:'Example departure',taken1229:[{type:'Portable Toilet',n:row.taken}],items:[{type:'Portable Toilet',n:row.remaining}],events:[event]};
   const deps={departures:()=>({status:()=>status,unit:()=>event,stamp:()=> 'Example time'}),stamp:()=>({html:(meta,context)=>{calls[index].push({meta,context});return '<native-stamp></native-stamp>';}})};
   const api=source.create(deps);outputs.push(api[row.method](...row.args));
  }
  eq(outputs[1],outputs[0],row.name+' preserves complete native wording');
  eq(calls[1].map(x=>x.meta),calls[0].map(x=>x.meta),row.name+' preserves stamp metadata');
  eq(calls[1].length,row.expectStamp?1:0,row.name+' preserves stamp eligibility');
  if(row.expectStamp)eq(calls[1][0].context,{item:'Portable Toilet'},row.name+' forwards own item');
 }
 const calls=[[],[]],builders=[buildSource(base,calls[0]),buildSource(candidate,calls[1])];
 const asset={key:'EXAMPLE',description:'Mixed reference description which must not pick artwork'};
 eq(builders[1].stamp(asset,{departed1248:true}),builders[0].stamp(asset,{departed1248:true}),'Build stamp wrapper and content unchanged');
 eq(calls[1][0].meta,calls[0][0].meta,'Build exact departure metadata unchanged');
 eq(calls[1][0].context,{types:['Portable Toilet']},'Build forwards explicitly typed departure context');
 eq(builders[1].stamp(asset,{partialDeparture1248:true}),'','partial Build reference keeps its original no-completed-stamp rule');
 eq(builders[1].project({stage:2},{known:true,unknown:false,issues:[],collected:2,remaining:1,complete:false,arrival:true,last:'Example'}),builders[0].project({stage:2},{known:true,unknown:false,issues:[],collected:2,remaining:1,complete:false,arrival:true,last:'Example'}),'partial Build state unchanged');
 return {author:'Andrew Fisher',status:'PASS',checks};
}
if(require.main===module){assert(process.env.BASE&&process.env.CANDIDATE,'BASE and CANDIDATE required');console.log(JSON.stringify(run(fs.readFileSync(process.env.BASE,'utf8'),fs.readFileSync(process.env.CANDIDATE,'utf8'))));}
module.exports={run};
