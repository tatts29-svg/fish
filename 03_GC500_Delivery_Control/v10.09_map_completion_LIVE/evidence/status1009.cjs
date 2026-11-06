/* Author: Andrew Fisher. Verify no absent/partial/review record becomes Complete. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../map_status1009.js'),'utf8');
const assets=[{key:'complete'},{key:'onsite'},{key:'installed'},{key:'partial'},{key:'review'},
 {key:'none'},{key:'rental'},{key:'cancelled',_cancelled:true},{key:'moved'},{key:'throw'}];
const states={complete:{stage:5},onsite:{stage:2},installed:{stage:4},partial:{stage:2,partial962:true},
 review:{stage:5,conflict:true},none:{stage:0},rental:{stage:0},cancelled:{stage:0,blocked:true},moved:{stage:0,blocked:true}};
const records=Object.fromEntries(assets.map(a=>[a.key,{recorded:!['none'].includes(a.key),done:['complete','partial','review','cancelled','moved'].includes(a.key),
 ...(a.key==='moved'?{moved:{to:'another'}}:{}),...(a.key==='rental'?{where:'rental'}:{})}]));
let ready=true,verified=['complete'],count=0;
const ctx={window:{gc500CompleteKeys897:()=>verified},DATA:{edition:'hosted'},SYNC:{first:new Set(['subhire','loads'])},
 todayWorkHealth840:()=>({ready}),allAssets:()=>assets,deliveryOf:key=>records[key],timeline841State:a=>{if(a.key==='throw')throw Error('unavailable');return states[a.key]},holdAssets:fn=>fn()};
vm.createContext(ctx);vm.runInContext(source,ctx);
const read=keys=>JSON.parse(JSON.stringify(ctx.window.gc500MapStatus1009(keys))),check=(ok,name)=>{assert(ok,name);count++};
const before=JSON.stringify({assets,states,records});
const result=read(),byKey=Object.fromEntries(result.states.map(r=>[r.key,r]));
check(result.available,'ready source available');
for(const [key,state] of Object.entries({complete:'complete',onsite:'incomplete',installed:'incomplete',partial:'partial',review:'review',none:'unknown',rental:'unknown',cancelled:'cancelled',moved:'moved',throw:'unknown'}))check(byKey[key].state===state,key+' correct state');
check(read(['complete']).states.length===1,'requested references only');
verified=[];check(read(['complete']).states[0].state!=='complete','complete withdrawal propagates');
verified=null;check(!read().available,'unavailable completion source');verified=['complete'];
ready=false;check(!read().available,'no premature loaded state');ready=true;
ctx.SYNC.first.delete('subhire');check(!read().available,'supplier receipts must be loaded');ctx.SYNC.first.add('subhire');
ctx.SYNC.first.delete('loads');check(!read().available,'shared load evidence must be loaded');ctx.SYNC.first.add('loads');
check(JSON.stringify({assets,states,records})===before,'source records unchanged');
console.log(JSON.stringify({author:'Andrew Fisher',checks:count,passed:true}));
