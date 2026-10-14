/* Author: Andrew Fisher. GET-only current VMS assignment and financial parity regression. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const {PAGE,BASE}=process.env,OUT=process.env.OUT||'/workspace/private-gc500-audit14Oct2026/vms/final';
if(!PAGE||!BASE)throw new Error('BASE and PAGE must identify the baseline and candidate HTML snapshots');
fs.mkdirSync(OUT,{recursive:true});
const checks=[],check=(name,pass)=>{checks.push({name,pass:!!pass});console.log(JSON.stringify({name,pass:!!pass}));};
const same=(a,b)=>{try{assert.deepStrictEqual(a,b);return true;}catch{return false;}};
async function capture(name,file){
 const h=await open({pageFile:file,mobile:true,W:390,H:844});
 try{
  await h.page.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:150000});
  await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:120000});
  const data=await h.page.evaluate(()=>({
   version:SYNC.backend.readVersion821(),
   refs:['T0001','T0103'].map(ref=>{const a=assetOf(ref);return {ref,model:gcModel925(a,{loading:false}),physical:gcUnits925(a,{loading:false}),inv:invCountNums(a),delivery:deliveryOf(ref),lines:chargeLines(a)};}),
   inventory:inventory().list.find(r=>r.item==='VMS'),finder:finderMatches('1211404'),
   finance:{pl:pl770Model(),money:moneySummary(),branch:branchFinancial978(pl752Rows(),moneySummary()),contract:contractFigures(ONHIRE_ROWS),labour:labourPlan()},
   record:JSON.parse(JSON.stringify(S)),
  }));
  fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(data,null,2)+'\n');
  if(name==='candidate'){
   await h.page.evaluate(()=>openAsset('T0001'));await h.page.waitForTimeout(300);
   await h.page.screenshot({path:path.join(OUT,'current-vms-source.png'),fullPage:false});
  }
  check(name+' has no runtime errors',!h.errors.length);
  check(name+' makes no operational write requests',h.counts.blocked===0);
  return data;
 }finally{await h.browser.close();}
}
(async()=>{
 try{
  const before=await capture('baseline',BASE),after=await capture('candidate',PAGE);
  check('Both snapshots read the same shared record version',before.version===after.version);
  check('Complete native shared records are unchanged',same(before.record,after.record));
  for(const key of Object.keys(before.finance))check(key+' financial model remains exactly equal',same(before.finance[key],after.finance[key]));
  const old=after.refs[0],dest=after.refs[1],history=old.model.rows.filter(r=>r.assetNo==='1211404');
  check('Original source has seven current physical units',old.physical.length===7&&old.model.rows.filter(r=>r.physical).length===7);
  check('Moved source identity remains nonphysical history',history.length===1&&!history[0].physical&&history[0].source==='history'&&history[0].movement1016.to==='T0103');
  check('Original source still has eight planned units',old.model.groups.find(g=>g.item==='VMS').quantity===8);
  check('Moved unit does not become a missing unidentified unit',old.model.groups.find(g=>g.item==='VMS').pending===0);
  check('Destination retains two physical units',dest.physical.length===2);
  check('Inventory counts nine unique current onsite VMS units',after.inventory.on===9&&after.inventory.coates===8&&after.inventory.nonum===0);
  check('Moved asset finder returns only its current destination',after.finder.length===1&&after.finder[0].key==='T0103'&&after.finder[0].no==='1211404');
  for(let i=0;i<before.refs.length;i++){
   const b=before.refs[i],a=after.refs[i];
   check(a.ref+' original delivery receipt and charge lines remain unchanged',same(b.delivery,a.delivery)&&same(b.lines,a.lines));
   check(a.ref+' other current unit identities remain unchanged',same(b.model.rows.filter(r=>!(i===0&&r.assetNo==='1211404')),a.model.rows.filter(r=>!(i===0&&r.assetNo==='1211404'))));
  }
 }catch(error){check('Regression runner completed',false);fs.writeFileSync(path.join(OUT,'error.txt'),String(error.stack||error));}
 const report={author:'Andrew Fisher',sha256:crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'),checks,result:{checks:checks.length,passed:checks.filter(c=>c.pass).length},limitations:'Live GET-only snapshots; no native writes. Historical replacement events cannot be reconstructed from current identity records. Full private snapshots include financial and operational records and must not be committed.'};
 fs.writeFileSync(path.join(OUT,'review.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({result:report.result,failed:checks.filter(c=>!c.pass)}));
 if(checks.some(c=>!c.pass))process.exitCode=1;
})();
