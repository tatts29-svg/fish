// Author: Andrew Fisher. Source-bound grouping: unknown rates and independent reconciliation failures.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const s=fs.readFileSync(path.resolve(__dirname,'../pnl_clarity981.js'),'utf8');
const context={};vm.createContext(context);
function fn(name){const start=s.indexOf('function '+name+'(');assert(start>=0);let level=0,open=s.indexOf('{',start),end=open;for(;end<s.length;end++){if(s[end]==='{')level++;if(s[end]==='}'&&--level===0)break;}return s.slice(start,end+1);}
vm.runInContext('const precise = n => typeof n === "number" && Number.isFinite(n);'+fn('groups')+'\n'+fn('failedChecks')+'\n'+fn('handoverExport'),context);
let checks=0;const check=(v,m)=>{assert(v,m);checks++;};
function model(rev,cost=[]){const sum=(rs,k)=>Math.round(rs.reduce((n,r)=>n+(typeof r[k]==='number'?r[k]:0),0)*100)/100;return{rev,cost,revNow:sum(rev,'now'),revJob:sum(rev,'job'),direct:sum(cost,'now'),directJob:sum(cost,'job'),checks:{revenue:true,costs:true}};}
const rev=[{code:'1005',now:10,job:20},{code:'1010',now:30,job:40},{code:'1030 · 1031',now:50,job:60},{code:'1032',now:7,job:8},{code:'1020',now:9,job:10},{code:'1047',now:11,job:12},{code:'1025',now:13,job:14},{code:'1015',now:null,job:null},{code:'—',now:15,job:16}];
const cost=[{code:'2357',now:1,job:2},{code:'2120 · 2140',now:3,job:4},{code:'3325',now:5,job:6},{code:'2126',now:7,job:8},{code:'2144',now:9,job:10},{code:'2142',now:11,job:12}];
let P=model(rev,cost),G=context.groups(P);
check(Object.values(G.checks).every(Boolean),'All grouped amounts reconcile');
check(G.revenue.flatMap(g=>g.rows).length===rev.length&&G.costs.flatMap(g=>g.rows).length===cost.length,'Every source row included exactly once');
check(G.revenue.find(g=>g.label==='Transport Revenue').recorded===57,'Pumpouts join Transport Revenue');
check(G.costs.find(g=>g.label==='Transport').recorded===8,'Pumpout costs join Transport costs');
check(G.revenue.find(g=>g.label==='Other Revenue').unpriced===1,'Mixed priced and unpriced group retains warning');
check(G.revenue.find(g=>g.label==='Revenue · allocation pending').recorded===15,'Unallocated support remains distinct');
G=context.groups(model([{code:'NEW',now:null,job:null}]));
check(G.revenue[0].recorded===null&&G.revenue[0].job===null,'Unknown new account remains unpriced, not zero');
G=context.groups(model([{code:'NEW',now:7,job:null}]));
check(G.revenue[0].recorded===7&&G.revenue[0].job===null,'Unknown forecast cannot become zero');
G=context.groups(model([{code:'NEW',now:0,job:0}]));
check(G.revenue[0].recorded===0&&G.revenue[0].job===0&&G.revenue[0].unpriced===0,'Explicit zero remains known');
G=context.groups(model([{code:'1005',now:3,job:5},{code:'1005',now:null,job:null}]));
check(G.revenue[0].recorded===3&&G.revenue[0].job===5&&G.revenue[0].unpriced===1,'Mixed group is priced subtotal with warning');
G=context.groups(model([],[{code:'FUTURE',now:5,job:6}]));
check(G.costs[0].label==='Direct costs · allocation pending'&&G.costs[0].job===6,'New cost account retained');
G=context.groups(P);P.checks.revenue=false;
check(context.failedChecks(P,G).some(([k])=>k==='ledger.revenue'),'Passing group check cannot hide failed ledger reconciliation');
G.checks.revenue=false;
check(context.failedChecks(P,G).filter(([k])=>k.endsWith('.revenue')).length===2,'Both independent failures retained');
context.cj764Model=()=>({rows:[{stream:'Rehire — supplier',toDate:0,toCome:10,note:'contract 1234 line 8'}]});
const H={costs:[{stream:'Rehire',toDate:0,toCome:10,job:10,by:{KINP:10},pos:['1000']},{stream:'Salary allowance',toDate:0,toCome:5,job:5,by:{KINP:5},pos:['1000']}]},copy=JSON.stringify(H),view=context.handoverExport(H);
check(view.costs[0].stream.includes('contract 1234 line 8'),'Export retains distinct supplier source line');
check(view.costs[1].pos.length===0,'Export has no unsupported salary-allowance supplier PO');
check(JSON.stringify(H)===copy&&view.costs.every((r,i)=>r.job===H.costs[i].job&&JSON.stringify(r.by)===JSON.stringify(H.costs[i].by)),'Export labels do not change source model, amount or branch split');
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
