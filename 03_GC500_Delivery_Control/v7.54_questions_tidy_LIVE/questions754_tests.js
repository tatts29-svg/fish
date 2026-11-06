// Author: Andrew Fisher. Evidence-backed closure and retained notes; GET-only practice.
const fs=require('fs'),path=require('path'); const {open}=require('../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#questions',mobile:true,W:390,H:844,dpr:1});try{
 const p=h.page;await p.waitForFunction(()=>typeof retainedQuestion754==='function'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});await p.waitForTimeout(1500);
 const result=await p.evaluate(()=>{
  const checks=[],check=(name,pass)=>checks.push({name,pass:!!pass}),original=JSON.stringify(S),hist=JSON.stringify(QHIST),contracts=JSON.stringify(ONHIRE_ROWS),before=moneySummary().charge.total;
  const q=questionsList(),get=id=>q.find(x=>x.id===id);
  check('All checks completed',!(q.fails||[]).length);
  check('Only supported FL01 question leaves active queue',q.filter(x=>x.st===QH_OPEN).length===16&&q.filter(x=>x.st===QH_LATER).length===8);
  check('Known FL01 fleet is an answered item with source',get('sp-nums').st===QH_DONE&&get('sp-nums').why.includes('50004')&&get('sp-nums').why.includes('9961976'));
  check('P36 allocation remains an open decision',get('sp-extra').st===QH_OPEN&&get('sp-extra').why.includes('do not by themselves prove two buildings'));
  check('P36 does not direct unsupported deletion',!get('sp-extra').need.includes('Take the wrong number off'));
  check('TX03 remains open while duplicate links remain',get('oi-TX03').st===QH_OPEN);
  check('Latest drawing issue remains open with the actual master revision',get('oi-R23').st===QH_OPEN&&get('oi-R23').why.includes('D001-26003-03')&&!get('oi-R23').why.includes('project 26003, Rev 02'));
  check('Temporary stack-down and reinstatement explained without changing progress',get('fe-gap').why.includes('24455')&&get('fe-gap').why.includes('24456')&&get('fe-gap').rows.some(x=>x.startsWith('Removal: 0 of 115')));
  check('Accommodation dates do not pretend to confirm stays',get('lb-nights-alfie-harris').why.includes('Elapsed dates do not confirm a stay'));
  check('Existing financial correction is unchanged',before===555929.94);
  const oldNums = locNums;
  try {
   const faultTarget = allAssets().find(a => a.key !== 'FL01' && (S.delivery[a.key] || {}).state === 'on site');
   window.locNums = a => { if (a.key === faultTarget.key) throw new Error('Practice unavailable number check'); return oldNums(a); };
   const incomplete = questionsList();
   check('A failed number check never creates a false answered item',incomplete.fails.includes('asset numbers') && !incomplete.some(x=>x.id==='sp-nums'&&x.confirmed754));
  } finally { window.locNums = oldNums; }

  const oldQuote=fenceQuote;
  try {
   S.answers=Object.assign({},S.answers,{'sp-short':'Everything has arrived','fe-quote':'Quote evidence supplied'});
   let current=questionsList();check('A note alone never closes a short delivery',current.find(x=>x.id==='sp-short').st===QH_OPEN);
   window.fenceQuote=()=>({ref:'PRACTICE'});
   current=questionsList();const saved=current.find(x=>x.id==='fe-quote');
   check('Disappeared dynamic check retains its saved note',saved&&saved.archived754&&saved.st===QH_DONE&&qAnswer(saved.id)==='Quote evidence supplied');
   check('Retained note is not presented as financial confirmation',saved.why.includes('does not establish a rate'));
   S.answers['old-imported-question']='Earlier note';current=questionsList();check('Unknown imported note remains accessible',current.some(x=>x.id==='old-imported-question'&&x.archived754));
  } finally {window.fenceQuote=oldQuote;S=JSON.parse(original);RENDER_MEMO.clear();}
  check('Records, original history and contracts are unchanged',JSON.stringify(S)===original&&JSON.stringify(QHIST)===hist&&JSON.stringify(ONHIRE_ROWS)===contracts);
  return{author:'Andrew Fisher',checks,counts:{open:q.filter(x=>x.st===QH_OPEN).length,pending:q.filter(x=>x.st===QH_LATER).length,answered:q.filter(x=>x.st===QH_DONE).length+questionHistory753().filter(x=>x[1]===QH_DONE).length}};
 });
 await p.evaluate(()=>{renderQuestions();window.scrollTo(0,0)});await p.waitForTimeout(1800);
 const out=process.env.OUT||path.join(__dirname,'evidence');await p.screenshot({path:path.join(out,'questions754_phone.png')});
 await p.evaluate(()=>{document.querySelector('[data-qfold="history"]').open=true});await p.locator('[data-question-id="sp-nums"]').scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.screenshot({path:path.join(out,'questions754_closed_fl01_phone.png')});
 result.checks.push({name:'No page errors',pass:!h.errors.length},{name:'No attempted writes',pass:!h.counts.blocked});
 fs.writeFileSync(path.join(out,'questions754_results.json'),JSON.stringify(result,null,2)+'\n');const failed=result.checks.filter(x=>!x.pass);console.log(JSON.stringify({checks:result.checks.length,failed,counts:result.counts}));if(failed.length)process.exitCode=1;
 }finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
