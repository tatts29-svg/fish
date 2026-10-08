// Author: Andrew Fisher. v8.86 Event Portables load days: every plan reference on its load day (or the day recorded on the shared
// record), the one day list Today and the Timeline both count from, WC34's recorded day, T0089 left off, the WC09 toilet blocks on
// their own day, the cards, the drawer, the drop sheet, the supplier card and run sheet, the installer text, redraws; no live writes.
// WC57 and WC67 are read on the day the shared record has for them at the run (the record wins over the plan for the whole
// reference, the rule since v8.2x), or on the plan's load day when the record has none; the expectations follow that rule.
// MOB=1 runs the phone; W sets the desktop width (default 1440); OUT=<dir> saves screenshots.
const fs=require('fs'),{open}=require('../../toolchain/harness/open_page');
(async()=>{let s;try{const mob=!!process.env.MOB,W=mob?390:Number(process.env.W||1440),H=mob?844:Number(process.env.H||900);s=await open({pageFile:process.env.PAGE,W,H,mobile:mob,dpr:mob?2:1});const p=s.page,R=[];const ok=(n,v)=>R.push({name:n,pass:!!v});
await p.waitForFunction(()=>typeof EP886==='object'&&typeof EP819==='object'&&SYNC.status==='live'&&todayWorkHealth840().ready,null,{timeout:180000});
await p.evaluate(()=>go('timeline'));await p.waitForTimeout(800);
const DAYS=['2026-10-09','2026-10-13','2026-10-15','2026-10-19'];
const m=await p.evaluate(DAYS=>{
 const days=programmeDays(),byIso=new Map(days.map(d=>[d.iso,d]));
 const inDays=k=>days.filter(d=>d.deliveries.some(r=>r.a.key===k)).map(d=>d.iso);
 const rec=k=>deliveryOf(k).date||null;
 const drops=[];EP819.loads.forEach(l=>l.stops.forEach(st=>st.drops.forEach(x=>{if(x.ref)drops.push({ref:x.ref,load:l.n,date:l.date});})));
 const refs=drops.map(x=>{const expected=rec(x.ref)||x.date,on=inDays(x.ref);return {ref:x.ref,load:x.load,plan:x.date,recorded:rec(x.ref),expected,on,ok:on.includes(expected)};});
 /* a row the plan moved is not left on the day the schedule had written, unless an unmoved row of the same reference is still there */
 const stale=[];allAssets().forEach(a=>{const evs=(a.events||[]).filter(e=>e&&e.movement!=='remove'&&e.date),moved=evs.filter(e=>e.date_correction&&e.date_correction.plan886);if(!moved.length)return;
  const stay=new Set(evs.filter(e=>!(e.date_correction&&e.date_correction.plan886)).map(e=>e.date));
  moved.forEach(e=>{const old=e.date_as_written;if(stay.has(old)||rec(a.key)===old)return;if((byIso.get(old)||{deliveries:[]}).deliveries.some(r=>r.a.key===a.key))stale.push(a.key+'@'+old);});});
 const row=(iso,k)=>((byIso.get(iso)||{deliveries:[]}).deliveries.find(r=>r.a.key===k))||null,ev=r=>r?r.events.map(e=>e.task_id).sort():[];
 /* the day WC57 and WC67 sit on today: the record's day where it has one, else the plan's load day; the chip reads the day the
  row moved from — the schedule's day as written (Mon 12 Oct), or the plan's day where the record was written as 12 Oct */
 const rec57=rec('WC57'),day57=rec57||'2026-10-09',from57=['2026-10-12','2026-10-09'].find(x=>x!==day57),rec67=rec('WC67'),day67=rec67||'2026-10-13';
 const wc09_8=row('2026-10-08','WC09'),wc09_9=row('2026-10-09','WC09'),r57=row(day57,'WC57'),r34=row('2026-10-09','WC34'),r67=row(day67,'WC67');
 const counts={};DAYS.forEach(iso=>{const d=byIso.get(iso);counts[iso]={in:d?d.deliveries.length:0,out:d?d.removals.length:0,refs:d?d.deliveries.map(r=>r.a.key).sort():[],unref:d?d.unref.map(r=>r.task_id):[]};});
 const unref22=((byIso.get('2026-10-22')||{unref:[]}).unref).map(r=>r.task_id),off6=offRowsOn('2026-10-06').map(r=>r.task_id);
 const recLines=EP819.loads.map(l=>epRecLine819(l)),card=ep819Html(),sheet1=epRunSheet819(EP819.loads[0]);
 const mv=iso=>movedOffDay(iso),mv12=mv('2026-10-12');
 const A=k=>allAssets().find(a=>a.key===k),eff57=effectiveDates(A('WC57')),eff09=effectiveDates(A('WC09')),eff34=effectiveDates(A('WC34'));
 const ins67=((A('WC67')||{}).events||[]).filter(e=>e&&e.movement!=='remove'&&e.date).map(e=>e.task_id).sort();
 const d57=byIso.get(day57),g57=d57?dpLoads(d57).find(g=>g.kind==='deliveries'&&g.rows.some(r=>r.a.key==='WC57')):null,drop57=g57?dpPage(d57,g57,'drv',0,1):'';
 const dropsOn=iso=>{const d=byIso.get(iso);return d?dpLoads(d).filter(g=>g.kind==='deliveries').flatMap(g=>g.rows.map(r=>r.a.key)):[];},drops12=dropsOn('2026-10-12'),drops9=dropsOn('2026-10-09');
 /* the four load days' lists: each reference on its load day, or on the day the record has for it (and then not on the load day) */
 const LISTS={'2026-10-09':['WC09','WC34','WC38','WC39','WC40','WC57','WC61'],'2026-10-13':['WC29','WC67','WC68','WC69','WC70','WC72'],'2026-10-15':['WC46','WC48','WC49','WC51','WC53','WC54','WC55'],'2026-10-19':['WC65','WC10','WC28','WC30','WC35','PG01','PG03','PG05','PG29','WC85','WC19','WC73','WC13','WC23','WC24','WC25','WC26','WC45','WC47','WC62']};
 const lists={};Object.keys(LISTS).forEach(iso=>{lists[iso]=LISTS[iso].map(k=>{const r=rec(k),on=inDays(k);return {k,rec:r,on,ok:on.includes(r||iso)&&(!r||r===iso||!on.includes(iso))};});});
 /* the supplier card's record lines: one where the record's day for a drop differs from its load's day, naming the day and the drop */
 const disagree=refs.filter(x=>x.recorded&&x.recorded!==x.plan).map(x=>({ref:x.ref,load:x.load,plan:x.plan,recorded:x.recorded}));
 const daily8=JSON.stringify(daily821Model('2026-10-08')),daily9=JSON.stringify(daily821Model('2026-10-09'));
 const td=todayIso(),pod=days.find(d=>d.iso>=td&&d.deliveries.length)||days.find(d=>d.iso===td)||days.find(d=>d.iso>td)||null,f=todayFigures();
 const ms=dsnMilestones().find(x=>x.iso>=td)||null,msDay=ms?byIso.get(ms.iso):null,pw=progress881Model(todayWorkDay841());
 const html=(r,isIn)=>r?dayCard(r.a,r.events,r.moved_from,isIn):'';
 const val=(h,sel,attr)=>{const el=document.createElement('div');el.innerHTML=h;const n=el.querySelector(sel);return n?(attr?(n.getAttribute(attr)||''):n.textContent):null;};
 const c=(r,pre)=>{const h=html(r,true);return {[pre+'date']:val(h,'.dctime input[type=date]','value'),[pre+'qty']:val(h,'.dcqty .dcbig'),[pre+'src']:val(h,'.ep886-src'),[pre+'chip']:val(h,'.dctime .chip.act'),[pre+'title']:val(h,'.dctime .chip.act','title')};};
 const snap=()=>JSON.stringify(programmeDays().map(d=>[d.iso,d.deliveries.map(r=>[r.a.key,r.moved_from,r.events.map(e=>e.task_id)])]));
 const loadLines=EP819.loads.map((l,i)=>{const mine=disagree.filter(x=>x.load===l.n),line=recLines[i]||'';return {n:l.n,line,refs:mine.map(x=>x.ref),named:mine.every(x=>new RegExp('Record (still )?shows [^–]*?'+epDay819(x.recorded,false)+' for [^–;]*\\b'+x.ref+'\\b').test(line))};});
 return {refs,stale,counts,unref22,off6,rowOffT0089:rowOff('T0089'),recLines,disagree,loadLines,lists,
  cardNote:/off the plan on the record/.test(card)&&/this load is 23 FWF/.test(card),sheetNote:/this load is 23 FWF/.test(sheet1),cardNoRecordLines:!/Record still shows|Record shows/.test(card),
  wc09:{ev8:ev(wc09_8),ev9:ev(wc09_9),moved9:wc09_9&&wc09_9.moved_from,moved8:wc09_8&&wc09_8.moved_from,in:eff09.in,inMoved:eff09.in_moved,items8:wc09_8?wc09_8.events.map(e=>e.item):[]},
  wc57:{rec:rec57,day:day57,dayWords:ep886Day(day57),from:from57,fromDm:fmtDay(from57).dm,on:inDays('WC57'),moved:r57&&r57.moved_from,in:eff57.in,plan:eff57.in_plan,by:eff57.in_by,where:eff57.in_where},
  wc34:{rec:rec('WC34'),on:inDays('WC34'),moved:r34&&r34.moved_from,by:eff34.in_by,in:eff34.in},
  wc67:{rec:rec67,day:day67,dayWords:ep886Day(day67),on:inDays('WC67'),ev:ev(r67),ins:ins67},
  mv:{d7:mv('2026-10-07').map(x=>x.key),d8:mv('2026-10-08').map(x=>x.key+':'+x.what),d12:mv12.map(x=>x.key+':'+x.what+'>'+x.to),d19:mv('2026-10-19').map(x=>x.key).sort(),d20:mv('2026-10-20').map(x=>x.key).sort(),d22:mv('2026-10-22').map(x=>x.key)},
  mvLine12:mv12.length?movedOffLine(mv12[0]):'',
  drop57:{has:/WC57/.test(drop57),date:drop57.indexOf(fmtDay(day57).dm)>=0},drops12,drops9,
  daily:{d8:!/Date needs confirmation/.test(daily8),d9:!/Date needs confirmation/.test(daily9),d8has09:/WC09/.test(daily8)},
  today:{podIso:pod&&pod.iso,podIn:pod?pod.deliveries.length:null,figDue:f.due,figDm:f.d.dm,podDm:pod?fmtDay(pod.iso).dm:null,msIso:ms&&ms.iso,msIn:msDay?msDay.deliveries.length:null,msOut:msDay?msDay.removals.length:null,whereReady:pw.ready},
  cards:Object.assign({},c(wc09_9,'c9'),c(wc09_8,'c8'),c(r57,'c57'),c(r34,'c34')),
  g57:g57?ldId(d57,g57):null,stable:snap()===snap()};
},DAYS);
const bad=m.refs.filter(x=>!x.ok);
ok('every plan reference is listed on its load day, or on the day recorded on the shared record ('+m.refs.length+' drops)',bad.length===0);
ok('no moved row is left on the day the schedule had written',m.stale.length===0);
ok('WC34 keeps the Fri 9 Oct recorded on the record, moved from Thu 8 Oct in the recorder\'s name, not the plan\'s',m.wc34.rec==='2026-10-09'&&m.wc34.in==='2026-10-09'&&m.wc34.on.join()==='2026-10-09'&&m.wc34.moved==='2026-10-08'&&!!m.wc34.by&&!/Event Portables/.test(m.wc34.by));
const w57=m.wc57,w67=m.wc67;
ok(w57.rec?'WC57 reads '+w57.dayWords+', the day recorded on the shared record (the record wins over the plan, for the whole reference), moved from '+w57.fromDm+'; the plan\'s Fri 9 Oct stays the plan'
 :'WC57 reads Fri 9 Oct from Load 1, moved from Mon 12 Oct, a schedule correction named to the plan',
 w57.rec?(w57.on.join()===w57.day&&w57.in===w57.day&&w57.moved===w57.from&&w57.plan==='2026-10-09'&&w57.where!=='schedule correction'&&!!w57.by&&!/Event Portables/.test(w57.by))
 :(w57.on.join()==='2026-10-09'&&w57.moved==='2026-10-12'&&w57.in==='2026-10-09'&&w57.plan==='2026-10-12'&&/Event Portables plan v10, 3 Oct/.test(w57.by||'')&&w57.where==='schedule correction'),w57);
ok('WC09: FWF and pee panels on Fri 9 Oct (moved from Thu 8); the two 6 m toilet blocks still Thu 8 Oct; the reference\'s first day still Thu 8',m.wc09.ev9.join()==='T0101,T0259'&&m.wc09.ev8.join()==='T0102'&&m.wc09.moved9==='2026-10-08'&&!m.wc09.moved8&&m.wc09.in==='2026-10-08'&&!m.wc09.inMoved&&m.wc09.items8.join()==='Toilet Block 6m');
ok(w67.rec?'WC67: the day recorded on the shared record ('+w67.dayWords+') moves every row of the reference to it, the 2 FWF on site since 1 Oct included, Load 2\'s second 2 with them'
 :'WC67: the 2 FWF on site since 1 Oct stay; the second 2 read Tue 13 Oct with Load 2',
 w67.rec?(w67.on.join()===w67.day&&w67.ev.includes('T0262')&&w67.ev.join()===w67.ins.join()):(w67.on.join()==='2026-10-01,2026-10-13'&&w67.ev.join()==='T0262'),w67);
ok('T0089 is off the plan on the record and not moved: folded under Tue 6 Oct, not on Fri 9 Oct',m.rowOffT0089&&m.off6.includes('T0089')&&!m.counts['2026-10-09'].refs.includes('T0089')&&!m.counts['2026-10-09'].unref.includes('T0089'));
ok('T0176 (Red Bull, no WC number) reads Mon 19 Oct with Load 4, off Thu 22 Oct',m.counts['2026-10-19'].unref.includes('T0176')&&!m.unref22.includes('T0176')&&m.mv.d22.includes('T0176'));
// the four load days' lists: a reference the record has moved is read on the record's day and is off its load day
const andList=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a[a.length-1]:a.join('');
const LABEL={'2026-10-09':'Fri 9 Oct lists WC09, WC34, WC38, WC39, WC40, WC57 and WC61','2026-10-13':'Tue 13 Oct lists WC29, WC67, WC68, WC69, WC70 and WC72','2026-10-15':'Thu 15 Oct lists WC46, WC48, WC49, WC51, WC53, WC54 and WC55','2026-10-19':'Mon 19 Oct lists the Load 4 and Load 5 references, the pit garages among them'};
Object.keys(m.lists).forEach(iso=>{const L=m.lists[iso],moved=L.filter(x=>x.rec&&x.rec!==iso);
 ok(LABEL[iso]+(moved.length?', except '+andList(moved.map(x=>x.k))+', read on the day the record has ('+andList(moved.map(x=>x.rec))+'), not here':'')+' — each on its load day or on the day recorded for it',L.every(x=>x.ok),{iso,off:L.filter(x=>!x.ok)});});
ok('the supplier card and the Load 1 run sheet say T0089 is off the plan on the record and the load is 23 FWF; a record line names each recorded day that differs from its load\'s day, and only those'+(m.disagree.length?' (today '+andList(m.disagree.map(x=>x.ref+' '+x.recorded+' against '+x.plan))+')':' (none today)'),
 m.cardNote&&m.sheetNote&&/23 FWF/.test(m.recLines[0]||'')&&m.cardNoRecordLines===(m.disagree.length===0)&&m.loadLines.every(L=>L.refs.length?(L.named&&/Record (still )?shows/.test(L.line)):!/Record (still )?shows/.test(L.line)),{cardNote:m.cardNote,sheetNote:m.sheetNote,cardNoRecordLines:m.cardNoRecordLines,recLines:m.recLines,disagree:m.disagree,loadLines:m.loadLines});
ok('moved-off folds name the rows and the source (Wed 7: 4; Thu 8: WC09 FWF and pee panels, WC34; Mon 12: WC57 and WC67\'s second drop; Mon 19: 5; Tue 20: 5; Thu 22: T0176)',m.mv.d7.length===4&&m.mv.d8.includes('WC09:4 × FWF, 6 × Pee Panel')&&m.mv.d8.some(x=>/^WC34:/.test(x))&&m.mv.d12.slice().sort().join()==='WC57:2 × FWF>2026-10-09,WC67:2 × FWF>2026-10-13'&&m.mv.d19.join()==='WC29,WC46,WC55,WC68,WC72'&&m.mv.d20.join()==='PG01,PG03,PG05,PG29,WC85'&&/Event Portables plan v10, 3 Oct/.test(m.mvLine12));
ok('the drop sheet for '+w57.dayWords+' carries WC57 on its day; WC57 has no drop sheet on Mon 12 Oct'+(w57.day!=='2026-10-09'?' or on Fri 9 Oct':''),m.drop57.has&&m.drop57.date&&!m.drops12.includes('WC57')&&(w57.day==='2026-10-09'||!m.drops9.includes('WC57')),{drop57:m.drop57,drops12:m.drops12,drops9:m.drops9,g57:m.g57});
ok('installer text: no "date needs confirmation" on Thu 8 or Fri 9 Oct (the toilet blocks are not the supplier\'s)',m.daily.d8&&m.daily.d9&&m.daily.d8has09);
ok('delivery cards: WC09 on Fri 9 reads 9 Oct, 4 / 6, moved from 08 Oct, the plan named; on Thu 8 reads 8 Oct, 2, no plan line',m.cards.c9date==='2026-10-09'&&/4 \/ 6/.test(m.cards.c9qty||'')&&/Event Portables plan v10, 3 Oct/.test(m.cards.c9src||'')&&/Load 1/.test(m.cards.c9src||'')&&/moved from 08 Oct/.test(m.cards.c9chip||'')&&m.cards.c8date==='2026-10-08'&&(m.cards.c8qty||'').trim()==='2'&&!m.cards.c8src&&!m.cards.c8chip);
ok('delivery cards: WC57 reads '+w57.dayWords+', moved from '+w57.fromDm+(w57.rec?' by the record, the plan beside it':' by the plan')+'; WC34 reads 9 Oct, moved from 08 Oct by the record, the plan beside it',
 m.cards.c57date===w57.day&&(m.cards.c57chip||'').indexOf('moved from '+w57.fromDm)>=0&&(w57.rec?!/Event Portables/.test(m.cards.c57title||''):/Event Portables plan v10, 3 Oct/.test(m.cards.c57title||''))&&/Load 1/.test(m.cards.c57src||'')&&m.cards.c34date==='2026-10-09'&&/moved from 08 Oct/.test(m.cards.c34chip||'')&&!/Event Portables/.test(m.cards.c34title||'')&&/Load 1/.test(m.cards.c34src||''),m.cards);
ok('Today\'s pod counts the day list the Timeline shows ('+m.today.podDm+': '+m.today.podIn+' due in)',m.today.figDue===m.today.podIn&&m.today.figDm===m.today.podDm);
ok('Where we are is ready',m.today.whereReady);
ok('the day lists are the same on a second reading',m.stable);
// the Timeline's rendered counts for the four load days against the day list Today reads
const tl={};for(const iso of DAYS){await p.evaluate(iso=>{state.day=iso;state.tlView='day';state.tlLoad=null;render();},iso);await p.waitForTimeout(500);
 tl[iso]=await p.evaluate(()=>{const sub=(document.querySelector('#pane-timeline .dayhead .sub')||{}).textContent||'',mm=sub.replace(/\s+/g,' ').match(/(\d+) due in · (\d+) due out/);const pin=document.querySelector('#pane-timeline .dpanels .dp.in b'),pout=document.querySelector('#pane-timeline .dpanels .dp.out b');return {in:mm?+mm[1]:null,out:mm?+mm[2]:null,pin:pin?+pin.textContent.replace(/\D/g,''):null,pout:pout?+pout.textContent.replace(/\D/g,''):null};});}
const agree=DAYS.every(iso=>tl[iso].in===m.counts[iso].in&&tl[iso].out===m.counts[iso].out&&tl[iso].pin===m.counts[iso].in&&tl[iso].pout===m.counts[iso].out);
ok('the Timeline\'s due in / due out for 9, 13, 15 and 19 Oct equal the day list ('+DAYS.map(iso=>iso.slice(8)+': '+m.counts[iso].in+'/'+m.counts[iso].out).join(', ')+')',agree);
// the WC57 load opened on its day: the card in the page
await p.evaluate(([iso,id])=>{state.day=iso;state.tlView='day';state.tlLoad=id;render();},[w57.day,m.g57]);await p.waitForTimeout(600);
const dom57=await p.evaluate(()=>{const c=document.querySelector('#pane-timeline .dcard[data-dckey="WC57"]');return c?{date:(c.querySelector('.dctime input[type=date]')||{}).value,src:(c.querySelector('.ep886-src')||{}).textContent||'',chip:(c.querySelector('.dctime .chip.act')||{}).textContent||''}:null;});
ok('the WC57 card on the Timeline reads '+w57.dayWords+' with the plan beside it',!!dom57&&dom57.date===w57.day&&/Event Portables plan v10, 3 Oct · Load 1/.test(dom57.src)&&dom57.chip.indexOf('moved from '+w57.fromDm)>=0,dom57);
const before=await p.evaluate(()=>{const keys=[...document.querySelectorAll('#pane-timeline .dcard')].map(c=>c.dataset.dckey);return JSON.stringify([((document.querySelector('#pane-timeline .dayhead .sub')||{}).textContent||'').replace(/\s+/g,' '),keys,document.querySelector('main').scrollTop]);});
await p.evaluate(()=>render());await p.waitForTimeout(500);
const after=await p.evaluate(()=>{const keys=[...document.querySelectorAll('#pane-timeline .dcard')].map(c=>c.dataset.dckey);return JSON.stringify([((document.querySelector('#pane-timeline .dayhead .sub')||{}).textContent||'').replace(/\s+/g,' '),keys,document.querySelector('main').scrollTop]);});
ok('a Timeline redraw keeps the day, its cards and the scroll position',before===after);
if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});await p.evaluate(()=>{const c=document.querySelector('#pane-timeline .dcard[data-dckey="WC57"]');if(c)c.scrollIntoView({block:'start'});});await p.waitForTimeout(400);await p.screenshot({path:process.env.OUT+'/timeline-wc57-'+w57.day+'-'+(mob?'phone':W)+'.png'});}
// the reference drawer on WC09: which rows went with the load and which stayed
await p.evaluate(()=>openAsset('WC09'));await p.waitForTimeout(900);
const hint=await p.evaluate(()=>{const h=document.querySelector('.ep886-hint');return h?h.textContent:'';});
ok('the WC09 drawer says the FWF and pee panels come Fri 9 Oct with Load 1 and the toilet blocks stay Thu 8 Oct',/Load 1/.test(hint)&&/4 × FWF, 6 × Pee Panel come Fri 09 Oct/.test(hint)&&/2 × Toilet Block 6m stays? Thu 08 Oct/.test(hint));
const tile=await p.evaluate(()=>{const t=document.querySelector('.sum816 .ctile.plan');return t?t.textContent.replace(/\s+/g,' '):'';});
ok('the WC09 drawer\'s In tile keeps Thu 8 Oct on the plan and says the FWF and pee panels go Fri 9 Oct with the plan',/Thu 8 Oct/.test(tile)&&/on the plan · 4 × FWF, 6 × Pee Panel Fri 09 Oct, Event Portables plan v10, 3 Oct/.test(tile));
if(process.env.OUT){await p.screenshot({path:process.env.OUT+'/drawer-wc09-'+(mob?'phone':W)+'.png'});}
await p.keyboard.press('Escape');await p.waitForTimeout(300);
// Today: the pod and the programme panel read the same list; a redraw changes no data or money
await p.evaluate(()=>go('today'));await p.waitForTimeout(1200);
const td=await p.evaluate(()=>{const pod=document.querySelector('#hztd .tdf[data-go="timeline"] .tn b'),fig=[...document.querySelectorAll('#pane-today .today-work-programme840 .pnfig span b')].map(b=>+b.textContent.replace(/\D/g,''));
 window.__before886=JSON.stringify([S,moneySummary(),fh866Model()]);return {pod:pod?+pod.textContent.replace(/\D/g,''):null,hidden:!document.getElementById('hztd')||document.getElementById('hztd').hidden,fig};});
ok('Today\'s pod shows the day list\'s due-in count ('+td.pod+')',td.hidden?true:td.pod===m.today.podIn);
ok('the programme panel\'s next-milestone due in / due out read the same day list',m.today.msIn==null?td.fig.length===0:(td.fig[0]===m.today.msIn&&td.fig[1]===m.today.msOut));
await p.evaluate(()=>renderToday());await p.waitForTimeout(400);
ok('a Today redraw changes no data or money',await p.evaluate(()=>window.__before886===JSON.stringify([S,moneySummary(),fh866Model()])));
ok('no runtime errors',s.errors.length===0);ok('no attempted live writes',s.counts.blocked===0);
R.forEach(r=>console.log((r.pass?'PASS ':'FAIL ')+r.name));
if(bad.length)console.log('refs off their day: '+JSON.stringify(bad));if(m.stale.length)console.log('stale rows: '+JSON.stringify(m.stale));
if(R.some(r=>!r.pass))console.log(JSON.stringify({wc09:m.wc09,wc57:m.wc57,wc34:m.wc34,wc67:m.wc67,mv:m.mv,cards:m.cards,today:m.today,tl,dom57,hint:hint.slice(0,200),td,recLines:m.recLines,cardNote:m.cardNote,sheetNote:m.sheetNote,cardNoRecordLines:m.cardNoRecordLines,drop57:m.drop57,drops12:m.drops12,drops9:m.drops9,lists:m.lists,disagree:m.disagree,loadLines:m.loadLines,counts13:m.counts['2026-10-13'].refs,counts9:m.counts['2026-10-09'].refs},(k,v)=>/^(by|.*title)$/.test(k)?undefined:v)); // no recorder names or record words in the log
console.log((mob?'phone':W+' px')+': '+R.filter(r=>r.pass).length+'/'+R.length);if(R.some(r=>!r.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
