// Author: Andrew Fisher. Verify the public page after upload; the harness blocks writes.
const fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
 const h = await open({hash:'#questions', mobile:true, W:390, H:844, dpr:1});
 try {
  const p=h.page;
  await p.waitForFunction(() => typeof questionHistory753 === 'function' && typeof labourNote753 === 'function' && SYNC.status==='live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout:180000});
  await p.waitForTimeout(1500);
  const result=await p.evaluate(() => {
   const before=JSON.stringify(S), q=questionsList(), m=moneySummary(), checks=[];
   const check=(name,pass)=>checks.push({name,pass:!!pass});
   check('Corrected revenue is live',m.charge.total===555929.94);
   check('Unknown accessory rates stay visible',m.charge.contracts_unknown===2);
   check('Five supported pricing answers present', ['card-covered753','charge-window753','generator-card-rule753','mead-day-rate753','servicing-card753'].every(id=>q.some(x=>x.id===id&&x.st===QH_DONE)));
   check('Water and CCB decisions remain open', ['water-service-rate753','ccb-classification753'].every(id=>q.some(x=>x.id===id&&x.st===QH_OPEN)));
   check('All question checks ran',!q.fails.length);
   check('Overview renders',document.querySelector('[data-answers753]'));
   check('Map/task import repair is live',['fixes','entries','places','givenRefs'].every(k=>k in recordsFrom({})));
   check('Task references start in blank record','givenRefs' in blank());
   check('CNA hours have correct classification',m.categories.find(x=>x.key==='internal').hours===1702.5);
   check('Servicing summary reads current calculation',m.servicing.total===servicing748Total());
   check('No false verified payroll',fin745Summary().actualCostCount===0);
   check('No mobile document overflow',document.documentElement.scrollWidth===document.documentElement.clientWidth);
   check('Read-only verification leaves records unchanged',JSON.stringify(S)===before);
   return {author:'Andrew Fisher',checks,revenue:m.charge.total,questions:{open:q.filter(x=>x.st===QH_OPEN).length,pending:q.filter(x=>x.st===QH_LATER).length,answered:q.filter(x=>x.st===QH_DONE).length+questionHistory753().filter(x=>x[1]===QH_DONE).length}};
  });
  result.checks.push({name:'No page errors',pass:!h.errors.length},{name:'No live write attempts',pass:!h.counts.blocked});
  fs.writeFileSync(process.argv[2]||__dirname+'/public_verification.json',JSON.stringify(result,null,2)+'\n');
  const failed=result.checks.filter(x=>!x.pass);console.log(JSON.stringify({passed:result.checks.length-failed.length,total:result.checks.length,failed,revenue:result.revenue,questions:result.questions}));
  if(failed.length)process.exitCode=1;
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
