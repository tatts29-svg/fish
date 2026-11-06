// Author: Andrew Fisher. Independent native VMS scope and Documents availability; all live writes blocked.
const fs=require('fs'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const mob=!!process.env.MOB,s=await open({pageFile:process.env.PAGE,W:mob?390:1440,H:mob?844:900,mobile:mob,dpr:mob?2:1}),p=s.page,R=[];const ok=(name,pass)=>R.push({name,pass:!!pass});await p.waitForFunction(()=>SYNC.status==='live'&&todayWorkHealth840().ready);await p.waitForTimeout(1000);
 const x=await p.evaluate(()=>{
  const day=todayIso(),snapshot=JSON.stringify(S),money=JSON.stringify([moneySummary(),fh866Model()]),areas=todayWorkMetrics840(day),groups=todayGroupDetails841(day,areas),fence=todayFencingSummary841(day),summary=todayWorkSummary842(day,areas,groups,fence),types=todayTypeMetrics843(day,groups,summary),a=areas.find(a=>a.id==='vms'),v=summary.byId.vms;
  const native=dsnState(day).rows.filter(r=>!r.a._cancelled&&!r.reloc&&!r.a.relocation&&!r.a.rest_of&&!movedAway(r.a.key)&&(r.a.product==='VMS'||r.a.discipline==='Variable message signs'));
  const keys=native.map(r=>r.a.key).sort(),got=a.rows.map(r=>r.key).sort(),total=native.reduce((n,r)=>n+(r.cls||[]).filter(l=>/\bvms\b|variable\s*message/i.test(l.item||'')).reduce((m,l)=>m+(qtyOf(l)||0),0),0);
  const done=native.reduce((n,r)=>n+(r.d.done&&!shortOf(r.a).length?(r.cls||[]).filter(l=>/\bvms\b|variable\s*message/i.test(l.item||'')).reduce((m,l)=>m+(qtyOf(l)||0),0):0),0);
  return {card:!!a,scope:JSON.stringify(keys)===JSON.stringify(got),total:a.total===total,done:a.done===done,left:v.left===total-done,pct:v.pct===Math.round(done/total*10000)/100,plan:!!v.plan,group:groups.vms.groups.length===1&&groups.vms.groups[0].name==='VMS boards',noDuplicate:!groups.equipment.groups.some(g=>g.name==='VMS boards'),coverage:groups.__coverage.allRepresented&&types.coverage.allRepresented,type:types.byCard.vms.length>0&&types.byCard.vms.every(t=>t.groupName==='VMS boards'),unchanged:JSON.stringify(S)===snapshot&&JSON.stringify([moneySummary(),fh866Model()])===money};
 });for(const[n,v]of Object.entries(x))ok(n,v);
 await p.evaluate(()=>go('today'));await p.waitForTimeout(500);ok('visible VMS card',await p.locator('[data-tw840-area="vms"]').count()===1);ok('VMS navigation',await p.locator('[data-tw840-jump="vms"]').count()===1);
 const card=p.locator('[data-tw840-area="vms"]');await card.scrollIntoViewIfNeeded();if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});await p.screenshot({path:process.env.OUT+'/vms-'+(mob?'phone':'desktop')+'.png'});}
 ok('no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await p.evaluate(()=>go('docs'));await p.waitForTimeout(1500);
 const docs=await p.evaluate(()=>docCollection().items.filter(d=>/load.restraint/i.test(d.title+' '+d.name)).map(d=>({name:d.name,kind:d.kind,available:docAvailability(d)})));
 ok('guide in Transport',docs.some(d=>d.name==='Coates_Load_Restraint_Guide_2023.pdf'&&d.kind==='transport'));
 ok('no runtime errors',s.errors.length===0);ok('no attempted live writes',s.counts.blocked===0);await s.browser.close();R.forEach(r=>console.log((r.pass?'PASS ':'FAIL ')+r.name));console.log((mob?'phone':'desktop')+': '+R.filter(r=>r.pass).length+'/'+R.length);if(R.some(r=>!r.pass))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
