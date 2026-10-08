// Author: Andrew Fisher. Fixed, in-memory programme examples plus recorded-day precedence.
// PAGE=<combined candidate> [MOB=1] node test_ep886_fixtures.cjs
// No source record is changed. Readers are replaced only within one synchronous evaluation
// and restored in finally, before the page can poll again. Real-page navigation is covered by release_sweep.
const {open} = require('../../toolchain/harness/open_page');
(async () => {
 let session;
 try {
  const mobile = !!process.env.MOB;
  session = await open({pageFile: process.env.PAGE, W: mobile ? 390 : +(process.env.W || 1440), H: mobile ? 844 : 1000, mobile});
  const p = session.page;
  await p.waitForFunction(() => window.EP886 || typeof EP886 === 'object', null, {timeout:180000});
  const checks = await p.evaluate(() => {
   const result = [], ok = (name, value) => result.push({name, pass:!!value});
   const before = JSON.stringify(S);
   const original = {allAssets, deliveryOf, rowOff, rowOffWords, unreferencedRows, movedAway};
   const corrections = (task_id, item, quantity, date, written, load) => ({task_id, item, quantity, quantity_display:String(quantity), movement:'place', date,
    date_as_written:written, date_correction:{plan886:true, load, load_date:date, as_written:written, stated_by:'Event Portables plan v10, 3 Oct', source:'Fixture programme'}});
   const plain = (task_id,item,quantity,date) => ({task_id,item,quantity,quantity_display:String(quantity),date,movement:'place'});
   const assets = [
    {key:'WC09',first_date:'2026-10-08',events:[plain('T0102','Toilet Block 6m',2,'2026-10-08'),corrections('T0101','FWF',4,'2026-10-09','2026-10-08',1),corrections('T0259','Pee Panel',6,'2026-10-09','2026-10-08',1)]},
    {key:'WC57',first_date:'2026-10-09',events:[corrections('FIX57','FWF',2,'2026-10-09','2026-10-12',1)]},
    {key:'WC67',first_date:'2026-10-01',events:[plain('T0081','FWF',2,'2026-10-01'),corrections('T0262','FWF',2,'2026-10-13','2026-10-12',2)]}
   ];
   const overrides = {};
   try {
    allAssets = () => assets;
    deliveryOf = key => ({date:null,out_date:null,done:false,recorded:false,state:'not on site',...(overrides[key] || {})});
    rowOff = key => key === 'T0089'; rowOffWords = () => 'Fixture cancellation';
    unreferencedRows = () => []; movedAway = () => null;
    const rows = key => programmeDays().flatMap(d => d.deliveries.filter(r => r.a.key === key).map(r => ({day:d.iso,ids:r.events.map(e=>e.task_id).sort().join(','),moved:r.moved_from,row:r})));
    let r = rows('WC09');
    ok('mixed reference keeps blocks on 8 Oct and FWF/pee panels on 9 Oct',r.length===2&&r[0].day==='2026-10-08'&&r[0].ids==='T0102'&&r[1].day==='2026-10-09'&&r[1].ids==='T0101,T0259');
    ok('only moved mixed-reference rows carry original 8 Oct',!r[0].moved&&r[1].moved==='2026-10-08');
    ok('card date helper respects each corrected row',r.every(x=>rowDay886(x.row.a,x.row.events,effectiveDates(x.row.a),true)===x.day));
    const hint = ep886DrawerLines(assets[0]), source = ep886Source(r[1].row.events);
    ok('mixed-reference drawer retains both item groups and their separate dates',/4 × FWF, 6 × Pee Panel/.test(hint)&&/Fri 09 Oct/.test(hint)&&/2 × Toilet Block 6m/.test(hint)&&/Thu 08 Oct/.test(hint));
    ok('corrected rows retain supplier source and load number',/Event Portables plan v10, 3 Oct/.test(source)&&/Load 1/.test(source)&&/Fri 09 Oct/.test(source));
    r = rows('WC57');
    ok('unoverridden WC57 moves from 12 Oct to plan day 9 Oct exactly once',r.length===1&&r[0].day==='2026-10-09'&&r[0].moved==='2026-10-12'&&effectiveDates(assets[1]).in_where==='schedule correction');
    r = rows('WC67');
    ok('unoverridden WC67 keeps first drop and moves only second drop',r.length===2&&r[0].day==='2026-10-01'&&r[0].ids==='T0081'&&r[1].day==='2026-10-13'&&r[1].ids==='T0262');
    const load = EP819.loads.find(l=>l.n===1), line = epRecLine819(load);
    ok('off-plan drop changes supplier load count to 23 FWF',/off the plan on the record/.test(line)&&/this load is 23 FWF/.test(line));
    overrides.WC57={date:'2026-10-13',date_by:'Fixture recorder',date_where:'local',date_at:'2026-10-08T00:00:00Z'};
    r=rows('WC57'); const eff=effectiveDates(assets[1]);
    ok('explicit recorded WC57 day wins over 9 Oct plan',r.length===1&&r[0].day==='2026-10-13'&&eff.in==='2026-10-13'&&eff.in_plan==='2026-10-09'&&eff.in_by==='Fixture recorder'&&eff.in_where==='local');
    ok('recorded override removes WC57 from former plan day without losing source',!rows('WC57').some(x=>x.day==='2026-10-09')&&/Load 1/.test(ep886Source(r[0].row.events)));
    overrides.WC67={date:'2026-10-14',date_by:'Fixture recorder',date_where:'local'};
    r=rows('WC67');
    ok('reference-level override moves both WC67 drops together once',r.length===1&&r[0].day==='2026-10-14'&&r[0].ids==='T0081,T0262');
    overrides.WC09={date:'2026-10-15',date_by:'Fixture recorder',date_where:'local'};
    r=rows('WC09');
    ok('explicit mixed-reference override wins for all three rows',r.length===1&&r[0].day==='2026-10-15'&&r[0].ids==='T0101,T0102,T0259'&&rowDay886(assets[0],r[0].row.events,effectiveDates(assets[0]),true)==='2026-10-15');
    ok('drawer does not contradict an explicit recorded day with stale split-day advice',ep886DrawerLines(assets[0])===''&&ep886InWhy(assets[0],effectiveDates(assets[0]))==='');
    delete overrides.WC57;
    ok('clearing in-memory override restores corrected programme day',rows('WC57').length===1&&rows('WC57')[0].day==='2026-10-09');
   } finally {
    allAssets=original.allAssets;deliveryOf=original.deliveryOf;rowOff=original.rowOff;rowOffWords=original.rowOffWords;unreferencedRows=original.unreferencedRows;movedAway=original.movedAway;
   }
   ok('all substituted readers restored',Object.entries(original).every(([name,fn])=>eval(name)===fn));
   ok('shared record unchanged',JSON.stringify(S)===before);
   return result;
  });
  checks.push({name:'no browser runtime errors',pass:session.errors.length===0},{name:'no attempted writes',pass:session.counts.blocked===0});
  checks.forEach(c=>console.log(`${c.pass?'PASS':'FAIL'} ${c.name}`));
  console.log(`${mobile?'phone':'laptop'}: ${checks.filter(c=>c.pass).length}/${checks.length}`);
  if(checks.some(c=>!c.pass))process.exitCode=1;
 } finally {if(session)await session.browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
