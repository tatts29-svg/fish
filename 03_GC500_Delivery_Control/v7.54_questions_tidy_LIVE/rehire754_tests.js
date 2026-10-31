// Author: Andrew Fisher. GET-only live-record tests of the source projection; practice stays in memory.
const fs=require('fs'),path=require('path');const {open}=require(path.resolve(__dirname,'../toolchain/harness/open_page'));
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#questions'});try{
 await h.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:90000});await h.page.waitForTimeout(800);
 const result=await h.page.evaluate(()=>{
 const checks=[],ok=(name,pass,detail)=>checks.push({name,pass:!!pass,...(pass?{}:{detail})});
 const original=JSON.stringify(S),row=ONHIRE_ROWS.find(r=>String(r.rental_contract)==='9961976'&&Number(r.line)===31),raw=JSON.stringify(row);
 const a=assetOf('FL01'), source=sourceRehire754('FL01'),beforeRevenue=moneySummary(todayIso());
 ok('FL01 uses the documented supplier fleet50004',source&&source.no==='50004'&&source.co==='Supplier not named');
 ok('Raw MISCITEM and PO are not treated as the fleet number',row.asset_no==='MISCITEM'&&source.no!=='4647983');
 ok('FL01 number is visible in shared asset display',displayNumbersText744(a).includes('50004')&&displayNumbersText744(a).includes('Supplier not named'));
 ok('FL01 number is counted in the Questions number check',locNums(a).n===1&&locNums(a).q===1);
 ok('FL01 is removed from missing-number rows',!(questionsList().find(q=>q.id==='sp-nums'&&q.st!==QH_DONE)||{rows:[]}).rows.some(r=>/^FL01\b/.test(r)));
 openAsset('FL01');
 ok('Drawer shows fleet number and its explicit source',document.querySelector('[data-rehire-source754]')?.textContent.includes('50004')&&document.querySelector('[data-rehire-source754]')?.textContent.includes('PHILLIP PARK'));
 ok('Supplier number is not inserted in the Coates number projection',invCoatesNums(a).length===0&&a.asset_numbers.length===0);
 const sourceRow=(S.added||[]).find(a=>a.key==='FL01');
 try{
  sourceRow.source_row='T9999';ok('Wrong adopted source row disables fallback',sourceRehire754('FL01')===null);sourceRow.source_row='T0003';
  row.location='PHILLIP PARK PO 4647983';ok('PO-only note cannot produce an asset number',sourceRehire754('FL01')===null);row.location=JSON.parse(raw).location;
  row.subhired_machine=false;ok('Unconfirmed Rehire status cannot create supplier identity',sourceRehire754('FL01')===null);row.subhired_machine=true;
  S.assetNumbers.FL01=['54321'];ok('Typed site allocation supersedes source fallback',sourceRehire754('FL01')===null);delete S.assetNumbers.FL01;
  S.units.FL01={units:[{label:'Sub-hire: Recorded supplier',asset_no:'AB12'}]};ok('A recorded supplier unit supersedes source fallback',sourceRehire754('FL01')===null&&displayNumbersText744(assetOf('FL01')).includes('AB12'));delete S.units.FL01;
  S.deleted['num/FL01/50004']='2026-10-01T00:00:00.000Z';ok('A removed fleet number is not reintroduced',sourceRehire754('FL01')===null);delete S.deleted['num/FL01/50004'];
 } finally {S=JSON.parse(original);Object.keys(row).forEach(k=>delete row[k]);Object.assign(row,JSON.parse(raw));RENDER_MEMO.clear();}
 ok('Shared record is unchanged after review and practice',JSON.stringify(S)===original);
 ok('Raw contract is unchanged after review and practice',JSON.stringify(row)===raw);
 ok('Revenue is unchanged by the asset display fix',Number.isFinite(beforeRevenue.charge.total)&&moneySummary(todayIso()).charge.total===beforeRevenue.charge.total,{before:beforeRevenue.charge.total,after:moneySummary(todayIso()).charge.total});
 const numberedNow=allAssets().filter(a=>a.key!=='FL01').map(a=>[a.key,locNums(a)]);const sourceFn=sourceRehire754;sourceRehire754=()=>null;const withoutSource=allAssets().filter(a=>a.key!=='FL01').map(a=>[a.key,locNums(a)]);sourceRehire754=sourceFn;ok('Every other live reference keeps its numbering result',JSON.stringify(numberedNow)===JSON.stringify(withoutSource));
 const loads=((((DATA.transport||{}).carrier)||{}).loads||[]).map(l=>({id:loadId(l),load:l,record:loadOf(l)}));
 return {checks,evidence:{loads,FL01:source,P53:{asset:assetOf('P53'),delivery:S.delivery.P53,units:unitsOf('P53')},revision:{georef:DATA.georef,master:'D001-26003-03',sourceTaken:DATA.sources_taken}}};
 });
 result.checks.push({name:'No page errors',pass:h.errors.length===0,details:h.errors},{name:'No attempted service writes',pass:h.counts.blocked===0,details:h.counts});
 const out=process.env.OUT||path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'rehire754_results.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({checks:result.checks.length,failed:result.checks.filter(c=>!c.pass)},null,2));if(result.checks.some(c=>!c.pass))process.exitCode=1;
 }finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
