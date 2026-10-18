// Author: Andrew Fisher. Independent captured-native-input replay, no browser or network.
// INPUT is a private v842 browser report; OUT remains outside the repository.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {typeOracle843,assertTypeModel843}=require('./test_type_oracle843.cjs');
const {INPUT,OUT}=process.env;if(!INPUT||!OUT)throw Error('Private INPUT and OUT required');
const captured=JSON.parse(fs.readFileSync(INPUT)),v=captured.views[0],groups=v.groupInputs,plan=v.summaryInputs,byKey=new Map(plan.rows.map(r=>[r.key,r]));
const rows=groups.rows.map(r=>{const p=byKey.get(r.key);return {a:{key:r.key,name:r.name,product:r.product,discipline:r.discipline,_cancelled:r.cancelled,relocation:r.relocation,rest_of:r.restOf},reloc:r.relocation,cls:r.lines.map(l=>({item:l.item,quantity:l.quantity})),askedBy:new Map(r.askedBy),onBy:new Map(r.onBy),d:{done:r.done,recorded:p.recorded,state:p.state,where:p.where},st:{in:p.date}};});
const context={Map,Set,Date,Math,Number,JSON,encodeURIComponent,DATA:{weeks:[]},FCOL:[],todayIso:()=>plan.today,dsnState:()=>({rows}),qtyOf:l=>l.quantity,shortOf:a=>groups.rows.find(r=>r.key===a.key).shorts.map(item=>({item})),movedAway:key=>groups.rows.find(r=>r.key===key).movedAway,todayWorkHealth840:()=>v.model.groups.health,todayGroupHealth841:()=>v.model.groups.health};
vm.createContext(context);const summarySource=fs.readFileSync(path.join(__dirname,'../v8.42_today_plan_clarity_LIVE/work_summary842_src.js'),'utf8'),source=fs.readFileSync(path.join(__dirname,'type_metrics843_src.js'),'utf8');vm.runInContext(summarySource,context);vm.runInContext(source,context);
const actual=context.todayTypeMetrics843(v.model.day,v.model.groups,v.model.summary),expected=typeOracle843({day:v.model.day,work:v.nativeInputs,groups,plan,fencing:v.fencingInputs}),checks=[];
assertTypeModel843((name,pass,evidence)=>checks.push({name,pass:!!pass,evidence}),'native replay',actual,expected);
const report={author:'Andrew Fisher',sourceSha:crypto.createHash('sha256').update(source).digest('hex'),inputCandidate:captured.candidate,checks,actual,expected,passed:checks.filter(c=>c.pass).length,total:checks.length};fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'type-replay843.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({sourceSha:report.sourceSha,passed:report.passed,total:report.total,failures:checks.filter(c=>!c.pass).map(c=>c.name)}));if(report.passed!==report.total)process.exitCode=1;
