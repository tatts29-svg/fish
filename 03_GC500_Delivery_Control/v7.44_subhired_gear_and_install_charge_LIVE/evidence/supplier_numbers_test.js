// Author: Andrew Fisher. Supplier-number display regression; no live writes.
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
(async () => {
 const mobile = process.env.MOB === '1';
 const s = await open({pageFile:process.env.PAGE, mobile, W:mobile ? 390 : 1440, H:mobile ? 844 : 1000});
 const cons = [];
 s.page.on('console', m => { if (m.type() === 'error') cons.push(m.text()); });
 try {
  const p = s.page;
  await p.waitForFunction(() => typeof subOf === 'function' && SYNC.status === 'live', null, {timeout:180000});
  const results = await p.evaluate(() => {
   const checks = [], add = (name, pass) => checks.push({name, pass:!!pass});
   const text = h => { const t = document.createElement('div'); t.innerHTML = h; return t.textContent; };
   const before = JSON.stringify(S);
   const money = () => JSON.stringify(allAssets().map(a => ({key:a.key, numbers:a.asset_numbers, total:assetTotal(a), units:chargeLines(a).map(l=>labourUnits(a,l.item))})));
   const moneyBefore = money();
   const refs = allAssets().filter(a => subOf(a.key).some(x => x.no));
   const live = refs.map(a => ({key:a.key, numbers:subOf(a.key).filter(x=>x.no).map(x=>String(x.no))}));
   add('live record includes the reported supplier locations', ['WC31','WC41','WC42','WC43','WC81'].every(k=>live.some(x=>x.key===k)));
   for (const a of refs) {
    const subs = subOf(a.key).filter(x=>x.no), first = String(subs[0].no), co = subs[0].co;
    const shared = text(assetNosLine(a));
    add(a.key+' shared number line includes all supplier numbers and ownership', subs.every(x=>shared.includes(String(x.no))) && shared.includes(co) && !/no asset no\./i.test(shared));
    for (const [label, html] of [['driver card',driverCard(a)],['equipment card',equipmentCard(a)],['load brief',loadBrief(a)]]) {
     if (!html) continue;
     const t = text(html);
     add(a.key+' '+label+' recognises supplier numbers', t.includes(first) && t.includes(co) && !/No asset number|Asset number missing/i.test(t));
    }
    const share = dropText(a);
    add(a.key+' shared driver message includes supplier numbers', subs.every(x=>share.includes(String(x.no))) && share.includes(co) && !/subhired, no asset number/i.test(share));
    const printed = text(dropPage(a,a.events||[],1,1,{iso:'2026-09-30'},'deliveries'));
    add(a.key+' printed drop sheet includes all supplier numbers', subs.every(x=>printed.includes(String(x.no))) && printed.includes(co));
    const email = text(dropEmailHtml(a,null,{}));
    add(a.key+' driver email rendering includes supplier numbers without sending', subs.every(x=>email.includes(String(x.no))) && email.includes(co));
    const plant = text(plantTable(a.discipline,[a]));
    add(a.key+' plant register includes supplier numbers', subs.every(x=>plant.includes(String(x.no))) && plant.includes(co));
    if (subhireOf(a.key) && contractOf(a.key).id) {
     const id = String(contractOf(a.key).id);
     add(a.key+' wholly sub-hired driver card has no Coates rental ID', !text(driverCard(a)).includes(id));
     add(a.key+' wholly sub-hired plant register has no Coates rental ID', !plant.includes(id));
    }
    const recordLine = text(assetNosOf(a,{bare:true}));
    add(a.key+' reference-labelled number line includes supplier numbers', subs.every(x=>recordLine.includes(String(x.no))) && recordLine.includes(co));
    const change = text(chRowHtml({a},'in',true));
    add(a.key+' Change deliveries row includes supplier numbers', subs.every(x=>change.includes(String(x.no))) && !/Asset no\.\s*none yet/i.test(change));
    const found = finderIndex().find(x=>x.kind==='asset' && x.key===a.key);
    const finder = text(finderRow(found,0));
    add(a.key+' search result recognises supplier numbers', finder.includes(first) && finder.includes(co) && !/no asset no\./i.test(finder));
    add(a.key+' unit list preserves short supplier IDs as numbers', !/item code/i.test(text(unitBlock(a))) && subs.every(x=>text(unitBlock(a)).includes(String(x.no))));
    openAsset(a.key);
    const drawer = document.querySelector('#drawer').textContent;
    add(a.key+' drawer has no false missing-number message', !/No asset number on this one yet/i.test(drawer) && subs.every(x=>drawer.includes(String(x.no))));
    CHG.key = a.key;
    add(a.key+' edit form has no false missing-number message', !/No asset number on this one yet/i.test(text(chFormHtml(true))));
   }
   add('sub-hire register continues to show all existing numbers', live.every(x=>x.numbers.every(n=>text(subRegHtml(true)).includes(n))));
   add('display rendering leaves financial values and Coates numbers unchanged', money()===moneyBefore);
   add('display rendering leaves the shared record untouched', JSON.stringify(S)===before);
   // Isolated display fixtures. No write functions, save, stamps or sync calls.
   const original = S, testKey = 'DISPLAY744', prior = CROW.get(testKey);
   try {
    S = JSON.parse(before); S.units = S.units || {}; S.deleted = S.deleted || {}; S.subhire = S.subhire || {};
    const a = {...assetOf('WC31'), key:testKey, asset_numbers:[], _unitsNotContents:undefined};
    S.units[testKey] = {units:[{label:'Sub-hire: Example Supplier',asset_no:'0007'},{label:'Sub-hire: Second Supplier',asset_no:'A-2'}]};
    let line = text(assetNosLine(a));
    add('unmarked supplier units retain leading zeros and both owners', line.includes('0007') && line.includes('A-2') && line.includes('Example Supplier') && line.includes('Second Supplier'));
    a.asset_numbers = ['1234567'];
    line = text(assetNosLine(a));
    add('mixed location shows Coates and supplier numbers separately', line.includes('1234567') && line.includes('0007') && line.includes('Coates') && line.includes('Example Supplier'));
    a.asset_numbers = [];
    S.units[testKey].units = [{label:'Sub-hire: Example Supplier',asset_no:''}];
    line = text(assetNosLine(a));
    add('unknown supplier number is not invented', /number.*(not recorded|missing|needed|yet)|no.*number/i.test(line) && !line.includes('0007'));
    S.units[testKey].units.push({label:'Sub-hire: Example Supplier · unit 2',asset_no:'0007'});
    line = text(assetNosLine(a));
    add('partial supplier numbers show the known number and remaining gap', line.includes('0007') && /number.*(not recorded|missing|needed|yet)|no.*number|awaiting a number/i.test(line));
    S.units[testKey].units = [{label:'Sub-hire: <img src=x onerror=alert(1)>',asset_no:'S-1'}];
    const html = assetNosLine(a);
    add('supplier text is escaped in display HTML', html.includes('&lt;img') && !html.includes('<img'));
    delete S.units[testKey];
    CROW.set(testKey,{units:[{label:'Sub-hire: Example Supplier',asset_no:'GONE744'}]});
    add('committed supplier number is displayed before removal', text(assetNosLine(a)).includes('GONE744'));
    S.deleted['unit/'+testKey+'/GONE744'] = '2026-09-30T00:00:00.000Z';
    add('removed supplier number stays out of display', !text(assetNosLine(a)).includes('GONE744'));
    const plain = {...a,key:'EMPTY744'};
    add('genuinely missing numbers retain an honest missing state', /no asset|not recorded|none yet/i.test(text(assetNosLine(plain))));
    const un = allAssets().find(x=>unnumbered(x));
    add('quantity-only equipment remains not numbered', un && /not numbered|quantity/i.test(text(driverCard(un))) && !/No asset number on this one yet/i.test(text(driverCard(un))));
   } finally { S = original; if (prior) CROW.set(testKey,prior); else CROW.delete(testKey); }
   add('isolated fixtures restore the record exactly', JSON.stringify(S)===before);
   openAsset('WC41');
   return {checks, live, readonly:SYNC.readonly};
  });
  await p.waitForTimeout(700);
  const fit = await p.evaluate(() => {
   const d=document.querySelector('#drawer'), r=d.getBoundingClientRect();
   const db=d.querySelector('.db'); if(db)db.scrollTop=0; d.scrollTop=0;
   return d.scrollWidth<=d.clientWidth+1 && r.left>=-1 && r.right<=innerWidth+1;
  });
  results.checks.push({name:'drawer fits viewport',pass:fit},{name:'view link stays read-only',pass:results.readonly},{name:'no page or console errors',pass:s.errors.length===0&&cons.length===0},{name:'no attempted live-record writes',pass:s.counts.blocked===0});
  await p.screenshot({path:path.join(__dirname,mobile?'supplier_numbers_phone.png':'supplier_numbers_desktop.png'),animations:'disabled'});
  await p.evaluate(() => { const card=document.querySelector('#drawer .dcard'); for(let e=card;e;e=e.parentElement)if(e.tagName==='DETAILS')e.open=true; });
  await p.locator('#drawer .dcpills').scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(__dirname,mobile?'supplier_numbers_driver_phone.png':'supplier_numbers_driver_desktop.png'),animations:'disabled'});
  const output={author:'Andrew Fisher',mobile,build_sha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),...results,passed:results.checks.filter(x=>x.pass).length,total:results.checks.length,pageErrors:s.errors,consoleErrors:cons,blockedWrites:s.counts.blocked};
  if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify(output));
  if(output.passed!==output.total)process.exitCode=1;
 } finally {await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
