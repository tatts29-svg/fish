// Author: Andrew Fisher. Synthetic item receipt/install regressions; optional native readback.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'toilets962.js'),'utf8'),html=fs.readFileSync(process.argv[2],'utf8');
const start=html.indexOf('function split900(a, d, lines){'),end=html.indexOf('\n}\n</script>',start)+2;
assert(start>0&&end>start);
const copy=x=>JSON.parse(JSON.stringify(x));let checks=0;
const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);checks++;};
const S={supplied:{},labour:{},stamps:{}};
const isoIn=t=>{const n=Date.parse(t);return Number.isFinite(n)?new Date(n+10*3600e3).toISOString().slice(0,10):'';};
const box={S,isoIn,todayIso:()=> '2026-10-09',chargeLines:a=>a.lines,qtyOf:l=>l.quantity,
 shortOf:a=>(S.supplied[a.key]?.items||[]).filter(r=>r.qty_supplied!=null&&r.qty_supplied<a.lines.filter(l=>l.item===r.asked).reduce((n,l)=>n+l.quantity,0)).map(r=>({item:r.asked})),
 restArrived:()=>0,split900Day:x=>x,deliveryAsOf:()=>d,invOnSite:()=>true};
vm.createContext(box);vm.runInContext(html.slice(start,end)+'\n'+source,box);
const lines=(...pairs)=>pairs.map(([item,quantity])=>({item,quantity,discipline:'Toilets & amenities'}));
const event=(item,q,date,moved=false)=>({item,quantity_raw:q,date,movement:'deliver',...(moved?{date_correction:{plan886:true}}:{})});
const a={key:'WC09',product:'Toilet',lines:lines(['FWF',4],['Pee Panel',6],['Toilet Block 6m',2]),events:[event('Toilet Block 6m',2,'2026-10-08'),event('FWF',4,'2026-10-09',true),event('Pee Panel',6,'2026-10-09',true)]};
let d={recorded:true,state:'on site',done:true,set_at:'2026-10-08T01:00:00Z',done_at:'2026-10-08T01:00:00Z'};
const get=(item='FWF',day='2026-10-09',nativeOn)=>box.toiletItem962(a,item,d,day,nativeOn);
const receipt=(ref,item,n,t='2026-10-09T01:40:11Z')=>{const row=S.supplied[ref]||(S.supplied[ref]={items:[]});row.items=row.items.filter(r=>r.asked!==item).concat([{asked:item,qty_supplied:n}]);if(t!=null)S.stamps['supplied/'+ref+'/'+item]=t;else delete S.stamps['supplied/'+ref+'/'+item];};
const install=(ref,item,t='2026-10-09T02:15:55Z')=>{const k=ref+'|Toilets & amenities|'+item+'|install';S.labour[k]=true;S.stamps['labour/'+k]=t;};
eq(get().arrived,0,'old reference arrival does not cover future split');eq(get().done,0,'old completion does not cover future split');
d.done=false;eq(get().arrived,0,'split arrival guard works without Complete');d.done=true;
receipt('WC09','Pee Panel',6);eq(get('Pee Panel').arrived,6,'explicit quantity-only receipt');eq(get('Pee Panel').done,0,'receipt is not installed');eq(get('Pee Panel','2026-10-08').arrived,0,'future receipt excluded historically');
receipt('WC09','FWF',2);eq(get().arrived,2,'partial received quantity');eq(get().done,0,'partial receipt not installed');eq(box.toiletSupplierArrived962(a,'FWF','2026-10-09'),false,'partial quantity cannot choose fleet identities');assert.match(box.toiletSupplierStatus962(a,'FWF','2026-10-09','Complete'),/2 of 4 received.*not confirmed/);checks++;
eq(get('Toilet Block 6m').done,2,'later FWF shortage preserves earlier block completion');eq(get('Toilet Block 6m').conflict,false,'block completion is not in shortage review');eq(get('Pee Panel').done,0,'FWF receipt does not install pee panels');eq(get('Pee Panel').conflict,false,'later pee panel is not a claimed completion');eq(get().conflict,false,'old split tick never claimed the later FWF complete');
const partialSnapshot=copy({S,d}),partialTotal=box.toiletRows962(a,d,a.lines,'2026-10-09');eq([partialTotal.done,partialTotal.arrived,partialTotal.reviewQuantity],[2,10,0],'mixed split receipt update preserves work and review boundaries');
S.supplied.WC09.items=S.supplied.WC09.items.filter(r=>r.asked!=='FWF');delete S.stamps['supplied/WC09/FWF'];eq([box.toiletRows962(a,d,a.lines,'2026-10-09').done,box.toiletRows962(a,d,a.lines,'2026-10-09').arrived],[2,8],'removing local receipt restores baseline');
Object.assign(S,copy(partialSnapshot.S));
install('WC09','FWF');eq(get().done,2,'dated item install supports only received quantity');eq(get().reviewQuantity,2,'short remainder stays under review');
receipt('WC09','FWF',4,'2026-10-09T03:00:00Z');eq(get().done,0,'new larger quantity cannot borrow stale install');install('WC09','FWF','2026-10-09T03:10:00Z');eq(get().done,4,'later install covers current received quantity');
receipt('WC09','FWF',0);eq(get().arrived,0,'explicit zero receipt');eq(get().done,0,'zero cannot be installed');
receipt('WC09','FWF',4,'2026-10-10T01:00:00Z');eq(get().arrived,0,'future receipt excluded');eq(get().done,0,'future receipt not completion');
receipt('WC09','FWF',4,'not-a-date');eq(get().arrived,0,'invalid receipt stamp does not override split');
receipt('WC09','FWF',4,null);eq(get('FWF','2026-10-08').arrived,0,'undated current receipt is not historical');eq(get().arrived,4,'undated explicit receipt remains current only');eq(get().done,0,'undated receipt cannot support dated install override');
receipt('WC09','FWF',4,'2026-10-09T01:00:00Z');install('WC09','FWF','2026-10-09T10:00:00+10:00');eq(get().explicitInstall,false,'offset timestamp compared by instant');
S.supplied.WC09.items.push({asked:'FWF',qty_supplied:4});eq(get().arrived,0,'duplicate receipt rows fail closed');
const b={key:'WC31',product:'Toilet',lines:lines(['Accessible Toilet',1],['16Pan Block',2]),events:[]};
d={recorded:true,state:'on site',done:true,set_at:'2026-09-25T06:00:00Z',done_at:'2026-09-25T06:00:00Z'};
receipt('WC31','Accessible Toilet',0,'2026-09-28T23:19:43Z');receipt('WC31','16Pan Block',2,'2026-10-09T01:05:32Z');install('WC31','16Pan Block');
let x=box.toiletRows962(b,d,b.lines,'2026-10-09');eq([x.done,x.arrived,x.reviewQuantity],[2,2,1],'WC31 item install survives unrelated shortage');
eq(box.toiletItem962(b,'16Pan Block',d,'2026-10-08').done,0,'future installation does not alter historical completion');eq(box.toiletItem962(b,'16Pan Block',d,'2026-10-08').arrived,0,'future item quantity not borrowed from old shared receipt');
receipt('WC31','Accessible Toilet',1,'2026-10-09T03:00:00Z');x=box.toiletRows962(b,d,b.lines,'2026-10-09');eq([x.done,x.arrived],[2,3],'cleared shortage receipt not old shared completion');install('WC31','Accessible Toilet','2026-10-09T03:10:00Z');eq(box.toiletRows962(b,d,b.lines,'2026-10-09').done,3,'explicit accessible install completes quantity');
const c={key:'WC44',product:'Toilet',lines:lines(['FWF',10]),events:[event('FWF',6,'2026-10-08'),event('FWF',4,'2026-10-13',true)]};
d={recorded:true,state:'on site',done:true,set_at:'2026-10-08T01:00:00Z',done_at:'2026-10-08T01:00:00Z'};
const first=box.toiletItem962(c,'FWF',d,'2026-10-09',10),second=box.toiletItem962(c,'FWF',d,'2026-10-09',first.arrived);eq([first.arrived,second.arrived],[6,6],'shared receipt reader idempotent');eq(box.toiletDeliveryEntry962({a:c,events:[c.events[0]]},'2026-10-09'),true,'first split entry all six received');eq(box.toiletDeliveryEntry962({a:c,events:[c.events[1]]},'2026-10-09'),false,'later split still pending');
receipt('WC44','FWF',6,'2026-10-08T00:30:00Z');eq([box.toiletItem962(c,'FWF',d,'2026-10-09').done,box.toiletItem962(c,'FWF',d,'2026-10-09').conflict],[6,false],'same-item later shortfall does not erase or challenge completed earlier delivery scope');receipt('WC44','FWF',2,'2026-10-08T00:30:00Z');const scopedShort=box.toiletItem962(c,'FWF',d,'2026-10-09');eq([scopedShort.done,scopedShort.reviewQuantity],[2,4],'same-item review excludes four later units never claimed complete');delete S.supplied.WC44;delete S.stamps['supplied/WC44/FWF'];
receipt('WC09','FWF',2);const cleanA=copy(a),oldEvents=copy(a.events);a.events.push(copy(a.events.find(e=>e.item==='Toilet Block 6m')));eq(get('Toilet Block 6m').done,0,'duplicate early schedule rows cannot support scope completion');a.events=oldEvents;a.events.find(e=>e.item==='Toilet Block 6m').quantity_raw=1;eq(get('Toilet Block 6m').done,0,'unreconciled early scope cannot support completion');a.events=copy(cleanA.events);a.events.find(e=>e.item==='Toilet Block 6m').date='malformed';eq(get('Toilet Block 6m').done,0,'undated schedule scope cannot support completion');a.events=copy(cleanA.events);
eq(box.toiletSupplierStatus962({...c,_cancelled:true},'FWF','2026-10-09','Cancelled'),'Cancelled','cancelled supplier labels retained');
const view=box.toiletProgressView962(c,d,{stage:5,arrived:true,label:'Finished',tone:'green',blocked:false});eq([view.stage,view.arrived,view.partial962],[2,false,true],'whole reference cannot say Finished while four future units remain');assert.doesNotMatch(view.label,/Finished/);checks++;
const cancelled=box.toiletProgressView962({...c,_cancelled:true},d,{stage:0,arrived:false,label:'Cancelled',blocked:true});eq(cancelled.label,'Cancelled','blocked Timeline state preserved');
Object.assign(box,{needsLevel:()=>false,deliveryOf:()=>d,assetOf:()=>c,fmtStamp:x=>x,esc:String,shortChip:()=>'',state:{light:'done'}});
const tallyStart=html.indexOf('function lightTally(list, asOf){'),tallyEnd=html.indexOf('/* Superior Audit, 15 Sep 2026, F10:',tallyStart);vm.runInContext(html.slice(tallyStart,tallyEnd),box);
const tickStart=html.indexOf('function doneChip(a){'),tickEnd=html.indexOf('/* THE CANCEL BUTTON',tickStart);vm.runInContext(html.slice(tickStart,tickEnd),box);
const nativeBefore=JSON.stringify({S,d});const tally=box.lightTally([c]);eq([tally.green,tally.amber,tally.done],[0,1,0],'partial reference is amber and excluded from complete count');eq(box.lightMatches(c),false,'Complete filter excludes partial reference');box.state.light='amber';eq(box.lightMatches(c),true,'amber filter matches partial count');assert.doesNotMatch(box.doneChip(c),/✓ Complete/);checks++;assert.match(box.doneChip(c),/6\/10 installed/);checks++;eq(JSON.stringify({S,d}),nativeBefore,'presentation retains native ticks and evidence');
if(process.argv[3]){const r=JSON.parse(fs.readFileSync(process.argv[3]));eq([r.summary.total,r.summary.done,r.summary.left,r.summary.pct,r.summary.reviewQuantity,r.summary.arrived962],[254,131,123,51.57,1,137],'native totals');eq(r.coverage.issues.length,0,'all item breakdowns reconcile');eq([r.supplier.summary.units,r.supplier.summary.onSite,r.supplier.summary.fwfSupply.on,r.supplier.summary.fwfSupply.left],[91,73,71,123],'native supplier receipts');eq(r.recordUnchanged,true,'read only');const list=r.types.filter(t=>!/tank/i.test(t.name));eq(list.reduce((n,t)=>n+t.total,0),254,'toilet item denominator reconciles');eq(list.reduce((n,t)=>n+t.done,0),131,'toilet installed types reconcile');}
if(process.argv[4]){
 const snapshot=JSON.parse(fs.readFileSync(process.argv[4])),state=copy(snapshot.record),refs=new Map(snapshot.refs.map(r=>[r.key,r])),assets=new Map(snapshot.assets.map(a=>[a.key,a]));
 const env={S:state,isoIn,todayIso:()=> '2026-10-09',qtyOf:l=>l.quantity,chargeLines:a=>refs.get(a.key).chargeLines,restArrived:()=>0,split900Day:x=>x,
  shortOf:a=>(state.supplied[a.key]?.items||[]).filter(r=>r.qty_supplied!=null&&r.qty_supplied<refs.get(a.key).chargeLines.filter(l=>l.item===r.asked).reduce((n,l)=>n+l.quantity,0)).map(r=>({item:r.asked}))};
 vm.createContext(env);vm.runInContext(html.slice(start,end)+'\n'+source,env);
 const keys=snapshot.models.areas.find(a=>a.id==='toilets').rows.map(r=>r.key),read=key=>env.toiletRows962(assets.get(key),refs.get(key).delivery,refs.get(key).chargeLines.filter(l=>/toilet|\bfwf\b|pan\s*block|pee\s*panel/i.test(l.item)&&!/tank/i.test(l.item)),'2026-10-09');
 const totals=()=>keys.map(read).reduce((n,r)=>[n[0]+r.quantity,n[1]+r.done,n[2]+r.arrived,n[3]+r.reviewQuantity],[0,0,0,0]);
 const before=JSON.stringify(state),original=copy(state.supplied.WC09),oldStamp=state.stamps['supplied/WC09/FWF'];
 eq(totals(),[254,131,137,1],'native5155 baseline all toilet item readings');
 state.supplied.WC09.items.push({asked:'FWF',qty_supplied:2});state.stamps['supplied/WC09/FWF']='2026-10-09T03:00:00Z';
 eq(totals(),[254,131,139,1],'native5155 partial FWF receipt retains all unrelated installation and review');
 eq(copy(read('WC09').rows.map(r=>[r.item,r.arrived,r.done,r.conflict])),[['FWF',2,0,false],['Pee Panel',6,0,false],['Toilet Block 6m',2,2,false]],'nativeWC09 exact mixed-item outcome');
 state.supplied.WC09=original;if(oldStamp==null)delete state.stamps['supplied/WC09/FWF'];else state.stamps['supplied/WC09/FWF']=oldStamp;
 eq(totals(),[254,131,137,1],'native receipt restoration restores every count');eq(JSON.stringify(state),before,'native fixture restoration exact');
}
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:true}));
