// Author: Andrew Fisher. GET-only profile lookup and shared financial presentation checks.
const fs=require('fs'),assert=require('assert/strict'),{open}=require('../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844,dpr:1,hash:'#today'}),p=h.page;try{
 await p.waitForFunction(()=>window.AssetProfile1006&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
 const report=await p.evaluate(()=>{
  const checks=[],ok=(name,value,detail)=>{checks.push({name,ok:!!value,...(detail?{detail}: {})});if(!value)throw Error(name+' '+JSON.stringify(detail||''));},saved=JSON.stringify(S),start=performance.now();
  let matches=holdAssets(()=>finderMatches('0699'));const time=performance.now()-start;
  ok('current Event Portables number is found once',matches.filter(r=>r.key==='WC72'&&r.no==='0699'&&r.owner1006==='event-portables').length===1,matches.map(r=>[r.key,r.no,r.kind]));
  ok('number search points to specific current unit',matches[0].unitId1006&&matches[0].key==='WC72');
  FINDER.list=matches;finderPick(matches.findIndex(r=>r.owner1006==='event-portables'));ok('number search opens correct drawer',document.querySelector('#drawer [data-units925]')?.dataset.units925==='WC72');ok('matching unit is highlighted',!!document.querySelector('#drawer .profile1006-selected .item933-number')?.textContent.includes('0699'));
  const index=holdAssets(()=>finderIndex()),entries=index.filter(r=>r.unitId1006),ids=entries.map(r=>r.key+'|'+r.owner1006+'|'+AssetProfile1006.normal(r.no));ok('physical search suggestions do not duplicate source aliases',new Set(ids).size===ids.length);
  matches=holdAssets(()=>finderMatches('wc69'));const ref=matches.findIndex(r=>r.kind==='asset'&&r.key==='WC69');ok('lowercase reference search finds canonical reference',ref>=0);FINDER.list=matches;finderPick(ref);
  ok('reference opens same canonical asset panel',document.querySelector('#drawer [data-units925]')?.dataset.units925==='WC69');
  let a=assetOf('WC69'),rows=gcModel925(a,{loading:false}).rows.filter(r=>r.physical&&r.item==='FWF');ok('reference drawer shows all selected item identities once',document.querySelectorAll('#drawer [data-unit925-id]').length>=rows.length);
  const table=document.querySelector('[data-charges952="WC69"] [data-profile1006-item="FWF"] table');ok('group charges clearly name scope and quantity',!!table?.caption?.textContent.includes('WC69')&&table.caption.textContent.includes('12'),table?.caption?.textContent);ok('one charge panel only',document.querySelectorAll('[data-charges952="WC69"]').length===1);
  ok('arrival receipt is shown with actual date and quantity',document.querySelector('[data-profile1006-item="FWF"] .profile1006-facts')?.textContent.includes('Arrived'));
  const generator=generatorModel1004().rows.find(r=>r.actualIsConfirmed&&r.standdownDays>0&&r.ref&&r.forecast!=null);ok('known arrived generator available for profile check',!!generator);
  a=assetOf(generator.ref);openAsset(a.key);const detail=document.querySelector('[data-charges952] [data-profile1006-item]'),periods=[...document.querySelectorAll('[data-profile1006-period]')];
  ok('generator hire uses existing table for two period components',periods.length>=2, {ref:a.key,count:periods.length,html:detail?.innerHTML.slice(0,300)});
  ok('generator component values equal shared model',periods.some(r=>r.textContent.includes(money(generator.standdownCharge)))&&periods.some(r=>r.textContent.includes(money(generator.raceCharge))));
  ok('generator rows show rate day count and dates',periods.every(r=>r.textContent.includes('day'))&&periods[0].textContent.includes(fmtDay(generator.deliveredDate).dm));
  ok('generator old hire total row is removed',![...document.querySelectorAll('[data-profile1006-item] tr[data-item979]')].some(r=>r.firstElementChild.textContent.trim().startsWith('Hire')));
  ok('generator context shows off hire and correct Revenue branch',detail.textContent.includes('Off hire')&&detail.textContent.includes(generator.branch));
  ok('component checkboxes preserve included meaning',periods.every(r=>r.querySelector('input[type=checkbox]')?.checked));
  ok('generator status card uses identical commercial off-hire date',document.querySelector('#drawer [data-profile1006-offhire]')?.dataset.profile1006Offhire===generator.offhire);
  ok('old contradictory contract off-hire label is removed',!document.querySelector('#drawer .sum816 .dt816.out').textContent.includes('contract off-hire'));
  const demob=demobOf816(a.key),pickup=document.querySelector('#drawer [data-profile1006-pickup]');ok('physical demob source stays separate when evidenced',['confirmed','plan','contract'].includes(demob?.src)?pickup?.dataset.profile1006Pickup===demob.iso:!pickup);
  const current=generatorModel1004().rows.flatMap(r=>r.assetNumbers||[]),genEntries=entries.filter(r=>assetOf(r.key)?.discipline==='Generators');ok('unconfirmed generator source numbers are excluded',genEntries.every(r=>current.includes(r.no)||gcModel925(assetOf(r.key),{loading:false}).rows.some(u=>u.id===r.unitId1006&&u.metadata?.by&&u.metadata?.at)));
  ok('search and profile rendering never changes records',JSON.stringify(S)===saved);
  detail.open=true;detail.scrollIntoView({block:'start'});return {checks,indexMs:Math.round(time),generatorRef:generator.ref,unitsIndexed:entries.length};
 });
 await p.waitForFunction(()=>{const d=document.getElementById('drawer');return d.classList.contains('on')&&Number(getComputedStyle(d).opacity)===1;});
 await p.evaluate(()=>{const d=document.querySelector('#drawer [data-charges952] [data-profile1006-item]');d.open=true;d.scrollIntoView({block:'start'});});
 await p.screenshot({path:'/workspace/private-gc500-unit1006/profile-phone.png'});
 assert.equal(h.errors.length,0,h.errors.join('\n'));assert.equal(h.counts.blocked,0);
 const result={...report,errors:h.errors,requests:h.counts};fs.writeFileSync('/workspace/private-gc500-unit1006/profile-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
