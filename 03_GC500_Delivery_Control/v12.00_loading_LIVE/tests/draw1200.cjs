/* Author: Andrew Fisher. Controlled attribution, no operational writes. */
const fs=require('fs'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844,dpr:3,cpu:4}),p=h.page;
try{await p.waitForFunction(()=>SYNC.status==='live');await p.waitForTimeout(1000);
const report=await p.evaluate(()=>{
 const results=[],stack=[];
 const names=['render','renderPass','renderToday','renderProgress','renderTabs','fitKpis','foldForPhone','foldStories','markCards','applyCapability','countUpFigures','todayWorkHealth840','todayWork840','moneySummary','pl752Rows','allDockets','serviceNoteRows','collectionRows','finderIndex','buildAllAssets','lighting894MapList','assetNumbersOf','unitsOf','allUnits','twinIds815','financeOperational857','hzTodayPod','todayWorkBuild848','wwaRender793','renderTimeline'];
 for(const name of names){const raw=window[name];if(typeof raw!=='function')continue;window[name]=function(...args){const frame={name,child:0},start=performance.now();stack.push(frame);try{return raw.apply(this,args);}finally{const ms=performance.now()-start;stack.pop();if(stack.length)stack.at(-1).child+=ms;results.push({name,ms,self:ms-frame.child});}};}
 let start=performance.now();go('today');const today=performance.now()-start;
 start=performance.now();const matches=holdAssets(()=>finderMatches('fencing'));const search=performance.now()-start;
 const totals={};for(const r of results){const v=totals[r.name]||(totals[r.name]={calls:0,ms:0,self:0});v.calls++;v.ms+=r.ms;v.self+=r.self;}
 return {today,search,matches:matches.length,functions:Object.entries(totals).map(([name,v])=>({name,...v})).sort((a,b)=>b.self-a.self)};
});console.log(JSON.stringify({...report,errors:h.errors,attemptedWrites:h.counts.blocked},null,2));
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exit(2)});
