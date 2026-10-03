// Author: Andrew Fisher. Strict combined v7.54 financial checks; shared harness permits only live reads.
// PAGE=<combined build> CHROMIUM_PATH=/usr/bin/chromium node finance_combined755_tests.js
const fs=require('fs'),path=require('path');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
const out=process.env.OUT||__dirname;
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const results={author:'Andrew Fisher',checks:[],viewports:{}};
 for(const mode of [{name:'desktop',W:1440,H:1000},{name:'phone',mobile:true,W:390,H:844,dpr:2}]){
  const h=await open({pageFile:process.env.PAGE,hash:'#costs',...mode});
  const consoleErrors=[];h.page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,200));});
  try{
   await h.page.waitForFunction(()=>typeof pl754Cell==='function'&&typeof decorateQuestionEvidence754==='function'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:90000});
   await h.page.waitForTimeout(900);
   await h.page.evaluate(()=>go('costs'));
   await h.page.waitForFunction(()=>document.querySelector('#pl752')?.textContent.includes(money0(moneySummary().charge.total)),null,{timeout:15000});
   const inspected=await h.page.evaluate(()=>{
    const checks=[],ok=(name,value,details)=>checks.push({name,pass:!!value,...(!value?{details}: {})});
    const cents=n=>Math.round(n*100),equal=(a,b)=>cents(a)===cents(b),sum=L=>L.reduce((a,b)=>a+b,0);
    const stateBefore=JSON.stringify(S),contractsBefore=JSON.stringify(ONHIRE_ROWS),M=moneySummary(),B=pl752Rows(),RH=pl754Rehire(M);
    const card=document.querySelector('#pl752'),txt=card.innerText,rows=[...card.querySelectorAll('.pl-tbl tbody tr')];
    const branchTotal=sum(B.map(b=>b.total));
    const rawContractTotal=sum(ONHIRE_ROWS.map(r=>contractCharge(r).amount).filter(n=>typeof n==='number'));
    ok('Revenue is the corrected forecast $555,929.94',equal(M.charge.total,555929.94),M.charge.total);
    ok('Direct costs known remain $235,081.76',equal(M.cost.known,235081.76),M.cost.known);
    ok('Exact difference is $320,848.18, revenue less known costs',equal(M.difference,320848.18)&&equal(M.difference,M.charge.total-M.cost.known),M.difference);
    ok('Displayed whole-dollar difference reconciles printed totals',M.difference0===Math.round(M.charge.total)-Math.round(M.cost.known));
    ok('Branch totals equal contracts to the cent',equal(branchTotal,M.charge.contracts),{branchTotal,contracts:M.charge.contracts});
    ok('Contracts reconcile to the independent charged-line sum',equal(rawContractTotal,M.charge.contracts),{rawContractTotal,contracts:M.charge.contracts});
    ok('All four known branches are displayed',B.length===4&&['KINP','NVAC','MEAD','STPS'].every(x=>B.some(b=>b.code===x)),B.map(b=>b.code));
    for(const b of B){
     const source=ONHIRE_ROWS.filter(r=>(r.branch_code||'no branch')===b.code);
     const expected=sum(source.map(r=>contractCharge(r).amount).filter(n=>typeof n==='number'));
     ok(b.code+' total equals its charged source lines',equal(b.total,expected),{actual:b.total,expected});
     ok(b.code+' total excludes repeated Rehire information',equal(b.total,b.contract+b.card+b.transport),b);
     const tr=rows.find(r=>r.querySelector('td:first-child b')?.textContent===b.code);
     ok(b.code+' has a Rehire cell and correct total',tr&&!!tr.querySelector('.pl-sub')?.innerText.trim()&&tr.querySelector('td:last-child').innerText.trim()===money0(b.total));
    }
    const K=B.find(b=>b.code==='KINP'),N=B.find(b=>b.code==='NVAC');
    const toiletRows=ONHIRE_ROWS.filter(r=>r.family==='toilet'&&!r.subhired);
    const toiletCharge=sum(toiletRows.map(r=>contractCharge(r).amount).filter(n=>typeof n==='number'));
    ok('KINP Rehire annotation reconciles to existing toilet hire',K.rehireLines===toiletRows.length&&K.rehireUnits===sum(toiletRows.map(r=>Number(r.quantity)||0))&&equal(K.rehireCharge,toiletCharge),K);
    ok('KINP hire and separate servicing match the toilets Revenue stream',equal(K.rehireCharge+M.charge.servicing,M.streams.find(x=>x.key==='toilets').charge));
    const plant=ONHIRE_ROWS.filter(r=>r.subhired_machine&&!r.subhired&&r.branch_code==='NVAC');
    ok('NVAC Rehire plant annotation reconciles to existing plant hire',N.plantLines===plant.length&&equal(N.plantCharge,sum(plant.map(r=>contractCharge(r).amount).filter(n=>typeof n==='number'))),N);
    ok('Rehire supplier cost is separate from Revenue',equal(RH.cost,118575)&&equal(RH.cost,M.cost.rehire)&&RH.approved===true,RH);
    const kt=rows.find(r=>r.querySelector('td:first-child b')?.textContent==='KINP').querySelector('.pl-sub').innerText;
    ok('KINP cell explains servicing outside contracts and costs not added',/outside the branch contract total|on no contract line/.test(kt)&&/not added|shown for reference only/i.test(kt)&&kt.includes(money0(RH.cost)),kt);
    ok('Rehire column is explicitly a non-additive breakdown',/included.*rehire|rehire.*included|memorandum/i.test(card.querySelector('.pl-tbl thead').innerText));
    ok('Toilet stream does not assert ownership of every unit',/ownership|whose|supplier allocation|unit allocation/i.test(kt+' '+rows.find(r=>r.querySelector('td:first-child b')?.textContent==='KINP').querySelector('.pl-sub').title));
    ok('Direct-cost explanation uses the current actual/forecast labour model',txt.includes(labourNote753(M.as_at)));
    ok('Entered estimates are labelled separately from agreed contracts',/card \/ entered/i.test(txt));
    const revenueParts=M.charge.contracts+(M.charge.servicing||0)+(M.charge.fencing||0)+(M.charge.race.amount||0)+(M.charge.labour||0)+(M.charge.other||0);
    ok('Forecast Revenue components reconcile without adding supplier costs',equal(revenueParts,M.charge.total),{revenueParts,total:M.charge.total});
    ok('Eight management cost categories reconcile to known costs',M.categories.length===8&&equal(sum(M.categories.filter(c=>c.known).map(c=>c.amount)),M.cost.known),M.categories);
    ok('Statement prominently identifies forecast, not actual revenue',card.querySelector('h3').textContent==='Forecast P&L'&&/forecast/i.test(card.getAttribute('aria-label')));
    ok('Statement explains incomplete costs and avoids calling difference margin',txt.toLowerCase().includes('direct costs known')&&txt.toLowerCase().includes('not a margin yet')&&txt.toLowerCase().includes('not in it yet'));
    ok('Headline numbers agree with the underlying calculations',[M.charge.total,M.cost.known,M.difference0].every(n=>txt.includes(money0(n))));
    ok('Unpriced card lines remain visible rather than zero-rated',B.reduce((a,b)=>a+b.none,0)===2&&txt.includes('unknown, not nought'));
    ok('The detailed existing money card is still available',!!document.getElementById('moneyCard'));
    ok('Combined Questions evidence fix is present',questionsList().find(q=>q.id==='oi-R23')?.why.includes('D001-26003-03'));
    const target=ONHIRE_ROWS.find(r=>lr748For(r)?.from==='card');
    const savedRates=JSON.stringify(S.lineRates||{}),rateKey=lr748Key(target),oldBranch=B.find(b=>b.code===target.branch_code),oldCharge=contractCharge(target).amount;
    try {
     S.lineRates=S.lineRates||{};S.lineRates[rateKey]=123.45;
     const changed=pl752Rows().find(b=>b.code===target.branch_code),charge=contractCharge(target);
     ok('Entered rate stays in estimate bucket, not agreed contract Revenue',charge.filled==='typed'&&equal(changed.contract,oldBranch.contract)&&equal(changed.card,oldBranch.card-oldCharge+charge.amount)&&changed.cardLines===oldBranch.cardLines,{filled:charge.filled,changed,oldBranch});
     ok('Entered estimate still reconciles the branch without duplicating Rehire',equal(changed.total,changed.contract+changed.card+changed.transport));
    } finally {S.lineRates=JSON.parse(savedRates);RENDER_MEMO.clear();}
    ok('Financial display calls do not mutate records or source contracts',stateBefore===JSON.stringify(S)&&contractsBefore===JSON.stringify(ONHIRE_ROWS));
    ok('Page fits the viewport',document.documentElement.scrollWidth<=document.documentElement.clientWidth,{scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth});
    return {checks,summary:{revenue:M.charge.total,costs:M.cost.known,difference:M.difference,displayedDifference:M.difference0,contracts:M.charge.contracts,branchTotal,branches:B.map(b=>({branch:b.code,total:b.total,toiletRehire:b.rehireCharge,plantRehire:b.plantCharge,subLinesRevenue:b.rehire})),rehireCost:RH.cost}};
   });
   results.checks.push(...inspected.checks.map(c=>({...c,name:mode.name+': '+c.name})));
   await h.page.locator('#pl752').scrollIntoViewIfNeeded();
   await h.page.screenshot({path:path.join(out,'finance755_'+mode.name+'.png')});
   await h.page.locator('#pl752 .pl-wide').scrollIntoViewIfNeeded();
   await h.page.screenshot({path:path.join(out,'finance755_branch_'+mode.name+'.png')});
   results.checks.push({name:mode.name+': no page errors',pass:h.errors.length===0,details:h.errors},{name:mode.name+': no console errors',pass:consoleErrors.length===0,details:consoleErrors},{name:mode.name+': no attempted service writes',pass:h.counts.blocked===0,details:h.counts});
   results.viewports[mode.name]=inspected.summary;
  }finally{await h.browser.close();}
 }
 fs.writeFileSync(path.join(out,'finance_combined755_results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({checks:results.checks.length,failed:results.checks.filter(c=>!c.pass),financials:results.viewports},null,2));
 if(results.checks.some(c=>!c.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
