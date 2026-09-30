// Author: Andrew Fisher. Public release verification through the read-only harness.
const fs = require('fs');
const path = require('path');
const {open} = require('../toolchain/harness/open_page');
(async () => {
 const h = await open({hash:'#questions', mobile:true, W:390, H:844, dpr:1});
 try {
  const p = h.page;
  await p.waitForFunction(() => typeof retainedQuestion754 === 'function' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout:180000});
  await p.waitForTimeout(1500);
  const result = await p.evaluate(() => {
   const original = JSON.stringify(S), q = questionsList(), checks = [], m = moneySummary();
   const check = (name, pass) => checks.push({name, pass:!!pass});
   const item = id => q.find(x => x.id === id);
   check('All question checks ran', !(q.fails || []).length);
   check('Source-backed FL01 fleet is visible', sourceRehire754('FL01').no === '50004' && subOf('FL01').some(x => x.no === '50004'));
   check('FL01 answer is in history', item('sp-nums').st === QH_DONE && item('sp-nums').confirmed754);
   check('Unresolved allocation and duplicate loads stay open', ['sp-extra','oi-TX03'].every(id => item(id).st === QH_OPEN));
   check('Temporary fencing work is distinguished from removal', item('fe-gap').why.includes('24455') && item('fe-gap').why.includes('24456') && item('fe-gap').rows.some(x => x.startsWith('Removal: 0 of 115')));
   check('Drawing question uses the held master revision', item('oi-R23').why.includes('D001-26003-03'));
   check('Notes and session draft workflow are live', typeof questionDraftValue754 === 'function' && typeof renderQuestions754 === 'function' && document.querySelector('[data-answers754]'));
   check('Revenue is unchanged', m.charge.total === 555929.94);
   check('Approved Forecast P&L is live', typeof pl752Card === 'function' && pl752Card().includes('Forecast P&amp;L'));
   const branches = pl752Rows();
   check('All branch totals reconcile with the contracts', branches.length === 4 && Math.round(branches.reduce((sum,b) => sum+b.total,0)*100) === Math.round(m.charge.contracts*100));
   check('Branch Rehire details are live', branches.find(b=>b.code==='KINP').rehireLines === 132 && branches.find(b=>b.code==='NVAC').plantLines === 1);
   check('Known Direct costs are unchanged', m.cost.known === 235081.76);
   check('Unknown accessory rates remain visible', m.charge.contracts_unknown === 2);
   check('Wages are not presented as verified actuals', fin745Summary().actualCostCount === 0);
   check('No mobile overflow', document.documentElement.scrollWidth === document.documentElement.clientWidth);
   check('Review does not change the record', JSON.stringify(S) === original);
   return {author:'Andrew Fisher', checks, revenue:m.charge.total, questions:{open:q.filter(x=>x.st===QH_OPEN).length,pending:q.filter(x=>x.st===QH_LATER).length,answered:q.filter(x=>x.st===QH_DONE).length+questionHistory753().filter(x=>x[1]===QH_DONE).length}};
  });
  result.checks.push({name:'No page errors',pass:!h.errors.length},{name:'No attempted writes',pass:!h.counts.blocked});
  fs.writeFileSync(path.join(__dirname,'evidence/public_verification.json'), JSON.stringify(result,null,2)+'\n');
  const failed = result.checks.filter(x=>!x.pass);
  console.log(JSON.stringify({passed:result.checks.length-failed.length,total:result.checks.length,failed,questions:result.questions,revenue:result.revenue}));
  if (failed.length) process.exitCode = 1;
 } finally { await h.browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
