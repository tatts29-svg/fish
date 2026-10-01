// Author: Andrew Fisher.
// Read-only integration checks. Live records stay in browser memory; evidence contains booleans only.
// NODE_PATH=... CHROMIUM_PATH=... [MOB=1] node practice_tests.js <build.html> [local-output-directory]
const {open} = require('../../toolchain/harness/open_page.js');
const fs = require('fs');
const path = require('path');

(async () => {
 const build = path.resolve(process.argv[2]);
 const out = path.resolve(process.argv[3] || path.dirname(build));
 const mobile = process.env.MOB === '1';
 const suffix = mobile ? 'phone' : 'desktop';
 fs.mkdirSync(out, {recursive: true});
 const h = await open(mobile ? {pageFile:build,mobile:true,W:390,H:844,dpr:2} : {pageFile:build,W:1440,H:1000});
 const p = h.page, consoleErrors = [];
 p.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
 const checks = {};
 try {
  await p.waitForFunction(() => typeof acc762FmtMoney === 'function' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout:150000});
  await p.waitForTimeout(1800);
  await p.evaluate(() => { go('costs'); renderCosts(); });
  await p.waitForSelector('#acc761Title');
  checks.fullyHydrated = await p.evaluate(() => SYNC.first.size === Object.keys(SYNC_COLLS).length);
  checks.reviewVisible = await p.locator('#accruals761').isVisible();
  Object.assign(checks, await p.evaluate(() => {
   const root = document.querySelector('#accruals761'), text = root.innerText;
   const near = (a,b) => Math.abs(a-b) < 0.03;
   const before = JSON.stringify(moneySummary());
   const journalsBefore = JSON.stringify(S.finance745 || {});
   const X = acc761Model(acc761Month()), L = acc761Labour(), M = moneySummary();
   const rows = Array.from(root.querySelectorAll('.fin745-block')).find(e => e.querySelector('h3')?.textContent.startsWith('Direct cost review')).querySelectorAll('tbody tr');
   const allMonths = acc761Months().map(month => acc761Model(month));
   const people = L.people.filter(person => person.month === X.month);
   const peopleBlock = Array.from(root.querySelectorAll('.fin745-block')).find(e => e.querySelector('h3')?.textContent.startsWith('People, days and hours'));
   const personRows = peopleBlock.querySelectorAll('tbody tr');
   const currentWork = fin745Rows(todayIso());
   const result = {
    noBrokenValues: !/\b(?:NaN|undefined|Infinity)\b/.test(text),
    defaultIsPreviousCompleteMonth: acc761Month() === acc761DefaultMonth(),
    automaticAccrualAbsent: allMonths.every(month => month.costAccrue === null && month.costs.every(row => row.accrue === null)),
    unknownInvoicesStayUnknown: X.costs.every(row => row.invoiced === null),
    paidFencingDoesNotInventAmount: X.wip.length > 0 && X.wip.every(row => row.paidAmount === null),
    datedBillingSnapshotQualified: text.includes('This does not establish current unbilled Revenue'),
    noLedgerPostingPromiseVisible: text.includes('No ledger entries are posted'),
    monthlyCandidateValuesRendered: X.costs.length === rows.length && X.costs.every((row,i) => rows[i].querySelectorAll('td')[2].textContent.trim() === acc762FmtMoney(row.candidate)),
    unallocatedSourcesVisible: !(X.unallocatedRevenue.length + X.unallocatedCosts.length) || text.includes('Recorded work and costs needing month allocation'),
    workDateWarningVisible: !(X.unallocatedRevenue.length + X.unallocatedCosts.length) || text.includes('time a tick was entered is not a confirmed work date'),
    candidateSumExplained: near(X.costCandidateTotal, X.costs.reduce((sum,row) => sum + (row.candidate || 0),0)),
    wholePackageReconciles: near(L.packageTotal,L.per.total+(L.scope || 0)),
    labourOnlyExcludesSupportAndOtherCharges: near(L.labourOnlyTotal,L.groups.install.total+(L.scopePeople || 0)),
    eventPeopleAndSupportShownSeparately: text.includes('Event people') && text.includes('Event accommodation and travel'),
    chargedPerPieceTiesToPL: near(L.per.charged,M.charge.labour),
    workforcePaidHoursReconcile: near(L.all.hours,currentWork.reduce((sum,row)=>sum+(row.paid || 0),0)),
    workforceHoursClassified: near(L.all.hours,L.all.confirmedPaidHours+L.all.pendingPaidHours+L.all.forecastPaidHours),
    peopleDaysHoursVisible: people.length ? personRows.length === people.length && people.every((person,i) => {
     const cells = personRows[i].querySelectorAll('td');
     return cells[0].textContent.includes(person.person) && cells[1].textContent.trim() === String(person.dayCount) && cells[2].textContent.trim() === fin745Hours(person.grossHours) && cells[3].textContent.trim() === fin745Hours(person.hours);
    }) : peopleBlock.textContent.includes('No running-sheet entries'),
    peopleDaysUseDistinctDates: L.people.every(person => person.dayCount === new Set(person.dates).size),
    forecastAndUnconfirmedHoursLabelled: peopleBlock.textContent.includes('Awaiting confirmation') && peopleBlock.textContent.includes('Forecast') && peopleBlock.textContent.includes('not confirmed actuals'),
    unpricedHoursQualified: !L.all.unpriced || text.includes('Unpriced hours are excluded'),
    unknownForecastLinesQualified: !L.per.unpriced || text.includes('unpriced lines'),
    readOnlyFunctionsKeepFinancialTotals: before === JSON.stringify(moneySummary()),
    reviewDoesNotCreateJournal: journalsBefore === JSON.stringify(S.finance745 || {})
   };
   // A synthetic cost exposes the former candidate/incurred mix-up without publishing live figures.
   const originalModel = acc761Model;
   try {
    acc761Model = () => Object.assign({},X,{costs:[
     {stream:'Example priced cost',branch:'Example',candidate:137.29,incurred:null,invoiced:null,evidence:'Synthetic source',extra:{status:'review'}},
     {stream:'Example unpriced cost',branch:'Example',candidate:null,incurred:null,invoiced:null,evidence:'Cost needs confirmation',extra:{status:'pending'}}
    ]});
    const detached = document.createElement('div'); detached.innerHTML = acc761Html();
    const tableRows = [...detached.querySelectorAll('tbody tr')];
    const priced = tableRows.find(row=>row.cells[0].textContent==='Example priced cost');
    const unknown = tableRows.find(row=>row.cells[0].textContent==='Example unpriced cost');
    result.syntheticCandidateRendered = priced?.cells[2].textContent === acc762FmtMoney(137.29);
    result.syntheticUnknownNotRenderedAsZero = unknown?.cells[2].textContent === 'Not confirmed';
   } finally { acc761Model = originalModel; }
   return result;
  }));

  const months = await p.evaluate(() => ({all:acc761Months(),selected:acc761Month()}));
  const alternative = months.all.find(month => month !== months.selected);
  if (alternative) {
   await p.selectOption('#acc761Month',alternative);
   checks.monthSwitchRedraws = await p.evaluate(month => acc761Month() === month && document.querySelector('#accruals761 .fin745-eyebrow').textContent.includes(fin745MonthLabel(month).toUpperCase()), alternative);
   await p.selectOption('#acc761Month',months.selected);
   checks.monthSwitchBack = await p.evaluate(month => acc761Month() === month,months.selected);
  }

  await p.evaluate(() => {
   window.__reviewDownloads = [];
   window.__reviewClipboard = null;
   window.__originalReviewDownload = fin745Download;
   fin745Download = (name,text,type) => window.__reviewDownloads.push({name,text,type});
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(text){window.__reviewClipboard=text;return Promise.resolve();}}});
  });
  await p.locator('#accruals761 [data-a761="csv"]').click();
  await p.locator('#accruals761 [data-a761="copy"]').click();
  Object.assign(checks,await p.evaluate(() => {
   const file = window.__reviewDownloads[0], copy = window.__reviewClipboard, X=acc761Model(acc761Month()), L=acc761Labour();
   const expectedCsv = '\uFEFF'+acc761Csv(X), expectedCopy=acc761Text(X);
   fin745Download=window.__originalReviewDownload;
   return {
    csvDownloadCaptured: window.__reviewDownloads.length===1 && file.name===('GC500_Finance_review_'+X.month+'.csv') && file.type.startsWith('text/csv'),
    csvMatchesSelectedReview: file.text===expectedCsv,
    csvCostCandidateValuesPresent: X.costs.every(row=>file.text.includes(fin745CsvCell(row.stream)) && file.text.includes(fin745CsvCell(row.candidate==null?'':row.candidate))),
    csvContainsPeopleDaysAndStatus: file.text.includes('Days entered') && file.text.includes('Confirmed paid hours') && file.text.includes('Awaiting confirmation paid hours') && file.text.includes('Forecast paid hours'),
    csvContainsEveryPersonMonth: L.people.every(person=>file.text.includes(fin745CsvCell(person.person)) && file.text.includes(person.month)),
    csvNoAutomaticAccrual: file.text.includes('No automatic accrual') || file.text.includes('no automatic accrual'),
    clipboardCaptured: typeof copy==='string' && copy===expectedCopy,
    clipboardIncludesReviewAndLabourBasis: copy.includes('Accrual to post: not confirmed') && copy.includes('Labour-only forecast:') && copy.includes('PEOPLE, DAYS AND HOURS'),
    clipboardContainsSelectedPeople: L.people.filter(person=>person.month===X.month).every(person=>copy.includes(person.person)),
    exportsHaveNoBrokenValues: !/\b(?:NaN|undefined|Infinity)\b/.test(file.text+'\n'+copy)
   };
  }));

  checks.noPageHorizontalOverflow = await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth+1);
  await p.locator('#accruals761').scrollIntoViewIfNeeded();
  await p.locator('#acc761Title').scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(out,'review_'+suffix+'_top.png')});
  await p.locator('#accruals761 h3').filter({hasText:'People, days and hours'}).scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(out,'review_'+suffix+'_people.png')});
  await p.locator('#accruals761 h3').filter({hasText:'Customer charge forecast'}).scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(out,'review_'+suffix+'_forecast.png')});
  checks.noRecordWriteAttempted = h.counts.blocked===0;
  checks.noBrowserErrors = h.errors.length===0;
  checks.noConsoleErrors = consoleErrors.length===0;
  const result={author:'Andrew Fisher',mobile,checks,passed:Object.values(checks).every(value=>value===true)};
  fs.writeFileSync(path.join(out,'practice762_'+suffix+'.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
  if(!result.passed) process.exitCode=1;
 } finally { await h.browser.close(); }
})().catch(error=>{ console.error('Review integration test failed:',error.name, String(error.message).slice(0,180)); process.exit(1); });
