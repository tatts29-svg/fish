// Author: Andrew Fisher. Final-candidate Lighting semantics using fictional in-memory equipment.
// PAGE=<combined candidate> [MOB=1] node test_lighting894_verified.cjs
// Executes the candidate's native metrics, scope wrapper and exact drawer renderers in Chromium.
// This checks reader/HTML integration; real pointer, navigation and geometry checks remain in scene896/release_sweep.
const fs = require('fs');
const assert = require('node:assert/strict');
const {open} = require('../../toolchain/harness/open_page');
const pageSource = fs.readFileSync(process.env.PAGE, 'utf8');
function section(start, end) {
 const i = pageSource.indexOf(start), j = pageSource.indexOf(end, i + start.length);
 assert(i >= 0 && j > i, 'Missing exact candidate renderer: ' + start);
 return pageSource.slice(i,j);
}
const renderers = section('  function linkedRows(', '  function linkedSupplier(') + section('  function detailHtml(', '  function fenceScope848(');
assert(renderers.includes('scopeRows894'), 'Candidate must contain adopted Lighting drilldown correction');
(async () => {
 let session;
 try {
  const mobile = !!process.env.MOB;
  session = await open({pageFile:process.env.PAGE,W:mobile?390:+(process.env.W||1440),H:mobile?844:1000,mobile});
  const p=session.page;
  await p.waitForFunction(()=>window.Lighting894&&SYNC.status==='live'&&todayWorkHealth840().ready,null,{timeout:180000});
  const checks=await p.evaluate(renderers=>{
   const result=[],ok=(name,pass)=>result.push({name,pass:!!pass});
   const before=JSON.stringify(S);
   const original={allAssets,chargeLines,deliveryOf,deliveryAsOf,shortOf,assetNumbersOf,movedAway,heldMemo,dsnState,fenceInstallationWeeks847,allDockets,todayWorkHealth840};
   const health={ready:true,loading:false,stale:false,basis:'Synthetic Lighting fixture'};
   const make=()=>[
    {key:'T0002',quantity:5,ids:['FIX-A1','FIX-A2','FIX-A3','FIX-A4','FIX-A5'],done:true},
    {key:'LT05',quantity:1,ids:['FIX-S1'],done:false},
    {key:'LT06',quantity:1,ids:['FIX-S2'],done:false}
   ].map(a=>({name:'Fixture '+a.key,discipline:'Lighting towers',product:'Light Tower',item_types:['Light Tower'],onSite:true,...a}));
   let records=make();
   const escFixture=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   // Source text is copied exactly from this candidate; these lexical dependencies
   // supply presentation helpers and empty photograph/location readers, not completion logic.
   const drawer=new Function('area','mode','summary',`const workSummary={byId:{lighting:summary}},renderedDay='2026-10-08';
    const escape=${escFixture.toString()},format=v=>v==null?'—':String(v),number=v=>typeof v==='number'&&Number.isFinite(v),textOf=v=>String(v??''),percentage=v=>String(v);
    const planDate=()=> 'Fixture day',groupNotes=()=>'',linkedPhoto=()=>'',todayLinkedReferences844=()=>({rows:[],rowsByKey:{},issues:[]});
    ${renderers}\n return detailHtml(area,mode);`);
   function model(change=()=>{},day='2026-10-08') {
    records=make();change(records);
    const saved=JSON.stringify(records);
    const areas=todayWorkMetrics840(day),area=areas.find(a=>a.id==='lighting');
    const summary=todayWorkSummary848(day,areas,{}, {summaryRows:[]}).byId.lighting;
    const audit=Lighting894.audit(day,area);
    if(JSON.stringify(records)!==saved)throw new Error('Lighting mutated synthetic reader inputs');
    return {area,summary,audit};
   }
   function tie(m,done) {
    if(m.summary.done!==done||m.summary.total!==6||m.summary.left!==6-done||m.audit.credited!==done)return false;
    for(const [mode,want] of [['done',done],['total',6],['left',6-done]]) {
     const el=document.createElement('div');el.innerHTML=drawer(m.area,mode,m.summary);
     const rows=[...el.querySelectorAll('[data-tw844-quantity="'+mode+'"]')].map(n=>+n.textContent);
     rows.push(...[...el.querySelectorAll('.tw840-detail-row strong')].map(n=>+(n.textContent.match(/^\d+/)||['NaN'])[0]));
     if(rows.reduce((n,v)=>n+v,0)!==want||!el.querySelector('.tw840-dialog-top p').textContent.startsWith(want+' towers '))return false;
    }
    return true;
   }
   try {
    const scope=Lighting894.confirmation;
    ok('candidate carries confirmed six-tower scope at the two agreed locations',scope?.towers===6&&scope.groups.length===2&&scope.groups[0].scope===4&&scope.groups[0].records.includes('T0002')&&scope.groups[0].callouts.includes('LT01')&&scope.groups[1].scope===2&&scope.groups[1].records.includes('LT05')&&scope.groups[1].records.includes('LT06'));
    allAssets=()=>records;
    chargeLines=a=>[{item:'Light Tower',quantity:a.quantity}];
    deliveryOf=key=>{const a=records.find(r=>r.key===key);return {done:!!a?.done,recorded:!!a?.onSite,state:a?.onSite?'on site':'not on site'};};
    deliveryAsOf=(key,day)=>{const a=records.find(r=>r.key===key);return {...deliveryOf(key),done:!!a?.done&&(!a.completedOn||a.completedOn<=day)};};
    shortOf=a=>a.short?[{item:'Light Tower',q:5,g:3}]:[];
    assetNumbersOf=a=>a.ids||[];movedAway=()=>null;heldMemo=(_key,fn)=>fn();
    dsnState=()=>({rows:[]});fenceInstallationWeeks847=()=>[];allDockets=()=>[];todayWorkHealth840=()=>health;
    let m=model();
    ok('five completed at four-tower location credit four; headline and three breakdowns tie',m.area.done===5&&m.audit.recorded===7&&tie(m,4)&&m.summary.pct===66.67&&m.summary.pctKind==='confirmed');
    ok('total breakdown retains recorded quantity and one surplus',/5 recorded; 1 surplus/.test(drawer(m.area,'total',m.summary)));
    m=model(rs=>rs[0].done=false);
    ok('on-site status alone earns no completion',m.area.done===0&&tie(m,0));
    m=model(rs=>rs[0].short=true);
    ok('Complete plus short delivery receives zero credit and remains under review',m.area.done===0&&m.area.rows[0].recordedComplete&&!m.area.rows[0].complete&&tie(m,0)&&m.summary.pctKind==='lower-bound'&&m.summary.reviewRefs.includes('T0002'));
    ok('conflicted work stays in Left with visible review label',/Requiring review/.test(drawer(m.area,'left',m.summary))&&/≥/.test(drawer(m.area,'total',m.summary)));
    m=model(rs=>{rs[0].done=false;rs.push({...rs[1],key:'LT01',name:'Fixture promoted tower',ids:['FIX-NEW'],done:true});});
    const promoted=drawer(m.area,'done',m.summary);
    ok('independent promoted keyed callout credits its own location',tie(m,1)&&m.audit.groups[0].credited===1&&m.audit.groups[1].credited===0&&/data-tw844-reference="LT01"/.test(promoted)&&!/data-tw844-reference="T0002"/.test(promoted));
    m=model(rs=>rs.push({...rs[1],key:'LT01',ids:['FIX-A1'],done:true}));
    ok('promoted alias of aggregate unit counts only once',tie(m,4)&&m.audit.recorded===7&&!/data-tw844-reference="LT01"/.test(drawer(m.area,'total',m.summary)));
    m=model(rs=>{rs[0].short=true;rs.push({...rs[1],key:'LT01',ids:['FIX-A1'],done:true});});
    ok('alias cannot bypass its owning reference conflict',tie(m,0)&&m.summary.pctKind==='lower-bound');
    m=model(rs=>rs.push({...rs[1],key:'LT01',quantity:2,ids:['FIX-A1','FIX-NEW'],done:true}));
    ok('partially overlapping identifiers add no inferred completion',tie(m,4)&&m.summary.pctKind==='lower-bound');
    m=model(rs=>{rs[1].ids=['FIX-A1'];rs[1].done=true;});
    ok('one physical identity cannot fill two locations',tie(m,4)&&m.audit.groups[1].credited===0);
    m=model(rs=>rs[0].quantity=20);
    ok('surplus completion at one location cannot cover the other location',m.area.done===20&&tie(m,4));
    m=model(rs=>rs[0].quantity=null);
    ok('unknown quantity is not assumed to be one unit',m.area.rows[0].quantity===null&&tie(m,0)&&m.summary.pctKind==='lower-bound');
    m=model(rs=>rs[0].completedOn='2026-10-09');
    ok('completion respects selected day before its recorded completion',tie(m,0));
    m=model(rs=>rs[0]._cancelled=true);
    const missing=drawer(m.area,'total',m.summary),el=document.createElement('div');el.innerHTML=missing;
    ok('missing scope remains visible and linkless',tie(m,0)&&/map scope without allocated recorded towers/.test(missing)&&![...el.querySelectorAll('.tw840-detail-row')].some(n=>n.querySelector('button,a'))&&!/data-tw844-reference="T0002"/.test(missing));
    m=model(rs=>rs.push({...rs[1],key:'FIX-UNMAPPED',quantity:2,ids:['FIX-U1','FIX-U2'],done:true}));
    ok('unmapped complete equipment remains inspectable without invented scope credit',tie(m,4)&&/data-tw844-reference="FIX-UNMAPPED"/.test(drawer(m.area,'total',m.summary))&&m.summary.pctKind==='lower-bound');
    m=model(rs=>{rs[1].done=true;rs[2].done=true;});
    ok('100 percent requires completion in both locations',tie(m,6)&&m.summary.pct===100&&m.summary.pctKind==='confirmed');
   } finally {
    allAssets=original.allAssets;chargeLines=original.chargeLines;deliveryOf=original.deliveryOf;deliveryAsOf=original.deliveryAsOf;shortOf=original.shortOf;assetNumbersOf=original.assetNumbersOf;movedAway=original.movedAway;heldMemo=original.heldMemo;dsnState=original.dsnState;fenceInstallationWeeks847=original.fenceInstallationWeeks847;allDockets=original.allDockets;todayWorkHealth840=original.todayWorkHealth840;
    // Replace the wrapper's last-summary cache with the real restored reader result.
    todayWorkSummary848(todayWorkDay841());
   }
   ok('all replaced readers restored',Object.entries(original).every(([name,fn])=>eval(name)===fn));
   ok('shared record unchanged',JSON.stringify(S)===before);
   return result;
  },renderers);
  checks.push({name:'no browser runtime errors',pass:session.errors.length===0},{name:'no attempted writes',pass:session.counts.blocked===0});
  checks.forEach(c=>console.log(`${c.pass?'PASS':'FAIL'} ${c.name}`));
  console.log(`${mobile?'phone':'laptop'}: ${checks.filter(c=>c.pass).length}/${checks.length}`);
  if(checks.some(c=>!c.pass))process.exitCode=1;
 } finally {if(session)await session.browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
